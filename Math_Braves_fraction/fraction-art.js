// ぶんすうの絵。ケーキ(上から見たホールケーキを24等分、きっちり切れ目はゲームの切り目)・いちご・タイトルの かざり。
// ロボは使わない。パネルの小さな絵(ケーキ)は他のゲームと同じ線画で足す
ICO.cake = _svg('<path d="M4 20h16"/><path d="M5 20v-7h14v7"/><path d="M5 13c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5"/><path d="M12 11V7"/><path d="M12 6.2c-.9-.9-.9-1.6 0-2.7.9 1.1.9 1.8 0 2.7z"/>');
initIcons();

// ---- 数の表し方(24分のいくつ) ----
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function fracParts(val) { const d = gcd(val, UNIT_MAX); return { n: val / d, d: UNIT_MAX / d }; }
function fracText(val) { if (val === UNIT_MAX) return '1'; const p = fracParts(val); return `${p.n}/${p.d}`; }
function fracHTML(val) {
    if (val === UNIT_MAX) return '<span class="one">1</span>';
    const p = fracParts(val);
    return `<span class="fr"><i>${p.n}</i><i>${p.d}</i></span>`;
}

// ---- いちご・ケーキの かたち ----
const STRAWB = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -7C6 -9 11 -2 8 4C6 9 0 12 0 12C0 12 -6 9 -8 4C-11 -2 -6 -9 0 -7Z" fill="#e8344e" stroke="#a81830" stroke-width="1"/><path d="M-5 -8 0 -12 5 -8 2 -6 0 -9 -2 -6Z" fill="#37b24d"/><g fill="#ffe0a8"><circle cx="-3" cy="0" r="1"/><circle cx="3" cy="1" r="1"/><circle cx="0" cy="5" r="1"/><circle cx="-2.5" cy="7.5" r=".8"/><circle cx="2.5" cy="6.5" r=".8"/></g></g>`;
function pt(cx, cy, r, deg) { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function wedgePath(r, a0, a1) {
    const [x0, y0] = pt(100, 100, r, a0), [x1, y1] = pt(100, 100, r, a1);
    return `M100 100L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}
function ringPath(r0, r1, a0, a1) {
    const [ax, ay] = pt(100, 100, r1, a0), [bx, by] = pt(100, 100, r1, a1), [cx, cy] = pt(100, 100, r0, a1), [dx, dy] = pt(100, 100, r0, a0);
    return `M${ax.toFixed(2)} ${ay.toFixed(2)}A${r1} ${r1} 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}L${cx.toFixed(2)} ${cy.toFixed(2)}A${r0} ${r0} 0 0 0 ${dx.toFixed(2)} ${dy.toFixed(2)}Z`;
}

// ケーキの大きさごとの クリームの色(同じ大きさは同じ色。1=金のホール)
function cakeColor(val) {
    if (val === UNIT_MAX) return '#ffd45c';
    if (val >= 18) return '#ff7fa6';
    if (val >= 12) return '#ffa24a';
    if (val >= 6) return '#ffe14d';
    return '#8bd36a';
}

// 上から見た ケーキ1つ(24きれ + 切り目 + 切り目ごとの いちご)。大きさは paintCake で変える
function cakeSVG(div, uid) {
    const k = UNIT_MAX / div, sc = div <= 4 ? 1.5 : div <= 8 ? 1.15 : 0.82, rr = div <= 4 ? 55 : div <= 8 ? 59 : 63;
    let h = `<svg viewBox="0 0 200 200" class="ck"><circle cx="100" cy="100" r="98" class="pl"/><circle cx="100" cy="100" r="91" class="bd"/>`;
    for (let i = 0; i < UNIT_MAX; i++) {
        const a0 = -90 + i * 15, a1 = a0 + 15.4;
        h += `<g class="sl" data-i="${i}"><path class="tp" d="${wedgePath(90, a0, a1)}"/><path class="rm" d="${ringPath(76, 90, a0, a1)}"/></g>`;
    }
    for (let p = 0; p < div; p++) {
        const mid = -90 + (p + 0.5) * k * 15, [x, y] = pt(100, 100, rr, mid);
        h += `<g class="sb" data-p="${p}">${STRAWB(x.toFixed(1), y.toFixed(1), sc)}</g>`;
    }
    for (let i = 0; i < div; i++) {
        const [x2, y2] = pt(100, 100, 91, -90 + i * k * 15);
        h += `<line x1="100" y1="100" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="gl"/>`;
    }
    h += `<circle cx="100" cy="100" r="9" class="ct"/></svg>`;
    return h;
}
// ケーキの絵を 大きさ val(24分のいくつ)に合わせる
function paintCake(el, val, div) {
    const k = UNIT_MAX / div;
    el.style.setProperty('--ck', cakeColor(val));
    el.classList.toggle('whole', val === UNIT_MAX);
    el.querySelectorAll('.sl').forEach(g => g.classList.toggle('on', +g.dataset.i < val));
    el.querySelectorAll('.sb').forEach(g => g.classList.toggle('on', (+g.dataset.p + 1) * k <= val));
}

// ---- タイトル・RUNカードに飾る絵(150x150) ----
const SV = (b) => `<svg viewBox="0 0 150 150" width="150" height="150" style="position:absolute;inset:0;overflow:visible">${b}</svg>`;
const ART = [
    // 0 ホールケーキ(よこから)
    SV(`<ellipse cx="75" cy="133" rx="66" ry="8" fill="rgba(0,0,0,.28)"/><ellipse cx="75" cy="125" rx="66" ry="12" fill="#fff" stroke="#eadfd6" stroke-width="3"/>
        <path d="M26 122V74H124V122Q124 134 75 134Q26 134 26 122Z" fill="#f0bb72"/><path d="M26 99H124V109H26Z" fill="#fff4e4"/><path d="M26 109H124V122Q124 134 75 134Q26 134 26 122Z" fill="#e9a95a"/>
        <path d="M26 74Q26 62 75 62Q124 62 124 74Q124 86 75 86Q26 86 26 74Z" fill="#ffb3c8"/><path d="M26 74Q26 80 36 82V92Q36 96 42 96Q48 96 48 90V84H60V94Q60 99 66 99Q72 99 72 93V86H84V90Q84 96 90 96Q96 96 96 90V85Q110 83 118 80V90Q118 95 123 95Q124 95 124 90V74" fill="#ffb3c8"/>
        <ellipse cx="75" cy="64" rx="49" ry="10" fill="#ffd0de"/>${STRAWB(48, 60, 1.5)}${STRAWB(75, 66, 1.6)}${STRAWB(102, 60, 1.5)}
        <rect x="71" y="30" width="8" height="26" rx="2" fill="#7ec8f0" stroke="#3a8fc0" stroke-width="1.5"/><path d="M75 12C70 18 70 24 75 28C80 24 80 18 75 12Z" fill="#ffb300"/>`),
    // 1 ケーキの1きれ
    SV(`<ellipse cx="75" cy="130" rx="62" ry="8" fill="rgba(0,0,0,.28)"/><ellipse cx="75" cy="124" rx="62" ry="11" fill="#fff" stroke="#eadfd6" stroke-width="3"/>
        <polygon points="22,76 128,66 80,38" fill="#ffc2d4" stroke="#e58aa6" stroke-width="2"/>
        <polygon points="22,76 128,66 128,112 22,122" fill="#f0bb72"/><polygon points="22,94 128,86 128,96 22,104" fill="#fff4e4"/><polygon points="22,76 128,66 128,76 22,86" fill="#ffd9e4"/>
        ${STRAWB(80, 60, 1.6)}`),
    // 2 いちご
    SV(`<ellipse cx="75" cy="134" rx="40" ry="6" fill="rgba(0,0,0,.25)"/><g transform="translate(75 78) scale(6.4)"><path d="M0 -7C6 -9 11 -2 8 4C6 9 0 12 0 12C0 12 -6 9 -8 4C-11 -2 -6 -9 0 -7Z" fill="#e8344e" stroke="#a81830" stroke-width=".6"/><path d="M-5 -8 0 -12 5 -8 2 -6 0 -9 -2 -6Z" fill="#37b24d"/><g fill="#ffe0a8"><circle cx="-3" cy="0" r=".9"/><circle cx="3" cy="1" r=".9"/><circle cx="0" cy="5" r=".9"/><circle cx="-2.5" cy="7.5" r=".7"/><circle cx="2.5" cy="6.5" r=".7"/><circle cx="-4.5" cy="4" r=".7"/><circle cx="4.5" cy="4.5" r=".7"/><circle cx="0" cy="-3" r=".7"/></g></g>`),
    // 3 カップケーキ
    SV(`<ellipse cx="75" cy="134" rx="46" ry="7" fill="rgba(0,0,0,.25)"/><path d="M34 82H116L104 130Q103 134 98 134H52Q47 134 46 130Z" fill="#ff9ec0" stroke="#d86a92" stroke-width="2"/><path d="M52 84L58 132M68 84L70 134M82 84L80 134M98 84L92 132" stroke="#ffd0e0" stroke-width="3"/>
        <path d="M30 84Q26 62 50 62Q46 44 70 42Q72 24 90 34Q112 30 108 52Q126 58 120 84Z" fill="#fff4e4" stroke="#e8d2b8" stroke-width="2"/><path d="M44 74Q75 82 108 72" stroke="#ffd9e4" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="75" cy="30" r="9" fill="#d81b3c"/><path d="M75 22Q78 12 86 10" stroke="#3a8a2a" stroke-width="2.5" fill="none"/>`),
    // 4 上から見た3/4のケーキ
    SV(`<ellipse cx="75" cy="136" rx="58" ry="7" fill="rgba(0,0,0,.25)"/><circle cx="75" cy="75" r="68" fill="#fff" stroke="#eadfd6" stroke-width="3"/><circle cx="75" cy="75" r="62" fill="#fffaf3"/>
        <path d="M75 75L75 13A62 62 0 1 1 13 75Z" fill="#ffb3c8" stroke="#e8a56a" stroke-width="1"/><path d="M75 75L75 13A62 62 0 1 1 13 75" fill="none" stroke="#e8b06a" stroke-width="9" opacity=".8"/>
        <path d="M75 75L75 13M75 75L13 75M75 75L131 100" stroke="#b5835a" stroke-width="1.5" opacity=".5" fill="none"/>${STRAWB(100, 50, 1.2)}${STRAWB(103, 100, 1.2)}${STRAWB(55, 108, 1.2)}`),
    // 5 ケーキのおさら+フォーク
    SV(`<ellipse cx="75" cy="132" rx="62" ry="8" fill="rgba(0,0,0,.25)"/><ellipse cx="75" cy="112" rx="62" ry="22" fill="#fff" stroke="#eadfd6" stroke-width="3"/><ellipse cx="75" cy="112" rx="48" ry="15" fill="#fffaf3"/>
        <path d="M44 108L84 72L96 108Z" fill="#f0bb72"/><path d="M44 108L84 72L88 82L50 108Z" fill="#fff4e4"/><path d="M84 72L96 108L108 100L92 66Z" fill="#ffc2d4"/>${STRAWB(86, 66, 1.3)}`)
];
// タイトル・RUNカードで使う絵。shape は ART の番号
function monHTML(shape) { return ART[shape % ART.length]; }
