// 共通タイトル(fgl-title.js)の「起動前」の準備。<head> で、最初に 読みこむ(同期)。
//
// なぜ必要か: 共通タイトルは、ゲームの本体スクリプトが すべて 終わったあと(ページの いちばん最後)に 組みたてて 重ねる。
// その前の 数百ミリ秒は、もとのタイトル(古いボタン・古い背景)が 先に描かれてしまい、一瞬 見えていた。
//
// やること(ゲームごとに 別々に書いていた「かくす指定」と「かくしっぱなしを防ぐ保険」を ここに まとめる):
//   1. もとのタイトルの中身を、描かれる前から「見せない」(もとのボタンは 裏で クリックされるだけの部品で、画面には出さない)
//   2. タイトルの背景を、最初の1フレームから 新しい絵にする(もとの背景が 先に見えない)。絵は preload で 先に読む
//   3. 共通タイトルが 起動しなかったときの保険: 4秒たったら もとの表示に もどす(画面が 真っ白のまま 動かなくなるのを防ぐ)
//   共通タイトルが 組みあがると fgl-title.js が html に .fgt-ready を つけて、1・2 の指定を 外す。
//
//   <script src="../fgl-title-boot.js"></script>
//   <script>FGLBoot.title({ host:'#title-screen', hide:['.title-box'], bg:"url('title_parts/key.webp') center / cover no-repeat, #0a1030" });</script>
//     host: もとのタイトルの要素 / hide: かくす部分(省略するとホストの中身ぜんぶ) / bg: 背景(CSS の background。省略可)
(function () {
    window.FGLBoot = {
        cfg: null,
        title: function (cfg) {
            this.cfg = cfg;
            const host = cfg.host;
            const hides = (cfg.hide && cfg.hide.length) ? cfg.hide.map(function (s) { return host + ' ' + s; }) : [host + ' > *:not(.fgt)'];
            let css = hides.map(function (s) { return 'html:not(.fgt-ready) ' + s; }).join(',\n') + '{visibility:hidden!important}\n';
            if (cfg.bg) css += 'html:not(.fgt-ready) ' + host + '{background:' + cfg.bg + '!important}\n';
            const st = document.createElement('style');
            st.id = 'fgt-pre'; st.textContent = css;
            document.head.appendChild(st);
            // 背景の絵を先に読みはじめる(url('...') を ぬき出す)
            const m = cfg.bg && /url\((['"]?)([^'")]+)\1\)/.exec(cfg.bg);
            if (m) { const l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = m[2]; document.head.appendChild(l); }
            // 保険
            setTimeout(function () { document.documentElement.classList.add('fgt-ready'); }, 4000);
        }
    };
})();
