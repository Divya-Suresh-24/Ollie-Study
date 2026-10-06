/* =========================================================================
   ART — inline SVG (no image files)
   • Ollie the otter: moods talk, wave, cheer, sad, worried, think, shell
   • Ollie tricks (animated): juggle, flip, float, dance
   • Neutral animations for versions without Ollie: bubbles, boat, spiral, ripples
   • Word pictures for Pelan nouns, with size and color
   • App logo
   ========================================================================= */
window.Art = (function () {
  const C = {
    fur: "#B07A52", furDk: "#8E5D3B", cream: "#FFF0DC", dark: "#2B1B14", pink: "#F29AA3",
    mouth: "#7A2E35", tongue: "#F07C8A", blush: "#FF9E9E", tear: "#7FD0EE",
    scarf: "#1F9AA8", stripe: "#FFC94D", water: "#BFE6EA", waterLine: "#86CCD5"
  };

  /* ------------------------------ Ollie ------------------------------- */
  // Round, big-headed otter. viewBox 0 0 200 210.
  const limb = (cx, cy, r, cls = "") => `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="11" ry="19" transform="rotate(${r} ${cx} ${cy})" fill="${C.fur}" stroke="${C.furDk}" stroke-width="1.5"/>`;
  function arms(pose) {
    switch (pose) {
      case "up":    return `<g class="o-arms">${limb(48, 132, 35)}${limb(152, 132, -35)}</g>`;
      case "wave":  return limb(66, 168, 18) + `<g class="o-wave">${limb(152, 132, -35)}</g>`;
      case "thumb": return limb(66, 168, 18) + limb(146, 140, -20);
      case "hold":  return limb(80, 170, -55) + limb(120, 170, 55);
      default:      return limb(66, 168, 18) + limb(134, 168, -18);
    }
  }
  function eyes(kind) {
    const e = (x, dy = 0) => `<ellipse cx="${x}" cy="${94 + dy}" rx="10.5" ry="12.5" fill="${C.dark}"/>
      <circle cx="${x - 3.5}" cy="${89 + dy}" r="4.2" fill="#fff"/><circle cx="${x + 4}" cy="${99 + dy}" r="2" fill="#fff"/>`;
    const arc = `<g fill="none" stroke="${C.dark}" stroke-width="4.5" stroke-linecap="round">`;
    if (kind === "closed") return `${arc}<path d="M66 96 Q76 84 86 96"/><path d="M114 96 Q124 84 134 96"/></g>`;
    if (kind === "sleepy") return `${arc}<path d="M66 94 Q76 100 86 94"/><path d="M114 94 Q124 100 134 94"/></g>`;
    if (kind === "up") return `<g class="o-eyes">${e(78, -3)}${e(126, -3)}</g>`;
    return `<g class="o-eyes">${e(76)}${e(124)}</g>`;
  }
  function face(m) {
    let ey = "normal", mouth, brows = "", extra = "";
    const smileOpen = `<path d="M89 117 Q100 134 111 117 Z" fill="${C.mouth}"/><ellipse cx="100" cy="125" rx="6" ry="3.6" fill="${C.tongue}"/>`;
    switch (m) {
      case "happy": mouth = smileOpen; break;
      case "joy": ey = "closed"; mouth = `<path d="M86 116 Q100 138 114 116 Z" fill="${C.mouth}"/><ellipse cx="100" cy="127" rx="7" ry="4" fill="${C.tongue}"/>`; break;
      case "sad":
        brows = `<g stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"><path d="M64 76 L84 70"/><path d="M136 76 L116 70"/></g>`;
        mouth = `<path d="M90 125 Q100 115 110 125" fill="none" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
        extra = `<g class="o-tears"><path d="M70 106 q-4 12 0 18 q4 -6 0 -18z" fill="${C.tear}"/><path d="M130 106 q-4 12 0 18 q4 -6 0 -18z" fill="${C.tear}"/></g>`; break;
      case "worried":
        brows = `<g stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"><path d="M64 75 L84 71"/><path d="M136 75 L116 71"/></g>`;
        mouth = `<path d="M90 121 q5 -5 10 0 q5 5 10 0" fill="none" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
        extra = `<path d="M152 62 q-7 11 0 15 q7 -4 0 -15z" fill="${C.tear}"/>`; break;
      case "think": ey = "up"; mouth = `<circle cx="104" cy="120" r="4" fill="${C.mouth}"/>`; break;
      case "sleepy": ey = "sleepy"; mouth = `<ellipse cx="100" cy="120" rx="4" ry="3" fill="${C.mouth}"/>`; break;
      default: mouth = `<path d="M92 116 q4 5 8 0 q4 5 8 0" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="100" cy="110" rx="46" ry="33" fill="${C.cream}"/>
      <ellipse cx="62" cy="115" rx="10" ry="6" fill="${C.blush}" opacity=".55"/>
      <ellipse cx="138" cy="115" rx="10" ry="6" fill="${C.blush}" opacity=".55"/>
      ${brows}${eyes(ey)}
      <path d="M90 105 Q100 98 110 105 Q107 113 100 114 Q93 113 90 105 Z" fill="${C.dark}"/>
      <ellipse cx="96" cy="104" rx="3" ry="1.6" fill="#fff" opacity=".7"/>
      <g fill="${C.furDk}" opacity=".7"><circle cx="78" cy="113" r="1.6"/><circle cx="73" cy="118" r="1.6"/><circle cx="122" cy="113" r="1.6"/><circle cx="127" cy="118" r="1.6"/></g>
      ${mouth}${extra}`;
  }
  const smallShell = (x, y, s = 1) => `<g class="o-shell" transform="translate(${x} ${y}) scale(${s})"><path d="M0 14 L-13 -4 Q0 -16 13 -4 Z" fill="#FFB8A8" stroke="#E08974" stroke-width="2" stroke-linejoin="round"/><path d="M0 14 L-6 -8 M0 14 L0 -10 M0 14 L6 -8" stroke="#E08974" stroke-width="1.6"/></g>`;
  const scarf = `<g class="o-scarf"><path d="M56 146 Q100 166 144 146 L142 158 Q100 178 58 158 Z" fill="${C.scarf}"/>
    <circle cx="80" cy="160" r="2.6" fill="${C.stripe}"/><circle cx="100" cy="164" r="2.6" fill="${C.stripe}"/><circle cx="120" cy="160" r="2.6" fill="${C.stripe}"/>
    <path d="M126 158 L138 182 L122 178 Z" fill="${C.scarf}"/></g>`;

  function otter(m, pose = "down", extras = "") {
    const front = pose === "hold";
    return `
      <ellipse class="o-tail" cx="152" cy="186" rx="13" ry="28" transform="rotate(-55 152 186)" fill="${C.furDk}"/>
      ${pose === "up" || pose === "wave" ? arms(pose) : ""}
      <ellipse cx="100" cy="164" rx="46" ry="40" fill="${C.fur}"/>
      <ellipse cx="100" cy="170" rx="29" ry="27" fill="${C.cream}"/>
      <ellipse cx="78" cy="202" rx="15" ry="8" fill="${C.furDk}"/><ellipse cx="122" cy="202" rx="15" ry="8" fill="${C.furDk}"/>
      ${!front && pose !== "up" && pose !== "wave" ? arms(pose) : ""}
      ${front ? extras + arms(pose) : extras}
      <circle cx="52" cy="42" r="13" fill="${C.fur}"/><circle cx="52" cy="42" r="6.5" fill="${C.pink}" opacity=".7"/>
      <circle cx="148" cy="42" r="13" fill="${C.fur}"/><circle cx="148" cy="42" r="6.5" fill="${C.pink}" opacity=".7"/>
      <circle cx="100" cy="88" r="64" fill="${C.fur}"/>
      <path d="M90 28 q5 -12 10 -1 q5 -12 10 1" fill="${C.fur}" stroke="${C.furDk}" stroke-width="2" stroke-linejoin="round"/>
      ${face(m)}
      ${scarf}`;
  }
  const sparkles = `<g class="o-sparkles" fill="#FFC94D">
      <path d="M22 50 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z"/>
      <path d="M176 28 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z"/>
      <path d="M182 104 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#7FD0EE"/>
      <circle cx="30" cy="112" r="4" fill="#F29AA3"/></g>`;

  function ollie(mood = "talk", { cls = "" } = {}) {
    let inner;
    switch (mood) {
      case "wave":    inner = otter("happy", "wave"); break;
      case "cheer":   inner = sparkles + otter("joy", "up"); break;
      case "happy":   inner = otter("happy", "down"); break;
      case "encourage": inner = otter("happy", "thumb"); break;
      case "sad":     inner = otter("sad", "hold"); break;
      case "worried": inner = otter("worried", "hold", smallShell(100, 166, 1.5)); break;
      case "think":   inner = otter("think", "down") + `<text x="164" y="46" font-size="36" font-weight="800" fill="${C.scarf}" font-family="Baloo 2, sans-serif">?</text>`; break;
      case "shell":   inner = sparkles + otter("happy", "hold", smallShell(100, 166, 1.5)); break;
      case "sleepy":  inner = otter("sleepy", "down") + `<text x="160" y="40" font-size="24" font-weight="800" fill="${C.scarf}" font-family="Baloo 2, sans-serif">z</text>`; break;
      default:        inner = otter("talk", "down");
    }
    return `<svg class="ollie ${cls}" viewBox="0 -4 200 214" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie the otter">${inner}</svg>`;
  }

  /* ------------------------------ tricks ------------------------------ */
  // Ollie's playful moments (versions with Ollie) and neutral equivalents.
  const TRICKS = [
    { id: "juggle", title: "Shell juggling" },
    { id: "slide",  title: "Belly slide" },
    { id: "float",  title: "River float" },
    { id: "dance",  title: "Happy dance" }
  ];
  const NEUTRAL = [
    { id: "bubbles", title: "Bubbles" },
    { id: "boat",    title: "Paper boat" },
    { id: "spiral",  title: "Shell spiral" },
    { id: "ripples", title: "Ripples" }
  ];
  const water = (y = 226) => `<g><ellipse cx="120" cy="${y}" rx="140" ry="26" fill="${C.water}"/>
      <path class="a-wave" d="M-20 ${y - 4} q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="${C.waterLine}" stroke-width="3" stroke-linecap="round"/></g>`;
  const at = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;

  function trick(id) {
    let inner;
    switch (id) {
      case "juggle":
        inner = `${at(30, 62, .9, otter("joy", "up"))}
          <g class="a-orbit" style="transform-origin:120px 40px">${smallShell(120, 6, 1)}${smallShell(150, 58, 1)}${smallShell(90, 58, 1)}</g>`; break;
      case "slide":
        inner = `<path d="M0 40 L240 200 L240 250 L0 250 Z" fill="#E6D3BC"/><path d="M0 40 L240 200" stroke="#C9AE8E" stroke-width="5"/>
          ${water(236)}<g class="a-slide">${at(-20, -30, .45, `<g transform="rotate(34 100 110)">${otter("joy", "up")}</g>`)}</g>
          <g class="a-splash" fill="${C.waterLine}"><circle cx="206" cy="214" r="6"/><circle cx="222" cy="206" r="4"/><circle cx="192" cy="208" r="4"/></g>`; break;
      case "float":
        inner = `<g class="a-bob">${at(40, 40, .8, otter("happy", "hold", smallShell(100, 166, 1.5)))}</g>${water(226)}
          <g class="a-bubbles"><circle cx="40" cy="200" r="5" fill="${C.water}"/><circle cx="200" cy="196" r="7" fill="${C.water}"/><circle cx="215" cy="170" r="4" fill="${C.water}"/></g>`; break;
      case "dance":
        inner = `<g class="a-wiggle" style="transform-origin:120px 240px">${at(30, 52, .9, otter("joy", "up"))}</g>
          <g class="a-notes" fill="${C.scarf}" font-family="sans-serif" font-size="28"><text x="22" y="60">&#9834;</text><text x="200" y="44">&#9835;</text><text x="196" y="120">&#9834;</text></g>`; break;
      case "drift":   // sad: drifting away from the raft
        inner = `${water(196)}<g opacity=".8">${[30, 52, 74].map(x => `<circle cx="${x}" cy="170" r="11" fill="${C.furDk}"/>`).join("")}</g>
          <g class="a-drift">${at(120, 60, .55, otter("sad", "hold"))}</g>
          <rect x="0" y="182" width="240" height="68" fill="${C.water}" opacity=".85"/>`; break;
      case "gift":
        inner = `${sparkles}${at(30, 30, .9, otter("happy", "hold", smallShell(100, 166, 1.7)))}`; break;
    }
    return `<svg class="anim-svg" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie">${inner}</svg>`;
  }
  function neutralAnim(id) {
    let inner = "";
    switch (id) {
      case "bubbles":
        for (let i = 0; i < 9; i++) inner += `<circle class="a-rise" style="animation-delay:${(i * 0.7).toFixed(1)}s" cx="${30 + i * 23}" cy="240" r="${5 + (i % 3) * 4}" fill="none" stroke="#1F7A8C" stroke-width="2.5"/>`;
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>${inner}`; break;
      case "boat":
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>
          <g class="a-sail"><path d="M-60 160 L-10 160 L-20 176 L-50 176 Z" fill="#F2B544"/><path d="M-35 158 L-35 112 L-12 156 Z" fill="#fff" stroke="#1F7A8C" stroke-width="2"/></g>${water(196)}`; break;
      case "spiral":
        for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180, r = 20 + i * 6; inner += `<circle cx="${(120 + r * Math.cos(a)).toFixed(1)}" cy="${(125 + r * Math.sin(a)).toFixed(1)}" r="${4 + i * 0.5}" fill="${i % 2 ? "#F4B6A6" : "#F2B544"}"/>`; }
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/><g class="a-spin" style="transform-origin:120px 125px">${inner}</g>`; break;
      case "ripples":
        for (let i = 0; i < 4; i++) inner += `<circle class="a-ripple" style="animation-delay:${i}s;transform-origin:120px 125px" cx="120" cy="125" r="40" fill="none" stroke="#1F7A8C" stroke-width="3"/>`;
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>${inner}<circle cx="120" cy="125" r="6" fill="#1F7A8C"/>`; break;
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
    bino: c => `<path d="M14 82 Q14 24 82 16 Q86 78 14 82 Z" fill="${c || "#5BAE6A"}"/><path d="M16 80 Q46 52 78 20" fill="none" stroke="#fff" stroke-width="3.5" opacity=".6" stroke-linecap="round"/>`
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

  return { ollie, trick, neutralAnim, TRICKS, NEUTRAL, icon, logo };
})();
