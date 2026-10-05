/* =========================================================================
   PELAN STUDY APP
   eligibility → consent → nickname + study code → RANDOM ASSIGNMENT →
   onboarding + tour → lesson map → lessons 1–6 (each unlocks the next) →
   after each lesson: next lesson / flashcards / break / finish →
   quit prompt (by version) → exit screen with study code + survey.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.STUDY_CONFIG, P = window.PELAN, Art = window.Art, Log = window.StudyLog;
  const $app = document.getElementById("app");
  const $modal = document.getElementById("modal-root");
  const $toast = document.getElementById("toast-root");
  const qs = new URLSearchParams(location.search);
  const DEBUG = !!CFG.allowDebug && qs.get("debug") === "1";
  const STORE = "pelan_state_" + CFG.studyId;
  const NL = P.lessons.length;

  let S = null;   // persisted session state
  let R = null;   // current round (not persisted)

  /* ------------------------------ helpers ------------------------------ */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => performance.now();
  const iso = () => new Date().toISOString();
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "s-" + Date.now().toString(36) + "-" + rnd(1e9).toString(36));
  const norm = s => String(s).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (_) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch (_) { return null; } };
  const G = () => CFG.groups[S.group] || CFG.groups[1];
  const mascot = () => !!G().mascot;
  const gamified = () => !!G().gamified;
  const msgSet = () => CFG.messages[G().framing === "plain" ? "plain" : (mascot() ? "ollie_" : "text_") + G().framing];
  const fill = t => String(t).replace(/\{(streak|shells|next|n)\}/g, (_, k) => ({ streak: S.streak, shells: S.shells, next: nextLesson() || "", n: S.combo }[k]));
  const nick = () => esc((S.nickname || "").trim()) || "friend";
  const lessonsDone = () => Object.values(S.lessons).filter(l => l.done).length;
  const nextLesson = () => { for (let n = 1; n <= NL; n++) if (!S.lessons[n].done) return n; return null; };
  const ms = t => Math.round(now() - t);

  function makeCode() {
    const A = "ACDEFHJKMNPRTUVWXY34679";
    let s = ""; for (let i = 0; i < 6; i++) s += A[rnd(A.length)];
    return s.slice(0, 3) + "-" + s.slice(3);
  }
  function screen(name) { Log.setScreen(name); window.scrollTo(0, 0); }
  function ctx() { Log.setContext({ sid: S.sid, code: S.code, group: S.group, condition: S.condition, mode: S.assignMode, debug: DEBUG }); }

  function newState() {
    const lessons = {};
    for (let n = 1; n <= NL; n++) lessons[n] = { done: false, attempts: 0, graded: 0, correct: 0, startedAt: null, endedAt: null, seconds: 0 };
    return {
      v: 2, studyId: CFG.studyId, sid: uid(), code: makeCode(), nickname: "",
      group: null, condition: null, assignMode: null, createdAt: iso(), startedAt: null,
      shells: 0, shellsTotal: 0, streak: 0, combo: 0, maxCombo: 0, unlockedN: 1,
      lessons, practice: { started: 0, rounds: 0, cards: 0 },
      breaks: { n: 0, ms: 0 }, help: { opens: 0 }, coachSeen: {}, coachViews: 0,
      prompts: { shown: 0, continues: 0, firstAt: null, lastChoice: null },
      choices: [], msgIdx: {}, tourDone: false,
      ended: false, endReason: null, endedAt: null, surveyOpened: false, surveyDone: false
    };
  }

  function summary() {
    const secs = (a, b) => (a ? Math.round(((b ? Date.parse(b) : Date.now()) - Date.parse(a)) / 1000) : "");
    const s = {
      sid: S.sid, code: S.code, study_id: S.studyId, group: S.group, condition: S.condition, assign_mode: S.assignMode,
      started_at: S.startedAt, ended_at: S.endedAt || "", end_reason: S.endReason || "",
      lessons_completed: lessonsDone(),
      practice_rounds: S.practice.rounds, practice_cards: S.practice.cards,
      breaks_taken: S.breaks.n, break_seconds: Math.round(S.breaks.ms / 1000),
      help_opens: S.help.opens, coach_views: S.coachViews,
      prompts_shown: S.prompts.shown, prompt_continues: S.prompts.continues, final_choice: S.prompts.lastChoice || "",
      first_prompt_at: S.prompts.firstAt || "", seconds_after_first_prompt: S.prompts.firstAt ? secs(S.prompts.firstAt, S.endedAt) : "",
      choices: S.choices.join(">"),
      shells: gamified() ? S.shells : "", shells_total: gamified() ? S.shellsTotal : "", streak: gamified() ? S.streak : "", max_combo: S.maxCombo,
      session_seconds: secs(S.startedAt, S.endedAt),
      active_seconds: Math.round(Log.totals.active / 1000), idle_seconds: Math.round(Log.totals.idle / 1000), hidden_seconds: Math.round(Log.totals.hidden / 1000),
      survey_opened: S.surveyOpened, survey_done: S.surveyDone,
      user_agent: navigator.userAgent.slice(0, 200), updated_at: iso()
    };
    for (let n = 1; n <= NL; n++) {
      const l = S.lessons[n];
      s[`l${n}_acc`] = l.done && l.graded ? +(l.correct / l.graded).toFixed(3) : "";
      s[`l${n}_sec`] = l.done ? l.seconds : "";
    }
    return s;
  }
  const sendSummary = () => { if (S && S.group) Log.summary(summary()); };

  /* ------------------------------ rewards ------------------------------ */
  function addShells(k, why) {
    if (!gamified() || !k) return;
    S.shells += k; S.shellsTotal += k;
    const before = S.unlockedN;
    S.unlockedN = CFG.unlockAt.filter(t => S.shellsTotal >= t).length;
    save();
    const el = document.querySelector("#stat-shells b");
    if (el) { el.textContent = S.shells; el.parentElement.classList.remove("bump"); void el.offsetWidth; el.parentElement.classList.add("bump"); }
    if (S.unlockedN > before) {
      const item = breakItems()[S.unlockedN - 1];
      Log.log("unlock", { item: item.id, shells_total: S.shellsTotal, why });
      toast(`<span class="toast-ico">🔓</span><span>New ${mascot() ? "trick" : "animation"} unlocked: <b>${esc(item.title)}</b></span>`, "unlock");
    }
  }
  const breakItems = () => (mascot() ? Art.TRICKS : Art.NEUTRAL);
  const unlockedItems = () => (gamified() ? breakItems().slice(0, S.unlockedN) : breakItems());

  /* ------------------------------- boot -------------------------------- */
  function boot() {
    if (DEBUG && qs.get("reset") === "1") {
      localStorage.removeItem(STORE);
      const q = new URLSearchParams(location.search); q.delete("reset");
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
    }
    const saved = load();
    if (saved && saved.sid && saved.v === 2 && saved.studyId === CFG.studyId && saved.group) {
      S = saved; ctx(); applyTheme();
      if (S.ended) return S.surveyDone ? screenThanks() : screenEnd();
      Log.log("session_resumed", { lessons_completed: lessonsDone() });
      debugBar();
      return screenHome();
    }
    S = newState(); ctx();
    Log.log("page_load", { referrer: document.referrer.slice(0, 200), w: innerWidth, h: innerHeight });
    screenEligibility();
  }
  function applyTheme() { document.body.dataset.mascot = mascot() ? "1" : "0"; document.body.dataset.gamified = gamified() ? "1" : "0"; }

  if (CFG.logAllClicks) document.addEventListener("click", e => {
    const el = e.target.closest("button, a, [data-log]");
    if (!el || !S) return;
    Log.log("click", { el: el.dataset.log || el.id || el.className.split(" ")[0] || el.tagName, label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40) });
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (!S) return;
    Log.log(document.hidden ? "tab_hidden" : "tab_visible");
    if (document.hidden) { sendSummary(); Log.flush(true); }
  });

  /* --------------------------- eligibility ----------------------------- */
  function screenEligibility() {
    screen("eligibility");
    const t0 = now();
    $app.innerHTML = `
      <div class="shell narrow"><div class="card">
        <div class="brand">${Art.logo}<span>Pelan</span></div>
        <h1 class="h1">Before you start</h1>
        <p class="lead">Please answer three quick questions.</p>
        <div class="elig">${CFG.eligibility.map(q => `
          <fieldset class="elig-q"><legend>${esc(q.q)}</legend>
            <div class="seg">
              <label><input type="radio" name="${q.id}" value="yes"><span>Yes</span></label>
              <label><input type="radio" name="${q.id}" value="no"><span>No</span></label>
            </div></fieldset>`).join("")}
        </div>
        <button class="btn btn-primary" id="go" disabled>Continue</button>
      </div></div>`;
    const $go = $app.querySelector("#go");
    const answers = () => Object.fromEntries(CFG.eligibility.map(q => [q.id, ($app.querySelector(`input[name="${q.id}"]:checked`) || {}).value]));
    $app.querySelectorAll("input").forEach(i => i.onchange = () => { $go.disabled = Object.values(answers()).some(v => !v); });
    $go.onclick = () => {
      const a = answers(), ok = CFG.eligibility.every(q => a[q.id] === q.pass);
      Log.log("eligibility", { ...a, eligible: ok, dwell_ms: ms(t0) });
      if (!ok) { Log.flush(true); return info("Thank you", CFG.ineligibleHtml); }
      screenConsent();
    };
  }
  function info(title, html) {
    $app.innerHTML = `<div class="shell narrow"><div class="card"><div class="brand">${Art.logo}<span>Pelan</span></div><h1 class="h1">${esc(title)}</h1><div class="prose">${html}</div><p class="muted">You can close this tab now.</p></div></div>`;
  }

  /* ------------------------------ consent ------------------------------ */
  function screenConsent() {
    screen("consent");
    const t0 = now();
    $app.innerHTML = `
      <div class="shell narrow"><div class="card">
        <div class="brand">${Art.logo}<span>Pelan</span></div>
        <h1 class="h1">Consent information</h1>
        <div class="prose consent">${CFG.consentHtml}</div>
        <div class="btn-row">
          <button class="btn btn-primary" id="agree">I agree</button>
          <button class="btn btn-quiet" id="decline">I do not wish to participate</button>
        </div>
      </div></div>`;
    $app.querySelector("#agree").onclick = () => { Log.log("consent", { agreed: true, read_ms: ms(t0) }); screenNickname(); };
    $app.querySelector("#decline").onclick = () => { Log.log("consent", { agreed: false, read_ms: ms(t0) }); Log.flush(true); info("No problem", CFG.declineHtml); };
  }

  /* ----------------------- nickname + study code ----------------------- */
  function screenNickname() {
    screen("nickname");
    const t0 = now();
    $app.innerHTML = `
      <div class="shell narrow"><div class="card">
        <div class="brand">${Art.logo}<span>Pelan</span></div>
        <h1 class="h1">Let's get you set up</h1>
        <form id="f" autocomplete="off" novalidate>
          <label class="label" for="nick">What should we call you?</label>
          <input class="field" id="nick" maxlength="24" placeholder="A nickname">
          <p class="hint">Your nickname stays on this device. It is never saved with your answers.</p>
          <div class="code-box">
            <div class="code-label">Your study code</div>
            <div class="code" aria-label="Study code ${esc(S.code.split("").join(" "))}">${esc(S.code)}</div>
            <p class="hint">This code links your app activity to your survey without using your name. We'll show it again at the end.</p>
          </div>
          <button class="btn btn-primary" id="start" type="submit" disabled>Start</button>
        </form>
      </div></div>`;
    const $n = $app.querySelector("#nick"), $b = $app.querySelector("#start");
    $n.oninput = () => { $b.disabled = !$n.value.trim(); };
    $n.focus();
    $app.querySelector("#f").onsubmit = async ev => {
      ev.preventDefault(); if ($b.disabled || $b.dataset.busy) return;
      $b.dataset.busy = "1"; $b.disabled = true; $b.textContent = "Getting ready…";
      S.nickname = $n.value.trim().slice(0, 24);
      Log.log("nickname_set", { dwell_ms: ms(t0) });          // the nickname itself is not logged
      await startSession();
    };
  }

  /* ------------------------- random assignment ------------------------- */
  async function assignGroup() {
    const forced = parseInt(qs.get("group"), 10);
    if (DEBUG && forced >= 1 && forced <= 5) return { group: forced, mode: "debug" };
    if (Log.enabled) {
      try {
        const j = await Log.assign({ action: "assign", studyId: CFG.studyId, sid: S.sid, code: S.code, debug: DEBUG, userAgent: navigator.userAgent.slice(0, 200) }, 12000);
        if (j && j.ok && j.group >= 1 && j.group <= 5) return { group: j.group, mode: DEBUG ? "debug" : "server" };
        Log.log("assign_error", { response: j });
      } catch (err) { Log.log("assign_error", { error: String(err).slice(0, 200) }); }
    }
    return { group: 1 + rnd(5), mode: Log.enabled ? "local_fallback" : "local_no_backend" };
  }

  async function startSession() {
    const a = await assignGroup();
    S.group = a.group; S.assignMode = a.mode; S.condition = G().key; S.startedAt = iso();
    save(); ctx(); applyTheme();
    Log.log("session_start", { group: S.group, condition: S.condition, assign_mode: S.assignMode });
    sendSummary(); Log.flush();
    debugBar();
    screenIntro(0);
  }

  /* ----------------------------- onboarding ---------------------------- */
  function introSteps() {
    const how = `<ul class="howto">
      <li><span class="ico">📘</span><span><b>${NL} short lessons.</b> Finishing one unlocks the next.</span></li>
      ${gamified() ? `<li><span class="ico">🐚</span><span><b>Shells</b> for correct answers. Collect them to unlock new ${mascot() ? "tricks" : "animations"}.</span></li>
      <li><span class="ico">🔥</span><span>Your <b>streak</b> counts the lessons you finish in a row.</span></li>` : ""}
      <li><span class="ico">❓</span><span>Stuck? Tap <b>Help</b> in any lesson.</span></li>
      <li><span class="ico">🏁</span><span>Tap <b>Finish</b> whenever you're done. A short survey and quiz follow.</span></li></ul>`;
    return mascot() ? [
      { mood: "wave", html: `Nice to meet you, <b>${nick()}</b>! I'm Ollie. I live by the river, and I'll teach you a few words of <b>Pelan</b>, the river language.` },
      { mood: "talk", html: `Here's how it works:${how}` },
      { mood: "cheer", html: `Ready? Let me show you around!` }
    ] : [
      { html: `Welcome, <b>${nick()}</b>. In this app you'll learn a few words of <b>Pelan</b>, a made-up river language.` },
      { html: `Here's how it works:${how}` },
      { html: `Let's take a quick look around.` }
    ];
  }
  function screenIntro(i) {
    screen("onboarding_" + (i + 1));
    const steps = introSteps(), st = steps[i], t0 = now();
    $app.innerHTML = `
      <div class="shell narrow"><div class="card">
        ${mascot() ? "" : `<div class="brand">${Art.logo}<span>Pelan</span></div>`}
        ${speaker(st.html, st.mood, "hero")}
        <div class="dots" aria-hidden="true">${steps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
        <button class="btn btn-primary" id="next">${i === steps.length - 1 ? "Show me around" : "Continue"}</button>
      </div></div>`;
    $app.querySelector("#next").onclick = () => {
      Log.log("onboarding_step", { step: i + 1, dwell_ms: ms(t0) });
      i + 1 < steps.length ? screenIntro(i + 1) : screenHome();
    };
  }
  // Ollie with a speech bubble, or the same text in a plain panel
  function speaker(html, mood = "talk", cls = "") {
    return mascot()
      ? `<div class="talk ${cls}">${Art.ollie(mood)}<div class="bubble">${html}</div></div>`
      : `<div class="panel-note ${cls}">${html}</div>`;
  }

  /* --------------------------------- home ------------------------------ */
  function stats() {
    if (!gamified()) return `<span class="stat plain" id="stat-lessons">Lessons completed: <b>${lessonsDone()} of ${NL}</b></span>`;
    return `<span class="stat" id="stat-streak" title="Streak">🔥 <b>${S.streak}</b></span>
            <span class="stat" id="stat-shells" title="Shells">🐚 <b>${S.shells}</b></span>`;
  }
  function header() {
    return `<header class="topbar">
      <div class="brand small">${Art.logo}<span>Pelan</span></div>
      <div class="stats">${stats()}</div>
      <button class="btn-finish" id="btn-quit">Finish</button></header>`;
  }

  function screenHome() {
    screen("home");
    const done = lessonsDone(), nxt = nextLesson();
    const offsets = [0, -56, -20, 44, 56, 10];
    $app.innerHTML = `
      <div class="shell">
        ${header()}
        <section class="unit">
          <div><div class="unit-k">Unit 1</div><div class="unit-t">River words</div></div>
          ${gamified() ? `<div class="unit-prog"><div class="unit-bar"><i style="width:${(done / NL) * 100}%"></i></div><span>${done} of ${NL} lessons</span></div>` : ""}
        </section>
        <div class="path">
          ${P.lessons.map((L, i) => {
            const st = S.lessons[L.n].done ? "done" : L.n === nxt ? "current" : "locked";
            return `<button class="node ${st}" id="node-${L.n}" data-n="${L.n}" style="--x:${offsets[i]}px" ${st === "current" ? "" : "disabled"} aria-label="Lesson ${L.n}: ${esc(L.title)}${st === "locked" ? " (locked)" : st === "done" ? " (completed)" : ""}">
              <span class="node-c">${st === "done" ? "✓" : st === "locked" ? "🔒" : L.n}</span>
              <span class="node-l"><b>Lesson ${L.n}</b><small>${esc(L.title)}</small></span></button>`;
          }).join("")}
          ${mascot() ? `<div class="path-ollie">${Art.ollie(done ? "cheer" : "wave")}</div>` : ""}
        </div>
        ${done ? `<div class="side-acts">
          <button class="act" id="home-practice"><span class="act-i">🃏</span><span><b>Extra practice</b><small>Flashcards with words you know</small></span></button>
          <button class="act" id="home-break"><span class="act-i">${mascot() ? "🦦" : "🌊"}</span><span><b>Take a break</b><small>${mascot() ? "Watch Ollie do a trick" : "Watch a short animation"}</small></span></button>
        </div>` : ""}
      </div>`;
    $app.querySelector("#btn-quit").onclick = () => attemptQuit("home");
    $app.querySelectorAll(".node.current").forEach(b => b.onclick = () => { S.choices.push("L" + b.dataset.n); save(); screenLessonIntro(+b.dataset.n); });
    const hp = $app.querySelector("#home-practice"), hb = $app.querySelector("#home-break");
    if (hp) hp.onclick = () => { S.choices.push("practice"); save(); startPractice("home"); };
    if (hb) hb.onclick = () => { S.choices.push("break"); save(); screenBreak("home"); };
    if (!S.tourDone) setTimeout(runTour, 250);
  }

  /* -------------------------------- tour ------------------------------- */
  function runTour() {
    const steps = [
      { t: "#node-1", text: "This is your <b>lesson map</b>. Start with Lesson 1. Each lesson you finish unlocks the next one." },
      gamified() ? { t: ".stats", text: "Your <b>streak</b> 🔥 and <b>shells</b> 🐚 show up here." }
                 : { t: ".stats", text: "Your progress shows up here." },
      { t: "#btn-quit", text: "Tap <b>Finish</b> whenever you want to stop. A short survey and quiz follow." },
      { t: "#node-1", text: "That's it. Tap <b>Lesson 1</b> to begin." }
    ];
    let i = 0, tStep = now();
    const tStart = now();
    const layer = document.createElement("div");
    layer.className = "tour-layer";
    document.body.appendChild(layer);
    Log.log("tour_start");
    function place() {
      const st = steps[i], el = document.querySelector(st.t);
      if (!el) return finish(true);
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const r = el.getBoundingClientRect(), pad = 8, last = i === steps.length - 1;
      layer.innerHTML = `
        <div class="tour-spot" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
        <div class="tour-tip" role="dialog" aria-live="polite">
          ${mascot() ? Art.ollie("talk") : Art.logo}
          <div class="tour-text">${st.text}</div>
          <div class="tour-actions"><span class="tour-dots">${i + 1} of ${steps.length}</span>
            <button class="btn btn-primary btn-sm" id="tour-next">${last ? "Got it" : "Next"}</button></div>
        </div>`;
      const tip = layer.querySelector(".tour-tip"), th = tip.offsetHeight, tw = tip.offsetWidth;
      let top = r.bottom + pad + 14;
      if (top + th > innerHeight - 12) top = Math.max(12, r.top - pad - 14 - th);
      tip.style.top = top + "px";
      tip.style.left = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), innerWidth - tw - 12) + "px";
      layer.querySelector("#tour-next").onclick = next;
    }
    function next() {
      Log.log("tour_step", { step: i + 1, dwell_ms: ms(tStep) });
      i++; tStep = now();
      i < steps.length ? place() : finish(false);
    }
    function finish(aborted) {
      removeEventListener("resize", place); layer.remove();
      S.tourDone = true; save();
      Log.log("tour_complete", { total_ms: ms(tStart), aborted }); sendSummary();
    }
    addEventListener("resize", place);
    place();
  }

  /* ---------------------------- lesson intro --------------------------- */
  function screenLessonIntro(n) {
    screen("lesson_intro_" + n);
    const L = P.lessons[n - 1], t0 = now();
    $app.innerHTML = `
      <div class="shell narrow"><div class="card">
        <div class="lesson-badge">Lesson ${n} of ${NL}</div>
        <h1 class="h1">${esc(L.title)}</h1>
        ${speaker(mascot() ? `In this lesson: ${esc(L.goal.charAt(0).toLowerCase() + L.goal.slice(1))} It takes about 3 minutes. You can tap <b>Help</b> any time.`
                           : `${esc(L.goal)} It takes about 3 minutes. Tap <b>Help</b> any time if you get stuck.`, "talk")}
        <div class="btn-row">
          <button class="btn btn-primary" id="go">Start lesson</button>
          <button class="btn btn-quiet" id="back">Back to lesson map</button>
        </div>
      </div></div>`;
    $app.querySelector("#go").onclick = () => { Log.log("lesson_intro", { lesson: n, dwell_ms: ms(t0) }); startLesson(n); };
    $app.querySelector("#back").onclick = () => { Log.log("lesson_intro_back", { lesson: n }); screenHome(); };
  }

  /* ---------------------------- round runner --------------------------- */
  const TYPES = {
    intro:     { label: "New word",          tone: "river", how: "Look at the picture and read the new word. Then press Continue." },
    rule:      { label: "Grammar tip",       tone: "amber", how: "Read the tip and the examples. Then press Continue." },
    pick_pic:  { label: "Pick the picture",  tone: "amber", how: "Tap the picture that matches the Pelan word. Then press Check." },
    pick_text: { label: "Choose the answer", tone: "plum",  how: "Tap the right answer from the list. Then press Check." },
    match:     { label: "Match the pairs",   tone: "rose",  how: "Tap a Pelan word on the left, then tap its meaning on the right. Matched pairs fade out. Match them all to finish." },
    build:     { label: "Build the phrase",  tone: "kelp",  how: "Tap the word tiles in the right order to build the phrase. Tap a tile again to take it back. Then press Check." },
    type:      { label: "Type it",           tone: "ink",   how: "Type the answer in Pelan with your keyboard. Then press Check or Enter." },
    judge:     { label: "Right or wrong?",   tone: "coral", how: "Read the Pelan phrase. Is it correct for the meaning shown? Tap Yes or No, then press Check." },
    flash:     { label: "Flashcard",         tone: "river", how: "Try to remember what the word means, then tap Show answer. Tap “I knew it” or “Still learning”." }
  };
  const COACH = ["pick_pic", "pick_text", "match", "build", "type", "judge", "flash"];

  function startLesson(n) {
    const L = P.lessons[n - 1], l = S.lessons[n];
    l.attempts++; l.startedAt = iso(); l.graded = 0; l.correct = 0;
    R = { kind: "lesson", n, id: "L" + n + (l.attempts > 1 ? "-" + l.attempts : ""), queue: L.items.map(x => ({ ...x })), pos: 0, graded: 0, correct: 0, shells: 0, t0: Date.now() };
    save();
    Log.log("round_start", { round: R.id, kind: "lesson", lesson: n, n_items: R.queue.length });
    renderStep();
  }

  function renderStep() {
    const it = R.queue[R.pos], T = TYPES[it.type];
    screen(R.kind === "lesson" ? "lesson_" + R.n : "practice");
    const total = R.queue.length, pct = (R.pos / total) * 100;
    $app.innerHTML = `
      <div class="shell lesson">
        <div class="lesson-top">
          <button class="x-btn" id="btn-x" aria-label="Finish session">✕</button>
          <div class="river" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${R.pos}" aria-label="Lesson progress">
            <div class="river-fill" style="width:${pct}%"></div>
            <div class="river-shell" style="left:${pct}%">🐚</div>
          </div>
          <span class="count">${R.pos + 1}/${total}</span>
          <button class="help-btn" id="btn-help" aria-label="Help">?<span>Help</span></button>
        </div>
        ${gamified() && R.kind === "lesson" ? `<div class="combo ${S.combo >= 2 ? "on" : ""}" id="combo">🔥 ${S.combo} in a row</div>` : ""}
        <div class="type-tag tone-${T.tone}"><b>${T.label}</b><span>${T.how.split(". ")[0]}.</span></div>
        <div class="lesson-body" id="body"></div>
        <div class="lesson-foot" id="foot"></div>
      </div>`;
    $app.querySelector("#btn-x").onclick = () => attemptQuit(R.kind === "lesson" ? "mid_lesson" : "mid_practice");
    $app.querySelector("#btn-help").onclick = () => openHelp(it);
    const view = RENDER[it.type](it);
    let tShown = now();
    const $foot = $app.querySelector("#foot");

    if (COACH.includes(it.type) && !S.coachSeen[it.type]) {
      coach(it.type, () => { tShown = now(); });
    }

    if (!view.graded) {
      if (view.custom) return;
      $foot.innerHTML = `<button class="btn btn-primary" id="cont">Continue</button>`;
      $foot.querySelector("#cont").onclick = () => { Log.log("item_view", { round: R.id, item: it.id, type: it.type, dwell_ms: ms(tShown) }); advance(); };
      return;
    }
    if (view.auto) { view.onDone = res => grade(it, res, tShown); return; }
    $foot.innerHTML = `<button class="btn btn-primary" id="check" disabled>Check</button>`;
    const $check = $foot.querySelector("#check");
    view.onChange = ready => { $check.disabled = !ready; };
    $check.onclick = () => grade(it, view.result(), tShown);
  }

  function grade(it, res, tShown) {
    const latency = ms(tShown), lesson = R.kind === "lesson";
    R.graded++; if (res.correct) R.correct++;
    if (lesson && !it.retry) { const l = S.lessons[R.n]; l.graded++; if (res.correct) l.correct++; }
    S.combo = res.correct ? S.combo + 1 : 0; S.maxCombo = Math.max(S.maxCombo, S.combo);
    Log.log("item_answer", { round: R.id, item: it.id, type: it.type, retry: !!it.retry, answer: res.answer, correct_answer: res.expected,
      correct: res.correct, latency_ms: latency, combo: S.combo, ...(res.extra || {}) });
    if (res.correct) { addShells(CFG.shellsPerCorrect, "correct"); R.shells += gamified() ? CFG.shellsPerCorrect : 0; }
    if (lesson && !res.correct && !it.retry && it.type !== "match") R.queue.push({ ...it, id: it.id + "-retry", retry: true });
    save();

    const cb = $app.querySelector("#combo");
    if (cb) { cb.textContent = `🔥 ${S.combo} in a row`; cb.classList.toggle("on", S.combo >= 2); }
    if (res.correct && S.combo > 0 && S.combo % CFG.comboEvery === 0) comboPop();

    $app.querySelectorAll("#body button, #body input").forEach(el => el.disabled = true);
    const praise = ["Correct!", "Nice!", "You got it!", "Well done!"][rnd(4)];
    const shown = it.type === "judge" ? (it.answer ? "Yes, it's correct" : "No, it's wrong") : res.expected;
    $app.querySelector("#foot").innerHTML = `
      <div class="feedback ${res.correct ? "ok" : "no"}" role="status">
        <div class="fb-title">${res.correct ? "✓ " + praise : "✗ Not quite"}</div>
        <div class="fb-body">${!res.correct ? `Correct answer: <b>${esc(shown)}</b>${it.explain ? "<br>" + esc(it.explain) : ""}${lesson && !it.retry && it.type !== "match" ? `<br><span class="muted">You'll see this one again at the end.</span>` : ""}`
                                            : (it.explain && it.type === "judge" ? esc(it.explain) : "")}</div>
        <button class="btn ${res.correct ? "btn-ok" : "btn-no"}" id="cont">Continue</button>
      </div>`;
    const tFb = now();
    const $c = $app.querySelector("#cont");
    $c.onclick = () => { Log.log("feedback_continue", { round: R.id, item: it.id, correct: res.correct, dwell_ms: ms(tFb) }); advance(); };
    $c.focus({ preventScroll: true });
  }

  function advance() { R.pos++; R.pos >= R.queue.length ? (R.kind === "lesson" ? finishLesson() : finishPractice()) : renderStep(); }

  /* -------------------- combo pop-up and toasts --------------------- */
  function comboPop() {
    const list = msgSet().combo, i = (S.msgIdx.combo = (S.msgIdx.combo || 0) + 1) - 1;
    const text = fill(list[i % list.length]);
    Log.log("combo_pop", { n: S.combo, msg: i % list.length, text });
    if (mascot()) toast(`${Art.ollieHead("joy")}<span>${esc(text)}</span>`, "combo ollie-pop");
    else toast(`<span class="toast-ico">${gamified() ? "🔥" : "✓"}</span><span>${esc(text)}</span>`, "combo");
  }
  function toast(html, cls = "") {
    const t = document.createElement("div");
    t.className = "toast " + cls; t.setAttribute("role", "status"); t.innerHTML = html;
    $toast.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2800);
    setTimeout(() => t.remove(), 3300);
  }

  /* ------------------------ coach and help panel ------------------------ */
  function coach(type, onClose) {
    const T = TYPES[type], t0 = now();
    S.coachSeen[type] = true; S.coachViews++; save();
    const sheet = document.createElement("div");
    sheet.className = "overlay";
    sheet.innerHTML = `
      <div class="sheet coach" role="dialog" aria-modal="true" aria-labelledby="coach-t">
        <div class="type-tag tone-${T.tone}"><b>${T.label}</b><span>New kind of question</span></div>
        <h2 class="h2" id="coach-t">How this works</h2>
        ${speaker(esc(T.how), "talk", "compact")}
        ${demo(type)}
        <button class="btn btn-primary" id="coach-ok">Got it</button>
      </div>`;
    $modal.appendChild(sheet);
    sheet.querySelector("#coach-ok").focus();
    sheet.querySelector("#coach-ok").onclick = () => { Log.log("coach_view", { type, dwell_ms: ms(t0) }); sheet.remove(); onClose && onClose(); };
  }
  // small static demos so first-time users can see the interaction
  function demo(type) {
    const chip = (t, c = "") => `<span class="d-chip ${c}">${t}</span>`;
    switch (type) {
      case "match": return `<div class="demo"><div class="d-col">${chip("mira", "sel")}${chip("kelo")}</div><div class="d-arrow">→</div><div class="d-col">${chip("shell")}${chip("fish", "sel")}</div></div>`;
      case "build": return `<div class="demo col"><div class="d-line">${chip("tavo")}${chip("velo")}</div><div class="d-bank">${chip("mira")}${chip("vela")}</div></div>`;
      case "type":  return `<div class="demo"><span class="d-input">mira<i></i></span></div>`;
      case "judge": return `<div class="demo">${chip("👍 Yes")}${chip("👎 No")}</div>`;
      case "flash": return `<div class="demo">${chip("kelo", "card")}<div class="d-arrow">↻</div>${chip("shell", "card")}</div>`;
      default: return "";
    }
  }
  function openHelp(it) {
    if ($modal.querySelector(".help")) return;
    const T = TYPES[it.type], t0 = now();
    S.help.opens++; save();
    Log.log("help_open", { round: R && R.id, item: it.id, type: it.type });
    const gl = P.glossary(R && R.kind === "lesson" ? R.n - 1 : lessonsDone());
    const sheet = document.createElement("div");
    sheet.className = "overlay";
    sheet.innerHTML = `
      <div class="sheet help" role="dialog" aria-modal="true" aria-labelledby="help-t">
        <div class="sheet-head"><h2 class="h2" id="help-t">Help</h2><button class="x-btn" id="help-x" aria-label="Close help">✕</button></div>
        <div class="tabs" role="tablist">
          <button role="tab" class="tab on" data-tab="how">How to answer</button>
          <button role="tab" class="tab" data-tab="words">Word list</button>
        </div>
        <div class="tab-body" data-body="how">
          <div class="type-tag tone-${T.tone}"><b>${T.label}</b></div>
          ${speaker(esc(T.how) + (it.hint ? `<br><br>Hint: ${esc(it.hint)}` : ""), "think", "compact")}
          <p class="muted">Pelan rule: describing words come <b>after</b> the thing-word and copy its ending (-a or -o).</p>
        </div>
        <div class="tab-body" data-body="words" hidden>
          <ul class="gloss-list">${gl.map(g => `<li>${Art.icon(g.pic)}<b>${esc(g.word)}</b><span>${esc(g.en)}</span></li>`).join("")}</ul>
        </div>
        <button class="btn btn-primary" id="help-ok">Back to the question</button>
      </div>`;
    $modal.appendChild(sheet);
    const close = () => { Log.log("help_close", { item: it.id, dwell_ms: ms(t0) }); sheet.remove(); };
    sheet.querySelector("#help-x").onclick = close;
    sheet.querySelector("#help-ok").onclick = close;
    sheet.querySelectorAll(".tab").forEach(b => b.onclick = () => {
      sheet.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b));
      sheet.querySelectorAll(".tab-body").forEach(x => { x.hidden = x.dataset.body !== b.dataset.tab; });
      Log.log("help_tab", { tab: b.dataset.tab, item: it.id });
    });
  }

  /* ------------------------- lesson complete --------------------------- */
  function finishLesson() {
    const r = R; R = null;
    const l = S.lessons[r.n];
    l.done = true; l.endedAt = iso(); l.seconds = Math.round((Date.now() - r.t0) / 1000);
    addShells(CFG.shellsPerLesson, "lesson"); if (gamified()) r.shells += CFG.shellsPerLesson;
    if (gamified()) S.streak = lessonsDone();
    save();
    Log.log("round_complete", { round: r.id, kind: "lesson", lesson: r.n, graded: r.graded, correct: r.correct, first_try_correct: l.correct, first_try_graded: l.graded, seconds: l.seconds, shells: r.shells, streak: S.streak });
    sendSummary(); Log.flush();
    screenComplete(r);
  }

  function screenComplete(r) {
    screen("lesson_complete_" + r.n);
    const l = S.lessons[r.n], acc = l.graded ? Math.round((l.correct / l.graded) * 100) : 100;
    const mins = Math.floor(l.seconds / 60), secs = String(l.seconds % 60).padStart(2, "0");
    const hero = mascot() ? `<div class="celebrate ollie-dance">${Art.ollie("cheer")}</div>`
               : gamified() ? `<div class="celebrate burst"><span>🐚</span><i></i><i></i><i></i><i></i><i></i><i></i></div>`
               : `<div class="celebrate check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27 l8 8 l15 -16"/></svg></div>`;
    $app.innerHTML = `
      <div class="shell narrow"><div class="card center">
        ${hero}
        <h1 class="h1">${mascot() ? `Yay, ${nick()}! Lesson ${r.n} done!` : `Lesson ${r.n} complete`}</h1>
        <p class="lead">${esc(P.lessons[r.n - 1].title)}</p>
        <div class="tiles">
          <div class="tile-stat"><span>Accuracy</span><b>${acc}%</b></div>
          <div class="tile-stat"><span>Time</span><b>${mins}:${secs}</b></div>
          ${gamified() ? `<div class="tile-stat shells"><span>Shells</span><b>+${r.shells} 🐚</b></div>
          <div class="tile-stat streak"><span>Streak</span><b>🔥 ${S.streak}</b></div>` : ""}
        </div>
        <button class="btn btn-primary" id="cont">Continue</button>
      </div></div>`;
    if (gamified()) confetti();
    $app.querySelector("#cont").onclick = () => screenChoice("after_lesson");
  }
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    const cols = ["#1F7A8C", "#F2B544", "#E58A8F", "#2F9461", "#7A5BA8"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.style.left = rnd(100) + "%"; p.style.background = cols[i % cols.length];
      p.style.animationDelay = (rnd(600) / 1000) + "s"; p.style.transform = `rotate(${rnd(360)}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3200);
  }

  /* ---------------------- choice point (IRB Step 3) ---------------------- */
  function screenChoice(context) {
    screen("choice");
    const nxt = nextLesson(), L = nxt ? P.lessons[nxt - 1] : null, t0 = now();
    const key = nxt ? "between" : "allDone", list = msgSet()[key];
    const i = (S.msgIdx[key] = (S.msgIdx[key] || 0) + 1) - 1;
    const text = fill(list[i % list.length]);
    Log.log("reminder_shown", { context, kind: key, msg: i % list.length, text });
    $app.innerHTML = `
      <div class="shell narrow">
        ${header()}
        ${speaker(esc(text), G().framing === "pressure" ? "worried" : "talk", "reminder " + (G().framing === "pressure" ? "pressure" : ""))}
        <h2 class="h2">What would you like to do next?</h2>
        <div class="choices">
          ${L ? `<button class="act primary" data-c="next"><span class="act-i">📘</span><span><b>Start Lesson ${nxt}</b><small>${esc(L.title)}</small></span></button>` : ""}
          <button class="act" data-c="practice"><span class="act-i">🃏</span><span><b>Extra practice</b><small>Flashcards with words you know</small></span></button>
          <button class="act" data-c="break"><span class="act-i">${mascot() ? "🦦" : "🌊"}</span><span><b>Take a break</b><small>${mascot() ? "Watch Ollie do a trick" : "Watch a short animation"}</small></span></button>
          <button class="act quiet" data-c="finish"><span class="act-i">🏁</span><span><b>Finish session</b><small>Go to the survey and quiz</small></span></button>
        </div>
        <button class="btn btn-quiet" id="to-map">Lesson map</button>
      </div>`;
    $app.querySelector("#btn-quit").onclick = () => attemptQuit("choice");
    $app.querySelector("#to-map").onclick = () => { Log.log("choice_made", { context, choice: "map", decide_ms: ms(t0) }); screenHome(); };
    $app.querySelectorAll(".choices .act").forEach(b => b.onclick = () => {
      const c = b.dataset.c;
      Log.log("choice_made", { context, choice: c, decide_ms: ms(t0), lessons_completed: lessonsDone() });
      if (c !== "finish") { S.choices.push(c === "next" ? "L" + nxt : c); save(); }
      if (c === "next") screenLessonIntro(nxt);
      else if (c === "practice") startPractice("choice");
      else if (c === "break") screenBreak("choice");
      else attemptQuit("choice");
    });
  }

  /* --------------------------- flashcards ---------------------------- */
  function startPractice(from) {
    const items = P.practice(lessonsDone(), CFG.practiceLength);
    S.practice.started++;
    R = { kind: "practice", id: "P" + S.practice.started, queue: items, pos: 0, graded: 0, correct: 0, shells: 0, t0: Date.now(), knew: 0 };
    save();
    Log.log("round_start", { round: R.id, kind: "practice", from, n_items: items.length, items: items.map(x => x.word) });
    renderStep();
  }
  function finishPractice() {
    const r = R; R = null;
    S.practice.rounds++; S.practice.cards += r.queue.length;
    addShells(CFG.shellsPerPractice, "practice"); if (gamified()) r.shells += CFG.shellsPerPractice;
    save();
    Log.log("round_complete", { round: r.id, kind: "practice", knew: r.knew, n: r.queue.length, seconds: Math.round((Date.now() - r.t0) / 1000), shells: r.shells });
    sendSummary(); Log.flush();
    if (S.practice.rounds >= CFG.maxPracticeRounds) return endSession("max_rounds", "practice");
    screen("practice_complete");
    $app.innerHTML = `
      <div class="shell narrow"><div class="card center">
        ${mascot() ? `<div class="celebrate">${Art.ollie("shell")}</div>` : ""}
        <h1 class="h1">Practice round done</h1>
        <p class="lead">You knew ${r.knew} of ${r.queue.length} cards.${gamified() ? ` +${r.shells} 🐚` : ""}</p>
        <button class="btn btn-primary" id="cont">Continue</button>
      </div></div>`;
    $app.querySelector("#cont").onclick = () => screenChoice("after_practice");
  }

  /* ------------------------------ break ------------------------------ */
  function screenBreak(from, prevId) {
    screen("break");
    const items = unlockedItems(), pool = items.length > 1 ? items.filter(x => x.id !== prevId) : items;
    const item = pool[rnd(pool.length)], all = breakItems(), t0 = now();
    S.breaks.n++; save();
    Log.log("break_start", { item: item.id, from, unlocked: items.length });
    $app.innerHTML = `
      <div class="shell narrow">
        ${header()}
        <div class="card center break-card">
          <h1 class="h1">${mascot() ? `Ollie's ${esc(item.title.toLowerCase())}!` : esc(item.title)}</h1>
          <div class="stage">${mascot() ? Art.trick(item.id) : Art.neutralAnim(item.id)}</div>
          ${gamified() ? `<div class="collection" aria-label="Collection">
            ${all.map((x, k) => `<span class="coll ${k < S.unlockedN ? "have" : ""}" title="${esc(x.title)}">${k < S.unlockedN ? esc(x.title) : `🔒 ${CFG.unlockAt[k]} 🐚`}</span>`).join("")}
          </div>` : ""}
          <div class="btn-row">
            <button class="btn btn-primary" id="back">Back to learning</button>
            ${items.length > 1 ? `<button class="btn btn-quiet" id="again">Watch another</button>` : ""}
          </div>
        </div>
      </div>`;
    const end = how => { const d = ms(t0); S.breaks.ms += d; save(); Log.log("break_end", { item: item.id, watch_ms: d, how }); };
    $app.querySelector("#btn-quit").onclick = () => { end("quit"); attemptQuit("break"); };
    $app.querySelector("#back").onclick = () => { end("back"); screenChoice("after_break"); };
    const ag = $app.querySelector("#again");
    if (ag) ag.onclick = () => { end("another"); S.choices.push("break"); screenBreak("again", item.id); };
  }

  /* ----------------------------- exercises ----------------------------- */
  const body = () => $app.querySelector("#body");
  const RENDER = {
    intro(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.kicker || "New word")}</div>
        <div class="intro-card">
          <div class="intro-pics">${it.pics.map((p, i) => `<figure>${Art.icon(p)}${it.captions ? `<figcaption>${esc(it.captions[i])}</figcaption>` : ""}</figure>`).join("")}</div>
          <div class="bigword">${esc(it.word)}</div>
          <div class="gloss">${esc(it.en)}</div>
        </div>`;
      return { graded: false };
    },
    rule(it) {
      const hl = w => esc(w).replace(/a\b/g, '<span class="end-a">a</span>').replace(/o\b/g, '<span class="end-o">o</span>');
      body().innerHTML = `
        <div class="q-title">${esc(it.title)}</div>
        ${speaker(it.lines.join("<br>"), "talk", "compact")}
        <div class="rule-card"><table class="rule-table">${it.examples.map(e => `<tr><td>${hl(e[0])}</td><td>${hl(e[1])}</td><td>${esc(e[2])}</td></tr>`).join("")}</table></div>`;
      return { graded: false };
    },
    pick_pic(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        <div class="grid ${it.options.length === 3 ? "three" : ""}">
          ${it.options.map((o, i) => `<button class="tile" data-k="${esc(o.key)}" aria-label="Picture option ${i + 1}">${Art.icon(o.pic)}</button>`).join("")}
        </div>`;
      return single(it, ".tile");
    },
    pick_text(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        ${it.big ? `<div class="phrase-card"><div class="bigword">${esc(it.big)}</div></div>` : ""}
        <div class="options">${it.options.map((o, i) => `<button class="opt" data-k="${esc(o)}"><span class="opt-n">${i + 1}</span>${esc(o)}</button>`).join("")}</div>`;
      return single(it, ".opt");
    },
    judge(it) {
      body().innerHTML = `
        <div class="q-title">Is this correct Pelan for “${esc(it.en)}”?</div>
        <div class="phrase-card"><div class="bigword">${esc(it.phrase)}</div></div>
        <div class="yn"><button class="opt" data-k="yes">👍 Yes</button><button class="opt" data-k="no">👎 No</button></div>`;
      return single({ ...it, answer: it.answer ? "yes" : "no" }, ".opt");
    },
    type(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        <div class="intro-card slim"><div class="intro-pics">${it.pics.map(p => Art.icon(p)).join("")}</div></div>
        <input class="field type-in" id="typed" placeholder="Type in Pelan" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" aria-label="Your answer">`;
      const $in = body().querySelector("#typed"), t0 = now(), keys = [];
      let backspaces = 0, pastes = 0, firstKey = null;
      // keystroke log for this answer field only (never for the nickname field)
      $in.addEventListener("keydown", e => {
        const t = ms(t0); if (firstKey === null) firstKey = t;
        if (e.key === "Backspace" || e.key === "Delete") backspaces++;
        if (keys.length < 150) keys.push([t, e.key.length === 1 ? e.key : e.key.slice(0, 10)]);
      });
      $in.addEventListener("paste", () => { pastes++; });
      const v = { graded: true, result: () => ({ answer: $in.value, expected: it.answer, correct: norm($in.value) === norm(it.answer),
        extra: { keys, n_keys: keys.length, backspaces, pastes, first_key_ms: firstKey } }) };
      $in.oninput = () => v.onChange && v.onChange(norm($in.value).length > 0);
      $in.onkeydown = e => { if (e.key === "Enter" && norm($in.value)) { e.preventDefault(); $app.querySelector("#check")?.click(); } };
      setTimeout(() => { if (!$modal.querySelector(".overlay")) $in.focus({ preventScroll: true }); }, 50);
      return v;
    },
    build(it) {
      const bank = it.bank.map((w, i) => ({ w, i }));
      let chosen = [], taps = 0;
      body().innerHTML = `
        <div class="q-title">Translate: “${esc(it.en)}”</div>
        <div class="build-target" id="tgt" aria-label="Your answer"><span class="build-ph">Tap tiles below</span></div>
        <div class="bank" id="bank"></div>`;
      const v = { graded: true, result: () => { const a = chosen.map(i => bank[i].w).join(" "); return { answer: a, expected: it.answer, correct: norm(a) === norm(it.answer), extra: { taps } }; } };
      const draw = () => {
        const $t = body().querySelector("#tgt");
        $t.innerHTML = chosen.length ? chosen.map(i => `<button class="chip" data-i="${i}">${esc(bank[i].w)}</button>`).join("") : `<span class="build-ph">Tap tiles below</span>`;
        body().querySelector("#bank").innerHTML = bank.map(b => `<button class="chip ${chosen.includes(b.i) ? "placeholder" : ""}" data-i="${b.i}" ${chosen.includes(b.i) ? 'tabindex="-1" aria-hidden="true"' : ""}>${esc(b.w)}</button>`).join("");
        body().querySelectorAll("#tgt .chip").forEach(c => c.onclick = () => { taps++; chosen = chosen.filter(i => i !== +c.dataset.i); draw(); });
        body().querySelectorAll("#bank .chip:not(.placeholder)").forEach(c => c.onclick = () => { taps++; chosen.push(+c.dataset.i); draw(); });
        v.onChange && v.onChange(chosen.length > 0);
      };
      setTimeout(draw, 0);
      return v;
    },
    match(it) {
      const left = it.pairs.map(p => p[0]), right = it.rightOrder || it.pairs.map(p => p[1]);
      const ans = Object.fromEntries(it.pairs);
      let selL = null, selR = null, mistakes = 0, matched = 0;
      body().innerHTML = `
        <div class="q-title">Tap the matching pairs</div>
        <div class="match"><div class="col"><div class="col-h">Pelan</div>${left.map(w => `<button class="chip pel" data-side="L" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
        <div class="col"><div class="col-h">English</div>${right.map(w => `<button class="chip" data-side="R" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div></div>`;
      const v = { graded: true, auto: true };
      $app.querySelector("#foot").innerHTML = `<div class="foot-note" id="mcount">0 of ${left.length} pairs matched</div>`;
      const t0 = now();
      body().querySelectorAll(".chip").forEach(c => c.onclick = () => {
        if (c.classList.contains("gone")) return;
        const side = c.dataset.side;
        body().querySelectorAll(`.chip[data-side="${side}"]`).forEach(x => x.classList.remove("sel"));
        c.classList.add("sel");
        if (side === "L") selL = c; else selR = c;
        if (selL && selR) {
          const a = selL, b = selR; selL = selR = null;
          if (ans[a.dataset.w] === b.dataset.w) {
            [a, b].forEach(x => { x.classList.remove("sel"); x.classList.add("good"); });
            setTimeout(() => [a, b].forEach(x => { x.classList.remove("good"); x.classList.add("gone"); x.disabled = true; }), 260);
            matched++;
            const mc = $app.querySelector("#mcount"); if (mc) mc.textContent = `${matched} of ${left.length} pairs matched`;
            if (matched === left.length) setTimeout(() => v.onDone({ answer: `${matched} pairs`, expected: "all pairs", correct: mistakes === 0, extra: { mistakes, match_ms: ms(t0) } }), 420);
          } else {
            mistakes++;
            Log.log("match_miss", { round: R.id, item: it.id, left: a.dataset.w, right: b.dataset.w });
            [a, b].forEach(x => { x.classList.remove("sel"); x.classList.add("bad"); });
            setTimeout(() => [a, b].forEach(x => x.classList.remove("bad")), 450);
          }
        }
      });
      return v;
    },
    flash(it) {
      body().innerHTML = `
        <div class="q-title">What does this mean?</div>
        <div class="flash" id="card"><div class="flash-in">
          <div class="flash-f"><div class="bigword">${esc(it.word)}</div></div>
          <div class="flash-b">${it.pics.map(p => Art.icon(p)).join("")}<div class="bigword sm">${esc(it.word)}</div><div class="gloss">${esc(it.en)}</div></div>
        </div></div>`;
      const $f = $app.querySelector("#foot"), t0 = now();
      $f.innerHTML = `<button class="btn btn-primary" id="flip">Show answer</button>`;
      $f.querySelector("#flip").onclick = () => {
        const tf = ms(t0), t1 = now();
        body().querySelector("#card").classList.add("flipped");
        Log.log("flash_flip", { round: R.id, item: it.id, word: it.word, front_ms: tf });
        $f.innerHTML = `<div class="btn-pair"><button class="btn btn-quiet" id="learn">Still learning</button><button class="btn btn-ok" id="knew">I knew it</button></div>`;
        const rate = knew => { if (knew) R.knew++; Log.log("flash_rate", { round: R.id, item: it.id, word: it.word, knew, back_ms: ms(t1) }); advance(); };
        $f.querySelector("#knew").onclick = () => rate(true);
        $f.querySelector("#learn").onclick = () => rate(false);
      };
      return { graded: false, custom: true };
    }
  };
  function single(it, sel) {
    let picked = null, changes = 0;
    const v = { graded: true, result: () => ({ answer: picked, expected: it.answer, correct: picked === it.answer, extra: { changes } }) };
    body().querySelectorAll(sel).forEach(b => b.onclick = () => {
      body().querySelectorAll(sel).forEach(x => { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("sel"); b.setAttribute("aria-pressed", "true");
      if (picked !== null && picked !== b.dataset.k) changes++;
      picked = b.dataset.k; v.onChange && v.onChange(true);
    });
    return v;
  }

  /* --------------------- quit prompt (the reminders) --------------------- */
  function attemptQuit(context) {
    if ($modal.querySelector(".prompt-card")) return;
    const set = msgSet();
    const ok = q => !((/\{streak\}/.test(q.title + (q.body || "")) && !S.streak) || (/\{shells\}/.test(q.title + (q.body || "")) && !S.shells));
    const idx = (S.msgIdx.quit = (S.msgIdx.quit || 0) + 1) - 1;
    const cands = set.quit.map((q, k) => ({ q, k })).filter(x => ok(x.q));
    const pickd = cands.length ? cands[idx % cands.length] : { q: set.quitEarly || { title: set.quit[0].title, art: set.quit[0].art }, k: "early" };
    const q = pickd.q, title = fill(q.title), bodyTxt = q.body ? fill(q.body) : "";
    S.prompts.shown++; S.prompts.firstAt = S.prompts.firstAt || iso(); save();
    Log.log("prompt_shown", { context, n: S.prompts.shown, msg: pickd.k, title, body: bodyTxt, shells: S.shells, streak: S.streak,
      round: R ? R.id : null, round_pos: R ? R.pos : null, lessons_completed: lessonsDone() });
    sendSummary();
    const t0 = now();
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = `
      <div class="prompt-card ${mascot() ? "has-ollie" : ""} ${G().framing}" role="dialog" aria-modal="true" aria-labelledby="p-title">
        ${mascot() ? Art.ollie(q.art || "talk") : ""}
        <h2 class="p-title" id="p-title">${esc(title)}</h2>
        ${bodyTxt ? `<p class="p-body">${esc(bodyTxt)}</p>` : ""}
        <button class="btn btn-primary" id="stay">${esc(CFG.buttons.stay)}</button>
        <button class="btn btn-quiet" id="leave">${esc(CFG.buttons.leave)}</button>
      </div>`;
    $modal.appendChild(ov);
    ov.querySelector("#stay").focus();
    ov.querySelector("#stay").onclick = () => {
      Log.log("prompt_choice", { choice: "continue", context, n: S.prompts.shown, rt_ms: ms(t0) });
      S.prompts.continues++; S.prompts.lastChoice = "continue"; save(); sendSummary(); Log.flush();
      ov.remove();
      if (context === "break") screenChoice("after_break");
    };
    ov.querySelector("#leave").onclick = () => {
      Log.log("prompt_choice", { choice: "quit", context, n: S.prompts.shown, rt_ms: ms(t0) });
      S.prompts.lastChoice = "quit"; S.choices.push("finish");
      ov.remove();
      endSession("quit", context);
    };
  }

  /* ------------------------------ ending ------------------------------- */
  function endSession(reason, context) {
    if (R) { Log.log("round_abandoned", { round: R.id, kind: R.kind, pos: R.pos, n_items: R.queue.length }); R = null; }
    $modal.innerHTML = "";
    S.ended = true; S.endReason = reason; S.endedAt = iso(); S.nickname = ""; save();   // nickname cleared from the device
    Log.log("session_end", { reason, context, lessons_completed: lessonsDone(), shells: S.shells, streak: S.streak, practice_rounds: S.practice.rounds, prompts_shown: S.prompts.shown });
    sendSummary(); Log.flush();
    screenEnd();
  }
  function surveyLink() {
    if (!CFG.surveyUrl) return "";
    return CFG.surveyUrl.replace(/\{(code|sid|group|condition)\}/g, (_, k) => encodeURIComponent({ code: S.code, sid: S.sid, group: S.group, condition: S.condition }[k]));
  }
  function screenEnd() {
    screen("end");
    const link = surveyLink(), capped = S.endReason === "max_rounds";
    $app.innerHTML = `
      <div class="shell ${link && CFG.embedSurvey ? "wide" : "narrow"}"><div class="card">
        <div class="brand">${Art.logo}<span>Pelan</span></div>
        <h1 class="h1">${capped ? "That's all the practice for today" : "Thanks for using Pelan"}</h1>
        <div class="code-box inline">
          <div><div class="code-label">Your study code</div><div class="code">${esc(S.code)}</div></div>
          <button class="btn btn-quiet btn-sm" id="copy">Copy code</button>
        </div>
        ${link ? `<p class="lead">Next, please answer a short survey and then take a short quiz. ${CFG.embedSurvey ? "It's right below." : ""} If the survey asks for your study code, enter the code above.</p>
          ${CFG.embedSurvey ? `<div class="survey-frame"><iframe id="sv" src="${esc(link)}" title="Survey and quiz" allow="clipboard-write"></iframe></div>
            <p class="hint">Survey not loading? <a href="${esc(link)}" target="_blank" rel="noopener" id="sv-tab">Open it in a new tab</a>.</p>`
            : `<button class="btn btn-primary" id="go">Go to the survey</button>`}`
        : `<p class="lead">You can close this tab now. Please write down your study code.</p>`}
      </div></div>`;
    $app.querySelector("#copy").onclick = async e => {
      try { await navigator.clipboard.writeText(S.code); e.target.textContent = "Copied"; } catch (_) { e.target.textContent = S.code; }
      Log.log("code_copied");
    };
    if (link && CFG.embedSurvey) {
      if (!S.surveyOpened) { S.surveyOpened = true; save(); Log.log("survey_opened", { mode: "embed" }); sendSummary(); Log.flush(); }
      $app.querySelector("#sv-tab").onclick = () => Log.log("survey_opened", { mode: "new_tab" });
    } else if (link) {
      $app.querySelector("#go").onclick = async () => {
        S.surveyOpened = true; save(); Log.log("survey_opened", { mode: "redirect" }); sendSummary(); await Log.flush();
        setTimeout(() => { location.href = link; }, 250);
      };
    }
  }
  // Qualtrics can tell the app the survey is finished (see README).
  addEventListener("message", e => {
    if (!S || !S.ended || e.origin !== CFG.surveyOrigin) return;
    if (e.data === "pelan_survey_done" || (e.data && e.data.pelan === "survey_done")) {
      S.surveyDone = true; save(); Log.log("survey_done"); sendSummary(); Log.flush(); screenThanks();
    }
  });
  function screenThanks() {
    screen("thanks");
    $app.innerHTML = `<div class="shell narrow"><div class="card center">
      <div class="celebrate check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27 l8 8 l15 -16"/></svg></div>
      <h1 class="h1">All done. Thank you!</h1><p class="lead">You can close this tab now.</p></div></div>`;
  }

  /* ------------------------------- debug ------------------------------- */
  function debugBar() {
    if (!DEBUG || document.querySelector(".debug-bar")) return;
    const d = document.createElement("div");
    d.className = "debug-bar";
    d.innerHTML = `<button id="dbg-t" aria-label="Debug tools">G${S.group} ⚙</button><span class="dbg-more"><span>${esc(S.condition)} · ${esc(S.assignMode)}${Log.enabled ? "" : " · no backend"}</span>
      <button id="dbg-skip">skip lesson</button><button id="dbg-sh">+50🐚</button><button id="dbg-p">prompt</button><button id="dbg-csv">csv</button><button id="dbg-r">reset</button></span>`;
    document.body.appendChild(d);
    d.querySelector("#dbg-t").onclick = () => d.classList.toggle("open");
    d.querySelector("#dbg-skip").onclick = () => { if (!R) { const n = nextLesson(); if (!n) return; startLesson(n); } R.pos = R.queue.length - 1; advance(); };
    d.querySelector("#dbg-sh").onclick = () => addShells(50, "debug");
    d.querySelector("#dbg-p").onclick = () => attemptQuit("debug");
    d.querySelector("#dbg-csv").onclick = () => Log.downloadCSV();
    d.querySelector("#dbg-r").onclick = () => { localStorage.removeItem(STORE); location.reload(); };
  }

  if (DEBUG) window.__pelan = { round: () => R, state: () => S };
  boot();
})();
