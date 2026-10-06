# Pelan: language-learning study app (v3)

A web app that teaches a made-up language (**Pelan**) for the study *Cute Engagement Pressures in a Language-Learning Application*. Participants are randomly assigned to one of five versions (2 character × 2 framing + plain control). Every action is logged to a Google Sheet, and the Qualtrics survey and quiz run inside the app at the end.

It is plain HTML, CSS and JavaScript with no build step, so it runs on **GitHub Pages**. See `CONDITIONS.md` for exactly what each version shows and every message, `CHANGES.md` for what changed, and `LANGUAGE.md` for the lessons and quiz items.

| Group | Key | Ollie | Streak, goal, shells | Wording |
|---|---|---|---|---|
| 1 | `v1_plain` | no | no (lesson count only) | plain |
| 2 | `v2_neutral` | no | yes | neutral |
| 3 | `v3_ollie_neutral` | yes | yes | neutral (identical to 2) |
| 4 | `v4_pressure` | no | yes | guilt + loss |
| 5 | `v5_ollie_pressure` | yes | yes | guilt + loss (identical to 4) |

Ollie adds pictures and animation only. The words are the same as in the matching version without him, so V2 vs V3 and V4 vs V5 isolate the character (Model 1 H1b; Model 5's text-vs-mascot test).

## Participant journey
1. **Eligibility** (3 questions). Ineligible students see the alternative-assignment message.
2. **Consent** (replace the placeholder in `config.js`).
3. **Nickname + study code.** The nickname is only used on screen and is never sent anywhere. The study code links the app data to Qualtrics.
4. **Random assignment** (permuted blocks of 5 on the server).
5. **Onboarding** (3 cards) and a 4-step tour of the lesson map.
6. **Lessons 1–6**, each unlocking the next (Lessons 7–10 show as "coming soon"). The **30-minute clock** starts with Lesson 1; a warning appears at 28 minutes and the app moves to the survey at 30.
   After each lesson: next lesson, one of **three practice modes with identical credit** (passive "Watch and read"/"Watch Ollie explain", easy "Quick review", active "Weak words challenge"), a break, or finish. In versions 2–5 a **session goal** ("one more round keeps your streak") appears after each lesson and is met by any one practice round.
   Pressure is repeated at: the start of each lesson, the halfway point of each lesson, wrong answers (V5: sad Ollie), every 5 in a row, every choice screen, the goal, every quit attempt, and the 2-minute warning.
7. **Finish** at any time (Finish button, ✕ in a lesson, or the choice screen) → quit prompt for their version.
8. **Exit screen**: study code + embedded Qualtrics survey → retention quiz → background questions.

---

## Setup

### 1. Data backend (Google Sheet via Apps Script)
1. Create an empty Google Sheet with your **ISU Google account**.
2. **Extensions → Apps Script**, replace the sample code with `apps-script/Code.gs`, save.
3. Choose `setup` and click **Run**. Approve the permissions.
4. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access **Anyone** → **Deploy**.
5. Paste the URL (ends in `/exec`) into `appsScriptUrl` in `js/config.js`.
6. Open that URL in a browser. You should see `{"ok":true,...}` with group counts.

After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New version** to keep the same URL.

**Why not Box?** Box is fine for *storing* the data, but a public web page can't write to Box without putting Box login credentials into code anyone can read. Use the Sheet to *collect*, then download the tabs as CSV into Box (weekly during collection and at the end), and delete the Google copy if your data plan says so.

### 2. Qualtrics
`surveyUrl` in `config.js` already points to your survey (`SV_9mcHVkBk8nU1Yto`).
1. Put the blocks in this order: survey → retention quiz → background questions (including trait reactance).
2. At the top of **Survey Flow**, add **Embedded Data** fields `code`, `sid`, `group`, `condition`.
3. Make every question skippable (no "force response"), since credit comes from reaching the end.
4. Optional backup: add a text question "Enter your study code" in case the URL fields are lost.
5. Optional, so the app knows the survey is finished: on the last page's question, **Add JavaScript**:
   ```js
   Qualtrics.SurveyEngine.addOnload(function () {
     window.parent.postMessage("pelan_survey_done", "https://<your-username>.github.io");
   });
   ```
   Keep `surveyOrigin` in `config.js` equal to your Qualtrics domain.
6. Test the embed in Chrome, Safari and Firefox. If the survey doesn't load inside the app on some browser, participants can use the "Open it in a new tab" link, or set `embedSurvey: false` to send everyone to Qualtrics directly.

### 3. GitHub Pages
```bash
cd ollie-study            # your existing repo
# copy the v2 files over the old ones, then:
git checkout -b v2
git add -A
git commit -m "v2: IRB conditions, six lessons, logging, Qualtrics embed, redesign"
git push -u origin v2
```
Open a pull request into `main` (or merge directly). Pages republishes about a minute after `main` changes. The old `js/ollie-art.js` is replaced by `js/art.js`, so delete it if `git status` still shows it.

### 4. Participant link
`https://<your-username>.github.io/ollie-study/` (no ID in the link; the app makes the study code).

---

## Testing
**Version checklist.** `tests/check_versions.py` plays through every version in a headless browser and checks about 20 things each (Ollie present or absent, wording set, sad Ollie, nudges, pops, goal, practice modes, quit picture, 30-minute stop, survey hand-off). Run it after any change:
```bash
pip install playwright && playwright install chromium
python3 -m http.server 8765 &
python3 tests/check_versions.py        # all versions; screenshots go to tests/shots/
```
After editing wording in `config.js`, run `node tests/make_conditions_doc.js` to refresh `CONDITIONS.md`.

**By hand:** add `?debug=1` to the link (`&mins=2` shortens the 30-minute clock). A small **G# ⚙** button appears at the bottom right with: skip lesson, +50 shells, show prompt, download this browser's log as CSV, reset.

```
…/?debug=1&group=5&reset=1     start over in group 5
```
Debug sessions are logged with `assign_mode = debug` and don't use up randomization blocks. Filter them out before analysis.

### Before launch
- [ ] `allowDebug: false`
- [ ] IRB-approved consent text, eligibility wording and alternative-assignment text
- [ ] `appsScriptUrl`, `surveyUrl`, `surveyOrigin` set
- [ ] Run a full pilot in each group, delete pilot rows, run `resetBlocks`
- [ ] Debrief text explains the versions, and that shells and streaks were not really lost

---

## Data

### `sessions` tab (one row per participant)
| Column | Meaning |
|---|---|
| `group`, `condition`, `assign_mode` | the IV |
| `lessons_completed`, `l1_acc`…`l6_acc`, `l1_sec`…`l6_sec` | progress and first-try accuracy per lesson |
| `practice_rounds`, `practice_passive`, `practice_easy`, `practice_active`, `breaks_taken`, `break_seconds` | optional activity and practice mode chosen |
| `goals_shown`, `goals_met`, `last_activity`, `app_minutes` | session goal (minimum act), what they did last, minutes in the app |
| `nudges_shown`, `ollie_pops` | exposure counts |
| `choices` | everything they chose, in order, e.g. `L1>L2>break>practice>L3>finish` |
| `prompts_shown`, `prompt_continues`, `final_choice`, `seconds_after_first_prompt` | response to the quit prompts |
| `help_opens`, `coach_views`, `max_combo` | help use and best answer streak |
| `active_seconds`, `idle_seconds`, `hidden_seconds` | attention: input in the last 30 s / no input / tab in background |
| `survey_opened`, `survey_done` | whether they reached and finished Qualtrics |

### `events` tab (one row per action, details as JSON in `data`)
| Event | Key fields |
|---|---|
| `screen_time` | screen, total_ms, active_ms, idle_ms, hidden_ms |
| `click` | el, label (no coordinates) |
| `item_answer` | item, type, answer, correct, latency_ms, combo; `keys` (keystroke list), backspaces, pastes, first_key_ms for typing; `changes` for multiple choice; `mistakes` for match |
| `feedback_continue`, `item_view` | dwell_ms |
| `coach_view`, `help_open`, `help_tab`, `help_close` | type, dwell_ms |
| `reminder_shown` | context, msg (variant), text |
| `choice_made` | choice (`next`, `practice`, `break`, `finish`, `map`), decide_ms |
| `combo_pop` | n, msg, text |
| `explain_card` | passive mode: word, dwell_ms, how (auto/tap) |
| `goal_shown`, `goal_met`, `nudge_shown`, `time_warning`, `time_up`, `gift_shown` | text, kind (guilt/loss) |
| `break_start`, `break_end` | item, watch_ms, how |
| `unlock` | item, shells_total |
| `prompt_shown`, `prompt_choice` | context, msg, kind (guilt/loss), ollie picture, title, body, choice, rt_ms |
| `round_start`, `round_complete`, `round_abandoned` | lesson or practice details |
| `tab_hidden`, `tab_visible`, `session_end`, `survey_opened`, `survey_done` | |

Long studies: when the events tab reaches 300,000 rows, new events go to a new spreadsheet `pelan-events-part-2` (and so on) in the same Google Drive.

## Mapping the models to the data

| Construct | Where | Field or event |
|---|---|---|
| IV | sessions | `group`, `condition` |
| Appeasement (Model 1) / engagement-oriented use (Model 5) | sessions, events | `practice_passive`, `practice_easy` vs `practice_active`; `goals_met` with `last_activity` (stopping right after the goal round = minimum act); `choice_made` with `goal_active` |
| Learning-oriented use | events | `practice_active`; `item_answer.latency_ms`, `feedback_continue.dwell_ms`, `explain_card.dwell_ms` and `how` (auto vs tap), `help_open`; continuing past the goal |
| Attentional engagement (telemetry) | sessions, events | `active_seconds`, `idle_seconds`, `hidden_seconds`; `screen_time`; answer latencies |
| Continued system use (in session) | sessions | `lessons_completed`, `practice_rounds`, `app_minutes`, `prompt_continues`, `seconds_after_first_prompt`, `end_reason` (`quit` vs `time_up`) |
| Reactance behavior (Model 5) | events | `prompt_choice` (`rt_ms`, quit vs continue) after `prompt_shown` (with `kind` guilt/loss); exits right after a `nudge_shown` or `reminder_shown` |
| Exposure dose | sessions, events | `prompts_shown`, `nudges_shown`, `ollie_pops`, `reminder_shown`, `goal_shown` |
| Learning performance, should/want, absorption, manipulative intent, state and trait reactance, enjoyment, feeling of learning | Qualtrics | join on `code` |

## Files
```
index.html            page shell
css/styles.css        all styling
js/config.js          ← settings, backend and survey URLs, groups, all message wording
js/content.js         Pelan vocabulary, the six lessons, practice generator (3 modes), word list
js/art.js             Ollie, tricks, animations, word pictures, logo (inline SVG)
js/logger.js          event queue, time-on-screen tracking → Google Sheet
js/app.js             screens, assignment, lessons, choices, breaks, prompts, exit
apps-script/Code.gs   Google Sheets backend
LANGUAGE.md           the language, lesson plan, quiz items
CONDITIONS.md         what each version shows + every message (generated)
tests/                version checklist + CONDITIONS.md generator
CHANGES.md            what changed from v1
```
