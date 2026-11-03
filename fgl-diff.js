// Fun & Growth Lab 共通: 難易度えらびの画面(全画面に大きなカード3枚)。
// 今までの難易度画面が出たら、その上にかぶせて表示する。押すと今までのボタンを押すので、ゲームの処理は変わらない。
// 文字は今までのボタンから読むので、言語の切りかえもそのまま効く(1行目=名前、2行目=説明)。
//   FGLDiff.mount({
//     host: '#container',            // かぶせる先(1280x720 の入れ物)
//     watch: '#difficulty-menu',     // この要素が見えているあいだ表示する
//     bg: "url('title_parts/key.webp')",  // 背景
//     veil: 'rgba(8,16,44,.55)',     // 背景にかぶせる色(ゲームの色に合わせる)
//     prompt: '#difficulty-menu p',  // 見出しの文字をここから読む(または prompt: () => '文字')
//     back: '#btn-back-to-menu',     // もどるボタン
//     scale: 1,                      // 入れ物が1280pxでないときの倍率
//     cards: [{ btn: '#btn-easy', stars: 1, color: '#2fb872', art: FGLDiff.grid(3), sub: () => '文字', note: () => '👑 3回' }, ...]
//   });
window.FGLDiff = (function () {
    function css() {
        if (document.getElementById('fgd-style')) return;
        const s = document.createElement('style'); s.id = 'fgd-style';
        s.textContent =
            '.fgd{position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;z-index:9000;display:none;flex-direction:column;align-items:center;justify-content:center;font-family:"M PLUS Rounded 1c",sans-serif;overflow:hidden;background-size:cover;background-position:center}' +
            '.fgd.on{display:flex}' +
            '.fgd-veil{position:absolute;inset:0}' +
            '.fgd-title{position:relative;font-size:2.7rem;font-weight:900;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.45),0 6px 16px rgba(0,0,0,.45);margin-bottom:30px;text-align:center}' +
            '.fgd-cards{position:relative;display:flex;gap:30px}' +
            '.fgd-card{position:relative;width:340px;height:420px;padding:0;border:0;border-radius:30px;background:#fff;cursor:pointer;font-family:inherit;color:#3a3550;display:flex;flex-direction:column;align-items:center;overflow:hidden;box-shadow:0 10px 0 var(--c2),0 18px 30px rgba(0,0,0,.35);transition:transform .12s;-webkit-tap-highlight-color:transparent}' +
            '.fgd-card:hover{transform:translateY(-8px)}' +
            '.fgd-card:active{transform:translateY(6px);box-shadow:0 4px 0 var(--c2),0 8px 16px rgba(0,0,0,.35)}' +
            '.fgd-head{width:100%;background:var(--c);padding:18px 8px 16px;color:#fff;font-size:2.3rem;font-weight:900;letter-spacing:2px;text-shadow:0 2px 0 rgba(0,0,0,.22);white-space:nowrap}' +
            '.fgd-stars{margin-top:16px;font-size:2.2rem;letter-spacing:6px;line-height:1;color:var(--c)}' +
            '.fgd-stars i{font-style:normal;color:#e4e1ec}' +
            '.fgd-art{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center}' +
            '.fgd-sub{font-size:1.5rem;font-weight:900;padding:0 12px;line-height:1.25;text-align:center}' +
            '.fgd-note{font-size:1.1rem;font-weight:800;color:#8a8499;margin:4px 0 16px;min-height:1.4em}' +
            '.fgd-back{position:relative;margin-top:34px;width:230px;height:62px;border:0;border-radius:31px;background:#fff;color:#4a4560;font-family:inherit;font-size:1.5rem;font-weight:900;cursor:pointer;box-shadow:0 6px 0 #b9b5c8,0 10px 18px rgba(0,0,0,.3)}' +
            '.fgd-back:active{transform:translateY(4px);box-shadow:0 2px 0 #b9b5c8}' +
            '.fgd-grid{display:grid;gap:5px;width:132px;height:132px}' +
            '.fgd-grid i{background:var(--c);opacity:.28;border-radius:5px}' +
            '.fgd-grid i:nth-child(3n+1){opacity:.62}' +
            '.fgd-big{font-size:6rem;line-height:1;font-weight:900;color:var(--c)}';
        document.head.appendChild(s);
    }
    const $ = q => typeof q === 'string' ? document.querySelector(q) : q;
    const shown = el => { if (!el) return false; const c = getComputedStyle(el), r = el.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const val = v => typeof v === 'function' ? v() : v;
    function lines(el) { return el ? el.innerText.split('\n').map(x => x.trim()).filter(Boolean) : []; }

    function mount(o) {
        // watch / btn / back は関数でもよい(canvasで描いているゲーム用)。extra は もどるの横に出すボタン { text, onClick }
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => mount(o)); return; }
        css();
        const press = t => {
            if (typeof t === 'function') return t();
            const el = $(t); if (!el) return;
            // mousedown で動くボタンのゲームもあるので、両方おくる
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            el.click();
        };
        const host = $(o.host), root = document.createElement('div');
        root.className = 'fgd';
        if (o.bg) root.style.backgroundImage = o.bg;
        if (o.color) root.style.backgroundColor = o.color;
        if (o.scale) root.style.transform = 'scale(' + o.scale + ')';
        if (o.z) root.style.zIndex = o.z;
        root.innerHTML = '<div class="fgd-veil"></div><div class="fgd-title"></div><div class="fgd-cards"></div><button class="fgd-back" type="button"></button>';
        root.querySelector('.fgd-veil').style.background = o.veil || 'rgba(0,0,0,.35)';
        const box = root.querySelector('.fgd-cards');
        const cards = o.cards.map(c => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'fgd-card';
            b.style.setProperty('--c', c.color); b.style.setProperty('--c2', c.dark || 'rgba(0,0,0,.28)');
            b.innerHTML = '<div class="fgd-head"></div><div class="fgd-stars"></div><div class="fgd-art"></div><div class="fgd-sub"></div><div class="fgd-note"></div>';
            b.querySelector('.fgd-stars').innerHTML = '★'.repeat(c.stars) + '<i>' + '★'.repeat(3 - c.stars) + '</i>';
            b.querySelector('.fgd-art').innerHTML = c.art || '';
            b.addEventListener('click', () => { press(c.btn); sync(); });
            box.appendChild(b);
            return { c, b };
        });
        const back = root.querySelector('.fgd-back');
        back.addEventListener('click', () => { press(o.back); sync(); });
        let extra = null;
        if (o.extra) {
            extra = document.createElement('button'); extra.type = 'button'; extra.className = 'fgd-back';
            extra.addEventListener('click', () => o.extra.onClick());
            const row = document.createElement('div'); row.style.cssText = 'position:relative;display:flex;gap:20px';
            back.replaceWith(row); row.appendChild(back); row.appendChild(extra);
        }
        host.appendChild(root);
        function paint() {
            cards.forEach(({ c, b }) => {
                const l = typeof c.btn === 'function' ? [] : lines($(c.btn));
                b.querySelector('.fgd-head').textContent = val(c.name) || l[0] || '';
                b.querySelector('.fgd-sub').textContent = (c.sub !== undefined ? val(c.sub) : l[1]) || '';
                b.querySelector('.fgd-note').textContent = (c.note && val(c.note)) || '';
            });
            root.querySelector('.fgd-title').textContent = typeof o.prompt === 'function' ? o.prompt() : ($(o.prompt) ? $(o.prompt).innerText.trim() : '');
            if (o.backText) back.textContent = val(o.backText);
            else { const t = $(o.back); back.textContent = t ? t.innerText.trim() : ''; }
            if (extra) extra.textContent = val(o.extra.text);
        }
        let on = false;
        function sync() {
            const v = typeof o.watch === 'function' ? !!o.watch() : shown($(o.watch));
            if (v && !on) paint();
            if (v !== on) { on = v; root.classList.toggle('on', v); }
        }
        // 今までの画面が開いたり閉じたりするのを見張る
        if (typeof o.watch === 'function') setInterval(sync, 100);
        else new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        sync();
        return { sync, paint };
    }
    function grid(n) { let h = ''; for (let i = 0; i < n * n; i++) h += '<i></i>'; return '<div class="fgd-grid" style="grid-template-columns:repeat(' + n + ',1fr)">' + h + '</div>'; }
    function big(s) { return '<div class="fgd-big">' + s + '</div>'; }
    return { mount, grid, big };
})();
