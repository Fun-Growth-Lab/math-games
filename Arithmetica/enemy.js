// ===== 敵データ・行動ロジック =====

const Enemy = (() => {

  // ===== 敵マスタ =====
  // atkFactor/defFactor: Lv.1基本値7にかける倍率（個性）
  // spirit: 闘気（ATKロールに加算）
  // armor:  護気（DEFロールに加算）
  // hpBase: Lv.1HP, hpGrowth: レベルごとの増加
  const ENEMY_DATA = {
    // ─ ラウンド1 ─
    slime: {
      name: 'スライム', sprite: '🟢',
      atkFactor: 0.85, defFactor: 0.85, spirit: 0, armor: 0,
      hpBase: 16, hpGrowth: 3,
      type: 'aggressive', abilities: [],
    },
    goblin: {
      name: 'ゴブリン', sprite: '👺',
      atkFactor: 1.1,  defFactor: 0.75, spirit: 1, armor: 0,
      hpBase: 18, hpGrowth: 4,
      type: 'aggressive', abilities: [],
    },
    orc: {
      name: 'オーク', sprite: '🐗',
      atkFactor: 1.1,  defFactor: 1.0,  spirit: 1, armor: 1,
      hpBase: 28, hpGrowth: 6,
      type: 'balanced', abilities: [],
    },
    armorKnight: {
      name: 'アーマーナイト', sprite: '🛡',
      atkFactor: 0.7,  defFactor: 1.4,  spirit: 0, armor: 2,
      hpBase: 24, hpGrowth: 5,
      type: 'fortress', abilities: ['ironWall'],
    },
    zombie: {
      name: 'ゾンビ', sprite: '🧟',
      atkFactor: 1.0,  defFactor: 0.9,  spirit: 0, armor: 0,
      hpBase: 22, hpGrowth: 5,
      type: 'aggressive', abilities: ['poison'],
    },
    ogre: {
      name: 'オーガ（BOSS）', sprite: '👹',
      atkFactor: 1.2,  defFactor: 1.1,  spirit: 2, armor: 1,
      hpBase: 50, hpGrowth: 10,
      type: 'balanced', abilities: ['rage', 'multiAttack'],
      isBoss: true,
    },
    // ─ ラウンド2 ─
    wizard: {
      name: 'ウィザード', sprite: '🧙',
      atkFactor: 1.3,  defFactor: 0.7,  spirit: 0, armor: 0,
      hpBase: 18, hpGrowth: 4,
      type: 'tricky', abilities: ['seal', 'spiritDown'],
    },
    darkElf: {
      name: 'ダークエルフ', sprite: '🧝',
      atkFactor: 1.1,  defFactor: 1.0,  spirit: 0, armor: 0,
      hpBase: 22, hpGrowth: 5,
      type: 'tricky', abilities: ['armorBreak', 'paralyze'],
    },
    troll: {
      name: 'トロル', sprite: '🗿',
      atkFactor: 1.1,  defFactor: 0.9,  spirit: 1, armor: 1,
      hpBase: 35, hpGrowth: 8,
      type: 'balanced', abilities: ['selfHeal'],
    },
    golem: {
      name: 'ゴーレム', sprite: '🤖',
      atkFactor: 0.8,  defFactor: 1.5,  spirit: 0, armor: 2,
      hpBase: 40, hpGrowth: 9,
      type: 'fortress', abilities: ['armorBreak', 'ironWall'],
    },
    banshee: {
      name: 'バンシー', sprite: '👻',
      atkFactor: 1.1,  defFactor: 0.8,  spirit: 0, armor: 0,
      hpBase: 20, hpGrowth: 5,
      type: 'tricky', abilities: ['curse', 'seal'],
    },
    lich: {
      name: 'リッチ（BOSS）', sprite: '💀',
      atkFactor: 1.3,  defFactor: 1.0,  spirit: 0, armor: 0,
      hpBase: 55, hpGrowth: 12,
      type: 'tricky', abilities: ['curse', 'seal', 'spiritDown'],
      isBoss: true,
    },
    // ─ ラウンド3 ─
    demon: {
      name: 'デーモン', sprite: '😈',
      atkFactor: 1.4,  defFactor: 0.9,  spirit: 2, armor: 0,
      hpBase: 35, hpGrowth: 8,
      type: 'aggressive', abilities: ['multiAttack', 'counter'],
    },
    darkKnight: {
      name: 'ダークナイト', sprite: '⚔',
      atkFactor: 1.1,  defFactor: 1.1,  spirit: 1, armor: 1,
      hpBase: 40, hpGrowth: 9,
      type: 'balanced', abilities: ['armorBreak', 'buffSelf'],
    },
    necromancer: {
      name: 'ネクロマンサー', sprite: '🧟‍♂️',
      atkFactor: 1.3,  defFactor: 0.7,  spirit: 0, armor: 0,
      hpBase: 28, hpGrowth: 6,
      type: 'tricky', abilities: ['curse', 'revive'],
    },
    behemoth: {
      name: 'ベヒーモス', sprite: '🦣',
      atkFactor: 0.9,  defFactor: 1.5,  spirit: 0, armor: 3,
      hpBase: 50, hpGrowth: 12,
      type: 'fortress', abilities: ['armorBreak', 'ironWall', 'selfHeal'],
    },
    succubus: {
      name: 'サキュバス', sprite: '🦋',
      atkFactor: 1.2,  defFactor: 0.9,  spirit: 0, armor: 0,
      hpBase: 30, hpGrowth: 7,
      type: 'tricky', abilities: ['seal', 'paralyze', 'spiritDown'],
    },
    dragon: {
      name: 'ドラゴン（BOSS）', sprite: '🐉',
      atkFactor: 1.3,  defFactor: 1.2,  spirit: 2, armor: 2,
      hpBase: 80, hpGrowth: 18,
      type: 'tricky', abilities: ['rage', 'multiAttack', 'revive'],
      isBoss: true,
    },
  };

  const ENCOUNTER_BY_ROUND = {
    1: ['slime', 'goblin', 'orc', 'armorKnight', 'zombie'],
    2: ['wizard', 'darkElf', 'troll', 'golem', 'banshee'],
    3: ['demon', 'darkKnight', 'necromancer', 'behemoth', 'succubus'],
  };
  const BOSS_BY_ROUND = { 1: 'ogre', 2: 'lich', 3: 'dragon' };

  // 簡易正規分布（6個の一様乱数の和 → 近似）
  function gaussianRand(mean, sd) {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += Math.random();
    const norm = (sum - 3) / 0.707;
    return Math.round(mean + norm * sd);
  }

  // ===== 敵インスタンス生成 =====
  // level = マップでの歩数（State.g.turn）
  function createEnemy(key, level) {
    const data = ENEMY_DATA[key];
    if (!data) { console.warn('Unknown enemy key:', key); return null; }

    const lvl     = Math.max(1, level || 1);
    const bossMod = data.isBoss ? 1 : 0;

    // Lv.1平均=4、1レベルごとに+0.2、BOSS追加+1
    const meanBase = 4 + 0.2 * (lvl - 1) + bossMod;

    const atkMean = Math.max(1, Math.round(meanBase * data.atkFactor));
    const defMean = Math.max(0, Math.round(meanBase * data.defFactor));
    const atkSd   = Math.max(1, Math.round(atkMean * 0.20));
    const defSd   = Math.max(1, Math.round(defMean * 0.20));

    const hp = data.hpBase + data.hpGrowth * (lvl - 1);

    return {
      key, name: data.name, sprite: data.sprite, level: lvl,
      imgSrc: `enemy/${key}.png`,
      hp, maxHp: hp,
      atkBase: atkMean, defBase: defMean,
      atkSd, defSd,
      spirit: data.spirit ?? 0,
      armor:  data.armor  ?? 0,
      type: data.type,
      abilities: [...data.abilities],
      isBoss: !!data.isBoss,
      isElite: !!data.isElite,
      atkBonus: 0, defBonus: 0,
      reviveUsed: false, enraged: false,
      paralyzed: false,
      currentAtkRoll: 0, currentDefRoll: 0,
      displayAtkRoll: '?', displayDefRoll: '?',
    };
  }

  function randomEnemy(round, level) {
    const pool = ENCOUNTER_BY_ROUND[round] || ENCOUNTER_BY_ROUND[1];
    const key  = pool[Math.floor(Math.random() * pool.length)];
    return createEnemy(key, level);
  }

  function bossEnemy(round, level) {
    const key = BOSS_BY_ROUND[round] || 'ogre';
    return createEnemy(key, level);
  }

  // 行動隠蔽確率テーブル [通常, 強敵, BOSS]
  const HIDE_PROB = {
    1: [0,    0,    0   ],
    2: [0.10, 0.15, 0.20],
    3: [0.15, 0.20, 0.25],
  };

  function enemyTierIndex(enemy) {
    if (enemy.isBoss)   return 2;
    if (enemy.isElite)  return 1;
    return 0;
  }

  function decideNextActions(enemy, gameRound) {
    const atkRoll = rollEnemyAtk(enemy);
    const defRoll = rollEnemyDef(enemy);
    // 常に実際の値を表示（隠さない）
    enemy.currentAtkRoll = atkRoll;
    enemy.currentDefRoll = defRoll;
    enemy.displayAtkRoll = atkRoll;
    enemy.displayDefRoll = defRoll;
    enemy.currentActions = ['attack', 'defense'];
    enemy.displayActions = ['attack', 'defense'];
    return { atkRoll, defRoll };
  }

  function rollEnemyAtk(enemy) {
    return Math.max(1, gaussianRand(enemy.atkBase + enemy.atkBonus, enemy.atkSd));
  }

  function rollEnemyDef(enemy) {
    return Math.max(0, gaussianRand(enemy.defBase + enemy.defBonus, enemy.defSd));
  }

  function enemyTakeDamage(enemy, playerAtk, isDefenseAction) {
    const defMult = isDefenseAction ? 1.5 : 1.0;
    const enemyDef = Math.round(rollEnemyDef(enemy) * defMult);
    const dmg = Math.max(0, playerAtk - enemyDef);
    if (dmg >= 1) enemy.hp = Math.max(0, enemy.hp - dmg);
    return { enemyDef, dmgDealt: dmg };
  }

  // ===== 敵固有スキル（敵タイプ別推薦）=====
  const ENEMY_UNIQUE_SKILLS = {
    slime:       'kisuu_tate',
    goblin:      'retsuka',
    orc:         'teppeki',
    armorKnight: 'daichi_chikara',
    zombie:      'dokugiri',
    ogre:        'souken_ranbu',
    wizard:      'mahi_noroi',
    darkElf:     'taka_me',
    troll:       'guusuu_toride',
    golem:       'roku_mamori',
    banshee:     'mahi_noroi',
    lich:        'juuni_tenku',
    demon:       'guusuu_bomb',
    darkKnight:  'jyu_issen',
    necromancer: 'sosu_ha',
    behemoth:    'daichi_chikara',
    succubus:    'dokugiri',
    dragon:      'juuni_tenku',
  };

  // ラウンドに応じたスキル数を敵に割り当て（Skills.DEFSに依存するためbattle.jsから呼ぶ）
  function assignEnemySkills(enemy, round, allSkillDefs) {
    const numSkills = round <= 1 ? 2 : round <= 2 ? 3 : 4;
    const uniqueSkill = ENEMY_UNIQUE_SKILLS[enemy.key] || null;
    const allIds = Object.keys(allSkillDefs);
    const pool = allIds.filter(id => id !== uniqueSkill).sort(() => Math.random() - 0.5);

    const skills = [];
    if (uniqueSkill && allSkillDefs[uniqueSkill]) skills.push(uniqueSkill);
    for (let i = 0; skills.length < numSkills && i < pool.length; i++) {
      skills.push(pool[i]);
    }
    enemy.skills = skills;
  }

  const ACTION_LABEL = { attack: '⚔攻撃', defense: '🛡防御', special: '✨特殊', '???': '？？？' };
  function actionLabel(a) { return ACTION_LABEL[a] || a; }

  return {
    ENEMY_DATA, createEnemy, randomEnemy, bossEnemy,
    decideNextActions, rollEnemyAtk, rollEnemyDef, enemyTakeDamage, actionLabel,
    assignEnemySkills,
  };
})();
