// しょうすう(数直線の「リボン」)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
// ルールは元のしょうすうと同じ: 手札の小数(0.1〜2.0)をリボンにのせて たしていき、ちょうど5.0をめざす。
//   5.0をこえると、こえた分だけHPがへる(ちょうど5.0なら+1000)。1.0〜4.0にぴったり止まるとボーナス。
//   リボンの上のイベント(てき・たから・ダイヤ・おかし)に止まると、その効果。ダイヤでチェンジ。全7ステージ。
// ステージ制RUN(★で HP 3.0/2.0/1.0)の画面は braves-run.js が受け持つ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };

// 画面の寸法(ゲームエリア 720x720)
const TX0 = 40, TW = 624;                  // リボンの 0.0 の位置と、0.0〜5.0 の長さ
const BAR_Y = 240, BAR_H = 60;             // リボンの帯
const HAND_W = 92, HAND_H = 128, HAND_GAP = 16, HAND_Y = 566;
const DROP = { x: 16, y: 76, w: 688, h: 464 };     // カードをここまで持ってくると のせたことになる
const NUMCARD = { x: 210, y: 398, w: 300, h: 112 };
const SNACK_N = ALL_SNACKS.length;

Object.assign(state, {
    hp: 3, maxHp: 3, gems: 0, snacks: [], availSnacks: [], ribbon: 0, disp: 0, target: 0, anim: false,
    events: [], lastEq: '', phase: 'IDLE', tutorial: false, snackBonus: 0, hpBonus: 0, endBase: 0, pendingJoker: -1, jokerVal: 1.0
});

function floatAdd(a, b) { return Math.round((a + b) * 10) / 10; }
function floatSub(a, b) { return Math.round((a - b) * 10) / 10; }
function randFloat(min, max) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmt(v) { return v.toFixed(1); }
function vx(v) { return TX0 + (Math.max(0, Math.min(5, v)) / 5) * TW; }     // 数 → 横の位置

// ---- ログ ----
function addLog(html) {
    const el = document.getElementById('battle-log-entries');
    if (!el) return;
    Array.from(el.children).forEach(c => c.classList.remove('latest'));
    const div = document.createElement('div');
    div.className = 'lg latest';
    div.innerHTML = emo(html);
    el.appendChild(div);
    while (el.children.length > 15) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
}

// ---- ステージ制RUNとの受けわたし ----
function stageClearTime(st) { return 0; }
let loopActive = false;
function startLoop() { if (loopActive) return; loopActive = true; requestAnimationFrame(gameLoop); }

function updateStageLabel() {
    const n = Math.min(state.stage, STAGE_COUNT);
    document.getElementById('disp-difficulty-label').textContent = `${n} / ${STAGE_COUNT}`;
    document.getElementById('sp-run').textContent = T('run_' + RUN_LIST[runSelIdx].id + '_name');
    document.getElementById('sp-diff').textContent = '★'.repeat(state.star) + ' ' + T(['diff_easy', 'diff_normal', 'diff_hard'][state.star - 1]);
    let h = '';
    for (let k = 1; k <= STAGE_COUNT; k++) h += `<div class="rt ${k < n ? 'done' : (k === n ? 'now' : '')}${k === STAGE_COUNT ? ' last' : ''}" style="--rc:${STAGE_THEMES[k - 1].c}"><b class="no">${k}</b><span class="nm">${stageName(k)}</span></div>`;
    document.getElementById('sp-route').innerHTML = h;
}
function startRun(star) {
    if (!starUnlocked(star)) return;
    state.star = star;
    state.difficulty = starKey(star);
    CONFIG = Object.assign({}, STAR_PRESETS[star]);
    STAGE_COUNT = CONFIG.maxStage;
    initGame();
    state.runMode = true;
    startStage(1);
}
function startStage(n) {
    state.stage = n;
    initStage(n);
    if (state.tutorial) { state.inputLocked = false; return; }   // チュートリアルのときはステージ演出を出さない
    state.inputLocked = true;
    showStageIntro(n, () => { state.inputLocked = false; });
}

function closeDcPopups() {
    ['dc-change', 'dc-joker'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    state.pendingJoker = -1;
}
function backToTitle() {
    state.screen = 'TITLE';
    hideAllOverlays();
    closeDcPopups();
    ui.title.classList.remove('hidden');
    ui.btnToTitle.classList.add('hidden');
    ui.rightPanelContent.classList.add('invisible');
    clearDcLayer();
    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0; state.stage = 1; state.runMode = false; state.stageStartScore = 0; state.stageScores = []; state.tutorial = false;
    state.maxHp = CONFIG.maxHp; state.hp = CONFIG.maxHp; state.gems = 0; state.snacks = []; state.availSnacks = [...ALL_SNACKS];
    state.cards = [null, null, null, null, null]; state.dragInfo = null; state.events = [];
    state.ribbon = 0; state.disp = 0; state.target = 0; state.anim = false; state.lastEq = '';
    state.inputLocked = false; state.phase = 'IDLE'; state.snackBonus = 0; state.hpBonus = 0; state.endBase = 0;
    msg.active = false; msgQueue.length = 0;
    state.width = 720; state.height = 720; canvas.width = 720; canvas.height = 720;
    hideAllOverlays();
    closeDcPopups();
    clearDcLayer();
    const log = document.getElementById('battle-log-entries'); if (log) log.innerHTML = '';
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    startLoop();
}

// ---- 手札 ----
function handX(i) { return (state.width - (5 * HAND_W + 4 * HAND_GAP)) / 2 + i * (HAND_W + HAND_GAP); }
function makeCard(i) {
    const j = Math.random() < 0.02;          // 2%でジョーカー
    const x = handX(i);
    return { value: j ? 0 : randFloat(0.1, 2.0), isJoker: j, sealed: 0, x: x, y: HAND_Y, w: HAND_W, h: HAND_H, targetX: x, targetY: HAND_Y, baseY: HAND_Y, isDragging: false };
}

// ---- イベント(リボンの上にならぶ) ----
function makeEvent(zone, pool) {
    const r = Math.random();
    const hasSnack = pool.length > 0;
    let type;
    if (hasSnack) { type = r < 0.2 ? 'enemy' : r < 0.4 ? 'gold' : r < 0.6 ? 'gem' : 'snack'; }
    else { type = r < 0.333 ? 'enemy' : r < 0.666 ? 'gold' : 'gem'; }
    let sub = '', icon = '';
    if (type === 'gold') { if (Math.random() < 0.1) { sub = 'mega_gold'; icon = '💰'; } else { sub = 'normal_gold'; icon = '🪙'; } }
    else if (type === 'enemy') { if (Math.random() < 0.1) { sub = 'dragon'; icon = '🐲'; } else { sub = 'normal_enemy'; icon = '👾'; } }
    else if (type === 'gem') { icon = '💎'; }
    else { const k = getRandomInt(0, pool.length - 1); icon = pool[k]; pool.splice(k, 1); }
    const wInt = Math.round((type === 'enemy' ? 0.8 : type === 'snack' ? 0.2 : 0.4) * 10);
    const sInt = zone * 10, maxStart = zone * 10 + 9 - wInt;
    const st = getRandomInt(sInt, maxStart);
    return { type: type, sub: sub, icon: icon, start: st / 10, end: (st + wInt) / 10, triggered: false, cleared: false };
}

function initStage(n) {
    state.ribbon = 0; state.disp = 0; state.target = 0; state.anim = false;
    state.stageStartScore = state.score;
    state.lastEq = '';
    state.phase = 'PLAY';
    msg.active = false; msgQueue.length = 0;
    if (n === 1 || !state.cards[0]) {
        state.cards = [];
        for (let i = 0; i < 5; i++) state.cards.push(makeCard(i));
    } else {
        state.cards.forEach((c, i) => { c.targetX = handX(i); c.targetY = HAND_Y; });
    }
    const pool = [...state.availSnacks];
    state.events = [];
    for (let z = 0; z < 5; z++) state.events.push(makeEvent(z, pool));
    clearDcLayer();
    document.getElementById('game-area').style.setProperty('--sc', STAGE_THEMES[Math.min(n, STAGE_COUNT) - 1].c);
    dcInit();
    updateStageLabel();
    updateUI();
    addLog(T('stage_log', { n: n, name: stageName(n) }));
}

// ============================================================
//  ダイヤ(手札チェンジ・場チェンジ)とジョーカー
// ============================================================
function openChange() {
    if (!canPlay() || state.gems <= 0) return;
    document.getElementById('dc-change').classList.remove('hidden');
}
function useGemForHand() {
    if (state.gems <= 0) return;
    state.gems--;
    state.cards.forEach(c => {
        if (c.sealed === 0) {
            const j = Math.random() < 0.02;
            c.value = j ? 0 : randFloat(0.1, 2.0); c.isJoker = j;
            burst(c.x + c.w / 2, c.y + c.h / 2, '#81D4FA', 10);
        }
    });
    addLog(T('dc_log_change_hand'));
    updateUI();
}
function useGemForField() {
    if (state.gems <= 0) return;
    state.gems--;
    const cur = state.disp;
    const from = cur === 0 ? 0 : Math.floor(cur) + 1;      // いま いるところより先のイベントを作りなおす
    const kept = state.events.filter(ev => Math.floor(ev.start) < from);
    const pool = state.availSnacks.filter(s => !kept.some(ev => ev.icon === s));
    for (let z = from; z < 5; z++) kept.push(makeEvent(z, pool));
    state.events = kept;
    burst(vx(2.5), BAR_Y + BAR_H / 2, '#A5D6A7', 30);
    addLog(T('dc_log_change_field'));
    updateUI();
}

function openJoker(idx) {
    state.pendingJoker = idx; state.jokerVal = 1.0;
    document.getElementById('dc-joker-val').textContent = '1.0';
    document.getElementById('dc-joker').classList.remove('hidden');
}
function changeJoker(d) {
    state.jokerVal = Math.min(2.0, Math.max(0.1, Math.round((state.jokerVal + d) * 10) / 10));
    document.getElementById('dc-joker-val').textContent = fmt(state.jokerVal);
}
function decideJoker() {
    document.getElementById('dc-joker').classList.add('hidden');
    const idx = state.pendingJoker; state.pendingJoker = -1;
    if (idx >= 0) applyCardValue(idx, state.jokerVal);
}
function cancelJoker() {
    document.getElementById('dc-joker').classList.add('hidden');
    state.pendingJoker = -1;
}

// ============================================================
//  カードをのせる → リボンがのびる → イベント → ステージクリア
// ============================================================
function processDrop(idx) {
    const c = state.cards[idx];
    c.targetX = handX(idx); c.targetY = HAND_Y;
    if (c.isJoker) { openJoker(idx); return; }
    applyCardValue(idx, c.value);
}
function applyCardValue(idx, value) {
    const old = state.ribbon;
    const nv = floatAdd(old, value);
    state.lastEq = `${fmt(old)} + ${fmt(value)} = ${fmt(nv)}`;
    state.ribbon = nv; state.target = nv; state.anim = true;
    state.cards.forEach(c => { if (c.sealed > 0) c.sealed--; });
    state.cards[idx] = makeCard(idx);
    fxText(vx(Math.min(nv, 5)), BAR_Y - 6, `+${fmt(value)}`, '#7ef0ff', 34);
    addLog(`${state.lastEq}`);
    updateUI();
}

function checkEvents() {
    const v = state.ribbon;
    let hit = null;
    state.events.forEach(ev => { if (!ev.triggered && v >= ev.start && v <= ev.end) { ev.triggered = true; hit = ev; } });
    if (hit) triggerEvent(hit);
    if (v % 1 === 0 && v > 0 && v <= 4) {
        const bonus = v * 200;
        state.score += bonus;
        burst(vx(v), BAR_Y + BAR_H / 2, '#FFD700', 28);
        showGameMessage(T('msg_just_bonus', { n: v, pts: bonus }));
        addLog(T('dc_log_just', { n: v, pts: bonus }));
    }
    updateUI();
    if (msgQueue.length === 0 && !msg.active) checkStageClear();
}

function sealCards(n) {
    const unsealed = state.cards.filter(c => c.sealed === 0);
    const k = Math.min(n, unsealed.length);
    for (let i = 0; i < k; i++) {
        const j = getRandomInt(0, unsealed.length - 1);
        unsealed[j].sealed = 5; unsealed.splice(j, 1);
    }
    return k;
}
function triggerEvent(ev) {
    const px = vx(Math.min(state.ribbon, 5)), py = BAR_Y + BAR_H / 2;
    if (ev.type === 'gold') {
        const pts = ev.sub === 'mega_gold' ? 1500 : 500;
        state.score += pts;
        burst(px, py, '#FFF59D', 26);
        showGameMessage(T('msg_gold_found', { icon: ev.icon, pts: pts }), () => { ev.cleared = true; });
        addLog(T('dc_log_gold', { icon: ev.icon, pts: pts }));
    } else if (ev.type === 'gem') {
        state.gems++;
        burst(px, py, '#81D4FA', 26);
        showGameMessage(T('msg_gem_found', { icon: ev.icon }), () => { ev.cleared = true; });
        addLog(T('dc_log_gem'));
    } else if (ev.type === 'snack') {
        state.snacks.push(ev.icon);
        state.availSnacks = state.availSnacks.filter(s => s !== ev.icon);
        burst(px, py, '#F48FB1', 26);
        const m = T('msg_snack_found', { icon: ev.icon });
        if (state.snacks.length === SNACK_N) {
            showGameMessage(m);
            showGameMessage(T('msg_snack_complete', { list: ALL_SNACKS.join('') }), () => { ev.cleared = true; });
        } else showGameMessage(m, () => { ev.cleared = true; });
        addLog(T('dc_log_snack', { icon: ev.icon }));
    } else if (ev.type === 'enemy') {
        burst(px, py, '#E57373', 30);
        const dragon = ev.sub === 'dragon';
        const sealed = sealCards(dragon ? 2 : 1);
        const all = state.cards.every(c => c.sealed > 0);
        if (sealed === 0) { showGameMessage(T('msg_enemy_no_seal'), () => { ev.cleared = true; }); }
        else if (all) {
            state.phase = 'OVER_WAIT';
            showGameMessage(T(dragon ? 'msg_dragon_all_sealed' : 'msg_enemy_all_sealed'), () => { ev.cleared = true; finishRun(false); });
        } else if (dragon) showGameMessage(T('msg_dragon_sealed', { n: sealed }), () => { ev.cleared = true; });
        else showGameMessage(T('msg_enemy_sealed'), () => { ev.cleared = true; });
        addLog(T(dragon ? 'dc_log_dragon' : 'dc_log_enemy'));
    }
}

function checkStageClear() {
    if (state.phase !== 'PLAY') return;
    const v = state.ribbon;
    if (v < 5.0) return;
    if (v === 5.0) {
        state.phase = 'CLEAR_WAIT';
        state.score += 1000;
        burst(vx(5), BAR_Y + BAR_H / 2, '#FFD700', 40);
        showGameMessage(T('msg_just_5'), onStageDone);
        addLog(T('dc_log_just5'));
    } else {
        const dmg = floatSub(v, 5.0);
        state.hp = floatSub(state.hp, dmg);
        updateUI();
        if (state.hp <= 0) {
            state.phase = 'OVER_WAIT';
            showGameMessage(T('msg_hp_zero', { dmg: fmt(dmg) }), () => finishRun(false));
        } else {
            state.phase = 'CLEAR_WAIT';
            showGameMessage(T('msg_over5', { dmg: fmt(dmg) }), onStageDone);
        }
        addLog(T('dc_log_over', { dmg: fmt(dmg) }));
    }
}
function onStageDone() {
    const gain = state.score - state.stageStartScore;
    state.stageScores[state.stage - 1] = gain;
    if (state.stage >= CONFIG.maxStage) { finishRun(true); return; }
    state.inputLocked = true;
    showStageClear(state.stage, gain);
}

// ---- RUNの結果 ----
function finishRun(cleared) {
    if (state.screen !== 'PLAYING') return;
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    state.phase = 'END';
    ui.btnToTitle.classList.add('hidden');
    if (state.stageScores[state.stage - 1] === undefined) state.stageScores[state.stage - 1] = state.score - state.stageStartScore;
    const n = state.snacks.length;
    state.endBase = state.score;
    state.snackBonus = n * n * 100;
    state.hpBonus = Math.floor(10000 * Math.max(0, state.hp) / state.maxHp);
    const total = state.endBase + state.snackBonus + state.hpBonus;
    state.score = total;
    updateUI();
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, total, state.stage, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, total, isNewRecord, 0, 0);
}

// ---- ゲーム内メッセージ(タップで次へ) ----
const msg = { active: false, lines: [], cb: null };
const msgQueue = [];
function showGameMessage(text, cb) {
    msgQueue.push({ text: text, cb: cb || null });
    if (!msg.active) advanceMessage();
}
function advanceMessage() {
    if (msgQueue.length > 0) {
        const m = msgQueue.shift();
        msg.active = true; msg.lines = m.text.split('\n'); msg.cb = m.cb;
    } else {
        msg.active = false;
        checkStageClear();
    }
}
function tapMessage() {
    if (!msg.active) return false;
    const cb = msg.cb;
    msg.active = false;
    if (cb) cb();
    advanceMessage();
    return true;
}

// ============================================================
//  画面の描画(DOM)
// ============================================================
const DC = { ready: false };
const dcScore = document.getElementById('disp-total-score');

function dcInit() {
    const layer = document.getElementById('bl');
    if (DC.ready && DC.eq && layer.contains(DC.eq)) return;
    let h = `<div class="dc-eq ph"><span></span></div><div class="dc-bar"></div><div class="dc-fill"></div><div class="dc-fillpv"></div>`;
    for (let i = 0; i <= 50; i++) {
        const x = TX0 + (i / 50) * TW;
        const cls = i % 10 === 0 ? 'dt-i' : (i % 5 === 0 ? 'dt-h' : 'dt-m');
        h += `<div class="dt ${cls}" style="left:${x}px"></div>`;
    }
    for (let i = 0; i <= 5; i++) {
        const x = TX0 + (i / 5) * TW;
        h += `<div class="dn" style="left:${x}px">${i}.0</div><div class="dg-tag" data-i="${i}" style="left:${x}px"></div>`;
        if (i < 5) h += `<div class="dn half" style="left:${x + TW / 10}px">${i}.5</div>`;
    }
    h += `<div class="dc-flag" style="left:${TX0 + TW}px"><i class="pole"></i><i class="cloth"></i></div>`;
    h += `<div id="dc-evs"></div>`;
    h += `<div class="dc-ghost" style="display:none"><div class="pw-in">${pawnHTML()}</div></div>`;
    h += `<div class="dc-pawn"><div class="pw-in">${pawnHTML()}</div></div>`;
    h += `<div class="dc-card" style="left:${NUMCARD.x}px;top:${NUMCARD.y}px;width:${NUMCARD.w}px;height:${NUMCARD.h}px"><small></small><b>0.0</b></div>`;
    h += `<div class="dc-hbox"></div><div class="bl-hint" style="display:none"></div><div class="dc-msg" style="display:none"><div class="ml"></div><small></small></div>`;
    layer.innerHTML = h;
    DC.eq = layer.querySelector('.dc-eq'); DC.eqSpan = DC.eq.querySelector('span');
    DC.fill = layer.querySelector('.dc-fill'); DC.fillpv = layer.querySelector('.dc-fillpv');
    DC.pawn = layer.querySelector('.dc-pawn'); DC.ghost = layer.querySelector('.dc-ghost');
    DC.card = layer.querySelector('.dc-card'); DC.cardNum = DC.card.querySelector('b'); DC.cardLb = DC.card.querySelector('small');
    DC.evs = document.getElementById('dc-evs');
    DC.hint = layer.querySelector('.bl-hint'); DC.msg = layer.querySelector('.dc-msg');
    DC.hbox = layer.querySelector('.dc-hbox');
    const hx = handX(0) - 16;
    DC.hbox.style.cssText = `left:${hx}px;top:${HAND_Y - 14}px;width:${5 * HAND_W + 4 * HAND_GAP + 32}px;height:${HAND_H + 28}px`;
    DC.tags = Array.from(layer.querySelectorAll('.dg-tag'));
    DC.evEls = new Map(); DC.hand = [];
    DC.ready = true;
}
function clearDcLayer() {
    const layer = document.getElementById('bl');
    if (layer) layer.innerHTML = '';
    DC.ready = false;
    const area = document.getElementById('game-area');
    if (area) area.classList.remove('danger', 'flash', 'hurt');
}

function fxText(x, y, text, color, size) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fx-t';
    el.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:${size || 34}px`;
    el.textContent = text;
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}
function burst(x, y, color, n) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    for (let i = 0; i < n; i++) {
        const el = document.createElement('i');
        const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
        el.className = 'dc-pt';
        el.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px`;
        el.addEventListener('animationend', () => el.remove());
        layer.appendChild(el);
    }
}

// イベント1つぶんの絵(ゾーンの色帯・絵文字・「1.0~1.4」の札)
function evGeom(ev) {
    const sX = TX0 + ((ev.start - 0.05) / 5) * TW, eX = TX0 + ((ev.end + 0.05) / 5) * TW;
    return { sX: sX, eX: eX, cx: sX + (eX - sX) / 2 };
}
function buildEvent(ev) {
    const el = document.createElement('div');
    el.className = 'dc-ev ' + ev.type;
    const g = evGeom(ev);
    const big = ev.icon === '💰' || ev.icon === '🐲';
    ev._big = big; ev._cx = g.cx;
    el.innerHTML = `<div class="zn" style="left:${g.sX}px;top:${BAR_Y}px;width:${g.eX - g.sX}px;height:${BAR_H}px"></div><i class="ln"></i><div class="ic${big ? ' big' : ''}">${ev.icon}</div><div class="rg">${fmt(ev.start)}~${fmt(ev.end)}</div>`;
    return el;
}
function placeEvent(ev, el) {
    const cx = ev._cx, row = ev._row;
    const labelTop = BAR_Y - 28 - row * 76;
    const size = ev._big ? 66 : 50;
    el.querySelector('.rg').style.cssText = `left:${cx}px;top:${labelTop}px`;
    el.querySelector('.ic').style.cssText = `left:${cx}px;top:${labelTop - 4 - size}px;font-size:${ev._big ? 52 : 38}px;width:${size}px;height:${size}px;line-height:${size}px;margin-left:${-size / 2}px`;
    const ln = el.querySelector('.ln');
    ln.style.cssText = row ? `left:${cx}px;top:${labelTop + 22}px;height:${BAR_Y - labelTop - 22}px` : 'display:none';
}

function overDrop(c) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    return cx >= DROP.x && cx <= DROP.x + DROP.w && cy >= DROP.y && cy <= DROP.y + DROP.h;
}

function renderDc() {
    dcInit();
    // けいさんしき
    const eq = state.lastEq || T('dc_eq_placeholder');
    if (DC.eqSpan._t !== eq) { DC.eqSpan._t = eq; DC.eqSpan.textContent = eq; DC.eq.classList.toggle('ph', !state.lastEq); }
    // 目もりの下の ことば(スタート・ボーナス)
    DC.tags.forEach(el => {
        const i = +el.dataset.i;
        const t = i === 0 ? T('dc_start') : i === 5 ? T('dc_goal') : `+${i * 200}`;
        if (el._t !== t) { el._t = t; el.textContent = t; el.classList.toggle('st', i === 0); el.classList.toggle('gl', i === 5); }
    });
    // ドラッグ中の よそく
    const drag = state.dragInfo ? state.cards[state.dragInfo.index] : null;
    let hint = null, pv = null;
    const dropping = !!(drag && overDrop(drag));
    if (dropping && !drag.isJoker) {
        const nv = floatAdd(state.ribbon, drag.value);
        pv = nv;
        hint = { cls: nv > 5 ? 'trash' : (nv % 1 === 0 ? 'hit' : ''), text: `${fmt(state.ribbon)} + ${fmt(drag.value)} = ${fmt(nv)}` };
    }
    document.getElementById('bl').classList.toggle('dropping', dropping);
    // リボンののび・こま
    const d = state.disp;
    if (DC.fill._d !== d) {
        DC.fill._d = d;
        const x = vx(d);
        DC.fill.style.width = (x - (TX0 - 8)) + 'px';
        DC.pawn.style.left = x + 'px';
        DC.card.classList.toggle('over', d > 5);
    }
    const num = fmt(d);
    if (DC.cardNum._t !== num) { DC.cardNum._t = num; DC.cardNum.textContent = num; }
    const lb = T('dc_now_number');
    if (DC.cardLb._t !== lb) { DC.cardLb._t = lb; DC.cardLb.textContent = lb; }
    if (pv !== null) {
        const x0 = vx(state.ribbon), x1 = vx(pv);
        DC.fillpv.style.cssText = `display:block;left:${x0}px;width:${Math.max(0, x1 - x0)}px`;
        DC.ghost.style.cssText = `display:block;left:${x1}px`;
    } else { DC.fillpv.style.display = 'none'; DC.ghost.style.display = 'none'; }
    // イベント(ならびがきゅうくつなときは2だんにずらす)
    let prev = null;
    const alive = new Set();
    state.events.forEach(ev => {
        ev._cx = evGeom(ev).cx;
        ev._row = (prev && ev._cx - prev._cx < 92 && prev._row === 0) ? 1 : 0;
        prev = ev;
        alive.add(ev);
        let el = DC.evEls.get(ev);
        if (!el) {
            el = buildEvent(ev);
            DC.evEls.set(ev, el);
            DC.evs.appendChild(el);
            placeEvent(ev, el);
        } else if (el._row !== ev._row) { placeEvent(ev, el); }
        el._row = ev._row;
        el.classList.toggle('hit', ev.triggered && !ev.cleared);
        if (ev.cleared && !el._gone) { el._gone = true; el.classList.add('gone'); setTimeout(() => el.remove(), 500); }
    });
    DC.evEls.forEach((el, ev) => { if (!alive.has(ev)) { el.remove(); DC.evEls.delete(ev); } });
    // 手札
    for (let i = 0; i < 5; i++) {
        const c = state.cards[i];
        let el = DC.hand[i];
        if (!c) { if (el) { el.remove(); DC.hand[i] = null; } continue; }
        if (!el || el._card !== c) {
            if (el) el.remove();
            el = document.createElement('div');
            el.addEventListener('animationend', () => { el._popping = false; el.classList.remove('pop'); });
            el._card = c; DC.hand[i] = el;
            el.style.width = c.w + 'px'; el.style.height = c.h + 'px';
            el.innerHTML = `<div class="nm"></div><div class="seal"><b></b><span></span></div>`;
            document.getElementById('bl').appendChild(el);
            el._popping = true; el.classList.add('pop');
        }
        const tier = c.isJoker ? 'jk' : (c.value <= 0.5 ? 't1' : c.value <= 1.0 ? 't2' : c.value <= 1.5 ? 't3' : 't4');
        const sig = tier + '|' + c.value + '|' + c.sealed;
        if (el._sig !== sig) {
            el._sig = sig;
            el.querySelector('.nm').textContent = c.isJoker ? '🃏' : fmt(c.value);
            el.querySelector('.seal b').textContent = T('dc_sealed');
            el.querySelector('.seal span').textContent = T('dc_turns_left', { n: c.sealed });
        }
        if (!c.isDragging) { c.x += (c.targetX - c.x) * 0.2; c.y += (c.targetY - c.y) * 0.2; }
        const cls = 'hc fh ' + tier + (c.sealed > 0 ? ' sealed' : '') + (c.isDragging ? ' dragging' : '') + (el._popping ? ' pop' : '');
        if (el._cls !== cls) { el._cls = cls; el.className = cls; }
        el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }
    // 吹き出し
    if (hint && drag) {
        const hx = Math.max(110, Math.min(state.width - 110, drag.x + drag.w / 2));
        const hy = Math.max(60, drag.y - 12);
        DC.hint.style.display = '';
        DC.hint.style.left = hx + 'px'; DC.hint.style.top = hy + 'px';
        if (DC.hint._t !== hint.text) { DC.hint._t = hint.text; DC.hint.textContent = hint.text; }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (DC.hint.className !== hc) DC.hint.className = hc;
    } else if (DC.hint.style.display !== 'none') DC.hint.style.display = 'none';
    // メッセージ
    if (msg.active) {
        const key = msg.lines.join('|') + '|' + currentLang;
        if (DC.msg._k !== key) {
            DC.msg._k = key;
            DC.msg.querySelector('.ml').innerHTML = msg.lines.map(l => `<div>${l}</div>`).join('');
            DC.msg.querySelector('small').textContent = T('dc_tap_next');
            DC.msg.classList.remove('in'); void DC.msg.offsetWidth; DC.msg.classList.add('in');
        }
        DC.msg.style.display = '';
    } else if (DC.msg.style.display !== 'none') { DC.msg.style.display = 'none'; DC.msg._k = ''; }
    // HPがすくないときの赤いふち
    const area = document.getElementById('game-area');
    area.classList.toggle('danger', state.screen === 'PLAYING' && state.hp > 0 && state.hp / state.maxHp <= 0.34);
}

function updateUI() {
    const hpTx = document.getElementById('disp-hp');
    if (hpTx) {
        hpTx.textContent = `${fmt(Math.max(0, state.hp))} / ${fmt(state.maxHp)}`;
        const pct = Math.max(0, state.hp / state.maxHp);
        const fl = document.getElementById('hp-fill');
        fl.style.width = (pct * 100) + '%';
        fl.className = pct > 0.5 ? '' : pct > 0.3 ? 'mid' : 'low';
    }
    document.getElementById('disp-gems').textContent = state.gems;
    document.getElementById('btn-gem').classList.toggle('off', state.gems <= 0);
    if (dcScore._v !== state.score) {
        const first = dcScore._v === undefined;
        dcScore._v = state.score;
        dcScore.textContent = state.score;
        if (!first && state.score > 0) { dcScore.classList.remove('bump'); void dcScore.offsetWidth; dcScore.classList.add('bump'); }
    }
    document.getElementById('disp-snack-n').textContent = `${state.snacks.length} / ${SNACK_N}`;
    const grid = document.getElementById('snack-grid');
    if (grid.children.length !== SNACK_N) grid.innerHTML = ALL_SNACKS.map(s => `<span>${s}</span>`).join('');
    Array.from(grid.children).forEach((sp, i) => {
        const on = state.snacks.includes(ALL_SNACKS[i]);
        if (sp.classList.contains('on') !== on) { sp.classList.toggle('on', on); if (on) { sp.classList.remove('get'); void sp.offsetWidth; sp.classList.add('get'); } }
    });
}
function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }
    if (state.anim) {
        const diff = state.target - state.disp;
        if (diff > 0.005) state.disp += diff * 0.1;
        else { state.disp = state.target; state.anim = false; checkEvents(); }
    }
    renderDc();
    requestAnimationFrame(gameLoop);
}

// ============================================================
//  入力(カードをドラッグしてリボンにのせる)
// ============================================================
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e;
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    if (isMobileRotated) return { x: y * (canvas.height / rect.width), y: canvas.height - x * (canvas.width / rect.height) };
    return { x: x * (canvas.width / rect.width), y: y * (canvas.height / rect.height) };
}
function canPlay() { return state.screen === 'PLAYING' && state.phase === 'PLAY' && !state.inputLocked && !state.anim && !msg.active && state.pendingJoker < 0; }
function onDown(e) {
    if (state.screen === 'PLAYING' && msg.active) { tapMessage(); return; }
    if (!canPlay()) return;
    const pos = getEventPos(e);
    for (let i = 0; i < state.cards.length; i++) {
        const c = state.cards[i];
        if (c && c.sealed === 0 && pos.x >= c.x && pos.x <= c.x + c.w && pos.y >= c.y && pos.y <= c.y + c.h) {
            state.dragInfo = { index: i, offsetX: pos.x - c.x, offsetY: pos.y - c.y };
            c.isDragging = true;
            break;
        }
    }
}
function onMove(e) {
    if (!state.dragInfo) return;
    const pos = getEventPos(e);
    const c = state.cards[state.dragInfo.index];
    c.x = pos.x - state.dragInfo.offsetX;
    c.y = pos.y - state.dragInfo.offsetY;
}
function onUp(e) {
    if (!state.dragInfo) return;
    const idx = state.dragInfo.index, c = state.cards[idx];
    c.isDragging = false;
    state.dragInfo = null;
    if (overDrop(c) && canPlay()) processDrop(idx);
    else { c.targetX = handX(idx); c.targetY = HAND_Y; }
}
canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(e); }, { passive: false });
window.addEventListener('keydown', (e) => { if (state.screen === 'PLAYING' && msg.active) { e.preventDefault(); tapMessage(); } });

// ダイヤ・ジョーカーのボタン
bindBtn(document.getElementById('btn-gem'), openChange);
bindBtn(document.getElementById('dc-ch-hand'), () => { document.getElementById('dc-change').classList.add('hidden'); useGemForHand(); });
bindBtn(document.getElementById('dc-ch-field'), () => { document.getElementById('dc-change').classList.add('hidden'); useGemForField(); });
bindBtn(document.getElementById('dc-ch-cancel'), () => document.getElementById('dc-change').classList.add('hidden'));
bindBtn(document.getElementById('dc-j-minus'), () => changeJoker(-0.1));
bindBtn(document.getElementById('dc-j-plus'), () => changeJoker(0.1));
bindBtn(document.getElementById('dc-j-ok'), decideJoker);
bindBtn(document.getElementById('dc-j-cancel'), cancelJoker);
