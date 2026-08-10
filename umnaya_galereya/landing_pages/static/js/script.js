document.addEventListener('DOMContentLoaded', function () {
	// scroll to preview
	document.querySelector('#scroll-to-preview')?.addEventListener('click', (e) => {
		e.preventDefault();
		const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
		document.querySelector('#app-preview')?.scrollIntoView({ behavior, block: 'start' });
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

});
