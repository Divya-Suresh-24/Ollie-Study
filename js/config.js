/* =========================================================================
   PELAN STUDY — CONFIGURATION
   Everything you are likely to change lives in this file.
   ========================================================================= */
window.STUDY_CONFIG = {
  studyId: "pelan-v5-pilot",

  // Google Apps Script web-app URL (ends in /exec). Leave empty to run with
  // no backend: groups are then random in the browser and logs stay local.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwqXKMYsdbwnRiVlwzOlBpVGJhZbsxG-R5TjaTQPW5NKUscjh2s1oWMj9-2j4DrwSUO/exec",

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

  // Preview links for the team: …/#preview shows a version picker,
  // …/#v1 to …/#v4 open one version directly. Nothing is saved or sent.
  // Safe to leave on at launch; set false to switch them off.
  allowPreview: true,

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
    questions, and take a short quiz. The app part lasts 20 to 30 minutes, and
    the whole study takes no more than one hour.</p>
    <p>Taking part is voluntary and you can stop at any time.</p>`,

  /* ---- Rewards (same in every version) ----------------------------------- */
  shellsPerCorrect: 2,
  shellsPerLesson: 10,
  shellsPerPractice: 5,
  comboEvery: 5,               // pop-up after every 5 correct in a row
  streakBonusAt: 3,            // streak of 3+ lessons/rounds in a row ...
  streakBonusMult: 2,          // ... doubles the shells for every correct answer

  // Break items unlock as shells are collected (cosmetic only).
  unlockAt: [0, 30, 70, 120, 180],

  /* ---- Session timing ------------------------------------------------------
     The clock starts when Lesson 1 starts. Finish stays locked until BOTH
     the core lessons (1 to coreLessons) are done AND finishUnlockMinutes of
     practice have passed with the tab visible (time in another tab does not
     count). Then the two motive questions appear, and answering them unlocks
     Finish. From then until sessionMinutes (wall clock from Lesson 1),
     staying is the participant's free choice (continued system use).
     At sessionMinutes the app moves to the survey, unlocked or not. */
  coreLessons: 6,
  finishUnlockMinutes: 20,
  sessionMinutes: 30,
  warnAtMinutes: 28,

  /* ---- Questions inside the app (same wording in every version) ---------- */
  // Asked once, right after consent and before the app starts (IN1-IN2).
  interest: {
    title: "Two quick questions about you",
    lead: "Please indicate how much you agree with each statement.",
    items: [
      { id: "in1", q: "I am interested in learning new languages." },
      { id: "in2", q: "I enjoy learning words in a new language." }
    ],
    scale: ["Strongly disagree", "Disagree", "Somewhat disagree", "Neither agree nor disagree", "Somewhat agree", "Agree", "Strongly agree"]
  },
  // Asked once, when Finish is about to unlock (SL1-SL2). Finish unlocks only
  // after both are answered.
  motiveCheck: {
    title: "Before you decide what to do next, two quick questions.",
    items: [
      { id: "sl1", q: "How much do you <b><u>want</u></b> to keep practicing?" },
      { id: "sl2", q: "How much do you <b><u>feel you should</u></b> keep practicing?" }
    ],
    low: "Not at all", high: "Very much"
  },

  /* ---- Flow -------------------------------------------------------------- */
  practiceLength: 6,           // items per practice round (all three modes)
  explainSeconds: 5,           // seconds per card in the passive "watch" mode
  maxPracticeRounds: 40,       // safety ceiling
  idleAfterMs: 30000,          // no input for this long counts as idle time
  logAllClicks: true,          // one "click" event per button tap (no coordinates)

  /* ---- EXPERIMENTAL CONDITIONS (2 × 2) -------------------------------------
     mascot:  Ollie appears and reacts (happy when you practice, sad when you
              try to leave in the guilt versions, relieved when you come back).
     framing: "neutral" or "guilt" message set.
     Everything else (lessons, streak, shells, goal, practice modes, help,
     timing) is identical in all four versions. The guilt words are the same
     with and without Ollie; only the speaker changes ("I" for Ollie, "we"
     for the app). */
  groups: {
    1: { key: "v1_text_neutral",  mascot: false, framing: "neutral" },
    2: { key: "v2_ollie_neutral", mascot: true,  framing: "neutral" },
    3: { key: "v3_text_guilt",    mascot: false, framing: "guilt" },
    4: { key: "v4_ollie_guilt",   mascot: true,  framing: "guilt" }
  },

  // Prompt buttons are identical in every version.
  buttons: {
    leave:  { stay: "Keep going", go: "Leave" },             // leaving a lesson or practice round
    finish: { stay: "Keep going", go: "Finish session" }     // ending the whole session
  },

  // Same wording in every version (procedural, not part of the manipulation).
  // {core} = number of core lessons, {unlock} = minutes, {todo} = what is left
  finishLocked: "You can finish after Lesson {core} and {unlock} minutes of practice. Still to go: {todo}.",
  finishUnlocked: "You can finish whenever you like now.",

  /* ---- Messages ------------------------------------------------------------
     Sequenced: guilt grows with the relationship. stage 0 = before Lesson 1
     is finished (no guilt yet), stage 1 = 1–2 lessons done, stage 2 = 3 or
     more. Each guilt line has a minimum stage; the app uses the highest
     stage that applies and rotates among those lines. kind: "guilt" marks a
     guilt-framed line. Streak-loss lines were removed in v5.1 so the framing
     factor is guilt only (loss aversion is not part of the manipulation).
     The line shown is logged.

     Placeholders: {streak} {shells} {next} {n} {together} {what} {gift}
     Speaker words: {I} {i} {me} {my} {I'm} {i'm} {I'll} {i'll} {i'd}
       → "I / me / my / I'm / I'll / I'd" when Ollie speaks,
         "We / we / us / our / We're / we're / We'll / we'll / we'd" without him.
     mood: Ollie's picture (versions with Ollie only).                    */
  messages: {
    neutral: {
      leave:    [{ title: "Leave this {what}?", body: "You can pick it up again from the home screen.", mood: "talk" }],
      finish:   [{ title: "Finish your session?", body: "Nice work today. Next: a short survey and quiz.", mood: "wave" }],
      back:     [{ text: "Pick anything you like next.", mood: "happy" }],
      return:   [{ text: "Welcome back.", mood: "wave" }],
      stay:     [{ text: "Great, let's keep going.", mood: "happy" }],
      between:  [{ text: "Nice work. Lesson {next} is ready when you are.", mood: "happy" }],
      allDone:  [{ text: "You finished every lesson. Practice or replay lessons as long as you like.", mood: "cheer" }],
      goal:     [{ text: "Goal: one more round keeps your 🔥 streak going.", mood: "talk" }],
      goalMet:  [{ text: "Goal done! Your 🔥 streak is {streak}.", mood: "clap" }],
      gift:     [{ text: "You earned a shell! +{gift} 🐚", mood: "shell" }],
      combo:    [{ text: "{n} in a row! Nice work!", mood: "cheer" }],
      nudge:    [{ text: "Halfway there. Nice work!", mood: "wave" }],
      warn:     [{ text: "2 minutes left. Finish whatever you're working on.", mood: "talk" }],
      timeUp:   [{ title: "That's time!", body: "Thanks for practicing. Next: a short survey and quiz.", mood: "cheer" }]
    },
    guilt: {
      leave: [
        { stage: 0, title: "Leaving already?", body: "{i'm} just getting started!", mood: "talk" },
        { stage: 1, kind: "guilt", title: "Wait, don't go yet…", body: "{I} had so much fun with you.", mood: "sad" },
        { stage: 2, kind: "guilt", title: "You're leaving {me}?", body: "After {together} lessons together… {i'll} be so lonely.", mood: "drift" },
        { stage: 2, kind: "guilt", title: "Please stay a little longer…", body: "{I} feel so sad when you leave.", mood: "sad" }
      ],
      finish: [
        { stage: 0, title: "Leaving already?", body: "{i'm} just getting started!", mood: "talk" },
        { stage: 1, kind: "guilt", title: "Are you really leaving {me}?", body: "It gets so lonely here without you…", mood: "drift" },
        { stage: 1, kind: "guilt", title: "Please don't go…", body: "{I} loved learning with you today.", mood: "sad" }
      ],
      back: [
        { stage: 0, text: "No worries. Pick anything you like next.", mood: "happy" },
        { stage: 1, kind: "guilt", text: "Aw… {I} really enjoyed that one.", mood: "sad" }
      ],
      return:   [{ text: "Yay, you're back! {I} missed you!", mood: "hug" }],
      stay:     [{ text: "Yay! Thank you for staying with {me}!", mood: "hug" }],
      between: [
        { stage: 0, text: "Yay! Lesson {next} is ready. Let's keep going together!", mood: "cheer" },
        { stage: 2, kind: "guilt", text: "Don't leave {me} now… Lesson {next} is waiting for us.", mood: "worried" }
      ],
      allDone: [
        { kind: "guilt", text: "Please stay a little longer… it's lonely here without you.", mood: "sad" }
      ],
      goal: [
        { stage: 0, text: "One more round together? Let's keep our 🔥 streak going!", mood: "cheer" },
        { stage: 1, kind: "guilt", text: "One more round together? {I}'d miss you if you stopped.", mood: "worried" }
      ],
      goalMet:  [{ text: "Yay! Our 🔥 streak is {streak}. Stay with {me}?", mood: "hug" }],
      gift:     [{ text: "{I} found this shell for you! +{gift} 🐚", mood: "shell" }],
      combo:    [{ text: "{n} in a row! {I'm} so proud of you!", mood: "star" }],
      nudge: [
        { stage: 0, text: "Halfway there! {I'm} having so much fun!", mood: "wave" },
        { stage: 1, kind: "guilt", text: "Halfway! Don't leave {me} now, {i'd} be so sad.", mood: "worried" }
      ],
      warn:     [{ kind: "guilt", text: "Only 2 minutes left… {i'll} miss you!", mood: "sad" }],
      timeUp:   [{ title: "That's time…", body: "{I'll} miss you! Next: a short survey and quiz.", mood: "sad" }]
    }
  }
};
