// ===== 戦闘システム・UI制御（2回じゃんけん仕様）=====

const Battle = (() => {

  const $ = id => document.getElementById(id);

  // ===== 色付きログ =====
  function colorLog(msg) {
    return msg
      .replace(/攻撃(\d+)/g,    '<span class="log-atk">攻撃$1</span>')
      .replace(/防御(\d+)/g,    '<span class="log-def">防御$1</span>')
      .replace(/HP-(\d+)/g,    '<span class="log-dmg">HP-$1</span>')
      .replace(/(\d+)ダメ/g,   '<span class="log-dmg">$1ダメ</span>')
      .replace(/ガード/g,       '<span class="log-def">ガード</span>')
      .replace(/完全防御/g,     '<span class="log-block">完全防御🛡</span>')
      .replace(/闘志\+1/g,     '<span class="log-spirit">闘志+1</span>')
      .replace(/回復\+(\d+)/g, '<span class="log-heal">回復+$1</span>')
      .replace(/毒/g,           '<span class="log-poison">毒</span>')
      .replace(/勝利！/g,       '<span class="log-win">勝利！</span>');
  }

  function log(msg) {
    $('log-text').innerHTML = colorLog(msg);
  }

  // ===== 戦闘開始 =====
  function startBattle(enemyKey, prebuiltEnemy) {
    const g = State.g;
    const enemy = prebuiltEnemy
      ? prebuiltEnemy
      : enemyKey
        ? Enemy.createEnemy(enemyKey, g.turn)
        : Enemy.randomEnemy(g.currentRound, g.turn);
    g.enemy = enemy;
    g.inBattle = true;
    g.battleTurn = 0;
    g.poisonTurns = 0;
    g.spiritDownTemp = 0;
    g.paralyzedNextTurn = false;
    g.battleSpiritBonus = 0; // 戦闘中の一時的な闘志ボーナス

    State.clearFormula();
    showScreen('battle');
    renderAll();

    Enemy.decideNextActions(enemy, g.currentRound);
    renderEnemyActions();
    log(`${enemy.name} があらわれた！`);
  }

  // ===== ターン処理 =====
  function executeTurn() {
    const g = State.g;
    const enemy = g.enemy;
    g.battleTurn++;

    const tickMsgs = Abilities.processTicks(g);
    if (tickMsgs.length > 0) log(tickMsgs.join(' '));

    if (g.poisonTurns > 0) {
      const poisonDmg = 2;
      State.changeHp(-poisonDmg);
      g.poisonTurns--;
      log(`毒！ HP -${poisonDmg}`);
    }

    const logs = [];

    const r0 = resolveRound(0, enemy, g, logs);
    if (!r0) return;

    if (g.paralyzedNextTurn) {
      logs.push('麻痺！ 式②は使えなかった');
      g.paralyzedNextTurn = false;
    } else {
      const r1 = resolveRound(1, enemy, g, logs);
      if (!r1) return;
    }

    enemy.atkBonus = 0;
    enemy.defBonus = 0;
    if (g.spiritDownTemp > 0) {
      g.spirit = Math.max(0, g.spirit - g.spiritDownTemp);
      g.spiritDownTemp = 0;
    }

    const usedCards = [];
    for (const f of g.formula) {
      for (const c of f.cards) { if (c) usedCards.push(c); }
    }
    for (const c of usedCards) {
      const idx = g.hand.indexOf(c);
      if (idx !== -1) g.hand.splice(idx, 1);
    }
    State.discardCards(usedCards);
    State.drawToFull();
    State.clearFormula();
    g.sealedCardIndex = -1;

    Enemy.decideNextActions(enemy, g.currentRound);

    log(logs.join(' ／ '));
    renderAll();
    renderEnemyActions();
  }

  // ===== 1ラウンド解決 =====
  function resolveRound(idx, enemy, g, logs) {
    const formula = g.formula[idx];
    const action  = enemy.currentActions[idx];
    const isAttack = formula.op === '+';
    const result   = State.calcFormula(idx);
    const roundLabel = idx === 0 ? '式①' : '式②';

    const formulaCards = formula.cards.filter(c => c !== null);
    const baseResult   = Math.max(0, result);
    const { finalValue, logs: abilityLogs } = Abilities.applyToFormula(
      formulaCards, baseResult, isAttack, g.spirit, g
    );
    if (abilityLogs.length > 0) logs.push(abilityLogs.join(' '));

    if (isAttack) {
      const playerAtk = finalValue;
      const isEnemyDefending = action === 'defense';
      const { enemyDef, dmgDealt } = Enemy.enemyTakeDamage(enemy, playerAtk, isEnemyDefending);

      let msg = `${roundLabel}攻撃${playerAtk}`;
      if (isEnemyDefending) msg += `(敵防御~${enemy.defBase})`;
      msg += `→敵防御${enemyDef}`;
      msg += dmgDealt >= 1 ? `→${dmgDealt}ダメ` : `→ガード`;
      logs.push(msg);

      renderEnemyHp();

      if (enemy.hp <= 0) {
        if (enemy.abilities.includes('revive') && !enemy.reviveUsed) {
          enemy.reviveUsed = true;
          enemy.hp = Math.ceil(enemy.maxHp / 2);
          logs.push(`蘇生！HP${enemy.hp}で復活`);
          renderEnemyHp();
        } else {
          onVictory();
          return false;
        }
      }

      if (action === 'attack') {
        const { dmg } = applyEnemyAttack(enemy, 0, g, logs);
        if (g.hp <= 0) { onGameOver(); return false; }
      } else if (action === 'special') {
        applyEnemySpecial(enemy, 0, g, logs);
        if (g.hp <= 0) { onGameOver(); return false; }
      }

    } else {
      const playerDef = finalValue;

      if (action === 'attack') {
        const { dmg } = applyEnemyAttack(enemy, playerDef, g, logs, roundLabel);
        // 完全防御（HPダメージ0）→ 戦闘中闘志+1
        if (dmg === 0) {
          g.spirit += 1;
          logs.push(`完全防御 闘志+1`);
        }
        if (g.hp <= 0) { onGameOver(); return false; }
      } else if (action === 'special') {
        logs.push(`${roundLabel}防御中`);
        applyEnemySpecial(enemy, playerDef, g, logs);
        if (g.hp <= 0) { onGameOver(); return false; }
      } else if (action === 'defense') {
        logs.push(`${roundLabel}：お互い防御`);
      }
    }

    renderPlayerStatus();
    return true;
  }

  // ===== 敵攻撃処理 =====
  function applyEnemyAttack(enemy, playerDef, g, logs, label) {
    const rawAtk = Enemy.rollEnemyAtk(enemy);
    const result = State.playerTakeDamage(rawAtk, playerDef);
    let msg = label ? `${label}防御${playerDef}` : '';
    msg += `敵攻撃${rawAtk}(基礎~${enemy.atkBase})`;
    if (result.defAbs > 0)   msg += `→防御${result.defAbs}`;
    if (result.armorAbs > 0) msg += `→鎧${result.armorAbs}`;
    msg += result.hpDmg > 0 ? `→HP-${result.hpDmg}` : `→完全防御`;
    logs.push(msg);
    renderPlayerStatus(); // HP即反映
    return { rawAtk, dmg: result.hpDmg };
  }

  // ===== 敵特殊処理 =====
  function applyEnemySpecial(enemy, playerDef, g, logs) {
    const specials = enemy.abilities.filter(a =>
      ['seal','poison','spiritDown','armorBreak','rage',
       'curse','paralyze','counter','buffSelf','ironWall','selfHeal'].includes(a)
    );
    if (specials.length === 0) {
      applyEnemyAttack(enemy, playerDef, g, logs, '特殊→');
      return;
    }
    const sp = specials[Math.floor(Math.random() * specials.length)];
    switch (sp) {
      case 'poison':
        g.poisonTurns = (g.poisonTurns || 0) + 3;
        logs.push('毒！(3ターンHP-2)');
        break;
      case 'seal':
        if (g.sealedCardIndex === -1 && g.hand.length > 0) {
          const idx = Math.floor(Math.random() * g.hand.length);
          g.sealedCardIndex = idx;
          g.hand[idx].sealed = true;
          logs.push(`封印(${g.hand[idx].num})`);
        }
        break;
      case 'spiritDown':
        g.spiritDownTemp = (g.spiritDownTemp || 0) + 1;
        logs.push('闘志ダウン');
        break;
      case 'armorBreak': {
        const d = Math.max(1, Math.ceil(enemy.defBase * 0.4));
        State.changeArmor(-d);
        logs.push(`鎧破壊-${d}`);
        break;
      }
      case 'rage':
        enemy.atkBonus = Math.round(enemy.atkBase * 0.5);
        logs.push('怒り(攻撃強化)');
        break;
      case 'selfHeal': {
        const h = Math.round(enemy.maxHp * 0.15);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + h);
        logs.push(`回復+${h}`);
        renderEnemyHp();
        break;
      }
      case 'ironWall':
        enemy.defBonus = Math.round(enemy.defBase * 0.8);
        logs.push(`鉄壁(防御基礎~${enemy.defBase + enemy.defBonus})`);
        break;
      case 'curse':
        logs.push('呪い');
        break;
      case 'paralyze':
        g.paralyzedNextTurn = true;
        logs.push('麻痺(次ターン式②不可)');
        break;
      case 'buffSelf':
        enemy.atkBonus = (enemy.atkBonus || 0) + 2;
        logs.push('自己強化');
        break;
      case 'counter':
        logs.push('反撃構え');
        break;
    }
  }

  // ===== 勝利 =====
  function onVictory() {
    const g = State.g;
    const money = Math.floor(10 + Math.random() * 11);
    g.money += money;
    g.turn++;
    g.battleSpiritBonus = 0; // 戦闘中の一時闘志リセット
    log('勝利！');
    if (typeof showRewardScreen === 'function') {
      showRewardScreen(g.enemy, money);
    } else {
      $('result-title').textContent = '勝利！';
      $('result-body').innerHTML = `<p>${g.enemy.name} を倒した！</p><p>💰 お金 +${money}</p>`;
      $('overlay-result').classList.remove('hidden');
    }
  }

  // ===== ゲームオーバー =====
  function onGameOver() {
    // HPバーを即座に0に更新
    $('player-hp-bar').style.width = '0%';
    $('player-hp-text').textContent = `0/${State.g.maxHp}`;
    $('overlay-gameover').classList.remove('hidden');
    log('<span class="log-bad">やられた…</span>');
  }

  // ===== UIレンダリング =====

  function renderAll() {
    renderPlayerStatus();
    renderEnemyHp();
    renderHand();
    renderFormula();
    updateGoButton();
  }

  function renderPlayerStatus() {
    const g = State.g;
    const pct = Math.max(0, g.hp / g.maxHp * 100);
    $('player-hp-bar').style.width = pct + '%';
    $('player-hp-text').textContent = `${g.hp}/${g.maxHp}`;
    $('stat-armor').textContent  = g.armor;
    $('stat-spirit').textContent = g.spirit + (g.spiritDownTemp ? `(-${g.spiritDownTemp})` : '');
    $('stat-money').textContent  = g.money;
  }

  function renderEnemyHp() {
    const enemy = State.g.enemy;
    if (!enemy) return;
    const hp  = Math.max(0, enemy.hp);
    const pct = hp / enemy.maxHp * 100;
    $('enemy-hp-bar').style.width = pct + '%';
    $('enemy-hp-text').textContent = `${hp} / ${enemy.maxHp}`;
    $('enemy-name').textContent = enemy.name;
    $('enemy-lv').textContent   = `Lv.${enemy.level}`;

    // 画像読み込み
    const img   = $('enemy-img');
    const emoji = $('enemy-emoji');
    img.src = enemy.imgSrc || '';
    img.style.display = '';
    emoji.style.display = 'none';
    emoji.textContent = enemy.sprite || '👾';
    img.onerror = () => {
      img.style.display = 'none';
      emoji.style.display = 'block';
    };
  }

  function renderEnemyActions() {
    const enemy = State.g.enemy;
    if (!enemy || !enemy.displayActions) return;

    for (let i = 0; i < 2; i++) {
      const display = enemy.displayActions[i];
      const actual  = enemy.currentActions[i];
      const el = $(`enemy-action-${i + 1}`);

      // クラスリセット
      el.className = 'enemy-action-badge';

      let label = Enemy.actionLabel(display);

      // 行動の実際の強さを表示
      if (display === 'attack') {
        label += ` <small style="font-size:0.75em;opacity:0.8">~${enemy.atkBase + (enemy.atkBonus||0)}</small>`;
        el.classList.add('is-attack');
      } else if (display === 'defense') {
        label += ` <small style="font-size:0.75em;opacity:0.8">~${enemy.defBase + (enemy.defBonus||0)}</small>`;
        el.classList.add('is-defense');
      } else if (display === 'special') {
        el.classList.add('is-special');
      } else {
        el.classList.add('is-unknown');
      }

      el.innerHTML = label;
    }
  }

  // ===== 手札レンダリング + ドラッグ&ドロップ =====
  let touchDragging = null;

  function renderHand() {
    const g = State.g;
    const container = $('hand-cards');
    container.innerHTML = '';
    const placed = State.getPlacedHandIndices();

    g.hand.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card pop-in';
      el.dataset.idx  = idx;
      el.dataset.num  = card.num;
      if (card.sealed)  el.classList.add('sealed');
      if (placed.has(idx)) el.classList.add('placed');

      el.innerHTML = `<span class="card-num">${card.num}</span>`;

      if (!card.sealed && !placed.has(idx)) {
        // マウスドラッグ
        el.draggable = true;
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('cardIdx', idx);
          el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));

        // タッチドラッグ
        el.addEventListener('touchstart', e => {
          e.preventDefault();
          const t = e.touches[0];
          const ghost = el.cloneNode(true);
          ghost.style.cssText = `position:fixed;opacity:0.8;pointer-events:none;z-index:9999;` +
            `width:${el.offsetWidth}px;height:${el.offsetHeight}px;` +
            `top:${t.clientY - el.offsetHeight/2}px;left:${t.clientX - el.offsetWidth/2}px;`;
          document.body.appendChild(ghost);
          touchDragging = { cardIdx: idx, ghost };
        }, { passive: false });

        // クリックでも配置（フォールバック）
        el.addEventListener('click', () => onCardClick(idx));
      }
      container.appendChild(el);
    });
  }

  // タッチ移動・終了はグローバルで監視
  document.addEventListener('touchmove', e => {
    if (!touchDragging) return;
    e.preventDefault();
    const t = e.touches[0];
    const g = touchDragging.ghost;
    g.style.top  = `${t.clientY - g.offsetHeight/2}px`;
    g.style.left = `${t.clientX - g.offsetWidth/2}px`;
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

  // スロット ドロップイベント設定（初期化後に1度だけ）
  function initSlotDrop() {
    document.querySelectorAll('.formula-slot').forEach(slot => {
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

  function placeCardToSlot(handIdx, formulaIdx, pos) {
    const g = State.g;
    const card = g.hand[handIdx];
    if (!card || card.sealed) return;
    // 既存配置を除去
    for (let fi = 0; fi < 2; fi++) {
      for (let p = 0; p < 2; p++) {
        if (g.formula[fi].cards[p] === card) g.formula[fi].cards[p] = null;
      }
    }
    g.formula[formulaIdx].cards[pos] = card;
    renderHand();
    renderFormula();
    updateGoButton();
  }

  // ===== 式レンダリング =====
  function renderFormula() {
    const g = State.g;
    for (let fi = 0; fi < 2; fi++) {
      const f = g.formula[fi];
      for (let pos = 0; pos < 2; pos++) {
        const slot = $(`slot-${fi+1}-${pos}`);
        if (f.cards[pos]) {
          slot.textContent = f.cards[pos].num;
          slot.classList.add('filled');
        } else {
          slot.textContent = '?';
          slot.classList.remove('filled');
        }
      }
      const result = State.calcFormula(fi);
      $(`result-${fi+1}`).textContent = result !== null ? result : '?';

      const opBtn  = $(`op-toggle-${fi+1}`);
      const typeEl = $(`type-${fi+1}`);
      if (f.op === '+') {
        opBtn.textContent = '＋';
        typeEl.textContent = '⚔️攻撃';
        typeEl.className = 'formula-type attack';
      } else {
        opBtn.textContent = '－';
        typeEl.textContent = '🛡防御';
        typeEl.className = 'formula-type defense';
      }
    }
  }

  function updateGoButton() {
    $('btn-go').disabled = !State.isFormulaComplete();
  }

  // ===== カード操作 =====
  function onCardClick(handIdx) {
    const g = State.g;
    const card = g.hand[handIdx];
    if (!card || card.sealed) return;
    const slot = findNextEmptySlot();
    if (slot) {
      placeCardToSlot(handIdx, slot.formulaIdx, slot.pos);
    }
  }

  function findNextEmptySlot() {
    const g = State.g;
    for (let fi = 0; fi < 2; fi++) {
      for (let pos = 0; pos < 2; pos++) {
        if (g.formula[fi].cards[pos] === null) return { formulaIdx: fi, pos };
      }
    }
    return null;
  }

  function onSlotClick(formulaIdx, pos) {
    const g = State.g;
    if (g.formula[formulaIdx].cards[pos] !== null) {
      g.formula[formulaIdx].cards[pos] = null;
      renderHand();
      renderFormula();
      updateGoButton();
    }
  }

  function setOperator(formulaIdx, op) {
    State.g.formula[formulaIdx].op = op;
    renderFormula();
  }

  function toggleOperator(formulaIdx) {
    const g = State.g;
    g.formula[formulaIdx].op = g.formula[formulaIdx].op === '+' ? '-' : '+';
    renderFormula();
  }

  function clearFormula() {
    State.clearFormula();
    renderHand();
    renderFormula();
    updateGoButton();
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
  }

  // 初期化時にスロットのドロップイベントを設定
  initSlotDrop();

  return {
    startBattle, executeTurn,
    onCardClick, onSlotClick, setOperator, toggleOperator, clearFormula,
    renderAll, renderEnemyActions, log, showScreen,
    placeCardToSlot,
  };
})();
