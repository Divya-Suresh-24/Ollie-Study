/* =========================================================================
   OLLIE STUDY — CONFIGURATION
   Everything you are likely to change lives in this file.
   ========================================================================= */
window.OLLIE_CONFIG = {
  studyId: "ollie-pilot-1",

  // 1) Paste your Google Apps Script web-app URL here (it ends in /exec).
  //    Leave empty to run without a backend: groups are then assigned in the
  //    browser and logs stay in the browser only (fine for demos, not data).
  appsScriptUrl: "",

  // 2) Where participants go after they finally quit (your survey, which is
  //    followed by the retention quiz). These placeholders are filled in:
  //    {pid} {sid} {group} {condition}
  //    e.g. "https://iastate.qualtrics.com/jfe/form/SV_xxx?pid={pid}&sid={sid}&group={group}"
  //    Leave empty to show a simple "session finished" screen instead.
  surveyUrl: "",

  // URL parameters that may carry the participant ID (first match wins),
  // e.g. https://yourname.github.io/ollie-study/?pid=P001
  pidParams: ["pid", "PROLIFIC_PID", "participant", "id"],
  // If no ID is in the link, show an ID box on the welcome screen.
  // If the box is left blank, an anonymous ID is generated.
  requirePid: false,

  // The name is used on screen ("Great job, Divya!"). Set to true to also
  // save it in the Google Sheet (check your IRB protocol first).
  logName: false,

  // Consent screen. Replace consentHtml with your IRB-approved text.
  showConsent: true,
  consentHtml: `
    <p><strong>[Placeholder: replace with your IRB-approved consent text.]</strong></p>
    <p>You are invited to take part in a research study about learning a new
    language with an app. You will complete a short lesson, answer a few
    questions, and take a short quiz. It takes about 15 to 20 minutes.</p>
    <p>Taking part is voluntary and you can stop at any time. Your responses
    are recorded under a participant ID.</p>`,

  // Testing: add ?debug=1 to the link to see a debug bar; add &group=3 to
  // force a group and &reset=1 to start over. Forced sessions are marked
  // assign_mode = "debug" in the data. SET TO false BEFORE LAUNCH.
  allowDebug: true,

  // ---- Rewards -----------------------------------------------------------
  xpPerCorrect: 10,          // Lesson 1: per correct answer
  gemsPerCorrect: 5,         // Lesson 1: per correct answer
  lessonBonusGems: 10,       // Lesson 1: bonus for finishing
  practiceXp: 30,            // Practice: flat reward per finished round
  practiceGems: 15,          //   (identical for every practice mode)

  // ---- Continued use -----------------------------------------------------
  // After Lesson 1, participants may keep doing practice rounds. The session
  // ends on its own after this many rounds (the ceiling for the DV).
  practiceRoundLength: 8,
  maxPracticeRounds: 6,

  // Practice modes offered after Lesson 1 (same reward for each). Choice of
  // mode is logged as a behavioural indicator of engagement- vs learning-
  // oriented use. Remove entries to offer fewer modes.
  practiceModes: [
    { id: "review",    title: "Quick review", tag: "Easy",    desc: "Words you already know",       icon: "🐟" },
    { id: "challenge", title: "Challenge",    tag: "Harder",  desc: "Build and check phrases",      icon: "🧩" },
    { id: "watch",     title: "Watch Ollie",  tag: "Relaxed", desc: "Just look and tap through",    icon: "👀" }
  ],

  // Show the condition prompt on every quit attempt (true) or only on the
  // first one (false: later attempts quit straight away).
  promptOnEveryQuit: true,

  // ---- EXPERIMENTAL CONDITIONS (the IV) ------------------------------------
  // Buttons are identical in every group so only the character and the
  // framing differ. {gems} is replaced by the participant's current gems.
  buttons: { stay: "Keep Going", quit: "Yes, Quit" },

  groups: {
    1: { key: "mascot_guilt", mascot: true,  framing: "guilt",   art: "river",
         title: "Ollie will get washed away in the river! Save me!" },
    2: { key: "mascot_loss",  mascot: true,  framing: "loss",    art: "gem",
         title: "Oh no! If you quit now, you'll lose your {gems} gems!" },
    3: { key: "text_guilt",   mascot: false, framing: "guilt",
         title: "We will be sad if you leave. Please don't go!" },
    4: { key: "text_loss",    mascot: false, framing: "loss",
         title: "If you quit now, you'll lose your {gems} gems!" },
    5: { key: "control",      mascot: false, framing: "neutral",
         title: "Do you want to quit?" }
  }
};
