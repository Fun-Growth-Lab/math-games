// ぶんすう(ケーキづくり)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
// ルールは元のぶんすうと同じ: 3つのケーキに手札の分数カードをのせてたし、3つの大きさをぴったりそろえればラウンドクリア。
//   ケーキは「24分のいくつ」で持つ(24=ちょうど1)。1をこえたらのこりだけが残る。ちょうど1にするとコンボ(倍率+0.5)。
//   APはカードを使う・手札をチェンジするたびに1へる(0でゲームオーバー)。ラウンドクリアでAP回復。全10ラウンド。
// ステージ制RUN(ラウンド=ステージ。★で しょきゅう/ちゅうきゅう/じょうきゅう)の画面は braves-run.js が受け持つ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };

// 画面の寸法(ゲームエリア 720x720)
const CAKE = 206, CAKE_Y = 98, CAKE_GAP = 20;
function cakeX(i) { return (720 - (3 * CAKE + 2 * CAKE_GAP)) / 2 + i * (CAKE + CAKE_GAP); }
const LAB_Y = CAKE_Y + CAKE + 4;                       // 大きさの札
const HAND_W = 88, HAND_H = 124, HAND_GAP = 14, HAND_Y = 556, HAND_L = 24, HAND_AREA = 502;
const CHG = { x: 548, y: 590, w: 150, h: 70 };         // チェンジのボタン

Object.assign(state, {
    ap: 10, cakes: [0, 0, 0], targetValue: 0, targetBase: 200, targetKey: 'target_chance', targetColor: '#fff',
    combo: 0, roundCoins: 0, phase: 'IDLE', tutorial: false, lastEq: '',
    roundBase: 0, roundRate: 1, roundHeal: 0, endBase: 0, apBonus: 0
});

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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
    clearFcLayer();
    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0; state.bestPlay = 0; state.stage = 1; state.runMode = false; state.stageStartScore = 0; state.stageScores = []; state.tutorial = false;
    state.ap = 10; state.cakes = [0, 0, 0]; state.cards = []; state.dragInfo = null; state.lastEq = '';
    state.combo = 0; state.roundCoins = 0; state.inputLocked = false; state.phase = 'IDLE';
    state.endBase = 0; state.apBonus = 0;
    state.width = 720; state.height = 720; canvas.width = 720; canvas.height = 720;
    hideAllOverlays();
    clearFcLayer();
    const log = document.getElementById('battle-log-entries'); if (log) log.innerHTML = '';
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    document.getElementById('target-cake').innerHTML = cakeSVG(CONFIG.gridDiv);
    startLoop();
}

// ---- 手札 ----
function handX(i, n) {
    const cnt = n || state.cards.length || CONFIG.handSize;
    const w = cnt * HAND_W + (cnt - 1) * HAND_GAP;
    return HAND_L + (HAND_AREA - w) / 2 + i * (HAND_W + HAND_GAP);
}
function makeCard(i, n) {
    const types = CONFIG.cardTypes.filter(v => v !== UNIT_MAX);
    const val = types[getRandomInt(0, types.length - 1)];
    const r = Math.random();
    const stars = r >= 0.90 ? 3 : r >= 0.60 ? 2 : 1;      // ⭐ 1〜3(60%/30%/10%)
    const x = handX(i, n);
    return { val: val, stars: stars, x: x, y: HAND_Y, w: HAND_W, h: HAND_H, targetX: x, targetY: HAND_Y, isDragging: false };
}
function fillHand() {
    state.cards = [];
    for (let i = 0; i < CONFIG.handSize; i++) state.cards.push(makeCard(i, CONFIG.handSize));
}

// ---- ラウンド ----
function startRound(n) {
    state.combo = 0; state.roundCoins = 0; state.lastEq = '';
    state.stageStartScore = state.score;
    const types = CONFIG.cardTypes;
    state.targetValue = types[getRandomInt(0, types.length - 1)];
    // ターゲットの点数(1ラウンド目はかならず200)
    let pts = 200, key = 'target_chance', col = '#ffffff';
    if (n > 1) {
        const r = Math.random();
        if (r < 0.05) { pts = 500; key = 'target_supergood'; col = '#e8a0ff'; }
        else if (r < 0.15) { pts = 400; key = 'target_big'; col = '#ff8a7a'; }
        else if (r < 0.30) { pts = 300; key = 'target_good'; col = '#ffe27a'; }
    }
    state.targetBase = pts; state.targetKey = key; state.targetColor = col;
    do { state.cakes = [0, 1, 2].map(() => types[getRandomInt(0, types.length - 1)]); }
    while (state.cakes[0] === state.cakes[1] && state.cakes[1] === state.cakes[2]);
    if (n === 1 || !state.cards.length) fillHand();
    state.phase = 'PLAY';
    clearFcLayer(true);
    fcInit();
    updateStageLabel();
    updateUI();
    document.getElementById('game-area').style.setProperty('--sc', STAGE_THEMES[Math.min(n, STAGE_COUNT) - 1].c);
    addLog(T('stage_log', { n: n, name: stageName(n) }));
}

function aligned() { const c = state.cakes; return c[0] === c[1] && c[1] === c[2] && c[0] > 0; }

// ============================================================
//  カードをケーキにのせる → そろったらラウンドクリア
// ============================================================
function processAttack(cardIdx, cakeIdx) {
    if (state.ap <= 0) return;
    const c = state.cards[cardIdx];
    const cur = state.cakes[cakeIdx];
    let next = cur + c.val, one = false;
    const raw = next;
    if (next > UNIT_MAX) next -= UNIT_MAX; else if (next === UNIT_MAX) one = true;
    state.lastEq = `${fracText(cur)} + ${fracText(c.val)} = ${fracText(raw)}` + (raw > UNIT_MAX ? ` → ${fracText(next)}` : '');
    state.cakes[cakeIdx] = next;
    state.roundCoins += c.stars;
    const cx = cakeX(cakeIdx) + CAKE / 2, cy = CAKE_Y + CAKE / 2;
    burst(cx, cy, '#ffd24a', 14);
    fxText(cx, cy - 20, `+${c.stars}⭐`, '#ffe27a', 30);
    if (one) {
        state.combo++;
        fxText(cx, cy - 70, T('particle_combo', { n: state.combo }), '#ff8a7a', 42);
        burst(cx, cy, '#ff8fb0', 22);
    }
    addLog(state.lastEq);
    state.cards[cardIdx] = makeCard(cardIdx);
    state.cards[cardIdx]._fresh = true;
    state.ap--;
    updateUI();
    if (aligned()) { state.phase = 'CLEAR_WAIT'; setTimeout(roundClear, 500); }
    else checkGameOver();
}
function changeHand() {
    if (state.ap <= 0 || !canPlay()) return;
    state.ap--;
    fillHand();
    state.cards.forEach(c => { c._fresh = true; burst(c.x + c.w / 2, c.y + c.h / 2, '#f4c6d4', 6); });
    addLog(T('fc_log_change'));
    updateUI();
    checkGameOver();
}
function checkGameOver() {
    if (state.ap <= 0 && !aligned() && state.phase === 'PLAY') {
        state.phase = 'OVER_WAIT';
        setTimeout(() => { if (state.screen === 'PLAYING') finishRun(false); }, 900);
    }
}

function roundClear() {
    if (state.screen !== 'PLAYING') return;
    const isTarget = state.cakes[0] === state.targetValue;
    const base = (isTarget ? state.targetBase : 100) + state.roundCoins * 10;
    const rate = 1 + state.combo * 0.5;
    const total = Math.floor(base * rate);
    state.roundBase = base; state.roundRate = rate; state.roundHeal = CONFIG.apHeal;
    state.ap += CONFIG.apHeal;
    noteBestPlay(total);
    state.score += total;
    state.stageScores[state.stage - 1] = total;
    state.inputLocked = true;
    updateUI();
    fxText(360, 330, T('particle_ap_gain', { n: CONFIG.apHeal }), '#ffb066', 44);
    if (isTarget) fxText(360, 270, T('particle_target_bonus'), '#ffe27a', 40);
    confetti();
    addLog(T('fc_log_clear', { n: total }));
    document.querySelectorAll('.fc-cake').forEach(el => el.classList.add('matched'));
    setTimeout(() => {
        if (state.screen !== 'PLAYING') return;
        if (state.stage >= CONFIG.maxRound) { finishRun(true); return; }
        showStageClear(state.stage, total);
    }, 1000);
}

// ---- RUNの結果 ----
function finishRun(cleared) {
    if (state.screen !== 'PLAYING') return;
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    state.phase = 'END';
    ui.btnToTitle.classList.add('hidden');
    if (state.stageScores[state.stage - 1] === undefined) state.stageScores[state.stage - 1] = 0;
    state.endBase = state.score;
    state.apBonus = Math.max(0, state.ap) * 100;
    const total = state.endBase + state.apBonus;
    state.score = total;
    updateUI();
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, total, state.stage, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, total, isNewRecord, 0, 0);
}

// ============================================================
//  画面の描画(DOM)
// ============================================================
const FC = { ready: false };
const fcScore = document.getElementById('disp-total-score');

function fcInit() {
    const layer = document.getElementById('bl');
    if (FC.ready && FC.eq && layer.contains(FC.eq)) return;
    let h = `<div class="fc-eq ph"><span></span></div><div class="fc-table"></div>`;
    for (let i = 0; i < 3; i++) {
        h += `<div class="fc-cake" data-i="${i}" style="left:${cakeX(i)}px;top:${CAKE_Y}px;width:${CAKE}px;height:${CAKE}px">${cakeSVG(CONFIG.gridDiv)}</div>`;
        h += `<div class="fc-lab" data-i="${i}" style="left:${cakeX(i) + CAKE / 2 - 54}px;top:${LAB_Y}px"></div>`;
    }
    h += `<div class="fc-stats"><div class="st"><i class="gs"></i><b id="fc-coins">0</b></div><div class="st cb"><span id="fc-combo-lb"></span><b id="fc-combo">0</b></div></div>`;
    h += `<div class="fc-hbox" style="left:${HAND_L - 6}px;top:${HAND_Y - 14}px;width:${HAND_AREA + 12}px;height:${HAND_H + 28}px"></div>`;
    h += `<div class="fc-chg" style="left:${CHG.x}px;top:${CHG.y}px;width:${CHG.w}px;height:${CHG.h}px"><b></b><small></small></div>`;
    h += `<div class="bl-hint" style="display:none"></div>`;
    layer.innerHTML = h;
    FC.eq = layer.querySelector('.fc-eq'); FC.eqSpan = FC.eq.querySelector('span');
    FC.cakes = Array.from(layer.querySelectorAll('.fc-cake')); FC.labs = Array.from(layer.querySelectorAll('.fc-lab'));
    FC.chg = layer.querySelector('.fc-chg'); FC.hint = layer.querySelector('.bl-hint');
    FC.hand = [];
    FC.ready = true;
}
function clearFcLayer(keepHand) {
    const layer = document.getElementById('bl');
    if (layer) layer.innerHTML = '';
    FC.ready = false;
    const area = document.getElementById('game-area');
    if (area) area.classList.remove('danger', 'flash');
}

function fxText(x, y, text, color, size) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fx-t';
    el.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:${size || 34}px`;
    el.innerHTML = emo(text);
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}
function burst(x, y, color, n) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    for (let i = 0; i < n; i++) {
        const el = document.createElement('i');
        const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
        el.className = 'fc-pt';
        el.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px`;
        el.addEventListener('animationend', () => el.remove());
        layer.appendChild(el);
    }
}
function confetti() {
    const layer = document.getElementById('bl');
    if (!layer) return;
    for (let i = 0; i < 44; i++) {
        const el = document.createElement('i');
        el.className = 'fc-cf';
        el.style.cssText = `left:${10 + Math.random() * 700}px;top:${-20 - Math.random() * 60}px;background:hsl(${Math.random() * 360} 90% 62%);--dx:${(Math.random() - 0.5) * 120}px;animation-delay:${Math.random() * 0.5}s;animation-duration:${1.4 + Math.random() * 0.9}s`;
        el.addEventListener('animationend', () => el.remove());
        layer.appendChild(el);
    }
}

// カードを持っているとき、どのケーキの上にいるか
function overCake(c) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    for (let i = 0; i < 3; i++) {
        const x = cakeX(i);
        if (cx >= x - 6 && cx <= x + CAKE + 6 && cy >= CAKE_Y - 6 && cy <= LAB_Y + 90) return i;
    }
    return -1;
}

function renderFc() {
    fcInit();
    // けいさんしき
    const eq = state.lastEq || T('fc_eq_placeholder');
    if (FC.eqSpan._t !== eq) { FC.eqSpan._t = eq; FC.eqSpan.textContent = eq; FC.eq.classList.toggle('ph', !state.lastEq); }
    // ドラッグ中: どのケーキにのせようとしているか
    const drag = state.dragInfo ? state.cards[state.dragInfo.index] : null;
    const ov = drag ? overCake(drag) : -1;
    let hint = null;
    if (ov >= 0) {
        const cur = state.cakes[ov], raw = cur + drag.val;
        const nx = raw > UNIT_MAX ? raw - UNIT_MAX : raw;
        hint = { cls: raw === UNIT_MAX ? 'hit' : '', text: `${fracText(cur)} + ${fracText(drag.val)} = ${fracText(raw)}` + (raw > UNIT_MAX ? ` → ${fracText(nx)}` : '') };
    }
    // ケーキ
    for (let i = 0; i < 3; i++) {
        const el = FC.cakes[i], v = state.cakes[i];
        if (el._v !== v) { el._v = v; paintCake(el.firstElementChild, v, CONFIG.gridDiv); FC.labs[i].innerHTML = `<div class="pill">${fracHTML(v)}</div>`; }
        el.classList.toggle('over', i === ov);
        FC.labs[i].classList.toggle('over', i === ov);
    }
    // ⭐とコンボ
    document.getElementById('fc-coins').textContent = state.roundCoins;
    document.getElementById('fc-combo').textContent = state.combo;
    const cl = T('fc_combo');
    const cle = document.getElementById('fc-combo-lb');
    if (cle._t !== cl) { cle._t = cl; cle.textContent = cl; }
    // チェンジのボタン
    const cb = FC.chg.querySelector('b'), cs = FC.chg.querySelector('small');
    if (cb._t !== T('fc_change')) { cb._t = T('fc_change'); cb.textContent = T('fc_change'); cs.textContent = T('fc_change_sub'); }
    FC.chg.classList.toggle('off', state.ap <= 0 || state.phase !== 'PLAY');
    // 手札
    const n = state.cards.length;
    for (let i = 0; i < Math.max(n, FC.hand.length); i++) {
        const c = state.cards[i];
        let el = FC.hand[i];
        if (!c) { if (el) { el.remove(); FC.hand[i] = null; } continue; }
        if (!el || el._card !== c) {
            if (el) el.remove();
            el = document.createElement('div');
            el.addEventListener('animationend', () => { el._popping = false; el.classList.remove('pop'); });
            el._card = c; FC.hand[i] = el;
            el.style.width = c.w + 'px'; el.style.height = c.h + 'px';
            el.innerHTML = `<div class="stars">${'<i class="gs"></i>'.repeat(c.stars)}</div><div class="nm">${fracHTML(c.val)}</div>`;
            document.getElementById('bl').appendChild(el);
            el._popping = true; el.classList.add('pop');
        }
        if (!c.isDragging) {
            const tx = handX(i, n);
            c.targetX = tx; c.targetY = HAND_Y;
            c.x += (c.targetX - c.x) * 0.2; c.y += (c.targetY - c.y) * 0.2;
        }
        const cls = 'hc fc-hc t' + (c.val >= 18 ? 4 : c.val >= 12 ? 3 : c.val >= 6 ? 2 : 1) + (c.isDragging ? ' dragging' : '') + (el._popping ? ' pop' : '');
        if (el._cls !== cls) { el._cls = cls; el.className = cls; }
        el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }
    // 吹き出し
    if (hint && drag) {
        const hx = Math.max(130, Math.min(state.width - 130, drag.x + drag.w / 2));
        const hy = Math.max(60, drag.y - 12);
        FC.hint.style.display = '';
        FC.hint.style.left = hx + 'px'; FC.hint.style.top = hy + 'px';
        if (FC.hint._t !== hint.text) { FC.hint._t = hint.text; FC.hint.textContent = hint.text; }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (FC.hint.className !== hc) FC.hint.className = hc;
    } else if (FC.hint.style.display !== 'none') FC.hint.style.display = 'none';
    // APがすくないときの赤いふち
    const area = document.getElementById('game-area');
    area.classList.toggle('danger', state.screen === 'PLAYING' && state.ap <= 3 && state.ap > 0);
}

function updateUI() {
    const ap = document.getElementById('disp-ap');
    ap.textContent = state.ap;
    ap.classList.toggle('low', state.ap <= 3);
    if (fcScore._v !== state.score) {
        const first = fcScore._v === undefined;
        fcScore._v = state.score;
        fcScore.textContent = state.score;
        if (!first && state.score > 0) { fcScore.classList.remove('bump'); void fcScore.offsetWidth; fcScore.classList.add('bump'); }
    }
    // ターゲット
    const tn = document.getElementById('disp-target-type');
    tn.textContent = T(state.targetKey); tn.style.color = state.targetColor;
    document.getElementById('disp-target-pts').textContent = state.targetBase + T('unit_pts');
    const tc = document.getElementById('target-cake'), sv = tc.firstElementChild;
    if (sv && sv._tv !== state.targetValue) {
        sv._tv = state.targetValue;
        paintCake(sv, state.targetValue, CONFIG.gridDiv);
        document.getElementById('label-target').innerHTML = fracHTML(state.targetValue);
    }
}
function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }
    renderFc();
    requestAnimationFrame(gameLoop);
}

// ============================================================
//  入力(カードをドラッグしてケーキにのせる)
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
    if (pos.x >= CHG.x && pos.x <= CHG.x + CHG.w && pos.y >= CHG.y && pos.y <= CHG.y + CHG.h) { changeHand(); return; }
    if (state.ap <= 0) return;
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
    const idx = state.dragInfo.index, c = state.cards[idx];
    c.isDragging = false;
    state.dragInfo = null;
    const ov = overCake(c);
    if (ov >= 0 && canPlay()) processAttack(idx, ov);
}
canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(e); }, { passive: false });
