(function () {
	'use strict';

	var overlay = null;
	var imgEl = null;
	var captionEl = null;
	var counterEl = null;
	var items = [];
	var index = 0;

	function build() {
		if (overlay) return;
		overlay = document.createElement('div');
		overlay.className = 'lightbox';
		overlay.hidden = true;
		overlay.innerHTML =
			'<div class="lightbox__counter"></div>' +
			'<button type="button" class="lightbox__btn lightbox__close" aria-label="Закрыть">✕</button>' +
			'<figure class="lightbox__figure">' +
			'<img class="lightbox__img" alt="">' +
			'<figcaption class="lightbox__caption"></figcaption>' +
			'</figure>' +
			'<button type="button" class="lightbox__btn lightbox__prev" aria-label="Предыдущее фото">←</button>' +
			'<button type="button" class="lightbox__btn lightbox__next" aria-label="Следующее фото">→</button>';
		document.body.appendChild(overlay);
		imgEl = overlay.querySelector('.lightbox__img');
		captionEl = overlay.querySelector('.lightbox__caption');
		counterEl = overlay.querySelector('.lightbox__counter');

		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) close();
		});
		overlay.querySelector('.lightbox__close').addEventListener('click', close);
		overlay.querySelector('.lightbox__prev').addEventListener('click', function () { show(index - 1); });
		overlay.querySelector('.lightbox__next').addEventListener('click', function () { show(index + 1); });

		document.addEventListener('keydown', function (e) {
			if (!overlay || overlay.hidden) return;
			if (e.key === 'Escape') close();
			else if (e.key === 'ArrowLeft') show(index - 1);
			else if (e.key === 'ArrowRight') show(index + 1);
		});
	}

	function show(i) {
		index = (i + items.length) % items.length;
		var item = items[index];
		imgEl.src = item.src;
		imgEl.alt = item.alt || '';
		captionEl.textContent = item.alt || '';
		captionEl.hidden = !item.alt;
		counterEl.textContent = items.length > 1 ? (index + 1) + ' / ' + items.length : '';
	}

	function open(list, startHref) {
		items = list;
		build();
		var i = items.findIndex(function (it) { return it.src === startHref; });
		index = i >= 0 ? i : 0;
		overlay.hidden = false;
		document.body.style.overflow = 'hidden';
		show(index);
	}

	function close() {
		if (!overlay) return;
		overlay.hidden = true;
		document.body.style.overflow = '';
	}

	document.addEventListener('click', function (e) {
		var link = e.target && e.target.closest ? e.target.closest('a.gallery__item') : null;
		if (!link) return;
		var gallery = link.closest('.gallery');
		if (!gallery) return;
		e.preventDefault();
		var list = Array.prototype.map.call(gallery.querySelectorAll('a.gallery__item'), function (a) {
			var img = a.querySelector('img');
			return {
				src: a.getAttribute('href'),
				alt: img ? img.getAttribute('alt') || '' : ''
			};
		});
		if (!list.length) return;
		open(list, link.getAttribute('href'));
	});
})();
