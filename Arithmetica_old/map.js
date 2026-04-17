// ===== ハニカム六角形マップシステム（フラットトップ・ダイヤモンド形）=====

const MapSystem = (() => {

  // ===== 列定義（各列のアクティブ行インデックス）=====
  // 形状: 1→2→3→4→5→4→5→4→3→2→1 = 34マス
  // フラットトップ: 奇数列は rowSpacing/2 だけ下にずれる
  const COLUMN_DEFS = [
    [2],                   // col 0: START
    [1, 2],                // col 1: 2マス
    [1, 2, 3],             // col 2: 3マス
    [0, 1, 2, 3],          // col 3: 4マス
    [0, 1, 2, 3, 4],       // col 4: 5マス
    [0, 1, 2, 3],          // col 5: 4マス
    [0, 1, 2, 3, 4],       // col 6: 5マス
    [0, 1, 2, 3],          // col 7: 4マス
    [1, 2, 3],             // col 8: 3マス
    [1, 2],                // col 9: 2マス
    [2],                   // col 10: BOSS
  ];
  const NUM_COLS = COLUMN_DEFS.length; // 11

  // 通常プレイノード（col 1-9）の合計: 2+3+4+5+4+5+4+3+2 = 32
  const TYPE_POOL = [
    ...Array(18).fill('enemy'),
    ...Array(4).fill('elite'),
    ...Array(4).fill('chest'),
    ...Array(3).fill('smith'),
    ...Array(1).fill('wizard'),
    ...Array(1).fill('training'),
    ...Array(1).fill('inn'),
  ]; // 合計 32

  const NODE_ICONS = {
    enemy:'👾', elite:'💀', boss:'👹',
    smith:'⚒', wizard:'🏛',
    chest:'🎁', shop:'🏪', training:'🥋', inn:'🏠',
  };
  const NODE_LABEL = {
    enemy:'敵', elite:'強敵', boss:'BOSS',
    smith:'鍛冶', wizard:'館',
    chest:'宝箱', shop:'商店', training:'修行場', inn:'宿屋',
  };
  const NODE_FILL = {
    enemy:'#b05a50', elite:'#7a3a90', boss:'#c03030',
    smith:'#505060', wizard:'#205880',
    chest:'#a07818', shop:'#307050', training:'#405080', inn:'#506030',
  };
  const NODE_STROKE = {
    enemy:'#e07060', elite:'#b060e0', boss:'#ff5050',
    smith:'#9090a8', wizard:'#50b0e0',
    chest:'#ffe060', shop:'#60d080', training:'#7090c0', inn:'#90b060',
  };

  // ===== フラットトップ六角形レイアウト定数 =====
  const R            = 44;
  const COL_SPACING  = R * 1.5;              // 66   (水平方向：中心間距離)
  const ROW_SPACING  = R * Math.sqrt(3);     // ≈76.2 (垂直方向：中心間距離)

  // マップ原点
  const OX = 58;
  const OY = 42;

  // ViewBox
  const VB_W = 820;
  const VB_H = 430;

  let mapData = null;

  // ===== フラットトップ六角形の頂点 =====
  // 角度 0°,60°,120°,180°,240°,300° から計算（フラットトップ）
  function hexPoints(cx, cy, r) {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  }

  // ===== ノード座標 =====
  function nodePos(col, row) {
    const x = OX + col * COL_SPACING;
    const y = OY + row * ROW_SPACING + (col % 2 === 1 ? ROW_SPACING / 2 : 0);
    return { x, y };
  }

  // ===== 隣接行の計算 =====
  // フラットトップのハニカム隣接（奇数列シフト）:
  //   偶数列 → 奇数列: row r → {r-1, r} (奇数列が下にずれているため)
  //   奇数列 → 偶数列: row r → {r, r+1}
  function adjacentRowsInNextCol(col, row, nextColRows) {
    let candidates;
    if (col % 2 === 0) {
      candidates = [row - 1, row];
    } else {
      candidates = [row, row + 1];
    }
    return candidates.filter(r => nextColRows.includes(r));
  }

  // ===== マップ生成 =====
  function generateMap() {
    // ノード初期化（col 0 と col 10 は特殊）
    const nodes = {};
    for (let c = 0; c < NUM_COLS; c++) {
      nodes[c] = {};
      for (const r of COLUMN_DEFS[c]) {
        nodes[c][r] = {
          col: c, row: r,
          type: null,
          connections: [],  // 次の列のrow番号リスト
          visited: false,
        };
      }
    }

    // ── 接続生成（col 0〜9 → col 1〜10）──
    for (let c = 0; c < NUM_COLS - 1; c++) {
      const thisRows = COLUMN_DEFS[c];
      const nextRows = COLUMN_DEFS[c + 1];
      const incomingCount = Object.fromEntries(nextRows.map(r => [r, 0]));

      // 各ノードから次列のノードへ接続（1〜2本）
      for (const r of thisRows) {
        const adj = adjacentRowsInNextCol(c, r, nextRows);
        if (adj.length === 0) continue;
        // 隣接するノード全てに接続
        const numConn = adj.length; // 隣接するノード全てに接続
        const chosen  = shuffle([...adj]).slice(0, numConn);
        nodes[c][r].connections = chosen;
        chosen.forEach(nr => { incomingCount[nr]++; });
      }

      // 次列の未接続ノードに接続を追加
      for (const nr of nextRows) {
        if (incomingCount[nr] === 0) {
          // 隣接している前列ノードを探して接続
          for (const r of shuffle([...thisRows])) {
            const adj = adjacentRowsInNextCol(c, r, nextRows);
            if (adj.includes(nr)) {
              if (!nodes[c][r].connections.includes(nr)) {
                nodes[c][r].connections.push(nr);
              }
              incomingCount[nr]++;
              break;
            }
          }
        }
      }
    }

    // ── タイプ割り当て（col 1〜9）──
    const pool = shuffle([...TYPE_POOL]);
    let idx = 0;
    for (let c = 1; c <= NUM_COLS - 2; c++) {
      for (const r of COLUMN_DEFS[c]) {
        nodes[c][r].type = pool[idx++ % pool.length];
      }
    }

    mapData = {
      nodes,
      currentCol: 0,   // STARTにいる
      currentRow: 2,
      phase: 'start',
    };
    return mapData;
  }

  // ===== SVG描画 =====
  function renderMap(svgEl, onNodeClick) {
    if (!mapData) return;
    const { nodes, currentCol, currentRow } = mapData;
    const selectable = getSelectableNodes();

    svgEl.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svgEl.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs) => {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    const mkTxt = (x, y, txt, attrs) => {
      const el = document.createElementNS(ns, 'text');
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'middle');
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      el.textContent = txt;
      return el;
    };

    // ── 通常ノード ──
    for (let c = 0; c < NUM_COLS; c++) {
      const isStart = c === 0;
      const isBossCol = c === NUM_COLS - 1;

      for (const r of COLUMN_DEFS[c]) {
        const n = nodes[c]?.[r];
        const { x, y } = nodePos(c, r);

        const isCurrent  = c === currentCol && r === currentRow;
        const isSelect   = selectable.some(s => s.col === c && s.row === r);
        const isVisited  = n?.visited && !isCurrent;

        const g = mk('g', { style: isSelect ? 'cursor:pointer' : 'cursor:default' });

        // 本体六角形
        let fill, stroke, strokeW;
        if (isStart) {
          fill = '#f0e4c8'; stroke = '#a07010'; strokeW = 2.5;
        } else if (isBossCol) {
          fill = isCurrent ? '#c03030' : (isVisited ? '#c0a888' : '#a03030');
          stroke = isSelect ? '#ff5050' : '#e06060'; strokeW = 2.5;
        } else if (isCurrent) {
          fill = '#c89020'; stroke = '#fff0d0'; strokeW = 3;
        } else if (isVisited) {
          fill = '#d4c8a8'; stroke = 'rgba(100,70,30,0.35)'; strokeW = 1.5;
        } else {
          fill = NODE_FILL[n?.type] || '#806040';
          stroke = isSelect ? '#ffdd00' : (NODE_STROKE[n?.type] || '#c0a060');
          strokeW = isSelect ? 3 : 2;
        }

        g.appendChild(mk('polygon', {
          points: hexPoints(x, y, R),
          fill,
          stroke,
          'stroke-width': strokeW,
          opacity: isVisited ? '0.45' : '1',
        }));

        // 選択可能：黄色オーバーレイを本体六角形の上に追加
        if (isSelect) {
          const overlay = mk('polygon', {
            points: hexPoints(x, y, R),
            fill: isBossCol ? '#ff4444' : '#ffdd00',
            stroke: 'none',
          });
          overlay.style.animation = isBossCol
            ? 'hexYellowOverlay 0.9s ease-in-out infinite'
            : 'hexYellowOverlay 1.0s ease-in-out infinite';
          overlay.style.pointerEvents = 'none';
          g.appendChild(overlay);
        }

        // アイコン（上部）
        if (isStart) {
          g.appendChild(mkTxt(x, y - 6, 'S', { fill: '#a07010', 'font-size': '14', 'font-weight': 'bold' }));
          g.appendChild(mkTxt(x, y + 10, 'TART', { fill: '#a07010', 'font-size': '8' }));
        } else if (isCurrent) {
          // 現在地にキャラクターを表示
          g.appendChild(mkTxt(x, y - 8, '🧑', { 'font-size': '24' }));
          g.appendChild(mkTxt(x, y + 14, NODE_LABEL[isBossCol ? 'boss' : n?.type] || '', {
            fill: '#3a2000', 'font-size': '9', 'font-weight': 'bold',
          }));
        } else {
          const iconType = isBossCol ? 'boss' : n?.type;
          const icon = NODE_ICONS[iconType] || '?';
          const label = NODE_LABEL[iconType] || '';
          const labelColor = isVisited ? 'rgba(80,50,20,0.45)' : (isSelect ? '#3a2000' : 'rgba(240,220,180,0.9)');
          g.appendChild(mkTxt(x, y - 8, icon, {
            'font-size': '16',
            opacity: isVisited ? '0.5' : '1',
          }));
          g.appendChild(mkTxt(x, y + 11, label, {
            fill: labelColor,
            'font-size': '9',
            'font-weight': 'bold',
          }));
        }

        if (isSelect && onNodeClick) {
          g.addEventListener('click', () => onNodeClick(c, r));
        }
        svgEl.appendChild(g);
      }
    }
  }

  // ===== 選択可能ノード =====
  function getSelectableNodes() {
    if (!mapData) return [];
    const { nodes, currentCol, currentRow, phase } = mapData;

    if (phase === 'boss') return [];

    // STARTにいる（currentCol === 0）→ col 1の全ノードを選択可能
    if (currentCol === 0) {
      return COLUMN_DEFS[1].map(r => ({ col: 1, row: r }));
    }

    // 最終通常列 (col 9) → BOSS (col 10)
    if (currentCol === NUM_COLS - 2) {
      return COLUMN_DEFS[NUM_COLS - 1].map(r => ({ col: NUM_COLS - 1, row: r }));
    }

    // それ以外 → 現在ノードの接続先
    const conns = nodes[currentCol]?.[currentRow]?.connections || [];
    return conns.map(r => ({ col: currentCol + 1, row: r }));
  }

  // ===== ノード移動 =====
  function moveToNode(col, row) {
    if (!mapData) return null;
    const node = mapData.nodes[col]?.[row];
    if (!node) return null;
    mapData.currentCol = col;
    mapData.currentRow = row;
    node.visited = true;

    if (col === NUM_COLS - 1) {
      mapData.phase = 'boss';
    }
    return node;
  }

  function moveToBoss() {
    if (!mapData) return;
    mapData.currentCol = NUM_COLS - 1;
    mapData.currentRow = 2;
    mapData.phase      = 'boss';
  }

  function getMapData() { return mapData; }

  // ===== ユーティリティ =====
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return {
    generateMap, renderMap, getSelectableNodes,
    moveToNode, moveToBoss, getMapData,
    NODE_ICONS, NODE_LABEL,
    COLUMN_DEFS,
  };
})();
