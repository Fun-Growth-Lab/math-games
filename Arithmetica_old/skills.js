// ===== プレイヤースキルシステム（50種類）=====
// trigger: 'atk'=式①専用, 'def'=式②専用, 'both'=どちらでもOK
// 表示: (攻)/(防)/(全) として省略

const Skills = (() => {

  // ─── ユーティリティ ───
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) { if (n % i === 0) return false; }
    return true;
  }
  function isSequential(cards) {
    if (cards.length < 2) return false;
    const nums = cards.map(c => c.num).sort((a, b) => a - b);
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] - nums[i - 1] !== 1) return false;
    }
    return true;
  }
  function hasPair(cards) {
    return cards.length >= 2 && cards[0].num === cards[1].num;
  }
  function hasNum(cards, n) {
    return cards.some(c => c.num === n);
  }

  const DEFS = {

    // ══════════════════════════════════════════
    // 攻撃スキル (trigger: 'atk')
    // ══════════════════════════════════════════

    retsuka: {
      id: 'retsuka', name: '烈火斬', icon: '🔥', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが10以上', effectDesc: '攻撃力+5',
      cond: (result) => result >= 10,
      apply: (ctx) => { ctx.atkBonus += 5; ctx.logs.push('🔥烈火斬(攻+5)'); },
    },
    renzoku: {
      id: 'renzoku', name: '連続突き', icon: '⚡', trigger: 'atk', stars: '★★☆',
      condDesc: '連続した数を2枚使った', effectDesc: '攻撃力+3、毒3ターン',
      cond: (result, cards) => isSequential(cards),
      apply: (ctx) => {
        ctx.atkBonus += 3;
        ctx.g.poisonTurns = Math.max(ctx.g.poisonTurns || 0, 3);
        ctx.logs.push('⚡連続突き(攻+3 毒)');
      },
    },
    kisuu_hit: {
      id: 'kisuu_hit', name: '奇数の一撃', icon: '✨', trigger: 'atk', stars: '★☆☆',
      condDesc: '答えが奇数', effectDesc: 'この戦闘の闘気+2',
      cond: (result) => result % 2 !== 0,
      apply: (ctx) => { ctx.g.spirit += 2; ctx.logs.push('✨奇数の一撃(闘気+2)'); },
    },
    guusuu_bomb: {
      id: 'guusuu_bomb', name: '偶数の爆発', icon: '💥', trigger: 'atk', stars: '★★★',
      condDesc: '答えが偶数', effectDesc: '攻撃力×1.5倍',
      cond: (result) => result % 2 === 0,
      apply: (ctx) => { ctx.multAtk = Math.max(ctx.multAtk, 1.5); ctx.logs.push('💥偶数の爆発(攻×1.5)'); },
    },
    sosu_ha: {
      id: 'sosu_ha', name: '素数の刃', icon: '💠', trigger: 'atk', stars: '★★★',
      condDesc: '答えが素数', effectDesc: '攻撃力+4、敵の護気-2',
      cond: (result) => isPrime(result),
      apply: (ctx) => {
        ctx.atkBonus += 4;
        if (ctx.enemy) ctx.enemy.armor = Math.max(0, ctx.enemy.armor - 2);
        ctx.logs.push('💠素数の刃(攻+4 敵護気-2)');
      },
    },
    nana_ikari: {
      id: 'nana_ikari', name: '七の怒り', icon: '7️⃣', trigger: 'atk', stars: '★★★',
      condDesc: '答えが7の倍数', effectDesc: '攻撃力+8',
      cond: (result) => result > 0 && result % 7 === 0,
      apply: (ctx) => { ctx.atkBonus += 8; ctx.logs.push('7️⃣七の怒り(攻+8)'); },
    },
    souken_ranbu: {
      id: 'souken_ranbu', name: '双剣乱舞', icon: '⚔', trigger: 'atk', stars: '★★★',
      condDesc: '同じ数を2枚使った', effectDesc: '攻撃2回（2回目は半分）',
      cond: (result, cards) => hasPair(cards),
      apply: (ctx) => { ctx.doubleStrike = true; ctx.logs.push('⚔双剣乱舞(攻2回)'); },
    },
    taka_me: {
      id: 'taka_me', name: '鷹の目', icon: '👁', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが5以下', effectDesc: '敵の護気を0にする',
      cond: (result) => result >= 0 && result <= 5,
      apply: (ctx) => {
        if (ctx.enemy) ctx.enemy.armor = 0;
        ctx.logs.push('👁鷹の目(敵護気→0)');
      },
    },
    jyu_issen: {
      id: 'jyu_issen', name: '十字一閃', icon: '✚', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが9以上', effectDesc: '攻撃力+4、闘気+1',
      cond: (result) => result >= 9,
      apply: (ctx) => {
        ctx.atkBonus += 4; ctx.g.spirit += 1;
        ctx.logs.push('✚十字一閃(攻+4 闘気+1)');
      },
    },
    juuni_tenku: {
      id: 'juuni_tenku', name: '十二天降', icon: '🌟', trigger: 'atk', stars: '★★★',
      condDesc: '答えが12以上', effectDesc: '攻撃力+10',
      cond: (result) => result >= 12,
      apply: (ctx) => { ctx.atkBonus += 10; ctx.logs.push('🌟十二天降(攻+10)'); },
    },

    // ─── 4・5・6・3・7 特化攻撃スキル ───
    shi_no_ken: {
      id: 'shi_no_ken', name: '四の剣', icon: '4️⃣', trigger: 'atk', stars: '★☆☆',
      condDesc: 'カードに4が含まれる', effectDesc: '攻撃力+5',
      cond: (result, cards) => hasNum(cards, 4),
      apply: (ctx) => { ctx.atkBonus += 5; ctx.logs.push('4️⃣四の剣(攻+5)'); },
    },
    go_no_ken: {
      id: 'go_no_ken', name: '五の剣', icon: '5️⃣', trigger: 'atk', stars: '★☆☆',
      condDesc: 'カードに5が含まれる', effectDesc: '攻撃力+5',
      cond: (result, cards) => hasNum(cards, 5),
      apply: (ctx) => { ctx.atkBonus += 5; ctx.logs.push('5️⃣五の剣(攻+5)'); },
    },
    roku_no_ken: {
      id: 'roku_no_ken', name: '六の剣', icon: '6️⃣', trigger: 'atk', stars: '★☆☆',
      condDesc: 'カードに6が含まれる', effectDesc: '攻撃力+6',
      cond: (result, cards) => hasNum(cards, 6),
      apply: (ctx) => { ctx.atkBonus += 6; ctx.logs.push('6️⃣六の剣(攻+6)'); },
    },
    nana_no_ken: {
      id: 'nana_no_ken', name: '七の剣', icon: '7️⃣', trigger: 'atk', stars: '★★☆',
      condDesc: 'カードに7が含まれる', effectDesc: '攻撃力+7',
      cond: (result, cards) => hasNum(cards, 7),
      apply: (ctx) => { ctx.atkBonus += 7; ctx.logs.push('7️⃣七の剣(攻+7)'); },
    },
    nana_no_ha: {
      id: 'nana_no_ha', name: '七の覇刃', icon: '🗡', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが7', effectDesc: '攻撃力+9',
      cond: (result) => result === 7,
      apply: (ctx) => { ctx.atkBonus += 9; ctx.logs.push('🗡七の覇刃(攻+9)'); },
    },
    san_no_ha: {
      id: 'san_no_ha', name: '三の刃', icon: '3️⃣', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが3', effectDesc: '攻撃力+8',
      cond: (result) => result === 3,
      apply: (ctx) => { ctx.atkBonus += 8; ctx.logs.push('3️⃣三の刃(攻+8)'); },
    },
    shi_tsuki: {
      id: 'shi_tsuki', name: '四の突き', icon: '4️⃣', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが4', effectDesc: '攻撃力+7',
      cond: (result) => result === 4,
      apply: (ctx) => { ctx.atkBonus += 7; ctx.logs.push('4️⃣四の突き(攻+7)'); },
    },
    roku_bakuha: {
      id: 'roku_bakuha', name: '六の爆破', icon: '💣', trigger: 'atk', stars: '★★★',
      condDesc: '答えが6', effectDesc: '攻撃力×2',
      cond: (result) => result === 6,
      apply: (ctx) => { ctx.multAtk = Math.max(ctx.multAtk, 2); ctx.logs.push('💣六の爆破(攻×2)'); },
    },
    shi_bakusen: {
      id: 'shi_bakusen', name: '四連閃', icon: '4️⃣', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが4の倍数', effectDesc: '攻撃力+5',
      cond: (result) => result > 0 && result % 4 === 0,
      apply: (ctx) => { ctx.atkBonus += 5; ctx.logs.push('4️⃣四連閃(攻+5)'); },
    },
    roku_rendan: {
      id: 'roku_rendan', name: '六連段', icon: '6️⃣', trigger: 'atk', stars: '★★☆',
      condDesc: '答えが6の倍数', effectDesc: '攻撃力+7',
      cond: (result) => result > 0 && result % 6 === 0,
      apply: (ctx) => { ctx.atkBonus += 7; ctx.logs.push('6️⃣六連段(攻+7)'); },
    },

    // ══════════════════════════════════════════
    // 防御スキル (trigger: 'def')
    // ══════════════════════════════════════════

    teppeki: {
      id: 'teppeki', name: '鉄壁守り', icon: '🛡', trigger: 'def', stars: '★★☆',
      condDesc: '答えが10以上', effectDesc: '防御力+5',
      cond: (result) => result >= 10,
      apply: (ctx) => { ctx.defBonus += 5; ctx.logs.push('🛡鉄壁守り(防+5)'); },
    },
    kisuu_tate: {
      id: 'kisuu_tate', name: '奇数の盾', icon: '🔵', trigger: 'def', stars: '★☆☆',
      condDesc: '答えが奇数', effectDesc: 'この戦闘の護気+2',
      cond: (result) => result % 2 !== 0,
      apply: (ctx) => { ctx.g.armor += 2; ctx.logs.push('🔵奇数の盾(護気+2)'); },
    },
    guusuu_toride: {
      id: 'guusuu_toride', name: '偶数の砦', icon: '🏰', trigger: 'def', stars: '★★☆',
      condDesc: '答えが偶数', effectDesc: 'ダメージを受けたらHP+3回復',
      cond: (result) => result % 2 === 0,
      apply: (ctx) => { ctx.regenOnHit = (ctx.regenOnHit || 0) + 3; ctx.logs.push('🏰偶数の砦(被弾時HP+3)'); },
    },
    go_mamori: {
      id: 'go_mamori', name: '5の護り', icon: '5️⃣', trigger: 'def', stars: '★★★',
      condDesc: '答えが5の倍数', effectDesc: '防御力×1.5倍',
      cond: (result) => result > 0 && result % 5 === 0,
      apply: (ctx) => { ctx.multDef = Math.max(ctx.multDef, 1.5); ctx.logs.push('5️⃣5の護り(防×1.5)'); },
    },
    yoroi_yaburi: {
      id: 'yoroi_yaburi', name: '鎧破り', icon: '⚒', trigger: 'def', stars: '★★☆',
      condDesc: '答えが3の倍数', effectDesc: '敵の護気-3',
      cond: (result) => result > 0 && result % 3 === 0,
      apply: (ctx) => {
        if (ctx.enemy) ctx.enemy.armor = Math.max(0, ctx.enemy.armor - 3);
        ctx.logs.push('⚒鎧破り(敵護気-3)');
      },
    },
    daichi_chikara: {
      id: 'daichi_chikara', name: '大地の力', icon: '🌍', trigger: 'def', stars: '★★☆',
      condDesc: '答えが8以上', effectDesc: 'この戦闘の護気+3',
      cond: (result) => result >= 8,
      apply: (ctx) => { ctx.g.armor += 3; ctx.logs.push('🌍大地の力(護気+3)'); },
    },

    // ─── 4・5・6・3・7 特化防御スキル ───
    shi_no_tate: {
      id: 'shi_no_tate', name: '四の盾', icon: '4️⃣', trigger: 'def', stars: '★☆☆',
      condDesc: 'カードに4が含まれる', effectDesc: '防御力+5',
      cond: (result, cards) => hasNum(cards, 4),
      apply: (ctx) => { ctx.defBonus += 5; ctx.logs.push('4️⃣四の盾(防+5)'); },
    },
    go_no_tate: {
      id: 'go_no_tate', name: '五の盾', icon: '5️⃣', trigger: 'def', stars: '★☆☆',
      condDesc: 'カードに5が含まれる', effectDesc: '防御力+5',
      cond: (result, cards) => hasNum(cards, 5),
      apply: (ctx) => { ctx.defBonus += 5; ctx.logs.push('5️⃣五の盾(防+5)'); },
    },
    roku_no_tate: {
      id: 'roku_no_tate', name: '六の盾', icon: '6️⃣', trigger: 'def', stars: '★☆☆',
      condDesc: 'カードに6が含まれる', effectDesc: '防御力+6',
      cond: (result, cards) => hasNum(cards, 6),
      apply: (ctx) => { ctx.defBonus += 6; ctx.logs.push('6️⃣六の盾(防+6)'); },
    },
    nana_no_tate: {
      id: 'nana_no_tate', name: '七の盾', icon: '7️⃣', trigger: 'def', stars: '★★☆',
      condDesc: 'カードに7が含まれる', effectDesc: '防御力+7',
      cond: (result, cards) => hasNum(cards, 7),
      apply: (ctx) => { ctx.defBonus += 7; ctx.logs.push('7️⃣七の盾(防+7)'); },
    },
    nana_no_kabe: {
      id: 'nana_no_kabe', name: '七の城壁', icon: '🗼', trigger: 'def', stars: '★★☆',
      condDesc: '答えが7', effectDesc: '防御力+9',
      cond: (result) => result === 7,
      apply: (ctx) => { ctx.defBonus += 9; ctx.logs.push('🗼七の城壁(防+9)'); },
    },
    san_no_kabe: {
      id: 'san_no_kabe', name: '三の防壁', icon: '3️⃣', trigger: 'def', stars: '★★☆',
      condDesc: '答えが3', effectDesc: '防御力+8',
      cond: (result) => result === 3,
      apply: (ctx) => { ctx.defBonus += 8; ctx.logs.push('3️⃣三の防壁(防+8)'); },
    },
    shi_yoroi: {
      id: 'shi_yoroi', name: '四の鎧', icon: '4️⃣', trigger: 'def', stars: '★★☆',
      condDesc: '答えが4', effectDesc: '護気+4',
      cond: (result) => result === 4,
      apply: (ctx) => { ctx.g.armor += 4; ctx.logs.push('4️⃣四の鎧(護気+4)'); },
    },
    roku_mamori: {
      id: 'roku_mamori', name: '六の守護', icon: '🔰', trigger: 'def', stars: '★★★',
      condDesc: '答えが6', effectDesc: '防御力×2',
      cond: (result) => result === 6,
      apply: (ctx) => { ctx.multDef = Math.max(ctx.multDef, 2); ctx.logs.push('🔰六の守護(防×2)'); },
    },
    shi_kekkai: {
      id: 'shi_kekkai', name: '四の結界', icon: '4️⃣', trigger: 'def', stars: '★★☆',
      condDesc: '答えが4の倍数', effectDesc: '防御力+5',
      cond: (result) => result > 0 && result % 4 === 0,
      apply: (ctx) => { ctx.defBonus += 5; ctx.logs.push('4️⃣四の結界(防+5)'); },
    },
    roku_no_kabe: {
      id: 'roku_no_kabe', name: '六の壁', icon: '6️⃣', trigger: 'def', stars: '★★☆',
      condDesc: '答えが6の倍数', effectDesc: '防御力+7',
      cond: (result) => result > 0 && result % 6 === 0,
      apply: (ctx) => { ctx.defBonus += 7; ctx.logs.push('6️⃣六の壁(防+7)'); },
    },

    // ══════════════════════════════════════════
    // 全スキル (trigger: 'both')
    // ══════════════════════════════════════════

    dokugiri: {
      id: 'dokugiri', name: '毒霧', icon: '🌫', trigger: 'both', stars: '★★☆',
      condDesc: '同じ数を2枚使った', effectDesc: '毒を与える（3ターン）',
      cond: (result, cards) => hasPair(cards),
      apply: (ctx) => { ctx.g.poisonTurns = Math.max(ctx.g.poisonTurns || 0, 3); ctx.logs.push('🌫毒霧(毒3T)'); },
    },
    mahi_noroi: {
      id: 'mahi_noroi', name: '麻痺の呪い', icon: '⚡', trigger: 'both', stars: '★★★',
      condDesc: '答えが3以下', effectDesc: '敵を麻痺（次ターン攻撃0）',
      cond: (result) => result >= 0 && result <= 3,
      apply: (ctx) => {
        if (ctx.enemy) ctx.enemy.paralyzed = true;
        ctx.logs.push('⚡麻痺の呪い(敵麻痺)');
      },
    },
    seina_hikari: {
      id: 'seina_hikari', name: '聖なる輝き', icon: '✝', trigger: 'both', stars: '★★★',
      condDesc: '答えが1', effectDesc: 'HP+10回復',
      cond: (result) => result === 1,
      apply: (ctx) => { State.changeHp(10); ctx.logs.push('✝聖なる輝き(HP+10)'); },
    },
    san_kago: {
      id: 'san_kago', name: '三の加護', icon: '3️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが3の倍数', effectDesc: 'HP+3回復',
      cond: (result) => result > 0 && result % 3 === 0,
      apply: (ctx) => { State.changeHp(3); ctx.logs.push('3️⃣三の加護(HP+3)'); },
    },

    // ─── 4・5・6・3・7 特化全スキル ───
    shi_kago: {
      id: 'shi_kago', name: '四の恵み', icon: '4️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが4', effectDesc: 'HP+6回復',
      cond: (result) => result === 4,
      apply: (ctx) => { State.changeHp(6); ctx.logs.push('4️⃣四の恵み(HP+6)'); },
    },
    go_kago: {
      id: 'go_kago', name: '五の恵み', icon: '5️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが5', effectDesc: 'HP+6回復',
      cond: (result) => result === 5,
      apply: (ctx) => { State.changeHp(6); ctx.logs.push('5️⃣五の恵み(HP+6)'); },
    },
    roku_kago: {
      id: 'roku_kago', name: '六の恵み', icon: '6️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが6', effectDesc: 'HP+6回復',
      cond: (result) => result === 6,
      apply: (ctx) => { State.changeHp(6); ctx.logs.push('6️⃣六の恵み(HP+6)'); },
    },
    nana_kago: {
      id: 'nana_kago', name: '七の恵み', icon: '7️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが7', effectDesc: 'HP+7回復',
      cond: (result) => result === 7,
      apply: (ctx) => { State.changeHp(7); ctx.logs.push('7️⃣七の恵み(HP+7)'); },
    },
    san_no_chikara: {
      id: 'san_no_chikara', name: '三の力', icon: '3️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: 'カードに3が含まれる', effectDesc: 'HP+4回復',
      cond: (result, cards) => hasNum(cards, 3),
      apply: (ctx) => { State.changeHp(4); ctx.logs.push('3️⃣三の力(HP+4)'); },
    },
    shi_no_hikari: {
      id: 'shi_no_hikari', name: '四の光', icon: '4️⃣', trigger: 'both', stars: '★★☆',
      condDesc: 'カードに4が含まれる', effectDesc: '闘気+2、護気+2',
      cond: (result, cards) => hasNum(cards, 4),
      apply: (ctx) => { ctx.g.spirit += 2; ctx.g.armor += 2; ctx.logs.push('4️⃣四の光(闘気+2 護気+2)'); },
    },
    go_no_hikari: {
      id: 'go_no_hikari', name: '五の光', icon: '5️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: 'カードに5が含まれる', effectDesc: 'HP+5回復',
      cond: (result, cards) => hasNum(cards, 5),
      apply: (ctx) => { State.changeHp(5); ctx.logs.push('5️⃣五の光(HP+5)'); },
    },
    roku_no_hikari: {
      id: 'roku_no_hikari', name: '六の光', icon: '6️⃣', trigger: 'both', stars: '★★☆',
      condDesc: 'カードに6が含まれる', effectDesc: '敵の護気-2',
      cond: (result, cards) => hasNum(cards, 6),
      apply: (ctx) => {
        if (ctx.enemy) ctx.enemy.armor = Math.max(0, ctx.enemy.armor - 2);
        ctx.logs.push('6️⃣六の光(敵護気-2)');
      },
    },
    nana_no_noroi: {
      id: 'nana_no_noroi', name: '七の呪い', icon: '7️⃣', trigger: 'both', stars: '★★☆',
      condDesc: 'カードに7が含まれる', effectDesc: '敵に毒（3ターン）',
      cond: (result, cards) => hasNum(cards, 7),
      apply: (ctx) => {
        ctx.g.poisonTurns = Math.max(ctx.g.poisonTurns || 0, 3);
        ctx.logs.push('7️⃣七の呪い(敵毒3T)');
      },
    },
    hachi_no_sai: {
      id: 'hachi_no_sai', name: '八の彩', icon: '8️⃣', trigger: 'both', stars: '★☆☆',
      condDesc: '答えが8', effectDesc: 'HP+8回復',
      cond: (result) => result === 8,
      apply: (ctx) => { State.changeHp(8); ctx.logs.push('8️⃣八の彩(HP+8)'); },
    },
  };

  // ── スキル発動チェック ──
  function applySkills(learnedSkillIds, formulaCards, formulaResult, isAttack, ctx) {
    const trigger = isAttack ? 'atk' : 'def';
    for (const skillId of learnedSkillIds) {
      const def = DEFS[skillId];
      if (!def) continue;
      if (def.trigger !== 'both' && def.trigger !== trigger) continue;
      if (!def.cond(formulaResult, formulaCards)) continue;
      def.apply(ctx);
    }
  }

  return { DEFS, applySkills };
})();
