(function () {
  var doc = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Страница кейса всегда открывается с начала: браузер и окно превью иногда сохраняют
  // прокрутку с предыдущей страницы. Ссылки с якорем (#раздел) работают как раньше
  if (document.body.classList.contains("case-page") && !location.hash) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var toTop = function () { doc.style.scrollBehavior = "auto"; window.scrollTo(0, 0); doc.style.scrollBehavior = ""; };
    toTop();
    window.addEventListener("load", toTop);
    window.addEventListener("pageshow", function (e) { if (!e.persisted) toTop(); });
  }

  // Шапка получает линию снизу после начала прокрутки. На странице кейса растёт полоска прогресса,
  // а в шапке видно название текущего раздела
  var header = document.querySelector("[data-header]");
  var progress = document.querySelector("[data-progress]");
  var current = document.querySelector("[data-current-section]");
  var heads = document.querySelectorAll(".prose > h2[id]");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || doc.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    }
    if (current && heads.length) {
      var active = null;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < window.innerHeight * 0.35) active = h; });
      var text = active ? active.textContent : "";
      if (current.textContent !== text) current.textContent = text;
      current.classList.toggle("is-on", !!active);
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Кнопка «Скопировать» у почты
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        var label = btn.textContent;
        btn.textContent = "Скопировано";
        setTimeout(function () { btn.textContent = label; }, 1800);
      };
      var fallback = function () {
        var target = document.getElementById(btn.getAttribute("aria-controls"));
        if (!target) return;
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  });

  // Кружок «Открыть кейс» следует за курсором над карточками
  var cards = document.querySelectorAll("[data-cursor]");
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (cards.length && fine && !reduced) {
    var dot = document.createElement("div");
    dot.className = "cursor";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    var tx = 0, ty = 0, x = 0, y = 0, raf = null;
    var loop = function () {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      dot.style.transform = "translate(" + x + "px," + y + "px)";
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : null;
    };
    cards.forEach(function (card) {
      card.addEventListener("pointerenter", function (e) {
        // Подпись в две строки: «Открыть» и «кейс»
        dot.textContent = card.getAttribute("data-cursor").replace(" ", "\n");
        dot.classList.toggle("is-light", card.hasAttribute("data-cursor-light"));
        if (!dot.classList.contains("is-on")) { x = tx = e.clientX; y = ty = e.clientY; loop(); }
        dot.classList.add("is-on");
      });
      card.addEventListener("pointerleave", function () { dot.classList.remove("is-on"); });
      card.addEventListener("pointermove", function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  // Клик по картинке в кейсе открывает её крупно, клик или Esc закрывает
  var imgs = document.querySelectorAll(".canvas img, .case-cover img");
  if (imgs.length && typeof HTMLDialogElement !== "undefined") {
    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    var big = document.createElement("img");
    big.alt = "";
    dlg.appendChild(big);
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function () { dlg.close(); });
    imgs.forEach(function (img) {
      img.addEventListener("click", function () {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        dlg.showModal();
      });
    });
  }
})();
