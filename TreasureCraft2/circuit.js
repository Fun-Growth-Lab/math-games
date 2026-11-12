// トレジャークラフト2: 赤い石の回路。画面に依存しない(H.* で知らせる)
// 信号のもと(スイッチ・感圧板) → 導線(向きつき) → 電球・動く床・矢の発射台
// 信号の強さは 16 から 1マスごとに 1 へり、1ターンに 1マス進む(リピーター・NOT素子も 1マスぶん)。リピーターは強さを 16 にもどして一方通行、NOT素子は反対にする
'use strict';

const SIG_MAX = 16;       // 信号がとどく長さ
const SIG_SPEED = 1;      // 1ターンに進むマス
const CIRCUIT_R = 30;     // 主人公のまわり この範囲の回路だけ動かす
const DIR4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // 北・東・南・西(置くときの向きの番号)
const dirIndex = d => DIR4.findIndex(o => o[0] === d[0] && o[1] === d[1]);
const opp = a => (a + 2) % 4;
const ckey = (x, y) => y * 1000 + x;
const plateDown = (x, y) => (S.x === x && S.y === y) || !!mobAt(x, y);

// ---------- 導線の向き ----------
// V=たて(北南) H=よこ(東西) P=十字(4方向つながる) X=交差(たてと よこが べつべつ)
const WIRE_CH = { V: [[0, 2]], H: [[1, 3]], P: [[0, 1, 2, 3]], X: [[0, 2], [1, 3]], NE: [[0, 1]], ES: [[1, 2]], SW: [[2, 3]], WN: [[3, 0]] };
const WIRE_ORDER = ['V', 'H', 'P', 'X', 'WN', 'NE', 'SW', 'ES'];   // えらぶ画面の ならび
// 腕 p と q だけを持つ形(たて・よこ・L字)
const wireOf = (p, q) => ['V', 'H', 'NE', 'ES', 'SW', 'WN'].find(m => WIRE_CH[m][0].includes(p) && WIRE_CH[m][0].includes(q));
const isWire = t => t === T.WIRE || t === T.WIRE_W;
function wireMode(f, x, y) { const e = S.ex[exKey(f, x, y)]; return (e && e.w) || 'P'; }
// (x,y)の導線で dir 方向に腕がある 通り道の番号(なければ -1)
function chanAt(x, y, dir) {
    if (!isWire(getT(S.f, x, y))) return -1;
    const ch = WIRE_CH[wireMode(S.f, x, y)];
    for (let i = 0; i < ch.length; i++) if (ch[i].includes(dir)) return i;
    return -1;
}
// (x,y)の a 方向の腕の先に 何かが つながっているか
function armLinked(x, y, a) {
    const nx = x + DIR4[a][0], ny = y + DIR4[a][1], t = getT(S.f, nx, ny), d = TILE[t];
    if (isWire(t)) return chanAt(nx, ny, opp(a)) >= 0;
    return !!(d.rep || d.notg || d.dev || t === T.SWITCH_OFF || t === T.SWITCH_ON || t === T.PLATE);
}
// 導線(x,y)に a 方向の腕を足す: ほかに つながっている腕が 1本なら L字(まっすぐなら たて・よこ)、0本なら a へ まっすぐ、2本以上なら 十字
function addArm(x, y, a) {
    const e = S.ex[exKey(S.f, x, y)];
    if (!e || !e.w || e.w === 'P' || e.w === 'X') return;
    const arms = WIRE_CH[e.w][0];
    if (arms.includes(a)) return;
    const linked = arms.filter(r => armLinked(x, y, r));
    e.w = linked.length === 1 ? wireOf(linked[0], a) : linked.length === 0 ? wireOf(a, opp(a)) : 'P';
}
// 導線を置いたとき: まわりの導線とつなぐ(平行な導線は つながない)
function connectWire(x, y) {
    const me = S.ex[exKey(S.f, x, y)];
    for (let a = 0; a < 4; a++) {
        const nx = x + DIR4[a][0], ny = y + DIR4[a][1];
        if (!isWire(getT(S.f, nx, ny)) || wireMode(S.f, nx, ny) === 'X') continue;
        const mine = WIRE_CH[me.w].some(c => c.includes(a)), theirs = chanAt(nx, ny, opp(a)) >= 0;
        if (mine && !theirs) addArm(nx, ny, opp(a));
        else if (!mine && theirs) addArm(x, y, a);
    }
}
function layWire(x, y, axis) {
    const k = exKey(S.f, x, y);
    S.ex[k] = Object.assign(S.ex[k] || {}, { w: axis });
    connectWire(x, y);
}
// ---------- 信号 ----------
// power: on=信号が来ている装置 / ch=導線の通り道ごとの強さ(キー = マス*2+番号) / rep=リピーターの出力 / not=NOT素子のはしごとの出力
let power = { on: new Set(), ch: new Map(), rep: new Map(), not: new Map(), f: -1, x: 0, y: 0 };
const repDir = t => TILE[t].rep ? TILE[t].rep - 1 : -1;               // リピーターの 出る向き
const notAxis = t => TILE[t].notg || null;                             // 'V' か 'H'
const notEnds = ax => ax === 'V' ? [0, 2] : [1, 3];
const srcOn = (x, y) => { const t = getT(S.f, x, y); return t === T.SWITCH_ON || (t === T.PLATE && plateDown(x, y)); };
// (nx,ny)にある素子が (nx,ny)から見て dir 方向へ 信号を出しているか(導線以外)
function emits(P, nx, ny, dir) {
    if (srcOn(nx, ny)) return true;
    const t = getT(S.f, nx, ny), k = ckey(nx, ny);
    if (repDir(t) === dir) return !!P.rep.get(k);
    const ax = notAxis(t);
    if (ax && notEnds(ax).includes(dir)) { const s = P.not.get(k); return s ? !!s[dir] : false; }
    return false;
}
// 範囲の中の 導線・リピーター・NOT・装置を集める
function scanCircuit() {
    const wires = [], reps = [], nots = [], devs = [];
    for (let y = S.y - CIRCUIT_R; y <= S.y + CIRCUIT_R; y++) for (let x = S.x - CIRCUIT_R; x <= S.x + CIRCUIT_R; x++) {
        const t = getT(S.f, x, y), d = TILE[t];
        if (isWire(t)) wires.push([x, y, WIRE_CH[wireMode(S.f, x, y)]]);
        else if (d.rep) reps.push([x, y, d.rep - 1]);
        else if (d.notg) nots.push([x, y, d.notg]);
        else if (d.dev) devs.push([x, y]);
    }
    return { wires, reps, nots, devs };
}
// 1ターン分すすめる。prev の状態から 信号を SIG_SPEED マスぶん 広げる(へらす)
function stepPower(prev) {
    const same = prev.f === S.f;
    // ch = いちばん強い信号 / ch2 = 出どころが ちがう 2番目に強い信号(NOT素子が 自分の出した信号を 入力とまちがえないため)
    const P = { on: new Set(), ch: same ? prev.ch : new Map(), ch2: same && prev.ch2 ? prev.ch2 : new Map(), rep: same ? prev.rep : new Map(), not: same ? prev.not : new Map(), f: S.f, x: S.x, y: S.y };
    const sc = scanCircuit();
    // (nx,ny)から dir 方向へ 信号が入ってくるか(導線か素子)。skip = この NOT素子が自分で出した信号は数えない
    const feeds = (nx, ny, dir, skip) => {
        const c = chanAt(nx, ny, dir);
        if (c >= 0) { const k = ckey(nx, ny) * 2 + c, q1 = P.ch.get(k), q2 = P.ch2.get(k); return !!(q1 && q1[1] !== skip) || !!(q2 && q2[1] !== skip); }
        return emits(P, nx, ny, dir);
    };
    // 導線: となりの導線の強さ-1 と 素子からの 16 の 大きいほう。リピーター・NOT素子も 同じ1ステップで 1マスぶん進む
    for (let step = 0; step < SIG_SPEED; step++) {
        const nch = new Map(), nch2 = new Map();
        for (const [x, y, chs] of sc.wires) chs.forEach((arms, ci) => {
            // 信号は [強さ, 出どころ, もらった向き]。自分から もらった となりからは 受け取らない
            // (信号が切れたとき 導線どうしで 支え合わず、消える知らせも 1ステップ1マスで進む)
            const cand = [];
            for (const a of arms) {
                const nx = x + DIR4[a][0], ny = y + DIR4[a][1], nc = chanAt(nx, ny, opp(a));
                if (nc >= 0) { const k = ckey(nx, ny) * 2 + nc; for (const q of [P.ch.get(k), P.ch2.get(k)]) if (q && q[0] > 1 && q[2] !== opp(a)) cand.push([q[0] - 1, q[1], a]); }
                else if (emits(P, nx, ny, opp(a))) cand.push([SIG_MAX, TILE[getT(S.f, nx, ny)].notg ? 'n' + ckey(nx, ny) : 's' + ckey(nx, ny), a]);
            }
            if (!cand.length) return;
            cand.sort((p, q) => q[0] - p[0]);
            const key = ckey(x, y) * 2 + ci, b1 = cand[0], b2 = cand.find(q => q[1] !== b1[1]);
            nch.set(key, b1); if (b2) nch2.set(key, b2);
        });
        // リピーター: 後ろに信号が来ていれば 前へ 強さ16で出す(前から来た信号は 通さない)
        const nrep = new Map(), nnot = new Map();
        for (const [x, y, d] of sc.reps) nrep.set(ckey(x, y), feeds(x - DIR4[d][0], y - DIR4[d][1], d, null));
        // NOT素子: 片方のはしに信号が来たら 反対のはしは OFF。どちらにも来ていなければ 両はしに ON
        for (const [x, y, ax] of sc.nots) {
            const [e1, e2] = notEnds(ax), me = 'n' + ckey(x, y);
            const in1 = feeds(x + DIR4[e1][0], y + DIR4[e1][1], opp(e1), me), in2 = feeds(x + DIR4[e2][0], y + DIR4[e2][1], opp(e2), me);
            nnot.set(ckey(x, y), { [e1]: !in2, [e2]: !in1 });
        }
        P.ch = nch; P.ch2 = nch2; P.rep = nrep; P.not = nnot;
    }
    // 装置: となりから 信号が向かってきていれば ON
    for (const [x, y] of sc.devs) {
        for (let a = 0; a < 4; a++) if (feeds(x + DIR4[a][0], y + DIR4[a][1], opp(a), null)) { P.on.add(ckey(x, y)); break; }
    }
    // 動く床は となりの動く床へ 信号をつなぐ
    const q = [...P.on].filter(k => TILE[getT(S.f, k % 1000, Math.floor(k / 1000))].belt);
    while (q.length) {
        const k = q.shift(), x = k % 1000, y = Math.floor(k / 1000);
        for (const o of DIR4) { const nk = ckey(x + o[0], y + o[1]); if (!P.on.has(nk) && TILE[getT(S.f, x + o[0], y + o[1])].belt) { P.on.add(nk); q.push(nk); } }
    }
    for (let y = S.y - CIRCUIT_R; y <= S.y + CIRCUIT_R; y++) for (let x = S.x - CIRCUIT_R; x <= S.x + CIRCUIT_R; x++) if (getT(S.f, x, y) === T.PLATE && plateDown(x, y)) P.on.add(ckey(x, y));
    return P;
}
const powered = (x, y) => power.f === S.f && power.on.has(ckey(x, y));
// 導線の 通り道ごとの強さ(0なら 信号なし)
const wireLevel = (x, y, ci) => { if (power.f !== S.f) return 0; const q = power.ch.get(ckey(x, y) * 2 + (ci || 0)); return q ? q[0] : 0; };
const wireLit = (x, y) => wireLevel(x, y, 0) > 0 || wireLevel(x, y, 1) > 0;
const repLit = (x, y) => power.f === S.f && !!power.rep.get(ckey(x, y));
const notLit = (x, y, e) => { if (power.f !== S.f) return false; const s = power.not.get(ckey(x, y)); return !!(s && s[e]); };

// 毎ターン: 信号を進め、発射台(信号が来た瞬間)と動く床を動かす
function circuitTick() {
    const prev = power;
    power = stepPower(prev);
    if (prev.f === power.f) {
        for (const k of power.on) {
            if (prev.on.has(k)) continue;
            const x = k % 1000, y = Math.floor(k / 1000);
            // 前のターンに範囲の外だった物は 撃たない(近づいただけで撃つのをふせぐ)
            if (Math.max(Math.abs(x - prev.x), Math.abs(y - prev.y)) > CIRCUIT_R) continue;
            const d = TILE[getT(S.f, x, y)];
            if (d.disp) fireDispenser(x, y, DIR4[d.disp - 1]);
        }
    }
    moveOnBelts();
}
// 階を移ったとき: 信号を いったん空にする(次のターンから広がる)
function refreshPower() { if (power.f !== S.f) power = { on: new Set(), ch: new Map(), rep: new Map(), not: new Map(), f: S.f, x: S.x, y: S.y }; }

// ---------- 動く床 ----------
function beltAt(x, y) { const d = TILE[getT(S.f, x, y)]; return d.belt && powered(x, y) ? d.belt : null; }
function canRide(x, y, isPlayer) {
    const t = getT(S.f, x, y), d = TILE[t];
    if (d.solid || d.door || d.trap || d.swim) return false;
    if (t === T.LADDER_D || t === T.LADDER_U || t === T.STAIRS_U || t === T.GATE || t === T.CAVEIN || t === T.PIT || t === T.MAGMA) return false;
    if (mobAt(x, y)) return false;
    if (!isPlayer && x === S.x && y === S.y) return false;
    return true;
}
// 動く床で運ばれても 押しっぱなしの移動は 止めない(H.stopHold を呼ばない)
let playerVia = null;   // 主人公が 動く床で運ばれる前に いたマス(絵は ここを通ってから 動く)
function moveOnBelts() {
    const riders = [];
    if (beltAt(S.x, S.y)) riders.push(null);
    for (const m of mobs) if (!m.big && beltAt(m.x, m.y)) riders.push(m);
    for (const m of riders) {
        let x = m ? m.x : S.x, y = m ? m.y : S.y;
        const b = beltAt(x, y);
        if (!b) continue;
        // 高速の床は 同じ向きに2マス進む
        for (let i = 0; i < b.n; i++) {
            const nx = x + DIR4[b.d][0], ny = y + DIR4[b.d][1];
            if (!canRide(nx, ny, !m)) break;
            x = nx; y = ny;
        }
        if (m) { if (x !== m.x || y !== m.y) m.via = [m.x, m.y]; m.x = x; m.y = y; } else if (x !== S.x || y !== S.y) { playerVia = [S.x, S.y]; S.x = x; S.y = y; H.clearPath(); const e = S.ex[exKey(S.f, x, y)]; if (getT(S.f, x, y) === T.GRAVE || (e && e.items)) pickupPile(x, y, true); }
    }
    moveItemsOnBelts();
}
// 動く床にのった荷物を運ぶ。床の外に出たら その場に荷物として落ち、荷物があれば まとまる
function moveItemsOnBelts() {
    const list = [];
    for (const k in S.ex) { const e = S.ex[k]; if (e && e.items && e.f === S.f && TILE[getT(S.f, e.x, e.y)].belt && beltAt(e.x, e.y)) list.push(e); }
    for (const e of list) {
        if (!e.items) continue;
        const b = beltAt(e.x, e.y);
        let x = e.x, y = e.y;
        for (let i = 0; i < b.n; i++) {
            const nx = x + DIR4[b.d][0], ny = y + DIR4[b.d][1], t = getT(S.f, nx, ny), d = TILE[t];
            if (!(d.belt || d.ground || t === T.GRAVE) || mobAt(nx, ny)) break;
            x = nx; y = ny;
            if (!d.belt) break;   // 床からおりたら止まる
        }
        if (x === e.x && y === e.y) continue;
        const items = e.items; delete e.items;
        if (x === S.x && y === S.y) { if (TILE[getT(S.f, x, y)].belt) addToBelt(x, y, items); else putPileAt(x, y, items); pickupPile(x, y, true); continue; }
        if (!putPileAt(x, y, items)) e.items = items;
    }
}

// ---------- 矢の発射台 ----------
const DISP_RANGE = 6, DISP_DMG = 8;
function fireDispenser(x, y, dir) {
    const c = S.ex[exKey(S.f, x, y)];
    if (!c || !c.arrows) return;
    c.arrows--;
    let ex = x, ey = y, hit = null, me = false;
    for (let i = 1; i <= DISP_RANGE; i++) {
        const nx = x + dir[0] * i, ny = y + dir[1] * i, q = TILE[getT(S.f, nx, ny)];
        if (q.solid && !q.low) break;
        ex = nx; ey = ny;
        if (nx === S.x && ny === S.y) { me = true; break; }
        hit = mobAt(nx, ny);
        if (hit) break;
    }
    H.shot(x, y, ex, ey, '#f0e8d0', true); H.sfx('attack');
    if (me) hurt(DISP_DMG, '矢の発射台', null);
    else if (hit && !MOBS[hit.t].npc && !MOBS[hit.t].pet) damageMob(hit, Math.max(1, DISP_DMG - (MOBS[hit.t].def || 0)));
}
// ぶつかると 持っている矢を入れる
function loadDispenser(x, y) {
    const k = exKey(S.f, x, y), c = S.ex[k] || (S.ex[k] = { arrows: 0 });
    const n = Math.min(count('arrow'), 64 - (c.arrows || 0));
    H.stopHold();
    if (n > 0) { removeItem('arrow', n); c.arrows = (c.arrows || 0) + n; H.sfx('item'); H.log('矢を ' + n + '本 入れた(中に ' + c.arrows + '本)', 'good'); endTurn(1); return; }
    H.log('矢の発射台(中に ' + (c.arrows || 0) + '本)', '');
}
function toggleSwitch(x, y, t) {
    setT(S.f, x, y, t === T.SWITCH_ON ? T.SWITCH_OFF : T.SWITCH_ON);
    H.stopHold(); H.sfx('toggle');
    endTurn(1);
}
