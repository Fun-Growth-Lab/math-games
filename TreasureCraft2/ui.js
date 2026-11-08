// トレジャークラフト2: 画面と操作(HUD・持ち物・クラフト・地図・タイトル・ランキング・チュートリアル)
'use strict';
const $ = id => document.getElementById(id);
const SFX = FGLSfx.create({ key: 'treasurecraft2' });
const BGM = FGLBgm.create({ key: 'treasurecraft2' });
const MOVE_MS = 125, SWIM_MS = 240, FIRST_REPEAT_MS = 190;
const moveWait = () => TILE[getT(S.f, S.x, S.y)].swim ? SWIM_MS : MOVE_MS;
let mode = 'title', held = null, holdLock = false, nextAct = 0, turnOnly = false, autoPath = [], logs = [], stageScale = 1, stageRot = false;

// ---------- 舞台の大きさ ----------
function fit() {
    const w = innerWidth, h = innerHeight, st = $('stage');
    stageRot = h > w;
    if (stageRot) {
        stageScale = Math.min(h / 1280, w / 720);
        st.style.transform = 'translate(' + ((w + 720 * stageScale) / 2) + 'px,' + ((h - 1280 * stageScale) / 2) + 'px) rotate(90deg) scale(' + stageScale + ')';
    } else {
        stageScale = Math.min(w / 1280, h / 720);
        st.style.transform = 'translate(' + ((w - 1280 * stageScale) / 2) + 'px,' + ((h - 720 * stageScale) / 2) + 'px) scale(' + stageScale + ')';
    }
}
addEventListener('resize', fit); fit();
// タッチの機器では、指で押せる大きさ(十字1つが実寸56px以上)になるよう操作部品を広げる
function fitTouch() {
    if (!window.matchMedia || !matchMedia('(pointer: coarse)').matches || document.body.classList.contains('haskeys')) { document.body.classList.remove('bigui'); return; }
    const k = Math.max(1, Math.min(1.7, 56 / (78 * stageScale)));
    const left = 14 + 156 * k + 10, right = 216 * k + 24, kh = Math.max(1, Math.min(k, (1280 - left - right) / 586));
    document.body.classList.add('bigui');
    const st = document.body.style;
    st.setProperty('--k', k); st.setProperty('--kh', kh); st.setProperty('--hl', Math.max(left, Math.min((1280 - 586 * kh) / 2, 1280 - right - 586 * kh)) + 'px');   // 手持ちは できるだけ画面のまん中に st.setProperty('--logb', (98 * kh + 14) + 'px');
}
addEventListener('resize', fitTouch); fitTouch();
function clientToStage(cx, cy) {
    const r = $('stage').getBoundingClientRect();
    if (stageRot) return [(cy - r.top) / stageScale, 720 - (cx - r.left) / stageScale];
    return [(cx - r.left) / stageScale, (cy - r.top) / stageScale];
}

// ---------- ゲームから画面への指示 ----------
Object.assign(H, {
    log(text, cls) { logs.push({ text, cls, at: performance.now() }); if (logs.length > 3) logs.shift(); drawLog(); },
    gain(id, n) {
        // まだ出ていない同じ物は まとめる(連続で掘っても文字がたまり続けないように)
        const q = FX.gains.find(g => g.id === id);
        if (q) q.n += n; else FX.gains.push({ id, n });
        VIEW.needDraw = true;
    },
    float(x, y, text, c, big) {
        FX.floats.push({ x, y, z: 1, text, c, life: 1, size: big ? 30 : 20 });
        if (big && x === S.x && y === S.y) P.flash = 1;
        VIEW.needDraw = true;
    },
    chips(x, y, c) {
        if (Math.abs(x - S.x) + Math.abs(y - S.y) === 1) { P.ax = (x - S.x) * .3; P.ay = (y - S.y) * .3; }   // たたく動き
        for (let i = 0; i < 6; i++) FX.parts.push({ x: x + .5, y: y + .5, z: .5, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, vz: 1 + Math.random() * 2, c, life: .5 });
        VIEW.needDraw = true;
    },
    shake(n) { VIEW.shake = Math.max(VIEW.shake, n); },
    sfx(n) { SFX.play(n); },
    slash(x, y, crit) { FX.slashes.push({ x, y, crit, life: 1 }); P.ax = Math.sign(x - S.x) * .35; P.ay = Math.sign(y - S.y) * .35; },
    shot(x0, y0, x1, y1, c, arrow) { FX.shots.push({ x0, y0, x1, y1, c, arrow, t: 0 }); VIEW.needDraw = true; },
    seen(f, cx, cy) { mapPaint(f, cx, cy); },
    achieve(a) { achQueue.push(a); showAchToast(); },
    refresh() { refreshHud(); VIEW.needDraw = true; },
    banner(a, b) { showBanner(a, b); },
    floorFx(text) { fadeFx(text); },
    dead(src) { holdLock = true; autoPath = []; setTimeout(showDead, 50, src); },
    victory() { setTimeout(showVictory, 1200); },
    openCraft(st, x, y) { panelTarget = { x, y, st }; openPanel(st === 'furnace' ? 'make' : 'tool', true); },
    openChest(k) { openChest(k); },
    openBed(x, y) { openBedDialog(x, y); },
    openTrade(m) { openTrade(m); },
    stopHold() { holdLock = true; autoPath = []; fishing = null; }
});
// 実績の知らせ: 順番に出す。操作は止めない
const achQueue = [];
let achShowing = false;
function showAchToast() {
    if (achShowing || !achQueue.length) return;
    const a = achQueue.shift(), el = $('ach-toast');
    achShowing = true;
    el.innerHTML = '<b>🏆 実績 ' + a.n + '</b><span>' + a.d + '</span>';
    el.classList.add('on');
    SFX.play('unlock');
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => { achShowing = false; showAchToast(); }, 350); }, 2800);
}
function drawLog() {
    const now = performance.now();
    logs = logs.filter(l => now - l.at < 4500);
    $('log').innerHTML = logs.map(l => '<div class="' + (l.cls || '') + '">' + l.text + '</div>').join('');
}
setInterval(() => { if (logs.length) drawLog(); }, 800);
function showBanner(a, b) {
    const el = $('banner'); el.querySelector('b').textContent = a; el.querySelector('span').textContent = b || '';
    el.style.opacity = 1;
    clearTimeout(showBanner.t); showBanner.t = setTimeout(() => el.style.opacity = 0, 2400);
}
function fadeFx(text) {
    const el = $('fade'); el.textContent = text || ''; el.style.opacity = 1;
    setTimeout(() => { snapView(); el.style.opacity = 0; }, 420);
}

// ---------- HUD ----------
function slotHtml(s, opt) {
    opt = opt || {};
    let inner = '';
    if (s) {
        if (s.tool) {
            const st = toolStats(s.tool);
            inner = '<img src="' + toolIconUrl(s.tool) + '" alt=""><span class="dur"><i style="width:' + Math.max(3, 100 * s.tool.d / st.dur) + '%;background:' + matColor(s.tool) + '"></i></span>' + (s.tool.eq ? '<span class="eq">E</span>' : '');
        } else {
            const u = iconUrl(s.id);
            inner = (u ? '<img src="' + u + '" alt="">' : '<span class="emo">' + (ITEM[s.id].e || '❔') + '</span>') + (s.n > 1 ? '<span class="n">' + s.n + '</span>' : '');
        }
    }
    return '<button class="slot' + (opt.sel ? ' sel' : '') + '" data-i="' + opt.i + '"' + (s ? ' data-tip="' + slotTip(s) + '"' : '') + '>' + (opt.key ? '<span class="key">' + opt.key + '</span>' : '') + inner + '</button>';
}
const TOOL_KIND_KEYS = Object.keys(TOOL_KINDS);
function matColor(t) { return ({ wood: '#a8743c', stone: '#8e8e8a', bone: '#d8d0b8', copper: '#e08a4a', gold: '#ffd84a', iron: '#b8c0c8', ancient: '#5ac8a8', star: '#7fe8ff', demon: '#a030b0', hide: '#9c6a3c' })[t.a] || '#6ad05a'; }
function slotTip(s) {
    if (s.tool) { const q = toolStats(s.tool); return toolName(s.tool) + (s.tool.k === 'armor' ? ' 守り' + q.def : s.tool.k === 'bow' ? ' 攻撃' + q.atk + ' 射程' + q.range : ' 攻撃' + q.atk + ' 掘る力' + q.mine) + ' 耐久' + s.tool.d + '/' + q.dur; }
    const it = ITEM[s.id];
    return it.n + (it.food ? ' 満腹+' + it.food : '') + (it.heal ? ' HP+' + it.heal : '') + (it.desc ? ' ' + it.desc : '');
}
// アイテム名の札。マウスは乗せるだけ、タッチは長押しで出る。下の枠をえらんだときも少しだけ出る
let tipTimer = null, tipLong = false, tipHideT = null;
function showTip(el) {
    const tip = $('tip');
    tip.textContent = el.dataset.tip;
    const r = el.getBoundingClientRect(), p = clientToStage(r.x + r.width / 2, r.y + r.height / 2);
    tip.classList.remove('hidden');
    const half = el.offsetHeight / 2 + 6, w = tip.offsetWidth;
    tip.style.left = Math.max(w / 2 + 6, Math.min(1280 - w / 2 - 6, p[0])) + 'px';
    tip.style.top = (p[1] - half) + 'px';
}
const hideTip = () => { $('tip').classList.add('hidden'); };
function flashTip(el) { showTip(el); clearTimeout(tipHideT); tipHideT = setTimeout(hideTip, 1500); }
$('stage').addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const el = e.target.closest && e.target.closest('.slot[data-tip]'); if (el) { clearTimeout(tipHideT); showTip(el); } else if (!tipHideT) hideTip(); });
$('stage').addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('.slot[data-tip]')) hideTip(); });
$('stage').addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const el = e.target.closest && e.target.closest('.slot[data-tip]');
    if (el) tipTimer = setTimeout(() => { tipLong = true; showTip(el); }, 350);
});
['pointerup', 'pointercancel'].forEach(n => $('stage').addEventListener(n, () => { clearTimeout(tipTimer); if (tipLong) { hideTip(); setTimeout(() => { tipLong = false; }, 60); } }));
$('stage').addEventListener('click', e => { if (tipLong) { e.stopPropagation(); e.preventDefault(); tipLong = false; } }, true);   // 長押しのあとは 押したことにしない
let lastHot = '';
function refreshHud() {
    if (!S || mode !== 'play') return;
    TOOL_KIND_KEYS.forEach(equipped);   // 装備の印をそろえる
    const mx = maxHp();
    $('hp-fill').style.width = Math.max(0, 100 * S.hp / mx) + '%'; $('hp-num').textContent = Math.max(0, S.hp) + '/' + mx;
    $('food-fill').style.width = S.hunger + '%'; $('food-num').textContent = S.hunger + '/100';
    const air = S.air === undefined ? AIR_MAX : S.air;
    $('air-row').classList.toggle('hidden', air >= AIR_MAX);
    $('air-fill').style.width = (100 * air / AIR_MAX) + '%'; $('air-num').textContent = air + '/' + AIR_MAX;
    const dir = bossDirection();
    $('clock').innerHTML = (isNight() ? '🌙' : '☀️') + ' ' + dayNo() + '日目 ' + hourStr() + '<small>' + FLOOR_NAME[S.f] + (S.f === 0 ? '・' + BIOME_NAME[biomeAt(S.x, S.y)] : '') + (dir ? '・魔王城 ' + dir.name + ' ' + dir.dist + 'マス' : '') + '</small>';
    const gi = goalIndex();
    $('goal').textContent = gi >= 0 ? '目標: ' + GOALS[gi].t : '魔王をたおした! 自由に遊ぼう';
    // できることに合わせて ボタンの文字を変える。2つあるときだけ もう1つのボタンを出す
    const acts = useActions(), lab = $('btn-use').querySelector('span'), b2 = $('btn-use2');
    lab.textContent = acts[0] ? acts[0].l : 'つかう';
    b2.classList.toggle('hidden', !acts[1]);
    if (acts[1]) b2.querySelector('span').textContent = acts[1].l;
    const key = JSON.stringify([S.inv.slice(0, HOT_SIZE), S.sel]);
    if (key !== lastHot) {
        lastHot = key;
        let h = '';
        for (let i = 0; i < HOT_SIZE; i++) h += slotHtml(S.inv[i], { i, sel: i === S.sel, key: String(i + 1) });
        $('hot').innerHTML = h;
    }
}
$('hot').addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b) return;
    selectSlot(+b.dataset.i);
});
// 枠をえらぶ。道具をえらぶと それを装備する
function selectSlot(i) {
    S.sel = i;
    const s = S.inv[i];
    if (s && s.tool) equipTool(s.tool); else SFX.play('select');
    lastHot = ''; refreshHud();
    const el = $('hot').querySelector('.slot.sel');
    if (el && el.dataset.tip) flashTip(el); else hideTip();
}

// ---------- 操作 ----------
const overlayOpen = () => ['panel', 'chest-modal', 'map-modal', 'dialog'].some(id => !$(id).classList.contains('hidden'));
const canAct = () => mode === 'play' && !overlayOpen() && S.hp > 0;
let useHeld = false;   // 「つかう」(Z・ボタン)を押している間
function doDir(d) {
    if (turnOnly) { S.face = d; turnOnly = false; $('btn-turn').classList.remove('on'); VIEW.needDraw = true; refreshHud(); return; }
    step(d[0], d[1]);
    if (useHeld && S.hp > 0) { sowWalking(); lastHot = ''; refreshHud(); }
}
addEventListener('keydown', e => { if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') useHeld = true; });
addEventListener('keyup', e => { if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') useHeld = false; });
addEventListener('blur', () => { useHeld = false; });
function pressDir(d) {
    autoPath = [];
    held = d; holdLock = false;
    if (canAct()) { if (performance.now() < nextAct && TILE[getT(S.f, S.x, S.y)].swim) return; doDir(d); nextAct = performance.now() + Math.max(FIRST_REPEAT_MS, moveWait()); }
}
function releaseDir(d) { if (!d || (held && held[0] === d[0] && held[1] === d[1])) { held = null; holdLock = false; } }
addEventListener('keydown', () => { document.body.classList.add('haskeys'); fitTouch(); }, { once: true });   // キーボードがあるとわかったらキー表示を出す
const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') {
        if (e.key === 'Enter') { const g = $('dialog-box').querySelector('.go'); if (g) g.click(); }
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    if (navKey(e)) return;
    if (mode !== 'play') return;
    if (e.key === 'Escape') { if (canAct()) openMenu(); return; }
    if ((e.key === 'h' || e.key === 'H') && canAct()) { openKeys(); return; }
    const k = KEYS[e.key];
    if (k) {
        e.preventDefault();
        if (e.repeat) return;
        if (e.shiftKey && canAct()) { S.face = k; VIEW.needDraw = true; refreshHud(); return; }
        pressDir(k);
        return;
    }
    if (e.repeat && !['x', 'X', 'z', 'Z', ' '].includes(e.key)) return;
    if (!canAct()) return;
    if (e.key === ' ' || e.key === 'z' || e.key === 'Z' || e.key === 'Enter') { e.preventDefault(); useSelected(); }
    else if (e.key === 'c' || e.key === 'C') useSelected(1);
    else if (e.key === 'f' || e.key === 'F') fireBow(equipped('bow'));
    else if (e.key === 'x' || e.key === 'X') digFacing();
    else if (e.key === 'q' || e.key === 'Q') waitTurn();
    else if (e.key === 'e' || e.key === 'E' || e.key === 'i') openPanel('inv');
    else if (e.key === 'm' || e.key === 'M') openMap();
    else if (e.key >= '1' && e.key <= '8') selectSlot(+e.key - 1);
});
// パネル・ダイアログ・タイトルを 矢印とEnterで操作する
let kfEl = null, kfKey = '';
function navRoot() {
    if (document.querySelector('.fgh-ov, .fgb-ov:not(.hide)')) return null;
    for (const id of ['dialog', 'chest-modal', 'map-modal', 'panel']) if (!$(id).classList.contains('hidden')) return $(id);
    return mode === 'title' ? $('title-screen').querySelector('.fgt-menu') : null;
}
function navButtons(root) { return [...root.querySelectorAll('button, input')].filter(b => !b.disabled && b.offsetParent !== null && b.getBoundingClientRect().width > 0 && !b.closest('#title-real')); }
const elKey = el => el.id || (el.dataset.i !== undefined ? 'i' + el.dataset.i + (el.closest('#chest-box') ? 'b' : '') : '') || el.dataset.tab || el.dataset.kind || el.dataset.a || el.dataset.b || el.dataset.rec || el.textContent.trim().slice(0, 12);
function setKf(el) {
    if (kfEl) kfEl.classList.remove('kf');
    kfEl = el; kfKey = el ? elKey(el) : '';
    if (el) { el.classList.add('kf'); el.scrollIntoView({ block: 'nearest' }); if (el.tagName === 'INPUT') el.focus(); }
}
function currentKf(list) {
    if (kfEl && kfEl.isConnected && list.includes(kfEl)) return kfEl;
    return list.find(b => elKey(b) === kfKey) || null;
}
function navKey(e) {
    const root = navRoot();
    if (!root) { if (kfEl) setKf(null); return false; }
    const list = navButtons(root), cur = currentKf(list);
    if (cur && cur !== kfEl) setKf(cur);
    const dir = KEYS[e.key];
    if (dir && !/^[wasdWASD]$/.test(e.key)) {
        e.preventDefault();
        if (!cur) { setKf(list.find(b => b.classList.contains('go') || b.classList.contains('primary')) || list[0] || null); return true; }
        const r = cur.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        let best = null, bv = 1e9;
        for (const b of list) {
            if (b === cur) continue;
            const q = b.getBoundingClientRect(), dx = q.x + q.width / 2 - cx, dy = q.y + q.height / 2 - cy, along = dx * dir[0] + dy * dir[1], side = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
            if (along <= 2) continue;
            const v = along + side * 2.5;
            if (v < bv) { bv = v; best = b; }
        }
        if (best) { setKf(best); SFX.play('select'); }
        return true;
    }
    if (e.repeat && cur && cur.classList.contains('mk') && (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        const now = performance.now();
        if (now - (navKey.last || 0) < 100) return true;
        navKey.last = now;
    } else if (e.repeat) return true;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        const t = cur || list.find(b => b.classList.contains('go') || b.classList.contains('primary')) || list[0];
        if (t) { const k = elKey(t); t.click(); setTimeout(() => { kfKey = k; const l = navRoot() ? navButtons(navRoot()) : []; const n = l.find(b => elKey(b) === k); if (n) setKf(n); }, 0); }
        return true;
    }
    if (e.key === 'Tab' && root === $('panel')) {
        e.preventDefault();
        if (mode !== 'play') return true;
        const order = visibleTabs();
        tab = order[(order.indexOf(tab) + (e.shiftKey ? order.length - 1 : 1)) % order.length]; SFX.play('select'); drawPanel();
        return true;
    }
    if (e.key === 'Escape' || ((e.key === 'e' || e.key === 'E' || e.key === 'i') && root === $('panel')) || ((e.key === 'm' || e.key === 'M') && root === $('map-modal'))) {
        if (root === $('dialog')) { const b = [...root.querySelectorAll('button')].find(x => /-(back|close)$/.test(x.id)); if (b) b.click(); }
        else if (root !== $('title-screen').querySelector('.fgt-menu')) closeOverlays();
        setKf(null);
        return true;
    }
    return mode === 'title' ? false : true;
}
addEventListener('keyup', e => { const k = KEYS[e.key]; if (k) releaseDir(k); });
addEventListener('blur', () => { held = null; });
function waitTurn() { autoPath = []; endTurn(1); }
// 十字ボタン(指をすべらせても切りかわる)
const dpad = $('dpad');
let padPointer = null;
function padAt(e) { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest && el.closest('.pad[data-d]'); }
function setPad(btn) {
    dpad.querySelectorAll('.pad.on').forEach(b => b.classList.remove('on'));
    if (!btn) { held = null; return; }
    btn.classList.add('on');
    const d = btn.dataset.d.split(',').map(Number);
    if (!held || held[0] !== d[0] || held[1] !== d[1]) pressDir(d);
}
dpad.addEventListener('pointerdown', e => { const b = padAt(e); if (b) { padPointer = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (x) { } setPad(b); e.preventDefault(); } });
dpad.addEventListener('pointermove', e => { if (e.pointerId === padPointer) { const b = padAt(e); if (b) setPad(b); } });
const padUp = e => { if (e.pointerId === padPointer) { padPointer = null; setPad(null); } };
dpad.addEventListener('pointerup', padUp); dpad.addEventListener('pointercancel', padUp);
$('btn-turn').addEventListener('click', () => { turnOnly = !turnOnly; $('btn-turn').classList.toggle('on', turnOnly); });
// 押しっぱなしで続けられるボタン
function repeatBtn(id, fn) {
    const b = $(id); let t = null;
    const stop = () => { clearInterval(t); clearTimeout(t); t = null; };
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (!canAct()) return; holdLock = false; fn(); stop(); t = setTimeout(() => { t = setInterval(() => { if (canAct() && !holdLock) fn(); else stop(); }, MOVE_MS); }, 260); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, stop));
}
repeatBtn('btn-dig', digFacing);
repeatBtn('btn-wait', waitTurn);
$('btn-use').addEventListener('pointerdown', e => { e.preventDefault(); useHeld = true; if (canAct()) useSelected(0); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('btn-use').addEventListener(ev, () => { useHeld = false; }));
$('btn-use2').addEventListener('pointerdown', e => { e.preventDefault(); if (canAct()) useSelected(1); });
$('btn-craft').addEventListener('click', () => { if (canAct()) openPanel('inv'); });
$('btn-map').addEventListener('click', () => { if (canAct()) openMap(); });
// グリッド線: ボタンかGキーを押している間だけ出す
function setGrid(on) { VIEW.grid = on; $('btn-grid').classList.toggle('on', on); VIEW.needDraw = true; }
$('btn-grid').addEventListener('pointerdown', e => { e.preventDefault(); setGrid(true); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(n => $('btn-grid').addEventListener(n, () => setGrid(false)));
addEventListener('keydown', e => { if ((e.key === 'g' || e.key === 'G') && !e.repeat && mode === 'play' && !(e.target && e.target.tagName === 'INPUT')) setGrid(true); });
addEventListener('keyup', e => { if (e.key === 'g' || e.key === 'G') setGrid(false); });
addEventListener('blur', () => setGrid(false));
$('btn-menu').addEventListener('click', () => { if (canAct()) openMenu(); });
// 画面タップで その場所へ歩く
$('world').addEventListener('click', e => {
    if (!canAct()) return;
    const p = clientToStage(e.clientX, e.clientY), t = tapToTile(p[0], p[1]);
    const dx = t[0] - S.x, dy = t[1] - S.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) { autoPath = []; step(dx, dy); return; }
    const path = pathTo(t[0], t[1]);
    autoPath = path || [];
    holdLock = false; nextAct = 0;
});

// ---------- 持ち物とクラフトのパネル ----------
let panelTarget = null, tab = 'inv', invPick = null, toolKind = 'pick', toolA = 'wood', toolB = 'wood';
function closeOverlays() {
    ['panel', 'chest-modal', 'map-modal'].forEach(id => $(id).classList.add('hidden'));
    invPick = null; held = null;
    document.body.classList.remove('ach-only');
    if (mode === 'play') { refreshHud(); VIEW.needDraw = true; }
}
$('panel-sort').onclick = () => { sortInv(); invPick = null; SFX.play('select'); lastHot = ''; refreshHud(); drawPanel(); };
$('panel-remove').onclick = () => { const q = panelTarget; closeOverlays(); if (q) removePlaced(q.x, q.y); };
$('panel-close').onclick = closeOverlays; $('chest-close').onclick = closeOverlays;
$('chest-remove').onclick = () => { const p = chestKey.split(','); closeOverlays(); removePlaced(+p[1], +p[2]); }; $('map-close').onclick = closeOverlays;
function openPanel(t, keepTarget) { if (!keepTarget) panelTarget = null; tab = t; invPick = null; held = null; autoPath = []; $('panel').classList.remove('hidden'); SFX.play('select'); drawPanel(); }
document.querySelectorAll('.tab[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; SFX.play('select'); drawPanel(); });
// 設備にぶつかって開いたときは「持ち物」と その設備でできることだけ。持ち物ボタンで開いたときは どこでも作れる物と図鑑・実績
const panelStation = () => (panelTarget && panelTarget.st) || null;
const ASSEMBLE_AT = { bench: true };
function visibleTabs() {
    const st = panelStation();
    if (st) return ['inv', 'make'].concat(ASSEMBLE_AT[st] ? ['tool'] : []);
    return document.body.classList.contains('ach-only') ? ['ach'] : ['inv', 'make', 'book', 'ach'];
}
function drawPanel() {
    const st = panelStation(), vis = visibleTabs();
    if (!vis.includes(tab)) tab = vis[0];
    document.querySelectorAll('.tab[data-tab]').forEach(b => { b.classList.toggle('on', b.dataset.tab === tab); b.classList.toggle('hidden', !vis.includes(b.dataset.tab)); });
    $('panel-title').innerHTML = st ? '<img src="' + iconUrl(st) + '" alt="">' + STATION_NAME[st] : '';
    $('panel-title').classList.toggle('hidden', !st);
    const near = nearStations();
    $('chips').innerHTML = '';
    const rm = $('panel-remove'), target = panelTarget && TILE[getT(S.f, panelTarget.x, panelTarget.y)];
    rm.classList.toggle('hidden', !target || !target.back);
    $('panel-sort').classList.toggle('hidden', tab !== 'inv');
    if (target) { rm.textContent = '片づける'; rm.title = target.n + 'を片づける'; }
    if (tab === 'inv') drawInv(); else if (tab === 'make') drawMake(); else if (tab === 'book') drawBook(); else if (tab === 'ach') drawAch(); else drawTool();
}
function drawInv() {
    let h = '<div class="grid">';
    for (let i = 0; i < INV_SIZE; i++) h += slotHtml(S.inv[i], { i, sel: invPick === i, key: i < HOT_SIZE ? String(i + 1) : '' });
    h += '</div><div class="detail" id="inv-detail">' + invDetail() + '</div>';
    const b = $('pbody'); b.innerHTML = h;
    b.querySelectorAll('.slot').forEach(el => el.onclick = () => {
        const i = +el.dataset.i;
        if (invPick === null) { invPick = S.inv[i] ? i : null; }
        else if (invPick === i) invPick = null;
        else { const t = S.inv[invPick]; S.inv[invPick] = S.inv[i]; S.inv[i] = t; invPick = null; lastHot = ''; }
        SFX.play('select'); drawInv();
    });
    const eq = $('inv-equip');
    if (eq) eq.onclick = () => { equipTool(S.inv[invPick].tool); lastHot = ''; drawInv(); };
    const drop = $('inv-drop');
    if (drop) drop.onclick = () => { S.inv[invPick] = null; invPick = null; lastHot = ''; SFX.play('discard'); drawInv(); };
    const use = $('inv-use');
    if (use) use.onclick = () => { S.sel = invPick; if (invPick >= HOT_SIZE) { const t = S.inv[0]; S.inv[0] = S.inv[invPick]; S.inv[invPick] = t; S.sel = 0; } lastHot = ''; useSelected(); invPick = null; drawInv(); };
}
function invDetail() {
    const s = invPick !== null ? S.inv[invPick] : null;
    if (!s) {
        const list = TOOL_KIND_KEYS.map(k => { const t = equipped(k); return toolImg({ k, a: 'iron', b: k === 'bow' ? 'hide' : 'wood' }) + ' ' + TOOL_KINDS[k].n + ': ' + (t ? toolName(t) : 'なし'); }).join('<br>');
        return '<h3>装備中</h3>' + list + '<br><br>枠をタップして 別の枠をタップすると 入れかえられます。上の1〜8は 画面の下の枠と同じです。';
    }
    if (s.tool) {
        const st = toolStats(s.tool), t = s.tool;
        const lines = t.k === 'armor' ? '守り ' + st.def + (st.hp ? '<br>HP +' + st.hp : '') + (st.thorn ? '<br>なぐられると ' + st.thorn + ' やり返す' : '') + '<br>裏地: ' + LININGS[t.b].n : t.k === 'bow' ? '攻撃 ' + st.atk + '<br>射程 ' + st.range + '<br>' + STRINGS[t.b].n : '攻撃 ' + st.atk + '<br>掘る力 ' + st.mine + '<br>' + HANDLES[t.b].n;
        return '<h3>' + toolImg(t) + ' ' + toolName(t) + '</h3>' + lines + '<br>耐久 ' + t.d + '/' + st.dur + '<br><br><div style="display:flex;gap:8px">' + (t.eq ? '<span style="font-weight:900;color:#c8701c;padding:8px 0">装備中</span>' : '<button class="wbtn go" id="inv-equip">装備する</button>') + '<button class="wbtn" id="inv-drop">すてる</button></div>';
    }
    const it = ITEM[s.id];
    let h = '<h3>' + it.n + ' ×' + s.n + '</h3>';
    if (it.food) h += '満腹 +' + it.food + '<br>';
    if (it.heal) h += 'HP +' + it.heal + '<br>';
    if (it.use === 'home') h += '復活地点へ もどる<br>';
    if (it.use === 'shard') h += '周りの地図が 広がる<br>';
    const usable = it.food !== undefined || it.heal !== undefined || it.use === 'home' || it.use === 'shard';
    h += '<br><div style="display:flex;gap:8px">' + (usable ? '<button class="wbtn go" id="inv-use">つかう</button>' : '') + '<button class="wbtn" id="inv-drop">すてる</button></div>';
    return h;
}
function needHtml(need) {
    return Object.keys(need).map(k => { const c = count(k), ok = c >= need[k]; return '<span class="' + (ok ? 'ok' : 'lack') + '">' + ITEM[k].n + ' ' + c + '/' + need[k] + '</span>'; }).join(' ');
}
const toolImg = t => '<img class="tic" src="' + toolIconUrl(t) + '" alt="">';
function iconHtml(id) { const u = iconUrl(id); return u ? '<img src="' + u + '" alt="">' : (ITEM[id].e || '❔'); }
const MAKE_ORDER = {
    '': ['bench'],
    bench: ['torch', 'furnace', 'bed', 'wall_w', 'door', 'floor', 'fence', 'chest', 'ladder', 'wall_s', 'arrow', 'carpet', 'clamp', 'rod', 'bread', 'arrow_fe', 'glass_w', 'bottle', 'wall_nw', 'floor_nw', 'switch', 'plate', 'bulb', 'conv', 'fconv', 'disp', 'wall_cu', 'door_cu', 'fence_cu', 'floor_cu', 'wall_fe', 'door_fe', 'fence_fe', 'floor_fe', 'wall_au', 'door_au', 'fence_au', 'floor_au', 'feather_home', 'crown', 'gate'],
    furnace: ['charcoal', 'glass', 'steak', 'ingot_cu', 'roast', 'ingot_fe', 'gfish', 'fegg', 'stew', 'pie', 'potion', 'ingot_au', 'ingot_n', 'feast'],
};
function drawMake() {
    const st = panelStation();
    // 設備では その設備のレシピ全部(材料をまだ見つけていない物は ？？？)。持ち物画面では 作業台だけ
    // 並びは MAKE_ORDER(序盤に作る物・よく使う物が上)
    const ord = MAKE_ORDER[st || ''], pos = r => { const i = ord.indexOf(r.out); return i < 0 ? 999 : i; };
    const list = RECIPES.filter(r => (r.st || null) === st).sort((p, q) => pos(p) - pos(q));
    const card = r => {
        const known = !st || Object.keys(r.need).some(k => S.got[k] || count(k) > 0);
        if (!known) return '<div class="rec off"><div class="ic" style="font-size:30px;color:#a89878">？</div><div class="tx"><div class="nm">？？？</div><div class="nd">まだ材料を見つけていない</div></div></div>';
        const ok = hasAll(r.need), desc = ITEM[r.out];
        return '<div class="rec' + (ok ? '' : ' off') + '" id="rec-' + r.out + '"><div class="ic">' + iconHtml(r.out) + '</div><div class="tx"><div class="nm">' + desc.n + (r.n ? ' ×' + r.n : '') + ' <small class="own">持っている ' + count(r.out) + '</small>' + (desc.food ? ' <small>満腹+' + desc.food + '</small>' : '') + (desc.heal ? ' <small>HP+' + desc.heal + '</small>' : '') + '</div>' + (desc.desc ? '<div class="nd" style="color:#6a4c2c">' + desc.desc + '</div>' : '') + '<div class="nd">' + needHtml(r.need) + (r.t > 1 ? ' <span style="color:#6a4c2c">(' + r.t + 'ターン)</span>' : '') + '</div></div><button class="wbtn' + (ok ? ' go' : ' no') + ' mk" data-out="' + r.out + '" data-rec="' + RECIPES.indexOf(r) + '">つくる</button></div>';
    };
    // 作り直す前の スクロール位置(同じ場所のレシピ一覧なら そのまま残す)
    const old = $('pbody').querySelector('.list.mklist'), keep = old && old.dataset.st === String(st) ? old.scrollTop : 0;
    let h = '<div class="list mklist" data-st="' + st + '">' + list.map(card).join('');
    if (!st) h += '<div class="sec off" style="font-size:16px">作業台・かまどに ぶつかると、そこでつくれる物が出ます</div>';
    $('pbody').innerHTML = h + '</div>';
    if (keep) $('pbody').querySelector('.mklist').scrollTop = keep;
    $('pbody').querySelectorAll('.mk').forEach(b => {
        b.onclick = () => { if (makeHold.fired) { makeHold.fired = false; return; } makeOnce(+b.dataset.rec, st); };
        b.onpointerdown = () => startMakeHold(+b.dataset.rec, st);
    });
}
// つくるボタン: 1回つくる。押しっぱなしなら 少し待ってから くり返す(ターンは ふつうに進む)
function makeOnce(idx, st) {
    const msg = craftRecipe(RECIPES[idx], st);
    if (msg) { SFX.play('error'); H.log(msg, 'warn'); }
    lastHot = ''; if (S.hp > 0) drawPanel();
    return !msg;
}
const makeHold = { timer: 0, fired: false };
function stopMakeHold() { clearTimeout(makeHold.timer); makeHold.timer = 0; }
function startMakeHold(idx, st) {
    stopMakeHold(); makeHold.fired = false;
    const tick = () => {
        if ($('panel').classList.contains('hidden') || S.hp <= 0) return stopMakeHold();
        makeHold.fired = true;
        if (!makeOnce(idx, st)) return stopMakeHold();
        makeHold.timer = setTimeout(tick, 100);
    };
    makeHold.timer = setTimeout(tick, 300);
}
['pointerup', 'pointercancel', 'blur'].forEach(ev => addEventListener(ev, stopMakeHold));
const mobIconCache = {};
function mobIcon(k) {
    if (mobIconCache[k]) return mobIconCache[k];
    const s = actorSprite(k, MOBS[k].box, 2, false), c = mkCanvas(96, 96);
    c.getContext('2d').drawImage(s.cv, 48 - s.ox - 12, 84 - s.oy - 26);
    return (mobIconCache[k] = c.toDataURL());
}
function drawAch() {
    let h = '<div class="list" style="display:block"><div class="sec">実績 <small style="color:#5c3c1c">' + achCount() + '/' + ACH.length + '</small><small style="color:#6a4c2c;font-weight:700">世界が変わっても残ります</small></div>';
    ACH_CATS.forEach(c => {
        const list = ACH.filter(a => a.c === c[0]);
        h += '<div class="sec">' + c[1] + ' <small style="color:#5c3c1c">' + list.filter(a => achHas(a.id)).length + '/' + list.length + '</small></div><div class="agrid">' + list.map(a => {
            const got = achHas(a.id), secret = a.hide && !got;
            return '<div class="ac' + (got ? ' got' : '') + '"><i>' + (got ? '🏆' : secret ? '？' : '🔒') + '</i><div><b>' + (secret ? '？？？' : a.n) + '</b><span>' + (secret ? a.hint : a.d) + '</span></div></div>';
        }).join('') + '</div>';
    });
    $('pbody').innerHTML = h + '</div>';
}
function drawBook() {
    const cell = (known, img, name) => '<div class="bk' + (known ? '' : ' un') + '">' + (known ? img : '<div class="q">？</div>') + '<span>' + (known ? name : '？？？') + '</span></div>';
    const places = Object.keys(PLACE_NAMES), mobKeys = Object.keys(MOBS).filter(k => k !== 'villager' || true), items = Object.keys(ITEM).filter(k => k !== 'anvil' && !ITEM[k].pseudo && !ITEM[k].old);
    const num = (o, l) => l.filter(k => o[k]).length + '/' + l.length;
    const placeImg = t => '<div class="q" style="color:#2a8a70">★</div>';
    const h = '<div class="list" style="display:block"><div class="sec">場所 <small style="color:#5c3c1c">' + num(S.book.p, places) + '</small></div><div class="bgrid">' + places.map(k => cell(S.book.p[k], placeImg(k), PLACE_NAMES[k])).join('') + '</div>' +
        '<div class="sec">生き物 <small style="color:#5c3c1c">' + num(S.book.m, mobKeys) + '</small></div><div class="bgrid">' + mobKeys.map(k => cell(S.book.m[k], '<img src="' + (S.book.m[k] ? mobIcon(k) : '') + '" alt="">', MOBS[k].n)).join('') + '</div>' +
        '<div class="sec">アイテム <small style="color:#5c3c1c">' + num(S.book.i, items) + '</small></div><div class="bgrid">' + items.map(k => cell(S.book.i[k], S.book.i[k] ? iconHtml(k) : '', ITEM[k].n)).join('') + '</div></div>';
    $('pbody').innerHTML = h;
}
// 持っている道具の数(同じ種類 / 同じ素材の組み合わせ)
function ownKind(k) { let c = 0; eachTool(q => { if (q.k === k) c++; }); return c; }
function ownSame(t) { let c = 0; eachTool(q => { if (q.k === t.k && q.a === t.a && (t.k === 'armor' || q.b === t.b)) c++; }); return c; }
let toolGem = false;
function drawTool() {
    const station = panelStation();
    // 種類ごとに この設備で使える素材があるか
    const headsAt = k => { const src = k === 'armor' ? BODIES : HEADS; const o = {}; Object.keys(src).forEach(q => { if (src[q].st === station) o[q] = src[q]; }); return o; };
    if (!Object.keys(headsAt(toolKind)).length) toolKind = Object.keys(TOOL_KINDS).find(k => Object.keys(headsAt(k)).length);
    const armor = toolKind === 'armor', bow = toolKind === 'bow', HA = headsAt(toolKind), HB = armor ? LININGS : bow ? STRINGS : HANDLES;
    if (!HA[toolA]) toolA = Object.keys(HA)[0];
    if (!HB[toolB]) toolB = armor ? 'none' : bow ? 'hide' : 'wood';
    const kinds = Object.keys(TOOL_KINDS).filter(k => Object.keys(headsAt(k)).length).map(k => '<button class="pickb' + (k === toolKind ? ' on' : '') + '" data-kind="' + k + '" style="font-size:20px">' + toolImg({ k, a: 'iron', b: k === 'bow' ? 'hide' : 'wood' }) + ' ' + TOOL_KINDS[k].n + (ownKind(k) ? ' <small class="own">×' + ownKind(k) + '</small>' : '') + '</button>').join('');
    // その素材で作ったときの数値
    const headStat = key => {
        const q = toolStats({ k: toolKind, a: key, b: toolB });
        return armor ? '守り' + q.def + ' 耐久' + q.dur : toolKind === 'sword' || bow ? '攻撃' + q.atk + ' 耐久' + q.dur : '掘る力' + q.mine + ' 耐久' + q.dur;
    };
    const line = (m, key, on, sel) => {
        const known = !m.item || S.got[m.item] || count(m.item) > 0;
        if (!known) return '<button class="pickb lock" disabled>？？？<small>まだ見つけていない</small></button>';
        const c = m.item ? count(m.item) : 0;
        const info = sel === 'a' ? headStat(key) + (m.note ? '・' + m.note : '') : (m.note || '&nbsp;');
        // 素材が足りないときは 数を赤にして ボタンを薄くする(知っているが今は作れない)
        const short = m.item && c < m.cost;
        return '<button class="pickb' + (on ? ' on' : '') + (short ? ' short' : '') + '" data-' + sel + '="' + key + '">' + m.n + (m.item ? ' <small style="display:inline">' + ITEM[m.item].n + ' <span class="' + (short ? 'lack' : 'ok') + '">' + c + '/' + m.cost + '</span></small>' : '') + '<small>' + info + '</small></button>';
    };
    const gemKnown = S.got.gem || count('gem') > 0;
    if (!gemKnown) toolGem = false;
    const t = { k: toolKind, a: toolA, b: toolB, gem: toolGem ? 1 : 0 }, st = toolStats(t), need = Object.assign({}, partNeed(toolKind, toolA, toolB));
    if (toolGem) need.gem = (need.gem || 0) + 1;
    const gc = count('gem'), gemBtn = gemKnown ? '<button class="pickb' + (toolGem ? ' on' : '') + (gc < 1 ? ' short' : '') + '" id="tool-gem" style="margin-top:6px">宝石の飾り <small style="display:inline">耐久+30% 宝石 <span class="' + (gc < 1 ? 'lack' : 'ok') + '">' + gc + '/1</span></small></button>' : '';
    const ok = hasAll(need);
    const cur = equipped(toolKind), cs = cur ? toolStats(cur) : null;
    const cmp = (lab, key) => { const v = st[key] || 0, o = cs ? (cs[key] || 0) : 0, d = v - o; return '<div class="stat"><span>' + lab + '</span><span>' + v + (d ? ' <small class="' + (d > 0 ? 'up' : 'down') + '">(' + (d > 0 ? '+' : '') + d + ')</small>' : '') + '</span></div>'; };
    const stats = armor ? cmp('守り', 'def') + cmp('HP', 'hp') + cmp('耐久', 'dur') : bow ? cmp('攻撃', 'atk') + cmp('射程', 'range') + cmp('耐久', 'dur') : (toolKind === 'sword' ? cmp('攻撃', 'atk') + cmp('耐久', 'dur') : cmp('掘る力', 'mine') + cmp('掘れる強さ', 'tier') + cmp('攻撃', 'atk') + cmp('耐久', 'dur'));
    const chips = '';
    const h = '<div class="col" style="width:170px"><h4>つくる物</h4>' + kinds + chips + '</div>' +
        '<div class="col" style="width:330px"><h4>' + TOOL_KINDS[toolKind].head + 'の素材</h4><div class="scr">' + Object.keys(HA).map(k => line(HA[k], k, k === toolA, 'a')).join('') + '</div></div>' +
        '<div class="col" style="width:290px"><h4>' + (armor ? '裏地' : bow ? 'つる' : '柄') + '</h4><div class="scr">' + Object.keys(HB).map(k => line(HB[k], k, k === toolB, 'b')).join('') + '</div></div>' +
        '<div class="detail col"><h3>' + toolImg(t) + ' ' + toolName(t) + '</h3><div class="own" style="font-size:16px">持っている ' + ownSame(t) + ' / ' + TOOL_KINDS[toolKind].n + 'は全部で ' + ownKind(toolKind) + '</div>' + stats +
        gemBtn + '<div class="nd" style="font-size:16px;line-height:1.5;margin-top:6px">' + needHtml(need) + '</div>' +
        '<button class="wbtn' + (ok ? ' go' : ' no') + '" id="tool-make" style="margin-top:auto;font-size:24px">組み立てる</button></div>';
    $('pbody').innerHTML = h;
    const pb = $('pbody');
    pb.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { toolKind = b.dataset.kind; SFX.play('select'); drawTool(); });
    pb.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { toolA = b.dataset.a; SFX.play('select'); drawTool(); });
    pb.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { toolB = b.dataset.b; SFX.play('select'); drawTool(); });
    if ($('tool-gem')) $('tool-gem').onclick = () => { toolGem = !toolGem; SFX.play('select'); drawTool(); };
    $('tool-make').onclick = () => {
        const msg = craftTool(toolKind, toolA, toolB, station, toolGem);
        if (msg) { SFX.play('error'); H.log(msg, 'warn'); }
        lastHot = ''; if (S.hp > 0) drawPanel();
    };
}

// ---------- 箱 ----------
let chestKey = null;
function openChest(k) {
    chestKey = k;
    if (!S.ex[k] || !S.ex[k].items) S.ex[k] = { items: [] };
    held = null; $('chest-modal').classList.remove('hidden'); SFX.play('chest'); drawChest();
}
function drawChest() {
    const box = S.ex[chestKey].items;
    let a = '', b = '';
    for (let i = 0; i < INV_SIZE; i++) a += slotHtml(S.inv[i], { i });
    for (let i = 0; i < 24; i++) b += slotHtml(box[i], { i });
    $('chest-inv').innerHTML = a; $('chest-box').innerHTML = b;
    $('chest-inv').querySelectorAll('.slot').forEach(el => el.onclick = () => {
        const i = +el.dataset.i, s = S.inv[i];
        if (!s || box.length >= 24) return;
        if (s.tool) delete s.tool.eq;
        if (!s.tool) { const q = box.find(x => x && x.id === s.id && x.n + s.n <= STACK); if (q) { q.n += s.n; S.inv[i] = null; lastHot = ''; drawChest(); return; } }
        box.push(s); S.inv[i] = null; lastHot = ''; SFX.play('select'); drawChest();
    });
    $('chest-box').querySelectorAll('.slot').forEach(el => el.onclick = () => {
        const i = +el.dataset.i, s = box[i];
        if (!s) return;
        if (s.tool) { if (!S.inv.some(x => !x)) return; putTool(s.tool); box.splice(i, 1); }
        else { const left = addItem(s.id, s.n); if (left) s.n = left; else box.splice(i, 1); }
        lastHot = ''; SFX.play('select'); drawChest();
    });
}

// ---------- 地図 ----------
let mapFloor = 0;
const MAP_COL = {};
function mapColor(t) {
    if (MAP_COL[t]) return MAP_COL[t];
    const k = TILE[t].key, table = { GRASS: '#7fbf55', GRASS2: '#5fa544', FLOWER: '#c8d070', BERRY: '#5a7ad0', VEG: '#e8a040', WHEATW: '#e0c860', DIRT: '#8a6a44', SAND: '#ecd9a0', SNOW: '#f0f6fb', WATER: '#4a9fd8', TREE: '#3f8a45', PINE: '#2a6e50', CACTUS: '#5a9a4a', ROCK: '#8e8e8a', RWALL: '#c8c090', RFLOOR: '#c8c090', CHEST_W: '#ffd84a', CAVE: '#5a4a3e', WDIRT: '#3a2c20', WSTONE: '#4a4a48', WHARD: '#2e2e3a', MAGMA: '#e8561c', ORE_STAR: '#7fe8ff', GIANT: '#1f6a2a', GIANTB: '#1f6a2a', TOWERW: '#d8d0a8', SANDB1: '#c8a858', SANDB2: '#b89848', SANDB3: '#a88838', METEOR: '#ff6a2c', SCORCH: '#3c3430', HULL: '#6e5230', MAST: '#6e5230', HUTW: '#b8543c', CRYSTAL: '#c8a8ff', SPAWNER: '#c05aff', RAIL: '#a87c40', CAVEIN: '#111111', SAPLING: '#5ab04a', BURIED: '#8e8e8a', WIRE: '#a8301c', WIRE_W: '#c8301c', CARPET: '#c8443c', CLAMP: '#d8c8ff', CROWN: '#f2c840', WALL_NW: '#6c2448', FLOOR_NW: '#6c2448', STAIRS_U: '#a2a29c', TRAP_PIT: '#c8c090', TRAP_ARROW: '#c8c090', FOSSIL: '#d8d0b8', GEM: '#ff6ac8', GMUSH: '#3ad8c8', GLOWM: '#3ad8c8', VWALL: '#3a2a4a', ASH: '#5c464a', NROCK: '#7a2c2c', CWALL: '#2a1c34', CFLOOR: '#44334c', ORE_N: '#b0349a', NTREE: '#6c2448' };
    const hex = table[k] || '#6a8a50', n = parseInt(hex.slice(1), 16);
    return (MAP_COL[t] = [n >> 16, (n >> 8) & 255, n & 255]);
}
// 地図は裏の絵にためておく。歩いて増えた所だけ描き足すので、開くときは写すだけ
const mapLayers = [];
function mapLayer(f) {
    if (!mapLayers[f]) {
        const cv = mkCanvas(250, 250), g = cv.getContext('2d');
        g.fillStyle = '#16100c'; g.fillRect(0, 0, 250, 250);
        mapLayers[f] = cv;
    }
    return mapLayers[f];
}
function mapPaint(f, cx, cy) {
    const q = mapColor(getTFast(f, cx * 4 + 2, cy * 4 + 2)), g = mapLayer(f).getContext('2d');
    g.fillStyle = 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')';
    g.fillRect(cx, cy, 1, 1);
}
// つづきから始めたときは、ゲームを止めないよう少しずつ描きなおす
let mapJob = 0;
function mapRebuild() {
    const job = ++mapJob;
    mapLayers.length = 0;
    let f = 0, cy = 0;
    const slice = () => {
        if (job !== mapJob || !S) return;
        const end = Math.min(250, cy + 6);
        for (; cy < end; cy++) for (let cx = 0; cx < 250; cx++) if (isSeen(f, cx, cy)) mapPaint(f, cx, cy);
        if (cy >= 250) { cy = 0; f++; }
        if (f < FLOORS) setTimeout(slice, 12);
    };
    slice();
}
function openMap() { mapFloor = S.f; held = null; autoPath = []; $('map-modal').classList.remove('hidden'); SFX.play('select'); drawMap(); }
function drawMap() {
    const c = $('map-cv').getContext('2d');
    c.drawImage(mapLayer(mapFloor), 0, 0);
    const pin = (x, y, col, r) => { c.fillStyle = '#000'; c.fillRect((x >> 2) - r - 1, (y >> 2) - r - 1, r * 2 + 3, r * 2 + 3); c.fillStyle = col; c.fillRect((x >> 2) - r, (y >> 2) - r, r * 2 + 1, r * 2 + 1); };
    const notes = [];
    if (S.f === mapFloor) { pin(S.x, S.y, '#ffffff', 2); notes.push('⬜ 自分 (' + S.x + ', ' + S.y + ')'); }
    if (S.bed && S.bed.f === mapFloor) { pin(S.bed.x, S.bed.y, '#ff5a5a', 1); notes.push('🟥 寝床'); }
    if (S.gate && (mapFloor === 0 || mapFloor === 2)) { pin(S.gate.x, S.gate.y, '#c05aff', 1); notes.push('🟪 門'); }
    S.graves.filter(g => g.f === mapFloor).forEach(g => pin(g.x, g.y, '#ffd84a', 1));
    const fnd = Object.values(S.found).filter(p => p.f === mapFloor && p.type !== 'mine');
    fnd.forEach(p => pin(p.x, p.y, '#3fe0c0', 1));
    if (fnd.length) notes.push('🟩 見つけた場所 ' + fnd.length + 'か所');
    if (S.graves.some(g => g.f === mapFloor)) notes.push('🟨 落とした荷物');
    if (mapFloor === 2 && !S.bossDead && S.got.reach_2) { const p = bossPos(); pin(p.x, p.y, '#ff2a2a', 2); notes.push('🔺 魔王城'); }
    $('map-tabs').innerHTML = FLOOR_ORDER.map(i => (i === 0 || S.got['reach_' + i]) ? '<button class="tab' + (i === mapFloor ? ' on' : '') + '" data-f="' + i + '">' + FLOOR_NAME[i] + '</button>' : '').join('');
    $('map-tabs').querySelectorAll('[data-f]').forEach(b => b.onclick = () => { mapFloor = +b.dataset.f; drawMap(); });
    $('map-info').innerHTML = notes.join('<br>') + '<br><br>世界の広さ 1000×1000<br>歩いた所だけ 地図にのる';
}
// 地図用: まだ読みこんでいないチャンクは作らず、生成式だけで見る(チャンクの入れ物をあふれさせない)
function getTFast(f, x, y) {
    const key = f * 1048576 + (y >> 5) * 1024 + (x >> 5);
    const c = chunkCache.get(key);
    if (c) return c[(y & 31) * CHUNK + (x & 31)];
    const d = diffs[f][(x >> 5) + ',' + (y >> 5)], i = (y & 31) * CHUNK + (x & 31);
    if (d && d[i] !== undefined) return d[i];
    return genTile(f, x, y);
}

// ---------- ダイアログ ----------
function dialog(html, wire) { $('dialog-box').innerHTML = html; $('dialog').classList.remove('hidden'); if (wire) wire($('dialog-box')); held = null; autoPath = []; }
function closeDialog() { $('dialog').classList.add('hidden'); }
// BGM/効果音ボタンは 1つの場所につき1回だけ作る(作るたびに入れ直しの見張りが残り、ボタンがふえるため)
const SOUND_BTN = {};
function soundBtn(sel) { if (SOUND_BTN[sel]) SOUND_BTN[sel](); else SOUND_BTN[sel] = FGLBgm.settingsButton(BGM, { parent: sel, sfx: SFX, getLang: () => 'ja' }); }
function openMenu() {
    saveGame();
    dialog('<h2>メニュー</h2>' + dayNo() + '日目 / ' + S.T + ' ターン<br>世界コード <b>' + seedToCode(S.seed) + '</b><div class="row menu-main"><button class="wbtn go big" id="m-back">つづける</button><button class="wbtn blue big" id="m-title">セーブしてタイトルへ</button></div><div class="row"><button class="wbtn" id="m-howto">あそびかた</button><button class="wbtn" id="m-keys">キー操作</button><button class="wbtn" id="m-look">主人公</button></div><div id="m-sound"></div>', b => {
        b.querySelector('#m-back').onclick = closeDialog;
        b.querySelector('#m-howto').onclick = () => { closeDialog(); openHowto(); };
        b.querySelector('#m-keys').onclick = openKeys;
        b.querySelector('#m-look').onclick = () => openLooks(openMenu);
        b.querySelector('#m-title').onclick = () => { saveGame(); location.reload(); };
        soundBtn('#m-sound');
    });
}
function openTrade(m) {   // 村人に話しかけたとき(手伝い)
    const hp = HELPERS[m.role || 0];
    const draw = () => {
        const done = helpedToday(m);
        dialog('<h2>' + hp.n + '</h2><p style="font-size:20px;font-weight:700;margin:10px 0 16px">「' + (done ? '今日は もう手伝ったよ。また明日 おいで' : hp.say) + '」</p><div class="row"><button class="wbtn' + (done ? ' no' : ' go') + '" id="h-do">' + hp.btn + '</button><button class="wbtn" id="t-back">もどる</button></div>', b => {
            b.querySelector('#t-back').onclick = closeDialog;
            b.querySelector('#h-do').onclick = () => { if (useHelper(m)) { lastHot = ''; refreshHud(); closeDialog(); } else SFX.play('error'); };
        });
    };
    draw();
}
function openKeys() {
    const rows = [['矢印 / WASD', '移動(長押しで歩き続ける)'], ['Shift + 矢印', '向きだけ変える'], ['Z / スペース / Enter', 'つかう・置く・食べる'], ['C', 'もう1つの使い方(ボタンが出ているとき)'], ['F', '弓をうつ(装備している弓)'], ['X', 'ほる'], ['Q', '1ターンまつ'], ['1〜8', '下の枠をえらぶ(道具なら装備)'], ['E', '持ち物・つくる'], ['M', '地図'], ['Esc', 'メニュー・とじる'], ['G(押している間)', 'グリッド線を出す'], ['H', 'この一覧'],
        ['画面を開いているとき', '矢印でえらぶ / Enter で決定 / Tab でタブ切りかえ / Esc でとじる']];
    dialog('<h2>キー操作</h2><div class="keys">' + rows.map(r => '<b>' + r[0] + '</b><span>' + r[1] + '</span>').join('') + '</div><div class="row"><button class="wbtn go" id="k-back">とじる</button></div>', b => { b.querySelector('#k-back').onclick = closeDialog; });
}
function openBedDialog(x, y) {
    const night = isNight(), inf = shelterInfo();
    const line = (ok, a, b) => '<div style="color:' + (ok ? '#2c7a1c' : '#c8301c') + '">' + (ok ? '✔ ' + a : '✖ ' + b) + '</div>';
    dialog('<h2>寝床</h2>' + line(inf.room, 'かべと扉で囲まれている', '囲まれていない(まものが入ってくる)') + line(inf.lit, '明るい(松明・金の建材)', '暗い(部屋の中に まものがわく)') + (inf.fence ? line(false, '', '柵は敵から見えて 矢も通る') : '') + '<div style="font-size:17px">' + (night ? '朝まで眠ると HPが全回復します。おそわれると目がさめます。' : '少し休むと HPが回復します。夜なら朝まで眠れます。') + '</div><div class="row"><button class="wbtn go" id="b-go">' + (night ? '朝まで眠る' : '少し休む') + '</button><button class="wbtn" id="b-rm">片づける</button><button class="wbtn" id="b-back">もどる</button></div>', b => {
        b.querySelector('#b-go').onclick = () => { closeDialog(); sleep(x, y); };
        b.querySelector('#b-rm').onclick = () => { closeDialog(); removePlaced(x, y); };
        b.querySelector('#b-back').onclick = closeDialog;
    });
}
function showDead(src) {
    dialog('<h2>力つきた…</h2>' + src + 'にやられた。<br>持ち物は その場所に落ちている。地図の🟨から 取りに行こう。<div class="row"><button class="wbtn go" id="d-ok">起きる</button></div>', b => {
        b.querySelector('#d-ok').onclick = () => { closeDialog(); snapView(); holdLock = false; lastHot = ''; refreshHud(); };
    });
    lastHot = ''; refreshHud();
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
const getName = () => { try { return localStorage.getItem('tc2_name') || ''; } catch (e) { return ''; } };
const setName = n => { try { localStorage.setItem('tc2_name', n); } catch (e) { } };
function showVictory() {
    const days = dayNo(), name = getName();
    SFX.play('clearstage');
    dialog('<h2>魔王をたおした!</h2><b style="font-size:30px;color:#c8301c">' + days + '日目</b> でクリア (' + S.T + ' ターン / 力つきた回数 ' + S.deaths + ')<br>世界コード ' + seedToCode(S.seed) + '<br>実績 ' + achCount() + '/' + ACH.length + '<div class="row"><input id="v-name" maxlength="12" placeholder="ニックネーム" value="' + escapeHtml(name) + '"><button class="wbtn go" id="v-send">ランキングに のせる</button></div><div id="v-msg" style="font-size:16px"></div><div class="row"><button class="wbtn" id="v-rank">ランキングを見る</button><button class="wbtn" id="v-more">このまま遊ぶ</button></div>', b => {
        b.querySelector('#v-send').onclick = async () => {
            const v = FGLName.validate(b.querySelector('#v-name').value), msg = b.querySelector('#v-msg');
            if (!v.ok) { msg.textContent = v.reason === 'empty' ? 'ニックネームを入れてね' : FGLName.message(v.reason, 'simple'); return; }
            setName(v.name);
            b.querySelector('#v-send').disabled = true;
            try { await window.saveOnlineScore(v.name, 1000000 - S.T, days); msg.textContent = 'のせました!'; }
            catch (e) { msg.textContent = '通信に失敗しました'; b.querySelector('#v-send').disabled = false; }
        };
        b.querySelector('#v-rank').onclick = () => { closeDialog(); showRanking(showVictory); };
        b.querySelector('#v-more').onclick = closeDialog;
    });
}
async function showRanking(back) {
    dialog('<h2>ランキング</h2>魔王をたおすまでの日数<div class="rk" id="rk-list">読みこみ中…</div><div class="row"><button class="wbtn" id="rk-close">とじる</button></div>', b => {
        b.querySelector('#rk-close').onclick = () => { closeDialog(); if (back) back(); };
    });
    const rows = await window.loadRanking(), list = $('rk-list');
    if (!list) return;
    if (!rows) { list.textContent = '読みこめませんでした'; return; }
    if (!rows.length) { list.textContent = 'まだ誰もクリアしていません'; return; }
    list.innerHTML = rows.map((r, i) => '<div><b>' + (i + 1) + '</b><span>' + escapeHtml(r.name) + '</span><em>' + r.days + '日目</em><small>' + r.turns + 'ターン</small></div>').join('');
}
(function () {
    const base = 'https://rpxassndgiunoqkxqcco.supabase.co/rest/v1', key = 'sb_publishable_Wnge6OPvSf5l2YEgaPg4rw_nj4CyYAH', GAME = 'treasure_craft2_v1';
    const hdr = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    // point_score は 100万-ターン数(大きいほど早いクリア)、stage_score は日数
    window.saveOnlineScore = async (name, score, days) => {
        const res = await fetch(base + '/rankings', { method: 'POST', headers: hdr, keepalive: true, body: JSON.stringify({ game: GAME, difficulty: 'normal', player_name: FGLName.display(name || 'ななしさん'), point_score: score, stage_score: days, turns: 1000000 - score, class_name: 'クリア' }) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
    };
    window.loadRanking = async () => {
        try {
            const q = new URLSearchParams({ select: 'player_name,point_score,stage_score,turns', game: 'eq.' + GAME, order: 'point_score.desc,created_at.asc', limit: '30' });
            const res = await fetch(base + '/rankings?' + q, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
            if (!res.ok) throw new Error();
            return (await res.json()).map(r => ({ name: FGLName.display(r.player_name), days: r.stage_score, turns: r.turns }));
        } catch (e) { return null; }
    };
})();

// ---------- あそびかた ----------
function openHowto() {
    const pic = (n, h) => FGLHowto.img(n, h || 90);
    const ic = id => { const u = iconUrl(id); return u ? pic(u, 86) : '<span style="font-size:60px">' + ITEM[id].e + '</span>'; };
    const mob = k => { const s = actorSprite(k, MOBS[k].box, 2, false); const c = mkCanvas(110, 130), x = c.getContext('2d'); x.drawImage(s.cv, 55 - s.ox - 12, 100 - s.oy - 20); return pic(c.toDataURL(), 96); };
    const op = FGLHowto.op;
    FGLHowto.open({
        lang: 'ja', root: $('stage'), accent: '#7c5228', artBg: 'linear-gradient(#a6dcf4,#8ccb60)', rows: [
            { c: '#5aa83f', art: ic('wood') + op('▶') + ic('bench') + op('▶') + pic(toolIconUrl({ k: 'pick', a: 'iron', b: 'wood' }), 86), t: '集めて つくる', b: '1歩ごとに時間が進む。ぶつかると 切る・掘る・たたかう。集めた素材で道具を組み立てよう' },
            { c: '#7c5228', art: pic(toolIconUrl({ k: 'pick', a: 'iron', b: 'wood' }), 86) + op('▶') + ic('ladder') + op('▶') + ic('star'), t: '地下を掘る', b: '「ほる」で穴をあけ、はしごをかけると地下へ。世界のはしに近い深部に 星晶がある' },
            { c: '#3f4f8c', art: mob('zombie') + mob('wolf') + mob('golem'), t: '夜は気をつけて', b: '夜はまものが増える。寝床で朝まで眠れる。おなかが減るので 料理も大事' },
            { c: '#8a2a9c', art: ic('gate') + op('▶') + mob('knight') + op('▶') + '<span style="font-size:60px">👑</span>', t: '魔王をたおす', b: '星晶と大地の核で門をつくり、異世界へ。光ったマスから にげて 魔王をたおそう' }
        ]
    });
}

// ---------- タイトル ----------
function startPlay() {
    mode = 'play';
    mapRebuild();
    VIEW.title = false;
    $('title-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    lastHot = '';
    snapView();
    refreshHud();
    SFX.play('start');
}
function startNew(seed) {
    closeDialog(); deleteSave(); newGame(seed); saveGame(); startPlay();
    H.log('まずは 木にぶつかって 切ってみよう', 'good');
}
// ふつうは すぐ始まる。セーブを消すときだけ確認する
function askNewWorld() {
    if (!hasSave()) { startNew(0); return; }
    dialog('<h2>はじめから</h2><span style="color:#c8301c">今のセーブは消えます。</span><div class="row"><button class="wbtn go" id="n-go">はじめる</button><button class="wbtn" id="n-back">もどる</button></div>', b => {
        b.querySelector('#n-back').onclick = closeDialog;
        b.querySelector('#n-go').onclick = () => startNew(0);
    });
}
// 世界コードは 設定の中のオプション
// 主人公をえらぶ(この端末で全部の世界に使う)
function lookThumb(o) {
    const s = poseSprite('player_' + o.id, o.box, 2, false, 0), c = s.cv.getContext('2d'), d = c.getImageData(0, 0, s.cv.width, s.cv.height).data, w = s.cv.width;
    let x0 = w, x1 = 0, y0 = s.cv.height, y1 = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 20) { const p = (i - 3) / 4, x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const out = mkCanvas(x1 - x0 + 1, y1 - y0 + 1);
    out.getContext('2d').drawImage(s.cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL();
}
function openLooks(back) {
    const cur = lookId();
    const cell = o => '<button class="look' + (o.id === cur ? ' on' : '') + '" data-look="' + o.id + '"><img src="' + lookThumb(o) + '" alt=""><span>' + o.n + '</span></button>';
    dialog('<h2>主人公をえらぶ</h2><div class="lookrow">' + LOOKS.filter(o => o.g === 'm').map(cell).join('') + '</div><div class="lookrow">' + LOOKS.filter(o => o.g === 'f').map(cell).join('') + '</div><div class="row"><button class="wbtn go" id="lk-close">けってい</button></div>', b => {
        b.querySelectorAll('.look').forEach(el => el.onclick = () => {
            try { localStorage.setItem(LOOK_KEY, el.dataset.look); } catch (e) { }
            b.querySelectorAll('.look').forEach(q => q.classList.toggle('on', q === el));
            SFX.play('select'); VIEW.needDraw = true;
        });
        b.querySelector('#lk-close').onclick = () => { closeDialog(); if (back) back(); };
    });
}
function askWorldCode() {
    dialog('<h2>世界コードではじめる</h2>同じコードなら 同じ世界で遊べます。' + (hasSave() ? '<br><span style="color:#c8301c">今のセーブは消えます。</span>' : '') + '<div class="row"><input id="n-code" maxlength="10" placeholder="世界コード"></div><div id="n-msg" style="color:#c8301c;font-size:16px"></div><div class="row"><button class="wbtn go" id="n-go">はじめる</button><button class="wbtn" id="n-back">もどる</button></div>', b => {
        b.querySelector('#n-back').onclick = closeDialog;
        b.querySelector('#n-go').onclick = () => {
            const seed = codeToSeed(b.querySelector('#n-code').value);
            if (!seed) { b.querySelector('#n-msg').textContent = 'そのコードは使えません'; return; }
            startNew(seed);
        };
    });
}
$('btn-start').onclick = () => { SFX.unlock && SFX.unlock(); if (hasSave() && loadGame()) { startPlay(); H.log(dayNo() + '日目から つづき', 'good'); } else askNewWorld(); };
$('btn-new').onclick = askNewWorld;
$('btn-ach').onclick = () => { document.body.classList.add('ach-only'); openPanel('ach'); };
$('btn-rank').onclick = () => showRanking();
$('btn-howto').onclick = () => openHowto();
$('btn-home').onclick = () => { location.href = '../index.html'; };
$('btn-sound').onclick = () => { dialog('<h2>設定</h2><div id="t-sound"></div><div class="row"><button class="wbtn" id="t-look">主人公をえらぶ</button><button class="wbtn" id="t-code">世界コードではじめる</button><button class="wbtn" id="t-close">とじる</button></div>', b => { soundBtn('#t-sound'); b.querySelector('#t-code').onclick = askWorldCode; b.querySelector('#t-look').onclick = () => openLooks(); b.querySelector('#t-close').onclick = closeDialog; }); };
$('btn-name').onclick = () => {
    dialog('<h2>ニックネーム</h2><div class="row"><input id="p-name" maxlength="12" value="' + escapeHtml(getName()) + '"></div><div id="p-msg" style="color:#c8301c;font-size:16px"></div><div class="row"><button class="wbtn go" id="p-ok">決定</button><button class="wbtn" id="p-back">もどる</button></div>', b => {
        b.querySelector('#p-back').onclick = closeDialog;
        b.querySelector('#p-ok').onclick = () => { const v = FGLName.validate(b.querySelector('#p-name').value); if (!v.ok) { b.querySelector('#p-msg').textContent = v.reason === 'empty' ? 'ニックネームを入れてね' : FGLName.message(v.reason, 'simple'); return; } setName(v.name); closeDialog(); };
    });
};

// ---------- チュートリアル ----------
$('btn-tutorial').onclick = () => {
    FGLTutorial.begin({ root: '#stage', getLang: () => 'ja' });
    H.noAch = true;
    newGame(777777);
    const tx = S.x, ty = S.y;
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) setT(0, tx + x, ty + y, T.GRASS);
    setT(0, tx + 2, ty, T.TREE);
    S.face = [1, 0];
    const say = (target, text) => ({ type: 'say', target, text: { ja: text, easy: text, en: text } });
    const doo = (target, text, until) => ({ type: 'do', target, text: { ja: text, easy: text, en: text }, until });
    const panelOpen = () => !$('panel').classList.contains('hidden');
    startPlay();
    FGLTutorial.run([
        say('#bars', 'これはHPと満腹度。歩いたり掘ったりして 1回行動するたびに 時間が進み、おなかも減るよ。'),
        doo('#dpad', '▶を長押しして 右の木まで歩き、そのまま押し続けて 木を切ろう。', () => S.got.wood > 0),
        { type: 'run', fn: () => { give('wood', 14); give('leaf', 5); } },
        doo('#btn-craft', '木材が集まった! 「持ち物」を開こう。', panelOpen),
        doo('#tab-make', '「つくる」を押そう。', () => tab === 'make'),
        doo(() => document.querySelector('#rec-bench .mk'), '作業台をつくろう。', () => count('bench') > 0),
        doo('#panel-close', 'できた! 「とじる」で戻ろう。', () => !panelOpen()),
        { type: 'run', fn: () => { for (let i = 0; i < INV_SIZE; i++) if (S.inv[i] && S.inv[i].id === 'bench') S.sel = i; if (S.sel >= HOT_SIZE) { const q = S.inv[S.sel]; S.inv[S.sel] = S.inv[0]; S.inv[0] = q; S.sel = 0; } S.face = [0, -1]; lastHot = ''; refreshHud(); } },
        say('#hot', '下の枠で 持つ物をえらぶ。作業台を持っているよ。'),
        doo('#btn-use', '「置く」で 向いているマス(白いわく)に置こう。', () => S.got.placed_bench),
        doo('#dpad', '作業台に ぶつかると、作業台でつくれる物が開くよ。▲を押そう。', () => panelOpen() && panelStation() === 'bench'),
        { type: 'run', fn: () => { tab = 'tool'; toolKind = 'pick'; drawPanel(); } },
        say('#pbody', '素材をえらぶと 性能が変わるのがこのゲームの楽しみ。骨や銅が手に入ったら いろいろ試そう。'),
        doo('#tool-make', '木のつるはしを 組み立てよう。', () => S.got.tool_pick),
        doo('#panel-close', '「とじる」で戻ろう。', () => !panelOpen()),
        { type: 'run', fn: () => { S.face = [0, 1]; VIEW.needDraw = true; } },
        doo('#btn-dig', '「ほる」を押し続けて 足もとの先に穴をあけよう。', () => getT(0, S.x, S.y + 1) === T.PIT),
        { type: 'run', fn: () => { give('ladder', 2); for (let i = 0; i < INV_SIZE; i++) if (S.inv[i] && S.inv[i].id === 'ladder') { const q = S.inv[i]; S.inv[i] = S.inv[1]; S.inv[1] = q; } S.sel = 1; lastHot = ''; refreshHud(); } },
        doo('#btn-use', 'はしごを持たせたよ。「かける」で 穴にかけよう。', () => getT(0, S.x, S.y + 1) === T.LADDER_D),
        doo('#dpad', '▼で はしごに乗ると 地下へ行ける!', () => S.f === 1),
        say('#goal', '目標はいつもここに出るよ。地下の鉱石で道具を強くして、異世界の魔王をたおそう!')
    ]);
};

// ---------- 環境音(音声ファイルなしで合成。音量は効果音の設定にしたがう) ----------
let ambAc = null, ambNoise = null;
function ambInit() {
    if (ambAc) return;
    try {
        ambAc = new (window.AudioContext || window.webkitAudioContext)();
        const len = ambAc.sampleRate * 2, buf = ambAc.createBuffer(1, len, ambAc.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        ambNoise = buf;
    } catch (e) { ambAc = null; }
}
addEventListener('pointerdown', ambInit, { once: true }); addEventListener('keydown', ambInit, { once: true });
function ambTone(freq, dur, vol, type, slide, delay) {
    const t = ambAc.currentTime + (delay || 0), o = ambAc.createOscillator(), g = ambAc.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .25); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(ambAc.destination); o.start(t); o.stop(t + dur + .05);
}
function ambNoiseBurst(dur, vol, freq) {
    const t = ambAc.currentTime, s = ambAc.createBufferSource(), f = ambAc.createBiquadFilter(), g = ambAc.createGain();
    s.buffer = ambNoise; s.loop = true; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .4); g.gain.linearRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(ambAc.destination); s.start(t); s.stop(t + dur + .05);
}
setInterval(() => {
    if (!ambAc || mode !== 'play' || document.hidden || overlayOpen() || !S) return;
    if (ambAc.state === 'suspended') ambAc.resume();
    const v = (SFX.volume || 0) / 10 * .12, r = Math.random();
    if (v <= 0) return;
    if (isCave(S.f)) {
        if (r < .16) ambTone(55 + Math.random() * 25, 3, v * 1.4, 'sine', 42);              // 低いうなり
        else if (r < .3) { const f = 900 + Math.random() * 500; ambTone(f, .12, v * .7, 'sine', f * 1.5); }   // しずく
        else if (r < .36) ambNoiseBurst(1.2, v * .7, 220);                                  // どこかで岩がくずれる
    } else if (S.f === 2) {
        if (r < .3) ambTone(44 + Math.random() * 15, 3.5, v * 1.6, 'sawtooth', 36);
        else if (r < .4) ambNoiseBurst(2, v * .7, 300);
    } else {
        let water = false;
        for (let y = -4; y <= 4 && !water; y += 2) for (let x = -4; x <= 4; x += 2) if (TILE[getT(0, S.x + x, S.y + y)].swim) { water = true; break; }
        if (water && r < .3) ambNoiseBurst(2.5, v * .8, 700);
        if (isNight()) { if (Math.random() < .4) for (let i = 0; i < 4; i++) ambTone(3800 + Math.random() * 200, .05, v * .35, 'sine', null, i * .09); }   // 虫の声
        else if (Math.random() < .22) { const f = 2200 + Math.random() * 1500; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) ambTone(f, .09, v * .5, 'sine', f * 1.25, i * .14); }   // 鳥の声
    }
}, 1600);

// ---------- ループ ----------
let fishNext = 0;
function loop(now) {
    requestAnimationFrame(loop);
    if (fishing && mode === 'play' && canAct() && now >= fishNext) { fishNext = now + 230; fishTick(); }
    if (mode === 'play' && canAct() && now >= nextAct) {
        if (autoPath.length) {
            const d = autoPath.shift();
            step(d[0], d[1]);
            nextAct = now + moveWait();
        } else if (held && !holdLock) {
            doDir(held);
            nextAct = now + moveWait();
        }
    }
    if (VIEW.needDraw) render(now);
}

// ---------- 起動 ----------
initRender($('world'));
(function titleScene() {
    // タイトルの背景は 本物のゲーム画面
    newGame(20261103);
    VIEW.title = true;
    const sp = [['cow', 4, 2], ['chicken', -4, 3], ['sheep', 7, -2], ['pig', -7, -2]];
    sp.forEach(q => { const x = S.x + q[1], y = S.y + q[2]; if (TILE[getT(0, x, y)].ground) spawnMob(q[0], x, y); });
    snapView();
    $('btn-start').textContent = hasSave() ? 'つづきから' : 'はじめから';
    if (!hasSave()) $('btn-new').style.display = 'none';   // セーブがないときは大きなボタンだけ
})();
FGLTitle.mount({
    host: '#title-screen', hue: 100, art: 'compact', skin: 'board', fill: true, tag: 'FUN & GROWTH LAB',
    name: { ja: 'トレジャークラフト2', simple: 'トレジャークラフト2', en: 'Treasure Craft 2' },
    sub: { ja: '≪開発中≫ 掘って つくって 魔王をたおせ', simple: '≪かいはつちゅう≫ ほって つくって まおうを たおせ', en: '[In development] Dig, craft, defeat the demon king' },
    lang: () => 'ja',
    buttons: {
        start: '#btn-start', row: [
            { sel: '#btn-new', ico: 'play' }, { sel: '#btn-tutorial', ico: 'help' }, { sel: '#btn-howto', ico: 'star' }, { sel: '#btn-rank', ico: 'trophy' }, { sel: '#btn-ach', ico: 'star' }, { sel: '#btn-sound', ico: 'gear' },
            { sel: '#btn-name', ico: 'user', nudge: { unset: () => !getName(), dir: 'down' } }, { sel: '#btn-home', ico: 'home' }]
    }
});
requestAnimationFrame(loop);
addEventListener('pagehide', () => { if (mode === 'play') saveGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') saveGame(); });
