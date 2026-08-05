(function () {
	'use strict';

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function formatDate(value) {
		if (!value) {
			return '';
		}
		var d = new Date(value);
		if (isNaN(d.getTime())) {
			return String(value);
		}
		return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function plural(n) {
		var d10 = n % 10;
		var d100 = n % 100;
		if (d10 === 1 && d100 !== 11) {
			return 'статья';
		}
		if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) {
			return 'статьи';
		}
		return 'статей';
	}

	function cardHtml(post, dx, rot) {
		var cover = post.cover
			? '<img class="blog-fan__img" src="' + escapeHtml('blog/' + post.cover) + '" alt="" loading="lazy" decoding="async">'
			: '<div class="blog-fan__placeholder"><span>' + escapeHtml((post.title || '?').charAt(0).toUpperCase()) + '</span></div>';
		var url = 'blog/' + (post.url || post.slug + '/index.html');
		return '<a class="blog-fan__card" href="' + escapeHtml(url) + '" style="--dx:' + dx + 'px;--rot:' + rot + 'deg;">' +
			'<div class="blog-fan__cover">' + cover + '</div>' +
			'<div class="blog-fan__info">' +
			'<div class="blog-fan__title text-16 fw-500">' + escapeHtml(post.title) + '</div>' +
			'<div class="blog-fan__date text-12">' + escapeHtml(formatDate(post.date)) + '</div>' +
			'</div></a>';
	}

	function renderFan() {
		var wrap = document.getElementById('blog-fan');
		if (!wrap) {
			return;
		}
		var posts = window.BLOG_POSTS_DATA && Array.isArray(window.BLOG_POSTS_DATA.posts) ? window.BLOG_POSTS_DATA.posts : null;
		if (!posts || !posts.length) {
			return;
		}
		var latest = posts.slice().sort(function (a, b) {
			return String(b.date).localeCompare(String(a.date));
		}).slice(0, 6);
		var n = latest.length;
		var center = (n - 1) / 2;
		var step = window.innerWidth < 1000 ? 70 : 105;
		wrap.innerHTML = latest.map(function (p, i) {
			return cardHtml(p, Math.round((i - center) * step), Math.round((i - center) * 11));
		}).join('');
		var note = document.getElementById('blog-fan-note');
		if (note) {
			note.textContent = 'В журнале уже ' + posts.length + ' ' + plural(posts.length) + ' — и новые появляются регулярно!';
		}
	}

	var resizeTimer;
	window.addEventListener('resize', function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(renderFan, 200);
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', renderFan);
	} else {
		renderFan();
	}
})();
