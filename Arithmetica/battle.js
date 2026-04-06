// ===== 戦闘システム（同時解決方式）=====

const Battle = (() => {

  const $ = id => document.getElementById(id);

  let vsResetTimer = null;
  let lastDrawnCardId = null;
  let pendingVictory = false;

  // ===== 色付きログ =====
  function colorLog(msg) {
    return msg
      .replace(/HP-(\d+)/g,     '<span class="log-dmg">HP-$1</span>')
      .replace(/(\d+)ダメ/g,    '<span class="log-dmg">$1ダメ</span>')
      .replace(/ガード/g,        '<span class="log-def">ガード</span>')
      .replace(/回復\+(\d+)/g,  '<span class="log-heal">回復+$1</span>')
      .replace(/蘇生/g,          '<span class="log-heal">蘇生</span>')
      .replace(/毒/g,            '<span class="log-poison">毒</span>')
      .replace(/勝利！/g,        '<span class="log-win">勝利！</span>');
  }

  function log(msg) {
    $('log-text').innerHTML = colorLog(msg);
  }

  // ===== ダメージフラッシュ =====
  function flashDamage(elId) {
    const el = $(elId);
    if (!el) return;
    el.classList.remove('damage-flash');
    void el.offsetWidth; // reflow
    el.classList.add('damage-flash');
    setTimeout(() => el.classList.remove('damage-flash'), 600);
  }

  function flashCritical(type) {
    const el = document.getElementById('game-container');
    if (!el) return;
    const cls = type === 'atk' ? 'critical-atk-flash' : 'critical-def-flash';
    el.classList.remove('critical-atk-flash', 'critical-def-flash');
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }

  // ===== 敵カード生成 =====
  function applyEnemyCards(enemy) {
    const nums = Array.from({length: 4}, () => Math.floor(Math.random() * 9) + 1);
    nums.sort((a, b) => a - b); // [min, 2nd, 3rd, max]

    const abilityChance = Math.min(0.75, 0.04 + (enemy.level - 1) * 0.055);

    function makeCard(num) {
      const c = State.createCard(num);
      if (Math.random() < abilityChance) {
        const abIds = Object.keys(Abilities.DEFS);
        c.abilities = [abIds[Math.floor(Math.random() * abIds.length)]];
      }
      return c;
    }

    enemy.f1Cards = [makeCard(nums[2]), makeCard(nums[1])]; // 3rd + 2nd → ATK (addition)
    enemy.f2Cards = [makeCard(nums[3]), makeCard(nums[0])]; // max - min → DEF (subtraction)

    // Override rolls with card-computed values
    enemy.currentAtkRoll = nums[2] + nums[1];
    enemy.currentDefRoll = Math.max(0, nums[3] - nums[0]);
    enemy.displayAtkRoll = enemy.currentAtkRoll;
    enemy.displayDefRoll = enemy.currentDefRoll;
  }

  // ===== 戦闘開始 =====
  function startBattle(enemyKey) {
    const g = State.g;
    const enemy = enemyKey
      ? Enemy.createEnemy(enemyKey, g.turn)
      : Enemy.randomEnemy(g.currentRound, g.turn);

    g.enemy = enemy;
    g.inBattle = true;
    g.battleTurn = 0;
    g.poisonTurns = 0;
    g.healTicks = 0;
    g.battleSpiritGain = 0;
    g.battleArmorGain = 0;
    g.preBattleSpirit = g.spirit;
    g.preBattleArmor = g.armor;
    pendingVictory = false;

    // 敵にスキル割り当て（ラウンド依存）
    Enemy.assignEnemySkills(enemy, g.currentRound, Skills.DEFS);

    State.clearFormula();
    showScreen('battle');
    renderAll();
    renderDeckDiscard();
    renderEnemyStats();
    renderSkillPanel();
    renderEnemySkillPanel();

    Enemy.decideNextActions(enemy, g.currentRound);
    applyEnemyCards(enemy);
    renderEnemyFormula();
    renderEnemyActions();
    // プレイヤー値を '─' にリセットし、敵の総合値を中央に表示
    resetVsDisplay();
    log(`${enemy.name} があらわれた！`);
  }

  // ===== ターン処理（同時解決）=====
  function executeTurn() {
    const g = State.g;
    const enemy = g.enemy;
    g.battleTurn++;
    const logs = [];

    const playerName = (g.charType === 'default' || !g.charType) ? '名無し' : g.charType;

    // ── 毒ダメージ ──
    if (g.poisonTurns > 0) {
      State.changeHp(-2);
      g.poisonTurns--;
      logs.push('☠毒 HP-2');
      if (g.hp <= 0) { onGameOver(); return; }
    }

    // ── 式①カードの能力解決（攻撃）──
    const f1Cards = g.formula[0].cards.filter(c => c);
    const f1Base = Math.max(0, State.calcFormula(0) ?? 0);
    const atkAbResult = Abilities.applyCardAbilities(f1Cards, true, g);
    if (atkAbResult.logs.length) logs.push(atkAbResult.logs.join(' '));

    // ── 式②カードの能力解決（防御）──
    const f2Cards = g.formula[1].cards.filter(c => c);
    const f2Base = Math.max(0, State.calcFormula(1) ?? 0);
    const defAbResult = Abilities.applyCardAbilities(f2Cards, false, g);
    if (defAbResult.logs.length) logs.push(defAbResult.logs.join(' '));

    // ── バリア判定 ──
    const barrierActive = atkAbResult.barrier || defAbResult.barrier;

    // ── スキル発動コンテキスト ──
    const atkCtx = {
      atkBonus: atkAbResult.atkBonus,
      defBonus: 0,
      multAtk: atkAbResult.multAtk,
      multDef: 1,
      doubleStrike: false,
      regenOnHit: 0,
      g, enemy,
      logs,
    };
    const defCtx = {
      atkBonus: 0,
      defBonus: defAbResult.defBonus,
      multAtk: 1,
      multDef: defAbResult.multDef,
      doubleStrike: false,
      regenOnHit: 0,
      g, enemy,
      logs,
    };

    // 攻撃スキル
    Skills.applySkills(g.skills || [], f1Cards, f1Base, true, atkCtx);
    // 防御スキル
    Skills.applySkills(g.skills || [], f2Cards, f2Base, false, defCtx);

    // ── 最終値計算 ──
    const playerAtk = Math.round(Math.max(0, (f1Base + atkCtx.atkBonus + g.spirit) * atkCtx.multAtk));
    const playerDef = Math.round(Math.max(0, (f2Base + defCtx.defBonus + g.armor) * defCtx.multDef));

    // ── 敵の値 ──
    let enemyAtk = enemy.paralyzed ? 0 : (enemy.currentAtkRoll + enemy.spirit);
    const enemyDef = enemy.currentDefRoll + enemy.armor;
    if (enemy.paralyzed) {
      logs.push('⚡敵は麻痺中！（攻撃0）');
      enemy.paralyzed = false;
    }

    // ── クリティカル判定（ダメージ計算前）──
    let critGuard = false;
    let critAtk = false;
    if (!barrierActive && enemyAtk > 0 && playerDef === enemyAtk) {
      g.armor++;
      g.battleArmorGain = (g.battleArmorGain || 0) + 1;
      logs.push(`🛡<span class="log-def">クリティカルガード！護気+1（→${g.armor}）</span>`);
      critGuard = true;
    }
    if (enemyDef > 0 && playerAtk >= 2 * enemyDef) {
      g.spirit++;
      g.battleSpiritGain = (g.battleSpiritGain || 0) + 1;
      logs.push(`⚔<span class="log-spirit">クリティカルアタック！闘気+1（→${g.spirit}）</span>`);
      critAtk = true;
    }

    // ── VS表示 ──
    renderVsDisplay(playerAtk, playerDef, enemyAtk, enemyDef);

    // ── 同時解決 ──
    let dmgToEnemy = Math.max(0, playerAtk - enemyDef);
    // 双剣乱舞: 2回攻撃
    if (atkCtx.doubleStrike) {
      const strike2 = Math.max(0, Math.floor(playerAtk / 2) - enemyDef);
      dmgToEnemy += Math.max(0, strike2);
      logs.push(`⚔双剣乱舞 2撃目+${Math.max(0, strike2)}`);
    }
    const dmgToPlayer = barrierActive ? 0 : Math.max(0, enemyAtk - playerDef);

    // 敵へのダメージ
    if (dmgToEnemy >= 1) {
      enemy.hp = Math.max(0, enemy.hp - dmgToEnemy);
      flashDamage('enemy-sprite-wrap');
      logs.push(`${playerName}の攻撃！ ⚔${playerAtk}―🛡${enemyDef} → <span class="log-dmg">${enemy.name}に ${dmgToEnemy} ダメージ！！</span>`);
    } else {
      logs.push(`${playerName}の攻撃！ ⚔${playerAtk}―🛡${enemyDef} → <span class="log-def">ガード！</span>`);
    }

    // プレイヤーへのダメージ
    if (barrierActive) {
      logs.push(`${enemy.name}の攻撃！ ⚔${enemyAtk}―🛡${playerDef} → <span class="log-def">🔮バリア！（ダメージ無効）</span>`);
    } else if (dmgToPlayer >= 1) {
      State.changeHp(-dmgToPlayer);
      flashDamage('player-char-display');
      logs.push(`${enemy.name}の攻撃！ ⚔${enemyAtk}―🛡${playerDef} → <span class="log-dmg">${playerName}に ${dmgToPlayer} ダメージ！！</span>`);
      // 偶数の砦スキル: 被弾時HP回復
      if (defCtx.regenOnHit > 0) {
        State.changeHp(defCtx.regenOnHit);
        logs.push(`🏰被弾時回復 HP+${defCtx.regenOnHit}`);
      }
    } else {
      logs.push(`${enemy.name}の攻撃！ ⚔${enemyAtk}―🛡${playerDef} → <span class="log-def">ガード！</span>`);
    }

    // クリティカルエフェクト
    if (critAtk) flashCritical('atk');
    if (critGuard) flashCritical('def');

    renderEnemyHp();
    renderPlayerStatus();
    $('log-text').innerHTML = logs.join('<br>');

    // ── プレイヤー死亡チェック（先）──
    if (g.hp <= 0) { onGameOver(); return; }

    // ── 敵死亡チェック（後）──
    if (enemy.hp <= 0) {
      if (enemy.abilities.includes('revive') && !enemy.reviveUsed) {
        enemy.reviveUsed = true;
        enemy.hp = Math.ceil(enemy.maxHp / 2);
        renderEnemyHp();
        $('log-text').innerHTML += '<br><span class="log-heal">蘇生！HP復活</span>';
      } else {
        onVictory();
        return;
      }
    }

    // ── カード後処理 ──
    const usedCards = [];
    for (const f of g.formula) {
      for (const c of f.cards) { if (c) usedCards.push(c); }
    }
    State.discardCards(usedCards);
    State.drawToFull();
    State.clearFormula();
    g.sealedCardIndex = -1;

    Enemy.decideNextActions(enemy, g.currentRound);
    applyEnemyCards(enemy);
    renderAll();
    renderDeckDiscard();
    renderEnemyActions();
    renderEnemySkillPanel();
    renderEnemyFormula();
    resetVsDisplay();
  }

  // ===== VS表示リセット（プレイヤー側のみ。敵値は即再表示）=====
  function resetVsDisplay() {
    const paEl = $('player-final-atk');
    const pdEl = $('player-final-def');
    if (paEl) { paEl.textContent = '─'; paEl.classList.remove('active', 'preview'); }
    if (pdEl) { pdEl.textContent = '─'; pdEl.classList.remove('active', 'preview'); }
    // 敵の総合値は常時表示を維持
    renderEnemyVsValues();
  }

  // ===== 勝利 =====
  function onVictory() {
    if (vsResetTimer) { clearTimeout(vsResetTimer); vsResetTimer = null; }
    const g = State.g;
    pendingVictory = true;
    // Animate HP to 0
    g.enemy.hp = 0;
    renderEnemyHp();

    $('log-text').innerHTML = `<span class="log-win">🏆 ${g.enemy.name} を倒した！</span><span class="log-continue-hint">── タップして続ける ──</span>`;

    const proceed = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      if (!pendingVictory) return;
      pendingVictory = false;
      $('battle-log').removeEventListener('click', proceed);
      $('battle-log').removeEventListener('touchstart', proceed);
      document.removeEventListener('keydown', proceed);
      const money = Math.floor(10 + Math.random() * 11);
      g.money += money;
      g.justFinishedBattle = true;
      log('<span class="log-win">勝利！</span>');
      if (typeof showRewardScreen === 'function') {
        showRewardScreen(g.enemy, money);
      } else {
        $('result-title').textContent = '勝利！';
        $('result-body').innerHTML = `<p>${g.enemy.name} を倒した！</p><p>💰 +${money}</p>`;
        $('overlay-result').classList.remove('hidden');
      }
    };
    setTimeout(() => {
      if (!pendingVictory) return;
      $('battle-log').addEventListener('click', proceed);
      $('battle-log').addEventListener('touchstart', proceed, {passive: false});
      document.addEventListener('keydown', proceed);
    }, 500);
  }

  // ===== ゲームオーバー =====
  function onGameOver() {
    if (vsResetTimer) { clearTimeout(vsResetTimer); vsResetTimer = null; }
    const g = State.g;
    g.justFinishedBattle = false;
    $('player-hp-bar').style.width = '0%';
    $('player-hp-text').textContent = `0/${g.maxHp}`;
    $('overlay-gameover').classList.remove('hidden');
    log('<span class="log-bad">やられた…</span>');
  }

  // =====================================================
  //   UIレンダリング
  // =====================================================

  function renderAll() {
    renderPlayerStatus();
    renderEnemyHp();
    renderEnemyStats();
    renderHand();
    renderFormula();
    updateGoButton();
    renderDeckDiscard();
    renderSkillPanel();
    renderEnemySkillPanel();
    renderEnemyFormula();
  }

  // プレイヤーステータス
  function renderPlayerStatus() {
    const g = State.g;
    const pct = Math.max(0, g.hp / g.maxHp * 100);
    $('player-hp-bar').style.width = pct + '%';
    $('player-hp-text').textContent = `${g.hp}/${g.maxHp}`;

    const preSp = g.preBattleSpirit ?? g.spirit;
    const spGain = g.spirit - preSp;
    const preAr = g.preBattleArmor ?? g.armor;
    const arGain = g.armor - preAr;

    const spiritEl = $('stat-spirit');
    if (spiritEl) {
      if (spGain > 0) {
        spiritEl.innerHTML = `${preSp}<span class="stat-gain"> +${spGain}</span><span class="stat-result"> =${g.spirit}</span>`;
      } else {
        spiritEl.textContent = g.spirit;
      }
    }
    const armorEl = $('stat-armor');
    if (armorEl) {
      if (arGain > 0) {
        armorEl.innerHTML = `${preAr}<span class="stat-gain"> +${arGain}</span><span class="stat-result"> =${g.armor}</span>`;
      } else {
        armorEl.textContent = g.armor;
      }
    }
  }

  // 敵HPバー
  function renderEnemyHp() {
    const enemy = State.g.enemy;
    if (!enemy) return;
    const hp  = Math.max(0, enemy.hp);
    const pct = hp / enemy.maxHp * 100;
    $('enemy-hp-bar').style.width = pct + '%';
    $('enemy-hp-text').textContent = `${hp}/${enemy.maxHp}`;
    $('enemy-name').textContent = enemy.name;
    $('enemy-lv').textContent   = `Lv.${enemy.level}`;

    const img   = $('enemy-img');
    const emoji = $('enemy-emoji');
    img.src = enemy.imgSrc || '';
    img.style.display = '';
    emoji.style.display = 'none';
    emoji.textContent = enemy.sprite || '👾';
    img.onerror = () => {
      img.style.display = 'none';
      emoji.style.display = 'flex';
    };
  }

  // 敵ステータス（右パネル）
  function renderEnemyStats() {
    const enemy = State.g.enemy;
    if (!enemy) return;
    $('enemy-stat-spirit').textContent = enemy.spirit;
    $('enemy-stat-armor').textContent  = enemy.armor;
  }

  // 敵行動表示（formula内の合計値は applyEnemyCards 後に更新）
  function renderEnemyActions() {
    const enemy = State.g.enemy;
    if (!enemy) return;

    // 右サイドボックスは削除されたが旧コードとの互換のために残す（ない場合はスキップ）
    const elDef = $('enemy-action-def');
    if (elDef) {
      const total = typeof enemy.displayDefRoll === 'number'
        ? enemy.displayDefRoll + enemy.armor : '???';
      elDef.textContent = `🛡 ${total}`;
    }

    const elAtk = $('enemy-action-atk');
    if (elAtk) {
      const total = typeof enemy.displayAtkRoll === 'number'
        ? enemy.displayAtkRoll + enemy.spirit : '???';
      elAtk.textContent = `⚔ ${total}`;
    }
  }

  // 敵フォーミュラ表示
  function renderEnemyFormula() {
    const enemy = State.g.enemy;
    const clearSlots = () => {
      ['enemy-slot-def-0','enemy-slot-def-1','enemy-slot-atk-0','enemy-slot-atk-1'].forEach(id => {
        const el = $(id); if (el) { el.innerHTML = '?'; el.classList.remove('filled'); }
      });
      const rd = $('enemy-result-def'); if (rd) rd.textContent = '?';
      const ra = $('enemy-result-atk'); if (ra) ra.textContent = '?';
    };
    if (!enemy || !enemy.f1Cards || !enemy.f2Cards) { clearSlots(); return; }

    function fillEnemySlot(id, card) {
      const el = $(id); if (!el) return;
      el.classList.add('filled');
      let abHtml = '';
      if (card.abilities && card.abilities.length > 0) {
        abHtml = card.abilities.map(abId => {
          const d = Abilities.DEFS[abId];
          return d ? `<span class="card-ability-text" style="font-size:10px">${d.name}</span>` : '';
        }).join('');
      }
      el.innerHTML = `<span style="font-size:34px;font-weight:bold;line-height:1">${card.num}</span>${abHtml}`;
    }

    fillEnemySlot('enemy-slot-def-0', enemy.f2Cards[0]);
    fillEnemySlot('enemy-slot-def-1', enemy.f2Cards[1]);
    const defRes = $('enemy-result-def');
    if (defRes) defRes.textContent = Math.max(0, enemy.f2Cards[0].num - enemy.f2Cards[1].num);

    fillEnemySlot('enemy-slot-atk-0', enemy.f1Cards[0]);
    fillEnemySlot('enemy-slot-atk-1', enemy.f1Cards[1]);
    const atkRes = $('enemy-result-atk');
    if (atkRes) atkRes.textContent = enemy.f1Cards[0].num + enemy.f1Cards[1].num;
  }

  // 敵の総合ATK/DEF を VS中央エリアに表示（ターン開始時から常時）
  function renderEnemyVsValues() {
    const enemy = State.g.enemy;
    if (!enemy) return;

    const edEl = $('enemy-final-def');   // atk-pair の右側（敵🛡）
    const eaEl = $('enemy-final-atk');   // def-pair の右側（敵⚔）

    if (edEl) {
      const val = typeof enemy.displayDefRoll === 'number'
        ? enemy.displayDefRoll + enemy.armor : '?';
      edEl.textContent = val;
      edEl.classList.remove('preview');
      edEl.classList.add('active');
    }
    if (eaEl) {
      const val = typeof enemy.displayAtkRoll === 'number'
        ? enemy.displayAtkRoll + enemy.spirit : '?';
      eaEl.textContent = val;
      eaEl.classList.remove('preview');
      eaEl.classList.add('active');
    }
  }

  // VS表示（ターン解決後：全4値を確定値で更新）
  function renderVsDisplay(playerAtk, playerDef, enemyAtk, enemyDef) {
    const pa = $('player-final-atk');
    const ed = $('enemy-final-def');
    const ea = $('enemy-final-atk');
    const pd = $('player-final-def');

    pa.textContent = playerAtk; pa.classList.remove('preview'); pa.classList.add('active');
    ed.textContent = enemyDef;  ed.classList.remove('preview'); ed.classList.add('active');
    ea.textContent = enemyAtk;  ea.classList.remove('preview'); ea.classList.add('active');
    pd.textContent = playerDef; pd.classList.remove('preview'); pd.classList.add('active');
  }

  // 山札・捨て札テキスト表示
  function renderDeckDiscard() {
    const g = State.g;
    const deckCount = $('deck-count');
    if (deckCount) deckCount.textContent = g.deck.length;
    const discardCount = $('discard-count');
    if (discardCount) discardCount.textContent = g.discard.length;
  }

  // 敵スキルパネル表示
  function renderEnemySkillPanel() {
    const enemy = State.g.enemy;
    const container = $('enemy-skills-list');
    if (!container) return;
    container.innerHTML = '';
    if (!enemy || !enemy.skills || enemy.skills.length === 0) {
      container.innerHTML = '<div class="skill-slot empty">─</div>';
      return;
    }
    enemy.skills.forEach(skillId => {
      const def = Skills.DEFS[skillId];
      if (!def) return;
      const triggerBadge = def.trigger === 'atk'
        ? '<span class="ab-badge atk-badge">攻</span>'
        : def.trigger === 'def'
        ? '<span class="ab-badge def-badge">防</span>'
        : '<span class="ab-badge any-badge">全</span>';
      const el = document.createElement('div');
      el.className = 'skill-slot active';
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px">${triggerBadge} ${def.icon} ${def.name}</div>
        <div class="skill-slot-trigger">${def.condDesc}</div>
      `;
      container.appendChild(el);
    });
  }

  // プレイヤースキルパネル表示
  function renderSkillPanel() {
    const g = State.g;
    const container = $('player-skills-list');
    if (!container) return;
    container.innerHTML = '';
    const skills = g.skills || [];
    if (skills.length === 0) {
      container.innerHTML = '<div class="skill-slot empty">─</div>';
      return;
    }
    skills.forEach(skillId => {
      const def = Skills.DEFS[skillId];
      if (!def) return;
      const triggerBadge = def.trigger === 'atk' ? '<span class="ab-badge atk-badge">攻</span>'
        : def.trigger === 'def' ? '<span class="ab-badge def-badge">防</span>'
        : '<span class="ab-badge any-badge">全</span>';
      const el = document.createElement('div');
      el.className = 'skill-slot active';
      el.dataset.skillId = skillId;
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px">${triggerBadge} ${def.icon} ${def.name}</div>
        <div class="skill-slot-trigger">${def.condDesc}</div>
      `;
      // スキルクリックでツールチップ表示
      el.addEventListener('click', () => {
        const existing = container.querySelector('.skill-tooltip');
        if (existing && existing.dataset.for === skillId) { existing.remove(); return; }
        container.querySelectorAll('.skill-tooltip').forEach(t => t.remove());
        const tip = document.createElement('div');
        tip.className = 'skill-tooltip';
        tip.dataset.for = skillId;
        tip.innerHTML = `<b>${def.icon} ${def.name}</b> ${def.stars}<br><span style="font-size:12px;color:var(--text-dim)">${def.condDesc}</span><br><span style="font-size:13px">${def.effectDesc}</span>`;
        container.insertBefore(tip, el.nextSibling);
      });
      container.appendChild(el);
    });
  }

  // =====================================================
  //   スキルハイライト
  // =====================================================
  function updateSkillHighlights(g) {
    const container = $('player-skills-list');
    if (!container) return;
    const slots = container.querySelectorAll('.skill-slot[data-skill-id]');
    const f1Done = g.formula[0].cards[0] && g.formula[0].cards[1];
    const f2Done = g.formula[1].cards[0] && g.formula[1].cards[1];

    slots.forEach(slot => {
      const skillId = slot.dataset.skillId;
      const def = Skills.DEFS[skillId];
      if (!def) return;
      let fires = false;
      if ((def.trigger === 'atk' || def.trigger === 'both') && f1Done) {
        const result = State.calcFormula(0) ?? 0;
        const cards = g.formula[0].cards.filter(c=>c);
        if (def.cond(result, cards)) fires = true;
      }
      if ((def.trigger === 'def' || def.trigger === 'both') && f2Done) {
        const result = State.calcFormula(1) ?? 0;
        const cards = g.formula[1].cards.filter(c=>c);
        if (def.cond(result, cards)) fires = true;
      }
      if (fires) slot.classList.add('will-fire');
      else slot.classList.remove('will-fire');
    });
  }

  // =====================================================
  //   式レンダリング
  // =====================================================
  function renderFormula() {
    const g = State.g;
    for (let fi = 0; fi < 2; fi++) {
      const f = g.formula[fi];
      for (let pos = 0; pos < 2; pos++) {
        const slot = $(`slot-${fi + 1}-${pos}`);
        if (!slot) continue;
        if (f.cards[pos]) {
          const card = f.cards[pos];
          let abHtml = '';
          if (card.abilities && card.abilities.length > 0) {
            abHtml = card.abilities.map(id => {
              const d = Abilities.DEFS[id];
              return d ? `<span class="card-ability-text">${d.name}</span>` : '';
            }).join('');
          }
          slot.innerHTML = `<span class="card-num" style="font-size:34px;line-height:1">${card.num}</span>${abHtml}`;
          slot.classList.add('filled');
        } else {
          slot.textContent = '?';
          slot.classList.remove('filled');
        }
        // ロック状態
        if (f.locked && f.locked[pos]) {
          slot.classList.add('locked');
        } else {
          slot.classList.remove('locked');
        }
      }
      const result = State.calcFormula(fi);
      const resEl  = $(`result-${fi + 1}`);
      if (resEl) resEl.textContent = result !== null ? result : '?';
    }

    // GO前プレビュー：式①完成→自⚔、式②完成→自🛡 を個別に表示
    const paEl = $('player-final-atk');
    const pdEl = $('player-final-def');
    const f1Done = g.formula[0].cards[0] && g.formula[0].cards[1];
    const f2Done = g.formula[1].cards[0] && g.formula[1].cards[1];

    if (f1Done && paEl && !paEl.classList.contains('active')) {
      const atk = Math.max(0, (State.calcFormula(0) ?? 0) + g.spirit);
      paEl.textContent = atk; paEl.classList.add('preview');
    } else if (!f1Done && paEl && paEl.classList.contains('preview')) {
      paEl.textContent = '─'; paEl.classList.remove('preview');
    }

    if (f2Done && pdEl && !pdEl.classList.contains('active')) {
      const def = Math.max(0, (State.calcFormula(1) ?? 0) + g.armor);
      pdEl.textContent = def; pdEl.classList.add('preview');
    } else if (!f2Done && pdEl && pdEl.classList.contains('preview')) {
      pdEl.textContent = '─'; pdEl.classList.remove('preview');
    }

    // スキルハイライト
    updateSkillHighlights(g);
  }

  function updateGoButton() {
    $('btn-go').disabled = !State.isFormulaComplete();
  }

  // =====================================================
  //   手札レンダリング + ドラッグ&ドロップ
  // =====================================================
  let touchDragging = null;

  function renderHand() {
    const g         = State.g;
    const container = $('hand-cards');
    container.innerHTML = '';

    g.hand.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.idx = idx;
      el.dataset.num = card.num;
      if (card.sealed) el.classList.add('sealed');
      // Only new card gets slide-in animation
      if (card.id === lastDrawnCardId) { el.classList.add('slide-in'); }

      // Ability badge and text
      let badgeHtml = '';
      let abilityHtml = '';
      if (card.abilities && card.abilities.length > 0) {
        const ab = Abilities.DEFS[card.abilities[0]];
        if (ab) {
          badgeHtml = Abilities.scopeBadge(ab.scope);
          abilityHtml = card.abilities.map(id => {
            const d = Abilities.DEFS[id];
            return d ? d.name : id;
          }).join('<br>');
        }
      }

      el.innerHTML = `
        ${badgeHtml}
        <span class="card-num">${card.num}</span>
        ${abilityHtml ? `<span class="card-ability-text">${abilityHtml}</span>` : ''}
      `;

      if (!card.sealed) {
        el.draggable = true;
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('cardIdx', idx);
          el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('touchstart', e => {
          e.preventDefault();
          const t = e.touches[0];
          const ghost = el.cloneNode(true);
          ghost.style.cssText =
            `position:fixed;opacity:0.85;pointer-events:none;z-index:9999;` +
            `width:${el.offsetWidth}px;height:${el.offsetHeight}px;` +
            `top:${t.clientY - el.offsetHeight / 2}px;` +
            `left:${t.clientX - el.offsetWidth / 2}px;`;
          document.body.appendChild(ghost);
          touchDragging = { cardIdx: idx, ghost };
        }, { passive: false });
      }
      container.appendChild(el);
    });

    lastDrawnCardId = null; // reset after render
  }

  // タッチ移動・終了グローバル監視
  document.addEventListener('touchmove', e => {
    if (!touchDragging) return;
    e.preventDefault();
    const t = e.touches[0];
    const g = touchDragging.ghost;
    g.style.top  = `${t.clientY - g.offsetHeight / 2}px`;
    g.style.left = `${t.clientX - g.offsetWidth  / 2}px`;
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (!touchDragging) return;
    const t = e.changedTouches[0];
    touchDragging.ghost.style.display = 'none';
    const target = document.elementFromPoint(t.clientX, t.clientY);
    touchDragging.ghost.remove();
    const slot = target?.closest?.('.formula-slot');
    if (slot) {
      const fi  = parseInt(slot.dataset.formula) - 1;
      const pos = parseInt(slot.dataset.pos);
      placeCardToSlot(touchDragging.cardIdx, fi, pos);
    }
    touchDragging = null;
  });

  // スロットのドロップイベント初期化
  function initSlotDrop() {
    document.querySelectorAll('.formula-slot').forEach(slot => {
      // enemy-slot は無視
      if (slot.classList.contains('enemy-slot')) return;
      slot.addEventListener('dragover', e => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const idx = parseInt(e.dataTransfer.getData('cardIdx'));
        const fi  = parseInt(slot.dataset.formula) - 1;
        const pos = parseInt(slot.dataset.pos);
        placeCardToSlot(idx, fi, pos);
      });
    });
  }

  // カードをスロットに配置する
  function placeCardToSlot(handIdx, formulaIdx, pos) {
    const g    = State.g;
    const card = g.hand[handIdx];
    if (!card || card.sealed) return;
    // 既にロックされているスロットには配置不可
    if (g.formula[formulaIdx].locked && g.formula[formulaIdx].locked[pos]) return;

    // 既に別のスロットに配置されているか確認
    let alreadyInFormula = false;
    for (let fi = 0; fi < 2; fi++) {
      for (let p = 0; p < 2; p++) {
        if (g.formula[fi].cards[p] === card) {
          alreadyInFormula = true;
          g.formula[fi].cards[p] = null;
          // ロックも解除（移動元）
          if (g.formula[fi].locked) g.formula[fi].locked[p] = false;
        }
      }
    }

    if (!alreadyInFormula) {
      const hIdx = g.hand.indexOf(card);
      if (hIdx !== -1) g.hand.splice(hIdx, 1);
      const newCard = State.drawOne();
      lastDrawnCardId = newCard ? newCard.id : null;
    }

    // 移動先スロットに既に別のカードがある場合は手札に戻す
    const displaced = g.formula[formulaIdx].cards[pos];
    if (displaced && displaced !== card) {
      g.hand.push(displaced);
    }

    g.formula[formulaIdx].cards[pos] = card;
    // スロットをロック
    if (!g.formula[formulaIdx].locked) g.formula[formulaIdx].locked = [false, false];
    g.formula[formulaIdx].locked[pos] = true;

    // 式②（引き算）で答えがマイナスになる場合は即座に左右を入れ替え
    if (formulaIdx === 1) {
      const f = g.formula[1];
      if (f.cards[0] !== null && f.cards[1] !== null && f.cards[0].num < f.cards[1].num) {
        [f.cards[0], f.cards[1]] = [f.cards[1], f.cards[0]];
        [f.locked[0], f.locked[1]] = [f.locked[1], f.locked[0]];
      }
    }

    renderHand();
    renderFormula();
    updateGoButton();
    renderDeckDiscard();
  }

  // =====================================================
  //   スロットクリック（配置済みカードを手札に戻す）
  // =====================================================
  function onSlotClick(formulaIdx, pos) {
    const g = State.g;
    // ロックされているスロットはクリック不可
    if (g.formula[formulaIdx].locked && g.formula[formulaIdx].locked[pos]) return;
    const card = g.formula[formulaIdx].cards[pos];
    if (card !== null) {
      g.formula[formulaIdx].cards[pos] = null;
      g.hand.push(card);
      renderHand();
      renderFormula();
      updateGoButton();
    }
  }

  // クリアボタン（State.cancelFormula でカードを手札に戻す）
  function clearFormula() {
    State.cancelFormula();
    renderHand();
    renderFormula();
    updateGoButton();
    renderDeckDiscard();
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
  }

  // 初期化
  initSlotDrop();

  return {
    startBattle,
    executeTurn,
    onSlotClick,
    clearFormula,
    renderAll,
    renderEnemyActions,
    renderVsDisplay,
    renderDeckDiscard,
    renderSkillPanel,
    renderEnemySkillPanel,
    log,
    showScreen,
    placeCardToSlot,
  };
})();
