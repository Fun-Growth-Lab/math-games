// Fun & Growth Lab 共通: 中身が多くて見切れる枠に、自動でスクロールをつける。
// 画面が変わったら枠を調べ、ふつうに並んだ中身が枠の下からはみ出していれば、その枠だけスクロールできるようにする。
// まだ下に続きがあるときは、枠の下の端をうすくして知らせる。canvasで描いているゲームには効かない。
// スクロールさせたくない枠には data-noscroll をつける。
(function () {
    const SKIP = '.fgt, .fgd, #title-screen, canvas, svg, button, [data-noscroll]';
    const MARGIN = 6;      // これより少ないはみ出しは無視する
    const MIN_W = 80, MIN_H = 60;
    const done = new WeakSet();
    const pending = new WeakMap();   // はみ出しを見つけた時刻(アニメーションの途中を除くため、少し待って確かめる)

    const style = document.createElement('style');
    style.textContent =
        '.fgs-auto{overflow-y:auto!important;overflow-x:hidden;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}' +
        '.fgs-auto::-webkit-scrollbar{width:8px}' +
        '.fgs-auto::-webkit-scrollbar-thumb{background:rgba(128,128,128,.6);border-radius:4px}' +
        '.fgs-auto::-webkit-scrollbar-track{background:transparent}' +
        '.fgs-more{-webkit-mask-image:linear-gradient(#000 calc(100% - 26px),transparent);mask-image:linear-gradient(#000 calc(100% - 26px),transparent)}';
    document.head.appendChild(style);

    // ふつうに並んだ子の下端が、枠の高さをこえているか(飾りや、動かしている途中の子は数えない)
    function contentOverflows(el) {
        const limit = el.clientHeight + MARGIN;
        const elPos = getComputedStyle(el).position !== 'static';
        for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
            if (!c.offsetHeight) continue;
            const s = getComputedStyle(c);
            if (s.position === 'absolute' || s.position === 'fixed' || s.display === 'none' || s.visibility === 'hidden') continue;
            const top = elPos ? c.offsetTop : c.offsetTop - el.offsetTop;
            if (top + c.offsetHeight > limit && (c.innerText || '').trim()) return true;
        }
        return false;
    }
    function paintHint(el) {
        el.classList.toggle('fgs-more', el.scrollHeight - el.clientHeight - el.scrollTop > MARGIN);
    }
    // 指でのスクロール。ゲームが画面全体のタッチを止めていたり、回転表示だったりしても動くよう、自分で動かす
    function touchScroll(el) {
        let on = false, moved = false, p0 = 0, top0 = 0, k = 1, rot = false;
        const pos = t => rot ? -t.clientX : t.clientY;
        el.addEventListener('touchstart', e => {
            if (e.touches.length !== 1 || el.scrollHeight <= el.clientHeight) return;
            const r = el.getBoundingClientRect();
            // 枠の高さが画面の横幅に写っていれば回転表示(rotate(90deg))
            rot = Math.abs(r.width / el.clientHeight - r.height / el.clientWidth) < Math.abs(r.height / el.clientHeight - r.width / el.clientWidth);
            k = el.clientHeight / (rot ? r.width : r.height);
            on = true; moved = false; p0 = pos(e.touches[0]); top0 = el.scrollTop;
        }, { passive: true });
        el.addEventListener('touchmove', e => {
            if (!on) return;
            const d = pos(e.touches[0]) - p0;
            if (!moved && Math.abs(d) < 6) return;
            moved = true;
            e.preventDefault(); e.stopPropagation();
            el.scrollTop = top0 - d * k;
        }, { passive: false });
        const end = () => { on = false; };
        el.addEventListener('touchend', end);
        el.addEventListener('touchcancel', end);
    }
    function apply(el) {
        done.add(el);
        el.classList.add('fgs-auto');
        touchScroll(el);
        el.addEventListener('scroll', () => paintHint(el), { passive: true });
        paintHint(el);
        (window.__fgsLog = window.__fgsLog || []).push((el.id ? '#' + el.id : '.' + String(el.className).split(' ')[0]) + ' ' + el.clientHeight + '/' + el.scrollHeight);
    }
    function scan() {
        const now = Date.now();
        document.querySelectorAll('div, section, ul, ol, aside, main, form').forEach(el => {
            if (done.has(el)) { paintHint(el); return; }
            if (el.clientHeight < MIN_H || el.clientWidth < MIN_W || el.scrollHeight <= el.clientHeight + MARGIN) { pending.delete(el); return; }
            if (el.closest(SKIP)) return;
            const s = getComputedStyle(el);
            if (s.overflowY === 'auto' || s.overflowY === 'scroll' || s.position === 'fixed') return;
            if (el.clientWidth >= document.documentElement.clientWidth - 2 && el.parentElement === document.body) return;   // 画面全体の入れ物
            if (!contentOverflows(el)) { pending.delete(el); return; }
            const t = pending.get(el);
            if (!t) { pending.set(el, now); setTimeout(later, 600); }
            else if (now - t >= 500) apply(el);
        });
    }
    let timer = 0;
    function later() {
        if (timer || document.hidden) return;
        timer = setTimeout(() => {
            timer = 0;
            scan();
        }, 300);
    }
    function start() {
        new MutationObserver(later).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'], characterData: true });
        addEventListener('resize', later);
        later();
    }
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
