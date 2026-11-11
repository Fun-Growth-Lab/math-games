// ゲームの「遊ばれ方」を Google アナリティクスに送る共通部品。名前・スコアなど 個人が分かるものは 送らない。
//   <script src="../fgl-track.js?v=..."></script>   … 各ゲームの <head> に 1行(fgl-sfx.js の すぐ下)
// 送るもの(どれも game = ゲームのフォルダ名 つき):
//   game_play_start  … そのページで はじめて 画面を押した/キーを押した(開いただけで帰った人と 分ける)
//   game_play_time   … 実際に さわっていた時間が 1・3・5・10・20・30分に とどいた(minutes)
//   game_run_finish  … ランキングに記録を送った = 1回 最後まで遊んだ
//   game_leave       … ページを はなれた(seconds = さわっていた秒数)
// ためすとき: アドレスの最後に ?fgltrack=1 をつけると、送らずに console に出す。localhost では いつも送らない。
(function () {
    if (window.FGLTrack) return;
    var GA_ID = 'G-5C4G61Y29Q';
    var seg = location.pathname.split('/').filter(Boolean);
    var game = seg.length >= 2 ? seg[seg.length - 2] : 'top';
    if (!/\.html?$/i.test(seg[seg.length - 1] || '')) game = seg[seg.length - 1] || 'top';
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
    var debug = /[?&]fgltrack=1/.test(location.search);
    var log = [];

    // このページに アナリティクスのタグが まだ無いときだけ 読みこむ
    if (!local && typeof window.gtag !== 'function') {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA_ID);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
    }

    function send(name, params) {
        var p = { game: game };
        if (params) for (var k in params) p[k] = params[k];
        log.push([name, p]);
        if (debug) { try { console.log('[fgl-track]', name, JSON.stringify(p)); } catch (e) {} }
        if (local || debug) return;
        try { if (typeof window.gtag === 'function') window.gtag('event', name, p); } catch (e) {}
    }

    // さわっていた時間: 画面が見えていて、この60秒のあいだに 操作があったときだけ 数える
    var MARKS = [1, 3, 5, 10, 20, 30];
    var TICK = 5, IDLE = 60000;
    var active = 0, lastInput = 0, started = false, markIdx = 0, left = false;
    function onInput() {
        lastInput = Date.now();
        if (!started) { started = true; send('game_play_start'); }
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
        window.addEventListener(ev, onInput, { capture: true, passive: true });
    });
    setInterval(function () {
        if (document.visibilityState !== 'visible' || !started) return;
        if (Date.now() - lastInput > IDLE) return;
        active += TICK;
        while (markIdx < MARKS.length && active >= MARKS[markIdx] * 60) {
            send('game_play_time', { minutes: MARKS[markIdx] });
            markIdx++;
        }
    }, TICK * 1000);
    function leave() {
        if (left || !started) return;
        left = true;
        send('game_leave', { seconds: active });
    }
    window.addEventListener('pagehide', leave);
    // もどってきたら もう一度 数えられるようにする(スマホは タブを切りかえただけで pagehide なしに 終わることがある)
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') leave(); else left = false;
    });

    // ランキングへの記録送信 = 1回 遊びおえた合図。送信そのものには 手を加えない
    var origFetch = window.fetch;
    if (typeof origFetch === 'function' && game !== 'Jukebox') {
        window.fetch = function (input, init) {
            try {
                var url = typeof input === 'string' ? input : (input && input.url) || '';
                var method = (init && init.method) || (input && input.method) || 'GET';
                if (String(method).toUpperCase() === 'POST' && /\/rankings(\?|$)/.test(url)) send('game_run_finish');
            } catch (e) {}
            return origFetch.apply(this, arguments);
        };
    }

    window.FGLTrack = { send: send, game: game, log: log, activeSeconds: function () { return active; } };
})();
