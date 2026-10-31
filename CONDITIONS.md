# Conditions and wording

Generated from `js/config.js` by `node tests/make_conditions_doc.js`. Edit the config, then regenerate.

## What each version shows (2 × 2)

|  | V1 Text + neutral | V2 Ollie + neutral | V3 Text + guilt | V4 Ollie + guilt |
| --- | --- | --- | --- | --- |
| Ollie anywhere | no | yes | no | yes |
| Wording | neutral | neutral (same as V1) | guilt | guilt (same words as V3; “I” instead of “we”) |
| Correct answer | “Correct!” bar | + Ollie cheers beside the lesson | “Correct!” bar | + Ollie cheers beside the lesson |
| Wrong answer | “Not quite” bar | + encouraging Ollie | “Not quite” bar | + encouraging Ollie (never sad about mistakes) |
| 5 in a row, nudges, return | message card in the right panel | Ollie says it in the right panel (twirl at 10) | message card in the right panel | Ollie says it in the right panel (twirl at 10) |
| Lesson complete | shell + “You earned a shell!” | Ollie holds out a shell + “You earned a shell!” | shell + “We found this shell for you!” | Ollie holds out a shell + “I found this shell for you!” |
| Leave / Finish prompt picture | none | Ollie talking or waving | none | stage 0: Ollie talking; later: sad, worried, or drifting from his raft |
| Home after leaving early | neutral line | happy Ollie, neutral line | guilt line | sad Ollie, guilt line |
| Coming back | “Welcome back.” | waving Ollie | “Yay, you're back! We missed you!” | Ollie hugs a heart: “I missed you!” |
| Passive practice | Watch and read | Watch Ollie explain | Watch and read | Watch Ollie explain |
| Break | animations | Ollie plays (juggle, belly slide, twirl, float, dance) | animations | Ollie plays |

Identical in every version: the 10 lessons (full the first time; quick review or full on a replay), streak and shells (a streak of 3+ doubles shells; shells unlock tricks or animations), session goal, three practice modes and their credit, Help, the 20-minute Finish lock and 35-minute end, the lock messages (“You can finish whenever you like now.”), and the prompt buttons (“Keep going” / “Leave” and “Keep going” / “Finish session”). Leaving a lesson or round early resets the streak in every version, and onboarding says so in every version.

## How guilt is sequenced

Guilt lines have a minimum stage. The app shows the highest stage that applies and rotates within it, so the relationship is warm first and the guilt builds with shared history.

- Stage 0 · before Lesson 1 is done
- Stage 1 · after 1–2 lessons
- Stage 2 · after 3+ lessons

## Every message

Shown with Ollie's wording (“I”). Without Ollie, the same lines use “we / us / our”.

| Where | V1 + V2 Neutral | V3 + V4 Guilt |
| --- | --- | --- |
| Leaving a lesson or practice round (✕) | Leave this {what}? You can pick it up again from the home screen. | *(stage 0)* Leaving already? I'm just getting started!<br>*(stage 1, guilt)* Wait, don't go yet… I had so much fun with you.<br>*(stage 2, guilt)* You're leaving me? After {together} lessons together… I'll be so lonely.<br>*(stage 2, loss)* Stopping now? Our 🔥 {streak} streak will be broken!<br>*(stage 2, guilt)* Please stay a little longer… I feel so sad when you leave. |
| Home, right after leaving early | Pick anything you like next. | *(stage 0)* No worries. Pick anything you like next.<br>*(stage 1, guilt)* Aw… I really enjoyed that one. |
| Starting something after leaving early | Welcome back. | Yay, you're back! I missed you! |
| Finish (after it unlocks) | Finish your session? Nice work today. Next: a short survey and quiz. | *(stage 0)* Leaving already? I'm just getting started!<br>*(stage 1, guilt)* Are you really leaving me? It gets so lonely here without you…<br>*(stage 1, guilt)* Please don't go… I loved learning with you today.<br>*(stage 1, loss)* Wait! Our 🔥 {streak} streak ends if you leave now. |
| After choosing Keep going | Great, let's keep going. | Yay! Thank you for staying with me! |
| Home after a lesson | Nice work. Lesson {next} is ready when you are. | *(stage 0)* Yay! Lesson {next} is ready. Let's keep going together!<br>*(stage 2, guilt)* Don't leave me now… Lesson {next} is waiting for us.<br>*(stage 2, loss)* Our 🔥 {streak} streak is growing. Don't let it end! |
| Home after Lesson 10 | You finished every lesson. Practice or replay lessons as long as you like. | *(guilt)* Please stay a little longer… it's lonely here without you.<br>*(loss)* Don't stop now! Our 🔥 {streak} streak is on the line. |
| Session goal (after each lesson) | Goal: one more round keeps your 🔥 streak going. | *(stage 0)* One more round together? Let's keep our 🔥 streak going!<br>*(stage 1, guilt)* One more round together? I don't want our 🔥 streak to end. |
| Goal met (one practice round) | Goal done! Your 🔥 streak is {streak}. | Phew! Our 🔥 {streak} streak is safe… for now. Stay with me? |
| Lesson complete gift | You earned a shell! +{gift} 🐚 | I found this shell for you! +{gift} 🐚 |
| Every 5 correct in a row | {n} in a row! Nice work! | {n} in a row! I'm so proud of you! |
| Halfway through a lesson | Halfway there. Nice work! | *(stage 0)* Halfway there! I'm having so much fun!<br>*(stage 1, guilt)* Halfway! Don't leave me now, I'd be so sad.<br>*(stage 1, loss)* Halfway! Stopping now would waste our progress. |
| 2 minutes before the end | 2 minutes left. Finish whatever you're working on. | *(guilt)* Only 2 minutes left… I'll miss you! |
| App ends (35 min) | That's time! Thanks for practicing. Next: a short survey and quiz. | That's time… I'll miss you! Next: a short survey and quiz. |
