(function () {
	'use strict';

	function getPostsData() {
		return window.BLOG_POSTS_DATA && window.BLOG_POSTS_DATA.posts ? window.BLOG_POSTS_DATA.posts : null;
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

	function currentSlug() {
		var m = location.pathname.match(/\/([^/]+)\/index\.html$/);
		return m ? m[1] : null;
	}

	function blogBase() {
		var s = document.currentScript;
		if (s && s.src) {
			return s.src.replace(/landing_pages\/static\/js\/related\.js.*$/, '');
		}
		return '../../';
	}

	document.addEventListener('DOMContentLoaded', function () {
		var listEl = document.getElementById('related-list');
		if (!listEl) return;
		var posts = getPostsData();
		if (!posts) return;

		var slug = currentSlug();
		var current = null;
		for (var i = 0; i < posts.length; i++) {
			if (posts[i].slug === slug) { current = posts[i]; break; }
		}
		if (!current || !current.links || !current.links.length) return;

		var base = blogBase();
		var bySlug = {};
		posts.forEach(function (p) { bySlug[p.slug] = p; });

		listEl.innerHTML = current.links.map(function (s) {
			var p = bySlug[s];
			if (!p) return '';
			var cover = p.cover
				? '<img class="related-card__img" src="' + esc(base + p.cover) + '" alt="" loading="lazy">'
				: '<div class="related-card__placeholder" aria-hidden="true"><span>' + esc((p.title || '?').trim().charAt(0).toUpperCase()) + '</span></div>';
			return '<a class="related-card" href="' + esc(base + (p.url || p.slug + '/index.html')) + '">' +
				'<div class="related-card__cover">' + cover + '</div>' +
				'<div class="related-card__body">' +
				'<div class="related-card__title">' + esc(p.title) + '</div>' +
				(p.date ? '<div class="related-card__date">' + formatDate(parseDate(p.date)) + '</div>' : '') +
				(p.thesis ? '<div class="related-card__thesis">' + esc(p.thesis) + '</div>' : '') +
				'</div>' +
				'</a>';
		}).join('');
	});
})();
