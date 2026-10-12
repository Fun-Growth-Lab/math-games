// ぶんすう(ケーキづくり)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
// ルールは元のぶんすうと同じ: 3つのケーキに手札の分数カードをのせてたし、3つの大きさをぴったりそろえればラウンドクリア。
//   ケーキは「24分のいくつ」で持つ(24=ちょうど1)。1をこえたらのこりだけが残る。
//   APはカードを使う・手札をチェンジするたびに1へる(0でゲームオーバー)。ステージクリアでAP回復。全10ステージ。
//   ホール(ちょうど「1」)を作るたびに、ターゲットが1まい増える(カンドラ)。同じ大きさがかさなると ×まい数。
//   点数: ケーキ1つ100点(3つで300点)。ターゲットに当たるごとに、そのステージのスコアの50%を足す。クリアでコインがもらえ、ショップで能力アップ。
// 画面の寸法(ゲームエリア 720x720)
const CAKE = 212, CAKE_Y = 190, CAKE_GAP = 16;
function cakeX(i) { return (720 - (3 * CAKE + 2 * CAKE_GAP)) / 2 + i * (CAKE + CAKE_GAP); }
const LAB_Y = CAKE_Y + CAKE + 6;                       // 大きさの札
const HAND_W = 116, HAND_H = 144, HAND_GAP = 14, HAND_Y = 542, HAND_L = 20, HAND_AREA = 680;   // 手札はケーキの真下に近づけて、横はば いっぱいに並べる

Object.assign(state, {
    ap: 10, cakes: [0, 0, 0], targets: [], coins: 0, run: null,
    phase: 'IDLE', tutorial: false, lastEq: '',
    roundBase: 0, roundHeal: 0, endBase: 0, apBonus: 0
});

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }


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
    for (let k = 1; k <= STAGE_COUNT; k++) h += `<div class="rt ${k < n ? 'done' : (k === n ? 'now' : '')}${k === STAGE_COUNT ? ' last' : ''}" style="--rc:${STAGE_THEMES[k - 1].c}"><b class="no">${k}</b></div>`;
    document.getElementById('sp-route').innerHTML = h;
}
function startRun(star) {
    if (!starUnlocked(star)) return;
    state.star = star;
    state.difficulty = starKey(star);
    UNIT_MAX = DIVISIONS[runSelIdx];                 // RUN = ケーキの分割数
    CONFIG = fracPreset(star, UNIT_MAX);
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
    state.ap = CONFIG.startAp || 10; state.cakes = [0, 0, 0]; state.targets = [];
    state.coins = 0; state.run = { healUp: 0, healFrac: 0, spiceLv: 0, shapes: {}, favs: {}, favUses: 0, bought: [] }; state.cards = []; state.dragInfo = null; state.lastEq = '';
    state.inputLocked = false; state.phase = 'IDLE';
    state.endBase = 0; state.apBonus = 0; state.roundHits = 0; state.roundCakePts = 0; state.roundTargetPts = 0; state.roundShape = false; state.roundSub = 0; state.roundCoins = 0;
    state.width = 720; state.height = 720; canvas.width = 720; canvas.height = 720;
    hideAllOverlays();
    clearFcLayer();
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    FC.tsig = null;
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
    const x = handX(i, n);
    return { val: val, x: x, y: HAND_Y, w: HAND_W, h: HAND_H, targetX: x, targetY: HAND_Y, isDragging: false };
}
function fillHand() {
    state.cards = [];
    for (let i = 0; i < CONFIG.handSize; i++) state.cards.push(makeCard(i, CONFIG.handSize));
}

// ---- ラウンド ----
function startRound(n) {
    state.lastEq = '';
    state.stageStartScore = state.score;
    const types = CONFIG.cardTypes;                         // 1〜n(n=ちょうど1)
    state.targets = [types[getRandomInt(0, types.length - 1)]];   // 最初のターゲット1まい。ホールを作るたびに増える
    const start = types.filter(v => v < UNIT_MAX);          // はじめのケーキは ちょうど1でない大きさ
    do { state.cakes = [0, 1, 2].map(() => start[getRandomInt(0, start.length - 1)]); }
    while (state.cakes[0] === state.cakes[1] && state.cakes[1] === state.cakes[2]);
    if (n === 1 || !state.cards.length) fillHand();
    state.phase = 'PLAY';
    clearFcLayer(true);
    fcInit();
    updateStageLabel();
    updateUI();
    document.getElementById('game-area').style.setProperty('--sc', STAGE_THEMES[Math.min(n, STAGE_COUNT) - 1].c);
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
    if (state.run && state.run.favs[c.val]) state.run.favUses++;   // おきにいりカード: 使うたび 最終スコアの倍率が上がる
    const cx = cakeX(cakeIdx) + CAKE / 2, cy = CAKE_Y + CAKE / 2;
    burst(cx, cy, '#ffd24a', 14);
    if (one) {
        fxText(cx, cy - 40, T('particle_whole'), '#ff8a7a', 42);   // ちょうど「1」(ホール)
        burst(cx, cy, '#ff8fb0', 22);
        addTarget();                                               // カンドラ: ターゲットが1まい増える
    }
    state.cards[cardIdx] = makeCard(cardIdx);
    state.cards[cardIdx]._fresh = true;
    state.ap--;
    updateUI();
    if (aligned()) { state.phase = 'CLEAR_WAIT'; setTimeout(roundClear, 500); }
    else checkGameOver();
}
// ホールを作ったら、ターゲットを1まい足す(同じ大きさもありえる=かさなると ×2)
function addTarget() {
    const types = CONFIG.cardTypes, v = types[getRandomInt(0, types.length - 1)];
    state.targets.push(v);
    const dup = state.targets.filter(x => x === v).length;
    fxText(360, 330, T(dup > 1 ? 'particle_target_dup' : 'particle_target_add', { n: dup }), '#ff4a7a', 34);
}
function changeHand() {
    if (state.ap <= 0 || !canPlay()) return;
    state.ap--;
    fillHand();
    state.cards.forEach(c => { c._fresh = true; burst(c.x + c.w / 2, c.y + c.h / 2, '#f4c6d4', 6); });
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
    const size = state.cakes[0], R = state.run;
    const cakePts = CAKE_PTS * 3;
    const hits = state.targets.filter(v => v === size).length;                // 当たったターゲットのまい数
    const rate = TARGET_RATE + 0.05 * R.spiceLv;                              // ターゲット1まいで +50%(スパイスで +5%ずつ)
    const subtotal = cakePts;
    const targetPts = Math.round(subtotal * rate * hits);
    const shapeMul = R.shapes[size] ? 1.1 : 1;                                // かたちマスター
    const total = Math.round((subtotal + targetPts) * shapeMul);
    const coins = coinsFor(total);
    // おかわりAP: 1Lvごとに +0.5(はんぱは持ちこして、たまったら +1)
    const healAcc = (R.healFrac || 0) + 0.5 * R.healUp;
    const heal = CONFIG.apHeal + Math.floor(healAcc);
    R.healFrac = healAcc - Math.floor(healAcc);
    state.roundHits = hits; state.roundCakePts = cakePts;
    state.roundTargetPts = targetPts; state.roundShape = shapeMul > 1; state.roundSub = subtotal;
    state.roundCoins = coins; state.roundHeal = heal;
    state.coins += coins;
    state.ap += heal;
    noteBestPlay(total);
    state.score += total;
    state.stageScores[state.stage - 1] = total;
    state.inputLocked = true;
    updateUI();
    fxText(360, 330, T('particle_ap_gain', { n: heal }), '#ffb066', 44);
    if (hits > 0) fxText(360, 280, T('particle_target_bonus'), '#ffe27a', 40);
    fxText(360, 380, '+' + coins + T('coin_unit'), '#ffb724', 40);
    confetti();
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
    state.apBonus = Math.max(0, state.ap) * AP_BONUS_PTS;
    state.favMul = 1 + 0.03 * (state.run ? state.run.favUses : 0);              // おきにいりカードの倍率
    const total = Math.round((state.endBase + state.apBonus) * state.favMul);
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
        h += `<div class="fc-lab" data-i="${i}" style="left:${cakeX(i) + CAKE / 2 - 60}px;top:${LAB_Y}px"></div>`;
    }
    h += `<div class="fc-hbox" style="left:${HAND_L - 6}px;top:${HAND_Y - 16}px;width:${HAND_AREA + 12}px;height:${HAND_H + 34}px"></div>`;
    h += `<div class="bl-hint" style="display:none"></div>`;
    layer.innerHTML = h;
    FC.eq = layer.querySelector('.fc-eq'); FC.eqSpan = FC.eq.querySelector('span');
    FC.cakes = Array.from(layer.querySelectorAll('.fc-cake')); FC.labs = Array.from(layer.querySelectorAll('.fc-lab'));
    FC.chg = document.getElementById('btn-change'); FC.hint = layer.querySelector('.bl-hint');
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
        if (cx >= x - 6 && cx <= x + CAKE + 6 && cy >= CAKE_Y - 6 && cy <= LAB_Y + 110) return i;
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
    // チェンジのボタン(右パネルの下)
    FC.chg.disabled = state.ap <= 0 || state.phase !== 'PLAY' || state.inputLocked;
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
            el.innerHTML = `<div class="nm">${fracHTML(c.val)}</div>`;
            document.getElementById('bl').appendChild(el);
            el._popping = true; el.classList.add('pop');
        }
        if (!c.isDragging) {
            const tx = handX(i, n);
            c.targetX = tx; c.targetY = HAND_Y;
            c.x += (c.targetX - c.x) * 0.2; c.y += (c.targetY - c.y) * 0.2;
        }
        const cls = 'hc fc-hc t' + (c.val / UNIT_MAX >= 0.75 ? 4 : c.val / UNIT_MAX >= 0.5 ? 3 : c.val / UNIT_MAX >= 0.25 ? 2 : 1) + (c.isDragging ? ' dragging' : '') + (el._popping ? ' pop' : '');
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

// 左パネルの「もちもの」: ショップで買った能力アップの一覧
function renderItems() {
    const el = document.getElementById('disp-items'), R = state.run;
    if (!el) return;
    const l = [];
    if (R) {
        if (R.healUp) l.push(['heal', `${T('item_heal')} Lv${R.healUp}`]);
        if (R.spiceLv) l.push(['spice', `${T('item_spice')} Lv${R.spiceLv}`]);
        Object.keys(R.shapes).forEach(v => l.push(['shape', `${T('item_shape')} ${fracText(+v)}`]));
        Object.keys(R.favs).forEach(v => l.push(['fav', `${T('item_fav')} ${fracText(+v)}`]));
    }
    const sig = JSON.stringify(l) + currentLang;
    if (el._sig === sig) return;
    el._sig = sig;
    el.innerHTML = l.length ? l.map(([k, t]) => `<i class="it it-${k}">${t}</i>`).join('') : `<span class="it-none">${T('items_none')}</span>`;
}
function updateUI() {
    renderItems();
    const ap = document.getElementById('disp-ap');
    ap.textContent = state.ap;
    ap.classList.toggle('low', state.ap <= 3);
    if (fcScore._v !== state.score) {
        const first = fcScore._v === undefined;
        fcScore._v = state.score;
        fcScore.textContent = state.score;
        if (!first && state.score > 0) { fcScore.classList.remove('bump'); void fcScore.offsetWidth; fcScore.classList.add('bump'); }
    }
    // コイン・最終スコアの倍率
    const ce = document.getElementById('disp-coins'), me = document.getElementById('disp-mult');
    if (ce) { ce.textContent = state.coins; me.textContent = '×' + (1 + 0.03 * (state.run ? state.run.favUses : 0)).toFixed(2); }
    // ターゲット(カードをならべる。同じ大きさは1まいにまとめて ×まい数)
    const sig = state.targets.join(',') + '|' + UNIT_MAX + '|' + (state.run ? state.run.spiceLv : 0);
    if (FC.tsig !== sig) {
        const prevN = FC.tn || 0;
        FC.tsig = sig; FC.tn = state.targets.length;
        const uniq = [], cnt = {};
        state.targets.forEach(v => { if (!(v in cnt)) { cnt[v] = 0; uniq.push(v); } cnt[v]++; });
        const grid = document.getElementById('target-grid');
        const last = state.targets[state.targets.length - 1];
        const kind = uniq.length <= 1 ? 'n1' : uniq.length <= 4 ? 'n4' : 'n9';
        grid.className = 'tc-grid ' + kind;
        grid.innerHTML = uniq.map(v => {
            const d = document.createElement('div');
            if (kind === 'n1') { d.innerHTML = cakeSVG(UNIT_MAX); paintCake(d.firstElementChild, v, UNIT_MAX); }   // ターゲットが1まいのときだけ ケーキの絵も出す
            const isNew = state.targets.length > prevN && prevN > 0 && v === last;
            return `<div class="tc-card${isNew ? ' new' : ''}${cnt[v] > 1 ? ' dup' : ''}">${cnt[v] > 1 ? `<b class="tc-x">×${cnt[v]}</b>` : ''}${kind === 'n1' ? `<div class="tc-cake">${d.innerHTML}</div>` : ''}<div class="tc-fr">${fracHTML(v)}</div><div class="tc-pts">+${Math.round((TARGET_RATE + 0.05 * (state.run ? state.run.spiceLv : 0)) * 100 * cnt[v])}%</div></div>`;
        }).join('');
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
document.getElementById('btn-change').addEventListener('click', () => { if (canPlay()) changeHand(); });
