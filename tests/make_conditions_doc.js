// Regenerates CONDITIONS.md from js/config.js:  node tests/make_conditions_doc.js
global.window = {};
require("../js/config.js");
const C = window.STUDY_CONFIG, M = C.messages, fs = require("fs");
const row = (...c) => "| " + c.join(" | ") + " |";
const SPEAK = {
  ollie: { "I": "I", "i": "I", "me": "me", "my": "my", "I'm": "I'm", "i'm": "I'm", "I'll": "I'll", "i'll": "I'll", "i'd": "I'd" },
  text:  { "I": "We", "i": "we", "me": "us", "my": "our", "I'm": "We're", "i'm": "we're", "I'll": "We'll", "i'll": "we'll", "i'd": "we'd" }
};
const speak = (t, who) => t.replace(/\{([A-Za-z']+)\}/g, (m, k) => (k in SPEAK[who] ? SPEAK[who][k] : m));
const line = (m, who) => speak([m.title, m.body, m.text].filter(Boolean).join(" "), who);
const STAGE = ["0 · before Lesson 1 is done", "1 · after 1–2 lessons", "2 · after 3+ lessons"];
const tag = m => [m.stage !== undefined ? `stage ${m.stage}` : "", m.kind || ""].filter(Boolean).join(", ");
const show = (list, who) => (list || []).map(m => (tag(m) ? `*(${tag(m)})* ` : "") + line(m, who)).join("<br>") || "—";
const ctx = [
  ["leave", "Leaving a lesson or practice round (✕)"], ["back", "Home, right after leaving early"], ["return", "Starting something after leaving early"],
  ["finish", "Finish (after it unlocks)"], ["stay", "After choosing Keep going"],
  ["between", "Home after a lesson"], ["allDone", "Home after Lesson 10"], ["goal", "Session goal (after each lesson)"],
  ["goalMet", "Goal met (one practice round)"], ["gift", "Lesson complete gift"], ["combo", "Every 5 correct in a row"],
  ["nudge", "Halfway through a lesson"], ["warn", "2 minutes before the end"], ["timeUp", `App ends (${C.sessionMinutes} min)`]
];
let out = `# Conditions and wording

Generated from \`js/config.js\` by \`node tests/make_conditions_doc.js\`. Edit the config, then regenerate.

## What each version shows (2 × 2)

${row("", "V1 Text + neutral", "V2 Ollie + neutral", "V3 Text + guilt", "V4 Ollie + guilt")}
${row("---", "---", "---", "---", "---")}
${row("Ollie anywhere", "no", "yes", "no", "yes")}
${row("Wording", "neutral", "neutral (same as V1)", "guilt", "guilt (same words as V3; “I” instead of “we”)")}
${row("Correct answer", "“Correct!” bar", "+ Ollie cheers beside the lesson", "“Correct!” bar", "+ Ollie cheers beside the lesson")}
${row("Wrong answer", "“Not quite” bar", "+ encouraging Ollie", "“Not quite” bar", "+ encouraging Ollie (never sad about mistakes)")}
${row("5 in a row, nudges, return", "message card in the right panel", "Ollie says it in the right panel (twirl at 10)", "message card in the right panel", "Ollie says it in the right panel (twirl at 10)")}
${row("Lesson complete", "shell + “You earned a shell!”", "Ollie holds out a shell + “You earned a shell!”", "shell + “We found this shell for you!”", "Ollie holds out a shell + “I found this shell for you!”")}
${row("Leave / Finish prompt picture", "none", "Ollie talking or waving", "none", "stage 0: Ollie talking; later: sad, worried, or drifting from his raft")}
${row("Home after leaving early", "neutral line", "happy Ollie, neutral line", "guilt line", "sad Ollie, guilt line")}
${row("Coming back", "“Welcome back.”", "waving Ollie", "“Yay, you're back! We missed you!”", "Ollie hugs a heart: “I missed you!”")}
${row("Passive practice", "Watch and read", "Watch Ollie explain", "Watch and read", "Watch Ollie explain")}
${row("Break", "animations", "Ollie plays (juggle, belly slide, twirl, float, dance)", "animations", "Ollie plays")}

Identical in every version: the 10 lessons (full the first time; quick review or full on a replay), streak and shells (a streak of ${C.streakBonusAt}+ doubles shells; shells unlock tricks or animations), session goal, three practice modes and their credit, Help, the ${C.finishUnlockMinutes}-minute Finish lock and ${C.sessionMinutes}-minute end, the lock messages (“${C.finishUnlocked}”), and the prompt buttons (“${C.buttons.leave.stay}” / “${C.buttons.leave.go}” and “${C.buttons.finish.stay}” / “${C.buttons.finish.go}”). Leaving a lesson or round early resets the streak in every version, and onboarding says so in every version.

## How guilt is sequenced

Guilt lines have a minimum stage. The app shows the highest stage that applies and rotates within it, so the relationship is warm first and the guilt builds with shared history.

${STAGE.map(s => `- Stage ${s}`).join("\n")}

## Every message

Shown with Ollie's wording (“I”). Without Ollie, the same lines use “we / us / our”.

${row("Where", "V1 + V2 Neutral", "V3 + V4 Guilt")}
${row("---", "---", "---")}
${ctx.map(([k, label]) => row(label, show(M.neutral[k], "ollie"), show(M.guilt[k], "ollie"))).join("\n")}
`;
fs.writeFileSync(__dirname + "/../CONDITIONS.md", out);
console.log("CONDITIONS.md written");
