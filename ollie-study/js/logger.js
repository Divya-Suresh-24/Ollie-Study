/* =========================================================================
   LOGGER — sends events and session summaries to the Google Apps Script
   backend, and keeps a copy in the browser (downloadable in debug mode).
   ========================================================================= */
window.OllieLog = (function () {
  const CFG = window.OLLIE_CONFIG;
  const url = (CFG.appsScriptUrl || "").trim();
  const t0 = performance.now();
  let ctx = {};
  let queue = [];
  let backup = [];
  let lastSummary = null;
  let flushing = false;

  function setContext(c) { Object.assign(ctx, c); }

  function log(event, data) {
    const e = {
      client_ts: new Date().toISOString(),
      t_ms: Math.round(performance.now() - t0),
      study_id: CFG.studyId,
      sid: ctx.sid || "", pid: ctx.pid || "",
      group: ctx.group || "", condition: ctx.condition || "",
      assign_mode: ctx.mode || "", screen: ctx.screen || "",
      event, data: data ? JSON.stringify(data) : ""
    };
    queue.push(e);
    backup.push(e);
    try { localStorage.setItem("ollie_events_" + ctx.sid, JSON.stringify(backup.slice(-3000))); } catch (_) {}
    if (ctx.debug) console.log("[ollie]", event, data || "");
  }

  // Apps Script accepts text/plain POSTs without a CORS preflight.
  function post(payload, beacon) {
    if (!url) return Promise.resolve(false);
    const body = JSON.stringify(payload);
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=utf-8" }))) return Promise.resolve(true); } catch (_) {}
    }
    return fetch(url, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body, keepalive: body.length < 60000
    }).then(() => true, () => false);
  }

  async function flush(beacon) {
    if (!url || !queue.length) return;
    if (flushing && !beacon) return;
    const batch = queue.splice(0, 150);
    flushing = true;
    const ok = await post({ action: "log", events: batch }, beacon);
    flushing = false;
    if (!ok) { queue.unshift(...batch); return; }
    if (queue.length) flush(beacon);
  }

  function summary(s) { lastSummary = s; return post({ action: "summary", summary: s }); }

  async function assign(payload, timeoutMs) {
    if (!url) throw new Error("no backend configured");
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload), signal: ctl.signal
      });
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function downloadCSV() {
    const cols = ["client_ts", "t_ms", "study_id", "sid", "pid", "group", "condition", "assign_mode", "screen", "event", "data"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = [cols.join(",")].concat(backup.map(e => cols.map(c => q(e[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ollie_${ctx.sid || "session"}.csv`;
    a.click();
  }

  setInterval(() => flush(false), 4000);
  addEventListener("pagehide", () => {
    flush(true);
    if (lastSummary) post({ action: "summary", summary: lastSummary }, true);
  });

  return { setContext, log, flush, summary, assign, downloadCSV, enabled: !!url };
})();
