// かけざんダンジョン(ブリキの地下迷宮)の本体。
// 見た目はDOM(#bl)で描き、入力は透明なcanvasが受ける。座標はゲームエリア内のpx(720x720)で、チュートリアルの位置指定もこの座標を使う。
// ルール(パネル/カード/アイテム/レベルアップ)は元のかけざんダンジョンと同じ。ステージ制RUN(フロア=ステージ)の画面は braves-run.js が受け持つ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };

Object.assign(state, {
    floor: 1, keysFound: 0, keysNeeded: 1, items: [], itemSelectMode: null, itemSelectValue: null, lastCardValue: 0, doorRevealed: false,
    grid: [], boardW: 0, boardX: 0, gridAreaY: 0, handAreaY: 0, trashRect: { x: 0, y: 0, w: 0, h: 0 },
    maxSingleScore: 0, damageEffectTimer: 0, panelsDestroyed: 0, dungeonLog: [],
    level: 1, exp: 0, expToNext: 150, itemPage: 0
});

// ---- ゲーム画面以外のふきだし・ポップアップ(ドア・アイテム・ジョーカー・レベルアップのスロット) ----
document.getElementById('container').insertAdjacentHTML('beforeend', `
    <div id="item-popup" class="dg-ov hidden">
        <div class="dg-box">
            <div id="item-popup-icon" class="ip-icon"></div>
            <div id="item-popup-name" class="ip-name"></div>
            <div id="item-popup-desc" class="ip-desc"></div>
            <div class="dg-btns"><button id="item-popup-use" class="rs-mini orange" data-i18n="btn_use">つかう</button><button id="item-popup-cancel" class="rs-mini" data-i18n="btn_cancel">やめる</button></div>
        </div>
    </div>
    <div id="joker-overlay" class="dg-ov hidden">
        <div class="dg-box">
            <div class="ip-name" data-i18n="joker_pick_title">数値を選んでね</div>
            <div id="joker-btn-grid"></div>
            <div class="dg-btns"><button id="joker-cancel-btn" class="rs-mini" data-i18n="btn_back">もどる</button></div>
        </div>
    </div>
    <div id="slot-overlay" class="dg-ov dark hidden">
        <div class="dg-box">
            <div id="slot-levelup-text" class="lvtx"></div>
            <div id="slot-drum-wrap"><div id="slot-reel"></div></div>
            <div id="slot-result-text"></div>
            <div class="dg-btns"><button id="slot-ok-btn" class="rs-mini orange hidden" data-i18n="btn_slot_receive">うけとる！</button></div>
        </div>
    </div>`);
Object.keys(ITEMS).forEach(k => { ITEMS[k].id = +k; });
document.querySelectorAll('[data-itemimg]').forEach(el => { el.innerHTML = itemImgTag(el.dataset.itemimg, 26); });
const dgui = {
    confirmDialog: document.getElementById('confirm-dialog'),
    btnYes: document.getElementById('btn-yes'),
    btnNo: document.getElementById('btn-no'),
    time: document.getElementById('disp-time'),
    key: document.getElementById('disp-key'),
    totalScore: document.getElementById('disp-total-score'),
    maxScore: document.getElementById('disp-max-score'),
    howto: document.getElementById('howto-modal')
};

function itemName(id) { return T(`item${id}_name`); }
function itemDesc(id) { return T(`item${id}_desc`); }

// ---- 画面の寸法(元のcanvas版と同じ計算) ----
function layoutBoard() {
    state.width = 720; state.height = 720;
    canvas.width = state.width; canvas.height = state.height;

    const topMargin = 10;
    const gap = 10;
    const availableH = state.height - topMargin - gap * 2;
    const maxWbyHeight = availableH / 1.19;
    const maxWbyWidth = state.width * 0.98;

    state.boardW = Math.min(maxWbyWidth, maxWbyHeight);
    state.boardX = (state.width - state.boardW) / 2;
    state.gridAreaY = topMargin;
    const gridH = (state.boardW / GRID_COLS) * 0.95 * GRID_ROWS;
    state.handAreaY = state.gridAreaY + gridH + gap;

    const cardAreaW = state.boardW * 0.82;
    const trashAreaW = state.boardW * 0.16;
    if (state.cards) {
        state.cards.forEach((c, i) => {
            if (c) {
                c.width = cardAreaW / 5.5;
                c.height = c.width * 1.35;
                const spacing = cardAreaW / 5;
                c.baseX = state.boardX + spacing * i + (spacing - c.width) / 2;
                c.baseY = state.handAreaY;
                if (!c.isDragging) { c.x = c.baseX; c.y = c.baseY; }
            }
        });
    }
    const trashX = state.boardX + cardAreaW + (state.boardW - cardAreaW - trashAreaW);
    const trashH = (state.cards[0]) ? state.cards[0].height : (cardAreaW / 5.5) * 1.35;
    state.trashRect = { x: trashX, y: state.handAreaY, w: trashAreaW, h: trashH };
    DG.laidOut = false;
}
window.addEventListener('resize', layoutBoard);
setTimeout(layoutBoard, 320);

// ---- ダンジョンログ ----
// ログの中の絵文字は、アイテムの絵(SVG)に置きかえて出す
const LOG_EMOJI = { '🗝️': 11, '🔑': 11, '⏰': 14, '🎁': 13, '🃏': 10, '🚪': 12, '🔍': 3, '🔄': 4, '💫': 5, '✨': 6, '💣': 7, '💥': 8 };
function logIcons(html) {
    return emo(String(html).replace(/🗝️|🔑|⏰|🎁|🃏|🚪|🔍|🔄|💫|✨|💣|💥/g, m => itemImgTag(LOG_EMOJI[m], 15)));
}
function addDungeonLog(html) {
    state.dungeonLog.push(html);
    if (state.dungeonLog.length > 15) state.dungeonLog.shift();
    renderDungeonLog();
}
function renderDungeonLog() {
    const el = document.getElementById('battle-log-entries');
    if (!el) return;
    el.innerHTML = '';
    state.dungeonLog.forEach((entry, i) => {
        const div = document.createElement('div');
        div.className = 'lg' + (i === state.dungeonLog.length - 1 ? ' latest' : '');
        div.innerHTML = logIcons(entry);
        el.appendChild(div);
    });
    el.scrollTop = el.scrollHeight;
}

function getNumberColor(n) {
    // 9→8→7→…→2 の順で最大の約数を調べ色を決定（パネル・ログ用: 暗背景向け明色）
    if (n % 9 === 0) return '#a5d6a7'; // 薄緑:  9の倍数 (3²)
    if (n % 8 === 0) return '#81d4fa'; // 薄空色: 8の倍数 (2³)
    if (n % 7 === 0) return '#ce93d8'; // 薄紫:  7の倍数
    if (n % 6 === 0) return '#4db6ac'; // ティール: 6の倍数 (2×3)
    if (n % 5 === 0) return '#ffb74d'; // オレンジ: 5の倍数
    if (n % 4 === 0) return '#90caf9'; // 薄青:  4の倍数 (2²)
    if (n % 3 === 0) return '#66bb6a'; // 緑:    3の倍数
    if (n % 2 === 0) return '#4fc3f7'; // 青:    2の倍数
    return '#ef9a9a';                  // 薄赤:  その他（素数 11以上など）
}

class Card {
    constructor(slotIndex, excludeValue = -1) {
        this.slotIndex = slotIndex;
        // 2% でジョーカー（数値未確定）
        if (Math.random() < 0.02) {
            this.isJoker = true;
            this.jokerChosen = false;
            this.value = 0; // 選択前は 0
        } else {
            this.isJoker = false;
            this.jokerChosen = false;
            this.value = generateCardValue(excludeValue);
        }
        this.stackCount = 1;
        this.multiplier = (Math.random() < 0.05) ? 2 : 1; // 5%で×2ボーナス

        this.isDragging = false;
        const cardAreaW = state.boardW * 0.82;
        this.width = cardAreaW / 5.5;
        this.height = this.width * 1.35;
        const spacing = cardAreaW / 5;
        this.baseX = state.boardX + spacing * slotIndex + (spacing - this.width) / 2;
        this.baseY = state.handAreaY;
        this.x = this.baseX;
        this.y = this.baseY;
        this._fresh = true;   // 画面に出すときにポンと出す
    }
}

// エフェクト。見た目はDOM(CSSアニメーション)がやるので、ここは「いま出ている数」を数えるためのもの
class Particle {
    constructor(x, y, text, color, type = 'text', img = null) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.type = type; this.life = 1.0; this.img = img;
        dgFx(this);
    }
    update() {
        if (this.type === 'text') this.life -= 0.01;
        else if (this.type === 'circle') this.life -= 0.03;
        else this.life -= 0.015;
    }
}
function dgFx(p) {
    const layer = document.getElementById('bl');
    if (!layer) return;
    const el = document.createElement('div');
    if (p.type === 'text') {
        el.className = 'fx-t';
        el.style.cssText = `left:${p.x}px;top:${p.y}px;font-size:30px;color:${p.color};`;
        el.innerHTML = emo(p.text);
    } else if (p.type === 'circle') {
        el.className = 'fx-r';
        el.style.cssText = `left:${p.x}px;top:${p.y}px;border-color:${p.color};width:260px;height:260px;margin:-130px 0 0 -130px;`;
    } else {
        el.className = 'fx-ic';
        el.style.cssText = `left:${p.x}px;top:${p.y}px;`;
        el.innerHTML = p.img && p.img.src ? `<img src="${p.img.src}" alt="">` : '';
    }
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
}

// 重み付きパネル値抽選（フロア別テーブル使用、大きい数ほど出にくい）
function generateEnemyValue() {
    // フロア別テーブルがあればそちらを使用
    const floorIdx = Math.max(1, Math.min(state.floor, MAX_FLOOR));
    const table = (CONFIG.floorEnemyTables && CONFIG.floorEnemyTables[floorIdx])
        ? CONFIG.floorEnemyTables[floorIdx]
        : CONFIG.enemyTable || {};
    const entries = Object.entries(table);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [v, w] of entries) {
        r -= w;
        if (r <= 0) return parseInt(v);
    }
    return parseInt(entries[entries.length - 1][0]);
}

// カード値を重み付きランダムで生成（スマートドロー付き）
function generateCardValue(excludeValue = -1) {
    const handVals = state.cards.filter(c => c !== null).map(c => c.value);
    const primeTargets = [2, 3];
    if (state.difficulty === 'NORMAL' || state.difficulty === 'HARD') primeTargets.push(5);
    if (state.difficulty === 'HARD') primeTargets.push(7);

    // 対象素数のうち手札に1枚もないもの
    const missing = primeTargets.filter(p =>
        p !== excludeValue &&
        CONFIG.weights[p] !== undefined &&
        !handVals.includes(p)
    );
    // 対象素数のうち手札に1枚だけあるもの
    const onlyOne = primeTargets.filter(p =>
        p !== excludeValue &&
        CONFIG.weights[p] !== undefined &&
        handVals.filter(v => v === p).length === 1
    );

    if (missing.length > 0 && Math.random() < 0.5) {
        // IF: 手札に存在しない素数がある → 50%でその中からランダムに引く
        return missing[Math.floor(Math.random() * missing.length)];
    } else if (missing.length === 0 && onlyOne.length > 0 && Math.random() < 0.5) {
        // ELSE IF: 全素数が手札にあるが1枚しかないものがある → 50%で補充
        return onlyOne[Math.floor(Math.random() * onlyOne.length)];
    }

    // 通常の重み付き抽選
    let pool = [];
    for (const [valStr, weight] of Object.entries(CONFIG.weights)) {
        const val = parseInt(valStr);
        if (val !== excludeValue) {
            for (let k = 0; k < weight; k++) pool.push(val);
        }
    }
    if (pool.length === 0) {
        pool = Object.keys(CONFIG.weights).map(Number).filter(v => v !== excludeValue);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// ====== EXP / レベルシステム ======
// スロット基本報酬（アイテムは毎回4種ランダム追加）
// スロット追加報酬（AP系は除外）
const SLOT_REWARDS_BASE_RAW = [
    { type: 'score', value: 300, weight: 28 },
    { type: 'score', value: 400, weight: 22 },
    { type: 'score', value: 500, weight: 14 },
];

function buildLevelUpRewards() {
    const rewards = SLOT_REWARDS_BASE_RAW.map(r => ({ ...r, label: T('reward_score_label', {n: r.value}) }));
    // 全アイテムからランダムに4種選ぶ（重複なし）
    const allIds = Object.keys(ITEMS).map(Number);
    const pool = [...allIds];
    const chosen = [];
    while (chosen.length < 4 && pool.length > 0) {
        const i = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(i, 1)[0]);
    }
    chosen.forEach(id => rewards.push({ type: 'item', value: id, label: itemName(id), weight: 2 }));
    return rewards;
}

function pickFromRewards(rewards) {
    const total = rewards.reduce((s, r) => s + r.weight, 0);
    let r = Math.random() * total;
    for (const rw of rewards) { r -= rw.weight; if (r <= 0) return rw; }
    return rewards[0];
}

function calcExpToNext(level) {
    // 初期値（難易度別）× 1.2^(level-1) の正確な値を 10の位で四捨五入
    // 計算チェーンは浮動小数点そのまま（四捨五入前の値を引き継ぐ）
    const initial = CONFIG.expInitial || 100;
    const exact = initial * Math.pow(1.2, level - 1);
    return Math.round(exact / 10) * 10;
}

function updateExpBar() {
    const fillEl = document.getElementById('exp-bar-fill');
    const textEl = document.getElementById('disp-exp-text');
    const levelEl = document.getElementById('disp-level');
    if (!fillEl || !textEl || !levelEl) return;
    const pct = Math.min(100, state.expToNext > 0 ? Math.floor(state.exp / state.expToNext * 100) : 100);
    fillEl.style.width = pct + '%';
    textEl.textContent = `${state.exp} / ${state.expToNext}`;
    levelEl.textContent = state.level;
}

function gainExp(amount) {
    if (state.screen !== 'PLAYING') return;
    state.exp += amount;
    let leveled = false;
    while (state.exp >= state.expToNext) {
        state.exp -= state.expToNext;
        state.level++;
        state.expToNext = calcExpToNext(state.level);
        leveled = true;
    }
    if (leveled) {
        // バーを100%に満たしてから、リセット→端数分アニメーション
        animateLevelUpBar(state.exp, state.expToNext);
        setTimeout(() => triggerLevelUp(), 700);
    } else {
        updateExpBar();
    }
}

// レベルアップ時のEXPバーアニメーション:
// 1) 現在位置→100%（0.5s）
// 2) 瞬時に0%リセット
// 3) 0%→端数分（1.1s）
function animateLevelUpBar(newExp, newExpToNext) {
    const fillEl = document.getElementById('exp-bar-fill');
    const textEl = document.getElementById('disp-exp-text');
    const levelEl = document.getElementById('disp-level');
    if (!fillEl) return;

    // step1: 100%に伸ばす
    fillEl.style.transition = 'width 0.5s ease-out';
    fillEl.style.width = '100%';

    setTimeout(() => {
        // step2: トランジションなしで0%に戻す
        fillEl.style.transition = 'none';
        fillEl.style.width = '0%';
        if (levelEl) levelEl.textContent = state.level;
        if (textEl) textEl.textContent = `${newExp} / ${newExpToNext}`;

        // step3: リフロー後に端数分アニメーション
        fillEl.offsetHeight; // force reflow
        setTimeout(() => {
            const pct = newExpToNext > 0 ? Math.floor(newExp / newExpToNext * 100) : 0;
            fillEl.style.transition = 'width 1.1s ease-out';
            fillEl.style.width = pct + '%';
        }, 30);
    }, 550);
}

function triggerLevelUp() {
    if (state.screen !== 'PLAYING') return;
    const overlay = document.getElementById('slot-overlay');
    const reelEl  = document.getElementById('slot-reel');
    const resEl   = document.getElementById('slot-result-text');
    const okBtn   = document.getElementById('slot-ok-btn');
    const lvText  = document.getElementById('slot-levelup-text');
    if (!overlay) return;

    // 確定AP+5を即付与
    state.time += 5;
    updateUI();
    addDungeonLog(T('dlog_lvup_confirmed'));

    lvText.textContent = `Lv${state.level - 1} → Lv${state.level}！`;
    resEl.textContent = '';
    okBtn.classList.add('hidden');
    overlay.classList.remove('hidden');
    state.inputLocked = true;

    const rewards  = buildLevelUpRewards();
    const reward   = pickFromRewards(rewards);
    const itemH    = 54; // 1行の高さ（ドラムのhに合わせる）
    const spinN    = 28; // 回転数（スクロールするアイテム数）
    const allItems = rewards.map(r => ({ label: r.label, type: r.type }));

    // スクロール用アイテムリスト: spinN個＋当選
    const strip = [];
    for (let i = 0; i < spinN; i++) strip.push(allItems[i % allItems.length]);
    strip.push({ label: reward.label, type: reward.type }); // 最後が当選

    // タイプ別テキスト色
    function reelColor(type, isWinner) {
        if (isWinner) return type === 'score' ? '#ffd54f' : '#ba68c8';
        return type === 'score' ? 'rgba(255,213,79,0.55)' : 'rgba(186,104,200,0.55)';
    }

    // 各アイテムをdivで積み上げ
    reelEl.innerHTML = strip.map((item, idx) => {
        const isWinner = (idx === spinN);
        return `<div style="height:${itemH}px;display:flex;align-items:center;justify-content:center;
            font-size:1.15rem;font-weight:900;
            color:${reelColor(item.type, isWinner)};
            letter-spacing:0.5px;">${item.label}</div>`;
    }).join('');

    // 初期位置（先頭）
    reelEl.style.transition = 'none';
    reelEl.style.transform = 'translateY(0)';

    // リフロー強制 → アニメーション開始
    reelEl.offsetHeight;
    setTimeout(() => {
        reelEl.style.transition = `transform 1.8s cubic-bezier(0.08, 0.82, 0.17, 1.0)`;
        reelEl.style.transform = `translateY(-${spinN * itemH}px)`;
    }, 80);

    // アニメーション終了後にうけとるボタン表示（ゲット！テキストなし）
    setTimeout(() => {
        resEl.textContent = '';
        okBtn.classList.remove('hidden');
    }, 1980);

    // うけとるボタン: click + touchend 両対応
    const onOk = (e) => {
        e.preventDefault();
        overlay.classList.add('hidden');
        state.inputLocked = false;
        okBtn.onclick = null;
        okBtn.removeEventListener('touchend', onOk);
        applySlotReward(reward);
    };
    okBtn.onclick = onOk;
    okBtn.addEventListener('touchend', onOk, { passive: false });
}

function applySlotReward(reward) {
    if (reward.type === 'ap') {
        state.time += reward.value;
        updateUI();
        addDungeonLog(T('dlog_lvup_ap', {n: reward.value}));
    } else if (reward.type === 'score') {
        state.score += reward.value;  // スロット報酬はEXPに入らない
        updateUI();
        addDungeonLog(T('dlog_lvup_score', {n: reward.value}));
    } else if (reward.type === 'item') {
        const itemId = reward.value; // スロットで決定したアイテムIDを使う
        addItemToInventory(itemId);
        const item = ITEMS[itemId];
        addDungeonLog(T('dlog_lvup_item', {emoji: itemImgTag(itemId, 15), name: itemName(itemId)}));
    }
    updateExpBar();
}
// ====== EXP / レベルシステム END ======

function generateBossValue() {
    const list = CONFIG.bossHpList;
    return list[Math.floor(Math.random() * list.length)];
}
function initFloor() {
    state.grid = [];
    state.keysFound = 0;
    state.keysNeeded = (state.floor === MAX_FLOOR) ? 3 : 1;
    state.doorRevealed = false;

    let cells = [];
    for (let i=0; i<GRID_ROWS * GRID_COLS; i++) {
        let r = Math.random();
        let gems = 1;
        if (r > 0.95) gems = 5; else if (r > 0.85) gems = 4;
        else if (r > 0.70) gems = 3; else if (r > 0.40) gems = 2;
        cells.push({
            id: i, row: Math.floor(i / GRID_COLS), col: i % GRID_COLS,
            value: generateEnemyValue(), gemCount: gems,
            isEnemy: true, isUnknown: true, item: null, isVisible: false, isKeyRevealed: false, isKeyCollected: false, peekRevealed: false
        });
    }

    const initialReveals = [12, 7, 17, 11, 13];
    initialReveals.forEach(idx => {
        if (cells[idx]) {
            cells[idx].isVisible = true;
            if (cells[idx].isEnemy) cells[idx].isUnknown = false;
            if (!cells[idx].isEnemy && cells[idx].item && cells[idx].item !== 'DOOR') collectItem(cells[idx]);
        }
    });

    let indices = Array.from({length: 25}, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let usedCount = 0;
    if (state.floor < MAX_FLOOR) {
        cells[indices[0]].item = 'DOOR';
        usedCount = 1;
    }

    for (let k=0; k<state.keysNeeded; k++) {
        cells[indices[usedCount]].item = 'KEY';
        usedCount++;
    }

    if (state.floor === MAX_FLOOR) {
        const bossIdx = indices[usedCount];
        cells[bossIdx].item = 'BOSS';
        cells[bossIdx].creatureValue = generateBossValue();
        cells[bossIdx].bossImgIdx = Math.floor(Math.random() * 3) + 1;
        usedCount++;
    }

    for (let i = usedCount; i < 25; i++) {
        let idx = indices[i];

        const rates = (CONFIG.dropRatesByFloor && CONFIG.dropRatesByFloor[state.floor])
            ? CONFIG.dropRatesByFloor[state.floor]
            : (CONFIG.dropRates || { time: 10, score: 10, item: 10, numCard: 10, creature: 30 });
        const rnd = Math.random() * 100;
        let cumulative = 0;

        cumulative += rates.time;
        if (rnd < cumulative) { cells[idx].item = 'ITEM_TIME'; continue; }

        cumulative += rates.score;
        if (rnd < cumulative) { cells[idx].item = 'ITEM_SCORE'; continue; }

        cumulative += rates.item;
        if (rnd < cumulative) {
            cells[idx].item = 'ITEM_BAG';
            cells[idx].itemBagId = Math.floor(Math.random() * 10) + 1; // フロア生成時にアイテムIDを確定
            continue;
        }

        cumulative += (rates.numCard || 0);
        if (rnd < cumulative) {
            cells[idx].item = 'ITEM_NUM_CARD';
            // 数値カードの数値は難易度のカード重みから抽選
            cells[idx].itemNumCardValue = generateCardValue();
            continue;
        }

        cumulative += rates.creature;
        if (rnd < cumulative) {
            cells[idx].item = 'CREATURE';
            cells[idx].creatureValue = generateEnemyValue();

            while (cells[idx].creatureValue === cells[idx].value) {
                cells[idx].creatureValue = generateEnemyValue();
            }

            cells[idx].creatureImgIdx = Math.floor(Math.random() * 8) + 1;
            continue;
        }

        cells[idx].item = null;
    }

    state.grid = cells;

    initialReveals.forEach(idx => {
        if (cells[idx] && !cells[idx].isEnemy && cells[idx].item && cells[idx].item !== 'DOOR') {
            collectItem(cells[idx]);
        }
    });

    updateUI();
}

function revealUnknown(row, col) {
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
    dirs.forEach(d => {
        let r = row + d[0]; let c = col + d[1];
        if (r>=0 && r<GRID_ROWS && c>=0 && c<GRID_COLS) {
            let idx = r * GRID_COLS + c;
            if (state.grid[idx].isEnemy) state.grid[idx].isUnknown = false;
            if (!state.grid[idx].isVisible) {
                state.grid[idx].isVisible = true;
                // アイテムはタップで取得するため自動回収しない
            }
        }
    });
}

function collectItem(cell) {
    if (!cell.item || cell.item === 'DOOR' || cell.item === 'CREATURE' || cell.item === 'BOSS') return;

    if (cell.item === 'KEY') {
        if (cell.isKeyCollected) return;
        cell.isKeyCollected = true;
    }

    let scoreGain = 0; let timeGain = 0;
    let symbol = ""; let color = "";

    if (cell.item === 'KEY') {
        state.keysFound++;
        symbol = "🗝️"; color = '#ffa726';
        addDungeonLog(T('dlog_key_get', {found: state.keysFound, needed: state.keysNeeded}));
    }
    else if (cell.item === 'ITEM_TIME') {
        timeGain = 3;
        symbol = "⏰"; color = '#66bb6a';
        addDungeonLog(T('dlog_time_recover', {n: timeGain}));
    }
    else if (cell.item === 'ITEM_SCORE') {
        let base = 200;
        if (state.difficulty === 'NORMAL') base = Math.floor(200 * 1.5);
        if (state.difficulty === 'HARD') base = Math.floor(200 * 2.0);
        scoreGain = base;
        symbol = "🎁"; color = '#ffca28';
        addDungeonLog(T('dlog_score_bonus', {n: scoreGain}));
    }
    else if (cell.item === 'ITEM_BAG') {
        const itemId = cell.itemBagId || (Math.floor(Math.random() * 10) + 1);
        const item = ITEMS[itemId];
        symbol = item.emoji; color = '#ba68c8';
        addItemToInventory(itemId);
        addDungeonLog(T('dlog_item_get', {emoji: itemImgTag(itemId, 15), name: itemName(itemId)}));
    }
    else if (cell.item === 'ITEM_NUM_CARD') {
        const numVal = cell.itemNumCardValue || generateCardValue();
        symbol = '🃏'; color = '#4fc3f7';
        addItemToInventory(10, numVal); // item id=10 は数字カード
        addDungeonLog(T('dlog_card_get', {n: numVal}));
    }

    state.score += scoreGain; state.time += timeGain;

    const pos = getGridPos(cell.row, cell.col);
    const cx = pos.x + pos.w/2; const cy = pos.y + pos.h/2;

    // スライドアップ画像エフェクト（アイテム画像がふわっと上へ消える）
    let pickupImg = null;
    if (cell.item === 'KEY') pickupImg = ITEM_IMAGES[11];
    else if (cell.item === 'ITEM_TIME') pickupImg = ITEM_IMAGES[14];
    else if (cell.item === 'ITEM_SCORE') pickupImg = ITEM_IMAGES[13];
    else if (cell.item === 'ITEM_BAG') pickupImg = cell.itemBagId ? ITEM_IMAGES[cell.itemBagId] : null;
    else if (cell.item === 'ITEM_NUM_CARD') pickupImg = ITEM_IMAGES[10];
    state.particles.push(new Particle(cx, cy, symbol, color, 'image', pickupImg));

    let delay = 200;
    if (timeGain > 0) { setTimeout(() => state.particles.push(new Particle(cx, cy, `AP+${timeGain}`, color, 'text')), delay); delay += 300; }
    if (scoreGain > 0) { setTimeout(() => state.particles.push(new Particle(cx, cy, `+${scoreGain}`, color, 'text')), delay); delay += 300; }
    if (cell.item === 'KEY') { setTimeout(() => state.particles.push(new Particle(cx, cy - 30, "GET!", color, 'text')), delay); }

    if (cell.item !== 'KEY') {
        cell.item = null;
    }
    updateUI();
}

// ---- ステージ制RUNとの受けわたし ----
// フロア=ステージ。フロアをクリアすると のこりAP+10(元のルールのまま)
function stageClearTime(st) { return 10; }
let loopActive = false;
function startLoop() { if (loopActive) return; loopActive = true; requestAnimationFrame(gameLoop); }

function updateStageLabel() {
    const n = Math.min(state.floor, STAGE_COUNT);
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
    state.stage = n; state.floor = n;
    if (n > 1) initFloor();
    state.stageStartScore = state.score;
    state.isGameClearProcessing = false;
    const area = document.getElementById('game-area');
    area.style.setProperty('--sc', STAGE_THEMES[n - 1].c);          // フロアの色(盤面の上のふち・背景の光)
    area.classList.toggle('bossfield', n === STAGE_COUNT);         // さいごのフロア(ボス)は赤むらさきの背景
    updateStageLabel();
    updateUI();
    addDungeonLog(T('stage_log', { n: n, name: stageName(n) }));
    state.inputLocked = true;
    showStageIntro(n, () => { state.inputLocked = false; });
}

function backToTitle() {
    state.screen = 'TITLE';
    hideAllOverlays();
    ['confirm-dialog', 'item-popup', 'joker-overlay', 'slot-overlay'].forEach(id => document.getElementById(id).classList.add('hidden'));
    ui.title.classList.remove('hidden');
    ui.btnToTitle.classList.add('hidden');
    ui.rightPanelContent.classList.add('invisible');
    clearDungeonLayer();
    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0; state.time = CONFIG.initTime; state.maxSingleScore = 0;
    state.floor = 1; state.stage = 1; state.runMode = false; state.stageStartScore = 0; state.stageScores = [];
    state.items = []; state.itemPage = 0; state.itemSelectMode = null; state.itemSelectValue = null; state.lastCardValue = 0; state.cards = [null, null, null, null, null];
    state.particles = []; state.isGameOverProcessing = false; state.inputLocked = false; state.dragInfo = null;
    state.damageEffectTimer = 0; state.panelsDestroyed = 0;
    state.dungeonLog = [];
    state.level = 1; state.exp = 0; state.expToNext = calcExpToNext(1);
    hideAllOverlays();
    clearDungeonLayer();
    updateExpBar();
    renderDungeonLog();
    renderItemList();
    layoutBoard();
    refillCards(true);
    initFloor();
    updateStageLabel();
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');
    startLoop();
}

function refillCards(forceAll = false) {
    for (let i = 0; i < 5; i++) {
        if (state.cards[i] === null || forceAll) state.cards[i] = new Card(i);
    }
}

function updateUI() {
    dgui.time.textContent = state.time;
    dgui.time.classList.toggle('low', state.time <= 3);
    dgui.key.textContent = `${state.keysFound}/${state.keysNeeded}`;
    if (dgui.totalScore._v !== state.score) {
        const first = dgui.totalScore._v === undefined;
        dgui.totalScore._v = state.score;
        dgui.totalScore.textContent = state.score;
        if (!first && state.score > 0) { dgui.totalScore.classList.remove('bump'); void dgui.totalScore.offsetWidth; dgui.totalScore.classList.add('bump'); }
    }
    dgui.maxScore.textContent = state.maxSingleScore;
}

function consumeTime() {
    state.time--; if (state.time < 0) state.time = 0;
    updateUI();
    if (state.time === 0 && !state.isGameOverProcessing) {
        state.isGameOverProcessing = true; state.inputLocked = true;
        setTimeout(() => { if (state.screen === 'PLAYING') gameOver(); }, 500);
    }
}

function checkCreatureAttack() {
    let attacked = false;
    state.grid.forEach(cell => {
        if (cell.isVisible && !cell.isEnemy) {
            const dmg = cell.item === 'BOSS' ? 2 : cell.item === 'CREATURE' ? 1 : 0;
            if (dmg === 0) return;
            state.time -= dmg;
            if (state.time < 0) state.time = 0;
            attacked = true;
            const pos = getGridPos(cell.row, cell.col);
            state.particles.push(new Particle(pos.x + pos.w/2, pos.y + 20, `Attack! -${dmg}`, "#ef5350", 'text'));
            addDungeonLog(T('dlog_attack', {n: dmg}));
        }
    });
    if (attacked) {
        state.damageEffectTimer = 10; updateUI();
        if (state.time === 0 && !state.isGameOverProcessing) {
            state.isGameOverProcessing = true; state.inputLocked = true;
            setTimeout(() => { if (state.screen === 'PLAYING') gameOver(); }, 500);
        }
    }
}

function checkPraise(gain, x, y) {
    let msg = "";
    if (gain >= 2000) msg = "かみレベル！"; else if (gain >= 1000) msg = "てんさい！";
    else if (gain >= 500) msg = "グレート！"; else if (gain >= 200) msg = "すごい！";
    if (msg) state.particles.push(new Particle(x, y - 50, msg, '#ffd54f', 'text'));
}

// ---- RUNの結果 ----
function finishRun(cleared) {
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    ui.btnToTitle.classList.add('hidden');
    if (!cleared || state.stageScores[state.floor - 1] === undefined) state.stageScores[state.floor - 1] = state.score - state.stageStartScore;
    const timeBonus = cleared ? state.time * 100 : 0;
    const maxScoreBonus = state.maxSingleScore * 10;
    const finalScore = state.score + timeBonus + maxScoreBonus;
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, finalScore, state.floor, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, finalScore, isNewRecord, timeBonus, maxScoreBonus);
}
function gameOver() { finishRun(false); }
function gameClear() { finishRun(true); }

function addItemToInventory(id, presetValue = null) {
    if (id === 10) {
        // 数字カード: 数値を確定（外部指定があればそれを使う）
        const numVal = presetValue !== null ? presetValue : generateCardValue();
        const existing = state.items.find(i => i.id === 10 && i.value === numVal);
        if (existing) { existing.count++; } else { state.items.push({ id: 10, value: numVal, count: 1 }); }
    } else {
        const existing = state.items.find(i => i.id === id);
        if (existing) { existing.count++; } else { state.items.push({ id, count: 1 }); }
    }
    renderItemList();
}

// ジョーカー数値選択ピッカー
function showJokerPicker(slotIndex) {
    const overlay   = document.getElementById('joker-overlay');
    const grid      = document.getElementById('joker-btn-grid');
    const cancelBtn = document.getElementById('joker-cancel-btn');
    if (!overlay) return;

    state.inputLocked = true;
    overlay.classList.remove('hidden');

    // カードの数字色と同じロジック（クリーム背景用の濃い色）
    function jokerNumColor(v) {
        if (v % 9 === 0) return '#1b5e20';
        if (v % 8 === 0) return '#0d47a1';
        if (v % 7 === 0) return '#6a1b9a';
        if (v % 6 === 0) return '#00695c';
        if (v % 5 === 0) return '#bf360c';
        if (v % 4 === 0) return '#0277bd';
        if (v % 3 === 0) return '#33691e';
        if (v % 2 === 0) return '#1565c0';
        return '#3e2a18'; // 1, 7(奇数素数)
    }

    // 1〜9 のボタンを生成（カードデザイン）
    grid.innerHTML = '';
    for (let v = 1; v <= 9; v++) {
        const btn = document.createElement('button');
        btn.style.cssText = [
            'background:#f5f0e3',
            'border:2px solid rgba(120,90,50,0.45)',
            'border-radius:10px',
            'width:72px',
            'height:80px',
            `color:${jokerNumColor(v)}`,
            'font-size:2rem',
            'font-weight:900',
            'cursor:pointer',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'font-family:"M PLUS Rounded 1c",sans-serif',
            'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
            'transition:transform 0.08s',
        ].join(';');
        btn.textContent = v;
        const _v = v;
        const onSelect = (e) => {
            e.preventDefault(); e.stopPropagation();
            overlay.classList.add('hidden');
            state.inputLocked = false;
            cancelBtn.removeEventListener('touchstart', onCancel);
            const card = state.cards[slotIndex];
            if (card && card.isJoker) {
                card.value = _v;
                card.jokerChosen = true;
                addDungeonLog(T('dlog_joker_decided', {n: _v}));
            }
        };
        btn.addEventListener('click', onSelect);
        btn.addEventListener('touchstart', onSelect, { passive: false });
        grid.appendChild(btn);
    }

    // もどるボタン
    const onCancel = (e) => {
        e.preventDefault(); e.stopPropagation();
        overlay.classList.add('hidden');
        state.inputLocked = false;
        cancelBtn.removeEventListener('touchstart', onCancel);
    };
    cancelBtn.onclick = onCancel;
    cancelBtn.addEventListener('touchstart', onCancel, { passive: false });
}

// アイテム確認ポップアップを表示（即時使用アイテム用）
function showItemPopup(id, value) {
    if (state.screen !== 'PLAYING') return;
    const item = ITEMS[id];
    if (!item) return;
    const popup  = document.getElementById('item-popup');
    const iconEl = document.getElementById('item-popup-icon');
    const nameEl = document.getElementById('item-popup-name');
    const descEl = document.getElementById('item-popup-desc');
    const useBtn = document.getElementById('item-popup-use');
    const cancelBtn = document.getElementById('item-popup-cancel');

    // アイコン
    iconEl.innerHTML = '';
    iconEl.style.fontSize = '2.4rem';
    const preloaded = ITEM_IMAGES[id];
    if (preloaded && preloaded.complete && preloaded.naturalWidth > 0) {
        const imgEl = document.createElement('img');
        imgEl.src = preloaded.src;
        imgEl.style.cssText = 'width:50px;height:50px;object-fit:contain;';
        iconEl.appendChild(imgEl);
    } else {
        iconEl.textContent = item.emoji;
    }
    nameEl.textContent = id === 10 ? T('item10_card_label', {value}) : itemName(id);
    descEl.textContent = itemDesc(id) || '';

    popup.classList.remove('hidden');

    const cleanup = () => {
        popup.classList.add('hidden');
        useBtn.removeEventListener('touchstart', onUse);
        cancelBtn.removeEventListener('touchstart', onCancel);
        useBtn.onclick = null; cancelBtn.onclick = null;
    };
    const onUse    = (e) => { e.preventDefault(); e.stopPropagation(); cleanup(); onUseItemButton(id, value); };
    const onCancel = (e) => { e.preventDefault(); e.stopPropagation(); cleanup(); };
    // click（PC）＋ touchstart（タッチ端末）両対応
    useBtn.onclick    = onUse;
    cancelBtn.onclick = onCancel;
    useBtn.addEventListener('touchstart',    onUse,    { passive: false });
    cancelBtn.addEventListener('touchstart', onCancel, { passive: false });
}

// ============================================================
// アイテムドラッグシステム（対象指定アイテム・数字カードを直接ドロップ）
// ============================================================
const itemDrag = { active: false, id: null, value: null, floatEl: null, startX: 0, startY: 0 };

function startItemDrag(inv, e) {
    if (state.screen !== 'PLAYING') return;
    const item = ITEMS[inv.id];
    if (!item) return;
    const invEntry = inv.id === 10
        ? state.items.find(i => i.id === 10 && i.value === inv.value)
        : state.items.find(i => i.id === inv.id);
    if (!invEntry || invEntry.count <= 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    itemDrag.active = true;
    itemDrag.id = inv.id;
    itemDrag.value = inv.value ?? null;
    itemDrag.startX = clientX;
    itemDrag.startY = clientY;

    // ゴースト要素
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;z-index:9999;pointer-events:none;
        width:52px;height:52px;border-radius:10px;
        background:rgba(255,202,40,0.25);border:2px solid #ffca28;
        display:flex;align-items:center;justify-content:center;
        font-size:28px;transform:translate(-50%,-50%);
        box-shadow:0 4px 16px rgba(0,0,0,0.6);
        left:${clientX}px;top:${clientY}px;`;
    const preloaded = ITEM_IMAGES[inv.id];
    if (preloaded && preloaded.complete && preloaded.naturalWidth > 0) {
        const imgEl = document.createElement('img');
        imgEl.src = preloaded.src;
        imgEl.style.cssText = 'width:38px;height:38px;object-fit:contain;';
        el.appendChild(imgEl);
    } else {
        el.textContent = item.emoji;
    }
    document.body.appendChild(el);
    itemDrag.floatEl = el;
}

function finalizeItemDrop(e) {
    if (!itemDrag.active) return;
    if (itemDrag.floatEl) { itemDrag.floatEl.remove(); itemDrag.floatEl = null; }

    const id = itemDrag.id;
    const cardValue = itemDrag.value;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const moved = Math.hypot(clientX - itemDrag.startX, clientY - itemDrag.startY);

    itemDrag.active = false; itemDrag.id = null; itemDrag.value = null;

    if (state.screen !== 'PLAYING') return;

    if (moved < 8) {
        // タップ → 既存選択モード（フォールバック）
        onUseItemButton(id, cardValue);
        return;
    }

    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        addDungeonLog(T('dlog_item_cancel')); renderItemList(); return;
    }
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);

    const item = ITEMS[id];
    if (!item) return;
    const inv = id === 10
        ? state.items.find(i => i.id === 10 && i.value === cardValue)
        : state.items.find(i => i.id === id);
    if (!inv || inv.count <= 0) return;

    if (id === 10) {
        // 数字カード: 手札カードにドロップ
        for (let i = 0; i < 5; i++) {
            const c = state.cards[i];
            if (c && canvasX >= c.x && canvasX <= c.x + c.width && canvasY >= c.y && canvasY <= c.y + c.height) {
                c.value *= cardValue; c.stackCount += 1;
                inv.count--;
                if (inv.count <= 0) state.items = state.items.filter(it => !(it.id === 10 && it.value === cardValue));
                addDungeonLog(T('dlog_card_multiply', {n: cardValue}));
                state.particles.push(new Particle(c.x + c.width/2, c.y + c.height/2, `×${cardValue}`, '#4fc3f7', 'circle'));
                state.particles.push(new Particle(c.x + c.width/2, c.y + c.height/2 - 20, `×${cardValue}`, '#4fc3f7', 'text'));
                renderItemList(); updateUI(); return;
            }
        }
        addDungeonLog(T('dlog_drop_to_hand')); renderItemList();
    } else {
        // 対象指定アイテム: グリッドパネルにドロップ
        const cellW = state.boardW / GRID_COLS;
        const cellH = cellW * 0.95;
        if (canvasY >= state.gridAreaY && canvasY < state.gridAreaY + GRID_ROWS * cellH &&
            canvasX >= state.boardX && canvasX < state.boardX + GRID_COLS * cellW) {
            const col = Math.floor((canvasX - state.boardX) / cellW);
            const row2 = Math.floor((canvasY - state.gridAreaY) / cellH);
            const cell = state.grid[row2 * GRID_COLS + col];
            if (cell) { executeItem(id, cell); return; }
        }
        addDungeonLog(T('dlog_drop_to_panel')); renderItemList();
    }
}
// ============================================================

const ITEM_PAGE_SIZE = 5; // 1ページに表示するアイテム数

function renderItemList() {
    const container = document.getElementById('item-list');
    const notice    = document.getElementById('item-select-notice');
    const pageCtrl  = document.getElementById('item-page-ctrl');
    const pageLabel = document.getElementById('item-page-label');
    const prevBtn   = document.getElementById('item-page-prev');
    const nextBtn   = document.getElementById('item-page-next');
    if (!container) return;

    // 選択モード通知
    if (notice) {
        if (state.itemSelectMode === null) {
            notice.style.display = 'none';
        } else if (state.itemSelectMode === 10) {
            notice.textContent = T('notice_tap_hand', {value: state.itemSelectValue});
            notice.style.display = 'block';
        } else {
            notice.textContent = T('item_select_notice');
            notice.style.display = 'block';
        }
    }

    if (state.items.length === 0) {
        container.innerHTML = `<div class="no-item">${T('dg_no_items')}</div>`;
        if (pageCtrl) pageCtrl.style.display = 'none';
        return;
    }

    // ページ数・現在ページ補正
    const totalPages = Math.ceil(state.items.length / ITEM_PAGE_SIZE);
    if (!state.itemPage) state.itemPage = 0;
    state.itemPage = Math.max(0, Math.min(state.itemPage, totalPages - 1));

    // ページコントロール表示
    if (pageCtrl) {
        if (totalPages > 1) {
            pageCtrl.style.display = 'flex';
            if (pageLabel) pageLabel.textContent = `${state.itemPage + 1}/${totalPages}`;
            if (prevBtn) prevBtn.disabled = (state.itemPage === 0);
            if (nextBtn) nextBtn.disabled = (state.itemPage >= totalPages - 1);
        } else {
            pageCtrl.style.display = 'none';
        }
    }

    // ページ送りボタンのイベント（毎回付け直し）
    if (prevBtn) {
        const onPrev = (e) => { e.preventDefault(); e.stopPropagation(); if (state.itemPage > 0) { state.itemPage--; renderItemList(); } };
        prevBtn.onclick = onPrev;
        prevBtn.ontouchstart = null;
        prevBtn.addEventListener('touchstart', onPrev, { passive: false });
    }
    if (nextBtn) {
        const onNext = (e) => { e.preventDefault(); e.stopPropagation(); if (state.itemPage < totalPages - 1) { state.itemPage++; renderItemList(); } };
        nextBtn.onclick = onNext;
        nextBtn.ontouchstart = null;
        nextBtn.addEventListener('touchstart', onNext, { passive: false });
    }

    // 現在ページのアイテムを描画
    const pageItems = state.items.slice(state.itemPage * ITEM_PAGE_SIZE, (state.itemPage + 1) * ITEM_PAGE_SIZE);
    container.innerHTML = '';

    pageItems.forEach(inv => {
        const item = ITEMS[inv.id];
        if (!item) return;
        const isDraggable = item.needsTarget || inv.id === 10;
        const isSelecting = state.itemSelectMode === inv.id &&
            (inv.id !== 10 || state.itemSelectValue === inv.value);
        const row = document.createElement('div');
        row.className = 'item-row' + (isSelecting ? ' selecting' : '');
        row.style.cursor = isDraggable ? 'grab' : 'pointer';

        // icon
        const iconEl = document.createElement('div');
        iconEl.className = 'item-icon';
        iconEl.textContent = item.emoji;
        const preloaded = ITEM_IMAGES[inv.id];
        if (preloaded && preloaded.complete && preloaded.naturalWidth > 0) {
            const imgEl = document.createElement('img');
            imgEl.src = preloaded.src;
            imgEl.style.cssText = 'width:22px;height:22px;object-fit:contain;vertical-align:middle;';
            iconEl.textContent = '';
            iconEl.appendChild(imgEl);
        }
        const nameEl = document.createElement('div');
        nameEl.className = 'item-name';
        nameEl.textContent = inv.id === 10 ? T('item10_card_label', {value: inv.value}) : itemName(inv.id);
        const countEl = document.createElement('div');
        countEl.className = 'item-count';
        countEl.textContent = `×${inv.count}`;

        row.appendChild(iconEl);
        row.appendChild(nameEl);
        row.appendChild(countEl);

        const _invId = inv.id;
        const _invVal = inv.value ?? null;

        if (isDraggable) {
            const hint = document.createElement('span');
            hint.textContent = '↗';
            hint.style.cssText = 'color:var(--accent-gold);font-size:1rem;flex-shrink:0;padding-left:2px;';
            row.appendChild(hint);
            row.addEventListener('mousedown', (e) => { e.preventDefault(); startItemDrag({ id: _invId, value: _invVal }, e); });
            row.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); startItemDrag({ id: _invId, value: _invVal }, e); }, { passive: false });
        } else {
            row.addEventListener('click', () => showItemPopup(_invId, _invVal));
            row.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); showItemPopup(_invId, _invVal); }, { passive: false });
        }
        container.appendChild(row);
    });
}

function onUseItemButton(id, cardValue = null) {
    if (state.screen !== 'PLAYING') return;
    const item = ITEMS[id];
    if (!item) return;
    // 数字カードは value を照合して該当エントリを特定
    const inv = id === 10
        ? state.items.find(i => i.id === 10 && i.value === cardValue)
        : state.items.find(i => i.id === id);
    if (!inv || inv.count <= 0) return;
    if (id === 10) {
        // 数字カード: 入手時確定済みの値を使って手札選択モードへ
        state.itemSelectMode = 10;
        state.itemSelectValue = cardValue;
        renderItemList();
        addDungeonLog(T('dlog_card_tap_hint', {n: cardValue}));
    } else if (item.needsTarget) {
        state.itemSelectMode = id;
        renderItemList();
        addDungeonLog(T('dlog_item_tap_hint', {emoji: itemImgTag(id, 15), name: itemName(id)}));
    } else {
        executeItem(id, null);
    }
}

function executeItem(id, targetCell) {
    const inv = state.items.find(i => i.id === id);
    if (!inv || inv.count <= 0) return false;
    let consumed = true;
    switch(id) {
        case 1: {
            let cands = state.grid.filter(c => c.item === 'KEY' && !c.isKeyRevealed);
            if (cands.length > 0) {
                cands[Math.floor(Math.random() * cands.length)].isKeyRevealed = true;
                addDungeonLog(T('dlog_key_sensed'));
                state.particles.push(new Particle(state.width/2, state.height/2, T('particle_key_sensed'), '#ffa726', 'text'));
            } else {
                addDungeonLog(T('dlog_key_none'));
                state.particles.push(new Particle(state.width/2, state.height/2, T('particle_key_none'), '#9990b0', 'text'));
            }
        } break;
        case 2: {
            state.doorRevealed = true;
            addDungeonLog(T('dlog_door_sensed'));
            state.particles.push(new Particle(state.width/2, state.height/2, T('particle_door_sensed'), '#ba68c8', 'text'));
        } break;
        case 3: {
            let hidden = state.grid.filter(c => !c.isVisible && c.isEnemy);
            for (let i = hidden.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [hidden[i],hidden[j]]=[hidden[j],hidden[i]]; }
            hidden.slice(0, 5).forEach(c => { c.peekRevealed = true; });
            addDungeonLog(T('dlog_peek'));
            state.particles.push(new Particle(state.width/2, state.height/2, T('particle_peek'), '#4fc3f7', 'text'));
        } break;
        case 4: {
            let ens = state.grid.filter(c => c.isEnemy);
            for (let i = ens.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [ens[i],ens[j]]=[ens[j],ens[i]]; }
            ens.slice(0, Math.ceil(ens.length/2)).forEach(c => {
                c.value = generateEnemyValue();
                const r2 = Math.random();
                c.gemCount = r2>0.95?5:r2>0.85?4:r2>0.70?3:r2>0.40?2:1;
                c.peekRevealed = false;
            });
            addDungeonLog(T('dlog_shuffle_half'));
            state.particles.push(new Particle(state.width/2, state.height/2, T('particle_shuffle_half'), '#ba68c8', 'text'));
        } break;
        case 5: {
            state.grid.filter(c => c.isEnemy).forEach(c => {
                c.value = generateEnemyValue();
                const r2 = Math.random();
                c.gemCount = r2>0.95?5:r2>0.85?4:r2>0.70?3:r2>0.40?2:1;
                c.peekRevealed = false;
            });
            addDungeonLog(T('dlog_shuffle_all'));
            state.particles.push(new Particle(state.width/2, state.height/2, T('particle_shuffle_all'), '#ba68c8', 'text'));
        } break;
        case 6: {
            for (let i = 0; i < 5; i++) state.cards[i] = null;
            refillCards(true);
            addDungeonLog(T('dlog_hand_redraw'));
            state.particles.push(new Particle(state.width/2, state.height/2, T('particle_hand_redraw'), '#ba68c8', 'text'));
        } break;
        case 7: {
            if (!targetCell) { consumed = false; break; }
            const pos7 = getGridPos(targetCell.row, targetCell.col);
            const cx7 = pos7.x + pos7.w/2, cy7 = pos7.y + pos7.h/2;
            // 可視・非可視に関わらずオープン＆破壊
            targetCell.isVisible = true; targetCell.isUnknown = false;
            state.particles.push(new Particle(cx7, cy7, '', '#ffa726', 'image', ITEM_IMAGES[8]));
            state.particles.push(new Particle(cx7, cy7, "💥", '#ef5350', 'circle'));
            if (targetCell.isEnemy) {
                targetCell.isEnemy = false;
                if (targetCell.item && targetCell.item !== 'DOOR') setTimeout(() => collectItem(targetCell), 400);
            }
            revealUnknown(targetCell.row, targetCell.col);
            addDungeonLog(T('dlog_bomb_small'));
        } break;
        case 8: {
            if (!targetCell) { consumed = false; break; }
            const dirs8 = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
            // 十字5マスを全てオープン＆破壊
            dirs8.forEach(([dr,dc]) => {
                const nr = targetCell.row+dr, nc = targetCell.col+dc;
                if (nr<0||nr>=GRID_ROWS||nc<0||nc>=GRID_COLS) return;
                const c8 = state.grid[nr*GRID_COLS+nc];
                if (!c8) return;
                const p8 = getGridPos(c8.row, c8.col);
                c8.isVisible = true; c8.isUnknown = false;
                state.particles.push(new Particle(p8.x+p8.w/2, p8.y+p8.h/2, '', '#ffa726', 'image', ITEM_IMAGES[8]));
                state.particles.push(new Particle(p8.x+p8.w/2, p8.y+p8.h/2, "💥", '#ef5350', 'circle'));
                if (c8.isEnemy) {
                    c8.isEnemy = false;
                    if (c8.item && c8.item !== 'DOOR') setTimeout(() => collectItem(c8), 400);
                }
                revealUnknown(c8.row, c8.col);
            });
            addDungeonLog(T('dlog_bomb_cross'));
        } break;
        case 9: {
            if (!targetCell) { consumed = false; break; }
            if (targetCell.item === 'BOSS') {
                addDungeonLog(T('dlog_sword_no_boss'));
                state.particles.push(new Particle(state.width/2, state.height/2, T('particle_boss_immune'), '#9990b0', 'text'));
                consumed = false; break;
            }
            const pos9 = getGridPos(targetCell.row, targetCell.col);
            const cx9 = pos9.x+pos9.w/2, cy9 = pos9.y+pos9.h/2;
            const isEnemy9 = targetCell.isEnemy || targetCell.item === 'CREATURE';
            if (!isEnemy9) { consumed = false; addDungeonLog(T('dlog_sword_no_target')); break; }
            if (Math.random() < 0.5) {
                if (targetCell.isEnemy) {
                    targetCell.isEnemy = false;
                    revealUnknown(targetCell.row, targetCell.col);
                    if (targetCell.item && targetCell.item !== 'DOOR') setTimeout(() => collectItem(targetCell), 300);
                } else { targetCell.item = null; }
                state.score += 100;
                state.particles.push(new Particle(cx9, cy9, T('particle_defeat'), '#ef5350', 'text'));
                addDungeonLog(T('dlog_sword_hit'));
            } else {
                state.particles.push(new Particle(cx9, cy9, T('particle_miss'), '#9990b0', 'text'));
                addDungeonLog(T('dlog_sword_miss'));
            }
        } break;
        case 10: {
            const emptySlot = state.cards.findIndex(c => c === null);
            if (emptySlot >= 0) {
                state.cards[emptySlot] = new Card(emptySlot);
                addDungeonLog(T('dlog_card_added'));
                state.particles.push(new Particle(state.width/2, state.height/2, T('particle_card_summon'), '#4fc3f7', 'text'));
            } else {
                addDungeonLog(T('dlog_hand_full'));
                state.particles.push(new Particle(state.width/2, state.height/2, T('particle_hand_full'), '#9990b0', 'text'));
                consumed = false;
            }
        } break;
        default: consumed = false;
    }
    if (consumed) {
        inv.count--;
        if (inv.count <= 0) state.items = state.items.filter(i => i.id !== id);
        renderItemList();
        updateUI();
    }
    return consumed;
}

function getGridPos(row, col) {
    const cellW = state.boardW / GRID_COLS;
    const cellH = cellW * 0.95;
    const startX = state.boardX;
    const startY = state.gridAreaY;
    const gap = 8;
    return { x: startX + col * cellW + gap / 2, y: startY + row * cellH + gap / 2, w: cellW - gap, h: cellH - gap };
}

// ============================================================
//  画面の描画(DOM)
// ============================================================
const DG = { cells: [], hand: [], trash: null, hint: null, laidOut: false, sig: [], handSig: [] };

function dgInit() {
    const layer = document.getElementById('bl');
    if (DG.ready && layer.contains(DG.trash)) return;
    layer.innerHTML = `<div class="dg-trash"><span class="ic">${ICO.trash}</span><span class="tx">${T('dg_trash')}</span></div><div class="bl-hint" style="display:none"></div>`;
    DG.trash = layer.querySelector('.dg-trash');
    DG.hint = layer.querySelector('.bl-hint');
    DG.cells = []; DG.hand = []; DG.sig = []; DG.handSig = [];
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
        const el = document.createElement('div');
        el.className = 'dc';
        layer.insertBefore(el, DG.trash);
        DG.cells.push(el);
    }
    DG.ready = true; DG.laidOut = false;
}
function clearDungeonLayer() {
    const layer = document.getElementById('bl');
    if (layer) layer.innerHTML = '';
    DG.ready = false; DG.cells = []; DG.hand = []; DG.sig = []; DG.handSig = [];
    const area = document.getElementById('game-area');
    if (area) area.classList.remove('hurt', 'danger', 'bossfield');
}

// ロボ1体のHTML。idx=1〜8(元のてきの絵の番号)・ボスは bossImgIdx。色ちがいは .v1〜.v3
function robotHTML(idx, boss) {
    if (boss) return `<div class="rw boss"><div class="mon boss"><div class="glow"></div><div class="rbx big">${ROBOT_BOSS}</div></div></div>`;
    const k = Math.max(1, idx) - 1;
    return `<div class="rw"><div class="mon v${Math.floor(k / 5)}"><div class="glow"></div><div class="rbx">${ROBOTS[k % ROBOTS.length]}</div></div></div>`;
}
function cellStars(n) { return `<div class="gm">${'<i class="gs"></i>'.repeat(n)}</div>`; }
function ghost(cell) {
    let h = '';
    if (state.doorRevealed && cell.item === 'DOOR') h += `<img class="gh" src="${ITEM_IMAGES[12].src}" alt="">`;
    if (state.doorRevealed && cell.item === 'BOSS') h += `<div class="gh bossgh">${robotHTML(0, true)}</div>`;
    if (cell.isKeyRevealed && cell.item === 'KEY') h += `<img class="gh" src="${ITEM_IMAGES[11].src}" alt="">`;
    return h;
}
function cellSig(c) {
    return [c.isVisible ? 1 : 0, c.isEnemy ? 1 : 0, c.isUnknown ? 1 : 0, c.value, c.gemCount, c.item, c.itemBagId || 0, c.isKeyRevealed ? 1 : 0, c.isKeyCollected ? 1 : 0,
        c.peekRevealed ? 1 : 0, state.doorRevealed ? 1 : 0, c.creatureValue || 0, c.creatureImgIdx || 0, c.bossImgIdx || 0].join('|');
}
function cellHTML(c) {
    if (!c.isVisible) {
        let h = '';
        if (c.peekRevealed && c.isEnemy) h += `<div class="nm peek">${c.value}</div>`;
        return { cls: 'unk', html: h + ghost(c) };
    }
    if (c.isEnemy) {
        // 数字: 最小素因数による色分け(色がプレイヤーへのヒント)
        return { cls: 'en', html: (c.isUnknown ? '<div class="qm">?</div>' : cellStars(c.gemCount)) + `<div class="nm" style="color:${getNumberColor(c.value)}">${c.value}</div>` + ghost(c) };
    }
    let h = '';
    if (c.item === 'KEY') h = `<img class="it${c.isKeyCollected ? ' dim' : ''}" src="${ITEM_IMAGES[11].src}" alt="">`;
    else if (c.item === 'DOOR') h = `<img class="it big" src="${ITEM_IMAGES[12].src}" alt="">`;
    else if (c.item === 'ITEM_TIME') h = `<img class="it" src="${ITEM_IMAGES[14].src}" alt="">`;
    else if (c.item === 'ITEM_SCORE') h = `<img class="it" src="${ITEM_IMAGES[13].src}" alt="">`;
    else if (c.item === 'ITEM_BAG') h = `<img class="it" src="${(ITEM_IMAGES[c.itemBagId] || ITEM_IMAGES[10]).src}" alt="">`;
    else if (c.item === 'ITEM_NUM_CARD') h = `<img class="it" src="${ITEM_IMAGES[10].src}" alt="">`;
    else if (c.item === 'CREATURE' || c.item === 'BOSS') {
        const boss = c.item === 'BOSS';
        h = cellStars(c.gemCount || 1) + robotHTML(boss ? 0 : c.creatureImgIdx, boss) + `<div class="nm bot" style="color:${getNumberColor(c.creatureValue)}">${c.creatureValue}</div>`;
        return { cls: 'em foe' + (boss ? ' boss' : ''), html: h };
    }
    return { cls: 'em', html: h };
}

function cardNumColor(v) {
    // クリーム色のカード用の濃い色（9→8→7→…→2 の順で最大の約数）
    if (v % 9 === 0) return '#1b5e20';
    if (v % 8 === 0) return '#0d47a1';
    if (v % 7 === 0) return '#6a1b9a';
    if (v % 6 === 0) return '#00695c';
    if (v % 5 === 0) return '#bf360c';
    if (v % 4 === 0) return '#0277bd';
    if (v % 3 === 0) return '#33691e';
    if (v % 2 === 0) return '#1565c0';
    return '#3e2a18';
}
function cardHTML(c) {
    const w = c.width;
    const top = c.multiplier > 1 ? `<div class="tp" style="font-size:${w * 0.25}px"><span class="mul">×${c.multiplier}</span></div>` : '';
    if (c.isJoker && !c.jokerChosen) return top + `<div class="nm jk" style="font-size:${w * 0.7}px">?</div>`;
    return top + `<div class="nm" style="font-size:${w * (String(c.value).length > 2 ? 0.42 : String(c.value).length > 1 ? 0.56 : 0.64)}px;color:${cardNumColor(c.value)}">${c.value}</div>`;
}

// カードをドラッグしているとき、どのマスの上にいるか(onUpと同じ判定)
function dropCell(card) {
    const cx = card.x + card.width / 2, cy = card.y + card.height / 2;
    const cellW = state.boardW / GRID_COLS, cellH = cellW * 0.95;
    if (cy < state.gridAreaY + GRID_ROWS * cellH + 20) {
        const col = Math.floor((cx - state.boardX) / cellW), row = Math.floor((cy - state.gridAreaY) / cellH);
        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) return state.grid[row * GRID_COLS + col];
    }
    return null;
}
function dragHint(c) {
    const cell = dropCell(c);
    if (cell && cell.isVisible) {
        if (cell.isEnemy) {
            if (c.value === cell.value) return { cls: 'hit', cell: cell, text: T('dg_hint_hit', { n: cell.value * cell.gemCount * (c.multiplier || 1) }) };
            return { cls: 'bad', text: T('hint_bad') };
        }
        if (cell.item === 'CREATURE' || cell.item === 'BOSS') {
            if (c.value === cell.creatureValue) return { cls: 'hit', cell: cell, text: T('dg_hint_defeat') };
            return { cls: 'bad', text: T('hint_bad') };
        }
    }
    const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
    for (let i = 0; i < 5; i++) {
        const t = state.cards[i];
        if (!t || t === c) continue;
        if (Math.hypot(cx - (t.x + t.width / 2), cy - (t.y + t.height / 2)) < c.width * 0.8) {
            return { cls: '', card: t, text: `${t.value} × ${c.value} = ${t.value * c.value}` };
        }
    }
    const tr = state.trashRect;
    if (cx >= tr.x && cx <= tr.x + tr.w && cy >= tr.y && cy <= tr.y + tr.h) return { cls: 'trash', trash: true, text: T('hint_trash') };
    return null;
}

function renderDungeon() {
    dgInit();
    if (!DG.laidOut) {
        DG.laidOut = true;
        for (let r = 0; r < GRID_ROWS; r++) for (let c = 0; c < GRID_COLS; c++) {
            const p = getGridPos(r, c), el = DG.cells[r * GRID_COLS + c];
            el.style.cssText = `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;--cw:${p.w}px;--rs:${(p.w / 150 * 0.8).toFixed(3)};--rb:${(p.w / 190 * 0.98).toFixed(3)};`;
        }
        const tr = state.trashRect;
        DG.trash.style.cssText = `left:${tr.x}px;top:${tr.y}px;width:${tr.w}px;height:${tr.h}px;`;
        DG.sig = []; DG.handSig = [];
    }
    // 手札を持っているカード → つぎに何が起きるか
    const drag = state.dragInfo ? state.cards[state.dragInfo.slotIndex] : null;
    const hint = drag ? dragHint(drag) : null;
    // マス
    state.grid.forEach((c, i) => {
        const el = DG.cells[i], sg = cellSig(c);
        if (DG.sig[i] !== sg) {
            DG.sig[i] = sg;
            const h = cellHTML(c);
            el.className = 'dc ' + h.cls;
            el.innerHTML = h.html;
        }
        el.classList.toggle('tgt', !!(hint && hint.cell === c));
    });
    // 手札
    for (let i = 0; i < 5; i++) {
        const c = state.cards[i];
        let el = DG.hand[i];
        if (!c) { if (el) { el.remove(); DG.hand[i] = null; DG.handSig[i] = ''; } continue; }
        if (!el) {
            el = document.createElement('div');
            el.addEventListener('animationend', () => { el._popping = false; el.classList.remove('pop'); });
            DG.hand[i] = el;
            document.getElementById('bl').appendChild(el);
            c._fresh = true; DG.handSig[i] = '';
        }
        if (!c.isDragging) { c.x = c.baseX; c.y = c.baseY; }
        const sg = [c.value, c.multiplier, c.stackCount, c.isJoker ? 1 : 0, c.jokerChosen ? 1 : 0, Math.round(c.width)].join('|');
        if (DG.handSig[i] !== sg) {
            DG.handSig[i] = sg;
            el.innerHTML = cardHTML(c);
            el.style.width = c.width + 'px'; el.style.height = c.height + 'px';
        }
        const stc = c.stackCount > 1 ? ' st' + Math.min(c.stackCount, 5) : '';
        const cls = 'hc' + stc + (c.isDragging ? ' dragging' : '') + (hint && hint.card === c ? ' tgt' : '');
        if (el._cls !== cls) { el._cls = cls; el.className = cls + (el._popping ? ' pop' : ''); }
        if (c._fresh) { c._fresh = false; el._popping = true; el.classList.add('pop'); }
        el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }
    DG.trash.classList.toggle('over', !!(hint && hint.trash));
    // ドラッグ中の吹き出し
    if (hint && drag) {
        const hx = Math.max(95, Math.min(state.width - 95, drag.x + drag.width / 2));
        const hy = Math.max(44, drag.y - 12);
        DG.hint.style.display = '';
        DG.hint.style.left = hx + 'px'; DG.hint.style.top = hy + 'px';
        if (DG.hint._t !== hint.text) { DG.hint._t = hint.text; DG.hint.innerHTML = emo(hint.text); }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (DG.hint.className !== hc) DG.hint.className = hc;
    } else if (DG.hint.style.display !== 'none') {
        DG.hint.style.display = 'none';
    }
    // ダメージのフラッシュ・てきがいるときのふち
    const area = document.getElementById('game-area');
    const hurt = state.damageEffectTimer > 0;
    if (hurt) state.damageEffectTimer--;
    area.classList.toggle('hurt', hurt);
    const danger = state.grid.some(c => c.isVisible && (c.item === 'CREATURE' || c.item === 'BOSS'));
    area.classList.toggle('danger', danger);
}

function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }
    renderDungeon();
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i]; p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
    requestAnimationFrame(gameLoop);
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    if (isMobileRotated) {
        return {
            x: y * (canvas.height / rect.width),
            y: canvas.height - x * (canvas.width / rect.height)
        };
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

function onDown(e) {
    if (state.screen !== 'PLAYING' || state.inputLocked) {
        if (state.screen === 'GAMEOVER') backToTitle();
        return;
    }

    // アイテム対象選択モード
    if (state.itemSelectMode !== null) {
        const pos = getEventPos(e);

        // 数字カード(10): 手札カードをタップして掛け算
        if (state.itemSelectMode === 10) {
            let hit = false;
            for (let i = 0; i < 5; i++) {
                const c = state.cards[i];
                if (c && pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
                    const numVal = state.itemSelectValue;
                    c.value *= numVal;
                    c.stackCount += 1;
                    // アイテム消費（同じ value のエントリを照合）
                    const inv10 = state.items.find(it => it.id === 10 && it.value === numVal);
                    if (inv10) { inv10.count--; if (inv10.count <= 0) state.items = state.items.filter(it => !(it.id === 10 && it.value === numVal)); }
                    state.itemSelectMode = null; state.itemSelectValue = null;
                    addDungeonLog(T('dlog_card_multiply2', {n: numVal}));
                    state.particles.push(new Particle(c.x + c.width/2, c.y + c.height/2, `×${numVal}`, '#4fc3f7', 'circle'));
                    state.particles.push(new Particle(c.x + c.width/2, c.y + c.height/2 - 20, `×${numVal}`, '#4fc3f7', 'text'));
                    renderItemList(); updateUI();
                    hit = true; break;
                }
            }
            if (!hit) {
                // 手札以外をタップ → キャンセル
                state.itemSelectMode = null; state.itemSelectValue = null;
                addDungeonLog(T('dlog_item_cancel'));
                renderItemList();
            }
            return;
        }

        // その他対象指定アイテム: パネルをタップ
        const cellW2 = state.boardW / GRID_COLS;
        const cellH2 = cellW2 * 0.95;
        const startX2 = state.boardX;
        const startY2 = state.gridAreaY;
        if (pos.y >= startY2 && pos.y < startY2 + GRID_ROWS * cellH2 && pos.x >= startX2 && pos.x < startX2 + GRID_COLS * cellW2) {
            const col2 = Math.floor((pos.x - startX2) / cellW2);
            const row2 = Math.floor((pos.y - startY2) / cellH2);
            const cell2 = state.grid[row2 * GRID_COLS + col2];
            if (cell2) {
                const itemId2 = state.itemSelectMode;
                state.itemSelectMode = null;
                executeItem(itemId2, cell2);
            }
        } else {
            state.itemSelectMode = null;
            addDungeonLog(T('dlog_item_cancel'));
            renderItemList();
        }
        return;
    }

    const pos = getEventPos(e);
    const cellW = state.boardW / GRID_COLS;
    const cellH = cellW * 0.95;
    const startX = state.boardX;
    const startY = state.gridAreaY;

    if (pos.y > startY && pos.y < startY + GRID_ROWS * cellH && pos.x > startX && pos.x < startX + GRID_COLS * cellW) {
        let col = Math.floor((pos.x - startX) / cellW);
        let row = Math.floor((pos.y - startY) / cellH);
        let idx = row * GRID_COLS + col;
        if (state.grid[idx]) {
            let cell = state.grid[idx];
            if (!cell.isVisible) return;
            if (!cell.isEnemy) {
                if (cell.item === 'DOOR') {
                    if (state.keysFound >= state.keysNeeded) dgui.confirmDialog.classList.remove('hidden');
                    else state.particles.push(new Particle(pos.x, pos.y, T('particle_key_missing'), '#ffa726', 'text'));
                    return;
                }
            }
        }
    }
    for (let i = 4; i >= 0; i--) {
        const c = state.cards[i];
        if (c && pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
            // 未確定ジョーカーはドラッグせず数値選択ピッカーを開く
            if (c.isJoker && !c.jokerChosen) {
                showJokerPicker(i);
                return;
            }
            state.dragInfo = { slotIndex: i, offsetX: pos.x - c.x, offsetY: pos.y - c.y };
            c.isDragging = true;
            break;
        }
    }
}

function onMove(e) {
    if (!state.dragInfo) return;
    const pos = getEventPos(e);
    const c = state.cards[state.dragInfo.slotIndex];
    if (c) { c.x = pos.x - state.dragInfo.offsetX; c.y = pos.y - state.dragInfo.offsetY; }
}

function onUp(e) {
    if (!state.dragInfo) return;
    const idx = state.dragInfo.slotIndex;
    const card = state.cards[idx];
    if (!card) { state.dragInfo = null; return; }
    const cx = card.x + card.width / 2;
    const cy = card.y + card.height / 2;
    let actionDone = false;

    const cellW = state.boardW / GRID_COLS;
    const cellH = cellW * 0.95;
    const startX = state.boardX;
    const startY = state.gridAreaY;

    if (cy < startY + GRID_ROWS * cellH + 20) {
        let col = Math.floor((cx - startX) / cellW);
        let row = Math.floor((cy - startY) / cellH);
        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
            let cellIdx = row * GRID_COLS + col;
            let cell = state.grid[cellIdx];
            if (cell.isVisible) {
                if (cell.isEnemy) {
                    if (card.value === cell.value) {
                        const gain = cell.value * cell.gemCount * (card.multiplier || 1);
                        state.score += gain;
                        state.panelsDestroyed++;
                        if (gain > state.maxSingleScore) state.maxSingleScore = gain;
                        addDungeonLog(T('dlog_panel_break', {color: getNumberColor(cell.value), val: cell.value, n: gain}));
                        gainExp(gain);

                        setTimeout(() => state.particles.push(new Particle(cx, cy, `+${gain}`, '#ffd54f', 'text')), 0);
                        setTimeout(() => checkPraise(gain, cx, cy), 300);
                        cell.isEnemy = false; revealUnknown(row, col);
                        if (cell.item && cell.item !== 'DOOR') setTimeout(() => collectItem(cell), 400);
                        state.cards[idx] = null; actionDone = true;
                    }
                    // ※不正解の場合はカードが戻るだけ（メッセージなし）
                }
                else if (cell.item === 'CREATURE' || cell.item === 'BOSS') {
                    if (card.value === cell.creatureValue) {
                        const isBoss = (cell.item === 'BOSS');
                        const bonus = isBoss ? 5 : 2;
                        const gain = cell.creatureValue * (cell.gemCount || 1) * (card.multiplier || 1) * bonus;
                        state.score += gain;
                        let rec = isBoss ? 20 : 5;
                        state.time += rec;

                        state.particles.push(new Particle(cx, cy, `+${gain}`, '#ffd54f', 'text'));
                        state.particles.push(new Particle(cx, cy+40, `Time+${rec}`, '#66bb6a', 'text'));
                        state.particles.push(new Particle(cx, cy-40, T('particle_defeat'), '#ef5350', 'text'));
                        addDungeonLog(T('dlog_enemy_defeat', {n: gain}));
                        gainExp(gain);

                        if (isBoss) {
                            cell.item = 'DOOR';
                        } else {
                            cell.item = null;
                        }

                        state.cards[idx] = null; actionDone = true;
                    }
                    // ※不正解の場合はカードが戻るだけ（メッセージなし）
                }
            }
        }
    }
    if (!actionDone) {
        for (let i = 0; i < 5; i++) {
            if (i === idx) continue;
            const target = state.cards[i];
            if (!target) continue;
            const dx = cx - (target.x + target.width / 2);
            const dy = cy - (target.y + target.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < card.width * 0.8) {
                target.value = target.value * card.value;
                target.multiplier = (target.multiplier || 1) * (card.multiplier || 1);
                target.stackCount += card.stackCount;
                state.cards[idx] = null; consumeTime(); checkCreatureAttack(); actionDone = true;
                state.particles.push(new Particle(target.x + target.width / 2, target.y + target.height / 2, "x", '#4fc3f7', 'circle'));
                break;
            }
        }
    }
    if (!actionDone) {
        const tr = state.trashRect;
        if (cx >= tr.x && cx <= tr.x + tr.w && cy >= tr.y && cy <= tr.y + tr.h) {
            const oldVal = state.cards[idx].value;
            state.cards[idx] = new Card(idx, oldVal);
            consumeTime(); checkCreatureAttack(); actionDone = true;
        }
    }
    if (actionDone) { refillCards(); updateUI(); } else { card.isDragging = false; }
    state.dragInfo = null;
}

const confirmAction = () => {
    dgui.confirmDialog.classList.add('hidden');
    const fl = state.floor;
    state.stageScores[fl - 1] = state.score - state.stageStartScore;
    if (fl < MAX_FLOOR) {
        state.time += stageClearTime(fl);
        updateUI();
        addDungeonLog(T('dlog_floor_clear_ap', { n: fl }));
        state.inputLocked = true;
        showStageClear(fl, state.stageScores[fl - 1]);
    } else {
        addDungeonLog(T('dlog_floor_clear', { n: fl }));
        gameClear();
    }
};
const cancelAction = () => { dgui.confirmDialog.classList.add('hidden'); };

bindBtn(dgui.btnYes, confirmAction);
bindBtn(dgui.btnNo, cancelAction);

canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', (e) => {
    if (itemDrag.active && itemDrag.floatEl) {
        itemDrag.floatEl.style.left = e.clientX + 'px';
        itemDrag.floatEl.style.top = e.clientY + 'px';
    }
    onMove(e);
});
window.addEventListener('mouseup', (e) => {
    if (itemDrag.active) { finalizeItemDrop(e); } else { onUp(e); }
});
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
window.addEventListener('touchmove', (e) => {
    if (!dgui.howto.classList.contains('hidden')) return;
    // アイテムドラッグ中はリスト内からでも追従させる（targetはtouchstart要素に固定のため）
    if (itemDrag.active) {
        e.preventDefault();
        if (itemDrag.floatEl) {
            itemDrag.floatEl.style.left = e.touches[0].clientX + 'px';
            itemDrag.floatEl.style.top = e.touches[0].clientY + 'px';
        }
        return;
    }
    // #item-list やランキング等のスクロール可能なオーバーレイ内はタッチスクロールを妨害しない
    if (e.target.closest && (e.target.closest('#item-list') || e.target.closest('.overlay-content') || e.target.closest('.ranking-list') || e.target.closest('.howto-inner'))) return;
    e.preventDefault();
    onMove(e);
}, { passive: false });
window.addEventListener('touchend', (e) => {
    if (!dgui.howto.classList.contains('hidden')) return;
    if (itemDrag.active) {
        e.preventDefault();
        finalizeItemDrop(e);
        return;
    }
    if (e.target.closest && (e.target.closest('#item-list') || e.target.closest('.overlay-content') || e.target.closest('.ranking-list') || e.target.closest('.howto-inner'))) return;
    e.preventDefault();
    onUp(e);
}, { passive: false });

