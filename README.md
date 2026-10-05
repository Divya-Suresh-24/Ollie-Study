# Pelan: language-learning study app (v2)

A web app that teaches a made-up language (**Pelan**) for the study *Cute Engagement Pressures in a Language-Learning Application*. Each participant is randomly assigned to one of five versions. Every action is logged to a Google Sheet, and the Qualtrics survey and quiz run inside the app at the end.

It is plain HTML, CSS and JavaScript with no build step, so it runs on **GitHub Pages**. See `CHANGES.md` for what changed from v1 and `LANGUAGE.md` for the lessons and quiz items.

| Group | Key | Ollie | Streak, progress bar, shells | Messages |
|---|---|---|---|---|
| 1 | `v1_plain` | no | no (lesson count only) | plain ("Next lesson available.") |
| 2 | `v2_neutral` | no | yes | neutral |
| 3 | `v3_ollie_neutral` | yes | yes | neutral, from Ollie |
| 4 | `v4_pressure` | no | yes | guilt and loss ("You'll lose your 🔥 3 streak!") |
| 5 | `v5_ollie_pressure` | yes | yes | guilt and loss, from Ollie ("Ollie will be so sad…") |

Lessons, help, pictures and exercise instructions are identical in all five. The quit-prompt buttons ("Keep going" / "Finish session") are the same everywhere. All wording is in `js/config.js`.

## Participant journey
1. **Eligibility** (3 questions). Ineligible students see the alternative-assignment message.
2. **Consent** (replace the placeholder in `config.js`).
3. **Nickname + study code.** The nickname is only used on screen and is never sent anywhere. The study code links the app data to Qualtrics.
4. **Random assignment** (permuted blocks of 5 on the server).
5. **Onboarding** (3 cards) and a 4-step tour of the lesson map.
6. **Lessons 1–6**, each unlocking the next. After each lesson: next lesson, flashcard practice, a break (Ollie trick or neutral animation), or finish.
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
1. Put the blocks in this order: survey → retention quiz → background questions.
2. At the top of **Survey Flow**, add **Embedded Data** fields `code`, `sid`, `group`, `condition`.
3. Set `surveyUrl` in `config.js`, for example
   `https://iastate.qualtrics.com/jfe/form/SV_xxxx?code={code}&sid={sid}&group={group}&condition={condition}`
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
Add `?debug=1` to the link. A small **G# ⚙** button appears at the bottom right with: skip lesson, +50 shells, show prompt, download this browser's log as CSV, reset.

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
| `practice_rounds`, `practice_cards`, `breaks_taken`, `break_seconds` | optional activity (continued use) |
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
| `flash_flip`, `flash_rate` | word, front_ms, knew, back_ms |
| `break_start`, `break_end` | item, watch_ms, how |
| `unlock` | item, shells_total |
| `prompt_shown`, `prompt_choice` | context, msg, title, body, choice, rt_ms |
| `round_start`, `round_complete`, `round_abandoned` | lesson or practice details |
| `tab_hidden`, `tab_visible`, `session_end`, `survey_opened`, `survey_done` | |

Long studies: when the events tab reaches 300,000 rows, new events go to a new spreadsheet `pelan-events-part-2` (and so on) in the same Google Drive.

## Files
```
index.html            page shell
css/styles.css        all styling
js/config.js          ← settings, backend and survey URLs, groups, all message wording
js/content.js         Pelan vocabulary, the six lessons, flashcard pool, word list
js/art.js             Ollie, tricks, animations, word pictures, logo (inline SVG)
js/logger.js          event queue, time-on-screen tracking → Google Sheet
js/app.js             screens, assignment, lessons, choices, breaks, prompts, exit
apps-script/Code.gs   Google Sheets backend
LANGUAGE.md           the language, lesson plan, quiz items
CHANGES.md            what changed from v1
```
