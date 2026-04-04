// ===== 敵データ・行動ロジック =====

const Enemy = (() => {

  // 10段階 → 基本値変換（レベルスケール前の基礎値）
  // 数値は「ターン1時点のスライム(HP20, ATK5)」を基準に設計
  const RANK_TO_BASE = {
    hp:  [0, 20, 26, 34, 44, 56, 70, 86, 104, 124, 146],  // rank 0〜10
    atk: [0,  5,  6,  8, 10, 13, 16, 20, 24,  29,  35],
    def: [0,  2,  3,  4,  6,  8, 11, 14, 18,  23,  28],
  };

  // 敵マスタ定義
  const ENEMY_DATA = {
    // ===== ラウンド1 =====
    slime: {
      name: 'スライム', sprite: '🟢',
      hpRank: 2, atkRank: 2, defRank: 1,
      type: 'aggressive',
      abilities: [],
    },
    goblin: {
      name: 'ゴブリン', sprite: '👺',
      hpRank: 3, atkRank: 4, defRank: 2,
      type: 'aggressive',
      abilities: [],
    },
    orc: {
      name: 'オーク', sprite: '🐗',
      hpRank: 5, atkRank: 5, defRank: 4,
      type: 'balanced',
      abilities: [],
    },
    armorKnight: {
      name: 'アーマーナイト', sprite: '🛡️',
      hpRank: 4, atkRank: 3, defRank: 7,
      type: 'fortress',
      abilities: ['ironWall'],
    },
    zombie: {
      name: 'ゾンビ', sprite: '🧟',
      hpRank: 5, atkRank: 3, defRank: 2,
      type: 'aggressive',
      abilities: ['poison'],
    },
    ogre: {
      name: 'オーガ（BOSS）', sprite: '👹',
      hpRank: 7, atkRank: 7, defRank: 5,
      type: 'balanced',
      abilities: ['rage', 'multiAttack'],
      isBoss: true,
    },

    // ===== ラウンド2 =====
    wizard: {
      name: 'ウィザード', sprite: '🧙',
      hpRank: 3, atkRank: 7, defRank: 2,
      type: 'tricky',
      abilities: ['seal', 'spiritDown'],
    },
    darkElf: {
      name: 'ダークエルフ', sprite: '🧝',
      hpRank: 4, atkRank: 5, defRank: 4,
      type: 'tricky',
      abilities: ['armorBreak', 'paralyze'],
    },
    troll: {
      name: 'トロル', sprite: '🗿',
      hpRank: 7, atkRank: 7, defRank: 4,
      type: 'balanced',
      abilities: ['selfHeal'],
    },
    golem: {
      name: 'ゴーレム', sprite: '🤖',
      hpRank: 8, atkRank: 4, defRank: 8,
      type: 'fortress',
      abilities: ['armorBreak', 'ironWall'],
    },
    banshee: {
      name: 'バンシー', sprite: '👻',
      hpRank: 4, atkRank: 5, defRank: 3,
      type: 'tricky',
      abilities: ['curse', 'seal'],
    },
    lich: {
      name: 'リッチ（BOSS）', sprite: '💀',
      hpRank: 8, atkRank: 8, defRank: 6,
      type: 'tricky',
      abilities: ['curse', 'seal', 'spiritDown'],
      isBoss: true,
    },

    // ===== ラウンド3 =====
    demon: {
      name: 'デーモン', sprite: '😈',
      hpRank: 8, atkRank: 8, defRank: 5,
      type: 'aggressive',
      abilities: ['multiAttack', 'counter'],
    },
    darkKnight: {
      name: 'ダークナイト', sprite: '⚔️',
      hpRank: 7, atkRank: 7, defRank: 7,
      type: 'balanced',
      abilities: ['armorBreak', 'buffSelf'],
    },
    necromancer: {
      name: 'ネクロマンサー', sprite: '🧟‍♂️',
      hpRank: 5, atkRank: 8, defRank: 3,
      type: 'tricky',
      abilities: ['curse', 'revive'],
    },
    behemoth: {
      name: 'ベヒーモス', sprite: '🦣',
      hpRank: 9, atkRank: 5, defRank: 9,
      type: 'fortress',
      abilities: ['armorBreak', 'ironWall', 'selfHeal'],
    },
    succubus: {
      name: 'サキュバス', sprite: '🦋',
      hpRank: 6, atkRank: 8, defRank: 5,
      type: 'tricky',
      abilities: ['seal', 'paralyze', 'spiritDown'],
    },
    dragon: {
      name: 'ドラゴン（BOSS）', sprite: '🐉',
      hpRank: 10, atkRank: 10, defRank: 8,
      type: 'tricky',
      abilities: ['rage', 'multiAttack', 'revive'],
      isBoss: true,
    },
  };

  // ラウンド別エンカウンターリスト
  const ENCOUNTER_BY_ROUND = {
    1: ['slime', 'goblin', 'orc', 'armorKnight', 'zombie'],
    2: ['wizard', 'darkElf', 'troll', 'golem', 'banshee'],
    3: ['demon', 'darkKnight', 'necromancer', 'behemoth', 'succubus'],
  };
  const BOSS_BY_ROUND = { 1: 'ogre', 2: 'lich', 3: 'dragon' };

  // 行動タイプ別確率
  const ACTION_WEIGHTS = {
    aggressive: { attack: 70, defense: 0,  special: 30 },
    balanced:   { attack: 45, defense: 45, special: 10 },
    fortress:   { attack: 20, defense: 60, special: 20 },
    tricky:     { attack: 35, defense: 25, special: 40 },
  };

  // 簡易正規分布乱数（Box-Muller近似を避けた簡易版）
  function gaussianRand(mean, sd) {
    // 12個の一様乱数の和 → 近似正規分布
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += Math.random();
    // sum ∈ [0,6]、平均3、標準偏差√0.5≈0.707
    // 正規化して mean±sd に変換
    const norm = (sum - 3) / 0.707;
    return Math.round(mean + norm * sd);
  }

  // レベルスケール倍率計算 (t: 総ターン 1〜30)
  function scaleFactor(t) {
    return 1 + Math.pow(t / 30, 1.8) * 2.5;
  }

  // 敵インスタンスを生成
  function createEnemy(key, mapTurn) {
    const data = ENEMY_DATA[key];
    const scale = scaleFactor(mapTurn);

    const baseHp  = RANK_TO_BASE.hp[data.hpRank];
    const baseAtk = RANK_TO_BASE.atk[data.atkRank];
    const baseDef = RANK_TO_BASE.def[data.defRank];

    const maxHp  = Math.round(baseHp  * scale);
    const atkBase = Math.round(baseAtk * scale);
    const defBase = Math.round(baseDef * scale);

    // Lv: t=1→3, t=30→99 (Round3 BOSS is ~Lv100)
    const level = Math.min(100, Math.max(1, Math.round(2 + mapTurn * 3.2)));

    return {
      key,
      name: data.name,
      sprite: data.sprite,
      level,
      imgSrc: `enemy/${key}.png`,
      hp: maxHp,
      maxHp,
      atkBase,
      defBase,
      atkSd: Math.max(1, Math.round(atkBase * 0.15)),
      defSd: Math.max(1, Math.round(defBase * 0.15)),
      type: data.type,
      abilities: [...data.abilities],
      isBoss: data.isBoss || false,
      atkBonus: 0,
      defBonus: 0,
      reviveUsed: false,
      enraged: false,
    };
  }

  // ランダムに通常敵を選ぶ
  function randomEnemy(round, mapTurn) {
    const pool = ENCOUNTER_BY_ROUND[round] || ENCOUNTER_BY_ROUND[1];
    const key = pool[Math.floor(Math.random() * pool.length)];
    return createEnemy(key, mapTurn);
  }

  function bossEnemy(round, mapTurn) {
    const key = BOSS_BY_ROUND[round] || 'ogre';
    return createEnemy(key, mapTurn);
  }

  // 行動隠蔽確率テーブル [通常敵, 強敵, BOSS]
  const HIDE_PROB = {
    1: [0,    0,    0   ],
    2: [0.10, 0.15, 0.20],
    3: [0.15, 0.20, 0.25],
  };

  // 敵種別を「通常/強敵/BOSS」のインデックスに変換
  function enemyTierIndex(enemy) {
    if (enemy.isBoss)   return 2;
    if (enemy.isElite)  return 1;
    return 0;
  }

  // 次のターンの行動を2つ決定し、隠蔽マスクも生成
  // gameRound: 1〜3
  function decideNextActions(enemy, gameRound) {
    const weights = ACTION_WEIGHTS[enemy.type];
    const actual = [weightedRandom(weights), weightedRandom(weights)];
    const hideProb = (HIDE_PROB[gameRound] || HIDE_PROB[1])[enemyTierIndex(enemy)];

    // display: 実際の行動 or '???' (独立確率で隠す)
    const display = actual.map(a => Math.random() < hideProb ? '???' : a);

    enemy.currentActions = actual;   // 実際の行動（内部処理用）
    enemy.displayActions  = display; // プレイヤーに見せる表示
    return { actual, display };
  }

  function weightedRandom(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, w] of Object.entries(weights)) {
      r -= w;
      if (r <= 0) return key;
    }
    return Object.keys(weights)[0];
  }

  // 敵の攻撃ダメージを計算（簡易正規分布）
  function rollEnemyAtk(enemy) {
    const base = enemy.atkBase + enemy.atkBonus;
    return Math.max(1, gaussianRand(base, enemy.atkSd));
  }

  // 敵の防御力を計算（簡易正規分布）
  function rollEnemyDef(enemy) {
    const base = enemy.defBase + enemy.defBonus;
    return Math.max(0, gaussianRand(base, enemy.defSd));
  }

  // 敵がダメージを受ける（プレイヤー攻撃 - 敵防御 >= 1 でHP減）
  // isDefenseAction: 敵がこのラウンド防御行動を選んでいるか
  // returns: { enemyDef, dmgDealt }
  function enemyTakeDamage(enemy, playerAtk, isDefenseAction) {
    const defMult = isDefenseAction ? 1.5 : 1.0;
    const enemyDef = Math.round(rollEnemyDef(enemy) * defMult);
    const dmg = Math.max(0, playerAtk - enemyDef);
    if (dmg >= 1) enemy.hp = Math.max(0, enemy.hp - dmg);
    return { enemyDef, dmgDealt: dmg };
  }

  // 行動の表示テキスト（display配列を渡す）
  const ACTION_LABEL = { attack: '⚔️攻撃', defense: '🛡防御', special: '✨特殊', '???': '？？？' };
  function actionLabel(a) { return ACTION_LABEL[a] || a; }

  return {
    ENEMY_DATA,
    createEnemy,
    randomEnemy,
    bossEnemy,
    decideNextActions,
    rollEnemyAtk,
    rollEnemyDef,
    enemyTakeDamage,
    actionLabel,
  };
})();
