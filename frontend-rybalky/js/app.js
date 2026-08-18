(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var STAGE_LABELS = {
    moderation: "Модерация",
    payment: "Оплата",
    queued: "В очереди",
    processing: "В обработке",
    ready: "Готов к показу",
    showing: "Показывается",
    shown: "Показан"
  };

  var STAGE_ORDER = ["moderation", "payment", "queued", "processing", "ready", "showing", "shown"];

  var REJECT_RE = /наркотик|оружие|убийств|взлом/;

  var state = {
    seq: 0,
    items: [],
    load: 1.0,
    viewers: 1204,
    nextQuestionAt: Date.now() + 14000
  };

  var CAPTIONS = [
    "Привет эфир! Кто готов задать вопрос?",
    "Вопрос в работе — сейчас выберу эмоцию под ответ.",
    "Отличный вопрос! Уже в очереди на обработку.",
    "Спасибо за поддержку — продолжаем отвечать!"
  ];

  var FAKE_TEXTS = [
    "Что думаешь про ночные стримы?",
    "Почему небо синее?",
    "Дай совет новичку в нейросетях",
    "Топ-3 фильма на вечер",
    "Сможешь пошутить про очередь?",
    "Как стать увереннее?",
    "Любимая книга и почему?",
    "Что будет с ИИ через год?"
  ];

  var FAKE_CYCLE = [
    { stage: "queued", d: 4200 },
    { stage: "processing", d: 4200 },
    { stage: "ready", d: 6200 },
    { stage: "showing", d: 4200 }
  ];

  var fakeQueue = FAKE_TEXTS.slice(0, 5).map(function (text, i) {
    return { text: text, cycle: i % FAKE_CYCLE.length, start: Date.now() + i * 900 };
  });

  var PROCESSING_SUBSTEPS = ["Формулировка ответа", "Озвучка ответа", "Подбор видеофрагмента"];

  function fmtTime(d) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function fmtCountdown(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function newItem(text) {
    return {
      id: ++state.seq,
      text: text,
      stage: "moderation",
      paid: false,
      position: 0,
      queuedAt: 0,
      substep: 0,
      etaBase: 0,
      shownAt: null,
      rejected: false
    };
  }

  function setStage(item, stage) {
    item.stage = stage;
    if (stage === "queued") { item.queuedAt = Date.now(); item.position = 1 + Math.floor(Math.random() * 4); }
    if (stage === "processing") { item.substep = 0; }
    if (stage === "ready") { item.etaBase = Date.now() + 14000 + Math.random() * 24000; }
    if (stage === "shown") { item.shownAt = Date.now(); }
    renderTickets();
  }

  function advance(item) {
    switch (item.stage) {
      case "moderation":
        setTimeout(function () {
          if (REJECT_RE.test(item.text)) { item.rejected = true; setStage(item, "rejected"); }
          else { setStage(item, "payment"); }
        }, 2600);
        break;
      case "queued":
        setTimeout(function () { setStage(item, "processing"); substeps(item, 0); }, 5600);
        break;
    }
  }

  function substeps(item, idx) {
    if (item.stage !== "processing" || idx > PROCESSING_SUBSTEPS.length) return;
    if (idx > 0) {
      item.substep = idx;
      renderTickets();
    }
    if (idx >= PROCESSING_SUBSTEPS.length) { setStage(item, "ready"); return; }
    setTimeout(function () { substeps(item, idx + 1); }, 1350);
  }

  function stagePills(item) {
    return STAGE_ORDER.map(function (s) {
      var cls = "stage-pill";
      var cur = item.stage === "rejected" ? "rejected" : item.stage;
      var idx = STAGE_ORDER.indexOf(cur);
      var i = STAGE_ORDER.indexOf(s);
      if (i < idx) cls += " done";
      if (item.stage === s && item.stage !== "rejected") cls += " active";
      return "<span class=\"" + cls + "\">" + STAGE_LABELS[s] + "</span>";
    }).join("");
  }

  function detailHtml(item) {
    var h = "";
    switch (item.stage) {
      case "moderation":
        h = "<div class=\"t-tip\"><span class=\"eta-live\"></span><div><strong>ИИ-критик проверяет вопрос</strong><br>Правила стримов, запрещённые темы, попытки инъекций.</div></div><div class=\"t-progress\"><div class=\"t-progress-fill\" style=\"width:55%;animation:drain 2.6s linear forwards\"></div></div>";
        break;
      case "payment":
        h = payFormHtml(item);
        break;
      case "queued":
        h = "<div class=\"t-tip\"><strong>Позиция в очереди: " + posOf(item) + "</strong>&nbsp;·&nbsp;оплачено ✓</div><div class=\"t-progress\"><div class=\"t-progress-fill drain\"></div></div>";
        break;
      case "processing":
        h = "<div class=\"t-tip\"><strong>Собираю ответ</strong></div><div class=\"t-progress\"><div class=\"t-progress-fill sweep\"></div></div><div class=\"substeps\">" + PROCESSING_SUBSTEPS.map(function (s, i) {
          var cls = "substep";
          if (i < item.substep) cls += " done";
          if (i === item.substep) cls += " active";
          var icon = i < item.substep ? "✓" : "";
          return "<div class=\"" + cls + "\"><span class=\"tick\">" + icon + "</span>" + s + "</div>";
        }).join("") + "</div>";
        break;
      case "ready":
        h = "<div class=\"eta\"><span class=\"t-tip\"><span class=\"eta-live\"></span><strong>Готов к показу</strong></span><span class=\"eta-time\" data-eta=\"" + item.id + "\">--:--:--</span><span class=\"eta-note\">Ориентировочное время показа · обновляется по нагрузке пайплайна</span></div>";
        break;
      case "showing":
        h = "<div class=\"streaming\"><div class=\"stream-bars\"><span></span><span></span><span></span><span></span><span></span></div><div class=\"t-tip\"><strong>Ваш вопрос в эфире</strong><br>Ответ озвучивается прямо сейчас</div></div>";
        break;
      case "shown":
        h = "<div class=\"t-tip\"><span class=\"t-success\">✓ Показан в " + fmtTime(new Date(item.shownAt)) + "</span></div><p style=\"font-size:13px\">Спасибо за вопрос! Следите за эфиром — ведущий ещё вернётся к этой теме.</p>";
        break;
      case "rejected":
        h = "<div class=\"t-rejected\"><div class=\"t-rejected-orb\"></div><div><h4>Вопрос отклонён модерацией</h4><p>ИИ-критик обнаружил признаки нарушения правил стримов. Оплата не списана — сформулируйте вопрос иначе.</p></div></div>";
        break;
    }
    return h;
  }

  function posOf(item) {
    var gone = (Date.now() - item.queuedAt) / 1200;
    return Math.max(1, item.position - Math.floor(gone));
  }

  function payFormHtml() {
    return "<div class=\"t-tip\"><span class=\"t-success\">✓ Модерация пройдена</span>&nbsp;·&nbsp;осталось оплатить вопрос</div>" +
      "<div class=\"pay-form\" data-role=\"payform\">" +
      "<div class=\"pay-field\" style=\"grid-column:1/-1\"><label>Номер карты</label><input data-pay=\"card\" inputmode=\"numeric\" maxlength=\"19\" placeholder=\"0000 0000 0000 0000\"></div>" +
      "<div class=\"pay-row\" style=\"grid-column:1/-1\">" +
      "<div class=\"pay-field\"><label>Срок действия</label><input data-pay=\"exp\" inputmode=\"numeric\" maxlength=\"5\" placeholder=\"MM/ГГ\"></div>" +
      "<div class=\"pay-field\"><label>CVC</label><input data-pay=\"cvc\" inputmode=\"numeric\" maxlength=\"3\" placeholder=\"•••\"></div>" +
      "</div>" +
      "<div class=\"pay-total\"><span>Стоимость вопроса</span><b>99 ₽</b></div>" +
      "<button class=\"btn btn-primary btn-block pay-btn\" data-role=\"paybtn\" type=\"button\"><span class=\"btn-label\">Оплатить</span><span class=\"btn-arrow\">→</span><span class=\"pay-spinner\">Обработка платежа…</span></button>" +
      "<div class=\"pay-ok\" data-role=\"payok\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><path class=\"check-draw\" d=\"M4 12.5L9.5 18L20 6\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>Оплачено — вопрос отправлен в очередь</div>" +
      "</div>";
  }

  function ticketHtml(item) {
    return "<div class=\"ticket\" data-id=\"" + item.id + "\">" +
      "<span class=\"t-id\">#" + pad2(item.id) + "</span>" +
      "<p class=\"t-question\">" + esc(item.text) + "</p>" +
      "<div class=\"t-stages\">" + stagePills(item) + "</div>" +
      "<div class=\"t-detail\">" + detailHtml(item) + "</div>" +
      "</div>";
  }

  function renderTickets() {
    var box = $("#tickets");
    var empty = $("#emptyState");
    if (state.items.length === 0) {
      box.innerHTML = "";
      if (empty) box.appendChild(empty);
      return;
    }
    if (empty) empty.remove();
    box.innerHTML = state.items.map(ticketHtml).join("");
  }

  function renderQueue() {
    var list = $("#queueList");
    list.innerHTML = fakeQueue.map(function (it) {
      var phase = FAKE_CYCLE[it.cycle];
      var prog = Math.min(100, Math.max(0, ((Date.now() - it.start) / phase.d) * 100));
      return "<div class=\"queue-item\"><span class=\"q-stage " + phase.stage + "\"><i class=\"mini-dot\"></i>" + STAGE_LABELS[phase.stage] + "</span><span class=\"q-text\">" + esc(it.text) + "</span><span class=\"q-bar\"><i style=\"width:" + prog.toFixed(0) + "%\"></i></span></div>";
    }).join("");
  }

  function renderLoad() {
    var pct = Math.round(22 + state.load * 28);
    var txt;
    var cls = "";
    if (state.load < 0.95) { txt = "Нагрузка: низкая"; }
    else if (state.load < 1.2) { txt = "Нагрузка: нормальная"; }
    else { txt = "Нагрузка: высокая"; cls = " warm"; }
    if (state.load > 1.38) { txt = "Нагрузка: пиковая"; cls = " hot"; }
    $("#loadChipText").textContent = txt;
    $("#loadChip").className = "load-chip" + cls;
    var chip2 = $("#loadChip2");
    chip2.className = "load-chip big" + cls;
    chip2.querySelector("span").textContent = txt.replace("Нагрузка: ", "");
    $("#loadPct").textContent = pct + "%";
    $("#loadFill").style.width = pct + "%";
    var note = $("#loadNote");
    if (state.load < 0.95) note.textContent = "Пайплайн почти свободен — вопросы уходят в эфир почти без ожидания.";
    else if (state.load < 1.2) note.textContent = "Пайплайн справляется — время ожидания минимально.";
    else note.textContent = "Пайплайн загружен — ориентировочное время показа растёт.";
    var wait = Math.round((40 * state.load) / 5) * 5;
    $("#statWait").textContent = "~" + wait;
  }

  function renderViewers() {
    $("#viewers").textContent = Math.round(state.viewers).toLocaleString("ru-RU");
  }

  function tick() {
    state.load = Math.min(1.5, Math.max(0.75, state.load + (Math.random() - 0.5) * 0.07));
    state.viewers = Math.max(600, state.viewers + (Math.random() - 0.48) * 14);

    var past = [];
    state.items.forEach(function (it) {
      if (it.stage === "ready") {
        var left = it.etaBase - Date.now();
        if (left <= 0) { past.push(it); }
        else {
          var jitter = (state.load - 1) * 9000 + (Math.random() - 0.5) * 3500;
          var showAt = new Date(it.etaBase + jitter);
          var el = $("[data-eta=\"" + it.id + "\"]");
          if (el) {
            el.innerHTML = fmtTime(showAt) + " <span class=\"colon\">·</span> через ~" + Math.max(0, Math.round(left / 1000)) + " с";
          }
        }
      }
      if (it.stage === "queued") {
        var el = $("[data-id=\"" + it.id + "\"]");
        if (el) {
          var p = el.querySelector(".t-tip strong");
          if (p) p.textContent = "Позиция в очереди: " + posOf(it);
        }
      }
    });
    past.forEach(function (it) { setStage(it, "showing"); show(it); });

    if (Date.now() >= state.nextQuestionAt) state.nextQuestionAt = Date.now() + 14000;
    $("#pvCountdown").textContent = fmtCountdown(state.nextQuestionAt - Date.now());

    fakeQueue.forEach(function (it) {
      var phase = FAKE_CYCLE[it.cycle];
      if (Date.now() - it.start >= phase.d) {
        it.cycle = (it.cycle + 1) % FAKE_CYCLE.length;
        it.start = Date.now();
      }
    });

    renderQueue();
    renderLoad();
    renderViewers();
  }

  function show(item) {
    setTimeout(function () { setStage(item, "shown"); }, 6800);
  }

  function paySuccess(ticket, item) {
    var ok = ticket.querySelector("[data-role=payok]");
    ok.classList.add("show");
    setTimeout(function () {
      item.paid = true;
      setStage(item, "queued");
      advance(item);
    }, 1500);
  }

  function handlePayClick(btn) {
    var ticket = btn.closest(".ticket");
    var id = Number(ticket.getAttribute("data-id"));
    var item = state.items.filter(function (i) { return i.id === id; })[0];
    if (!item || item.stage !== "payment" || item.paid) return;

    var card = ticket.querySelector("[data-pay=card]");
    var exp = ticket.querySelector("[data-pay=exp]");
    var cvc = ticket.querySelector("[data-pay=cvc]");
    var ok = true;
    [card, exp, cvc].forEach(function (input) { input.classList.toggle("err-field", false); });
    if (card.value.replace(/\s/g, "").length !== 16) { card.classList.add("err-field"); ok = false; }
    if (cvc.value.length !== 3) { cvc.classList.add("err-field"); ok = false; }
    if (!/^\d{2}\/\d{2}$/.test(exp.value)) { exp.classList.add("err-field"); ok = false; }
    if (!ok) { ticket.querySelector(".t-detail").classList.remove("shake"); void ticket.querySelector(".t-detail").offsetWidth; ticket.querySelector(".t-detail").classList.add("shake"); return; }

    btn.classList.add("loading");
    btn.setAttribute("disabled", "disabled");
    setTimeout(function () { paySuccess(ticket, item); }, 1900);
  }

  function initForm() {
    var form = $("#askForm");
    var ta = $("#qText");
    var count = $("#charCount");
    var err = $("#formErr");
    var btn = $("#askBtn");

    ta.addEventListener("input", function () {
      count.textContent = ta.value.length;
      count.parentElement.classList.toggle("near", ta.value.length > 200);
      if (ta.value.trim().length >= 8) err.textContent = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = ta.value.trim();
      if (text.length < 8) {
        err.textContent = "Слишком короткий вопрос — минимум 8 символов.";
        err.classList.remove("shake"); void err.offsetWidth; err.classList.add("shake");
        return;
      }
      var item = newItem(text);
      state.items.unshift(item);
      ta.value = "";
      count.textContent = 0;
      err.textContent = "";
      renderTickets();
      advance(item);
    });
  }

  function initPaymentDelegation() {
    $("#tickets").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-role=paybtn]");
      if (btn) handlePayClick(btn);
    });
    $("#tickets").addEventListener("input", function (e) {
      var input = e.target.closest("[data-pay]");
      if (!input) return;
      var v = input.value.replace(/\D/g, "");
      if (input.getAttribute("data-pay") === "card") {
        v = v.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
        input.value = v;
      } else if (input.getAttribute("data-pay") === "exp") {
        v = v.slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
        input.value = v;
      } else {
        input.value = v.slice(0, 3);
      }
    });
  }

  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initFaq() {
    $$(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var open = item.classList.contains("open");
        $$(".faq-item.open").forEach(function (o) {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = "0px";
        });
        if (!open) {
          item.classList.add("open");
          var a = item.querySelector(".faq-a");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  function initTilt() {
    var card = $("#preview");
    if (!card) return;
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", function () {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  }

  function initStepGlow() {
    $$(".step").forEach(function (step) {
      step.addEventListener("mousemove", function (e) {
        var r = step.getBoundingClientRect();
        step.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        step.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  function initPreviewTick() {
    var el = $("#captionText");
    var i = 0, charIdx = 0, typing = false, timer = null;
    function loop() {
      var text = CAPTIONS[i % CAPTIONS.length];
      if (!typing) {
        charIdx = 0;
        typing = true;
        el.textContent = "";
        type();
      }
      function type() {
        if (charIdx >= text.length) {
          typing = false;
          timer = setTimeout(loop, 2400);
          return;
        }
        el.textContent = text.slice(0, ++charIdx);
        timer = setTimeout(type, 42 + Math.random() * 55);
      }
    }
    loop();
  }

  function initCounter() {
    var el = $("[data-count]");
    if (!el) return;
    var target = 24;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1300);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  initForm();
  initPaymentDelegation();
  initReveal();
  initFaq();
  initTilt();
  initStepGlow();
  initPreviewTick();
  initCounter();
  renderTickets();
  renderQueue();
  renderLoad();
  renderViewers();
  setInterval(tick, 1000);
})();