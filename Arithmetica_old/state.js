// ===== ゲーム状態管理 =====

const State = (() => {

  const NUM_PROPS = {
    1: { even: false, odd: true,  prime: false, composite: false },
    2: { even: true,  odd: false, prime: true,  composite: false },
    3: { even: false, odd: true,  prime: true,  composite: false },
    4: { even: true,  odd: false, prime: false, composite: true  },
    5: { even: false, odd: true,  prime: true,  composite: false },
    6: { even: true,  odd: false, prime: false, composite: true  },
    7: { even: false, odd: true,  prime: true,  composite: false },
    8: { even: true,  odd: false, prime: false, composite: true  },
    9: { even: false, odd: true,  prime: false, composite: true  },
  };

  let g = {};

  function init(charType, difficulty) {
    g = {
      charType, difficulty,
      totalRounds: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3,
      currentRound: 1,
      turn: 0,  // 0スタート。最初の1歩でturn=1 → Lv.1

      hp: 20, maxHp: 20,
      armor: 0, maxArmor: 5,
      spirit: 0,
      money: 0,

      deck: [], hand: [], discard: [],
      skills: [],

      inBattle: false,
      enemy: null,
      battleTurn: 0,
      poisonTurns: 0,
      healTicks: 0,
      sealedCardIndex: -1,
      battlesWon: 0,
      battleSpiritGain: 0,
      battleArmorGain: 0,

      formula: [
        { cards: [null, null], op: '+', locked: [false, false] },
        { cards: [null, null], op: '-', locked: [false, false] },
      ],
      selectedHandIndex: -1,
      selectingSlot: null,
    };
    buildDeck();
    drawToFull();
  }

  function buildDeck() {
    g.deck = [];
    for (let n = 1; n <= 9; n++) {
      g.deck.push(createCard(n));
    }
    shuffle(g.deck);
  }

  function createCard(num) {
    return {
      id: Math.random().toString(36).slice(2),
      num,
      props: NUM_PROPS[num],
      abilities: [],
      sealed: false,
    };
  }

  function drawToFull() {
    while (g.hand.length < 5) {
      if (g.deck.length === 0) {
        if (g.discard.length === 0) break;
        g.deck = [...g.discard];
        g.discard = [];
        shuffle(g.deck);
      }
      const card = g.deck.pop();
      card.sealed = false;
      g.hand.push(card);
    }
  }

  // 1枚だけ引く（ドラッグ配置直後の補充用）
  function drawOne() {
    if (g.deck.length === 0) {
      if (g.discard.length === 0) return null;
      g.deck = [...g.discard];
      g.discard = [];
      shuffle(g.deck);
    }
    if (g.deck.length > 0) {
      const card = g.deck.pop();
      card.sealed = false;
      g.hand.push(card);
      return card;
    }
    return null;
  }

  function discardCards(cards) {
    for (const c of cards) {
      if (c) g.discard.push(c);
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function getPlacedHandIndices() {
    const placed = new Set();
    for (const f of g.formula) {
      for (const c of f.cards) {
        if (c !== null) {
          const idx = g.hand.indexOf(c);
          if (idx !== -1) placed.add(idx);
        }
      }
    }
    return placed;
  }

  function isFormulaComplete() {
    return g.formula.every(f => f.cards[0] !== null && f.cards[1] !== null);
  }

  function calcFormula(fi) {
    const f = g.formula[fi];
    if (!f.cards[0] || !f.cards[1]) return null;
    const a = f.cards[0].num;
    const b = f.cards[1].num;
    return f.op === '+' ? a + b : a - b;
  }

  function getPlayerAttack() {
    const r = calcFormula(0);
    if (r === null) return 0;
    return Math.max(0, r + g.spirit);
  }

  function getPlayerDefense() {
    const r = calcFormula(1);
    if (r === null) return 0;
    return Math.max(0, r);
  }

  function changeHp(delta) {
    g.hp = Math.max(0, Math.min(g.maxHp, g.hp + delta));
  }

  function changeArmor(delta) {
    g.armor = Math.max(0, Math.min(g.maxArmor, g.armor + delta));
  }

  function playerTakeDamage(rawDamage, defenseValue) {
    let dmg = rawDamage;
    const defAbs = Math.min(dmg, defenseValue);
    dmg -= defAbs;
    const armorAbs = Math.min(dmg, g.armor);
    dmg -= armorAbs;
    if (armorAbs > 0) changeArmor(-armorAbs);
    changeHp(-dmg);
    return { defAbs, armorAbs, hpDmg: dmg };
  }

  // ターン後のリセット（カードは既に捨て済み）
  function clearFormula() {
    g.formula = [
      { cards: [null, null], op: '+', locked: [false, false] },
      { cards: [null, null], op: '-', locked: [false, false] },
    ];
    g.selectedHandIndex = -1;
    g.selectingSlot = null;
  }

  // Clearボタン用（カードを手札に戻してリセット）
  function cancelFormula() {
    for (const f of g.formula) {
      for (const c of f.cards) {
        if (c) g.hand.push(c);
      }
    }
    clearFormula();
  }

  return {
    init,
    get g() { return g; },
    NUM_PROPS,
    buildDeck, createCard,
    drawToFull, drawOne,
    discardCards, shuffle,
    getPlacedHandIndices,
    isFormulaComplete,
    calcFormula,
    getPlayerAttack, getPlayerDefense,
    changeHp, changeArmor, playerTakeDamage,
    clearFormula, cancelFormula,
    addCardToDeck, resetDeckForBattle,
  };

  function addCardToDeck(card) {
    g.discard.push(card);
  }

  // 戦闘開始前にデッキをリセット（手札・捨て札・式のカードをすべて山札に戻す）
  function resetDeckForBattle() {
    // 式のカードを戻す
    for (const f of g.formula) {
      for (const c of f.cards) { if (c) g.deck.push(c); }
    }
    // 手札と捨て札を戻す
    for (const c of g.hand) g.deck.push(c);
    for (const c of g.discard) g.deck.push(c);
    g.hand = [];
    g.discard = [];
    shuffle(g.deck);
    drawToFull();
  }
})();
