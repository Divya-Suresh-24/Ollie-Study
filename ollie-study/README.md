# Ollie: language-learning study app

A Duolingo-style web app in which Ollie the otter teaches a made-up language (**Pelan**). It is built for the cute engagement pressure experiment. Each participant is randomly assigned to one of five exit-prompt conditions. Everyone gets the same onboarding, app tour and Lesson 1. After that, participants can keep practising or quit. Each quit attempt shows the screen for their assigned group, and every choice is logged to a Google Sheet.

It is plain HTML, CSS and JavaScript with no build step, so it runs directly on **GitHub Pages**.

| Group | Condition | Exit prompt |
|---|---|---|
| 1 | `mascot_guilt` | Crying Ollie in the river: "Ollie will get washed away in the river! Save me!" |
| 2 | `mascot_loss` | Worried Ollie holding a gem: "Oh no! If you quit now, you'll lose your N gems!" |
| 3 | `text_guilt` | Text only: "We will be sad if you leave. Please don't go!" |
| 4 | `text_loss` | Text only: "If you quit now, you'll lose your N gems!" |
| 5 | `control` | Text only: "Do you want to quit?" |

The buttons are the same in every group ("Keep Going" / "Yes, Quit"), so only the character and the wording differ. All of the wording lives in `js/config.js`.

---

## Participant journey

1. **Consent**: placeholder text; replace it in `config.js`.
2. **Welcome**: "Hi, I'm Ollie!" and the participant's name. The participant ID is read from the link (`?pid=P001`, also `PROLIFIC_PID`). If the link has no ID, an ID box appears.
3. **Random assignment** happens when they press **Start**. The Google Sheet backend uses permuted blocks of 5, so the groups stay balanced. A returning participant ID keeps its group, and a page refresh never re-randomizes.
4. **Onboarding**: three Ollie screens explaining lessons, gems, XP and streaks.
5. **App tour**: seven spotlight steps covering the path, gems, XP, streak, Practice, the Quit button and Lesson 1.
6. **Lesson 1** (fixed and identical for everyone): 23 steps, 6 nouns, 2 adjectives and one agreement rule. Wrong answers come back once at the end, and each correct answer earns XP and gems.
7. **Continued use**: Practice unlocks. Participants choose **Quick review** (easy), **Challenge** (harder) or **Watch Ollie** (passive), and every mode gives the same reward. The session ends on its own after `maxPracticeRounds`.
8. **The intervention**: any quit attempt (✕ during a round, **Quit** on the home screen, or **I'm done for now** after a round) shows the prompt for the participant's group.
9. **Yes, Quit** ends the session and sends them to your survey URL. Your survey should then lead into the retention quiz, in that order.

---

## Setup (about 15 minutes)

### 1. Google Sheet backend
1. Create an empty Google Sheet (use your university Google account if you can).
2. Open **Extensions → Apps Script**, delete the sample code, and paste in all of `apps-script/Code.gs`. Save.
3. Choose the `setup` function in the toolbar and click **Run**. Approve the permissions (on "unsafe app", go to **Advanced → Go to project**). This creates the `participants`, `events` and `sessions` tabs.
4. Go to **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**.
5. Copy the web app URL (it ends in `/exec`) into `appsScriptUrl` in `js/config.js`.

> If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**. That keeps the same URL.

### 2. Put it on GitHub Pages
**Without the command line:**
1. On github.com, click **New repository** and name it, e.g. `ollie-study`. It can be public or private; Pages works for public repos on free accounts.
2. Click **Add file → Upload files**, drag in **the contents** of this folder (`index.html`, `css/`, `js/`, `apps-script/`, `README.md`, `LANGUAGE.md`, `.nojekyll`), then **Commit**.
3. Go to **Settings → Pages**, set **Source: Deploy from a branch** with **Branch: `main`** and folder **`/ (root)`**, then **Save**.
4. About a minute later the site is live at `https://<your-username>.github.io/ollie-study/`.

**With git:**
```bash
cd ollie-study
git init && git add . && git commit -m "Ollie study app"
git branch -M main
git remote add origin https://github.com/<your-username>/ollie-study.git
git push -u origin main
```
Then enable Pages as in step 3.

### 3. Survey and quiz
Set `surveyUrl` in `config.js` to your survey (Qualtrics, Google Forms, etc.). The placeholders `{pid}`, `{sid}`, `{group}` and `{condition}` are filled in so you can join the datasets, for example:
```
https://iastate.qualtrics.com/jfe/form/SV_xxxx?pid={pid}&sid={sid}&group={group}
```
In Qualtrics, capture these as **Embedded Data** fields at the top of the Survey Flow. Put the Likert block first and the retention quiz after it. `LANGUAGE.md` has suggested quiz items.

### 4. Participant links
```
https://<your-username>.github.io/ollie-study/?pid=P001
```
For Prolific, use `?PROLIFIC_PID={{%PROLIFIC_PID%}}`.

---

## Testing

Add `debug=1` to the link to show a small debug bar with the group, a **prompt** button, a **csv** button (downloads that browser's log) and **reset**.

```
…/ollie-study/?debug=1&group=1&pid=test1     force group 1
…/ollie-study/?debug=1&group=4&reset=1        start over in group 4
```

Forced debug sessions are logged with `assign_mode = debug` and do not use up randomization blocks. Filter them out before analysis.

### Before launch
- [ ] `allowDebug: false`
- [ ] IRB-approved consent text in `consentHtml`
- [ ] `appsScriptUrl` and `surveyUrl` set
- [ ] Delete pilot rows from the Sheet and run `resetBlocks` in Apps Script
- [ ] Decide on `logName` (off by default, so names are shown on screen but not stored)
- [ ] Debrief text that explains the exit prompts (the gems had no real value)

---

## Data

### `sessions` tab: one row per participant (analysis-ready)
| Column | Meaning |
|---|---|
| `group`, `condition` | IV (1–5) |
| `assign_mode` | `server`, `server_existing_pid`, `local_fallback` (backend unreachable; random in the browser), `debug` |
| `lesson1_completed`, `lesson1_accuracy`, `lesson1_seconds` | baseline performance |
| `prompts_shown`, `prompt_continues`, `final_choice` | behavioural response to the prompt |
| `practice_rounds_completed`, `practice_modes` | **continued system use** (secondary DV); modes in order, e.g. `review>review>watch` |
| `seconds_after_first_prompt` | time spent after the first exposure to the prompt |
| `end_reason` | `quit` or `max_rounds` (hit the ceiling) |
| `hidden_seconds` | time the tab was in the background |

### `events` tab: one row per action (`data` holds JSON)
| Event | Key fields in `data` |
|---|---|
| `session_start` | group, condition, assign_mode |
| `onboarding_step`, `tour_step` | step, dwell_ms |
| `item_answer` | round, item, type, answer, correct, **latency_ms**, retry, mistakes (match) |
| `feedback_continue` | **dwell_ms** on the correct/incorrect feedback (feedback processing) |
| `item_view` | dwell_ms on intro, rule and watch cards |
| `practice_mode_chosen` | mode, position, decide_ms (easy vs hard vs passive choice) |
| `round_start`, `round_complete`, `round_abandoned` | round, mode, correct, seconds |
| `prompt_shown` | context (`mid_round`, `home`, `round_complete`, `practice_picker`), gems, n |
| `prompt_choice` | **choice** (`continue`/`quit`), rt_ms |
| `tab_hidden`, `tab_visible` | hidden_ms |
| `session_end`, `survey_redirect` | reason |

The per-item latencies, feedback dwell times and practice-mode choices give behavioural indicators for engagement-oriented appropriation and attentional engagement. You can use them alongside the survey scales.

---

## Files
```
index.html            page shell
css/styles.css        all styling
js/config.js          ← settings, backend URL, survey URL, condition wording
js/content.js         Pelan vocabulary, Lesson 1, practice generators
js/ollie-art.js       Ollie illustrations (inline SVG)
js/logger.js          event queue → Google Sheet
js/app.js             screens, assignment, tour, lesson engine, exit prompts
apps-script/Code.gs   Google Sheets backend (do not upload secrets; it has none)
LANGUAGE.md           the made-up language + suggested quiz items
```
