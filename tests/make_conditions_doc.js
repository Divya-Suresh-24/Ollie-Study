// Regenerates CONDITIONS.md from js/config.js:  node tests/make_conditions_doc.js
global.window = {};
require("../js/config.js");
const C = window.STUDY_CONFIG, M = C.messages, fs = require("fs");
const row = (...c) => "| " + c.join(" | ") + " |";
const show = m => !m ? "—" : Array.isArray(m) ? m.map(x => (x.kind ? `*(${x.kind})* ` : "") + [x.title, x.body, x.text].filter(Boolean).join(" ")).join("<br>") : [m.title, m.body, m.text].filter(Boolean).join(" ");
const ctx = [
  ["quit", "Quit prompt (every time they try to leave)"], ["between", "Choice screen after a lesson"], ["allDone", "Choice screen after Lesson 6"],
  ["goal", "Session goal (after each lesson)"], ["goalMet", "Goal met (after one practice round)"], ["nudge", "Mid-lesson nudge (halfway)"],
  ["combo", "Every 5 correct in a row"], ["warn", "2 minutes left"], ["timeUp", "30 minutes up"]
];
let out = `# Conditions and wording

Generated from \`js/config.js\` by \`node tests/make_conditions_doc.js\`. Edit the config, then regenerate.

## What each version shows

${row("", "V1 Plain", "V2 Neutral", "V3 Ollie + neutral", "V4 Pressure", "V5 Ollie + pressure")}
${row("---", "---", "---", "---", "---", "---")}
${row("Ollie anywhere", "no", "no", "yes", "no", "yes")}
${row("Streak, shells, goal, unit progress", "no", "yes", "yes", "yes", "yes")}
${row("Message wording", "plain", "neutral", "neutral (same as V2)", "pressure", "pressure (same as V4)")}
${row("Wrong answer", "“Not quite”", "“Not quite”", "+ encouraging Ollie", "“Not quite”", "+ sad Ollie (tears)")}
${row("Correct answer", "“Correct!”", "“Correct!”", "+ happy Ollie", "“Correct!”", "+ happy Ollie")}
${row("5 in a row", "text toast", "🔥 toast", "Ollie pops in", "🔥 toast", "Ollie pops in")}
${row("Mid-lesson nudge", "text toast", "text toast", "Ollie pops in (waving)", "text toast", "Ollie pops in (worried)")}
${row("Lesson complete", "check mark", "shell burst + “You found a shell!”", "Ollie gift: “Here's a shell I found for you!”", "shell burst + “You found a shell!”", "Ollie gift: “Here's a shell I found for you!”")}
${row("Quit prompt picture", "none", "none", "Ollie talking", "none", "sad Ollie / drifting from his raft / clutching shells")}
${row("Passive practice", "Watch and read", "Watch and read", "Watch Ollie explain", "Watch and read", "Watch Ollie explain")}
${row("Break", "animation", "animation", "Ollie plays (juggle, belly slide, float, dance)", "animation", "Ollie plays")}
${row("Lesson map", "6 lessons + 4 coming soon", "same", "same + Ollie juggling", "same", "same + Ollie juggling")}

Identical in every version: the six lessons, the three practice modes and their credit, Help, the 30-minute limit, and the quit buttons (“${C.buttons.stay}” / “${C.buttons.leave}”).

## Every message

Pressure variants rotate in order and are tagged guilt or loss; the one shown is logged.

${row("Where", "V1 Plain", "V2 + V3 Neutral", "V4 + V5 Pressure")}
${row("---", "---", "---", "---")}
${ctx.map(([k, label]) => row(label, show(M.plain[k]), show(M.neutral[k]), show(M.pressure[k]))).join("\n")}
`;
fs.writeFileSync(__dirname + "/../CONDITIONS.md", out);
console.log("CONDITIONS.md written");
