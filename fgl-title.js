// Fun & Growth Lab 共通のタイトル画面(見た目の型)。使い方は各ゲームのhtmlの末尾を見てください。
// 既存のタイトル画面(host)の上に重ねて出す。ボタンは裏の本物のボタンを .click() で押すだけなので、ゲームの動きは変わらない。
//   FGLTitle.mount({
//     host: '#title-screen',                 // 既存のタイトル画面(この中に重ねる)
//     hue: 200,                              // 色相(ロゴのふち・サブボタンの色)
//     bg: 'linear-gradient(...)' ,           // 背景(省略すると、ホストのもとの背景(イラスト)をそのまま使う)
//     tag: 'FUN & GROWTH LAB',               // いちばん上の小さな字
//     name: { ja:'..', simple:'..', en:'..' }, // 大きな題名
//     sub:  { ja:'..', simple:'..', en:'..' }, // 題名の下の小さな説明(何のゲームかを一言で)
//     cards: ['3','7','10','9','6'], gold: 2, op: '＋',   // 主役のカードの扇(省略可)。まん中の金のカードが「答え」
//     lang: () => currentLang,               // 'ja' | 'simple' | 'en'
//     fill: true,                            // ホストの中身がぜんぶ absolute で、ホスト自身の高さが0になるとき
//     hide: ['.title-box'],                  // もとのタイトルで かくす部分(省略するとホストの中身ぜんぶ)
//     buttons: { start: '#btn-start'(関数でもよい: 「つづきから」があるときに切りかえる), row: [{ sel: '#btn-tutorial', ico: 'help' }, ...] }
//   });
(function () {
    const svg = (b) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>';
    const ICO = {
        help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.3 9.5a2.7 2.7 0 1 1 3.8 2.5c-.8.4-1.1 1-1.1 1.8"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>'),
        trophy: svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M12 14v4M8 21h8M9.5 18h5"/>'),
        gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
        user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
        play: svg('<path d="M7 4.5l12 7.5-12 7.5z"/>'),
        star: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
        home: svg('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')
    };
    const strip = (t) => String(t || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
    const pick = (o, lang) => (o && typeof o === 'object') ? (o[lang] !== undefined ? o[lang] : (lang === 'simple' && o.ja !== undefined ? o.ja : (o.ja !== undefined ? o.ja : ''))) : (o || '');

    function ensureFont() {
        if (document.getElementById('fgt-font')) return;
        const l = document.createElement('link');
        l.id = 'fgt-font'; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800;900&display=swap';
        document.head.appendChild(l);
    }

    window.FGLTitle = {
        mount: function (cfg) {
            ensureFont();
            const host = document.querySelector(cfg.host);
            if (!host) return null;
            host.classList.add('fgt-host');
            if (cfg.fill) { host.style.position = 'absolute'; host.style.inset = '0'; }   // ホストが大きさを持たないとき(中身がぜんぶ absolute)、親いっぱいに広げる
            else if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
            // もとのタイトルの見出し・ボタンはかくす(押すのは裏から)。hide を決めると、その部分だけかくす(ホストの中に別のポップアップがあるとき)
            const hideEls = cfg.hide ? [].concat.apply([], cfg.hide.map(s => Array.from(document.querySelectorAll(s)))) : [];
            const root = document.createElement('div');
            root.className = 'fgt fgt-in';
            root.style.setProperty('--fh', cfg.hue === undefined ? 200 : cfg.hue);
            if (cfg.title && typeof FH !== 'undefined' && FH.applyTitleColors) FH.applyTitleColors(root, cfg.title);   // 題名の色(FH.PAL のどれか)
            const lang = () => { try { return cfg.lang ? (cfg.lang() || 'ja') : 'ja'; } catch (e) { return 'ja'; } };
            const hero = cfg.cards ? (function () {
                const gold = cfg.gold === undefined ? 2 : cfg.gold, cards = cfg.cards;
                const maxLen = Math.max.apply(null, cards.map(c => String(c).replace(/<[^>]*>/g, '').length)), step = maxLen >= 3 ? 112 : 96;
                return '<div class="fgt-hero">' + cards.map(function (c, i) {
                    const k = i - 2, len = String(c).replace(/<[^>]*>/g, '').length, isFr = /class="fr"/.test(c);
                    const fs0 = isFr ? 4 : len === 1 ? 7.2 : len === 2 ? 5.8 : len === 3 ? 4 : 3.6;
                    const fs = (k === 0 ? fs0 * (isFr ? 1.08 : len === 1 ? 1.1 : 1.3) : fs0).toFixed(2);
                    return '<div class="fgt-card' + (i === gold ? ' gold' : '') + (k < 0 ? ' l' : k > 0 ? ' r' : '') + '" style="--r:' + (k * 12) + 'deg;--x:' + (k * step) + 'px;--y:' + (Math.abs(k) * 22 + (k === 0 ? 0 : 6)) + 'px;z-index:' + (10 - Math.abs(k)) + ';--fs:' + fs + 'rem"><b>' + c + '</b></div>';
                }).join('') + '<div class="fgt-op">' + (cfg.op || '＋') + '</div></div>';
            })() : (cfg.heroHTML ? '<div class="hv-layer">' + (typeof cfg.heroHTML === 'function' ? cfg.heroHTML() : cfg.heroHTML) + '</div>' : '');
            root.innerHTML = (cfg.bg ? '<div class="fgt-bg" style="background:' + cfg.bg + '"></div>' : '') + '<div class="fgt-shade"></div><div class="fgt-stage">'
                + '<div class="fgt-tag"></div><div class="fgt-name"></div><div class="fgt-sub"><span></span></div>' + hero
                + '<div class="fgt-menu"><button class="fgt-btn primary"></button><div class="fgt-row"></div></div></div>';
            host.appendChild(root);
            const stage = root.querySelector('.fgt-stage'), nameEl = root.querySelector('.fgt-name'), subEl = root.querySelector('.fgt-sub'), tagEl = root.querySelector('.fgt-tag');
            const startBtn = root.querySelector('.fgt-btn.primary'), rowEl = root.querySelector('.fgt-row');
            // 押し方: セレクタ(裏の本物のボタンを click) か、{canvas, bw, bh, x, y}(canvasに描かれたボタンを、その座標で クリックしたことにする)
            const press = (spec0) => () => {
                const spec = typeof spec0 === 'function' ? spec0() : spec0;
                if (typeof spec === 'string') { const el = document.querySelector(spec); if (el) el.click(); return; }
                if (spec && spec.sel) {   // {sel, down:true} = mousedown/touchstart で動くボタン(clickでは反応しない)
                    const el = document.querySelector(spec.sel); if (!el) return;
                    if (spec.down) ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach(t => el.dispatchEvent(new (t.indexOf('pointer') === 0 && window.PointerEvent ? PointerEvent : MouseEvent)(t, { bubbles: true, cancelable: true, view: window, button: 0 })));
                    else el.click();
                    return;
                }
                if (spec && spec.canvas) {
                    const cv = document.querySelector(spec.canvas); if (!cv) return;
                    const r = cv.getBoundingClientRect();
                    let cx, cy;
                    if ((spec.bw > spec.bh) !== (r.width > r.height)) {   // 縦持ちスマホで canvas が90度回って表示されているとき
                        const k = r.height / spec.bw;
                        cx = r.left + r.width / 2 - (spec.y - spec.bh / 2) * k; cy = r.top + r.height / 2 + (spec.x - spec.bw / 2) * k;
                    } else { cx = r.left + spec.x / spec.bw * r.width; cy = r.top + spec.y / spec.bh * r.height; }
                    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
                        const Ev = t.indexOf('pointer') === 0 && window.PointerEvent ? PointerEvent : MouseEvent;
                        cv.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window, button: 0, pointerType: 'mouse' }));
                    });
                }
            };
            const specSel = (spec) => { if (typeof spec === 'function') spec = spec(); return typeof spec === 'string' ? spec : (spec && spec.sel) || null; };
            const labelOf = (b, el) => b.label ? b.label() : strip(el.textContent);
            startBtn.addEventListener('click', press(cfg.buttons.start));
            const minis = (cfg.buttons.row || []).map(function (b) {
                const el = document.createElement('button');
                el.className = 'fgt-btn mini' + (b.cls ? ' ' + b.cls : '');
                el.innerHTML = '<span class="ic">' + (ICO[b.ico] || '') + '</span><span class="lb"></span>';
                el.addEventListener('click', press(b.canvas || b.down ? b : b.sel));
                rowEl.appendChild(el);
                return { el: el, b: b, lb: el.querySelector('.lb') };
            });
            let lastLang = null, lastVis = null;
            function build() {
                const lg = lang();
                tagEl.textContent = cfg.tag || '';
                const text = String(pick(cfg.name, lg));
                if (nameEl._t !== text) {
                    nameEl._t = text;
                    const units = Array.from(text).reduce((a, ch) => a + (/[\x20-\x7e]/.test(ch) ? 0.56 : 1.0), 0);
                    const fs = Math.max(44, Math.min((cfg.cards || cfg.heroHTML) ? 120 : 132, Math.floor(1040 / (units + 0.4))));
                    nameEl.style.fontSize = fs + 'px';
                    nameEl.innerHTML = Array.from(text).map((ch, i) => ch === ' ' ? '<span class="fgt-sp"></span>' : '<span class="fgt-l" data-t="' + ch + '" style="--i:' + (i + 2) + '">' + ch + '</span>').join('');
                    subEl.style.top = (46 + fs + 8) + 'px';
                }
                const sub = String(pick(cfg.sub, lg));
                subEl.firstChild.textContent = sub; subEl.style.display = sub ? '' : 'none';
            }
            function sync() {
                const lg = lang();
                if (lg !== lastLang) { lastLang = lg; build(); }
                const ss = specSel(cfg.buttons.start), sb = ss && document.querySelector(ss);
                if (cfg.buttons.startLabel) startBtn.textContent = cfg.buttons.startLabel();
                else if (sb) startBtn.textContent = strip(sb.textContent);
                minis.forEach(function (m) {
                    if (m.b.canvas) { m.lb.textContent = m.b.label ? m.b.label() : ''; return; }
                    const el = document.querySelector(m.b.sel);
                    const show = !!el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden') && (!m.b.when || m.b.when()) && (el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
                    m.el.classList.toggle('hide', !show);
                    if (el) m.lb.textContent = labelOf(m.b, el);
                });
                let vis;
                if (cfg.visible) { try { vis = !!cfg.visible(); } catch (e) { vis = false; } }
                else if (cfg.watch) { const w = document.querySelector(cfg.watch); vis = !!w && w.offsetParent !== null && !w.classList.contains('hidden'); }
                else vis = host.offsetParent !== null || getComputedStyle(host).position === 'fixed';
                root.style.display = vis ? '' : 'none';
                hideEls.forEach(e => e.classList.toggle('fgt-hide', vis));
                if (!cfg.hide) host.classList.toggle('fgt-all', vis);
                if (vis && lastVis === false) { root.classList.remove('fgt-in'); void root.offsetWidth; root.classList.add('fgt-in'); }
                lastVis = vis;
            }
            function fit() {
                const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
                const k = Math.min(w / 1280, h / 720);
                stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
            }
            fit(); sync();
            document.documentElement.classList.add('fgt-ready');   // 起動前に仕込んだ「もとの画面をかくす」指定(head の #fgt-pre)を解除
            if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
            setInterval(sync, 350);
            return root;
        }
    };
})();
