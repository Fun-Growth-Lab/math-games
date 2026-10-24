// 全ゲーム共通の効果音エンジン(ブラウザ内蔵の音源で合成。音声ファイルは使わない)。
//   <script src="../fgl-sfx.js?v=1"></script>
//   const SFX = FGLSfx.create({ key:'colorcross' });   // 音量はゲームごとに別。保存キー fgl_vol_<key>
//   SFX.play('place');  SFX.play('clear', 3);           // 第2引数は音名ごとの強さ(コンボ数など)
//   SFX.volume / SFX.setVolume(0〜10) / SFX.lastVolume / SFX.unlock()
//   FGLSfx.volumeUI(host, SFX, {label})                  // 設定画面に「ミュート + 10段バー」を置く(DOM)
//   FGLSfx.mountButton(SFX, {top, right, ...})           // 設定画面がないゲーム用の 🔊 ボタン(押すと音量バー)
// 音量は 0〜10 の11段階(0 = OFF、初期値5)。トレジャークラフトと同じ段階と音の大きさ。
(function () {
    const instances = [];
    const NOTE = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988, C6: 1047, D6: 1175, E6: 1319, G6: 1568, C7: 2093 };

    function create(opts) {
        opts = opts || {};
        const storeKey = 'fgl_vol_' + (opts.key || 'game');
        let ac = null, master = null, count = 0, vol = 5, lastVol = 5, gesture = false;
        const lastAt = {};
        try {
            const v = localStorage.getItem(storeKey);
            if (v !== null) vol = Math.max(0, Math.min(10, parseInt(v, 10) || 0));
            else if (opts.legacyKey) {
                const o = localStorage.getItem(opts.legacyKey);
                if (o !== null) vol = Math.max(0, Math.min(10, parseInt(o, 10) || 0));
            }
        } catch (e) {}
        if (vol > 0) lastVol = vol;
        const gainOf = () => Math.pow(vol / 5, 1.4);

        function audio() {
            if (!ac) {
                try {
                    ac = new (window.AudioContext || window.webkitAudioContext)();
                    master = ac.createGain(); master.gain.value = gainOf();
                    const comp = ac.createDynamicsCompressor();   // 重なっても音割れしないように
                    master.connect(comp); comp.connect(ac.destination);
                } catch (e) { return null; }
            }
            if (ac.state === 'suspended') ac.resume();
            return ac;
        }
        // 音をひとつ鳴らす。freq から slideTo へなめらかに変化させられる
        function tone(freq, t0, dur, type, v0, slideTo) {
            const a = audio(); if (!a) return;
            const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v0 || 0.1), t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(master);
            o.start(t); o.stop(t + dur + 0.05);
        }
        // ノイズ(こすれる音・ぶつかる音)。cutoff から cutTo へフィルターを動かせる
        function noise(t0, dur, v0, cutoff, cutTo) {
            const a = audio(); if (!a) return;
            const t = a.currentTime + t0, n = Math.max(1, Math.floor(a.sampleRate * dur));
            const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const s = a.createBufferSource(); s.buffer = buf;
            const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
            f.frequency.setValueAtTime(cutoff || 1500, t);
            if (cutTo) f.frequency.exponentialRampToValueAtTime(cutTo, t + dur);
            const g = a.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v0 || 0.1), t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            s.connect(f); f.connect(g); g.connect(master);
            s.start(t); s.stop(t + dur + 0.05);
        }
        const seq = (notes, step, type, v, len) => notes.forEach((f, i) => tone(f, i * step, len || step * 1.7, type, v));
        const N = NOTE;
        // arg は音名ごとの強さ(コンボ数・段階など)。使わない音は無視する
        const sounds = {
            // --- ボタン・メニュー ---
            click: () => tone(720, 0, 0.05, 'triangle', 0.07),
            select: () => tone(980, 0, 0.035, 'sine', 0.06),
            ok: () => seq([N.C5, N.G5], 0.07, 'triangle', 0.1),                 // はじめる・決定
            back: () => seq([N.G4, N.C4 * 1.0], 0.07, 'triangle', 0.08),         // もどる・とじる
            toggle: () => tone(560, 0, 0.06, 'square', 0.05),
            preview: () => { tone(988, 0, 0.08, 'square', 0.07); tone(1319, 0.07, 0.18, 'square', 0.07); },
            // --- 盤面・カード ---
            place: () => { tone(330, 0, 0.09, 'triangle', 0.12, 200); noise(0, 0.05, 0.06, 1800, 900); },
            move: () => { tone(480, 0, 0.09, 'sine', 0.08, 760); noise(0, 0.07, 0.03, 2500, 3500); },
            swap: () => { tone(520, 0, 0.06, 'sine', 0.08, 700); tone(700, 0.06, 0.07, 'sine', 0.08, 520); },
            discard: () => { noise(0, 0.16, 0.08, 2800, 500); tone(380, 0, 0.14, 'triangle', 0.06, 170); },
            merge: () => { seq([N.E5, N.G5, N.C6], 0.06, 'triangle', 0.11); tone(N.E6, 0.18, 0.2, 'sine', 0.07); },
            spawn: () => tone(260, 0, 0.05, 'sine', 0.05, 330),
            clear: (lv) => { lv = Math.max(0, Math.min(6, lv || 0)); const b = N.C5 * Math.pow(1.0595, lv * 2); tone(b, 0, 0.1, 'triangle', 0.12); tone(b * 1.5, 0.07, 0.22, 'triangle', 0.12); },
            bigclear: () => { seq([N.C5, N.E5, N.G5, N.C6], 0.07, 'triangle', 0.12); tone(N.E6, 0.3, 0.4, 'sine', 0.09); tone(N.G6, 0.3, 0.4, 'sine', 0.06); },
            garbage: () => { tone(140, 0, 0.18, 'triangle', 0.14, 60); noise(0, 0.08, 0.07, 500, 250); },
            garbagebreak: () => { noise(0, 0.14, 0.09, 1600, 400); tone(300, 0, 0.1, 'square', 0.05, 120); },
            chest: () => seq([N.G5, N.B5, N.D6], 0.06, 'sine', 0.1),
            crown: () => { seq([N.C5, N.E5, N.G5, N.C6], 0.08, 'square', 0.07); tone(N.E6, 0.36, 0.5, 'triangle', 0.1); },
            // --- アイテム・おかね ---
            item: () => seq([N.G5, N.B5, N.D6], 0.06, 'sine', 0.12),
            itemuse: () => { tone(300, 0, 0.3, 'sawtooth', 0.05, 1300); tone(N.C6, 0.26, 0.2, 'triangle', 0.08); },
            coin: () => { tone(988, 0, 0.08, 'square', 0.07); tone(1319, 0.07, 0.18, 'square', 0.07); },
            buy: () => { tone(880, 0, 0.07, 'triangle', 0.1); tone(1175, 0.07, 0.07, 'triangle', 0.1); tone(1568, 0.14, 0.16, 'triangle', 0.1); },
            equip: () => { tone(300, 0, 0.06, 'square', 0.07); tone(450, 0.06, 0.1, 'square', 0.07); },
            heal: () => seq([N.E5, N.G5, N.C6], 0.07, 'sine', 0.11, 0.2),
            // --- せいかい・まちがい ---
            correct: () => { tone(N.E5, 0, 0.09, 'triangle', 0.12); tone(N.A5, 0.08, 0.2, 'triangle', 0.12); },
            wrong: () => { tone(200, 0, 0.12, 'square', 0.07); tone(150, 0.1, 0.2, 'square', 0.07); },
            error: () => { tone(220, 0, 0.12, 'square', 0.07); tone(165, 0.1, 0.18, 'square', 0.07); },
            miss: () => tone(300, 0, 0.18, 'sine', 0.08, 180),
            combo: (n) => { n = Math.max(1, Math.min(8, n || 1)); const b = N.C5 * Math.pow(1.0595, n * 2); tone(b, 0, 0.08, 'square', 0.07); tone(b * 1.25, 0.06, 0.08, 'square', 0.07); tone(b * 1.5, 0.12, 0.18, 'square', 0.07); },
            // --- たたかい ---
            attack: () => { noise(0, 0.1, 0.1, 3200, 800); tone(520, 0, 0.1, 'sawtooth', 0.07, 200); },
            hit: () => { tone(200, 0, 0.12, 'square', 0.1, 90); noise(0, 0.08, 0.08, 1200, 400); },
            hurt: () => { tone(260, 0, 0.22, 'sawtooth', 0.09, 90); noise(0, 0.12, 0.07, 900, 300); },
            guard: () => { tone(900, 0, 0.07, 'square', 0.08); noise(0, 0.06, 0.07, 3500, 2500); },
            crit: () => { noise(0, 0.12, 0.1, 3600, 900); seq([N.C6, N.G6], 0.05, 'square', 0.08, 0.14); },
            // --- けっか ---
            start: () => seq([N.C5, N.G5], 0.09, 'triangle', 0.1),
            levelup: () => { seq([N.C5, N.E5, N.G5, N.C6], 0.09, 'square', 0.08); tone(N.G6, 0.4, 0.5, 'triangle', 0.1); },
            unlock: () => seq([N.C5, N.E5, N.G5, N.C6, N.E6], 0.07, 'square', 0.07),
            clearstage: () => { seq([N.C5, N.E5, N.G5], 0.09, 'triangle', 0.11); tone(N.C6, 0.3, 0.5, 'triangle', 0.12); tone(N.E6, 0.3, 0.5, 'sine', 0.08); },
            fanfare: () => { seq([N.C5, N.C5, N.C5, N.G5, N.E5, N.G5, N.C6], 0.13, 'square', 0.08, 0.2); tone(N.C6, 0.95, 0.7, 'triangle', 0.1); tone(N.E6, 0.95, 0.7, 'triangle', 0.08); },
            gameover: () => { seq([N.G4, N.E4, N.D4, N.C4], 0.16, 'triangle', 0.11, 0.3); tone(N.C4 / 2, 0.64, 0.6, 'sine', 0.1); },
            record: () => { seq([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], 0.07, 'triangle', 0.1); tone(N.C7, 0.45, 0.6, 'sine', 0.07); },
            tick: () => tone(1400, 0, 0.025, 'square', 0.04),
            warn: () => { tone(880, 0, 0.1, 'square', 0.06); tone(880, 0.16, 0.1, 'square', 0.06); }
        };

        const api = {
            play(name, arg) {
                if (vol <= 0 || !gesture) return;     // 最初の操作の前は鳴らさない(あとでまとめて鳴るのを防ぐ)
                const now = Date.now();
                if (now - (lastAt[name] || 0) < 35) return;       // 同じ音が一瞬に何度も鳴らないように
                lastAt[name] = now;
                count++;
                try { if (sounds[name]) { audio(); sounds[name](arg); } } catch (e) {}
            },
            get count() { return count; },
            get volume() { return vol; },
            get lastVolume() { return lastVol; },
            // 音量を決める。聞いて確かめられるよう、0より大きいときは短い音を鳴らす
            setVolume(n) {
                n = Math.max(0, Math.min(10, Math.round(n)));
                if (vol > 0) lastVol = vol;
                vol = n;
                try { localStorage.setItem(storeKey, String(vol)); } catch (e) {}
                if (master) master.gain.value = gainOf();
                if (vol > 0) { audio(); if (master) master.gain.value = gainOf(); this.play('preview'); }
                (api._onChange || []).forEach(f => f());
            },
            toggleMute() { this.setVolume(vol > 0 ? 0 : (lastVol || 5)); },
            unlock() { if (vol > 0) audio(); },
            onChange(f) { (api._onChange = api._onChange || []).push(f); }
        };
        // ブラウザは最初の操作のあとでしか音を出せないので、最初の操作で準備する
        const once = () => { gesture = true; api.unlock(); };
        ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, once, { capture: true, passive: true }));
        instances.push(api);
        return api;
    }

    // ---- 音量バー(DOM)。設定画面に置く ----
    let styled = false;
    function style() {
        if (styled) return; styled = true;
        const s = document.createElement('style');
        s.textContent =
            '.fgs-row{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:nowrap}' +
            '.fgs-mute{flex:none;width:52px;height:44px;border-radius:15px;border:3px solid #fff;font-size:1.4rem;line-height:1;cursor:pointer;color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.25);font-family:inherit;padding:0}' +
            '.fgs-mute.on{background:linear-gradient(#6fb0ff,#3d7ff0)}.fgs-mute.off{background:linear-gradient(#ff8c8c,#ff4d4d)}' +
            '.fgs-bars{display:flex;align-items:flex-end;gap:5px;height:44px}' +
            '.fgs-bar{width:20px;border-radius:6px;border:2px solid rgba(255,255,255,.9);cursor:pointer;padding:0;box-shadow:0 3px 0 rgba(0,0,0,.2);background:#d5dbe0}' +
            '.fgs-bar.f{background:linear-gradient(#7ee08a,#32b34a)}' +
            '.fgs-lab{text-align:center;font-weight:900;margin:0 0 8px;font-size:.95rem;color:inherit;opacity:.85}' +
            '.fgs-fab{position:fixed;z-index:9000;width:44px;height:44px;border-radius:50%;border:3px solid #fff;font-size:1.25rem;line-height:1;cursor:pointer;color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.28),0 6px 14px rgba(0,0,0,.25);padding:0;font-family:inherit;touch-action:manipulation}' +
            '.fgs-fab.on{background:linear-gradient(#6fb0ff,#3d7ff0)}.fgs-fab.off{background:linear-gradient(#ff8c8c,#ff4d4d)}' +
            '.fgs-pop{position:fixed;z-index:9001;padding:12px 14px 14px;border-radius:18px;background:rgba(255,255,255,.97);border:3px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.18),0 10px 24px rgba(0,0,0,.3);color:#334}' +
            '.fgs-pop.hide{display:none}';
        document.head.appendChild(s);
    }
    function volumeUI(host, sfx, o) {
        style();
        if (typeof host === 'string') host = document.querySelector(host);
        if (!host) return;
        o = o || {};
        function render() {
            const v = sfx.volume;
            let h = '';
            if (o.label) h += '<p class="fgs-lab">' + o.label + '</p>';
            h += '<div class="fgs-row"><button type="button" class="fgs-mute ' + (v > 0 ? 'on' : 'off') + '" data-v="mute" aria-label="mute">' + (v > 0 ? '🔊' : '🔇') + '</button><div class="fgs-bars">';
            for (let i = 1; i <= 10; i++) h += '<button type="button" class="fgs-bar' + (i <= v ? ' f' : '') + '" data-v="' + i + '" style="height:' + (10 + i * 3.4) + 'px" aria-label="' + i + '"></button>';
            h += '</div></div>';
            host.innerHTML = h;
            host.querySelectorAll('button').forEach(b => {
                b.onclick = (e) => { e.stopPropagation(); if (b.dataset.v === 'mute') sfx.toggleMute(); else sfx.setVolume(parseInt(b.dataset.v, 10)); render(); };
            });
        }
        render();
        return render;
    }
    // 設定画面がないゲーム用。画面のすみに 🔊 ボタンを置き、押すと音量バーが開く
    function mountButton(sfx, o) {
        style();
        o = o || {};
        const fab = document.createElement('button');
        fab.type = 'button'; fab.className = 'fgs-fab'; fab.setAttribute('aria-label', 'volume');
        const pos = (el, extra) => { ['top', 'right', 'bottom', 'left'].forEach(k => { if (o[k] !== undefined) el.style[k] = (typeof o[k] === 'number' ? o[k] + 'px' : o[k]); }); if (extra) extra(el); };
        pos(fab);
        if (o.parent !== undefined) { /* 指定の親に入れる */ }
        const pop = document.createElement('div'); pop.className = 'fgs-pop hide';
        const popHost = document.createElement('div'); pop.appendChild(popHost);
        (o.parent || document.body).appendChild(fab); (o.parent || document.body).appendChild(pop);
        const paint = () => { fab.className = 'fgs-fab ' + (sfx.volume > 0 ? 'on' : 'off'); fab.textContent = sfx.volume > 0 ? '🔊' : '🔇'; };
        const redraw = volumeUI(popHost, sfx, { label: o.label });
        sfx.onChange(() => { paint(); redraw(); });
        paint();
        fab.onclick = (e) => {
            e.stopPropagation();
            const open = pop.classList.toggle('hide') === false;
            if (open) {
                const r = fab.getBoundingClientRect(), pw = 340;
                pop.style.width = pw + 'px';
                let left = Math.min(window.innerWidth - pw - 8, Math.max(8, r.right - pw));
                pop.style.left = left + 'px';
                pop.style.top = (r.bottom + 10 + 120 > window.innerHeight ? Math.max(8, r.top - 10 - 100) : r.bottom + 10) + 'px';
                sfx.play('click');
            }
        };
        document.addEventListener('pointerdown', (e) => { if (!pop.contains(e.target) && e.target !== fab) pop.classList.add('hide'); }, true);
        return { fab, pop };
    }
    // ---- メニューのボタン音(重要ボタンだけ)。タイトル・ダイアログ共通 ----
    //   ok: はじめる/決定  back: もどる/とじる  select: タブ切替  click: 画面を開く
    //   o.ok / o.click / o.back / o.select に追加のセレクタを渡せる
    function buttonSound(b, o) {
        o = o || {};
        const m = (sel) => sel && b.matches(sel);
        const id = b.id || '';
        if (id === 'btn-start-menu' || id === 'btn-tutorial' || m(o.ok)) return 'ok';
        if (/^btn-(close|back)/.test(id) || m(o.back)) return 'back';
        if (b.classList.contains('rank-toggle-btn') || b.classList.contains('lang-btn') || m(o.select)) return 'select';
        if (/^(btn-view-ranking|btn-view-achievement|btn-open-settings|player-select-btn|btn-add-player)$/.test(id) || m(o.click)) return 'click';
        return null;
    }
    function menuSounds(sfx, o) {
        document.addEventListener('click', (e) => {
            const b = e.target.closest && e.target.closest('button,a.btn,a.btn3d');
            if (!b || b.closest('.fgs-row,.fgs-pop')) return;
            const n = buttonSound(b, o);
            if (n) sfx.play(n);
        });
    }
    // 設定画面(#settings-screen)の「とじる」ボタンの手前に 効果音の音量バーを入れる
    function settingsRow(sfx, o) {
        style();
        o = o || {};
        const close = document.querySelector(o.before || '#btn-close-settings');
        if (!close) return;
        const anchor = o.anchor ? document.querySelector(o.anchor) : (close.parentElement.children.length === 1 ? close.parentElement : close);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin:16px 0 4px;text-align:center';
        wrap.innerHTML = '<p class="fgs-lab" style="margin:0 0 8px;font-size:.9rem;opacity:.85">' + (o.label || '🔊 こうかおん / Sound') + '</p><div class="fgs-host"></div>';
        anchor.parentNode.insertBefore(wrap, anchor);
        return volumeUI(wrap.querySelector('.fgs-host'), sfx);
    }
    window.FGLSfx = { create, volumeUI, mountButton, menuSounds, buttonSound, settingsRow, NOTE };
})();
