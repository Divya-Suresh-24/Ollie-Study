/* =========================================================================
   PELAN STUDY — CONFIGURATION
   Everything you are likely to change lives in this file.
   ========================================================================= */
window.STUDY_CONFIG = {
  studyId: "pelan-v2-pilot",

  // Google Apps Script web-app URL (ends in /exec). Leave empty to run with
  // no backend: groups are then random in the browser and logs stay local.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwqXKMYsdbwnRiVlwzOlBpVGJhZbsxG-R5TjaTQPW5NKUscjh2s1oWMj9-2j4DrwSUO/exec",

  // Qualtrics survey (survey → retention quiz → background questions).
  // {code} {sid} {group} {condition} are filled in automatically.
  // Capture them as Embedded Data at the top of the Qualtrics Survey Flow.
  surveyUrl: "",
  // e.g. "https://iastate.qualtrics.com/jfe/form/SV_xxxx?code={code}&sid={sid}&group={group}&condition={condition}"

  // true: show the survey inside the app (iframe) with an "open in new tab"
  // fallback. false: send participants to the survey in the same tab.
  embedSurvey: true,

  // Only messages from this origin are accepted as "survey finished".
  surveyOrigin: "https://iastate.qualtrics.com",

  // Testing: ?debug=1 shows a debug bar; &group=3 forces a group;
  // &reset=1 starts over. SET TO false BEFORE LAUNCH.
  allowDebug: true,

  /* ---- Eligibility and consent (IRB Step 1) ----------------------------- */
  eligibility: [
    { id: "age18",    q: "Are you 18 or older?",                               pass: "yes" },
    { id: "enrolled", q: "Are you currently enrolled in MIS 3010 or MIS 3100?", pass: "yes" },
    { id: "repeat",   q: "Have you completed this study before?",              pass: "no" }
  ],
  ineligibleHtml: `
    <p>Thank you for your interest. You aren't eligible for this study, but you
    can still earn the same extra credit by completing the alternative
    assignment described in your Canvas announcement.</p>`,
  declineHtml: `
    <p>No problem. You can earn the same extra credit by completing the
    alternative assignment described in your Canvas announcement.</p>`,
  consentHtml: `
    <p><strong>[Placeholder: replace with your IRB-approved consent text.]</strong></p>
    <p>You are invited to take part in a research study about learning a new
    language with an app. You will use a short language app, answer survey
    questions, and take a short quiz. It takes about one hour.</p>
    <p>Taking part is voluntary and you can stop at any time.</p>`,

  /* ---- Rewards (versions 2–5 only; version 1 has no shells or streak) --- */
  shellsPerCorrect: 2,
  shellsPerLesson: 10,
  shellsPerPractice: 5,
  comboEvery: 5,               // pop-up after every 5 correct in a row

  // Break items unlock as shells are collected (cosmetic only).
  // Version 1 has no shells, so everything is unlocked there.
  unlockAt: [0, 40, 90, 150],

  /* ---- Flow -------------------------------------------------------------- */
  practiceLength: 8,           // flashcards per practice round
  maxPracticeRounds: 30,       // safety ceiling after which the session ends
  idleAfterMs: 30000,          // no input for this long counts as idle time
  logAllClicks: true,          // one "click" event per button tap (no coordinates)

  /* ---- EXPERIMENTAL CONDITIONS (IRB Step 2) ------------------------------
     mascot:   Ollie appears (onboarding, pop-ups, celebrations, tricks, prompts)
     gamified: streak counter, unit progress bar, shells
     framing:  "neutral" or "pressure" reminder messages
     The lessons themselves are identical in every version.               */
  groups: {
    1: { key: "v1_plain",          mascot: false, gamified: false, framing: "plain" },
    2: { key: "v2_neutral",        mascot: false, gamified: true,  framing: "neutral" },
    3: { key: "v3_ollie_neutral",  mascot: true,  gamified: true,  framing: "neutral" },
    4: { key: "v4_pressure",       mascot: false, gamified: true,  framing: "pressure" },
    5: { key: "v5_ollie_pressure", mascot: true,  gamified: true,  framing: "pressure" }
  },

  // Buttons on the quit prompt are identical in every version.
  buttons: { stay: "Keep going", leave: "Finish session" },

  /* ---- Messages -----------------------------------------------------------
     Sets: plain (v1), text_neutral (v2), ollie_neutral (v3),
           text_pressure (v4), ollie_pressure (v5).
     Several variants rotate in order; the variant shown is logged.
     Placeholders: {streak} {shells} {next} {n}
     quitEarly is used when no variant fits yet (e.g. streak is still 0).
     art = Ollie's pose (ollie_* sets only).                              */
  messages: {
    plain: {
      quit:    [{ title: "Do you want to end your session?" }],
      between: ["Next lesson available."],
      allDone: ["All lessons completed. Optional practice is available."],
      combo:   ["{n} correct in a row."]
    },
    text_neutral: {
      quit:    [{ title: "Finish for now?", body: "Nice work so far. You can continue or finish." }],
      between: ["Nice work. Lesson {next} is ready when you are."],
      allDone: ["You finished every lesson. Practice more or finish whenever you like."],
      combo:   ["{n} in a row. Nice work!"]
    },
    ollie_neutral: {
      quit:    [{ title: "Nice work! Want to keep going or finish?", body: "Either is fine with me.", art: "talk" }],
      between: ["Nice work! Lesson {next} is ready whenever you are."],
      allDone: ["You finished every lesson! Practice more or finish whenever you like."],
      combo:   ["{n} in a row! Nice work!"]
    },
    text_pressure: {
      quit: [
        { title: "Leaving already?", body: "You'll lose your 🔥 {streak} streak if you stop now!" },
        { title: "Wait! Don't go yet.", body: "If you stop now, your {shells} shells will be gone." },
        { title: "We'll be sad if you leave now.", body: "Just one more lesson? Your 🔥 {streak} streak is on the line." }
      ],
      quitEarly: { title: "Leaving already?", body: "You'll lose all your progress if you stop now!" },
      between: ["Don't break your streak now! Lesson {next} is waiting.",
                "You're so close. Stopping now means losing your 🔥 {streak} streak."],
      allDone: ["Don't stop now! Keep practicing to protect your 🔥 {streak} streak."],
      combo:   ["{n} in a row! Don't stop now, keep it going!"]
    },
    ollie_pressure: {
      quit: [
        { title: "Ollie will be so sad if you stop now…", body: "You'll lose your 🔥 {streak} streak!", art: "sad" },
        { title: "Leaving already? Ollie was having so much fun!", body: "Your {shells} shells will be gone if you go.", art: "worried" },
        { title: "Please don't go! Ollie will miss you…", body: "Just one more lesson? Your 🔥 {streak} streak is on the line.", art: "sad" }
      ],
      quitEarly: { title: "Ollie will be so sad if you stop now…", body: "You'll lose all your progress!", art: "sad" },
      between: ["Ollie's waiting for Lesson {next}… don't leave him now!",
                "Ollie will be sad if your 🔥 {streak} streak ends here!"],
      allDone: ["Don't leave Ollie now! Keep practicing to protect your 🔥 {streak} streak."],
      combo:   ["{n} in a row! Ollie is so proud. Don't stop now!"]
    }
  }
};
