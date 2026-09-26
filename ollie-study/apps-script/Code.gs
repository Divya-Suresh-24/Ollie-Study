/**
 * OLLIE STUDY — Google Apps Script backend
 * -------------------------------------------------------------------------
 * Paste this into Extensions → Apps Script of an empty Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 *
 * It creates three tabs automatically:
 *   participants  one row per assignment (group is decided here)
 *   events        every logged action (one row per event)
 *   sessions      one summary row per session, kept up to date
 *
 * Group assignment uses PERMUTED BLOCKS of 5: every 5 real participants get
 * groups 1–5 in a fresh random order, so the groups stay balanced even if
 * recruitment stops early. A participant ID that returns keeps its group.
 */

const CONDITIONS = { 1: "mascot_guilt", 2: "mascot_loss", 3: "text_guilt", 4: "text_loss", 5: "control" };

const HEADERS = {
  participants: ["server_ts", "study_id", "pid", "pid_source", "sid", "group", "condition", "assign_mode", "user_agent"],
  events: ["server_ts", "client_ts", "t_ms", "study_id", "sid", "pid", "group", "condition", "assign_mode", "screen", "event", "data"],
  sessions: ["sid", "pid", "pid_source", "study_id", "group", "condition", "assign_mode", "started_at", "ended_at", "end_reason",
    "tour_completed", "lesson1_completed", "lesson1_graded", "lesson1_correct", "lesson1_accuracy", "lesson1_seconds",
    "practice_rounds_started", "practice_rounds_completed", "practice_modes", "prompts_shown", "prompt_continues",
    "final_choice", "first_prompt_at", "seconds_after_first_prompt", "gems", "xp", "streak", "session_seconds",
    "hidden_seconds", "name", "user_agent", "updated_at"]
};

function doGet() {
  return json({ ok: true, service: "ollie-study", time: new Date().toISOString() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: "bad json" }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (body.action === "assign") return json(assign(body));
    if (body.action === "log") return json(logEvents(body.events || []));
    if (body.action === "summary") return json(upsertSummary(body.summary || {}));
    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ assignment ------------------------------ */
function assign(b) {
  const sh = sheet("participants");
  const studyId = String(b.studyId || "");
  const pid = String(b.pid || "");

  // Returning participant (real ID, not a generated one): keep their group.
  if (pid && b.pidSource !== "generated" && !b.debug && sh.getLastRow() > 1) {
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
    for (let i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i][1]) === studyId && String(rows[i][2]) === pid && rows[i][7] !== "debug") {
        const g = Number(rows[i][5]);
        sh.appendRow(safeRow([new Date(), studyId, pid, b.pidSource, b.sid, g, CONDITIONS[g], "server_existing_pid", b.userAgent]));
        return { ok: true, group: g, existing: true };
      }
    }
  }

  let group, mode;
  if (b.debug) { group = 1 + Math.floor(Math.random() * 5); mode = "debug"; }   // tests don't use up blocks
  else { group = nextFromBlock(studyId); mode = "server"; }
  sh.appendRow(safeRow([new Date(), studyId, pid, b.pidSource, b.sid, group, CONDITIONS[group], mode, b.userAgent]));
  return { ok: true, group: group, existing: false };
}

function nextFromBlock(studyId) {
  const props = PropertiesService.getScriptProperties();
  const key = "block_" + studyId;
  let block = JSON.parse(props.getProperty(key) || "[]");
  if (!block.length) {
    block = [1, 2, 3, 4, 5];
    for (let i = block.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = block[i]; block[i] = block[j]; block[j] = t; }
  }
  const g = block.shift();
  props.setProperty(key, JSON.stringify(block));
  return g;
}

/* -------------------------------- logging ------------------------------- */
function logEvents(events) {
  if (!events.length) return { ok: true, n: 0 };
  const sh = sheet("events");
  const now = new Date();
  const rows = events.slice(0, 500).map(e => safeRow([now, e.client_ts, e.t_ms, e.study_id, e.sid, e.pid, e.group,
    e.condition, e.assign_mode, e.screen, e.event, e.data]));
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.events.length).setValues(rows);
  return { ok: true, n: rows.length };
}

function upsertSummary(s) {
  if (!s.sid) return { ok: false, error: "no sid" };
  const sh = sheet("sessions");
  const cols = HEADERS.sessions;
  const row = safeRow(cols.map(c => (s[c] === undefined || s[c] === null ? "" : s[c])));
  const last = sh.getLastRow();
  if (last > 1) {
    const sids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = sids.length - 1; i >= 0; i--) {
      if (sids[i][0] === s.sid) { sh.getRange(i + 2, 1, 1, cols.length).setValues([row]); return { ok: true, updated: true }; }
    }
  }
  sh.getRange(last + 1, 1, 1, cols.length).setValues([row]);
  return { ok: true, created: true };
}

/* -------------------------------- helpers ------------------------------- */
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

// Stop text that starts with = + - @ from being read as a formula.
function safeRow(arr) {
  return arr.map(v => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to create the tabs and test permissions. */
function setup() {
  Object.keys(HEADERS).forEach(sheet);
}

/** Run from the editor to restart the block randomization (e.g. after piloting). */
function resetBlocks() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}
