(function () {
	'use strict';

	var PALETTE = ['#ff7b6b', '#f6b73c', '#6b9dff', '#7ee787', '#c792ea', '#ff9e64', '#56d4dd', '#ff9ecb'];

	function hashTag(tag) {
		var h = 0;
		for (var i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0;
		return Math.abs(h);
	}

	document.addEventListener('DOMContentLoaded', function () {
		var canvas = document.getElementById('posts-graph');
		if (!canvas) return;
		var wrap = canvas.parentElement;
		var tooltip = document.getElementById('graph-tooltip');
		var legend = document.getElementById('graph-legend');
		var empty = document.getElementById('graph-empty');
		var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var dpr = window.devicePixelRatio || 1;

		var ctx = canvas.getContext('2d');
		var nodes = [];
		var links = [];
		var tagColors = {};
		var legendTags = [];
		var view = { x: 0, y: 0, k: 1 };
		var width = 0;
		var height = 0;
		var sim = null;
		var hovered = null;
		var dragged = null;
		var down = null;
		var moved = false;
		var filterTag = null;

		function resize() {
			var w = wrap.clientWidth;
			var h = wrap.clientHeight;
			if (!w || !h) return;
			var prevW = width;
			var prevH = height;
			width = w;
			height = h;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			canvas.style.width = w + 'px';
			canvas.style.height = h + 'px';
			if (prevW && prevH) {
				view.x = (view.x / prevW) * w;
				view.y = (view.y / prevH) * h;
			} else {
				view.x = w / 2;
				view.y = h / 2;
			}
			if (sim) {
				sim.force('center', d3.forceCenter(0, 0));
				render();
			}
		}

		function tagEdgeColor(tag) {
			return tagColors[tag] || '#ffffff';
		}

		function build(data) {
			var posts = (data && data.posts) || [];
			if (!posts.length) {
				if (empty) empty.hidden = false;
				return;
			}

			posts.forEach(function (p) {
				(p.tags || []).forEach(function (t) {
					if (!tagColors[t]) tagColors[t] = PALETTE[hashTag(t) % PALETTE.length];
				});
			});

			var bySlug = {};
			nodes = posts.map(function (p) {
				var n = {
					id: p.slug,
					title: p.title,
					url: p.url || p.slug + '/index.html',
					date: p.date || '',
					tags: p.tags || [],
					r: 12,
					color: '#8a8a8a'
				};
				if (n.tags.length) n.color = tagColors[n.tags[0]];
				n.r = 12 + Math.min(4, n.tags.length);
				bySlug[n.id] = n;
				return n;
			});

			links = [];
			var tagPosts = {};
			nodes.forEach(function (n) {
				n.tags.forEach(function (t) {
					(tagPosts[t] = tagPosts[t] || []).push(n);
				});
			});
			var commonTagLimit = Math.max(20, nodes.length * 0.5);
			Object.keys(tagPosts).forEach(function (t) {
				var arr = tagPosts[t];
				if (arr.length > commonTagLimit) return;
				for (var i = 0; i < arr.length; i++) {
					for (var j = i + 1; j < arr.length; j++) {
						links.push({ source: arr[i].id, target: arr[j].id, tag: t, manual: false, strength: 0.35 });
					}
				}
			});
			legendTags = Object.keys(tagPosts)
				.filter(function (t) { return tagPosts[t].length <= commonTagLimit; })
				.sort(function (a, b) { return tagPosts[b].length - tagPosts[a].length; })
				.slice(0, 10);
			posts.forEach(function (p) {
				(p.links || []).forEach(function (l) {
					if (bySlug[l]) links.push({ source: p.slug, target: l, manual: true, strength: 0.9 });
				});
			});

			buildLegend();

			sim = d3.forceSimulation(nodes)
				.force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(110).strength(function (d) { return d.strength; }))
				.force('charge', d3.forceManyBody().strength(-280).distanceMax(520))
				.force('center', d3.forceCenter(0, 0))
				.force('collide', d3.forceCollide().radius(function (d) { return d.r + 10; }));

			if (reduced) {
				sim.stop();
				for (var i = 0; i < 300; i++) sim.tick();
				render();
			} else {
				sim.on('tick', render);
			}
		}

		function buildLegend() {
			if (!legend) return;
			legend.innerHTML = '';
			legendTags.forEach(function (t) {
				var item = document.createElement('button');
				item.type = 'button';
				item.className = 'graph__legend-item';
				var dot = document.createElement('span');
				dot.className = 'graph__legend-dot';
				dot.style.background = tagColors[t];
				var name = document.createElement('span');
				name.textContent = t;
				item.appendChild(dot);
				item.appendChild(name);
				item.addEventListener('mouseenter', function () { filterTag = t; render(); });
				item.addEventListener('mouseleave', function () { filterTag = null; render(); });
				legend.appendChild(item);
			});
		}

		function render() {
			if (!width) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			ctx.save();
			ctx.translate(view.x, view.y);
			ctx.scale(view.k, view.k);

			var linkSel = hovered ? links.filter(function (l) {
				return l.source.id === hovered.id || l.target.id === hovered.id;
			}) : [];

			links.forEach(function (l) {
				var active = linkSel.indexOf(l) !== -1;
				var isManual = l.manual;
				var color = isManual ? 'rgba(255,68,0,0.4)' : 'rgba(255,255,255,0.1)';
				if (active) color = isManual ? '#ff4400' : 'rgba(255,255,255,0.55)';
				var alpha = filterTag && !active && !(l.source.tags.indexOf(filterTag) !== -1 || l.target.tags.indexOf(filterTag) !== -1) ? 0.05 : 1;
				ctx.globalAlpha = alpha;
				ctx.strokeStyle = color;
				ctx.lineWidth = active ? 1.6 : 1;
				ctx.beginPath();
				ctx.moveTo(l.source.x, l.source.y);
				ctx.lineTo(l.target.x, l.target.y);
				ctx.stroke();
			});
			ctx.globalAlpha = 1;

			nodes.forEach(function (n) {
				var isHovered = n === hovered;
				var dim = filterTag && n.tags.indexOf(filterTag) === -1;
				ctx.globalAlpha = dim ? 0.15 : 1;
				ctx.beginPath();
				ctx.arc(n.x, n.y, n.r + (isHovered ? 3 : 0), 0, Math.PI * 2);
				ctx.fillStyle = n.color;
				ctx.shadowColor = n.color;
				ctx.shadowBlur = isHovered ? 18 : 10;
				ctx.fill();
				ctx.shadowBlur = 0;
				ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.4)';
				ctx.lineWidth = isHovered ? 2 : 1;
				ctx.stroke();
			});
			ctx.globalAlpha = 1;
			ctx.restore();
		}

		function toWorld(mx, my) {
			return { x: (mx - view.x) / view.k, y: (my - view.y) / view.k };
		}

		function hitTest(mx, my) {
			var w = toWorld(mx, my);
			var best = null;
			var bestDist = Infinity;
			nodes.forEach(function (n) {
				var d = Math.hypot(n.x - w.x, n.y - w.y);
				if (d <= n.r + 4 && d < bestDist) {
					best = n;
					bestDist = d;
				}
			});
			return best;
		}

		function positionTooltip(mx, my) {
			if (!tooltip) return;
			var left = Math.min(mx + 16, width - 228);
			var top = Math.min(my + 16, height - 98);
			tooltip.style.left = Math.max(8, left) + 'px';
			tooltip.style.top = Math.max(8, top) + 'px';
		}

		function showTooltip(n, mx, my) {
			if (!tooltip) return;
			tooltip.hidden = false;
			var tags = n.tags.map(function (t) { return '<span class="graph__tooltip-tag">' + t + '</span>'; }).join('');
			tooltip.innerHTML = '<b>' + n.title + '</b>' + (n.date ? '<div class="graph__tooltip-meta">' + n.date + '</div>' : '') + '<div class="graph__tooltip-tags">' + tags + '</div>';
			positionTooltip(mx, my);
		}

		function hideTooltip() {
			if (tooltip) tooltip.hidden = true;
		}

		function zoomAt(mx, my, factor) {
			var w = toWorld(mx, my);
			var k = Math.min(3, Math.max(0.4, view.k * factor));
			view.x = mx - w.x * k;
			view.y = my - w.y * k;
			view.k = k;
			render();
		}

		function resetView() {
			view = { x: width / 2, y: height / 2, k: 1 };
			render();
		}

		canvas.addEventListener('wheel', function (e) {
			e.preventDefault();
			var rect = canvas.getBoundingClientRect();
			zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
		}, { passive: false });

		canvas.addEventListener('pointerdown', function (e) {
			var rect = canvas.getBoundingClientRect();
			var mx = e.clientX - rect.left;
			var my = e.clientY - rect.top;
			var n = hitTest(mx, my);
			down = { x: mx, y: my, node: n };
			moved = false;
			canvas.setPointerCapture(e.pointerId);
			if (n) {
				dragged = n;
				n.fx = n.x;
				n.fy = n.y;
				if (sim && !reduced) sim.alphaTarget(0.3).restart();
			}
		});

		canvas.addEventListener('pointermove', function (e) {
			var rect = canvas.getBoundingClientRect();
			var mx = e.clientX - rect.left;
			var my = e.clientY - rect.top;
			if (down) {
				if (Math.hypot(mx - down.x, my - down.y) > 5) moved = true;
				if (dragged) {
					var w = toWorld(mx, my);
					dragged.fx = w.x;
					dragged.fy = w.y;
					if (sim && reduced) render();
				} else {
					view.x += mx - down.x;
					view.y += my - down.y;
					down.x = mx;
					down.y = my;
					render();
				}
			} else {
				var n = hitTest(mx, my);
				if (n !== hovered) {
					hovered = n;
					canvas.style.cursor = n ? 'pointer' : 'grab';
					if (n) showTooltip(n, mx, my);
					else hideTooltip();
					render();
				} else if (n && tooltip && !tooltip.hidden) {
					positionTooltip(mx, my);
				}
			}
		});

		canvas.addEventListener('pointerup', function (e) {
			var rect = canvas.getBoundingClientRect();
			var mx = e.clientX - rect.left;
			var my = e.clientY - rect.top;
			var n = down && down.node;
			if (dragged) {
				dragged.fx = null;
				dragged.fy = null;
				if (sim && !reduced) sim.alphaTarget(0);
			}
			if (n && !moved && Math.hypot(mx - down.x, my - down.y) < 5) {
				window.location.href = n.url;
			}
			dragged = null;
			down = null;
		});

		canvas.addEventListener('pointerleave', function () {
			hideTooltip();
			hovered = null;
			render();
		});

		wrap.querySelectorAll('[data-zoom]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var action = btn.getAttribute('data-zoom');
				if (action === 'reset') resetView();
				else zoomAt(width / 2, height / 2, action === 'in' ? 1.3 : 1 / 1.3);
			});
		});

		var resizeTimer = null;
		if (window.ResizeObserver) {
			new ResizeObserver(function () {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(resize, 150);
			}).observe(wrap);
		} else {
			window.addEventListener('resize', resize);
		}

		resize();
		var posts = window.BLOG_POSTS_DATA && window.BLOG_POSTS_DATA.posts ? window.BLOG_POSTS_DATA.posts : null;
		if (posts) {
			build({ posts: posts });
		} else if (empty) {
			empty.hidden = false;
		}
	});
})();
