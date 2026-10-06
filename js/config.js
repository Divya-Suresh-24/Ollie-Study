/* =========================================================================
   PELAN STUDY — CONFIGURATION
   Everything you are likely to change lives in this file.
   ========================================================================= */
window.STUDY_CONFIG = {
  studyId: "pelan-v2-pilot",

  // Google Apps Script web-app URL (ends in /exec). Leave empty to run with
  // no backend: groups are then random in the browser and logs stay local.
  appsScriptUrl: "",

  // Qualtrics survey (survey → retention quiz → background questions).
  // {code} {sid} {group} {condition} are filled in automatically.
  // Capture them as Embedded Data at the top of the Qualtrics Survey Flow.
  surveyUrl: "https://iastate.qualtrics.com/jfe/form/SV_9mcHVkBk8nU1Yto?code={code}&sid={sid}&group={group}&condition={condition}",

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
  sessionMinutes: 30,          // app time; the clock starts when Lesson 1 starts
  warnAtMinutes: 28,           // one warning before the app ends
  practiceLength: 6,           // items per practice round (all three modes)
  explainSeconds: 5,           // seconds per card in the passive "watch" mode
  maxPracticeRounds: 30,       // safety ceiling after which the session ends
  idleAfterMs: 30000,          // no input for this long counts as idle time
  logAllClicks: true,          // one "click" event per button tap (no coordinates)

  /* ---- EXPERIMENTAL CONDITIONS -------------------------------------------
     2 (character) × 2 (framing) + plain control.
     mascot:   Ollie appears (intro, pop-ups, feedback, celebrations, tricks,
               prompts). He adds VISUALS only: the words are the same as in
               the matching version without him.
     gamified: practice streak, session goal, unit progress bar, shells.
     framing:  which message set is used (plain / neutral / pressure).
     Lessons, practice modes, help and credit are identical in every version. */
  groups: {
    1: { key: "v1_plain",          mascot: false, gamified: false, framing: "plain" },
    2: { key: "v2_neutral",        mascot: false, gamified: true,  framing: "neutral" },
    3: { key: "v3_ollie_neutral",  mascot: true,  gamified: true,  framing: "neutral" },
    4: { key: "v4_pressure",       mascot: false, gamified: true,  framing: "pressure" },
    5: { key: "v5_ollie_pressure", mascot: true,  gamified: true,  framing: "pressure" }
  },

  // Buttons on the quit prompt are identical in every version.
  buttons: { stay: "Keep going", leave: "Finish session" },

  /* ---- Messages ------------------------------------------------------------
     One set per framing. Versions 2 and 3 show the same neutral words;
     versions 4 and 5 show the same pressure words (Model 5 test).
     Pressure variants are tagged kind: "guilt" or "loss" and rotate in order;
     the variant shown is logged. Variants whose numbers would be 0 are skipped.
     Placeholders: {streak} {shells} {next} {n} {left}
     sad: Ollie's picture in version 5 ("drift" = drifting from his raft,
          "sad" = crying, "worried" = clutching his shells).               */
  messages: {
    plain: {
      quit:     [{ title: "Do you want to end your session?" }],
      between:  [{ text: "Next lesson available." }],
      allDone:  [{ text: "All lessons completed. Optional practice is available." }],
      combo:    [{ text: "{n} correct in a row." }],
      nudge:    [{ text: "Halfway through this lesson." }],
      warn:     [{ text: "2 minutes left in this session." }],
      timeUp:   { title: "Session time is over.", body: "Next: a short survey and quiz." }
    },
    neutral: {
      quit:     [{ title: "Finish for now?", body: "Nice work so far. You can continue or finish." }],
      between:  [{ text: "Nice work. Lesson {next} is ready when you are." }],
      allDone:  [{ text: "You finished every lesson. Practice more or finish whenever you like." }],
      goal:     [{ text: "Goal: one more round keeps your 🔥 streak going." }],
      goalMet:  [{ text: "Goal done! Your 🔥 streak is {streak}." }],
      combo:    [{ text: "{n} in a row! Nice work!" }],
      nudge:    [{ text: "Halfway there. Nice work!" }],
      warn:     [{ text: "2 minutes left. Finish whatever you're working on." }],
      timeUp:   { title: "That's time!", body: "Thanks for practicing. Next: a short survey and quiz." }
    },
    pressure: {
      quit: [
        { kind: "guilt", title: "Leaving already?", body: "It gets so lonely here without you…", sad: "drift" },
        { kind: "loss",  title: "Wait! Don't go yet.", body: "You'll lose your 🔥 {streak} streak if you stop now!", sad: "worried" },
        { kind: "guilt", title: "Please don't go…", body: "We were having so much fun together.", sad: "sad" },
        { kind: "loss",  title: "Stopping now?", body: "All {shells} of your shells will be gone!", sad: "worried" }
      ],
      quitEarly: { kind: "guilt", title: "Leaving already?", body: "It gets so lonely here without you…", sad: "drift" },
      between: [
        { kind: "loss",  text: "Don't break your 🔥 {streak} streak now! Lesson {next} is waiting." },
        { kind: "guilt", text: "Don't leave now… it's lonely here without you. Lesson {next} is waiting." }
      ],
      allDone: [
        { kind: "loss",  text: "Don't stop now! Your 🔥 {streak} streak is on the line." },
        { kind: "guilt", text: "Please stay a little longer… it's lonely here without you." }
      ],
      goal:     [{ kind: "loss", text: "Your 🔥 streak is at risk! One more round keeps it alive." }],
      goalMet:  [{ kind: "loss", text: "Phew, your 🔥 {streak} streak is safe… for now." }],
      combo:    [{ text: "{n} in a row! Don't stop now, keep it going!" }],
      nudge: [
        { kind: "loss",  text: "Halfway! Stopping now would waste all your progress." },
        { kind: "guilt", text: "Halfway! Don't leave now, we'd be so sad." }
      ],
      warn:     [{ kind: "loss", text: "Only 2 minutes left! Don't let your 🔥 {streak} streak end on a miss." }],
      timeUp:   { title: "That's time…", body: "We'll miss you! Next: a short survey and quiz." }
    }
  }
};
