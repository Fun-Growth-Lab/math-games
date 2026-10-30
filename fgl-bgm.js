// 全ゲーム共通のBGMエンジン(music/ のMP3を流す)。効果音エンジン fgl-sfx.js の姉妹。
//   <script src="../fgl-sfx.js?v=5"></script>
//   <script src="../fgl-bgm.js?v=1"></script>
//   const BGM = FGLBgm.create({ key: 'stellaalea' });       // 設定はゲームごと。保存キー fgl_bgm_<key>
//   FGLBgm.settingsUI('#bgm-host', { bgm: BGM, sfx: SFX, getLang: () => currentLang });   // 設定画面に置く(音量・選曲・試聴・全ゲーム適用)
//
// 仕様:
//  - 最初の操作(タップ・キー)で流れはじめる(ブラウザの決まり)。ゲーム内の画面切り替えでは止まらない。
//  - 選曲: チェックした曲がランダムに流れる(同じ曲が続けて出ないようにする)。1曲だけなら繰り返す。
//  - ページ移動(INDEX→ゲームなど)では、曲と再生位置を fgl_bgm_now に覚えて、次のページで続きから流す。
//  - 「全ゲームに適用」は BGM用と効果音用で別々。BGM(音量・選曲)→ fgl_bgm_all、効果音の音量 → fgl_vol_all を共通設定にして、
//    ゲームごとの設定(fgl_bgm_* / fgl_vol_*)を消す。効果音側のボタンは FGLBgm.sfxApplyUI(host,{sfx,getLang})。
//  - 選曲は0曲にもできる(全部はずす → BGMは流れない)。
//  - 音量は 0〜10(0=OFF、初期値5)。タブが隠れたら止めて、戻ったら続ける。
(function () {
    'use strict';
    const BASE = (function () {
        try { const s = document.currentScript && document.currentScript.src; if (s) return s.slice(0, s.lastIndexOf('/') + 1) + 'music/'; } catch (e) {}
        return '../music/';
    })();
    const TRACKS = [
        ['brave', 'Brave Spirit of Japan'], ['jig', 'Countryside Jig'], ['dhol', 'Dhol Ka Dhamaka'], ['dusty', 'Dusty Breakbeat Loop'],
        ['eminor', 'E Minor Loop'], ['neon', 'Neon Night Drive'], ['oddly', 'Oddly Addictive'], ['pixel', 'Pixel Party'],
        ['racing', 'Racing Loop'], ['seamless', 'Seamless Loop'], ['wheel', 'Spin the Dream Wheel'], ['pop', 'Super Pop'], ['map', 'The Map of Wonders'],
        ['aminor', 'A Minor Loop'], ['amen', 'Amen Loop'], ['baroque', 'Baroque Pop Loop'], ['bouncy', 'Bouncy Button Press'],
        ['cocky', 'Cocky Breakbeat'], ['festival', 'Festival Loop'], ['ryukyu', 'Ryukyu Sun Loop'], ['hoedown', 'Hoedown House'], ['pentatonic', 'Pentatonic Playground']
    ].map(function (a) { return { id: a[0], title: a[1], file: a[1] + '.mp3' }; });
    const K_ALL = 'fgl_bgm_all', K_NOW = 'fgl_bgm_now', RESUME_MS = 15 * 60 * 1000;
    const gainOf = function (v) { return Math.pow(v / 10, 1.7) * 0.85; };

    function normalize(o) {
        const r = { vol: 5, tracks: null, mode: 'shuffle' };
        if (o && typeof o === 'object') {
            if (typeof o.vol === 'number') r.vol = Math.max(0, Math.min(10, Math.round(o.vol)));
            if (o.mode === 'order') r.mode = 'order';
            if (Array.isArray(o.tracks)) {
                const ids = o.tracks.filter(function (id) { return TRACKS.some(function (t) { return t.id === id; }); });
                r.tracks = ids.length < TRACKS.length ? ids : null;      // [] = 1曲も選ばない(BGMなし)
            }
        }
        return r;
    }
    function load(key) {
        try {
            const a = localStorage.getItem('fgl_bgm_' + key) || localStorage.getItem(K_ALL);
            if (a) return normalize(JSON.parse(a));
        } catch (e) {}
        return normalize(null);
    }

    let inst = null;
    function create(opts) {
        if (inst) return inst;
        opts = opts || {};
        const storeKey = 'fgl_bgm_' + (opts.key || 'game');
        const st = load(opts.key || 'game');
        let vol = st.vol, lastVol = vol > 0 ? vol : 5, sel = st.tracks, mode = st.mode;     // sel: null=すべて / ['id',...]。mode: 'shuffle'=ランダム / 'order'=曲の番号順
        const a = new Audio(); a.preload = 'auto';
        const hist = [];
        let cur = null, gesture = false, userPaused = false, fadeTimer = null, errCount = 0;
        const listeners = [];
        const notify = function () { listeners.forEach(function (f) { try { f(); } catch (e) {} }); };
        const isSel = function (id) { return !sel || sel.indexOf(id) >= 0; };
        const selected = function () { return TRACKS.filter(function (t) { return isSel(t.id); }); };
        const byId = function (id) { return TRACKS.filter(function (t) { return t.id === id; })[0] || null; };
        function save() { try { localStorage.setItem(storeKey, JSON.stringify({ vol: vol, tracks: sel, mode: mode })); } catch (e) {} }
        function saveNow() {
            if (!cur || a.paused) return;
            try { localStorage.setItem(K_NOW, JSON.stringify({ id: cur, pos: a.currentTime || 0, ts: Date.now() })); } catch (e) {}
        }
        function pick(excl) {
            const list = selected();
            if (!list.length) return null;
            if (mode === 'order') {                       // 番号順: 選んだ曲のうち、いまの曲の次(さいごはまた最初へ)
                let k = -1;
                for (let i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === excl) k = i;
                for (let j = 1; j <= TRACKS.length; j++) { const t = TRACKS[(k + j) % TRACKS.length]; if (isSel(t.id)) return t; }
                return list[0];
            }
            const pool = list.length > 1 ? list.filter(function (t) { return t.id !== excl; }) : list;
            return pool[Math.floor(Math.random() * pool.length)];
        }
        const FADE_MS = 2500;      // 曲のはじまりは、小さい音からゆっくり大きくする(試聴だけ短く)
        let fadeLen = FADE_MS;
        function ramp() {
            clearInterval(fadeTimer);
            const len = fadeLen;
            let t = 0;
            fadeTimer = setInterval(function () {
                t += 50;
                const k = Math.min(1, t / len);
                a.volume = Math.min(1, gainOf(vol) * k * k);
                if (t >= len) clearInterval(fadeTimer);
            }, 50);
        }
        // 最初の操作の前でも、ブラウザが許せば(同じサイトを触ったあとなど)そのまま流れる。ダメなら最初の操作で流れはじめる
        function tryPlay() {
            if (vol <= 0 || userPaused || document.hidden) return;
            a.volume = 0;
            const p = a.play();
            if (p && p.then) p.then(function () { ramp(); notify(); }).catch(function () {});
        }
        function playTrack(id, o) {
            o = o || {};
            const t = byId(id) || pick(null);
            if (!t) { a.pause(); cur = null; notify(); return; }
            if (cur && cur !== t.id && !o.noHist) { hist.push(cur); if (hist.length > 50) hist.shift(); }
            cur = t.id;
            a.src = BASE + encodeURIComponent(t.file);
            if (o.pos > 1) {
                const seek = function () { a.removeEventListener('loadedmetadata', seek); try { a.currentTime = o.pos; } catch (e) {} };
                a.addEventListener('loadedmetadata', seek);
            }
            fadeLen = o.fast ? 400 : FADE_MS;
            tryPlay();
            notify();
        }
        function startInitial() {
            let now = null;
            try { now = JSON.parse(localStorage.getItem(K_NOW) || 'null'); } catch (e) {}
            if (now && byId(now.id) && isSel(now.id) && Date.now() - (now.ts || 0) < RESUME_MS) playTrack(now.id, { pos: now.pos });
            else { const t = pick(null); if (t) playTrack(t.id); }
        }
        function ensurePlaying() {
            if (vol <= 0 || userPaused || document.hidden || !selected().length) return;
            if (!cur) startInitial();
            else if (a.paused) tryPlay();
        }
        a.addEventListener('ended', function () { const t = pick(cur); if (t) playTrack(t.id); else { cur = null; notify(); } });
        a.addEventListener('error', function () { if (++errCount < 6) setTimeout(function () { const t = pick(cur); if (t) playTrack(t.id); }, 800); });
        a.addEventListener('playing', function () { errCount = 0; notify(); });
        a.addEventListener('pause', notify);
        const GEST = ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart', 'touchend'];
        const onGesture = function () {
            gesture = true;
            if (!a.paused) { GEST.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); }); return; }
            ensurePlaying();
            // 再生できたら、この聞き耳は外す(まだ止まっていたら、つぎの操作でもう一度ためす)
            setTimeout(function () { if (!a.paused || !selected().length || vol <= 0) GEST.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); }); }, 700);
        };
        GEST.forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
        setTimeout(ensurePlaying, 0);
        document.addEventListener('visibilitychange', function () { if (document.hidden) { saveNow(); a.pause(); } else ensurePlaying(); });
        window.addEventListener('pagehide', saveNow);
        setInterval(saveNow, 1000);

        const api = {
            get volume() { return vol; },
            get lastVolume() { return lastVol; },
            get tracks() { return TRACKS; },
            get current() { return cur; },
            get selectedCount() { return selected().length; },
            get playing() { return !a.paused && !a.ended; },
            get mode() { return mode; },
            get currentTime() { return a.currentTime || 0; },
            get duration() { return isFinite(a.duration) ? a.duration : 0; },
            setMode: function (m) { mode = m === 'order' ? 'order' : 'shuffle'; save(); notify(); },
            seek: function (t) { if (cur && isFinite(a.duration)) { try { a.currentTime = Math.max(0, Math.min(a.duration, t)); } catch (e) {} } },
            // 再生/一時停止(いまの曲をつづきから。曲がまだなければ はじめる)
            toggle: function () {
                if (vol === 0) { vol = lastVol || 5; save(); }
                userPaused = false; gesture = true;
                if (!cur) ensurePlaying();
                else if (a.paused) tryPlay();
                else { userPaused = true; a.pause(); notify(); }
            },
            // 前の曲(3秒以上たっていたら、いまの曲の頭から。そうでなければ、ひとつ前に流れた曲)
            prev: function () {
                if (vol === 0) { vol = lastVol || 5; save(); }
                userPaused = false; gesture = true;
                if (cur && a.currentTime > 3) { try { a.currentTime = 0; } catch (e) {} return; }
                const id = hist.pop();
                if (id) playTrack(id, { noHist: true });
                else if (cur) { try { a.currentTime = 0; } catch (e) {} }
            },
            isSelected: isSel,
            setVolume: function (n) {
                n = Math.max(0, Math.min(10, Math.round(n)));
                if (vol > 0) lastVol = vol;
                vol = n; save();
                if (vol === 0) { clearInterval(fadeTimer); a.pause(); }
                else { clearInterval(fadeTimer); a.volume = gainOf(vol); ensurePlaying(); }
                notify();
            },
            toggleMute: function () { userPaused = false; this.setVolume(vol > 0 ? 0 : (lastVol || 5)); },
            toggleTrack: function (id) {
                const cur2 = selected().map(function (t) { return t.id; });
                const i = cur2.indexOf(id);
                if (i >= 0) cur2.splice(i, 1); else cur2.push(id);
                sel = cur2.length >= TRACKS.length ? null : cur2;
                save();
                if (!cur2.length) { a.pause(); cur = null; }        // 1曲も選ばないと、BGMは止まる
                else if (!cur) { userPaused = false; ensurePlaying(); }
                notify();
            },
            selectAll: function () { sel = null; save(); if (!cur) { userPaused = false; ensurePlaying(); } notify(); },
            deselectAll: function () { sel = []; save(); a.pause(); cur = null; notify(); },
            // 試聴: その曲をはじめから流す(流れていれば止める)。そのあとは選んだ曲のランダムにもどる
            togglePreview: function (id) {
                if (cur === id && !a.paused) { userPaused = true; a.pause(); notify(); return; }
                if (vol === 0) { vol = lastVol || 5; save(); }
                userPaused = false; gesture = true;
                playTrack(id, { fast: true });
            },
            next: function () { const t = pick(cur); if (!t) return; if (vol === 0) { vol = lastVol || 5; save(); } userPaused = false; gesture = true; playTrack(t.id); },
            onChange: function (f) { listeners.push(f); },
            // 全ゲームに適用(BGM): 音量と選曲を共通設定にして、ゲームごとのBGM設定を消す
            applyBgmToAll: function () {
                try {
                    localStorage.setItem(K_ALL, JSON.stringify({ vol: vol, tracks: sel, mode: mode }));
                    Object.keys(localStorage).forEach(function (k) { if (/^fgl_bgm_/.test(k) && k !== K_ALL && k !== K_NOW) localStorage.removeItem(k); });
                    return true;
                } catch (e) { return false; }
            },
            // 全ゲームに適用(効果音): 効果音の音量を共通設定にして、ゲームごとの効果音設定を消す
            applySfxToAll: function (sfx) {
                try {
                    localStorage.setItem('fgl_vol_all', String(sfx.volume));
                    Object.keys(localStorage).forEach(function (k) { if (/^fgl_vol_/.test(k) && k !== 'fgl_vol_all') localStorage.removeItem(k); });
                    return true;
                } catch (e) { return false; }
            }
        };
        inst = api;
        return api;
    }

    // ---- 設定UI ----
    const L = {
        title:   { ja: '🎵 BGM', easy: '🎵 BGM', en: '🎵 BGM' },
        now:     { ja: 'いま:', easy: 'いま:', en: 'Now:' },
        none:    { ja: '（まだ流れていません）', easy: '（まだ ながれていないよ）', en: '(not playing yet)' },
        next:    { ja: '⏭ つぎの曲', easy: '⏭ つぎの きょく', en: '⏭ Next' },
        all:     { ja: '全部えらぶ', easy: 'ぜんぶ えらぶ', en: 'Select all' },
        clear:   { ja: '全部はずす', easy: 'ぜんぶ はずす', en: 'Clear all' },
        off:     { ja: '（曲が選ばれていません）', easy: '（きょくが えらばれていないよ）', en: '(no tracks selected)' },
        hint:    { ja: 'チェックした曲がランダムに流れます', easy: 'チェックした きょくが ランダムに ながれるよ', en: 'Checked tracks play in random order' },
        apply:   { ja: '🌐 BGMを全ゲームに適用', easy: '🌐 BGMを ぜんぶの ゲームに つかう', en: '🌐 Apply BGM to all games' },
        applySfx:{ ja: '🌐 効果音を全ゲームに適用', easy: '🌐 こうかおんを ぜんぶの ゲームに つかう', en: '🌐 Apply SFX to all games' },
        applied: { ja: '全ゲームに適用しました！', easy: 'ぜんぶの ゲームに つかったよ！', en: 'Applied to all games!' },
        failed:  { ja: '保存できませんでした', easy: 'ほぞん できなかったよ', en: 'Could not save' },
        gear:    { ja: '⚙ 設定', easy: '⚙ せってい', en: '⚙ Settings' },
        open:    { ja: '🎵 BGMのせってい', easy: '🎵 BGMの せってい', en: '🎵 BGM Settings' },
        close:   { ja: '✕ とじる', easy: '✕ とじる', en: '✕ Close' },
        sfxTitle:{ ja: '🔊 効果音', easy: '🔊 こうかおん', en: '🔊 Sound effects' },
        openSfx: { ja: '🔊 効果音のせってい', easy: '🔊 こうかおんの せってい', en: '🔊 Sound Settings' }
    };
    let styled = false;
    function style() {
        if (styled) return; styled = true;
        const s = document.createElement('style');
        s.textContent =
            '.fgb{background:linear-gradient(#2e2670,#1d1850);border:4px solid #0a0826;border-radius:18px;padding:12px 16px 14px;color:#fff;font-family:inherit;text-align:left;box-shadow:0 5px 0 #0a0826}' +
            '.fgb-h{display:flex;align-items:center;gap:12px;margin-bottom:4px}' +
            '.fgb-title{font-weight:900;font-size:1.35rem;color:#ffc93d;text-shadow:0 2px 0 #0a0826;white-space:nowrap}' +
            '.fgb-now{flex:1;min-width:0;font-weight:800;font-size:.95rem;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
            '.fgb-btn{font-family:inherit;font-weight:900;border:3px solid #0a0826;border-radius:12px;padding:5px 14px;font-size:.95rem;cursor:pointer;background:linear-gradient(#fff,#e2dbff);color:#241c4e;box-shadow:0 3px 0 #0a0826;white-space:nowrap}' +
            '.fgb-btn:active{transform:translateY(3px);box-shadow:none}' +
            '.fgb-btn.gold{background:linear-gradient(#ffe27a,#ffc93d)}' +
            '.fgb-vol{margin:6px 0 8px;color:#fff}' +
            '.fgb-list{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:6px 0 10px}' +
            '.fgb-row{display:flex;align-items:center;gap:8px;padding:3px 10px 3px 4px;border-radius:14px;background:rgba(255,255,255,.08);border:2px solid transparent;min-width:0}' +
            '.fgb-row.now{border-color:#ffc93d;background:rgba(255,201,61,.2)}' +
            '.fgb-pl{flex:none;width:34px;height:34px;border-radius:50%;border:3px solid #0a0826;background:linear-gradient(#7ae8dc,#35d0c0);color:#0a0826;font-size:.95rem;font-weight:900;line-height:1;cursor:pointer;padding:0;box-shadow:0 3px 0 #0a0826}' +
            '.fgb-pl.on{background:linear-gradient(#ffe27a,#ffc93d)}' +
            '.fgb-t{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-weight:800;font-size:.95rem;cursor:pointer}' +
            '.fgb-t span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.fgb-t input{flex:none;width:22px;height:22px;accent-color:#ffc93d;cursor:pointer}' +
            '.fgb-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
            '.fgb-hint{flex:1;font-size:.8rem;opacity:.75;font-weight:700;min-width:120px}' +
            '.fgb-ov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:rgba(10,8,38,.82);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;box-sizing:border-box;touch-action:manipulation}' +
            '.fgb-ov.hide{display:none}' +
            '.fgb-ov-in{max-width:780px;margin:0 auto;display:flex;flex-direction:column}' +
            '.fgb-ov-bar{display:flex;justify-content:flex-end;margin-bottom:8px;order:-2}' +
            '.fgb-ov .fgb{margin-bottom:12px}' +
            '.fgb-ov .fgb-sfx{color:#fff}' +
            '.fgb-fab{position:fixed;z-index:9000;width:44px;height:44px;border-radius:50%;border:3px solid #fff;font-size:1.2rem;line-height:1;cursor:pointer;color:#fff;background:linear-gradient(#b48cff,#7a4fe0);box-shadow:0 4px 0 rgba(0,0,0,.28),0 6px 14px rgba(0,0,0,.25);padding:0;font-family:inherit;touch-action:manipulation}' +
            '@media (max-width:600px){.fgb-list{grid-template-columns:1fr}.fgb-h{flex-wrap:wrap;gap:6px 10px}.fgb-now{flex-basis:100%;order:3}}' +
            '.fgb-gear{position:fixed;z-index:9000;height:34px;padding:0 12px;border-radius:17px;border:2px solid rgba(255,255,255,.9);background:rgba(30,24,70,.82);color:#fff;font-weight:900;font-size:.85rem;line-height:1;font-family:inherit;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.35);white-space:nowrap;touch-action:manipulation;opacity:.88}' +
            '.fgb-gear.compact{width:34px;padding:0;font-size:1rem}.fgb-gear:hover{opacity:1}.fgb-gear:active{transform:translateY(2px);box-shadow:none}' +
            '.fgb-msg{display:block;margin-top:6px;font-weight:900;font-size:.95rem;color:#7ae8dc;min-height:1.2em}';
        document.head.appendChild(s);
    }
    function settingsUI(host, o) {
        style();
        if (typeof host === 'string') host = document.querySelector(host);
        if (!host) return null;
        o = o || {};
        const bgm = o.bgm || create({ key: o.key });
        const lang = function () { let l = 'ja'; try { if (o.getLang) l = o.getLang(); } catch (e) {} return (l === 'ja_easy' || l === 'simple' || l === 'easy') ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
        const T = function (k) { return L[k][lang()]; };
        const esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
        let msg = '';
        function render() {
            const cur = bgm.current, playing = bgm.playing;
            const ct = TRACKS.filter(function (t) { return t.id === cur; })[0];
            host.innerHTML =
                '<div class="fgb"><div class="fgb-h"><div class="fgb-title">' + T('title') + '</div>' +
                '<div class="fgb-now">' + T('now') + ' ' + (ct ? '♪ ' + esc(ct.title) : (bgm.selectedCount === 0 ? T('off') : T('none'))) + '</div>' +
                '<button type="button" class="fgb-btn" data-a="next">' + T('next') + '</button></div>' +
                '<div class="fgb-vol"></div>' +
                '<div class="fgb-list">' + TRACKS.map(function (t) {
                    const on = t.id === cur;
                    return '<div class="fgb-row' + (on ? ' now' : '') + '"><button type="button" class="fgb-pl' + (on && playing ? ' on' : '') + '" data-p="' + t.id + '">' + (on && playing ? '⏸' : '▶') + '</button>' +
                        '<label class="fgb-t"><span>' + esc(t.title) + '</span><input type="checkbox" data-c="' + t.id + '"' + (bgm.isSelected(t.id) ? ' checked' : '') + '></label></div>';
                }).join('') + '</div>' +
                '<div class="fgb-foot"><button type="button" class="fgb-btn" data-a="all">' + T('all') + '</button><button type="button" class="fgb-btn" data-a="clear">' + T('clear') + '</button><div class="fgb-hint">' + T('hint') + '</div>' +
                '<button type="button" class="fgb-btn gold" data-a="apply">' + T('apply') + '</button></div>' +
                '<span class="fgb-msg">' + esc(msg) + '</span></div>';
            if (window.FGLSfx && window.FGLSfx.volumeUI) window.FGLSfx.volumeUI(host.querySelector('.fgb-vol'), bgm);
            host.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); bgm.togglePreview(b.getAttribute('data-p')); }; });
            host.querySelectorAll('[data-c]').forEach(function (c) { c.onchange = function () { bgm.toggleTrack(c.getAttribute('data-c')); }; });
            host.querySelectorAll('[data-a]').forEach(function (b) {
                b.onclick = function (e) {
                    e.stopPropagation();
                    const a = b.getAttribute('data-a');
                    if (a === 'next') bgm.next();
                    else if (a === 'all') bgm.selectAll();
                    else if (a === 'clear') bgm.deselectAll();
                    else if (a === 'apply') { msg = bgm.applyBgmToAll() ? T('applied') : T('failed'); render(); }
                };
            });
        }
        bgm.onChange(render);
        render();
        return render;
    }
    // 効果音の「全ゲームに適用」ボタン(効果音の音量バーの下に置く)
    function sfxApplyUI(host, o) {
        style();
        if (typeof host === 'string') host = document.querySelector(host);
        if (!host) return null;
        o = o || {};
        const bgm = o.bgm || create({ key: o.key });
        const lang = function () { let l = 'ja'; try { if (o.getLang) l = o.getLang(); } catch (e) {} return (l === 'ja_easy' || l === 'simple' || l === 'easy') ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
        let msg = '';
        function render() {
            host.innerHTML = '<div style="text-align:center;margin-top:10px"><button type="button" class="fgb-btn gold">' + L.applySfx[lang()] + '</button><span class="fgb-msg" style="text-align:center">' + msg + '</span></div>';
            host.querySelector('button').onclick = function (e) {
                e.stopPropagation();
                msg = bgm.applySfxToAll(o.sfx) ? L.applied[lang()] : L.failed[lang()];
                render();
            };
        }
        render();
        return render;
    }
    // ---- 設定画面がないゲーム/狭い設定画面用: 全画面のBGM設定パネル(BGM + 効果音の音量と適用ボタン) ----
    let panel = null;
    // o.mode = 'sfx' のときは効果音だけ、'all' のときは両方、それ以外はBGMだけを出す
    function openPanel(bgm, o) {
        style();
        o = o || {};
        bgm = bgm || create({ key: o.key });
        const lang = function () { let l = 'ja'; try { if (o.getLang) l = o.getLang(); } catch (e) {} return (l === 'ja_easy' || l === 'simple' || l === 'easy') ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
        if (!panel) {
            const ov = document.createElement('div');
            ov.className = 'fgb-ov hide';
            ov.innerHTML = '<div class="fgb-ov-in"><div class="fgb-ov-bar"><button type="button" class="fgb-btn gold" data-x="close"></button></div>' +
                '<div data-x="bgm"></div><div class="fgb fgb-sfx" data-x="sfxbox"><div class="fgb-title" data-x="sfxt"></div><div data-x="sfxvol" style="margin:8px 0"></div><div data-x="sfxapply"></div></div></div>';
            document.body.appendChild(ov);
            const q = function (n) { return ov.querySelector('[data-x="' + n + '"]'); };
            panel = { ov: ov, q: q, renders: [] };
            q('close').onclick = function (e) { e.stopPropagation(); ov.classList.add('hide'); };
            ov.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
            ov.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') ov.classList.add('hide'); });
            const r1 = settingsUI(q('bgm'), { bgm: bgm, sfx: o.sfx, getLang: o.getLang });
            panel.renders.push(r1);
            if (o.sfx) {
                if (window.FGLSfx && window.FGLSfx.volumeUI) panel.renders.push(window.FGLSfx.volumeUI(q('sfxvol'), o.sfx));
                if (o.sfxApply !== false) panel.renders.push(sfxApplyUI(q('sfxapply'), { bgm: bgm, sfx: o.sfx, getLang: o.getLang }));   // 自前の効果音のゲームは「全ゲームに適用」なし
            }
        }
        const sfxMode = o.mode === 'sfx';
        const allMode = o.mode === 'all';
        panel.q('bgm').style.display = sfxMode ? 'none' : '';
        panel.q('sfxbox').style.order = allMode ? '-1' : '0';      // 両方出すときは、すぐ変えられるよう効果音の音量を上に
        panel.q('sfxbox').style.display = (sfxMode || allMode) && o.sfx ? '' : 'none';
        panel.q('close').textContent = L.close[lang()];
        panel.q('sfxt').textContent = L.sfxTitle[lang()];
        panel.renders.forEach(function (r) { if (r) r(); });
        panel.ov.classList.remove('hide');
        panel.ov.scrollTop = 0;
    }
    // 画面のすみに 🎵 ボタンを置く(押すとBGM設定パネル)。FGLSfx.mountButton の姉妹
    function mountButton(bgm, o) {
        style();
        o = o || {};
        const fab = document.createElement('button');
        fab.type = 'button'; fab.className = 'fgb-fab'; fab.setAttribute('aria-label', 'BGM');
        ['top', 'right', 'bottom', 'left'].forEach(function (k) { if (o[k] !== undefined) fab.style[k] = (typeof o[k] === 'number' ? o[k] + 'px' : o[k]); });
        const paint = function () { fab.textContent = bgm.volume > 0 && bgm.selectedCount > 0 ? '🎵' : '🔇'; };
        bgm.onChange(paint); paint();
        fab.onclick = function (e) { e.stopPropagation(); openPanel(bgm, o); };
        (o.parent || document.body).appendChild(fab);
        return fab;
    }
    // ゲーム中も画面のすみに「⚙ 設定」ボタンを置く(押すとBGMと効果音の音量・選曲のパネル)。o.corner = 'br'|'bl'|'tr'|'tl'(初期値br)、o.dx/o.dy=すみからの距離px
    function mountGameButton(bgm, o) {
        style();
        o = o || {};
        const lang = function () { let l = 'ja'; try { if (o.getLang) l = o.getLang(); } catch (e) {} return (l === 'ja_easy' || l === 'simple' || l === 'easy') ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'fgb-gear'; b.setAttribute('aria-label', 'settings');
        const c = o.corner || 'br', dx = o.dx === undefined ? 8 : o.dx, dy = o.dy === undefined ? 8 : o.dy;
        let compact = false, userPos = false, dragged = false, curKey = '', failAt = 0;
        const paint = function () { b.textContent = compact ? '⚙' : L.gear[lang()]; b.classList.toggle('compact', compact); };
        const setXY = function (x, y) { b.style.right = b.style.bottom = ''; b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(y) + 'px'; };
        // すみ(c)の位置
        const prefXY = function () {
            const w = b.offsetWidth, h = b.offsetHeight, W = window.innerWidth, H = window.innerHeight;
            return [c.charAt(1) === 'l' ? dx : W - w - dx, c.charAt(0) === 't' ? dy : H - h - dy];
        };
        // ボタンの下にある、ゲームのボタン・文字・入力を探す
        const hits = function () {
            const r = b.getBoundingClientRect();
            if (!r.width || document.querySelector('.fgb-ov:not(.hide)')) return false;
            for (let i = 0; i <= 4; i++) for (let j = 0; j <= 1; j++) {
                const x = Math.min(r.right - 1, Math.max(r.left + 1, r.left + r.width * i / 4)), y = Math.min(r.bottom - 1, Math.max(r.top + 1, r.top + r.height * j));
                const els = document.elementsFromPoint(x, y);
                for (let k = 0; k < els.length; k++) {
                    const e = els[k];
                    if (e === b || e === document.documentElement || e === document.body) continue;
                    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL)$/.test(e.tagName) || e.getAttribute('onclick') || getComputedStyle(e).cursor === 'pointer') return true;
                    for (let n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
                }
            }
            return false;
        };
        // 重ならない場所を、すみ→画面のふち(下・上・右・左)の順に探す。なければ小さい⚙だけにして、もう一度探す
        const search = function () {
            const W = window.innerWidth, H = window.innerHeight;
            for (let pass = 0; pass < 2; pass++) {
                compact = pass === 1; paint();
                const w = b.offsetWidth, h = b.offsetHeight, cand = [prefXY()];
                ['br', 'bl', 'tr', 'tl'].forEach(function (k) { cand.push([k.charAt(1) === 'l' ? dx : W - w - dx, k.charAt(0) === 't' ? dy : H - h - dy]); });
                for (let x = W - w - dx; x >= dx; x -= 24) cand.push([x, H - h - dy]);
                for (let x = W - w - dx; x >= dx; x -= 24) cand.push([x, dy]);
                for (let y = H - h - dy; y >= dy; y -= 24) cand.push([W - w - dx, y]);
                for (let y = H - h - dy; y >= dy; y -= 24) cand.push([dx, y]);
                for (let i = 0; i < cand.length; i++) { setXY(cand[i][0], cand[i][1]); if (!hits()) return true; }
            }
            compact = false; paint(); const p = prefXY(); setXY(p[0], p[1]);
            return false;
        };
        const avoid = function () {
            if (o.fixed || userPos || document.hidden || document.querySelector('.fgb-ov:not(.hide)')) return;
            const key = window.innerWidth + 'x' + window.innerHeight;
            if (!hits()) {
                // いま好みの場所でなくても、好みの場所があいたらもどる
                const p = prefXY(), cx = b.offsetLeft, cy = b.offsetTop;
                if (Math.abs(p[0] - cx) + Math.abs(p[1] - cy) > 4 || compact) {
                    const sx = b.style.left, sy = b.style.top, sc = compact;
                    compact = false; paint(); const q = prefXY(); setXY(q[0], q[1]);
                    if (hits()) { compact = sc; paint(); b.style.left = sx; b.style.top = sy; }
                }
                return;
            }
            if (Date.now() - failAt < 4000 && key === curKey) return;
            curKey = key;
            if (!search()) failAt = Date.now();
        };
        paint();
        { const p = prefXY(); setXY(p[0], p[1]); }
        // ドラッグで好きな場所へ動かせる。位置はゲームごとに覚える
        const posKey = 'fgl_gear_' + (o.key || (document.title || 'game'));
        const putAt = function (fx, fy) {
            const vw = window.innerWidth, vh = window.innerHeight, w = b.offsetWidth, h = b.offsetHeight;
            setXY(Math.max(2, Math.min(vw - w - 2, fx * vw - w / 2)), Math.max(2, Math.min(vh - h - 2, fy * vh - h / 2)));
        };
        let drag = null;
        b.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, on: false }; dragged = false; });
        window.addEventListener('pointermove', function (e) {
            if (!drag) return;
            if (!drag.on && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 10) { drag.on = true; dragged = true; userPos = true; }
            if (drag.on) { e.preventDefault(); putAt(e.clientX / window.innerWidth, e.clientY / window.innerHeight); }
        }, { passive: false });
        window.addEventListener('pointerup', function (e) {
            if (drag && drag.on) { try { localStorage.setItem(posKey, JSON.stringify({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })); } catch (er) {} }
            drag = null;
        });
        b.style.touchAction = 'none';
        b.onclick = function (e) { e.stopPropagation(); if (dragged) { dragged = false; return; } openPanel(bgm, Object.assign({}, o, { mode: 'all' })); };
        (o.parent || document.body).appendChild(b);
        try { const sp = JSON.parse(localStorage.getItem(posKey) || 'null'); if (sp && typeof sp.x === 'number') { userPos = true; setTimeout(function () { putAt(sp.x, sp.y); }, 0); window.addEventListener('resize', function () { putAt(sp.x, sp.y); }); } } catch (e) {}
        setInterval(function () { paint(); avoid(); }, 700);
        setTimeout(avoid, 300);
        return b;
    }
    // 設定画面の中に「🎵 BGMのせってい」ボタンを入れる(押すとBGM設定パネル)。o.before=この要素の前に入れる / o.parent=この要素の最後に入れる
    function settingsButton(bgm, o) {
        style();
        o = o || {};
        const lang = function () { let l = 'ja'; try { if (o.getLang) l = o.getLang(); } catch (e) {} return (l === 'ja_easy' || l === 'simple' || l === 'easy') ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
        const wrap = document.createElement('div');
        wrap.style.cssText = 'text-align:center;margin:12px 0';
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'fgb-btn gold'; b.style.fontSize = '1.05rem';
        let b2 = null;
        const paint = function () { b.textContent = L.open[lang()]; if (b2) b2.textContent = L.openSfx[lang()]; };
        paint();
        b.onclick = function (e) { e.stopPropagation(); openPanel(bgm, o); };
        wrap.appendChild(b);
        if (o.sfx) {
            b2 = document.createElement('button');
            b2.type = 'button'; b2.className = 'fgb-btn gold'; b2.style.cssText = 'font-size:1.05rem;margin-left:10px';
            b2.onclick = function (e) { e.stopPropagation(); openPanel(bgm, Object.assign({}, o, { mode: 'sfx' })); };
            wrap.appendChild(b2);
            paint();
        }
        const place = function () {
            const aft = o.after ? document.querySelector(o.after) : null;
            if (aft && aft.parentNode) { aft.parentNode.insertBefore(wrap, aft.nextSibling); return true; }
            const ref = o.before ? document.querySelector(o.before) : null;
            if (ref && ref.parentNode) { const anc = ref.parentElement && ref.parentElement.children.length === 1 && ref.parentElement.parentNode ? ref.parentElement : ref; anc.parentNode.insertBefore(wrap, anc); return true; }
            const par = o.parent ? document.querySelector(o.parent) : null;
            if (par) { par.appendChild(wrap); return true; }
            return false;
        };
        place();
        // 設定画面が作り直されたら入れなおす。言語を切り替えたらラベルも変える
        setInterval(function () { if (!wrap.isConnected) place(); else if (b.offsetParent) paint(); }, 600);
        return function () { if (!wrap.isConnected) place(); paint(); };      // 設定画面を開いたとき/言語を切り替えたときに呼ぶと、すぐ入れなおす
    }
    window.FGLBgm = { create: create, settingsUI: settingsUI, sfxApplyUI: sfxApplyUI, openPanel: openPanel, mountButton: mountButton, mountGameButton: mountGameButton, settingsButton: settingsButton, TRACKS: TRACKS };
})();
