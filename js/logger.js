/* =========================================================================
   LOGGER — sends events and session summaries to the Apps Script backend,
   keeps a copy in the browser (downloadable in debug mode), and measures
   active / idle / hidden time per screen.
   Nothing here records names, IP addresses or mouse positions.
   ========================================================================= */
window.StudyLog = (function () {
  const CFG = window.STUDY_CONFIG;
  const url = (CFG.appsScriptUrl || "").trim();
  const t0 = performance.now();
  let ctx = {};
  let queue = [], backup = [], lastSummary = null, flushing = false;

  /* ----------------------------- events ------------------------------ */
  function setContext(c) { Object.assign(ctx, c); }

  function log(event, data) {
    const e = {
      client_ts: new Date().toISOString(),
      t_ms: Math.round(performance.now() - t0),
      study_id: CFG.studyId,
      sid: ctx.sid || "", code: ctx.code || "",
      group: ctx.group || "", condition: ctx.condition || "",
      assign_mode: ctx.mode || "", screen: ctx.screen || "",
      event, data: data ? JSON.stringify(data) : ""
    };
    queue.push(e); backup.push(e);
    try { localStorage.setItem("pelan_events_" + ctx.sid, JSON.stringify(backup.slice(-3000))); } catch (_) {}
    if (ctx.debug) console.log("[log]", event, data || "");
  }

  // Apps Script accepts text/plain POSTs without a CORS preflight.
  function post(payload, beacon) {
    if (!url) return Promise.resolve(false);
    const body = JSON.stringify(payload);
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=utf-8" }))) return Promise.resolve(true); } catch (_) {}
    }
    return fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: body.length < 60000 })
      .then(() => true, () => false);
  }

  async function flush(beacon) {
    if (!url || !queue.length) return;
    if (flushing && !beacon) return;
    const batch = queue.splice(0, 150);
    flushing = true;
    const ok = await post({ action: "log", events: batch }, beacon);
    flushing = false;
    if (!ok) { queue.unshift(...batch); return; }
    if (queue.length) return flush(beacon);
  }

  function summary(s) { lastSummary = s; return post({ action: "summary", summary: s }); }

  async function assign(payload, timeoutMs) {
    if (!url) throw new Error("no backend configured");
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function downloadCSV() {
    const cols = ["client_ts", "t_ms", "study_id", "sid", "code", "group", "condition", "assign_mode", "screen", "event", "data"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = [cols.join(",")].concat(backup.map(e => cols.map(c => q(e[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `pelan_${ctx.code || "session"}.csv`;
    a.click();
  }

  /* ------------------------- time on screen -------------------------- */
  // Each second is counted as active (input within idleAfterMs), idle, or
  // hidden (tab in background). Totals are kept for the session summary.
  const IDLE = CFG.idleAfterMs || 30000;
  let lastInput = Date.now();
  let seg = null;                         // current screen segment
  const totals = { active: 0, idle: 0, hidden: 0 };
  const markActive = () => { lastInput = Date.now(); };
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(t => addEventListener(t, markActive, { passive: true, capture: true }));

  setInterval(() => {
    const k = document.hidden ? "hidden" : (Date.now() - lastInput > IDLE ? "idle" : "active");
    totals[k] += 1000;
    if (seg) seg[k] += 1000;
  }, 1000);

  function closeScreen() {
    if (!seg) return;
    log("screen_time", { screen: seg.name, total_ms: Date.now() - seg.start, active_ms: seg.active, idle_ms: seg.idle, hidden_ms: seg.hidden });
    seg = null;
  }
  function setScreen(name) {
    if (seg && seg.name === name) return;
    closeScreen();
    setContext({ screen: name });
    seg = { name, start: Date.now(), active: 0, idle: 0, hidden: 0 };
    markActive();
  }

  setInterval(() => flush(false), 5000);
  addEventListener("pagehide", () => {
    closeScreen();
    flush(true);
    if (lastSummary) post({ action: "summary", summary: lastSummary }, true);
  });

  return { setContext, log, flush, summary, assign, downloadCSV, setScreen, closeScreen, totals, enabled: !!url };
})();
