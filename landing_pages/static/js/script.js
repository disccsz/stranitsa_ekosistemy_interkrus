document.addEventListener('DOMContentLoaded', function () {
	// scroll to preview
	document.querySelector('#scroll-to-preview')?.addEventListener('click', (e) => {
		e.preventDefault();
		document.querySelector('#app-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	// menu
	document.querySelectorAll('.header__menu-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			document.querySelector('body').classList.toggle('header-open')
		})
	})
	document.querySelectorAll('.nav__link').forEach(link => {
		link.addEventListener('click', (e) => {
			document.querySelector('body').classList.remove('header-open')
		})
	})

	// sections anim
	let sectionsArr = document.querySelectorAll('.section-anim')
	sectionsArr.forEach((section, index) => {
		if (index + 1 < sectionsArr.length) {
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
					onLeave: (event) => {
						ScrollTrigger.refresh()
					}
				}
			});

			tl.to(sectionsArr[index + 1], {
				marginTop: -overlap,
			});

			sectionsArr[index + 1].setAttribute('data-total-margin', overlap)
		}
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
