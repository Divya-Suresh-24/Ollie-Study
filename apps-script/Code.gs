/**
 * PELAN STUDY — Google Apps Script backend
 * -------------------------------------------------------------------------
 * Paste into Extensions → Apps Script of an empty Google Sheet (use your
 * ISU Google account). Run `setup` once, then Deploy → New deployment →
 * Web app (Execute as: Me, Who has access: Anyone).
 *
 * Tabs:
 *   participants  one row per assignment (the group is decided here)
 *   events        every logged action (one row per event)
 *   sessions      one summary row per participant, kept up to date
 *
 * Assignment uses PERMUTED BLOCKS of 5: every 5 real participants receive
 * versions 1–5 in a fresh random order, so group sizes never differ by
 * more than one. Debug sessions (?debug=1) never use up a block.
 *
 * Apps Script never sees participants' IP addresses, and the app sends no
 * names: only a random session id and the participant's study code.
 *
 * A Google Sheet holds at most 10 million cells. When the events tab passes
 * EVENTS_PER_FILE rows, new events go to a fresh spreadsheet named
 * "pelan-events-part-N" in the same Drive. Combine the parts for analysis.
 */

const CONDITIONS = { 1: "v1_plain", 2: "v2_neutral", 3: "v3_ollie_neutral", 4: "v4_pressure", 5: "v5_ollie_pressure" };
const BLOCK = [1, 2, 3, 4, 5];
const EVENTS_PER_FILE = 300000;

const HEADERS = {
  participants: ["server_ts", "study_id", "code", "sid", "group", "condition", "assign_mode", "user_agent"],
  events: ["server_ts", "client_ts", "t_ms", "study_id", "sid", "code", "group", "condition", "assign_mode", "screen", "event", "data"],
  sessions: ["sid", "code", "study_id", "group", "condition", "assign_mode", "started_at", "ended_at", "end_reason",
    "lessons_completed", "l1_acc", "l2_acc", "l3_acc", "l4_acc", "l5_acc", "l6_acc",
    "l1_sec", "l2_sec", "l3_sec", "l4_sec", "l5_sec", "l6_sec",
    "practice_rounds", "practice_items", "practice_passive", "practice_easy", "practice_active",
    "goals_shown", "goals_met", "last_activity", "nudges_shown", "ollie_pops", "app_minutes", "breaks_taken", "break_seconds", "help_opens", "coach_views",
    "prompts_shown", "prompt_continues", "final_choice", "first_prompt_at", "seconds_after_first_prompt", "choices",
    "shells", "shells_total", "streak", "max_combo",
    "session_seconds", "active_seconds", "idle_seconds", "hidden_seconds",
    "survey_opened", "survey_done", "user_agent", "updated_at"]
};

function doGet() {
  return json({ ok: true, service: "pelan-study", time: new Date().toISOString(), counts: groupCounts_() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: "bad json" }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (body.action === "assign") return json(assign_(body));
    if (body.action === "log") return json(logEvents_(body.events || []));
    if (body.action === "summary") return json(upsertSummary_(body.summary || {}));
    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ assignment ------------------------------ */
function assign_(b) {
  const sh = sheet_("participants");
  const studyId = String(b.studyId || "");
  let group, mode;
  if (b.debug) { group = 1 + Math.floor(Math.random() * 5); mode = "debug"; }
  else { group = nextFromBlock_(studyId); mode = "server"; }
  sh.appendRow(safeRow_([new Date(), studyId, b.code, b.sid, group, CONDITIONS[group], mode, b.userAgent]));
  return { ok: true, group: group };
}

function nextFromBlock_(studyId) {
  const props = PropertiesService.getScriptProperties();
  const key = "block_" + studyId;
  let block = JSON.parse(props.getProperty(key) || "[]");
  if (!block.length) {
    block = BLOCK.slice();
    for (let i = block.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = block[i]; block[i] = block[j]; block[j] = t; }
  }
  const g = block.shift();
  props.setProperty(key, JSON.stringify(block));
  return g;
}

/** Assignments per group (excluding debug). Also shown by doGet. */
function groupCounts_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("participants");
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 5, sh.getLastRow() - 1, 3).getValues().forEach(r => { if (r[2] !== "debug" && out[r[0]] !== undefined) out[r[0]]++; });
  return out;
}

/* -------------------------------- logging ------------------------------- */
function eventsSheet_() {
  const props = PropertiesService.getScriptProperties();
  const extId = props.getProperty("events_file");
  let sh = extId ? SpreadsheetApp.openById(extId).getSheetByName("events") : sheet_("events");
  if (sh.getLastRow() >= EVENTS_PER_FILE) {
    const part = Number(props.getProperty("events_part") || "1") + 1;
    const ss = SpreadsheetApp.create("pelan-events-part-" + part);
    sh = ss.getSheets()[0].setName("events");
    sh.getRange(1, 1, 1, HEADERS.events.length).setValues([HEADERS.events]).setFontWeight("bold");
    sh.setFrozenRows(1);
    props.setProperty("events_file", ss.getId());
    props.setProperty("events_part", String(part));
  }
  return sh;
}

function logEvents_(events) {
  if (!events.length) return { ok: true, n: 0 };
  const sh = eventsSheet_();
  const now = new Date();
  const rows = events.slice(0, 500).map(e => safeRow_([now, e.client_ts, e.t_ms, e.study_id, e.sid, e.code, e.group,
    e.condition, e.assign_mode, e.screen, e.event, e.data]));
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.events.length).setValues(rows);
  return { ok: true, n: rows.length };
}

function upsertSummary_(s) {
  if (!s.sid) return { ok: false, error: "no sid" };
  const sh = sheet_("sessions");
  const cols = HEADERS.sessions;
  const row = safeRow_(cols.map(c => (s[c] === undefined || s[c] === null ? "" : s[c])));
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
function sheet_(name) {
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
function safeRow_(arr) {
  return arr.map(v => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor: creates the tabs and asks for permissions. */
function setup() { Object.keys(HEADERS).forEach(sheet_); }

/** Run after piloting: restarts block randomization and event file rotation. */
function resetBlocks() { PropertiesService.getScriptProperties().deleteAllProperties(); }

/** Run any time: logs current group counts to the execution log. */
function showCounts() { Logger.log(JSON.stringify(groupCounts_())); }
