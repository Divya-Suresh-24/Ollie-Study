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
    fur: "#93654A", shade: "#77503A", cream: "#F6E5D1", dark: "#2A1C15", tail: "#6A4430",
    pink: "#E58A8F", mouth: "#743133", blush: "#EFA09A", tear: "#86CBE3",
    scarf: "#1F7A8C", stripe: "#F2B544", water: "#BFE3E6", waterLine: "#8CCBD2"
  };

  /* ------------------------------ Ollie ------------------------------- */
  function arm(cx, cy, r) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="11.5" ry="24" transform="rotate(${r} ${cx} ${cy})" fill="${C.fur}" stroke="${C.shade}" stroke-width="1.5"/>`;
  }
  function arms(pose) {
    if (pose === "up")    return `<g class="o-arms">${arm(50, 116, -32)}${arm(150, 116, 32)}</g>`;
    if (pose === "hold")  return arm(76, 158, -48) + arm(124, 158, 48);
    if (pose === "chin")  return arm(58, 160, 12) + arm(128, 128, 50);
    return arm(56, 160, 14) + arm(144, 160, -14);
  }
  function face(expr) {
    const eye = x => `<circle cx="${x}" cy="78" r="6.5" fill="${C.dark}"/><circle cx="${x + 2}" cy="75.6" r="2.3" fill="#fff"/>`;
    let eyes = eye(82) + eye(118), mouth, brows = "", extra = "";
    switch (expr) {
      case "happy":
        mouth = `<path d="M90 97 Q100 113 110 97 Z" fill="${C.mouth}"/><ellipse cx="100" cy="104" rx="5.5" ry="3" fill="${C.pink}"/>`; break;
      case "joy":
        eyes = `<g fill="none" stroke="${C.dark}" stroke-width="4" stroke-linecap="round"><path d="M75 80 Q82 71 89 80"/><path d="M111 80 Q118 71 125 80"/></g>`;
        mouth = `<path d="M88 96 Q100 116 112 96 Z" fill="${C.mouth}"/><ellipse cx="100" cy="105" rx="6" ry="3.4" fill="${C.pink}"/>`; break;
      case "sad":
        brows = `<g stroke="${C.dark}" stroke-width="3" stroke-linecap="round"><path d="M73 70 L88 64"/><path d="M127 70 L112 64"/></g>`;
        mouth = `<path d="M91 105 Q100 97 109 105" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
        extra = `<g class="o-tears"><rect x="78" y="83" width="7" height="20" rx="3.5" fill="${C.tear}"/><rect x="115" y="83" width="7" height="20" rx="3.5" fill="${C.tear}"/></g>`; break;
      case "worried":
        brows = `<g stroke="${C.dark}" stroke-width="3" stroke-linecap="round"><path d="M73 69 L88 64"/><path d="M127 69 L112 64"/></g>`;
        mouth = `<path d="M90 103 q5 -5 10 0 q5 5 10 0" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
        extra = `<path d="M143 48 q-6 10 0 13 q6 -3 0 -13z" fill="${C.tear}"/>`; break;
      case "think":
        eyes = eye(84).replace(/cy="78"/g, 'cy="74"') + eye(120).replace(/cy="78"/g, 'cy="74"');
        mouth = `<path d="M93 101 L108 99" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`; break;
      default:
        mouth = `<path d="M91 98 Q100 107 109 98" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="100" cy="93" rx="38" ry="23" fill="${C.cream}"/>
      <ellipse cx="70" cy="95" rx="7" ry="4" fill="${C.blush}" opacity=".5"/>
      <ellipse cx="130" cy="95" rx="7" ry="4" fill="${C.blush}" opacity=".5"/>
      ${brows}${eyes}
      <ellipse cx="100" cy="89" rx="9.5" ry="6.5" fill="${C.dark}"/>
      <ellipse cx="97" cy="87" rx="3" ry="1.6" fill="#fff" opacity=".6"/>
      <g fill="${C.shade}"><circle cx="80" cy="97" r="1.6"/><circle cx="75" cy="101" r="1.6"/><circle cx="81" cy="103" r="1.6"/><circle cx="120" cy="97" r="1.6"/><circle cx="125" cy="101" r="1.6"/><circle cx="119" cy="103" r="1.6"/></g>
      ${mouth}${extra}`;
  }
  const scarf = `
    <path d="M62 116 Q100 134 138 116 L136 128 Q100 146 64 128 Z" fill="${C.scarf}"/>
    <path d="M78 124 L84 126 M96 129 L102 129 M116 126 L122 124" stroke="${C.stripe}" stroke-width="4" stroke-linecap="round"/>
    <path d="M122 126 L132 156 L118 152 Z" fill="${C.scarf}"/>`;
  const smallShell = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 14 L-13 -4 Q0 -16 13 -4 Z" fill="#F4B6A6" stroke="#D98C7A" stroke-width="2" stroke-linejoin="round"/><path d="M0 14 L-6 -8 M0 14 L0 -10 M0 14 L6 -8" stroke="#D98C7A" stroke-width="1.6"/></g>`;

  function otter(expr, pose, extras = "") {
    return `
      <ellipse class="o-tail" cx="148" cy="182" rx="13" ry="24" transform="rotate(-35 148 182)" fill="${C.tail}"/>
      ${pose === "up" ? arms(pose) : ""}
      <ellipse cx="100" cy="152" rx="50" ry="54" fill="${C.fur}"/>
      <ellipse cx="100" cy="162" rx="30" ry="34" fill="${C.cream}"/>
      <ellipse cx="78" cy="204" rx="18" ry="9" fill="${C.fur}"/><ellipse cx="122" cy="204" rx="18" ry="9" fill="${C.fur}"/>
      ${pose !== "up" && pose !== "hold" ? arms(pose) : ""}
      ${pose === "hold" ? arms(pose) : ""}
      ${extras}
      <circle cx="58" cy="56" r="11" fill="${C.fur}"/><circle cx="58" cy="56" r="5.5" fill="${C.shade}"/>
      <circle cx="142" cy="56" r="11" fill="${C.fur}"/><circle cx="142" cy="56" r="5.5" fill="${C.shade}"/>
      <ellipse cx="100" cy="82" rx="53" ry="40" fill="${C.fur}"/>
      ${face(expr)}
      ${scarf}`;
  }
  const confetti = `
    <g class="o-confetti">
      <rect x="18" y="40" width="9" height="4" rx="2" fill="#F2B544" transform="rotate(-30 22 42)"/>
      <rect x="176" y="34" width="9" height="4" rx="2" fill="#2F9461" transform="rotate(25 180 36)"/>
      <circle cx="30" cy="84" r="3.5" fill="#E58A8F"/><circle cx="172" cy="80" r="3.5" fill="#1F7A8C"/>
      <rect x="160" y="10" width="9" height="4" rx="2" fill="#E58A8F" transform="rotate(-20 164 12)"/>
      <rect x="32" y="10" width="9" height="4" rx="2" fill="#1F7A8C" transform="rotate(40 36 12)"/></g>`;

  function ollie(mood = "talk", { cls = "" } = {}) {
    let inner, vb = "0 0 200 216";
    switch (mood) {
      case "wave":    inner = otter("happy", "up"); break;
      case "cheer":   inner = confetti + otter("joy", "up"); break;
      case "sad":     inner = otter("sad", "hold"); break;
      case "worried": inner = otter("worried", "hold", smallShell(100, 150, 1.5)); break;
      case "think":   inner = otter("think", "chin") + `<text x="160" y="44" font-size="34" font-weight="800" fill="${C.scarf}" font-family="Baloo 2, sans-serif">?</text>`; break;
      case "shell":   inner = otter("happy", "hold", smallShell(100, 150, 1.5)); break;
      default:        inner = otter("talk", "down");
    }
    return `<svg class="ollie ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie the otter">${inner}</svg>`;
  }
  // A small round head, for pop-ups
  function ollieHead(expr = "happy") {
    return `<svg class="ollie-head" viewBox="40 36 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="58" cy="56" r="11" fill="${C.fur}"/><circle cx="58" cy="56" r="5.5" fill="${C.shade}"/>
      <circle cx="142" cy="56" r="11" fill="${C.fur}"/><circle cx="142" cy="56" r="5.5" fill="${C.shade}"/>
      <ellipse cx="100" cy="82" rx="53" ry="40" fill="${C.fur}"/>${face(expr)}</svg>`;
  }

  /* ------------------------------ tricks ------------------------------ */
  const TRICKS = [
    { id: "juggle", title: "Shell juggling", ollie: true },
    { id: "flip",   title: "Backflip",       ollie: true },
    { id: "float",  title: "River float",    ollie: true },
    { id: "dance",  title: "Happy dance",    ollie: true }
  ];
  const NEUTRAL = [
    { id: "bubbles", title: "Bubbles" },
    { id: "boat",    title: "Paper boat" },
    { id: "spiral",  title: "Shell spiral" },
    { id: "ripples", title: "Ripples" }
  ];
  const water = `<g><ellipse cx="120" cy="226" rx="128" ry="26" fill="${C.water}"/>
      <path class="a-wave" d="M-10 222 q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="${C.waterLine}" stroke-width="3" stroke-linecap="round"/></g>`;

  function trick(id) {
    let inner;
    switch (id) {
      case "juggle":
        inner = `<g transform="translate(20 50) scale(.92)">${otter("joy", "up")}</g>
          <g class="a-orbit" style="transform-origin:120px 26px">
            ${smallShell(120, -6, 1)}${smallShell(148, 42, 1)}${smallShell(92, 42, 1)}</g>`; break;
      case "flip":
        inner = `${water}<g class="a-flip" style="transform-origin:120px 140px"><g transform="translate(20 30)">${otter("joy", "up")}</g></g>`; break;
      case "float":
        inner = `<g class="a-bob"><g transform="translate(20 22)">${otter("happy", "hold", smallShell(100, 150, 1.5))}</g></g>${water}
          <g class="a-bubbles"><circle cx="40" cy="200" r="5" fill="${C.water}"/><circle cx="200" cy="196" r="7" fill="${C.water}"/><circle cx="215" cy="170" r="4" fill="${C.water}"/></g>`; break;
      case "dance":
        inner = `<g class="a-wiggle" style="transform-origin:120px 240px"><g transform="translate(20 30)">${otter("joy", "up")}</g></g>
          <g class="a-notes" fill="${C.scarf}" font-family="sans-serif" font-size="28"><text x="22" y="60">&#9834;</text><text x="200" y="44">&#9835;</text><text x="196" y="120">&#9834;</text></g>`; break;
    }
    return `<svg class="anim-svg" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie doing a trick">${inner}</svg>`;
  }
  function neutralAnim(id) {
    let inner = "";
    switch (id) {
      case "bubbles":
        for (let i = 0; i < 9; i++) inner += `<circle class="a-rise" style="animation-delay:${(i * 0.7).toFixed(1)}s" cx="${30 + i * 23}" cy="240" r="${5 + (i % 3) * 4}" fill="none" stroke="#1F7A8C" stroke-width="2.5"/>`;
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>${inner}`; break;
      case "boat":
        inner = `<rect x="0" y="0" width="240" height="250" rx="24" fill="#E3F2F3"/>
          <g class="a-sail"><path d="M-60 160 L-10 160 L-20 176 L-50 176 Z" fill="#F2B544"/><path d="M-35 158 L-35 112 L-12 156 Z" fill="#fff" stroke="#1F7A8C" stroke-width="2"/></g>
          ${water.replace('cy="226"', 'cy="196"').replace('M-10 222', 'M-10 182')}`; break;
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

  return { ollie, ollieHead, trick, neutralAnim, TRICKS, NEUTRAL, icon, logo };
})();
