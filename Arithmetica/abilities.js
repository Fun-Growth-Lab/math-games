// ===== 特殊能力システム =====

const Abilities = (() => {

  // ===== 能力定義 =====
  // type: 'add'=加算系, 'heal'=HP/鎧回復系, 'mult'=倍率系, 'carry'=盾持ち越し
  // phase: 'always'=常時, 'result'=計算結果条件, 'card'=カード条件
  const DEFS = {
    // ── バフ系 ──
    boost3:      { name: '強化+3',      icon: '⬆️', type: 'add',   phase: 'always',  value: 3,  rarity: 1,
                   desc: 'この式の結果に+3' },
    healNow2:    { name: '即時回復',    icon: '💚', type: 'heal',  phase: 'always',  hp: 2,     rarity: 1,
                   desc: 'HP+2（即時）' },
    healTick1:   { name: '連続回復',    icon: '💚', type: 'heal',  phase: 'always',  hp: 1, ticks: 3, rarity: 2,
                   desc: 'HP+1×3ターン' },
    armorNow2:   { name: '鎧回復',      icon: '🛡️', type: 'heal',  phase: 'always',  armor: 2,  rarity: 1,
                   desc: '鎧+2（即時）' },
    armorTick1:  { name: '鎧連続回復',  icon: '🛡️', type: 'heal',  phase: 'always',  armor: 1, ticks: 3, rarity: 2,
                   desc: '鎧+1×3ターン' },
    shieldCarry1:{ name: '盾持ち越し',  icon: '🔰', type: 'carry', phase: 'always',  turns: 1, full: true, rarity: 3,
                   desc: '防御力を次ターンへ全て持ち越す' },
    atkDouble:   { name: '攻撃2倍½',    icon: '×2', type: 'mult',  phase: 'always',  mult: 2, need: 2, target: 'attack', rarity: 3,
                   desc: '同じ式で2回発動で攻撃×2' },
    defDouble:   { name: '防御2倍½',    icon: '×2', type: 'mult',  phase: 'always',  mult: 2, need: 2, target: 'defense', rarity: 3,
                   desc: '同じ式で2回発動で防御×2' },

    // ── シナジー系：計算結果トリガー ──
    evenPower:   { name: '偶数の力',    icon: '🔴', type: 'add',   phase: 'result',
                   cond: r => r % 2 === 0,            value: 6,       rarity: 1,
                   desc: '答えが偶数なら+6' },
    oddPower:    { name: '奇数の力',    icon: '🔵', type: 'add',   phase: 'result',
                   cond: r => r % 2 !== 0,            value: 6,       rarity: 1,
                   desc: '答えが奇数なら+6' },
    primePower:  { name: '素数の力',    icon: '🟡', type: 'add',   phase: 'result',
                   cond: r => isPrime(r),              value: 8,       rarity: 2,
                   desc: '答えが素数なら+8' },
    triple3:     { name: '3の刻印',     icon: '③',  type: 'add',   phase: 'result',
                   cond: r => r > 0 && r % 3 === 0,  value: 3, hp: 2, rarity: 2,
                   desc: '答えが3の倍数なら+3,HP+2' },
    fiveGuard:   { name: '5の加護',     icon: '⑤',  type: 'add',   phase: 'result',
                   cond: r => r > 0 && r % 5 === 0,  value: 5, hp: 3, rarity: 2,
                   desc: '答えが5の倍数なら+5,HP+3' },
    sevenBeat:   { name: '7の鼓動',     icon: '⑦',  type: 'add',   phase: 'result',
                   cond: r => r > 0 && r % 7 === 0,  value: 7, hp: 4, rarity: 3,
                   desc: '答えが7の倍数なら+7,HP+4' },

    // ── シナジー系：使用カードトリガー ──
    evenCombo:   { name: '偶数コンボ',  icon: '🔴', type: 'add',   phase: 'card',
                   cond: cards => cards.every(c => c.props.even),      value: 7, rarity: 1,
                   desc: '式のカードが全て偶数なら+7' },
    oddCombo:    { name: '奇数コンボ',  icon: '🔵', type: 'add',   phase: 'card',
                   cond: cards => cards.every(c => c.props.odd),       value: 7, rarity: 1,
                   desc: '式のカードが全て奇数なら+7' },
    primeCombo:  { name: '素数コンボ',  icon: '🟡', type: 'add',   phase: 'card',
                   cond: cards => cards.every(c => c.props.prime),     value: 5, hp: 3, rarity: 2,
                   desc: '式のカードが全て素数なら+5,HP+3' },
    seqCombo:    { name: '連番コンボ',  icon: '🔢', type: 'add',   phase: 'card',
                   cond: cards => isSequential(cards),                 value: 8, rarity: 2,
                   desc: '式のカードが連続した数字なら+8' },
    pairCombo:   { name: '同数コンボ',  icon: '👯', type: 'add',   phase: 'card',
                   cond: cards => cards.length >= 2 && cards[0].num === cards[1].num, value: 6, rarity: 1,
                   desc: '式に同じ数字が2枚あれば+6' },
  };

  // レア度別プール
  const POOL_BY_RARITY = {
    1: ['boost3','healNow2','armorNow2','evenPower','oddPower','evenCombo','oddCombo','pairCombo'],
    2: ['healTick1','armorTick1','primePower','triple3','fiveGuard','primeCombo','seqCombo'],
    3: ['shieldCarry1','sevenBeat','atkDouble','defDouble'],
  };

  // 敵タイプ別の能力レア度分布（通常/強敵/BOSS）
  const RARITY_WEIGHTS = {
    enemy: [70, 25, 5],
    elite: [30, 50, 20],
    boss:  [10, 40, 50],
  };

  // ===== ユーティリティ =====
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

  // ===== 能力1つをランダム選択 =====
  function randomAbility(enemyType) {
    const weights = RARITY_WEIGHTS[enemyType] || RARITY_WEIGHTS.enemy;
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let rarity = 1;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) { rarity = i + 1; break; }
    }
    const pool = POOL_BY_RARITY[rarity] || POOL_BY_RARITY[1];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ===== 報酬カード3枚を生成 =====
  // enemyType: 'enemy'|'elite'|'boss'
  function generateRewardCards(enemyType) {
    const twoAbilityProb = enemyType === 'boss' ? 1.0 : enemyType === 'elite' ? 0.5 : 0.2;
    const cards = [];
    for (let i = 0; i < 3; i++) {
      const num = Math.floor(Math.random() * 9) + 1;
      const card = State.createCard(num);
      // 1つ目の能力は必ず付与
      const ab1 = randomAbility(enemyType);
      card.abilities = [ab1];
      // 2つ目は確率で付与（重複不可）
      if (Math.random() < twoAbilityProb) {
        let ab2 = randomAbility(enemyType);
        let tries = 0;
        while (ab2 === ab1 && tries < 5) { ab2 = randomAbility(enemyType); tries++; }
        if (ab2 !== ab1) card.abilities.push(ab2);
      }
      cards.push(card);
    }
    return cards;
  }

  // ===== 能力を式に適用して最終ダメージ/防御値を返す =====
  // formulaCards: [card, card]
  // baseResult: 式の計算結果（マイナスは0）
  // isAttack: 攻撃式かどうか
  // spirit: 闘志
  // g: ゲーム状態
  // returns: { finalValue, logs: string[] }
  function applyToFormula(formulaCards, baseResult, isAttack, spirit, g) {
    let addBonus = 0;
    let multTriggerCount = {};  // multアビリティIDごとのトリガー数
    const logs = [];

    // ── フェーズ1：加算効果 ──
    for (const card of formulaCards) {
      for (const abilityId of card.abilities) {
        const def = DEFS[abilityId];
        if (!def) continue;

        // 倍率系はあとで処理
        if (def.type === 'mult') {
          multTriggerCount[abilityId] = (multTriggerCount[abilityId] || 0) + 1;
          continue;
        }
        // 持ち越し系もあとで
        if (def.type === 'carry') {
          // TODO Phase④
          continue;
        }

        // 条件チェック
        const currentResult = baseResult + addBonus;
        let condOk = true;
        if (def.phase === 'result') {
          condOk = def.cond(currentResult);
        } else if (def.phase === 'card') {
          condOk = def.cond(formulaCards);
        }
        if (!condOk) continue;

        // 加算
        if (def.type === 'add' && def.value) {
          addBonus += def.value;
          logs.push(`${def.icon}${def.name}+${def.value}`);
        }
        // HP/鎧回復
        if (def.type === 'heal') {
          if (def.hp) {
            if (def.ticks) {
              g.healTicks = (g.healTicks || 0) + def.hp * def.ticks;
              logs.push(`${def.icon}${def.name}(HP+${def.hp}×${def.ticks}T)`);
            } else {
              State.changeHp(def.hp);
              logs.push(`${def.icon}${def.name}(HP+${def.hp})`);
            }
          }
          if (def.armor) {
            if (def.ticks) {
              g.armorTicks = (g.armorTicks || 0) + def.armor * def.ticks;
              logs.push(`${def.icon}${def.name}(鎧+${def.armor}×${def.ticks}T)`);
            } else {
              State.changeArmor(def.armor);
              logs.push(`${def.icon}${def.name}(鎧+${def.armor})`);
            }
          }
        }
        // 結果トリガーのHP副効果
        if (def.phase === 'result' && def.hp && def.type === 'add') {
          State.changeHp(def.hp);
          logs.push(`HP+${def.hp}`);
        }
        // カードトリガーのHP副効果
        if (def.phase === 'card' && def.hp && def.type === 'add') {
          State.changeHp(def.hp);
          logs.push(`HP+${def.hp}`);
        }
      }
    }

    // ── フェーズ2：闘志加算（攻撃式のみ）──
    let afterSpirit = baseResult + addBonus + (isAttack ? spirit : 0);
    afterSpirit = Math.max(0, afterSpirit);

    // ── フェーズ3：倍率適用 ──
    let finalValue = afterSpirit;
    for (const [abilityId, count] of Object.entries(multTriggerCount)) {
      const def = DEFS[abilityId];
      if (!def || def.type !== 'mult') continue;
      // 攻撃/防御マッチチェック
      if (def.target === 'attack' && !isAttack) continue;
      if (def.target === 'defense' && isAttack) continue;
      if (count >= def.need) {
        finalValue = Math.round(finalValue * def.mult);
        logs.push(`${def.icon}${def.name}→×${def.mult}`);
      }
    }

    return { finalValue, logs };
  }

  // ターン開始時にtick回復を処理
  function processTicks(g) {
    const results = [];
    if (g.healTicks > 0) {
      const heal = Math.min(g.healTicks, 1);
      State.changeHp(heal);
      g.healTicks--;
      results.push(`HP+1(連続回復)`);
    }
    if (g.armorTicks > 0) {
      const armor = Math.min(g.armorTicks, 1);
      State.changeArmor(armor);
      g.armorTicks--;
      results.push(`鎧+1(連続回復)`);
    }
    return results;
  }

  return {
    DEFS, isPrime, generateRewardCards, applyToFormula, processTicks,
  };
})();
