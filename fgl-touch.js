// Fun & Growth Lab 共通: タイトル画面の小さなボタンを、スマホで押しやすくする。
// 指がボタンの少し外に当たったときは、いちばん近いボタンを押したことにする。
// ゲーム中の盤面に影響しないよう、タイトル画面のボタンだけを対象にする。
(function () {
    if (!window.matchMedia || !matchMedia('(pointer: coarse)').matches) return;
    var REACH = 14;   // 画面上で何pxまで はずれても押せるか
    var SEL = '#title-screen button, #title-menu-main button, .fgt button';
    function visible(el) {
        var c = getComputedStyle(el), r = el.getBoundingClientRect();
        if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0 || !r.width || !r.height) return false;
        var t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!t && (t === el || el.contains(t) || t.contains(el));
    }
    // 指で触るゲームは touchstart を止めていて click が来ないことがあるので、ポインターで見る
    var down = null;
    document.addEventListener('pointerdown', function (e) { down = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY }; }, true);
    document.addEventListener('pointerup', function (e) {
        if (!down || Math.abs(e.clientX - down.x) > 10 || Math.abs(e.clientY - down.y) > 10) return;
        down = null;
        var t = document.elementFromPoint(e.clientX, e.clientY);
        if (!t || t.closest('button, a, input, select, textarea, canvas, [onclick], [role=button]')) return;
        var best = null, bestD = REACH;
        document.querySelectorAll(SEL).forEach(function (b) {
            var r = b.getBoundingClientRect();
            var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d <= bestD && visible(b)) { best = b; bestD = d; }
        });
        if (best) {
            best.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            best.click();
        }
    }, true);
})();
