// Math Braves 戦闘エンジン: 手札カード・敵・ステージ制RUN・戦闘画面のDOM描画・エフェクト・各ボタンの結線。
// braves-common.js の後に読み込む。
// ===== 敵キャラ定義（multiplication2ベース 5形状×6色=30種） =====
// 形状0=波底ぶよぶよ, 1=丸角四角, 2=葉っぱ, 3=八角星, 4=まる
function getEnemyConfig(type) {
    return { shape: Math.floor(type / 6) % 5, ...ENEMY_COLORS[type % 6] };
}


// ===== HP制+ショップ(たしざん/ひきざん) =====
// 「残り時間」のかわりに「じぶんのHP」。手札をかさねる/すてるたびに、てきが こうげきしてくる(ガードで ふせげる)。
// てきを たおすと、あたえたダメージと おなじ数の「コイン」がもらえ、ステージクリアで HP が ぜんかいふくして ショップが ひらく。
const PLAYER_HP = 100;           // はじめのHP(ステージをクリアすると ぜんかいふく)
const HP_UP = 20;                // 「さいだいHPアップ」1つぶん
const GUARD_CAP = 0.7;           // ガードの かくりつの うえげん
const SHOP_PRICE = Object.assign({ hp: 500, atk: 300, guard: 250 }, GAME.shopPrice || {});   // hp: さいだいHP+20 / atk: こうげき+10%ごと / guard: ガード5%ごと
const SHOP_SALE = 0.7;           // 5つのうち1つだけ 30%オフ
const SHOP_ITEMS = (() => {
    const l = [{ id: 'hp', kind: 'hp', n: 1 }];
    for (let i = 1; i <= 10; i++) l.push({ id: 'a' + i, kind: 'atk', n: i });       // こうげき +10%〜+100%
    for (let i = 1; i <= 10; i++) l.push({ id: 'g' + i, kind: 'guard', n: i });     // ガード 5%〜50%
    return l;
})();
function shopItemPrice(it) { return it.kind === 'hp' ? SHOP_PRICE.hp : it.kind === 'atk' ? SHOP_PRICE.atk * it.n : SHOP_PRICE.guard * it.n; }

(function addBattleStrings() {
    const S = {
        ja: {
            label_hp: 'HP', label_coins: 'コイン', label_power: 'つよさ',
            pw_atk: 'こうげき +{n}%', pw_guard: 'ガード {n}%', pw_hp: 'さいだいHP {n}', pw_none: 'まだ なし',
            guard_text: 'ガード！',
            shop_title: 'ショップ', shop_sub: 'コインで どうぐを かおう！ 1つだけ 30%オフ！',
            shop_hp_name: 'さいだいHP +{n}', shop_hp_desc: 'さいだいHPが {n} ふえる',
            shop_atk_name: 'こうげき +{n}%', shop_atk_desc: 'ダメージが {n}% あがる',
            shop_guard_name: 'ガード {n}%', shop_guard_desc: 'てきの こうげきを {n}% の かくりつで ふせぐ',
            shop_sale: '30%オフ', shop_buy: 'かう', shop_sold: 'かった！', shop_short: 'コインが たりない', shop_next: 'つぎの ステージへ ▶',
            shop_have: 'もっている コイン', shop_stage: 'ステージ {n} クリア！',
            sc_hp_full: 'HP', sc_hp_full_v: 'ぜんかいふく！', sc_coins: 'もっている コイン',
            btn_next_stage: 'ショップへ ▶',
            bd_time: 'のこりHP',
        },
        simple: {
            label_hp: 'HP', label_coins: 'コイン', label_power: 'つよさ',
            pw_atk: 'こうげき +{n}%', pw_guard: 'ガード {n}%', pw_hp: 'さいだいHP {n}', pw_none: 'まだ なし',
            guard_text: 'ガード！',
            shop_title: 'ショップ', shop_sub: 'コインで どうぐを かおう！ 1つだけ 30%オフ！',
            shop_hp_name: 'さいだいHP +{n}', shop_hp_desc: 'さいだいHPが {n} ふえる',
            shop_atk_name: 'こうげき +{n}%', shop_atk_desc: 'ダメージが {n}% あがる',
            shop_guard_name: 'ガード {n}%', shop_guard_desc: 'てきの こうげきを {n}% の かくりつで ふせぐ',
            shop_sale: '30%オフ', shop_buy: 'かう', shop_sold: 'かった！', shop_short: 'コインが たりない', shop_next: 'つぎの ステージへ ▶',
            shop_have: 'もっている コイン', shop_stage: 'ステージ {n} クリア！',
            sc_hp_full: 'HP', sc_hp_full_v: 'ぜんかいふく！', sc_coins: 'もっている コイン',
            btn_next_stage: 'ショップへ ▶',
            bd_time: 'のこりHP',
        },
        en: {
            label_hp: 'HP', label_coins: 'Coins', label_power: 'Power-ups',
            pw_atk: 'Attack +{n}%', pw_guard: 'Guard {n}%', pw_hp: 'Max HP {n}', pw_none: 'None yet',
            guard_text: 'Guard!',
            shop_title: 'Shop', shop_sub: 'Spend your coins! One item is 30% off!',
            shop_hp_name: 'Max HP +{n}', shop_hp_desc: 'Max HP goes up by {n}',
            shop_atk_name: 'Attack +{n}%', shop_atk_desc: 'Damage goes up by {n}%',
            shop_guard_name: 'Guard {n}%', shop_guard_desc: '{n}% chance to block an enemy attack',
            shop_sale: '30% OFF', shop_buy: 'Buy', shop_sold: 'Bought!', shop_short: 'Not enough coins', shop_next: 'Next Stage ▶',
            shop_have: 'Your coins', shop_stage: 'Stage {n} clear!',
            sc_hp_full: 'HP', sc_hp_full_v: 'Fully restored!', sc_coins: 'Your coins',
            btn_next_stage: 'To the Shop ▶',
            bd_time: 'HP left',
        },
    };
    Object.keys(S).forEach(l => { if (STRINGS[l]) Object.assign(STRINGS[l], S[l]); });
})();

class Card {
    constructor(slotIndex) {
        this.slotIndex = slotIndex;
        this.value = randomInt(CONFIG.handMin, CONFIG.handMax);
        this.stackCount = 1;
        
        const baseSize = Math.min(state.width, state.height * 1.5);
        this.width = baseSize * 0.13;
        this.height = this.width * 1.4;
        this.baseX = 0;
        this.baseY = state.height * 0.65;
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        
        const spacing = state.width / 6;
        this.baseX = spacing * (slotIndex + 1) - this.width / 2;
        this.x = this.baseX;
        this.y = this.baseY;
    }

    draw(ctx) { /* CSSで描画(renderBattle) */ }
}

class Enemy {
    constructor(isBoss = false) {
        this.isBoss = isBoss;
        const baseSize = Math.min(state.width, state.height * 1.5);
        const singleCardW = Math.floor(baseSize * 0.19 - 6);
        this.cardSize = singleCardW;

        const gap = 8;
        if (isBoss) {
            this.width = 2 * singleCardW + gap;         // ボス：2枚並列
            this.height = Math.ceil(singleCardW * 2.5);
            const v1 = randomInt(CONFIG.bossMin, CONFIG.bossMax);
            let v2 = randomInt(CONFIG.bossMin, CONFIG.bossMax);
            const bossRange = CONFIG.bossMax - CONFIG.bossMin;
            while (v2 === v1 && bossRange > 0) v2 = randomInt(CONFIG.bossMin, CONFIG.bossMax);
            this.values = [v1, v2];
            this.gemCounts = [
                getWeightedRandom(CONFIG.gemProb),
                getWeightedRandom(CONFIG.gemProb)
            ];
            this.maxHp = CONFIG.bossHP;
            this.hp = CONFIG.bossHP;
            this.displayHp = CONFIG.bossHP;
            this.type = -1;
        } else {
            this.width = 3 * singleCardW + 2 * gap;    // 通常敵：3枚並列
            this.height = Math.ceil(singleCardW * 2.5);
            this.gemCounts = [
                getWeightedRandom(CONFIG.gemProb),
                getWeightedRandom(CONFIG.gemProb),
                getWeightedRandom(CONFIG.gemProb)
            ];
            this.colorIndex = randomInt(0, 5);
            const n = state.normalKills + 1;
            this.maxHp = CONFIG.hpBase + CONFIG.hpStep * (n - 1);
            this.hp = this.maxHp;
            this.displayHp = this.maxHp;
            const vRange = CONFIG.enemyMax - CONFIG.enemyMin + 1;
            const vCount = Math.min(3, vRange);
            const vSet = new Set();
            while (vSet.size < vCount) {
                vSet.add(randomInt(CONFIG.enemyMin, CONFIG.enemyMax));
            }
            this.values = [...vSet];
            const avgGem0 = Math.round(this.gemCounts.reduce((a, b) => a + b, 0) / 3);
            this.shape = (avgGem0 - 1) % 5;
        }

        this.isDefeated = false;
        this.defeatProcessed = false;
        this.hitFrames = 0;
        this.slotIndex = 0;
        this.x = 0;
        this.y = state.height * 0.09;  // HUD直下
    }

    // j 番目のまとカードだけを再生成（他のカードはそのまま）
    reroll(j) {
        const range = this.isBoss ? CONFIG.bossMax - CONFIG.bossMin : CONFIG.enemyMax - CONFIG.enemyMin;
        // 他のカードの値と重複しないよう新しい値を引き直す
        const otherVals = this.values.filter((_, idx) => idx !== j);
        let newVal = randomInt(this.isBoss ? CONFIG.bossMin : CONFIG.enemyMin,
                               this.isBoss ? CONFIG.bossMax : CONFIG.enemyMax);
        let tries = 0;
        while (otherVals.includes(newVal) && range > 0 && tries < 50) {
            newVal = randomInt(this.isBoss ? CONFIG.bossMin : CONFIG.enemyMin,
                               this.isBoss ? CONFIG.bossMax : CONFIG.enemyMax);
            tries++;
        }
        this.values[j]    = newVal;
        this.gemCounts[j] = getWeightedRandom(CONFIG.gemProb);
    }

    // まとカード j の当たり判定矩形を返す（ボス・通常敵共通）
    getCardRect(j) {
        const gap = 8;
        const cardX = this.x + j * (this.cardSize + gap);
        const cardY = this.y + this.height - this.cardSize + 44; // まとカードを少し下へ
        return { x: cardX, y: cardY, w: this.cardSize, h: this.cardSize };
    }

    draw(ctx) { /* CSSで描画(renderBattle) */ }
}

class Particle {
    constructor(x, y, text, color, type = 'text', fontSize = 34) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.type = type;
        this.fontSize = fontSize;
        this.life = 1.0;
        this.size = 0;
        this.vy = -3;
        if (type === 'text') fxText(x, y, text, color, fontSize);
        else if (type === 'circle') fxRing(x, y, color);
    }
    update() {
        if (this.type === 'text') {
            this.y += this.vy;
            this.life -= 0.015;
        } else if (this.type === 'circle') {
            this.size += 8;
            this.life -= 0.04;
        }
    }
    draw(ctx) { /* CSSで描画 */ }
}

// 手札カードがまとカードへ突っ込んでいくエフェクト
class FlyingCard {
    constructor(fromX, fromY, toX, toY, value, stackCount, cardW, cardH) {
        this.fromX = fromX; this.fromY = fromY;
        this.toX   = toX;   this.toY   = toY;
        this.value = value; this.stackCount = stackCount;
        this.cardW = cardW; this.cardH = cardH;
        this.totalFrames = 18;
        this.frame = 0;
        this.done  = false;
        fxFlyCard(this);
    }
    get progress() { return Math.min(1, this.frame / this.totalFrames); }
    update() {
        this.frame++;
        if (this.frame >= this.totalFrames) this.done = true;
    }
    draw(ctx) { /* CSSで描画 */ }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function backToTitle() {
    state.screen = 'TITLE';
    hideAllOverlays();
    ui.title.classList.remove('hidden');
    ui.btnToTitle.classList.add('hidden');
    ui.result.style.display = 'none';
    clearBattleLayer();

    updateTitleScreenStats();
    updateCurrentPlayerDisplay();
    ctx.clearRect(0, 0, state.width, state.height);
}

function initGame() {
    state.score = 0;
    state.lastScore = 0;
    state.maxScore = 0;
    state.maxHp = PLAYER_HP;       // HP制: ステージクリアで ぜんかいふく。ショップで さいだいHPが ふえる
    state.hp = PLAYER_HP;
    state.coins = 0;               // コイン(あたえたダメージと おなじ数だけ もらえる)
    state.atkBonus = 0;            // ショップで かった こうげきアップの ごうけい(0.3 = +30%)
    state.guard = 0;               // ショップで かった ガードの かくりつの ごうけい
    state.hpBought = 0;            // さいだいHPアップを かった数
    state.time = 0;
    state.stage = 1;
    state.normalKills = 0;
    state.runMode = false;
    state.stageStartScore = 0;
    state.stageScores = [];
    state.enemiesRemaining = STAGE_ENEMIES;
    state.bossSpawned = false;
    state.cards = [null, null, null, null, null];
    state.enemies = [];
    state.particles = [];
    state.boss = null;
    state.isGameOverProcessing = false;
    state.isGameClearProcessing = false;
    state.inputLocked = false;
    state.defeatedCount = 0;
    state.totalConsumedTime = 0;
    state.forbiddenValue = null;
    state.shakeFrames = 0;
    state.flyingCards = [];
    state.bossTurnCount = 0;
    state.bossAttackEffect = 0;
    state.battleLog = [];
    clearBattleLog();
    resetLastHit();
    SP.powerSig = '';

    hideAllOverlays();
    clearBattleLayer();
    updateStageLabel();
    setBattleBackground(false);
    resize();
    refillCards();
    refillEnemies();

    updateUI();
    state.screen = 'PLAYING';
    ui.title.classList.add('hidden');
    ui.btnToTitle.classList.remove('hidden');
    ui.rightPanelContent.classList.remove('invisible');

    startLoop();
}

function refillCards() {
    for (let i = 0; i < 5; i++) {
        if (state.cards[i] === null) {
            state.cards[i] = new Card(i);
            if (state.forbiddenValue !== null && state.cards[i].value === state.forbiddenValue) {
                while(state.cards[i].value === state.forbiddenValue) {
                    state.cards[i].value = randomInt(CONFIG.handMin, CONFIG.handMax);
                }
            }
        }
    }
    state.forbiddenValue = null;
}

function setBattleBackground(isBoss) {
    // 背景画像は使わない。ステージ色とボス演出は renderBattle が #game-area に反映する
}

function refillEnemies() {
    if (state.bossSpawned || state.isGameClearProcessing) return;

    if (state.enemiesRemaining <= 0 && state.enemies.length === 0) {
        const boss = new Enemy(true);
        state.boss = boss;
        state.enemies.push(boss);
        state.bossSpawned = true;
        state.bossTurnCount = 0;
        setBattleBackground(true);
        updateUI();
        return;
    }

    if (state.enemies.length === 0 && state.enemiesRemaining > 0) {
        const enemy = new Enemy(false);
        enemy.slotIndex = 0;
        state.enemies.push(enemy);
        state.enemiesRemaining--;
    }
}

const SP = { enemySig: '', scoreSig: -1, coinSig: -1, powerSig: '' };
function updateUI() {
    ui.playerNameDisplay.textContent = state.playerName;
    document.getElementById('sp-av').textContent = Array.from(state.playerName || '?')[0];

    if (state.boss || state.bossSpawned) {
        ui.enemyRange.textContent = `${CONFIG.bossMin}〜${CONFIG.bossMax}`;
    } else {
        ui.enemyRange.textContent = `${CONFIG.enemyMin}〜${CONFIG.enemyMax}`;
    }

    const normalLeft = Math.max(0, state.enemiesRemaining + state.enemies.filter(e => !e.isBoss && !e.isDefeated).length);
    ui.enemies.textContent = state.boss ? 'BOSS' : normalLeft;
    // てきロボのならび(ざこ → ボス)
    const killed = Math.max(0, Math.min(STAGE_ENEMIES, STAGE_ENEMIES - normalLeft));
    const sig = killed + '|' + (state.boss ? 1 : 0);
    if (SP.enemySig !== sig) {
        SP.enemySig = sig;
        let h = '';
        for (let k = 0; k < STAGE_ENEMIES; k++) h += `<div class="tk ${k < killed ? 'done' : (k === killed && !state.boss ? 'now' : '')}"><i></i></div><span class="ch"></span>`;
        h += `<div class="tk boss ${state.boss ? 'now' : ''}"><i></i></div>`;
        document.getElementById('sp-foes').innerHTML = h;
    }
    ui.maxScore.textContent = state.maxScore;
    ui.totalScore.textContent = state.score;
    const coinEl = document.getElementById('disp-coins');
    if (coinEl && SP.coinSig !== state.coins) {
        if (SP.coinSig >= 0 && state.coins > SP.coinSig) { coinEl.classList.remove('bump'); void coinEl.offsetWidth; coinEl.classList.add('bump'); }
        SP.coinSig = state.coins; coinEl.textContent = state.coins;
    }
    updatePowerUI();
    if (SP.scoreSig !== state.score) {
        if (SP.scoreSig >= 0 && state.score > SP.scoreSig) { ui.totalScore.classList.remove('bump'); void ui.totalScore.offsetWidth; ui.totalScore.classList.add('bump'); }
        SP.scoreSig = state.score;
    }
}

// 買った どうぐ(つよさ)の 表示
function powerLines() {
    const l = [];
    if (state.atkBonus > 0) l.push(T('pw_atk', { n: Math.round(state.atkBonus * 100) }));
    if (state.guard > 0) l.push(T('pw_guard', { n: Math.round(state.guard * 100) }));
    if (state.hpBought > 0) l.push(T('pw_hp', { n: state.maxHp }));
    return l;
}
function updatePowerUI() {
    const el = document.getElementById('disp-powers');
    if (!el) return;
    const l = powerLines(), sig = l.join('|') + '#' + currentLang;
    if (SP.powerSig === sig) return;
    SP.powerSig = sig;
    el.innerHTML = l.length ? l.map(t => `<div class="pw">${t}</div>`).join('') : `<div class="pw none">${T('pw_none')}</div>`;
}

function scoreParticleFontSize(damage) {
    return Math.min(66, Math.floor(26 + Math.sqrt(damage) * 1.5));
}

// ── バトルログ(右のパネルはなくしたので、あれば出す・なければ何もしない) ──
function addBattleLog(html) {
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
function clearBattleLog() {
    const el = document.getElementById('battle-log-entries');
    if (el) el.innerHTML = '';
}

// ── てきの こうげき ────────────────────────────
// 手札を「かさねる」「すてる」たびに、いまのてきが こうげきしてくる(てきを こうげきしたときは こない)。
// ガードのかくりつに あたると、ダメージは 0。HPが 0 になると ゲームオーバー
function enemyAttack() {
    if (state.isGameClearProcessing || state.isGameOverProcessing || state.screen !== 'PLAYING') return;
    const foe = state.enemies.find(e => !e.isDefeated);
    if (!foe) return;
    setTimeout(() => {   // 自分の動きを見せてから こうげき
        if (state.screen !== 'PLAYING' || state.isGameClearProcessing || state.isGameOverProcessing || foe.isDefeated) return;
        const dmg = Math.max(1, (foe.isBoss ? CONFIG.atkBoss : CONFIG.atkNormal) || (foe.isBoss ? 6 : 4));
        if (state.guard > 0 && Math.random() < state.guard) {
            fxHpNote(T('guard_text'), '#4fc3f7');
            if (BL.hpBox) { BL.hpBox.classList.remove('guard'); void BL.hpBox.offsetWidth; BL.hpBox.classList.add('guard'); }
            if (foe._mon) { foe._mon.classList.remove('atk'); void foe._mon.offsetWidth; foe._mon.classList.add('atk'); }
            return;
        }
        state.hp = Math.max(0, state.hp - dmg);
        fxHurt(dmg, foe);
        updateUI();
        if (state.hp <= 0 && !state.isGameOverProcessing) {
            state.isGameOverProcessing = true;
            state.inputLocked = true;
            setTimeout(() => { if (state.screen === 'PLAYING') gameOver(); }, 700);
        }
    }, 140);
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    if (isMobileRotated) {
        const px = cx - rect.left, py = cy - rect.top;
        return {
            x: py * (canvas.height / rect.width),
            y: canvas.height - px * (canvas.width / rect.height)
        };
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (cx - rect.left) * scaleX,
        y: (cy - rect.top) * scaleY
    };
}

function onDown(e) {
    if (state.screen !== 'PLAYING' || state.inputLocked) return;
    
    const pos = getEventPos(e);
    
    for (let i = 4; i >= 0; i--) {
        const c = state.cards[i];
        if (c && pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
            state.dragInfo = {
                slotIndex: i,
                offsetX: pos.x - c.x,
                offsetY: pos.y - c.y
            };
            c.isDragging = true;
            break;
        }
    }
}

function onMove(e) {
    if (!state.dragInfo) return;
    const pos = getEventPos(e);
    const c = state.cards[state.dragInfo.slotIndex];
    if (c) {
        c.x = pos.x - state.dragInfo.offsetX;
        c.y = pos.y - state.dragInfo.offsetY;
    }
}

function onUp(e) {
    if (!state.dragInfo) return;
    
    const idx = state.dragInfo.slotIndex;
    const card = state.cards[idx];
    if (!card) { state.dragInfo = null; return; }

    const cx = card.x + card.width/2;
    const cy = card.y + card.height/2;
    
    let actionDone = false;

    for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (enemy.isDefeated) continue;

        // どのまとカードを狙ったか判定（ボス2枚・通常敵3枚）
        let hitJ = -1;
        const cardCount = enemy.values.length;
        for (let j = 0; j < cardCount; j++) {
            const rect = enemy.getCardRect(j);
            if (cx >= rect.x && cx <= rect.x + rect.w &&
                cy >= rect.y && cy <= rect.y + rect.h) {
                hitJ = j;
                break;
            }
        }

        if (hitJ >= 0) {
            // ゲームによっては、条件を満たさないカードでは攻撃できない(例: ひきざんは1回かさねてから)
            if (!GAME.rules.canAttack(card)) {
                state.particles.push(new Particle(cx, cy - 20, T('stack_first'), '#ff8a80', 'text', 26));
                break;
            }
            const checkVal = enemy.values[hitJ];
            if (card.value === checkVal) {
                const gemCount = enemy.gemCounts[hitJ];
                const damage   = Math.round(GAME.rules.damage(card, gemCount, checkVal) * (1 + state.atkBonus));   // ショップの こうげきアップ

                // 手札カードがまとカードへ突っ込むエフェクト
                const tRect = enemy.getCardRect(hitJ);
                state.flyingCards.push(new FlyingCard(
                    card.x + card.width / 2, card.y + card.height / 2,
                    tRect.x + tRect.w / 2,   tRect.y + tRect.h / 2,
                    card.value, card.stackCount, card.width, card.height
                ));

                enemy.hitFrames = 16;
                state.score += damage;
                state.coins += damage;                 // コイン = あたえたダメージ(スコア)と おなじ数
                state.lastScore = damage;
                if (damage > state.maxScore) state.maxScore = damage;

                const scoreFs = scoreParticleFontSize(damage);
                state.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y, `+${damage}`, '#ffca28', 'text', scoreFs));
                state.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "", "#ef5350", "circle"));

                state.cards[idx] = null;                // こうげきは ただ(てきの こうげきは こない)

                enemy.hp -= damage;

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.isDefeated = true;
                } else {
                    enemy.reroll(hitJ);
                }
                actionDone = true;
            }
            break;
        }
    }

    if (!actionDone) {
        for (let i = 0; i < 5; i++) {
            if (i === idx) continue;
            const target = state.cards[i];
            if (!target) continue;

            const dx = cx - (target.x + target.width/2);
            const dy = cy - (target.y + target.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < card.width * 0.8) {
                const newValue = GAME.rules.merge(target.value, card.value);   // 重ねたあとの数(重ねられないときはnull)
                if (newValue !== null) {
                    target.value = newValue;
                    target.stackCount += card.stackCount;
                    state.cards[idx] = null;
                    enemyAttack();                  // かさねるたびに、てきが こうげき
                    actionDone = true;
                    state.particles.push(new Particle(target.x + target.width/2, target.y + target.height/2, "", "#29b6f6", "circle"));
                }
                break;
            }
        }
    }

    if (!actionDone) {
        if (cy > state.height * 0.87) {
            state.forbiddenValue = state.cards[idx].value;
            state.cards[idx] = null;
            enemyAttack();                          // すてるたびに、てきが こうげき
            actionDone = true;
        }
    }

    if (actionDone) {
        refillCards();
        refillEnemies();
        updateUI();
    } else {
        card.isDragging = false;
    }

    state.dragInfo = null;
}

canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, {passive: false});
window.addEventListener('touchmove', (e) => {
    // ランキング等スクロール可能なオーバーレイ内はタッチスクロールを妨害しない
    if (e.target.closest && (e.target.closest('.overlay-content') || e.target.closest('.ranking-list'))) return;
    e.preventDefault(); onMove(e);
}, {passive: false});
window.addEventListener('touchend', (e) => {
    if (e.target.closest && (e.target.closest('.overlay-content') || e.target.closest('.ranking-list'))) return;
    e.preventDefault(); onUp(e);
}, {passive: false});

function gameLoop() {
    if (state.screen !== 'PLAYING') { loopActive = false; return; }

    ctx.clearRect(0, 0, state.width, state.height);

    // HP スムーズアニメーション（displayHp → hp へ徐々に近づける）
    state.enemies.forEach(enemy => {
        if (enemy.displayHp > enemy.hp) {
            const speed = Math.max(3, (enemy.displayHp - enemy.hp) * 0.3, enemy.maxHp / 40);   // ゲージは 0.3 秒ほどで 減りきる
            enemy.displayHp -= speed;
            if (enemy.displayHp < enemy.hp) enemy.displayHp = enemy.hp;
        }
    });

    // 倒れた敵の処理（displayHp が 0 に達したら除去）
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        if (enemy.isDefeated && !enemy.defeatProcessed && enemy.displayHp <= 0.5) {
            enemy.defeatProcessed = true;
            enemy.displayHp = 0;
            state.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "", "#ef5350", "circle"));
            if (enemy.isBoss) {
                state.inputLocked = true;
                state.isGameClearProcessing = true;
                state.defeatedCount++;
                const deadEnemy = enemy;
                setTimeout(() => {
                    const idx = state.enemies.indexOf(deadEnemy);
                    if (idx >= 0) state.enemies.splice(idx, 1);
                    state.boss = null;
                    setTimeout(() => { onBossDefeated(); }, 450);
                }, 250);
            } else {
                state.enemies.splice(i, 1);
                state.defeatedCount++;
                state.normalKills++;
                refillEnemies();
                updateUI();
            }
        }
    }

    renderBattle();

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.flyingCards.length - 1; i >= 0; i--) {
        const fc = state.flyingCards[i];
        fc.update();
        if (fc.done) state.flyingCards.splice(i, 1);
    }
    if (state.bossAttackEffect > 0) state.bossAttackEffect--;

    updateUI();

    requestAnimationFrame(gameLoop);
}

// ============================================================
//  ステージモード（RUN）: タイトル → RUN選択 → 7ステージ → 結果
// ============================================================
// 1RUN = 7ステージ。各ステージは「通常の敵 STAGE_ENEMIES 体 → ステージボス」。
// 残り時間(AP)と手札はステージをまたいで引きつぐ。★1〜3で手札/敵の数字の範囲とHPが変わる。
// しばり(RUNの種類)は骨格ができてから増やす予定。今は「ふつう」だけ。
const STAR_PRESETS = { 1: PRESET_EASY, 2: PRESET_NORMAL, 3: PRESET_HARD };
const STAGE_ENEMIES = 2;      // 1ステージの通常の敵の数
// てきの こうげき力(ENEMY_ATK はゲーム側で定義: n=ふつうのてき / nStep=ステージごとの増え方 / b=ボス / bStep)。ボット・シミュレーションで クリア率を測って決めた値。ルールを変えたら測り直す

function configForStage(star, stage) {
    const base = STAR_PRESETS[star] || PRESET_NORMAL;
    const lo = BOSS_MIN_SCALE[star] || 0.3;
    const bossScale = lo + (1 - lo) * (stage - 1) / (STAGE_COUNT - 1);   // ボスのHPはステージごとに増えて、最後は元のボスHP
    const a = (typeof ENEMY_ATK !== 'undefined' && ENEMY_ATK[star]) || { n: 4, nStep: 0.4, b: 6, bStep: 0.7 };
    return Object.assign({}, base, {
        bossHP: Math.max(50, Math.round(base.bossHP * bossScale / 10) * 10),
        atkNormal: Math.max(1, Math.round(a.n + a.nStep * (stage - 1))),
        atkBoss: Math.max(1, Math.round(a.b + a.bStep * (stage - 1))),
    });
}

let loopActive = false;
function startLoop() { if (loopActive) return; loopActive = true; requestAnimationFrame(gameLoop); }

function updateStageLabel() {
    const n = Math.min(state.stage, STAGE_COUNT);
    ui.difficultyLabel.textContent = `${n} / ${STAGE_COUNT}`;
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
    CONFIG = configForStage(star, 1);
    initGame();
    state.runMode = true;
    startStage(1);
}
function startStage(n) {
    state.stage = n;
    CONFIG = configForStage(state.star, n);
    state.stageStartScore = state.score;
    state.enemiesRemaining = STAGE_ENEMIES;
    state.bossSpawned = false; state.boss = null; state.enemies = [];
    state.bossTurnCount = 0; state.dragInfo = null;
    state.isGameClearProcessing = false;
    state.inputLocked = true;
    setBattleBackground(false);
    refillEnemies();
    updateStageLabel();
    updateUI();
    addBattleLog(T('stage_log', { n: n, name: stageName(n) }));
    showStageIntro(n, () => { state.inputLocked = false; });
}
function onBossDefeated() {
    if (state.screen !== 'PLAYING') return;
    const st = state.stage;
    const stageScore = state.score - state.stageStartScore;
    state.stageScores[st - 1] = stageScore;
    if (st >= STAGE_COUNT) { gameClear(); return; }
    state.hp = state.maxHp;                  // ステージクリアで HP ぜんかいふく
    if (BL.hpBox) { BL.hpBox.classList.remove('heal'); void BL.hpBox.offsetWidth; BL.hpBox.classList.add('heal'); }
    updateUI();
    showStageClear(st, stageScore);
}

// ---- RUNの結果（クリア／ゲームオーバー共通）----
function finishRun(cleared) {
    state.screen = cleared ? 'CLEAR' : 'GAMEOVER';
    ui.btnToTitle.classList.add('hidden');
    if (!cleared) state.stageScores[state.stage - 1] = state.score - state.stageStartScore;
    const timeBonus = state.hp * 10;         // のこりHPボーナス(HPが多いほど たかい)
    const maxScoreBonus = state.maxScore * 2;
    const clearBonus = cleared ? (GAME.clearBonus || 0) : 0;      // クリアボーナス(GAME.clearBonus。九九ポーカーと同じく、クリアした RUN の得点に足す)
    const finalScore = state.score + timeBonus + maxScoreBonus + clearBonus;
    const key = starKey(state.star);
    const isNewRecord = saveScore(key, finalScore, state.stage, cleared);
    if (cleared) incrementClearCount(key);
    showRunEnd(cleared, finalScore, isNewRecord, timeBonus, maxScoreBonus, clearBonus);
}
function gameOver() { finishRun(false); }
function gameClear() { finishRun(true); }

// ============================================================
//  戦闘画面のCSS描画
// ============================================================
// canvasは「入力を受けるだけ」の透明な面。見た目はすべて #bl の中のDOM(CSS)で描く。
// 座標は今までのcanvasと同じ(ゲームエリア内のpx)なので、当たり判定・チュートリアルの位置指定はそのまま使える。
const BL = { layer: null, lane: null, cap: null, capTx: null, hpBox: null, hpFl: null, hpNm: null, hpLb: null, hint: null, trash: null, trashTx: null, hand: [], lastHp: -1, lastLane: '' };
function initBattleLayer() {
    const area = document.getElementById('game-area');
    const layer = document.createElement('div');
    layer.id = 'bl';
    layer.innerHTML = `
        <div class="bl-lane"></div>
        <div class="bl-cap"><b></b></div>
        <div class="bl-trash"><span class="ic">${ICO.trash}</span><span class="tx"></span></div>
        <div class="bl-hp"><div class="hl"><span class="lb"></span><span class="nm">0</span></div><div class="bar"><div class="fl"></div></div></div>
        <div class="bl-hint" style="display:none"></div>`;
    area.insertBefore(layer, canvas);
    BL.layer = layer;
    BL.lane = layer.querySelector('.bl-lane');
    BL.cap = layer.querySelector('.bl-cap');
    BL.capTx = BL.cap.querySelector('b');
    BL.trash = layer.querySelector('.bl-trash');
    BL.trashTx = BL.trash.querySelector('.tx');
    BL.hpBox = layer.querySelector('.bl-hp');
    BL.hpLb = BL.hpBox.querySelector('.lb');
    BL.hpNm = BL.hpBox.querySelector('.nm');
    BL.hpFl = BL.hpBox.querySelector('.fl');
    BL.hpBox.addEventListener('animationend', (e) => { if (/^hp(Hurt|Guard|Heal)$/.test(e.animationName)) BL.hpBox.classList.remove('hurt', 'guard', 'heal'); });
    BL.hint = layer.querySelector('.bl-hint');
}
function clearBattleLayer() {
    if (!BL.layer) return;
    BL.layer.querySelectorAll('.hc, .en, .fx-t, .fx-r, .fx-fly, .bl-flash').forEach(el => el.remove());
    BL.hand = [];
    BL.lastHp = -1;
    BL.hint.style.display = 'none';
}

// 手札をドラッグしている間の「いま離すとどうなるか」
function cardInner(n, w, v) {
    return `<div class="tp" style="font-size:${w * 0.25}px"><span class="sw">${ICO.sword}</span>${n > 1 ? `<span class="mul">×${n}</span>` : ''}</div>
        <div class="nm" style="font-size:${w * (String(v).length > 1 ? 0.56 : 0.64)}px">${v}</div>`;
}
function showLastHit(a, b, c, d) {
    [a, b, c, d].forEach((v, i) => {
        const el = document.getElementById('lh-' + 'abcd'[i]);
        if (!el) return;
        el.textContent = v; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    });
}
function resetLastHit() { ['a', 'b', 'c', 'd'].forEach(k => { const el = document.getElementById('lh-' + k); if (el) el.textContent = '–'; }); }
function dragHint(c) {
    const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
    for (const e of state.enemies) {
        if (e.isDefeated) continue;
        for (let j = 0; j < e.values.length; j++) {
            const r = e.getCardRect(j);
            if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
                if (!GAME.rules.canAttack(c)) return { cls: 'bad', text: T('hint_stack') };
                if (c.value === e.values[j]) return { cls: 'hit', text: T('hint_hit', { n: Math.round(GAME.rules.damage(c, e.gemCounts[j], e.values[j]) * (1 + state.atkBonus)) }) };
                return { cls: 'bad', text: T('hint_bad') };
            }
        }
    }
    for (let i = 0; i < 5; i++) {
        const t = state.cards[i];
        if (!t || t === c) continue;
        if (Math.hypot(cx - (t.x + t.width / 2), cy - (t.y + t.height / 2)) < c.width * 0.8) {
            const h = GAME.rules.mergeHint(t.value, c.value);
            if (h.bad) return { cls: 'bad', text: h.bad };
            return { cls: '', text: h.text, tgt: t };
        }
    }
    if (cy > state.height * 0.87) return { cls: 'trash', text: T('hint_trash') };
    return null;
}

// ---- 敵キャラ(CSSで描くロボ。絵はゲーム側で定義した ROBOTS / ROBOT_BOSS) ----
function monHTML(shape) {
    return `<div class="glow"></div><div class="rbx">${ROBOTS[shape % ROBOTS.length]}</div>`;
}
function bossHTML() {
    return `<div class="glow"></div><div class="rbx big">${ROBOT_BOSS}</div>`;
}

function buildEnemyEl(enemy) {
    enemy.x = state.width / 2 - enemy.width / 2;
    const cs = enemy.cardSize, cx = enemy.x + enemy.width / 2;
    const hpBarH = 18, cardsTopY = enemy.y + enemy.height - cs;
    const hpBarY = cardsTopY - hpBarH - 2, charR = Math.floor(cs * 0.42);
    const charCY = hpBarY - 6 - charR, hpBarW = Math.ceil(charR * 2.6), hpBarX = cx - hpBarW / 2;
    const el = document.createElement('div');
    el.className = 'en';
    const monSize = enemy.isBoss ? 160 : 156;
    const cfgc = enemy.isBoss ? null : ENEMY_COLORS[enemy.colorIndex];
    el.innerHTML = `
        <div class="gnd" style="left:${cx - 66}px;top:${hpBarY - 20}px;width:132px"></div>
        <div class="mon${enemy.isBoss ? ' boss' : ''}" style="left:${cx - monSize / 2}px;top:${hpBarY - 12 - monSize}px;width:${monSize}px;height:${monSize}px;${cfgc ? `--c:${cfgc.body};--d:${cfgc.dark};` : ''}">${enemy.isBoss ? bossHTML() : monHTML(enemy.shape)}</div>
        ${enemy.isBoss ? `<div class="bosslbl" style="left:${hpBarX - 8}px;top:${hpBarY - 3}px">BOSS</div>` : ''}
        <div class="hp" style="left:${hpBarX}px;top:${hpBarY}px;width:${hpBarW}px"><div class="fl"></div><div class="tx"></div></div>`;
    enemy._mon = el.querySelector('.mon');
    enemy._fl = el.querySelector('.fl');
    enemy._tx = el.querySelector('.tx');
    enemy._ycs = [];
    for (let j = 0; j < enemy.values.length; j++) {
        const r = enemy.getCardRect(j);
        const y = document.createElement('div');
        y.className = 'yc';
        y.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;`;
        y.innerHTML = '<div class="st"></div><div class="nm"></div>';
        y._st = y.querySelector('.st'); y._nm = y.querySelector('.nm'); y._sig = '';
        y.addEventListener('animationend', (e) => { if (e.animationName === 'ycRoll') y.classList.remove('roll'); });
        el.appendChild(y);
        enemy._ycs.push(y);
    }
    enemy._el = el;
    BL.layer.appendChild(el);
}
function renderEnemy(enemy, dragCard) {
    if (!enemy._el) buildEnemyEl(enemy);
    // HP
    const pct = Math.max(0, enemy.displayHp / enemy.maxHp);
    enemy._fl.style.width = (pct * 100).toFixed(1) + '%';
    const cl = pct > 0.5 ? 'fl' : pct > 0.25 ? 'fl mid' : 'fl low';
    if (enemy._fl.className !== cl) enemy._fl.className = cl;
    const hpTxt = `${Math.ceil(enemy.displayHp)} / ${enemy.maxHp}`;
    if (enemy._tx.textContent !== hpTxt) enemy._tx.textContent = hpTxt;
    // まとカード
    enemy._ycs.forEach((y, j) => {
        const v = enemy.values[j], g = enemy.gemCounts[j], sig = v + ':' + g;
        if (y._sig !== sig) {
            const r = enemy.getCardRect(j);
            const starSize = Math.floor(Math.min(r.w * 0.22, r.w * 0.88 / (g * 1.08)));
            y._st.style.fontSize = starSize + 'px';
            y._st.innerHTML = '<i class="gs"></i>'.repeat(g);
            y._nm.style.fontSize = Math.floor(r.w * 0.5) + 'px';
            y._nm.textContent = v;
            if (y._sig !== '') { y.classList.remove('roll'); void y.offsetWidth; y.classList.add('roll'); }
            y._sig = sig;
        }
        const match = !!dragCard && !enemy.isDefeated && dragCard.value === v && GAME.rules.canAttack(dragCard);
        if (y._match !== match) { y._match = match; y.classList.toggle('match', match); }
    });
    // やられた時の揺れ
    if (enemy.hitFrames > 0) {
        if (enemy.hitFrames === 16) { enemy._mon.classList.remove('hit'); void enemy._mon.offsetWidth; enemy._mon.classList.add('hit'); }
        enemy.hitFrames--;
    }
}

// ---- 毎フレームの描画(DOM更新) ----
function renderBattle() {
    if (!BL.layer) initBattleLayer();
    const area = document.getElementById('game-area');
    const th = STAGE_THEMES[Math.min(state.stage, STAGE_COUNT) - 1] || STAGE_THEMES[0];
    if (area._sc !== th.c) { area._sc = th.c; area.style.setProperty('--sc', th.c); }
    const bossField = !!state.boss;
    if (area._boss !== bossField) { area._boss = bossField; area.classList.toggle('bossfield', bossField); }
    // 手札のレーン＋ひとこと
    const first = state.cards.find(c => c);
    if (first) {
        const key = first.baseY + '|' + first.height + '|' + state.width;
        if (BL.lastLane !== key) {
            BL.lastLane = key;
            BL.lane.style.cssText = `top:${first.baseY - 6}px;width:${state.width - 28}px;height:${first.height + 18}px;`;
            BL.cap.style.top = (first.baseY - 28) + 'px';
        }
    }
    const capT = T('bl_cap');
    if (BL.capTx.textContent !== capT) BL.capTx.textContent = capT;
    // 捨て場
    const trashTop = state.height * 0.87;
    if (BL.trash._top !== trashTop) { BL.trash._top = trashTop; BL.trash.style.top = trashTop + 'px'; }
    if (BL.trashTx.textContent !== T('canvas_discard_hint')) BL.trashTx.textContent = T('canvas_discard_hint');
    // じぶんの HP
    if (BL.hpLb.textContent !== T('label_hp')) BL.hpLb.textContent = T('label_hp');
    const hpTxt = `${state.hp} / ${state.maxHp}`;
    if (BL.hpNm.textContent !== hpTxt) BL.hpNm.textContent = hpTxt;
    const hpPct = Math.max(0, Math.min(1, state.hp / state.maxHp));
    BL.hpFl.style.width = (hpPct * 100).toFixed(1) + '%';
    BL.hpBox.classList.toggle('low', hpPct <= 0.3);
    BL.hpBox.classList.toggle('mid', hpPct > 0.3 && hpPct <= 0.6);
    // 手札
    const drag = state.cards.find(c => c && c.isDragging) || null;
    const hint = drag ? dragHint(drag) : null;
    for (let i = 0; i < 5; i++) {
        const c = state.cards[i];
        let el = BL.hand[i];
        if (!c) { if (el) { el.remove(); BL.hand[i] = null; } continue; }
        if (!el || el._c !== c) {
            if (el) el.remove();
            el = document.createElement('div');
            el.className = 'hc pop'; el._c = c; el._sig = '';
            el.style.width = c.width + 'px'; el.style.height = c.height + 'px';
            el.addEventListener('animationend', (e) => { if (e.animationName === 'hcPop') el.classList.remove('pop'); });
            BL.layer.appendChild(el);
            BL.hand[i] = el;
        }
        if (!c.isDragging) { c.x = c.baseX; c.y = c.baseY; }
        const sig = c.value + '|' + c.stackCount;
        if (el._sig !== sig) {
            el._sig = sig;
            const n = c.stackCount, w = c.width;
            el.className = el.className.replace(/\bst\d\b/g, '').trim() + (n > 1 ? ' st' + Math.min(n, 5) : '');
            el.innerHTML = cardInner(n, w, c.value);
        }
        el.style.transform = c.isDragging ? `translate(${c.x}px,${c.y}px) rotate(-3deg) scale(1.07)` : `translate(${c.x}px,${c.y}px)`;
        el.classList.toggle('dragging', !!c.isDragging);
        el.classList.toggle('tgt', !!hint && hint.tgt === c);
    }
    BL.trash.classList.toggle('over', !!hint && hint.cls === 'trash');
    // ドラッグ中の吹き出し
    if (hint && drag) {
        const hx = Math.max(95, Math.min(state.width - 95, drag.x + drag.width / 2));
        const hy = Math.max(44, drag.y - 12);
        BL.hint.style.display = '';
        BL.hint.style.left = hx + 'px'; BL.hint.style.top = hy + 'px';
        if (BL.hint._t !== hint.text) { BL.hint._t = hint.text; BL.hint.innerHTML = emo(hint.text); }
        const hc = 'bl-hint' + (hint.cls ? ' ' + hint.cls : '');
        if (BL.hint.className !== hc) BL.hint.className = hc;
    } else if (BL.hint.style.display !== 'none') {
        BL.hint.style.display = 'none';
    }
    // 敵
    const live = new Set(state.enemies);
    BL.layer.querySelectorAll('.en').forEach(el => {
        if (![...live].some(e => e._el === el) && !el.classList.contains('dead')) {
            el.classList.add('dead');
            setTimeout(() => el.remove(), 520);
        }
    });
    state.enemies.forEach(e => renderEnemy(e, drag));
}

// ---- エフェクト ----
function fxText(x, y, text, color, size) {
    if (!BL.layer) return;
    const el = document.createElement('div');
    el.className = 'fx-t';
    el.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px;color:${color};`;
    el.textContent = text;
    el.addEventListener('animationend', () => el.remove());
    BL.layer.appendChild(el);
}
function fxRing(x, y, color) {
    if (!BL.layer) return;
    const el = document.createElement('div');
    el.className = 'fx-r';
    el.style.cssText = `left:${x}px;top:${y}px;border-color:${color};`;
    el.addEventListener('animationend', () => el.remove());
    BL.layer.appendChild(el);
}
function fxFlyCard(f) {
    if (!BL.layer) return;
    const el = document.createElement('div');
    const n = f.stackCount;
    el.className = 'hc fx-fly' + (n > 1 ? ' st' + Math.min(n, 5) : '');
    el.style.width = f.cardW + 'px'; el.style.height = f.cardH + 'px';
    el.innerHTML = cardInner(n, f.cardW, f.value);
    el.style.transform = `translate(${f.fromX - f.cardW / 2}px,${f.fromY - f.cardH / 2}px)`;
    BL.layer.appendChild(el);
    setTimeout(() => {
        el.style.transform = `translate(${f.toX - f.cardW / 2}px,${f.toY - f.cardH / 2}px) scale(0.35)`;
        el.style.opacity = '0';
    }, 20);
    setTimeout(() => el.remove(), 420);
}
// HPの箱の上に ひとこと(「-5」「ガード！」)を出す
function fxHpNote(text, color) {
    if (!BL.layer || !BL.hpBox) return;
    const el = document.createElement('div');
    el.className = 'fx-t';
    const r = BL.hpBox.offsetLeft, t = BL.hpBox.offsetTop;
    el.style.cssText = `left:${r + 70}px;top:${t + 104}px;font-size:34px;color:${color};`;
    el.textContent = text;
    el.addEventListener('animationend', () => el.remove());
    BL.layer.appendChild(el);
}
// てきの こうげきを うけた: てきが とびかかる・HPの箱が ゆれる・画面が ちょっと赤くなる
function fxHurt(dmg, foe) {
    fxHpNote('-' + dmg, '#ff6b5e');
    if (BL.hpBox) { BL.hpBox.classList.remove('hurt'); void BL.hpBox.offsetWidth; BL.hpBox.classList.add('hurt'); }
    if (foe && foe._mon) { foe._mon.classList.remove('atk'); void foe._mon.offsetWidth; foe._mon.classList.add('atk'); }
    if (BL.layer) {
        const el = document.createElement('div');
        el.className = 'bl-hurt';
        el.addEventListener('animationend', () => el.remove());
        BL.layer.appendChild(el);
    }
}
function fxBossFlash() {
    if (!BL.layer) return;
    const el = document.createElement('div');
    el.className = 'bl-flash';
    el.innerHTML = `<b>${T('boss_attack_flash')}</b>`;
    el.addEventListener('animationend', () => el.remove());
    BL.layer.appendChild(el);
}

// ============================================================
//  ショップ(ステージクリアのあと)
// ============================================================
// 5つの どうぐが ランダムに ならび、1つだけ 30%オフ。コイン(=あたえたダメージ)で買う。同じ種類は 何回でも買えて、効果は たし算で ふえる。
GAME.hideNextStage = true;                                   // ステージクリアの画面に「つぎは〜」を出さない
GAME.clearHTML = (st, stageScore) => {
    const pts = T('unit_pts');
    return `<div><span>${T('sc_stage_score')}</span><b>${stageScore}${pts}</b></div>` +
        `<div><span>${T('sc_hp_full')}</span><b>${T('sc_hp_full_v')}</b></div>` +
        `<div><span>${T('sc_coins')}</span><b>${state.coins}</b></div>` +
        `<div class="big"><span>${T('result_total_score')}</span><b>${state.score}${pts}</b></div>`;
};
GAME.beforeNextStage = (cb) => openShop(cb);

const MBS_ICON = {
    hp: '<svg viewBox="0 0 48 48"><path d="M24 42C10 32 5 25 5 17.5 5 11.6 9.4 7 15 7c3.600 0 7 1.800 9 5 2-3.200 5.400-5 9-5 5.600 0 10 4.600 10 10.500C43 25 38 32 24 42z" fill="currentColor"/></svg>',
    atk: '<svg viewBox="0 0 48 48"><g transform="rotate(40 24 24)"><path d="M24 2l6 7v22H18V9z" fill="currentColor"/><path d="M9 31h30v5H9z" fill="currentColor"/><path d="M20.5 36h7v8h-7z" fill="currentColor"/><circle cx="24" cy="46" r="2.6" fill="currentColor"/><path d="M24 7v22" stroke="rgba(255,255,255,0.6)" stroke-width="2.4"/></g></svg>',
    guard: '<svg viewBox="0 0 48 48"><path d="M24 4l16 6v12c0 10-7 17-16 22C15 39 8 32 8 22V10z" fill="currentColor"/><path d="M24 12v26" stroke="rgba(255,255,255,0.55)" stroke-width="3"/></svg>',
};
let shopState = null;     // { list:[{it, price, sold}], saleIdx, cb }
function shopPick() {
    // ガードは うえげんに ついたら 出さない
    let pool = SHOP_ITEMS.filter(it => !(it.kind === 'guard' && state.guard >= GUARD_CAP - 1e-9));
    const picked = [];
    while (picked.length < 5 && pool.length) {
        const i = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(i, 1)[0]);
    }
    const saleIdx = Math.floor(Math.random() * picked.length);
    return picked.map((it, i) => ({ it, sale: i === saleIdx, price: Math.round(shopItemPrice(it) * (i === saleIdx ? SHOP_SALE : 1) / 10) * 10, sold: false }));
}
function shopNames(it) {
    if (it.kind === 'hp') return { name: T('shop_hp_name', { n: HP_UP }), desc: T('shop_hp_desc', { n: HP_UP }), big: '+' + HP_UP };
    if (it.kind === 'atk') return { name: T('shop_atk_name', { n: it.n * 10 }), desc: T('shop_atk_desc', { n: it.n * 10 }), big: '+' + (it.n * 10) + '%' };
    return { name: T('shop_guard_name', { n: it.n * 5 }), desc: T('shop_guard_desc', { n: it.n * 5 }), big: (it.n * 5) + '%' };
}
function renderShop() {
    const el = document.getElementById('mb-shop');
    if (!el || !shopState) return;
    const cards = shopState.list.map((x, i) => {
        const nm = shopNames(x.it);
        const can = !x.sold && state.coins >= x.price;
        const priceHtml = x.sale ? `<s>${shopItemPrice(x.it)}</s><b>${x.price}</b>` : `<b>${x.price}</b>`;
        return `<div class="mbs-card k-${x.it.kind}${x.sold ? ' sold' : ''}" data-i="${i}">
            ${x.sale ? `<div class="mbs-sale">${T('shop_sale')}</div>` : ''}
            <div class="mbs-ic">${MBS_ICON[x.it.kind]}<span class="big ${x.it.kind}">${nm.big}</span></div>
            <div class="mbs-nm">${nm.name}</div>
            <div class="mbs-ds">${nm.desc}</div>
            <div class="mbs-pr"><span class="cn"></span>${priceHtml}</div>
            <button class="mbs-buy" data-i="${i}" ${can ? '' : 'disabled'}>${x.sold ? T('shop_sold') : (can ? T('shop_buy') : T('shop_short'))}</button>
        </div>`;
    }).join('');
    const pw = powerLines();
    el.innerHTML = `<div class="mbs-box">
        <div class="mbs-ribbon">${T('shop_title')}</div>
        <div class="mbs-sub">${T('shop_stage', { n: state.stage })}　${T('shop_sub')}</div>
        <div class="mbs-top">
            <div class="mbs-coins"><span class="cn"></span><span class="lb">${T('shop_have')}</span><b>${state.coins}</b></div>
            <div class="mbs-pw">${pw.length ? pw.map(t => `<span>${t}</span>`).join('') : `<span class="none">${T('pw_none')}</span>`}</div>
        </div>
        <div class="mbs-row">${cards}</div>
        <button class="mbs-next" id="mbs-next">${T('shop_next')}</button>
    </div>`;
    el.querySelectorAll('.mbs-buy').forEach(b => bindBtn(b, () => shopBuy(parseInt(b.dataset.i, 10))));
    bindBtn(document.getElementById('mbs-next'), closeShop);
}
function shopBuy(i) {
    if (!shopState) return;
    const x = shopState.list[i];
    if (!x || x.sold || state.coins < x.price) return;
    state.coins -= x.price; x.sold = true;
    if (x.it.kind === 'hp') { state.maxHp += HP_UP; state.hp = state.maxHp; state.hpBought++; }
    else if (x.it.kind === 'atk') state.atkBonus = Math.round((state.atkBonus + x.it.n * 0.1) * 100) / 100;
    else state.guard = Math.min(GUARD_CAP, Math.round((state.guard + x.it.n * 0.05) * 100) / 100);
    updateUI();
    renderShop();
}
function openShop(cb) {
    let el = document.getElementById('mb-shop');
    if (!el) { el = document.createElement('div'); el.id = 'mb-shop'; document.getElementById('container').appendChild(el); }
    shopState = { list: shopPick(), cb };
    renderShop();
    el.classList.remove('hidden');
}
function closeShop() {
    const el = document.getElementById('mb-shop');
    if (el) el.classList.add('hidden');
    const cb = shopState && shopState.cb;
    shopState = null;
    if (cb) cb();
}
