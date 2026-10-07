// わりざん(ロボのしわけ)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
// ルールは元のわりざんと同じ: 手札(わる数 2〜10)を、場のロボ(わられる数)にかさねて わりざん。
// 商と余りの 1〜9 のパネル(3×3)にHITさせ、ノルマの数だけ HITさせればラウンドクリア。ターゲット・ビンゴ・パーフェクトのボーナスつき。
// ステージ制RUN(ラウンド=ステージ。ラウンド数は★ごとに3/5/7)の画面は braves-run.js が受け持つ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };

// 画面の寸法(ゲームエリア 720x720)
const PANEL = 72, PGAP = 9, GROUP_W = 3 * PANEL + 2 * PGAP;       // パネル1枚と、3x3のかたまり
const GROUP_Y = 124;
const GROUP_X_Q = 26, GROUP_X_R = 720 - 26 - GROUP_W;
const SLOT_W = 150, SLOT_H = 164, SLOT_Y = 372, SLOT_GAP = 20;     // 場のロボ(わられる数)
const HAND_W = 80, HAND_H = 100, HAND_GAP = 20, HAND_Y = 594;      // 手札(わる数)
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

Object.assign(state, {
    round: 1, ap: 10, quota: 10, roundHits: 0, roundScore: 0, roundBingos: 0, roundPerfects: 0, totalBingos: 0, totalPerfects: 0,
    equationText: '', fieldCards: [null, null, null], quotientPanels: Array(9).fill(false), remainderPanels: Array(9).fill(false),
    completedLinesQ: Array(8).fill(false), completedLinesR: Array(8).fill(false), perfectQ: false, perfectR: false,
    targetQuotient: null, targetRemainder: null, phase: 'IDLE', tutorial: false
});

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fieldMax() { return (state.round + 1) * 10; }

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

// ---- 手札と場のロボ ----
function handX(i) { return (state.width - (5 * HAND_W + 4 * HAND_GAP)) / 2 + i * (HAND_W + HAND_GAP); }
function createCard(index, val) {
    const x = handX(index);
    state.cards[index] = { value: val, x: x, y: HAND_Y, w: HAND_W, h: HAND_H, targetX: x, targetY: HAND_Y, baseY: HAND_Y, isDragging: false, _fresh: true };
}
function refillHand(index) {
    const cur = state.cards.map(c => c ? c.value : -1);
    let v;
    do { v = getRandomInt(2, 10); } while (cur.includes(v));
    createCard(index, v);
}
function slotX(i) { return (state.width - (3 * SLOT_W + 2 * SLOT_GAP)) / 2 + i * (SLOT_W + SLOT_GAP); }
function makeFieldCard(index, val) {
    const col = ROBOT_COLORS[Math.floor(Math.random() * ROBOT_COLORS.length)];
    return { value: val, x: slotX(index), y: SLOT_Y, w: SLOT_W, h: SLOT_H, robot: Math.floor(Math.random() * ROBOTS.length), c: col[0], c2: col[1], _id: Math.random() };
}
function newFieldValue(exceptIndex) {
    const others = state.fieldCards.map((c, i) => (i === exceptIndex || !c) ? -1 : c.value);
    let v;
    do { v = getRandomInt(10, fieldMax()); } while (others.includes(v));
    return v;
}

// ---- ステージ制RUNとの受けわたし ----
function stageClearTime(st) { return 0; }
let loopActive = false;
function startLoop() { if (loopActive) return; loopActive = true; requestAnimationFrame(gameLoop); }

function updateStageLabel() {
    const n = Math.min(state.round, STAGE_COUNT);
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
    STAGE_COUNT = CONFIG.maxRound;
    initGame();
    state.runMode = true;
    startStage(1);
}
function startStage(n) {
    state.stage = n;
    startRound(n);
    if (state.tutorial) { state.inputLocked = false; return; }   // チュートリアルのときはステージ演出を出さない
    state.inputLocked = true;
    showStageIntro(n, () => { state.inputLocked = false; });
}

function backToTitle() {
    state.screen = 'TITLE';
    hideAllOverlays();
    ui.title.classList.remove('hidden');
    ui.btnToTitle.classList.add('hidden');
    ui.rightPanelContent.classList.add('invisible');
    clearDvLayer();
    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0; state.round = 1; state.stage = 1; state.runMode = false; state.stageStartScore = 0; state.stageScores = [];
    state.totalBingos = 0; state.totalPerfects = 0; state.tutorial = false;
    state.cards = [null, null, null, null, null]; state.fieldCards = [null, null, null]; state.dragInfo = null;
    state.isProcessing = false; state.inputLocked = false; state.phase = 'IDLE';
    state.width = 720; state.height = 720; canvas.width = 720; canvas.height = 720;
    hideAllOverlays();
    clearDvLayer();
    const log = document.getElementById('battle-log-entries'); if (log) log.innerHTML = '';
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    startLoop();
}

function startRound(n) {
    state.round = n;
    state.quota = CONFIG.baseQuota + (n - 1);
    state.ap = CONFIG.ap;                         // ラウンドごとの加算なしで固定
    state.roundHits = 0; state.roundScore = 0; state.roundBingos = 0; state.roundPerfects = 0;
    state.stageStartScore = state.score;
    state.equationText = '';
    state.quotientPanels.fill(false); state.remainderPanels.fill(false);
    state.completedLinesQ.fill(false); state.completedLinesR.fill(false);
    state.perfectQ = false; state.perfectR = false;
    state.targetQuotient = getRandomInt(1, 9);
    state.targetRemainder = getRandomInt(1, 9);
    state.isProcessing = false; state.phase = 'PLAY';
    state.cards = [null, null, null, null, null];
    for (let i = 0; i < 5; i++) refillHand(i);
    state.fieldCards = [null, null, null];
    for (let i = 0; i < 3; i++) state.fieldCards[i] = makeFieldCard(i, newFieldValue(i));
    clearDvLayer();
    updateStageLabel();
    updateUI();
    addLog(T('stage_log', { n: n, name: stageName(n) }));
}

// ============================================================
//  わりざんと、パネルのHIT・ビンゴ・パーフェクト
// ============================================================
function panelCenter(val, type) {
    const x0 = type === 'Q' ? GROUP_X_Q : GROUP_X_R;
    const i = val - 1;
    return { x: x0 + (i % 3) * (PANEL + PGAP) + PANEL / 2, y: GROUP_Y + Math.floor(i / 3) * (PANEL + PGAP) + PANEL / 2 };
}
function popup(type, text, points, big) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    const x0 = type === 'Q' ? GROUP_X_Q : GROUP_X_R;
    const n = layer.querySelectorAll('.dv-pop.' + type).length;
    const el = document.createElement('div');
    el.className = 'dv-pop ' + type + (big ? ' big' : '');
    el.style.cssText = `left:${x0 + GROUP_W / 2}px;top:${GROUP_Y + GROUP_W / 2 - 34 - n * 62}px;`;
    el.innerHTML = `<b>${text}</b><i>+${points}pt</i>`;
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}
function burst(x, y, color) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fx-r';
    el.style.cssText = `left:${x}px;top:${y}px;border-color:${color};width:150px;height:150px;margin:-75px 0 0 -75px;`;
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}
function flash() {
    const area = document.getElementById('game-area');
    area.classList.remove('flash'); void area.offsetWidth; area.classList.add('flash');
}

function checkBingo() {
    let nq = 0, nr = 0;
    LINES.forEach((line, i) => {
        if (!state.completedLinesQ[i] && line.every(k => state.quotientPanels[k])) { state.completedLinesQ[i] = true; nq++; }
        if (!state.completedLinesR[i] && line.every(k => state.remainderPanels[k])) { state.completedLinesR[i] = true; nr++; }
    });
    [['Q', nq], ['R', nr]].forEach(([type, n]) => {
        if (n <= 0) return;
        const pts = n * 500;
        state.score += pts; state.roundScore += pts; state.roundBingos += n; state.totalBingos += n;
        popup(type, 'BINGO!!', pts, true);
        addLog(T('dv_log_bingo', { n: pts }));
    });
}

function processAttack(cardIndex, fieldIndex) {
    if (state.ap <= 0) return;
    const card = state.cards[cardIndex], fc = state.fieldCards[fieldIndex];
    const divisor = card.value, dividend = fc.value;
    const quotient = Math.floor(dividend / divisor), remainder = dividend % divisor;
    state.equationText = `${dividend} ÷ ${divisor} ＝ ${quotient} ${T('equation_remainder_word')} ${remainder}`;
    state.ap--;

    let isQHit = false, isRHit = false;
    if (quotient >= 1 && quotient <= 9 && !state.quotientPanels[quotient - 1]) {
        state.quotientPanels[quotient - 1] = true; state.roundHits++; isQHit = true;
        const p = panelCenter(quotient, 'Q'); burst(p.x, p.y, '#7ee8ff');
    }
    if (remainder >= 1 && remainder <= 9 && !state.remainderPanels[remainder - 1]) {
        state.remainderPanels[remainder - 1] = true; state.roundHits++; isRHit = true;
        const p = panelCenter(remainder, 'R'); burst(p.x, p.y, '#ff9ac8');
    }

    let base = 0;
    if (isQHit && isRHit) { base = 300; flash(); }
    else if (isQHit || isRHit) { base = 100; flash(); }
    let hitTargets = 0;
    if (isQHit && quotient === state.targetQuotient) hitTargets++;
    if (isRHit && remainder === state.targetRemainder) hitTargets++;
    const mult = hitTargets === 2 ? 4 : hitTargets === 1 ? 2 : 1;
    const total = base * mult;
    state.score += total; state.roundScore += total;

    // パネルごとの表示点(両方HITなら150ずつ)
    const bq = (isQHit && isRHit) ? 150 : isQHit ? 100 : 0;
    const br = (isQHit && isRHit) ? 150 : isRHit ? 100 : 0;
    if (isQHit) popup('Q', quotient === state.targetQuotient ? T('target_get') : T('hit_text'), bq * mult);
    if (isRHit) popup('R', remainder === state.targetRemainder ? T('target_get') : T('hit_text'), br * mult);
    addLog(T('dv_log_eq', { eq: state.equationText, n: total }));

    checkBingo();
    if (!state.perfectQ && state.quotientPanels.every(p => p)) {
        state.perfectQ = true; state.score += 2000; state.roundScore += 2000; state.roundPerfects++; state.totalPerfects++;
        popup('Q', T('perfect_text'), 2000, true);
        addLog(T('dv_log_perfect', { n: 2000 }));
    }
    if (!state.perfectR && state.remainderPanels.every(p => p)) {
        state.perfectR = true; state.score += 2000; state.roundScore += 2000; state.roundPerfects++; state.totalPerfects++;
        popup('R', T('perfect_text'), 2000, true);
        addLog(T('dv_log_perfect', { n: 2000 }));
    }

    refillHand(cardIndex);
    // わられたロボは、あたらしいロボと入れかわる
    fc._gone = true;
    state.fieldCards[fieldIndex] = makeFieldCard(fieldIndex, newFieldValue(fieldIndex));
    updateUI();
    checkRoundStatus();
}

function checkRoundStatus() {
    const full = state.quotientPanels.every(b => b) && state.remainderPanels.every(b => b);
    if (full || state.roundHits >= state.quota) {
        state.phase = 'CLEAR_WAIT';
        setTimeout(handleRoundClear, 700);
    } else if (state.ap <= 0) {
        state.phase = 'OVER_WAIT';
        setTimeout(() => { if (state.screen === 'PLAYING') finishRun(false); }, 800);
    }
}
function handleRoundClear() {
    if (state.screen !== 'PLAYING') return;
    state.inputLocked = true;
    state.apBonus = state.ap * 500;                    // のこりAP×500点
    state.score += state.apBonus; state.roundScore += state.apBonus;
    state.stageScores[state.round - 1] = state.roundScore;
    updateUI();
    if (state.round >= CONFIG.maxRound) { finishRun(true); return; }
    showStageClear(state.round, state.roundScore);
}

// ---- RUNの結果 ----
function finishRun(cleared) {
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    ui.btnToTitle.classList.add('hidden');
    if (state.stageScores[state.round - 1] === undefined) state.stageScores[state.round - 1] = state.roundScore;
    const finalScore = state.score;
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, finalScore, state.round, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, finalScore, isNewRecord, 0, 0);
}
function gameOver() { finishRun(false); }
function gameClear() { finishRun(true); }

// ============================================================
//  画面の描画(DOM)
// ============================================================
const DV = { ready: false };
const dvScore = document.getElementById('disp-total-score');

function dvInit() {
    const layer = document.getElementById('bl');
    if (DV.ready && DV.eq && layer.contains(DV.eq)) return;
    let h = `<div class="dv-eq"><span></span></div><div class="dv-quota"><small></small><b>0</b><em></em></div><div class="dv-hbox"></div><div class="bl-hint" style="display:none"></div>`;
    ['Q', 'R'].forEach(type => {
        const x0 = type === 'Q' ? GROUP_X_Q : GROUP_X_R;
        h += `<div class="dv-cap ${type}" style="left:${x0}px;top:${GROUP_Y - 56}px;width:${GROUP_W}px"><small></small><b></b></div>`;
        for (let i = 0; i < 9; i++) {
            h += `<div class="dv-p ${type}" data-t="${type}" data-i="${i}" style="left:${x0 + (i % 3) * (PANEL + PGAP)}px;top:${GROUP_Y + Math.floor(i / 3) * (PANEL + PGAP)}px;width:${PANEL}px;height:${PANEL}px"><b>${i + 1}</b></div>`;
        }
    });
    layer.innerHTML = h;
    DV.eq = layer.querySelector('.dv-eq'); DV.eqSpan = DV.eq.querySelector('span');
    DV.quota = layer.querySelector('.dv-quota'); DV.hint = layer.querySelector('.bl-hint');
    DV.hbox = layer.querySelector('.dv-hbox');
    const hx = handX(0) - 18;
    DV.hbox.style.cssText = `left:${hx}px;top:${HAND_Y - 16}px;width:${5 * HAND_W + 4 * HAND_GAP + 36}px;height:${HAND_H + 32}px`;
    DV.panels = { Q: [], R: [] };
    layer.querySelectorAll('.dv-p').forEach(el => DV.panels[el.dataset.t][+el.dataset.i] = el);
    DV.slotEls = [null, null, null]; DV.hand = []; DV.handSig = [];
    DV.ready = true;
}
function clearDvLayer() {
    const layer = document.getElementById('bl');
    if (layer) layer.innerHTML = '';
    DV.ready = false;
    const area = document.getElementById('game-area');
    if (area) area.classList.remove('danger', 'flash');
}

function tensColor(v) {
    const colors = ['#8bc34a', '#29b6f6', '#ffa726', '#ef5350', '#ab47bc', '#26a69a', '#ffee58', '#8d6e63', '#ec407a', '#78909c'];
    return colors[Math.min(Math.floor(v / 10), colors.length - 1)];
}
function buildSlot(fc) {
    const el = document.createElement('div');
    el.className = 'dv-slot pop';
    el.style.cssText = `left:${fc.x}px;top:${fc.y}px;width:${fc.w}px;height:${fc.h}px;`;
    el.innerHTML = `<div class="dv-bot" style="--c:${fc.c};--c2:${fc.c2}"><div class="dv-in"><div class="rbx">${ROBOTS[fc.robot]}</div></div></div><div class="dv-plate" style="border-color:${tensColor(fc.value)}"><b>${fc.value}</b></div>`;
    el.addEventListener('animationend', (e) => { if (e.animationName === 'dvPop') el.classList.remove('pop'); });
    return el;
}

// カードを持っているとき、どのロボの上にいるか
function overSlot(c) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    for (let i = 0; i < 3; i++) {
        const f = state.fieldCards[i];
        if (f && cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h) return i;
    }
    return -1;
}

function renderDv() {
    dvInit();
    // けいさんしき
    const eq = state.equationText || T('equation_placeholder');
    if (DV.eqSpan._t !== eq) { DV.eqSpan._t = eq; DV.eqSpan.textContent = eq; DV.eq.classList.toggle('ph', !state.equationText); }
    // ノルマ
    const rem = Math.max(0, state.quota - state.roundHits);
    const qs = rem + '|' + state.roundHits + '|' + state.quota;
    if (DV.quota._s !== qs) {
        DV.quota._s = qs;
        DV.quota.querySelector('small').textContent = T('dv_quota_top');
        DV.quota.querySelector('b').textContent = rem;
        DV.quota.querySelector('em').textContent = `HIT ${state.roundHits} / ${state.quota}`;
    }
    // パネルの見出し
    document.querySelectorAll('.dv-cap').forEach(el => {
        const t = el.classList.contains('Q') ? 'canvas_quotient' : 'canvas_remainder';
        const k = el.classList.contains('Q') ? 'canvas_quotient_kanji' : 'canvas_remainder_kanji';
        const sm = el.querySelector('small'), b = el.querySelector('b');
        if (sm._t !== T(t)) { sm._t = T(t); sm.textContent = T(t); }
        if (b._t !== T(k)) { b._t = T(k); b.textContent = T(k); }
    });
    // ドラッグ中: どのパネルにHITしそうか
    const drag = state.dragInfo ? state.cards[state.dragInfo.index] : null;
    let hint = null, pvQ = -1, pvR = -1, tgtSlot = -1;
    if (drag) {
        tgtSlot = overSlot(drag);
        if (tgtSlot >= 0) {
            const f = state.fieldCards[tgtSlot];
            const q = Math.floor(f.value / drag.value), r = f.value % drag.value;
            const newQ = q >= 1 && q <= 9 && !state.quotientPanels[q - 1], newR = r >= 1 && r <= 9 && !state.remainderPanels[r - 1];
            if (newQ) pvQ = q - 1;
            if (newR) pvR = r - 1;
            hint = { cls: (newQ || newR) ? 'hit' : 'bad', text: `${f.value} ÷ ${drag.value} ＝ ${q} ${T('equation_remainder_word')} ${r}` };
        }
    }
    for (let i = 0; i < 9; i++) {
        ['Q', 'R'].forEach(type => {
            const el = DV.panels[type][i];
            const hit = (type === 'Q' ? state.quotientPanels : state.remainderPanels)[i];
            const isT = (i + 1) === (type === 'Q' ? state.targetQuotient : state.targetRemainder);
            const pv = i === (type === 'Q' ? pvQ : pvR);
            const cls = 'dv-p ' + type + (hit ? ' hit' : '') + (isT && !hit ? ' tgt' : '') + (pv ? ' pv' : '');
            if (el._cls !== cls) { el._cls = cls; el.className = cls; }
        });
    }
    // 場のロボ
    for (let i = 0; i < 3; i++) {
        const fc = state.fieldCards[i];
        let el = DV.slotEls[i];
        if (!fc) continue;
        if (!el || el._fc !== fc) {
            if (el) { el.classList.add('dead'); const old = el; setTimeout(() => old.remove(), 450); }
            el = buildSlot(fc); el._fc = fc;
            document.getElementById('bl').appendChild(el);
            DV.slotEls[i] = el;
        }
        el.classList.toggle('tgt', i === tgtSlot);
    }
    // 手札
    for (let i = 0; i < 5; i++) {
        const c = state.cards[i];
        let el = DV.hand[i];
        if (!c) { if (el) { el.remove(); DV.hand[i] = null; } continue; }
        if (!el || el._card !== c) {
            if (el) el.remove();
            el = document.createElement('div');
            el.addEventListener('animationend', () => { el._popping = false; el.classList.remove('pop'); });
            el._card = c; DV.hand[i] = el;
            el.style.width = c.w + 'px'; el.style.height = c.h + 'px';
            el.innerHTML = `<div class="nm">${c.value}</div>`; el._v = c.value;
            document.getElementById('bl').appendChild(el);
            el._popping = true; el.classList.add('pop');
        }
        if (el._v !== c.value) { el._v = c.value; el.querySelector('.nm').textContent = c.value; }
        if (!c.isDragging) { c.x += (c.targetX - c.x) * 0.2; c.y += (c.targetY - c.y) * 0.2; }
        const cls = 'hc fh' + (c.isDragging ? ' dragging' : '') + (el._popping ? ' pop' : '');
        if (el._cls !== cls) { el._cls = cls; el.className = cls; }
        el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }
    // 吹き出し
    if (hint && drag) {
        const hx = Math.max(110, Math.min(state.width - 110, drag.x + drag.w / 2));
        const hy = Math.max(60, drag.y - 12);
        DV.hint.style.display = '';
        DV.hint.style.left = hx + 'px'; DV.hint.style.top = hy + 'px';
        if (DV.hint._t !== hint.text) { DV.hint._t = hint.text; DV.hint.textContent = hint.text; }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (DV.hint.className !== hc) DV.hint.className = hc;
    } else if (DV.hint.style.display !== 'none') {
        DV.hint.style.display = 'none';
    }
    // APがすくないときの赤いふち
    const area = document.getElementById('game-area');
    area.classList.toggle('danger', state.ap <= 3 && state.ap > 0 && state.screen === 'PLAYING');
}

function updateUI() {
    const ap = document.getElementById('disp-ap');
    ap.textContent = state.ap;
    ap.classList.toggle('low', state.ap <= 3);
    if (dvScore._v !== state.score) {
        const first = dvScore._v === undefined;
        dvScore._v = state.score;
        dvScore.textContent = state.score;
        if (!first && state.score > 0) { dvScore.classList.remove('bump'); void dvScore.offsetWidth; dvScore.classList.add('bump'); }
    }
    document.getElementById('disp-round-score').textContent = state.roundScore;
    document.getElementById('disp-round-bingo').textContent = state.roundBingos;
    document.getElementById('disp-round-perfect').textContent = state.roundPerfects;
}
function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }
    renderDv();
    requestAnimationFrame(gameLoop);
}

// ============================================================
//  入力(カードをドラッグしてロボにかさねる)
// ============================================================
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e;
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    if (isMobileRotated) return { x: y * (canvas.height / rect.width), y: canvas.height - x * (canvas.width / rect.height) };
    return { x: x * (canvas.width / rect.width), y: y * (canvas.height / rect.height) };
}
function canPlay() { return state.screen === 'PLAYING' && state.phase === 'PLAY' && !state.inputLocked; }
function onDown(e) {
    if (!canPlay()) return;
    const pos = getEventPos(e);
    for (let i = 0; i < state.cards.length; i++) {
        const c = state.cards[i];
        if (c && pos.x >= c.x && pos.x <= c.x + c.w && pos.y >= c.y && pos.y <= c.y + c.h) {
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
    const idx = state.dragInfo.index, card = state.cards[idx];
    const pos = getEventPos(e);
    card.isDragging = false;
    state.dragInfo = null;
    for (let i = 0; i < 3; i++) {
        const f = state.fieldCards[i];
        if (f && pos.x >= f.x && pos.x <= f.x + f.w && pos.y >= f.y && pos.y <= f.y + f.h) {
            if (canPlay()) processAttack(idx, i);
            return;
        }
    }
}
canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(e); }, { passive: false });
