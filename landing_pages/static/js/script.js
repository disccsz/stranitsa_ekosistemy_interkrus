document.addEventListener('DOMContentLoaded', function () {
	// scroll to preview
	document.querySelector('#scroll-to-preview')?.addEventListener('click', (e) => {
		e.preventDefault();
		const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
		document.querySelector('#about')?.scrollIntoView({ behavior, block: 'start' });
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

	// sections anim
	let sectionsArr = document.querySelectorAll('.section-anim')
	sectionsArr.forEach((section, index) => {
		if (index + 1 >= sectionsArr.length) return;

		let blockHeight = sectionsArr[index + 1].offsetHeight
		let windowHeight = window.innerHeight
		let resultHeight = blockHeight < windowHeight ? blockHeight : windowHeight
		let overlap = Math.min(resultHeight / 4, 120)

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: section,
				start: "bottom 100%",
				end: "+=" + resultHeight,
				scrub: true,
				markers: false,
				pin: false,
			}
		});

		tl.to(sectionsArr[index + 1], {
			marginTop: -overlap,
		});
	})

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


/* all links open in a new tab */
document.addEventListener('click', function (e) {
	var link = e.target && e.target.closest ? e.target.closest('a') : null;
	if (link && link.href && !link.target) {
		link.target = '_blank';
		link.rel = 'noopener';
	}
});