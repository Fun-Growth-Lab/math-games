/*
 * Fun & Growth Lab 共通チュートリアルエンジン (FGLTutorial)
 *
 * 各ゲームの「🔰 チュートリアル」ボタンから使う、練習プレイ型チュートリアルの共通部品。
 *  - 実際のゲーム画面の上に、スポットライト(暗幕＋光る枠)と説明の吹き出しを重ねる
 *  - 'say'  : 説明を読んで「OK」で次へ（対象以外は触れない）
 *  - 'do'   : 実際に操作してもらい、until()が真になったら自動で次へ（対象以外は触れない）
 *  - 'run'  : 準備処理などを実行して次へ
 *  - チュートリアル中は localStorage への書き込みとPOST通信を止めるので、
 *    セーブデータ・ランキング・実績・クリア回数は一切汚れない
 *  - 終了(やめる/完了)時はページを再読み込みして、まっさらなタイトル画面に戻る
 *
 * 使い方(ゲーム側):
 *   <script src="../tutorial-engine.js"></script>
 *   FGLTutorial.begin({ root: '#container', getLang: () => currentLang });
 *   ...練習プレイを開始する処理...
 *   FGLTutorial.run([ {type:'say', target:'#hand', text:{ja:'..', easy:'..', en:'..'}}, ... ]);
 */
(function () {
    'use strict';

    const T = {};
    let cfg = { root: null, getLang: function () { return 'ja'; } };
    let rootEl = null;
    let layer = null, blockers = [], hole = null, dim = null, cap = null, capText = null,
        capBtn = null, capSkip = null, capCount = null, exitBtn = null, capWarn = null;
    const rings = [];
    let active = false;
    let steps = [], idx = 0, pollTimer = null, skipTimer = null, relayoutTimer = null;
    let origStorage = null, origFetch = null, origBeacon = null;

    const UI = {
        ok:       { ja: 'OK',            easy: 'OK',           en: 'OK' },
        skip:     { ja: 'スキップ ▶',    easy: 'スキップ ▶',   en: 'Skip ▶' },
        exit:     { ja: '✕ やめる',      easy: '✕ やめる',     en: '✕ Quit' },
        doneTitle:{ ja: '🎉 チュートリアル完了！', easy: '🎉 チュートリアルかんりょう！', en: '🎉 Tutorial Complete!' },
        doneBody: { ja: '遊び方はこれでバッチリ！さっそく本編に挑戦してみよう。',
                    easy: 'あそびかたはこれでバッチリ！さっそくほんぺんにちょうせんしてみよう。',
                    en: 'You\'ve got the basics down! Time to try the real game.' },
        doneBtn:  { ja: 'タイトルへ戻る', easy: 'タイトルへもどる', en: 'Back to Title' },
        warn:     { ja: 'ちがうよ！ 説明のとおりに、光っているところを操作してみよう！',
                    easy: 'ちがうよ！ せつめいのとおりに、ひかっているところをそうさしてみよう！',
                    en: 'Not that one! Follow the instructions and try the glowing spot.' }
    };

    function langKey() {
        let l = '';
        try { l = String(cfg.getLang() || ''); } catch (e) { l = ''; }
        l = l.toLowerCase();
        if (l.indexOf('en') === 0) return 'en';
        if (l.indexOf('easy') >= 0 || l.indexOf('simple') >= 0 || l.indexOf('kana') >= 0 || l.indexOf('hira') >= 0) return 'easy';
        return 'ja';
    }
    function pick(t) {
        if (t == null) return '';
        if (typeof t === 'string') return t;
        const k = langKey();
        return t[k] != null ? t[k] : (t.ja != null ? t.ja : '');
    }

    function injectCss() {
        if (document.getElementById('fgl-tut-css')) return;
        const s = document.createElement('style');
        s.id = 'fgl-tut-css';
        s.textContent = [
            '.fgl-tut-layer{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;z-index:2147483000;pointer-events:none;font-family:inherit;}',
            '.fgl-tut-b{position:absolute;pointer-events:auto;background:transparent;}',
            '.fgl-tut-dim{position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.55);pointer-events:none;}',
            '.fgl-tut-hole{position:absolute;border-radius:14px;pointer-events:none;box-shadow:0 0 0 6000px rgba(0,0,0,0.62), inset 0 0 0 4px #ffd24a, 0 0 22px 6px rgba(255,210,74,0.85);animation:fglTutPulse 1.3s ease-in-out infinite;}',
            '@keyframes fglTutPulse{0%,100%{box-shadow:0 0 0 6000px rgba(0,0,0,0.62), inset 0 0 0 4px #ffd24a, 0 0 14px 3px rgba(255,210,74,0.6);}50%{box-shadow:0 0 0 6000px rgba(0,0,0,0.62), inset 0 0 0 4px #fff2a8, 0 0 30px 10px rgba(255,210,74,1);}}',
            '.fgl-tut-cap{position:absolute;left:50%;transform:translateX(-50%);width:760px;max-width:94%;box-sizing:border-box;',
            'background:rgba(24,18,10,0.96);border:3px solid #ffd24a;border-radius:16px;padding:16px 28px 14px;text-align:center;',
            'box-shadow:0 6px 24px rgba(0,0,0,0.65);pointer-events:auto;color:#fff;}',
            '.fgl-tut-text{font-size:24px;font-weight:700;line-height:1.55;margin:0 0 12px;white-space:pre-line;color:#fff;}',
            '.fgl-tut-row{display:flex;justify-content:center;align-items:center;gap:14px;}',
            '.fgl-tut-btn{font-family:inherit;font-size:22px;font-weight:800;padding:8px 40px;border:none;border-radius:999px;cursor:pointer;',
            'color:#2a1a00;background:linear-gradient(180deg,#ffe27a,#ffb300);box-shadow:0 4px 0 #b37700;}',
            '.fgl-tut-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #b37700;}',
            '.fgl-tut-skip{font-family:inherit;font-size:18px;font-weight:700;padding:6px 18px;border:2px solid #aaa;border-radius:999px;cursor:pointer;color:#ddd;background:transparent;}',
            '.fgl-tut-warn{display:none;margin:0 0 10px;padding:8px 14px;border-radius:12px;background:#ff5a4a;color:#fff;font-size:22px;font-weight:800;line-height:1.4;}',
            '.fgl-tut-warn.on{display:block;animation:fglTutShake .4s ease;}',
            '@keyframes fglTutShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}',
            '.fgl-tut-cap.side{padding:14px 16px 12px;}',
            '.fgl-tut-cap.side .fgl-tut-text{font-size:20px;line-height:1.5;}',
            '.fgl-tut-cap.side .fgl-tut-warn{font-size:18px;}',
            '.fgl-tut-ring{position:absolute;box-sizing:border-box;border-radius:12px;pointer-events:none;border:4px solid #ffd24a;box-shadow:0 0 14px 4px rgba(255,210,74,0.9);animation:fglTutRing 1s ease-in-out infinite;}',
            '.fgl-tut-ring.to{border:4px dashed #ffffff;box-shadow:0 0 12px 3px rgba(255,255,255,0.8);animation:none;}',
            '@keyframes fglTutRing{0%,100%{opacity:1}50%{opacity:.45}}',
            '.fgl-tut-count{position:absolute;right:16px;top:8px;font-size:15px;color:#c9b27a;font-weight:700;}',
            '.fgl-tut-exit{position:absolute;right:14px;top:12px;pointer-events:auto;font-family:inherit;font-size:18px;font-weight:800;',
            'padding:6px 18px;border:2px solid #ffd24a;border-radius:999px;cursor:pointer;color:#ffd24a;background:rgba(24,18,10,0.92);z-index:5;}'
        ].join('');
        document.head.appendChild(s);
    }

    /* ---------- 座標計算(回転・縮小された#containerの内側でも正しく動く) ---------- */
    // 要素の見た目上の位置を、root内の「論理座標」(回転・縮小前の座標)の矩形に直す。
    // rootに0サイズの目印を3点置き、画面上の位置から逆算するので、rotate(90deg)/scale/translateが
    // どんな組み合わせでも、途中の要素のスクロール位置があっても正しく求まる。
    function mapper() {
        const W = rootEl.clientWidth, H = rootEl.clientHeight;
        function mk(x, y) {
            const p = document.createElement('div');
            p.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;width:0;height:0;visibility:hidden;pointer-events:none;';
            rootEl.appendChild(p);
            const r = p.getBoundingClientRect();
            rootEl.removeChild(p);
            return { x: r.left, y: r.top };
        }
        const p0 = mk(0, 0), p1 = mk(W, 0), p2 = mk(0, H);
        const ax = (p1.x - p0.x) / W, ay = (p1.y - p0.y) / W;   // 論理x方向1pxの画面移動量
        const bx = (p2.x - p0.x) / H, by = (p2.y - p0.y) / H;   // 論理y方向1pxの画面移動量
        const det = ax * by - ay * bx;
        return {
            W: W, H: H,
            toLogical: function (sx, sy) {
                const dx = sx - p0.x, dy = sy - p0.y;
                return { x: (dx * by - dy * bx) / det, y: (ax * dy - ay * dx) / det };
            }
        };
    }
    function elementLogicalRect(el, m) {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        const c = [m.toLogical(r.left, r.top), m.toLogical(r.right, r.top), m.toLogical(r.left, r.bottom), m.toLogical(r.right, r.bottom)];
        const xs = c.map(function (p) { return p.x; }), ys = c.map(function (p) { return p.y; });
        const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    function resolveTarget(t, m) {
        if (typeof t === 'function') t = t();
        if (!t) return null;
        if (Array.isArray(t)) {               // 複数の対象をまとめて囲む(ドラッグ元とドロップ先など)
            let u = null;
            t.forEach(function (one) {
                if (typeof one === 'function') one = one();
                if (typeof one === 'string') one = { sel: one };
                else if (one instanceof Element) one = { el: one };
                const r = resolveTarget(Object.assign({ pad: 0 }, one), m);
                if (!r) return;
                if (!u) { u = { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }; return; }
                u.x0 = Math.min(u.x0, r.x); u.y0 = Math.min(u.y0, r.y);
                u.x1 = Math.max(u.x1, r.x + r.w); u.y1 = Math.max(u.y1, r.y + r.h);
            });
            if (!u) return null;
            t = { rect: [u.x0, u.y0, u.x1 - u.x0, u.y1 - u.y0] };
        }
        if (typeof t === 'string') t = { sel: t };
        else if (t instanceof Element) t = { el: t };
        let rect = null;
        if (t.el || t.sel) {
            const el = t.el || document.querySelector(t.sel);
            if (!el) return null;
            rect = elementLogicalRect(el, m);
            if (!rect) return null;
            if (t.rect) {                     // 要素内の一部(canvasのマス等)。t.of=[要素の論理幅,論理高さ]
                const of = t.of || [el.width || rect.w, el.height || rect.h];
                const sx = rect.w / of[0], sy = rect.h / of[1];
                rect = { x: rect.x + t.rect[0] * sx, y: rect.y + t.rect[1] * sy, w: t.rect[2] * sx, h: t.rect[3] * sy };
            }
        } else if (t.rect) {
            rect = { x: t.rect[0], y: t.rect[1], w: t.rect[2], h: t.rect[3] };
        }
        if (!rect) return null;
        const pad = t.pad != null ? t.pad : 6;
        rect = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
        const x0 = Math.max(0, rect.x), y0 = Math.max(0, rect.y);
        const x1 = Math.min(m.W, rect.x + rect.w), y1 = Math.min(m.H, rect.y + rect.h);
        if (x1 <= x0 || y1 <= y0) return null;
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    /* ---------- 画面部品 ---------- */
    // ゲーム側が window の touchend で preventDefault していると、タッチ後の click が
    // 発生しなくなりボタンが押せない。そこでタッチは touchend で直接処理し、click は
    // (マウス操作用に)残す。同じ操作で二重に動かないよう直後の click は無視する
    function bindTap(btn, fn) {
        let lastTouch = 0;
        btn.addEventListener('touchend', function (e) {
            e.preventDefault(); e.stopPropagation();
            lastTouch = Date.now();
            fn();
        }, { passive: false });
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (Date.now() - lastTouch < 700) return;
            fn();
        });
    }
    function isolateTouch(el) {
        ['touchstart', 'touchmove', 'touchend'].forEach(function (n) {
            el.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true });
        });
    }
    function buildLayer() {
        if (layer) return;
        layer = document.createElement('div');
        layer.className = 'fgl-tut-layer';
        dim = document.createElement('div'); dim.className = 'fgl-tut-dim'; layer.appendChild(dim);
        hole = document.createElement('div'); hole.className = 'fgl-tut-hole'; layer.appendChild(hole);
        for (let i = 0; i < 4; i++) { const b = document.createElement('div'); b.className = 'fgl-tut-b'; layer.appendChild(b); blockers.push(b); }
        cap = document.createElement('div'); cap.className = 'fgl-tut-cap';
        capCount = document.createElement('div'); capCount.className = 'fgl-tut-count'; cap.appendChild(capCount);
        capWarn = document.createElement('div'); capWarn.className = 'fgl-tut-warn'; cap.appendChild(capWarn);
        capText = document.createElement('p'); capText.className = 'fgl-tut-text'; cap.appendChild(capText);
        const row = document.createElement('div'); row.className = 'fgl-tut-row';
        capBtn = document.createElement('button'); capBtn.className = 'fgl-tut-btn'; capBtn.type = 'button';
        bindTap(capBtn, function () { if (capBtn._cb) capBtn._cb(); });
        capSkip = document.createElement('button'); capSkip.className = 'fgl-tut-skip'; capSkip.type = 'button';
        bindTap(capSkip, function () { next(); });
        row.appendChild(capBtn); row.appendChild(capSkip); cap.appendChild(row);
        layer.appendChild(cap);
        exitBtn = document.createElement('button'); exitBtn.className = 'fgl-tut-exit'; exitBtn.type = 'button';
        bindTap(exitBtn, function () { T.exit(); });
        layer.appendChild(exitBtn);
        // 説明ボックスや暗幕へのタッチを、ゲーム本体(window等のtouchstart/move/end)に渡さない
        [cap, exitBtn].concat(blockers).forEach(isolateTouch);
        if (cfg.exitPos === 'left') { exitBtn.style.right = 'auto'; exitBtn.style.left = '14px'; }
        rootEl.appendChild(layer);
        // 画面の向き・大きさが変わったら位置を取り直す
        window.addEventListener('resize', onResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
    }
    function onResize() {
        if (!active) return;
        clearTimeout(relayoutTimer);
        relayoutTimer = setTimeout(function () { layout(); }, 120);
    }

    let curStep = null;
    function layout() {
        if (!layer || !curStep) return;
        const s = curStep;
        const m = mapper();
        let r = resolveTarget(s.target, m);
        // 手順どおりの操作(only)がある時は、押し始める場所(from)と離す場所(to)も必ず明るい穴に含める
        if (r && (s.only || (s.type === 'do' && cfg.keepClear))) {
            let extra = s.only ? rectsOf(s.only.from, m).concat(rectsOf(s.only.to, m)) : [];
            if (s.type === 'do' && cfg.keepClear) extra = extra.concat(rectsOf(cfg.keepClear, m));   // 操作させる時も、盤面など見せておきたい所は暗くしない
            let x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
            extra.forEach(function (q) {
                x0 = Math.min(x0, q.x - 6); y0 = Math.min(y0, q.y - 6);
                x1 = Math.max(x1, q.x + q.w + 6); y1 = Math.max(y1, q.y + q.h + 6);
            });
            r = { x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(m.W, x1) - Math.max(0, x0), h: Math.min(m.H, y1) - Math.max(0, y0) };
        }
        const modal = s.type === 'say' || s.block !== false;   // 'do'でも対象以外は触れないようにする
        // 暗幕・穴
        if (r) {
            dim.style.display = 'none';
            hole.style.display = 'block';
            hole.style.left = r.x + 'px'; hole.style.top = r.y + 'px'; hole.style.width = r.w + 'px'; hole.style.height = r.h + 'px';
            const rects = [
                [0, 0, m.W, r.y],
                [0, r.y + r.h, m.W, m.H - (r.y + r.h)],
                [0, r.y, r.x, r.h],
                [r.x + r.w, r.y, m.W - (r.x + r.w), r.h]
            ];
            blockers.forEach(function (b, i) {
                const q = rects[i];
                if (!modal || q[2] <= 0 || q[3] <= 0) { b.style.display = 'none'; return; }
                b.style.display = 'block';
                b.style.left = q[0] + 'px'; b.style.top = q[1] + 'px'; b.style.width = q[2] + 'px'; b.style.height = q[3] + 'px';
            });
            // 'say'では穴の中も触れないようにする(説明中に誤操作させない)
            if (s.type === 'say') { hole.style.pointerEvents = 'auto'; } else { hole.style.pointerEvents = 'none'; }
        } else {
            hole.style.display = 'none';
            dim.style.display = 'block';
            blockers.forEach(function (b, i) {
                if (i === 0 && s.type === 'say') { b.style.display = 'block'; b.style.left = '0px'; b.style.top = '0px'; b.style.width = m.W + 'px'; b.style.height = m.H + 'px'; }
                else b.style.display = 'none';
            });
        }
        // 操作する物(from)と置く先(to)に目印の枠を重ねる。光る範囲が広い(盤面も含む)時でも、どれを触るかが分かる
        rings.forEach(function (e) { e.parentNode && e.parentNode.removeChild(e); });
        rings.length = 0;
        if (r && s.type === 'do' && s.only && (s.only.from || s.only.to)) {
            const addRings = function (t, cls) {
                rectsOf(t, m).slice(0, 8).forEach(function (q) {
                    const e = document.createElement('div'); e.className = 'fgl-tut-ring' + (cls ? ' ' + cls : '');
                    e.style.left = (q.x - 3) + 'px'; e.style.top = (q.y - 3) + 'px'; e.style.width = (q.w + 6) + 'px'; e.style.height = (q.h + 6) + 'px';
                    layer.insertBefore(e, cap); rings.push(e);
                });
            };
            addRings(s.only.from, ''); addRings(s.only.to, 'to');
        }
        // 吹き出しの位置(対象と重ならない側に置く)
        // pos:'side' は、対象の左右にあいている所へ細長く置く(盤面の上も下も見せたいゲーム向け)
        cap.style.top = 'auto'; cap.style.bottom = 'auto';
        cap.style.left = '50%'; cap.style.right = 'auto'; cap.style.transform = 'translateX(-50%)'; cap.style.width = '';
        cap.classList.remove('side');
        if (s.pos === 'side' && r) {
            // keepClear(ゲーム側指定)の範囲=いつも見せておきたい所(盤面など)も避けて、左右のあきを求める
            let x0 = r.x, x1 = r.x + r.w;
            if (cfg.keepClear) rectsOf(cfg.keepClear, m).forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x + q.w); });
            const freeL = x0, freeR = m.W - x1, MARGIN = 14;
            const useLeft = freeL >= freeR, free = (useLeft ? freeL : freeR) - MARGIN * 2;
            if (free >= 230) {
                const w = Math.min(440, free);
                cap.classList.add('side');
                cap.style.transform = 'none'; cap.style.width = w + 'px';
                if (useLeft) { cap.style.left = MARGIN + 'px'; } else { cap.style.left = 'auto'; cap.style.right = MARGIN + 'px'; }
                cap.style.top = Math.max(60, (m.H - cap.offsetHeight) / 2) + 'px';   // 「やめる」ボタンを避けて縦中央
                return;
            }
        }
        const capH = cap.offsetHeight || 150;
        let atTop = false;
        if (r) {
            const spaceBelow = m.H - (r.y + r.h), spaceAbove = r.y;
            atTop = (spaceBelow < capH + 24) && (spaceAbove > spaceBelow);
        }
        if (s.pos === 'top') atTop = true; else if (s.pos === 'bottom') atTop = false;
        if (r) {   // 吹き出しが光っている所(触る場所)にかぶるなら、反対側へ逃がす
            const overlaps = function (top) { const y0 = top ? 20 : m.H - 20 - capH; return r.y < y0 + capH && r.y + r.h > y0; };
            if (overlaps(atTop) && !overlaps(!atTop)) atTop = !atTop;
        }
        if (!r && s.pos !== 'top' && s.pos !== 'bottom') {   // 対象なしは中央付近
            cap.style.top = Math.max(20, (m.H - capH) / 2) + 'px';
        } else if (atTop) { cap.style.top = '20px'; } else { cap.style.bottom = '20px'; }
    }


    /* ---------- 「手順どおりの操作だけ」を許すガード ---------- */
    // 'do' ステップに only:{ from, to, tap, hint } を書くと、
    //   from : 押し始めてよい場所(ドラッグ元・押すボタンなど)。ここ以外を押しても無視して注意を出す。{any:[対象,対象…]} でどれか1つでもOK
    //   to   : 離してよい場所(ドロップ先)。ここ以外で離すと、ゲームには「画面の外で離した」と伝えて取り消し、注意を出す
    //   upOK : (pt)=>真偽。離した位置の判定をゲーム独自にしたいとき(カードの中心がマスに入っているか等)。toより優先
    //   tap  : true なら「from を1回タップ→to を1回タップ」方式(fromとtoのどちらのタップも許す)
    //   dir  : 'right'|'left'|'up'|'down'。from から押し始めて、その向きにスワイプ(ドラッグ)する操作だけ許す(矢印キーもその向きだけ)
    //   keys : 許すキーの配列(例 ['ArrowUp'])。only のある do ステップでは、ここに無いキー操作(矢印・スペース・文字)は止める
    //   hint : 注意の文(省略時は標準文)
    // 座標は target と同じ書き方(セレクタ/Element/関数/{sel,rect,of}/{rect})。
    let bypass = false, downAt = null, downTarget = null, warnTimer = null;
    const DOWN_EV = ['mousedown', 'touchstart', 'pointerdown'];
    const UP_EV = ['mouseup', 'touchend', 'pointerup'];
    function evPoint(e) {
        if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }
    // from/to の指定(セレクタ/Element/関数/{sel,rect,of}/{any:[..]})を、root内の論理矩形の配列にする
    function rectsOf(t, m) {
        if (typeof t === 'function') t = t();
        if (!t) return [];
        if (t.any) return [].concat.apply([], t.any.map(function (x) { return rectsOf(x, m); }));
        if (typeof t === 'string') t = { sel: t };
        else if (t instanceof Element) t = { el: t };
        const r = resolveTarget(Object.assign({ pad: 0 }, t), m);
        return r ? [r] : [];
    }
    function inTarget(tgt, pt) {
        if (typeof tgt === 'function') tgt = tgt();
        if (!tgt) return false;
        if (tgt.any) return tgt.any.some(function (t) { return inTarget(t, pt); });   // どれか1つに入っていればOK
        if (typeof tgt === 'string') tgt = { sel: tgt };
        else if (tgt instanceof Element) tgt = { el: tgt };
        tgt = Object.assign({ pad: 0 }, tgt);
        const m = mapper();
        const r = resolveTarget(tgt, m);
        if (!r) return false;
        const l = m.toLogical(pt.x, pt.y);
        return l.x >= r.x && l.x <= r.x + r.w && l.y >= r.y && l.y <= r.y + r.h;
    }
    function warn(o) {
        if (!capWarn) return;
        capWarn.textContent = pick((o && o.hint) || UI.warn);
        capWarn.classList.remove('on'); void capWarn.offsetWidth; capWarn.classList.add('on');
        clearTimeout(warnTimer);
        warnTimer = setTimeout(function () { capWarn.classList.remove('on'); }, 3200);
        layout();
    }
    function block(e) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }
    // ゲームに「x,y で離した」と伝える。既定は画面のはるか外(=ドロップ先なしで取り消し)。
    // 離す座標だけでなく、その前の移動位置で相手を決めるゲームもあるので、先に移動も送る
    function releaseAt(e, x, y) {
        if (x == null) { x = -5000; y = -5000; }
        bypass = true;
        try {
            // 押し始めた要素に送る(暗幕の上で離しても、ゲーム側の canvas 等がちゃんと受け取れるように)
            const tgt = (downTarget && downTarget.isConnected) ? downTarget : e.target, off = { clientX: x, clientY: y, screenX: x, screenY: y };
            const evs = [];
            if (e.type === 'touchend') {
                const t0 = e.changedTouches[0];
                const mk = function () { return new Touch({ identifier: t0.identifier, target: tgt, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y }); };
                evs.push(new TouchEvent('touchmove', { bubbles: true, cancelable: true, changedTouches: [mk()], touches: [mk()], targetTouches: [mk()] }));
                evs.push(new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [mk()], touches: [], targetTouches: [] }));
            } else if (e.type === 'pointerup') {
                const po = Object.assign({ bubbles: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary, button: e.button }, off);
                evs.push(new PointerEvent('pointermove', po));
                evs.push(new PointerEvent('pointerup', po));
            } else {
                const mo = Object.assign({ bubbles: true, cancelable: true, button: 0 }, off);
                evs.push(new MouseEvent('mousemove', mo));
                evs.push(new MouseEvent('mouseup', mo));
            }
            evs.forEach(function (ev) { tgt.dispatchEvent(ev); });
        } catch (err) { console.error(err); }
        bypass = false;
    }
    // 画面上の移動(dx,dy)を、root内の論理座標での向き(right/left/up/down)に直す(回転表示でも正しい)。短すぎれば null
    function swipeDir(from, to) {
        const m = mapper(), a = m.toLogical(from.x, from.y), b = m.toLogical(to.x, to.y);
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return null;
        return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    // 離した後もしばらく(pointerup→touchend→mouseupと続けて届く分)は覚えておき、少ししたら忘れる
    function endPress() { const tok = downAt; if (tok) setTimeout(function () { if (downAt === tok) downAt = null; }, 700); }
    function guardEvent(e) {
        if (bypass || !active || !curStep || curStep.type !== 'do') return;
        const t = e.type, isDown = DOWN_EV.indexOf(t) >= 0, isUp = UP_EV.indexOf(t) >= 0;
        const onBlocker = e.target && e.target.classList && e.target.classList.contains('fgl-tut-b');
        const o = curStep.only, pt = evPoint(e);
        if (layer && e.target instanceof Node && layer.contains(e.target) && !onBlocker) {
            if (e.target.closest && e.target.closest('button')) return;     // OK/スキップ/やめるボタンは対象外
            // 説明ボックスの上: 押すだけなら無視。ドラッグ中にここで離したら、暗い所で離したのと同じ(取り消し)
            if (isUp && downAt) { block(e); releaseAt(e); warn(o); endPress(); }
            else if (isDown) downAt = null;
            return;
        }
        if (onBlocker) {                                          // 暗い部分の操作
            if (isDown) { downAt = null; block(e); warn(o); return; }
            if (isUp && downAt) { block(e); releaseAt(e); warn(o); endPress(); return; }   // 光っている所で押して、暗い所で離した → 取り消し
            return;
        }
        if (!o) { if (isDown) { downAt = pt; downTarget = e.target; } else if (isUp) endPress(); return; }
        const okFrom = !o.from || inTarget(o.from, pt);
        const okTo = !o.to || inTarget(o.to, pt);
        if (isDown) {
            if (okFrom || (o.tap && okTo)) { downAt = pt; downTarget = e.target; return; }
            downAt = null; block(e); warn(o);
        } else if (t === 'click') {
            if (okFrom || okTo) return;
            block(e); warn(o);
        } else if (isUp) {
            if (!downAt) return;                                  // 押し始めが許されなかった操作の「離す」
            if (o.dir) {                                          // スワイプ: 向きが違えば「動かさずに離した」ことにして取り消す
                const d = swipeDir(downAt, pt);
                if (d === null || d === o.dir) { endPress(); return; }
                block(e); releaseAt(e, downAt.x, downAt.y); warn(o); endPress();
                return;
            }
            const okUp = o.upOK ? !!o.upOK(pt) : okTo;             // upOK: ゲーム独自の判定(カードの中心が入っているか等)があればそれを優先
            if (o.tap ? (okFrom || okUp) : okUp) { endPress(); return; }   // 正しい場所で離した
            if (!o.to && !o.upOK && !o.tap) { endPress(); return; }
            block(e); releaseAt(e); warn(o); endPress();
        }
    }
    const ARROW_DIR = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' };
    function guardKey(e) {
        if (bypass || !active || !curStep || curStep.type !== 'do' || !curStep.only) return;
        const o = curStep.only, k = e.key;
        if (!(k === ' ' || k === 'Enter' || k.length === 1 || ARROW_DIR[k])) return;   // 修飾キーやF5などは触らない
        const ok = o.keys ? o.keys.indexOf(k) >= 0 : (o.dir ? ARROW_DIR[k] === o.dir : false);
        if (!ok) { block(e); warn(o); }
    }
    function installGuard() {
        window.addEventListener('keydown', guardKey, { capture: true });
        DOWN_EV.concat(UP_EV, ['click']).forEach(function (n) {
            window.addEventListener(n, guardEvent, { capture: true, passive: false });
        });
    }

    /* ---------- 進行 ---------- */
    function clearTimers() {
        clearInterval(pollTimer); pollTimer = null;
        clearTimeout(skipTimer); skipTimer = null;
    }
    function next() { clearTimers(); idx++; showStep(); }

    function showStep() {
        if (!active) return;
        const s = steps[idx];
        if (!s) { finishSteps(); return; }
        curStep = null;
        if (s.type === 'run') {
            let p; try { p = s.fn && s.fn(); } catch (e) { console.error(e); }
            Promise.resolve(p).then(function () { next(); });
            return;
        }
        if (s.type === 'wait') { skipTimer = setTimeout(next, s.ms || 500); return; }
        const go = function () {
            if (!active) return;
            curStep = s;
            buildLayer();
            layer.style.display = 'block';
            exitBtn.textContent = pick(UI.exit);
            capText.textContent = pick(s.text);
            capWarn.classList.remove('on'); downAt = null;
            capCount.textContent = s.noCount ? '' : (s.no || '');
            if (s.type === 'say') {
                capBtn.style.display = ''; capBtn.textContent = pick(s.btn || UI.ok);
                capBtn._cb = function () { if (s.after) { try { s.after(); } catch (e) { console.error(e); } } next(); };
                capSkip.style.display = 'none';
            } else { // do
                capBtn.style.display = 'none'; capBtn._cb = null;
                capSkip.style.display = 'none'; capSkip.textContent = pick(UI.skip);
                skipTimer = setTimeout(function () { capSkip.style.display = ''; }, s.skipAfter != null ? s.skipAfter : 9000);
                pollTimer = setInterval(function () {
                    let ok = false; try { ok = s.until && s.until(); } catch (e) { ok = false; }
                    if (ok) { if (s.after) { try { s.after(); } catch (e) { console.error(e); } } next(); }
                }, 150);
            }
            layout();
            setTimeout(layout, 60);   // 文字が入って吹き出しの高さが確定してからもう一度
        };
        if (s.before) { let p; try { p = s.before(); } catch (e) { console.error(e); } Promise.resolve(p).then(function () { setTimeout(go, s.delay || 0); }); }
        else if (s.delay) setTimeout(go, s.delay); else go();
    }

    function finishSteps() {
        clearTimers();
        curStep = null;
        const cb = steps._onFinish;
        if (cb) { try { cb(); } catch (e) { console.error(e); } return; }
        T.complete();
    }

    /* ---------- 公開API ---------- */
    // チュートリアル開始の準備(書き込みガード・root設定)
    T.begin = function (opts) {
        cfg = { root: opts.root, getLang: opts.getLang || cfg.getLang, exitPos: opts.exitPos || 'right', keepClear: opts.keepClear || null };
        rootEl = (typeof opts.root === 'string') ? document.querySelector(opts.root) : opts.root;
        if (!rootEl) { console.error('FGLTutorial: root not found'); return; }
        injectCss();
        if (active) return;
        active = true;
        // 書き込みガード：セーブ・ランキング・実績などを一切汚さない
        origStorage = { set: Storage.prototype.setItem, rem: Storage.prototype.removeItem, clr: Storage.prototype.clear };
        Storage.prototype.setItem = function () {};
        Storage.prototype.removeItem = function () {};
        Storage.prototype.clear = function () {};
        origFetch = window.fetch;
        window.fetch = function (u, o) {
            if (o && o.method && String(o.method).toUpperCase() !== 'GET') {
                return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
            }
            return origFetch.apply(this, arguments);
        };
        if (navigator.sendBeacon) { origBeacon = navigator.sendBeacon; navigator.sendBeacon = function () { return true; }; }
        window.__fglTutorialActive = true;
        installGuard();
    };
    T.isActive = function () { return active; };
    // ステップ列を実行する。opts.onFinish を渡すと、最後に標準の完了表示の代わりに呼ばれる。
    T.run = function (list, opts) {
        if (!active) return;
        steps = list.slice();
        steps._onFinish = opts && opts.onFinish;
        // ステップ番号(say/doのみ)を振る
        let total = 0; steps.forEach(function (s) { if (s.type === 'say' || s.type === 'do') total++; });
        let n = 0; steps.forEach(function (s) { if (s.type === 'say' || s.type === 'do') { n++; s.no = n + '/' + total; } });
        idx = 0;
        showStep();
    };
    // 練習を続けたまま説明だけ差し込みたい時の単発表示
    T.say = function (text, target, cb) {
        T.run([{ type: 'say', target: target, text: text, after: cb }], { onFinish: function () { T.hide(); } });
    };
    T.hide = function () { clearTimers(); curStep = null; rings.forEach(function (e) { e.style.display = 'none'; }); if (layer) layer.style.display = 'none'; };
    T.complete = function (msg) {
        clearTimers();
        buildLayer();
        layer.style.display = 'block';
        curStep = { type: 'say', target: null, pos: 'middle', text: null };
        capText.textContent = pick((msg && msg.title) || UI.doneTitle) + '\n' + pick((msg && msg.body) || UI.doneBody);
        capCount.textContent = '';
        capBtn.style.display = ''; capBtn.textContent = pick((msg && msg.btn) || UI.doneBtn);
        capBtn._cb = function () { T.exit(); };
        capSkip.style.display = 'none';
        exitBtn.style.display = 'none';
        layout();
    };
    T.exit = function () {
        // 状態をまっさらにするため、ページを再読み込みしてタイトルへ戻る
        location.reload();
    };
    // ゲーム側から使う補助
    T.wait = function (fn, timeout) {
        return new Promise(function (res) {
            const t0 = Date.now();
            const iv = setInterval(function () {
                let ok = false; try { ok = fn(); } catch (e) { ok = false; }
                if (ok || (timeout && Date.now() - t0 > timeout)) { clearInterval(iv); res(); }
            }, 100);
        });
    };
    // ゲーム側の独自ガードから「ちがうよ」の注意を出したいとき用(hint省略で標準文)
    T.warn = function (hint) { if (curStep && curStep.type === 'do') warn({ hint: hint || (curStep.only && curStep.only.hint) }); };
    T.relayout = layout;
    T.pick = pick;

    window.FGLTutorial = T;
})();
