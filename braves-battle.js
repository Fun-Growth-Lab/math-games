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
const COIN_UP = 0.2;             // 「きんのおまもり」1つぶんの コインアップ(+20%)。なんこでも もてて、たし算
const POTION_HEAL = 20;          // 「ポーション」1つで かいふくする HP(つかっても ターンは すすまない)
// ボスの ひっさつわざ: こうげきの たびに 20%で「ため」→ ためている ターンは こうげきしない →
// つぎの ターンに 50%で ひっさつわざ(ためた ターン+いま = (ため回数+1)回ぶん ×1.5 の ダメージ、盾の ガード確率は はんぶん)、のこり50%は もういちど ためる
const BOSS_CHARGE_P = 0.2, BOSS_RELEASE_P = 0.5, BOSS_MAX_CHARGE = 3, BOSS_SPECIAL_MUL = 1.5, BOSS_SPECIAL_GUARD = 0.5;
// 値段: hp=いのちのハート / coin=きんのおまもり / potion / dance=つるぎのまい / sword=剣(1だんあたり) / shield=盾(1だんあたり)。剣は +20%ずつ、盾は ガード10%ずつ、どちらも 5だん
// 剣と盾は それぞれ 1つしか もてない(かうと 古い方は すてられる)。さいだいHPアップと きんのおまもりは 重ねられる。ポーション・つるぎのまいは つかいきり(なんこでも もてる)。
const SHOP_PRICE = Object.assign({ hp: 500, coin: 400, potion: 150, dance: 300, sword: 600, shield: 500 }, GAME.shopPrice || {});
const SHOP_SALE = 0.7;           // 4つのうち1つだけ 30%オフ
const SHOP_SLOTS = 4;            // ショップに ならぶ数
// ショップに ならぶ品の ねらいの割合: 剣 25% / 盾 25% / ポーション 20% / つるぎのまい 10% / おまもり 10% / さいだいHP 10%。
// おなじ品は 1つのショップに 2つ ならばない(ひきなおす)ので、そのままの数字だと ポーションなどが ねらいより 少なくなる。
// そこで 4000回ひいて 実際に ならぶ割合が ねらいに なるように 調整した重みを 入れてある(合計 約100%)。
const SHOP_P = { atk: 0.211, guard: 0.210, potion: 0.298, dance: 0.095, coin: 0.094, hp: 0.094 };
// 剣・盾の「段(1〜5)」の出やすさ。ステージが すすむほど 強い段が出やすい(重み。左から 段1〜5)。
// 並び=ステージ1〜6をクリアしたあとの 6回のショップ。平均の段は およそ 1.5 → 2.0 → 2.7 → 3.4 → 3.9 → 4.2
const SHOP_TIER_W = GAME.shopTierWeights || [
    [60, 30, 8, 2, 0],      // ステージ1のあと
    [38, 36, 18, 7, 1],     // 2
    [20, 32, 30, 14, 4],    // 3
    [8, 22, 32, 28, 10],    // 4
    [3, 10, 27, 38, 22],    // 5
    [1, 5, 20, 39, 35],     // 6
];
const SHOP_ITEMS = (() => {
    const l = [{ id: 'hp', kind: 'hp', n: 1 }, { id: 'coin', kind: 'coin', n: 1 }, { id: 'potion', kind: 'potion', n: 1 }, { id: 'dance', kind: 'dance', n: 1 }];
    for (let i = 1; i <= 5; i++) l.push({ id: 'a' + i, kind: 'atk', n: i });       // こうげき +20%〜+100%
    for (let i = 1; i <= 5; i++) l.push({ id: 'g' + i, kind: 'guard', n: i });     // ガード 10%〜50%
    return l;
})();
const SINGLE_KIND = { hp: 1, coin: 1, potion: 1, dance: 1 };   // 段が なく 1しゅるいだけの 品
function shopItemPrice(it) { return SINGLE_KIND[it.kind] ? SHOP_PRICE[it.kind] : it.kind === 'atk' ? SHOP_PRICE.sword * it.n : SHOP_PRICE.shield * it.n; }
// さいだいHP / コイン% / かいふくHP / (つるぎのまいは +1) / こうげき% / ガード%
function itemEffect(it) { return it.kind === 'hp' ? HP_UP : it.kind === 'coin' ? COIN_UP * 100 : it.kind === 'potion' ? POTION_HEAL : it.kind === 'dance' ? 1 : it.kind === 'atk' ? it.n * 20 : it.n * 10; }

(function addBattleStrings() {
    const S = {
        ja: {
            label_hp: 'HP', label_coins: 'コイン', label_power: 'そうび', diff_master: '名人', diff_legend: '伝説',
            pw_atk: 'こうげき +{n}%', pw_guard: 'ガード {n}%', pw_hp: 'さいだいHP {n}', pw_none: 'まだ なし',
            guard_text: 'ガード！',
            it_hp: 'いのちのハート', it_coin: 'きんのおまもり', it_potion: 'ポーション', it_dance: 'つるぎのまい',
            it_atk_1: '木の剣', it_atk_2: 'どうの剣', it_atk_3: 'てつの剣', it_atk_4: 'はがねの剣', it_atk_5: 'ひかりの剣',
            it_guard_1: '木の盾', it_guard_2: 'どうの盾', it_guard_3: 'てつの盾', it_guard_4: 'はがねの盾', it_guard_5: 'ひかりの盾',
            ef_hp: 'さいだいHP +{n}', ef_atk: 'こうげき +{n}%', ef_guard: 'ガード {n}%', ef_coin: 'コイン +{n}%', ef_potion: 'かいふく +{n}', ef_dance: 'てふだに けん +1',
            shop_title: 'ショップ',
            shop_sale: '30%オフ', shop_buy: 'かう', shop_sold: 'かった！', shop_short: 'コインが たりない', shop_next: 'つぎの ステージへ ▶',
            shop_swap: '{name}と いれかえ', shop_worse: 'いまの ほうが つよい', shop_own: 'いま {n}こ もっている',
            item_full: 'HPは まんたん！', item_nocard: 'てふだが ないよ', dance_text: 'つるぎのまい！',
            boss_charge: 'ためている…！', boss_charge2: 'もっと ためている…！！', boss_special: '💥 ひっさつわざ！',
            shop_have: 'もっている コイン',
            sc_hp_full: 'HP', sc_hp_full_v: 'ぜんかいふく！', sc_coins: 'もっている コイン',
            btn_next_stage: 'ショップへ ▶',
            bd_time: 'のこりHP',
        },
        simple: {
            label_hp: 'HP', label_coins: 'コイン', label_power: 'そうび', diff_master: 'めいじん', diff_legend: 'でんせつ',
            pw_atk: 'こうげき +{n}%', pw_guard: 'ガード {n}%', pw_hp: 'さいだいHP {n}', pw_none: 'まだ なし',
            guard_text: 'ガード！',
            it_hp: 'いのちの ハート', it_coin: 'きんの おまもり', it_potion: 'ポーション', it_dance: 'つるぎの まい',
            it_atk_1: 'きの けん', it_atk_2: 'どうの けん', it_atk_3: 'てつの けん', it_atk_4: 'はがねの けん', it_atk_5: 'ひかりの けん',
            it_guard_1: 'きの たて', it_guard_2: 'どうの たて', it_guard_3: 'てつの たて', it_guard_4: 'はがねの たて', it_guard_5: 'ひかりの たて',
            ef_hp: 'さいだいHP +{n}', ef_atk: 'こうげき +{n}%', ef_guard: 'ガード {n}%', ef_coin: 'コイン +{n}%', ef_potion: 'かいふく +{n}', ef_dance: 'てふだに けん +1',
            shop_title: 'ショップ',
            shop_sale: '30%オフ', shop_buy: 'かう', shop_sold: 'かった！', shop_short: 'コインが たりない', shop_next: 'つぎの ステージへ ▶',
            shop_swap: '{name}と いれかえ', shop_worse: 'いまの ほうが つよい', shop_own: 'いま {n}こ もっている',
            item_full: 'HPは まんたん！', item_nocard: 'てふだが ないよ', dance_text: 'つるぎのまい！',
            boss_charge: 'ためている…！', boss_charge2: 'もっと ためている…！！', boss_special: '💥 ひっさつわざ！',
            shop_have: 'もっている コイン',
            sc_hp_full: 'HP', sc_hp_full_v: 'ぜんかいふく！', sc_coins: 'もっている コイン',
            btn_next_stage: 'ショップへ ▶',
            bd_time: 'のこりHP',
        },
        en: {
            label_hp: 'HP', label_coins: 'Coins', label_power: 'Gear', diff_master: 'Master', diff_legend: 'Legend',
            pw_atk: 'Attack +{n}%', pw_guard: 'Guard {n}%', pw_hp: 'Max HP {n}', pw_none: 'None yet',
            guard_text: 'Guard!',
            it_hp: 'Heart of Life', it_coin: 'Gold Charm', it_potion: 'Potion', it_dance: 'Sword Dance',
            it_atk_1: 'Wooden Sword', it_atk_2: 'Bronze Sword', it_atk_3: 'Iron Sword', it_atk_4: 'Steel Sword', it_atk_5: 'Light Sword',
            it_guard_1: 'Wooden Shield', it_guard_2: 'Bronze Shield', it_guard_3: 'Iron Shield', it_guard_4: 'Steel Shield', it_guard_5: 'Light Shield',
            ef_hp: 'Max HP +{n}', ef_atk: 'Attack +{n}%', ef_guard: 'Guard {n}%', ef_coin: 'Coins +{n}%', ef_potion: 'Heal {n} HP', ef_dance: 'Cards: Sword +1',
            shop_title: 'Shop',
            shop_sale: '30% OFF', shop_buy: 'Buy', shop_sold: 'Bought!', shop_short: 'Not enough coins', shop_next: 'Next Stage ▶',
            shop_swap: 'Replaces {name}', shop_worse: 'Yours is better', shop_own: 'You have {n}',
            item_full: 'HP is full!', item_nocard: 'No cards!', dance_text: 'Sword Dance!',
            boss_charge: 'Charging…!', boss_charge2: 'Charging more…!!', boss_special: '💥 Special Attack!',
            shop_have: 'Your coins',
            sc_hp_full: 'HP', sc_hp_full_v: 'Fully restored!', sc_coins: 'Your coins',
            btn_next_stage: 'To the Shop ▶',
            bd_time: 'HP left',
        },
    };
    Object.keys(S).forEach(l => { if (STRINGS[l]) Object.assign(STRINGS[l], S[l]); });
    if (typeof applyLanguage === 'function') applyLanguage();    // 右のパネルの「そうび」など、あとから足した文言を反映
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
    state.coinBonus = 0;           // きんのおまもりの ごうけい(0.4 = コインが +40%)
    state.potions = 0;             // もっている ポーションの数
    state.dances = 0;              // もっている つるぎのまいの数
    state.equip = [];              // 買った そうび {kind, n} の ならび(右のパネルに イラストつきで出す)
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
    updateItemUI();
    if (SP.scoreSig !== state.score) {
        if (SP.scoreSig >= 0 && state.score > SP.scoreSig) { ui.totalScore.classList.remove('bump'); void ui.totalScore.offsetWidth; ui.totalScore.classList.add('bump'); }
        SP.scoreSig = state.score;
    }
}

// そうびの絵(剣・盾は 木→どう→てつ→はがね→ひかり で 色がかわる)
const TIER_COL = ['#b98552', '#d98a3a', '#9aa5b8', '#4f86d6', '#f2c029'];
function equipSvg(kind, n) {
    // ポーション: ガラスびんに ももいろの くすり
    if (kind === 'potion') return '<svg viewBox="0 0 48 48"><path d="M19 4h10v4h-2v8l8 14c3 5 .5 12-5.500 12h-11C12.500 42 10 35 13 30l8-14V8h-2z" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" stroke-linejoin="round"/><path d="M15.200 31h17.600l2.600 4.800c1.800 3.200-.2 6.200-4 6.200H16.600c-3.800 0-5.800-3-4-6.200z" fill="#ff5fa8"/><rect x="18" y="1.500" width="12" height="5" rx="2" fill="#b98552" stroke="rgba(0,0,0,0.3)" stroke-width="1.2"/><circle cx="21" cy="36" r="2" fill="rgba(255,255,255,0.7)"/><circle cx="27.500" cy="33.500" r="1.400" fill="rgba(255,255,255,0.7)"/></svg>';
    // つるぎのまい: むらさきの けんと キラキラ
    if (kind === 'dance') return '<svg viewBox="0 0 48 48"><g transform="rotate(35 24 26)"><path d="M24 4l5.500 6.500V30H18.500V10.500z" fill="#c9b8ff" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 8v20" stroke="rgba(255,255,255,0.8)" stroke-width="2.200" stroke-linecap="round"/><path d="M11 30h26v4.500H11z" fill="#7a52e0" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/><path d="M20.500 34.500h7v7h-7z" fill="#4b2fa8"/></g><path d="M8 8l1.800 4.200L14 14l-4.200 1.800L8 20l-1.800-4.200L2 14l4.200-1.800z" fill="#ffe36b" stroke="rgba(0,0,0,0.25)" stroke-width="1"/><path d="M40 28l1.400 3.200 3.200 1.400-3.200 1.400L40 37.200l-1.400-3.200-3.200-1.400 3.200-1.400z" fill="#ffe36b" stroke="rgba(0,0,0,0.25)" stroke-width="1"/><path d="M38 4l1.100 2.500 2.500 1.100-2.500 1.100L38 11.200l-1.100-2.500-2.500-1.100 2.500-1.100z" fill="#fff" stroke="rgba(0,0,0,0.2)" stroke-width="0.8"/></svg>';
    if (kind === 'coin') return '<svg viewBox="0 0 48 48"><path d="M17 6c2.500 2.500 11.500 2.500 14 0l-3.500 8.500H20.500z" fill="#c98a2b" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linejoin="round"/><path d="M20.500 14.500C13 19 8 26 8 33c0 6.500 6 10 16 10s16-3.500 16-10c0-7-5-14-11.500-18.500z" fill="#e8b84a" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linejoin="round"/><path d="M19 14.500h10" stroke="#8a5a22" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="31" r="8" fill="#fff3b0" stroke="#c8900a" stroke-width="2"/><path d="M24 26v10M21 28.500h4.500a2 2 0 010 4h-3a2 2 0 000 4H27" stroke="#c8900a" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
    if (kind === 'hp') return '<svg viewBox="0 0 48 48"><path d="M24 42C10 32 5 25 5 17.5 5 11.6 9.4 7 15 7c3.6 0 7 1.8 9 5 2-3.2 5.4-5 9-5 5.6 0 10 4.6 10 10.5C43 25 38 32 24 42z" fill="#ef5a5a" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/><path d="M14 14c-2 1-3 3-3 5" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';
    const c = TIER_COL[Math.max(0, Math.min(4, n - 1))];
    if (kind === 'atk') return '<svg viewBox="0 0 48 48"><g transform="rotate(40 24 24)"><path d="M24 1l6.500 7.500V31H17.500V8.500z" fill="' + c + '" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 6v23" stroke="rgba(255,255,255,0.65)" stroke-width="2.4" stroke-linecap="round"/><path d="M9 31h30v5H9z" fill="#8a5a22" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/><path d="M20.500 36h7v8h-7z" fill="#5a3d1a"/><circle cx="24" cy="46" r="2.600" fill="#8a5a22"/></g></svg>';
    return '<svg viewBox="0 0 48 48"><path d="M24 3l17 6.500v12.500c0 10.500-7.500 18-17 23C14.500 40 7 32.500 7 22V9.500z" fill="' + c + '" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 11l10 4v7c0 6.500-4.500 11-10 14-5.500-3-10-7.500-10-14v-7z" fill="rgba(255,255,255,0.3)"/><path d="M24 3v42" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/></svg>';
}
function itemName(it) { return SINGLE_KIND[it.kind] ? T('it_' + it.kind) : T('it_' + it.kind + '_' + it.n); }
function itemEffectText(it, c) { return T('ef_' + it.kind, { n: itemEffect(it) * (c || 1) }); }   // c = かさねている数(さいだいHP・コインぶくろは ごうけいで 出す)
// いま もっている 剣・盾(なければ null)
function ownedGear(kind) { return (state.equip || []).find(e => e.kind === kind) || null; }
function updatePowerUI() {
    const el = document.getElementById('disp-powers');
    if (!el) return;
    const sig = (state.equip || []).map(e => e.kind + e.n).join(',') + '#' + state.maxHp + '#' + currentLang;
    if (SP.powerSig === sig) return;
    SP.powerSig = sig;
    const groups = [];
    (state.equip || []).forEach(e => { const g = groups.find(x => x.kind === e.kind && x.n === e.n); if (g) g.c++; else groups.push({ kind: e.kind, n: e.n, c: 1 }); });
    // 並び: 剣 → 盾 → さいだいHP → コインぶくろ
    const ord = { atk: 0, guard: 1, hp: 2, coin: 3 };
    groups.sort((a, b) => ord[a.kind] - ord[b.kind]);
    el.innerHTML = (groups.length ? '' : `<div class="pw none">${T('pw_none')}</div>`) +
        groups.map(g => {
            const it = { kind: g.kind, n: g.n };
            return `<div class="eq k-${g.kind}"><div class="ic">${equipSvg(g.kind, g.n)}</div><div class="tx"><b>${itemName(it)}${g.c > 1 ? ` ×${g.c}` : ''}</b><span>${itemEffectText(it, g.c)}</span></div></div>`;
        }).join('');
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
        let dmg = Math.max(1, (foe.isBoss ? CONFIG.atkBoss : CONFIG.atkNormal) || (foe.isBoss ? 6 : 4));
        let guardP = state.guard, special = false;
        if (foe.isBoss) {
            const c = foe.charge || 0;
            if (c === 0) {
                if (Math.random() < BOSS_CHARGE_P) { foe.charge = 1; bossChargeFx(foe); return; }          // ためる(この ターンは こうげきしない)
            } else if (c >= BOSS_MAX_CHARGE || Math.random() < BOSS_RELEASE_P) {                          // ひっさつわざ!
                special = true;
                dmg = Math.max(1, Math.round(dmg * (c + 1) * BOSS_SPECIAL_MUL));
                guardP = state.guard * BOSS_SPECIAL_GUARD;
                foe.charge = 0; bossChargeFx(foe);
            } else { foe.charge = c + 1; bossChargeFx(foe); return; }                                      // もういちど ためる
        }
        if (guardP > 0 && Math.random() < guardP) {
            fxHpNote(T('guard_text'), '#4fc3f7');
            if (BL.hpBox) { BL.hpBox.classList.remove('guard'); void BL.hpBox.offsetWidth; BL.hpBox.classList.add('guard'); }
            if (foe._mon) { foe._mon.classList.remove('atk'); void foe._mon.offsetWidth; foe._mon.classList.add('atk'); }
            return;
        }
        state.hp = Math.max(0, state.hp - dmg);
        fxHurt(dmg, foe);
        if (special) fxBossFlash('boss_special');
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
                state.coins += Math.round(damage * (1 + state.coinBonus));   // コイン = あたえたダメージ(スコア)と おなじ数(きんのおまもりで ふえる)
                state.lastScore = damage;
                if (damage > state.maxScore) state.maxScore = damage;

                const scoreFs = scoreParticleFontSize(damage);
                state.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y, `+${damage}`, '#ffca28', 'text', scoreFs));
                state.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "", "#ef5350", "circle"));

                state.cards[idx] = null;

                enemy.hp -= damage;

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.isDefeated = true;
                } else {
                    enemy.reroll(hitJ);
                    enemyAttack();                  // こうげきも 1手: たおせなかったら、てきが こうげきしてくる
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
if (typeof PRESET_MASTER !== 'undefined') STAR_PRESETS[4] = PRESET_MASTER;     // シークレット★4(名人)
if (typeof PRESET_LEGEND !== 'undefined') STAR_PRESETS[5] = PRESET_LEGEND;     // シークレット★5(伝説)
const STAGE_ENEMIES = 2;      // 1ステージの通常の敵の数
// てきの こうげき力(ENEMY_ATK はゲーム側で定義)。ボット・シミュレーションで クリア率を測って決めた値。ルールを変えたら測り直す

function configForStage(star, stage) {
    const base = STAR_PRESETS[star] || PRESET_NORMAL;
    const lo = BOSS_MIN_SCALE[star] || 0.3;
    const bossScale = lo + (1 - lo) * (stage - 1) / (STAGE_COUNT - 1);   // ボスのHPはステージごとに増えて、最後は元のボスHP
    // ENEMY_ATK[★] = { n: [ステージ1〜7のふつうの敵], b: [ステージ1〜7のボス] }(1回の こうげきの ダメージ)
    const a = (typeof ENEMY_ATK !== 'undefined' && ENEMY_ATK[star]) || { n: [2, 2, 3, 4, 5, 5, 6], b: [3, 4, 5, 6, 7, 8, 9] };
    const at = (arr, i) => arr[Math.min(arr.length - 1, i)];
    return Object.assign({}, base, {
        bossHP: Math.max(50, Math.round(base.bossHP * bossScale / 10) * 10),
        atkNormal: Math.max(1, at(a.n, stage - 1)),
        atkBoss: Math.max(1, at(a.b, stage - 1)),
    });
}

let loopActive = false;
function startLoop() { if (loopActive) return; loopActive = true; requestAnimationFrame(gameLoop); }

function updateStageLabel() {
    const n = Math.min(state.stage, STAGE_COUNT);
    ui.difficultyLabel.textContent = `${n} / ${STAGE_COUNT}`;
    document.getElementById('sp-run').textContent = T('run_' + RUN_LIST[runSelIdx].id + '_name');
    document.getElementById('sp-diff').textContent = '★'.repeat(state.star) + ' ' + diffName(state.star);
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
const BL = { items: null, layer: null, lane: null, cap: null, capTx: null, hpBox: null, hpFl: null, hpNm: null, hpLb: null, hint: null, trash: null, trashTx: null, hand: [], lastHp: -1, lastLane: '' };
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
    // どうぐボタン(ポーション・つるぎのまい): canvas より 上に おいて、おせるように する。ターンは つかわない
    const bar = document.createElement('div');
    bar.id = 'bl-items';
    area.appendChild(bar);
    BL.items = bar;
    let lastTouch = 0;
    const onItem = (e) => {
        const b = e.target.closest && e.target.closest('button[data-k]');
        if (!b) return;
        e.preventDefault();
        if (e.type === 'touchstart') lastTouch = Date.now(); else if (Date.now() - lastTouch < 600) return;   // タッチの あとの click は むし
        useItem(b.dataset.k);
    };
    bar.addEventListener('click', onItem);
    bar.addEventListener('touchstart', onItem, { passive: false });
}

// ---- どうぐを つかう(ターンは すすまない=てきは こうげきしてこない) ----
function canUseItem() {
    return state.screen === 'PLAYING' && !state.inputLocked && !state.isGameClearProcessing && !state.isGameOverProcessing && !state.dragInfo;
}
function useItem(kind) {
    if (!canUseItem()) return;
    if (kind === 'potion') {
        if (state.potions <= 0) return;
        if (state.hp >= state.maxHp) { fxHpNote(T('item_full'), '#aed581'); return; }      // まんたんなら つかわない
        const before = state.hp;
        state.potions--;
        state.hp = Math.min(state.maxHp, state.hp + POTION_HEAL);
        fxHpNote('+' + (state.hp - before), '#66e08a');
        if (BL.hpBox) { BL.hpBox.classList.remove('heal'); void BL.hpBox.offsetWidth; BL.hpBox.classList.add('heal'); }
    } else if (kind === 'dance') {
        if (state.dances <= 0) return;
        const cards = state.cards.filter(c => c);
        if (!cards.length) { fxHpNote(T('item_nocard'), '#ffcc80'); return; }
        state.dances--;
        cards.forEach(c => { c.stackCount += 1; });                                       // てふだ ぜんぶに けん +1
        cards.forEach(c => { const el = BL.hand[c.slotIndex]; if (el) { el.classList.remove('dance'); void el.offsetWidth; el.classList.add('dance'); } });
        if (BL.layer) fxText(state.width / 2, state.height * 0.62, T('dance_text'), '#d1b3ff', 38);
    } else return;
    updateUI();
}
// どうぐボタンの ひょうじ(もっている ときだけ)
function updateItemUI() {
    if (!BL.items) return;
    const show = state.screen === 'PLAYING';
    const sig = show + '|' + state.potions + '|' + state.dances + '|' + currentLang;
    if (BL.items._sig === sig) return;
    BL.items._sig = sig;
    const mk = (k, n) => n > 0 ? `<button type="button" class="ib k-${k}" data-k="${k}"><span class="ic">${equipSvg(k, 1)}</span><span class="tx"><b>${T('it_' + k)}</b><i>×${n}</i></span></button>` : '';
    BL.items.innerHTML = show ? mk('potion', state.potions || 0) + mk('dance', state.dances || 0) : '';
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
        ${enemy.isBoss ? `<div class="chg" style="left:${cx - 90}px;top:${hpBarY - 12 - monSize - 30}px;width:180px">${T('boss_charge')}</div>` : ''}
        <div class="hp" style="left:${hpBarX}px;top:${hpBarY}px;width:${hpBarW}px"><div class="fl"></div><div class="tx"></div></div>`;
    enemy._mon = el.querySelector('.mon');
    enemy._chg = el.querySelector('.chg');
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
// ボスが ためている あいだの ようす(あかく ひかって ゆれる。「ためている…！」の ふきだし)
function bossChargeFx(foe) {
    if (!foe || !foe._el) return;
    const c = foe.charge || 0;
    foe._el.classList.toggle('charging', c > 0);
    if (foe._chg) foe._chg.textContent = c > 1 ? T('boss_charge2') : T('boss_charge');
    if (c > 0) {
        if (foe._mon) { foe._mon.classList.remove('atk'); void foe._mon.offsetWidth; }
        fxText(foe.x + foe.width / 2, foe.y + foe.height * 0.15, c > 1 ? T('boss_charge2') : T('boss_charge'), '#ff8a65', 30);
    }
}
function fxBossFlash(key) {
    if (!BL.layer) return;
    const el = document.createElement('div');
    el.className = 'bl-flash';
    el.innerHTML = `<b>${T(key || 'boss_attack_flash')}</b>`;
    el.addEventListener('animationend', () => el.remove());
    BL.layer.appendChild(el);
}

// ============================================================
//  ショップ(ステージクリアのあと)
// ============================================================
// 4つの どうぐが ならび、1つだけ 30%オフ。コイン(=あたえたダメージ)で買う。ステージが すすむほど 強い剣・盾が ならびやすい。
GAME.hideNextStage = true;                                   // ステージクリアの画面に「つぎは〜」を出さない
GAME.clearHTML = (st, stageScore) => {
    const pts = T('unit_pts');
    return `<div><span>${T('sc_stage_score')}</span><b>${stageScore}${pts}</b></div>` +
        `<div><span>${T('sc_hp_full')}</span><b>${T('sc_hp_full_v')}</b></div>` +
        `<div><span>${T('sc_coins')}</span><b>${state.coins}</b></div>` +
        `<div class="big"><span>${T('result_total_score')}</span><b>${state.score}${pts}</b></div>`;
};
GAME.beforeNextStage = (cb) => openShop(cb);

let shopState = null;     // { list:[{it, price, sale, sold}], cb }
function shopPick() {
    // 4つ(SHOP_P の確率。おなじ品は 2つ ならばない)
    // 剣・盾の段は、いまの ステージに あわせた重み(SHOP_TIER_W)で えらぶ。いま もっている そうびと おなじか よわいものは ならべない
    const w = SHOP_TIER_W[Math.max(0, Math.min(SHOP_TIER_W.length, state.stage) - 1)];
    const picked = [];
    let tries = 0;
    const kindOrder = Object.keys(SHOP_P);
    while (picked.length < SHOP_SLOTS && tries++ < 400) {
        let r = Math.random() * kindOrder.reduce((t, k) => t + SHOP_P[k], 0), kind = kindOrder[kindOrder.length - 1];
        for (const k of kindOrder) { if (r < SHOP_P[k]) { kind = k; break; } r -= SHOP_P[k]; }
        const own = kind === 'atk' || kind === 'guard' ? ownedGear(kind) : null;
        const pool = SHOP_ITEMS.filter(it => it.kind === kind && !picked.includes(it) && (!own || it.n > own.n));
        if (!pool.length) continue;
        const wt = pool.map(it => SINGLE_KIND[it.kind] ? 1 : (w[it.n - 1] || 0));
        let x = Math.random() * wt.reduce((a, b) => a + b, 0), k = 0;
        while (k < pool.length - 1 && x >= wt[k]) { x -= wt[k]; k++; }
        picked.push(pool[k]);
    }
    const saleIdx = Math.floor(Math.random() * picked.length);
    return picked.map((it, i) => ({ it, sale: i === saleIdx, price: Math.round(shopItemPrice(it) * (i === saleIdx ? SHOP_SALE : 1) / 10) * 10, sold: false }));
}
function renderShop() {
    const el = document.getElementById('mb-shop');
    if (!el || !shopState) return;
    const cards = shopState.list.map((x, i) => {
        const own = x.it.kind === 'atk' || x.it.kind === 'guard' ? ownedGear(x.it.kind) : null;
        const worse = !x.sold && own && own.n >= x.it.n;                  // おなじ ショップで 強い方を かったあと
        const can = !x.sold && !worse && state.coins >= x.price;
        const have = x.it.kind === 'potion' ? state.potions : x.it.kind === 'dance' ? state.dances : 0;
        const note = !x.sold && own && !worse ? T('shop_swap', { name: itemName(own) }) : (have > 0 ? T('shop_own', { n: have }) : '');
        const swap = `<div class="mbs-swap">${note}</div>`;   // 高さをそろえるため 空でも 置く
        const priceHtml = x.sale ? `<s>${shopItemPrice(x.it)}</s><b>${x.price}</b>` : `<b>${x.price}</b>`;
        return `<div class="mbs-card k-${x.it.kind}${x.sold ? ' sold' : ''}" data-i="${i}">
            ${x.sale ? `<div class="mbs-sale">${T('shop_sale')}</div>` : ''}
            <div class="mbs-ic">${equipSvg(x.it.kind, x.it.n)}</div>
            <div class="mbs-nm">${itemName(x.it)}</div>
            <div class="mbs-ef">${itemEffectText(x.it)}</div>
            ${swap}
            <div class="mbs-pr"><span class="cn"></span>${priceHtml}</div>
            <button class="mbs-buy" data-i="${i}" ${can ? '' : 'disabled'}>${x.sold ? T('shop_sold') : worse ? T('shop_worse') : (can ? T('shop_buy') : T('shop_short'))}</button>
        </div>`;
    }).join('');
    el.innerHTML = `<div class="mbs-box">
        <div class="mbs-ribbon">${T('shop_title')}</div>
        <div class="mbs-top">
            <div class="mbs-coins"><span class="cn"></span><span class="lb">${T('shop_have')}</span><b>${state.coins}</b></div>
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
    const own = x.it.kind === 'atk' || x.it.kind === 'guard' ? ownedGear(x.it.kind) : null;
    if (own && own.n >= x.it.n) return;                                   // いまの そうびの ほうが つよい
    state.coins -= x.price; x.sold = true;
    if (own) state.equip = state.equip.filter(e => e.kind !== x.it.kind);   // 古い剣・盾は すてられる
    if (x.it.kind !== 'potion' && x.it.kind !== 'dance') state.equip.push({ kind: x.it.kind, n: x.it.n });   // ポーション・つるぎのまいは そうびに ならない(右下の どうぐボタンで つかう)
    if (x.it.kind === 'hp') { state.maxHp += HP_UP; state.hp = state.maxHp; state.hpBought++; }
    else if (x.it.kind === 'coin') state.coinBonus = Math.round((state.coinBonus + COIN_UP) * 100) / 100;
    else if (x.it.kind === 'potion') state.potions++;
    else if (x.it.kind === 'dance') state.dances++;
    else if (x.it.kind === 'atk') state.atkBonus = Math.round(x.it.n * 0.2 * 100) / 100;
    else state.guard = Math.round(x.it.n * 0.1 * 100) / 100;
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
