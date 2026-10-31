# Pelan: language-learning study app (v4)

A web app that teaches a made-up language (**Pelan**) for the study *Cute Engagement Pressures in a Language-Learning Application*. Participants are randomly assigned to one of four versions: **character (Ollie or none) × framing (neutral or guilt)**. Every action is logged to a Google Sheet, and the Qualtrics survey and quiz run inside the app at the end.

It is plain HTML, CSS and JavaScript with no build step, so it runs on **GitHub Pages**. See `CONDITIONS.md` for exactly what each version shows and every message, `CHANGES.md` for what changed, and `LANGUAGE.md` for the lessons and quiz items.

| Group | Key | Ollie | Wording |
|---|---|---|---|
| 1 | `v1_text_neutral` | no | neutral |
| 2 | `v2_ollie_neutral` | yes | neutral (same words as 1) |
| 3 | `v3_text_guilt` | no | guilt, mostly relational with occasional loss |
| 4 | `v4_ollie_guilt` | yes | guilt (same words as 3; Ollie says "I", the app says "we") |

Streak, shells, session goal, lessons, practice modes, help and timing are the same in all four. Comparing 1 vs 2 and 3 vs 4 isolates the character (H1b; Model 5's text-vs-mascot test); comparing 1 vs 3 and 2 vs 4 isolates the framing (H1a).

### How Ollie follows the theory write-up
- **Sequenced:** Ollie is a source of delight before guilt. In the guilt versions, lines have a minimum *stage* (0 before Lesson 1 is done, 1 after 1–2 lessons, 2 after 3+), so there is no guilt until a relationship exists, and it grows from there.
- **Contingent:** his mood follows what the learner does. Happy and cheering when they practice, encouraging on mistakes (never sad about being wrong), sad when they try to leave (guilt versions), relieved and hugging a heart when they come back.
- **Cumulative:** guilt lines refer to shared history ("After 4 lessons together…", "our streak").
- **Benefactor (indebtedness):** after each lesson the neutral versions say "You earned a shell"; the guilt versions say "I/We found this shell for you".

## Participant journey
1. **Eligibility** (3 questions). Ineligible students see the alternative-assignment message.
2. **Consent** (replace the placeholder in `config.js`).
3. **Nickname + study code.** The nickname is only used on screen and is never sent anywhere. The study code links the app data to Qualtrics.
4. **Random assignment** (permuted blocks of 4 on the server).
5. **Onboarding** (3 cards) and a 4-step tour.
6. **Home** is the hub: lesson map on one side; Ollie (or a message panel), the session goal, three practice modes and a break on the other.
   - **10 lessons**, each unlocking the next, plus 2 "coming soon". The first run of a lesson is always the **full** lesson. Finished lessons can be reviewed as a **quick review** (about half the questions) or **full** again, for the same credit. Help appears only in first runs, not in reviews or practice.
   - **Practice**: "Watch and read" / "Watch Ollie explain" (passive), "Quick review" (easy), "Weak words" (active). Same credit.
   - **Session goal** after every lesson: one practice round keeps the streak.
   - **Shells and streak mean something:** shells fill a jar that unlocks the next trick (Ollie) or animation (no Ollie); a streak of 3 or more lessons/rounds in a row doubles the shells for every correct answer.
   - Messages during lessons (halfway nudge, 5 in a row, coming back) appear in the right-hand panel: Ollie says them in the Ollie versions; a message card shows them otherwise.
   - **Leaving** a lesson or practice round (✕) shows that version's prompt, then goes back home. It resets the streak in every version (onboarding says so). Only **Finish** ends the session.
7. **Timing.** The clock starts with Lesson 1. A timer card on home and a chip in every lesson show the minutes until Finish unlocks. **Finish unlocks at 20 minutes**; from then on staying is a free choice (continued system use). A warning comes at 33 minutes and the app moves to the survey at **35 minutes**.
8. **Exit screen**: study code + embedded Qualtrics survey → quiz → background questions → redirect to the separate Extra Credit Form.

Messages repeat at: the start of each lesson (Ollie), halfway through each lesson, every 5 in a row, lesson complete (gift), home after each lesson, the goal, every leave and finish attempt, coming back after leaving, and the 2-minute warning.

---

## Setup

### 1. Data backend (Google Sheet via Apps Script)
1. Open the Google Sheet you already use (or create one with your **ISU Google account**).
2. **Extensions → Apps Script**, replace all the code with `apps-script/Code.gs`, save.
3. Choose `setup` and click **Run**. If the columns changed since the last version, the old tabs are kept as `sessions_old_<date>` etc. and fresh tabs are created.
4. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.** This keeps the same `/exec` URL already in `config.js`.
5. Run `resetBlocks` once so randomization starts fresh with 4 groups.
6. Open the `/exec` URL in a browser. You should see `{"ok":true,...}` with counts for groups 1–4.

**Why not Box?** Box is fine for *storing* the data, but a public web page can't write to Box without putting Box login credentials into code anyone can read. Use the Sheet to *collect*, then download the tabs as CSV into Box (weekly during collection and at the end).

### 2. Qualtrics
`surveyUrl` in `config.js` already points to your survey (`SV_9mcHVkBk8nU1Yto`).
1. Blocks in this order: survey → retention quiz → background questions (including trait reactance and the marker variable).
2. At the top of **Survey Flow**, add **Embedded Data** fields `code`, `sid`, `group`, `condition`. The values of `condition` are now `v1_text_neutral`, `v2_ollie_neutral`, `v3_text_guilt`, `v4_ollie_guilt`.
3. Make every question skippable (no "force response"), since credit comes from reaching the end.
4. End of Survey → redirect to the separate Extra Credit Form (nothing appended to its URL).
5. Test the embed in Chrome, Safari and Firefox. If the survey doesn't load inside the app, participants can use the "Open it in a new tab" link, or set `embedSurvey: false`.

### 3. Participant link
`https://divya-suresh-24.github.io/Ollie-Study/` (no ID in the link; the app makes the study code).

---

## Previewing and sharing the four versions
- `…/Ollie-Study/#preview` opens a picker with all four versions.
- `…/Ollie-Study/#v1` to `#v4` open one version directly.
- A bar at the bottom switches versions, skips a lesson, moves the clock forward 10 minutes (to see Finish unlock and the end), and shows the leave message.
- Previews save nothing, send nothing to the Google Sheet, and don't load the Qualtrics survey. Turn them off with `allowPreview: false` in `config.js`.

## Testing
**Version checklist.** `tests/check_versions.py` plays through every version in a headless browser and checks 30 things each: Ollie present or absent; quick/full credit equal; Ollie encouraging (never sad) on mistakes; no guilt before Lesson 1 is done; guilt stage rises after Lesson 1; gift wording; leave prompt wording and picture; leaving returns home and resets the streak; Finish locked before 20 minutes and unlocked after; return and stay lines; 5-in-a-row pop; finish prompt; survey hand-off; unlock → warning → time-up. Run it after any change:
```bash
pip install playwright && playwright install chromium
python3 -m http.server 8765 &
python3 tests/check_versions.py        # all versions; screenshots go to tests/shots/
```
After editing wording in `config.js`, run `node tests/make_conditions_doc.js` to refresh `CONDITIONS.md`.

**By hand:** add `?debug=1` to the link (`&mins=5` scales the whole session to 5 minutes; `&group=3` forces a group; `&reset=1` starts over). A small **G# ⚙** button gives: skip lesson, +10 min, download this browser's log as CSV, reset. Debug sessions are logged with `assign_mode = debug` and don't use up randomization blocks.

### Before launch
- [ ] `allowDebug: false`
- [ ] IRB-approved consent text (mention the 20–35 minute app part), eligibility wording and alternative-assignment text
- [ ] Apps Script redeployed as a new version, `resetBlocks` run
- [ ] Qualtrics Embedded Data and redirect set
- [ ] Full pilot in each group; delete pilot rows; run `resetBlocks` again
- [ ] Debrief says the streak, shells and Ollie's feelings existed only in the app

---

## Data

### `sessions` tab (one row per participant)
| Column | Meaning |
|---|---|
| `group`, `condition`, `mascot`, `framing`, `assign_mode` | the IV (2 × 2) |
| `lessons_completed`, `lessons_quick`, `lessons_full`, `lesson_redos`, `l1_len`…`l10_len` | progress and the shortest-lesson choice |
| `l1_acc`…`l10_acc`, `l1_sec`…`l10_sec` | first-try accuracy and time per lesson |
| `practice_rounds`, `practice_passive`, `practice_easy`, `practice_active` | practice mode chosen |
| `goals_shown`, `goals_met`, `last_activity` | session goal (minimum act) and what they did last |
| `leave_prompts`, `leave_stayed`, `leaves_early`, `returns` | leaving lessons early and coming back |
| `app_minutes`, `finish_unlocked_at`, `minutes_after_unlock`, `finish_locked_clicks`, `end_reason` | continued use: minutes stayed after Finish unlocked; `finish` vs `time_up` |
| `prompts_shown`, `prompt_continues`, `final_choice`, `seconds_after_first_prompt` | responses to leave and finish prompts |
| `nudges_shown`, `ollie_pops`, `max_stage` | exposure dose; highest guilt stage reached |
| `choices` | everything they chose, in order, e.g. `L1f>L2q>leave-L2>P-passive>L2f>break>finish` |
| `help_opens`, `coach_views`, `max_combo`, `max_streak` | help use, best runs |
| `active_seconds`, `idle_seconds`, `hidden_seconds` | attention: input in the last 30 s / no input / tab in background |
| `survey_opened`, `survey_done` | reached and finished Qualtrics |

### `events` tab (one row per action, details as JSON in `data`)
| Event | Key fields |
|---|---|
| `screen_time` | screen, total_ms, active_ms, idle_ms, hidden_ms |
| `click` | el, label (no coordinates) |
| `lesson_length_choice` | lesson, length (quick/full), redo, decide_ms, goal_active |
| `item_answer` | item, type, answer, correct, latency_ms, combo; `keys`, backspaces, pastes, first_key_ms for typing; `changes` for multiple choice; `mistakes` for match |
| `feedback_continue`, `item_view`, `explain_card` | dwell_ms (explain: how = auto/tap) |
| `prompt_shown`, `prompt_choice` | type (leave/finish), stage, kind (guilt/loss), mood, title, body, choice, rt_ms |
| `back_shown`, `return_shown`, `stay_shown`, `reminder_shown`, `nudge_shown`, `combo_pop`, `gift_shown`, `goal_shown`, `goal_met` | text, stage, kind, mood |
| `streak_reset` | from, why |
| `finish_locked_click`, `finish_unlocked`, `time_warning`, `time_up` | timing |
| `round_start`, `round_complete`, `round_abandoned` | lesson or practice details |
| `break_start`, `break_end`, `unlock` | break item, watch_ms |
| `coach_view`, `help_open`, `help_tab`, `help_close` | dwell_ms |
| `tab_hidden`, `tab_visible`, `session_end`, `survey_opened`, `survey_done` | |

## Mapping the model to the data

| Construct (write-up) | Where | Field or event |
|---|---|---|
| Cute engagement pressure (IV) | sessions | `mascot` × `framing` |
| Felt obligation (should), felt desire (want) — H1 | Qualtrics | should/want items; join on `code` |
| Appeasement behavior — H2a, H2d, H3 | sessions, events | shortest lesson: `lesson_length_choice` on reviews (quick vs full); passive mode: `practice_passive`, `practice_easy` vs `practice_active`; stopping once the streak is safe: `goal_met` followed by `finish` or a break (`choices`, `last_activity`) |
| Attentional engagement — H2b, H2c, H3c | Qualtrics + sessions/events | absorption scale; `active_seconds`, `idle_seconds`, `hidden_seconds`, `screen_time`, `item_answer.latency_ms`, `feedback_continue.dwell_ms`, `explain_card.how` |
| Continued system use — H3a | sessions | `minutes_after_unlock`, `end_reason`, `prompt_continues`, `leave_stayed`, `lessons_completed`, `practice_rounds` |
| Learning performance — H3b, H3c | Qualtrics quiz | join on `code`; `lessons_completed` as covariate |
| Loss-aversion route (estimated) | events | `prompt_shown.kind = loss`, `streak_reset`, `goal_*` |
| Reactance lane (rival model) | events + Qualtrics | fast `leave`/`finish` choices (`rt_ms`) right after guilt lines; state and trait reactance scales |

## Files
```
index.html            page shell
css/styles.css        all styling (laptop-first, stacks on phones)
js/config.js          ← settings, backend and survey URLs, groups, timing, all message wording
js/content.js         Pelan vocabulary, the 10 lessons, quick lessons, practice generator, word list
js/art.js             Ollie (14 moods), tricks, animations, word pictures, logo (inline SVG)
js/logger.js          event queue, time-on-screen tracking → Google Sheet
js/app.js             screens, assignment, lessons, home hub, prompts, timing, exit, preview
apps-script/Code.gs   Google Sheets backend (4 groups)
LANGUAGE.md           the language, lesson plan, quiz items
CONDITIONS.md         what each version shows + every message (generated)
tests/                version checklist + CONDITIONS.md generator
CHANGES.md            what changed
```
