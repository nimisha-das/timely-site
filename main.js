(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var TICK = '<svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.4 2.4 4.6-5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* nav */
  var nav = $("#nav"), burger = $("#burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var o = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", o);
    });
    document.addEventListener("click", function (e) { if (!nav.contains(e.target)) nav.classList.remove("open"); });
  }

  /* Chrome Web Store link — set when the listing is live */
  var CWS_URL = "";
  ["cws", "cws2"].forEach(function (id) {
    var a = document.getElementById(id);
    if (!a) return;
    if (CWS_URL) a.href = CWS_URL; else a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* progress of a tall track: 0 at top, 1 at end */
  function progress(track) {
    var r = track.getBoundingClientRect();
    return clamp(-r.top / (r.height - window.innerHeight), 0, 1);
  }

  /* ---------- scroll demo ---------- */
  var PROJECTS = [{ n: "Portfolio", s: 9 }, { n: "UX Design", s: 38 }, { n: "Podcast", s: 56 }];
  var TODOS = [
    { l: "Add case study", p: 0, g: 30 }, { l: "Draft section 1", p: 1, g: 16 }, { l: "Outline episode 5", p: 2, g: 14 },
    { l: "Write project summary", p: 0, g: 35 }, { l: "Recruit participants", p: 1, g: 22 }, { l: "Record intro", p: 2, g: 10 }
  ];
  function status(h) {
    if (h < 15) return { l: "Dying", c: "#FFA048" };
    if (h < 70) return { l: "Needs attention", c: "#E9B800" };
    return { l: "Healthy", c: "#6F9A2E" };
  }
  var demo = $("#demo");
  if (demo) {
    var tEl = $("#todos"), hEl = $("#health"), rail = $("#demoRail");
    tEl.innerHTML = '<div class="card-head"><b>Today</b><small id="left">6 left</small></div>' + TODOS.map(function (t) {
      return '<div class="todo"><span class="box">' + TICK + '</span><span class="t">' + t.l + '</span><span class="gain">+' + t.g + '</span><span class="p">' + PROJECTS[t.p].n + '</span></div>';
    }).join("");
    hEl.innerHTML = '<div class="card-head"><b>Project health</b><small id="rec"></small></div>' + PROJECTS.map(function (p) {
      return '<div class="proj"><div class="proj-top"><span>' + p.n + '</span><span class="badge"><i></i><em style="font-style:normal"></em></span></div><div class="bar"><div></div></div><div class="pct"></div></div>';
    }).join("");
    var rows = tEl.querySelectorAll(".todo"), projs = hEl.querySelectorAll(".proj");
    var shown = PROJECTS.map(function (p) { return p.s; }), targets = shown.slice(), raf = 0, lastTicked = -1;
    function tween() {
      var moving = false;
      shown.forEach(function (v, i) {
        var d = targets[i] - v;
        if (Math.abs(d) < .4) shown[i] = targets[i]; else { shown[i] = v + d * .12; moving = true; }
        projs[i].querySelector(".pct").textContent = Math.round(shown[i]) + "%";
      });
      raf = moving ? requestAnimationFrame(tween) : 0;
    }
    function renderDemo() {
      var t = clamp((progress(demo) - .06) / .84, 0, 1);
      var ticked = Math.min(TODOS.length, Math.floor(t * TODOS.length + .001));
      rail.style.width = t * 100 + "%";
      if (ticked === lastTicked) return;
      lastTicked = ticked;
      rows.forEach(function (r, i) { r.classList.toggle("done", i < ticked); r.classList.toggle("next", i === ticked); });
      $("#left").textContent = ticked === TODOS.length ? "All done" : (TODOS.length - ticked) + " left";
      $("#rec").textContent = ticked === TODOS.length ? "All recovered" : "";
      PROJECTS.forEach(function (p, i) {
        var h = Math.min(100, p.s + TODOS.slice(0, ticked).filter(function (x) { return x.p === i; }).reduce(function (a, x) { return a + x.g; }, 0));
        targets[i] = h;
        var s = status(h), el = projs[i];
        el.querySelector(".bar div").style.width = h + "%";
        el.querySelector(".bar div").style.background = s.c;
        el.querySelector(".badge").style.background = s.c + "33";
        el.querySelector(".badge i").style.background = s.c;
        el.querySelector(".badge em").textContent = s.l;
      });
      if (!raf) raf = requestAnimationFrame(tween);
    }
    renderDemo(); lastTicked = -1; renderDemo();
    window.addEventListener("scroll", renderDemo, { passive: true });
    window.addEventListener("resize", renderDemo);
  }

  /* ---------- features ---------- */
  var FEATURES = [
    { t: "No day yet? It waits.", b: "Add a to-do without picking a date. It waits in Pending until you give it one, right there, no pop-up." },
    { t: "Pin up to 3 projects.", b: "Pinned projects fill your day. Everything else waits in “Later today”, one tap away." },
    { t: "Milestones open themselves.", b: "Finish one and the next opens. Future milestones never drag a project’s health down." },
    { t: "Repeats, without the pile-up.", b: "Daily and weekly to-dos come back on their own. Skip three weeks and you get one item, not three." }
  ];
  var PIN = function (on) { return '<svg class="pinic" viewBox="0 0 24 24" fill="' + (on ? "#77905F" : "none") + '" stroke="' + (on ? "#77905F" : "#9AA58F") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/></svg>'; };
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  var MOCKS = [
    function (el) {
      el.innerHTML = '<div class="mhead"><b>Pending</b><span class="pillx" id="pc">3</span></div>' +
        '<div class="collapse" id="r1"><div class="row"><span class="grow">Add case study</span><span class="tag">Portfolio</span><span class="give" id="gv">Give a day</span></div>' +
        '<div class="days" id="days">' + ["Mon", "Tue", "Wed", "Thu", "Fri"].map(function (d, i) { return '<div class="day"><small>' + d + '</small><b>' + (3 + i) + '</b></div>'; }).join("") + '</div></div>' +
        '<div class="row"><span class="grow">Email supervisor</span><span class="tag">Dissertation</span></div>' +
        '<div class="row"><span class="grow">Reply to reviewer</span><span class="tag">Lab</span></div>' +
        '<div class="toast" id="toast">Moved to Thursday · Undo</div>';
      later(function () { $("#days").classList.add("show"); }, 800);
      later(function () { el.querySelectorAll(".day")[3].classList.add("sel"); $("#gv").textContent = "Thu"; }, 1700);
      later(function () { $("#r1").classList.add("gone"); $("#pc").textContent = "2"; $("#toast").classList.add("show"); }, 2600);
    },
    function (el) {
      var pins = [["Portfolio", "2 to-dos today"], ["UX Design", "3 to-dos today"], ["Podcast", "1 to-do today"]];
      el.innerHTML = '<div class="mhead"><b>In focus</b><span class="tag">3 pinned</span></div>' +
        pins.map(function (p) { return '<div class="row pin">' + PIN(true) + '<span class="grow">' + p[0] + '</span><span class="tag">' + p[1] + '</span></div>'; }).join("") +
        '<div class="row later">' + PIN(false) + '<span class="grow">Later today</span><span class="tag">4 to-dos from Studies, Lab</span></div>';
    },
    function (el) {
      function ms(n, s, sub, last) { return '<div class="ms ' + s + '"><div class="rail2"><span class="dot">' + TICK.replace('stroke="#fff"', 'stroke="#fff"') + '</span>' + (last ? "" : '<span class="line"></span>') + '</div><div class="body"><b>' + n + '</b><small>' + sub + '</small></div></div>'; }
      el.innerHTML = '<div class="mhead"><b>Podcast</b><span class="tag">3 milestones</span></div><div id="msl"></div>';
      function draw(step) {
        $("#msl").innerHTML = ms("Research", "done", "Done") +
          ms("Draft", step ? "done" : "", step ? "Done" : "In progress") +
          ms("Launch", step ? "" : "wait", step ? "Opened automatically" : "Opens after Draft", true);
      }
      draw(0); later(function () { draw(1); }, 1100);
    },
    function (el) {
      el.innerHTML = '<div class="mhead"><b>Weekly review</b><span class="pillx">↻ Every Monday</span></div>' +
        '<div class="tag" style="margin-bottom:10px">You skipped it. Here is what waits in Pending:</div><div id="sk"></div>';
      function many() { $("#sk").innerHTML = [1, 2, 3].map(function (w) { return '<div class="skip"><span class="grow">Weekly review</span><span class="tag">Week ' + w + '</span></div>'; }).join(""); }
      many();
      later(function () { $("#sk").innerHTML = '<div class="skip merged"><span class="grow">Weekly review</span><span class="tag" style="color:#4F6B34;font-weight:500">skipped 3 weeks · 1 item</span></div>'; }, 1300);
    }
  ];
  var feat = $("#feat");
  if (feat) {
    var list = $("#featList"), mock = $("#mock"), dots = $("#featDots"), current = -1;
    list.innerHTML = FEATURES.map(function (f, i) { return '<div class="feat"><span class="num">' + (i + 1) + '</span><div><h3>' + f.t + '</h3><p>' + f.b + '</p></div></div>'; }).join("");
    dots.innerHTML = FEATURES.map(function () { return "<div><i></i></div>"; }).join("");
    var items = list.querySelectorAll(".feat"), bars = dots.querySelectorAll("i");
    function setFeat(i) {
      if (i === current) return;
      current = i;
      items.forEach(function (it, k) { it.classList.toggle("on", k === i); });
      bars.forEach(function (b, k) { b.style.width = k <= i ? "100%" : "0%"; });
      timers.forEach(clearTimeout); timers = [];
      mock.innerHTML = '<div class="in"></div>';
      MOCKS[i](mock.firstChild);
    }
    function renderFeat() { setFeat(clamp(Math.floor(progress(feat) * FEATURES.length), 0, FEATURES.length - 1)); }
    renderFeat();
    window.addEventListener("scroll", renderFeat, { passive: true });
    window.addEventListener("resize", renderFeat);
  }

  /* ---------- calendar ---------- */
  var hours = $("#hours");
  if (hours) {
    var H = 56, S = 9;
    function fmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return (hh > 12 ? hh - 12 : hh) + (mm ? ":" + (mm < 10 ? "0" + mm : mm) : "") + (hh >= 12 ? " pm" : " am"); }
    var out = "";
    for (var h = 9; h <= 15; h++) out += '<div class="hr" style="top:' + (h - S) * H + 'px"><span>' + fmt(h) + '</span><i></i></div>';
    [["Record intro", "Podcast", 9, 10.5, "#77905F", "#E4EADC"], ["Draft section 1", "UX Design", 11, 12, "#6B8FB5", "#E4EBF3"], ["Add case study", "Portfolio", 13.5, 15, "#B58A6B", "#F2EBE4"]].forEach(function (e, i) {
      out += '<div class="ev" style="top:' + ((e[2] - S) * H + 2) + 'px;height:' + ((e[3] - e[2]) * H - 4) + 'px;background:' + e[5] + ';border-color:' + e[4] + ';transition-delay:' + (.25 + i * .28) + 's"><b>' + e[0] + '</b><small>' + e[1] + " · " + fmt(e[2]) + "–" + fmt(e[3]) + '</small></div>';
    });
    hours.innerHTML = out;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { hours.classList.add("in-view"); o.disconnect(); } }); }, { threshold: .3 }).observe(hours);
    } else hours.classList.add("in-view");
  }
})();
