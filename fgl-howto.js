// 「あそびかた」の共通部品。横長のカードを 上から順に 1列(番号・本物の画面の切りぬき・短い説明)。縦スクロールなし。
//   <script src="../fgl-howto.js?v=1"></script>
//   FGLHowto.open({
//       lang: 'ja' | 'simple' | 'en',          // 'ja_easy' / 'easy' / 'kana' なども simple あつかい
//       root: 要素(省略時は body に 画面いっぱいで出す。1280x720 の舞台を拡大縮小しているゲームは その舞台を わたす),
//       accent: '#色'(わく・題名の色), artBg: 'CSSのbackground'(絵のところ。省略時は こい紺), opColor: '#色'(▶ + = の色),
//       rows: [{ c: '#行の色', art: '絵のHTML', t: {ja,simple,en} か 文字, b: {ja,simple,en} か 文字 }],   // b の中の <em>…</em> は強調
//       onClose: () => {}
//   });
//   FGLHowto.img('パス', 最大の高さpx, 'style追加') … 絵の <img>(横幅は 絵のところに おさまるよう ちぢむ)
//   FGLHowto.op('▶') … 絵と絵の あいだの記号
//   FGLHowto.sprite('パス', 大きさpx, 横コマ数, 縦コマ数) … スプライトシートの 左上1コマ
//   FGLHowto.preload(['パス', ...]) … はじめて ひらいたときに 絵が 空にならないよう 先に読みこむ
(function () {
    const TITLE = { ja: 'あそびかた', simple: 'あそびかた', en: 'How to Play' };
    const CLOSE = { ja: 'とじる', simple: 'とじる', en: 'Close' };
    function norm(l) { return l === 'en' ? 'en' : (l === 'ja' || !l) ? 'ja' : 'simple'; }
    function pick(v, l) { if (v == null) return ''; if (typeof v !== 'object') return String(v); return v[l] != null ? v[l] : (v.simple != null && l !== 'en' ? v.simple : (v.ja != null ? v.ja : '')); }
    function style() {
        if (document.getElementById('fgh-style')) return;
        const s = document.createElement('style');
        s.id = 'fgh-style';
        s.textContent = `
.fgh-ov{position:fixed;inset:0;z-index:9800;display:flex;align-items:center;justify-content:center;background:rgba(8,14,40,.62);font-family:"M PLUS Rounded 1c","Zen Maru Gothic",sans-serif;animation:fgh-in .18s ease-out}
.fgh-ov.in-root{position:absolute}
@keyframes fgh-in{from{opacity:0}to{opacity:1}}
.fgh-box{position:relative;box-sizing:border-box;width:94%;max-width:1196px;height:94%;max-height:684px;padding:10px 18px 14px;border-radius:24px;display:flex;flex-direction:column;
  background:linear-gradient(170deg,#fffdf8,color-mix(in srgb,var(--fa) 14%,#fff));border:5px solid var(--fa);box-shadow:0 8px 0 color-mix(in srgb,var(--fa) 70%,#000),0 24px 50px rgba(0,0,0,.4);text-align:left;line-height:normal;letter-spacing:normal}
.fgh-head{flex:none;height:46px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:1.85rem;font-weight:900;letter-spacing:4px;color:color-mix(in srgb,var(--fa) 75%,#000)}
.fgh-head svg{width:34px;height:34px}
.fgh-x{position:absolute;top:10px;right:14px;width:44px;height:44px;border-radius:50%;padding:0;margin:0;background:#fff;border:3px solid color-mix(in srgb,var(--fa) 45%,#fff);color:color-mix(in srgb,var(--fa) 70%,#000);font:900 1.35rem/1 sans-serif;cursor:pointer;box-shadow:0 3px 0 color-mix(in srgb,var(--fa) 40%,#fff)}
.fgh-list{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
.fgh-row{flex:1;min-height:0;display:grid;grid-template-columns:58px 400px 1fr;align-items:stretch;background:#fff;border:4px solid var(--hc);border-radius:18px;overflow:hidden;box-shadow:0 4px 0 var(--hc)}
.fgh-no{display:flex;align-items:center;justify-content:center;background:var(--hc);color:#fff;font-size:2rem;font-weight:900;text-shadow:0 2px 0 rgba(0,0,0,.25)}
.fgh-art{display:flex;align-items:center;justify-content:center;gap:8px;padding:0 10px;min-width:0;overflow:hidden;background:var(--fart)}
.fgh-im{display:block;width:auto;height:auto;max-width:100%;min-width:0;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
.fgh-op{color:var(--fop);font-weight:900;font-size:1.6rem;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.fgh-res{background:#ffc93d;color:#5a3d00;font-weight:900;font-size:1.6rem;padding:2px 14px;border-radius:14px;border:3px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.3);white-space:nowrap}
.fgh-sp{display:inline-block;flex:none;background-repeat:no-repeat;background-position:0 0;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
.fgh-emo{font-size:2.3rem;line-height:1;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3))}
.fgh-tx{display:flex;flex-direction:column;justify-content:center;padding:2px 20px;min-width:0}
.fgh-t{font-size:1.45rem;font-weight:900;line-height:1.25;color:color-mix(in srgb,var(--hc) 82%,#000);word-break:keep-all}
.fgh-b{font-size:1.2rem;font-weight:700;line-height:1.4;color:#3a3550;word-break:keep-all;overflow-wrap:anywhere}
.fgh-b em,.fgh-t em{font-style:normal;font-weight:900;color:color-mix(in srgb,var(--hc) 80%,#000);background:linear-gradient(transparent 62%,color-mix(in srgb,var(--hc) 24%,transparent) 62%)}
@media (max-width:900px),(max-height:520px){.fgh-row{grid-template-columns:40px 38% 1fr}.fgh-head{height:34px;font-size:1.3rem}.fgh-t{font-size:1.05rem}.fgh-b{font-size:.86rem;line-height:1.3}.fgh-no{font-size:1.4rem}.fgh-box{padding:6px 10px 10px}.fgh-list{gap:5px}.fgh-tx{padding:2px 10px}}`;
        document.head.appendChild(s);
    }
    const BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/></svg>';
    let cur = null;
    function close() {
        if (!cur) return;
        const c = cur; cur = null;
        c.el.remove(); document.removeEventListener('keydown', c.key, true);
        if (c.onClose) c.onClose();
    }
    function open(o) {
        style(); close();
        const l = norm(o.lang);
        const el = document.createElement('div');
        el.className = 'fgh-ov' + (o.root ? ' in-root' : '');
        el.style.setProperty('--fa', o.accent || '#3fa9e0');
        el.style.setProperty('--fart', o.artBg || 'radial-gradient(ellipse at 50% 40%,#2c3f7a,#141d40)');
        el.style.setProperty('--fop', o.opColor || '#ffe08a');
        const rows = (o.rows || []).map((r, i) => `<div class="fgh-row" style="--hc:${r.c}"><div class="fgh-no">${i + 1}</div><div class="fgh-art">${typeof r.art === 'function' ? r.art() : (r.art || '')}</div><div class="fgh-tx"><div class="fgh-t">${pick(r.t, l)}</div><div class="fgh-b">${pick(r.b, l)}</div></div></div>`).join('');
        el.innerHTML = `<div class="fgh-box" role="dialog" aria-modal="true"><div class="fgh-head">${BOOK}<b>${pick(o.title || TITLE, l)}</b></div><button type="button" class="fgh-x" aria-label="${pick(CLOSE, l)}">✕</button><div class="fgh-list">${rows}</div></div>`;
        el.addEventListener('click', e => { if (e.target === el || e.target.closest('.fgh-x')) close(); });
        const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        document.addEventListener('keydown', key, true);
        (o.root || document.body).appendChild(el);
        cur = { el, key, onClose: o.onClose };
        return el;
    }
    const img = (src, h, extra) => `<img class="fgh-im" src="${src}" style="max-height:${h}px${extra ? ';' + extra : ''}" alt="">`;
    const op = t => `<span class="fgh-op">${t}</span>`;
    const res = t => `<span class="fgh-res">${t}</span>`;
    const emo = t => `<span class="fgh-emo">${t}</span>`;
    // スプライトシート(cols×rows コマ)の 左上の1コマだけを 出す
    const sprite = (src, size, cols, rows) => `<span class="fgh-sp" style="width:${size}px;height:${size}px;background-image:url('${src}');background-size:${(cols || 2) * 100}% ${(rows || 2) * 100}%"></span>`;
    function preload(list) { setTimeout(() => (list || []).forEach(s => { const i = new Image(); i.src = s; }), 800); }
    window.FGLHowto = { open, close, isOpen: () => !!cur, img, op, res, emo, sprite, preload };
})();
