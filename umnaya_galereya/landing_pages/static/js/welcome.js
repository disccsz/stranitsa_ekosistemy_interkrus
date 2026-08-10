(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ------------------------------ custom cursor ------------------------------ */

	if (window.matchMedia('(pointer: fine)').matches) {
		(function () {
			var doc = document.documentElement;
			var dot = document.createElement('div');
			var ring = document.createElement('div');
			dot.className = 'cursor-dot';
			ring.className = 'cursor-ring';
			doc.classList.add('has-custom-cursor');
			document.body.appendChild(dot);
			document.body.appendChild(ring);

			var mx = -100, my = -100, rx = -100, ry = -100;
			var visible = false;
			var running = false;
			var idleTimer = null;

			function startLoop() {
				if (running) return;
				running = true;
				frame();
			}

			function stopLoop() {
				running = false;
				visible = false;
				dot.style.opacity = '0';
				ring.style.opacity = '0';
			}

			document.addEventListener('mousemove', function (e) {
				mx = e.clientX;
				my = e.clientY;
				if (!visible) {
					visible = true;
					dot.style.opacity = '1';
					ring.style.opacity = '1';
				}
				clearTimeout(idleTimer);
				idleTimer = setTimeout(stopLoop, 1500);
				startLoop();
			});

			function frame() {
				if (!running) return;
				if (visible) {
					if (reduceMotion) {
						rx = mx;
						ry = my;
					} else {
						rx += (mx - rx) * 0.18;
						ry += (my - ry) * 0.18;
					}
					dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
					ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
				}
				requestAnimationFrame(frame);
			}

			document.addEventListener('visibilitychange', function () {
				if (document.hidden) {
					stopLoop();
				} else if (visible) {
					startLoop();
				}
			});

			document.addEventListener('mouseleave', function () {
				visible = false;
				dot.style.opacity = '0';
				ring.style.opacity = '0';
			});

			document.addEventListener('mouseover', function (e) {
				if (e.target && e.target.closest && e.target.closest('a, button, .btn, [role="button"]')) {
					ring.classList.add('cursor-ring_hover');
				} else {
					ring.classList.remove('cursor-ring_hover');
				}
			});

			document.addEventListener('mousedown', function () {
				dot.classList.add('cursor-dot_active');
			});
			document.addEventListener('mouseup', function () {
				dot.classList.remove('cursor-dot_active');
			});
		})();
	}

	/* ------------------------------ sounds ------------------------------ */

	var audioCtx = null;

	function ensureAudio() {
		if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return null;
		if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		if (audioCtx.state === 'suspended') audioCtx.resume();
		return audioCtx;
	}

	function blip(freq, dur, gain) {
		var ctx = ensureAudio();
		if (!ctx) return;
		var t = ctx.currentTime;
		var f = freq * (1 + (Math.random() - 0.5) * 0.05);
		var osc = ctx.createOscillator();
		var g = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(f, t);
		osc.frequency.exponentialRampToValueAtTime(f * 1.06, t + 0.025);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		osc.connect(g);
		g.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + dur + 0.05);
	}

	document.addEventListener('click', function (e) {
		var target = e.target && e.target.closest ? e.target.closest('a, button, .btn, [role="button"]') : null;
		if (!target) return;
		if (target.closest('button, .btn, [role="button"]')) {
			blip(330, 0.14, 0.05);
		} else {
			blip(540, 0.1, 0.045);
		}
	}, true);
})();
