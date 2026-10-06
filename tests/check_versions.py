"""
Version checklist: runs every version of the app in a headless browser and
checks that each one shows exactly what its condition specifies.

  pip install playwright && playwright install chromium
  cd ollie-study && python3 -m http.server 8765 &
  python3 tests/check_versions.py            # all five versions
  python3 tests/check_versions.py 3 5        # only some

Prints PASS/FAIL per check and saves screenshots to tests/shots/.
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:8765/index.html")
SHOTS = os.path.join(os.path.dirname(__file__), "shots"); os.makedirs(SHOTS, exist_ok=True)
SPEC = {  # what each version must show
    1: dict(mascot=False, gamified=False, framing="plain"),
    2: dict(mascot=False, gamified=True,  framing="neutral"),
    3: dict(mascot=True,  gamified=True,  framing="neutral"),
    4: dict(mascot=False, gamified=True,  framing="pressure"),
    5: dict(mascot=True,  gamified=True,  framing="pressure"),
}

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
    elif t == "type": await pg.type("#typed", it["answer"] if not wrong else "zzz", delay=10)
    elif t == "build":
        for w in it["answer"].split(" "): await pg.click(f'#bank .chip:not(.placeholder):text-is("{w}")')
    elif t == "match":
        for l, r in it["pairs"]:
            await pg.click(f'.chip[data-side=L][data-w="{l}"]'); await pg.click(f'.chip[data-side=R][data-w="{r}"]'); await pg.wait_for_timeout(40)
        await pg.wait_for_timeout(650); await pg.click("#cont"); return t
    await pg.click("#check"); await pg.wait_for_timeout(80)
    return t

async def run(g):
    sp, res = SPEC[g], []
    def check(name, ok, detail=""): res.append((name, bool(ok), detail))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 420, "height": 860})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(f"{BASE}?debug=1&group={g}&reset=1"); await pg.wait_for_timeout(300)
        cfg = await pg.evaluate("window.STUDY_CONFIG")
        M = cfg["messages"][sp["framing"]]
        texts = lambda ctx: [m.get("text") or m.get("title") for m in (M.get(ctx) or [])]
        for q in ["age18", "enrolled"]: await pg.check(f"input[name={q}][value=yes]", force=True)
        await pg.check("input[name=repeat][value=no]", force=True)
        await pg.click("#go"); await pg.click("#agree"); await pg.fill("#nick", "Tester"); await pg.click("#start"); await pg.wait_for_timeout(200)
        st = await pg.evaluate("window.__pelan.state()")
        check("assigned to the right condition", st["condition"] == cfg["groups"][str(g)]["key"], st["condition"])
        check("Ollie on onboarding" if sp["mascot"] else "no Ollie on onboarding", bool(await pg.query_selector(".ollie")) == sp["mascot"])
        for _ in range(3): await pg.click("#next")
        await pg.wait_for_timeout(350)
        for _ in range(4): await pg.click("#tour-next")
        check("streak + shells shown" if sp["gamified"] else "only a lesson count shown",
              bool(await pg.query_selector("#stat-shells")) == sp["gamified"] and bool(await pg.query_selector("#stat-lessons")) != sp["gamified"])
        check("4 coming-soon lessons on the map", len(await pg.query_selector_all(".node.soon")) == 4)
        await pg.screenshot(path=f"{SHOTS}/v{g}_home.png", full_page=True)

        # Lesson 1: first graded answer wrong → feedback buddy
        await pg.click("#node-1"); await pg.click("#go")
        nudge_seen, wrong_done = None, False
        while not await pg.query_selector(".celebrate"):
            it = await item(pg)
            graded = it["type"] not in ("intro", "rule")
            t = await answer(pg, wrong=graded and not wrong_done)
            if graded and not wrong_done and t != "match":
                wrong_done = True
                fb = await pg.query_selector(".fb-ollie")
                tears = await pg.query_selector(".fb-ollie .o-tears")
                want = "sad Ollie" if g == 5 else "encouraging Ollie" if g == 3 else "no Ollie"
                ok = (bool(fb) == sp["mascot"]) and (bool(tears) == (g == 5))
                check(f"wrong answer shows {want}", ok)
                await pg.screenshot(path=f"{SHOTS}/v{g}_wrong.png")
            if nudge_seen is None:
                pop = await pg.query_selector(".ollie-pop, .toast")
                if pop:
                    nudge_seen = (await pop.inner_text()).strip()
                    if sp["mascot"]: await pg.screenshot(path=f"{SHOTS}/v{g}_nudge.png")
            if t not in ("intro", "rule", "match", "explain"): await pg.click("#cont")
            await pg.wait_for_timeout(120)
            if nudge_seen is None:
                await pg.wait_for_timeout(700)
                pop = await pg.query_selector(".ollie-pop, .toast")
                if pop: nudge_seen = (await pop.inner_text()).strip()
        evs = await pg.evaluate("JSON.parse(localStorage.getItem('pelan_events_'+window.__pelan.state().sid))")
        nudges = [json.loads(e["data"]) for e in evs if e["event"] == "nudge_shown"]
        check("mid-lesson nudge uses this version's wording", nudges and nudges[0]["text"] in texts("nudge"), nudges[0]["text"] if nudges else "none")
        check("nudge delivered by Ollie" if sp["mascot"] else "nudge delivered as text", any(e["event"] == "nudge_shown" for e in evs) and
              ((await pg.evaluate("window.__pelan.state().pops")) > 0) == sp["mascot"])
        gift = await pg.query_selector(".gift-line")
        check("shell gift on lesson complete" if sp["gamified"] else "no shell gift", bool(gift) == sp["gamified"],
              (await gift.inner_text()) if gift else "")
        await pg.screenshot(path=f"{SHOTS}/v{g}_complete.png")
        await pg.click("#cont")

        # Choice point
        rem = [json.loads(e["data"]) for e in await pg.evaluate("JSON.parse(localStorage.getItem('pelan_events_'+window.__pelan.state().sid))") if e["event"] == "reminder_shown"]
        allowed = [re.sub(r"\{\w+\}", "", t) for t in texts("between")]
        check("between-lesson reminder uses this version's wording", rem and any(all(part in rem[-1]["text"] for part in a.split("  ") if part) for a in allowed), rem[-1]["text"] if rem else "")
        check("session goal shown" if sp["gamified"] else "no session goal", bool(await pg.query_selector(".goal")) == sp["gamified"])
        check("3 practice modes offered", len(await pg.query_selector_all(".mode")) == 3)
        await pg.screenshot(path=f"{SHOTS}/v{g}_choice.png", full_page=True)

        # Passive practice round
        await pg.click('.mode[data-mode="passive"]'); await pg.wait_for_timeout(200)
        check("passive mode hosted by Ollie" if sp["mascot"] else "passive mode without Ollie", bool(await pg.query_selector(".explain-host")) == sp["mascot"])
        await pg.screenshot(path=f"{SHOTS}/v{g}_passive.png")
        while not await pg.query_selector(".celebrate, h1"):
            await answer(pg); await pg.wait_for_timeout(60)
        await pg.click("#cont")
        check("goal marked met after one round" if sp["gamified"] else "still no goal", bool(await pg.query_selector(".goal.met")) == sp["gamified"])

        # Lesson 2 for the 5-in-a-row pop
        await pg.click('[data-c="next"]'); await pg.click("#go")
        combo = None
        while not await pg.query_selector(".celebrate"):
            t = await answer(pg)
            if combo is None:
                el = await pg.query_selector(".ollie-pop, .toast.combo")
                if el:
                    combo = el
                    await pg.screenshot(path=f"{SHOTS}/v{g}_combo.png")
                    check("5-in-a-row: Ollie pops up" if sp["mascot"] else "5-in-a-row: text toast",
                          ("ollie-pop" in (await el.get_attribute("class"))) == sp["mascot"])
            if t not in ("intro", "rule", "match", "explain"): await pg.click("#cont")
        if combo is None: check("5-in-a-row pop appeared", False)
        await pg.click("#cont")

        # Quit prompt
        await pg.click("#btn-quit"); await pg.wait_for_timeout(300)
        title = await pg.inner_text("#p-title")
        quit_titles = [m["title"] for m in M["quit"]] + ([M["quitEarly"]["title"]] if "quitEarly" in M else [])
        check("quit prompt uses this version's wording", title in quit_titles, title)
        has_ollie = bool(await pg.query_selector(".prompt-card .ollie, .prompt-card .anim-svg"))
        check("quit prompt shows Ollie" if sp["mascot"] else "quit prompt has no Ollie", has_ollie == sp["mascot"])
        if g == 5: check("Ollie looks sad/worried on the quit prompt", bool(await pg.query_selector(".prompt-card .o-tears, .prompt-card .a-drift, .prompt-card path[fill='#7FD0EE']")))
        await pg.screenshot(path=f"{SHOTS}/v{g}_quit.png")
        await pg.click("#leave"); await pg.wait_for_timeout(400)
        src = await pg.get_attribute("#sv", "src")
        code = (await pg.evaluate("window.__pelan.state()"))["code"]
        check("survey embedded with study code + group", src and f"code={code}" in src and f"group={g}" in src)
        check("no JavaScript errors", not errs, "; ".join(errs)[:120])
        await b.close()
    return res

async def time_check(g):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 420, "height": 860})
        await pg.goto(f"{BASE}?debug=1&group={g}&reset=1&mins=0.15"); await pg.wait_for_timeout(300)
        for q in ["age18", "enrolled"]: await pg.check(f"input[name={q}][value=yes]", force=True)
        await pg.check("input[name=repeat][value=no]", force=True)
        await pg.click("#go"); await pg.click("#agree"); await pg.fill("#nick", "T"); await pg.click("#start"); await pg.wait_for_timeout(200)
        for _ in range(3): await pg.click("#next")
        await pg.wait_for_timeout(350)
        for _ in range(4): await pg.click("#tour-next")
        await pg.click("#node-1"); await pg.click("#go")
        await pg.wait_for_timeout(10500)
        h = await pg.inner_text("h1"); await pg.screenshot(path=f"{SHOTS}/v{g}_timeup.png")
        ev = await pg.evaluate("JSON.parse(localStorage.getItem('pelan_events_'+window.__pelan.state().sid)).map(e=>e.event)")
        await b.close()
        return [("time warning then time-up screen", "time_warning" in ev and "time_up" in ev, h)]

async def main():
    groups = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5]
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
