document.addEventListener('DOMContentLoaded', function () {
	// scroll to articles
	document.querySelector('#scroll-to-preview')?.addEventListener('click', (e) => {
		e.preventDefault();
		const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
		document.querySelector('#articles')?.scrollIntoView({ behavior, block: 'start' });
	});

	// menu
	function toggleMenu(open) {
		document.body.classList.toggle('header-open', open);
		document.querySelectorAll('.header__menu-btn').forEach(btn => {
			btn.setAttribute('aria-expanded', String(open));
		});
	}

	document.querySelectorAll('.header__menu-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			toggleMenu(!document.body.classList.contains('header-open'));
		});
	});
	document.querySelectorAll('.nav__link').forEach(link => {
		link.addEventListener('click', () => toggleMenu(false));
	});

	// если GSAP/ScrollTrigger не загрузились — контент остаётся видимым, анимаций нет
	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

	// если пользователь предпочитает минимум анимаций — скролл-анимации не запускаем
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	// sections anim — лёгкий фон-параллакс, блоки не перекрываются
	ScrollTrigger.config({ ignoreMobileResize: true });
	let sectionsArr = document.querySelectorAll('.section-anim')
	sectionsArr.forEach((section) => {
		let bg = section.querySelector('.completed__bg img, .vacancy__bg img');
		if (!bg) return;

		gsap.set(bg, { scale: 1.15, transformOrigin: 'center center' });

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: section,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 0.6,
				markers: false,
				pin: false,
			}
		});

		tl.fromTo(bg, {
			yPercent: -7,
		}, {
			yPercent: 7,
			ease: 'none',
		});
	})

	// пересчёт триггеров после загрузки шрифтов/картинок (они меняют высоты секций)
	window.addEventListener('load', function () {
		ScrollTrigger.refresh();
	});

	// completed list items anim
	document.querySelectorAll('.completed').forEach(wrapper => {
		let itemsArr = wrapper.querySelectorAll('.completed__item')

		itemsArr.forEach((item, index) => {
			let tl = gsap.timeline({
				scrollTrigger: {
					trigger: wrapper,
					start: "top 60%",
					end: "top 20%",
					scrub: false,
					markers: false,
					pin: false,
				}
			});

			tl.fromTo(item, {
				yPercent: 100 * index,
				duration: 1,
			}, {
				yPercent: 0,
				duration: 1,
			});
		})
	})

	// vacancy entrance anim
	document.querySelectorAll('.vacancy-entrance').forEach(wrapper => {
		let elemsArr = wrapper.querySelectorAll('.vacancy-entrance__anim')

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrapper,
				start: "top bottom",
				end: "top bottom",
				scrub: false,
				markers: false,
				pin: false,
			}
		});

		elemsArr.forEach((elem, index) => {
			tl.fromTo(elem, {
				y: '20px',
				opacity: 0,
				ease: "back.out(1.7)",
				duration: 0.8,
				delay: index * 0.2,
			}, {
				y: 0,
				opacity: 1,
				ease: "back.out(1.7)",
				duration: 0.8,
				delay: index * 0.2,
			}, 0);
		})
	})

	// contacts cards anim
	document.querySelectorAll('#contacts').forEach(wrapper => {
		let elemsArr = wrapper.querySelectorAll('.contacts__anim')

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrapper,
				start: "top 80%",
				end: "top 60%",
				scrub: false,
				markers: false,
				pin: false,
			}
		});

		elemsArr.forEach((elem, index) => {
			tl.fromTo(elem, {
				y: '24px',
				opacity: 0,
				ease: "back.out(1.7)",
				duration: 0.7,
				delay: index * 0.12,
			}, {
				y: 0,
				opacity: 1,
				ease: "back.out(1.7)",
				duration: 0.7,
				delay: index * 0.12,
			}, 0);
		})
	})

});


/* links to other pages open in a new tab */
function isSamePageLink(link) {
	var href = link.getAttribute('href') || '';
	if (/^(#|mailto:|tel:|javascript:)/.test(href)) return true;
	try {
		var cur = new URL(window.location.href);
		var dest = new URL(link.href);
		cur.hash = '';
		dest.hash = '';
		cur.search = '';
		dest.search = '';
		return cur.href === dest.href;
	} catch (e) {
		return false;
	}
}

document.addEventListener('click', function (e) {
	var link = e.target && e.target.closest ? e.target.closest('a') : null;
	if (!link || !link.href) return;
	if (isSamePageLink(link)) return;
	link.target = '_blank';
	link.rel = 'noopener';
});

/* contact card tilt */
(function () {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	document.querySelectorAll('.contacts__qr').forEach(function (card) {
		card.addEventListener('mousemove', function (e) {
			var r = card.getBoundingClientRect();
			var px = (e.clientX - r.left) / r.width - 0.5;
			var py = (e.clientY - r.top) / r.height - 0.5;
			card.style.transform = 'perspective(700px) rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg) translateY(-4px)';
		});
		card.addEventListener('mouseleave', function () {
			card.style.transform = '';
		});
	});
})();