/* =========================================================================
   OLLIE THE OTTER — inline SVG illustrations (no image files needed)
   Moods: wave, talk, cheer, river (group 1 prompt), gem (group 2 prompt)
   To use your own artwork instead, return an <img src="img/xxx.png"> here.
   ========================================================================= */
window.OllieArt = (function () {
  const C = {
    fur: "#A88B70", furShade: "#94775D", cream: "#F4E7D4", dark: "#3A2A22",
    tail: "#5B4031", pink: "#E07A84", mouth: "#7A3434", blush: "#E9A3A0",
    tear: "#8FD0E6", water: "#BFDDE3", waterLine: "#9CC9D3", gem: "#5BB7E8", gemLight: "#A8DDF5"
  };

  function arms(pose) {
    const a = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="11.5" ry="25" transform="rotate(${r} ${cx} ${cy})" fill="${C.fur}" stroke="${C.furShade}" stroke-width="1.5"/>`;
    const paw = (cx, cy) => `<g stroke="${C.furShade}" stroke-width="2" stroke-linecap="round"><path d="M${cx - 4} ${cy} l0 5"/><path d="M${cx} ${cy - 1} l0 5"/><path d="M${cx + 4} ${cy} l0 5"/></g>`;
    if (pose === "up")   return a(50, 118, -30) + a(150, 118, 30) + paw(40, 96) + paw(160, 96);
    if (pose === "hold") return a(74, 156, -45) + a(126, 156, 45);
    return a(55, 158, 14) + a(145, 158, -14);
  }

  function face(expr) {
    let eyes, mouth, brows = "", extra = "";
    const eye = (x) => `<circle cx="${x}" cy="78" r="6.5" fill="${C.dark}"/><circle cx="${x + 2}" cy="75.8" r="2.2" fill="#fff"/>`;
    eyes = eye(82) + eye(118);
    if (expr === "happy") {
      mouth = `<path d="M90 97 Q100 113 110 97 Z" fill="${C.mouth}"/><ellipse cx="100" cy="104" rx="5.5" ry="3" fill="${C.pink}"/>`;
    } else if (expr === "joy") {
      eyes = `<g fill="none" stroke="${C.dark}" stroke-width="4" stroke-linecap="round"><path d="M75 80 Q82 71 89 80"/><path d="M111 80 Q118 71 125 80"/></g>`;
      mouth = `<path d="M88 96 Q100 116 112 96 Z" fill="${C.mouth}"/><ellipse cx="100" cy="105" rx="6" ry="3.4" fill="${C.pink}"/>`;
    } else if (expr === "sad") {
      brows = `<g stroke="${C.dark}" stroke-width="3" stroke-linecap="round"><path d="M73 70 L88 64"/><path d="M127 70 L112 64"/></g>`;
      mouth = `<path d="M91 105 Q100 97 109 105" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
      extra = `<rect x="78" y="83" width="7" height="22" rx="3.5" fill="${C.tear}"/><rect x="115" y="83" width="7" height="22" rx="3.5" fill="${C.tear}"/>
               <path d="M81.5 104 q-5 8 0 11 q5 -3 0 -11z" fill="${C.tear}"/><path d="M118.5 104 q-5 8 0 11 q5 -3 0 -11z" fill="${C.tear}"/>`;
    } else if (expr === "worried") {
      brows = `<g stroke="${C.dark}" stroke-width="3" stroke-linecap="round"><path d="M73 69 L88 64"/><path d="M127 69 L112 64"/></g>`;
      mouth = `<path d="M90 103 q5 -5 10 0 q5 5 10 0" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
      extra = `<path d="M142 50 q-6 10 0 13 q6 -3 0 -13z" fill="${C.tear}"/>`;
    } else { // talk
      mouth = `<path d="M91 98 Q100 107 109 98" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="100" cy="93" rx="38" ry="23" fill="${C.cream}"/>
      <ellipse cx="70" cy="95" rx="7" ry="4" fill="${C.blush}" opacity=".45"/>
      <ellipse cx="130" cy="95" rx="7" ry="4" fill="${C.blush}" opacity=".45"/>
      ${brows}${eyes}
      <ellipse cx="100" cy="89" rx="9.5" ry="6.5" fill="${C.dark}"/>
      <ellipse cx="97" cy="87" rx="3" ry="1.6" fill="#fff" opacity=".6"/>
      <g fill="${C.furShade}"><circle cx="80" cy="97" r="1.6"/><circle cx="75" cy="101" r="1.6"/><circle cx="81" cy="103" r="1.6"/><circle cx="120" cy="97" r="1.6"/><circle cx="125" cy="101" r="1.6"/><circle cx="119" cy="103" r="1.6"/></g>
      ${mouth}${extra}`;
  }

  function otter(expr, pose, { gem = false } = {}) {
    return `
      <ellipse cx="148" cy="182" rx="13" ry="24" transform="rotate(-35 148 182)" fill="${C.tail}"/>
      ${pose === "up" ? arms(pose) : ""}
      <ellipse cx="100" cy="152" rx="50" ry="54" fill="${C.fur}"/>
      <ellipse cx="100" cy="160" rx="30" ry="36" fill="${C.cream}"/>
      <ellipse cx="78" cy="204" rx="18" ry="9" fill="${C.fur}"/>
      <ellipse cx="122" cy="204" rx="18" ry="9" fill="${C.fur}"/>
      <g stroke="${C.furShade}" stroke-width="2" stroke-linecap="round"><path d="M70 207 l0 -4"/><path d="M76 208 l0 -4"/><path d="M124 208 l0 -4"/><path d="M130 207 l0 -4"/></g>
      ${pose !== "up" && pose !== "hold" ? arms(pose) : ""}
      ${gem ? `<g transform="translate(0 2)"><polygon points="100,146 118,162 100,188 82,162" fill="${C.gem}"/><polygon points="100,146 108,162 100,188 92,162" fill="${C.gemLight}" opacity=".8"/><polygon points="82,162 118,162 100,150" fill="#fff" opacity=".25"/></g>` : ""}
      ${pose === "hold" ? arms(pose) : ""}
      <circle cx="58" cy="56" r="11" fill="${C.fur}"/><circle cx="58" cy="56" r="5.5" fill="${C.furShade}"/>
      <circle cx="142" cy="56" r="11" fill="${C.fur}"/><circle cx="142" cy="56" r="5.5" fill="${C.furShade}"/>
      <ellipse cx="100" cy="82" rx="53" ry="40" fill="${C.fur}"/>
      ${face(expr)}`;
  }

  const confetti = `
    <g opacity=".9"><rect x="18" y="40" width="8" height="4" rx="2" fill="#F2B84B" transform="rotate(-30 22 42)"/>
    <rect x="176" y="34" width="8" height="4" rx="2" fill="#6CC4A1" transform="rotate(25 180 36)"/>
    <circle cx="30" cy="80" r="3.5" fill="#E07A84"/><circle cx="172" cy="78" r="3.5" fill="#5BB7E8"/>
    <rect x="160" y="12" width="8" height="4" rx="2" fill="#E07A84" transform="rotate(-20 164 14)"/>
    <rect x="34" y="12" width="8" height="4" rx="2" fill="#5BB7E8" transform="rotate(40 38 14)"/></g>`;

  function svg(mood = "talk", { cls = "" } = {}) {
    let inner, vb = "0 0 200 216";
    switch (mood) {
      case "wave":  inner = otter("happy", "up"); break;
      case "cheer": inner = confetti + otter("joy", "up"); break;
      case "gem":   inner = otter("worried", "hold", { gem: true }); break;
      case "river":
        vb = "0 0 240 212";
        inner = `
          <circle cx="30" cy="160" r="6" fill="${C.water}"/><circle cx="212" cy="150" r="9" fill="${C.water}"/>
          <g transform="translate(20 0)">${otter("sad", "hold")}</g>
          <ellipse cx="120" cy="188" rx="112" ry="24" fill="${C.water}"/>
          <ellipse cx="120" cy="184" rx="80" ry="12" fill="none" stroke="${C.waterLine}" stroke-width="3"/>
          <path d="M40 194 q14 -6 28 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
          <path d="M168 198 q14 -6 28 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
        break;
      default: inner = otter("talk", "down");
    }
    return `<svg class="ollie ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ollie the otter">${inner}</svg>`;
  }

  return { svg };
})();
