// トレジャークラフト2: 赤い石の回路。画面に依存しない(H.* で知らせる)
// スイッチ・感圧板(信号のもと) → 導線(赤い石の粉) → 電球・動く床・矢の発射台(装置)
'use strict';

const WIRE_MAX = 32;      // 導線が信号を運べる長さ
const CIRCUIT_R = 30;     // 主人公のまわり この範囲の回路だけ動かす
const DIR4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // 北・東・南・西(置くときの向きの番号)
const dirIndex = d => DIR4.findIndex(o => o[0] === d[0] && o[1] === d[1]);
const ckey = (x, y) => y * 1000 + x;
// on: 信号が来ている装置と押されている感圧板 / wires: 信号が通っている導線
let power = { on: new Set(), wires: new Set(), f: -1, x: 0, y: 0 };

const plateDown = (x, y) => (S.x === x && S.y === y) || !!mobAt(x, y);
function computePower() {
    const on = new Set(), wires = new Set(), f = S.f;
    for (let y = S.y - CIRCUIT_R; y <= S.y + CIRCUIT_R; y++) for (let x = S.x - CIRCUIT_R; x <= S.x + CIRCUIT_R; x++) {
        const t = getT(f, x, y);
        if (t !== T.SWITCH_ON && !(t === T.PLATE && plateDown(x, y))) continue;
        on.add(ckey(x, y));
        // 信号のもとから 導線をたどる。導線に となりあう装置に届く
        const seen = new Set([ckey(x, y)]), q = [[x, y, 0]];
        while (q.length) {
            const [cx, cy, dist] = q.shift();
            for (const o of DIR4) {
                const nx = cx + o[0], ny = cy + o[1], k = ckey(nx, ny);
                if (seen.has(k)) continue;
                seen.add(k);
                const nt = getT(f, nx, ny);
                if (nt === T.WIRE || nt === T.WIRE_W) { wires.add(k); if (dist + 1 < WIRE_MAX) q.push([nx, ny, dist + 1]); }
                else if (TILE[nt].belt) { on.add(k); if (dist + 1 < WIRE_MAX) q.push([nx, ny, dist + 1]); }   // 動く床は となりの動く床へ 信号をつなぐ
                else if (TILE[nt].dev) on.add(k);
            }
        }
    }
    return { on, wires, f, x: S.x, y: S.y };
}
const powered = (x, y) => power.f === S.f && power.on.has(ckey(x, y));
const wireLit = (x, y) => power.f === S.f && power.wires.has(ckey(x, y));

// 毎ターン: 信号を計算し、発射台(信号が来た瞬間)と動く床を動かす
function circuitTick() {
    const prev = power;
    power = computePower();
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
// 信号を計算し直すだけ(スイッチを切りかえた直後や 階を移った直後)
function refreshPower() { power = computePower(); }

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
        if (m) { m.x = x; m.y = y; } else if (x !== S.x || y !== S.y) { S.x = x; S.y = y; H.stopHold(); const e = S.ex[exKey(S.f, x, y)]; if (getT(S.f, x, y) === T.GRAVE || (e && e.items)) pickupPile(x, y, true); }
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
    H.log('矢の発射台(中に ' + (c.arrows || 0) + '本)。矢を持ってぶつかると 入れられる', '');
}
function toggleSwitch(x, y, t) {
    setT(S.f, x, y, t === T.SWITCH_ON ? T.SWITCH_OFF : T.SWITCH_ON);
    H.stopHold(); H.sfx('toggle');
    endTurn(1);
}
