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

  $('btn-title-return').addEventListener('click', () => {
    $('overlay-title-confirm').classList.remove('hidden');
  });
  $('btn-title-confirm-yes').addEventListener('click', () => {
    $('overlay-title-confirm').classList.add('hidden');
    Battle.showScreen('title');
    $('title-menu').classList.remove('hidden');
    $('difficulty-select').classList.add('hidden');
  });
  $('btn-title-confirm-no').addEventListener('click', () => {
    $('overlay-title-confirm').classList.add('hidden');
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
    btn.addEventListener('click', () => startGame(btn.dataset.diff));
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
    $('map-hp-bar').style.width  = pct + '%';
    $('map-hp-text').textContent  = `${g.hp}/${g.maxHp}`;
    $('map-spirit').textContent   = g.spirit;
    $('map-armor').textContent    = g.armor;
    $('map-money').textContent    = g.money;
    $('map-round').textContent    = g.currentRound;
    $('map-round-total').textContent = g.totalRounds;
  }

  function onMapNodeClick(col, row) {
    const selectable = MapSystem.getSelectableNodes();
    const lastCol    = (MapSystem.COLUMN_DEFS?.length ?? 11) - 1;
    const isOk = selectable.some(n => n.col === col && n.row === row);
    if (!isOk) return;

    const node = MapSystem.moveToNode(col, row);
    if (!node) return;
    State.g.turn++;

    if (col === lastCol) { enterBoss(node); return; }
    handleNodeEntry(node);
  }

  function handleNodeEntry(node) {
    switch (node.type) {
      case 'enemy':    startBattleFromMap(false); break;
      case 'elite':    startBattleFromMap(true);  break;
      case 'chest':    openChest(); break;
      case 'smith':    openSmith(); break;
      case 'wizard':   openWizard(); break;
      case 'shop':     openShop(); break;
      case 'training': openTraining(); break;
      case 'inn':      openInn(); break;
      default:         showEventPlaceholder(node); break;
    }
  }

  function startBattleFromMap(isElite) {
    const g = State.g;
    if (isElite) {
      const key = ({ 1:'orc', 2:'golem', 3:'behemoth' })[g.currentRound] || 'orc';
      Battle.startBattle(key);
    } else {
      Battle.startBattle(null);
    }
  }

  function enterBoss(_node) {
    const g   = State.g;
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

  // ===== 宝箱 =====
  function openChest() {
    const rewardCards = Abilities.generateRewardCards('enemy');
    $('reward-enemy-result').textContent = '宝箱を開けた！カードを1枚選ぼう';
    const container = $('reward-cards');
    container.innerHTML = '';
    rewardCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const abHtml = card.abilities.map(id => {
        const def = Abilities.DEFS[id];
        if (!def) return id;
        return `${Abilities.scopeBadge(def.scope)} ${def.name}<br><span style="color:var(--gold);font-size:12px">${Abilities.rarityStars(def.rarity)}</span>`;
      }).join('<br>');
      el.innerHTML = `<div class="rc-num">${card.num}</div><div class="rc-abilities">${abHtml}</div>`;
      el.addEventListener('click', () => {
        State.addCardToDeck(card);
        $('overlay-reward').classList.add('hidden');
        proceedAfterReward();
      });
      container.appendChild(el);
    });
    $('overlay-reward').classList.remove('hidden');
  }

  // ===== 宿屋 =====
  function openInn() {
    const g = State.g;
    $('inn-hp-info').textContent = `現在HP: ${g.hp}/${g.maxHp}`;

    // Render cards that can be deleted
    const container = $('inn-delete-cards');
    container.innerHTML = '';
    const allCards = [...g.deck, ...g.discard, ...g.hand];
    const totalCards = allCards.length;

    allCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const abHtml = card.abilities.map(id => {
        const def = Abilities.DEFS[id]; return def ? def.name : id;
      }).join(', ') || 'なし';
      const canDelete = totalCards > 5;
      el.innerHTML = `<div class="rc-num">${card.num}</div><div class="rc-abilities">能力: ${abHtml}</div><div class="rc-abilities" style="color:${canDelete ? 'var(--atk-color)' : 'var(--text-pale)'};font-size:12px">${canDelete ? 'クリックで削除' : '(最低5枚必要)'}</div>`;
      if (canDelete) {
        el.addEventListener('click', () => {
          const currentTotal = g.deck.length + g.discard.length + g.hand.length;
          if (currentTotal <= 5) {
            $('map-hint').textContent = 'カードは最低5枚必要です！';
            return;
          }
          // Remove card from wherever it is
          let removed = false;
          const removeFrom = arr => {
            const i = arr.indexOf(card);
            if (i !== -1) { arr.splice(i, 1); removed = true; }
          };
          removeFrom(g.deck); removeFrom(g.discard); removeFrom(g.hand);
          if (removed) {
            $('overlay-inn').classList.add('hidden');
            $('map-hint').textContent = 'カードを削除しました。';
            proceedAfterReward();
          }
        });
      } else {
        el.style.opacity = '0.6';
        el.style.cursor = 'default';
      }
      container.appendChild(el);
    });

    $('overlay-inn').classList.remove('hidden');
  }

  $('btn-inn-heal').addEventListener('click', () => {
    const g = State.g;
    State.changeHp(g.maxHp); // full heal
    $('inn-hp-info').textContent = `HP回復！ → ${g.hp}/${g.maxHp}`;
    $('btn-inn-heal').disabled = true;
    $('btn-inn-heal').textContent = '回復済み';
  });

  $('btn-inn-close').addEventListener('click', () => {
    $('overlay-inn').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== 修行場 =====
  function openTraining() {
    const g = State.g;
    const COST = 20;
    $('training-cost').textContent = COST;

    // Pick 3 random unlearned skills
    const learned = g.skills || [];
    const available = Object.keys(Skills.DEFS).filter(id => !learned.includes(id));
    const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 3);

    const container = $('training-skills');
    container.innerHTML = '';
    $('training-status').textContent = `所持金: ${g.money}💰`;

    if (shuffled.length === 0) {
      $('training-status').textContent = '習得可能なスキルはすべて覚えました！';
      $('overlay-training').classList.remove('hidden');
      return;
    }

    shuffled.forEach(skillId => {
      const def = Skills.DEFS[skillId];
      const el = document.createElement('div');
      el.className = 'training-card';
      const triggerLabel = def.trigger === 'atk' ? '(攻)' : def.trigger === 'def' ? '(防)' : '(全)';
      el.innerHTML = `
        <div class="tc-icon">${def.icon}</div>
        <div class="tc-name">${def.name}</div>
        <div class="tc-trigger">${triggerLabel} ${def.condDesc}</div>
        <div class="tc-effect">${def.effectDesc}</div>
        <div class="tc-stars">${def.stars}</div>
        <div style="font-size:12px;color:var(--gold-bright);margin-top:4px">20💰</div>
      `;
      el.addEventListener('click', () => {
        if (g.money < COST) {
          $('training-status').textContent = '💰が足りません！';
          return;
        }
        g.money -= COST;
        g.skills = [...(g.skills || []), skillId];
        $('overlay-training').classList.add('hidden');
        $('map-hint').textContent = `「${def.name}」を習得した！`;
        updateMapStatus();
        renderMap();
        proceedAfterReward();
      });
      container.appendChild(el);
    });

    $('overlay-training').classList.remove('hidden');
  }

  $('btn-training-close').addEventListener('click', () => {
    $('overlay-training').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== 鍛冶屋 =====
  function openSmith() {
    const g = State.g;
    let baseCard = null;
    let mergeCard = null;

    const allCards = [...g.deck, ...g.discard];
    if (allCards.length < 2) {
      $('smith-status').textContent = 'カードが2枚以上必要です。';
      $('overlay-smith').classList.remove('hidden');
      return;
    }

    function showStep1() {
      $('smith-step1').classList.remove('hidden');
      $('smith-step2').classList.add('hidden');
      $('smith-step3').classList.add('hidden');
      const cards = [...g.deck, ...g.discard];
      const container = $('smith-base-cards');
      container.innerHTML = '';
      cards.forEach(card => {
        const el = makeSmithCard(card);
        el.addEventListener('click', () => {
          baseCard = card;
          showStep2();
        });
        container.appendChild(el);
      });
      $('smith-status').textContent = 'ベースカードを選んでください。';
    }

    function showStep2() {
      $('smith-step1').classList.add('hidden');
      $('smith-step2').classList.remove('hidden');
      const cards = [...g.deck, ...g.discard].filter(c => c !== baseCard);
      const container = $('smith-merge-cards');
      container.innerHTML = '';
      cards.forEach(card => {
        const el = makeSmithCard(card);
        el.addEventListener('click', () => {
          mergeCard = card;
          doMerge();
        });
        container.appendChild(el);
      });
      $('smith-status').textContent = `ベース: ${baseCard.num} → 合成カードを選んでください。`;
    }

    function makeSmithCard(card) {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const abNames = card.abilities.map(id => Abilities.DEFS[id]?.name || id).join(', ') || 'なし';
      el.innerHTML = `<div class="rc-num">${card.num}</div><div class="rc-abilities">能力: ${abNames}</div>`;
      return el;
    }

    function doMerge() {
      $('smith-step2').classList.add('hidden');
      $('smith-step3').classList.remove('hidden');

      // Collect all abilities from both cards
      const allAbilities = [...(baseCard.abilities || []), ...(mergeCard.abilities || [])];
      const unique = [...new Set(allAbilities)];

      $('smith-result-info').textContent = `合成結果: カード「${baseCard.num}」 + 能力 ${unique.length > 2 ? '（2つを選択）' : '（自動継承）'}`;

      const container = $('smith-ability-choice');
      container.innerHTML = '';

      function finishMerge(chosenAbilities) {
        // Remove base and merge cards from deck/discard
        const removeCard = (c) => {
          let i = g.deck.indexOf(c); if (i !== -1) { g.deck.splice(i, 1); return; }
          i = g.discard.indexOf(c); if (i !== -1) { g.discard.splice(i, 1); return; }
          i = g.hand.indexOf(c); if (i !== -1) { g.hand.splice(i, 1); }
        };
        removeCard(baseCard);
        removeCard(mergeCard);
        // Create merged card
        const merged = State.createCard(baseCard.num);
        merged.abilities = chosenAbilities.slice(0, 2);
        g.discard.push(merged);
        $('overlay-smith').classList.add('hidden');
        $('map-hint').textContent = `カードを合成した！「${baseCard.num}」(能力${merged.abilities.length}つ)`;
        proceedAfterReward();
      }

      if (unique.length <= 2) {
        // Auto-merge
        const btn = document.createElement('button');
        btn.className = 'overlay-btn';
        btn.textContent = `合成する（能力: ${unique.map(id => Abilities.DEFS[id]?.name || id).join(', ') || 'なし'}）`;
        btn.addEventListener('click', () => finishMerge(unique));
        container.appendChild(btn);
      } else {
        // Let player choose 2 from the available abilities
        $('smith-result-info').textContent += '\n2つの能力を選んでください:';
        let chosen = [];
        unique.forEach(abId => {
          const def = Abilities.DEFS[abId];
          const el = document.createElement('div');
          el.className = 'reward-card';
          el.innerHTML = `${Abilities.scopeBadge(def?.scope || 'any')}<div class="rc-abilities">${def?.name || abId}</div>`;
          el.addEventListener('click', () => {
            if (chosen.includes(abId)) return;
            chosen.push(abId);
            el.style.opacity = '0.5';
            el.style.border = '3px solid var(--gold)';
            if (chosen.length === 2) finishMerge(chosen);
          });
          container.appendChild(el);
        });
      }
    }

    showStep1();
    $('overlay-smith').classList.remove('hidden');
  }

  $('btn-smith-close').addEventListener('click', () => {
    $('overlay-smith').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== 魔法使いの館 =====
  function openWizard() {
    const g = State.g;
    const COST = 15;
    $('wizard-cost').textContent = COST;
    $('wizard-status').textContent = `所持金: ${g.money}💰`;

    const allCards = [...g.deck, ...g.discard, ...g.hand];
    const eligibleCards = allCards.filter(c => !c.abilities || c.abilities.length < 2);

    if (eligibleCards.length === 0) {
      $('wizard-status').textContent = 'わたしにできることはなさそうだ…（全カードに能力が2つ付いています）';
      $('wizard-options').innerHTML = '<div class="overlay-sub" style="padding:20px;">🧙 わたしにできることはなさそうだ…</div>';
      $('overlay-wizard').classList.remove('hidden');
      return;
    }

    // ステップ1: 能力を選択
    const container = $('wizard-options');
    container.innerHTML = '';
    $('wizard-status').textContent = `所持金: ${g.money}💰 ／ 特殊能力を1つ選んでください`;

    // 3つのランダムな能力オプションを表示
    const abilityPool = [...Abilities.ALL_ABILITY_IDS].sort(() => Math.random() - 0.5).slice(0, 3);
    abilityPool.forEach(abId => {
      const abDef = Abilities.DEFS[abId];
      const el = document.createElement('div');
      el.className = 'training-card';
      const triggerLabel = abDef.scope === 'atk' ? '(攻)' : abDef.scope === 'def' ? '(防)' : '(全)';
      el.innerHTML = `
        <div>${Abilities.scopeBadge(abDef.scope)}</div>
        <div class="tc-name">${abDef.name}</div>
        <div class="tc-trigger">${triggerLabel}</div>
        <div class="tc-effect">${abDef.desc || ''}</div>
      `;
      el.addEventListener('click', () => {
        wizardStep2(abId, abDef, eligibleCards, COST);
      });
      container.appendChild(el);
    });

    $('overlay-wizard').classList.remove('hidden');
  }

  function wizardStep2(abId, abDef, eligibleCards, COST) {
    const g = State.g;
    const container = $('wizard-options');
    container.innerHTML = '';
    $('wizard-status').textContent = `「${abDef.name}」を付与するカードを選んでください（${COST}💰）`;

    // 最大3枚のランダムな適格カードを表示
    const candidates = eligibleCards.sort(() => Math.random() - 0.5).slice(0, 3);
    candidates.forEach(card => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const currentAbs = card.abilities.map(id => {
        const d = Abilities.DEFS[id]; return d ? d.name : id;
      }).join(', ') || 'なし';
      el.innerHTML = `
        <div class="rc-num">${card.num}</div>
        <div class="rc-abilities">現在: ${currentAbs}</div>
        <div class="rc-abilities" style="color:var(--gold)">→ +${abDef.name}</div>
        <div style="font-size:12px;color:var(--gold-bright);margin-top:4px">${COST}💰</div>
      `;
      el.addEventListener('click', () => {
        if (g.money < COST) {
          $('wizard-status').textContent = '💰が足りません！';
          return;
        }
        g.money -= COST;
        card.abilities = [...(card.abilities || []), abId];
        $('overlay-wizard').classList.add('hidden');
        $('map-hint').textContent = `カード「${card.num}」に「${abDef.name}」を付与！`;
        updateMapStatus();
        proceedAfterReward();
      });
      container.appendChild(el);
    });

    // 戻るボタン
    const backBtn = document.createElement('button');
    backBtn.className = 'overlay-btn-sub';
    backBtn.textContent = '◀ 戻る';
    backBtn.style.marginTop = '12px';
    backBtn.addEventListener('click', () => openWizard());
    container.appendChild(backBtn);
  }

  $('btn-wizard-close').addEventListener('click', () => {
    $('overlay-wizard').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== 商店（特殊能力付きカードのみ・レア度別価格）=====
  function openShop() {
    const g = State.g;
    $('shop-money').textContent = g.money;

    // ★☆☆×2, ★★☆×2, ★★★×1 の5枚を生成
    const rarityDistrib = [1, 1, 2, 2, 3];
    const items = rarityDistrib.map(rarity => {
      const num = Math.floor(Math.random() * 9) + 1;
      const card = State.createCard(num);
      const pool = Object.values(Abilities.DEFS).filter(d => d.rarity === rarity);
      const abDef = pool[Math.floor(Math.random() * pool.length)];
      card.abilities = [abDef.id];
      const price = Abilities.rarityPrice(rarity);
      return { card, price, rarity, abDef };
    });

    const container = $('shop-items');
    container.innerHTML = '';
    items.forEach(({ card, price, rarity, abDef }) => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      el.innerHTML = `
        ${Abilities.scopeBadge(abDef.scope)}
        <div class="rc-num">${card.num}</div>
        <div class="rc-abilities">${abDef.name}</div>
        <div class="rc-rarity" style="font-size:13px;color:var(--gold)">${Abilities.rarityStars(rarity)}</div>
        <div style="font-size:15px;font-weight:bold;color:var(--gold-bright);margin-top:2px">${price}💰</div>
      `;
      el.addEventListener('click', () => {
        if (g.money < price) {
          $('map-hint').textContent = '💰が足りません！';
          return;
        }
        g.money -= price;
        State.addCardToDeck(card);
        el.style.opacity = '0.4';
        el.style.pointerEvents = 'none';
        $('shop-money').textContent = g.money;
        $('map-hint').textContent = `カード「${card.num}」(${abDef.name}) を購入！`;
      });
      container.appendChild(el);
    });

    $('overlay-shop').classList.remove('hidden');
  }

  $('btn-shop-close').addEventListener('click', () => {
    $('overlay-shop').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== スロットクリック（配置済みカードを外す）=====
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

  // ===== 逃げるボタン =====
  $('btn-flee').addEventListener('click', () => {
    const g = State.g;
    g.inBattle = false;
    // 式にあるカードを捨て札へ（カード消滅バグ防止）
    const inFormula = [];
    for (const f of g.formula) {
      for (const c of f.cards) { if (c) inFormula.push(c); }
    }
    if (inFormula.length > 0) State.discardCards(inFormula);
    State.clearFormula();
    State.drawToFull();
    Battle.log('逃げた！');
    $('map-hint').textContent = '逃げた！次のマスを選ぼう！';
    updateMapStatus();
    renderMap();
    Battle.showScreen('map');
  });

  // ===== デッキ確認（戦闘画面アイコン）=====
  $('btn-deck-view').addEventListener('click', () => {
    renderDeckViewer();
    $('overlay-deck').classList.remove('hidden');
  });

  // ===== デッキ確認（マップ画面ボタン）=====
  $('btn-map-deck').addEventListener('click', () => {
    renderDeckViewer();
    $('overlay-deck').classList.remove('hidden');
  });

  $('btn-deck-close').addEventListener('click', () => {
    $('overlay-deck').classList.add('hidden');
  });

  $('btn-deck-detail-close').addEventListener('click', () => {
    $('deck-detail').classList.add('hidden');
  });

  function renderDeckViewer() {
    const g = State.g;
    // 式のカードも含めてすべて表示
    const formulaCards = [];
    for (const f of g.formula) {
      for (const c of f.cards) { if (c) formulaCards.push(c); }
    }
    const allCards = [...g.deck, ...g.discard, ...g.hand, ...formulaCards]
      .sort((a, b) => a.num - b.num);

    const container = $('deck-cards');
    container.innerHTML = '';

    // 詳細パネルを隠す
    const detail = $('deck-detail');
    if (detail) detail.classList.add('hidden');

    allCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'deck-card';
      el.style.cursor = 'pointer';
      const abilityLines = card.abilities.map(id => {
        const def = Abilities.DEFS[id];
        if (!def) return id;
        return def.name;
      }).join('<br>');
      // 数字は常に上部固定、能力は下部に表示（能力なしでも数字位置が揃う）
      el.innerHTML = `
        <div class="dc-num">${card.num}</div>
        <div class="dc-ability">${abilityLines || ''}</div>
      `;
      el.addEventListener('click', () => showCardDetail(card));
      container.appendChild(el);
    });
    if (allCards.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem">デッキが空です</p>';
    }
  }

  function showCardDetail(card) {
    const detail = $('deck-detail');
    const content = $('deck-detail-content');
    if (!detail || !content) return;
    let html = `<div style="font-size:26px;font-weight:bold;margin-bottom:8px">カード「${card.num}」</div>`;
    if (card.abilities && card.abilities.length > 0) {
      card.abilities.forEach(id => {
        const def = Abilities.DEFS[id];
        if (!def) return;
        const scopeLabel = def.scope === 'atk' ? '攻撃式専用' : def.scope === 'def' ? '防御式専用' : 'どちらでもOK';
        html += `
          <div style="margin-top:10px;padding:10px;background:rgba(200,160,60,0.12);border:1px solid var(--border);border-radius:6px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              ${Abilities.scopeBadge(def.scope)}
              <b style="font-size:16px">${def.name}</b>
              <span style="color:var(--gold);font-size:13px">${Abilities.rarityStars(def.rarity)}</span>
              <span style="font-size:12px;color:var(--text-pale)">(${scopeLabel})</span>
            </div>
            <div style="font-size:14px;color:var(--text-dim)">${def.desc}</div>
          </div>`;
      });
    } else {
      html += '<div style="color:var(--text-dim);font-size:14px">特殊能力なし</div>';
    }
    content.innerHTML = html;
    detail.classList.remove('hidden');
  }

  // ===== カード報酬画面 =====
  window.showRewardScreen = function (enemy, money) {
    _postBattleSkillCheck = true;
    State.g.battlesWon = (State.g.battlesWon || 0) + 1;
    const enemyType = enemy.isBoss ? 'boss' : (enemy.isElite ? 'elite' : 'enemy');
    const rewardCards = Abilities.generateRewardCards(enemyType);

    $('reward-enemy-result').textContent =
      `${enemy.name} を倒した！ 💰 +${money}　カードを1枚選ぼう`;

    const container = $('reward-cards');
    container.innerHTML = '';
    rewardCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'reward-card';
      const abHtml = card.abilities.map(id => {
        const def = Abilities.DEFS[id];
        if (!def) return id;
        return `${Abilities.scopeBadge(def.scope)} ${def.name}<br><span style="color:var(--gold);font-size:12px">${Abilities.rarityStars(def.rarity)}</span>`;
      }).join('<br>');
      el.innerHTML = `
        <div class="rc-num">${card.num}</div>
        <div class="rc-abilities">${abHtml}</div>
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

  let _postBattleSkillCheck = false;

  function afterReward() {
    // 戦闘後20%確率でスキル習得チャンス
    if (_postBattleSkillCheck) {
      _postBattleSkillCheck = false;
      const g = State.g;
      const learned = g.skills || [];
      const available = Object.keys(Skills.DEFS).filter(id => !learned.includes(id));
      const isFirstBattle = (g.battlesWon || 0) <= 1;
      if (available.length > 0 && (isFirstBattle || Math.random() < 0.20)) {
        const picks = available.sort(() => Math.random() - 0.5).slice(0, 3);
        const container = $('battle-skill-options');
        container.innerHTML = '';
        picks.forEach(skillId => {
          const def = Skills.DEFS[skillId];
          const el = document.createElement('div');
          el.className = 'training-card';
          const triggerLabel = def.trigger === 'atk' ? '(攻)' : def.trigger === 'def' ? '(防)' : '(全)';
          el.innerHTML = `
            <div class="tc-icon">${def.icon}</div>
            <div class="tc-name">${def.name}</div>
            <div class="tc-trigger">${triggerLabel} ${def.condDesc}</div>
            <div class="tc-effect">${def.effectDesc}</div>
            <div class="tc-stars">${def.stars}</div>
          `;
          el.addEventListener('click', () => {
            g.skills = [...(g.skills || []), skillId];
            $('overlay-battle-skill').classList.add('hidden');
            proceedAfterReward();
          });
          container.appendChild(el);
        });
        $('overlay-battle-skill').classList.remove('hidden');
        return; // スキル選択待ち
      }
    }
    proceedAfterReward();
  }

  function proceedAfterReward() {
    const g       = State.g;
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

  $('btn-battle-skill-skip').addEventListener('click', () => {
    $('overlay-battle-skill').classList.add('hidden');
    proceedAfterReward();
  });

  // ===== バトル結果 =====
  $('btn-result-next').addEventListener('click', () => {
    $('overlay-result').classList.add('hidden');
    afterReward();
  });

  // ===== ゲームオーバー =====
  $('btn-retry').addEventListener('click', () => {
    $('overlay-gameover').classList.add('hidden');
    $('title-menu').classList.remove('hidden');
    $('difficulty-select').classList.add('hidden');
    Battle.showScreen('title');
  });

  // ===== ゲームクリア =====
  function showGameClear() {
    $('result-title').textContent = '🎉 クリア！';
    $('result-body').innerHTML    = `<p>全ラウンドを制覇した！</p><p>おめでとう！</p>`;
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
