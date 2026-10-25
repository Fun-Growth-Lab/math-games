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
        ['racing', 'Racing Loop'], ['seamless', 'Seamless Loop'], ['wheel', 'Spin the Dream Wheel'], ['pop', 'Super Pop'], ['map', 'The Map of Wonders']
    ].map(function (a) { return { id: a[0], title: a[1], file: a[1] + '.mp3' }; });
    const K_ALL = 'fgl_bgm_all', K_NOW = 'fgl_bgm_now', RESUME_MS = 15 * 60 * 1000;
    const gainOf = function (v) { return Math.pow(v / 10, 1.7) * 0.85; };

    function normalize(o) {
        const r = { vol: 5, tracks: null };
        if (o && typeof o === 'object') {
            if (typeof o.vol === 'number') r.vol = Math.max(0, Math.min(10, Math.round(o.vol)));
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
        let vol = st.vol, lastVol = vol > 0 ? vol : 5, sel = st.tracks;     // sel: null=すべて / ['id',...]
        const a = new Audio(); a.preload = 'auto';
        let cur = null, gesture = false, userPaused = false, fadeTimer = null, errCount = 0;
        const listeners = [];
        const notify = function () { listeners.forEach(function (f) { try { f(); } catch (e) {} }); };
        const isSel = function (id) { return !sel || sel.indexOf(id) >= 0; };
        const selected = function () { return TRACKS.filter(function (t) { return isSel(t.id); }); };
        const byId = function (id) { return TRACKS.filter(function (t) { return t.id === id; })[0] || null; };
        function save() { try { localStorage.setItem(storeKey, JSON.stringify({ vol: vol, tracks: sel })); } catch (e) {} }
        function saveNow() {
            if (!cur || a.paused) return;
            try { localStorage.setItem(K_NOW, JSON.stringify({ id: cur, pos: a.currentTime || 0, ts: Date.now() })); } catch (e) {}
        }
        function pick(excl) {
            const list = selected();
            if (!list.length) return null;
            const pool = list.length > 1 ? list.filter(function (t) { return t.id !== excl; }) : list;
            return pool[Math.floor(Math.random() * pool.length)];
        }
        function ramp() {
            clearInterval(fadeTimer);
            let t = 0;
            fadeTimer = setInterval(function () {
                t += 50;
                a.volume = Math.min(1, gainOf(vol) * Math.min(1, t / 900));
                if (t >= 900) clearInterval(fadeTimer);
            }, 50);
        }
        function tryPlay() {
            if (vol <= 0 || !gesture || userPaused || document.hidden) return;
            a.volume = 0;
            const p = a.play();
            if (p && p.then) p.then(function () { ramp(); notify(); }).catch(function () {});
        }
        function playTrack(id, o) {
            o = o || {};
            const t = byId(id) || pick(null);
            if (!t) { a.pause(); cur = null; notify(); return; }
            cur = t.id;
            a.src = BASE + encodeURIComponent(t.file);
            if (o.pos > 1) {
                const seek = function () { a.removeEventListener('loadedmetadata', seek); try { a.currentTime = o.pos; } catch (e) {} };
                a.addEventListener('loadedmetadata', seek);
            }
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
            if (vol <= 0 || !gesture || userPaused || document.hidden || !selected().length) return;
            if (!cur) startInitial();
            else if (a.paused) tryPlay();
        }
        a.addEventListener('ended', function () { const t = pick(cur); if (t) playTrack(t.id); else { cur = null; notify(); } });
        a.addEventListener('error', function () { if (++errCount < 6) setTimeout(function () { const t = pick(cur); if (t) playTrack(t.id); }, 800); });
        a.addEventListener('playing', function () { errCount = 0; notify(); });
        a.addEventListener('pause', notify);
        const onGesture = function () {
            gesture = true;
            ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { document.removeEventListener(ev, onGesture, true); });
            ensurePlaying();
        };
        ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
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
                playTrack(id);
            },
            next: function () { const t = pick(cur); if (!t) return; if (vol === 0) { vol = lastVol || 5; save(); } userPaused = false; gesture = true; playTrack(t.id); },
            onChange: function (f) { listeners.push(f); },
            // 全ゲームに適用(BGM): 音量と選曲を共通設定にして、ゲームごとのBGM設定を消す
            applyBgmToAll: function () {
                try {
                    localStorage.setItem(K_ALL, JSON.stringify({ vol: vol, tracks: sel }));
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
        failed:  { ja: '保存できませんでした', easy: 'ほぞん できなかったよ', en: 'Could not save' }
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
            '.fgb-msg{display:block;margin-top:6px;font-weight:900;font-size:.95rem;color:#7ae8dc;min-height:1.2em}';
        document.head.appendChild(s);
    }
    function settingsUI(host, o) {
        style();
        if (typeof host === 'string') host = document.querySelector(host);
        if (!host) return null;
        o = o || {};
        const bgm = o.bgm || create({ key: o.key });
        const lang = function () { const l = o.getLang ? o.getLang() : 'ja'; return l === 'ja_easy' ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
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
        const lang = function () { const l = o.getLang ? o.getLang() : 'ja'; return l === 'ja_easy' ? 'easy' : (l === 'en' ? 'en' : 'ja'); };
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
    window.FGLBgm = { create: create, settingsUI: settingsUI, sfxApplyUI: sfxApplyUI, TRACKS: TRACKS };
})();
