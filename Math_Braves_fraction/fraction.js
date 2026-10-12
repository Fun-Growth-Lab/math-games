// ぶんすう(ケーキづくり)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
//   ケーキは「n分割のいくつ」で持つ(n=UNIT_MAX=ちょうど1)。1をこえたらのこりだけが残る。
//   ケーキは3つ(難易度なし)。全部の大きさをそろえて「できあがり」ボタンを押すとステージクリア。
//   APはカードを使う・手札をチェンジするたびに1へる(0でゲームオーバー)。ステージクリアでAP回復。
//   ホール(ちょうど「1」)を作ると、そのステージのスコアが +20%。ケーキが12時をまわる(1に とどく・こえる)と、ケーキ1つにつき ステージで1回だけ AP+1。
//   点数 = 基本点(かたちごと 100+20×Lv) × ホールボーナス × ターゲットボーナス(チャンス×2 / グッド×3 / ビッグ×4 / スーパー×5)。
// 画面の寸法(ゲームエリア 720x720)。ケーキの数(CAKE_N)によって大きさが変わる
let CAKE_N = 3, CAKE = 210, CAKE_Y = 151, CAKE_GAP = 14, LAB_Y = 369, LAB_W = 124, PILL_H = 96, PILL_F = 2.3;
function setLayout(n) {
    CAKE_N = n;
    CAKE = n <= 3 ? 200 : n === 4 ? 158 : 126;
    CAKE_GAP = n <= 3 ? 16 : n === 4 ? 12 : 10;
    PILL_H = n <= 3 ? 90 : n === 4 ? 82 : 72;
    PILL_F = n <= 3 ? 2.1 : n === 4 ? 1.9 : 1.65;
    LAB_W = Math.min(124, CAKE + 8);
    const groupH = CAKE + 8 + PILL_H;
    CAKE_Y = Math.round(178 + (300 - groupH) / 2);       // 台(上178〜下478)の まん中に ケーキと札をそろえる。上の30pxは「AP+1」の札の場所
    LAB_Y = CAKE_Y + CAKE + 8;
}
function cakeX(i) { return (720 - (CAKE_N * CAKE + (CAKE_N - 1) * CAKE_GAP)) / 2 + i * (CAKE + CAKE_GAP); }
const HAND_W = 168, HAND_H = 150, HAND_GAP = 22, HAND_Y = 538, HAND_L = 20, HAND_AREA = 680;   // 手札(3まい)は大きく、ケーキの真下に

Object.assign(state, {
    ap: 10, cakes: [0, 0, 0], targetVal: 0, targetMul: 2, targetTier: 0, wholes: 0, apGot: [],
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
    document.getElementById('sp-diff').textContent = STAR_MAX > 1 ? '★'.repeat(state.star) + ' ' + T(['diff_easy', 'diff_normal', 'diff_hard'][state.star - 1]) : '';
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
    setLayout(CONFIG.cakes || 3);
    state.ap = CONFIG.startAp || 10; state.cakes = Array(CAKE_N).fill(0); state.apGot = [];
    state.wholes = 0; state.cards = []; state.dragInfo = null; state.lastEq = '';
    state.inputLocked = false; state.phase = 'IDLE';
    state.endBase = 0; state.apBonus = 0; state.roundBase = 0; state.roundHole = 1; state.roundTarget = 1; state.roundTier = 0; state.roundWholes = 0; state.roundHit = false;
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
    state.targetVal = types[getRandomInt(0, types.length - 1)];      // ターゲットの大きさ
    // ターゲットの倍率(×2〜×5)。1ステージ目は かならず ×2
    state.targetMul = TARGET_TIERS[0].mul; state.targetTier = 0;
    if (n > 1) {
        let r = Math.random() * TARGET_TIERS.reduce((a, t) => a + t.w, 0);
        for (let i = 0; i < TARGET_TIERS.length; i++) { r -= TARGET_TIERS[i].w; if (r < 0) { state.targetMul = TARGET_TIERS[i].mul; state.targetTier = i; break; } }
    }
    if (n === 1 || !state.formLv) state.formLv = Array(UNIT_MAX + 1).fill(0);   // かたち(1/n〜n/n)ごとの Lv。RUNのあいだ つづく
    state.wholes = 0;                                       // このステージで作ったホールの数
    const start = types.filter(v => v < UNIT_MAX);          // はじめのケーキは ちょうど1でない大きさ
    do { state.cakes = Array.from({ length: CAKE_N }, () => start[getRandomInt(0, start.length - 1)]); }
    while (aligned());
    state.apGot = [];                                       // ケーキごとの「ホールでAP+1」は ステージで1回ずつ
    if (n === 1 || !state.cards.length) fillHand();
    state.phase = 'PLAY';
    clearFcLayer(true);
    fcInit();
    updateStageLabel();
    updateUI();
    document.getElementById('game-area').style.setProperty('--sc', STAGE_THEMES[Math.min(n, STAGE_COUNT) - 1].c);
}

function formPts(v) { return BASE_PTS + FORM_LV_PTS * ((state.formLv && state.formLv[v]) || 0); }
// 左パネルの「きほんてん」表: かたち(ケーキの図)ごとの基本点。Lvが上がると ふえる。いつも見える
function renderForms() {
    const box = document.getElementById('form-grid');
    if (!box || !state.formLv) return;
    const sig = state.formLv.join(',') + '|' + UNIT_MAX + '|' + state.targetVal + '|' + currentLang;
    if (FC.fsig === sig) return;
    FC.fsig = sig;
    let h = '';
    for (let v = 1; v <= UNIT_MAX; v++) {
        const lv = state.formLv[v] || 0;
        const d = document.createElement('div'); d.innerHTML = cakeSVG(UNIT_MAX); paintCake(d.firstElementChild, v, UNIT_MAX);
        const p = fracParts(v);
        const name = v === UNIT_MAX ? '1' : p.n + '/' + p.d;
        h += '<div class="fm-chip' + (v === state.targetVal ? ' tgt' : '') + (lv ? ' up' : '') + '" style="--cc:' + sizeColor(v) + '"><div class="fm-pie">' + d.innerHTML + '</div><div class="fm-txt"><span class="fm-n">' + name + '</span><b class="fm-pts">' + formPts(v) + '</b></div>' + (lv ? '<em class="fm-lv">Lv' + lv + '</em>' : '') + '</div>';
    }
    box.className = 'form-grid n' + UNIT_MAX;
    box.innerHTML = h;
}
function aligned() { const c = state.cakes; return c.length > 0 && c[0] > 0 && c.every(v => v === c[0]); }

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
    state.cakes[cakeIdx] = next;
    const cx = cakeX(cakeIdx) + CAKE / 2, cy = CAKE_Y + CAKE / 2;
    burst(cx, cy, '#ffd24a', 14);
    if (one) {
        fxText(cx, cy - 40, T('particle_whole'), '#ff9a7a', 42);   // ちょうど「1」(ホール)
        burst(cx, cy, '#7cbaf0', 22);
        state.wholes++;                                            // ホール: このステージのスコア +20%
        fxText(cx, cy - 90, '×' + (1 + WHOLE_RATE * state.wholes).toFixed(1), '#ffc43a', 38);
    }
    if (raw >= UNIT_MAX && !state.apGot[cakeIdx]) {                // 12時をまわった(ちょうど でも こえても): ケーキ1つにつき ステージで1回 AP +1
        state.apGot[cakeIdx] = true;
        state.ap += AP_WHOLE_HEAL;
        setTimeout(() => fxText(cx, cy + 10, 'AP +' + AP_WHOLE_HEAL, '#2a68b0', 40), 150);
    }
    state.cards[cardIdx] = makeCard(cardIdx);
    state.cards[cardIdx]._fresh = true;
    state.ap--;
    updateUI();
    // そろっても じどうでは クリアしない: 「できあがり」ボタンを自分で押す(そろったまま ホール稼ぎをつづけてもよい)
    checkGameOver();
}
function changeHand() {
    if (state.ap <= 0 || !canPlay()) return;
    state.ap--;
    fillHand();
    state.cards.forEach(c => { c._fresh = true; burst(c.x + c.w / 2, c.y + c.h / 2, '#f4c6d4', 6); });
    updateUI();
    checkGameOver();
}
// 「できあがり」ボタン: ケーキが ぜんぶそろっているときだけ
function finishStage() {
    if (!canPlay() || !aligned()) return;
    state.phase = 'CLEAR_WAIT';
    roundClear();
}
function checkGameOver() {
    if (state.ap <= 0 && !aligned() && state.phase === 'PLAY') {
        state.phase = 'OVER_WAIT';
        setTimeout(() => { if (state.screen === 'PLAYING') finishRun(false); }, 900);
    }
}

function roundClear() {
    if (state.screen !== 'PLAYING') return;
    const hit = state.cakes[0] === state.targetVal;                           // ターゲットの大きさでそろった
    const holeMul = 1 + WHOLE_RATE * state.wholes;                            // ホールボーナス
    const tMul = hit ? state.targetMul : 1;                                   // ターゲットボーナス
    const form = state.cakes[0];                                              // そろえたかたち
    const base = formPts(form);                                               // かたちの基本点(100 + 20×Lv)
    const total = Math.round(base * holeMul * tMul);                          // 基本点 × ホール × ターゲット
    const heal = CONFIG.apHeal;
    state.roundBase = base; state.roundHole = holeMul; state.roundTarget = tMul; state.roundTier = state.targetTier; state.roundWholes = state.wholes; state.roundHit = hit;
    state.roundHeal = heal;
    // かたちのLvアップ: そろえたかたち +2Lv / ほかのかたち(ランダム1つ) +1Lv
    const others = [];
    for (let v = 1; v <= UNIT_MAX; v++) if (v !== form) others.push(v);
    const pick = others.length ? others[getRandomInt(0, others.length - 1)] : 0;
    state.roundUp = [{ v: form, lv: FORM_UP_CLEAR }];
    if (pick) state.roundUp.push({ v: pick, lv: FORM_UP_RANDOM });
    state.roundUp.forEach(u => { state.formLv[u.v] = (state.formLv[u.v] || 0) + u.lv; });
    state.ap += heal;
    noteBestPlay(total);
    state.score += total;
    state.stageScores[state.stage - 1] = total;
    state.inputLocked = true;
    updateUI();
    completeFx(total, heal);
    setTimeout(() => {
        if (state.screen !== 'PLAYING') return;
        if (state.stage >= CONFIG.maxRound) { finishRun(true); return; }
        showStageClear(state.stage, total);
    }, 1500);
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
    if (FC.ready && FC.table && layer.contains(FC.table)) return;
    let h = `<div class="fc-table"></div>`;
    for (let i = 0; i < CAKE_N; i++) {
        h += `<div class="fc-cake" data-i="${i}" style="left:${cakeX(i)}px;top:${CAKE_Y}px;width:${CAKE}px;height:${CAKE}px">${cakeSVG(CONFIG.gridDiv)}</div>`;
        h += `<div class="fc-lab" data-i="${i}" style="left:${cakeX(i) + CAKE / 2 - LAB_W / 2}px;top:${LAB_Y}px;width:${LAB_W}px;--ph:${PILL_H}px;--pf:${PILL_F}rem"></div>`;
        h += `<div class="fc-apb" data-i="${i}" style="left:${cakeX(i) + CAKE / 2 - 31}px;top:${CAKE_Y - 30}px;width:62px;text-align:center">AP+${AP_WHOLE_HEAL}</div>`;
    }
    h += `<div class="fc-hbox" style="left:${HAND_L - 6}px;top:${HAND_Y - 24}px;width:${HAND_AREA + 12}px;height:${HAND_H + 40}px"></div>`;
    h += `<div class="fc-tag t-cake">${T('tag_cake')}</div><div class="fc-tag t-hand" style="top:${HAND_Y - 44}px">${T('tag_hand')}</div>`;
    h += `<div class="bl-hint" style="display:none"></div>`;
    layer.innerHTML = h;
    FC.table = layer.querySelector('.fc-table');
    FC.cakes = Array.from(layer.querySelectorAll('.fc-cake')); FC.labs = Array.from(layer.querySelectorAll('.fc-lab'));
    FC.apb = Array.from(layer.querySelectorAll('.fc-apb'));
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
// できあがりの演出: ケーキが順にポンッとはね、輪とキラキラが広がり、台を光がさっと走って、点数がふわっと上がる
function completeFx(total, heal) {
    const layer = document.getElementById('bl');
    const add = (cls, css, text) => {
        if (!layer) return null;
        const el = document.createElement('i');
        el.className = cls; el.style.cssText = css;
        if (text) el.textContent = text;
        el.addEventListener('animationend', () => el.remove());
        layer.appendChild(el);
        return el;
    };
    const cols = ['#ffd24a', '#fff6c0', '#8cc4f6', '#ffa84a', '#ffffff'];
    document.querySelectorAll('.fc-cake').forEach((el, i) => {
        el.style.setProperty('--i', i);
        el.classList.add('done');
        const cx = cakeX(i) + CAKE / 2, cy = CAKE_Y + CAKE / 2, t = i * 0.12;
        add('fx-ring', `left:${cx}px;top:${cy}px;width:${CAKE}px;height:${CAKE}px;animation-delay:${t + 0.1}s`);
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + Math.random() * 0.4, d = CAKE * 0.55 + Math.random() * 40;
            add('fx-star', `left:${cx}px;top:${cy}px;color:${cols[(i + k) % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--s:${0.7 + Math.random() * 0.7};animation-delay:${t + 0.1}s`);
        }
    });
    add('fx-sweep', '');
    add('fx-score', `left:360px;top:${CAKE_Y + CAKE / 2}px;animation-delay:.35s`, '+' + total);
    if (heal) add('fx-heal', `left:360px;top:60px;animation-delay:.6s`, 'AP +' + heal);
}

// カードを持っているとき、どのケーキの上にいるか
function overCake(c) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    for (let i = 0; i < CAKE_N; i++) {
        const x = cakeX(i);
        if (cx >= x - 6 && cx <= x + CAKE + 6 && cy >= CAKE_Y - 6 && cy <= LAB_Y + PILL_H + 20) return i;
    }
    return -1;
}

function renderFc() {
    fcInit();
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
    const ok = aligned();                                 // ぜんぶ そろった
    for (let i = 0; i < CAKE_N; i++) {
        const el = FC.cakes[i], v = state.cakes[i];
        if (el._v !== v) { el._v = v; paintCake(el.firstElementChild, v, CONFIG.gridDiv); FC.labs[i].style.setProperty('--cc', sizeColor(v)); FC.labs[i].innerHTML = `<div class="pill">${fracHTML(v)}</div>`; }
        el.classList.toggle('over', i === ov);
        FC.labs[i].classList.toggle('over', i === ov);
        FC.apb[i].classList.toggle('used', !!state.apGot[i]);
        el.classList.toggle('match', ok);
    }
    // 右下のボタン: そろったら「できあがり」、ふだんは「チェンジ」
    const mode = ok ? 'done' : 'change';
    if (FC.chg._m !== mode || FC.chg._lang !== currentLang) {
        FC.chg._m = mode; FC.chg._lang = currentLang;
        FC.chg.classList.toggle('done', ok);
        FC.chg.querySelector('b').textContent = T(ok ? 'fc_done' : 'fc_change');
        FC.chg.querySelector('small').textContent = ok ? '' : T('fc_change_sub');
    }
    FC.chg.disabled = state.phase !== 'PLAY' || state.inputLocked || (!ok && state.ap <= 0);
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
            el.style.setProperty('--cc', sizeColor(c.val));
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
        const cls = 'hc fc-hc' + (c.isDragging ? ' dragging' : '') + (el._popping ? ' pop' : '');
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
    // APがすくないときは 画面ぜんたいが アラート(赤くてんめつ)
    const layerEl = document.getElementById('game-layer');
    const playing = state.screen === 'PLAYING';
    layerEl.classList.toggle('ap-warn', playing && state.ap <= 3 && state.ap > 1);
    layerEl.classList.toggle('ap-crit', playing && state.ap <= 1);
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
    renderForms();
    // ホールボーナス: ホールの数と 倍率
    const hn = document.getElementById('disp-hole-count'), hm = document.getElementById('disp-hole-mul');
    if (hn) { hn.textContent = state.wholes; hm.textContent = '×' + (1 + WHOLE_RATE * state.wholes).toFixed(1); }
    // ターゲット: ケーキの絵と分数。名前と ばいりつ(×2〜×5)を言葉と色で
    const sig = state.targetVal + '|' + state.targetMul + '|' + UNIT_MAX + '|' + currentLang;
    if (FC.tsig !== sig) {
        FC.tsig = sig;
        const v = state.targetVal;
        const d = document.createElement('div'); d.innerHTML = cakeSVG(UNIT_MAX); paintCake(d.firstElementChild, v, UNIT_MAX);
        const grid = document.getElementById('target-grid');
        grid.innerHTML = `<div class="tc-card new" style="--cc:${sizeColor(v)}"><div class="tc-cake">${d.innerHTML}</div><div class="tc-fr">${fracHTML(v)}</div></div>`;
        const area = document.getElementById('card-target');
        area.className = 'fc-tarea tier-' + state.targetMul;
        document.getElementById('disp-target-name').innerHTML = `<span>${T(TARGET_TIERS[state.targetTier].key).replace(/^(スーパー)/, '$1<br>')}</span><b>×${state.targetMul}</b>`;
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
document.getElementById('btn-change').addEventListener('click', () => { if (!canPlay()) return; if (aligned()) finishStage(); else changeHand(); });
