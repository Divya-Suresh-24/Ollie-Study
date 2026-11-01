"""
Version checklist: plays through every version of the app in a headless
browser and checks that each one shows exactly what its condition specifies
(2 character × 2 framing).

  pip install playwright && playwright install chromium
  cd ollie-study && python3 -m http.server 8765 &
  python3 tests/check_versions.py            # all four versions
  python3 tests/check_versions.py 2 4        # only some

Prints PASS/FAIL per check and saves screenshots to tests/shots/.
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:8765/index.html")
SHOTS = os.path.join(os.path.dirname(__file__), "shots"); os.makedirs(SHOTS, exist_ok=True)
SPEC = {
    1: dict(mascot=False, framing="neutral"),
    2: dict(mascot=True,  framing="neutral"),
    3: dict(mascot=False, framing="guilt"),
    4: dict(mascot=True,  framing="guilt"),
}
SPEAK_TEXT = {"{I}": "We", "{i}": "we", "{me}": "us", "{my}": "our", "{I'm}": "We're", "{i'm}": "we're", "{I'll}": "We'll", "{i'll}": "we'll", "{i'd}": "we'd"}
SPEAK_OLLIE = {"{I}": "I", "{i}": "I", "{me}": "me", "{my}": "my", "{I'm}": "I'm", "{i'm}": "I'm", "{I'll}": "I'll", "{i'll}": "I'll", "{i'd}": "I'd"}

def pattern(template, mascot):
    """Regex that matches a config line once placeholders are filled."""
    sp = SPEAK_OLLIE if mascot else SPEAK_TEXT
    out, i = "", 0
    for m in re.finditer(r"\{[A-Za-z']+\}", template):
        out += re.escape(template[i:m.start()])
        out += re.escape(sp[m.group()]) if m.group() in sp else r".+?"
        i = m.end()
    return "^" + out + re.escape(template[i:]) + "$"

def matches(text, lines, mascot, field="text"):
    return any(re.match(pattern(l.get(field) or "", mascot), text or "") for l in lines if l.get(field))

async def events(pg):
    return await pg.evaluate("JSON.parse(localStorage.getItem('pelan_events_'+window.__pelan.state().sid))")

async def item(pg):
    return await pg.evaluate("(()=>{const R=window.__pelan.round();return R&&R.queue[R.pos]})()")

async def answer(pg, wrong=False):
    it = await item(pg); t = it["type"]
    if await pg.query_selector("#coach-ok"): await pg.click("#coach-ok")
    if t in ("intro", "rule"): await pg.click("#cont"); return t
    if t == "explain": await pg.click("#nextcard"); return t
    if t == "pick_pic":
        k = it["answer"] if not wrong else [o["key"] for o in it["options"] if o["key"] != it["answer"]][0]
        await pg.click(f'.tile[data-k="{k}"]')
    elif t == "pick_text":
        k = it["answer"] if not wrong else [o for o in it["options"] if o != it["answer"]][0]
        await pg.click(f'.opt[data-k="{k}"]')
    elif t == "judge":
        a = "yes" if it["answer"] else "no"
        if wrong: a = "no" if a == "yes" else "yes"
        await pg.click(f'.opt[data-k="{a}"]')
    elif t == "type": await pg.type("#typed", it["answer"] if not wrong else "zzz", delay=5)
    elif t == "build":
        for w in it["answer"].split(" "): await pg.click(f'#bank .chip:not(.placeholder):text-is("{w}")')
    elif t == "match":
        if wrong:  # one mix-up first, then the right pairs
            l0, r1 = it["pairs"][0][0], it["pairs"][1][1]
            await pg.click(f'.chip[data-side=L][data-w="{l0}"]'); await pg.click(f'.chip[data-side=R][data-w="{r1}"]'); await pg.wait_for_timeout(500)
        for l, r in it["pairs"]:
            await pg.click(f'.chip[data-side=L][data-w="{l}"]'); await pg.click(f'.chip[data-side=R][data-w="{r}"]'); await pg.wait_for_timeout(30)
        await pg.wait_for_timeout(650); await pg.click("#cont"); return t
    await pg.click("#check"); await pg.wait_for_timeout(60)
    return t

async def play_round(pg, wrong_first=False, on_graded=None, match_slip=False):
    """Answer until the completion card. Returns nothing."""
    wrong_done = not wrong_first
    while not await pg.query_selector(".complete-card"):
        it = await item(pg)
        graded = it["type"] not in ("intro", "rule", "explain", "match")
        w = graded and not wrong_done
        if it["type"] == "match" and match_slip:
            await answer(pg, wrong=True); await pg.wait_for_timeout(50); continue
        t = await answer(pg, wrong=w)
        if graded:
            if on_graded: await on_graded(pg, w)
            wrong_done = True
            await pg.click("#cont")
        await pg.wait_for_timeout(50)

async def run(g):
    sp, res = SPEC[g], []
    def check(name, ok, detail=""): res.append((name, bool(ok), detail))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1366, "height": 860})
        await pg.route(re.compile(r"script\.google(usercontent)?\.com|fonts\.(googleapis|gstatic)\.com"), lambda r: r.abort())  # never write test rows to the study sheet
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(f"{BASE}?debug=1&group={g}&reset=1"); await pg.wait_for_timeout(300)
        cfg = await pg.evaluate("window.STUDY_CONFIG")
        M = cfg["messages"][sp["framing"]]
        for q in ["age18", "enrolled"]: await pg.check(f"input[name={q}][value=yes]", force=True)
        await pg.check("input[name=repeat][value=no]", force=True)
        await pg.click("#go"); await pg.click("#agree")
        await pg.check("input[name=in1][value='6']", force=True); await pg.check("input[name=in2][value='5']", force=True); await pg.click("#go")
        await pg.fill("#nick", "Tester"); await pg.click("#start"); await pg.wait_for_timeout(200)
        st = await pg.evaluate("window.__pelan.state()")
        check("interest questions (IN1-IN2) saved before the app", st["interest"] == {"in1": 6, "in2": 5}, str(st["interest"]))
        check("no streak-loss lines in the guilt messages", '"loss"' not in json.dumps(cfg["messages"]["guilt"]))
        check("assigned to the right condition", st["condition"] == cfg["groups"][str(g)]["key"], st["condition"])
        check("Ollie in onboarding" if sp["mascot"] else "no Ollie in onboarding", bool(await pg.query_selector(".ollie")) == sp["mascot"])
        for _ in range(3): await pg.click("#next")
        await pg.wait_for_timeout(350)
        for _ in range(4): await pg.click("#tour-next")
        check("streak, shells and lessons shown", bool(await pg.query_selector("#stat-streak")) and bool(await pg.query_selector("#stat-shells")))
        check("10 lessons + 2 coming soon on the map", len(await pg.query_selector_all(".node:not(.soon)")) == 10 and len(await pg.query_selector_all(".node.soon")) == 2)
        check("Ollie on home" if sp["mascot"] else "no Ollie on home", bool(await pg.query_selector(".companion .ollie")) == sp["mascot"])
        await pg.screenshot(path=f"{SHOTS}/v{g}_home.png")

        # Lesson 1: quick/full choice, wrong answer reaction, stage-0 nudge
        check("Finish timer card visible on home", bool(await pg.query_selector("#timer-card")))
        check("shell jar shows the next unlock and the streak bonus", bool(await pg.query_selector(".jar-card .jar-streak")))
        await pg.click("#node-1"); await pg.wait_for_timeout(200)
        check("first run: full lesson only (no quick option)", not await pg.query_selector('.len[data-len="quick"]') and bool(await pg.query_selector(".len-go")))
        await pg.click(".len-go"); await pg.wait_for_timeout(300)
        check("Help and Finish timer shown in a first-run lesson", bool(await pg.query_selector("#btn-help")) and bool(await pg.query_selector("#ls-timer")))
        seen = {}
        async def on_graded(pg, wrong):
            if wrong and "wrong" not in seen:
                seen["wrong"] = True
                side = await pg.query_selector("#side-ollie .ollie")
                tears = await pg.query_selector("#side-ollie .o-tears")
                cls = (await side.get_attribute("class")) if side else ""
                ok = (bool(side) == sp["mascot"]) and not tears and (not sp["mascot"] or "mood-encourage" in cls)
                check("wrong answer: encouraging Ollie, never sad" if sp["mascot"] else "wrong answer: no Ollie", ok, cls)
                await pg.screenshot(path=f"{SHOTS}/v{g}_wrong.png")
        await play_round(pg, wrong_first=True, on_graded=on_graded, match_slip=True)
        ev = await events(pg)
        ma = [json.loads(e["data"]) for e in ev if e["event"] == "item_answer" and json.loads(e["data"])["type"] == "match"]
        check("match with one mix-up still counts as correct", ma and ma[-1]["correct"] and ma[-1]["mistakes"] == 1)
        nud = [json.loads(e["data"]) for e in ev if e["event"] == "nudge_shown"]
        check("Lesson 1 nudge uses this version's wording, no guilt yet", nud and matches(nud[0]["text"], M["nudge"], sp["mascot"]) and not nud[0]["kind"], nud[0]["text"] if nud else "none")
        check("no left-corner pop-ups (messages stay in the side panel)", not await pg.query_selector(".ollie-pop"))
        gift = await pg.inner_text(".gift-line")
        want = {"neutral": "You earned a shell!", "guilt": ("I" if sp["mascot"] else "We") + " found this shell for you!"}[sp["framing"]]
        check(f"gift says “{want}”", gift.startswith(want), gift)
        await pg.screenshot(path=f"{SHOTS}/v{g}_complete.png")
        await pg.click("#cont"); await pg.wait_for_timeout(300)

        # Home after Lesson 1
        txt = await pg.inner_text(".companion-text")
        check("home reminder uses this version's wording", matches(txt, M["between"], sp["mascot"]), txt)
        check("session goal shown", bool(await pg.query_selector(".goal")))
        check("3 practice modes with the same credit", len(set([await c.inner_text() for c in await pg.query_selector_all(".mode .credit")])) == 1 and len(await pg.query_selector_all(".mode")) == 3)
        await pg.screenshot(path=f"{SHOTS}/v{g}_home_after.png")

        # Leave Lesson 2 early → prompt → home (session continues), streak resets
        await pg.click("#node-2"); await pg.click(".len-go"); await pg.wait_for_timeout(300)
        if await pg.query_selector("#coach-ok"): await pg.click("#coach-ok")
        await pg.click("#btn-x"); await pg.wait_for_timeout(300)
        title = await pg.inner_text("#p-title")
        check("leave prompt uses this version's wording", matches(title, M["leave"], sp["mascot"], "title"), title)
        if sp["framing"] == "guilt":
            pe = [json.loads(e["data"]) for e in await events(pg) if e["event"] == "prompt_shown"][-1]
            check("guilt grows: stage-1 line after one lesson", pe["stage"] >= 1, f"stage {pe['stage']}")
        if sp["mascot"]:
            sad = await pg.query_selector(".prompt-card .o-tears, .prompt-card .a-drift, .prompt-card .mood-worried")
            check("Ollie looks sad on the leave prompt" if sp["framing"] == "guilt" else "Ollie is not sad on the leave prompt", bool(sad) == (sp["framing"] == "guilt"))
        else:
            check("no Ollie on the leave prompt", not await pg.query_selector(".prompt-card .ollie"))
        await pg.screenshot(path=f"{SHOTS}/v{g}_leave.png")
        await pg.click("#leave"); await pg.wait_for_timeout(400)
        st = await pg.evaluate("window.__pelan.state()")
        check("leaving a lesson goes home, session continues", bool(await pg.query_selector(".home-grid")) and not st["ended"])
        check("leaving early resets the streak", st["streak"] == 0)
        back = await pg.inner_text(".companion-text")
        check("home line after leaving uses this version's wording", matches(back, M["back"], sp["mascot"]), back)
        if sp["mascot"]:
            check("Ollie sad on home after leaving" if sp["framing"] == "guilt" else "Ollie not sad after leaving", bool(await pg.query_selector(".companion .o-tears")) == (sp["framing"] == "guilt"))
        await pg.screenshot(path=f"{SHOTS}/v{g}_back.png")

        # Finish is locked before 20 minutes
        await pg.click("#btn-finish"); await pg.wait_for_timeout(200)
        st = await pg.evaluate("window.__pelan.state()")
        check("Finish locked before 20 min (no prompt, session continues)", not await pg.query_selector(".prompt-card") and not st["ended"] and st["lockedClicks"] == 1)

        # Coming back: relief / welcome
        await pg.click('.mode[data-mode="passive"]'); await pg.wait_for_timeout(600)
        ret = [json.loads(e["data"]) for e in await events(pg) if e["event"] == "return_shown"]
        check("coming back shows this version's return line", ret and matches(ret[-1]["text"], M["return"], sp["mascot"]), ret[-1]["text"] if ret else "none")
        check("passive mode hosted by Ollie" if sp["mascot"] else "passive mode without Ollie", (await pg.inner_text(".type-tag b")).startswith("Watch Ollie") == sp["mascot"])
        check("no Help in practice rounds", not await pg.query_selector("#btn-help"))
        shown = await pg.query_selector("#side-ollie .side-bubble.said") if sp["mascot"] else await pg.query_selector("#sp-msg:not([hidden])")
        check("return line shown in the right-hand panel" + (" by Ollie" if sp["mascot"] else ""), bool(shown))
        while not await pg.query_selector(".complete-card"):
            await answer(pg); await pg.wait_for_timeout(40)
        await pg.click("#cont"); await pg.wait_for_timeout(300)
        check("goal met after one practice round", bool(await pg.query_selector(".goal.met")))

        # Lesson 2 full, all correct → 5-in-a-row
        await pg.click("#node-2"); await pg.click(".len-go"); await pg.wait_for_timeout(300)
        combo = {}
        async def watch_combo(pg, wrong):
            if "x" in combo: return
            el = await pg.query_selector(".ollie-pop, .toast")
            ev = [e for e in await events(pg) if e["event"] == "combo_pop"]
            if ev:
                combo["x"] = True
                await pg.wait_for_timeout(250)
                el = await pg.query_selector("#side-ollie .side-bubble.said") if sp["mascot"] else await pg.query_selector("#sp-msg:not([hidden])")
                check("5 in a row: Ollie celebrates in the side panel" if sp["mascot"] else "5 in a row: message card in the side panel", bool(el))
                await pg.screenshot(path=f"{SHOTS}/v{g}_combo.png")
        await play_round(pg, on_graded=watch_combo)
        if "x" not in combo: check("5-in-a-row pop appeared", False)
        await pg.click("#cont"); await pg.wait_for_timeout(300)

        # Review Lesson 1: quick or full, same credit, no Help
        await pg.click("#node-1"); await pg.wait_for_timeout(200)
        credits = [await c.inner_text() for c in await pg.query_selector_all(".len .credit")]
        check("review offers quick or full with the same credit", len(credits) == 2 and credits[0] == credits[1])
        await pg.click('.len[data-len="quick"]'); await pg.wait_for_timeout(300)
        check("no Help in a review", not await pg.query_selector("#btn-help"))
        await play_round(pg)
        await pg.click("#cont"); await pg.wait_for_timeout(300)
        st = await pg.evaluate("window.__pelan.state()")
        check("streak of 3 turns on 2× shells (shown in the header)", st["streak"] >= 3 and "2×" in (await pg.inner_text("#stat-streak")), f"streak {st['streak']}")

        # 21 minutes, but 15 of them in another tab, and core lessons not done → still locked
        await pg.evaluate("(()=>{const S=window.__pelan.state(); S.clockStart -= 21*60000; S.hid.push([S.clockStart+60000, S.clockStart+16*60000]);})()")
        await pg.wait_for_timeout(1300)
        check("Finish stays locked: core lessons not done, hidden time doesn't count", "locked" in (await pg.get_attribute("#btn-finish", "class")) and not await pg.query_selector(".motive-card"))
        # Core lessons done, but visible time still under 20 minutes → locked
        await pg.evaluate("(()=>{const S=window.__pelan.state(); for(let n=1;n<=6;n++) S.lessons[n].done=true;})()")
        await pg.wait_for_timeout(1300)
        vm = await pg.evaluate("window.__pelan.visibleMin()")
        check("Finish stays locked under 20 visible minutes", "locked" in (await pg.get_attribute("#btn-finish", "class")) and not await pg.query_selector(".motive-card"), f"{vm:.1f} visible min")
        # Enough visible time → motive check appears; Finish unlocks only after both answers
        await pg.evaluate("(()=>{const S=window.__pelan.state(); S.hid = [];})()")
        await pg.wait_for_timeout(1500)
        check("motive check (SL1-SL2) appears when Finish is ready", bool(await pg.query_selector(".motive-card")))
        check("Finish still locked while the motive check is open", "locked" in (await pg.get_attribute("#btn-finish", "class")))
        check("motive check is identical in every version (no Ollie)", not await pg.query_selector(".motive-card .ollie"))
        await pg.screenshot(path=f"{SHOTS}/v{g}_motive.png")
        await pg.check(".motive-card input[name=sl1][value='5']", force=True)
        check("Continue disabled until both are answered", await pg.is_disabled("#m-go"))
        await pg.check(".motive-card input[name=sl2][value='2']", force=True)
        await pg.click("#m-go"); await pg.wait_for_timeout(300)
        check("Finish unlocks after the motive check", "locked" not in (await pg.get_attribute("#btn-finish", "class")))
        sm = await pg.evaluate("window.__pelan.summary()")
        check("summary has SL1/SL2, IN1/IN2 and core_done", sm["sl1_want"] == 5 and sm["sl2_should"] == 2 and sm["in1"] == 6 and sm["core_done"] == 1)
        # One practice round after unlock counts as continued use
        await pg.click('.mode[data-mode="easy"]'); await pg.wait_for_timeout(400)
        await play_round(pg)
        await pg.click("#cont"); await pg.wait_for_timeout(300)
        sm = await pg.evaluate("window.__pelan.summary()")
        check("rounds and answers after unlock are counted", sm["rounds_after_unlock"] == 1 and sm["answers_after_unlock"] >= 6, f"{sm['rounds_after_unlock']} rounds, {sm['answers_after_unlock']} answers")
        await pg.click("#btn-finish"); await pg.wait_for_timeout(300)
        ft = await pg.inner_text("#p-title")
        check("finish prompt uses this version's wording", matches(ft, M["finish"], sp["mascot"], "title"), ft)
        await pg.screenshot(path=f"{SHOTS}/v{g}_finish.png")
        await pg.click("#stay"); await pg.wait_for_timeout(300)
        stay = [json.loads(e["data"]) for e in await events(pg) if e["event"] == "stay_shown"]
        check("staying shows this version's thank-you line", stay and matches(stay[-1]["text"], M["stay"], sp["mascot"]), stay[-1]["text"] if stay else "none")
        await pg.click("#btn-finish"); await pg.wait_for_timeout(300); await pg.click("#leave"); await pg.wait_for_timeout(400)
        st = await pg.evaluate("window.__pelan.state()")
        sm = await pg.evaluate("window.__pelan.summary()")
        guilt_fin = sp["framing"] == "guilt"
        check("fast leave counted (and as guilt-framed in guilt versions)", sm["prompt_leaves_fast"] >= 1 and (sm["guilt_prompt_leaves_fast"] >= 1) == guilt_fin, f"{sm['prompt_leaves_fast']} fast, {sm['guilt_prompt_leaves_fast']} guilt")
        src = await pg.get_attribute("#sv", "src")
        check("Finish ends the session and embeds the survey with code + group", st["ended"] and src and f"code={st['code']}" in src and f"group={g}" in src)
        check("no JavaScript errors", not errs, "; ".join(errs)[:160])
        await b.close()
    return res

async def time_check(g):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1366, "height": 860})
        await pg.route(re.compile(r"script\.google(usercontent)?\.com|fonts\.(googleapis|gstatic)\.com"), lambda r: r.abort())  # never write test rows to the study sheet
        await pg.goto(f"{BASE}?debug=1&group={g}&reset=1&mins=0.3"); await pg.wait_for_timeout(300)
        for q in ["age18", "enrolled"]: await pg.check(f"input[name={q}][value=yes]", force=True)
        await pg.check("input[name=repeat][value=no]", force=True)
        await pg.click("#go"); await pg.click("#agree")
        await pg.check("input[name=in1][value='6']", force=True); await pg.check("input[name=in2][value='5']", force=True); await pg.click("#go")
        await pg.fill("#nick", "T"); await pg.click("#start"); await pg.wait_for_timeout(200)
        for _ in range(3): await pg.click("#next")
        await pg.wait_for_timeout(350)
        for _ in range(4): await pg.click("#tour-next")
        await pg.click("#node-1"); await pg.click(".len-go")
        await pg.wait_for_timeout(20000)
        h = await pg.inner_text("h1"); await pg.screenshot(path=f"{SHOTS}/v{g}_timeup.png")
        ev = [e["event"] for e in await events(pg)]
        await b.close()
        return [("without the core lessons: no unlock, 2-minute warning, then time-up screen", all(x in ev for x in ("time_warning", "time_up")) and "finish_unlocked" not in ev, h)]

async def main():
    groups = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4]
    fails = 0
    for g in groups:
        res = await run(g) + await time_check(g)
        print(f"\nVersion {g} ({SPEC[g]})")
        for name, ok, d in res:
            fails += not ok
            print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  [{d}]" if d and not ok else (f"  → {d}" if d else "")))
    print(f"\n{'ALL CHECKS PASSED' if not fails else f'{fails} CHECK(S) FAILED'}")
    sys.exit(1 if fails else 0)

asyncio.run(main())
