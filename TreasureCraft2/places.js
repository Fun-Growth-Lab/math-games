// トレジャークラフト2: 世界の見どころ。はじまりの景色・巨大な建造物・村・洞窟の入口・地下の特別な場所を、シードから決める。
'use strict';
const PLACE_NAMES = {
    giant: '巨木', tower: '崩れた塔', pyramid: '砂漠のピラミッド', meteor: '隕石のクレーター', ship: '難破船', village: '村',
    crystal: '水晶の洞窟', lake: '地底湖', nest: 'まものの巣', mine: '廃坑', cave: '洞窟の入口', ruin: '小さな遺跡',
    mushroom: '光るきのこの森', merchant: '地底の案内人の小屋', vault: '封印の宝物庫', fossil: '化石', geode: '晶洞', bigvein: '大鉱脈'
};
const near2 = (x, y, p, r) => Math.abs(x - p.x) <= r && Math.abs(y - p.y) <= r;

// ---------- はじまりの景色 ----------
// スポーン地点のまわりに 林・池・岩場・畑を必ず置き、少し歩くと洞窟の入口・遺跡・大きな建造物が見つかる
function starterInfo() {
    if (regionCache.has('starter')) return regionCache.get('starter');
    const a = hash(5, 6, 903) * Math.PI * 2, at = (ang, r) => ({ x: Math.round(CENTER + Math.cos(a + ang) * r), y: Math.round(CENTER + Math.sin(a + ang) * r) });
    const o = { grove: at(0, 11), pond: at(1.6, 12), rock: at(3.1, 11), crop: at(4.6, 10), cave: at(.8, 24), ruin: at(2.4, 34), land: at(4, 64) };
    regionCache.set('starter', o);
    return o;
}
function starterTile(x, y) {
    if (distC(x, y) > 44) return null;
    const s = starterInfo(), r = hash(x, y, 60);
    const dist = p => Math.hypot(x - p.x, y - p.y);
    if (dist(s.pond) < 3.6) return T.WATER;
    if (dist(s.pond) < 5) return T.SAND;
    if (dist(s.grove) < 5.5) return r < .45 ? T.TREE : null;
    if (dist(s.rock) < 4.2) return r < .85 ? T.ROCK : null;
    if (dist(s.crop) < 3.2) return r < .45 ? (hash(x, y, 61) < .5 ? T.VEG : T.WHEATW) : null;
    return null;
}

// ---------- 地上の建造物(96マスごとに抽選) ----------
const SURF_GRID = 96, SURF_R = { giant: 4, tower: 4, pyramid: 8, meteor: 8, ship: 7, village: 14 };
function surfRegion(gx, gy) {
    const key = 's' + gx + ',' + gy;
    if (regionCache.has(key)) return regionCache.get(key);
    let out = null;
    const land = starterInfo().land;
    if (Math.floor(land.x / SURF_GRID) === gx && Math.floor(land.y / SURF_GRID) === gy) {
        out = { type: ['tower', 'giant', 'meteor', 'village'][Math.floor(hash(7, 8, 904) * 4)], x: land.x, y: land.y };
    } else if (hash(gx, gy, 500) < .62) {
        const x = gx * SURF_GRID + 20 + Math.floor(hash(gx, gy, 501) * 56), y = gy * SURF_GRID + 20 + Math.floor(hash(gx, gy, 502) * 56);
        const edge = Math.min(x, y, WORLD - 1 - x, WORLD - 1 - y), r = hash(gx, gy, 503);
        if (edge > 34 && distC(x, y) > 52) {
            const b = biomeAt(x, y);
            let type;
            if (fbm(x, y, 46, 14) > .735) type = 'ship';
            else if (b === BIOME.DESERT) type = r < .7 ? 'pyramid' : 'meteor';
            else if (b === BIOME.FOREST) type = r < .7 ? 'giant' : 'village';
            else if (b === BIOME.SNOW) type = r < .6 ? 'tower' : 'giant';
            else if (b === BIOME.MOUNT) type = r < .6 ? 'tower' : 'meteor';
            else type = r < .5 ? 'village' : r < .75 ? 'meteor' : 'tower';
            out = { type, x, y };
        }
    }
    regionCache.set(key, out);
    return out;
}
function surfPlaceAt(x, y) {
    const s = surfRegion(Math.floor(x / SURF_GRID), Math.floor(y / SURF_GRID));
    return s && near2(x, y, s, SURF_R[s.type]) ? s : null;
}
function surfTile(x, y) {
    const s = surfPlaceAt(x, y);
    if (!s) return null;
    const dx = x - s.x, dy = y - s.y, ch = Math.max(Math.abs(dx), Math.abs(dy)), d = Math.hypot(dx, dy), r = hash(x, y, 62);
    switch (s.type) {
        case 'giant':
            if (!dx && !dy) return T.GIANT;
            if (ch <= 1) return T.GIANTB;
            if (dx === 0 && dy === 2) return T.CHEST_W;
            if (dx === 3 && dy === -3) return T.BURIED;
            if (ch <= 3) return r < .12 ? T.HERB : T.GRASS;
            return null;
        case 'tower':
            if (ch === 3) return dx === 0 && dy === 3 ? T.RFLOOR : T.TOWERW;
            if (ch < 3) return !dx && !dy ? T.CHEST_W : dx === 1 && dy === 2 ? T.TRAP_ARROW : T.RFLOOR;
            return r < .4 ? T.RFLOOR : r < .5 ? T.RWALL : null;
        case 'pyramid':
            if (Math.abs(dx) <= 1 && dy > 0 && ch < 8) return dx === 0 && dy === 5 ? T.TRAP_PIT : dx === 1 && dy === 3 ? T.TRAP_ARROW : T.RFLOOR;
            if (ch <= 2) return !dx && !dy ? T.CHEST_W : Math.abs(dx) === 2 && dy === -2 ? T.CHEST_W : T.RFLOOR;
            if (ch <= 3) return T.SANDB3;
            if (ch <= 5) return T.SANDB2;
            if (ch <= 7) return T.SANDB1;
            return T.SAND;
        case 'meteor':
            if (!dx && !dy) return T.METEOR;
            if (d < 3.2) return T.SCORCH;
            if (d < 6.3) return r < .1 ? T.ROCK : T.SCORCH;
            if (d < 7.6) return r < .6 ? T.ROCK : T.SCORCH;
            return null;
        case 'ship':
            if (Math.abs(dy) > 2 || Math.abs(dx) > 6) return null;
            if (Math.abs(dy) === 2 || Math.abs(dx) === 6) return dx === -6 && dy === 0 ? T.WFLOOR : r < .12 ? T.WATER : T.HULL;
            if (dx === 0 && dy === 0) return T.MAST;
            if (Math.abs(dx) === 3 && dy === 0) return T.CHEST_W;
            return T.WFLOOR;
        case 'village': {
            for (const c of [[-8, -7], [7, -8], [-7, 7], [8, 6]]) {
                const hx = dx - c[0], hy = dy - c[1], hc = Math.max(Math.abs(hx), Math.abs(hy));
                if (hc === 2) return hx === 0 && hy === 2 ? T.DOOR : T.HUTW;
                if (hc < 2) return hx === 1 && hy === -1 ? T.TORCH : hx === -1 && hy === -1 ? T.CHEST_W : T.WFLOOR;
                if (hx === 0 && hy > 2 && Math.abs(dy) >= 0 && hy < 5) return T.DIRT;
            }
            if (ch <= 1) return !dx && !dy ? T.WATER : T.RFLOOR;
            if (Math.abs(dx) === 3 && Math.abs(dy) === 3) return T.TORCH;
            if (dx === 0 || dy === 0) return T.DIRT;
            return ch < 14 ? (r < .05 ? T.FLOWER : T.GRASS) : null;
        }
    }
    return null;
}

// ---------- 洞窟の入口(40マスごと) ----------
function caveCell(gx, gy) {
    const key = 'c' + gx + ',' + gy;
    if (regionCache.has(key)) return regionCache.get(key);
    let out = null;
    const st = starterInfo().cave;
    if (Math.floor(st.x / 40) === gx && Math.floor(st.y / 40) === gy) out = { x: st.x, y: st.y };
    else if (hash(gx, gy, 510) < .2) {
        const x = gx * 40 + 8 + Math.floor(hash(gx, gy, 511) * 24), y = gy * 40 + 8 + Math.floor(hash(gx, gy, 512) * 24);
        if (distC(x, y) > 40 && Math.min(x, y, WORLD - 1 - x, WORLD - 1 - y) > 36 && fbm(x, y, 46, 14) < .7 && fbm(x, y, 13, 16) < .7 && !surfPlaceAt(x, y)) out = { x, y };
    }
    regionCache.set(key, out);
    return out;
}
const caveNear = (x, y) => caveCell(Math.floor(x / 40), Math.floor(y / 40));

// ---------- 地下の特別な場所(88マスごと) ----------
const B1_GRID = 88, B1_R = { crystal: 11, lake: 10, nest: 5, mushroom: 12, merchant: 5, vault: 5 };
// 階ごとの 見どころの出やすさ [種類, ここまでの割合]
const CAVE_KINDS = {
    2: [['crystal', .25], ['lake', .45], ['nest', .7], ['mushroom', 1]],
    3: [['crystal', .25], ['lake', .5], ['nest', .8], ['merchant', 1]],
    4: [['crystal', .25], ['lake', .4], ['nest', .7], ['merchant', .82], ['vault', 1]],
    5: [['crystal', .25], ['lake', .4], ['nest', .7], ['merchant', .82], ['vault', 1]]
};
const fsalt = f => f === 1 ? 0 : f * 40;   // 地下の階ごとに 場所の抽選をずらす
function caveRegion(f, gx, gy) {
    const key = 'b' + (f === 1 ? '' : f + ':') + gx + ',' + gy, o = fsalt(f);
    if (regionCache.has(key)) return regionCache.get(key);
    let out = null;
    if (hash(gx, gy, 520 + o) < .6) {
        const x = gx * B1_GRID + 14 + Math.floor(hash(gx, gy, 521 + o) * 60), y = gy * B1_GRID + 14 + Math.floor(hash(gx, gy, 522 + o) * 60), r = hash(gx, gy, 523 + o);
        const type = f === 1 ? (r < .34 ? 'crystal' : r < .62 ? 'lake' : 'nest') : CAVE_KINDS[caveDepth(f)].find(q => r < q[1])[0];
        if (distC(x, y) > 28 && Math.min(x, y, WORLD - 1 - x, WORLD - 1 - y) > 18) out = { type, x, y, spawn: ['zombie', 'skeleton', 'spider'][Math.floor(hash(gx, gy, 524 + o) * 3)] };
    }
    regionCache.set(key, out);
    return out;
}
function cavePlaceAt(f, x, y) {
    const s = caveRegion(f, Math.floor(x / B1_GRID), Math.floor(y / B1_GRID));
    return s && near2(x, y, s, B1_R[s.type]) ? s : null;
}
const b1PlaceAt = (x, y) => cavePlaceAt(1, x, y);
function caveSpecial(f, x, y) {
    const s = cavePlaceAt(f, x, y);
    if (s) {
        const dx = x - s.x, dy = y - s.y, ch = Math.max(Math.abs(dx), Math.abs(dy)), d = Math.hypot(dx, dy) + vnoise(x, y, 5, 63) * 2.5, r = hash(x, y, 64);
        if (s.type === 'crystal') {
            if (d < 11) return r < .13 ? T.CRYSTAL : T.CAVE;
        } else if (s.type === 'lake') {
            if (Math.hypot(dx, dy) < 1.5) return !dx && !dy ? T.CHEST_W : T.CAVE;
            if (d < 8.5) return T.WATER;
            if (d < 11) return T.CAVE;
        } else if (s.type === 'mushroom') {
            if (d < 12) return r < .07 ? T.GMUSH : r < .11 ? T.GLOWM : r < .22 ? T.MUSH : T.CAVE;
        } else if (s.type === 'merchant') {
            // 小屋: 扉は南。中に松明。まわりは少し空ける
            if (ch === 3) return dx === 0 && dy === 3 ? T.DOOR : T.RWALL;
            if (ch < 3) return dx === -2 && dy === -2 ? T.TORCH : T.RFLOOR;
            if (ch <= 5) return T.CAVE;
        } else if (s.type === 'vault') {
            // 入口のない部屋。かたい封印のかべを掘りぬく
            if (ch === 4) return T.VWALL;
            if (ch < 4) return (dy === 0 && (dx === 0 || Math.abs(dx) === 2)) ? T.CHEST_W : (dx === 0 && dy === -3) ? T.TORCH : T.RFLOOR;
        } else {
            if (ch === 4) return dx === 0 && dy === 4 ? T.RFLOOR : T.RWALL;
            if (ch < 4) return !dx && !dy ? T.SPAWNER : (Math.abs(dx) === 3 && Math.abs(dy) === 3 && dx * dy > 0) ? T.CHEST_W : T.RFLOOR;
            if (ch === 5 && dx === 0) return T.CAVE;
        }
    }
    if (f !== 1) return mineTile(f, x, y);
    // 洞窟の入口の下は広い空洞
    const c = caveNear(x, y);
    if (c && Math.hypot(x - c.x, y - c.y) + vnoise(x, y, 4, 65) * 2 < 6) return T.CAVE;
    const sc = starterInfo().cave;
    if (Math.hypot(x - sc.x, y - sc.y) < 6) return T.CAVE;
    return mineTile(1, x, y);
}
// 廃坑: 128マスごとに東西・南北へのびる長い坑道
function mineRow(f, g) { const o = fsalt(f); return hash(g, 1, 530 + o) < .4 ? g * 128 + 16 + Math.floor(hash(g, 2, 531 + o) * 96) : -1; }
function mineCol(f, g) { const o = fsalt(f); return hash(g, 3, 532 + o) < .4 ? g * 128 + 16 + Math.floor(hash(g, 4, 533 + o) * 96) : -1; }
function mineTile(f, x, y) {
    if (distC(x, y) < 40) return null;
    const row = mineRow(f, Math.floor(y / 128)), col = mineCol(f, Math.floor(x / 128)), r = hash(x, y, 66 + fsalt(f));
    if (y === row || x === col) return (hash(Math.floor((x + y) / 14), 5, 534) < .12 && (x + y) % 14 === 7) ? T.CHEST_W : T.RAIL;
    if ((y === row - 1 && x % 10 === 0) || (x === col - 1 && y % 10 === 0)) return T.TORCH;
    // 坑道のわきには その階でよくとれる鉱石
    if (Math.abs(y - row) === 1 || Math.abs(x - col) === 1) { if (r < .05) return [T.ORE_FE, T.ORE_FE, T.ORE_AU, T.ORE_STAR, T.ORE_STAR][caveDepth(f) - 1]; if (r < .1) return caveDepth(f) >= 3 ? T.ORE_RS : T.ORE_COAL; }
    return null;
}
const onMine = (f, x, y) => y === mineRow(f, Math.floor(y / 128)) || x === mineCol(f, Math.floor(x / 128));

// ---------- 岩の中に埋まっている物(掘り当てる) ----------
const cellPick = (f, x, y, size, salt, rate) => {
    const gx = Math.floor(x / size), gy = Math.floor(y / size), o = salt + fsalt(f) * 3;
    if (hash(gx, gy, o) > rate) return null;
    return { gx, gy, cx: gx * size + 6 + Math.floor(hash(gx, gy, o + 1) * (size - 12)), cy: gy * size + 6 + Math.floor(hash(gx, gy, o + 2) * (size - 12)), r: hash(gx, gy, o + 3) };
};
// 化石(B1〜B3): 背骨とあばら骨と頭
function fossilAt(f, x, y) {
    if (caveDepth(f) > 3) return null;
    const c = cellPick(f, x, y, 40, 600, .3);
    if (!c) return null;
    let a = x - c.cx, b = y - c.cy;
    if (c.r < .5) { const t = a; a = b; b = t; }
    if (Math.abs(a) <= 3 && b === 0) return T.FOSSIL;
    if ((a === -2 || a === 0 || a === 2) && Math.abs(b) <= 2) return T.FOSSIL;
    if (a === 4 && Math.abs(b) <= 1) return T.FOSSIL;
    return null;
}
// 晶洞(B2〜B4): 水晶のからの中に 宝石
function geodeAt(f, x, y) {
    const dep = caveDepth(f);
    if (dep < 2 || dep > 4) return null;
    const c = cellPick(f, x, y, 48, 620, .35);
    if (!c) return null;
    const d = Math.hypot(x - c.cx, y - c.cy);
    return d < 1 ? T.GEM : d < 2.3 ? T.CAVE : d < 3.3 ? T.CRYSTAL : null;
}
// 大鉱脈: 同じ鉱石の大きなかたまり。深いほど良い石
const VEIN_ORE = [null, ['ORE_COAL', 'ORE_CU', 'ORE_CU', 'ORE_FE'], ['ORE_FE', 'ORE_FE', 'ORE_AU', 'ORE_CU'], ['ORE_AU', 'ORE_RS', 'ORE_FE', 'ORE_AU'], ['ORE_STAR', 'ORE_AU', 'ORE_RS'], ['ORE_STAR', 'ORE_STAR', 'ORE_AU']];
function bigVein(f, x, y) {
    const c = cellPick(f, x, y, 56, 640, .35);
    if (!c) return null;
    const rad = 2.2 + hash(c.gx, c.gy, 645) * 1.4;
    return Math.hypot(x - c.cx, y - c.cy) + vnoise(x, y, 3, 646) * 1.2 < rad ? c : null;
}
function bigVeinAt(f, x, y) {
    const c = bigVein(f, x, y);
    if (!c) return null;
    const list = VEIN_ORE[caveDepth(f)];
    return T[list[Math.floor(c.r * list.length)]];
}
// 埋もれた宝箱(どの地下の階にも): 岩の中に ぽつんと
const buriedChestAt = (f, x, y) => hash(x, y, 95 + caveDepth(f)) < .0015;

// 特別な場所の主
const GUARDS = { giant: 'ent', tower: 'warden', pyramid: 'mummy', meteor: 'starbeast', ship: 'captain', nest: 'queen', crystal: 'crystalg', lake: 'lakelord' };

// ---------- いま立っている場所の見どころ ----------
function placeHere(f, x, y) {
    if (f === 0) {
        const s = surfPlaceAt(x, y);
        if (s) return { key: s.type + s.x + ',' + s.y, type: s.type, x: s.x, y: s.y };
        const c = caveNear(x, y);
        if (c && near2(x, y, c, 5)) return { key: 'cave' + c.x + ',' + c.y, type: 'cave', x: c.x, y: c.y };
    } else if (isCave(f)) {
        const pre = f === 1 ? '' : f + ':';
        const s = cavePlaceAt(f, x, y);
        if (s) return { key: pre + s.type + s.x + ',' + s.y, type: s.type, x: s.x, y: s.y };
        if (onMine(f, x, y)) return { key: pre + 'mine' + Math.floor(x / 128) + ',' + Math.floor(y / 128), type: 'mine', x, y };
    }
    return null;
}
