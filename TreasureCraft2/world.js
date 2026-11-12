// トレジャークラフト2: 世界の生成。シードからマスを計算し、変更したマスだけ差分として持つ。
'use strict';
const WORLD = 1000, CHUNK = 32, CENTER = 500, DEEP_R = 170;
const FLOOR_NAME = ['地上', '地下 B1', '異世界', '地下 B2', '地下 B3', '地下 B4', '地下 B5'];
const FLOORS = FLOOR_NAME.length;
const FLOOR_ORDER = [0, 1, 3, 4, 5, 6, 2];   // 地図のタブの並び
const isCave = f => f === 1 || f >= 3;       // 地下の階
const caveDepth = f => f === 1 ? 1 : f >= 3 ? f - 1 : 0;   // B何階か
const floorBelow = f => f === 0 ? 1 : f === 1 ? 3 : f >= 3 && f < 6 ? f + 1 : -1;
const floorAbove = f => f === 1 ? 0 : f === 3 ? 1 : f > 3 ? f - 1 : -1;

let wSeed = 1;
const regionCache = new Map();   // 建造物などの場所の覚え書き
function hash(x, y, salt) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 2147483647 - 18) + wSeed) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    h = Math.imul(h, 2246822519); h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
}
const fade = t => t * t * (3 - 2 * t);
function vnoise(x, y, scale, salt) {
    const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), tx = fade(fx - ix), ty = fade(fy - iy);
    const a = hash(ix, iy, salt), b = hash(ix + 1, iy, salt), c = hash(ix, iy + 1, salt), d = hash(ix + 1, iy + 1, salt);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
const fbm = (x, y, s, salt) => vnoise(x, y, s, salt) * .65 + vnoise(x, y, s / 2.3, salt + 7) * .35;
const distC = (x, y) => Math.hypot(x - CENTER, y - CENTER);

// ---------- バイオーム ----------
const BIOME = { PLAIN: 0, FOREST: 1, DESERT: 2, SNOW: 3, MOUNT: 4 };
const BIOME_NAME = ['平原', '森', '砂漠', '雪原', '山'];
function biomeAt(x, y) {
    if (distC(x, y) < 38) return BIOME.PLAIN;
    const temp = fbm(x, y, 150, 11), moist = fbm(x, y, 110, 12), mount = fbm(x, y, 90, 13);
    if (mount > .66) return BIOME.MOUNT;
    if (temp < .36) return BIOME.SNOW;
    if (temp > .62 && moist < .52) return BIOME.DESERT;
    return moist > .5 ? BIOME.FOREST : BIOME.PLAIN;
}

// ---------- 魔王城 ----------
const ARENA_R = 13;
function bossPos() {
    const a = hash(1, 2, 901) * Math.PI * 2, r = 250 + hash(3, 4, 902) * 90;
    return { x: Math.round(CENTER + Math.cos(a) * r), y: Math.round(CENTER + Math.sin(a) * r) };
}
let bossP = null;

// ---------- 遺跡(64マスごとに抽選し、7×7の小部屋を置く) ----------
function starterRuin(x, y) {
    // はじまりの遺跡: わなのない小部屋
    const s = starterInfo().ruin, dx = x - s.x, dy = y - s.y, ch = Math.max(Math.abs(dx), Math.abs(dy));
    if (ch > 3) return null;
    if (!dx && !dy) return T.CHEST_W;
    if (ch === 3) return (dy === 3 && dx === 0) || hash(x, y, 304) < .14 ? T.RFLOOR : T.RWALL;
    return T.RFLOOR;
}
function ruinAt(f, x, y) {
    if (f === 0 && distC(x, y) < 45) { const q = starterRuin(x, y); if (q !== null) return q; }
    const gx = Math.floor(x / 64), gy = Math.floor(y / 64), salt = 300 + f;
    const rate = f === 2 ? .3 : .28;
    if (hash(gx, gy, salt) > rate) return null;
    let cx = gx * 64 + 12 + Math.floor(hash(gx, gy, salt + 1) * 40), cy = gy * 64 + 12 + Math.floor(hash(gx, gy, salt + 2) * 40);
    if (distC(cx, cy) < 30) return null;
    const dx = x - cx, dy = y - cy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return null;
    if (dx === 0 && dy === 0) return T.CHEST_W;
    if (Math.abs(dx) === 3 || Math.abs(dy) === 3) {
        // すこし崩れたかべ。入口を1つ必ず開ける
        const side = Math.floor(hash(gx, gy, salt + 3) * 4);
        const gate = (side === 0 && dy === -3 && dx === 0) || (side === 1 && dy === 3 && dx === 0) || (side === 2 && dx === -3 && dy === 0) || (side === 3 && dx === 3 && dy === 0);
        if (gate || hash(x, y, salt + 4) < .14) return T.RFLOOR;
        return f === 2 ? T.NROCK : T.RWALL;
    }
    // 内側には わなや 埋まった宝がまぎれている
    const tr = hash(x, y, salt + 5);
    if (f !== 2 && tr < .07) return f === 0 ? T.TRAP_PIT : T.TRAP_ARROW;
    if (f !== 2 && tr < .14) return T.TRAP_ARROW;
    return T.RFLOOR;
}
const chestTier = (f, x, y) => (isCave(f) && mhouseAt(f, x, y, 3)) ? (caveDepth(f) >= 2 ? 2 : 1) : f === 2 ? 2 : (f === 0 && surfPlaceAt(x, y) && surfPlaceAt(x, y).type !== 'village') ? 1 : (isCave(f) && buriedChestAt(f, x, y)) ? (caveDepth(f) >= 3 ? 2 : 1) : (f === 1 && b1PlaceAt(x, y)) ? 1 : f >= 3 ? (caveDepth(f) >= 4 || cavePlaceAt(f, x, y) ? 2 : 1) : (f === 1 ? (hash(x, y, 41) < .4 ? 1 : 0) : 0);

// ---------- マスの生成 ----------
// バイオームの中に、小さな地形(池・林・岩場・畑など)を細かく散らす。数十歩ごとに景色が変わるくらいの大きさ
const FEATURE = {
    // grove=林、rocks=岩場 の出やすさのしきい値(大きいほど少ない)。tree=林に生える物
    [BIOME.PLAIN]: { grove: .70, rocks: .73, tree: 'TREE' },
    [BIOME.FOREST]: { grove: .46, rocks: .76, tree: 'TREE' },
    [BIOME.DESERT]: { grove: .76, rocks: .68, tree: 'CACTUS' },
    [BIOME.SNOW]: { grove: .58, rocks: .70, tree: 'PINE' },
    [BIOME.MOUNT]: { grove: .74, rocks: .46, tree: 'PINE' }
};
function genSurface(x, y) {
    const edge = Math.min(x, y, WORLD - 1 - x, WORLD - 1 - y);
    if (edge < 10 + vnoise(x, y, 24, 20) * 12) return T.WATER;
    const place = surfTile(x, y);
    if (place !== null) return place;
    const d = distC(x, y), r = hash(x, y, 1), b = biomeAt(x, y), fe = FEATURE[b];
    const cave = caveNear(x, y);
    if (cave && cave.x === x && cave.y === y) return T.CAVEIN;
    if (d < 45) {
        const st = starterTile(x, y);
        if (st !== null) return st;
        const sc = starterInfo();
        if (sc.cave.x === x && sc.cave.y === y) return T.CAVEIN;
    }
    if (cave && Math.hypot(x - cave.x, y - cave.y) < 2.5 && r < .5) return T.ROCK;
    const lake = fbm(x, y, 46, 14), pond = fbm(x, y, 13, 16);
    if (d > 40 && (lake > .735 || pond > .74)) return T.WATER;   // はじまりの場所のまわりは島にしない
    const ruin = ruinAt(0, x, y);
    if (ruin !== null) return ruin;
    if (d < 5) return T.GRASS;
    // 何かが埋まっている場所(30マスごとに抽選)
    if (hash(Math.floor(x / 30), Math.floor(y / 30), 70) < .25 && x === Math.floor(x / 30) * 30 + 15 && y === Math.floor(y / 30) * 30 + 15) return T.BURIED;
    // 水べ。砂漠の池のまわりだけ緑(オアシス)
    const shore = lake > .72 || pond > .715;
    const base = b === BIOME.DESERT ? T.SAND : b === BIOME.SNOW ? T.SNOW : b === BIOME.MOUNT ? T.DIRT : T.GRASS;
    if (shore) {
        if (b === BIOME.DESERT) return r < .3 ? T.TREE : T.GRASS;
        if (r < .06) return T.HERB;
        return b === BIOME.SNOW ? T.SNOW : T.SAND;
    }
    // 岩場: かたまりになる。中心ほど びっしり
    const rockN = fbm(x, y, 15, 17) + (b === BIOME.MOUNT ? (fbm(x, y, 40, 39) - .5) * .3 : 0);
    if (rockN > fe.rocks) return r < (rockN > fe.rocks + .05 ? .92 : .6) ? T.ROCK : base;
    // 林: 木がかたまって生え、すきまに実がなる
    const groveN = fbm(x, y, 17, 18);
    if (groveN > fe.grove) {
        const dense = Math.min(.62, .28 + (groveN - fe.grove) * 2.5);
        if (r < dense) return T[fe.tree];
        if (r < dense + .015 && b !== BIOME.DESERT) return T.HERB;
    }
    // 実り: にんじん・麦が まとまって生える場所
    if (b === BIOME.PLAIN || b === BIOME.FOREST) {
        const crop = vnoise(x, y, 9, 19);
        if (crop > .8 && r < .4) return hash(Math.floor(x / 9), Math.floor(y / 9), 40) > .5 ? T.VEG : T.WHEATW;
    }
    // ぽつんと1つ置く物
    if (r < .012) return T[fe.tree];
    if (r < .02) return T.ROCK;
    if (d < 38 && r < .06) return r < .035 ? T.TREE : r < .05 ? T.ROCK : T.VEG;   // はじめの場所の近くでは素材を切らさない
    if (r < .023 && b !== BIOME.DESERT) return T.HERB;
    // 地面の変化
    if (base === T.GRASS) {
        const dirt = vnoise(x, y, 11, 38);
        if (dirt > .84) return T.DIRT;
        if (vnoise(x, y, 8, 36) > .74 && hash(x, y, 5) < .5) return T.FLOWER;
        if (vnoise(x, y, 22, 37) > .58) return T.GRASS2;
    }
    if (base === T.DIRT && hash(x, y, 2) < .35) return T.GRASS;
    return base;
}
function genCave(f, x, y) {
    if (x < 3 || y < 3 || x >= WORLD - 3 || y >= WORLD - 3) return T.BEDROCK;
    const dep = caveDepth(f), o = (dep - 1) * 7919, X = x + o, Y = y + Math.floor(o * .7);
    // 洞くつ: すじ状のノイズ+大きな空洞
    const c1 = Math.abs(vnoise(X, Y, 26, 22) - .5), c2 = Math.abs(vnoise(X, Y, 38, 23) - .5), hole = fbm(X, Y, 22, 24);
    const cave = (c1 < .035 && c2 < .16) || hole > .69;
    { const mh = mhouseTile(f, x, y); if (mh !== null) return mh; }
    { const special = caveSpecial(f, x, y); if (special !== null) return special; }
    const ruin = ruinAt(f, x, y);
    if (ruin !== null) return ruin;
    const r = hash(X, Y, 3);
    if (cave) {
        if (dep >= 3 && fbm(X, Y, 16, 25) > (dep === 3 ? .7 : .66)) return T.MAGMA;
        if (dep <= 4 && hash(x, y, 90 + dep) < .0015) return T.CAVEIN;   // 下の階への天然の穴
        if (r < .025) return T.MUSH;
        if (r < .035) return T.BONES;
        return T.CAVE;
    }
    { const q = geodeAt(f, x, y) || fossilAt(f, x, y) || bigVeinAt(f, x, y); if (q !== null) return q; }
    if (buriedChestAt(f, x, y)) return T.CHEST_W;
    const stony = dep >= 2 || fbm(X, Y, 34, 26) > .47;
    const vein = vnoise(X, Y, 9, 27), vein2 = vnoise(X, Y, 11, 28), vein3 = vnoise(X, Y, 13, 29);
    // B1:石炭・銅 / B2:鉄 / B3:金・赤い石 / B4〜B5:星晶。上の階の鉱石も少し出る
    if (dep >= 4 && vnoise(X, Y, 8, 30) > (dep === 5 ? .74 : .78) && r < .08) return T.ORE_STAR;
    if (vein > .72 && r < .3) return T.ORE_COAL;
    if (vein2 > .75 && r < (dep === 1 ? .3 : .12)) return T.ORE_CU;
    if (stony && vein3 > .74 && r < .3) return dep === 1 ? (r < .08 ? T.ORE_FE : T.ORE_CU) : T.ORE_FE;
    if (stony && dep >= 2 && vnoise(X, Y, 10, 31) > (dep === 2 ? .86 : .8) && r < .22) return T.ORE_AU;
    if (stony && dep >= 2 && vnoise(X, Y, 12, 32) > (dep === 2 ? .85 : .76) && r < .28) return T.ORE_RS;
    if (dep >= 4) return T.WHARD;
    return stony ? T.WSTONE : T.WDIRT;
}
function genNether(x, y) {
    if (x < 8 || y < 8 || x >= WORLD - 8 || y >= WORLD - 8) return T.MAGMA;
    if (!bossP) bossP = bossPos();
    const bx = x - bossP.x, by = y - bossP.y, ab = Math.max(Math.abs(bx), Math.abs(by));
    if (ab <= ARENA_R) {
        if (ab === ARENA_R) return (by === ARENA_R && Math.abs(bx) <= 1) ? T.CFLOOR : T.CWALL;   // 手前に入口
        if (Math.abs(Math.abs(bx) - 7) <= 1 && Math.abs(Math.abs(by) - 7) <= 1) return T.CWALL;   // 柱4本。全体攻撃の陰に隠れる場所
        return T.CFLOOR;
    }
    if (ab <= ARENA_R + 3) return T.ASH;
    const ruin = ruinAt(2, x, y);
    if (ruin !== null) return ruin;
    const n = fbm(x, y, 30, 32), r = hash(x, y, 4);
    if (fbm(x, y, 42, 33) > .68) return T.MAGMA;
    if (n > .57) {
        if (vnoise(x, y, 9, 34) > .7 && r < .3) return T.ORE_N;
        return T.NROCK;
    }
    if (r < .035) return T.NTREE;
    if (r < .05) return T.BONES;
    return T.ASH;
}
function genTile(f, x, y) {
    if (x < 0 || y < 0 || x >= WORLD || y >= WORLD) return f === 0 ? T.WATER : f === 2 ? T.MAGMA : T.BEDROCK;
    return f === 0 ? genSurface(x, y) : f === 2 ? genNether(x, y) : genCave(f, x, y);
}
// こわしたあとに現れる地面
function groundOf(f, x, y) {
    if (isCave(f)) return T.CAVE;
    if (f === 2) return T.ASH;
    const g = genSurface(x, y);
    if (g === T.WATER) return T.WATER;
    const b = biomeAt(x, y);
    return b === BIOME.DESERT ? T.SAND : b === BIOME.SNOW ? T.SNOW : b === BIOME.MOUNT ? T.DIRT : T.GRASS;
}

// ---------- チャンク(生成結果の入れ物)と差分 ----------
const chunkCache = new Map();
let diffs = [];   // diffs[f]["cx,cy"] = { マス番号: tile }
function setWorldSeed(seed, savedDiffs) {
    wSeed = seed | 0; bossP = null; chunkCache.clear(); regionCache.clear();
    diffs = savedDiffs || [];
    while (diffs.length < FLOORS) diffs.push({});
}
function chunkOf(f, cx, cy) {
    const key = f * 1048576 + cy * 1024 + cx;
    let c = chunkCache.get(key);
    if (c) return c;
    c = new Uint8Array(CHUNK * CHUNK);
    for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) c[j * CHUNK + i] = genTile(f, cx * CHUNK + i, cy * CHUNK + j);
    const d = diffs[f][cx + ',' + cy];
    if (d) for (const k in d) c[k] = d[k];
    if (chunkCache.size > 500) chunkCache.delete(chunkCache.keys().next().value);
    chunkCache.set(key, c);
    return c;
}
function getT(f, x, y) {
    if (x < 0 || y < 0 || x >= WORLD || y >= WORLD) return genTile(f, x, y);
    return chunkOf(f, x >> 5, y >> 5)[(y & 31) * CHUNK + (x & 31)];
}
let worldVer = 0;   // 地面の描きなおし判定に使う
function setT(f, x, y, t) {
    if (x < 0 || y < 0 || x >= WORLD || y >= WORLD) return;
    worldVer++;
    const cx = x >> 5, cy = y >> 5, i = (y & 31) * CHUNK + (x & 31);
    chunkOf(f, cx, cy)[i] = t;
    const key = cx + ',' + cy;
    (diffs[f][key] || (diffs[f][key] = {}))[i] = t;
}
