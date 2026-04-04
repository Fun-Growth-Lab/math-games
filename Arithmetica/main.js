// ===== エントリーポイント・フロー制御 =====

(function () {
  const $ = id => document.getElementById(id);

  // ===== 16:9 スケーリング =====
  function resizeGame() {
    const container = $('game-container');
    const scaleX = window.innerWidth  / 1280;
    const scaleY = window.innerHeight / 720;
    const scale  = Math.min(scaleX, scaleY);
    const offsetX = (window.innerWidth  - 1280 * scale) / 2;
    const offsetY = (window.innerHeight - 720  * scale) / 2;
    container.style.transform       = `scale(${scale})`;
    container.style.transformOrigin = 'top left';
    container.style.left            = offsetX + 'px';
    container.style.top             = offsetY + 'px';
  }
  window.addEventListener('resize', resizeGame);
  resizeGame();

  // ===== タイトル画面 =====
  $('btn-start').addEventListener('click', () => {
    $('title-menu').classList.add('hidden');
    $('difficulty-select').classList.remove('hidden');
  });
  $('btn-diff-back').addEventListener('click', () => {
    $('difficulty-select').classList.add('hidden');
    $('title-menu').classList.remove('hidden');
  });
  $('btn-player').addEventListener('click', () => {
    alert('プレーヤー変更は準備中です');
  });
  $('btn-google').addEventListener('click', () => {
    alert('Googleログインは準備中です');
  });
  $('btn-ranking').addEventListener('click', () => {
    alert('ランキングは準備中です');
  });
  $('btn-cindex').addEventListener('click', () => {
    window.location.href = 'https://cindex.jp';
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startGame(btn.dataset.diff);
    });
  });

  // ===== ゲーム開始 =====
  function startGame(difficulty) {
    State.init('default', difficulty);
    MapSystem.generateMap();
    showMapScreen();
  }

  // ===== マップ画面 =====
  function showMapScreen() {
    Battle.showScreen('map');
    updateMapStatus();
    renderMap();
  }

  function renderMap() {
    MapSystem.renderMap($('map-svg'), onMapNodeClick);
  }

  function updateMapStatus() {
    const g = State.g;
    const pct = Math.max(0, g.hp / g.maxHp * 100);
    $('map-hp-bar').style.width = pct + '%';
    $('map-hp-text').textContent  = `${g.hp}/${g.maxHp}`;
    $('map-armor').textContent    = g.armor;
    $('map-spirit').textContent   = g.spirit;
    $('map-money').textContent    = g.money;
    $('map-round').textContent    = g.currentRound;
    $('map-round-total').textContent = g.totalRounds;
  }

  function onMapNodeClick(stage, row) {
    const selectable = MapSystem.getSelectableNodes();
    const isOk = selectable.some(n => n.stage === stage && n.row === row);
    if (!isOk) return;

    if (stage === 'boss') { enterBoss(); return; }

    const node = MapSystem.moveToNode(stage, row);
    if (!node) return;
    State.g.turn++;
    handleNodeEntry(node);
  }

  function handleNodeEntry(node) {
    switch (node.type) {
      case 'enemy':  startBattleFromMap(false); break;
      case 'elite':  startBattleFromMap(true);  break;
      default:       showEventPlaceholder(node); break;
    }
  }

  function startBattleFromMap(isElite) {
    const g = State.g;
    if (isElite) {
      const key = ({ 1:'orc', 2:'golem', 3:'behemoth' })[g.currentRound] || 'orc';
      Battle.startBattle(key);
    } else {
      Battle.startBattle(null); // randomEnemy
    }
  }

  function enterBoss() {
    MapSystem.moveToBoss();
    const g = State.g;
    const key = ({ 1:'ogre', 2:'lich', 3:'dragon' })[g.currentRound] || 'ogre';
    Battle.startBattle(key);
  }

  function showEventPlaceholder(node) {
    $('event-icon').textContent  = MapSystem.NODE_ICONS[node.type] || '?';
    $('event-title').textContent = MapSystem.NODE_LABEL[node.type] || node.type;
    $('overlay-event').classList.remove('hidden');
  }

  $('btn-event-close').addEventListener('click', () => {
    $('overlay-event').classList.add('hidden');
    const sel = MapSystem.getSelectableNodes();
    if (sel.length === 1 && sel[0].stage === 'boss') {
      $('map-hint').textContent = '⚠️ BOSSが待っている！';
    }
    updateMapStatus();
    renderMap();
  });

  // ===== 演算子トグル =====
  document.querySelectorAll('.op-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const fi = parseInt(btn.dataset.fi);
      Battle.toggleOperator(fi);
    });
  });

  // ===== スロットクリック（配置済みカードを外す） =====
  document.querySelectorAll('.formula-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const fi  = parseInt(slot.dataset.formula) - 1;
      const pos = parseInt(slot.dataset.pos);
      Battle.onSlotClick(fi, pos);
    });
  });

  // ===== GOボタン =====
  $('btn-go').addEventListener('click', () => {
    if (!State.isFormulaComplete()) return;
    Battle.executeTurn();
  });

  // ===== クリアボタン =====
  $('btn-clear').addEventListener('click', () => Battle.clearFormula());

  // ===== カード報酬画面 =====
  window.showRewardScreen = function (enemy, money) {
    const enemyType = enemy.isBoss ? 'boss' : (enemy.type === 'elite' ? 'elite' : 'enemy');
    const rewardCards = Abilities.generateRewardCards(enemyType);

    $('reward-enemy-result').textContent =
      `${enemy.name} を倒した！ 💰 +${money}　カードを1枚選んでデッキに加えよう`;

    const container = $('reward-cards');
    container.innerHTML = '';
    rewardCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const abilityLines = card.abilities.map(id => {
        const def = Abilities.DEFS[id];
        return def ? `${def.icon}${def.name}` : id;
      }).join('<br>');
      el.innerHTML = `
        <div class="rc-num">${card.num}</div>
        <div class="rc-abilities">${abilityLines}</div>
      `;
      el.addEventListener('click', () => {
        State.addCardToDeck(card);
        $('overlay-reward').classList.add('hidden');
        afterReward();
      });
      container.appendChild(el);
    });

    $('overlay-reward').classList.remove('hidden');
  };

  $('btn-reward-skip').addEventListener('click', () => {
    $('overlay-reward').classList.add('hidden');
    afterReward();
  });

  function afterReward() {
    const g = State.g;
    const mapData = MapSystem.getMapData();
    if (mapData && mapData.phase === 'boss') {
      if (g.currentRound < g.totalRounds) {
        g.currentRound++;
        MapSystem.generateMap();
        $('map-hint').textContent = `ラウンド${g.currentRound} スタート！`;
        showMapScreen();
      } else {
        showGameClear();
      }
    } else {
      $('map-hint').textContent = '次のマスを選ぼう！';
      updateMapStatus();
      renderMap();
      Battle.showScreen('map');
    }
  }

  // ===== デッキ確認 =====
  $('btn-deck-view').addEventListener('click', () => {
    renderDeckViewer();
    $('overlay-deck').classList.remove('hidden');
  });
  $('btn-deck-close').addEventListener('click', () => {
    $('overlay-deck').classList.add('hidden');
  });

  function renderDeckViewer() {
    const g = State.g;
    const allCards = [...g.deck, ...g.discard, ...g.hand];
    const container = $('deck-cards');
    container.innerHTML = '';
    allCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'deck-card';
      const abilityLines = card.abilities.map(id => {
        const def = Abilities.DEFS[id];
        return def ? `${def.icon}${def.name}` : id;
      }).join('<br>');
      el.innerHTML = `
        <div class="dc-num">${card.num}</div>
        ${abilityLines ? `<div class="dc-ability">${abilityLines}</div>` : ''}
      `;
      container.appendChild(el);
    });
    if (allCards.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem">デッキが空です</p>';
    }
  }

  // ===== バトル結果（旧 - 報酬画面が先） =====
  $('btn-result-next').addEventListener('click', () => {
    $('overlay-result').classList.add('hidden');
    afterReward();
  });

  // ===== ゲームオーバー =====
  $('btn-retry').addEventListener('click', () => {
    $('overlay-gameover').classList.add('hidden');
    // タイトルへ戻る
    $('title-menu').classList.remove('hidden');
    $('difficulty-select').classList.add('hidden');
    Battle.showScreen('title');
  });

  // ===== ゲームクリア =====
  function showGameClear() {
    $('result-title').textContent = '🎉 クリア！';
    $('result-body').innerHTML = `<p>全ラウンドを制覇した！</p><p>おめでとう！</p>`;
    $('btn-result-next').textContent = 'タイトルへ';
    $('overlay-result').classList.remove('hidden');

    $('btn-result-next').addEventListener('click', () => {
      $('overlay-result').classList.add('hidden');
      $('btn-result-next').textContent = 'つぎへ';
      $('title-menu').classList.remove('hidden');
      $('difficulty-select').classList.add('hidden');
      Battle.showScreen('title');
    }, { once: true });
  }

})();
