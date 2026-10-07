// かけざん2(まるっこいモンスター)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)。
// ルールは元のかけざん2と同じ: 手札のカードをまん中の「ばのカード」にかさねて かけざん → 101いじょうで てきにこうげき(ダメージ=ばのカードの数)。
// こうげきするとアクションが1へる。てきのHP=(ラウンド+4)×(50×ラウンド+hpBase)、アクション=ラウンド+4。ラウンドをクリアするとアイテムが1つ。
// ステージ制RUN(ラウンド=ステージ)の画面は braves-run.js が受け持つ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };

// 画面の寸法(ゲームエリア 720x720)
const FIELD_X = 360, FIELD_Y = 458, FIELD_W = 120, FIELD_H = 160;     // ばのカード(中心の座標)
const HAND_Y = 612, HAND_W = 90, HAND_H = 130, HAND_SP = 110;         // 手札(中心の座標)
const ENEMY_CX = 360, HP_BAR_Y = 306, HP_BAR_W = 300;

Object.assign(state, {
    round: 1, actionCount: 0, enemy: null, field: null, items: {}, phase: 'IDLE', itemKey: null, lootKey: null,
    maxDamage: 0, dragCard: null, dragOffset: { x: 0, y: 0 }, fx: [],
    controlMode: (() => { try { return localStorage.getItem('math_braves_control_mode') || 'drag'; } catch (e) { return 'drag'; } })()
});
ITEM_KEYS.forEach(k => { state.items[k] = 0; });

// ---- ゲーム画面以外のポップアップ(アイテムを使うかの確認) ----
document.getElementById('container').insertAdjacentHTML('beforeend', `
    <div id="item-popup" class="dg-ov hidden">
        <div class="dg-box">
            <div id="item-popup-icon" class="ip-icon"></div>
            <div id="item-popup-name" class="ip-name"></div>
            <div id="item-popup-desc" class="ip-desc"></div>
            <div class="dg-btns"><button id="item-popup-use" class="rs-mini orange" data-i18n="btn_use">つかう</button><button id="item-popup-cancel" class="rs-mini" data-i18n="btn_cancel">やめる</button></div>
        </div>
    </div>`);

function itemName(key) { return T(`item_${key}_name`); }
function itemDesc(key) { return T(`item_${key}_desc`); }
function randHand() { return HAND_VALUES[Math.floor(Math.random() * HAND_VALUES.length)]; }

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

// ---- エフェクト ----
function fxLayer() { return document.getElementById('bl'); }
function fxText(x, y, text, color, size) {
    const layer = fxLayer();
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fx-t';
    el.style.cssText = `left:${x}px;top:${y}px;font-size:${size || 30}px;color:${color};`;
    el.innerHTML = emo(text);
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
    state.fx.push(Date.now() + 1100);
}
function fxRing(x, y, color, size) {
    const layer = fxLayer();
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fx-r';
    const s = size || 260;
    el.style.cssText = `left:${x}px;top:${y}px;border-color:${color};width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;`;
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}

// ============================================================
//  ゲームの進行
// ============================================================
function makeHandCard(i) {
    const x = (state.width - 5 * HAND_SP) / 2 + HAND_SP / 2 + i * HAND_SP;
    return { value: randHand(), x: x, y: HAND_Y, width: HAND_W, height: HAND_H, targetX: x, targetY: HAND_Y, isDragging: false, isSelected: false, _fresh: true };
}
function setFieldCard() {
    state.field = { value: Math.floor(Math.random() * 8) + 2, x: FIELD_X, y: FIELD_Y, width: FIELD_W, height: FIELD_H, scale: 1.0, alpha: 1 };
}

// ---- ステージ制RUNとの受けわたし ----
// ラウンド=ステージ。アクションはラウンドごとに「ラウンド+4」に戻る(元のルールのまま)ので、ステージクリアの回復はない
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
    initGame();
    state.runMode = true;
    startStage(1);
}
function startStage(n) {
    state.stage = n; state.round = n;
    const hp = (n + 4) * (50 * n + CONFIG.hpBase);
    state.actionCount = n + 4;
    state.enemy = { hp: hp, maxHp: hp, shake: 0, shown: hp, round: n, _built: false };
    state.cards = [0, 1, 2, 3, 4].map(makeHandCard);
    setFieldCard();
    state.dragCard = null;
    state.stageStartScore = state.score;
    state.phase = 'PLAY';
    state.lootKey = null;
    clearFieldLayer(true);
    const area = document.getElementById('game-area');
    area.style.setProperty('--sc', STAGE_THEMES[n - 1].c);
    area.classList.toggle('bossfield', n === STAGE_COUNT);
    updateStageLabel();
    updateUI();
    addLog(T('stage_log', { n: n, name: stageName(n) }));
    if (state.tutorial) { state.inputLocked = false; return; }   // チュートリアルのときはステージ演出を出さない
    state.inputLocked = true;
    showStageIntro(n, () => { state.inputLocked = false; });
}

function backToTitle() {
    state.screen = 'TITLE';
    hideAllOverlays();
    document.getElementById('item-popup').classList.add('hidden');
    ui.title.classList.remove('hidden');
    ui.btnToTitle.classList.add('hidden');
    ui.rightPanelContent.classList.add('invisible');
    clearFieldLayer(true);
    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0; state.maxDamage = 0;
    state.round = 1; state.stage = 1; state.runMode = false; state.stageStartScore = 0; state.stageScores = [];
    ITEM_KEYS.forEach(k => { state.items[k] = 0; });
    state.itemKey = null; state.lootKey = null; state.tutorial = false;
    state.cards = [0, 1, 2, 3, 4].map(makeHandCard);
    state.enemy = null; state.field = null; state.dragCard = null; state.fx = [];
    state.isGameOverProcessing = false; state.inputLocked = false; state.dragInfo = null;
    state.phase = 'IDLE';
    hideAllOverlays();
    clearFieldLayer(true);
    const log = document.getElementById('battle-log-entries'); if (log) log.innerHTML = '';
    renderItemList();
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    startLoop();
}

// ---- かけざんとこうげき ----
function mergeCard(card) {
    card.isSelected = false;
    const f = state.field;
    const before = f.value;
    f.value *= card.value;
    f.scale = 1.5;
    fxRing(f.x, f.y, '#ffd24a', 200);
    fxText(f.x, f.y - 80, `×${card.value}`, '#ff8a6a', 40);
    card.value = randHand();
    card.isDragging = false;
    card._fresh = true;
    card.x = card.targetX; card.y = card.targetY;
    if (f.value > ATTACK_LINE) triggerAttack();
}
function triggerAttack() {
    state.phase = 'ATTACKING';
    state.actionCount--;
}
function applyDamage(damage, resetField = true) {
    if (!state.enemy) return;
    const en = state.enemy;
    en.hp -= damage;
    en.shake = 20;
    state.score += damage;
    if (damage > state.maxDamage) state.maxDamage = damage;
    fxRing(ENEMY_CX, 150, '#ff5a4a', 300);
    fxText(ENEMY_CX, 150, `-${damage}`, '#ff6a5a', 56);
    addLog(T('fd_log_attack', { n: damage }));
    if (en._mon) { en._mon.classList.remove('hit'); void en._mon.offsetWidth; en._mon.classList.add('hit'); }
    if (en.hp <= 0) {
        en.hp = 0;
        onRoundCleared();
    } else if (state.actionCount <= 0) {
        state.phase = 'GAMEOVER_WAIT';
        setTimeout(() => { if (state.screen === 'PLAYING') finishRun(false); }, 900);
    } else {
        if (resetField) setFieldCard();
        state.phase = 'PLAY';
    }
    updateUI();
}
function onRoundCleared() {
    state.phase = 'CLEAR_WAIT';
    const st = state.round;
    state.stageScores[st - 1] = state.score - state.stageStartScore;
    if (state.enemy._el) state.enemy._el.classList.add('dead');
    if (st >= MAX_ROUND) {
        setTimeout(() => { if (state.screen === 'PLAYING') finishRun(true); }, 1100);
        return;
    }
    // クリアすると、ランダムなアイテムが1つもらえる
    const key = ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)];
    state.items[key]++;
    state.lootKey = key;
    addLog(T('fd_log_loot', { icon: itemImgTag(key, 16), name: itemName(key) }));
    renderItemList();
    state.inputLocked = true;
    setTimeout(() => { if (state.screen === 'PLAYING') showStageClear(st, state.stageScores[st - 1]); }, 1000);
}

// ---- RUNの結果 ----
function finishRun(cleared) {
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    ui.btnToTitle.classList.add('hidden');
    if (state.stageScores[state.round - 1] === undefined) state.stageScores[state.round - 1] = state.score - state.stageStartScore;
    const bonus = cleared ? state.actionCount * 1000 : 0;       // のこりアクション×1000点
    const finalScore = state.score + bonus;
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, finalScore, state.round, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, finalScore, isNewRecord, bonus, 0);
}
function gameOver() { finishRun(false); }
function gameClear() { finishRun(true); }

// ---- アイテム ----
function renderItemList() {
    const el = document.getElementById('item-list');
    if (!el) return;
    const owned = ITEM_KEYS.filter(k => state.items[k] > 0);
    if (!owned.length) { el.innerHTML = `<div class="no-item">${T('fd_no_items')}</div>`; return; }
    el.innerHTML = '';
    owned.forEach(k => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `<span class="item-icon">${itemImgTag(k, 26)}</span><span class="item-name">${itemName(k)}</span><span class="item-count">×${state.items[k]}</span>`;
        const open = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } openItemConfirm(k); };
        row.addEventListener('click', open);
        row.addEventListener('touchstart', open, { passive: false });
        el.appendChild(row);
    });
}
function openItemConfirm(key) {
    if (state.phase !== 'PLAY' || state.inputLocked) return;
    state.itemKey = key;
    document.getElementById('item-popup-icon').innerHTML = itemImgTag(key, 60);
    document.getElementById('item-popup-name').textContent = itemName(key);
    document.getElementById('item-popup-desc').innerText = itemDesc(key);
    document.getElementById('item-popup').classList.remove('hidden');
    state.phase = 'ITEM_POPUP';
}
function confirmItemUse(doUse) {
    document.getElementById('item-popup').classList.add('hidden');
    const key = state.itemKey;
    state.itemKey = null;
    state.phase = 'PLAY';
    if (doUse && key) useItem(key);
}
function useItem(key) {
    if (state.items[key] <= 0) return;
    state.items[key]--;
    renderItemList();
    fxText(state.width / 2, 250, T('fd_used', { name: itemName(key) }), '#ffe27a', 36);
    addLog(T('fd_log_item', { icon: itemImgTag(key, 16), name: itemName(key) }));
    const f = state.field;
    switch (key) {
        case 'change': state.cards.forEach(c => { c.value = randHand(); c._fresh = true; }); break;
        case 'action_plus': state.actionCount++; break;
        case 'x20':
            f.value *= 20; f.scale = 2.0;
            if (f.value > ATTACK_LINE) { state.phase = 'ITEM_WAIT'; setTimeout(() => { if (state.screen === 'PLAYING') triggerAttack(); }, 600); }
            break;
        case 'damage_500': if (state.enemy) applyDamage(500, false); break;
        case 'all_plus_5': state.cards.forEach(c => { c.value += 5; c._fresh = true; }); break;
    }
    updateUI();
}
bindBtn(document.getElementById('item-popup-use'), () => confirmItemUse(true));
bindBtn(document.getElementById('item-popup-cancel'), () => confirmItemUse(false));

// ============================================================
//  画面の描画(DOM)
// ============================================================
const FD = { ready: false };

function fdInit() {
    const layer = document.getElementById('bl');
    if (FD.ready && FD.ap && layer.contains(FD.ap)) return;
    layer.innerHTML = `
        <div class="bl-ap"><span class="lb">${T('fd_ap_circle')}</span><span class="nm">0</span></div>
        <div class="fd-enemy"><div class="gnd"></div><div class="rw"></div><div class="hp"><div class="fl"></div><div class="tx"></div></div></div>
        <div class="fd-field"><div class="nm"></div><div class="almost"></div></div>
        <div class="bl-hint" style="display:none"></div>`;
    FD.ap = layer.querySelector('.bl-ap');
    FD.apNum = FD.ap.querySelector('.nm');
    FD.apLb = FD.ap.querySelector('.lb');
    FD.ap.addEventListener('animationend', (e) => { if (e.animationName === 'apGain') FD.ap.classList.remove('gain'); });
    FD.enemyEl = layer.querySelector('.fd-enemy');
    FD.rw = FD.enemyEl.querySelector('.rw');
    FD.hp = FD.enemyEl.querySelector('.hp');
    FD.fl = FD.enemyEl.querySelector('.fl');
    FD.tx = FD.enemyEl.querySelector('.tx');
    FD.gnd = FD.enemyEl.querySelector('.gnd');
    FD.field = layer.querySelector('.fd-field');
    FD.fieldNm = FD.field.querySelector('.nm');
    FD.almost = FD.field.querySelector('.almost');
    FD.hint = layer.querySelector('.bl-hint');
    FD.hand = []; FD.handSig = []; FD.lastAp = -1; FD.enemyRound = 0; FD.fieldSig = '';
    FD.ready = true;
}
function clearFieldLayer() {
    const layer = document.getElementById('bl');
    if (layer) layer.innerHTML = '';
    FD.ready = false; FD.hand = []; FD.handSig = [];
    if (state.enemy) { state.enemy._built = false; }
    const area = document.getElementById('game-area');
    if (area) area.classList.remove('bossfield');
}

// てき1体を作る(ロボ・HPバー・ボスのしるし)
function buildEnemy() {
    const en = state.enemy;
    const boss = en.round === STAGE_COUNT;
    const size = boss ? 160 : 156;
    FD.enemyEl.className = 'fd-enemy';
    FD.rw.innerHTML = `<div class="mon${boss ? ' boss' : ''}" style="--c:${ROUND_COLORS[(en.round - 1) % ROUND_COLORS.length]}">${boss ? bossHTML() : monHTML(en.round - 1)}</div>`;
    en._mon = FD.rw.querySelector('.mon');
    en._el = FD.enemyEl;
    en._mon.addEventListener('animationend', (e) => { if (e.animationName === 'monHit') en._mon.classList.remove('hit'); });
    FD.hp.style.cssText = `left:${ENEMY_CX - HP_BAR_W / 2}px;top:${HP_BAR_Y}px;width:${HP_BAR_W}px;height:24px;`;
    FD.gnd.style.cssText = `left:${ENEMY_CX - 90}px;top:${HP_BAR_Y - 34}px;width:180px;`;
    let bl = FD.enemyEl.querySelector('.bosslbl');
    if (bl) bl.remove();
    if (boss) {
        bl = document.createElement('div');
        bl.className = 'bosslbl';
        bl.style.cssText = `left:${ENEMY_CX - HP_BAR_W / 2 - 8}px;top:${HP_BAR_Y - 1}px;`;
        bl.textContent = 'BOSS';
        FD.enemyEl.appendChild(bl);
    }
    en._built = true;
    en.shown = en.hp;
}

function fieldNumSize(v) {
    const n = String(v).length;
    return n <= 2 ? 66 : n === 3 ? 54 : n === 4 ? 42 : n === 5 ? 34 : 28;
}
function handHTML(c) {
    const n = String(c.value).length;
    return `<div class="nm" style="font-size:${n <= 1 ? 56 : n === 2 ? 48 : 36}px">${c.value}</div>`;
}
// ばのカードの上にカードを持ってきたとき、どうなるか
function dragHint(c) {
    const f = state.field;
    if (!f) return null;
    if (Math.hypot(c.x - f.x, c.y - f.y) < 80 && state.phase === 'PLAY') {
        const p = f.value * c.value;
        if (p > ATTACK_LINE) return { cls: 'hit', field: true, text: T('hint_hit', { n: p }) };
        return { cls: '', field: true, text: `${f.value} × ${c.value} = ${p}` };
    }
    return null;
}

function renderField() {
    fdInit();
    const en = state.enemy, f = state.field;
    if (en && !en._built) buildEnemy();
    // アクションの数
    const lb = T('fd_ap_circle');
    if (FD.apLb._t !== lb) { FD.apLb._t = lb; FD.apLb.textContent = lb; }
    if (FD.lastAp !== state.actionCount) {
        if (FD.lastAp >= 0 && state.actionCount > FD.lastAp) { FD.ap.classList.remove('gain'); void FD.ap.offsetWidth; FD.ap.classList.add('gain'); }
        FD.lastAp = state.actionCount;
        FD.apNum.textContent = state.actionCount;
        FD.ap.classList.toggle('low', state.actionCount <= 1);
    }
    // てき
    if (en) {
        FD.enemyEl.style.display = '';
        const shakeX = en.shake > 0 ? (Math.random() - 0.5) * en.shake : 0;
        FD.enemyEl.style.transform = `translateX(${shakeX}px)`;
        if (en.shake > 0) en.shake--;
        en.shown += (en.hp - en.shown) * 0.2;
        if (Math.abs(en.hp - en.shown) < 1) en.shown = en.hp;
        const pct = Math.max(0, en.shown / en.maxHp);
        FD.fl.style.width = (pct * 100) + '%';
        const c = pct > 0.5 ? '' : pct > 0.2 ? 'mid' : 'low';
        if (FD.fl._c !== c) { FD.fl._c = c; FD.fl.className = 'fl' + (c ? ' ' + c : ''); }
        const tx = `${Math.max(0, Math.ceil(en.shown))} / ${en.maxHp}`;
        if (FD.tx._t !== tx) { FD.tx._t = tx; FD.tx.textContent = tx; }
    } else {
        FD.enemyEl.style.display = 'none';
    }
    // ばのカード
    if (f) {
        const fs = f.value + '|' + (f.value >= 80 && f.value <= ATTACK_LINE && state.phase === 'PLAY' ? 1 : 0);
        if (FD.fieldSig !== fs) {
            FD.fieldSig = fs;
            FD.fieldNm.textContent = f.value;
            FD.fieldNm.style.fontSize = fieldNumSize(f.value) + 'px';
            const hot = f.value >= 80 && f.value <= ATTACK_LINE && state.phase === 'PLAY';
            FD.field.classList.toggle('hot', hot);
            FD.almost.textContent = hot ? T('canvas_almost') : '';
        }
        FD.field.style.display = f.alpha > 0 ? '' : 'none';
        FD.field.style.opacity = f.alpha;
        FD.field.style.transform = `translate(${f.x - f.width / 2}px,${f.y - f.height / 2}px) scale(${f.scale})`;
    } else {
        FD.field.style.display = 'none';
    }
    // 手札
    const drag = state.dragCard;
    const hint = drag ? dragHint(drag) : null;
    FD.field.classList.toggle('tgt', !!(hint && hint.field));
    for (let i = 0; i < 5; i++) {
        const c = state.cards[i];
        let el = FD.hand[i];
        if (!c) { if (el) { el.remove(); FD.hand[i] = null; } continue; }
        if (!el) {
            el = document.createElement('div');
            el.addEventListener('animationend', () => { el._popping = false; el.classList.remove('pop'); });
            FD.hand[i] = el;
            document.getElementById('bl').appendChild(el);
            el.style.width = c.width + 'px'; el.style.height = c.height + 'px';
            FD.handSig[i] = '';
        }
        const sg = c.value + '|' + c.width;
        if (FD.handSig[i] !== sg || el._card !== c) { FD.handSig[i] = sg; el._card = c; el.innerHTML = handHTML(c); }
        const cls = 'hc fh' + (c.isDragging ? ' dragging' : '') + (c.isSelected ? ' sel' : '');
        if (el._cls !== cls) { el._cls = cls; el.className = cls + (el._popping ? ' pop' : ''); }
        if (c._fresh) { c._fresh = false; el._popping = true; el.classList.add('pop'); }
        el.style.transform = `translate(${c.x - c.width / 2}px,${c.y - c.height / 2}px)${c.isDragging ? ' scale(1.1)' : ''}`;
    }
    // ドラッグ中の吹き出し
    if (hint && drag) {
        const hx = Math.max(95, Math.min(state.width - 95, drag.x));
        const hy = Math.max(44, drag.y - drag.height / 2 - 14);
        FD.hint.style.display = '';
        FD.hint.style.left = hx + 'px'; FD.hint.style.top = hy + 'px';
        if (FD.hint._t !== hint.text) { FD.hint._t = hint.text; FD.hint.innerHTML = emo(hint.text); }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (FD.hint.className !== hc) FD.hint.className = hc;
    } else if (FD.hint.style.display !== 'none') {
        FD.hint.style.display = 'none';
    }
}

function updateUI() {
    if (dgScore._v !== state.score) {
        const first = dgScore._v === undefined;
        dgScore._v = state.score;
        dgScore.textContent = state.score;
        if (!first && state.score > 0) { dgScore.classList.remove('bump'); void dgScore.offsetWidth; dgScore.classList.add('bump'); }
    }
    document.getElementById('disp-max-score').textContent = state.maxDamage;
}
const dgScore = document.getElementById('disp-total-score');

function updateFrame() {
    state.cards.forEach(c => {
        if (c && !c.isDragging) { c.x += (c.targetX - c.x) * 0.2; c.y += (c.targetY - c.y) * 0.2; }
    });
    const f = state.field;
    if (state.phase === 'ATTACKING' && f) {
        f.y -= 15; f.alpha -= 0.05;
        if (f.alpha <= 0) { f.alpha = 0; state.phase = 'HIT'; applyDamage(f.value); }
    } else if (f && f.scale > 1.0) {
        f.scale = Math.max(1.0, f.scale - 0.05);
    }
    const now = Date.now();
    state.fx = state.fx.filter(t => t > now);
}
function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }
    updateFrame();
    renderField();
    requestAnimationFrame(gameLoop);
}

// ============================================================
//  入力(ドラッグ / ダブルタップ / シングルタップ)
// ============================================================
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e;
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    if (isMobileRotated) {
        return { x: y * (canvas.height / rect.width), y: canvas.height - x * (canvas.width / rect.height) };
    }
    return { x: x * (canvas.width / rect.width), y: y * (canvas.height / rect.height) };
}
function findCardAt(pos) {
    for (let i = state.cards.length - 1; i >= 0; i--) {
        const c = state.cards[i];
        if (c && pos.x >= c.x - c.width / 2 && pos.x <= c.x + c.width / 2 && pos.y >= c.y - c.height / 2 && pos.y <= c.y + c.height / 2) return c;
    }
    return null;
}
function clearCardSelection() { state.cards.forEach(c => { if (c) c.isSelected = false; }); }
function canPlay() { return state.screen === 'PLAYING' && state.phase === 'PLAY' && !state.inputLocked; }

function onDragStart(e) {
    if (state.controlMode !== 'drag' || !canPlay()) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const card = findCardAt(pos);
    if (card) {
        state.dragCard = card;
        card.isDragging = true;
        state.dragOffset.x = pos.x - card.x;
        state.dragOffset.y = pos.y - card.y;
    }
}
function onDragMove(e) {
    if (state.controlMode !== 'drag' || !state.dragCard) return;
    e.preventDefault();
    const pos = getEventPos(e);
    state.dragCard.x = pos.x - state.dragOffset.x;
    state.dragCard.y = pos.y - state.dragOffset.y;
}
function onDragEnd() {
    if (state.controlMode !== 'drag' || !state.dragCard) return;
    const card = state.dragCard, f = state.field;
    const dist = Math.hypot(card.x - f.x, card.y - f.y);
    state.dragCard = null;
    if (dist < 80 && canPlay()) mergeCard(card);
    else card.isDragging = false;
}
let lastTapCard = null, lastTapTime = 0;
function onTap(e) {
    if (state.controlMode === 'drag' || !canPlay()) return;
    const card = findCardAt(getEventPos(e));
    if (!card) return;
    if (state.controlMode === 'singletap') {
        clearCardSelection();
        mergeCard(card);
    } else if (state.controlMode === 'doubletap') {
        const now = Date.now();
        if (lastTapCard === card && now - lastTapTime < 400) {
            clearCardSelection();
            mergeCard(card);
            lastTapCard = null; lastTapTime = 0;
        } else {
            if (lastTapCard) lastTapCard.isSelected = false;
            card.isSelected = true;
            lastTapCard = card; lastTapTime = now;
        }
    }
}
canvas.addEventListener('mousedown', onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup', (e) => { if (state.controlMode === 'drag') onDragEnd(e); });
canvas.addEventListener('mouseup', (e) => { if (state.controlMode !== 'drag') onTap(e); });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDragStart(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onDragMove(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); if (state.controlMode === 'drag') onDragEnd(e); else onTap(e); }, { passive: false });

// ---- 設定: カードの操作方法 ----
function refreshControlUI() {
    ['drag', 'doubletap', 'singletap'].forEach(m => {
        const btn = document.getElementById('setting-' + m);
        if (btn) btn.classList.toggle('active', state.controlMode === m);
    });
    const desc = document.getElementById('mode-desc-text');
    if (desc) desc.innerText = T('control_desc_' + state.controlMode);
}
function setControlMode(mode) {
    state.controlMode = mode;
    try { localStorage.setItem('math_braves_control_mode', mode); } catch (e) {}
    clearCardSelection();
    refreshControlUI();
}
['drag', 'doubletap', 'singletap'].forEach(m => bindBtn(document.getElementById('setting-' + m), () => setControlMode(m)));
const _applyLanguage = applyLanguage;
applyLanguage = function () { _applyLanguage(); refreshControlUI(); renderItemList(); };
refreshControlUI();
