// ニックネームが未設定(ゲスト・ななし)のときだけ、ニックネームのボタンに ふわふわ動く吹き出しをつける。共通部品。
//   <script src="../fgl-nudge.js?v=1"></script>
//   FGLNudge.attach(ボタンの要素, { unset: () => 名前が未設定ならtrue, lang: () => 'ja'|'simple'|'en', text: {ja,simple,en}(省略可), dir: 'up'|'down'|'left'|'right', reserve: () => 吹き出しの場所をあけるために余白をつける要素(省略可) })
// 吹き出しはボタンの子として付けるので、ボタンといっしょに動き・かくれる。クリックはそのままボタンに届く(pointer-events:none)。
// タイトルの共通キット(fgl-title.js)は、row のボタンに nudge: { unset: () => ... } を書くと、これを自動で呼ぶ。
(function () {
    const TEXT = { ja: 'ニックネームを入力してね！', simple: 'なまえを いれてね！', en: 'Enter your nickname!' };
    function style() {
        if (document.getElementById('fgn-style')) return;
        const s = document.createElement('style');
        s.id = 'fgn-style';
        s.textContent =
            '.fgn-host{overflow:visible!important}' +
            '.fgn-bub{position:absolute;left:50%;z-index:30;display:none;pointer-events:none;white-space:nowrap}' +
            '.fgn-bub.up{bottom:calc(100% + 9px)}.fgn-bub.down{top:calc(100% + 9px)}' +
            '.fgn-bub.on{display:block}' +
            '.fgn-bub.right{left:100%;top:50%;margin-left:14px}.fgn-bub.left{left:auto;right:100%;top:50%;margin-right:14px}' +
            '.fgn-bub.right .fgn-in{transform:translate(0,-50%);animation-name:fgn-float-r}.fgn-bub.left .fgn-in{transform:translate(0,-50%);animation-name:fgn-float-l}' +
            '.fgn-bub.right .fgn-in::after{left:-8px;top:50%;margin:-6px 0 0 0;border-left:3px solid #ffb300;border-bottom:3px solid #ffb300}' +
            '.fgn-bub.left .fgn-in::after{left:auto;right:-8px;top:50%;margin:-6px 0 0 0;border-right:3px solid #ffb300;border-top:3px solid #ffb300}' +
            '.fgn-in{position:relative;display:block;transform:translateX(-50%);animation:fgn-float 1.7s ease-in-out infinite}' +
            '.fgn-in b{display:block;padding:6px 14px;border-radius:16px;background:#fff7d6;color:#7a3d00;border:3px solid #ffb300;font-family:"M PLUS Rounded 1c",sans-serif;font-weight:900;font-size:.88rem;letter-spacing:.5px;line-height:1.25;box-shadow:0 3px 0 rgba(150,90,0,.35),0 6px 12px rgba(0,0,0,.22);text-shadow:none}' +
            '.fgn-in::after{content:"";position:absolute;left:50%;width:12px;height:12px;margin-left:-6px;background:#fff7d6;transform:rotate(45deg)}' +
            '.fgn-bub.up .fgn-in::after{bottom:-8px;border-right:3px solid #ffb300;border-bottom:3px solid #ffb300}' +
            '.fgn-bub.down .fgn-in::after{top:-8px;border-left:3px solid #ffb300;border-top:3px solid #ffb300}' +
            '.fgn-bub.down .fgn-in{animation-name:fgn-float-d}' +
            '@keyframes fgn-float{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-7px)}}' +
            '@keyframes fgn-float-d{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,7px)}}' +
            '@keyframes fgn-float-r{0%,100%{transform:translate(0,-50%)}50%{transform:translate(7px,-50%)}}' +
            '@keyframes fgn-float-l{0%,100%{transform:translate(0,-50%)}50%{transform:translate(-7px,-50%)}}' +
            '@media (prefers-reduced-motion:reduce){.fgn-in{animation:none}}';
        document.head.appendChild(s);
    }
    function attach(el, o) {
        if (!el || el._fgn) return el && el._fgn;
        style();
        o = o || {};
        el.classList.add('fgn-host');
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';   // 吹き出しをボタンの中を基準に置く
        const bub = document.createElement('span');
        bub.className = 'fgn-bub ' + (['down', 'right', 'left'].indexOf(o.dir) >= 0 ? o.dir : 'up');
        bub.innerHTML = '<span class="fgn-in"><b></b></span>';
        const label = bub.querySelector('b');
        el.appendChild(bub);
        let last = null;
        function update() {
            if (bub.parentNode !== el) el.appendChild(bub);   // 言語切りかえなどでボタンの中身が書きかえられても、吹き出しをつけなおす
            let u = false, lg = 'ja';
            try { u = !!(o.unset ? o.unset() : true); } catch (e) {}
            try { lg = (o.lang && o.lang()) || 'ja'; } catch (e) {}
            const t = (o.text || TEXT)[lg] || (o.text || TEXT).ja || TEXT.ja;
            if (label.textContent !== t) label.textContent = t;
            if (u !== last) {
                last = u; bub.classList.toggle('on', u);
                // 吹き出しの場所をあけるため、まわりの部品(reserve)を少しずらす(上に出すとき=上に、下に出すとき=下に)
                const rs = o.reserve && o.reserve();
                if (rs) { rs.style.transition = 'margin .3s ease'; const prop = bub.classList.contains('down') ? 'margin-bottom' : 'margin-top'; if (u) rs.style.setProperty(prop, '48px', 'important'); else rs.style.removeProperty(prop); }
            }
        }
        update();
        const id = setInterval(update, 500);
        el._fgn = { update: update, stop: () => clearInterval(id), el: bub };
        return el._fgn;
    }
    window.FGLNudge = { attach: attach, TEXT: TEXT };
})();
