// ニックネームが未設定(ゲスト・ななし)のときだけ、ニックネームのボタンに ふわふわ動く吹き出しをつける。共通部品。
//   <script src="../fgl-nudge.js?v=1"></script>
//   FGLNudge.attach(ボタンの要素, { unset: () => 名前が未設定ならtrue, lang: () => 'ja'|'simple'|'en', text: {ja,simple,en}(省略可), dir: 'up'|'down' })
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
            '.fgn-in{position:relative;display:block;transform:translateX(-50%);animation:fgn-float 1.7s ease-in-out infinite}' +
            '.fgn-in b{display:block;padding:6px 14px;border-radius:16px;background:#fff7d6;color:#7a3d00;border:3px solid #ffb300;font-family:"M PLUS Rounded 1c",sans-serif;font-weight:900;font-size:.88rem;letter-spacing:.5px;line-height:1.25;box-shadow:0 3px 0 rgba(150,90,0,.35),0 6px 12px rgba(0,0,0,.22);text-shadow:none}' +
            '.fgn-in::after{content:"";position:absolute;left:50%;width:12px;height:12px;margin-left:-6px;background:#fff7d6;transform:rotate(45deg)}' +
            '.fgn-bub.up .fgn-in::after{bottom:-8px;border-right:3px solid #ffb300;border-bottom:3px solid #ffb300}' +
            '.fgn-bub.down .fgn-in::after{top:-8px;border-left:3px solid #ffb300;border-top:3px solid #ffb300}' +
            '.fgn-bub.down .fgn-in{animation-name:fgn-float-d}' +
            '@keyframes fgn-float{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-7px)}}' +
            '@keyframes fgn-float-d{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,7px)}}' +
            '@media (prefers-reduced-motion:reduce){.fgn-in{animation:none}}';
        document.head.appendChild(s);
    }
    function attach(el, o) {
        if (!el || el._fgn) return el && el._fgn;
        style();
        o = o || {};
        el.classList.add('fgn-host');
        const bub = document.createElement('span');
        bub.className = 'fgn-bub ' + (o.dir === 'down' ? 'down' : 'up');
        bub.innerHTML = '<span class="fgn-in"><b></b></span>';
        const label = bub.querySelector('b');
        el.appendChild(bub);
        let last = null;
        function update() {
            let u = false, lg = 'ja';
            try { u = !!(o.unset ? o.unset() : true); } catch (e) {}
            try { lg = (o.lang && o.lang()) || 'ja'; } catch (e) {}
            const t = (o.text || TEXT)[lg] || (o.text || TEXT).ja || TEXT.ja;
            if (label.textContent !== t) label.textContent = t;
            if (u !== last) { last = u; bub.classList.toggle('on', u); }
        }
        update();
        const id = setInterval(update, 500);
        el._fgn = { update: update, stop: () => clearInterval(id), el: bub };
        return el._fgn;
    }
    window.FGLNudge = { attach: attach, TEXT: TEXT };
})();
