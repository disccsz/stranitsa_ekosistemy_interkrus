(function () {
	'use strict';

	var PAGE_SIZE = 15;
	var MAX_CHIPS = 100;

	function getPostsData() {
		return window.BLOG_POSTS_DATA && window.BLOG_POSTS_DATA.posts ? window.BLOG_POSTS_DATA.posts : null;
	}

	function getCollectionsData() {
		return window.BLOG_COLLECTIONS || null;
	}

	function esc(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function parseDate(str) {
		var parts = String(str).split('-').map(Number);
		return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
	}

	function formatDate(date) {
		return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function coverHtml(p) {
		if (p.cover) {
			return '<img class="tile__img" src="' + esc(p.cover) + '" alt="" loading="lazy">';
		}
		var letter = esc((p.title || '?').trim().charAt(0).toUpperCase());
		return '<div class="tile__placeholder" aria-hidden="true"><span>' + letter + '</span></div>';
	}

	function tagChips(tags) {
		return (tags || []).map(function (t) {
			return '<span class="tile__tag">' + esc(t) + '</span>';
		}).join('');
	}

	function tileHtml(p) {
		return '<a class="tile" href="' + esc(p.url || p.slug + '/index.html') + '">' +
			'<div class="tile__cover">' + coverHtml(p) + '</div>' +
			'<div class="tile__body">' +
			'<div class="tile__meta text-12 gray-text">' +
			(p.date ? '<span>' + formatDate(parseDate(p.date)) + '</span>' : '') +
			'</div>' +
			'<div class="tile__title text-20 fw-500">' + esc(p.title) + '</div>' +
			'<div class="tile__thesis text-14">' + esc(p.thesis || '') + '</div>' +
			'<div class="tile__tags">' + tagChips(p.tags) + '</div>' +
			'</div>' +
			'</a>';
	}

	function plural(n) {
		var mod10 = n % 10;
		var mod100 = n % 100;
		if (mod10 === 1 && mod100 !== 11) return 'статья';
		if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'статьи';
		return 'статей';
	}

	function initArticlesSection() {
		var grid = document.getElementById('posts-grid');
		if (!grid) return;

		var allPosts = getPostsData();
		if (!allPosts) {
			grid.innerHTML = '<div class="text-18 gray-text" style="text-align:center;padding:24px 0;">Не удалось загрузить список статей.</div>';
			return;
		}

		var state = {
			posts: allPosts,
			filter: null,
			sort: 'desc',
			shown: PAGE_SIZE
		};

		var tagsWrap = document.getElementById('tiles-tags');
		var sortBtns = Array.prototype.slice.call(document.querySelectorAll('[data-sort]'));
		var moreBtn = document.getElementById('tiles-more-btn');
		var counter = document.getElementById('tiles-counter');

		var filtered = function () {
			var list = state.posts;
			if (state.filter) list = list.filter(function (p) { return (p.tags || []).indexOf(state.filter) !== -1; });
			return list.slice().sort(function (a, b) {
				return state.sort === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
			});
		};

		function renderGrid() {
			var list = filtered();
			var shown = list.slice(0, state.shown);
			grid.innerHTML = shown.map(tileHtml).join('');
			if (moreBtn) moreBtn.hidden = state.shown >= list.length;
			if (counter) {
				counter.textContent = shown.length + ' из ' + list.length + ' статей';
			}
		}

		function renderTags() {
			if (!tagsWrap) return;
			var counts = {};
			state.posts.forEach(function (p) {
				(p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
			});
			var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, MAX_CHIPS);

			var chips = '<button type="button" class="chip' + (state.filter === null ? ' chip_active' : '') + '" data-tag="">Все</button>';
			chips += tags.map(function (t) {
				return '<button type="button" class="chip' + (state.filter === t ? ' chip_active' : '') + '" data-tag="' + esc(t) + '">' +
					esc(t) + '</button>';
			}).join('');
			tagsWrap.innerHTML = chips;

			tagsWrap.querySelectorAll('.chip').forEach(function (chip) {
				chip.addEventListener('click', function () {
					state.filter = chip.getAttribute('data-tag') || null;
					state.shown = PAGE_SIZE;
					renderTags();
					renderGrid();
				});
			});
		}

		function renderSort() {
			sortBtns.forEach(function (btn) {
				btn.classList.toggle('sort-btn_active', btn.getAttribute('data-sort') === state.sort);
			});
		}

		sortBtns.forEach(function (btn) {
			btn.addEventListener('click', function () {
				state.sort = btn.getAttribute('data-sort') === 'asc' ? 'asc' : 'desc';
				state.shown = PAGE_SIZE;
				renderSort();
				renderGrid();
			});
		});

		if (moreBtn) {
			moreBtn.addEventListener('click', function () {
				state.shown += PAGE_SIZE;
				renderGrid();
			});
		}

		renderTags();
		renderSort();
		renderGrid();
	}

	function initCollections() {
		var wrap = document.getElementById('collections-list');
		if (!wrap) return;
		var collections = getCollectionsData();
		var bySlug = {};
		var posts = getPostsData();
		if (!collections || !posts) return;
		posts.forEach(function (p) { bySlug[p.slug] = p; });

		wrap.innerHTML = collections.map(function (col) {
			var items = (col.posts || []).map(function (slug) { return bySlug[slug]; }).filter(Boolean);
			var cards = items.slice(0, 6).map(function (p) {
				var cover = p.cover
					? '<img class="collection-card__img" src="' + esc(p.cover) + '" alt="" loading="lazy">'
					: '<div class="collection-card__placeholder" aria-hidden="true"><span>' + esc((p.title || '?').trim().charAt(0).toUpperCase()) + '</span></div>';
				return '<a class="collection-card" href="' + esc(p.url || p.slug + '/index.html') + '">' +
					'<div class="collection-card__cover">' + cover + '</div>' +
					'<div class="collection-card__name text-16 fw-500">' + esc(p.title) + '</div>' +
					(p.date ? '<div class="collection-card__date text-12 gray-text">' + formatDate(parseDate(p.date)) + '</div>' : '') +
					'</a>';
			}).join('');

			return '<div class="collection">' +
				'<div class="collection__head">' +
				'<h3 class="collection__title text-28 fw-500">' + esc(col.title) + '</h3>' +
				'<div class="collection__desc text-16 gray-text">' + esc(col.desc || '') + '</div>' +
				'<div class="collection__count text-12 gray-text">' + items.length + ' ' + plural(items.length) + '</div>' +
				'</div>' +
				'<div class="collection__row">' + cards + '</div>' +
				'</div>';
		}).join('');
	}

	document.addEventListener('DOMContentLoaded', function () {
		initArticlesSection();
		initCollections();
	});
})();
