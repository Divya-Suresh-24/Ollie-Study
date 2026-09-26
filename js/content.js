/* =========================================================================
   PELAN — the made-up "river language" taught by Ollie
   -------------------------------------------------------------------------
   6 nouns in two classes (ending in -a or -o) + 2 adjectives.
   Rule: the adjective comes AFTER the noun and COPIES its ending.
       mira vela = big fish      tavo velo = big stone
       suna tipa = small moon    bino tipo = small leaf
   Lesson 1 is fixed (identical order and options for every participant).
   Practice rounds are generated at random and every item is logged.
   ========================================================================= */
window.PELAN = (function () {
  const nouns = [
    { id: "mira", en: "fish",  e: "🐟", cls: "a" },
    { id: "pela", en: "river", e: "🌊", cls: "a" },
    { id: "suna", en: "moon",  e: "🌙", cls: "a" },
    { id: "tavo", en: "stone", e: "🪨", cls: "o" },
    { id: "kelo", en: "shell", e: "🐚", cls: "o" },
    { id: "bino", en: "leaf",  e: "🍃", cls: "o" }
  ];
  const adjs = [
    { stem: "vel", en: "big",   scale: 1.45 },
    { stem: "tip", en: "small", scale: 0.55 }
  ];
  const N = Object.fromEntries(nouns.map(n => [n.id, n]));
  const A = { big: adjs[0], small: adjs[1] };

  const adjForm = (adj, noun) => adj.stem + noun.cls;
  const wrongForm = (adj, noun) => adj.stem + (noun.cls === "a" ? "o" : "a");
  const phrase = (nid, a) => {
    const n = N[nid], adj = A[a];
    return { word: n.id + " " + adjForm(adj, n), en: adj.en + " " + n.en, pic: { e: n.e, s: adj.scale } };
  };
  const pic = (nid, a) => ({ e: N[nid].e, s: a ? A[a].scale : 1 });
  const opt = (key, label, p) => ({ key, label, pic: p });

  /* ------------------------------ LESSON 1 ------------------------------ */
  function lesson1() {
    const ph = phrase;
    return [
      { id: "L1-01", type: "intro", word: "mira", en: "fish",  pics: [pic("mira")] },
      { id: "L1-02", type: "intro", word: "pela", en: "river", pics: [pic("pela")] },
      { id: "L1-03", type: "intro", word: "tavo", en: "stone", pics: [pic("tavo")] },
      { id: "L1-04", type: "pick_pic", prompt: "Select “pela”",
        options: [opt("tavo", "", pic("tavo")), opt("pela", "", pic("pela")), opt("mira", "", pic("mira"))], answer: "pela" },
      { id: "L1-05", type: "pick_text", prompt: "What does this mean?", big: "tavo",
        options: ["fish", "stone", "river"], answer: "stone" },
      { id: "L1-06", type: "intro", word: "kelo", en: "shell", pics: [pic("kelo")] },
      { id: "L1-07", type: "intro", word: "suna", en: "moon",  pics: [pic("suna")] },
      { id: "L1-08", type: "intro", word: "bino", en: "leaf",  pics: [pic("bino")] },
      { id: "L1-09", type: "pick_pic", prompt: "Select “suna”",
        options: [opt("kelo", "", pic("kelo")), opt("bino", "", pic("bino")), opt("suna", "", pic("suna")), opt("mira", "", pic("mira"))], answer: "suna" },
      { id: "L1-10", type: "pick_text", prompt: "How do you say “shell” in Pelan?",
        options: ["bino", "kelo", "tavo", "suna"], answer: "kelo" },
      { id: "L1-11", type: "type", prompt: "Type the Pelan word for “fish”", pics: [pic("mira")], answer: "mira" },
      { id: "L1-12", type: "match", prompt: "Tap the matching pairs",
        pairs: [["mira", "fish"], ["pela", "river"], ["tavo", "stone"], ["kelo", "shell"], ["suna", "moon"], ["bino", "leaf"]],
        rightOrder: ["stone", "moon", "fish", "leaf", "river", "shell"] },
      { id: "L1-13", type: "intro", kicker: "New word", word: "vela · velo", en: "big",
        pics: [pic("mira", "big"), pic("tavo", "big")], captions: ["mira vela", "tavo velo"] },
      { id: "L1-14", type: "intro", kicker: "New word", word: "tipa · tipo", en: "small",
        pics: [pic("suna", "small"), pic("bino", "small")], captions: ["suna tipa", "bino tipo"] },
      { id: "L1-15", type: "rule", title: "The ending rule",
        lines: [
          "Every Pelan thing-word ends in <b>-a</b> or <b>-o</b>.",
          "A describing word comes <b>after</b> it and <b>copies its ending</b>."
        ],
        examples: [["mira", "mira vela", "big fish"], ["tavo", "tavo velo", "big stone"],
                   ["suna", "suna tipa", "small moon"], ["bino", "bino tipo", "small leaf"]] },
      { id: "L1-16", type: "pick_pic", prompt: "Select “mira tipa”",
        options: [opt("mira vela", "", pic("mira", "big")), opt("tavo tipo", "", pic("tavo", "small")),
                  opt("mira tipa", "", pic("mira", "small")), opt("tavo velo", "", pic("tavo", "big"))], answer: "mira tipa" },
      { id: "L1-17", type: "build", en: "big stone", bank: ["velo", "mira", "tavo", "vela"], answer: "tavo velo" },
      { id: "L1-18", type: "judge", phrase: "kelo vela", en: "big shell", answer: false,
        explain: "“kelo” ends in -o, so it is “kelo velo”." },
      { id: "L1-19", type: "pick_text", prompt: "What does this mean?", big: "suna vela",
        options: ["small moon", "big moon", "big river"], answer: "big moon" },
      { id: "L1-20", type: "build", en: "small leaf", bank: ["tipa", "bino", "kelo", "tipo"], answer: "bino tipo" },
      { id: "L1-21", type: "judge", phrase: "pela tipa", en: "small river", answer: true,
        explain: "“pela” ends in -a, so “tipa” is right." },
      { id: "L1-22", type: "type", prompt: "Type “big fish” in Pelan", pics: [pic("mira", "big")], answer: "mira vela" },
      { id: "L1-23", type: "build", en: "small shell", bank: ["kelo", "tipa", "tipo", "pela", "velo"], answer: "kelo tipo" }
    ];
  }

  /* ----------------------------- PRACTICE ------------------------------- */
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const pick = arr => arr[rnd(arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const others = (n, k) => shuffle(nouns.filter(x => x.id !== n.id)).slice(0, k);
  const randAdj = () => pick(["big", "small"]);
  const flip = a => (a === "big" ? "small" : "big");

  function practice(mode, len) {
    const items = [];
    let lastNoun = null;
    const nextNoun = () => { let n; do { n = pick(nouns); } while (n === lastNoun); lastNoun = n; return n; };

    for (let i = 0; i < len; i++) {
      const n = nextNoun();
      const id = `${mode}-${i + 1}`;
      if (mode === "review") {
        const kind = ["pick_pic", "pick_text_meaning", "pick_text_word"][i % 3];
        if (kind === "pick_pic") {
          const opts = shuffle([n, ...others(n, 3)]).map(x => opt(x.id, "", pic(x.id)));
          items.push({ id, type: "pick_pic", prompt: `Select “${n.id}”`, options: opts, answer: n.id });
        } else if (kind === "pick_text_meaning") {
          items.push({ id, type: "pick_text", prompt: "What does this mean?", big: n.id,
            options: shuffle([n, ...others(n, 2)]).map(x => x.en), answer: n.en });
        } else {
          items.push({ id, type: "pick_text", prompt: `How do you say “${n.en}” in Pelan?`,
            options: shuffle([n, ...others(n, 3)]).map(x => x.id), answer: n.id });
        }
      } else if (mode === "challenge") {
        const a = randAdj(), ph = phrase(n.id, a), adj = A[a];
        const kind = ["build", "judge", "pick_phrase", "type_phrase"][i % 4];
        if (kind === "build") {
          const d = others(n, 1)[0];
          items.push({ id, type: "build", en: ph.en, answer: ph.word,
            bank: shuffle([n.id, adjForm(adj, n), wrongForm(adj, n), d.id]) });
        } else if (kind === "judge") {
          const ok = rnd(2) === 0;
          const shown = ok ? ph.word : n.id + " " + wrongForm(adj, n);
          items.push({ id, type: "judge", phrase: shown, en: ph.en, answer: ok,
            explain: `“${n.id}” ends in -${n.cls}, so it is “${ph.word}”.` });
        } else if (kind === "pick_phrase") {
          const d = others(n, 1)[0];
          items.push({ id, type: "pick_text", prompt: "What does this mean?", big: ph.word, answer: ph.en,
            options: shuffle([ph.en, phrase(n.id, flip(a)).en, phrase(d.id, a).en]) });
        } else {
          items.push({ id, type: "type", prompt: `Type “${ph.en}” in Pelan`, pics: [ph.pic], answer: ph.word });
        }
      } else { // watch (passive)
        const a = i % 3 === 0 ? null : randAdj();
        const w = a ? phrase(n.id, a) : { word: n.id, en: n.en, pic: pic(n.id) };
        items.push({ id, type: "watch", word: w.word, en: w.en, pics: [w.pic],
          note: a ? `“${n.id}” ends in -${n.cls}, so “${adjForm(A[a], n)}”.` : "" });
      }
    }
    return items;
  }

  return { name: "Pelan", nouns, adjs, lesson1, practice, phrase, pic };
})();
