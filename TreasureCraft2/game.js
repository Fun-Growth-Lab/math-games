// トレジャークラフト2: ルール本体(ターン進行・採集・クラフト・戦闘・ボス・セーブ)。DOMには触らず、画面への指示は H.* を通す。
'use strict';
const TREE_TIME = 960;   // 木の実が木になるまで(2日。畑の4倍)
const AIR_MAX = 40;   // 息が続くターン数。泳ぎは歩きの半分の速さなので、長押しで約10秒
const DAY_LEN = 480, DAY_LIGHT = 320, CROP_TIME = 240, INV_SIZE = 64, HOT_SIZE = 8, STACK = 99, SAVE_KEY = 'tc2_save';
const H = {
    log() { }, float() { }, chips() { }, shake() { }, sfx() { }, slash() { }, shot() { }, refresh() { }, banner() { }, floorFx() { },
    achieve() { }, seen() { }, victory() { }, dead() { }, openCraft() { }, openChest() { }, openBed() { }, openTrade() { }, openTurn() { }, stopHold() { }, clearPath() { }, gain() { }
};
let S = null;
// 回路モード: 自由に回路をつくるモード。おなか・HPがへらない、敵が出ない、回路の部品などが ∞。セーブは別
const CIRCUIT_SAVE_KEY = 'tc2_save_circuit';
const circuitMode = () => !!(S && S.mode === 'circuit');
const INF_ITEMS = ['rdust', 'switch', 'plate', 'bulb', 'rep', 'notg', 'conv', 'fconv', 'disp', 'arrow', 'wall_s', 'wall_w', 'wall_fe', 'glass_w', 'floor', 'floor_fe'];
const infItem = id => circuitMode() && INF_ITEMS.includes(id);
// 実績を達成する。セーブとは別に残るので、新しい世界でも消えない
function ach(id) {
    if (achData.done[id] || H.noAch || circuitMode()) return;
    achData.done[id] = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem(ACH_KEY, JSON.stringify(achData)); } catch (e) { }
    H.achieve(ACH.find(a => a.id === id));
}
// 直前の攻撃の手段(たおし方の実績に使う)
let lastAttack = null, attackTool = null;
let mobs = [];

const rnd = () => Math.random();
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const exKey = (f, x, y) => f + ',' + x + ',' + y;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// ---------- 開始・セーブ ----------
function newSeed() { return 1 + Math.floor(Math.random() * 2000000000); }
const seedToCode = s => s.toString(36).toUpperCase();
const codeToSeed = c => { const n = parseInt(String(c).trim().toLowerCase(), 36); return n > 0 && isFinite(n) ? n : 0; };
// 回路モードを はじめから
function newCircuitGame(seed) {
    newGame(seed || 0);
    S.mode = 'circuit';
    const tool = (k, b) => ({ tool: { k, a: 'star', b: b || 'wood', d: 520 } });
    const order = ['rdust', 'switch', 'plate', 'bulb', 'rep', 'notg', 'conv', null, 'fconv', 'disp', 'arrow', 'wall_s', 'wall_w', 'wall_fe', 'glass_w', 'floor', 'floor_fe'];
    order.forEach((id, i) => { S.inv[i] = id ? { id, n: STACK } : null; });
    S.inv[7] = tool('pick'); S.inv[17] = tool('axe');
    S.inv[18] = tool('shovel');
    S.inv[19] = { id: 'bed', n: 1 };
    S.inv[7].tool.eq = 1; S.inv[17].tool.eq = 1; S.inv[18].tool.eq = 1;
    mobs = mobs.filter(m => MOBS[m.t].animal);
}
function newGame(seed) {
    seed = seed || newSeed();
    setWorldSeed(seed, null);
    S = {
        seed, f: 0, x: CENTER, y: CENTER, face: [0, 1], T: 40, air: AIR_MAX, hp: 100, hunger: 100, hungerAcc: 0, regenAcc: 0,
        inv: new Array(INV_SIZE).fill(null), sel: 0, ex: {}, dmg: {}, dmgT: {}, got: {}, spawn: { f: 0, x: CENTER, y: CENTER }, bed: null, gate: null,
        graves: [], saplings: [], guards: {}, quests: {}, found: {}, book: { i: {}, m: {}, p: {} }, kept: [], pets: [], deaths: 0, kills: 0, bossHp: MOBS.boss.hp, bossDead: false, cleared: false, seen: Array.from({ length: FLOORS }, () => new Uint8Array(7813)), deepTold: false, lastGoal: -1
    };
    mobs = [];
    if (TILE[getT(0, S.x, S.y)].solid) setT(0, S.x, S.y, T.GRASS);
    // 最初から動物が近くにいる
    for (const q of [['chicken', 4, 2], ['chicken', 5, 3], ['cow', -5, 3], ['sheep', -4, -4]]) if (TILE[getT(0, S.x + q[1], S.y + q[2])].ground) spawnMob(q[0], S.x + q[1], S.y + q[2]);
    markSeen();
}
const b64 = u => { let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
const unb64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
// ---------- セーブの枠(10こまで) ----------
// tc2_slots = [{ id, name, created, updated, day }] / 中身は tc2_save_<id>
const SLOT_MAX = 10, SLOTS_KEY = 'tc2_slots';
let curSlot = null;   // 今 遊んでいる枠(チュートリアル中は null = セーブしない)
const slotKey = id => 'tc2_save_' + id;
function slotList() { try { return JSON.parse(localStorage.getItem(SLOTS_KEY)) || []; } catch (e) { return []; } }
function slotWrite(list) { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(list)); } catch (e) { } }
const slotDefaultName = (t, mode) => { const d = new Date(t); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') + ' にはじめた' + (mode === 'circuit' ? '回路の世界' : '世界'); };
// mode: 'circuit' = 回路モード / なし = サバイバルモード
function newSlot(name, mode) {
    const list = slotList(), id = list.reduce((m, q) => Math.max(m, q.id), 0) + 1, now = Date.now();
    list.push(Object.assign({ id, name: name || slotDefaultName(now, mode), created: now, updated: now, day: 1 }, mode ? { mode } : {}));
    slotWrite(list);
    return id;
}
function deleteSlot(id) { try { localStorage.removeItem(slotKey(id)); } catch (e) { } slotWrite(slotList().filter(q => q.id !== id)); }
function renameSlot(id, name) { const list = slotList(), q = list.find(q => q.id === id); if (q) { q.name = name; slotWrite(list); } }
// 前のセーブ(1つだけだったころ)を 1つ目の枠に うつす
(function migrateSlots() {
    try {
        const old = localStorage.getItem(SAVE_KEY);
        if (!old || slotList().length) return;
        const now = Date.now(), id = 1;
        let day = 1; try { day = Math.floor(JSON.parse(old).T / DAY_LEN) + 1; } catch (e) { }
        localStorage.setItem(slotKey(id), old);
        slotWrite([{ id, name: 'さいしょの世界', created: now, updated: now, day }]);
        localStorage.removeItem(SAVE_KEY);
    } catch (e) { }
})();
// 前の 回路モードのセーブ(1つだけ)を 枠に うつす
(function migrateCircuit() {
    try {
        const old = localStorage.getItem(CIRCUIT_SAVE_KEY);
        if (!old || slotList().length >= SLOT_MAX) return;
        const id = newSlot('回路の世界', 'circuit');
        localStorage.setItem(slotKey(id), old);
        localStorage.removeItem(CIRCUIT_SAVE_KEY);
    } catch (e) { }
})();
function saveGame() {
    if (!S) return false;
    const key = curSlot ? slotKey(curSlot) : null;
    if (!key) return false;
    try {
        keptSync();
        S.pets = mobs.filter(m => MOBS[m.t].pet).map(m => m.hp);
        const o = Object.assign({}, S, { seen: S.seen.map(b64), diffs });
        localStorage.setItem(key, JSON.stringify(o));
        { const list = slotList(), q = list.find(q => q.id === curSlot); if (q) { q.updated = Date.now(); q.day = dayNo(); slotWrite(list); } }
        return true;
    } catch (e) { H.log('セーブできませんでした(ほぞん容量がいっぱいです)', 'bad'); return false; }
}
function hasSave(key) { try { return key ? !!localStorage.getItem(key) : slotList().length > 0; } catch (e) { return false; } }
function loadGame(key) {
    try {
        const o = JSON.parse(localStorage.getItem(key));
        setWorldSeed(o.seed, o.diffs);
        delete o.diffs;
        o.seen = o.seen.map(unb64);
        while (o.seen.length < FLOORS) o.seen.push(new Uint8Array(7813));
        S = o; mobs = [];
        while (S.inv.length < INV_SIZE) S.inv.push(null);
        S.inv.forEach(s => { if (s && s.id === 'bottle_w') s.id = 'bottle'; });   // 水入りびんは なくした   // 持ち物が増えたので 古いセーブの枠を足す
        S.found = S.found || {}; S.book = S.book || { i: {}, m: {}, p: {} }; S.kept = S.kept || []; S.pets = S.pets || []; S.saplings = S.saplings || []; S.guards = S.guards || {}; S.quests = S.quests || {}; S.dmgT = S.dmgT || {};
        S.pets.forEach(hp => addPet(hp));
        if (S.f === 2) ensureBoss();
        return true;
    } catch (e) { return false; }
}

// ---------- 時間 ----------
const dayNo = () => Math.floor(S.T / DAY_LEN) + 1;
const dayT = () => S.T % DAY_LEN;
const isNight = () => dayT() >= DAY_LIGHT;
const hourStr = () => { const h = (6 + dayT() / 20) % 24; return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); };
// 0=昼 〜 1=夜。夕方と明け方はなめらかに変える
function nightLevel() {
    const t = dayT();
    if (t < 20) return 1 - t / 20;
    if (t < DAY_LIGHT - 40) return 0;
    if (t < DAY_LIGHT) return (t - (DAY_LIGHT - 40)) / 40;
    return 1;
}

// ---------- 持ち物 ----------
// 材料を使ったあと out を n 個 持てるか(持ち物の写しで試す)。tool なら 空き枠が1つ要る
function fitsAfter(need, out, n) {
    const keep = S.inv;
    S.inv = keep.map(s => s && (s.tool ? { tool: s.tool } : { id: s.id, n: s.n }));
    try {
        for (const k in need) removeItem(k, need[k]);
        if (out === null) return S.inv.some(s => !s);
        return addItem(out, n) === 0;
    } finally { S.inv = keep; }
}
function count(id) {
    if (id === 'bow_t') { let n = 0; for (const s of S.inv) if (s && s.tool && s.tool.k === 'bow') n++; return n; }
    let n = 0; for (const s of S.inv) if (s && s.id === id) n += s.n; return n;
}
function addItem(id, n) {
    let left = n;
    for (const s of S.inv) if (left > 0 && s && s.id === id && s.n < STACK) { const k = Math.min(left, STACK - s.n); s.n += k; left -= k; }
    for (let i = 0; i < INV_SIZE && left > 0; i++) if (!S.inv[i]) { const k = Math.min(left, STACK); S.inv[i] = { id, n: k }; left -= k; }
    return left;
}
function give(id, n) {
    S.got[id] = (S.got[id] || 0) + n;
    S.book.i[id] = 1;
    if (ITEM[id].deco !== undefined && DECOS.every(q => S.book.i[q[0]])) ach('treasure_all');
    if (infItem(id) && S.inv.some(s => s && s.id === id)) { H.gain(id, n); return; }   // ∞の物は もう持っている
    const left = addItem(id, n);
    if (left > 0) { dropPile(S.x, S.y, [{ id, n: left }]); H.log('持ち物がいっぱい! 近くに落とした', 'bad'); }
    H.gain(id, n);
}
function removeItem(id, n) {
    if (infItem(id)) return;   // 回路モードの ∞の物
    if (id === 'bow_t') {
        // 装備していない弓から先に使う
        const order = [...S.inv.keys()].filter(i => S.inv[i] && S.inv[i].tool && S.inv[i].tool.k === 'bow').sort((a, b) => (S.inv[a].tool.eq ? 1 : 0) - (S.inv[b].tool.eq ? 1 : 0));
        for (const i of order.slice(0, n)) S.inv[i] = null;
        return;
    }
    for (let i = INV_SIZE - 1; i >= 0 && n > 0; i--) {
        const s = S.inv[i];
        if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) S.inv[i] = null; }
    }
}
function hasAll(need) { for (const k in need) if (count(k) < need[k]) return false; return true; }
// 持ち物をならべる(手持ちの1〜8段はそのまま)。装備品→矢→食べ物→素材→置く物→その他。同じ物はまとめる
function sortInv() {
    const ids = Object.keys(ITEM), kinds = Object.keys(TOOL_KINDS);
    const group = it => /^arrow/.test(it.id) ? 1 : (ITEM[it.id].food || ITEM[it.id].heal) ? 2 : ITEM[it.id].place ? 4 : ITEM[it.id].use || ITEM[it.id].dir ? 5 : 3;
    const tools = [], cnt = new Map();
    for (let i = HOT_SIZE; i < INV_SIZE; i++) {
        const s = S.inv[i]; if (!s) continue;
        if (s.tool) tools.push(s); else cnt.set(s.id, (cnt.get(s.id) || 0) + s.n);
    }
    tools.sort((a, b) => kinds.indexOf(a.tool.k) - kinds.indexOf(b.tool.k) || (b.tool.eq ? 1 : 0) - (a.tool.eq ? 1 : 0) || toolName(a.tool).localeCompare(toolName(b.tool), 'ja'));
    const items = [...cnt.keys()].map(id => ({ id })).sort((a, b) => group(a) - group(b) || ids.indexOf(a.id) - ids.indexOf(b.id));
    const out = tools.slice();
    for (const it of items) { let n = cnt.get(it.id); while (n > 0) { const k = Math.min(n, STACK); out.push({ id: it.id, n: k }); n -= k; } }
    for (let i = HOT_SIZE; i < INV_SIZE; i++) S.inv[i] = out[i - HOT_SIZE] || null;
}
// 村人の手伝い。できたら true(1日1回)。手伝うことがないときは 回数を使わない
function helperKey(m) { return m.vkey || 'v'; }
function helpedToday(m) { return S.helped && S.helped[helperKey(m)] === dayNo(); }
function useHelper(m) {
    const hp = HELPERS[m.role || 0];
    if (helpedToday(m)) { H.log(hp.n + '「今日は もう手伝ったよ。また明日 おいで」', ''); return false; }
    let ok = false;
    if (hp.job === 'seeds') {
        give('seed_w', 3); give('seed_c', 3); ok = true;
        if (rnd() < .15) { give('nseed', 1); H.banner('めずらしい種をもらった!', '魔樹の種');  }
        else H.log(hp.n + 'から 麦の種3こと にんじんの種3こを もらった', 'good');
    } else if (hp.job === 'repair') {
        // 装備している道具のうち いちばん傷んでいる1つ
        let best = null, br = 1;
        for (const k of Object.keys(TOOL_KINDS)) { const t = equipped(k); if (!t) continue; const r = t.d / toolStats(t).dur; if (r < br) { br = r; best = t; } }
        if (best) { best.d = toolStats(best).dur; H.log(hp.n + 'が ' + toolName(best) + 'を なおしてくれた', 'good'); ok = true; }
        else H.log(hp.n + '「装備している道具は どれも きれいだね」', '');
    } else if (hp.job === 'medicine') {
        if (rnd() < .5) { give('potion', 1); H.log(hp.n + 'から 回復薬をもらった', 'good'); } else { give('herb', 3); H.log(hp.n + 'から 薬草を3こ もらった', 'good'); }
        ok = true;
    } else if (hp.job === 'meal') {
        if (S.hunger < 100) { S.hunger = Math.min(100, S.hunger + 50); H.float(S.x, S.y, '満腹+50', '#ffb03c'); H.log(hp.n + 'の料理を食べた(満腹度+50)', 'good'); ok = true; } else H.log(hp.n + '「もう おなかいっぱいみたいだね」', '');
    } else if (hp.job === 'heal') {
        if (S.hp < maxHp()) { const v = Math.round(maxHp() / 2); S.hp = Math.min(maxHp(), S.hp + v); H.float(S.x, S.y, '+' + v, '#6ad05a'); H.log(hp.n + 'が けがを治してくれた', 'good'); ok = true; } else H.log(hp.n + '「どこも けがは していませんね」', '');
    } else if (hp.job === 'under') {
        const q = pick(UNDER_GIFTS); give(q[0], q[1]); H.log(hp.n + 'から ' + ITEM[q[0]].n + 'を' + q[1] + 'こ もらった', 'good'); ok = true;
    }
    if (ok) {
        S.helped = S.helped || {}; S.helped[helperKey(m)] = dayNo();
        S.helpN = (S.helpN || 0) + 1; if (S.helpN >= 3) ach('helper');
        H.sfx('fanfare'); H.refresh();
    } else H.sfx('error');
    return ok;
}
function eachTool(fn) { for (let i = 0; i < INV_SIZE; i++) { const s = S.inv[i]; if (s && s.tool) fn(s.tool, i); } }
// 道具は種類ごとに1つ装備する。何も装備していない種類は、いちばん良いものを自動で持つ
const toolScore = t => { const s = toolStats(t); return t.k === 'armor' ? s.def : t.k === 'sword' || t.k === 'bow' ? s.atk : s.mine; };
function equipped(kind) {
    let cur = null, best = null, v = -1;
    eachTool(t => {
        if (t.k !== kind) return;
        if (t.eq) { if (cur) delete t.eq; else cur = t; }
        const q = toolScore(t);
        if (q > v) { v = q; best = t; }
    });
    if (!cur && best) { best.eq = true; cur = best; }
    return cur;
}
function equipTool(tool) {
    if (tool.eq) return;
    eachTool(t => { if (t.k === tool.k) delete t.eq; });
    tool.eq = true;
    H.sfx('equip'); H.log(toolName(tool) + 'を装備した', 'good');
}
const bestWeapon = () => equipped('sword') || equipped('axe') || equipped('pick');
const curArmor = () => equipped('armor');
const maxHp = () => { const a = curArmor(); return 100 + (a ? toolStats(a).hp : 0); };
function wear(tool, n) {
    if (!tool || circuitMode()) return;   // 回路モードでは 道具はへらない
    const st = toolStats(tool);
    if (st.tough && rnd() < .35) return;
    tool.d -= n || 1;
    if (tool.d <= 0) {
        for (let i = 0; i < INV_SIZE; i++) if (S.inv[i] && S.inv[i].tool === tool) S.inv[i] = null;
        H.log(toolName(tool) + 'がこわれた!', 'bad'); H.sfx('garbagebreak');
    }
}
// 荷物を落とす。まわりが荷物だらけ(2マス以内に6こ以上)・置ける地面がないときは いちばん近い荷物にまとめる
function dropPile(x, y, items, kind) {
    if (kind !== 'death' && TILE[getT(S.f, x, y)].belt) { addToBelt(x, y, items); return [x, y]; }
    let spot = null, near = null, nd = 99, crowd = 0;
    for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx, ny = y + dy, t = getT(S.f, nx, ny);
        if (t === T.GRAVE && S.ex[exKey(S.f, nx, ny)]) { if (r <= 2) crowd++; if (r < nd) { nd = r; near = [nx, ny]; } }
        else if (!spot && TILE[t].ground && !(nx === S.x && ny === S.y) && !mobAt(nx, ny)) spot = [nx, ny];
    }
    if (near && (crowd >= 6 || !spot)) {
        const e = S.ex[exKey(S.f, near[0], near[1])];
        for (const it of items) e.items.push(it);
        e.t = S.T; if (kind === 'death') e.death = 1;
        return near;
    }
    if (!spot) return null;
    setT(S.f, spot[0], spot[1], T.GRAVE);
    S.ex[exKey(S.f, spot[0], spot[1])] = { items, t: S.T, f: S.f, x: spot[0], y: spot[1], drop: kind === 'death' ? 0 : 1, death: kind === 'death' ? 1 : 0 };
    return spot;
}

// ---------- 地図の記録 ----------
function seenIdx(x, y) { return (y >> 2) * 250 + (x >> 2); }
function setSeen(x, y) {
    if (x < 0 || y < 0 || x >= WORLD || y >= WORLD) return;
    const s = S.seen[S.f], i = seenIdx(x, y);
    if (s[i >> 3] & (1 << (i & 7))) return;
    s[i >> 3] |= 1 << (i & 7);
    H.seen(S.f, x >> 2, y >> 2);
}
// 地下では つながった空洞と そのまわりのかべ1マスだけが見える。結果は位置と地形が変わるまで使い回す
const VIEW_R = 13;
let caveViewCache = { key: '', cells: null, set: null };
const seeThrough = d => !d.opaque && !d.door;   // 松明・ガラス・柵などは 向こうが見える
function caveView() {
    const key = S.f + ',' + S.x + ',' + S.y + ',' + worldVer;
    if (caveViewCache.key === key) return caveViewCache;
    const set = new Set(), cells = [], q = [[S.x, S.y]];
    const add = (x, y) => { const k = y * 1000 + x; if (set.has(k)) return false; set.add(k); cells.push([x, y]); return true; };
    add(S.x, S.y);
    while (q.length) {
        const [x, y] = q.shift();
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (Math.max(Math.abs(nx - S.x), Math.abs(ny - S.y)) > VIEW_R) continue;
            if (set.has(ny * 1000 + nx)) continue;
            const d = TILE[getT(S.f, nx, ny)];
            if (dx && dy && seeThrough(d)) continue;   // ななめ先の空きマスは 上下左右からつながるときだけ見える
            add(nx, ny);   // かべも1マスまでは見える
            // 空洞は 上下左右でつながる所だけ広げる(ななめのすきまからは のぞけない)
            if (seeThrough(d) && (dx === 0 || dy === 0)) q.push([nx, ny]);
        }
    }
    return (caveViewCache = { key, cells, set });
}
function markSeen() {
    if (isCave(S.f)) { for (const c of caveView().cells) setSeen(c[0], c[1]); return; }
    const R = 14;
    for (let y = S.y - R; y <= S.y + R; y += 4) for (let x = S.x - R; x <= S.x + R; x += 4) setSeen(x, y);
}
function isSeen(f, cx, cy) { const i = cy * 250 + cx; return !!(S.seen[f][i >> 3] & (1 << (i & 7))); }
function revealAround(r) {
    for (let y = S.y - r; y <= S.y + r; y += 4) for (let x = S.x - r; x <= S.x + r; x += 4) setSeen(x, y);
}

// ---------- 魔物 ----------
function mobAt(x, y) {
    for (const m of mobs) {
        if (m.big) { if (Math.abs(x - m.x) <= 1 && Math.abs(y - m.y) <= 1) return m; }
        else if (m.x === x && m.y === y) return m;
    }
    return null;
}
function spawnMob(t, x, y) {
    const d = MOBS[t];
    const m = { t, x, y, rx: x, ry: y, ax: 0, ay: 0, hp: d.hp, acc: rnd(), face: 2, flash: 0, scared: 0, lv: 1 };
    if (!d.animal && !d.elite && t !== 'boss' && isCave(S.f)) { m.lv = caveDepth(S.f) + 1; m.hp = Math.round(d.hp * (1 + .35 * (m.lv - 1))); }
    m.mhp = m.hp;
    mobs.push(m);
    return m;
}
const mobAtk = (m, d) => Math.round(d.atk * (1 + .2 * ((m.lv || 1) - 1)));
function litNear(x, y) {
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const d = TILE[getT(S.f, x + dx, y + dy)]; if ((d.key === 'TORCH' || d.key === 'GLOWM' || d.key === 'GMUSH' || d.metal || d.deco) && d.light && Math.max(Math.abs(dx), Math.abs(dy)) <= d.light - 1) return true; if (d.key === 'BULB' && powered(x + dx, y + dy)) return true; }
    return false;
}
function chooseSpawn(x, y) {
    if (S.f === 0) {
        const b = biomeAt(x, y), night = isNight(), animals = mobs.filter(m => MOBS[m.t].animal && !MOBS[m.t].npc && !MOBS[m.t].pet).length;
        if (!night && rnd() < .012) { H.log('何か光るものが 遠くを走っていった!', 'good'); return 'deer'; }
        if (!night && rnd() < .008) { H.log('ジャラジャラと音がする…', 'good'); return 'goblin'; }
        if (night && rnd() < (S.sleeping ? .03 : .12)) return 'bomber';   // 眠っている夜は少なめ
        if (!night && animals < 7 && b !== BIOME.DESERT && rnd() < .8) return pick(b === BIOME.SNOW || b === BIOME.MOUNT ? ['sheep', 'sheep', 'cow'] : ['chicken', 'chicken', 'pig', 'sheep', 'cow']);
        if (!night) return b === BIOME.DESERT ? (rnd() < .5 ? 'scorpion' : null) : (rnd() < .4 ? pick(['slime', 'slime', 'zombie']) : null);
        if (b === BIOME.MOUNT && rnd() < .3) return 'golem';
        if (dayNo() >= 3 && rnd() < .025) return 'golem';
        if (b === BIOME.SNOW) return pick(['yeti', 'wolf', 'skeleton', 'zombie']);
        if (b === BIOME.DESERT) return pick(['scorpion', 'skeleton', 'zombie']);
        if (b === BIOME.FOREST) return pick(['wolf', 'zombie', 'skeleton']);
        return pick(['zombie', 'zombie', 'skeleton', 'slime']);
    }
    if (isCave(S.f)) {
        const dep = caveDepth(S.f);
        if (rnd() < .008) { H.log('ジャラジャラと音がする…', 'good'); return 'goblin'; }
        if (rnd() < .1) return 'bomber';
        if (dep >= 4 && rnd() < .3) return 'orec';
        return pick(dep === 1 ? ['bat', 'bat', 'spider'] : dep === 2 ? ['bat', 'spider', 'mole'] : ['spider', 'mole', 'mole', 'orec']);
    }
    return pick(['imp', 'imp', 'mslime', 'eye', 'knight']);
}
function trySpawn() {
    const hostile = mobs.filter(m => !MOBS[m.t].animal && !m.big).length;
    const night = isNight();
    const cap = S.f === 0 ? (night ? 8 : 4) : isCave(S.f) ? 5 + caveDepth(S.f) : 9;
    const rate = S.f === 0 ? (night ? .22 : .06) : isCave(S.f) ? .07 + .01 * caveDepth(S.f) : .15;
    if (rnd() > rate || (hostile >= cap && S.f !== 0)) return;
    const a = rnd() * Math.PI * 2, r = 10 + rnd() * 7, x = Math.round(S.x + Math.cos(a) * r), y = Math.round(S.y + Math.sin(a) * r), t = getT(S.f, x, y);
    if (!TILE[t].ground || mobAt(x, y) || t === T.CFLOOR) return;
    if (litNear(x, y)) return;
    const k = chooseSpawn(x, y);
    if (!k || (circuitMode() && !MOBS[k].animal)) return;
    if (!MOBS[k].animal && hostile >= cap) return;
    spawnMob(k, x, y);
}
const mobWalk = t => { const d = TILE[t]; return !d.solid && !d.door && !d.swim && !d.trap && t !== T.CAVEIN && t !== T.GATE && t !== T.LADDER_D && t !== T.LADDER_U && t !== T.STAIRS_U; };
function moveMob(m, dx, dy) {
    const nx = m.x + dx, ny = m.y + dy;
    if (nx === S.x && ny === S.y) return false;
    if (!mobWalk(getT(S.f, nx, ny)) || mobAt(nx, ny)) return false;
    m.x = nx; m.y = ny;
    m.face = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
    return true;
}
function lineClear(x0, y0, x1, y1) {
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    let x = x0 + dx, y = y0 + dy;
    while (x !== x1 || y !== y1) { const q = TILE[getT(S.f, x, y)]; if (q.solid && !q.low) return false; x += dx; y += dy; }
    return true;
}
function actMob(m) {
    const d = MOBS[m.t], dx = S.x - m.x, dy = S.y - m.y, dist = Math.abs(dx) + Math.abs(dy);
    if (d.pet) { petAct(m); return; }
    if (d.animal) {
        if (d.shy && dist <= 7) m.scared = 3;   // 珍しい生き物は すぐ逃げる
        if (m.scared > 0) {
            m.scared--;
            const opts = [[-Math.sign(dx), 0], [0, -Math.sign(dy)]].filter(o => o[0] || o[1]).sort(() => rnd() - .5);
            for (const o of opts) if (moveMob(m, o[0], o[1])) return;
        } else if (rnd() < .3) { const o = pick(DIRS); moveMob(m, o[0], o[1]); }
        return;
    }
    // 索敵: 範囲に入ると気づいて追う。少しはなれても すぐにはあきらめない
    const agg = d.agg + (S.sleeping ? 8 : 0);   // 眠っていると見つかりやすい
    // 3マス以内は物音で気づく。それより遠いと 見えていないと気づかない。一度気づくと 少しはなれても追う
    const sees = dist <= 3 || (dist <= agg && canSee(m.x, m.y, S.x, S.y)) || (m.aggro && dist <= agg + 5);
    if (sees && !m.aggro && !S.sleeping) { H.float(m.x, m.y, '!', '#ff5a3c', 1); H.stopHold(); }
    m.aggro = sees;
    if (d.bomb) {
        if (m.fuse) { m.fuse--; m.flash = 1; if (!m.fuse) explode(m); return; }
        if (dist <= 1 || (dist <= 3 && !lineClearAny(m.x, m.y, S.x, S.y))) {
            m.fuse = 2; m.flash = 1;
            H.float(m.x, m.y, '!!', '#ff3a1c', 1); H.log(d.n + 'が光りだした! はなれて!', 'bad'); H.sfx('warn'); H.stopHold();
            return;
        }
    }
    if (dist === 1) {
        m.ax = Math.sign(dx) * .35; m.ay = Math.sign(dy) * .35;
        m.face = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
        hurt(mobAtk(m, d), d.n, d);
        H.stopHold();
        if (S.hp <= 0) return;
        const a = curArmor();
        if (a && toolStats(a).thorn) damageMob(m, toolStats(a).thorn, true);
        return;
    }
    if (d.shoot && (dx === 0 || dy === 0) && dist <= d.shoot && lineClear(m.x, m.y, S.x, S.y)) {
        m.face = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
        H.shot(m.x, m.y, S.x, S.y, m.t === 'eye' ? '#d05aff' : '#f0e8d0', m.t === 'skeleton');
        H.sfx('attack');
        hurt(mobAtk(m, d), d.n + (m.t === 'skeleton' ? 'の矢' : ''), d);
        H.stopHold();
        return;
    }
    if (!sees || (d.erratic && rnd() < .4)) {
        if (rnd() < .35) { const o = pick(DIRS); moveMob(m, o[0], o[1]); }
        return;
    }
    // 回り道の途中なら そのまま進む
    if (m.detour > 0) {
        m.detour--;
        const q = detourStep(m);
        if (q && moveMob(m, q[0], q[1])) return;
    }
    const sx = Math.sign(dx), sy = Math.sign(dy), xFirst = Math.abs(dx) > Math.abs(dy);
    // 飛び道具を持つ敵は、まず縦か横の列をそろえる。ふつうの敵は遠いほうの向きから近づく
    const aligned = dx === 0 || dy === 0;
    const steps = d.shoot && !aligned ? (xFirst ? [[0, sy], [sx, 0]] : [[sx, 0], [0, sy]]) : (xFirst ? [[sx, 0], [0, sy]] : [[0, sy], [sx, 0]]);
    if ((steps[0][0] || steps[0][1]) && moveMob(m, steps[0][0], steps[0][1])) return;
    // まっすぐ進めなければ 近くの道をさがして回りこむ。横へずれるだけだと かべの前を行ったり来たりしてしまう
    const q = detourStep(m);
    if (q && moveMob(m, q[0], q[1])) { m.detour = 6; return; }
    if ((steps[1][0] || steps[1][1]) && moveMob(m, steps[1][0], steps[1][1])) return;
    const o = pick(DIRS);
    moveMob(m, o[0], o[1]);
}
// 主人公のとなりまでの道を近場だけ探す。見つからないときは少しのあいだ探さない(かべの中にいる主人公で重くならないように)
function detourStep(m) {
    if ((m.noPath || 0) > S.T) return null;
    const key = (x, y) => y * 1000 + x, from = new Map([[key(m.x, m.y), null]]), q = [[m.x, m.y]];
    let n = 0, goal = null;
    while (n < q.length && n < 700) {
        const c = q[n++];
        if (Math.abs(c[0] - S.x) + Math.abs(c[1] - S.y) === 1) { goal = c; break; }
        for (const d of DIRS) {
            const x = c[0] + d[0], y = c[1] + d[1], k = key(x, y);
            if (from.has(k) || (x === S.x && y === S.y) || Math.abs(x - m.x) > 14 || Math.abs(y - m.y) > 14) continue;
            if (!mobWalk(getT(S.f, x, y)) || mobAt(x, y)) continue;
            from.set(k, c); q.push([x, y]);
        }
    }
    if (!goal || (goal[0] === m.x && goal[1] === m.y)) { m.noPath = S.T + 6; return null; }
    let c = goal, p = from.get(key(c[0], c[1]));
    while (p && !(p[0] === m.x && p[1] === m.y)) { c = p; p = from.get(key(c[0], c[1])); }
    return [c[0] - m.x, c[1] - m.y];
}
// 敵から主人公が見えるか(かべ・岩・閉じた扉がさえぎる)
function canSee(x0, y0, x1, y1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 1; i < n; i++) if (TILE[getT(S.f, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n))].opaque) return false;
    return true;
}
function lineClearAny(x0, y0, x1, y1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 1; i < n; i++) if (TILE[getT(S.f, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n))].solid) return false;
    return true;
}
function explode(m) {
    const i = mobs.indexOf(m);
    if (i >= 0) mobs.splice(i, 1);
    H.shake(14); H.sfx('bigclear');
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        const x = m.x + dx, y = m.y + dy, t = getT(S.f, x, y), td = TILE[t];
        H.chips(x, y, '#ffb03c');
        // 石のかべ・金属の建材は 決まった回数の爆発にたえる(鉄はこわれない)
        if (td.blast) {
            const k = 'b' + exKey(S.f, x, y), n = S.dmg[k] || 0;
            if (n < td.blast) { S.dmg[k] = n + 1; S.dmgT[k] = S.T; continue; }
            delete S.dmg[k];
        }
        if ((td.hp || td.back) && (!td.door || td.back) && t !== T.SPAWNER && t !== T.METEOR && t !== T.CHEST) { delete S.dmg[exKey(S.f, x, y)]; setT(S.f, x, y, groundOf(S.f, x, y)); }
    }
    const dist = Math.abs(S.x - m.x) + Math.abs(S.y - m.y);
    if (dist <= 3) { ach('boom'); hurt(dist <= 1 ? 40 : dist === 2 ? 28 : 14, '爆発', null); }
}
// なかまのオオカミ: 近くの敵をおそい、主人公についてくる
function petAct(m) {
    const foe = mobs.find(q => !MOBS[q.t].animal && !q.big && Math.abs(q.x - m.x) + Math.abs(q.y - m.y) <= 6);
    if (foe) {
        const dx = foe.x - m.x, dy = foe.y - m.y;
        if (Math.abs(dx) + Math.abs(dy) === 1) { m.ax = Math.sign(dx) * .35; m.ay = Math.sign(dy) * .35; lastAttack = 'pet'; damageMob(foe, 9, true); lastAttack = null; return; }
        // 主人公などにふさがれていたら 回りこむ
        const steps = Math.abs(dx) > Math.abs(dy) ? [[Math.sign(dx), 0], [0, Math.sign(dy) || 1], [0, -(Math.sign(dy) || 1)]] : [[0, Math.sign(dy)], [Math.sign(dx) || 1, 0], [-(Math.sign(dx) || 1), 0]];
        for (const o of steps) if (moveMob(m, o[0], o[1])) return;
    }
    const dx = S.x - m.x, dy = S.y - m.y;
    if (Math.abs(dx) + Math.abs(dy) > 12) { placeBeside(m); return; }
    if (Math.abs(dx) + Math.abs(dy) > 2) {
        if (!(Math.abs(dx) > Math.abs(dy) ? moveMob(m, Math.sign(dx), 0) : moveMob(m, 0, Math.sign(dy)))) { const o = pick(DIRS); moveMob(m, o[0], o[1]); }
    }
}
function placeBeside(m) {
    for (let r = 1; r < 4; r++) for (const d of DIRS) {
        const x = S.x + d[0] * r, y = S.y + d[1] * r;
        if (mobWalk(getT(S.f, x, y)) && !mobAt(x, y)) { m.x = m.rx = x; m.y = m.ry = y; return; }
    }
}
function addPet(hp) { const m = spawnMob('pet', S.x, S.y); m.hp = hp || MOBS.pet.hp; placeBeside(m); }
function mobsAct() {
    for (let i = mobs.length - 1; i >= 0; i--) {
        const m = mobs[i];
        if (!m) continue;
        if (m.big) { bossAct(m); continue; }
        const dist = Math.abs(m.x - S.x) + Math.abs(m.y - S.y);
        if (!MOBS[m.t].pet && dist > 34 || (dist > 22 && !m.aggro && !isNight() && S.f === 0 && !MOBS[m.t].animal && rnd() < .2)) { mobs.splice(i, 1); continue; }
        m.acc += MOBS[m.t].spd;
        while (m.acc >= 1 && S.hp > 0) { m.acc -= 1; actMob(m); }
        if (S.hp <= 0) return;
    }
}

// ---------- 戦闘 ----------
function hurt(atk, src, d) {
    if (circuitMode()) return;
    const a = curArmor(), def = a ? toolStats(a).def : 0;
    const dmg = Math.max(Math.ceil(atk * .2), Math.round((atk - def) * (.9 + rnd() * .2)));
    S.hp -= dmg;
    if (S.sleeping) S.wokeBy = src;
    if (a) wear(a, 1);
    if (d && d.poison) { S.hunger = Math.max(0, S.hunger - d.poison); H.log('毒で おなかが減った', 'bad'); }
    H.float(S.x, S.y, '-' + dmg, '#ff5a5a', 1); H.shake(5); H.sfx('hurt');
    H.log(src + 'から ' + dmg + ' のダメージ', 'bad');
    if (S.hp <= 0) die(src);
}
function damageMob(m, dmg, silent) {
    const d = MOBS[m.t];
    if (m.big) {
        if (lastAttack === 'melee') S.bossMelee = 1;
        const arm = curArmor();
        if ((attackTool && attackTool.a === 'demon') || (arm && arm.a === 'demon')) S.bossDemon = 1;
    }
    m.hp -= dmg; m.flash = 1;
    H.float(m.x, m.y, String(dmg), '#ffe14a', m.big ? 3 : 1);
    if (d.animal) m.scared = 6;
    if (!silent) H.sfx('hit');
    if (m.big) S.bossHp = m.hp;
    if (m.hp <= 0) killMob(m);
}
function playerAttack(m) {
    const w = bestWeapon(), st = w ? toolStats(w) : { atk: 0, burn: 0 }, d = MOBS[m.t];
    let dmg = Math.max(1, 2 + st.atk - (d.def || 0));
    dmg = Math.max(1, Math.round(dmg * (.9 + rnd() * .2)));
    const crit = rnd() < .1;
    if (crit) dmg = Math.round(dmg * 1.6);
    if (st.burn) dmg += 5;
    H.slash(m.x, m.y, crit); if (crit) { H.sfx('crit'); H.shake(4); }
    wear(w, 1);
    lastAttack = 'melee'; attackTool = w;
    damageMob(m, dmg, crit);
    lastAttack = null; attackTool = null;
}
function killMob(m) {
    const d = MOBS[m.t], idx = mobs.indexOf(m);
    if (idx >= 0) mobs.splice(idx, 1);
    S.kills++;
    if (!d.animal || d.shy) {
        if (m.t === 'deer') ach('deer');
        if (m.t === 'goblin') ach('goblin');
        if (lastAttack === 'melee' && !attackTool && !d.animal) ach('bare');
        if (m.t === 'golem' && lastAttack === 'melee' && attackTool && attackTool.a === 'wood') ach('david');
        if (lastAttack === 'bow' && m.bowDist >= 5 && !d.animal) ach('sniper');
        if (m.t === 'bomber' && m.fuse) ach('dud');
        if (lastAttack === 'pet') ach('teamwork');
        if (d.elite) {
            ach('elite');
            achData.elites[m.t] = 1;
            try { localStorage.setItem(ACH_KEY, JSON.stringify(achData)); } catch (e) { }
            if (Object.keys(GUARDS).every(k => achData.elites[GUARDS[k]])) ach('all_elite');
        }
    }
    H.chips(m.x, m.y, '#ffffff'); H.log(d.n + 'をたおした!', 'good');
    if (d.boss) { bossDown(); return; }
    if (m.gkey) { S.guards[m.gkey] = 1; H.banner(d.n + 'をたおした!', '良い物を落とした'); H.sfx('levelup'); }
    const items = rollDrops(d.drop, false);
    if (items.length) dropLoot(m.x, m.y, items);
}
function rollDrops(drop, luck) {
    const out = [];
    for (const r of drop || []) {
        if (r[3] !== undefined && rnd() > r[3]) continue;
        let n = rint(r[1], r[2]);
        if (luck && rnd() < .2) n *= 2;
        if (n > 0) out.push({ id: r[0], n });
    }
    return out;
}
function giveDrops(drop, luck) { for (const q of rollDrops(drop, luck)) give(q.id, q.n); }
// 魔物の落とし物: たおした所に 荷物として落ちる(上に乗ると拾う)。2日たつと消える
function dropLoot(x, y, items, quiet) {
    const spot = dropPile(x, y, items, 'mob');
    if (!spot) { if (!quiet) for (const q of items) give(q.id, q.n); return; }   // 置ける所がないときは そのまま持ち物へ
    if (!quiet) H.log(items.map(q => ITEM[q.id].n + (q.n > 1 ? q.n : '')).join('・') + 'を落とした', '');
}
// 魔物の落とし物は2日、自分が死んで落とした荷物は5日で消える
// 動く床にのっている荷物(S.ex に items)。同じ床に来た荷物は まとまる
function addToBelt(x, y, items) {
    const k = exKey(S.f, x, y), e = S.ex[k] || (S.ex[k] = {});
    e.items = (e.items || []).concat(items); Object.assign(e, { t: S.T, f: S.f, x, y, drop: 1 });
}
// 荷物を (x,y) へ。動く床なら床にのせ、荷物があれば まとめ、地面なら 新しい荷物にする。置けたら true
function putPileAt(x, y, items) {
    const t = getT(S.f, x, y), k = exKey(S.f, x, y);
    if (TILE[t].belt) { addToBelt(x, y, items); return true; }
    if (t === T.GRAVE && S.ex[k] && S.ex[k].items) { S.ex[k].items = S.ex[k].items.concat(items); S.ex[k].t = S.T; return true; }
    if (!TILE[t].ground || mobAt(x, y)) return false;
    setT(S.f, x, y, T.GRAVE); S.ex[k] = { items, t: S.T, f: S.f, x, y, drop: 1 };
    return true;
}
function dropsExpire() {
    for (const k in S.ex) {
        const e = S.ex[k];
        if (!e || !e.items || e.t === undefined || e.f === undefined) continue;
        if (S.T - e.t < DAY_LEN * (e.death ? 5 : 2)) continue;
        S.graves = S.graves.filter(q => !(q.f === e.f && q.x === e.x && q.y === e.y));
        if (getT(e.f, e.x, e.y) === T.GRAVE) setT(e.f, e.x, e.y, groundOf(e.f, e.x, e.y));
        if (TILE[getT(e.f, e.x, e.y)].belt) { delete e.items; continue; }
        delete S.ex[k];
    }
}
function die(src) {
    S.deaths++;
    ach('first_death');
    if (src === 'おぼれたこと') ach('drown');
    const items = S.inv.filter(Boolean);
    if (items.length) {
        const spot = dropPile(S.x, S.y, items, 'death') || [S.x, S.y];
        if (!S.ex[exKey(S.f, spot[0], spot[1])]) { setT(S.f, S.x, S.y, T.GRAVE); S.ex[exKey(S.f, S.x, S.y)] = { items, t: S.T, f: S.f, x: S.x, y: S.y, death: 1 }; }
        S.graves.push({ f: S.f, x: spot[0], y: spot[1] });
        if (S.graves.length > 5) S.graves.shift();
    }
    S.inv = new Array(INV_SIZE).fill(null);
    H.sfx('gameover');
    H.dead(src);
    const sp = S.spawn;
    S.f = sp.f; S.x = sp.x; S.y = sp.y;
    if (S.bed && getT(S.bed.f, S.bed.x, S.bed.y) !== T.BED) { S.bed = null; S.spawn = { f: 0, x: CENTER, y: CENTER }; S.f = 0; S.x = CENTER; S.y = CENTER; }
    freeSpot();
    S.hp = maxHp(); S.hunger = 70; S.air = AIR_MAX;
    { const pets = mobs.filter(m => MOBS[m.t].pet).map(m => m.hp); mobs = []; pets.forEach(addPet); }
    if (S.f === 2) ensureBoss();
    saveGame();
}
function freeSpot() {
    const ok = t => !TILE[t].solid && !TILE[t].swim;
    if (ok(getT(S.f, S.x, S.y))) return;
    for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (ok(getT(S.f, S.x + dx, S.y + dy))) { S.x += dx; S.y += dy; return; }
    }
}

// ---------- ボス ----------
function ensureBoss() {
    if (S.bossDead || circuitMode() || mobs.some(m => m.big)) return;
    const p = bossPos(), m = spawnMob('boss', p.x, p.y);
    m.big = 1; m.hp = S.bossHp; m.cd = 2; m.plan = null; m.walk = 0;
}
const bossPhase = m => m.hp > MOBS.boss.hp * .66 ? 1 : m.hp > MOBS.boss.hp * .33 ? 2 : 3;
function inArena(x, y) { const p = bossPos(); return Math.abs(x - p.x) < ARENA_R && Math.abs(y - p.y) < ARENA_R; }
const isPlaced = t => TILE[t].back && TILE[t].solid;
function novaTiles(m) {
    const p = bossPos(), out = [], walls = {};
    for (let y = p.y - ARENA_R + 1; y < p.y + ARENA_R; y++) for (let x = p.x - ARENA_R + 1; x < p.x + ARENA_R; x++) {
        const n = Math.max(Math.abs(x - m.x), Math.abs(y - m.y));
        let hit = true;
        for (let i = 1; i < n; i++) {
            const qx = Math.round(m.x + (x - m.x) * i / n), qy = Math.round(m.y + (y - m.y) * i / n);
            if (Math.max(Math.abs(qx - m.x), Math.abs(qy - m.y)) <= 1) continue;
            const t = getT(S.f, qx, qy);
            if (TILE[t].solid) { hit = false; if (isPlaced(t)) walls[qx + ',' + qy] = [qx, qy]; break; }
        }
        if (hit && !TILE[getT(S.f, x, y)].solid) out.push([x, y]);
    }
    return { tiles: out, walls: Object.values(walls) };
}
function breakPlaced(x, y) {
    const t = getT(S.f, x, y);
    if (isPlaced(t)) { setT(S.f, x, y, groundOf(S.f, x, y) === T.ASH ? T.CFLOOR : groundOf(S.f, x, y)); H.chips(x, y, '#caa070'); }
}
function makeBossPlan(m) {
    const ph = bossPhase(m), dx = S.x - m.x, dy = S.y - m.y, near = Math.max(Math.abs(dx), Math.abs(dy)) <= 3;
    const roll = rnd();
    if (near && roll < .65) {
        const tiles = [];
        for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (Math.max(Math.abs(x), Math.abs(y)) >= 2 && !TILE[getT(S.f, m.x + x, m.y + y)].solid) tiles.push([m.x + x, m.y + y]);
        return { type: 'slam', tiles, in: ph >= 3 ? 1 : 2, atk: 34, name: 'たたきつけ' };
    }
    if (ph >= 2 && roll > .78) return { type: 'nova', tiles: novaTiles(m).tiles, in: 3, atk: 55, name: '魔王の大波動(柱やかべの陰へ!)' };
    if (ph >= 2 && roll > .62 && mobs.length < 5) return { type: 'summon', tiles: [], in: 1, name: '手下を呼ぶ' };
    if (roll < .5) {
        const horiz = Math.abs(dx) > Math.abs(dy), sx = horiz ? Math.sign(dx) : 0, sy = horiz ? 0 : (Math.sign(dy) || 1), tiles = [];
        for (let w = -1; w <= 1; w++) {
            let x = m.x + (horiz ? sx * 2 : w), y = m.y + (horiz ? w : sy * 2);
            for (let i = 0; i < 16; i++) {
                const t = getT(S.f, x, y);
                if (t === T.CWALL) break;
                tiles.push([x, y]);
                if (TILE[t].solid) break;
                x += sx; y += sy;
            }
        }
        return { type: 'breath', tiles, in: 2, atk: 40, name: '炎の息' };
    }
    const tiles = [[S.x, S.y]], n = 6 + ph * 4;
    for (let i = 0; i < n; i++) {
        const x = S.x + rint(-4, 4), y = S.y + rint(-4, 4), t = getT(S.f, x, y);
        if (t !== T.CWALL && inArena(x, y)) tiles.push([x, y]);
    }
    return { type: 'meteor', tiles, in: 2, atk: 30, name: '星ふり' };
}
function runBossPlan(m) {
    const pl = m.plan;
    m.plan = null;
    H.shake(8); H.sfx('bigclear');
    if (pl.type === 'summon') {
        for (const d of DIRS) { const x = m.x + d[0] * 3, y = m.y + d[1] * 3; if (mobs.length < 7 && TILE[getT(S.f, x, y)].ground && !mobAt(x, y) && !(x === S.x && y === S.y)) spawnMob('imp', x, y); }
        H.log('魔王が手下を呼んだ!', 'bad');
        return;
    }
    if (pl.type === 'nova') {
        const n = novaTiles(m);
        if (n.walls.length && inArena(S.x, S.y) && !n.tiles.some(q => q[0] === S.x && q[1] === S.y) && S.hp > 0) ach('nova_wall');
        n.walls.forEach(w => breakPlaced(w[0], w[1]));
        pl.tiles = n.tiles;
    } else pl.tiles.forEach(q => breakPlaced(q[0], q[1]));
    pl.tiles.forEach(q => { if (rnd() < .3) H.chips(q[0], q[1], pl.type === 'nova' ? '#c05aff' : '#ff8a2c'); });
    if (pl.tiles.some(q => q[0] === S.x && q[1] === S.y)) hurt(pl.atk, pl.name, null);
}
function bossAct(m) {
    if (S.f !== 2) return;
    if (!inArena(S.x, S.y)) { m.plan = null; return; }
    if (!S.bossSeen) { S.bossSeen = 1; H.banner('魔王ヴォルガ', '光ったマスから にげろ!'); H.sfx('warn'); }
    if (m.plan) {
        if (m.plan.type === 'nova') m.plan.tiles = novaTiles(m).tiles;
        m.plan.in--;
        if (m.plan.in <= 0) runBossPlan(m);
        return;
    }
    if (m.cd > 0) {
        m.cd--;
        m.walk = (m.walk || 0) + 1;
        if (m.walk % 2 === 0) {
            const dx = S.x - m.x, dy = S.y - m.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 2) {
                const sx = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, sy = sx ? 0 : Math.sign(dy);
                bossStep(m, sx, sy);
            }
        }
        return;
    }
    m.plan = makeBossPlan(m);
    m.cd = 4 - bossPhase(m);
    H.log('魔王の ' + m.plan.name + '!', 'bad'); H.sfx('warn'); H.stopHold();
}
function bossStep(m, sx, sy) {
    const nx = m.x + sx, ny = m.y + sy;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const t = getT(S.f, nx + dx, ny + dy);
        if (t === T.CWALL || (nx + dx === S.x && ny + dy === S.y)) return;
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) breakPlaced(nx + dx, ny + dy);
    m.x = nx; m.y = ny;
    m.face = sx > 0 ? 1 : sx < 0 ? 3 : sy > 0 ? 2 : 0;
}
function bossDown() {
    S.bossDead = true; S.got.boss_dead = 1; S.bossHp = 0;
    ach('victory');
    if (!S.deaths) ach('no_death');
    if (dayNo() <= 30) ach('quick');
    if (!S.bossMelee) ach('archer_king');
    if (!S.bossDemon) ach('underdog');
    H.shake(14); H.sfx('fanfare');
    if (!S.cleared) { S.cleared = true; H.victory(); }
    saveGame();
}
function bossDirection() {
    if (S.f !== 2 || S.bossDead) return null;
    const p = bossPos(), dx = p.x - S.x, dy = p.y - S.y, dist = Math.abs(dx) + Math.abs(dy);
    const a = Math.atan2(dy, dx) * 180 / Math.PI, names = ['東', '南東', '南', '南西', '西', '北西', '北', '北東'];
    return { dist, name: names[((Math.round(a / 45) % 8) + 8) % 8] };
}

// ---------- ターン進行 ----------
function endTurn(n) {
    n = n || 1;
    for (let i = 0; i < n; i++) {
        const before = isNight();
        S.T++;
        S.hungerAcc++;
        if (S.hungerAcc >= 5 && !circuitMode()) { S.hungerAcc = 0; S.hunger = Math.max(0, S.hunger - 1); if (S.hunger === 20) H.log('おなかが減ってきた…', 'warn'); }
        // HPの自然回復はゆっくり。しっかり治すには寝床で眠る
        if (S.hunger >= 30 && S.hp < maxHp() && !S.sleeping && S.T % (getT(S.f, S.x, S.y) === T.CARPET ? (S.hunger >= 70 ? 3 : 6) : (S.hunger >= 70 ? 4 : 8)) === 0) S.hp = Math.min(maxHp(), S.hp + 1);
        S.regenAcc++;
        if (S.regenAcc >= 5) {
            S.regenAcc = 0;
            if (S.hunger === 0) { S.hp -= 2; H.float(S.x, S.y, '-2', '#ff8a5a'); H.log('おなかがペコペコで HPが減っている!', 'bad'); if (S.hp <= 0) { die('空腹'); break; } }
        }
        updateBreath();
        if (S.hp <= 0) break;
        if (S.T % 20 === 0) { healDmg(); dropsExpire(); }
        flowWater();
        if (dayT() === 0) {
            H.log(dayNo() + '日目の朝がきた', 'good'); saveGame();
            ach('first_morning');
            if (S.nightAwake && !S.sleeping) { ach('night_owl'); if (S.hp <= 10) ach('close_call'); }
            S.nightAwake = false;
        }
        if (!before && isNight()) { H.log('夜になった。まものに気をつけて', 'warn'); H.sfx('warn'); S.nightAwake = !S.sleeping; }
        mobsAct();
        if (S.hp <= 0) break;
        trySpawn();
        worldTick();
        circuitTick();
    }
    if (S.T % 120 === 0) saveGame();
    markSeen();
    checkArea();
    H.refresh();
}
function updateBreath() {
    if (S.air === undefined || circuitMode()) S.air = AIR_MAX;
    if (circuitMode()) return;
    if (!TILE[getT(S.f, S.x, S.y)].swim) { if (S.air <= 3) ach('breath'); S.air = Math.min(AIR_MAX, S.air + 4); return; }
    if (S.air === AIR_MAX) H.log('泳いでいる!', 'warn');
    S.air = Math.max(0, S.air - 1);
    if (S.air === 10) { H.log('息が苦しくなってきた!', 'bad'); H.sfx('warn'); }
    if (S.air > 0) return;
    S.hp -= 3;
    H.float(S.x, S.y, '-3', '#7fd0ff');
    H.stopHold();
    if (S.hp <= 0) die('おぼれたこと');
}
function worldTick() {
    // 若木が育つ
    // ニワトリが たまごを産む(なついたニワトリは 1日に2こくらい、野生はたまに)
    for (const m of mobs) {
        if (m.t !== 'chicken') continue;
        if (m.ref ? S.T >= (m.ref.egg || (m.ref.egg = S.T + rint(150, 260))) : rnd() < 1 / 600) {
            if (m.ref) m.ref.egg = S.T + rint(180, 300);
            dropLoot(m.x, m.y, [{ id: 'egg', n: 1 }], true);
        }
    }
    if (S.T % 10 === 0 && S.saplings.length) {
        S.saplings = S.saplings.filter(q => {
            if (getT(q.f, q.x, q.y) !== T.SAPLING) return false;
            if (S.T - q.p < TREE_TIME) return true;
            setT(q.f, q.x, q.y, T[q.to || 'TREE']);
            ach('forester');
            delete S.ex[exKey(q.f, q.x, q.y)];
            return false;
        });
    }
    // まものの巣: 近くにいると わき続ける。巣をこわすと止まる
    if (isCave(S.f) && S.T % 4 === 0 && !circuitMode()) {
        const s = cavePlaceAt(S.f, S.x, S.y);
        if (s && s.type === 'nest' && getT(S.f, s.x, s.y) === T.SPAWNER && mobs.filter(m => !MOBS[m.t].animal && near2(m.x, m.y, s, 4)).length < 4) {
            const o = pick(DIRS), x = s.x + o[0] * 2, y = s.y + o[1] * 2;
            if (TILE[getT(S.f, x, y)].ground && !mobAt(x, y) && !(x === S.x && y === S.y)) { spawnMob(s.spawn, x, y); H.chips(x, y, '#c05aff'); }
        }
    }
    // 地底の商人
    if (isCave(S.f) && S.T % 3 === 0) {
        const s = cavePlaceAt(S.f, S.x, S.y);
        if (s && s.type === 'merchant' && !mobs.some(m => MOBS[m.t].npc) && !(S.x === s.x && S.y === s.y) && !mobAt(s.x, s.y)) { const v = spawnMob('dwarf', s.x, s.y); v.role = 5; v.vkey = 'd' + S.f + ':' + s.x + ',' + s.y; }
    }
    // 村人
    if (S.f === 0 && S.T % 3 === 0) {
        const s = surfPlaceAt(S.x, S.y);
        if (s && s.type === 'village' && !mobs.some(m => MOBS[m.t].npc)) {
            [[-2, 3], [3, 2], [-3, -3], [2, -3], [-4, -1]].forEach((q, i) => { const x = s.x + q[0], y = s.y + q[1]; if (!mobAt(x, y) && !(x === S.x && y === S.y)) { const v = spawnMob('villager', x, y); v.role = i; v.vkey = s.x + ',' + s.y + ',' + i; } });
        }
    }
    // 特別な場所の主
    const pl = S.T % 2 === 0 ? placeHere(S.f, S.x, S.y) : null;
    if (pl && !circuitMode() && GUARDS[pl.type] && !S.guards[pl.key] && !mobs.some(m => m.gkey === pl.key)) {
        let spot = null;
        for (let r = 0; r < 7 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = pl.x + dx, y = pl.y + dy;
            if (mobWalk(getT(S.f, x, y)) && TILE[getT(S.f, x, y)].ground && !mobAt(x, y) && Math.abs(x - S.x) + Math.abs(y - S.y) >= 3) { spot = [x, y]; break; }
        }
        if (spot) {
            const g = spawnMob(GUARDS[pl.type], spot[0], spot[1]);
            g.gkey = pl.key;
            H.banner(MOBS[g.t].n + 'だ!', 'この場所の主。にげてもいい');
            H.sfx('warn');
        }
    }
    // 飼っている動物
    if (S.T % 5 === 0) {
        keptSync();
        for (const e of S.kept) {
            if (e.f !== S.f || Math.abs(e.x - S.x) + Math.abs(e.y - S.y) > 26 || mobs.some(m => m.ref === e)) continue;
            const m = spawnMob(e.t, e.x, e.y); m.ref = e;
        }
    }
    // 図鑑: 見かけた魔物
    for (const m of mobs) if (Math.abs(m.x - S.x) + Math.abs(m.y - S.y) <= 9 && !S.book.m[m.t]) { S.book.m[m.t] = 1; }
}
function keptSync() { if (S && S.kept) for (const m of mobs) if (m.ref) { m.ref.x = m.x; m.ref.y = m.y; } }
function checkArea() {
    if (S.f === 0 && distC(S.x, S.y) >= 400) ach('far');
    const pl = placeHere(S.f, S.x, S.y);
    if (pl && !S.found[pl.key]) {
        S.found[pl.key] = { f: S.f, x: pl.x, y: pl.y, type: pl.type };
        S.book.p[pl.type] = 1;
        if (['giant', 'tower', 'pyramid', 'meteor', 'ship', 'village'].every(k => S.book.p[k])) ach('all_land');
        if (['crystal', 'lake', 'nest', 'mine'].every(k => S.book.p[k])) ach('all_under');
        H.sfx('unlock');
        H.banner('発見! ' + PLACE_NAMES[pl.type], pl.type === 'village' ? '村人にぶつかると 手伝ってもらえる(1日1回)' : pl.type === 'merchant' ? '案内人にぶつかると 役に立つ物をもらえる(1日1回)' : pl.type === 'vault' ? '入口はない。かべを掘りぬこう(鉄のつるはし以上)' : pl.type === 'mushroom' ? '光るきのこは 明かりになる' : pl.type === 'cave' ? '入ると地下へ行ける' : pl.type === 'nest' ? '巣をこわさないと まものがわき続ける' : '');
    }

}
function goalIndex() { for (let i = 0; i < GOALS.length; i++) if (!GOALS[i].ok(S.got)) return i; return -1; }

// ---------- 行動 ----------
function changeFloor(f, x, y) {
    S.f = f; S.x = x; S.y = y;
    { const pets = mobs.filter(m => MOBS[m.t].pet).map(m => m.hp); mobs = []; pets.forEach(addPet); }
    const first = !S.got['reach_' + f];
    S.got['reach_' + f] = 1;
    if (isCave(f)) S.got.depth = Math.max(S.got.depth || 0, caveDepth(f));
    if (f === 1) ach('below');
    if (f === 2) ach('otherworld');
    if (f === 2) ensureBoss();
    H.floorFx(FLOOR_NAME[f]);
    if (first && f >= 3) H.banner(FLOOR_NAME[f], ['', '', '鉄が よくとれる', '金と 赤い石が ねむっている', '星晶が ねむる かたい岩の階', 'いちばん深い階。星晶が多い'][caveDepth(f)] + '・まものは Lv' + (caveDepth(f) + 1));
    H.stopHold();
    markSeen();
    refreshPower();
}
// その階の (x,y) に 穴やはしごで こわしたくない物があれば その名前(自然の岩や土なら null)
function shaftBlock(f, x, y) {
    if (f < 0) return null;
    const t = getT(f, x, y), d = TILE[t];
    if (d.back || d.swim || t === T.MAGMA || t === T.GRAVE) return d.n;
    if ([T.CHEST_W, T.SPAWNER, T.GATE, T.STAIRS_U, T.CAVEIN, T.LADDER_U, T.LADDER_D, T.VWALL, T.CROP_C, T.CROP_W].includes(t)) return d.n;
    return null;
}
function carveExit(f, x, y) {
    const ground = isCave(f) ? T.CAVE : groundOf(f, x, y);
    let open = 0;
    for (const d of DIRS) if (!TILE[getT(f, x + d[0], y + d[1])].solid) open++;
    if (open) return;
    const order = DIRS.slice().sort((a, b) => (TILE[getT(f, x + a[0], y + a[1])].back ? 1 : 0) - (TILE[getT(f, x + b[0], y + b[1])].back ? 1 : 0));
    for (const d of order) {
        const t = getT(f, x + d[0], y + d[1]);
        if (t !== T.BEDROCK && t !== T.CWALL) { setT(f, x + d[0], y + d[1], t === T.WATER || t === T.MAGMA ? (isCave(f) ? T.CAVE : T.WFLOOR) : ground); return; }
    }
}
function goDown(x, y) {
    const to = floorBelow(S.f);
    if (to < 0) return;
    // 階段(洞窟の入口・天然の穴)から降りたら 上り階段、はしごなら はしご
    const up = getT(S.f, x, y) === T.CAVEIN ? T.STAIRS_U : T.LADDER_U;
    if (getT(to, x, y) !== up) setT(to, x, y, up);
    carveExit(to, x, y);
    H.sfx('select');
    changeFloor(to, x, y);
}
function goUp(x, y) {
    const to = floorAbove(S.f);
    if (to < 0) return;
    const top = getT(to, x, y);
    if (top !== T.LADDER_D && top !== T.CAVEIN) setT(to, x, y, T.LADDER_D);
    carveExit(to, x, y);
    H.sfx('select');
    changeFloor(to, x, y);
}
function useGate(x, y) {
    const to = S.f === 2 ? 0 : 2;
    if (getT(to, x, y) !== T.GATE) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = getT(to, x + dx, y + dy); if (t !== T.CWALL) setT(to, x + dx, y + dy, to === 2 ? T.ASH : groundOf(0, x + dx, y + dy)); }
        setT(to, x, y, T.GATE);
    }
    H.sfx('unlock');
    H.log(to === 2 ? '門をくぐって 異世界へ!' : '地上へ もどった', 'good');
    changeFloor(to, x, y);
}
// 植えたばかりで まだ実っていない畑は 上を歩ける(実ったら ぶつかって収穫)
function youngCrop(x, y, t) {
    if (t !== T.CROP_C && t !== T.CROP_W) return false;
    const c = S.ex[exKey(S.f, x, y)];
    return !!c && S.T - c.p < CROP_TIME;
}
function step(dx, dy) {
    if (!S || S.hp <= 0) return;
    fishing = null;
    S.face = [dx, dy];
    const nx = S.x + dx, ny = S.y + dy, m = mobAt(nx, ny);
    if (nx < 0 || ny < 0 || nx >= WORLD || ny >= WORLD) { H.stopHold(); H.log('ここが世界のはしだ', ''); ach('edge'); return; }
    if (m) { if (!bumpMob(m)) { playerAttack(m); endTurn(1); } return; }
    const t = getT(S.f, nx, ny);
    if (!TILE[t].solid || youngCrop(nx, ny, t)) {
        if (TILE[t].door || TILE[getT(S.f, S.x, S.y)].door) H.sfx('toggle');   // 扉の開け閉め
        S.x = nx; S.y = ny;
        if (t === T.LADDER_D || t === T.CAVEIN) { goDown(nx, ny); endTurn(1); return; }
        if (t === T.GRAVE || (TILE[t].belt && S.ex[exKey(S.f, nx, ny)] && S.ex[exKey(S.f, nx, ny)].items)) pickupPile(nx, ny, true);
        if (TILE[t].trap) { springTrap(nx, ny, t); return; }
        if (t === T.LADDER_U || t === T.STAIRS_U) { goUp(nx, ny); endTurn(1); return; }
        if (t === T.GATE) { useGate(nx, ny); endTurn(1); return; }
        endTurn(1);
        return;
    }
    interact(nx, ny, t);
}
function springTrap(x, y, t) {
    setT(S.f, x, y, T.RFLOOR);
    H.stopHold();
    if (TILE[t].trap === 'pit' && S.f === 0) {
        setT(0, x, y, T.LADDER_D);
        H.banner('落とし穴だ!', '下にはしごがあって 助かった');
        ach('pit');
        H.sfx('miss');
        goDown(x, y);
        hurt(8, '落下', null);
    } else {
        const d = pick(DIRS);
        H.shot(x + d[0] * 3, y + d[1] * 3, x, y, '#f0e8d0', true);
        H.banner('わなだ!', '');
        H.sfx('attack');
        hurt(12, 'わなの矢', null);
    }
    endTurn(1);
}
// ぶつかったときの特別な反応。攻撃しないなら true
function bumpMob(m) {
    const d = MOBS[m.t];
    if (d.npc) { H.stopHold(); H.openTrade(m); return true; }
    if (d.pet) { const x = m.x, y = m.y; m.x = S.x; m.y = S.y; S.x = x; S.y = y; endTurn(1); return true; }
    if (m.ref) {
        const prod = PRODUCT[m.t];
        if (!prod) { H.stopHold(); H.log('なついている', ''); return true; }
        if (S.T < (m.ref.pcd || 0)) { H.stopHold(); H.log(d.n + 'は まだ何もくれない', ''); return true; }
        m.ref.pcd = S.T + 200;
        give(prod, 1); H.sfx('item'); H.float(m.x, m.y, '♥', '#ff7aa0');
        endTurn(1);
        return true;
    }
    return false;
}
// 動物にエサをやる・オオカミを手なずける。やったら true
function tryFeed(m, s) {
    const d = MOBS[m.t];
    if (m.t === 'wolf' && (s.id === 'meat' || s.id === 'steak')) {
        removeItem(s.id, 1);
        if (rnd() < .5) { const i = mobs.indexOf(m); mobs.splice(i, 1); const p = spawnMob('pet', m.x, m.y); H.float(p.x, p.y, '♥', '#ff7aa0', 1); H.sfx('unlock'); H.banner('なかまになった!', 'オオカミがついてくる'); ach('friend'); S.book.m.pet = 1; }
        else { H.float(m.x, m.y, '…', '#fff'); H.log('肉を食べたが まだなつかない', ''); }
        endTurn(1);
        return true;
    }
    if (!FEED[m.t] || !FEED[m.t].includes(s.id)) return false;
    removeItem(s.id, 1);
    H.float(m.x, m.y, '♥', '#ff7aa0', 1); H.sfx('item');
    if (!m.ref) {
        const e = { t: m.t, f: S.f, x: m.x, y: m.y, cd: 0, pcd: 0 };
        S.kept.push(e); m.ref = e;
        H.log(d.n + 'がなついた!', 'good');
    } else {
        const mate = mobs.find(q => q !== m && q.t === m.t && q.ref && Math.abs(q.x - m.x) + Math.abs(q.y - m.y) <= 3 && S.T >= (q.ref.cd || 0));
        if (mate && S.T >= (m.ref.cd || 0) && S.kept.length < 40) {
            let spot = null;
            for (const o of DIRS) { const x = m.x + o[0], y = m.y + o[1]; if (mobWalk(getT(S.f, x, y)) && !mobAt(x, y) && !(x === S.x && y === S.y)) spot = [x, y]; }
            if (spot) {
                m.ref.cd = mate.ref.cd = S.T + 240;
                const e = { t: m.t, f: S.f, x: spot[0], y: spot[1], cd: S.T + 240, pcd: 0 }, b = spawnMob(m.t, spot[0], spot[1]);
                S.kept.push(e); b.ref = e;
                H.log(d.n + 'の赤ちゃんが生まれた!', 'good'); ach('baby'); H.sfx('levelup');
            }
        } else H.log('おいしそうに 食べた', '');
    }
    endTurn(1);
    return true;
}
function interact(x, y, t) {
    const d = TILE[t];
    if (d.station) { H.stopHold(); H.openCraft(d.station, x, y); return; }
    if (t === T.BED) { H.stopHold(); H.openBed(x, y); return; }
    if (t === T.CHEST) { H.stopHold(); H.openChest(exKey(S.f, x, y)); return; }
    if (t === T.CHEST_W) { openLoot(x, y); return; }
    if (t === T.CROP_C || t === T.CROP_W) { harvest(x, y, t); return; }
    if (t === T.SWITCH_OFF || t === T.SWITCH_ON) { toggleSwitch(x, y, t); return; }
    if (d.disp) { loadDispenser(x, y); return; }
    if (t === T.SAPLING) {
        const q = S.saplings.find(a => a.f === S.f && a.x === x && a.y === y);
        H.stopHold(); H.log('若木が育っている', '');
        return;
    }
    if (t === T.MAGMA) { H.stopHold(); H.log('マグマだ!', 'warn'); return; }
    if (t === T.PIT) { H.stopHold(); H.refresh(); return; }   // 穴の方を 向くだけ
    if (d.station || t === T.BED || t === T.CHEST) { H.stopHold(); H.log('こわせないようだ', ''); return; }
    if (d.hp) { hitTile(x, y, t); return; }
    H.stopHold();
    H.log(d.n + 'は こわせない', '');
}
function hitTile(x, y, t) {
    const d = TILE[t], tier = d.tier || 0;
    let power = 1, tool = null;
    if (d.tool) {
        tool = equipped(d.tool);
        if (d.tool === 'pick' && tier > 0 && (!tool || toolStats(tool).tier < tier)) {
            let bestTier = 0; eachTool(q => { if (q.k === 'pick') bestTier = Math.max(bestTier, toolStats(q).tier); });
            H.stopHold(); H.sfx('error');
            H.log(d.n + (bestTier >= tier ? 'を掘るには 強いつるはしに持ちかえよう' : 'を掘るには もっと強いつるはしが必要'), 'warn');
            return false;
        }
        if (tool) power = toolStats(tool).mine;
    }
    const key = exKey(S.f, x, y);
    S.dmg[key] = (S.dmg[key] || 0) + power; S.dmgT[key] = S.T;
    H.chips(x, y, chipColor(t)); H.sfx('tick');
    if (tool) wear(tool, 1);
    if (S.dmg[key] >= d.hp) { delete S.dmg[key]; breakTile(x, y, t, tool); }
    pruneDmg();
    endTurn(1);
    return true;
}
function pruneDmg() { const k = Object.keys(S.dmg); if (k.length > 60) { delete S.dmg[k[0]]; delete S.dmgT[k[0]]; } }
// 最後に傷をつけてから 1日たった マスは もとの丈夫さにもどる
// 穴に 水が流れこむ: flood にある水のマスの となりの穴を 次のターンに水にする(1ターンに1マスずつ)
function floodFrom(f, x, y, ready) { (S.flood || (S.flood = [])).push([f, x, y, ready === undefined ? S.T + 1 : ready]); }   // 次のターンから 広がる
function flowWater() {
    if (!S.flood || !S.flood.length) return;
    const now = S.flood.filter(q => S.T > q[3]); S.flood = S.flood.filter(q => S.T <= q[3]);
    for (const [f, x, y] of now) {
        if (getT(f, x, y) !== T.WATER) continue;
        for (const o of DIR4) { const nx = x + o[0], ny = y + o[1]; if (getT(f, nx, ny) === T.PIT) { setT(f, nx, ny, T.WATER); floodFrom(f, nx, ny, S.T); } }
    }
}
function healDmg() {
    for (const k in S.dmg) {
        if (S.dmgT[k] === undefined) S.dmgT[k] = S.T;
        else if (S.T - S.dmgT[k] >= DAY_LEN) { delete S.dmg[k]; delete S.dmgT[k]; }
    }
}
const chipColor = t => ({ [T.TREE]: '#8a5a2c', [T.PINE]: '#6a4424', [T.ROCK]: '#999', [T.WSTONE]: '#888', [T.WDIRT]: '#7a5a3a', [T.ORE_STAR]: '#7fe8ff', [T.ORE_CU]: '#e08a4a', [T.ORE_FE]: '#d8b89a', [T.ORE_AU]: '#ffd84a', [T.ORE_N]: '#c05ab0' })[t] || '#aaa';
function breakTile(x, y, t, tool) {
    const d = TILE[t];
    const under = TILE[t].floorlike || t === T.FARM ? groundOf(S.f, x, y) : (t === T.RWALL ? T.RFLOOR : groundOf(S.f, x, y));
    setT(S.f, x, y, under);
    // 押しっぱなしなら 止めずに そのまま進んで 次を掘る
    H.sfx('garbagebreak');
    if (d.back) give(d.back, 1);
    if (t === T.WIRE_W) { const e = S.ex[exKey(S.f, x, y)]; if (e && e.base) give(TILE[T[e.base]].back, 1); }
    if (t === T.WIRE || t === T.WIRE_W) delete S.ex[exKey(S.f, x, y)];
    if (t === T.CHEST) {
        const k = exKey(S.f, x, y), c = S.ex[k];
        if (c && c.items) for (const it of c.items) { if (it.tool) putTool(it.tool); else give(it.id, it.n); }
        delete S.ex[k];
    }
    if (TILE[t].disp) { const k = exKey(S.f, x, y), c = S.ex[k]; if (c && c.arrows) give('arrow', c.arrows); delete S.ex[k]; }
    if (t === T.BED && S.bed && S.bed.x === x && S.bed.y === y) { S.bed = null; S.spawn = { f: 0, x: CENTER, y: CENTER }; H.log('寝床をこわしたので 復活地点が はじまりの場所にもどった', 'warn'); }
    const st = tool ? toolStats(tool) : null;
    giveDrops(d.drop, st && st.luck);
    if (d.buried) { H.stopHold(); openBuriedLoot(); }
    if (isCave(S.f)) foundInRock(x, y, t);
}
// 「はずす」で外す物(回路の部品と小物)。つるはしなどで こわすことはできない
const TAKE_BACK = ['switch', 'plate', 'bulb', 'rep', 'notg', 'conv', 'fconv', 'disp', 'torch', 'clamp', 'crown', 'gmush', 'carpet'];
const takeable = t => isWire(t) || t === T.LADDER_D || !!TILE[t].deco || TAKE_BACK.includes(TILE[t].back);
function takeTile(x, y, t) {
    if (t === T.LADDER_D) { takeLadder(x, y, t); return; }
    const id = isWire(t) ? 'rdust' : TILE[t].back;
    if (!S.inv.some(q => !q || (q.id === id && q.n < STACK)) && !infItem(id)) { H.sfx('error'); H.log('持ち物がいっぱいで はずせない', 'warn'); return; }   // あふれて落とさない
    const k = exKey(S.f, x, y), e = S.ex[k];
    delete S.dmg[k];
    if (TILE[t].disp && e && e.arrows) give('arrow', e.arrows);
    setT(S.f, x, y, t === T.WIRE_W && e && e.base ? T[e.base] : groundOf(S.f, x, y));
    if (t !== T.CHEST) delete S.ex[k];
    give(id, 1); H.sfx('item');
    endTurn(1);
}
// 置いた物を片づけて持ち物にもどす
function removePlaced(x, y) {
    const t = getT(S.f, x, y);
    if (!TILE[t].back) return;
    delete S.dmg[exKey(S.f, x, y)];
    H.chips(x, y, '#c8a878');
    breakTile(x, y, t, null);
    endTurn(1);
}
// 化石・晶洞・大鉱脈を 初めて掘り当てたら 知らせる
function foundInRock(x, y, t) {
    let type = null, key = null;
    if (t === T.FOSSIL) type = 'fossil';
    else if (t === T.GEM) type = 'geode';
    else if (TILE[t].key.startsWith('ORE_')) { const c = bigVein(S.f, x, y); if (c) { type = 'bigvein'; key = S.f + ':v' + c.gx + ',' + c.gy; } }
    if (!type) return;
    if (!key) key = S.f + ':' + type + Math.floor(x / 48) + ',' + Math.floor(y / 48);
    if (S.found[key]) return;
    S.found[key] = { f: S.f, x, y, type };
    S.book.p[type] = 1;
    H.sfx('unlock');
    H.banner(type === 'fossil' ? '化石だ!' : type === 'geode' ? '晶洞だ!' : '大鉱脈だ!', type === 'fossil' ? '大きな生き物の骨が 岩にうまっている' : type === 'geode' ? '水晶の中に 宝石が光っている' : TILE[t].n + 'が まとまって ねむっている');
}
function putTool(tool) {
    for (let i = 0; i < INV_SIZE; i++) if (!S.inv[i]) { S.inv[i] = { tool }; return true; }
    dropPile(S.x, S.y, [{ tool }]);
    H.log('持ち物がいっぱい! 近くに落とした', 'bad');
    return false;
}
// 落ちた荷物: 上に乗ると 持てる分だけ自動で拾う。持てない分は そのマスに残る
function pickupPile(x, y, auto) {
    const k = exKey(S.f, x, y), c = S.ex[k];
    if (!c || !c.items) { if (getT(S.f, x, y) === T.GRAVE) setT(S.f, x, y, groundOf(S.f, x, y)); return; }
    const left = [];
    let got = 0;
    for (const it of c.items) {
        if (it.tool) { const e = S.inv.findIndex(s => !s); if (e >= 0) { S.inv[e] = { tool: it.tool }; got++; } else left.push(it); }
        else { const l = addItem(it.id, it.n); if (l < it.n) got++; if (l) left.push({ id: it.id, n: l }); }
    }
    if (!got) { if (!auto) { H.stopHold(); H.log('持ち物がいっぱいで 拾えない', 'warn'); } return; }
    H.sfx('item');
    if (left.length) { c.items = left; H.log('荷物を拾った。持ちきれない分は 残っている', 'warn'); return; }
    if (TILE[getT(S.f, x, y)].belt) delete c.items; else { delete S.ex[k]; setT(S.f, x, y, groundOf(S.f, x, y)); }
    if (S.graves.some(q => q.f === S.f && q.x === x && q.y === y)) ach('retrieve');
    S.graves = S.graves.filter(q => !(q.f === S.f && q.x === x && q.y === y));
}
// おたから: 出る所(0=地上 1=地下 2=異界)の中から 1つ
const decoTier = () => S.f === 0 ? 0 : S.f === 2 ? 2 : 1;
function giveDeco(tier) {
    const id = pick(DECOS.filter(q => q[2] === tier))[0];
    give(id, 1); H.banner('おたからだ!', ITEM[id].n);
    return id;
}
const DECO_RATE = .25;   // 宝箱に おたからが入っている割合
function openBuriedLoot() {
    const table = LOOT[1];
    let total = 0; table.forEach(r => total += r[3]);
    let v = rnd() * total, r = table[0];
    for (const q of table) { v -= q[3]; if (v <= 0) { r = q; break; } }
    give(r[0], rint(r[1], r[2]));
    H.sfx('chest'); H.banner('お宝だ!', '');
    if (rnd() < DECO_RATE) giveDeco(decoTier());
    ach('buried');
}
function openLoot(x, y) {
    const tier = chestTier(S.f, x, y), table = LOOT[tier];
    const kinds = 2 + Math.floor(hash(x, y, 50) * 2);
    let total = 0; table.forEach(r => total += r[3]);
    for (let i = 0; i < kinds; i++) {
        let v = rnd() * total, r = table[0];
        for (const q of table) { v -= q[3]; if (v <= 0) { r = q; break; } }
        give(r[0], rint(r[1], r[2]));
    }
    setT(S.f, x, y, T.RFLOOR);
    H.sfx('chest');
    if (rnd() < DECO_RATE) giveDeco(decoTier());   // おたからは 場所(地上・地下・異界)で決まる
    endTurn(1);
}
function harvest(x, y, t) {
    const k = exKey(S.f, x, y), c = S.ex[k];
    if (c && S.T - c.p < CROP_TIME) { H.stopHold(); H.log('まだ育っていない', ''); return; }
    if (t === T.CROP_C) { give('carrot', rint(2, 4)); give('seed_c', rint(1, 2)); } else { give('wheat', rint(2, 4)); give('seed_w', rint(1, 2)); }
    delete S.ex[k];
    setT(S.f, x, y, T.FARM);
    ach('harvest');
    H.sfx('item');
    endTurn(1);
}
// 主人公のいる場所が かべと扉で囲まれているか。水やマグマも まものは通れないので囲いになる
const ROOM_LIMIT = 150;
function shelterInfo() {
    const seen = new Set([S.y * 1000 + S.x]), q = [[S.x, S.y]], cells = [];
    let fence = false;
    while (q.length) {
        const c = q.pop();
        cells.push(c);
        if (seen.size > ROOM_LIMIT) return { room: false, lit: litNear(S.x, S.y), cells: [] };
        for (const d of DIRS) {
            const nx = c[0] + d[0], ny = c[1] + d[1], k = ny * 1000 + nx, t = TILE[getT(S.f, nx, ny)];
            if (t.low) fence = true;
            if (seen.has(k) || t.solid || t.door || t.swim) continue;
            seen.add(k); q.push([nx, ny]);
        }
    }
    return { room: true, lit: litNear(S.x, S.y), cells, fence };
}
const REST_TURNS = 60, NIGHT_TURNS = DAY_LEN - DAY_LIGHT;
// 眠っているあいだも 本当に時間を進める。まものは歩きまわり、部屋がないと襲ってくる
function sleep(x, y) {
    S.bed = { f: S.f, x, y };
    S.spawn = { f: S.f, x: S.x, y: S.y };
    const info = shelterInfo(), night = isNight();
    if (!info.room && mobs.some(m => !MOBS[m.t].animal && Math.abs(m.x - S.x) + Math.abs(m.y - S.y) <= 7)) {
        H.sfx('error'); H.log('まものが近くて 眠れない!', 'warn'); return;
    }
    const turns = night ? DAY_LEN - dayT() : REST_TURNS, mx = maxHp();
    S.sleeping = true; S.wokeBy = null; S.nightAwake = false;
    let slept = 0;
    for (; slept < turns && !S.wokeBy && S.hp > 0; slept++) {
        endTurn(1);
        if (S.hp <= 0) break;
        if (night) { trySpawn(); trySpawn(); }
        // 暗い部屋には まものがわく
        if (!circuitMode() && info.room && !info.lit && info.cells.length >= 4 && rnd() < .015 && !mobs.some(m => !MOBS[m.t].animal && inCells(info.cells, m))) {
            const c = pick(info.cells);
            if (Math.abs(c[0] - S.x) + Math.abs(c[1] - S.y) >= 2 && !mobAt(c[0], c[1]) && TILE[getT(S.f, c[0], c[1])].ground) spawnMob(pick(['zombie', 'skeleton']), c[0], c[1]);
        }
    }
    S.sleeping = false;
    if (S.hp <= 0) return;   // 力つきた処理は die() がすませている
    S.hp = Math.min(mx, S.hp + Math.round((night ? mx : mx * .4) * slept / turns));
    S.hunger = Math.max(5, S.hunger);
    // 朝になったら 遠くのまものは帰っていく
    mobs = mobs.filter(m => m.big || MOBS[m.t].animal || Math.abs(m.x - S.x) + Math.abs(m.y - S.y) <= 9);
    if (S.wokeBy) {
        ach('midnight');
        H.sfx('hurt'); H.shake(8); H.stopHold();
        H.banner('おそわれた!', S.wokeBy + 'に起こされた');
    } else if (night) {
        H.sfx('heal');
        H.banner(dayNo() + '日目の朝', info.room && info.lit ? 'ぐっすり眠れた' : '朝まで無事だった');
        S.got.slept = 1;   // 目標は 朝まで眠れば達成(囲い・松明は問わない)
        if (info.room && info.lit) { S.got.slept_safe = 1; ach('home'); }
        if (isCave(S.f)) ach('under_home');
        if (S.f === 2) ach('nether_nap');
        if (S.f === 0 && genSurface(S.x, S.y) === T.WATER) ach('water_home');
    } else { H.sfx('heal'); H.log('少し休んだ。HPが回復した', 'good'); }
    H.floorFx(S.wokeBy ? '' : '…zzz');
    saveGame();
    H.refresh();
}
// 地上の やわらかい地面(素手かスコップで掘れる)と とれる物
const SOIL = { [T.GRASS]: 'dirt', [T.GRASS2]: 'dirt', [T.FLOWER]: 'dirt', [T.DIRT]: 'dirt', [T.SNOW]: 'dirt', [T.SAND]: 'sand' };
const SOIL_HP = 3;   // 素手は3回、スコップは1回
// 土・砂で 水や穴を うめる
function fillAt(x, y, t, id) {
    if (mobAt(x, y)) { H.log('だれかがいる', ''); return; }
    if (t !== T.WATER && t !== T.PIT) { H.log('ここでは 使えないようだ', ''); return; }
    setT(S.f, x, y, id === 'sand' ? T.SAND : T.DIRT);
    removeItem(id, 1); H.sfx('place'); endTurn(1);
}
const inCells = (cells, m) => cells.some(c => c[0] === m.x && c[1] === m.y);
// 「ほる」ボタンの中身: 前のマスに合わせて 言葉・絵・できるか を返す(tool = 絵にする道具、なければ手。ほるときは スコップがなくても スコップの絵)
function digInfo() {
    const x = S.x + S.face[0], y = S.y + S.face[1], t = getT(S.f, x, y), d = TILE[t], fm = mobAt(x, y);
    const sample = k => ({ k, a: 'stone', b: 'wood' });
    if (fm) return { l: 'こうげき', tool: equipped('sword'), ok: !(MOBS[fm.t].npc || MOBS[fm.t].pet) };
    const soil = S.f === 0 ? SOIL[t] : d.ground && S.f !== 2 && floorBelow(S.f) >= 0 && t !== T.RFLOOR && t !== T.SCORCH;
    if (soil) return { l: 'ほる', tool: equipped('shovel') || sample('shovel'), ok: !shaftBlock(floorBelow(S.f), x, y) };
    if (t === T.FARM) return { l: 'ほる', tool: equipped('shovel') || sample('shovel'), ok: true };   // 畑は 土にもどる
    if (d.station || t === T.BED || t === T.CHEST) return { l: 'こわす', tool: null, ok: false };   // 中の「片づける」で しまう
    if (d.ground || t === T.PIT || takeable(t) || t === T.LADDER_U || t === T.STAIRS_U || t === T.CAVEIN || t === T.GATE || !d.hp) return { l: 'ほる', tool: sample('shovel'), ok: false };
    if (!d.tool) return { l: 'こわす', tool: null, ok: true };
    const eq = equipped(d.tool), tier = d.tier || 0;
    if (d.tool === 'pick' && tier > 0 && (!eq || toolStats(eq).tier < tier)) return { l: 'こわす', tool: eq || sample('pick'), ok: false };
    return { l: 'こわす', tool: eq, ok: true };
}
function digFacing() {
    if (!S || S.hp <= 0) return;
    const x = S.x + S.face[0], y = S.y + S.face[1], t = getT(S.f, x, y), d = TILE[t];
    const fm = mobAt(x, y);
    if (fm) {
        if (MOBS[fm.t].npc || MOBS[fm.t].pet) { H.stopHold(); H.log(MOBS[fm.t].n + 'は なかまだ', ''); return; }
        if (fm.ref) { S.kept = S.kept.filter(e => e !== fm.ref); fm.ref = null; }
        playerAttack(fm); endTurn(1); return;
    }
    // 地上の やわらかい地面と 地下の床は 素手かスコップで掘る(地上は 土・砂、地下は 土がとれる)
    const soil = S.f === 0 ? SOIL[t] : d.ground && S.f !== 2 && floorBelow(S.f) >= 0 && t !== T.RFLOOR && t !== T.SCORCH ? 'dirt' : null;
    if (soil) {
        { const bl = shaftBlock(floorBelow(S.f), x, y); if (bl) { H.stopHold(); H.sfx('error'); H.log('ここは ほれないようだ', ''); return; } }
        const sh = equipped('shovel'), key = exKey(S.f, x, y);
        S.dmg[key] = (S.dmg[key] || 0) + (sh ? SOIL_HP : 1); S.dmgT[key] = S.T;
        H.chips(x, y, soil === 'sand' ? '#ecd9a0' : '#8a6038'); H.sfx('tick');
        if (sh) wear(sh, 1);
        if (S.dmg[key] >= SOIL_HP) {
            delete S.dmg[key];
            const wet = DIR4.some(o => getT(S.f, x + o[0], y + o[1]) === T.WATER);
            setT(S.f, x, y, wet ? T.WATER : T.PIT);
            if (wet) floodFrom(S.f, x, y);
            give(soil, 1); H.stopHold();
        }
        pruneDmg(); endTurn(1);
        return;
    }
    if (d.ground) { H.stopHold(); H.log('ここは ほれないようだ', ''); return; }   // 掘れる地面は 上で すんでいる
    if (t === T.PIT) { H.stopHold(); return; }
    if (takeable(t)) { H.stopHold(); H.log((isWire(t) ? '導線' : d.n) + 'は「はずす」で 外せる', ''); return; }
    if (t === T.LADDER_D || t === T.LADDER_U || t === T.STAIRS_U || t === T.CAVEIN || t === T.GATE) { H.stopHold(); H.log(d.n + 'は こわせない', ''); return; }
    if (d.station || t === T.BED || t === T.CHEST) { H.stopHold(); H.log('こわせないようだ', ''); return; }
    if (d.hp) { hitTile(x, y, t); return; }
    H.stopHold();
    H.log(d.n + 'は こわせない', '');
}
// 向き・形を えらびなおせる物: えらべる形の一覧と 今の番号
function turnChoices(x, y) {
    const t = getT(S.f, x, y), dk = TILE[t].key.match(/^(F?CONV|DISP|REP|NOT)_([NESW])$/);
    if (dk) return { list: 'NESW'.split('').map(c => ({ t: T[dk[1] + '_' + c] })), cur: 'NESW'.indexOf(dk[2]) };
    if (isWire(t)) return { list: WIRE_ORDER.map(w => ({ t, w })), cur: WIRE_ORDER.indexOf(wireMode(S.f, x, y)) };
    return null;
}
function applyTurn(x, y, c) {
    if (c.w) { const k = exKey(S.f, x, y); S.ex[k] = Object.assign(S.ex[k] || {}, { w: c.w }); }
    else setT(S.f, x, y, c.t);
    H.sfx('select'); endTurn(1);
}
// 持っている物と 向いている相手から、今できることを並べる。先頭が「つかう」(Z)、2番目があれば「もう1つ」(C)
const canFeed = (m, id) => (m.t === 'wolf' && (id === 'meat' || id === 'steak')) || (FEED[m.t] && FEED[m.t].includes(id));
// ボタンの役わり: [Z, C]。Z = 前の部品の「向き」か 持っている物の使い方 / C = 前の部品を「はずす」か 持っている物の 2つめの使い方
// Z に何もなければ useHint に 押したときに理由を出す行動を入れる(ボタンは うすく出る)
let useHint = null;
function useActions() {
    const { rot, take, items } = buildActions(), ok = items.filter(a => !a.no);
    const z = rot || ok[0] || null, c = take || (rot ? null : ok[1]) || null;
    useHint = z ? null : items[0] || null;
    return [z, c];
}
function buildActions() {
    const s = S.inv[S.sel];
    const x = S.x + S.face[0], y = S.y + S.face[1], t = getT(S.f, x, y), fm = mobAt(x, y);
    const dk = TILE[t].key.match(/^(F?CONV|DISP|REP|NOT)_([NESW])$/), nk = false;
    const rot = (dk || nk || isWire(t)) && !fm ? { l: '向き', run: () => H.openTurn(x, y) } : null;
    const take = takeable(t) && !fm ? { l: 'はずす', run: () => takeTile(x, y, t) } : null;
    const out = items => ({ rot, take, items });
    if (!s) return out([]);
    if (s.tool) {
        const tillOk = S.f === 0 && (t === T.GRASS || t === T.GRASS2 || t === T.FLOWER || t === T.DIRT) && !fm;
        if (s.tool.k === 'hoe') return out([{ l: 'たがやす', no: !tillOk, run: () => {
            if (S.f === 0 && (t === T.GRASS || t === T.GRASS2 || t === T.FLOWER || t === T.DIRT) && !fm) { setT(S.f, x, y, T.FARM); wear(s.tool, 1); H.sfx('tick'); endTurn(1); return; }
            H.log('ここは たがやせないようだ', '');
        } }]);
        if (s.tool.k === 'bow') return out([{ l: 'うつ', run: () => fireBow(s.tool) }]);
        return out([]);   // ほかの道具は 体当たりや「こわす」で 使われる
    }
    const it = ITEM[s.id], list = [];
    if (it.use === 'rod') {
        if (fishing) return out([{ l: 'ひく', run: reelIn }]);
        return out([{ l: 'つる', no: !TILE[t].swim, run: () => { if (TILE[t].swim) castLine(x, y); else H.log('ここでは つれないようだ', ''); } }]);
    }
    if (fm && canFeed(fm, s.id)) list.push({ l: 'あげる', run: () => tryFeed(fm, s) });
    const edible = it.food !== undefined || it.heal !== undefined;
    const eatA = { l: it.food !== undefined ? '食べる' : '飲む', no: it.food !== undefined && S.hunger >= 100 && !it.heal, run: () => eat(s.id, it) };
    const treeOk = it.plant && S.f === 0 && !fm && (t === T.GRASS || t === T.GRASS2 || t === T.FLOWER || t === T.DIRT || t === T.SNOW);
    const plantA = { l: '植える', run: () => {
        setT(S.f, x, y, T.SAPLING);
        S.ex[exKey(S.f, x, y)] = { p: S.T };
        S.saplings.push({ f: S.f, x, y, p: S.T, to: it.plant === 1 ? 'TREE' : it.plant });
        removeItem(s.id, 1); H.sfx('place'); endTurn(1);
    } };
    // おなかいっぱいなら 植えるほうを先に
    if (edible && treeOk && eatA.no) list.push(plantA, eatA);
    else { if (edible) list.push(eatA); if (treeOk) list.push(plantA); }
    if (it.seed) list.push({ l: '植える', no: t !== T.FARM || !!fm, run: () => {
        if (t !== T.FARM) { H.log('ここには 植えられないようだ', ''); return; }
        sowAt(x, y, s.id);
    } });
    if (it.use === 'rdust') list.push({ l: '置く', no: !((/^wall_/.test(TILE[t].back || '') && !fm) || placeOk({ place: 'WIRE' }, x, y, t)), run: () => {
        // 置いたかべ(木・石・金属・魔樹)なら 赤いかべにする。こわすと 粉とかべの両方がもどる
        // 導線は 主人公が向いている方向に のびる(たて/よこ)。まわりの導線と つながる
        const axis = S.face[0] ? 'H' : 'V';
        if (/^wall_/.test(TILE[t].back || '') && !fm) {
            setT(S.f, x, y, T.WIRE_W); S.ex[exKey(S.f, x, y)] = { base: TILE[t].key }; layWire(x, y, axis);
            removeItem(s.id, 1); H.sfx('place'); endTurn(1); return;
        }
        placeItem(s.id, { place: 'WIRE' }, x, y, t, () => layWire(x, y, axis));
    } });
    if (it.place) list.push({ l: '置く', no: !placeOk(it, x, y, t), run: () => placeItem(s.id, it, x, y, t) });
    if (it.use === 'fill') list.push({ l: 'うめる', no: !((t === T.WATER || t === T.PIT) && !fm), run: () => fillAt(x, y, t, s.id) });
    if (it.use === 'ladder') list.push({ l: 'かける', no: !!fm || !(S.f === 0 ? t === T.PIT : isCave(S.f) && (t === T.PIT || TILE[t].ground)), run: () => useLadder(x, y, t, s.id) });
    if (it.use === 'gate') list.push({ l: '建てる', no: S.f !== 0 || !TILE[t].ground || !!fm, run: () => placeGate(x, y, t, s.id) });
    if (it.use === 'home') list.push({ l: 'もどる', run: () => {
        removeItem(s.id, 1); H.sfx('unlock'); H.log('羽にみちびかれて もどった', 'good');
        const sp = S.spawn;
        changeFloor(sp.f, sp.x, sp.y); freeSpot(); endTurn(5);
    } });
    if (it.use === 'shard') list.push({ l: 'ひらく', run: () => { removeItem(s.id, 1); revealAround(110); H.sfx('unlock'); H.log('地図のかけらで 周りが地図に のった', 'good'); endTurn(1); } });
    return out(list);
}
function useSelected(which) {
    if (!S || S.hp <= 0) return;
    const s = S.inv[S.sel];
    const act = useActions()[which || 0];
    if (act) { act.run(); return; }
    if (which) return;   // C は 出ていないときは 何もしない
    // Z でできることがない: 理由を出す(置けない・水がない など)
    if (useHint) useHint.run();
    else if (!s) H.log('何も持っていない', '');
    else if (s.tool) H.log(toolName(s.tool) + 'は ぶつかったり「' + digInfo().l + '」で 使われる', '');
    else H.log(ITEM[s.id].n + 'は 材料だ', '');
}
// 弓: 向いている方向へ矢を飛ばす。かべで止まる
function fireBow(bow) {
    if (!bow) { H.log('弓を持っていない', ''); return; }
    const arrow = count('arrow_fe') > 0 ? 'arrow_fe' : 'arrow';
    if (count(arrow) < 1) { H.sfx('error'); H.log('矢がない', 'warn'); return; }
    const st = toolStats(bow), dx = S.face[0], dy = S.face[1];
    let x = S.x, y = S.y, hit = null;
    for (let i = 1; i <= st.range; i++) {
        const nx = S.x + dx * i, ny = S.y + dy * i;
        const q = TILE[getT(S.f, nx, ny)];
        if (q.solid && !q.low) break;
        x = nx; y = ny;
        hit = mobAt(nx, ny);
        if (hit) break;
    }
    removeItem(arrow, 1); wear(bow, 1);
    H.shot(S.x, S.y, x, y, '#f0e8d0', true); H.sfx('attack');
    if (hit && !MOBS[hit.t].npc && !MOBS[hit.t].pet) {
        const d = MOBS[hit.t];
        let dmg = Math.max(1, Math.round((2 + st.atk + (arrow === 'arrow_fe' ? 5 : 0) - (d.def || 0)) * (.9 + rnd() * .2)));
        if (st.burn) dmg += 5;
        lastAttack = 'bow'; attackTool = bow;
        hit.bowDist = Math.abs(hit.x - S.x) + Math.abs(hit.y - S.y);
        damageMob(hit, dmg);
        lastAttack = null; attackTool = null;
    }
    endTurn(1);
}
// 釣り: 投げると待つあいだターンが進む。「!」が出たら すぐ引く
let fishing = null;
function castLine(x, y) {
    fishing = { x, y, biteAt: S.T + rint(4, 14), bit: false };
    H.sfx('select');
    endTurn(1);
}
function fishTick() {
    if (!fishing) return;
    endTurn(1);
    if (!fishing) return;
    if (!fishing.bit && S.T >= fishing.biteAt) {
        fishing.bit = true; fishing.endAt = S.T + 3;
        H.float(fishing.x, fishing.y, '!', '#ff3a1c', 1); H.sfx('warn');
    } else if (fishing.bit && S.T > fishing.endAt) {
        fishing = null; H.log('にげられた…', '');
    }
}
function reelIn() {
    const f = fishing;
    fishing = null;
    if (!f.bit) { H.log('まだ何もかかっていない', ''); return; }
    const r = rnd();
    H.sfx('item');
    if (r < .06) { const tb = LOOT[isCave(S.f) ? 1 : 0], q = pick(tb); if (rnd() < DECO_RATE) giveDeco(decoTier()); else { give(q[0], rint(q[1], q[2])); H.banner('お宝を釣った!', ITEM[q[0]].n); } H.sfx('chest'); ach('fish_treasure'); }
    else if (r < .08) { give(isCave(S.f) ? 'cfish' : 'kfish', 1); H.banner(isCave(S.f) ? '光る魚だ!' : '金の魚だ!', ''); H.sfx('levelup'); ach('gold_fish'); }
    else if (r < .22) give('bone', 1);
    else give(isCave(S.f) ? (rnd() < .1 ? 'cfish' : 'fish') : 'fish', 1);
    endTurn(1);
}
function eat(id, it) {
    if (it.food !== undefined && S.hunger >= 100 && !it.heal) { H.log('おなかいっぱいだ', ''); return; }
    removeItem(id, 1);
    if (it.food) S.hunger = Math.min(100, S.hunger + it.food);
    if (it.heal) S.hp = Math.min(maxHp(), S.hp + it.heal);
    if (it.ret) addItem(it.ret, 1);
    H.sfx(it.heal ? 'heal' : 'item');
    if (it.raw && !circuitMode() && rnd() < .3) { S.hp -= 5; H.log('生肉で おなかをこわした…', 'bad'); ach('bad_meat'); if (S.hp <= 0) { die('食あたり'); return; } }
    endTurn(1);
}
function sowAt(x, y, id) {
    setT(S.f, x, y, T[ITEM[id].seed]); S.ex[exKey(S.f, x, y)] = { p: S.T };
    removeItem(id, 1); H.sfx('place'); endTurn(1);
}
// 「つかう」を押したまま歩いたとき: 足もとと 前の畑に 種をまく
function sowWalking() {
    const s = S.inv[S.sel], it = s && ITEM[s.id];
    if (!it || !it.seed) return;
    for (const p of [[S.x, S.y], [S.x + S.face[0], S.y + S.face[1]]]) {
        if (S.inv[S.sel] !== s || !s.n) return;
        if (getT(S.f, p[0], p[1]) === T.FARM && !mobAt(p[0], p[1])) sowAt(p[0], p[1], s.id);
    }
}
// dir: 向いている方向に置く物 / axis: 向いている方向の たて・よこ で置く物
const placeTile = it => it.dir ? it.dir + '_' + 'NESW'[dirIndex(S.face)] : it.axis ? it.axis + '_' + (S.face[0] ? 'H' : 'V') : it.place;
function placeOk(it, x, y, t) {
    const bridge = TILE[T[placeTile(it)]].floorlike && (t === T.WATER || t === T.PIT);
    return (TILE[t].ground || TILE[t].floorlike || bridge) && !mobAt(x, y) && !(x === S.x && y === S.y);
}
function placeItem(id, it, x, y, t, after) {
    const place = placeTile(it);
    if (!placeOk(it, x, y, t)) { H.sfx('error'); H.log('そこには 置けない', ''); H.stopHold(); return; }
    setT(S.f, x, y, T[place]); delete S.dmg['b' + exKey(S.f, x, y)];
    removeItem(id, 1);
    S.got['placed_' + id] = 1;
    if (id === 'crown') ach('crown');
    if (after) after();
    if (!isWire(getT(S.f, x, y)) && armLinked(x - 1, y, 1)) linkDevice(x, y);   // 回路の部品なら となりの導線と つなぐ
    H.sfx('place'); H.chips(x, y, '#c8a878');
    endTurn(1);
}
function useLadder(x, y, t, id) {
    if (S.f === 0) {
        if (t !== T.PIT) { H.log('ここには かけられないようだ', ''); return; }
        const bl = shaftBlock(floorBelow(0), x, y); if (bl) { H.sfx('error'); H.log('ここには かけられないようだ', ''); return; }
        setT(0, x, y, T.LADDER_D);
    } else if (isCave(S.f)) {
        // 穴なら下の階へ、床なら上の階へ
        const to = t === T.PIT ? floorBelow(S.f) : floorAbove(S.f), bl = TILE[t].ground || t === T.PIT ? shaftBlock(to, x, y) : null;
        if (bl) { H.sfx('error'); H.log('ここには かけられないようだ', ''); return; }
        if (t === T.PIT) setT(S.f, x, y, T.LADDER_D);
        else if (!TILE[t].ground) { H.log('ここには かけられないようだ', ''); return; }
        else setT(S.f, x, y, T.LADDER_U);
    } else { H.log('ここでは はしごは使えない', ''); return; }
    removeItem(id, 1); H.sfx('place');
    endTurn(1);
}
// はしごをはずす: はしごが1こもどり、穴はうまる(上と下の階の はしごも 消える)
function takeLadder(x, y, t) {
    if (!S.inv.some(q => !q || (q.id === 'ladder' && q.n < STACK))) { H.sfx('error'); H.log('持ち物がいっぱいで はずせない', 'warn'); return; }
    const other = floorBelow(S.f), pair = T.LADDER_U;   // はずせるのは 下りはしごだけ(上りは 帰れなくなるので はずせない)
    if (other >= 0 && getT(other, x, y) === pair) setT(other, x, y, groundOf(other, x, y));
    setT(S.f, x, y, groundOf(S.f, x, y));
    give('ladder', 1); H.sfx('item');
    endTurn(1);
}
function placeGate(x, y, t, id) {
    if (S.f !== 0) { H.log('ここには 建てられないようだ', ''); return; }
    if (!TILE[t].ground) { H.log('ここには 建てられないようだ', ''); return; }
    setT(0, x, y, T.GATE);
    removeItem(id, 1);
    S.gate = { x, y }; S.got.placed_gate = 1;
    ach('gate');
    H.sfx('fanfare'); H.banner('門が開いた', '乗ると 異世界へ行ける');
    endTurn(1);
}

// ---------- クラフト ----------
function nearStations() {
    const r = { bench: false, furnace: false };
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const st = TILE[getT(S.f, S.x + dx, S.y + dy)].station; if (st) r[st] = true; }
    return r;
}
// station: 開いている設備('bench' など)。持ち物画面から作るときは null(作業台だけ作れる)
function craftRecipe(rec, station) {
    if (station !== undefined && (rec.st || null) !== station) return 'ここでは つくれない';
    const near = nearStations();
    if (rec.st && !near[rec.st]) return STATION_NAME[rec.st] + 'のそばで つくれる';
    if (!hasAll(rec.need)) return '材料がたりない';
    if (!fitsAfter(rec.need, rec.out, rec.n || 1)) return '持ち物がいっぱいで つくれない';
    for (const k in rec.need) removeItem(k, rec.need[k]);
    give(rec.out, rec.n || 1);
    if (rec.out === 'feast') ach('feast');
    H.sfx(rec.st === 'furnace' ? 'clear' : 'buy');
    endTurn(rec.t || 1);
    return null;
}
function partNeed(kind, a, b) {
    const need = {};
    const add = (id, n) => { if (id && n) need[id] = (need[id] || 0) + n; };
    if (kind === 'armor') { add(BODIES[a].item, BODIES[a].cost); add(LININGS[b].item, LININGS[b].cost); }
    else { const hb = kind === 'bow' ? STRINGS : HANDLES; add(HEADS[a].item, HEADS[a].cost); add(hb[b].item, hb[b].cost); }
    return need;
}
function craftTool(kind, a, b, station, gem) {
    const near = nearStations(), st = kind === 'armor' ? BODIES[a].st : HEADS[a].st;
    if (station !== undefined && st !== station) return STATION_NAME[st] + 'で つくれる';
    if (!near[st]) return STATION_NAME[st] + 'のそばで つくれる';
    const need = Object.assign({}, partNeed(kind, a, b));
    if (gem) need.gem = (need.gem || 0) + 1;
    if (!hasAll(need)) return '材料がたりない';
    if (!fitsAfter(need, null)) return '持ち物がいっぱいで つくれない';
    for (const k in need) removeItem(k, need[k]);
    const tool = { k: kind, a, b, d: 0 };
    if (gem) { tool.gem = 1; ach('gem_tool'); }
    tool.d = toolStats(tool).dur;
    putTool(tool);
    S.got['tool_' + kind] = 1;
    if (kind === 'pick' && a === 'gold') ach('gold_pick');
    if (kind !== 'armor' && kind !== 'bow' && a === 'bone' && b === 'bone') ach('bone_bone');
    if (kind === 'sword' && a === 'demon' && b === 'nwood') ach('masterpiece');
    { const has = {}; eachTool(t => { has[t.k] = 1; }); if (Object.keys(TOOL_KINDS).every(k => has[k])) ach('full_gear'); }
    if (kind === 'pick') S.got.pick_tier = Math.max(S.got.pick_tier || 0, toolStats(tool).tier);
    H.sfx('equip'); H.log(toolName(tool) + 'ができた!', 'good');
    endTurn(2);
    return null;
}

// ---------- 道さがし(タップ移動) ----------
function pathTo(tx, ty) {
    if (tx === S.x && ty === S.y) return [];
    const q = [[S.x, S.y]], from = new Map(), key = (x, y) => y * 1000 + x;
    from.set(key(S.x, S.y), null);
    let found = null, n = 0;
    while (q.length && n++ < 1600) {
        const c = q.shift();
        if (Math.abs(c[0] - tx) + Math.abs(c[1] - ty) === (TILE[getT(S.f, tx, ty)].solid ? 1 : 0)) { found = c; break; }
        for (const d of DIRS) {
            const nx = c[0] + d[0], ny = c[1] + d[1], k = key(nx, ny);
            if (from.has(k) || Math.abs(nx - S.x) > 30 || Math.abs(ny - S.y) > 30) continue;
            const t = getT(S.f, nx, ny);
            if (TILE[t].solid || TILE[t].swim || mobAt(nx, ny) || t === T.LADDER_D || t === T.LADDER_U || t === T.STAIRS_U || t === T.CAVEIN || t === T.GATE) { if (!(nx === tx && ny === ty && !TILE[t].solid)) continue; }
            from.set(k, c); q.push([nx, ny]);
        }
    }
    if (!found) return null;
    const out = [];
    let c = found;
    while (from.get(key(c[0], c[1]))) { const p = from.get(key(c[0], c[1])); out.unshift([c[0] - p[0], c[1] - p[1]]); c = p; }
    if (TILE[getT(S.f, tx, ty)].solid) out.push([tx - found[0], ty - found[1]]);
    return out;
}
