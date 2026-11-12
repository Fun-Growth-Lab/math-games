// トレジャークラフト2: 描画。水平15°回した斜め見下ろし。マスも魔物も箱の組み合わせをコードで描き、スプライトにためて使う。
// 後から絵に差し替えるときは ART にキーを足す(例 ART['mob_zombie'] = 'images/zombie.webp')。
'use strict';
const ART = {};
const TW = 52, ANG = 15 * Math.PI / 180, CS = Math.cos(ANG), SN = Math.sin(ANG), KY = .62, KZ = .62;
const VW = 1280, VH = 720, CX = VW / 2, CY = VH / 2 + 30;
const pj = (x, y, z) => [(x * CS - y * SN) * TW, (x * SN + y * CS) * TW * KY - (z || 0) * TW * KZ];

// 画面の回転: VIEW.rot(0〜3)。rv = 世界の向き → 画面の向き / rvInv = その逆
const rv = (dx, dy) => { switch (VIEW.rot & 3) { case 1: return [-dy, dx]; case 2: return [-dx, -dy]; case 3: return [dy, -dx]; default: return [dx, dy]; } };
const rvInv = (vx, vy) => { switch (VIEW.rot & 3) { case 1: return [vy, -vx]; case 2: return [-vx, -vy]; case 3: return [-vy, vx]; default: return [vx, vy]; } };
// 箱を まん中(cs)のまわりに 画面の向きへ回す
const rotQ = (q, cs) => { const a = rv(q[0] - cs, q[1] - cs), b = rv(q[3] - cs, q[4] - cs); return [Math.min(a[0], b[0]) + cs, Math.min(a[1], b[1]) + cs, q[2], Math.max(a[0], b[0]) + cs, Math.max(a[1], b[1]) + cs, q[5], q[6]]; };
function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = v => Math.max(0, Math.min(255, Math.round(v * f)));
    return 'rgb(' + c(n >> 16) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- 16×16の模様 ----------
let texSeed = 7;
const tr = () => { texSeed = (Math.imul(texSeed, 1664525) + 1013904223) | 0; return (texSeed >>> 0) / 4294967296; };
function speck(cols, fn) {
    const c = mkCanvas(16, 16), x = c.getContext('2d');
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.fillStyle = cols[Math.floor(tr() * cols.length)]; x.fillRect(i, j, 1, 1); }
    if (fn) fn(x);
    return c;
}
const dots = (cols, n) => x => { for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(tr() * cols.length)]; const a = Math.floor(tr() * 13), b = Math.floor(tr() * 13); x.fillRect(a, b, 2 + Math.floor(tr() * 2), 2); } };
const planks = (dark) => x => { x.fillStyle = dark; for (let i = 0; i < 16; i += 4) x.fillRect(i, 0, 1, 16); x.fillRect(2, 6, 1, 3); x.fillRect(10, 9, 1, 3); x.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 16; i += 4) { x.fillRect(i + 2, 1, 1, 1); x.fillRect(i + 2, 14, 1, 1); } };
const bricks = (dark) => x => { x.fillStyle = dark; for (let j = 0; j < 16; j += 4) { x.fillRect(0, j, 16, 1); for (let i = (j % 8 ? 0 : 4); i < 16; i += 8) x.fillRect(i, j, 1, 4); } };
let TX = null, HIDDEN_SPR = null;
// 地下で 今は見えないマスか(見えないマスは 中身を描かず 暗い岩として描く)
const caveHidden = (f, x, y) => isCave(f) && !VIEW.title && !caveView().set.has(y * 1000 + x);
function buildTextures() {
    const stoneC = ['#8e8e8a', '#9a9a96', '#85857f', '#a2a29c'], deepC = ['#6e6e6a', '#767672', '#66665f', '#7c7c76'], dirtC = ['#7a5a3a', '#6e5032', '#84623f', '#74553a'], hardC = ['#4e4e5c', '#565664', '#484856', '#5e5e6c'];
    TX = {
        grass: [0, 1, 2].map(() => speck(['#7fbf55', '#86c65b', '#78b850', '#8ccb60'], dots(['#6fae48', '#98d46e'], 4))),
        grass2: [0, 1].map(() => speck(['#5fa544', '#66ac49', '#59a03f', '#6cb24e'], dots(['#4f9239'], 4))),
        flower: [0, 1, 2].map((_, i) => speck(['#7fbf55', '#86c65b', '#78b850', '#8ccb60'], dots([['#f4e04a', '#fff'], ['#f07aa8', '#fff'], ['#b08af0', '#f4e04a']][i], 5))),
        scorch: [0, 1].map(() => speck(['#3c3430', '#46403a', '#332c28', '#504840'], dots(['#6a2c1c'], 3))),
        rail: [speck(['#5a4a3e', '#524438', '#625244'], x => { x.fillStyle = '#7c5228'; for (let j = 1; j < 16; j += 4) x.fillRect(0, j, 16, 2); x.fillStyle = '#b8c0c8'; x.fillRect(3, 0, 2, 16); x.fillRect(11, 0, 2, 16); })],
        dirt: [0, 1].map(() => speck(dirtC)),
        sand: [0, 1].map(() => speck(['#ecd9a0', '#e6d294', '#f0dfaa', '#e2cd8e'])),
        snow: [0, 1].map(() => speck(['#f4f8fc', '#eaf1f8', '#fafcff', '#e2ecf5'])),
        cave: [0, 1].map(() => speck(['#5a4a3e', '#524438', '#625244', '#4c3f34'])),
        ash: [0, 1].map(() => speck(['#4c3a3e', '#544044', '#443438', '#5c464a'], dots(['#6a2c2c'], 2))),
        rfloor: [speck(['#a8a690', '#9e9c86', '#b0ae98'], bricks('#7e7c68'))],
        cfloor: [speck(['#3c2c44', '#44334c', '#35273c'], bricks('#22182a'))],
        wfloor: [speck(['#b8854c', '#ae7c44', '#c08d54'], planks('#7c5228'))],
        carpet: [speck(['#c8443c', '#c03c34', '#d04c44'], x => { x.fillStyle = '#f4d860'; x.fillRect(1, 1, 14, 1); x.fillRect(1, 14, 14, 1); x.fillRect(1, 1, 1, 14); x.fillRect(14, 1, 1, 14); x.fillStyle = '#8a2420'; x.fillRect(6, 6, 4, 4); x.fillStyle = '#f4d860'; x.fillRect(7, 7, 2, 2); })],
        nfloor: [speck(['#6c2448', '#642042', '#74284e'], planks('#3c1028'))],
        farm: [speck(['#5e4228', '#664a2e', '#563c24'], x => { x.fillStyle = '#3f2b18'; for (let j = 2; j < 16; j += 4) x.fillRect(0, j, 16, 1); })],
        water: [0, 1].map(() => speck(['#4a9fd8', '#5aabe0', '#4496d0', '#62b2e6'])),
        magma: [0, 1].map(() => speck(['#e8561c', '#f2782c', '#d8441c', '#ffa23c'], dots(['#ffd86a'], 4))),
        stone: speck(deepC), dirtw: speck(dirtC), hard: speck(hardC), rock: speck(stoneC, dots(['#74746e'], 4)),
        wood: speck(['#8a5a2c', '#7c5026', '#946234']), woodtop: speck(['#c89a5c', '#bc8e50', '#d0a464']),
        leaf: speck(['#3f9a45', '#368c3c', '#4aa850', '#2f8036']), pine: speck(['#2a6e50', '#246348', '#327a58']),
        plank: speck(['#b8854c', '#ae7c44', '#c08d54'], planks('#7c5228')), brick: speck(stoneC, bricks('#62625c')),
        rwall: speck(['#a8a690', '#9e9c86'], bricks('#6e6c58')), nrock: speck(['#5a2c2c', '#522828', '#623030', '#4a2424'], x => { x.fillStyle = '#e8601c'; for (const p of [[2, 3], [3, 4], [4, 4], [5, 5], [11, 2], [11, 3], [12, 4], [8, 10], [9, 11], [10, 11], [11, 12], [3, 12], [4, 13]]) x.fillRect(p[0], p[1], 1, 1); x.fillStyle = '#ffb03c'; x.fillRect(4, 4, 1, 1); x.fillRect(9, 11, 1, 1); }),
        cwall: speck(['#2a1c34', '#32223c', '#241830'], bricks('#120a1c')), ntree: speck(['#5c1c3c', '#6c2448', '#4e1632'])
    };
    const ore = (cols, base) => speck(base, dots(cols, 6));
    // 金属の板: リベットつき
    const plate = (cols, dark, hi) => speck(cols, x => { x.fillStyle = dark; x.fillRect(0, 7, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(7, 0, 1, 7); x.fillRect(15, 8, 1, 7); x.fillStyle = hi; for (const p of [[2, 2], [12, 2], [2, 11], [12, 11]]) x.fillRect(p[0], p[1], 2, 2); });
    TX.mcu = plate(['#e47a3c', '#d87034', '#ee8646'], '#8a3a18', '#ffc08a'); TX.mfe = plate(['#b4bac2', '#aab0b8', '#bec4cc'], '#6e747c', '#eef2f6'); TX.mau = plate(['#f2c840', '#e8be38', '#fad44c'], '#a8801c', '#fff4b0');
    for (const m of ['cu', 'fe', 'au']) TX['fl' + m] = [TX['m' + m]];
    TX.benchtop = speck(['#e0bc84', '#d8b47c', '#e8c48c'], x => { x.fillStyle = '#a87c48'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16); });
    TX.nplank = speck(['#6c2448', '#642042', '#74284e'], planks('#3c1028'));
    TX.sandb = speck(['#dcc488', '#d4bc80', '#e4cc90'], bricks('#a8904c')); TX.hull = speck(['#6e5230', '#624828', '#7a5c38'], planks('#3c2c18'));
    // 鉱石: どれも「まるい粒が石にうまっている」形。色だけで見分ける(縁=こい色・中=鉱石の色・光=明るい色)
    const px = (x, c, pts) => { x.fillStyle = c; for (const p of pts) x.fillRect(p[0], p[1], p[2] || 1, p[3] || 1); };
    const nugget = (base, k) => speck(base, x => {
        for (const [cx, cy, r] of [[4, 4, 2], [11, 6, 2], [6, 11, 2], [12, 12, 1]]) {
            if (r === 2) { px(x, k[0], [[cx - 2, cy - 1, 5, 3], [cx - 1, cy - 2, 3, 5]]); px(x, k[1], [[cx - 1, cy - 1, 3, 3]]); px(x, k[2], [[cx - 1, cy - 1]]); }
            else { px(x, k[0], [[cx - 1, cy - 1, 3, 3]]); px(x, k[1], [[cx, cy]]); }
        }
    });
    TX.ore_coal = nugget(deepC, ['#141418', '#2e2e38', '#8a9ab8']); TX.ore_cu = nugget(deepC, ['#9a4a1a', '#e07a3c', '#ffc890']); TX.ore_fe = nugget(deepC, ['#6a707a', '#c4c9d2', '#ffffff']);
    TX.ore_au = nugget(deepC, ['#a87a14', '#f2c840', '#fff6b8']); TX.ore_rs = nugget(deepC, ['#7a1010', '#e0301c', '#ffa08a']); TX.ore_star = nugget(hardC, ['#16709c', '#4ac8f0', '#effcff']);
    TX.ore_n = nugget(['#5a2c2c', '#522828', '#623030', '#4a2424'], ['#5a165a', '#c040b0', '#ffc8f4']);
    TX.fossil = speck(deepC, x => { x.fillStyle = '#efe6d0'; x.fillRect(2, 7, 12, 2); for (const i of [4, 8, 12]) x.fillRect(i, 3, 1, 10); x.fillStyle = '#d8ccb0'; x.fillRect(13, 5, 2, 6); });
    TX.vwall = speck(['#2c2236', '#30263c', '#281e30'], x => { x.fillStyle = '#c8a040'; for (const p of [[3, 3], [11, 4], [6, 10], [12, 12], [2, 13]]) { x.fillRect(p[0], p[1], 2, 1); x.fillRect(p[0], p[1] + 1, 1, 1); } x.fillStyle = '#1a1420'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16); });
    TX.glass = speck(['#cfeefc', '#d8f2fc', '#c4e8f8'], x => { x.fillStyle = '#9ccbe0'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16); x.fillStyle = '#ffffff'; for (let i = 3; i < 9; i++) x.fillRect(i, 12 - i, 1, 1); for (let i = 7; i < 11; i++) x.fillRect(i, 16 - i, 1, 1); });
    // ひびの入った岩(埋まった宝): ふつうの岩と同じ色で、細いひびが少しだけ
    TX.rockc = speck(['#8e8e8a', '#9a9a96', '#85857f', '#a2a29c'], x => { px(x, '#74746e', [[3, 2], [4, 3], [4, 4], [5, 5], [6, 5], [7, 6], [7, 7], [8, 8], [10, 11], [11, 12]]); px(x, '#7c7c76', [[8, 6], [9, 5], [6, 9], [5, 10]]); });
}

// ---------- 箱からスプライトをつくる ----------
const O_W = 180, O_H = 200, O_X = 64, O_Y = 140;
function face(c, tex, col, a, b, d, dark) {
    // a=左上、b=右上、d=左下 の平行四辺形
    if (tex) {
        c.save();
        c.imageSmoothingEnabled = false;
        c.setTransform((b[0] - a[0]) / 16, (b[1] - a[1]) / 16, (d[0] - a[0]) / 16, (d[1] - a[1]) / 16, a[0], a[1]);
        c.drawImage(tex, 0, 0, 16, 16, -.05, -.05, 16.1, 16.1);
        if (dark < 1) { c.fillStyle = 'rgba(0,0,0,' + (1 - dark) + ')'; c.fillRect(0, 0, 16, 16); }
        c.restore();
    } else {
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0] + d[0] - a[0], b[1] + d[1] - a[1]); c.lineTo(d[0], d[1]); c.closePath();
        c.fillStyle = shade(col, dark); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .7; c.stroke();
    }
}
function drawBox(c, ox, oy, b, sc) {
    const [x0, y0, z0, x1, y1, z1, m] = b, tex = typeof m === 'object';
    const P = (x, y, z) => { const p = pj(x, y, z); return [ox + p[0] * sc, oy + p[1] * sc]; };
    const top = tex ? m.top : null, side = tex ? (m.side || m.top) : null, col = tex ? null : m;
    if (z1 > z0) {
        face(c, side, col, P(x0, y1, z1), P(x1, y1, z1), P(x0, y1, z0), .78);   // 手前
        face(c, side, col, P(x1, y1, z1), P(x1, y0, z1), P(x1, y1, z0), .62);   // 右
    }
    face(c, top, col, P(x0, y0, z1), P(x1, y0, z1), P(x0, y1, z1), 1);          // 上
}
function boxSprite(list, opt) {
    opt = opt || {};
    if (VIEW.rot) { const cs = (opt.size || 1) / 2; list = list.map(q => rotQ(q, cs)); }   // 画面を回しているときは 箱も回す
    const sc = opt.sc || 1, w = opt.w || O_W, h = opt.h || O_H, ox = opt.ox || O_X, oy = opt.oy || O_Y;
    const cv = mkCanvas(w, h), c = cv.getContext('2d');
    // opt.base: はじめの base こは 土台。先に描き、上にのる部品が かくれないようにする
    const nb = opt.base || 0;
    for (let i = 0; i < nb; i++) drawBox(c, ox, oy, list[i], sc);
    const sorted = list.slice(nb).sort((a, b) => ((a[0] + a[3]) * SN + (a[1] + a[4]) * CS + (a[2] + a[5]) * .35) - ((b[0] + b[3]) * SN + (b[1] + b[4]) * CS + (b[2] + b[5]) * .35));
    for (const b of sorted) drawBox(c, ox, oy, b, sc);
    return { cv, ox, oy };
}
const flatSpr = tex => boxSprite([[-.015, -.015, 0, 1.015, 1.015, 0, { top: tex }]]);   // つなぎ目が見えないよう少しだけ大きく

let GS = null, OS = null, LADDER_PARTS = null;
function buildSprites() {
    buildTextures();
    const g = {};
    for (const k of ['scorch', 'rail', 'grass', 'grass2', 'flower', 'dirt', 'sand', 'snow', 'cave', 'ash', 'rfloor', 'cfloor', 'wfloor', 'carpet', 'nfloor', 'flcu', 'flfe', 'flau', 'farm', 'water', 'magma']) g[k] = TX[k].map(flatSpr);
    GS = g;
    const block = (top, h, side, i) => { i = i || 0; return boxSprite([[i, i, 0, 1 - i, 1 - i, h, { top, side: side || top }]]); };
    const o = {};
    o[T.TREE] = [boxSprite([[.38, .38, 0, .62, .62, .7, { top: TX.woodtop, side: TX.wood }], [.08, .08, .62, .92, .92, 1.45, { top: TX.leaf }], [.24, .24, 1.45, .76, .76, 1.8, { top: TX.leaf }]])];
    o[T.TREE].push(boxSprite([[.38, .38, 0, .62, .62, .55, { top: TX.woodtop, side: TX.wood }], [.14, .14, .5, .86, .86, 1.2, { top: TX.leaf }], [.28, .28, 1.2, .72, .72, 1.5, { top: TX.leaf }]]));
    o[T.PINE] = [boxSprite([[.4, .4, 0, .6, .6, .4, { top: TX.woodtop, side: TX.wood }], [.1, .1, .36, .9, .9, .8, { top: TX.pine }], [.2, .2, .8, .8, .8, 1.2, { top: TX.pine }], [.32, .32, 1.2, .68, .68, 1.6, { top: TX.pine }]])];
    o[T.CACTUS] = [boxSprite([[.34, .34, 0, .66, .66, 1, '#4e9a4a'], [.1, .42, .34, .34, .58, .46, '#4e9a4a'], [.1, .42, .46, .22, .58, .76, '#4e9a4a'], [.66, .42, .5, .9, .58, .62, '#4e9a4a'], [.78, .42, .62, .9, .58, .88, '#4e9a4a']])];
    o[T.VEG] = [boxSprite([[.42, .42, 0, .58, .58, .16, '#e8821c'], [.3, .3, .16, .7, .7, .34, '#5ab04a'], [.42, .42, .34, .58, .58, .52, '#6ac05a']])];
    o[T.WHEATW] = [boxSprite([[.2, .3, 0, .28, .38, .5, '#d8b84a'], [.46, .5, 0, .54, .58, .58, '#e8c85a'], [.68, .3, 0, .76, .38, .46, '#d8b84a'], [.34, .66, 0, .42, .74, .44, '#e8c85a'], [.6, .7, 0, .68, .78, .52, '#d8b84a']])];
    o[T.HERB] = [boxSprite([[.3, .3, 0, .7, .7, .14, '#3a9a6a'], [.4, .4, .14, .6, .6, .36, '#5ac88a'], [.46, .46, .36, .54, .54, .44, '#f0f0a0']])];
    o[T.ROCK] = [boxSprite([[.04, .04, 0, .96, .96, .5, { top: TX.rock }], [.2, .2, .5, .8, .8, .72, { top: TX.rock }]]), boxSprite([[.08, .08, 0, .92, .92, .62, { top: TX.rock }]])];
    o[T.PIT] = [boxSprite([[0, 0, 0, 1, 1, 0, '#14100c'], [.08, .08, 0, .92, .92, 0, '#000000']])];
    const ladder = LADDER_PARTS = [[.28, .44, 0, .36, .52, .9, '#a8743c'], [.64, .44, 0, .72, .52, .9, '#a8743c'], [.28, .46, .2, .72, .5, .26, '#c89a5c'], [.28, .46, .46, .72, .5, .52, '#c89a5c'], [.28, .46, .72, .72, .5, .78, '#c89a5c']];
    o[T.LADDER_D] = [boxSprite([[0, 0, 0, 1, 1, 0, '#14100c']].concat(ladder))];
    o[T.LADDER_U] = [boxSprite([[0, 0, 0, 1, 1, 0, { top: TX.cave[0] }]].concat(ladder))];
    // 上り階段: 奥へ向かって 段が高くなる
    o[T.STAIRS_U] = [boxSprite([[0, 0, 0, 1, 1, 0, { top: TX.cave[0] }], [.08, .08, 0, .92, .92, .12, '#7c7c76'], [.08, .08, .12, .92, .64, .26, '#8e8e8a'], [.08, .08, .26, .92, .36, .4, '#a2a29c'], [0, 0, 0, .08, 1, .46, '#6a6a64'], [.92, 0, 0, 1, 1, .46, '#6a6a64']])];
    const WH = .5;
    HIDDEN_SPR = block(speck(['#1a1720', '#1d1a24', '#17141c', '#201c27']), WH);
    o[T.WDIRT] = [block(TX.dirtw, WH)]; o[T.WSTONE] = [block(TX.stone, WH)]; o[T.WHARD] = [block(TX.hard, WH)]; o[T.BEDROCK] = [block(TX.cwall, WH)];
    o[T.ORE_COAL] = [block(TX.ore_coal, WH)]; o[T.ORE_CU] = [block(TX.ore_cu, WH)]; o[T.ORE_FE] = [block(TX.ore_fe, WH)]; o[T.ORE_AU] = [block(TX.ore_au, WH)]; o[T.ORE_STAR] = [block(TX.ore_star, WH)]; o[T.ORE_RS] = [block(TX.ore_rs, WH)];
    o[T.FOSSIL] = [block(TX.fossil, WH)]; o[T.VWALL] = [block(TX.vwall, WH)];
    o[T.GEM] = [boxSprite([[.1, .1, 0, .9, .9, .12, '#3a2e4c'], [.3, .3, .1, .7, .7, .72, '#ff6ac8'], [.38, .38, .72, .62, .62, .92, '#ffc8ec'], [.14, .56, .1, .34, .76, .46, '#c84aa8'], [.6, .14, .1, .82, .36, .52, '#ff9ade']])];
    o[T.GMUSH] = [boxSprite([[.4, .4, 0, .6, .6, .95, '#e8e0d0'], [.1, .1, .95, .9, .9, 1.25, '#3ad8c8'], [.26, .26, 1.25, .4, .4, 1.29, '#c8fff4'], [.58, .5, 1.25, .72, .64, 1.29, '#c8fff4']])];
    o[T.GLOWM] = [boxSprite([[.44, .44, 0, .56, .56, .24, '#e8e0d0'], [.3, .3, .24, .7, .7, .38, '#3ad8c8'], [.4, .4, .38, .5, .5, .4, '#c8fff4']])];
    o[T.MUSH] = [boxSprite([[.42, .42, 0, .58, .58, .22, '#efe6d0'], [.26, .26, .22, .74, .74, .38, '#c8443c'], [.36, .74, .28, .46, .76, .34, '#fff']])];
    o[T.BONES] = [boxSprite([[.18, .4, 0, .82, .5, .1, '#e8e0c8'], [.4, .2, .08, .5, .8, .18, '#d8d0b8'], [.54, .54, 0, .8, .8, .26, '#efe8d4']])];
    o[T.NROCK] = [block(TX.nrock, WH)]; o[T.ORE_N] = [block(TX.ore_n, WH)]; o[T.CWALL] = [block(TX.cwall, 1)];
    o[T.NTREE] = [boxSprite([[.36, .36, 0, .64, .64, 1, { top: TX.ntree }], [.1, .42, .7, .36, .58, .82, '#6c2448'], [.64, .42, .84, .9, .58, .96, '#6c2448'], [.2, .2, 1, .8, .8, 1.3, '#c8342c']])];
    o[T.GATE] = [boxSprite([[.02, .02, 0, .98, .98, .08, '#b8b090'], [.08, .4, 0, .26, .6, 1.2, '#c8c0a0'], [.74, .4, 0, .92, .6, 1.2, '#c8c0a0'], [.14, .4, 1.2, .86, .6, 1.34, '#d8d0b0'], [.34, .38, 1.34, .66, .62, 1.5, '#e8c040'], [.26, .48, .08, .74, .52, 1.2, '#3ad8c8'], [.4, .47, .5, .6, .53, .8, '#c8fff6']])];
    o[T.RWALL] = [block(TX.rwall, .7)];
    const chest = (a, b) => boxSprite([[.14, .2, 0, .86, .8, .42, a], [.14, .2, .42, .86, .8, .6, b], [.44, .8, .3, .56, .82, .48, '#ffd84a']]);
    o[T.CHEST_W] = [chest('#6e5a3a', '#8a7048')]; o[T.CHEST] = [chest('#a8743c', '#c08d54')];
    o[T.GLASS] = [block(TX.glass, .85)];
    // 回路
    // 赤いパネル(床)・赤いかべ。信号が来ていると明るい
    o[T.WIRE] = [boxSprite(wireBoxes('V', 0, false, false))]; o[T.WIRE_W] = [boxSprite([[0, 0, 0, 1, 1, .85, { top: TX.brick, side: TX.brick }]].concat(wireBoxes('V', .85, false, false)))];
    'NESW'.split('').forEach((c, i) => { o[T['REP_' + c]] = [repSprite(i, false)]; }); 'NESW'.split('').forEach((c, i) => { o[T['NOT_' + c]] = [invSprite(i, false)]; });
    const sw = on => boxSprite([[.3, .3, 0, .7, .7, .16, '#8e8e8a'], [.44, .44, .16, .56, .56, .5, '#6e4622'], [.4, .4, .5, .6, .6, .6, on ? '#ff3a1c' : '#5a1a14']]);
    o[T.SWITCH_OFF] = [sw(false)]; o[T.SWITCH_ON] = [sw(true)];
    o[T.PLATE] = [boxSprite([[.14, .14, 0, .86, .86, .07, '#a2a29c']]), boxSprite([[.14, .14, 0, .86, .86, .025, '#8e8e8a']])];
    const bulb = on => boxSprite([[.32, .32, 0, .68, .68, .18, '#5c5c68'], [.3, .3, .18, .7, .7, .62, on ? '#fff3a0' : '#c8dce4'], [.42, .42, .3, .58, .58, .5, on ? '#ffd84a' : '#8a8a7a'], [.36, .36, .62, .64, .64, .68, '#5c5c68']]);
    o[T.BULB] = [bulb(false), bulb(true)];
    // おたから
    const DECO_ART = {
        coin: [[.36, .36, 0, .64, .64, .05, '#c89a2c'], [.38, .38, .05, .62, .62, .1, '#e8b840'], [.4, .4, .1, .6, .6, .15, '#f6d060'], [.47, .47, .15, .53, .53, .16, '#a87a1c']],
        shell: [[.32, .42, 0, .68, .62, .1, '#f4d8c8'], [.36, .38, .1, .64, .6, .18, '#f8e4d8'], [.4, .36, .18, .44, .58, .2, '#e8b8a8'], [.48, .36, .18, .52, .58, .2, '#e8b8a8'], [.56, .36, .18, .6, .58, .2, '#e8b8a8'], [.46, .6, 0, .54, .68, .08, '#d8a090']],
        wbird: [[.34, .34, 0, .66, .66, .06, '#7c5228'], [.38, .42, .06, .62, .6, .26, '#b8854c'], [.52, .38, .26, .64, .5, .38, '#c89a5c'], [.64, .42, .3, .7, .46, .33, '#e0a040'], [.32, .48, .18, .4, .56, .28, '#a8743c']],
        sglass: [[.34, .34, 0, .66, .66, .05, '#7c5228'], [.38, .38, .05, .62, .62, .22, '#d8ecf4'], [.41, .41, .05, .59, .59, .14, '#e2cd8e'], [.47, .47, .22, .53, .53, .27, '#d8ecf4'], [.38, .38, .27, .62, .62, .44, '#d8ecf4'], [.44, .44, .27, .56, .56, .32, '#e2cd8e'], [.34, .34, .05, .38, .38, .44, '#5c3c1c'], [.62, .62, .05, .66, .66, .44, '#5c3c1c'], [.34, .34, .44, .66, .66, .49, '#7c5228']],
        opot: [[.38, .38, 0, .62, .62, .06, '#8a5a3a'], [.32, .32, .06, .68, .68, .34, '#b8704a'], [.31, .31, .18, .69, .69, .22, '#e0c080'], [.4, .4, .34, .6, .6, .44, '#a8603c'], [.36, .36, .44, .64, .64, .48, '#c8805a'], [.42, .42, .48, .58, .58, .49, '#3a2418']],
        ammon: [[.3, .36, 0, .7, .64, .08, '#9a9088'], [.32, .46, .08, .68, .56, .42, '#c8a878'], [.4, .455, .16, .6, .565, .34, '#a88858'], [.46, .45, .22, .54, .57, .28, '#806440']],
        dtooth: [[.34, .34, 0, .66, .66, .06, '#5c3c1c'], [.4, .42, .06, .6, .58, .2, '#f0e8d0'], [.42, .44, .2, .58, .56, .34, '#e8dcc0'], [.45, .46, .34, .55, .54, .46, '#e0d0b0'], [.47, .48, .46, .53, .52, .54, '#d8c8a0']],
        cball: [[.36, .36, 0, .64, .64, .08, '#5c5c66'], [.4, .4, .08, .6, .6, .12, '#7a7a86'], [.38, .42, .12, .62, .58, .42, '#bfe8ff'], [.42, .38, .12, .58, .62, .42, '#bfe8ff'], [.4, .4, .16, .6, .6, .38, '#d8f4ff'], [.46, .58, .3, .52, .63, .36, '#ffffff']],
        gear: [[.3, .4, 0, .7, .6, .06, '#6a6a66'], [.34, .47, .06, .66, .53, .38, '#3fb898'], [.3, .47, .18, .34, .53, .26, '#2a8a70'], [.66, .47, .18, .7, .53, .26, '#2a8a70'], [.46, .47, .38, .54, .53, .43, '#2a8a70'], [.46, .53, .18, .54, .54, .26, '#8ae8cc']],
        fbottle: [[.38, .38, 0, .62, .62, .34, '#d8ecf4'], [.41, .41, .02, .59, .59, .24, '#8affc8'], [.45, .45, .34, .55, .55, .42, '#d8ecf4'], [.44, .44, .42, .56, .56, .48, '#a8743c']],
        dscale: [[.3, .4, 0, .7, .6, .06, '#3a2a3a'], [.34, .46, .06, .66, .54, .4, '#2a8a5a'], [.38, .54, .12, .62, .55, .32, '#4ac88a'], [.44, .46, .4, .56, .54, .48, '#2a8a5a']],
        pfeath: [[.36, .36, 0, .64, .64, .05, '#3a2a2a'], [.48, .48, .05, .52, .52, .5, '#f6e0a0'], [.42, .47, .15, .58, .53, .3, '#ff6a2c'], [.43, .47, .3, .57, .53, .42, '#ffa83c'], [.45, .47, .42, .55, .53, .5, '#ffd84a']],
        sdust: [[.38, .38, 0, .62, .62, .32, '#c8d8f4'], [.41, .41, .02, .59, .59, .2, '#3a3a8a'], [.43, .5, .2, .47, .54, .22, '#fff6a0'], [.52, .43, .2, .56, .47, .22, '#fff6a0'], [.45, .45, .32, .55, .55, .4, '#c8d8f4'], [.44, .44, .4, .56, .56, .46, '#a8743c']],
        dlant: [[.36, .36, 0, .64, .64, .06, '#2a1a2a'], [.38, .38, .06, .62, .62, .36, '#c060e0'], [.45, .45, .1, .55, .55, .28, '#ffb8ff'], [.36, .36, .06, .39, .39, .36, '#2a1a2a'], [.61, .61, .06, .64, .64, .36, '#2a1a2a'], [.36, .36, .36, .64, .64, .42, '#2a1a2a'], [.47, .47, .42, .53, .53, .52, '#2a1a2a']],
        omask: [[.4, .44, 0, .6, .56, .06, '#5c3c1c'], [.47, .48, .06, .53, .52, .2, '#5c3c1c'], [.34, .48, .16, .66, .52, .5, '#2a2034'], [.38, .52, .34, .45, .53, .4, '#ff3a5a'], [.55, .52, .34, .62, .53, .4, '#ff3a5a'], [.44, .48, .5, .56, .52, .58, '#5a3a8a']],
        coinpile: [[.24, .24, 0, .76, .76, .08, '#c89a2c'], [.3, .3, .08, .7, .7, .16, '#e8b840'], [.36, .36, .16, .64, .64, .24, '#f0c84a'], [.42, .42, .24, .58, .58, .3, '#f6d060'], [.2, .62, 0, .3, .72, .04, '#e8b840'], [.7, .2, 0, .8, .3, .04, '#e8b840']],
        fossil: [[.2, .3, 0, .8, .7, .08, '#7c5228'], [.24, .46, .08, .5, .54, .36, '#c8a878'], [.3, .54, .14, .44, .545, .3, '#a88858'], [.58, .44, .08, .72, .56, .2, '#f0e8d0'], [.6, .46, .2, .7, .54, .32, '#e8dcc0'], [.63, .47, .32, .67, .53, .4, '#e0d0b0'], [.42, .66, .08, .58, .7, .1, '#f6f0de']],
        mclock: [[.32, .36, 0, .68, .64, .62, '#8a5a2c'], [.36, .64, .36, .64, .65, .58, '#f6f0de'], [.49, .65, .42, .51, .66, .54, '#2a2a30'], [.5, .65, .47, .58, .66, .49, '#2a2a30'], [.4, .64, .08, .6, .65, .28, '#3fb898'], [.3, .34, .62, .7, .66, .68, '#6a4424']],
        sball: [[.34, .34, 0, .66, .66, .08, '#c09010'], [.36, .4, .08, .64, .6, .44, '#2a2a7a'], [.4, .36, .08, .6, .64, .44, '#2a2a7a'], [.38, .38, .12, .62, .62, .4, '#3a3a9a'], [.44, .64, .28, .47, .65, .31, '#fff6a0'], [.53, .64, .2, .56, .65, .23, '#fff6a0'], [.5, .64, .34, .52, .65, .36, '#ffffff']],
        phoenix: [[.3, .3, 0, .7, .7, .14, '#d8d0b8'], [.4, .42, .14, .6, .6, .4, '#ff8a3c'], [.52, .4, .4, .62, .5, .5, '#ffb84a'], [.62, .43, .43, .67, .47, .46, '#ffd84a'], [.26, .46, .3, .4, .56, .5, '#ff5a2c'], [.6, .46, .3, .74, .56, .5, '#ff5a2c'], [.34, .5, .14, .42, .6, .3, '#ffd84a']],
        dpot: [[.34, .34, 0, .66, .66, .06, '#5a3a2a'], [.28, .28, .06, .72, .72, .4, '#2a8a5a'], [.27, .27, .2, .73, .73, .25, '#f0c030'], [.38, .38, .4, .62, .62, .5, '#227048'], [.34, .34, .5, .66, .66, .54, '#f0c030'], [.41, .41, .54, .59, .59, .55, '#10301e'], [.44, .72, .28, .56, .73, .36, '#ff4a8a']]
    };
    DECOS.forEach(([id]) => { o[T['DC_' + id.toUpperCase()]] = [boxSprite(DECO_ART[id], { base: 1 })]; });
    o[T.CLAMP] = [boxSprite([[.3, .3, 0, .7, .7, .12, '#5c5c66'], [.36, .36, .12, .64, .64, .2, '#7a7a86'], [.4, .4, .2, .6, .6, .62, '#d8c8ff'], [.44, .44, .62, .56, .56, .76, '#ffffff'], [.3, .46, .26, .4, .54, .5, '#b8a0ff'], [.6, .46, .26, .7, .54, .46, '#b8a0ff']])];
    o[T.CROWN] = [boxSprite([[.26, .26, 0, .74, .74, .12, '#8a3a2c'], [.3, .3, .12, .7, .7, .3, '#f2c840'], [.3, .3, .3, .38, .38, .44, '#f2c840'], [.62, .3, .3, .7, .38, .44, '#f2c840'], [.3, .62, .3, .38, .7, .44, '#f2c840'], [.62, .62, .3, .7, .7, .44, '#f2c840'], [.46, .7, .16, .54, .71, .24, '#ff4a8a'], [.29, .46, .16, .3, .54, .24, '#4ac8f0']])];
    // 動く床: 北向きの絵を作って回す。光っている矢じるしが動いている印
    // 北向きの ▲ を 細い板を重ねて作る(y0 が先っぽ)
    const tri = (y0, h, col) => [0, 1, 2, 3].map(i => { const w = .05 + i * .06; return [.5 - w, y0 + i * h / 4, .08, .5 + w, y0 + (i + 1) * h / 4, .11, col]; });
    const belt = (base, n, on) => { const col = on ? '#ffd84a' : '#d8d8c8'; const ys = n === 2 ? [.06, .29, .52, .75] : [.1, .4, .7], h = n === 2 ? .18 : .22; return [[0, 0, 0, 1, 1, .08, base], [0, 0, .08, .08, 1, .12, '#2a2a30'], [.92, 0, .08, 1, 1, .12, '#2a2a30']].concat(...ys.map(y => tri(y, h, col))); };
    ['N', 'E', 'S', 'W'].forEach((c, i) => {
        o[T['CONV_' + c]] = [boxSprite(belt('#4a4a54', 1, false).map(b => rotBox(b, i)), { base: 1 }), boxSprite(belt('#4a4a54', 1, true).map(b => rotBox(b, i)), { base: 1 })];
        o[T['FCONV_' + c]] = [boxSprite(belt('#7a3a2c', 2, false).map(b => rotBox(b, i)), { base: 1 }), boxSprite(belt('#7a3a2c', 2, true).map(b => rotBox(b, i)), { base: 1 })];
        const disp = [[.06, .06, 0, .94, .94, .8, { top: TX.brick }], [.34, -.01, .26, .66, .02, .58, '#1a1a1a'], [.4, .4, .8, .6, .6, .84, '#d8301c']];
        o[T['DISP_' + c]] = [boxSprite(disp.map(b => rotBox(b, i)))];
    });
    o[T.WALL_W] = [block(TX.plank, .85)]; o[T.WALL_NW] = [block(TX.nplank, .85)]; o[T.WALL_S] = [block(TX.brick, .85)];
    // 扉: [閉(東西のかべ), 開(東西のかべ), 閉(南北のかべ), 開(南北のかべ)]
    const doorFrame = [[0, .42, 0, .12, .58, .95, '#7c5228'], [.88, .42, 0, 1, .58, .95, '#7c5228'], [0, .42, .95, 1, .58, 1.05, '#7c5228']];
    const turn = l => l.map(b => rotBox(b, 1));
    // 扉は 木と金属で色だけ変える
    const mkDoor = (frame, leaf, knob) => {
        const fr = doorFrame.map(b => b.slice(0, 6).concat([frame]));
        const shut = fr.concat([[.12, .46, 0, .88, .54, .95, leaf], [.68, .54, .42, .76, .56, .5, knob]]), open = fr.concat([[.12, .5, 0, .2, 1.2, .95, leaf]]);
        return [boxSprite(shut), boxSprite(open), boxSprite(turn(shut)), boxSprite(turn(open))];
    };
    o[T.DOOR] = mkDoor('#7c5228', '#b8854c', '#ffd84a');
    const MC = { cu: ['#8a3a18', '#ec7a3a', '#5ad0b0'], fe: ['#5c626a', '#b4bac2', '#3c4048'], au: ['#a8801c', '#f2c840', '#fff4b0'] };
    for (const m in MC) {
        const U = m.toUpperCase(), c = MC[m];
        o[T['WALL_' + U]] = [block(TX['m' + m], .85)];
        o[T['DOOR_' + U]] = mkDoor(c[0], c[1], c[2]);
        o[T['FENCE_' + U]] = [boxSprite([[.42, .42, 0, .58, .58, .7, c[0]], [.02, .46, .36, .98, .54, .46, c[1]], [.46, .02, .36, .54, .98, .46, c[1]], [.02, .46, .56, .98, .54, .62, c[1]], [.46, .02, .56, .54, .98, .62, c[1]]])];
    }
    o[T.TORCH] = [boxSprite([[.44, .44, 0, .56, .56, .55, '#8a5a2c'], [.38, .38, .55, .62, .62, .78, '#ffb03c'], [.44, .44, .78, .56, .56, .92, '#ffe88a']])];
    // 作業台: 足のある台。赤い作業マットと道具でかべと見分ける
    o[T.BENCH] = [boxSprite([[.1, .1, 0, .22, .22, .42, '#6e4622'], [.78, .1, 0, .9, .22, .42, '#6e4622'], [.1, .78, 0, .22, .9, .42, '#6e4622'], [.78, .78, 0, .9, .9, .42, '#6e4622'],
        [.02, .02, .42, .98, .98, .56, { top: TX.benchtop, side: TX.wood }], [.5, .16, .56, .9, .56, .58, '#c8443c'],
        [.12, .62, .56, .46, .72, .62, '#b8854c'], [.12, .56, .56, .24, .78, .7, '#d9dde2'], [.56, .68, .56, .9, .86, .6, '#d9dde2'], [.86, .7, .56, .96, .84, .66, '#7c5228']])];
    o[T.FURNACE] = [boxSprite([[.06, .06, 0, .94, .94, .7, { top: TX.brick }], [.16, .16, .7, .84, .84, .82, { top: TX.brick }], [.56, .2, .82, .8, .44, 1.3, '#7c6a5a'], [.6, .24, 1.3, .76, .4, 1.32, '#2a2420'], [.28, .94, .1, .72, .96, .44, '#ff8a2c']])];
    o[T.ANVIL] = [boxSprite([[.26, .3, 0, .74, .7, .2, '#4a4a54'], [.38, .38, .2, .62, .62, .42, '#3e3e48'], [.12, .28, .42, .88, .72, .6, '#5c5c68']])];
    o[T.BED] = [boxSprite([[.04, .12, 0, .96, .88, .26, '#7c5228'], [.06, .14, .26, .68, .86, .36, '#3a7ac8'], [.3, .14, .36, .36, .86, .37, '#2a5a9c'], [.06, .4, .36, .68, .46, .37, '#2a5a9c'], [.68, .14, .26, .94, .86, .4, '#f4d860']])];
    const crop = (cols, tall) => [0, 1, 2].map(s => boxSprite([[0, 0, 0, 1, 1, 0, { top: TX.farm[0] }]].concat([[.2, .3], [.55, .22], [.3, .66], [.66, .62]].map(p => [p[0], p[1], 0, p[0] + .14, p[1] + .14, tall * (s + 1) / 3, s === 2 ? cols[1] : cols[0]]))));
    o[T.CROP_C] = crop(['#5ab04a', '#e8821c'], .46); o[T.CROP_W] = crop(['#7ab84a', '#e8c85a'], .62);
    o[T.GRAVE] = [boxSprite([[.26, .26, 0, .74, .74, .4, '#8a6a3c'], [.38, .38, .4, .62, .62, .52, '#6e5230']])];
    o[T.SAPLING] = [boxSprite([[.46, .46, 0, .54, .54, .3, '#7c5228'], [.34, .34, .3, .66, .66, .52, '#6cc860']]), boxSprite([[.44, .44, 0, .56, .56, .55, '#7c5228'], [.2, .2, .5, .8, .8, 1, '#4aa850']])];
    // 見どころ
    o[T.CAVEIN] = [boxSprite([[0, 0, 0, 1, 1, 0, '#0c0a08'], [.05, .05, 0, .3, .95, .3, '#7c7c76'], [.7, .05, 0, .95, .95, .3, '#7c7c76'], [.05, .02, 0, .95, .28, .5, '#8e8e8a'], [.3, .55, 0, .7, .7, .02, '#3a342c'], [.3, .75, 0, .7, .9, .02, '#4c463c']])];
    o[T.BURIED] = [boxSprite([[.04, .04, 0, .96, .96, .5, { top: TX.rockc }], [.2, .2, .5, .8, .8, .72, { top: TX.rockc }]])];
    const giant = [];
    for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) for (let z = 0; z < 4; z++) giant.push([i, j, z, i + 1, j + 1, z + 1, { top: TX.woodtop, side: TX.wood }]);
    for (let i = -3; i < 4; i++) for (let j = -3; j < 4; j++) { if (Math.abs(i) + Math.abs(j) < 6) giant.push([i, j, 3.6, i + 1, j + 1, 4.6, { top: TX.leaf }]); if (Math.abs(i) + Math.abs(j) < 4) giant.push([i, j, 4.6, i + 1, j + 1, 5.6, { top: TX.leaf }]); }
    o[T.GIANT] = [boxSprite(giant, { w: 560, h: 560, ox: 270, oy: 440 })];
    o[T.TOWERW] = [block(TX.rwall, 2.4)];
    o[T.SANDB1] = [block(TX.sandb, .6)]; o[T.SANDB2] = [block(TX.sandb, 1.2)]; o[T.SANDB3] = [block(TX.sandb, 1.8)];
    o[T.METEOR] = [boxSprite([[.04, .04, 0, .96, .96, .8, '#3a2a2c'], [.2, .2, .8, .8, .8, 1.2, '#4a3034'], [.1, .96, .2, .34, .98, .5, '#ff8a2c'], [.5, .96, .4, .8, .98, .7, '#7fe8ff'], [.34, .34, 1.2, .6, .6, 1.3, '#ff8a2c']])];
    o[T.HULL] = [block(TX.hull, .8)];
    o[T.MAST] = [boxSprite([[.4, .4, 0, .6, .6, 2.8, '#6e5230'], [.1, .46, 1.2, .9, .54, 2.5, '#e8e0c8']])];
    o[T.HUTW] = [boxSprite([[0, 0, 0, 1, 1, .9, { top: TX.plank, side: TX.plank }], [-.02, -.02, .9, 1.02, 1.02, 1.05, '#b8543c']])];
    o[T.FENCE] = [boxSprite([[.42, .42, 0, .58, .58, .7, '#a8743c'], [.02, .46, .36, .98, .54, .46, '#c08d54'], [.46, .02, .36, .54, .98, .46, '#c08d54']])];
    o[T.CRYSTAL] = [boxSprite([[.1, .1, 0, .9, .9, .12, '#4a3e5c'], [.38, .38, .1, .62, .62, .95, '#c8a8ff'], [.14, .56, .1, .32, .76, .58, '#a080f0'], [.64, .2, .1, .84, .4, .68, '#e0c8ff']])];
    o[T.SPAWNER] = [boxSprite([[.08, .08, 0, .92, .92, .9, '#2a1c34'], [.2, .92, .2, .36, .94, .7, '#ff6a2c'], [.5, .92, .3, .66, .94, .76, '#c05aff'], [.3, .3, .9, .7, .7, 1, '#ff6a2c']])];
    OS = o;
}
// 導線: 向き(たて・よこ・十字・交差)の線。信号が来ていると明るい
const wireCache = {};
const LIT = '#ff3a1c', DIM = '#9a2818';
// mode の線の箱。z0 の高さに うすく。lit0/lit1 = 通り道ごとの信号
function wireBoxes(mode, z0, lit0, lit1) {
    const z = z0 + .04, w = .13, a = .5 - w / 2, b = .5 + w / 2, c0 = lit0 ? LIT : DIM, c1 = lit1 ? LIT : DIM;
    if (mode === 'V') return [[a, 0, z0, b, 1, z, c0]];
    if (mode === 'H') return [[0, a, z0, 1, b, z, c0]];
    if (mode === 'P') return [[a, 0, z0, b, 1, z, c0], [0, a, z0, 1, b, z, c0], [a - .04, a - .04, z0, b + .04, b + .04, z + .01, c0]];
    // L字: まん中から 2本の腕
    if (mode !== 'X') { const arm = [[a, 0, b, b], [a, a, 1, b], [a, a, b, 1], [0, a, b, b]]; return WIRE_CH[mode][0].map(r => [arm[r][0], arm[r][1], z0, arm[r][2], arm[r][3], z, c0]); }
    // 交差: たての線は まん中で切れて、よこの線が 上を橋のように通る
    return [[a, 0, z0, b, .34, z, c0], [a, .66, z0, b, 1, z, c0], [0, a, z0, 1, b, z + .03, c1], [.36, a - .03, z0, .64, b + .03, z + .02, '#5a5a62']];
}
function wireSprite(x, y) {
    const m = wireMode(S.f, x, y), l0 = !VIEW.title && wireLevel(x, y, 0) > 0, l1 = !VIEW.title && wireLevel(x, y, 1) > 0, key = m + l0 + l1;
    return wireCache[key] || (wireCache[key] = boxSprite(wireBoxes(m, 0, l0, l1)));
}
// 導線つきの かべ: もとの かべの絵の上に 線
const WALL_TEX = { WALL_W: 'plank', WALL_S: 'brick', WALL_CU: 'mcu', WALL_FE: 'mfe', WALL_AU: 'mau', WALL_NW: 'nplank' };
function wallWireSprite(x, y) {
    const e = S.ex[exKey(S.f, x, y)], base = e && e.base, m = wireMode(S.f, x, y);
    const l0 = !VIEW.title && wireLevel(x, y, 0) > 0, l1 = !VIEW.title && wireLevel(x, y, 1) > 0;
    // 腕の先が 地面の導線・回路の部品なら、かべの横を つたって 下までおりる線を描く(上どうしは つながっているので いらない)
    const drops = [];
    WIRE_CH[m].forEach((arms, ci) => arms.forEach(a => { const nx = x + DIR4[a][0], ny = y + DIR4[a][1]; if (getT(S.f, nx, ny) !== T.WIRE_W && armLinked(x, y, a)) drops.push([a, ci]); }));
    const key = 'w' + (base || '') + m + l0 + l1 + drops.map(q => q[0]).join('');
    if (wireCache[key]) return wireCache[key];
    const tex = TX[WALL_TEX[base] || 'brick'], w = .13, a0 = .5 - w / 2, b0 = .5 + w / 2;
    const face = [[a0, -.02, 0, b0, 0, .89], [1, a0, 0, 1.02, b0, .89], [a0, 1, 0, b0, 1.02, .89], [-.02, a0, 0, 0, b0, .89]];
    const side = drops.map(([a, ci]) => face[a].concat([(ci ? l1 : l0) ? LIT : DIM]));
    return (wireCache[key] = boxSprite([[0, 0, 0, 1, 1, .85, { top: tex, side: tex }]].concat(wireBoxes(m, .85, l0, l1), side), { base: 1 }));
}
// 北向きの箱を d の向きに回す
const rotBoxD = (q, d) => { const f = [(x, y) => [x, y], (x, y) => [1 - y, x], (x, y) => [1 - x, 1 - y], (x, y) => [y, 1 - x]][d], p = f(q[0], q[1]), r = f(q[3], q[4]); return [Math.min(p[0], r[0]), Math.min(p[1], r[1]), q[2], Math.max(p[0], r[0]), Math.max(p[1], r[1]), q[5], q[6]]; };
// リピーター: 石の板に 出る向きの矢印
// 北向きの矢印(先っぽ y0、三角の底 yb、軸の下 y1)を 細い板で作る
const arrowBoxes = (y0, yb, y1, col) => { const l = [[.43, yb, .1, .57, y1, .13, col]], n = 6; for (let i = 0; i < n; i++) { const w = .04 + (i + 1) * (.24 / n), ya = y0 + (yb - y0) * i / n, yz = y0 + (yb - y0) * (i + 1) / n; l.push([.5 - w, ya, .1, .5 + w, yz + .005, .13, col]); } return l; };
function repSprite(d, on) {
    const key = 'r' + d + on; if (wireCache[key]) return wireCache[key];
    const l = [[.08, .08, 0, .92, .92, .1, '#a8a8a0']].concat(arrowBoxes(.12, .48, .88, on ? LIT : '#7a2018'));
    return (wireCache[key] = boxSprite(l.map((q, i) => i ? rotBoxD(q, d) : q), { base: 1 }));
}
// インバーター: 黒い板に 矢印、先に 白い丸(反対にする しるし)。前へ出しているとき 明るい
function invSprite(d, on) {
    const key = 'i' + d + on; if (wireCache[key]) return wireCache[key];
    const c = on ? LIT : '#7a2018';
    const l = [[.08, .08, 0, .92, .92, .1, '#4a4a56']].concat(arrowBoxes(.3, .58, .9, c), [[.4, .11, .1, .6, .27, .16, '#f4f4f8'], [.45, .16, .16, .55, .22, .17, '#4a4a56']]);
    return (wireCache[key] = boxSprite(l.map((q, i) => i ? rotBoxD(q, d) : q), { base: 1 }));
}
function turnThumb(x, y, c) {
    let spr;
    if (c.w) {
        const e = S.ex[exKey(S.f, x, y)], base = getT(S.f, x, y) === T.WIRE_W && e && e.base, tex = base && TX[WALL_TEX[base] || 'brick'];
        spr = base ? boxSprite([[0, 0, 0, 1, 1, .85, { top: tex, side: tex }]].concat(wireBoxes(c.w, .85, false, false)), { base: 1 }) : boxSprite(wireBoxes(c.w, 0, false, false));
    } else spr = TILE[c.t].rep ? repSprite(TILE[c.t].rep - 1, false) : TILE[c.t].inv ? invSprite(TILE[c.t].inv - 1, false) : OS[c.t][0];
    const src = spr.cv, W = src.width, Hh = src.height, px = src.getContext('2d').getImageData(0, 0, W, Hh).data;
    let x0 = W, y0 = Hh, x1 = 0, y1 = 0;
    for (let yy = 0; yy < Hh; yy++) for (let xx = 0; xx < W; xx++) if (px[(yy * W + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 80;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = Math.min(88 / bw, 72 / bh);
    cv.getContext('2d').drawImage(src, x0, y0, bw, bh, (96 - bw * sc) / 2, (80 - bh * sc) / 2, bw * sc, bh * sc);
    return cv;
}
const objSprite = (t, x, y) => { const a = OS[t]; if (!a) return null;
    if (t === T.PIT) return pitSpriteAt(S.f, x, y);
    if (t === T.LADDER_D) return pitSpriteAt(S.f, x, y, LADDER_PARTS);
    if (t === T.WIRE) return wireSprite(x, y);
    if (TILE[t].rep) return repSprite(TILE[t].rep - 1, !VIEW.title && repLit(x, y));
    if (TILE[t].inv) return invSprite(TILE[t].inv - 1, !VIEW.title && invLit(x, y));
    if (t === T.WIRE_W) return wallWireSprite(x, y);
    if (t === T.PLATE) return a[!VIEW.title && plateDown(x, y) ? 1 : 0];
    if (t === T.BULB || TILE[t].belt) return a[!VIEW.title && powered(x, y) ? 1 : 0];
    if (TILE[t].door) {
        // かべの向きに合わせ、主人公が通るあいだだけ開く
        const so = (dx, dy) => TILE[getT(S.f, x + dx, y + dy)].solid;
        const alongY = so(0, -1) && so(0, 1) && !(so(-1, 0) && so(1, 0));
        const open = !VIEW.title && Math.abs(P.rx - x) + Math.abs(P.ry - y) < .95;
        return a[(alongY ? 2 : 0) + (open ? 1 : 0)];
    }
    if (t === T.SAPLING) { const c = S.ex[exKey(S.f, x, y)]; return a[c && S.T - c.p > TREE_TIME / 2 ? 1 : 0]; }
    return a.length > 1 ? a[(x * 7 + y * 13) & 1] : a[0]; };

// 穴のまわりの地面: となり4マスで いちばん多い地面(なければ もとの地面)
const PIT_NORM = t => t === T.GRASS2 || t === T.FLOWER ? T.GRASS : t;
function pitGround(f, x, y) {
    const cnt = new Map();
    for (const o of DIR4) {
        const nx = x + o[0], ny = y + o[1], out = nx < 0 || ny < 0 || nx >= WORLD || ny >= WORLD;
        const t = out ? (f === 0 ? T.DIRT : isCave(f) ? T.CAVE : T.ASH) : PIT_NORM(getT(f, nx, ny));   // マップの外は ふつうの土
        if (TILE[t].ground) cnt.set(t, (cnt.get(t) || 0) + 1);
    }
    let g = f === 0 ? groundOf(0, x, y) : isCave(f) ? T.CAVE : T.ASH; if (g === T.WATER) g = T.GRASS; g = PIT_NORM(g);
    let best = cnt.has(g) ? g : null, bv = best ? cnt.get(g) : 0;
    for (const [t, n] of cnt) if (n > bv) { best = t; bv = n; }
    return best || g;
}
// 穴の絵: 本当に下へ掘れた たて穴として描く。見えるのは 奥(北)のかべと 左(西)のかべの内がわで、
// 奥の角から まっすぐ下へ のびる線で 2つのかべが分かれる。深いほど暗く、ふちの外は透明(下の地面が見える)
const PIT_WALL = { sand: ['#d8c080', '#b89a5c'], cave: ['#8a847a', '#6a645c'], dirt: ['#a87848', '#86603a'] };
const pitCache = {};
const isHole = t => t === T.PIT || t === T.LADDER_D;
const mixHex = (a, b, t) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), f = (s1, s2) => Math.round(s1 + (s2 - s1) * t); return 'rgb(' + f(p >> 16, q >> 16) + ',' + f((p >> 8) & 255, (q >> 8) & 255) + ',' + f(p & 255, q & 255) + ')'; };
const PIT_N = 10;   // 1マスを 10x10 に分ける(ふちの はば = 1升)
// (x,y)のまわり 5x5 マスの 穴の並び(絵の使い回しのキー)
function holeSig(f, x, y) { let s = ''; for (let dy = -3; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) { const t = getT(f, x + dx, y + dy); s += isHole(t) ? 1 : t === T.WATER ? 2 : 0; } return s; }
function pitSpriteAt(f, x, y, ladder) {
    const g = pitGround(f, x, y), m = g === T.SAND ? 'sand' : g === T.CAVE || g === T.ASH ? 'cave' : 'dirt';
    const key = m + (ladder ? 'L' : '') + VIEW.rot + holeSig(f, x, y);
    if (pitCache[key]) return pitCache[key];
    const N = PIT_N, wt = (dx, dy) => { const w = rvInv(dx, dy); return getT(f, x + w[0], y + w[1]); }, hole = (dx, dy) => isHole(wt(dx, dy));   // dx,dy は 画面の向き
    // 升は マスが穴なら 穴(穴のまわりに 地面のふちは作らない)
    const cell = (gx, gy) => hole(Math.floor(gx / N), Math.floor(gy / N));
    // となりが水なら そのかべは 水が流れ落ちる かべにする
    const wet = (gx, gy) => wt(Math.floor(gx / N), Math.floor(gy / N)) === T.WATER;
    const cv = mkCanvas(O_W, O_H), c = cv.getContext('2d'), ox = O_X, oy = O_Y;
    const P = (px, py, z) => { const p = pj(px, py, z); return [ox + p[0], oy + p[1]]; };
    const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
    // 自分のマスの 口(穴の升)で 切りぬく。となりと つながる辺は 少しはみ出す
    const e = .03 * N;
    c.save(); c.beginPath();
    for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) if (cell(a, b)) {
        // 穴の側と、奥・左の水の側(水のかべが見える側)は はみ出して 地面が見えないように
        const open = (dx, dy) => hole(dx, dy) || ((dx < 0 || dy < 0) && wt(dx, dy) === T.WATER);
        const l = a === 0 && open(-1, 0) ? -e : 0, r = a === N - 1 && open(1, 0) ? e : 0, t = b === 0 && open(0, -1) ? -e : 0, bt = b === N - 1 && open(0, 1) ? e : 0;
        const q = [P((a + l) / N, (b + t) / N, 0), P((a + 1 + r) / N, (b + t) / N, 0), P((a + 1 + r) / N, (b + 1 + bt) / N, 0), P((a + l) / N, (b + 1 + bt) / N, 0)];
        c.moveTo(q[0][0], q[0][1]); q.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.closePath();
    }
    c.clip();
    c.fillStyle = '#0c0806'; c.fillRect(0, 0, O_W, O_H);
    // かべを集める(まわりのマスの分も)。横のかべ(南向き)と たてのかべ(東向き)を それぞれ つなげる
    const H2 = [], V2 = [];
    for (let gy = -2 * N; gy < N; gy++) for (let gx = -N; gx < 2 * N; gx++) {
        if (!cell(gx, gy)) continue;
        if (!cell(gx, gy - 1)) { const w = wet(gx, gy - 1), last = H2[H2.length - 1]; if (last && last.y === gy && last.x1 === gx && last.w === w) last.x1 = gx + 1; else H2.push({ y: gy, x0: gx, x1: gx + 1, w }); }
        if (!cell(gx - 1, gy)) V2.push({ x: gx, y0: gy, y1: gy + 1, w: wet(gx - 1, gy) });
    }
    V2.sort((p, q) => p.x - q.x || p.y0 - q.y0);
    const V = []; for (const v of V2) { const l = V[V.length - 1]; if (l && l.x === v.x && l.y1 === v.y0 && l.w === v.w) l.y1 = v.y1; else V.push(Object.assign({}, v)); }
    const [c0, c1] = PIT_WALL[m], DARK = '#0c0806', BANDS = 14, DEEP = .56;
    const WATER_C = ['#4a9fd8', '#3a88c0'];   // 水のかべ(水面と同じ青から 深いほど暗く)
    const wall = (p1, p2, col, w) => { for (let k = 0; k < BANDS; k++) { const za = DEEP * k / BANDS, zb = DEEP * (k + 1) / BANDS + .01; poly([P(p1[0], p1[1], -za), P(p2[0], p2[1], -za), P(p2[0], p2[1], -zb), P(p1[0], p1[1], -zb)], mixHex(col, DARK, Math.pow(k / (BANDS - 1), .8))); }
    };
    // 奥から順に(上のかべ → 下のかべ)
    const sh = w => w ? e / N : 0;   // 水のかべは 口のはみ出しの分 奥から
    const ws = H2.map(h => ({ y: h.y, p1: [h.x0 / N, h.y / N - sh(h.w)], p2: [h.x1 / N, h.y / N - sh(h.w)], col: h.w ? WATER_C[0] : c0, w: h.w })).concat(V.map(v => ({ y: v.y0, p1: [v.x / N - sh(v.w), v.y0 / N], p2: [v.x / N - sh(v.w), v.y1 / N], col: v.w ? WATER_C[1] : c1, w: v.w })));
    ws.sort((p, q) => p.y - q.y);
    ws.forEach(w => wall(w.p1, w.p2, w.col, w.w));
    // 地層の すじ と 奥の角の たて線
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 1;
    for (const w of ws) if (!w.w) for (const z of [.12, .26, .42]) { const p = P(w.p1[0], w.p1[1], -z), q = P(w.p2[0], w.p2[1], -z); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    c.strokeStyle = 'rgba(0,0,0,.45)';
    for (const h of H2) if (V.some(v => v.x === h.x0 && v.y0 === h.y)) { const p = P(h.x0 / N, h.y / N, 0), q = P(h.x0 / N, h.y / N, -DEEP); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    c.restore();
    if (ladder) ladder.map(q => VIEW.rot ? rotQ(q, .5) : q).sort((p, q) => ((p[0] + p[3]) * SN + (p[1] + p[4]) * CS + (p[2] + p[5]) * .35) - ((q[0] + q[3]) * SN + (q[1] + q[4]) * CS + (q[2] + q[5]) * .35)).forEach(q => drawBox(c, ox, oy, q, 1));
    if (Object.keys(pitCache).length > 400) for (const k in pitCache) delete pitCache[k];
    return (pitCache[key] = { cv, ox, oy });
}
function groundSprite(t, f, x, y) {
    const v = ((x * 3 + y * 5) % 3 + 3) % 3, pk = a => a[v % a.length];
    switch (t) {
        case T.SCORCH: return pk(GS.scorch); case T.RAIL: return GS.rail[0]; case T.TRAP_PIT: case T.TRAP_ARROW: return GS.rfloor[0];
        case T.GRASS: return pk(GS.grass); case T.GRASS2: return pk(GS.grass2); case T.FLOWER: return pk(GS.flower); case T.DIRT: return pk(GS.dirt); case T.SAND: return pk(GS.sand); case T.SNOW: return pk(GS.snow);
        case T.CAVE: return pk(GS.cave); case T.ASH: return pk(GS.ash); case T.RFLOOR: return GS.rfloor[0]; case T.CFLOOR: return GS.cfloor[0];
        case T.CROP_C: case T.CROP_W: return GS.farm[0];   // 畑の下も畑の土(すき間に草が見えないように)
        case T.WFLOOR: return GS.wfloor[0]; case T.CARPET: return GS.carpet[0]; case T.FLOOR_NW: return GS.nfloor[0]; case T.FLOOR_CU: return GS.flcu[0]; case T.FLOOR_FE: return GS.flfe[0]; case T.FLOOR_AU: return GS.flau[0]; case T.FARM: return GS.farm[0]; case T.WATER: return pk(GS.water); case T.MAGMA: return pk(GS.magma);
    }
    return null;
}
// 物の下に敷く地面(バイオームの計算は重いので覚えておく)
const underCache = new Map();
function underSprite(f, x, y) {
    const k = f * 1000000 + y * 1000 + x;
    let t = underCache.get(k);
    if (t === undefined) {
        t = f === 0 ? groundOf(0, x, y) : isCave(f) ? T.CAVE : T.ASH;
        if (t === T.WATER) t = T.GRASS;
        if (underCache.size > 30000) underCache.clear();
        underCache.set(k, t);
    }
    return groundSprite(t, f, x, y);
}

// ---------- 魔物のスプライト ----------
const mobCache = {};
function rotBox(b, k) {
    let [x0, y0, z0, x1, y1, z1, c] = b;
    const size = b.size || 1;
    for (let i = 0; i < k; i++) { const a = [size - y0, size - y1], nx0 = Math.min(a[0], a[1]), nx1 = Math.max(a[0], a[1]), ny0 = x0, ny1 = x1; x0 = nx0; x1 = nx1; y0 = ny0; y1 = ny1; }
    return [x0, y0, z0, x1, y1, z1, c];
}
const FACE_ROT = [2, 3, 0, 1];   // 0=北 1=東 2=南 3=西 → 箱の回転数
function actorSprite(key, box, face, flash, opt) {
    const id = key + '_' + face + (flash ? '_f' : '');
    if (mobCache[id]) return mobCache[id];
    let s;
    if (flash) {
        const base = actorSprite(key, box, face, false, opt), cv = mkCanvas(base.cv.width, base.cv.height), c = cv.getContext('2d');
        c.drawImage(base.cv, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(0, 0, cv.width, cv.height);
        s = { cv, ox: base.ox, oy: base.oy };
    } else {
        const size = (opt && opt.size) || 1;
        s = boxSprite(box.map(b => { const q = b.slice(); q.size = size; return rotBox(q, FACE_ROT[face]); }), opt);
    }
    mobCache[id] = s;
    return s;
}
// 歩くポーズ。足(と腕)を前後に動かした箱を返す
function walkBox(box, ph) {
    const s = ph === 1 ? .13 : -.13, out = box.map(b => b.slice());
    const shift = (i, v) => { out[i][1] += v; out[i][4] += v; };
    if (box.pose === 'h') { shift(0, s); shift(1, -s); shift(3, -s * .7); shift(4, s * .7); }
    else if (box.pose === 'q') { shift(0, s); shift(3, s); shift(1, -s); shift(2, -s); }
    return out;
}
function poseSprite(key, box, face, flash, ph) {
    if (!ph || !box.pose) return actorSprite(key, box, face, flash);
    const k = key + '_w' + ph, id = k + '_' + face + (flash ? '_f' : '');
    return mobCache[id] || actorSprite(k, walkBox(box, ph), face, flash);
}
const stepInfo = (o, x, y) => { const mv = Math.hypot(x - o.rx, y - o.ry); return mv > .02 ? { ph: 1 + ((x + y) & 1), hop: Math.sin(Math.min(mv, 1) * Math.PI) * .09 } : { ph: 0, hop: 0 }; };
const BOSS_OPT = { size: 3, w: 400, h: 460, ox: 150, oy: 340 };

// ---------- 演出 ----------
const FX = { parts: [], floats: [], slashes: [], shots: [], gains: [], nextGain: 0 };
const P = { rx: 0, ry: 0, ax: 0, ay: 0, flash: 0 };
const VIEW = { cx: 0, cy: 0, shake: 0, title: false, drift: 0, needDraw: true, last: 0, rot: 0 };
// 画面を 90度 回す。絵は 向きごとに作りなおす(持ち物のアイコンは 回さない)
function rotateView(step) {
    for (const id in ITEM) iconUrl(id);   // アイコンは 回す前の向きで 作っておく
    VIEW.rot = (VIEW.rot + (step || 1) + 4) & 3;
    buildSprites();
    for (const k in wireCache) delete wireCache[k];
    for (const k in pitCache) delete pitCache[k];
    for (const k in mobCache) delete mobCache[k];
    groundLayer.key = '';
    VIEW.needDraw = true;
}
function snapView() { P.rx = S.x; P.ry = S.y; playerVia = null; VIEW.cx = S.x + .5; VIEW.cy = S.y + .5; VIEW.needDraw = true; }

let canvas, ctx, dark, dctx;
function initRender(cv) {
    canvas = cv; ctx = cv.getContext('2d');
    dark = mkCanvas(VW / 2, VH / 2); dctx = dark.getContext('2d');
    buildSprites();
}
function toScreen(x, y, z) { const v = rv(x - VIEW.cx, y - VIEW.cy), p = pj(v[0], v[1], z); return [CX + p[0] + (VIEW.sx || 0), CY + p[1] + (VIEW.sy || 0)]; }
// マス(大きさ size)の絵を置く位置: マスのまん中を回してから 角にもどす
function anchor(x, y, z, size) { const h = (size || 1) / 2, v = rv(x + h - VIEW.cx, y + h - VIEW.cy), p = pj(v[0] - h, v[1] - h, z); return [CX + p[0] + (VIEW.sx || 0), CY + p[1] + (VIEW.sy || 0)]; }
function tapToTile(sx, sy) {
    const a = (sx - CX) / TW, b = (sy - CY) / (TW * KY), w = rvInv(a * CS + b * SN, -a * SN + b * CS);
    return [Math.floor(w[0] + VIEW.cx), Math.floor(w[1] + VIEW.cy)];
}
function tilePoly(x, y, inset) {
    const i = inset || 0, a = toScreen(x + i, y + i), b = toScreen(x + 1 - i, y + i), c = toScreen(x + 1 - i, y + 1 - i), d = toScreen(x + i, y + 1 - i);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
}
function viewBounds() {
    const c = [[-60, -60], [VW + 60, -60], [-60, VH + 300], [VW + 60, VH + 300]].map(p => tapToTile(p[0], p[1]));
    return { x0: Math.min(...c.map(q => q[0])), x1: Math.max(...c.map(q => q[0])), y0: Math.min(...c.map(q => q[1])), y1: Math.max(...c.map(q => q[1])) };
}
const BG = ['#2f7fbf', '#08060a', '#1c0608', '#08060a', '#0a0608', '#0a0608', '#0c0606'];

const WALK_SPEED = 8.2;   // マス/秒
function glide(o, tx, ty, dt) {
    const dx = tx - o.rx, dy = ty - o.ry, d = Math.hypot(dx, dy);
    if (!d) return;
    const st = WALK_SPEED * Math.max(1, d) * dt;
    if (st >= d) { o.rx = tx; o.ry = ty; } else { o.rx += dx / d * st; o.ry += dy / d * st; }
}
function render(now) {
    // 止まっていた直後は1コマ分として数える(間があいた分で一気に進むと瞬間移動に見える)
    const gap = (now - (VIEW.last || now)) / 1000, dt = gap > .1 ? 1 / 60 : Math.min(.05, gap); VIEW.last = now;
    // 動きをなめらかに。1マスを長押しの間隔(125ms)とほぼ同じ時間で歩くので、操作は遅くならない
    const swimming = !!TILE[getT(S.f, S.x, S.y)].swim;
    // 動く床で運ばれたときは 乗ったマスまで歩いてから 運ばれる
    if (playerVia) { glide(P, playerVia[0], playerVia[1], swimming ? dt * .55 : dt); if (P.rx === playerVia[0] && P.ry === playerVia[1]) playerVia = null; }
    else glide(P, S.x, S.y, swimming ? dt * .55 : dt);
    if (Math.abs(S.x - P.rx) > 3 || Math.abs(S.y - P.ry) > 3) { P.rx = S.x; P.ry = S.y; playerVia = null; }
    P.ax *= .8; P.ay *= .8; P.flash = Math.max(0, P.flash - dt * 4);
    if (VIEW.title) VIEW.drift += dt * .35;
    VIEW.cx = P.rx + .5 + (VIEW.title ? Math.sin(VIEW.drift * .3) * 4 : 0); VIEW.cy = P.ry + .5 + (VIEW.title ? Math.cos(VIEW.drift * .22) * 2.5 : 0);
    VIEW.shake = Math.max(0, VIEW.shake - dt * 24);
    VIEW.sx = VIEW.shake ? (Math.random() - .5) * VIEW.shake * 1.6 : 0; VIEW.sy = VIEW.shake ? (Math.random() - .5) * VIEW.shake * 1.6 : 0;
    for (const m of mobs) { if (m.via) { glide(m, m.via[0], m.via[1], dt); if (m.rx === m.via[0] && m.ry === m.via[1]) delete m.via; } else glide(m, m.x, m.y, dt); m.ax *= .8; m.ay *= .8; m.flash = Math.max(0, m.flash - dt * 4); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG[S.f]; ctx.fillRect(0, 0, VW, VH);
    const f = S.f, B = viewBounds();
    const visible = (sx, sy) => sx > -110 && sx < VW + 110 && sy > -60 && sy < VH + 170;

    drawGround(f);
    const lights = groundLayer.lights.slice();
    if (!VIEW.title && power.f === f) for (const k of power.on) { const x = k % 1000, y = Math.floor(k / 1000); if (getT(f, x, y) === T.BULB && !caveHidden(f, x, y)) lights.push([x + .5, y + .5, 8]); }
    // グリッド線
    if (VIEW.grid) {
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1;
        for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) {
            const s = toScreen(x, y);
            if (s[0] < -60 || s[0] > VW + 60 || s[1] < -40 || s[1] > VH + 40) continue;
            tilePoly(x, y, 0); ctx.stroke();
        }
    }
    // 攻撃の予告
    const boss = mobs.find(m => m.big);
    if (boss && boss.plan) {
        const pulse = .35 + .3 * Math.sin(now / 90);
        ctx.fillStyle = boss.plan.type === 'nova' ? 'rgba(180,70,255,' + pulse + ')' : 'rgba(255,50,30,' + pulse + ')';
        for (const q of boss.plan.tiles) { tilePoly(q[0], q[1], .03); ctx.fill(); }
    }
    // 弓を持っているときは 届く範囲を点で出す
    const heldS = S.inv[S.sel];
    if (!VIEW.title && heldS && heldS.tool && heldS.tool.k === 'bow') {
        const rg = toolStats(heldS.tool).range;
        for (let i = 2; i <= rg; i++) {
            const qx = S.x + S.face[0] * i, qy = S.y + S.face[1] * i;
            if (TILE[getT(S.f, qx, qy)].solid) break;
            const p = toScreen(qx + .5, qy + .5);
            ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
        }
    }
    // 向いているマス
    if (!VIEW.title) {
        tilePoly(S.x + S.face[0], S.y + S.face[1], .04);
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
    }
    // 物と魔物(奥から順に)
    const byTile = new Map();
    for (const m of mobs) { const k = m.y * 1000 + m.x; (byTile.get(k) || byTile.set(k, []).get(k)).push(m); }
    const drawActor = (spr, rx, ry, ax, ay, bob, size) => { const s = anchor(rx + ax, ry + ay, bob || 0, size); ctx.drawImage(spr.cv, Math.round(s[0] - spr.ox), Math.round(s[1] - spr.oy)); };
    // 奥から順に描く(画面を回しているときは 画面の向きで ならべかえる)
    const order = [];
    for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) order.push(x, y);
    if (VIEW.rot) { const idx = []; for (let i = 0; i < order.length; i += 2) { const v = rv(order[i], order[i + 1]); idx.push([v[1], v[0], order[i], order[i + 1]]); } idx.sort((p, q) => p[0] - q[0] || p[1] - q[1]); order.length = 0; for (const q of idx) order.push(q[2], q[3]); }
    for (let oi = 0; oi < order.length; oi += 2) {
        const x = order[oi], y = order[oi + 1];
        const hid = caveHidden(f, x, y);
        const t = getT(f, x, y), spr = hid ? HIDDEN_SPR : OS[t] ? objSprite(t, x, y) : null, here = hid ? null : byTile.get(y * 1000 + x);
        if (!spr && !here && !(x === S.x && y === S.y)) continue;
        const s = anchor(x, y);
        if (!visible(s[0], s[1]) && t !== T.GIANT) continue;
        if (spr) {
            let cv = spr, frame = spr;
            if (!hid && (t === T.CROP_C || t === T.CROP_W)) {
                const c = S.ex[exKey(f, x, y)], stage = c ? Math.min(2, Math.floor((S.T - c.p) / (CROP_TIME / 2))) : 2;
                frame = OS[t][stage];
            }
            // 主人公の体に重なっている物だけ透かす
            const near = !VIEW.title && !hid && hidesPlayer(t, x, y);
            if (near) ctx.globalAlpha = .45;
            ctx.drawImage(frame.cv, Math.round(s[0] - frame.ox), Math.round(s[1] - frame.oy));
            if (near) ctx.globalAlpha = 1;
            if (!hid && TILE[t].belt) { const e = S.ex[exKey(f, x, y)]; if (e && e.items && e.items.length) { const g = OS[T.GRAVE][0]; ctx.drawImage(g.cv, Math.round(s[0] - g.ox), Math.round(s[1] - g.oy)); } }
            const dm = S.dmg[exKey(f, x, y)];
            if (dm && !hid && TILE[t].hp) { const w = Math.min(1, dm / TILE[t].hp), c0 = toScreen(x + .5, y + .5, .6); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(c0[0] - 18, c0[1] - 22, 36, 6); ctx.fillStyle = '#ffd84a'; ctx.fillRect(c0[0] - 18, c0[1] - 22, 36 * w, 6); }
        }
        if (here) for (const m of here) {
            const d = MOBS[m.t];
            if (m.big) {
                const a = actorSprite('boss', d.box, m.face, m.flash > .3, BOSS_OPT);
                drawActor(a, m.rx - 1, m.ry - 1, m.ax, m.ay, 0, 3);
                drawHpBar(m, 3, 4.8);
            } else {
                const w = stepInfo(m, m.x, m.y), a = poseSprite(m.t, d.box, m.face, m.flash > .3, w.ph);
                drawActor(a, m.rx, m.ry, m.ax, m.ay, w.hop + (d.erratic ? Math.sin(now / 120) * .08 : 0));
                if (m.hp < (m.mhp || d.hp)) drawHpBar(m, 1, 1.45);
                if (m.lv > 1) { const s = toScreen(m.rx + .5, m.ry + .5, 1.75); ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText('Lv' + m.lv, s[0], s[1]); ctx.fillStyle = m.lv >= 5 ? '#ff6a5a' : m.lv >= 3 ? '#ffc23c' : '#ffffff'; ctx.fillText('Lv' + m.lv, s[0], s[1]); }
            }
        }
        if (x === S.x && y === S.y && !VIEW.title) {
            const dir = S.face[0] > 0 ? 1 : S.face[0] < 0 ? 3 : S.face[1] > 0 ? 2 : 0;
            const w = stepInfo(P, S.x, S.y);
            const lk = curLook(), spr = poseSprite('player_' + lk.id, lk.box, dir, P.flash > .3, w.ph);
            if (TILE[t].swim) {
                // 水の中: 体を沈めて、水面より下を描かない
                const wl = toScreen(P.rx + .5, P.ry + .5, 0);
                ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, wl[1] + 3); ctx.clip();
                drawActor(spr, P.rx, P.ry, 0, 0, -.5 + Math.sin(now / 240) * .03);
                ctx.restore();
                ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(wl[0], wl[1] + 2, 22, 8, 0, 0, 7); ctx.stroke();
            } else drawActor(spr, P.rx, P.ry, P.ax, P.ay, w.hop);
        }
    }
    if (fishing) {
        const dip = fishing.bit ? 5 + Math.sin(now / 40) * 4 : Math.sin(now / 300) * 2, p = toScreen(fishing.x + .5, fishing.y + .5), a = toScreen(P.rx + .5 + S.face[0] * .2, P.ry + .5 + S.face[1] * .2, 1);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(p[0], p[1] + dip); ctx.stroke();
        ctx.fillStyle = '#d8352c'; ctx.fillRect(p[0] - 5, p[1] - 6 + dip, 10, 6);
        ctx.fillStyle = '#fff'; ctx.fillRect(p[0] - 5, p[1] + dip, 10, 4);
    }
    drawFx(dt, now);
    drawDark(lights, now);
    const anim = Math.abs(S.x - P.rx) + Math.abs(S.y - P.ry) > .01 || FX.parts.length || FX.floats.length || FX.slashes.length || FX.shots.length || FX.gains.length || fishing || VIEW.shake > 0 || VIEW.title || (boss && boss.plan) || mobs.some(m => Math.abs(m.x - m.rx) + Math.abs(m.y - m.ry) > .01 || m.flash > 0 || Math.abs(m.ax) > .01);
    VIEW.needDraw = !!anim;
}
// 地面は1歩ごとに別の画面へ描いておき、歩くあいだはそれをずらして使う(毎フレーム描くと重い)
const groundLayer = { cv: null, key: '', ix: 0, iy: 0, lights: [] };
const GL_W = VW + 200, GL_H = VH + 200;
function drawGround(f) {
    const L = groundLayer, ix = Math.floor(VIEW.cx), iy = Math.floor(VIEW.cy), key = f + ',' + ix + ',' + iy + ',' + VIEW.rot + ',' + worldVer + ',' + wSeed + (isCave(f) && !VIEW.title ? ',' + caveView().key : '');
    if (!L.cv) L.cv = mkCanvas(GL_W, GL_H);
    if (L.key !== key) {
        L.key = key; L.ix = ix; L.iy = iy; L.lights = [];
        const c = L.cv.getContext('2d');
        c.fillStyle = BG[f]; c.fillRect(0, 0, GL_W, GL_H);
        const R = 26, ox = GL_W / 2, oy = GL_H / 2 + 30;
        for (let y = iy - R; y <= iy + R; y++) for (let x = ix - R; x <= ix + R; x++) {
            const v = rv(x + .5 - ix, y + .5 - iy), p = pj(v[0] - .5, v[1] - .5), sx = ox + p[0], sy = oy + p[1];
            if (sx < -110 || sx > GL_W + 110 || sy < -60 || sy > GL_H + 120) continue;
            const t = getT(f, x, y), d = TILE[t];
            if (caveHidden(f, x, y)) continue;
            if (d.light) L.lights.push([x + .5, y + .5, d.light]);
            if (d.wall) continue;
            const spr = groundSprite(t, f, x, y) || (t === T.PIT || t === T.LADDER_D ? groundSprite(pitGround(f, x, y), f, x, y) : null) || underSprite(f, x, y);
            if (spr) c.drawImage(spr.cv, Math.round(sx - spr.ox), Math.round(sy - spr.oy));
        }
    }
    const s = toScreen(L.ix, L.iy);
    ctx.drawImage(L.cv, Math.round(s[0] - GL_W / 2), Math.round(s[1] - GL_H / 2 - 30));
}
// 物が主人公の体に画面上で重なるか。手前のマスにあり、左右がそろい、上の端が足もとより上に届くときだけ
const TALL = { [T.TOWERW]: 2.4, [T.SANDB3]: 1.8, [T.SANDB2]: 1.2, [T.MAST]: 2.8, [T.METEOR]: 1.3, [T.GIANT]: 5.6, [T.TREE]: 1.8, [T.PINE]: 1.6, [T.NTREE]: 1.3, [T.CACTUS]: 1, [T.GATE]: 1.46 };
function hidesPlayer(t, x, y) {
    const h = TALL[t];
    const v = rv(x - S.x, y - S.y);
    if (!h || v[1] <= 0) return false;
    const p = pj(v[0], v[1]);
    return Math.abs(p[0]) < (t === T.GIANT ? 190 : 30) && p[1] < h * TW * KZ;
}
function drawHpBar(m, size, z) {
    const s = toScreen(m.rx + size / 2 - (m.big ? 1 : 0), m.ry + size / 2 - (m.big ? 1 : 0), z), w = 34 * size, r = Math.max(0, m.hp / (m.mhp || MOBS[m.t].hp));
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(s[0] - w / 2 - 1, s[1] - 1, w + 2, 7);
    ctx.fillStyle = r > .5 ? '#6ad05a' : r > .25 ? '#ffc23c' : '#ff5a5a'; ctx.fillRect(s[0] - w / 2, s[1], w * r, 5);
}
function drawDark(lights, now) {
    if (VIEW.title) return;
    const f = S.f;
    let a, col, playerR;
    if (f === 0) { a = nightLevel() * .78; col = '12,18,52'; playerR = 6; }
    else if (isCave(f)) { a = .96; col = '4,3,8'; playerR = 4; }   // 地下は暗い。主人公のまわりと 見えている松明のまわりだけ明るい
    else { a = .55; col = '40,6,12'; playerR = 9; }
    if (a <= .01) return;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, dark.width, dark.height);
    dctx.fillStyle = 'rgba(' + col + ',' + a + ')';
    dctx.fillRect(0, 0, dark.width, dark.height);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, k) => {
        const s = toScreen(x, y), R = r * TW * .5, gx = s[0] / 2, gy = s[1] / 2, g = dctx.createRadialGradient(gx, gy, R * .3, gx, gy, R);
        g.addColorStop(0, 'rgba(0,0,0,' + (k || 1) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        dctx.fillStyle = g; dctx.beginPath(); dctx.arc(gx, gy, R, 0, 7); dctx.fill();
    };
    hole(P.rx + .5, P.ry + .5, playerR, isCave(f) ? .22 : 1);   // 地下では 主人公のまわりは ほぼ真っ暗(明るくするのは松明)
    for (const l of lights) if (l[2] >= 2) hole(l[0], l[1], l[2] + (isCave(f) ? .5 : 1));
    ctx.drawImage(dark, 0, 0, VW, VH);
}
function drawFx(dt, now) {
    for (let i = FX.parts.length - 1; i >= 0; i--) {
        const p = FX.parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 5 * dt; p.life -= dt;
        if (p.life <= 0 || p.z < 0) { FX.parts.splice(i, 1); continue; }
        const s = toScreen(p.x, p.y, p.z);
        ctx.fillStyle = p.c; ctx.fillRect(s[0] - 3, s[1] - 3, 6, 6);
    }
    for (let i = FX.slashes.length - 1; i >= 0; i--) {
        const q = FX.slashes[i];
        q.life -= dt * 7;
        if (q.life <= 0) { FX.slashes.splice(i, 1); continue; }
        const s = toScreen(q.x + .5, q.y + .5, .55);
        ctx.strokeStyle = q.crit ? 'rgba(255,220,80,' + q.life + ')' : 'rgba(255,255,255,' + q.life + ')'; ctx.lineWidth = q.crit ? 7 : 4;
        ctx.beginPath(); ctx.moveTo(s[0] - 24, s[1] - 22); ctx.lineTo(s[0] + 24, s[1] + 22); ctx.stroke();
    }
    for (let i = FX.shots.length - 1; i >= 0; i--) {
        const q = FX.shots[i];
        q.t += dt * 5;
        if (q.t >= 1) { FX.shots.splice(i, 1); continue; }
        const hx = q.x0 + (q.x1 - q.x0) * q.t + .5, hy = q.y0 + (q.y1 - q.y0) * q.t + .5, s = toScreen(hx, hy, .6);
        if (q.arrow) {
            // 矢: 飛ぶ向きに のびた線と矢じり
            const sx = Math.sign(q.x1 - q.x0), sy = Math.sign(q.y1 - q.y0), tail = toScreen(hx - sx * .55, hy - sy * .55, .6);
            ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tail[0], tail[1]); ctx.lineTo(s[0], s[1]); ctx.stroke();
            ctx.fillStyle = '#f0f0e8'; ctx.fillRect(s[0] - 4, s[1] - 4, 8, 8);
        } else { ctx.fillStyle = q.c; ctx.fillRect(s[0] - 5, s[1] - 5, 10, 10); }
    }
    // 手に入れた物は 1つずつ順番に出す
    if (FX.gains.length && now >= FX.nextGain) {
        const g = FX.gains.shift();
        FX.floats.push({ follow: true, x: S.x, y: S.y, z: 1.35, rise: 1.5, text: '+' + g.n + ' ' + ITEM[g.id].n, c: '#fff6c8', life: 1.15, size: 22 });
        FX.nextGain = now + 430;
    }
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (let i = FX.floats.length - 1; i >= 0; i--) {
        const q = FX.floats[i];
        q.life -= dt; q.z += dt * (q.rise || 1.2);
        if (q.life <= 0) { FX.floats.splice(i, 1); continue; }
        const s = q.follow ? toScreen(P.rx + .5, P.ry + .5, q.z) : toScreen(q.x + .5, q.y + .5, q.z);
        ctx.globalAlpha = Math.min(1, q.life * 2);
        ctx.font = '900 ' + (q.size || 22) + 'px "M PLUS Rounded 1c",sans-serif';
        ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 5; ctx.strokeText(q.text, s[0], s[1]);
        ctx.fillStyle = q.c; ctx.fillText(q.text, s[0], s[1]);
        ctx.globalAlpha = 1;
    }
}

// ---------- アイコン ----------
const iconCache = {};
function iconUrl(id) {
    if (iconCache[id] !== undefined) return iconCache[id];
    if (PIX_ART[id]) return (iconCache[id] = pixelIcon(PIX_ART[id][0], PIX_ART[id][1]));
    const it = ITEM[id];
    if (it.deco !== undefined) return (iconCache[id] = turnThumb(0, 0, { t: T[it.tile] }).toDataURL());   // 小さい飾りは まわりを けずって大きく
    let spr = null;
    if (it.tile) { const k = T[it.tile]; spr = (OS[k] && OS[k][0]) || (groundSprite(k, 0, 0, 0)); }
    else if (it.c) spr = boxSprite([[.14, .14, 0, .86, .86, .62, it.c]]);
    if (!spr) return (iconCache[id] = null);
    // 絵の はしを けずって 枠のまん中に置く(小さい物は 少しだけ大きく)
    const src = spr.cv, W = src.width, Hh = src.height, px = src.getContext('2d').getImageData(0, 0, W, Hh).data;
    let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
    for (let yy = 0; yy < Hh; yy++) for (let xx = 0; xx < W; xx++) if (px[(yy * W + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    if (x1 < 0) return (iconCache[id] = null);
    const s = mkCanvas(96, 96), c = s.getContext('2d'), bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = Math.min(1.3, 84 / bw, 84 / bh);
    c.drawImage(src, x0, y0, bw, bh, (96 - bw * sc) / 2, (96 - bh * sc) / 2, bw * sc, bh * sc);
    return (iconCache[id] = s.toDataURL());
}
