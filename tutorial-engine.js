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
        capBtn = null, capSkip = null, capCount = null, exitBtn = null;
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
        doneBtn:  { ja: 'タイトルへ戻る', easy: 'タイトルへもどる', en: 'Back to Title' }
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
        const r = resolveTarget(s.target, m);
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
        // 吹き出しの位置(対象と重ならない側に置く)
        cap.style.top = 'auto'; cap.style.bottom = 'auto';
        const capH = cap.offsetHeight || 150;
        let atTop = false;
        if (r) {
            const spaceBelow = m.H - (r.y + r.h), spaceAbove = r.y;
            atTop = (spaceBelow < capH + 24) && (spaceAbove > spaceBelow);
        }
        if (s.pos === 'top') atTop = true; else if (s.pos === 'bottom') atTop = false;
        if (!r && s.pos !== 'top' && s.pos !== 'bottom') {   // 対象なしは中央付近
            cap.style.top = Math.max(20, (m.H - capH) / 2) + 'px';
        } else if (atTop) { cap.style.top = '20px'; } else { cap.style.bottom = '20px'; }
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
        cfg = { root: opts.root, getLang: opts.getLang || cfg.getLang, exitPos: opts.exitPos || 'right' };
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
    T.hide = function () { clearTimers(); curStep = null; if (layer) layer.style.display = 'none'; };
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
    T.relayout = layout;
    T.pick = pick;

    window.FGLTutorial = T;
})();
