# What changed in v2

## Study design
- The five groups now follow the IRB draft: **v1 plain**, **v2 neutral**, **v3 Ollie + neutral**, **v4 pressure**, **v5 Ollie + pressure**. (v1 used the old exit-prompt-only design with mascot × guilt/loss; that version is in git history.)
- Every condition switch lives in `js/config.js` (`groups` and `messages`), so the design can be changed without touching code.
- Ollie appears only in v3 and v5. Every Ollie moment has a plain equivalent with the same text in the other versions, so lessons and help are identical across groups.
- Pressure messages appear between lessons, in the "5 in a row" pop-ups and on every quit attempt. Variants rotate and the one shown is logged.

## Participant flow
- New eligibility screen (18+, enrolled, not done before) with the alternative-assignment message.
- Nickname instead of name. It stays on the device, is never sent to the backend, and is wiped at the end.
- Each participant gets a study code (e.g. `K7M-3PX`) that is passed to Qualtrics and shown on the exit screen.
- Exit screen embeds the Qualtrics survey (with a new-tab fallback) and can detect when it is finished.

## Lessons
- Six lessons instead of one. Lesson 1 was split into "First words" (learn) and "Word practice" (reinforce). New lessons: big/small, ending practice, colors, review.
- Lessons 2–6 are locked until the previous one is done.
- Drawn pictures replace emoji, with real size and color differences.
- Each exercise shows a colored type label and a one-line instruction. The first time each type appears, a short "how this works" card with a mini demo explains it.
- Help button on every question: how to answer, a hint where available, and a word list of everything learned so far.
- River progress bar with a shell that floats along as you go.
- "5 in a row" pop-ups (Ollie peeks in for v3/v5).
- Lesson-complete celebration (Ollie dance for v3/v5, shell burst for v2/v4, simple check for v1).

## Choices, rewards and breaks
- After each lesson: next lesson, extra practice (flashcards), take a break, or finish.
- Shells replace gems and XP. They unlock new Ollie tricks (v3/v5) or animations (v2/v4). v1 has no shells and all animations are available.
- Four animated Ollie tricks and four neutral animations, all inline SVG (no video files).

## Logging
- Active, idle and hidden time per screen and for the whole session.
- Every button tap (no coordinates), keystrokes in the typing exercises only, answer changes, help use, coach-card dwell, flashcard flips and ratings, break watch time, reminder exposures and choices.
- Events spill into a new spreadsheet automatically before Google's 10-million-cell limit.

## Look
- New river palette, Baloo 2 headings, Atkinson Hyperlegible for reading (built for telling similar letters apart).
- Ollie redesigned with a teal scarf and seven expressions.
