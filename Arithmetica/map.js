// ===== ハニカム六角形マップシステム =====

const MapSystem = (() => {

  // ===== 定数 =====
  // 9ステージ × 5行 = 45マス + START + BOSS
  const NUM_STAGES = 9;
  const NUM_ROWS   = 5;

  const NODE_ICONS = {
    enemy:  '👾', elite: '💀', boss: '👹',
    temple: '⛩',  smith: '⚒',  wizard: '🏛',
    chest:  '🎁',  shop:  '🏪',
  };
  const NODE_LABEL = {
    enemy: '敵',   elite: '強敵',  boss: 'BOSS',
    temple:'神殿', smith: '鍛冶屋', wizard:'館',
    chest: '宝箱', shop:  '商店',
  };
  const NODE_COLOR = {
    enemy:  '#6a1818', elite: '#4a1068', boss: '#8a1010',
    temple: '#0e5040',  smith: '#6a3010', wizard: '#104068',
    chest:  '#6a5010',  shop:  '#106a30',
  };
  const NODE_COLOR_STROKE = {
    enemy:  '#cc4040', elite: '#9040cc', boss: '#ff4040',
    temple: '#40cc99',  smith: '#cc7030', wizard: '#40aacc',
    chest:  '#ccaa30',  shop:  '#40cc66',
  };

  // タイププール（合計45）
  const TYPE_POOL = [
    ...Array(24).fill('enemy'),
    ...Array(6).fill('elite'),
    ...Array(4).fill('chest'),
    ...Array(3).fill('smith'),
    ...Array(3).fill('temple'),
    ...Array(3).fill('wizard'),
    ...Array(2).fill('shop'),
  ];

  // === SVG レイアウト定数 ===
  // 六角形（ポインティ・トップ）
  const R     = 30;   // 六角形の外接円半径
  const HEX_W = R * Math.sqrt(3);  // 約51.96
  const HEX_H = R * 2;             // 60
  const COL_SPACING = HEX_W;       // 水平間隔
  const ROW_SPACING = R * 1.5;     // 垂直間隔 = 45

  // ViewBox設定
  const VB_W = 1050;
  const VB_H = 380;

  // マップ描画の開始座標
  const MAP_START_X = 90;  // 一番左のステージ中心X
  const MAP_START_Y = 60;  // 一番上の行の中心Y

  // START / BOSSノード位置
  const START_X = 30;
  const START_Y = MAP_START_Y + 2 * ROW_SPACING; // 中央行
  const BOSS_X  = MAP_START_X + (NUM_STAGES) * COL_SPACING + 40;
  const BOSS_Y  = MAP_START_Y + 2 * ROW_SPACING;

  let mapData = null;

  // ===== 六角形の頂点計算（ポインティ・トップ） =====
  function hexPoints(cx, cy, r) {
    return Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 180 * (60 * i - 30);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  }

  // ===== ノード座標計算 =====
  // ステージが奇数なら垂直方向にオフセット（ハニカム）
  function nodePos(stage, row) {
    const x = MAP_START_X + stage * COL_SPACING;
    const yOffset = stage % 2 === 1 ? ROW_SPACING / 2 : 0;
    const y = MAP_START_Y + row * ROW_SPACING + yOffset;
    return { x, y };
  }

  // ===== マップ生成 =====
  function generateMap() {
    const nodes = [];
    for (let s = 0; s < NUM_STAGES; s++) {
      nodes[s] = [];
      for (let r = 0; r < NUM_ROWS; r++) {
        nodes[s][r] = {
          stage: s, row: r,
          type: null,
          connections: [],
          reachable: false,
          visited: false,
        };
      }
    }

    // STARTから入れる行（中央3行）
    const startRows = pickN([1, 2, 3], 2);
    startRows.forEach(r => { nodes[0][r].reachable = true; });

    // ステージ間接続生成
    for (let s = 0; s < NUM_STAGES - 1; s++) {
      for (let r = 0; r < NUM_ROWS; r++) {
        if (!nodes[s][r].reachable) continue;
        const adj = hexAdjacentRows(r, s);
        const chosen = pickN(adj, Math.min(adj.length, 2));
        nodes[s][r].connections = chosen;
        chosen.forEach(nr => { nodes[s + 1][nr].reachable = true; });
      }
      // 孤立ノード救済：各ステージは最低1つ到達可能に
      const hasReachable = nodes[s + 1].some(n => n.reachable);
      if (!hasReachable) {
        const r = Math.floor(Math.random() * NUM_ROWS);
        nodes[s + 1][r].reachable = true;
        nodes[s][Math.floor(Math.random() * NUM_ROWS)].connections.push(r);
      }
    }

    // タイプ割り当て
    const pool = shuffle([...TYPE_POOL]);
    let idx = 0;
    for (let s = 0; s < NUM_STAGES; s++) {
      for (let r = 0; r < NUM_ROWS; r++) {
        if (nodes[s][r].reachable) {
          nodes[s][r].type = pool[idx++ % pool.length];
        }
      }
    }

    mapData = {
      nodes,
      startRows,
      currentStage: -1,
      currentRow: -1,
      phase: 'start',
    };
    return mapData;
  }

  // ハニカム隣接行（次ステージへの接続候補）
  function hexAdjacentRows(row, stage) {
    const adj = [row];
    if (row > 0)             adj.push(row - 1);
    if (row < NUM_ROWS - 1)  adj.push(row + 1);
    return adj;
  }

  function pickN(arr, n) {
    return shuffle([...arr]).slice(0, n);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ===== SVGレンダリング =====
  function renderMap(svgEl, onNodeClick) {
    if (!mapData) return;
    const { nodes, startRows, currentStage, currentRow } = mapData;
    const selectable = getSelectableNodes();

    svgEl.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svgEl.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs) => {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    const mkText = (x, y, txt, attrs) => {
      const el = document.createElementNS(ns, 'text');
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'middle');
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      el.textContent = txt;
      return el;
    };

    // ── エッジ描画 ──
    // START → ステージ0
    for (const r of startRows) {
      if (!nodes[0]?.[r]?.reachable) continue;
      const p = nodePos(0, r);
      svgEl.appendChild(mk('line', {
        x1: START_X, y1: START_Y, x2: p.x, y2: p.y,
        stroke: '#3a3060', 'stroke-width': 1.5, 'stroke-dasharray': '5,3',
      }));
    }

    // ステージ間エッジ
    for (let s = 0; s < NUM_STAGES - 1; s++) {
      for (let r = 0; r < NUM_ROWS; r++) {
        const node = nodes[s][r];
        if (!node.reachable) continue;
        const p1 = nodePos(s, r);
        for (const nr of node.connections) {
          const p2 = nodePos(s + 1, nr);
          const isActive =
            (s === currentStage && r === currentRow) ||
            (s + 1 === currentStage && nr === currentRow);
          svgEl.appendChild(mk('line', {
            x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
            stroke: isActive ? '#c8a43a' : '#2a2050',
            'stroke-width': isActive ? 2.5 : 1.5,
            opacity: node.visited ? '0.4' : '0.8',
          }));
        }
      }
    }

    // 最終ステージ → BOSS
    for (let r = 0; r < NUM_ROWS; r++) {
      if (!nodes[NUM_STAGES - 1][r].reachable) continue;
      const p = nodePos(NUM_STAGES - 1, r);
      svgEl.appendChild(mk('line', {
        x1: p.x, y1: p.y, x2: BOSS_X, y2: BOSS_Y,
        stroke: '#aa2020', 'stroke-width': 1.5, 'stroke-dasharray': '6,4',
      }));
    }

    // ── STARTノード ──
    const startG = mk('g', {});
    startG.appendChild(mk('polygon', {
      points: hexPoints(START_X, START_Y, R - 2),
      fill: '#0e0c1c', stroke: '#c8a43a', 'stroke-width': 2,
    }));
    startG.appendChild(mkText(START_X, START_Y - 3, 'S', { fill: '#c8a43a', 'font-size': '12', 'font-weight': 'bold' }));
    startG.appendChild(mkText(START_X, START_Y + 10, 'TART', { fill: '#c8a43a', 'font-size': '7' }));
    svgEl.appendChild(startG);

    // ── BOSSノード ──
    const bossSelectable = selectable.some(n => n.stage === 'boss');
    const bossG = mk('g', { style: bossSelectable ? 'cursor:pointer' : '' });
    if (bossSelectable) {
      const pulse = mk('polygon', {
        points: hexPoints(BOSS_X, BOSS_Y, R + 7),
        fill: 'none', stroke: '#ff4040', 'stroke-width': 2, opacity: '0.6',
      });
      pulse.style.animation = 'hexPulse 1.2s ease-in-out infinite';
      bossG.appendChild(pulse);
    }
    bossG.appendChild(mk('polygon', {
      points: hexPoints(BOSS_X, BOSS_Y, R),
      fill: '#3a0808', stroke: '#ff4040', 'stroke-width': 2.5,
    }));
    bossG.appendChild(mkText(BOSS_X, BOSS_Y - 2, '👹', { 'font-size': '18' }));
    bossG.appendChild(mkText(BOSS_X, BOSS_Y + 15, 'BOSS', { fill: '#ff6060', 'font-size': '8', 'font-weight': 'bold' }));
    if (bossSelectable && onNodeClick) {
      bossG.addEventListener('click', () => onNodeClick('boss', 0));
    }
    svgEl.appendChild(bossG);

    // ── 通常ノード ──
    for (let s = 0; s < NUM_STAGES; s++) {
      for (let r = 0; r < NUM_ROWS; r++) {
        const node = nodes[s][r];
        if (!node.reachable) continue;
        const { x, y } = nodePos(s, r);

        const isCurrent = s === currentStage && r === currentRow;
        const isSelect  = selectable.some(n => n.stage === s && n.row === r);
        const isVisited = node.visited;

        const g = mk('g', { style: 'cursor:' + (isSelect ? 'pointer' : 'default') });

        // 選択可能 → パルスリング
        if (isSelect) {
          const pulse = mk('polygon', {
            points: hexPoints(x, y, R + 6),
            fill: 'none', stroke: '#c8a43a', 'stroke-width': 2, opacity: '0.7',
          });
          pulse.style.animation = 'hexPulse 1.2s ease-in-out infinite';
          g.appendChild(pulse);
        }

        // 本体六角形
        const fillColor = isCurrent ? '#c8a43a'
          : isVisited ? '#1a1828'
          : NODE_COLOR[node.type] || '#1a1428';
        const strokeColor = isCurrent ? '#ffffff'
          : isSelect ? '#c8a43a'
          : isVisited ? '#2a2848'
          : NODE_COLOR_STROKE[node.type] || '#4a4060';
        g.appendChild(mk('polygon', {
          points: hexPoints(x, y, R),
          fill: fillColor,
          stroke: strokeColor,
          'stroke-width': isCurrent ? 3 : 2,
          opacity: isVisited && !isCurrent ? '0.45' : '1',
        }));

        // アイコン（絵文字）
        g.appendChild(mkText(x, y - 3, NODE_ICONS[node.type] || '?', {
          'font-size': '14',
          opacity: isVisited ? '0.4' : '1',
        }));

        // ラベル
        g.appendChild(mkText(x, y + R + 10, NODE_LABEL[node.type] || '', {
          fill: isVisited ? '#3a3860' : '#8888aa',
          'font-size': '9',
        }));

        if (isSelect && onNodeClick) {
          g.addEventListener('click', () => onNodeClick(s, r));
        }
        svgEl.appendChild(g);
      }
    }
  }

  // ===== 選択可能ノード取得 =====
  function getSelectableNodes() {
    if (!mapData) return [];
    const { nodes, startRows, currentStage, currentRow } = mapData;

    if (currentStage === -1) {
      return startRows
        .filter(r => nodes[0]?.[r]?.reachable)
        .map(r => ({ stage: 0, row: r }));
    }

    if (currentStage === NUM_STAGES - 1) {
      return [{ stage: 'boss', row: 0 }];
    }

    if (currentStage === 'boss') return [];

    const conns = nodes[currentStage]?.[currentRow]?.connections || [];
    return conns
      .filter(nr => nodes[currentStage + 1]?.[nr]?.reachable)
      .map(nr => ({ stage: currentStage + 1, row: nr }));
  }

  // ===== ノード移動 =====
  function moveToNode(stage, row) {
    if (!mapData) return null;
    const node = mapData.nodes[stage]?.[row];
    if (!node) return null;
    mapData.currentStage = stage;
    mapData.currentRow   = row;
    node.visited = true;
    return node;
  }

  function moveToBoss() {
    if (!mapData) return;
    mapData.currentStage = 'boss';
    mapData.currentRow   = 0;
    mapData.phase = 'boss';
  }

  function getMapData() { return mapData; }

  return {
    generateMap, renderMap, getSelectableNodes,
    moveToNode, moveToBoss, getMapData,
    NODE_ICONS, NODE_LABEL, NODE_COLOR,
  };
})();
