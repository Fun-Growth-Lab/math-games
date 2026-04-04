// ===== ゲーム状態管理 =====

const State = (() => {

  // 数字の性質テーブル
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

  let g = {}; // ゲームグローバル状態

  function init(charType, difficulty) {
    g = {
      charType,
      difficulty,
      totalRounds: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3,
      currentRound: 1,
      turn: 1, // マップ上の総ターン

      // プレイヤーステータス
      hp: 20,
      maxHp: 20,
      armor: 0,
      maxArmor: 5,
      spirit: 0, // 闘志
      money: 0,

      // デッキ管理
      deck: [],
      hand: [],
      discard: [],

      // 戦闘状態
      inBattle: false,
      enemy: null,
      battleTurn: 0,
      sealedCardIndex: -1, // -1なら封印なし（手札インデックス）

      // 式構築状態
      formula: [
        { cards: [null, null], op: '+' },  // 式①
        { cards: [null, null], op: '-' },  // 式②
      ],
      selectedHandIndex: -1, // 現在選択中の手札インデックス
      selectingSlot: null,   // { formulaIdx, pos } 次にスロットを選んだときにここに入れる
    };

    buildDeck();
    drawToFull();
  }

  // デッキ構築: 1〜9を2枚ずつ
  function buildDeck() {
    g.deck = [];
    for (let n = 1; n <= 9; n++) {
      g.deck.push(createCard(n));
      g.deck.push(createCard(n));
    }
    shuffle(g.deck);
  }

  function createCard(num) {
    return {
      id: Math.random().toString(36).slice(2),
      num,
      props: NUM_PROPS[num],
      abilities: [], // 特殊能力（後フェーズで実装）
      sealed: false,
    };
  }

  // 手札を5枚まで補充
  function drawToFull() {
    while (g.hand.length < 5) {
      if (g.deck.length === 0) {
        if (g.discard.length === 0) break; // カードなし（通常起こらない）
        g.deck = [...g.discard];
        g.discard = [];
        shuffle(g.deck);
      }
      const card = g.deck.pop();
      card.sealed = false;
      g.hand.push(card);
    }
  }

  // 使ったカードを捨て札へ
  function discardCards(cards) {
    for (const c of cards) {
      if (c) g.discard.push(c);
    }
  }

  // シャッフル（Fisher-Yates）
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 式に使われているカード（手札インデックス）一覧
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

  // 式①②が両方埋まっているか
  function isFormulaComplete() {
    return g.formula.every(f => f.cards[0] !== null && f.cards[1] !== null);
  }

  // 式の計算結果
  function calcFormula(fi) {
    const f = g.formula[fi];
    if (!f.cards[0] || !f.cards[1]) return null;
    const a = f.cards[0].num;
    const b = f.cards[1].num;
    return f.op === '+' ? a + b : a - b;
  }

  // 攻撃力（式①結果 + 闘志）。マイナスは0
  function getPlayerAttack() {
    const r = calcFormula(0);
    if (r === null) return 0;
    return Math.max(0, r + g.spirit);
  }

  // 防御力（式②結果）。マイナスは0
  function getPlayerDefense() {
    const r = calcFormula(1);
    if (r === null) return 0;
    return Math.max(0, r);
  }

  // HP変動
  function changeHp(delta) {
    g.hp = Math.max(0, Math.min(g.maxHp, g.hp + delta));
  }

  // 鎧変動
  function changeArmor(delta) {
    g.armor = Math.max(0, Math.min(g.maxArmor, g.armor + delta));
  }

  // プレイヤーがダメージを受ける（3層構造）
  // returns: { defense, armorAbs, hpDmg }
  function playerTakeDamage(rawDamage, defenseValue) {
    let dmg = rawDamage;

    // ①防御力で吸収
    const defAbs = Math.min(dmg, defenseValue);
    dmg -= defAbs;

    // ②鎧で吸収
    const armorAbs = Math.min(dmg, g.armor);
    dmg -= armorAbs;
    if (armorAbs > 0) changeArmor(-armorAbs);

    // ③残りHP直撃
    changeHp(-dmg);

    return { defAbs, armorAbs, hpDmg: dmg };
  }

  // 式をリセット
  function clearFormula() {
    g.formula = [
      { cards: [null, null], op: '+' },
      { cards: [null, null], op: '-' },
    ];
    g.selectedHandIndex = -1;
    g.selectingSlot = null;
  }

  return {
    init,
    get g() { return g; },
    NUM_PROPS,
    buildDeck,
    createCard,
    drawToFull,
    discardCards,
    shuffle,
    getPlacedHandIndices,
    isFormulaComplete,
    calcFormula,
    getPlayerAttack,
    getPlayerDefense,
    changeHp,
    changeArmor,
    playerTakeDamage,
    clearFormula,
    addCardToDeck,
  };

  // 報酬カードをデッキに追加（捨て札の底に）
  function addCardToDeck(card) {
    g.discard.push(card);
  }
})();
