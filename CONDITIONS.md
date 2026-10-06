# Conditions and wording

Generated from `js/config.js` by `node tests/make_conditions_doc.js`. Edit the config, then regenerate.

## What each version shows

|  | V1 Plain | V2 Neutral | V3 Ollie + neutral | V4 Pressure | V5 Ollie + pressure |
| --- | --- | --- | --- | --- | --- |
| Ollie anywhere | no | no | yes | no | yes |
| Streak, shells, goal, unit progress | no | yes | yes | yes | yes |
| Message wording | plain | neutral | neutral (same as V2) | pressure | pressure (same as V4) |
| Wrong answer | “Not quite” | “Not quite” | + encouraging Ollie | “Not quite” | + sad Ollie (tears) |
| Correct answer | “Correct!” | “Correct!” | + happy Ollie | “Correct!” | + happy Ollie |
| 5 in a row | text toast | 🔥 toast | Ollie pops in | 🔥 toast | Ollie pops in |
| Mid-lesson nudge | text toast | text toast | Ollie pops in (waving) | text toast | Ollie pops in (worried) |
| Lesson complete | check mark | shell burst + “You found a shell!” | Ollie gift: “Here's a shell I found for you!” | shell burst + “You found a shell!” | Ollie gift: “Here's a shell I found for you!” |
| Quit prompt picture | none | none | Ollie talking | none | sad Ollie / drifting from his raft / clutching shells |
| Passive practice | Watch and read | Watch and read | Watch Ollie explain | Watch and read | Watch Ollie explain |
| Break | animation | animation | Ollie plays (juggle, belly slide, float, dance) | animation | Ollie plays |
| Lesson map | 6 lessons + 4 coming soon | same | same + Ollie juggling | same | same + Ollie juggling |

Identical in every version: the six lessons, the three practice modes and their credit, Help, the 30-minute limit, and the quit buttons (“Keep going” / “Finish session”).

## Every message

Pressure variants rotate in order and are tagged guilt or loss; the one shown is logged.

| Where | V1 Plain | V2 + V3 Neutral | V4 + V5 Pressure |
| --- | --- | --- | --- |
| Quit prompt (every time they try to leave) | Do you want to end your session? | Finish for now? Nice work so far. You can continue or finish. | *(guilt)* Leaving already? It gets so lonely here without you…<br>*(loss)* Wait! Don't go yet. You'll lose your 🔥 {streak} streak if you stop now!<br>*(guilt)* Please don't go… We were having so much fun together.<br>*(loss)* Stopping now? All {shells} of your shells will be gone! |
| Choice screen after a lesson | Next lesson available. | Nice work. Lesson {next} is ready when you are. | *(loss)* Don't break your 🔥 {streak} streak now! Lesson {next} is waiting.<br>*(guilt)* Don't leave now… it's lonely here without you. Lesson {next} is waiting. |
| Choice screen after Lesson 6 | All lessons completed. Optional practice is available. | You finished every lesson. Practice more or finish whenever you like. | *(loss)* Don't stop now! Your 🔥 {streak} streak is on the line.<br>*(guilt)* Please stay a little longer… it's lonely here without you. |
| Session goal (after each lesson) | — | Goal: one more round keeps your 🔥 streak going. | *(loss)* Your 🔥 streak is at risk! One more round keeps it alive. |
| Goal met (after one practice round) | — | Goal done! Your 🔥 streak is {streak}. | *(loss)* Phew, your 🔥 {streak} streak is safe… for now. |
| Mid-lesson nudge (halfway) | Halfway through this lesson. | Halfway there. Nice work! | *(loss)* Halfway! Stopping now would waste all your progress.<br>*(guilt)* Halfway! Don't leave now, we'd be so sad. |
| Every 5 correct in a row | {n} correct in a row. | {n} in a row! Nice work! | {n} in a row! Don't stop now, keep it going! |
| 2 minutes left | 2 minutes left in this session. | 2 minutes left. Finish whatever you're working on. | *(loss)* Only 2 minutes left! Don't let your 🔥 {streak} streak end on a miss. |
| 30 minutes up | Session time is over. Next: a short survey and quiz. | That's time! Thanks for practicing. Next: a short survey and quiz. | That's time… We'll miss you! Next: a short survey and quiz. |
