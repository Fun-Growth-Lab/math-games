// かけざん2の絵: 前から好きだった、まるっこい簡単なモンスター(おばけ・しかく・しずく・トゲトゲ・ひとつ目・ツノのボス)。
// 形は元のまま、ぬりをグラデーションにして ふち・つや・かげ・まばたきを足して きれいに描いた(SVG)。
// 体の色は .mon の --c で変える。ROUND_COLORS はラウンドごとの体の色。
const ROUND_COLORS = ['#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#34495e'];

let _mnId = 0;
// 1体ぶんのSVG。body=からだのパス(または図形)、eyes=目の位置、size=箱の大きさ
function mnSVG(size, bodyShape, extraBack, eyes, extraFront) {
    const id = 'mg' + (++_mnId);
    const eyeHTML = eyes.map(e => `<g class="mn-eye"><circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="#fff" stroke="#1c1426" stroke-width="2.5"/><circle cx="${e.x + e.r * 0.12}" cy="${e.y + e.r * 0.18}" r="${e.r * 0.5}" fill="#1c1426"/><circle cx="${e.x - e.r * 0.05}" cy="${e.y - e.r * 0.08}" r="${e.r * 0.2}" fill="#fff"/></g>`).join('');
    return `<svg class="mn-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb, var(--c) 45%, #fff)"/><stop offset="0.5" style="stop-color:var(--c)"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--c) 66%, #000)"/></linearGradient>
        </defs>
        <ellipse cx="${size / 2}" cy="${size - 8}" rx="${size * 0.34}" ry="7" fill="rgba(0,0,0,.28)"/>
        ${extraBack || ''}
        <g fill="url(#${id})" stroke="color-mix(in srgb, var(--c) 38%, #12091f)" stroke-width="3.5" stroke-linejoin="round">${bodyShape}</g>
        ${eyeHTML}
        ${extraFront || ''}
    </svg>`;
}
const gloss = (cx, cy, rx, ry, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot || -28} ${cx} ${cy})" fill="rgba(255,255,255,.45)"/>`;

function starPath(cx, cy, ro, ri, n) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 === 0 ? ro : ri; pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`); }
    return `<polygon points="${pts.join(' ')}"/>`;
}

// ぬりのグラデーションのidは、描くたびに新しく作る(同じidが2つあると、かくれた方を見て色が消えるため)
const ROBOTS = [
    // 1 おばけ
    () => mnSVG(150, `<path d="M20 74 A55 55 0 0 1 130 74 L130 124 L112 108 L93 126 L75 108 L57 126 L38 108 L20 124 Z"/>`, '',
        [{ x: 55, y: 66, r: 14 }, { x: 95, y: 66, r: 14 }], gloss(48, 38, 18, 9)),
    // 2 しかく
    () => mnSVG(150, `<rect x="20" y="24" width="110" height="108" rx="20"/>`, '',
        [{ x: 54, y: 68, r: 14 }, { x: 96, y: 68, r: 14 }], gloss(46, 42, 20, 9)),
    // 3 しずく
    () => mnSVG(150, `<path d="M75 12 C24 54 16 118 75 128 C134 118 126 54 75 12 Z"/>`, '',
        [{ x: 58, y: 84, r: 14 }, { x: 92, y: 84, r: 14 }], gloss(56, 52, 12, 22, -22)),
    // 4 トゲトゲ
    () => mnSVG(150, starPath(75, 76, 68, 44, 8), '',
        [{ x: 58, y: 74, r: 14 }, { x: 92, y: 74, r: 14 }], gloss(56, 44, 16, 8)),
    // 5 ひとつ目
    () => mnSVG(150, `<circle cx="75" cy="76" r="62"/>`, '',
        [{ x: 75, y: 72, r: 26 }], gloss(46, 36, 20, 10)),
];
// 6 ツノのボス(190x190)
const ROBOT_BOSS = () => mnSVG(190,
    `<circle cx="95" cy="112" r="74"/>`,
    `<g fill="#e8e4f0" stroke="#12091f" stroke-width="3.5" stroke-linejoin="round"><path d="M44 62 L24 10 L74 44 Z"/><path d="M146 62 L166 10 L116 44 Z"/></g>`,
    [{ x: 66, y: 102, r: 18 }, { x: 124, y: 102, r: 18 }],
    `<path d="M44 82 L88 94" stroke="#12091f" stroke-width="6" stroke-linecap="round"/><path d="M146 82 L102 94" stroke="#12091f" stroke-width="6" stroke-linecap="round"/><path d="M70 144 Q95 160 120 144" stroke="#12091f" stroke-width="5" fill="none" stroke-linecap="round"/>` + gloss(62, 64, 22, 10));

// 共通の画面(タイトルのモンスター・RUNカード)が使う、モンスター1体のHTML
function monHTML(shape) {
    return `<div class="glow"></div>${ROBOTS[shape % ROBOTS.length]()}`;
}
function bossHTML() {
    return `<div class="glow"></div>${ROBOT_BOSS()}`;
}
