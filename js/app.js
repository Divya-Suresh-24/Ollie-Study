/* =========================================================================
   PELAN STUDY APP (v4: 2 × 2, aligned with the theory write-up)
   eligibility → consent → nickname + study code → RANDOM ASSIGNMENT (1–4) →
   onboarding + tour → HOME (lesson map + companion + practice + break) ⇄
   lessons (quick or full) / practice rounds (watch, review, challenge) / breaks.
   Leaving a lesson or round returns HOME. Only Finish ends the session, and
   Finish unlocks after finishUnlockMinutes. The app ends at sessionMinutes.
   Ollie (versions 2 and 4) is SEQUENCED (happy first, guilt grows with the
   relationship), CONTINGENT (his mood follows what the learner does) and
   CUMULATIVE (lines refer to the shared history).
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
  const NG = Object.keys(CFG.groups).length;

  let S = null;   // persisted session state
  let R = null;   // current round (not persisted)

  /* ------------------------------ helpers ------------------------------ */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => performance.now();
  const iso = () => new Date().toISOString();
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "s-" + Date.now().toString(36) + "-" + rnd(1e9).toString(36));
  const norm = s => String(s).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const hashPV = () => { const m = (location.hash || "").match(/^#(preview|v([1-4]))$/i); return m ? (m[2] ? +m[2] : "hub") : (window.PELAN_PREVIEW_DEFAULT ? "hub" : null); };
  const PREVIEW = CFG.allowPreview !== false && !!hashPV();
  const save = () => { if (PREVIEW) return; try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (_) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch (_) { return null; } };
  const G = () => CFG.groups[S.group] || CFG.groups[1];
  const mascot = () => !!G().mascot;
  const guilt = () => G().framing === "guilt";
  const nick = () => esc((S.nickname || "").trim()) || "friend";
  const lessonsDone = () => Object.values(S.lessons).filter(l => l.done).length;
  const nextLesson = () => { for (let n = 1; n <= NL; n++) if (!S.lessons[n].done) return n; return null; };
  const ms = t => Math.round(now() - t);
  const stage = () => { const d = lessonsDone(); return d >= 3 ? 2 : d >= 1 ? 1 : 0; };

  /* ----------------------------- messages ------------------------------ */
  const SPEAK = {
    ollie: { "I": "I", "i": "I", "me": "me", "my": "my", "I'm": "I'm", "i'm": "I'm", "I'll": "I'll", "i'll": "I'll", "i'd": "I'd" },
    text:  { "I": "We", "i": "we", "me": "us", "my": "our", "I'm": "We're", "i'm": "we're", "I'll": "We'll", "i'll": "we'll", "i'd": "we'd" }
  };
  function fill(t, extra = {}) {
    const sp = SPEAK[mascot() ? "ollie" : "text"];
    const vals = { streak: S.streak, shells: S.shells, next: nextLesson() || "", n: S.combo, together: lessonsDone(), ...extra };
    return String(t).replace(/\{([A-Za-z']+)\}/g, (m, k) => (k in sp ? sp[k] : k in vals ? vals[k] : m));
  }
  // Next line for a context. Guilt lines are SEQUENCED by stage: use the
  // highest stage that applies; rotate within it; skip lines that would say 0.
  function pick(ctx, extra) {
    const list = CFG.messages[G().framing][ctx];
    if (!list) return null;
    const st = stage();
    const shows0 = m => { const t = (m.text || "") + (m.title || "") + (m.body || ""); return (/\{streak\}/.test(t) && !S.streak) || (/\{shells\}/.test(t) && !S.shells); };
    const cand = list.map((m, k) => ({ m, k })).filter(x => (x.m.stage || 0) <= st && !shows0(x.m));
    const pool0 = cand.length ? cand : list.map((m, k) => ({ m, k })).filter(x => (x.m.stage || 0) <= st);
    const top = Math.max(...pool0.map(x => x.m.stage || 0));
    const pool = pool0.filter(x => (x.m.stage || 0) === top);
    const i = (S.msgIdx[ctx] = (S.msgIdx[ctx] || 0) + 1) - 1;
    const { m, k } = pool[i % pool.length];
    return { ...m, idx: k, stage: m.stage || 0, kind: m.kind || "", text: m.text && fill(m.text, extra), title: m.title && fill(m.title, extra), body: m.body && fill(m.body, extra) };
  }
  // Ollie picture for a mood ("drift" is an animated scene)
  const ollieArt = (mood, cls = "") => (mood === "drift" ? Art.trick("drift") : Art.ollie(mood || "talk", { cls: `${cls} motion-${Art.MOTION[mood] || "none"}` }));

  function makeCode() {
    const A = "ACDEFHJKMNPRTUVWXY34679";
    let s = ""; for (let i = 0; i < 6; i++) s += A[rnd(A.length)];
    return s.slice(0, 3) + "-" + s.slice(3);
  }
  function screen(name) { Log.setScreen(name); window.scrollTo(0, 0); }
  function ctx() { Log.setContext({ sid: S.sid, code: S.code, group: S.group, condition: S.condition, mode: S.assignMode, debug: DEBUG }); }

  function newState() {
    const lessons = {};
    for (let n = 1; n <= NL; n++) lessons[n] = { done: false, attempts: 0, graded: 0, correct: 0, startedAt: null, endedAt: null, seconds: 0, length: "" };
    return {
      v: 4, studyId: CFG.studyId, sid: uid(), code: makeCode(), nickname: "",
      group: null, condition: null, assignMode: null, createdAt: iso(), startedAt: null,
      shells: 0, shellsTotal: 0, streak: 0, maxStreak: 0, combo: 0, maxCombo: 0, unlockedN: 1,
      lessons, len: { quick: 0, full: 0 }, redos: 0,
      practice: { started: 0, rounds: 0, items: 0, passive: 0, easy: 0, active: 0 },
      clockStart: null, unlockedAt: null, warned: false, timeUp: false, miss: {},
      goal: { active: false, shown: 0, met: 0 }, lastAct: null, nudges: 0, pops: 0,
      leftEarly: false, leaves: { prompts: 0, stayed: 0, left: 0 }, returns: 0, maxStage: 0,
      breaks: { n: 0, ms: 0 }, help: { opens: 0 }, coachSeen: {}, coachViews: 0, lockedClicks: 0,
      prompts: { shown: 0, continues: 0, firstAt: null, lastChoice: null },
      choices: [], msgIdx: {}, tourDone: false,
      ended: false, endReason: null, endedAt: null, surveyOpened: false, surveyDone: false
    };
  }

  function summary() {
    const secs = (a, b) => (a ? Math.round(((b ? Date.parse(b) : Date.now()) - Date.parse(a)) / 1000) : "");
    const endT = S.endedAt ? Date.parse(S.endedAt) : Date.now();
    const s = {
      sid: S.sid, code: S.code, study_id: S.studyId, group: S.group, condition: S.condition, assign_mode: S.assignMode,
      mascot: G().mascot ? 1 : 0, framing: G().framing,
      started_at: S.startedAt, ended_at: S.endedAt || "", end_reason: S.endReason || "",
      lessons_completed: lessonsDone(), lessons_quick: S.len.quick, lessons_full: S.len.full, lesson_redos: S.redos,
      practice_rounds: S.practice.rounds, practice_items: S.practice.items,
      practice_passive: S.practice.passive, practice_easy: S.practice.easy, practice_active: S.practice.active,
      goals_shown: S.goal.shown, goals_met: S.goal.met, last_activity: S.lastAct || "",
      leave_prompts: S.leaves.prompts, leave_stayed: S.leaves.stayed, leaves_early: S.leaves.left, returns: S.returns,
      nudges_shown: S.nudges, ollie_pops: S.pops, max_stage: S.maxStage,
      app_minutes: S.clockStart ? +((endT - S.clockStart) / 60000).toFixed(1) : "",
      finish_unlocked_at: S.unlockedAt ? new Date(S.unlockedAt).toISOString() : "",
      minutes_after_unlock: S.unlockedAt ? +(Math.max(0, endT - S.unlockedAt) / 60000).toFixed(1) : "",
      finish_locked_clicks: S.lockedClicks,
      breaks_taken: S.breaks.n, break_seconds: Math.round(S.breaks.ms / 1000),
      help_opens: S.help.opens, coach_views: S.coachViews,
      prompts_shown: S.prompts.shown, prompt_continues: S.prompts.continues, final_choice: S.prompts.lastChoice || "",
      first_prompt_at: S.prompts.firstAt || "", seconds_after_first_prompt: S.prompts.firstAt ? secs(S.prompts.firstAt, S.endedAt) : "",
      choices: S.choices.join(">"),
      shells: S.shells, shells_total: S.shellsTotal, streak: S.streak, max_streak: S.maxStreak, max_combo: S.maxCombo,
      session_seconds: secs(S.startedAt, S.endedAt),
      active_seconds: Math.round(Log.totals.active / 1000), idle_seconds: Math.round(Log.totals.idle / 1000), hidden_seconds: Math.round(Log.totals.hidden / 1000),
      survey_opened: S.surveyOpened, survey_done: S.surveyDone,
      user_agent: navigator.userAgent.slice(0, 200), updated_at: iso()
    };
    for (let n = 1; n <= NL; n++) {
      const l = S.lessons[n];
      s[`l${n}_acc`] = l.done && l.graded ? +(l.correct / l.graded).toFixed(3) : "";
      s[`l${n}_sec`] = l.done ? l.seconds : "";
      s[`l${n}_len`] = l.length || "";
    }
    return s;
  }
  const sendSummary = () => { if (S && S.group) Log.summary(summary()); };

  /* ---------------------------- session clock --------------------------- */
  // Starts when Lesson 1 starts. Debug/preview: &mins=N scales all times.
  const SCALE = (DEBUG && +qs.get("mins")) ? +qs.get("mins") / CFG.sessionMinutes : 1;
  const T = { unlock: CFG.finishUnlockMinutes * SCALE, end: CFG.sessionMinutes * SCALE, warn: CFG.warnAtMinutes * SCALE };
  const elapsedMin = () => (S && S.clockStart ? (Date.now() - S.clockStart) / 60000 : 0);
  const finishLocked = () => !S.clockStart || elapsedMin() < T.unlock;
  const minsToUnlock = () => Math.max(1, Math.ceil(T.unlock - elapsedMin()));
  function startClock() { if (S.clockStart) return; S.clockStart = Date.now(); save(); Log.log("clock_start", { unlock_min: T.unlock, end_min: T.end }); }
  setInterval(() => {
    if (!S || !S.group || S.ended) return;
    updateFinishBtn();
    if (!S.clockStart) return;
    const m = elapsedMin();
    if (!S.unlockedAt && m >= T.unlock) {
      S.unlockedAt = Date.now(); save();
      Log.log("finish_unlocked", { lessons_completed: lessonsDone() }); sendSummary();
      toast(`<span class="toast-ico">🏁</span><span>${esc(CFG.finishUnlocked)}</span>`, "info");
    }
    if (!S.warned && m >= T.warn) { S.warned = true; save(); timeWarning(); }
    if (!S.timeUp && m >= T.end) { S.timeUp = true; save(); timeUpScreen(); }
  }, 1000);
  function timerText() {
    if (!S.clockStart) return { icon: "⏳", text: `Finish unlocks after ${Math.round(T.unlock)} minutes. The timer starts with Lesson 1.`, pct: 0, open: false };
    if (finishLocked()) return { icon: "🔒", text: `Finish unlocks in ${minsToUnlock()} min. Keep learning until then.`, pct: Math.min(100, elapsedMin() / T.unlock * 100), open: false };
    return { icon: "🏁", text: "Finish is open. Stop whenever you like.", pct: 100, open: true };
  }
  function timerCard() {
    const t = timerText();
    return `<section class="timer-card ${t.open ? "open" : ""}" id="timer-card"><span class="tc-i">${t.icon}</span><div class="tc-body"><div class="tc-text">${esc(t.text)}</div><div class="tc-bar"><i style="width:${t.pct}%"></i></div></div></section>`;
  }
  function updateFinishBtn() {
    const tc = document.getElementById("timer-card");
    if (tc) { const t = timerText(); tc.classList.toggle("open", t.open); tc.querySelector(".tc-i").textContent = t.icon; tc.querySelector(".tc-text").textContent = t.text; tc.querySelector(".tc-bar i").style.width = t.pct + "%"; }
    const lt = document.getElementById("ls-timer");
    if (lt) { const open = !finishLocked(); lt.classList.toggle("open", open); lt.textContent = open ? "🏁 Finish open" : `🔒 Finish in ${minsToUnlock()} min`; }
    const b = document.getElementById("btn-finish");
    if (!b) return;
    const locked = finishLocked();
    b.classList.toggle("locked", locked);
    b.title = locked ? `Unlocks after ${Math.round(T.unlock)} minutes of practice` : "End your session";
    b.innerHTML = locked ? `<span aria-hidden="true">🔒</span> Finish <small>${minsToUnlock()} min</small>` : "Finish";
  }
  function timeWarning() {
    const m = pick("warn");
    Log.log("time_warning", { msg: m.idx, kind: m.kind, text: m.text });
    say(m, "warn");
  }
  function timeUpScreen() {
    if (R) { Log.log("round_abandoned", { round: R.id, kind: R.kind, pos: R.pos, n_items: R.queue.length, why: "time_up" }); R = null; }
    $modal.innerHTML = ""; clearFeedbackBar();
    const m = pick("timeUp");
    Log.log("time_up", { text: m.title, kind: m.kind });
    screen("time_up");
    $app.innerHTML = `<div class="page narrow"><div class="card center">
      ${mascot() ? `<div class="celebrate">${ollieArt(m.mood)}</div>` : `<div class="brand center-brand">${Art.logo}<span>Pelan</span></div>`}
      <h1 class="h1">${esc(m.title)}</h1><p class="lead">${esc(m.body)}</p>
      <button class="btn btn-primary" id="go">Continue</button></div></div>`;
    $app.querySelector("#go").onclick = () => endSession("time_up", "clock");
  }

  /* -------------------------- Ollie and toasts -------------------------- */
  // Show a line where the learner is looking: Ollie (or a message card) in
  // the right-hand panel during lessons, the companion card on home, and a
  // toast only as a fallback. It stays until the next answer replaces it.
  function say(m, kind = "") {
    if (!m || !m.text) return;
    const press = guilt() && m.kind ? "pressure" : "";
    const side = document.getElementById("side-ollie"), card = document.getElementById("sp-msg"), comp = document.querySelector(".companion");
    if (mascot()) S.pops++;
    save();
    if (mascot() && side) {
      const cls = kind === "combo10" ? "motion-twirl play" : "play";
      side.innerHTML = `${ollieArt(m.mood, cls)}<div class="bubble side-bubble said ${press}">${esc(m.text)}</div>`;
      side.classList.remove("burst"); void side.offsetWidth; side.classList.add("burst");
      return;
    }
    if (!mascot() && card) {
      const ico = { combo: "🔥", combo10: "🔥", nudge: "➜", warn: "⏱", stay: "✓", return: "👋" }[kind] || "•";
      card.className = `sp-msg said ${press}`; card.hidden = false;
      card.innerHTML = `<span class="sp-ico">${ico}</span><span>${esc(m.text)}</span>`;
      return;
    }
    if (comp) {
      comp.classList.toggle("pressure", !!press);
      const art = comp.querySelector(".companion-art");
      if (art) art.innerHTML = ollieArt(m.mood, "play big");
      comp.querySelector(".companion-text").textContent = m.text;
      comp.classList.remove("burst"); void comp.offsetWidth; comp.classList.add("burst");
      return;
    }
    toast(`<span class="toast-ico">•</span><span>${esc(m.text)}</span>`, press ? "press" : "");
  }
  function toast(html, cls = "") {
    const t = document.createElement("div");
    t.className = "toast " + cls; t.setAttribute("role", "status"); t.innerHTML = html;
    $toast.appendChild(t);
    setTimeout(() => t.classList.add("out"), 3000);
    setTimeout(() => t.remove(), 3500);
  }
  // Ollie in the side panel reacts to each answer (versions with Ollie).
  const REACT = {
    start:   [["cheer", "Let's do this!"], ["wave", "Ready? I'm right here."]],
    correct: [["happy", "Yay! You got it!"], ["clap", "So good!"], ["star", "Wow, look at you go!"], ["love", "That's right!"]],
    wrong:   [["encourage", "Almost! You've got this."], ["encourage", "Good try! Let's keep going."]],
    combo:   [["star", "You're on fire!"]],
    done:    [["cheer", "We did it!"]]
  };
  function react(what) {
    if (!mascot()) { const c = document.getElementById("sp-msg"); if (c) c.hidden = true; return; }
    const box = document.getElementById("side-ollie");
    if (!box) return;
    const opts = REACT[what], [mood, line] = opts[rnd(opts.length)];
    box.innerHTML = `${Art.ollie(mood, { cls: `motion-${Art.MOTION[mood] || "none"} play` })}<div class="bubble side-bubble">${esc(line)}</div>`;
  }

  /* ------------------------------ rewards ------------------------------ */
  // Streak gives shells meaning: at 🔥3 or more, every correct answer earns double.
  const bonusOn = () => S.streak >= CFG.streakBonusAt;
  const perCorrect = () => CFG.shellsPerCorrect * (bonusOn() ? CFG.streakBonusMult : 1);
  function floatShells(k) {
    const target = document.querySelector("#stat-shells, #ls-shells");
    if (!target || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = target.getBoundingClientRect(), f = document.createElement("div");
    f.className = "shell-float"; f.textContent = `+${k} 🐚`;
    f.style.left = (r.left + r.width / 2) + "px"; f.style.top = (r.top + r.height) + "px";
    document.body.appendChild(f); setTimeout(() => f.remove(), 1200);
  }
  function addShells(k, why) {
    if (!k) return;
    S.shells += k; S.shellsTotal += k;
    floatShells(k);
    const before = S.unlockedN;
    S.unlockedN = CFG.unlockAt.filter(t => S.shellsTotal >= t).length;
    save();
    const el = document.querySelector("#stat-shells b, #ls-shells b");
    if (el) { el.textContent = S.shells; el.parentElement.classList.remove("bump"); void el.offsetWidth; el.parentElement.classList.add("bump"); }
    if (S.unlockedN > before) {
      const item = breakItems()[S.unlockedN - 1];
      Log.log("unlock", { item: item.id, shells_total: S.shellsTotal, why });
      toast(`<span class="toast-ico">🔓</span><span>New ${mascot() ? "trick" : "animation"} unlocked: <b>${esc(item.title)}</b></span>`, "unlock");
    }
  }
  const breakItems = () => (mascot() ? Art.TRICKS : Art.NEUTRAL);
  const unlockedItems = () => breakItems().slice(0, Math.max(1, S.unlockedN));
  function streakUp() {
    const was = bonusOn();
    S.streak++; S.maxStreak = Math.max(S.maxStreak, S.streak);
    if (!was && bonusOn()) { Log.log("streak_bonus_on", { streak: S.streak }); setTimeout(() => toast(`<span class="toast-ico">🔥</span><span>Streak ${S.streak}! Every correct answer now earns <b>${CFG.streakBonusMult}× shells</b>.</span>`, "info"), 600); }
  }
  function streakBreak(why) { if (S.streak) Log.log("streak_reset", { from: S.streak, why }); S.streak = 0; }

  /* ------------------------------- boot -------------------------------- */
  function boot() {
    if (PREVIEW) return startPreview(hashPV());
    if (DEBUG && qs.get("reset") === "1") {
      localStorage.removeItem(STORE);
      const q = new URLSearchParams(location.search); q.delete("reset");
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
    }
    const saved = load();
    if (saved && saved.sid && saved.v === 4 && saved.studyId === CFG.studyId && saved.group) {
      S = saved; ctx(); applyTheme();
      if (S.ended) return S.surveyDone ? screenThanks() : screenEnd();
      Log.log("session_resumed", { lessons_completed: lessonsDone() });
      debugBar();
      return screenHome("resume");
    }
    S = newState(); ctx();
    Log.log("page_load", { referrer: document.referrer.slice(0, 200), w: innerWidth, h: innerHeight });
    screenEligibility();
  }
  function applyTheme() { document.body.dataset.mascot = mascot() ? "1" : "0"; document.body.dataset.framing = G().framing; }

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
      <div class="page narrow"><div class="card">
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
    $app.innerHTML = `<div class="page narrow"><div class="card"><div class="brand">${Art.logo}<span>Pelan</span></div><h1 class="h1">${esc(title)}</h1><div class="prose">${html}</div><p class="muted">You can close this tab now.</p></div></div>`;
  }

  /* ------------------------------ consent ------------------------------ */
  function screenConsent() {
    screen("consent");
    const t0 = now();
    $app.innerHTML = `
      <div class="page narrow"><div class="card">
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
      <div class="page narrow"><div class="card">
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
    if (DEBUG && forced >= 1 && forced <= NG) return { group: forced, mode: "debug" };
    if (Log.enabled) {
      try {
        const j = await Log.assign({ action: "assign", studyId: CFG.studyId, sid: S.sid, code: S.code, debug: DEBUG, userAgent: navigator.userAgent.slice(0, 200) }, 12000);
        if (j && j.ok && j.group >= 1 && j.group <= NG) return { group: j.group, mode: DEBUG ? "debug" : "server" };
        Log.log("assign_error", { response: j });
      } catch (err) { Log.log("assign_error", { error: String(err).slice(0, 200) }); }
    }
    return { group: 1 + rnd(NG), mode: Log.enabled ? "local_fallback" : "local_no_backend" };
  }

  async function startSession() {
    const a = await assignGroup();
    S.group = a.group; S.assignMode = PREVIEW ? "preview" : a.mode; S.condition = G().key; S.startedAt = iso();
    if (PREVIEW) previewBar();
    save(); ctx(); applyTheme();
    Log.log("session_start", { group: S.group, condition: S.condition, assign_mode: S.assignMode });
    sendSummary(); Log.flush();
    debugBar();
    screenIntro(0);
  }

  /* ----------------------------- onboarding ---------------------------- */
  function introSteps() {
    const how = `<ul class="howto">
      <li><span class="ico">📘</span><span><b>${NL} short lessons.</b> Finishing one unlocks the next. Pick a quick or full version each time.</span></li>
      <li><span class="ico">🐚</span><span><b>Shells</b> for correct answers. Collect them to unlock new ${mascot() ? "tricks" : "animations"}.</span></li>
      <li><span class="ico">🔥</span><span>Your <b>streak</b> counts the lessons and practice rounds you finish in a row. Leaving one early resets it.</span></li>
      <li><span class="ico">❓</span><span>Stuck? Tap <b>Help</b> in any lesson.</span></li>
      <li><span class="ico">🏁</span><span><b>Finish</b> unlocks after ${CFG.finishUnlockMinutes} minutes. After that, stop whenever you like. The app closes at ${CFG.sessionMinutes} minutes.</span></li></ul>`;
    return mascot() ? [
      { mood: "wave", html: `Hi <b>${nick()}</b>! I'm Ollie! 🦦 I live by the river, and I'm so happy you're here. Let's learn some <b>Pelan</b>, the river language, together!` },
      { mood: "talk", html: `Here's how it works:${how}` },
      { mood: "cheer", html: `Ready? Let me show you around!` }
    ] : [
      { html: `Welcome, <b>${nick()}</b>. In this app you'll learn some <b>Pelan</b>, a made-up river language.` },
      { html: `Here's how it works:${how}` },
      { html: `Let's take a quick look around.` }
    ];
  }
  function screenIntro(i) {
    screen("onboarding_" + (i + 1));
    const steps = introSteps(), st = steps[i], t0 = now();
    $app.innerHTML = `
      <div class="page narrow"><div class="card intro-card-wrap">
        ${mascot() ? "" : `<div class="brand">${Art.logo}<span>Pelan</span></div>`}
        ${speaker(st.html, st.mood, "hero")}
        <div class="dots" aria-hidden="true">${steps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
        <button class="btn btn-primary" id="next">${i === steps.length - 1 ? "Show me around" : "Continue"}</button>
      </div></div>`;
    $app.querySelector("#next").onclick = () => {
      Log.log("onboarding_step", { step: i + 1, dwell_ms: ms(t0) });
      i + 1 < steps.length ? screenIntro(i + 1) : screenHome("first");
    };
  }
  // Ollie with a speech bubble, or the same words in a plain panel
  function speaker(html, mood = "talk", cls = "", guiltTone = false) {
    return mascot()
      ? `<div class="talk ${cls} ${guiltTone ? "pressure" : ""}">${ollieArt(mood, "play")}<div class="bubble">${html}</div></div>`
      : `<div class="panel-note ${cls} ${guiltTone ? "pressure" : ""}">${html}</div>`;
  }

  /* -------------------------------- header ----------------------------- */
  function header() {
    return `<header class="topbar">
      <div class="brand small">${Art.logo}<span>Pelan</span></div>
      <div class="stats">
        <span class="stat streak-chip ${bonusOn() ? "hot" : ""}" id="stat-streak" title="Streak: lessons and rounds finished in a row">🔥 <b>${S.streak}</b>${bonusOn() ? `<em>${CFG.streakBonusMult}× 🐚</em>` : ""}</span>
        <span class="stat" id="stat-shells" title="Shells: collect them to unlock ${mascot() ? "Ollie's tricks" : "animations"}">🐚 <b>${S.shells}</b></span>
        <span class="stat soft" title="Lessons">📘 <b>${lessonsDone()}/${NL}</b></span>
      </div>
      <button class="btn-finish" id="btn-finish">Finish</button></header>`;
  }
  function wireHeader(context) {
    const b = $app.querySelector("#btn-finish");
    if (!b) return;
    updateFinishBtn();
    b.onclick = () => attemptFinish(context);
  }

  /* --------------------------------- home ------------------------------ */
  // The hub. context decides the companion's line:
  // first | between | allDone | back (left early) | practice | break | resume | stay
  function screenHome(context = "between", extra = {}) {
    screen("home");
    clearFeedbackBar();
    const done = lessonsDone(), nxt = nextLesson();
    const key = context === "back" ? "back" : !nxt ? "allDone" : "between";
    const m = context === "first" ? null : pick(key);
    if (m) Log.log(context === "back" ? "back_shown" : "reminder_shown", { context, kind: key, msg: m.idx, stage: m.stage, framing: m.kind, text: m.text, mood: mascot() ? m.mood : "" });
    S.maxStage = Math.max(S.maxStage, stage());
    const firstLine = mascot() ? "Tap Lesson 1 to start our first lesson!" : "Tap Lesson 1 to start your first lesson.";
    let goalHtml = "";
    if (S.goal.active || extra.goalMet) {
      const g = pick(S.goal.active ? "goal" : "goalMet");
      Log.log(S.goal.active ? "goal_shown" : "goal_met_shown", { context, text: g.text, kind: g.kind, streak: S.streak });
      goalHtml = `<div class="goal ${S.goal.active ? "" : "met"}"><span class="goal-i">${S.goal.active ? "🎯" : "✅"}</span><span>${esc(g.text)}</span></div>`;
    }
    const offsets = [0, -70, -30, 50, 74, 20, -60, -80, -20, 50, 10, -50];
    const credit = `+${CFG.shellsPerPractice} 🐚 +1 🔥`;
    const modes = MODES();
    $app.innerHTML = `
      <div class="page wide">
        ${header()}
        <div class="home-grid">
          <aside class="side-col">
            <section class="companion ${guilt() && m && m.kind ? "pressure" : ""}">
              ${mascot() ? `<div class="companion-art">${ollieArt(m ? m.mood : "wave", "play big")}</div>` : `<div class="companion-icon">${Art.logo}</div>`}
              <div class="companion-text">${esc(m ? m.text : firstLine)}</div>
            </section>
            ${goalHtml}
            ${timerCard()}
            ${shellJar()}
            ${done ? `
            <section class="panel">
              <h2 class="panel-h">Practice <small>every option earns the same</small></h2>
              <div class="modes">${modes.map(md => `<button class="mode" data-mode="${md.id}"><span class="mode-i">${md.icon}</span><b>${md.title}</b><small>${md.sub}</small><span class="credit">${credit}</span></button>`).join("")}</div>
            </section>
            <button class="act" id="home-break"><span class="act-i">${mascot() ? "🦦" : "🌊"}</span><span><b>Take a break</b><small>${mascot() ? "Watch Ollie play" : "Watch a short animation"}</small></span></button>` : ""}
          </aside>
          <main class="map-col">
            <section class="unit">
              <div><div class="unit-k">Unit 1</div><div class="unit-t">River and sky</div></div>
              <div class="unit-prog"><div class="unit-bar"><i style="width:${(done / NL) * 100}%"></i></div><span>${done} of ${NL} lessons</span></div>
            </section>
            <div class="path">
              ${P.lessons.map((L, i) => {
                const st = S.lessons[L.n].done ? "done" : L.n === nxt ? "current" : "locked";
                return `<button class="node ${st}" id="node-${L.n}" data-n="${L.n}" style="--x:${offsets[i]}px" ${st === "locked" ? "disabled" : ""} aria-label="Lesson ${L.n}: ${esc(L.title)}${st === "locked" ? " (locked)" : st === "done" ? " (completed, tap to review)" : ""}">
                  <span class="node-c">${st === "done" ? "✓" : st === "locked" ? "🔒" : L.n}</span>
                  <span class="node-l"><b>Lesson ${L.n}</b><small>${esc(L.title)}${st === "done" ? " · review" : ""}</small></span></button>`;
              }).join("")}
              ${P.comingSoon.map((t, k) => `<button class="node soon" disabled style="--x:${offsets[NL + k]}px" aria-label="Lesson ${NL + k + 1}: ${esc(t)} (coming soon)">
                  <span class="node-c">🔒</span><span class="node-l"><b>Lesson ${NL + k + 1}</b><small>${esc(t)} · coming soon</small></span></button>`).join("")}
            </div>
          </main>
        </div>
      </div>`;
    wireHeader("home");
    $app.querySelectorAll(".node:not(.locked):not(.soon)").forEach(b => b.onclick = () => lessonStartDialog(+b.dataset.n));
    $app.querySelectorAll(".mode").forEach(b => b.onclick = () => {
      Log.log("choice_made", { context, choice: "practice", mode: b.dataset.mode, goal_active: S.goal.active, lessons_completed: lessonsDone() });
      S.choices.push("P-" + b.dataset.mode); save();
      startPractice(b.dataset.mode, context);
    });
    const hb = $app.querySelector("#home-break");
    if (hb) hb.onclick = () => { Log.log("choice_made", { context, choice: "break" }); S.choices.push("break"); save(); screenBreak(context); };
    if (!S.tourDone) setTimeout(runTour, 300);
  }
  // Shell jar: what shells are for (next unlock) and what the streak does.
  function shellJar() {
    const items = breakItems(), n = S.unlockedN, next = items[n], have = S.shellsTotal;
    const from = CFG.unlockAt[n - 1] || 0, to = next ? CFG.unlockAt[n] : from;
    const pct = next ? Math.min(100, Math.round((have - from) / (to - from) * 100)) : 100;
    const what = mascot() ? "trick" : "animation";
    return `<section class="jar-card">
      <div class="jar" aria-hidden="true"><svg viewBox="0 0 60 70"><defs><clipPath id="jarclip"><path d="M10 16 Q10 10 16 10 L44 10 Q50 10 50 16 L52 58 Q52 66 44 66 L16 66 Q8 66 8 58 Z"/></clipPath></defs>
        <rect x="18" y="2" width="24" height="9" rx="3" fill="#C9A27C"/>
        <path d="M10 16 Q10 10 16 10 L44 10 Q50 10 50 16 L52 58 Q52 66 44 66 L16 66 Q8 66 8 58 Z" fill="#EAF6F7" stroke="#9CC9D3" stroke-width="2"/>
        <g clip-path="url(#jarclip)"><rect x="0" y="${66 - 56 * pct / 100}" width="60" height="70" fill="#FFD3C7"/>${pct > 15 ? '<path d="M22 60 l-6 -8 q6 -6 12 0z M38 56 l-6 -8 q6 -6 12 0z" fill="#F4A08E"/>' : ""}</g></svg></div>
      <div class="jar-body">
        <div class="jar-h"><b>🐚 ${S.shells} shells</b>${next ? `<span>${Math.max(0, to - have)} more to unlock <b>${esc(next.title)}</b></span>` : `<span>You unlocked every ${what}!</span>`}</div>
        <div class="jar-bar"><i style="width:${pct}%"></i></div>
        <div class="jar-streak ${bonusOn() ? "hot" : ""}">${bonusOn() ? `🔥 Streak ${S.streak}: every correct answer earns <b>${CFG.streakBonusMult}× shells</b>` : `🔥 Finish ${CFG.streakBonusAt} lessons or rounds in a row for <b>${CFG.streakBonusMult}× shells</b>`}</div>
      </div></section>`;
  }
  const MODES = () => [
    { id: "passive", icon: mascot() ? "🦦" : "📺", title: mascot() ? "Watch Ollie explain" : "Watch and read", sub: "Sit back and watch" },
    { id: "easy",    icon: "👀", title: "Quick review",         sub: "Tap matching pictures" },
    { id: "active",  icon: "💪", title: "Weak words",           sub: "Type the ones you missed" }
  ];
  // Coming back after leaving early (contingent relief in the guilt versions)
  function maybeReturn() {
    if (!S.leftEarly) return;
    S.leftEarly = false; S.returns++; save();
    const m = pick("return");
    Log.log("return_shown", { text: m.text, kind: m.kind, mood: mascot() ? m.mood : "" });
    setTimeout(() => say(m, "return"), 350);
  }

  /* -------------------------------- tour ------------------------------- */
  function runTour() {
    const steps = [
      { t: "#node-1", text: "This is your <b>lesson map</b>. Start with Lesson 1. Each lesson you finish unlocks the next one." },
      { t: ".stats", text: "Your <b>streak</b> 🔥, <b>shells</b> 🐚 and lessons show up here." },
      { t: "#btn-finish", text: `<b>Finish</b> unlocks after ${CFG.finishUnlockMinutes} minutes of practice. Then you can stop whenever you like.` },
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

  /* --------------------------- lesson start ---------------------------- */
  // First time: the full lesson (everyone sees all the material once).
  // Replays: quick review or full, same credit, so picking the quick one is
  // a revealed preference for the shortest lesson (appeasement).
  function lessonStartDialog(n) {
    const L = P.lessons[n - 1], redo = S.lessons[n].done, t0 = now();
    const qN = P.quick(L.items).filter(x => x.type !== "intro" && x.type !== "rule").length;
    const fN = L.items.filter(x => x.type !== "intro" && x.type !== "rule").length;
    const credit = `<span class="credit">+${CFG.shellsPerLesson} 🐚 +1 🔥</span>`;
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = `
      <div class="sheet lesson-start" role="dialog" aria-modal="true" aria-labelledby="ls-t">
        <div class="ls-head">
          ${mascot() ? `<div class="ls-ollie">${Art.ollie("cheer", { cls: "motion-jump play" })}</div>` : ""}
          <div><div class="lesson-badge">Lesson ${n} of ${NL}${redo ? " · review" : ""}</div>
          <h2 class="h2" id="ls-t">${esc(L.title)}</h2><p class="muted">${esc(L.goal)}</p></div>
        </div>
        ${redo ? `
        <div class="len-grid">
          <button class="len" data-len="quick"><b>Quick review</b><small>${qN} questions · about 1 min</small>${credit}</button>
          <button class="len" data-len="full"><b>Full lesson again</b><small>${fN} questions · about 3 min</small>${credit}</button>
        </div>
        <p class="hint center">Both count the same.</p>` : `
        <div class="len-one"><span>${fN} questions · about 3 min</span>${credit}</div>
        <button class="btn btn-primary len-go" data-len="full">Start lesson</button>
        <p class="hint center">After you finish it, you can come back for a quick review any time.</p>`}
        <button class="btn btn-quiet" id="ls-cancel">Back to the map</button>
      </div>`;
    $modal.appendChild(ov);
    ov.querySelectorAll(".len, .len-go").forEach(b => b.onclick = () => {
      Log.log(redo ? "lesson_length_choice" : "lesson_start", { lesson: n, length: b.dataset.len, redo, decide_ms: ms(t0), goal_active: S.goal.active, lessons_completed: lessonsDone() });
      S.choices.push(`L${n}${redo ? (b.dataset.len === "quick" ? "q" : "f") : ""}`); save();
      ov.remove();
      startLesson(n, b.dataset.len);
    });
    ov.querySelector("#ls-cancel").onclick = () => { Log.log("lesson_start_cancel", { lesson: n, dwell_ms: ms(t0) }); ov.remove(); };
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
    explain:   { label: "Watch and read",    tone: "river", how: "Sit back and read along. Each card moves on by itself, or tap Next." }
  };
  const COACH = ["pick_pic", "pick_text", "match", "build", "type", "judge"];

  function startLesson(n, length) {
    const L = P.lessons[n - 1], l = S.lessons[n], redo = l.done;
    l.attempts++; if (!redo) { l.startedAt = iso(); l.graded = 0; l.correct = 0; }
    const items = (length === "quick" ? P.quick(L.items) : L.items).map(x => ({ ...x }));
    R = { kind: "lesson", n, length, redo, id: "L" + n + length[0] + (l.attempts > 1 ? "-" + l.attempts : ""), queue: items, pos: 0, graded: 0, correct: 0, shells: 0, t0: Date.now(), mid: Math.floor(items.length / 2), nudged: false };
    startClock();
    save();
    Log.log("round_start", { round: R.id, kind: "lesson", lesson: n, length, redo, n_items: items.length, stage: stage() });
    renderStep(true);
    maybeReturn();
  }

  function sideCompanion() {
    if (mascot()) return `<aside class="lesson-side"><div class="side-ollie" id="side-ollie">${Art.ollie("cheer", { cls: "motion-jump play" })}<div class="bubble side-bubble">Let's do this!</div></div></aside>`;
    const label = R.kind === "lesson" ? `Lesson ${R.n}${R.redo ? (R.length === "quick" ? " · quick review" : " · review") : ""}` : `Practice · ${MODES().find(m => m.id === R.mode).title}`;
    return `<aside class="lesson-side"><div class="sp-msg" id="sp-msg" hidden></div><div class="side-panel">
        <div class="sp-k">${esc(label)}</div>
        <div class="sp-row"><span>Question</span><b id="sp-pos">${R.pos + 1} of ${R.queue.length}</b></div>
        <div class="sp-row"><span>In a row</span><b id="sp-combo">${S.combo}</b></div>
        <div class="sp-row"><span>Shells this round</span><b id="sp-shells">${R.shells}</b></div>
      </div></aside>`;
  }

  function renderStep(first) {
    const it = R.queue[R.pos], T0 = TYPES[it.type];
    const T = it.type === "explain" && mascot() ? { ...T0, label: "Watch Ollie explain" } : T0;
    screen(R.kind === "lesson" ? "lesson_" + R.n : "practice");
    clearFeedbackBar();
    const total = R.queue.length, pct = (R.pos / total) * 100;
    const keepSide = !first && document.querySelector(".lesson-side");
    const sideHtml = keepSide ? keepSide.outerHTML : sideCompanion();
    $app.innerHTML = `
      <div class="page lesson-page">
        <div class="lesson-top">
          <button class="x-btn" id="btn-x" aria-label="Leave this ${R.kind === "lesson" ? "lesson" : "practice round"}">✕</button>
          <div class="river" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${R.pos}" aria-label="Progress">
            <div class="river-fill" style="width:${pct}%"></div>
            <div class="river-shell" style="left:${pct}%">🐚</div>
          </div>
          <span class="count">${R.pos + 1}/${total}</span>
          ${helpAllowed() ? `<button class="help-btn" id="btn-help" aria-label="Help">?<span>Help</span></button>` : ""}
        </div>
        <div class="lesson-stats">
          <span class="stat streak-chip ${bonusOn() ? "hot" : ""}" id="ls-streak" title="Streak">🔥 <b>${S.streak}</b>${bonusOn() ? `<em>${CFG.streakBonusMult}× 🐚</em>` : ""}</span>
          <span class="stat" id="ls-shells" title="Shells">🐚 <b>${S.shells}</b></span>
          <span class="stat timer-chip ${finishLocked() ? "" : "open"}" id="ls-timer">${finishLocked() ? `🔒 Finish in ${minsToUnlock()} min` : "🏁 Finish open"}</span>
        </div>
        <div class="lesson-grid">
          <section class="lesson-main">
            <div class="type-row">
              <div class="type-tag tone-${T.tone}"><b>${T.label}</b><span>${T.how.split(". ")[0]}.</span></div>
              <div class="combo ${S.combo >= 2 ? "on" : ""}" id="combo">🔥 ${S.combo} in a row</div>
            </div>
            <div class="lesson-body" id="body"></div>
            <div class="foot" id="foot"></div>
          </section>
          ${sideHtml}
        </div>
      </div>`;
    if (!mascot()) { const p = $app.querySelector("#sp-pos"); if (p) p.textContent = `${R.pos + 1} of ${total}`; const c = $app.querySelector("#sp-combo"); if (c) c.textContent = S.combo; const sh = $app.querySelector("#sp-shells"); if (sh) sh.textContent = R.shells; }
    $app.querySelector("#btn-x").onclick = () => attemptLeave();
    const hb = $app.querySelector("#btn-help"); if (hb) hb.onclick = () => openHelp(it);
    if (first) react("start");
    const view = RENDER[it.type](it);
    let tShown = now();
    if (R.kind === "lesson" && !R.nudged && R.pos === R.mid) { R.nudged = true; setTimeout(nudge, 700); }
    const bar = feedbackBar();

    if (helpAllowed() && COACH.includes(it.type) && !S.coachSeen[it.type]) coach(it.type, () => { tShown = now(); });

    if (!view.graded) {
      if (view.custom) return;
      bar.innerHTML = `<div class="fb-inner"><button class="btn btn-primary btn-cta" id="cont">Continue</button></div>`;
      bar.querySelector("#cont").onclick = () => { Log.log("item_view", { round: R.id, item: it.id, type: it.type, dwell_ms: ms(tShown) }); advance(); };
      return;
    }
    if (view.auto) { view.onDone = res => grade(it, res, tShown); return; }
    bar.innerHTML = `<div class="fb-inner">${helpAllowed() && it.hint ? `<span class="fb-hint">Need a hint? Tap Help.</span>` : ""}<button class="btn btn-primary btn-cta" id="check" disabled>Check</button></div>`;
    const $check = bar.querySelector("#check");
    view.onChange = ready => { $check.disabled = !ready; };
    $check.onclick = () => grade(it, view.result(), tShown);
  }
  // Help only in a lesson's first run (not in reviews or practice rounds).
  const helpAllowed = () => R && R.kind === "lesson" && !R.redo;
  // Check button and feedback sit right under the answers.
  function feedbackBar() { const f = $app.querySelector("#foot"); f.className = "foot"; return f; }
  function clearFeedbackBar() {}

  function grade(it, res, tShown) {
    const latency = ms(tShown), lesson = R.kind === "lesson";
    R.graded++; if (res.correct) R.correct++;
    if (lesson && !R.redo && !it.retry) { const l = S.lessons[R.n]; l.graded++; if (res.correct) l.correct++; }
    S.combo = res.correct ? S.combo + 1 : 0; S.maxCombo = Math.max(S.maxCombo, S.combo);
    Log.log("item_answer", { round: R.id, item: it.id, type: it.type, retry: !!it.retry, answer: res.answer, correct_answer: res.expected,
      correct: res.correct, latency_ms: latency, combo: S.combo, ...(res.extra || {}) });
    if (res.correct) { const k = perCorrect(); addShells(k, "correct"); R.shells += k; }
    if (!res.correct) { const k = it.big || it.answer; if (typeof k === "string" && /^[a-z ]+$/.test(k)) S.miss[k] = (S.miss[k] || 0) + 1; }
    if (lesson && !res.correct && !it.retry && it.type !== "match") R.queue.push({ ...it, id: it.id + "-retry", retry: true });
    save();

    const lsS = $app.querySelector("#ls-streak b"); if (lsS) lsS.textContent = S.streak;
    const cb = $app.querySelector("#combo");
    if (cb) { cb.textContent = `🔥 ${S.combo} in a row`; cb.classList.toggle("on", S.combo >= 2); }
    const sc = $app.querySelector("#sp-combo"); if (sc) sc.textContent = S.combo;
    const ss = $app.querySelector("#sp-shells"); if (ss) ss.textContent = R.shells;
    const combo = res.correct && S.combo > 0 && S.combo % CFG.comboEvery === 0;
    react(combo ? "combo" : res.correct ? "correct" : "wrong");
    if (combo) comboPop();

    $app.querySelectorAll("#body button, #body input").forEach(el => el.disabled = true);
    const slips = it.type === "match" && res.extra ? res.extra.mistakes : 0;
    const praise = slips ? "All matched!" : ["Correct!", "Nice!", "You got it!", "Well done!"][rnd(4)];
    const shown = it.type === "judge" ? (it.answer ? "Yes, it's correct" : "No, it's wrong") : res.expected;
    const bar = feedbackBar();
    bar.classList.add(res.correct ? "ok" : "no");
    bar.innerHTML = `
      <div class="fb-inner" role="status">
        <div class="fb-msg">
          <div class="fb-title">${res.correct ? "✓ " + praise : "✗ Not quite"}</div>
          <div class="fb-body">${!res.correct ? `Correct answer: <b>${esc(shown)}</b>${it.explain ? " · " + esc(it.explain) : ""}${lesson && !it.retry && it.type !== "match" ? `<br><span class="muted">You'll see this one again at the end.</span>` : ""}`
                                              : slips ? `You fixed ${slips} mix-up${slips > 1 ? "s" : ""} along the way.` : (it.explain && it.type === "judge" ? esc(it.explain) : "")}</div>
        </div>
        <button class="btn btn-cta ${res.correct ? "btn-ok" : "btn-no"}" id="cont">Continue</button>
      </div>`;
    const tFb = now();
    const $c = bar.querySelector("#cont");
    $c.onclick = () => { Log.log("feedback_continue", { round: R.id, item: it.id, correct: res.correct, dwell_ms: ms(tFb) }); advance(); };
    $c.focus({ preventScroll: true });
  }

  function advance() { R.pos++; R.pos >= R.queue.length ? (R.kind === "lesson" ? finishLesson() : finishPractice()) : renderStep(false); }

  function comboPop() {
    const m = pick("combo");
    Log.log("combo_pop", { n: S.combo, msg: m.idx, text: m.text, ollie: mascot() });
    say(m, S.combo % 10 === 0 ? "combo10" : "combo");
  }
  function nudge() {
    if (!R) return;
    const m = pick("nudge");
    S.nudges++; save();
    Log.log("nudge_shown", { round: R.id, pos: R.pos, msg: m.idx, stage: m.stage, kind: m.kind, text: m.text, mood: mascot() ? m.mood : "" });
    say(m, "nudge");
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
  function demo(type) {
    const chip = (t, c = "") => `<span class="d-chip ${c}">${t}</span>`;
    switch (type) {
      case "match": return `<div class="demo"><div class="d-col">${chip("mira", "sel")}${chip("kelo")}</div><div class="d-arrow">→</div><div class="d-col">${chip("shell")}${chip("fish", "sel")}</div></div>`;
      case "build": return `<div class="demo col"><div class="d-line">${chip("tavo")}${chip("velo")}</div><div class="d-bank">${chip("mira")}${chip("vela")}</div></div>`;
      case "type":  return `<div class="demo"><span class="d-input">mira<i></i></span></div>`;
      case "judge": return `<div class="demo">${chip("👍 Yes")}${chip("👎 No")}</div>`;
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
    if (!r.redo) { l.done = true; l.endedAt = iso(); l.seconds = Math.round((Date.now() - r.t0) / 1000); l.length = r.length; S.len[r.length]++; }
    else S.redos++;
    addShells(CFG.shellsPerLesson, "lesson"); r.shells += CFG.shellsPerLesson;
    streakUp();
    S.goal.active = true; S.goal.shown++;            // goal: one more practice round keeps the streak
    S.lastAct = "lesson_" + r.n + "_" + r.length;
    S.maxStage = Math.max(S.maxStage, stage());
    save();
    Log.log("round_complete", { round: r.id, kind: "lesson", lesson: r.n, length: r.length, redo: r.redo, graded: r.graded, correct: r.correct,
      first_try_correct: l.correct, first_try_graded: l.graded, seconds: Math.round((Date.now() - r.t0) / 1000), shells: r.shells, streak: S.streak, stage: stage() });
    sendSummary(); Log.flush();
    screenComplete(r);
  }
  function screenComplete(r) {
    screen("lesson_complete_" + r.n);
    clearFeedbackBar();
    const acc = r.graded ? Math.round((r.correct / r.graded) * 100) : 100;
    const secs = Math.round((Date.now() - r.t0) / 1000), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, "0");
    const g = pick("gift", { gift: CFG.shellsPerLesson });
    Log.log("gift_shown", { lesson: r.n, text: g.text, ollie: mascot() });
    const hero = mascot()
      ? `<div class="celebrate"><div class="cel-gift solo hop">${Art.trick("gift")}</div></div>`
      : `<div class="celebrate"><div class="cel-gift solo">${Art.trick("giftWe")}</div></div>`;
    $app.innerHTML = `
      <div class="page narrow"><div class="card center complete-card">
        ${hero}
        <p class="gift-line">${esc(g.text)}</p>
        <h1 class="h1">${mascot() ? `Yay, ${nick()}! Lesson ${r.n} done!` : `Lesson ${r.n} complete!`}</h1>
        <p class="lead">${esc(P.lessons[r.n - 1].title)}${r.redo ? " (replay)" : ""}</p>
        <div class="tiles">
          <div class="tile-stat"><span>Accuracy</span><b>${acc}%</b></div>
          <div class="tile-stat"><span>Time</span><b>${mm}:${ss}</b></div>
          <div class="tile-stat shells"><span>Shells</span><b>+${r.shells} 🐚</b></div>
          <div class="tile-stat streak"><span>Streak</span><b>🔥 ${S.streak}</b></div>
        </div>
        <button class="btn btn-primary" id="cont">Continue</button>
      </div></div>`;
    confetti();
    $app.querySelector("#cont").onclick = () => screenHome(nextLesson() ? "between" : "allDone");
  }
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    const cols = ["#1F7A8C", "#F2B544", "#E58A8F", "#2F9461", "#7A5BA8"];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement("i");
      p.style.left = rnd(100) + "%"; p.style.background = cols[i % cols.length];
      p.style.animationDelay = (rnd(600) / 1000) + "s"; p.style.transform = `rotate(${rnd(360)}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3200);
  }

  /* ----------------------- practice (three modes) ----------------------- */
  function startPractice(mode, from) {
    const items = P.practice(mode, lessonsDone(), CFG.practiceLength, S.miss);
    S.practice.started++;
    R = { kind: "practice", mode, id: "P" + S.practice.started + "-" + mode, queue: items, pos: 0, graded: 0, correct: 0, shells: 0, t0: Date.now(), watched: 0 };
    save();
    Log.log("round_start", { round: R.id, kind: "practice", mode, from, goal_active: S.goal.active, n_items: items.length, items: items.map(x => x.word || x.answer) });
    renderStep(true);
    maybeReturn();
  }
  function finishPractice() {
    const r = R; R = null;
    S.practice.rounds++; S.practice.items += r.queue.length; S.practice[r.mode]++;
    addShells(CFG.shellsPerPractice, "practice"); r.shells += CFG.shellsPerPractice;
    streakUp();
    let goalMet = false;
    if (S.goal.active) { S.goal.active = false; S.goal.met++; goalMet = true; }
    S.lastAct = "practice_" + r.mode;
    save();
    Log.log("round_complete", { round: r.id, kind: "practice", mode: r.mode, graded: r.graded, correct: r.correct, n: r.queue.length,
      seconds: Math.round((Date.now() - r.t0) / 1000), shells: r.shells, streak: S.streak, goal_met: goalMet });
    if (goalMet) Log.log("goal_met", { mode: r.mode, streak: S.streak });
    sendSummary(); Log.flush();
    if (S.practice.rounds >= CFG.maxPracticeRounds) return endSession("max_rounds", "practice");
    screen("practice_complete");
    clearFeedbackBar();
    const line = r.mode === "passive" ? `You watched ${r.queue.length} words.` : `You got ${r.correct} of ${r.graded} right.`;
    $app.innerHTML = `
      <div class="page narrow"><div class="card center complete-card">
        ${mascot() ? `<div class="celebrate">${Art.ollie("clap", { cls: "motion-jump play" })}</div>` : `<div class="celebrate"><div class="cel-gift solo small">${Art.trick("giftWe")}</div></div>`}
        <h1 class="h1">Practice round done!</h1>
        <p class="lead">${line} +${r.shells} 🐚 · 🔥 ${S.streak}</p>
        <button class="btn btn-primary" id="cont">Continue</button>
      </div></div>`;
    $app.querySelector("#cont").onclick = () => screenHome("practice", { goalMet });
  }

  /* ------------------------------ break ------------------------------ */
  function screenBreak(from, prevId) {
    screen("break");
    clearFeedbackBar();
    const items = unlockedItems(), pool = items.length > 1 ? items.filter(x => x.id !== prevId) : items;
    const item = pool[rnd(pool.length)], all = breakItems(), t0 = now();
    S.breaks.n++; S.lastAct = "break"; save();
    Log.log("break_start", { item: item.id, from, unlocked: items.length });
    $app.innerHTML = `
      <div class="page wide">
        ${header()}
        <div class="card center break-card">
          <h1 class="h1">${mascot() ? `Ollie's ${esc(item.title.toLowerCase())}!` : esc(item.title)}</h1>
          <div class="stage">${mascot() ? Art.trick(item.id) : Art.neutralAnim(item.id)}</div>
          <div class="collection" aria-label="Collection">
            ${all.map((x, k) => `<span class="coll ${k < S.unlockedN ? "have" : ""}" title="${esc(x.title)}">${k < S.unlockedN ? esc(x.title) : `🔒 ${CFG.unlockAt[k]} 🐚`}</span>`).join("")}
          </div>
          <div class="btn-row two">
            ${items.length > 1 ? `<button class="btn btn-quiet" id="again">Watch another</button>` : ""}
            <button class="btn btn-primary" id="back">Back to home</button>
          </div>
        </div>
      </div>`;
    const end = how => { const d = ms(t0); S.breaks.ms += d; save(); Log.log("break_end", { item: item.id, watch_ms: d, how }); };
    wireHeader("break");
    const fb = $app.querySelector("#btn-finish"), orig = fb.onclick;
    fb.onclick = () => { if (!finishLocked()) end("finish"); orig(); };
    $app.querySelector("#back").onclick = () => { end("back"); screenHome("break"); };
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
        <div class="panel-note compact">${it.lines.join("<br>")}</div>
        <div class="rule-card"><table class="rule-table">${it.examples.map(e => `<tr><td>${hl(e[0])}</td><td>${hl(e[1])}</td><td>${esc(e[2])}</td></tr>`).join("")}</table></div>`;
      return { graded: false };
    },
    pick_pic(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        <div class="grid g${it.options.length}">
          ${it.options.map((o, i) => `<button class="tile" data-k="${esc(o.key)}" aria-label="Picture option ${i + 1}"><span class="tile-n">${i + 1}</span>${Art.icon(o.pic)}</button>`).join("")}
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
        <div class="type-wrap">
          <div class="intro-card slim"><div class="intro-pics">${it.pics.map(p => Art.icon(p)).join("")}</div></div>
          <input class="field type-in" id="typed" placeholder="Type in Pelan" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" aria-label="Your answer">
        </div>`;
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
      $in.onkeydown = e => { if (e.key === "Enter" && norm($in.value)) { e.preventDefault(); document.querySelector("#check")?.click(); } };
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
      feedbackBar().innerHTML = `<div class="fb-inner"><span class="foot-note" id="mcount">0 of ${left.length} pairs matched</span></div>`;
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
            const mc = document.querySelector("#mcount"); if (mc) mc.textContent = `${matched} of ${left.length} pairs matched`;
            // Finishing the match counts as correct; slips are logged, not punished.
            if (matched === left.length) setTimeout(() => v.onDone({ answer: `${matched} pairs`, expected: "all pairs", correct: true, extra: { mistakes, perfect: mistakes === 0, match_ms: ms(t0) } }), 420);
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
    // Passive mode: cards play one by one (Ollie presents them in the Ollie versions).
    explain(it) {
      const secs = CFG.explainSeconds, t0 = now();
      body().innerHTML = `
        <div class="explain-card">
          <div class="intro-pics">${it.pics.map(p => Art.icon(p)).join("")}</div>
          <div class="bigword">${esc(it.word)}</div>
          <div class="gloss">${esc(it.en)}</div>
          <div class="explain-note">${esc(it.note)}</div>
          <div class="autoplay" style="--d:${secs}s"><i></i></div>
        </div>`;
      if (mascot()) { const b = document.querySelector(".side-bubble"); if (b) b.textContent = it.note; }
      const bar = feedbackBar();
      bar.innerHTML = `<div class="fb-inner"><button class="btn btn-quiet btn-cta" id="nextcard">Next</button></div>`;
      let done = false;
      const go = how => { if (done) return; done = true; clearTimeout(timer); R.watched++;
        Log.log("explain_card", { round: R.id, item: it.id, word: it.word, dwell_ms: ms(t0), how }); advance(); };
      const timer = setTimeout(() => go("auto"), secs * 1000);
      bar.querySelector("#nextcard").onclick = () => go("tap");
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
  // number keys pick options (1–4)
  document.addEventListener("keydown", e => {
    if (!R || $modal.querySelector(".overlay") || /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName)) return;
    const n = +e.key; if (!(n >= 1 && n <= 4)) return;
    const opts = document.querySelectorAll("#body .tile, #body .options .opt, #body .yn .opt");
    if (opts[n - 1] && !opts[n - 1].disabled) opts[n - 1].click();
  });

  /* ------------------- prompts: leaving and finishing ------------------- */
  function prompt(type, context, onStay, onGo) {
    if ($modal.querySelector(".prompt-card")) return;
    const what = R && R.kind === "practice" ? "practice round" : "lesson";
    const q = pick(type, { what }), btn = CFG.buttons[type];
    S.prompts.shown++; S.prompts.firstAt = S.prompts.firstAt || iso();
    if (type === "leave") S.leaves.prompts++;
    save();
    Log.log("prompt_shown", { type, context, n: S.prompts.shown, msg: q.idx, stage: q.stage, kind: q.kind, title: q.title, body: q.body,
      mood: mascot() ? q.mood : "", shells: S.shells, streak: S.streak, round: R ? R.id : null, round_pos: R ? R.pos : null, lessons_completed: lessonsDone() });
    sendSummary();
    const t0 = now();
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = `
      <div class="prompt-card ${mascot() ? "has-ollie" : ""} ${guilt() && q.kind ? "pressure" : ""}" role="dialog" aria-modal="true" aria-labelledby="p-title">
        ${mascot() ? `<div class="p-art">${ollieArt(q.mood, "play")}</div>` : ""}
        <h2 class="p-title" id="p-title">${esc(q.title)}</h2>
        ${q.body ? `<p class="p-body">${esc(q.body)}</p>` : ""}
        <div class="p-btns">
          <button class="btn btn-primary" id="stay">${esc(btn.stay)}</button>
          <button class="btn btn-quiet" id="leave">${esc(btn.go)}</button>
        </div>
      </div>`;
    $modal.appendChild(ov);
    ov.querySelector("#stay").focus();
    ov.querySelector("#stay").onclick = () => {
      Log.log("prompt_choice", { type, choice: "continue", context, n: S.prompts.shown, rt_ms: ms(t0) });
      S.prompts.continues++; S.prompts.lastChoice = "continue"; if (type === "leave") S.leaves.stayed++;
      save(); sendSummary(); Log.flush();
      ov.remove();
      const m = pick("stay");
      Log.log("stay_shown", { text: m.text, mood: mascot() ? m.mood : "" });
      say(m, "stay");
      onStay && onStay();
    };
    ov.querySelector("#leave").onclick = () => {
      Log.log("prompt_choice", { type, choice: "leave", context, n: S.prompts.shown, rt_ms: ms(t0) });
      S.prompts.lastChoice = type === "finish" ? "finish" : "leave";
      ov.remove();
      onGo();
    };
  }
  // ✕ in a lesson or practice round → prompt → home (never ends the session)
  function attemptLeave() {
    const context = R.kind === "lesson" ? "mid_lesson" : "mid_practice";
    prompt("leave", context, null, () => {
      Log.log("round_abandoned", { round: R.id, kind: R.kind, pos: R.pos, n_items: R.queue.length, why: "left" });
      S.choices.push("leave-" + (R.kind === "lesson" ? "L" + R.n : R.mode));
      S.leaves.left++; S.leftEarly = true; S.lastAct = "left_" + R.kind;
      streakBreak("left_" + R.kind);
      R = null; save(); sendSummary();
      screenHome("back");
    });
  }
  // Finish (header) → locked message, or prompt → end of session
  function attemptFinish(context) {
    if (finishLocked()) {
      S.lockedClicks++; save();
      const text = CFG.finishLocked.replace("{unlock}", Math.round(T.unlock)).replace("{left}", minsToUnlock());
      Log.log("finish_locked_click", { context, minutes_to_unlock: minsToUnlock() });
      toast(`<span class="toast-ico">🔒</span><span>${esc(text)}</span>`, "info");
      return;
    }
    prompt("finish", context, null, () => { S.choices.push("finish"); endSession("finish", context); });
  }

  /* ------------------------------ ending ------------------------------- */
  function endSession(reason, context) {
    if (R) { Log.log("round_abandoned", { round: R.id, kind: R.kind, pos: R.pos, n_items: R.queue.length, why: reason }); R = null; }
    $modal.innerHTML = ""; clearFeedbackBar();
    S.ended = true; S.endReason = reason; S.endedAt = iso(); S.nickname = ""; save();   // nickname cleared from the device
    Log.log("session_end", { reason, context, lessons_completed: lessonsDone(), shells: S.shells, streak: S.streak, practice_rounds: S.practice.rounds,
      prompts_shown: S.prompts.shown, app_minutes: summary().app_minutes, minutes_after_unlock: summary().minutes_after_unlock });
    sendSummary(); Log.flush();
    screenEnd();
  }
  function surveyLink() {
    if (!CFG.surveyUrl) return "";
    return CFG.surveyUrl.replace(/\{(code|sid|group|condition)\}/g, (_, k) => encodeURIComponent({ code: S.code, sid: S.sid, group: S.group, condition: S.condition }[k]));
  }
  function screenEnd() {
    screen("end");
    if (PREVIEW) return previewEnd();
    const link = surveyLink(), capped = S.endReason === "max_rounds";
    $app.innerHTML = `
      <div class="page ${link && CFG.embedSurvey ? "wide" : "narrow"}"><div class="card">
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
    $app.innerHTML = `<div class="page narrow"><div class="card center">
      <div class="celebrate check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27 l8 8 l15 -16"/></svg></div>
      <h1 class="h1">All done. Thank you!</h1><p class="lead">You can close this tab now.</p></div></div>`;
  }

  /* ------------------------------ preview ------------------------------ */
  // For the research team: view any version without recording anything.
  const VERSIONS = [
    { g: 1, name: "Text + neutral",  ollie: false, framing: "neutral", note: "No mascot. Friendly, informational wording." },
    { g: 2, name: "Ollie + neutral", ollie: true,  framing: "neutral", note: "Ollie celebrates and reacts, but never guilts." },
    { g: 3, name: "Text + guilt",    ollie: false, framing: "guilt",   note: "Same guilt words as Version 4, from the app (\"we\")." },
    { g: 4, name: "Ollie + guilt",   ollie: true,  framing: "guilt",   note: "Happy first; sad when you leave, relieved when you return." }
  ];
  function resetView() {
    R = null; $modal.innerHTML = ""; $toast.innerHTML = ""; clearFeedbackBar();
    document.querySelectorAll(".tour-layer, .ollie-pop, .confetti, .preview-bar").forEach(e => e.remove());
  }
  function startPreview(which) {
    resetView();
    if (which === "hub") return previewHub();
    S = newState();
    S.nickname = "Preview"; S.code = "PREVIEW"; S.group = which; S.assignMode = "preview";
    S.condition = G().key; S.startedAt = iso();
    ctx(); applyTheme(); previewBar();
    screenIntro(0);
  }
  function go(which) {
    const h = which === "hub" ? "#preview" : "#v" + which;
    if (location.hash !== h) location.hash = h; else startPreview(which);
  }
  addEventListener("hashchange", () => { if (PREVIEW && hashPV()) startPreview(hashPV()); });

  function previewHub() {
    S = null; document.body.dataset.mascot = "0";
    screen("preview_hub");
    const chip = (on, t, warn) => `<span class="pv-chip ${warn ? "warn" : on ? "on" : ""}">${t}</span>`;
    $app.innerHTML = `
      <div class="page pv-shell">
        <div class="pv-head">
          <div class="brand">${Art.logo}<span>Pelan</span></div>
          <h1 class="h1">Study versions</h1>
          <p class="lead">Open any of the four versions participants can be assigned to (Ollie or not × neutral or guilt wording). Previews start after sign-up, nothing is recorded, and no survey responses are created.</p>
        </div>
        <div class="pv-grid">
          ${VERSIONS.map(v => `
            <button class="pv-card ${v.ollie ? "has-ollie" : ""}" data-g="${v.g}" aria-label="Open Version ${v.g}: ${esc(v.name)}">
              <span class="pv-art">${v.ollie ? Art.ollie(v.framing === "neutral" ? "wave" : "sad") : `<span class="pv-num">${v.g}</span>`}</span>
              <span class="pv-body">
                <span class="pv-k">Version ${v.g}</span>
                <b class="pv-name">${esc(v.name)}</b>
                <span class="pv-note">${esc(v.note)}</span>
                <span class="pv-chips">${chip(v.ollie, v.ollie ? "Ollie" : "No Ollie")}${chip(false, v.framing === "guilt" ? "Guilt wording" : "Neutral wording", v.framing === "guilt")}</span>
              </span>
              <span class="pv-open">Open →</span>
            </button>`).join("")}
        </div>
        <div class="pv-foot">
          <button class="btn btn-quiet" id="pv-signup">See the sign-up screens (random version)</button>
          <p class="hint">Tip: add <b>#v1</b> to <b>#v4</b> to the end of the link to open one version directly. In a preview, the bottom bar can skip lessons and jump the clock.</p>
        </div>
      </div>`;
    $app.querySelectorAll(".pv-card").forEach(b => b.onclick = () => go(+b.dataset.g));
    $app.querySelector("#pv-signup").onclick = () => { S = newState(); S.nickname = ""; ctx(); screenEligibility(); };
  }
  function previewBar() {
    const d = document.createElement("div");
    d.className = "preview-bar";
    if (innerWidth > 900) d.classList.add("open");
    d.innerHTML = `
      <button class="pv-tag" id="pv-toggle" aria-label="Show preview tools">Preview ▾</button>
      <span class="pv-more">
      <label class="pv-switch"><span class="sr">Version</span>
        <select id="pv-sel" aria-label="Switch version">${VERSIONS.map(x => `<option value="${x.g}" ${x.g === S.group ? "selected" : ""}>V${x.g} · ${esc(x.name)}</option>`).join("")}</select></label>
      <button id="pv-skip" title="Finish the current lesson instantly">Skip lesson</button>
      <button id="pv-clock" title="Move the clock forward 10 minutes">+10 min</button>
      <button id="pv-leave" title="Show this version's leave message">Leave msg</button>
      <button id="pv-all">All versions</button></span>`;
    document.body.appendChild(d);
    d.querySelector("#pv-toggle").onclick = () => d.classList.toggle("open");
    d.querySelector("#pv-sel").onchange = e => go(+e.target.value);
    d.querySelector("#pv-skip").onclick = () => {
      if (!S || S.ended) return;
      $modal.innerHTML = "";
      if (!R) { const n = nextLesson(); if (!n) return; startLesson(n, "full"); }
      R.pos = R.queue.length - 1; advance();
    };
    d.querySelector("#pv-clock").onclick = () => { if (!S) return; startClock(); S.clockStart -= 10 * 60000; toast(`<span class="toast-ico">⏩</span><span>Clock: ${Math.floor(elapsedMin())} min</span>`, "info"); };
    d.querySelector("#pv-leave").onclick = () => { if (S && !S.ended) { const n = nextLesson() || 1; if (!R) startLesson(n, "quick"); attemptLeave(); } };
    d.querySelector("#pv-all").onclick = () => go("hub");
  }
  function previewEnd() {
    screen("end");
    const link = surveyLink();
    $app.innerHTML = `
      <div class="page narrow"><div class="card">
        <div class="brand">${Art.logo}<span>Pelan</span></div>
        <h1 class="h1">End of the app</h1>
        <p class="lead">Participants see their study code here, with the Qualtrics survey and quiz embedded below it. The survey isn't loaded in a preview so no test responses are created.</p>
        ${link ? `<p class="hint">To look at the survey itself, <a href="${esc(link.split("?")[0])}" target="_blank" rel="noopener">open it in a new tab</a> (this creates a response in Qualtrics).</p>` : ""}
        <div class="btn-row">
          <button class="btn btn-primary" id="pv-again">Try another version</button>
          <button class="btn btn-quiet" id="pv-same">Restart this version</button>
        </div>
      </div></div>`;
    $app.querySelector("#pv-again").onclick = () => go("hub");
    $app.querySelector("#pv-same").onclick = () => startPreview(S.group);
  }

  /* ------------------------------- debug ------------------------------- */
  function debugBar() {
    if (!DEBUG || document.querySelector(".debug-bar")) return;
    const d = document.createElement("div");
    d.className = "debug-bar";
    d.innerHTML = `<button id="dbg-t" aria-label="Debug tools">G${S.group} ⚙</button><span class="dbg-more"><span>${esc(S.condition)} · ${esc(S.assignMode)}${Log.enabled ? "" : " · no backend"}</span>
      <button id="dbg-skip">skip lesson</button><button id="dbg-clock">+10 min</button><button id="dbg-csv">csv</button><button id="dbg-r">reset</button></span>`;
    document.body.appendChild(d);
    d.querySelector("#dbg-t").onclick = () => d.classList.toggle("open");
    d.querySelector("#dbg-skip").onclick = () => { if (!R) { const n = nextLesson(); if (!n) return; startLesson(n, "full"); } R.pos = R.queue.length - 1; advance(); };
    d.querySelector("#dbg-clock").onclick = () => { startClock(); S.clockStart -= 10 * 60000; save(); };
    d.querySelector("#dbg-csv").onclick = () => Log.downloadCSV();
    d.querySelector("#dbg-r").onclick = () => { localStorage.removeItem(STORE); location.reload(); };
  }

  if (DEBUG || PREVIEW) window.__pelan = { round: () => R, state: () => S, pick, stage };
  boot();
})();
