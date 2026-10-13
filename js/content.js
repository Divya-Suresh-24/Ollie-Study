/* =========================================================================
   PELAN — the made-up "river language"
   10 nouns in two classes (-a / -o), 4 adjectives (big, small, red, blue).
   Rule: the adjective comes AFTER the noun and COPIES its ending.
   All ten lessons are fixed: same items, same order, same options for
   everyone. Novel phrases are held back from every lesson and from
   practice so the retention quiz can test rule learning (see LANGUAGE.md).
   ========================================================================= */
window.PELAN = (function () {
  const nouns = [
    { id: "mira", en: "fish",  cls: "a" },
    { id: "pela", en: "river", cls: "a" },
    { id: "suna", en: "moon",  cls: "a" },
    { id: "tavo", en: "stone", cls: "o" },
    { id: "kelo", en: "shell", cls: "o" },
    { id: "bino", en: "leaf",  cls: "o" },
    // sky words (Lessons 7–10)
    { id: "sola", en: "sun",   cls: "a", sky: true },
    { id: "vira", en: "bird",  cls: "a", sky: true },
    { id: "nubo", en: "cloud", cls: "o", sky: true },
    { id: "lido", en: "boat",  cls: "o", sky: true }
  ];
  const adjs = {
    big:   { stem: "vel", en: "big",   kind: "size" },
    small: { stem: "tip", en: "small", kind: "size" },
    red:   { stem: "rus", en: "red",   kind: "color" },
    blue:  { stem: "nil", en: "blue",  kind: "color" }
  };
  const N = Object.fromEntries(nouns.map(n => [n.id, n]));

  // picture descriptor: noun + optional size/color
  const W = (n, a) => ({ n, size: a === "big" || a === "small" ? a : null, color: a === "red" || a === "blue" ? a : null });
  const say = (n, a) => (a ? n + " " + adjs[a].stem + N[n].cls : n);
  const mean = (n, a) => (a ? adjs[a].en + " " + N[n].en : N[n].en);
  const o = (n, a) => ({ key: say(n, a), pic: W(n, a) });

  // Phrases taught in lessons (and therefore allowed in practice)
  const TAUGHT_SIZE  = [["mira","big"],["mira","small"],["pela","small"],["suna","big"],["suna","small"],["tavo","big"],["kelo","small"],["bino","small"]];
  const TAUGHT_COLOR = [["mira","red"],["kelo","red"],["suna","blue"],["tavo","blue"],["mira","blue"],["bino","red"]];
  const TAUGHT_SKY   = [["sola","big"],["vira","small"],["nubo","small"],["lido","big"],["vira","red"],["lido","blue"],["nubo","big"],["sola","red"]];

  const lessons = [
    { n: 1, title: "First words", goal: "Meet six words from the river.", teaches: "nouns",
      items: [
        { id: "L1-01", type: "intro", word: "mira", en: "fish",  pics: [W("mira")] },
        { id: "L1-02", type: "intro", word: "pela", en: "river", pics: [W("pela")] },
        { id: "L1-03", type: "intro", word: "tavo", en: "stone", pics: [W("tavo")] },
        { id: "L1-04", type: "pick_pic", prompt: "Which one is “pela”?", options: [o("tavo"), o("pela"), o("mira")], answer: "pela" },
        { id: "L1-05", type: "intro", word: "kelo", en: "shell", pics: [W("kelo")] },
        { id: "L1-06", type: "intro", word: "suna", en: "moon",  pics: [W("suna")] },
        { id: "L1-07", type: "intro", word: "bino", en: "leaf",  pics: [W("bino")] },
        { id: "L1-08", type: "pick_pic", prompt: "Which one is “suna”?", options: [o("kelo"), o("bino"), o("suna"), o("mira")], answer: "suna" },
        { id: "L1-09", type: "pick_text", prompt: "What does this word mean?", big: "tavo", options: ["fish", "stone", "river"], answer: "stone" },
        { id: "L1-10", type: "match", pairs: [["mira", "fish"], ["kelo", "shell"], ["bino", "leaf"]], rightOrder: ["leaf", "fish", "shell"] }
      ] },

    { n: 2, title: "Word practice", goal: "Practice the six words until they stick.", teaches: "nouns",
      items: [
        { id: "L2-01", type: "pick_pic", prompt: "Which one is “bino”?", options: [o("mira"), o("bino"), o("kelo"), o("pela")], answer: "bino" },
        { id: "L2-02", type: "pick_text", prompt: "How do you say “moon” in Pelan?", options: ["tavo", "suna", "pela"], answer: "suna" },
        { id: "L2-03", type: "pick_text", prompt: "What does this word mean?", big: "kelo", options: ["leaf", "shell", "moon"], answer: "shell" },
        { id: "L2-04", type: "type", prompt: "Type the Pelan word for “fish”", pics: [W("mira")], answer: "mira", hint: "It starts with m." },
        { id: "L2-05", type: "pick_pic", prompt: "Which one is “tavo”?", options: [o("suna"), o("kelo"), o("tavo"), o("bino")], answer: "tavo" },
        { id: "L2-06", type: "match", pairs: [["mira", "fish"], ["pela", "river"], ["tavo", "stone"], ["kelo", "shell"], ["suna", "moon"], ["bino", "leaf"]],
          rightOrder: ["stone", "moon", "fish", "leaf", "river", "shell"] },
        { id: "L2-07", type: "pick_text", prompt: "How do you say “river” in Pelan?", options: ["pela", "mira", "bino", "kelo"], answer: "pela" },
        { id: "L2-08", type: "type", prompt: "Type the Pelan word for “leaf”", pics: [W("bino")], answer: "bino", hint: "It starts with b." },
        { id: "L2-09", type: "pick_text", prompt: "What does this word mean?", big: "mira", options: ["moon", "fish", "stone"], answer: "fish" },
        { id: "L2-10", type: "type", prompt: "Type the Pelan word for “shell”", pics: [W("kelo")], answer: "kelo", hint: "It starts with k." }
      ] },

    { n: 3, title: "Big and small", goal: "Learn two describing words and the ending rule.", teaches: "size",
      items: [
        { id: "L3-01", type: "intro", kicker: "New describing word", word: "vela · velo", en: "big",
          pics: [W("mira", "big"), W("tavo", "big")], captions: ["mira vela", "tavo velo"] },
        { id: "L3-02", type: "intro", kicker: "New describing word", word: "tipa · tipo", en: "small",
          pics: [W("suna", "small"), W("bino", "small")], captions: ["suna tipa", "bino tipo"] },
        { id: "L3-03", type: "rule", title: "The ending rule",
          lines: ["Every Pelan thing-word ends in <b>-a</b> or <b>-o</b>.",
                  "A describing word comes <b>after</b> it and <b>copies its ending</b>."],
          examples: [["mira", "mira vela", "big fish"], ["tavo", "tavo velo", "big stone"],
                     ["suna", "suna tipa", "small moon"], ["bino", "bino tipo", "small leaf"]] },
        { id: "L3-04", type: "pick_pic", prompt: "Which one is “mira tipa”?",
          options: [o("mira", "big"), o("kelo", "small"), o("mira", "small"), o("tavo", "big")], answer: "mira tipa" },
        { id: "L3-05", type: "pick_text", prompt: "What does this phrase mean?", big: "suna vela", options: ["small moon", "big moon", "big river"], answer: "big moon" },
        { id: "L3-06", type: "build", en: "big stone", bank: ["velo", "mira", "tavo", "vela"], answer: "tavo velo" },
        { id: "L3-07", type: "judge", phrase: "kelo tipa", en: "small shell", answer: false, explain: "“kelo” ends in -o, so it is “kelo tipo”." },
        { id: "L3-08", type: "build", en: "small leaf", bank: ["tipa", "bino", "kelo", "tipo"], answer: "bino tipo" },
        { id: "L3-09", type: "judge", phrase: "pela tipa", en: "small river", answer: true, explain: "“pela” ends in -a, so “tipa” is right." }
      ] },

    { n: 4, title: "Ending practice", goal: "Practice matching the endings.", teaches: "size",
      items: [
        { id: "L4-01", type: "rule", title: "Quick reminder",
          lines: ["The describing word copies the ending.", "<b>-a</b> goes with <b>-a</b>, and <b>-o</b> goes with <b>-o</b>."],
          examples: [["mira", "mira tipa", "small fish"], ["kelo", "kelo tipo", "small shell"]] },
        { id: "L4-02", type: "pick_text", prompt: "How do you say “big fish” in Pelan?", options: ["mira velo", "mira vela", "vela mira"], answer: "mira vela" },
        { id: "L4-03", type: "judge", phrase: "pela tipo", en: "small river", answer: false, explain: "“pela” ends in -a, so it is “pela tipa”." },
        { id: "L4-04", type: "build", en: "small shell", bank: ["kelo", "tipa", "tipo", "pela", "velo"], answer: "kelo tipo" },
        { id: "L4-05", type: "pick_pic", prompt: "Which one is “tavo velo”?",
          options: [o("kelo", "small"), o("tavo", "big"), o("suna", "big"), o("bino", "small")], answer: "tavo velo" },
        { id: "L4-06", type: "type", prompt: "Type “big fish” in Pelan", pics: [W("mira", "big")], answer: "mira vela", hint: "Thing-word first, then the describing word." },
        { id: "L4-07", type: "judge", phrase: "suna vela", en: "big moon", answer: true, explain: "“suna” ends in -a, so “vela” is right." },
        { id: "L4-08", type: "pick_text", prompt: "What does this phrase mean?", big: "bino tipo", options: ["small leaf", "big leaf", "small moon"], answer: "small leaf" },
        { id: "L4-09", type: "type", prompt: "Type “small moon” in Pelan", pics: [W("suna", "small")], answer: "suna tipa", hint: "“suna” ends in -a." },
        { id: "L4-10", type: "match", pairs: [["mira vela", "big fish"], ["suna tipa", "small moon"], ["tavo velo", "big stone"], ["pela tipa", "small river"]],
          rightOrder: ["small river", "big stone", "big fish", "small moon"] }
      ] },

    { n: 5, title: "Colors", goal: "Learn red and blue. The same ending rule applies.", teaches: "color",
      items: [
        { id: "L5-01", type: "intro", kicker: "New describing word", word: "rusa · ruso", en: "red",
          pics: [W("mira", "red"), W("kelo", "red")], captions: ["mira rusa", "kelo ruso"] },
        { id: "L5-02", type: "intro", kicker: "New describing word", word: "nila · nilo", en: "blue",
          pics: [W("suna", "blue"), W("tavo", "blue")], captions: ["suna nila", "tavo nilo"] },
        { id: "L5-03", type: "rule", title: "Same rule for colors",
          lines: ["Colors work just like big and small.", "They come <b>after</b> the thing-word and <b>copy its ending</b>."],
          examples: [["mira", "mira rusa", "red fish"], ["kelo", "kelo ruso", "red shell"],
                     ["suna", "suna nila", "blue moon"], ["tavo", "tavo nilo", "blue stone"]] },
        { id: "L5-04", type: "pick_pic", prompt: "Which one is “mira nila”?",
          options: [o("mira", "red"), o("mira", "blue"), o("kelo", "red"), o("tavo", "blue")], answer: "mira nila" },
        { id: "L5-05", type: "pick_text", prompt: "What does this phrase mean?", big: "kelo ruso", options: ["red shell", "blue shell", "red stone"], answer: "red shell" },
        { id: "L5-06", type: "build", en: "blue stone", bank: ["nila", "tavo", "nilo", "mira"], answer: "tavo nilo" },
        { id: "L5-07", type: "judge", phrase: "suna nilo", en: "blue moon", answer: false, explain: "“suna” ends in -a, so it is “suna nila”." },
        { id: "L5-08", type: "type", prompt: "Type “red fish” in Pelan", pics: [W("mira", "red")], answer: "mira rusa", hint: "“mira” ends in -a." },
        { id: "L5-09", type: "judge", phrase: "bino ruso", en: "red leaf", answer: true, explain: "“bino” ends in -o, so “ruso” is right." },
        { id: "L5-10", type: "match", pairs: [["mira rusa", "red fish"], ["suna nila", "blue moon"], ["tavo nilo", "blue stone"], ["bino ruso", "red leaf"]],
          rightOrder: ["blue stone", "red leaf", "red fish", "blue moon"] }
      ] },

    { n: 6, title: "River review", goal: "Put everything together.", teaches: "all",
      items: [
        { id: "L6-01", type: "pick_pic", prompt: "Which one is “suna tipa”?",
          options: [o("suna", "small"), o("suna", "big"), o("mira", "small"), o("kelo", "small")], answer: "suna tipa" },
        { id: "L6-02", type: "pick_text", prompt: "How do you say “stone” in Pelan?", options: ["kelo", "tavo", "bino"], answer: "tavo" },
        { id: "L6-03", type: "build", en: "big moon", bank: ["suna", "vela", "velo", "pela"], answer: "suna vela" },
        { id: "L6-04", type: "judge", phrase: "mira nila", en: "blue fish", answer: true, explain: "“mira” ends in -a, so “nila” is right." },
        { id: "L6-05", type: "type", prompt: "Type the Pelan word for “river”", pics: [W("pela")], answer: "pela", hint: "It starts with p." },
        { id: "L6-06", type: "pick_text", prompt: "What does this phrase mean?", big: "tavo nilo", options: ["blue stone", "red stone", "blue shell"], answer: "blue stone" },
        { id: "L6-07", type: "judge", phrase: "kelo rusa", en: "red shell", answer: false, explain: "“kelo” ends in -o, so it is “kelo ruso”." },
        { id: "L6-08", type: "build", en: "red leaf", bank: ["bino", "ruso", "rusa", "kelo"], answer: "bino ruso" },
        { id: "L6-09", type: "type", prompt: "Type “small shell” in Pelan", pics: [W("kelo", "small")], answer: "kelo tipo", hint: "“kelo” ends in -o." },
        { id: "L6-10", type: "match", pairs: [["pela", "river"], ["bino tipo", "small leaf"], ["mira rusa", "red fish"], ["suna vela", "big moon"], ["tavo", "stone"], ["kelo ruso", "red shell"]],
          rightOrder: ["big moon", "stone", "red shell", "river", "small leaf", "red fish"] }
      ] },

    { n: 7, title: "Sky words", goal: "Meet four new words from the sky.", teaches: "sky",
      items: [
        { id: "L7-01", type: "intro", word: "sola", en: "sun",   pics: [W("sola")] },
        { id: "L7-02", type: "intro", word: "vira", en: "bird",  pics: [W("vira")] },
        { id: "L7-03", type: "pick_pic", prompt: "Which one is “vira”?", options: [o("sola"), o("mira"), o("vira")], answer: "vira" },
        { id: "L7-04", type: "intro", word: "nubo", en: "cloud", pics: [W("nubo")] },
        { id: "L7-05", type: "intro", word: "lido", en: "boat",  pics: [W("lido")] },
        { id: "L7-06", type: "pick_pic", prompt: "Which one is “lido”?", options: [o("nubo"), o("lido"), o("kelo"), o("sola")], answer: "lido" },
        { id: "L7-07", type: "pick_text", prompt: "What does this word mean?", big: "sola", options: ["moon", "sun", "bird"], answer: "sun" },
        { id: "L7-08", type: "rule", title: "Same endings as before",
          lines: ["New words still end in <b>-a</b> or <b>-o</b>.", "That ending decides the describing word later."],
          examples: [["sola", "sun", "ends in -a"], ["vira", "bird", "ends in -a"], ["nubo", "cloud", "ends in -o"], ["lido", "boat", "ends in -o"]] },
        { id: "L7-09", type: "pick_text", prompt: "How do you say “cloud” in Pelan?", options: ["nubo", "bino", "lido"], answer: "nubo" },
        { id: "L7-10", type: "match", pairs: [["sola", "sun"], ["vira", "bird"], ["nubo", "cloud"], ["lido", "boat"]], rightOrder: ["boat", "sun", "cloud", "bird"] }
      ] },

    { n: 8, title: "Sky practice", goal: "Practice the sky words with the river words.", teaches: "sky",
      items: [
        { id: "L8-01", type: "pick_pic", prompt: "Which one is “nubo”?", options: [o("nubo"), o("pela"), o("sola"), o("bino")], answer: "nubo" },
        { id: "L8-02", type: "type", prompt: "Type the Pelan word for “sun”", pics: [W("sola")], answer: "sola", hint: "It starts with s and ends in -a." },
        { id: "L8-03", type: "pick_text", prompt: "What does this word mean?", big: "vira", options: ["fish", "bird", "boat"], answer: "bird" },
        { id: "L8-04", type: "pick_text", prompt: "How do you say “boat” in Pelan?", options: ["lido", "tavo", "vira"], answer: "lido" },
        { id: "L8-05", type: "pick_pic", prompt: "Which one is “sola”?", options: [o("suna"), o("sola"), o("kelo")], answer: "sola" },
        { id: "L8-06", type: "match", pairs: [["sola", "sun"], ["suna", "moon"], ["vira", "bird"], ["mira", "fish"], ["lido", "boat"], ["bino", "leaf"]],
          rightOrder: ["fish", "boat", "sun", "leaf", "bird", "moon"] },
        { id: "L8-07", type: "type", prompt: "Type the Pelan word for “bird”", pics: [W("vira")], answer: "vira", hint: "It starts with v." },
        { id: "L8-08", type: "pick_text", prompt: "Which word ends in -o?", options: ["vira", "nubo", "sola"], answer: "nubo" },
        { id: "L8-09", type: "type", prompt: "Type the Pelan word for “cloud”", pics: [W("nubo")], answer: "nubo", hint: "It starts with n." },
        { id: "L8-10", type: "pick_text", prompt: "What does this word mean?", big: "lido", options: ["boat", "leaf", "cloud"], answer: "boat" }
      ] },

    { n: 9, title: "Describe the sky", goal: "Use big, small, red and blue with the sky words.", teaches: "sky",
      items: [
        { id: "L9-01", type: "rule", title: "The rule still works",
          lines: ["Describing words come <b>after</b> the thing-word.", "They <b>copy its ending</b>: -a with -a, -o with -o."],
          examples: [["sola", "sola vela", "big sun"], ["vira", "vira tipa", "small bird"], ["nubo", "nubo tipo", "small cloud"], ["lido", "lido velo", "big boat"]] },
        { id: "L9-02", type: "pick_pic", prompt: "Which one is “sola vela”?", options: [o("sola", "big"), o("sola", "red"), o("suna", "big"), o("lido", "big")], answer: "sola vela" },
        { id: "L9-03", type: "build", en: "small bird", bank: ["tipo", "vira", "tipa", "mira"], answer: "vira tipa" },
        { id: "L9-04", type: "judge", phrase: "nubo tipa", en: "small cloud", answer: false, explain: "“nubo” ends in -o, so it is “nubo tipo”." },
        { id: "L9-05", type: "type", prompt: "Type “big boat” in Pelan", pics: [W("lido", "big")], answer: "lido velo", hint: "“lido” ends in -o." },
        { id: "L9-06", type: "pick_text", prompt: "What does this phrase mean?", big: "vira rusa", options: ["red bird", "blue bird", "red sun"], answer: "red bird" },
        { id: "L9-07", type: "build", en: "blue boat", bank: ["nila", "lido", "nilo", "vira"], answer: "lido nilo" },
        { id: "L9-08", type: "judge", phrase: "sola rusa", en: "red sun", answer: true, explain: "“sola” ends in -a, so “rusa” is right." },
        { id: "L9-09", type: "pick_pic", prompt: "Which one is “nubo velo”?", options: [o("nubo", "small"), o("nubo", "big"), o("lido", "big")], answer: "nubo velo" },
        { id: "L9-10", type: "match", pairs: [["sola vela", "big sun"], ["vira tipa", "small bird"], ["lido nilo", "blue boat"], ["vira rusa", "red bird"]],
          rightOrder: ["red bird", "blue boat", "big sun", "small bird"] }
      ] },

    { n: 10, title: "Grand review", goal: "Everything from river to sky.", teaches: "all",
      items: [
        { id: "L10-01", type: "pick_pic", prompt: "Which one is “kelo ruso”?", options: [o("kelo", "red"), o("kelo", "small"), o("mira", "red"), o("lido", "blue")], answer: "kelo ruso" },
        { id: "L10-02", type: "type", prompt: "Type “small leaf” in Pelan", pics: [W("bino", "small")], answer: "bino tipo", hint: "“bino” ends in -o." },
        { id: "L10-03", type: "judge", phrase: "vira tipo", en: "small bird", answer: false, explain: "“vira” ends in -a, so it is “vira tipa”." },
        { id: "L10-04", type: "build", en: "blue moon", bank: ["suna", "nilo", "nila", "sola"], answer: "suna nila" },
        { id: "L10-05", type: "pick_text", prompt: "What does this phrase mean?", big: "nubo tipo", options: ["small cloud", "big cloud", "small boat"], answer: "small cloud" },
        { id: "L10-06", type: "type", prompt: "Type the Pelan word for “stone”", pics: [W("tavo")], answer: "tavo", hint: "It starts with t." },
        { id: "L10-07", type: "judge", phrase: "mira rusa", en: "red fish", answer: true, explain: "“mira” ends in -a, so “rusa” is right." },
        { id: "L10-08", type: "build", en: "big boat", bank: ["lido", "vela", "velo", "nubo"], answer: "lido velo" },
        { id: "L10-09", type: "pick_text", prompt: "How do you say “red bird” in Pelan?", options: ["vira rusa", "vira ruso", "rusa vira"], answer: "vira rusa" },
        { id: "L10-10", type: "match", pairs: [["mira vela", "big fish"], ["nubo tipo", "small cloud"], ["tavo nilo", "blue stone"], ["sola vela", "big sun"], ["kelo tipo", "small shell"], ["vira rusa", "red bird"]],
          rightOrder: ["blue stone", "red bird", "big fish", "small shell", "big sun", "small cloud"] }
      ] }
  ];

  /* --------------------------- glossary (help) --------------------------- */
  function glossary(lessonsDone) {
    const rows = nouns.filter(n => !n.sky || lessonsDone >= 6).map(n => ({ word: n.id, en: n.en, pic: W(n.id) }));
    if (lessonsDone >= 2) rows.push({ word: "vela / velo", en: "big", pic: W("mira", "big") }, { word: "tipa / tipo", en: "small", pic: W("mira", "small") });
    if (lessonsDone >= 4) rows.push({ word: "rusa / ruso", en: "red", pic: W("kelo", "red") }, { word: "nila / nilo", en: "blue", pic: W("kelo", "blue") });
    return rows;
  }

  /* --------------------------- practice rounds --------------------------- */
  // Three modes with identical credit (Model 1: passive / easy = low effort,
  // active = effortful retrieval of weak words). Only taught phrases are used.
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function practicePool(lessonsDone) {
    let pool = nouns.filter(n => !n.sky || lessonsDone >= 7).map(n => [n.id, null]);
    if (lessonsDone >= 3) pool = pool.concat(TAUGHT_SIZE);
    if (lessonsDone >= 5) pool = pool.concat(TAUGHT_COLOR);
    if (lessonsDone >= 9) pool = pool.concat(TAUGHT_SKY);
    return pool;
  }
  // miss: { "mira vela": 2, ... } counts of wrong answers so far
  function practice(mode, lessonsDone, len, miss = {}) {
    const pool = practicePool(lessonsDone);
    const weakFirst = shuffle(pool).sort((x, y) => (miss[say(...y)] || 0) - (miss[say(...x)] || 0));
    const picks = (mode === "active" ? weakFirst : shuffle(pool)).slice(0, len);
    return picks.map(([n, a], i) => {
      const word = say(n, a), en = mean(n, a), id = `P${mode[0].toUpperCase()}-${i + 1}`;
      if (mode === "passive") {
        const note = a ? `“${n}” ends in -${N[n].cls}, so the describing word ends in -${N[n].cls} too.` : `“${n}” is a thing-word that ends in -${N[n].cls}.`;
        return { id, type: "explain", word, en, pics: [W(n, a)], note };
      }
      if (mode === "easy") {
        const others = shuffle(pool.filter(p => say(...p) !== word)).slice(0, 2);
        const options = shuffle([[n, a], ...others]).map(([m, b]) => ({ key: say(m, b), pic: W(m, b) }));
        return { id, type: "pick_pic", prompt: `Which one is “${word}”?`, options, answer: word, weak: miss[word] || 0 };
      }
      if (!a) return { id, type: "type", prompt: `Type the Pelan word for “${en}”`, pics: [W(n)], answer: word, weak: miss[word] || 0 };
      const wrongEnd = adjs[a].stem + (N[n].cls === "a" ? "o" : "a");
      const other = shuffle(pool.filter(p => !p[1] && p[0] !== n))[0][0];
      return { id, type: "build", en, bank: shuffle([n, adjs[a].stem + N[n].cls, wrongEnd, other]), answer: word, weak: miss[word] || 0 };
    });
  }

  // Quick version of a lesson: every teaching card, plus the first half of the
  // questions (so "quick" vs "full" measures choosing the shortest lesson).
  function quick(items) {
    const graded = items.filter(x => x.type !== "intro" && x.type !== "rule");
    const keep = new Set(graded.slice(0, Math.ceil(graded.length / 2)).map(x => x.id));
    return items.filter(x => x.type === "intro" || x.type === "rule" || keep.has(x.id));
  }

  // Locked placeholders shown after the last lesson on the lesson map.
  const comingSoon = ["Counting", "Little stories"];

  return { name: "Pelan", nouns, adjs, lessons, glossary, practice, quick, comingSoon, W, say, mean };
})();
