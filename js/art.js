/* =========================================================================
   ART — inline SVG (no image files)
   • Ollie the otter: moods talk, wave, happy, cheer, star, love, clap, hug,
     encourage, think, sad, worried, shell, sleepy
   • Ollie tricks (animated): juggle, slide, float, dance, spin, drift, gift
   • Neutral animations for versions without Ollie
   • Word pictures for Pelan nouns, with size and color
   • App logo
   ========================================================================= */
window.Art = (function () {
  const C = {
    fur: "#A8724C", furLt: "#BC8760", furDk: "#7E5034", cream: "#FFF1DE", dark: "#2A1A12",
    pink: "#F59AA5", earIn: "#F3B1A6", mouth: "#7A2C33", tongue: "#F27D8C", blush: "#FF8FA0",
    tear: "#76CCEE", scarf: "#1F9AA8", scarfDk: "#177C88", dot: "#FFD25E",
    heart: "#FF6B8B", star: "#FFC94D", water: "#BFE6EA", waterLine: "#86CCD5"
  };

  /* --------------------- shading (shared gradients) -------------------- */
  // One hidden <svg><defs> on the page; every drawing points at these ids,
  // so Ollie and the scenes get the same soft, rounded shading.
  const rg = (id, stops, a = 'cx=".38" cy=".3" r=".8"') => `<radialGradient id="${id}" ${a}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</radialGradient>`;
  const lg = (id, stops, a = 'x1="0" y1="0" x2="0" y2="1"') => `<linearGradient id="${id}" ${a}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    ${rg("ol-fur", [[0, "#CC9A6C"], [.55, "#AB754E"], [1, "#875838"]])}
    ${rg("ol-furDk", [[0, "#9A6744"], [1, "#6A4228"]])}
    ${rg("ol-cream", [[0, "#FFFCF6"], [.6, "#FFF0DC"], [1, "#F4DCBD"]], 'cx=".45" cy=".35" r=".8"')}
    ${rg("ol-ear", [[0, "#FFD2C9"], [1, "#EE9C90"]])}
    ${rg("ol-eye", [[0, "#6A3E2C"], [.6, "#2A1810"], [1, "#160C07"]], 'cx=".45" cy=".68" r=".75"')}
    ${rg("ol-nose", [[0, "#6B4636"], [1, "#1E120C"]], 'cx=".4" cy=".25" r=".9"')}
    ${lg("ol-scarf", [[0, "#3CC6D3"], [1, "#178592"]])}
    ${lg("sc-shell", [[0, "#FFDCD0"], [1, "#F0957F"]])}
    ${lg("sc-water", [[0, "#CDEFF3"], [1, "#86CBD7"]])}
    ${lg("sc-waterN", [[0, "#4D7598"], [1, "#2A4B6A"]])}
    ${lg("sc-day", [[0, "#9FD9F0"], [1, "#EEF9FC"]])}
    ${lg("sc-dawn", [[0, "#F6B78E"], [.55, "#FBE2C8"], [1, "#D7EEF5"]])}
    ${lg("sc-dusk", [[0, "#C9B2E0"], [.5, "#F8C9A7"], [1, "#FCE7CF"]])}
    ${lg("sc-night", [[0, "#1D3150"], [1, "#46698C"]])}
    ${rg("sc-sun", [[0, "#FFF4B8"], [.6, "#FFCC40"], [1, "#F5A623"]], 'cx=".4" cy=".35" r=".7"')}
    ${rg("sc-moon", [[0, "#FFFCE6"], [1, "#F1D36C"]], 'cx=".35" cy=".35" r=".8"')}
    ${rg("sc-glow", [[0, "rgba(255,247,200,.85)"], [1, "rgba(255,247,200,0)"]], 'cx=".5" cy=".5" r=".5"')}
    ${lg("sc-leaf", [[0, "#93D89E"], [1, "#3B9150"]], 'x1="0" y1="0" x2="1" y2="1"')}
    ${lg("sc-fish", [[0, "#FFD177"], [1, "#EC8526"]])}
    ${lg("sc-boat", [[0, "#FFFFFF"], [1, "#D6E3EA"]])}
    ${lg("sc-hull", [[0, "#F7C35B"], [1, "#DB9A2A"]])}
    ${rg("sc-cloud", [[0, "#FFFFFF"], [.7, "#F4F9FC"], [1, "#DCEAF3"]], 'cx=".4" cy=".3" r=".8"')}
    ${lg("sc-hill", [[0, "#9FD3A8"], [1, "#6DB37C"]])}
    ${lg("sc-hill2", [[0, "#C5E6C3"], [1, "#94CB9B"]])}
  </defs></svg>`;
  function ensureDefs() {
    if (document.getElementById("art-defs") || !document.body) return;
    const d = document.createElement("div"); d.id = "art-defs"; d.innerHTML = DEFS; document.body.prepend(d);
  }
  ensureDefs();
  document.addEventListener("DOMContentLoaded", ensureDefs);
  const F = "url(#ol-fur)", FD = "url(#ol-furDk)", CR = "url(#ol-cream)";

  /* ------------------------------ Ollie ------------------------------- */
  // Chibi otter, viewBox 0 0 200 220. Big round head, small body, paddle tail.
  // Animated arms get their class on a wrapping <g>, so a CSS animation never
  // replaces the ellipse's own rotate() (that made arms jump off the body).
  const arm = (cx, cy, r, cls = "") => {
    const e = `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="18" transform="rotate(${r} ${cx} ${cy})" fill="${F}" stroke="${C.furDk}" stroke-width="1.5"/>`;
    return cls ? `<g class="${cls}">${e}</g>` : e;
  };
  const paw = (x, y) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${F}" stroke="${C.furDk}" stroke-width="1.5"/><circle cx="${x}" cy="${y + 1}" r="3.2" fill="url(#ol-ear)"/>`;
  function arms(pose) {
    switch (pose) {
      case "up":    return `<g class="o-arms-up">${arm(52, 142, 40, "o-arm-l")}${arm(148, 142, -40, "o-arm-r")}</g>`;
      case "wave":  return arm(64, 170, 22) + `<g class="o-wave">${arm(146, 140, -38)}</g>`;
      case "clap":  return `<g class="o-clap">
          <g class="o-clap-l">${arm(78, 182, 40)}${paw(92, 168)}</g>
          <g class="o-clap-r">${arm(122, 182, -40)}${paw(108, 168)}</g>
          <g class="o-clap-burst" stroke="${C.star}" stroke-width="3" stroke-linecap="round"><path d="M82 162 L74 157"/><path d="M118 162 L126 157"/><path d="M100 181 L100 189"/></g></g>`;
      case "hug":   return arm(78, 170, -62) + arm(122, 170, 62);
      case "hold":  return arm(80, 172, -55) + arm(120, 172, 55);
      case "thumb": return arm(64, 170, 22) + `<g class="o-pump">${arm(144, 146, -24)}<circle cx="148" cy="130" r="8" fill="${F}" stroke="${C.furDk}" stroke-width="1.5"/></g>`;
      case "chin":  return arm(64, 170, 22) + arm(126, 150, 52);
      default:      return arm(62, 170, 22) + arm(138, 170, -22);
    }
  }
  const eyeBase = (x, y, rx = 13.5, ry = 15.5) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#ol-eye)"/>
     <circle cx="${x - 4.5}" cy="${y - 5.5}" r="5.8" fill="#fff"/><circle cx="${x + 5}" cy="${y + 5}" r="2.6" fill="#fff"/>
     <circle cx="${x + 5.5}" cy="${y - 7}" r="1.5" fill="#fff" opacity=".85"/>
     <path d="M${x - 8} ${y + 8} q${8} ${5} ${16} 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".28"/>`;
  const starAt = (x, y, r, fill) => {
    let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (x + rr * Math.cos(a)).toFixed(1) + " " + (y + rr * Math.sin(a)).toFixed(1); }
    return `<path d="${d}Z" fill="${fill}"/>`;
  };
  const heartAt = (x, y, s, fill = C.heart) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -2 -8 -12 0 -7 C8 -12 10 -2 0 6 Z" fill="${fill}"/>`;

  function eyes(kind) {
    const L = 74, R = 126, Y = 94;
    const arc = d => `<g fill="none" stroke="${C.dark}" stroke-width="5" stroke-linecap="round">${d}</g>`;
    switch (kind) {
      case "closed": return arc(`<path d="M62 96 Q74 82 86 96"/><path d="M114 96 Q126 82 138 96"/>`);
      case "sleepy": return arc(`<path d="M63 94 Q74 101 85 94"/><path d="M115 94 Q126 101 137 94"/>`);
      case "star":   return `<g class="o-eyes">${eyeBase(L, Y)}${eyeBase(R, Y)}</g>${starAt(L - 3, Y - 4, 7, "#fff")}${starAt(R - 3, Y - 4, 7, "#fff")}`;
      case "love":   return `${heartAt(L, Y + 2, 1.35)}${heartAt(R, Y + 2, 1.35)}`;
      case "up":     return `<g class="o-eyes">${eyeBase(L + 2, Y - 4)}${eyeBase(R + 2, Y - 4)}</g>`;
      case "wet":    return `<g class="o-eyes">${eyeBase(L, Y + 1, 12.5, 15)}${eyeBase(R, Y + 1, 12.5, 15)}</g>
        <ellipse cx="${L}" cy="${Y + 10}" rx="9" ry="3" fill="#9FDDF3" opacity=".8"/><ellipse cx="${R}" cy="${Y + 10}" rx="9" ry="3" fill="#9FDDF3" opacity=".8"/>`;
      default:       return `<g class="o-eyes">${eyeBase(L, Y)}${eyeBase(R, Y)}</g>`;
    }
  }
  function face(m) {
    let ey = "open", mouth, brows = "", extra = "";
    const smile = `<path d="M90 121 Q100 136 110 121 Z" fill="${C.mouth}"/><ellipse cx="100" cy="129" rx="5.5" ry="3.3" fill="${C.tongue}"/>`;
    const bigSmile = `<path d="M86 120 Q100 142 114 120 Z" fill="${C.mouth}"/><ellipse cx="100" cy="132" rx="7" ry="4.2" fill="${C.tongue}"/>`;
    const cat = `<path d="M92 120 q4 5 8 0 q4 5 8 0" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
    switch (m) {
      case "happy":     mouth = smile; break;
      case "joy":       ey = "closed"; mouth = bigSmile; break;
      case "star":      ey = "star"; mouth = bigSmile; break;
      case "love":      ey = "love"; mouth = smile; break;
      case "content":   ey = "closed"; mouth = cat; break;
      case "sad":
        ey = "wet";
        brows = `<g stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"><path d="M60 74 L82 68"/><path d="M140 74 L118 68"/></g>`;
        mouth = `<path d="M91 128 Q100 119 109 128" fill="none" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
        extra = `<g class="o-tears"><path d="M66 110 q-5 13 0 19 q5 -6 0 -19z" fill="${C.tear}"/><path d="M134 110 q-5 13 0 19 q5 -6 0 -19z" fill="${C.tear}"/></g>`; break;
      case "worried":
        brows = `<g stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"><path d="M60 72 L82 69"/><path d="M140 72 L118 69"/></g>`;
        mouth = `<path d="M89 124 q5 -5 11 0 q5 5 11 0" fill="none" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
        extra = `<path d="M160 60 q-7 11 0 15 q7 -4 0 -15z" fill="${C.tear}"/>`; break;
      case "think":     ey = "up"; mouth = `<ellipse cx="104" cy="123" rx="4" ry="3.5" fill="${C.mouth}"/>`; break;
      case "sleepy":    ey = "sleepy"; mouth = `<ellipse cx="100" cy="123" rx="4" ry="3" fill="${C.mouth}"/>`; break;
      default:          mouth = `<path d="M92 120 q8 9 16 0" fill="${C.mouth}"/>`;
    }
    return `
      <ellipse cx="100" cy="114" rx="50" ry="34" fill="${CR}"/>
      <ellipse cx="74" cy="90" rx="20" ry="18" fill="${C.cream}" opacity=".55"/><ellipse cx="126" cy="90" rx="20" ry="18" fill="${C.cream}" opacity=".55"/>
      <ellipse cx="58" cy="118" rx="12" ry="7" fill="${C.blush}" opacity=".55"/><ellipse cx="142" cy="118" rx="12" ry="7" fill="${C.blush}" opacity=".55"/>
      <circle cx="54" cy="115" r="2" fill="#fff" opacity=".7"/><circle cx="138" cy="115" r="2" fill="#fff" opacity=".7"/>
      ${brows}${eyes(ey)}
      <path d="M90 108 Q100 101 110 108 Q108 116 100 118 Q92 116 90 108 Z" fill="url(#ol-nose)"/>
      <ellipse cx="96" cy="107" rx="3.6" ry="1.9" fill="#fff" opacity=".8"/>
      <path d="M100 117 L100 120" stroke="${C.dark}" stroke-width="2.5" stroke-linecap="round"/>
      <g fill="${C.furDk}" opacity=".55"><circle cx="81" cy="117" r="1.7"/><circle cx="77" cy="122" r="1.7"/><circle cx="119" cy="117" r="1.7"/><circle cx="123" cy="122" r="1.7"/></g>
      <g stroke="${C.furDk}" stroke-width="1.6" stroke-linecap="round" opacity=".35"><path d="M60 110 L42 106"/><path d="M60 116 L41 118"/><path d="M140 110 L158 106"/><path d="M140 116 L159 118"/></g>
      ${mouth}${extra}`;
  }
  const smallShell = (x, y, s = 1) =>
    `<g class="o-shell" transform="translate(${x} ${y}) scale(${s})"><path d="M0 14 L-13 -4 Q0 -16 13 -4 Z" fill="url(#sc-shell)" stroke="#E08974" stroke-width="2" stroke-linejoin="round"/><path d="M0 14 L-6 -8 M0 14 L0 -10 M0 14 L6 -8" stroke="#E08974" stroke-width="1.6"/></g>`;
  const bigHeart = (x, y, s) => `<g class="o-heldheart">${heartAt(x, y, s)}<path transform="translate(${x} ${y}) scale(${s})" d="M-4 -6 q-3 1 -3 4" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7" stroke-linecap="round"/></g>`;
  // Drawn before the head, so the head's chin sits on top of it (no gap).
  const scarf = `<g class="o-scarf">
      <path d="M48 130 Q100 174 152 130 L149 148 Q100 190 51 148 Z" fill="url(#ol-scarf)"/>
      <path d="M51 148 Q100 190 149 148" fill="none" stroke="${C.scarfDk}" stroke-width="2"/>
      <circle cx="74" cy="160" r="2.8" fill="${C.dot}"/><circle cx="100" cy="166" r="2.8" fill="${C.dot}"/><circle cx="126" cy="160" r="2.8" fill="${C.dot}"/>
      <path d="M128 160 L142 188 L124 183 Z" fill="url(#ol-scarf)"/><path d="M128 160 L142 188" stroke="${C.scarfDk}" stroke-width="1.5"/></g>`;

  function otter(m, pose = "down", extras = "", { droop = false } = {}) {
    const front = pose === "hold" || pose === "hug";
    const ear = (x, r) => `<g class="o-ear" ${droop ? `transform="translate(${r > 0 ? 3 : -3} 13)"` : ""}>
        <circle cx="${x}" cy="54" r="13" fill="${F}"/><circle cx="${x}" cy="55" r="6.5" fill="url(#ol-ear)"/></g>`;
    return `
      <ellipse cx="100" cy="214" rx="56" ry="6" fill="#3B2416" opacity=".13"/>
      <g class="o-tail"><path d="M116 206 C140 214 172 210 186 194 C191 188 186 180 179 184 C164 194 140 196 118 192 Z" fill="${FD}"/>
        <path d="M128 202 C148 205 166 201 178 191" fill="none" stroke="${C.fur}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
      ${pose === "up" || pose === "wave" ? arms(pose) : ""}
      <path d="M56 176 C54 140 146 140 144 176 C146 210 54 210 56 176 Z" fill="${F}"/>
      <ellipse cx="100" cy="182" rx="28" ry="24" fill="${CR}"/>
      <ellipse cx="80" cy="207" rx="15" ry="8" fill="${FD}"/><ellipse cx="120" cy="207" rx="15" ry="8" fill="${FD}"/>
      <g fill="${C.earIn}"><circle cx="74" cy="206" r="2"/><circle cx="80" cy="203.5" r="2"/><circle cx="86" cy="206" r="2"/><circle cx="114" cy="206" r="2"/><circle cx="120" cy="203.5" r="2"/><circle cx="126" cy="206" r="2"/></g>
      ${scarf}
      ${!front && pose !== "up" && pose !== "wave" ? arms(pose) : ""}
      ${pose === "hug" ? arms(pose) + extras : front ? extras + arms(pose) : extras}
      <ellipse cx="100" cy="148" rx="48" ry="9" fill="#3B2416" opacity=".16"/>
      ${ear(44, -28)}${ear(156, 28)}
      <ellipse cx="100" cy="92" rx="67" ry="61" fill="${F}"/>
      <ellipse cx="78" cy="50" rx="22" ry="8" fill="#fff" opacity=".13" transform="rotate(-16 78 50)"/>
      <path d="M90 34 q4 -12 9 -2 q5 -12 10 1" fill="${C.furLt}" stroke="${C.furDk}" stroke-width="2" stroke-linejoin="round"/>
      ${face(m)}`;
  }
  const sparkles = `<g class="o-sparkles">
      ${starAt(24, 58, 10, C.star)}${starAt(178, 34, 8, C.star)}${starAt(184, 112, 7, "#7FD0EE")}
      <circle cx="28" cy="118" r="4" fill="${C.pink}"/><circle cx="170" cy="72" r="3" fill="${C.pink}"/></g>`;
  const floatHearts = `<g class="o-hearts">${heartAt(30, 70, 1.4)}${heartAt(172, 52, 1.1, "#FF9FB3")}${heartAt(176, 112, 0.9)}${heartAt(22, 120, 0.8, "#FF9FB3")}</g>`;

  function ollie(mood = "talk", { cls = "" } = {}) {
    let inner;
    switch (mood) {
      case "wave":      inner = otter("happy", "wave"); break;
      case "happy":     inner = otter("happy", "down"); break;
      case "cheer":     inner = sparkles + otter("joy", "up"); break;
      case "star":      inner = sparkles + otter("star", "up"); break;
      case "love":      inner = floatHearts + otter("love", "down"); break;
      case "clap":      inner = sparkles + otter("joy", "clap"); break;
      case "hug":       inner = floatHearts + otter("content", "hug", bigHeart(100, 180, 3)); break;
      case "encourage": inner = otter("happy", "thumb"); break;
      case "think":     inner = otter("think", "chin") + `<text x="164" y="50" font-size="38" font-weight="800" fill="${C.scarf}" font-family="Baloo 2, sans-serif">?</text>`; break;
      case "sad":       inner = otter("sad", "hold", "", { droop: true }); break;
      case "worried":   inner = otter("worried", "hold", smallShell(100, 174, 1.6), { droop: true }); break;
      case "shell":     inner = sparkles + otter("happy", "hold", smallShell(100, 174, 1.7)); break;
      case "sleepy":    inner = otter("sleepy", "down") + `<text x="160" y="40" font-size="26" font-weight="800" fill="${C.scarf}" font-family="Baloo 2, sans-serif">z</text>`; break;
      default:          inner = otter("talk", "down");
    }
    return `<svg class="ollie mood-${mood} ${cls}" viewBox="0 0 200 222" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie the otter">${inner}</svg>`;
  }
  // Moods that are happy/excited (used to choose a matching motion)
  const MOTION = { cheer: "jump", star: "jump", clap: "jump", love: "sway-soft", hug: "squish", happy: "nod", wave: "nod", encourage: "nod", sad: "sway", worried: "shiver" };

  /* ------------------------------ tricks ------------------------------ */
  // Break scenes follow the two chapters (river words, then sky words).
  // Every version gets the same five scenes, drawn the same way; the Ollie
  // versions add Ollie to the scene, so the only difference is Ollie.
  const SCENES = [
    { id: "juggle",  title: "Shell juggle",    ch: "river" },
    { id: "leap",    title: "Fish leap",       ch: "river" },
    { id: "moon",    title: "Moonlight float", ch: "river" },
    { id: "sunrise", title: "Sunrise",         ch: "sky" },
    { id: "boat",    title: "Boat ride",       ch: "sky" }
  ];
  const TRICKS = SCENES, NEUTRAL = SCENES;
  const water = (y = 226) => `<g><ellipse cx="120" cy="${y}" rx="140" ry="26" fill="${C.water}"/>
      <path class="a-wave" d="M-20 ${y - 4} q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="${C.waterLine}" stroke-width="3" stroke-linecap="round"/></g>`;
  const at = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;

  /* ---- scene pieces ---- */
  const cloud = (x, y, s, cls = "") => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 12 Q-44 12 -42 0 Q-40 -12 -26 -10 Q-22 -28 -2 -26 Q16 -26 20 -12 Q38 -14 40 2 Q42 12 28 12 Z" fill="url(#sc-cloud)"/><path d="M-26 4 Q-16 -2 -6 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/></g></g>`;
  const bird = (x, y, s, cls = "") => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="9" ry="6" fill="#4FA3D9"/><circle cx="8" cy="-4" r="4.5" fill="#4FA3D9"/><path d="M12 -4 L17 -3 L12 -1 Z" fill="#F2A93B"/><circle cx="9" cy="-5" r="1.1" fill="#1E2A30"/>
      <g class="a-flap"><path d="M-3 -2 Q-8 -16 -16 -12 Q-10 -6 -3 -2 Z" fill="#7CC0EA"/></g></g></g>`;
  const fishShape = `<g><path d="M-22 0 Q-4 -16 16 0 Q-4 16 -22 0 Z" fill="url(#sc-fish)"/><path d="M14 0 L28 -11 L25 0 L28 11 Z" fill="#EC8526"/><circle cx="-12" cy="-3" r="2.6" fill="#24343A"/><circle cx="-12.8" cy="-3.8" r=".9" fill="#fff"/><path d="M-4 -8 Q0 0 -4 8" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/></g>`;
  const leafShape = `<g><path d="M-26 6 Q-22 -16 24 -12 Q20 12 -26 6 Z" fill="url(#sc-leaf)"/><path d="M-24 5 Q0 -2 22 -10" fill="none" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/></g>`;
  const waves = (y, col, op = .9) => `<path class="a-wave" d="M-20 ${y} q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" opacity="${op}"/>`;
  const riverBg = (night = false) => night
    ? `<rect width="240" height="250" fill="url(#sc-night)"/>
       <g class="a-stars">${[[30, 30], [70, 60], [110, 24], [150, 48], [210, 22], [24, 96], [196, 92], [128, 82]].map(([x, y], i) => `<g class="a-twinkle" style="animation-delay:${(i * .37).toFixed(2)}s;transform-origin:${x}px ${y}px">${starAt(x, y, 3 + (i % 3), "#FFF3B8")}</g>`).join("")}</g>
       <circle cx="184" cy="56" r="44" fill="url(#sc-glow)"/><circle cx="184" cy="56" r="22" fill="url(#sc-moon)"/><circle cx="177" cy="50" r="4" fill="#E9C55A" opacity=".45"/><circle cx="192" cy="62" r="3" fill="#E9C55A" opacity=".4"/>
       <rect x="0" y="168" width="240" height="82" fill="url(#sc-waterN)"/>
       <g class="a-shimmer" fill="#F6DE86">${[178, 190, 202, 214].map((y, i) => `<ellipse cx="184" cy="${y}" rx="${18 - i * 3}" ry="2.2" opacity="${.7 - i * .12}"/>`).join("")}</g>
       ${waves(176, "#7FA6C6", .7)}`
    : `<rect width="240" height="250" fill="url(#sc-day)"/>
       <path d="M-10 172 Q40 120 100 160 Q150 128 250 168 L250 180 L-10 180 Z" fill="url(#sc-hill2)"/>
       ${cloud(54, 46, .7, "a-cloud")}${cloud(178, 30, .5, "a-cloud slow")}
       <rect x="0" y="168" width="240" height="82" fill="url(#sc-water)"/>
       ${waves(176, "#fff", .8)}${waves(206, "#6FC0CE", .6).replace("a-wave", "a-wave rev")}`;
  const front = (y, night) => `<rect x="0" y="${y}" width="240" height="${250 - y}" fill="url(#${night ? "sc-waterN" : "sc-water"})" opacity=".94"/>${waves(y + 4, night ? "#7FA6C6" : "#fff", .75)}`;
  const ring = (x, y, d) => `<ellipse class="a-ripple" style="animation-delay:${d}s;transform-origin:${x}px ${y}px" cx="${x}" cy="${y}" rx="14" ry="4" fill="none" stroke="#fff" stroke-width="2.5"/>`;

  function scene(id, withOllie) {
    const O = withOllie;
    let inner = "", label = "";
    switch (id) {
      case "juggle":
        label = "Shells juggling over the river";
        inner = riverBg()
          + (O ? at(48, 74, .72, otter("joy", "up")) + front(196) : `${ring(120, 196, 0)}${ring(120, 196, 1.4)}`)
          + `<g class="a-orbit" style="transform-origin:120px ${O ? 52 : 108}px">${smallShell(120, O ? 18 : 64, O ? 1 : 1.5)}${smallShell(O ? 150 : 162, O ? 70 : 132, O ? 1 : 1.5)}${smallShell(O ? 90 : 78, O ? 70 : 132, O ? 1 : 1.5)}</g>`
          + (O ? "" : front(200));
        break;
      case "leap":
        label = "A fish leaping over the river";
        inner = riverBg()
          + (O ? `<g class="a-bob">${at(70, 112, .5, otter("star", "up"))}</g>` : "")
          + `<g class="a-leap" style="transform-origin:20px 196px"><g transform="translate(20 196)">${fishShape}</g></g>`
          + front(198) + ring(28, 200, 0) + ring(214, 200, 1.1)
          + `<g class="a-drops" fill="#fff">${[[30, 188], [38, 184], [206, 186], [218, 182]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`).join("")}</g>`;
        break;
      case "moon":
        label = "Floating under the moon";
        inner = riverBg(true)
          + `<g class="a-bob" style="transform-origin:${O ? 120 : 110}px 200px">${O
              ? at(74, 108, .46, otter("content", "hold", smallShell(100, 174, 1.6))) + `<g transform="translate(150 200)">${leafShape}</g>`
              : `<g transform="translate(110 192) scale(1.6)">${leafShape}</g>${smallShell(112, 178, 1.3)}`}</g>`
          + front(204, true);
        break;
      case "sunrise":
        label = "The sun rising over the hills";
        inner = `<rect width="240" height="250" fill="url(#sc-dawn)"/>
          <g class="a-sunrise" style="transform-origin:120px 170px"><circle cx="120" cy="150" r="60" fill="url(#sc-glow)"/><circle cx="120" cy="150" r="30" fill="url(#sc-sun)"/></g>
          ${cloud(46, 70, .62, "a-cloud")}${cloud(196, 52, .5, "a-cloud slow")}
          <g class="a-fly">${bird(-20, 96, 1)}${bird(-48, 112, .8)}</g>
          <path d="M-10 190 Q50 140 120 176 Q180 146 250 186 L250 250 L-10 250 Z" fill="url(#sc-hill2)"/>
          <path d="M-10 214 Q70 176 150 206 Q200 190 250 206 L250 250 L-10 250 Z" fill="url(#sc-hill)"/>`
          + (O ? at(116, 112, .54, otter("happy", "wave")) : `<g class="a-sway" style="transform-origin:60px 214px"><path d="M60 214 L60 192" stroke="#3B9150" stroke-width="3"/><circle cx="60" cy="188" r="6" fill="#FFCB4D"/><circle cx="60" cy="188" r="2.5" fill="#E58A2B"/></g>
              <g class="a-sway slow" style="transform-origin:176px 212px"><path d="M176 212 L176 194" stroke="#3B9150" stroke-width="3"/><circle cx="176" cy="190" r="5" fill="#F59AA5"/><circle cx="176" cy="190" r="2" fill="#fff"/></g>`);
        break;
      case "boat": {
        label = "A little boat sailing at sunset";
        const boat = `<g class="a-rock" style="transform-origin:0px 6px">
            <path d="M-16 0 L-16 -58" stroke="#8A5A3A" stroke-width="3" stroke-linecap="round"/><path d="M-18 -56 L-18 -8 L-50 -8 Z" fill="url(#sc-boat)" stroke="#9FBFCC" stroke-width="1.5" stroke-linejoin="round"/>
            ${O ? at(-10, -60, .32, otter("joy", "up")) : smallShell(20, -10, 1.2)}
            <path d="M-46 -2 L46 -2 L34 16 L-34 16 Z" fill="url(#sc-hull)"/><path d="M-40 4 L40 4" stroke="#fff" stroke-width="2" opacity=".45"/></g>`;
        inner = `<rect width="240" height="250" fill="url(#sc-dusk)"/>
          <circle cx="60" cy="150" r="46" fill="url(#sc-glow)"/><circle cx="60" cy="150" r="22" fill="url(#sc-sun)" opacity=".9"/>
          ${cloud(170, 54, .55, "a-cloud")}
          <rect x="0" y="168" width="240" height="82" fill="url(#sc-water)"/>${waves(178, "#fff", .7)}
          <g class="a-sail2"><g transform="translate(-60 182)">${boat}</g>${bird(-40, 104, .8, "a-follow")}</g>
          ${front(206)}`;
        break;
      }
    }
    return `<svg class="anim-svg clip scene" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}${O ? ", with Ollie" : ""}">${inner}</svg>`;
  }

  function trick(id) {
    if (SCENES.some(x => x.id === id)) return scene(id, true);
    let inner;
    switch (id) {
      case "juggle":
        inner = `${at(34, 56, .86, otter("joy", "up"))}
          <g class="a-orbit" style="transform-origin:120px 40px">${smallShell(120, 6, 1)}${smallShell(150, 58, 1)}${smallShell(90, 58, 1)}</g>`; break;
      case "slide":
        inner = `<path d="M0 40 L240 200 L240 250 L0 250 Z" fill="#E9D8C2"/><path d="M0 40 L240 200" stroke="#CDB394" stroke-width="5"/>
          ${water(236)}<g class="a-slide">${at(-4, -2, .42, `<g transform="rotate(34 100 110)">${otter("joy", "up")}</g>`)}</g>
          <g class="a-splash" fill="${C.waterLine}"><circle cx="206" cy="214" r="6"/><circle cx="222" cy="206" r="4"/><circle cx="192" cy="208" r="4"/></g>`; break;
      case "spin":
        inner = `${sparkles.replace('class="o-sparkles"', 'class="o-sparkles" transform="translate(20 10)"')}<g class="a-twirl" style="transform-origin:120px 150px">${at(34, 40, .86, otter("star", "up"))}</g>`; break;
      case "float":
        inner = `<g class="a-bob">${at(42, 36, .8, otter("content", "hold", smallShell(100, 174, 1.6)))}</g>${water(226)}
          <g class="a-bubbles"><circle cx="40" cy="200" r="5" fill="${C.water}"/><circle cx="200" cy="196" r="7" fill="${C.water}"/><circle cx="215" cy="170" r="4" fill="${C.water}"/></g>`; break;
      case "dance":
        inner = `<g class="a-wiggle" style="transform-origin:120px 240px">${at(34, 48, .86, otter("joy", "clap"))}</g>
          <g class="a-notes" fill="${C.scarf}" font-family="sans-serif" font-size="30"><text x="20" y="62">&#9834;</text><text x="200" y="46">&#9835;</text><text x="196" y="124">&#9834;</text></g>`; break;
      case "drift":   // sad: drifting away from his family raft
        inner = `${water(196)}<g opacity=".85">${[30, 54, 78].map(x => `<circle cx="${x}" cy="170" r="12" fill="${C.furDk}"/><circle cx="${x}" cy="166" r="5" fill="${C.cream}" opacity=".7"/>`).join("")}</g>
          <g class="a-drift">${at(116, 52, .56, otter("sad", "hold", "", { droop: true }))}</g>
          <rect x="0" y="182" width="240" height="68" fill="${C.water}" opacity=".85"/>`; break;
      case "gift":
        inner = `${sparkles}${at(32, 22, .9, otter("happy", "hold", smallShell(100, 174, 1.9)))}`; break;
      case "giftWe":  // same gift moment without a character
        inner = `${sparkles}<g class="a-pop" style="transform-origin:120px 130px">${smallShell(120, 128, 4.6)}</g>`; break;
    }
    return `<svg class="anim-svg" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${id === "giftWe" ? "A shell" : "Ollie"}">${inner}</svg>`;
  }
  function neutralAnim(id) {
    if (SCENES.some(x => x.id === id)) return scene(id, false);
    let inner = "";
    const bg = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>`;
    switch (id) {
      case "bubbles":
        for (let i = 0; i < 9; i++) inner += `<circle class="a-rise" style="animation-delay:${(i * 0.7).toFixed(1)}s" cx="${30 + i * 23}" cy="240" r="${5 + (i % 3) * 4}" fill="none" stroke="#1F7A8C" stroke-width="2.5"/>`;
        inner = bg + inner; break;
      case "boat":
        inner = `${bg}<g class="a-sail"><path d="M-60 160 L-10 160 L-20 176 L-50 176 Z" fill="#F2B544"/><path d="M-35 158 L-35 112 L-12 156 Z" fill="#fff" stroke="#1F7A8C" stroke-width="2"/></g>${water(196)}`; break;
      case "spiral":
        for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180, r = 20 + i * 6; inner += `<circle cx="${(120 + r * Math.cos(a)).toFixed(1)}" cy="${(125 + r * Math.sin(a)).toFixed(1)}" r="${4 + i * 0.5}" fill="${i % 2 ? "#F4B6A6" : "#F2B544"}"/>`; }
        inner = `${bg}<g class="a-spin" style="transform-origin:120px 125px">${inner}</g>`; break;
      case "ripples":
        for (let i = 0; i < 4; i++) inner += `<circle class="a-ripple" style="animation-delay:${i}s;transform-origin:120px 125px" cx="120" cy="125" r="40" fill="none" stroke="#1F7A8C" stroke-width="3"/>`;
        inner = `${bg}${inner}<circle cx="120" cy="125" r="6" fill="#1F7A8C"/>`; break;
      case "stars":
        for (let i = 0; i < 10; i++) inner += `<g class="a-twinkle" style="animation-delay:${(i * 0.37).toFixed(2)}s;transform-origin:${30 + (i * 53) % 190}px ${30 + (i * 71) % 190}px">${starAt(30 + (i * 53) % 190, 30 + (i * 71) % 190, 6 + (i % 3) * 3, i % 2 ? "#F2B544" : "#1F7A8C")}</g>`;
        inner = bg + inner; break;
    }
    return `<svg class="anim-svg clip" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Short animation">${inner}</svg>`;
  }

  /* -------------------------- word pictures --------------------------- */
  const COL = { red: "#E04848", blue: "#2F6FD6" };
  const ICON = {
    mira: c => `<path d="M14 50 Q40 22 66 50 Q40 78 14 50 Z" fill="${c || "#F2A93B"}"/><path d="M64 50 L88 32 L84 50 L88 68 Z" fill="${c || "#F2A93B"}"/><circle cx="30" cy="46" r="4" fill="#24343A"/><path d="M42 38 Q48 50 42 62" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
    pela: c => `<rect x="8" y="22" width="84" height="56" rx="18" fill="${c || "#5DB3C9"}"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M18 42 q8 -7 16 0 t16 0 t16 0 t16 0"/><path d="M18 60 q8 -7 16 0 t16 0 t16 0 t16 0"/></g>`,
    suna: c => `<path d="M62 14 A38 38 0 1 0 62 86 A40 40 0 0 1 62 14 Z" fill="${c || "#F2C94C"}"/><circle cx="32" cy="40" r="4" fill="#fff" opacity=".45"/><circle cx="28" cy="62" r="3" fill="#fff" opacity=".45"/>`,
    tavo: c => `<path d="M16 64 Q12 36 40 26 Q70 18 84 42 Q92 66 66 76 Q34 84 16 64 Z" fill="${c || "#9AA6AE"}"/><path d="M34 38 Q46 32 58 36" fill="none" stroke="#fff" stroke-width="4" opacity=".45" stroke-linecap="round"/>`,
    kelo: c => `<path d="M50 86 L14 40 Q50 4 86 40 Z" fill="${c || "#F4B6A6"}" stroke-linejoin="round"/><g stroke="#fff" stroke-width="3.5" opacity=".7" stroke-linecap="round"><path d="M50 84 L32 30"/><path d="M50 84 L50 24"/><path d="M50 84 L68 30"/></g><rect x="40" y="82" width="20" height="8" rx="4" fill="${c || "#E59A87"}"/>`,
    bino: c => `<path d="M14 82 Q14 24 82 16 Q86 78 14 82 Z" fill="${c || "#5BAE6A"}"/><path d="M16 80 Q46 52 78 20" fill="none" stroke="#fff" stroke-width="3.5" opacity=".6" stroke-linecap="round"/>`,
    sola: c => `<g stroke="${c || "#F5B32E"}" stroke-width="6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<path d="M${(50 + 30 * Math.cos(r)).toFixed(1)} ${(50 + 30 * Math.sin(r)).toFixed(1)} L${(50 + 42 * Math.cos(r)).toFixed(1)} ${(50 + 42 * Math.sin(r)).toFixed(1)}"/>`; }).join("")}</g><circle cx="50" cy="50" r="22" fill="${c || "#F5B32E"}"/><circle cx="43" cy="43" r="5" fill="#fff" opacity=".4"/>`,
    vira: c => `<ellipse cx="46" cy="56" rx="30" ry="22" fill="${c || "#4FA3D9"}"/><circle cx="70" cy="38" r="15" fill="${c || "#4FA3D9"}"/><path d="M83 38 L96 42 L83 46 Z" fill="#F2A93B"/><circle cx="73" cy="35" r="3.2" fill="#24343A"/><path d="M30 52 Q46 40 58 56 Q44 64 30 52 Z" fill="#fff" opacity=".4"/><path d="M18 52 L4 44 L8 60 Z" fill="${c || "#4FA3D9"}"/><path d="M40 77 L38 88 M52 77 L54 88" stroke="#F2A93B" stroke-width="3" stroke-linecap="round"/>`,
    nubo: c => `<path d="M22 72 Q6 72 8 58 Q10 44 26 46 Q28 26 48 26 Q66 26 70 42 Q90 40 92 58 Q94 72 78 72 Z" fill="${c || "#B9D6E8"}"/><path d="M26 58 Q36 52 46 58" fill="none" stroke="#fff" stroke-width="4" opacity=".7" stroke-linecap="round"/>`,
    lido: c => `<path d="M8 58 L92 58 L78 80 L22 80 Z" fill="${c || "#B07A52"}"/><path d="M50 56 L50 14" stroke="#7E5034" stroke-width="4" stroke-linecap="round"/><path d="M53 16 L80 50 L53 50 Z" fill="${c ? "#fff" : "#FFFFFF"}" stroke="${c || "#1F7A8C"}" stroke-width="3" stroke-linejoin="round"/><path d="M20 66 L80 66" stroke="#fff" stroke-width="3" opacity=".4"/>`
  };
  function icon(p) {
    const s = p.size === "big" ? 1.3 : p.size === "small" ? 0.58 : 1;
    const c = p.color ? COL[p.color] : null;
    return `<span class="pic" style="--s:${s}"><svg viewBox="0 0 100 100" aria-hidden="true">${ICON[p.n](c)}</svg></span>`;
  }

  /* ------------------------------- logo ------------------------------- */
  const logo = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#1F7A8C"/>
    <path d="M8 24 q4 -4 8 0 t8 0 t8 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 21 L12 11 Q20 4 28 11 Z" fill="#F2B544"/></svg>`;

  return { ollie, MOTION, trick, neutralAnim, scene, SCENES, TRICKS, NEUTRAL, icon, logo, heartAt, ensureDefs };
})();
