// ===== カード特殊能力システム =====
// scope: 'atk' = 式①（攻撃）専用, 'def' = 式②（防御）専用, 'any' = どちらでもOK
// rarity: 1=★☆☆, 2=★★☆, 3=★★★

const Abilities = (() => {

  const DEFS = {

    // ══════════════════════════════════════
    // ★☆☆  レア度 1
    // ══════════════════════════════════════
    spirit1: {
      id: 'spirit1', name: '闘気+1', scope: 'atk', icon: '🔴', rarity: 1,
      desc: 'このバトル中、闘気+1',
      effect: 'spirit', value: 1,
    },
    armor1: {
      id: 'armor1', name: '護気+1', scope: 'def', icon: '🔵', rarity: 1,
      desc: 'このバトル中、護気+1',
      effect: 'armor', value: 1,
    },
    atk3: {
      id: 'atk3', name: '攻撃+3', scope: 'atk', icon: '⚔', rarity: 1,
      desc: 'このターン、攻撃力+3',
      effect: 'addAtk', value: 3,
    },
    def3: {
      id: 'def3', name: '防御+3', scope: 'def', icon: '🛡', rarity: 1,
      desc: 'このターン、防御力+3',
      effect: 'addDef', value: 3,
    },
    healAny4: {
      id: 'healAny4', name: 'HP回復+4', scope: 'any', icon: '💚', rarity: 1,
      desc: 'HPを4回復',
      effect: 'healHp', value: 4,
    },
    healAtk6: {
      id: 'healAtk6', name: 'HP回復+6', scope: 'atk', icon: '💚', rarity: 1,
      desc: '(攻) HPを6回復',
      effect: 'healHp', value: 6,
    },
    healDef6: {
      id: 'healDef6', name: 'HP回復+6', scope: 'def', icon: '💚', rarity: 1,
      desc: '(防) HPを6回復',
      effect: 'healHp', value: 6,
    },
    atkDouble: {
      id: 'atkDouble', name: '攻撃×2(1/2)', scope: 'atk', icon: '×2', rarity: 1,
      desc: '式①に2つ → 攻撃力×2',
      effect: 'multAtk', value: 2, need: 2,
    },
    defDouble: {
      id: 'defDouble', name: '防御×2(1/2)', scope: 'def', icon: '×2', rarity: 1,
      desc: '式②に2つ → 防御力×2',
      effect: 'multDef', value: 2, need: 2,
    },

    // ══════════════════════════════════════
    // ★★☆  レア度 2
    // ══════════════════════════════════════
    spirit2: {
      id: 'spirit2', name: '闘気+2', scope: 'atk', icon: '🔴', rarity: 2,
      desc: 'このバトル中、闘気+2',
      effect: 'spirit', value: 2,
    },
    armor2: {
      id: 'armor2', name: '護気+2', scope: 'def', icon: '🔵', rarity: 2,
      desc: 'このバトル中、護気+2',
      effect: 'armor', value: 2,
    },
    atk4: {
      id: 'atk4', name: '攻撃+4', scope: 'atk', icon: '⚔', rarity: 2,
      desc: 'このターン、攻撃力+4',
      effect: 'addAtk', value: 4,
    },
    def4: {
      id: 'def4', name: '防御+4', scope: 'def', icon: '🛡', rarity: 2,
      desc: 'このターン、防御力+4',
      effect: 'addDef', value: 4,
    },
    healAny5: {
      id: 'healAny5', name: 'HP回復+5', scope: 'any', icon: '💚', rarity: 2,
      desc: 'HPを5回復',
      effect: 'healHp', value: 5,
    },
    healAtk8: {
      id: 'healAtk8', name: 'HP回復+8', scope: 'atk', icon: '💚', rarity: 2,
      desc: '(攻) HPを8回復',
      effect: 'healHp', value: 8,
    },
    healDef8: {
      id: 'healDef8', name: 'HP回復+8', scope: 'def', icon: '💚', rarity: 2,
      desc: '(防) HPを8回復',
      effect: 'healHp', value: 8,
    },
    spiritDouble9: {
      id: 'spiritDouble9', name: '闘気+9(1/2)', scope: 'atk', icon: '🔴', rarity: 2,
      desc: '式①に2つ → 闘気+9',
      effect: 'spiritDouble', value: 9, need: 2,
    },
    armorDouble8: {
      id: 'armorDouble8', name: '護気+8(1/2)', scope: 'def', icon: '🔵', rarity: 2,
      desc: '式②に2つ → 護気+8',
      effect: 'armorDouble', value: 8, need: 2,
    },

    // ══════════════════════════════════════
    // ★★★  レア度 3
    // ══════════════════════════════════════
    spirit3: {
      id: 'spirit3', name: '闘気+3', scope: 'atk', icon: '🔴', rarity: 3,
      desc: 'このバトル中、闘気+3',
      effect: 'spirit', value: 3,
    },
    armor3: {
      id: 'armor3', name: '護気+3', scope: 'def', icon: '🔵', rarity: 3,
      desc: 'このバトル中、護気+3',
      effect: 'armor', value: 3,
    },
    atk5: {
      id: 'atk5', name: '攻撃+5', scope: 'atk', icon: '⚔', rarity: 3,
      desc: 'このターン、攻撃力+5',
      effect: 'addAtk', value: 5,
    },
    def5: {
      id: 'def5', name: '防御+5', scope: 'def', icon: '🛡', rarity: 3,
      desc: 'このターン、防御力+5',
      effect: 'addDef', value: 5,
    },
    healAny6: {
      id: 'healAny6', name: 'HP回復+6', scope: 'any', icon: '💚', rarity: 3,
      desc: 'HPを6回復',
      effect: 'healHp', value: 6,
    },
    healAtk10: {
      id: 'healAtk10', name: 'HP回復+10', scope: 'atk', icon: '💚', rarity: 3,
      desc: '(攻) HPを10回復',
      effect: 'healHp', value: 10,
    },
    healDef10: {
      id: 'healDef10', name: 'HP回復+10', scope: 'def', icon: '💚', rarity: 3,
      desc: '(防) HPを10回復',
      effect: 'healHp', value: 10,
    },
    barrier: {
      id: 'barrier', name: 'バリア(1/2)', scope: 'any', icon: '🔮', rarity: 3,
      desc: '式に2つ → このターンダメージ無効',
      effect: 'barrier', need: 2,
    },
    musou: {
      id: 'musou', name: '無双(1/2)', scope: 'any', icon: '💫', rarity: 3,
      desc: '式①に2つ → 攻撃力×3',
      effect: 'multAtk', value: 3, need: 2,
    },
  };

  // ── レア度ユーティリティ ──
  function rarityStars(rarity) {
    if (rarity === 1) return '★☆☆';
    if (rarity === 2) return '★★☆';
    return '★★★';
  }

  function rarityPrice(rarity) {
    if (rarity === 1) return 8;
    if (rarity === 2) return 12;
    return 18;
  }

  // スコープバッジ HTML
  function scopeBadge(scope) {
    if (scope === 'atk') return '<span class="ab-badge atk-badge">攻</span>';
    if (scope === 'def') return '<span class="ab-badge def-badge">防</span>';
    return '<span class="ab-badge any-badge">全</span>';
  }

  // ── 報酬カード生成（レア度加重ランダム）──
  const ALL_ABILITY_IDS = Object.keys(DEFS);

  function generateRewardCards(enemyType) {
    const cards = [];
    for (let i = 0; i < 3; i++) {
      const num = Math.floor(Math.random() * 9) + 1;
      const card = State.createCard(num);

      // レア度選択
      const r = Math.random();
      let rarity;
      if (enemyType === 'boss') {
        rarity = r < 0.40 ? 2 : 3;
      } else if (enemyType === 'elite') {
        rarity = r < 0.50 ? 2 : 3;
      } else {
        rarity = r < 0.60 ? 1 : r < 0.90 ? 2 : 3;
      }

      const pool = Object.values(DEFS).filter(d => d.rarity === rarity);
      const ab = pool[Math.floor(Math.random() * pool.length)];
      card.abilities = [ab.id];
      cards.push(card);
    }
    return cards;
  }

  // ── カード能力解決 ──
  // isAttack=true → 式①, false → 式②
  // returns: { atkBonus, defBonus, multAtk, multDef, barrier, logs }
  function applyCardAbilities(formulaCards, isAttack, g) {
    let atkBonus = 0;
    let defBonus = 0;
    const logs = [];
    const abilityCount = {};

    for (const card of formulaCards) {
      for (const abId of card.abilities) {
        const def = DEFS[abId];
        if (!def) continue;

        // スコープチェック
        const scopeOk = def.scope === 'any'
          || (def.scope === 'atk' && isAttack)
          || (def.scope === 'def' && !isAttack);
        if (!scopeOk) continue;

        // カウント系効果（×2, spiritDouble, armorDouble, barrier）は後処理
        if (['multAtk', 'multDef', 'spiritDouble', 'armorDouble', 'barrier'].includes(def.effect)) {
          abilityCount[abId] = (abilityCount[abId] || 0) + 1;
          continue;
        }

        // 即時効果
        switch (def.effect) {
          case 'spirit':
            g.spirit += def.value;
            logs.push(`${def.icon}${def.name}（闘気→${g.spirit}）`);
            break;
          case 'armor':
            g.armor += def.value;
            logs.push(`${def.icon}${def.name}（護気→${g.armor}）`);
            break;
          case 'addAtk':
            atkBonus += def.value;
            logs.push(`${def.icon}${def.name}(+${def.value})`);
            break;
          case 'addDef':
            defBonus += def.value;
            logs.push(`${def.icon}${def.name}(+${def.value})`);
            break;
          case 'healHp':
            State.changeHp(def.value);
            logs.push(`${def.icon}${def.name}(HP+${def.value})`);
            break;
        }
      }
    }

    // カウント系効果の後処理
    let multAtk = 1, multDef = 1, barrierActive = false;
    for (const [abId, cnt] of Object.entries(abilityCount)) {
      const def = DEFS[abId];
      if (!def) continue;
      if (cnt < def.need) continue;

      switch (def.effect) {
        case 'multAtk':
          multAtk = Math.max(multAtk, def.value);
          logs.push(`${def.icon}${def.name}→攻撃×${def.value}`);
          break;
        case 'multDef':
          multDef = Math.max(multDef, def.value);
          logs.push(`${def.icon}${def.name}→防御×${def.value}`);
          break;
        case 'spiritDouble':
          g.spirit += def.value;
          logs.push(`${def.icon}${def.name}（闘気→${g.spirit}）`);
          break;
        case 'armorDouble':
          g.armor += def.value;
          logs.push(`${def.icon}${def.name}（護気→${g.armor}）`);
          break;
        case 'barrier':
          barrierActive = true;
          logs.push(`${def.icon}バリア発動！（ダメージ無効）`);
          break;
      }
    }

    return { atkBonus, defBonus, multAtk, multDef, barrier: barrierActive, logs };
  }

  return {
    DEFS, scopeBadge, rarityStars, rarityPrice,
    generateRewardCards, applyCardAbilities,
    ALL_ABILITY_IDS,
  };
})();
