/* =========================================================================
   OLLIE STUDY APP
   Flow: consent → welcome (name, ID) → RANDOM GROUP ASSIGNMENT → Ollie
   onboarding → home + app tour → Lesson 1 → (practice rounds …) →
   quit attempt → condition-specific exit prompt → survey redirect.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.OLLIE_CONFIG, P = window.PELAN, Art = window.OllieArt, Log = window.OllieLog;
  const $app = document.getElementById("app");
  const $modal = document.getElementById("modal-root");
  const qs = new URLSearchParams(location.search);
  const DEBUG = !!CFG.allowDebug && qs.get("debug") === "1";
  const STORE = "ollie_state_" + CFG.studyId;

  let S = null;      // persisted session state
  let R = null;      // current round (not persisted)
  let hiddenAt = null;

  /* ------------------------------ helpers ------------------------------ */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => performance.now();
  const iso = () => new Date().toISOString();
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "s-" + Date.now().toString(36) + "-" + rnd(1e9).toString(36));
  const norm = s => String(s).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (_) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch (_) { return null; } };
  const groupCfg = () => CFG.groups[S.group] || CFG.groups[5];
  const picHTML = p => `<span class="pic" style="--s:${p.s}">${p.e}</span>`;
  const firstName = () => esc((S.name || "").trim().split(/\s+/)[0] || "friend");
  function screen(name) { Log.setContext({ screen: name }); window.scrollTo(0, 0); }
  function ctx() { Log.setContext({ sid: S.sid, pid: S.pid, group: S.group, condition: S.condition, mode: S.assignMode, debug: DEBUG }); }
  function urlPid() { for (const k of CFG.pidParams) { const v = qs.get(k); if (v) return v.trim().slice(0, 80); } return ""; }

  function newState() {
    const pid = urlPid();
    return {
      v: 1, studyId: CFG.studyId, sid: uid(), pid, pidSource: pid ? "url" : "",
      name: "", group: null, condition: null, assignMode: null,
      createdAt: iso(), startedAt: null, gems: 0, xp: 0, streak: 0, tourDone: false,
      lesson1: { done: false, graded: 0, correct: 0, startedAt: null, endedAt: null, attempts: 0 },
      practice: { started: 0, rounds: 0, modes: [] },
      prompts: { shown: 0, continues: 0, firstAt: null, lastChoice: null },
      hiddenMs: 0, ended: false, endReason: null, endedAt: null
    };
  }

  function summary() {
    const secs = (a, b) => (a ? Math.round(((b ? Date.parse(b) : Date.now()) - Date.parse(a)) / 1000) : "");
    const s = {
      sid: S.sid, pid: S.pid, pid_source: S.pidSource, study_id: S.studyId,
      group: S.group, condition: S.condition, assign_mode: S.assignMode,
      started_at: S.startedAt, ended_at: S.endedAt || "", end_reason: S.endReason || "",
      tour_completed: S.tourDone,
      lesson1_completed: S.lesson1.done, lesson1_graded: S.lesson1.graded, lesson1_correct: S.lesson1.correct,
      lesson1_accuracy: S.lesson1.graded ? +(S.lesson1.correct / S.lesson1.graded).toFixed(3) : "",
      lesson1_seconds: S.lesson1.endedAt ? secs(S.lesson1.startedAt, S.lesson1.endedAt) : "",
      practice_rounds_started: S.practice.started, practice_rounds_completed: S.practice.rounds,
      practice_modes: S.practice.modes.join(">"),
      prompts_shown: S.prompts.shown, prompt_continues: S.prompts.continues, final_choice: S.prompts.lastChoice || "",
      first_prompt_at: S.prompts.firstAt || "",
      seconds_after_first_prompt: S.prompts.firstAt ? secs(S.prompts.firstAt, S.endedAt) : "",
      gems: S.gems, xp: S.xp, streak: S.streak,
      session_seconds: secs(S.startedAt, S.endedAt), hidden_seconds: Math.round(S.hiddenMs / 1000),
      user_agent: navigator.userAgent.slice(0, 200), updated_at: iso()
    };
    if (CFG.logName) s.name = S.name;
    return s;
  }
  const sendSummary = () => { if (S && S.group) Log.summary(summary()); };

  function addRewards(xp, gems) {
    S.xp += xp; S.gems += gems; save();
    const g = document.querySelector("#stat-gems b"), x = document.querySelector("#stat-xp b");
    if (g) { g.textContent = S.gems; g.parentElement.classList.remove("bump"); void g.offsetWidth; if (gems) g.parentElement.classList.add("bump"); }
    if (x) x.textContent = S.xp;
  }

  /* ------------------------------- boot -------------------------------- */
  function boot() {
    if (DEBUG && qs.get("reset") === "1") {
      localStorage.removeItem(STORE);
      const q = new URLSearchParams(location.search); q.delete("reset");
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
    }
    const saved = load();
    if (saved && saved.sid && saved.studyId === CFG.studyId && saved.group) {
      S = saved; ctx();
      if (S.ended) return screenEnd();
      Log.log("session_resumed", { lesson1_done: S.lesson1.done, practice_rounds: S.practice.rounds });
      debugBar();
      return screenHome();
    }
    S = newState(); ctx();
    Log.log("page_load", { url_pid: !!S.pid, referrer: document.referrer.slice(0, 200), w: innerWidth, h: innerHeight });
    CFG.showConsent ? screenConsent() : screenWelcome();
  }

  document.addEventListener("visibilitychange", () => {
    if (!S) return;
    if (document.hidden) { hiddenAt = Date.now(); Log.log("tab_hidden"); Log.flush(true); }
    else if (hiddenAt) { const ms = Date.now() - hiddenAt; S.hiddenMs += ms; hiddenAt = null; save(); Log.log("tab_visible", { hidden_ms: ms }); }
  });

  /* ------------------------------ consent ------------------------------ */
  function screenConsent() {
    screen("consent");
    $app.innerHTML = `
      <div class="shell"><div class="card">
        <h2 class="title">Consent to take part</h2>
        <div class="consent">${CFG.consentHtml}</div>
        <div style="margin-top:26px">
          <button class="btn btn-green" id="agree">I agree</button>
          <button class="btn btn-beige" id="decline">I do not agree</button>
        </div>
      </div></div>`;
    const t0 = now();
    $app.querySelector("#agree").onclick = () => { Log.log("consent", { agreed: true, read_ms: Math.round(now() - t0) }); screenWelcome(); };
    $app.querySelector("#decline").onclick = () => {
      Log.log("consent", { agreed: false, read_ms: Math.round(now() - t0) }); Log.flush(true);
      $app.innerHTML = `<div class="shell"><div class="card center"><h2 class="title">No problem</h2><p class="sub">You chose not to take part. You can close this tab now.</p></div></div>`;
    };
  }

  /* ------------------------------ welcome ------------------------------ */
  function screenWelcome() {
    screen("welcome");
    const askPid = !S.pid;
    $app.innerHTML = `
      <div class="shell"><div class="card center">
        ${Art.svg("wave", { cls: "hero-ollie" })}
        <h1 class="title">Hi, I'm Ollie!</h1>
        <p class="sub">Let's learn a few words together.</p>
        <form id="f" autocomplete="off" novalidate>
          <label class="label" for="name">What is your name?</label>
          <input class="field" id="name" maxlength="40" placeholder="Your first name">
          ${askPid ? `
          <label class="label" for="pid">Participant ID</label>
          <input class="field" id="pid" maxlength="80" placeholder="${CFG.requirePid ? "From your study instructions" : "From your instructions (optional)"}">` : ""}
          <div class="error-text" id="err"></div>
          <button class="btn btn-green" id="start" type="submit" style="margin-top:18px" disabled>Start</button>
        </form>
      </div></div>`;
    const $n = $app.querySelector("#name"), $p = $app.querySelector("#pid"), $b = $app.querySelector("#start"), $e = $app.querySelector("#err");
    const valid = () => $n.value.trim().length > 0 && (!askPid || !CFG.requirePid || $p.value.trim().length > 0);
    const upd = () => { $b.disabled = !valid(); };
    $n.oninput = upd; if ($p) $p.oninput = upd;
    $n.focus();
    $app.querySelector("#f").onsubmit = async ev => {
      ev.preventDefault(); if (!valid() || $b.dataset.busy) return;
      $b.dataset.busy = "1"; $b.disabled = true; $b.textContent = "Getting ready…"; $e.textContent = "";
      S.name = $n.value.trim().slice(0, 40);
      if (askPid) {
        const typed = $p.value.trim().slice(0, 80);
        S.pid = typed || "anon-" + S.sid.slice(0, 8);
        S.pidSource = typed ? "typed" : "generated";
      }
      ctx();
      await startSession();
    };
  }

  /* ------------------------- random assignment ------------------------- */
  async function assignGroup() {
    const forced = parseInt(qs.get("group"), 10);
    if (DEBUG && forced >= 1 && forced <= 5) return { group: forced, mode: "debug" };
    if (Log.enabled) {
      try {
        const j = await Log.assign({ action: "assign", studyId: CFG.studyId, sid: S.sid, pid: S.pid, pidSource: S.pidSource, debug: DEBUG, userAgent: navigator.userAgent.slice(0, 200) }, 12000);
        if (j && j.ok && j.group >= 1 && j.group <= 5) return { group: j.group, mode: j.existing ? "server_existing_pid" : (DEBUG ? "debug" : "server") };
        Log.log("assign_error", { response: j });
      } catch (err) { Log.log("assign_error", { error: String(err).slice(0, 200) }); }
    }
    return { group: 1 + rnd(5), mode: Log.enabled ? "local_fallback" : "local_no_backend" };
  }

  async function startSession() {
    const a = await assignGroup();
    S.group = a.group; S.assignMode = a.mode; S.condition = groupCfg().key; S.startedAt = iso();
    save(); ctx();
    Log.log("session_start", { group: S.group, condition: S.condition, assign_mode: S.assignMode, pid_source: S.pidSource, name_len: S.name.length });
    sendSummary(); Log.flush();
    debugBar();
    screenIntro(0);
  }

  /* ----------------------- onboarding (baseline) ----------------------- */
  const INTRO = [
    { mood: "wave", html: () => `Nice to meet you, <b>${firstName()}</b>! I'm Ollie. I live by the river, and today I'll teach you a few words of <b>Pelan</b>, the river language.` },
    { mood: "talk", html: () => `Here's how it works:
        <ul class="howto">
          <li><span class="ico">📘</span><span><b>Lessons</b> teach you new words.</span></li>
          <li><span class="ico">💎</span><span>Earn <b>gems</b> for correct answers.</span></li>
          <li><span class="ico">⭐</span><span>Collect <b>XP</b> as you practice.</span></li>
          <li><span class="ico">🔥</span><span>Keep your <b>streak</b> going.</span></li>
        </ul>` },
    { mood: "cheer", html: () => `Ready? Let me show you around first!` }
  ];
  function screenIntro(i) {
    screen("onboarding_" + (i + 1));
    const st = INTRO[i], t0 = now();
    $app.innerHTML = `
      <div class="shell"><div class="card">
        <div class="talk">${Art.svg(st.mood)}<div class="bubble">${st.html()}</div></div>
        <button class="btn btn-green" id="next">${i === INTRO.length - 1 ? "Show me around" : "Continue"}</button>
      </div></div>`;
    $app.querySelector("#next").onclick = () => {
      Log.log("onboarding_step", { step: i + 1, dwell_ms: Math.round(now() - t0) });
      i + 1 < INTRO.length ? screenIntro(i + 1) : screenHome();
    };
  }

  /* -------------------------------- home ------------------------------- */
  function topBar() {
    return `<div class="topbar">
      <button class="quit-btn" id="btn-quit" aria-label="Quit the session">✕ Quit</button>
      <div class="stats">
        <span class="stat" id="stat-streak" title="Streak">🔥 <b>${S.streak}</b></span>
        <span class="stat" id="stat-gems" title="Gems">💎 <b>${S.gems}</b></span>
        <span class="stat" id="stat-xp" title="XP">⭐ <b>${S.xp}</b></span>
      </div></div>`;
  }

  function screenHome() {
    screen("home");
    const done = S.lesson1.done;
    $app.innerHTML = `
      <div class="shell">
        ${topBar()}
        <div class="unit-banner"><div><div class="unit-kicker">Unit 1</div><div class="unit-title">River words</div></div><div class="unit-emoji">🌊</div></div>
        <div class="path">
          ${!done ? `<div class="start-tag">START</div>` : ""}
          <button class="path-node lesson1 ${done ? "done" : "current"}" id="node-lesson1" ${done ? "disabled" : ""}>
            <span class="node-circle">${done ? "✓" : "★"}</span><span class="node-label">Lesson 1</span></button>
          <button class="path-node practice ${done ? "current" : "locked"}" id="node-practice" ${done ? "" : "disabled"}>
            <span class="node-circle">${done ? "💪" : "🔒"}</span><span class="node-label">Practice</span></button>
          <div class="path-ollie">${Art.svg(done ? "cheer" : "talk")}</div>
        </div>
      </div>`;
    $app.querySelector("#btn-quit").onclick = () => attemptQuit("home");
    $app.querySelector("#node-lesson1").onclick = () => { Log.log("tap_lesson1"); startRound("lesson1"); };
    $app.querySelector("#node-practice").onclick = () => { Log.log("tap_practice"); screenPractice(); };
    if (!S.tourDone) setTimeout(runTour, 250);
  }

  /* -------------------------------- tour ------------------------------- */
  function runTour() {
    const steps = [
      { t: "#node-lesson1", text: "This is your <b>learning path</b>. Each lesson teaches you new Pelan words." },
      { t: "#stat-gems", text: "These are your <b>gems</b> 💎. You earn them for correct answers." },
      { t: "#stat-xp", text: "<b>XP</b> ⭐ shows how much you've practiced." },
      { t: "#stat-streak", text: "Your <b>streak</b> 🔥 counts the days in a row you learn with me." },
      { t: "#node-practice", text: "After a lesson, <b>Practice</b> unlocks. You can practice as much as you like." },
      { t: "#btn-quit", text: "When you're finished, tap <b>Quit</b> to end your session." },
      { t: "#node-lesson1", text: "That's it! Tap <b>Lesson 1</b> to begin." }
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
      const r = el.getBoundingClientRect(), pad = 8;
      const last = i === steps.length - 1;
      layer.innerHTML = `
        <div class="tour-spot" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
        <div class="tour-tip" role="dialog" aria-live="polite">
          ${Art.svg("talk")}
          <div class="tour-text">${st.text}</div>
          <div class="tour-actions"><span class="tour-dots">${i + 1} / ${steps.length}</span>
            <button class="btn btn-green btn-sm" id="tour-next">${last ? "Got it!" : "Next"}</button></div>
        </div>`;
      const tip = layer.querySelector(".tour-tip");
      const th = tip.offsetHeight, tw = tip.offsetWidth;
      let top = r.bottom + pad + 14;
      if (top + th > innerHeight - 12) top = Math.max(12, r.top - pad - 14 - th);
      const left = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), innerWidth - tw - 12);
      tip.style.top = top + "px"; tip.style.left = left + "px";
      layer.querySelector("#tour-next").onclick = next;
    }
    function next() {
      Log.log("tour_step", { step: i + 1, target: steps[i].t, dwell_ms: Math.round(now() - tStep) });
      i++; tStep = now();
      i < steps.length ? place() : finish(false);
    }
    function finish(aborted) {
      removeEventListener("resize", place);
      layer.remove();
      S.tourDone = true; save();
      Log.log("tour_complete", { total_ms: Math.round(now() - tStart), aborted });
      sendSummary();
    }
    addEventListener("resize", place);
    place();
  }

  /* ------------------------------ practice ----------------------------- */
  function screenPractice() {
    screen("practice_picker");
    const t0 = now();
    $app.innerHTML = `
      <div class="shell">
        ${topBar()}
        <button class="back-btn" id="back">← Back to path</button>
        <h2 class="title">Choose your practice</h2>
        <p class="sub" style="margin-bottom:12px">Every round earns the same reward.</p>
        <div class="modes">
          ${CFG.practiceModes.map((m, i) => `
            <button class="mode" data-mode="${m.id}" data-pos="${i + 1}">
              <span class="ico">${m.icon}</span>
              <span><div class="m-title">${esc(m.title)}</div><div class="m-desc">${esc(m.desc)}</div></span>
              <span class="tag">${esc(m.tag)}</span>
            </button>`).join("")}
        </div>
        <p class="reward-note">+${CFG.practiceXp} XP · +${CFG.practiceGems} 💎 per round</p>
      </div>`;
    $app.querySelector("#btn-quit").onclick = () => attemptQuit("practice_picker");
    $app.querySelector("#back").onclick = () => { Log.log("practice_picker_back", { dwell_ms: Math.round(now() - t0) }); screenHome(); };
    $app.querySelectorAll(".mode").forEach(b => b.onclick = () => {
      Log.log("practice_mode_chosen", { mode: b.dataset.mode, position: +b.dataset.pos, decide_ms: Math.round(now() - t0), round_no: S.practice.started + 1 });
      startRound("practice", b.dataset.mode);
    });
  }

  /* ---------------------------- round runner --------------------------- */
  function startRound(kind, mode) {
    const items = kind === "lesson1" ? P.lesson1() : P.practice(mode, CFG.practiceRoundLength);
    if (kind === "lesson1") { S.lesson1.attempts++; S.lesson1.startedAt = S.lesson1.startedAt || iso(); S.lesson1.graded = 0; S.lesson1.correct = 0; }
    else S.practice.started++;
    R = {
      id: kind === "lesson1" ? "L1" + (S.lesson1.attempts > 1 ? "-" + S.lesson1.attempts : "") : "P" + S.practice.started,
      kind, mode: mode || "lesson", queue: items, pos: 0, graded: 0, correct: 0, xp: 0, gems: 0, t0: Date.now()
    };
    save();
    Log.log("round_start", { round: R.id, kind, mode: R.mode, n_items: items.length, items: kind === "practice" ? items.map(x => ({ id: x.id, type: x.type, answer: x.answer ?? x.word })) : undefined });
    renderStep();
  }

  function renderStep() {
    const it = R.queue[R.pos];
    screen(R.kind === "lesson1" ? "lesson1" : "practice_" + R.mode);
    const pct = Math.round((R.pos / R.queue.length) * 100);
    $app.innerHTML = `
      <div class="shell lesson">
        <div class="lesson-top">
          <button class="x-btn" id="btn-x" aria-label="Quit">✕</button>
          <div class="progress" role="progressbar" aria-valuenow="${pct}"><div class="bar" style="width:${Math.max(pct, 3)}%"></div></div>
          <span class="stat" id="stat-gems">💎 <b>${S.gems}</b></span>
        </div>
        <div class="lesson-body" id="body"></div>
        <div class="lesson-foot" id="foot"></div>
      </div>`;
    $app.querySelector("#btn-x").onclick = () => attemptQuit("mid_round");
    const view = RENDER[it.type](it);
    const tShown = now();
    const $foot = $app.querySelector("#foot");

    if (!view.graded) {
      $foot.innerHTML = `<button class="btn btn-green" id="cont">Continue</button>`;
      $foot.querySelector("#cont").onclick = () => {
        Log.log("item_view", { round: R.id, item: it.id, type: it.type, dwell_ms: Math.round(now() - tShown) });
        advance();
      };
      return;
    }
    if (view.auto) { view.onDone = res => grade(it, res, tShown); return; }
    $foot.innerHTML = `<button class="btn btn-green" id="check" disabled>Check</button>`;
    const $check = $foot.querySelector("#check");
    view.onChange = ready => { $check.disabled = !ready; };
    $check.onclick = () => grade(it, view.result(), tShown);
  }

  function grade(it, res, tShown) {
    const latency = Math.round(now() - tShown);
    const isLesson = R.kind === "lesson1";
    R.graded++; if (res.correct) R.correct++;
    if (isLesson && !it.retry) { S.lesson1.graded++; if (res.correct) S.lesson1.correct++; }
    Log.log("item_answer", { round: R.id, mode: R.mode, item: it.id, type: it.type, retry: !!it.retry,
      answer: res.answer, correct_answer: res.expected, correct: res.correct, latency_ms: latency, ...(res.extra || {}) });
    if (isLesson && res.correct) { addRewards(CFG.xpPerCorrect, CFG.gemsPerCorrect); R.xp += CFG.xpPerCorrect; R.gems += CFG.gemsPerCorrect; }
    if (isLesson && !res.correct && !it.retry && it.type !== "match") R.queue.push({ ...it, id: it.id + "-retry", retry: true });

    const $foot = $app.querySelector("#foot");
    $app.querySelectorAll("#body button, #body input").forEach(el => el.disabled = true);
    const praise = ["Nice!", "Great job!", "Correct!", "You got it!"][rnd(4)];
    $foot.innerHTML = `
      <div class="feedback ${res.correct ? "ok" : "no"}" role="status">
        <div class="fb-title">${res.correct ? "✓ " + praise : "✗ Not quite"}</div>
        ${!res.correct ? `<div class="fb-body">Correct answer: <b>${esc(it.type === "judge" ? (it.answer ? "Yes" : "No") : res.expected)}</b>${it.explain ? "<br>" + esc(it.explain) : ""}</div>`
                       : (it.explain && it.type === "judge" ? `<div class="fb-body">${esc(it.explain)}</div>` : `<div class="fb-body"></div>`)}
        <button class="btn ${res.correct ? "btn-green" : "btn-red"}" id="cont">Continue</button>
      </div>`;
    const tFb = now();
    $foot.querySelector("#cont").onclick = () => {
      Log.log("feedback_continue", { round: R.id, item: it.id, correct: res.correct, dwell_ms: Math.round(now() - tFb) });
      advance();
    };
    $foot.querySelector("#cont").focus({ preventScroll: true });
  }

  function advance() { R.pos++; save(); R.pos >= R.queue.length ? finishRound() : renderStep(); }

  function finishRound() {
    const r = R; R = null;
    const secs = Math.round((Date.now() - r.t0) / 1000);
    let firstStreak = false;
    if (r.kind === "lesson1") {
      S.lesson1.done = true; S.lesson1.endedAt = iso();
      addRewards(0, CFG.lessonBonusGems); r.gems += CFG.lessonBonusGems;
      if (S.streak === 0) { S.streak = 1; firstStreak = true; }
    } else {
      S.practice.rounds++; S.practice.modes.push(r.mode);
      addRewards(CFG.practiceXp, CFG.practiceGems); r.xp += CFG.practiceXp; r.gems += CFG.practiceGems;
    }
    save();
    Log.log("round_complete", { round: r.id, kind: r.kind, mode: r.mode, graded: r.graded, correct: r.correct, seconds: secs, xp: r.xp, gems: r.gems, total_gems: S.gems, total_xp: S.xp });
    sendSummary(); Log.flush();
    if (r.kind === "practice" && S.practice.rounds >= CFG.maxPracticeRounds) return endSession("max_rounds", "round_complete");
    screenComplete(r, firstStreak);
  }

  function screenComplete(r, firstStreak) {
    screen("round_complete");
    const acc = r.graded ? Math.round((r.correct / r.graded) * 100) + "%" : "—";
    $app.innerHTML = `
      <div class="shell"><div class="card center">
        ${Art.svg("cheer", { cls: "hero-ollie" })}
        <h2 class="title">${r.kind === "lesson1" ? "Lesson complete!" : "Practice complete!"}</h2>
        <p class="sub">Great job, ${firstName()}!</p>
        <div class="tiles">
          <div class="stat-tile xp"><div class="t">XP</div><div class="v">⭐ ${r.xp}</div></div>
          <div class="stat-tile gem"><div class="t">Gems</div><div class="v">💎 ${r.gems}</div></div>
          <div class="stat-tile acc"><div class="t">${r.kind === "practice" && r.mode === "watch" ? "Cards" : "Accuracy"}</div><div class="v">${r.kind === "practice" && r.mode === "watch" ? r.queue.length : acc}</div></div>
        </div>
        ${firstStreak ? `<div class="streak-banner">🔥 You started a 1 day streak!</div>` : ""}
        <button class="btn btn-green" id="cont">Continue</button>
        <button class="btn btn-beige" id="done">I'm done for now</button>
      </div></div>`;
    $app.querySelector("#cont").onclick = () => { Log.log("complete_continue", { round: r.id }); screenHome(); };
    $app.querySelector("#done").onclick = () => attemptQuit("round_complete");
  }

  /* ----------------------------- exercises ----------------------------- */
  // Each renderer fills #body and returns a view: { graded, result(), onChange, auto, onDone }
  const body = () => $app.querySelector("#body");
  const RENDER = {
    intro(it) {
      body().innerHTML = `
        <div class="kicker">${esc(it.kicker || "New word")}</div>
        <div class="q-title">Meet a new word</div>
        <div class="intro-card">
          <div class="intro-pics">${it.pics.map((p, i) => `<figure>${picHTML(p)}${it.captions ? `<figcaption>${esc(it.captions[i])}</figcaption>` : ""}</figure>`).join("")}</div>
          <div class="bigword">${esc(it.word)}</div>
          <div class="gloss">${esc(it.en)}</div>
        </div>`;
      return { graded: false };
    },

    watch(it) {
      body().innerHTML = `
        <div class="talk">${Art.svg("talk")}<div class="bubble">This is <b>${esc(it.word)}</b>. It means “${esc(it.en)}”.${it.note ? "<br><span style='color:var(--muted)'>" + esc(it.note) + "</span>" : ""}</div></div>
        <div class="intro-card"><div class="intro-pics">${it.pics.map(picHTML).join("")}</div><div class="bigword">${esc(it.word)}</div><div class="gloss">${esc(it.en)}</div></div>`;
      return { graded: false };
    },

    rule(it) {
      const hl = w => w.replace(/(a)(\b)/g, '<span class="end-a">$1</span>$2').replace(/(o)(\b)/g, '<span class="end-o">$1</span>$2');
      body().innerHTML = `
        <div class="kicker">Tip</div>
        <div class="q-title">${esc(it.title)}</div>
        <div class="talk">${Art.svg("talk")}<div class="bubble">${it.lines.join("<br>")}</div></div>
        <div class="rule-card"><table class="rule-table">${it.examples.map(e => `<tr><td>${hl(e[0])}</td><td>${hl(e[1])}</td><td>${esc(e[2])}</td></tr>`).join("")}</table></div>`;
      return { graded: false };
    },

    pick_pic(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        <div class="grid ${it.options.length === 3 ? "three" : ""}">
          ${it.options.map(o => `<button class="tile" data-k="${esc(o.key)}" aria-label="picture option">${picHTML(o.pic)}</button>`).join("")}
        </div>`;
      return single(it, ".tile");
    },

    pick_text(it) {
      body().innerHTML = `
        <div class="q-title">${esc(it.prompt)}</div>
        ${it.big ? `<div class="phrase-card"><div class="bigword">${esc(it.big)}</div></div>` : ""}
        <div class="options">${it.options.map(o => `<button class="opt" data-k="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
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
        <div class="intro-card" style="padding:20px"><div class="intro-pics" style="min-height:90px">${it.pics.map(picHTML).join("")}</div></div>
        <input class="field" id="typed" style="margin-top:22px;border-radius:20px" placeholder="Type in Pelan" autocapitalize="off" autocorrect="off" spellcheck="false">`;
      const $in = body().querySelector("#typed");
      const v = { graded: true, result: () => ({ answer: $in.value, expected: it.answer, correct: norm($in.value) === norm(it.answer) }) };
      $in.oninput = () => v.onChange && v.onChange(norm($in.value).length > 0);
      $in.onkeydown = e => { if (e.key === "Enter" && norm($in.value)) { e.preventDefault(); $app.querySelector("#check")?.click(); } };
      setTimeout(() => $in.focus({ preventScroll: true }), 50);
      return v;
    },

    build(it) {
      const bank = it.bank.map((w, i) => ({ w, i }));
      let chosen = [];
      body().innerHTML = `
        <div class="kicker">Translate</div>
        <div class="q-title">“${esc(it.en)}”</div>
        <div class="build-target" id="tgt"></div>
        <div class="bank" id="bank"></div>`;
      const v = { graded: true, result: () => { const a = chosen.map(i => bank[i].w).join(" "); return { answer: a, expected: it.answer, correct: norm(a) === norm(it.answer) }; } };
      const draw = () => {
        body().querySelector("#tgt").innerHTML = chosen.map(i => `<button class="chip" data-i="${i}">${esc(bank[i].w)}</button>`).join("");
        body().querySelector("#bank").innerHTML = bank.map(b => `<button class="chip ${chosen.includes(b.i) ? "placeholder" : ""}" data-i="${b.i}">${esc(b.w)}</button>`).join("");
        body().querySelectorAll("#tgt .chip").forEach(c => c.onclick = () => { chosen = chosen.filter(i => i !== +c.dataset.i); draw(); });
        body().querySelectorAll("#bank .chip:not(.placeholder)").forEach(c => c.onclick = () => { chosen.push(+c.dataset.i); draw(); });
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
        <div class="q-title">${esc(it.prompt)}</div>
        <div class="match"><div class="col">${left.map(w => `<button class="chip" data-side="L" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
        <div class="col">${right.map(w => `<button class="chip" data-side="R" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div></div>`;
      const v = { graded: true, auto: true };
      const $foot = $app.querySelector("#foot");
      $foot.innerHTML = `<button class="btn btn-green" disabled>Match all pairs</button>`;
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
            setTimeout(() => [a, b].forEach(x => { x.classList.remove("good"); x.classList.add("gone"); x.disabled = true; }), 250);
            if (++matched === left.length) setTimeout(() => v.onDone({ answer: `${matched} pairs`, expected: "all pairs", correct: mistakes === 0, extra: { mistakes, match_ms: Math.round(now() - t0) } }), 400);
          } else {
            mistakes++;
            Log.log("match_miss", { round: R.id, item: it.id, left: a.dataset.w, right: b.dataset.w });
            [a, b].forEach(x => { x.classList.remove("sel"); x.classList.add("bad"); });
            setTimeout(() => [a, b].forEach(x => x.classList.remove("bad")), 450);
          }
        }
      });
      return v;
    }
  };

  function single(it, sel) {
    let picked = null;
    const v = { graded: true, result: () => ({ answer: picked, expected: it.answer, correct: picked === it.answer }) };
    body().querySelectorAll(sel).forEach(b => b.onclick = () => {
      body().querySelectorAll(sel).forEach(x => x.classList.remove("sel"));
      b.classList.add("sel"); picked = b.dataset.k;
      v.onChange && v.onChange(true);
    });
    return v;
  }

  /* ---------------------- THE INTERVENTION (IV) ----------------------- */
  function attemptQuit(context) {
    if ($modal.firstChild) return;
    if (!CFG.promptOnEveryQuit && S.prompts.shown > 0) {
      Log.log("quit_without_prompt", { context });
      return endSession("quit", context);
    }
    const g = groupCfg();
    S.prompts.shown++; S.prompts.firstAt = S.prompts.firstAt || iso(); save();
    const title = g.title.replace("{gems}", S.gems);
    Log.log("prompt_shown", { context, n: S.prompts.shown, condition: g.key, gems: S.gems, xp: S.xp, round: R ? R.id : null, round_pos: R ? R.pos : null, lesson1_done: S.lesson1.done, practice_rounds: S.practice.rounds });
    sendSummary();
    const t0 = now();
    $modal.innerHTML = `
      <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="p-title">
        <div class="prompt-card ${g.mascot ? "" : "textonly"}">
          ${g.mascot ? Art.svg(g.art) : ""}
          <div class="p-title" id="p-title">${esc(title)}</div>
          <button class="btn btn-green" id="stay">${esc(CFG.buttons.stay)}</button>
          <button class="btn btn-beige" id="leave">${esc(CFG.buttons.quit)}</button>
        </div>
      </div>`;
    const close = () => { $modal.innerHTML = ""; };
    $modal.querySelector("#stay").onclick = () => {
      Log.log("prompt_choice", { choice: "continue", context, n: S.prompts.shown, rt_ms: Math.round(now() - t0) });
      S.prompts.continues++; S.prompts.lastChoice = "continue"; save(); sendSummary(); Log.flush();
      close();
      if (context === "home" && S.lesson1.done) screenPractice();
      else if (context === "round_complete") screenHome();
      // mid_round, practice_picker, home before lesson 1: stay where they are
    };
    $modal.querySelector("#leave").onclick = () => {
      Log.log("prompt_choice", { choice: "quit", context, n: S.prompts.shown, rt_ms: Math.round(now() - t0) });
      S.prompts.lastChoice = "quit";
      close();
      endSession("quit", context);
    };
  }

  /* ------------------------------ ending ------------------------------- */
  function endSession(reason, context) {
    if (R) { Log.log("round_abandoned", { round: R.id, mode: R.mode, pos: R.pos, n_items: R.queue.length }); R = null; }
    S.ended = true; S.endReason = reason; S.endedAt = iso(); save();
    Log.log("session_end", { reason, context, gems: S.gems, xp: S.xp, practice_rounds: S.practice.rounds, prompts_shown: S.prompts.shown, continues: S.prompts.continues });
    sendSummary(); Log.flush();
    screenEnd();
  }

  function surveyLink() {
    if (!CFG.surveyUrl) return "";
    return CFG.surveyUrl.replace(/\{(pid|sid|group|condition)\}/g, (_, k) => encodeURIComponent(k === "pid" ? S.pid : k === "sid" ? S.sid : k === "group" ? S.group : S.condition));
  }

  function screenEnd() {
    screen("end");
    const link = surveyLink();
    const capped = S.endReason === "max_rounds";
    $app.innerHTML = `
      <div class="shell"><div class="card center">
        <h2 class="title">${capped ? "That's all the practice for today!" : "Your session is finished"}</h2>
        <p class="sub">Thank you, ${firstName()}.</p>
        ${link ? `
          <p class="sub" style="margin:18px 0 26px">Next, please answer a short survey, then take a short quiz.</p>
          <button class="btn btn-green" id="go">Go to the survey</button>`
        : `<p class="sub" style="margin-top:18px">You can close this tab now.</p>
           <p class="hint" style="text-align:center;margin-top:20px">Session code: <b>${esc(S.sid.slice(0, 8))}</b></p>`}
      </div></div>`;
    if (link) $app.querySelector("#go").onclick = async () => {
      Log.log("survey_redirect"); await Log.flush(); sendSummary();
      setTimeout(() => { location.href = link; }, 250);
    };
  }

  /* ------------------------------- debug ------------------------------- */
  function debugBar() {
    if (!DEBUG || document.querySelector(".debug-bar")) return;
    const d = document.createElement("div");
    d.className = "debug-bar";
    d.innerHTML = `<span>G${S.group} ${esc(S.condition)} · ${esc(S.assignMode)}${Log.enabled ? "" : " · no backend"}</span>
      <button id="dbg-p">prompt</button><button id="dbg-csv">csv</button><button id="dbg-r">reset</button>`;
    document.body.appendChild(d);
    d.querySelector("#dbg-p").onclick = () => attemptQuit("debug");
    d.querySelector("#dbg-csv").onclick = () => Log.downloadCSV();
    d.querySelector("#dbg-r").onclick = () => { localStorage.removeItem(STORE); location.reload(); };
  }

  if (DEBUG) window.__ollie = { round: () => R, state: () => S };
  boot();
})();
