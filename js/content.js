/* =========================================================================
   PELAN — the made-up "river language"
   6 nouns in two classes (-a / -o), 4 adjectives (big, small, red, blue).
   Rule: the adjective comes AFTER the noun and COPIES its ending.
   All six lessons are fixed: same items, same order, same options for
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
    { id: "bino", en: "leaf",  cls: "o" }
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
      ] }
  ];

  /* --------------------------- glossary (help) --------------------------- */
  function glossary(lessonsDone) {
    const rows = nouns.map(n => ({ word: n.id, en: n.en, pic: W(n.id) }));
    if (lessonsDone >= 2) rows.push({ word: "vela / velo", en: "big", pic: W("mira", "big") }, { word: "tipa / tipo", en: "small", pic: W("mira", "small") });
    if (lessonsDone >= 4) rows.push({ word: "rusa / ruso", en: "red", pic: W("kelo", "red") }, { word: "nila / nilo", en: "blue", pic: W("kelo", "blue") });
    return rows;
  }

  /* ------------------------- flashcard practice -------------------------- */
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Pool grows with the lessons completed. Only taught phrases are used.
  function practicePool(lessonsDone) {
    let pool = nouns.map(n => [n.id, null]);
    if (lessonsDone >= 3) pool = pool.concat(TAUGHT_SIZE);
    if (lessonsDone >= 5) pool = pool.concat(TAUGHT_COLOR);
    return pool;
  }
  function practice(lessonsDone, len) {
    return shuffle(practicePool(lessonsDone)).slice(0, len).map(([n, a], i) => ({
      id: `F-${i + 1}`, type: "flash", word: say(n, a), en: mean(n, a), pics: [W(n, a)]
    }));
  }

  return { name: "Pelan", nouns, adjs, lessons, glossary, practice, W, say, mean };
})();
