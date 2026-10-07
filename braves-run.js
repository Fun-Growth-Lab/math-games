// Math Braves 共通部品(RUN): タイトルの飾り・RUN選択・ステージ演出・RUNの結果・タイトル/ランキング/設定/プレーヤーのボタン結線。
// braves-common.js と、ゲームの本体(braves-battle.js、または各ゲームのhtml内のスクリプト)の「あと」に読み込む。
// ゲーム本体が用意するもの: backToTitle() / startRun(star) / startStage(n) / monHTML(shape) / startTutorial()
// ゲームのhtmlで決められるもの: GAME.stageCount(ステージ数。既定7) / GAME.stageThemes(ステージの色 [{c}]) / GAME.titleScene(タイトルの街の形)

// ステージ数と、ステージごとの世界の色(c)
// ステージ数。★ごとに変わるゲーム(わりざん)は GAME.stageCountFor(star) を用意すると、RUNを始めるときに入れかわる
let STAGE_COUNT = GAME.stageCount || 7;
function stageCountFor(star) { return GAME.stageCountFor ? GAME.stageCountFor(star) : (GAME.stageCount || 7); }
const STAR_LOCK = true;       // ★は1つ前をクリアすると開く(九九ポーカー方式)

// ステージごとの世界。bgf=通常戦の背景に重ねるフィルター(haikei_1を色変え)、bossf=ボス戦(haikei_2を色変え)
const STAGE_THEMES = GAME.stageThemes || [
    { c: '#4caf50', bgf: 'none',                                                              bossf: 'none' },
    { c: '#26a9e0', bgf: 'hue-rotate(-10deg) saturate(1.05) brightness(1.08)',                bossf: 'hue-rotate(-70deg) saturate(1.1)' },
    { c: '#ff8a50', bgf: 'sepia(0.5) saturate(1.8) hue-rotate(-18deg) brightness(0.92)',      bossf: 'hue-rotate(40deg) saturate(1.2)' },
    { c: '#6fd3e8', bgf: 'grayscale(0.5) brightness(1.15) hue-rotate(15deg) saturate(1.2)',   bossf: 'hue-rotate(-95deg) saturate(0.8) brightness(1.1)' },
    { c: '#ef5350', bgf: 'sepia(0.9) hue-rotate(-50deg) saturate(3) brightness(0.7) contrast(1.15)', bossf: 'hue-rotate(110deg) saturate(1.4) brightness(0.95)' },
    { c: '#7e8bff', bgf: 'brightness(1.2) saturate(0.85) hue-rotate(-8deg) contrast(0.95)',   bossf: 'hue-rotate(60deg) saturate(1.3) brightness(1.05)' },
    { c: '#8e24aa', img: 'haikei_2.png', bgf: 'brightness(0.95) saturate(1.1)',               bossf: 'brightness(0.8) saturate(1.35) contrast(1.1)' },
];
function stageName(n) { return T('stage_name_' + n); }

// ---- タイトルの ゲーム名(大きく)。文字数に合わせて大きさを決める ----
function buildTitleName() {
    const el = document.getElementById('ts-l2');
    if (!el) return;
    const text = T('title_plaque');
    if (el._t === text) return;
    el._t = text;
    const units = Array.from(text).reduce((a, ch) => a + (/[ -~]/.test(ch) ? 0.56 : 1.0), 0);
    el.style.fontSize = Math.max(44, Math.min(132, Math.floor(1040 / (units + 0.4)))) + 'px';
    el.innerHTML = Array.from(text).map((ch, i) => ch === ' ' ? '<span class="ts-sp"></span>' : `<span class="tl" data-t="${ch}" style="--i:${i + 4}">${ch}</span>`).join('');
}
// ---- タイトルの主役: 大きな数字カードの扇(まん中の金のカードが「答え」)と 演算のバッジ ----
// GAME.titleCards=[カード5まい(html可)] / GAME.titleGold=金のカードの番号(既定2) / GAME.titleOp=バッジの記号
function buildTitleHero() {
    const el = document.getElementById('ts-hero');
    if (!el) return;
    const cards = GAME.titleCards || ['3', '7', '10', '9', '6'], gold = GAME.titleGold === undefined ? 2 : GAME.titleGold, op = GAME.titleOp || '＋';
    const maxLen = Math.max(...cards.map(c => String(c).replace(/<[^>]*>/g, '').length)), step = maxLen >= 3 ? 112 : 96;
    el.innerHTML = cards.map((c, i) => {
        const k = i - 2, len = String(c).replace(/<[^>]*>/g, '').length, isFr = /class="fr"/.test(c);
        const fs0 = isFr ? 4 : len === 1 ? 7.2 : len === 2 ? 5.8 : len === 3 ? 4 : 3.6, fs = (k === 0 ? fs0 * (isFr ? 1.08 : len === 1 ? 1.1 : 1.3) : fs0).toFixed(2);
        return `<div class="th-card${i === gold ? ' gold' : ''}${k < 0 ? ' l' : k > 0 ? ' r' : ''}" style="--r:${k * 12}deg;--x:${k * step}px;--y:${Math.abs(k) * 22 + (k === 0 ? 0 : 6)}px;z-index:${10 - Math.abs(k)};--fs:${fs}rem"><b>${c}</b></div>`;
    }).join('') + `<div class="th-op">${op}</div>`;
}

// ---- タイトルの飾り ----
function buildTitleDecor() {
    const letters = (text) => Array.from(text).map((ch, i) => `<span class="tl" data-t="${ch}" style="--i:${i}">${ch}</span>`).join('');
    document.getElementById('ts-l1').innerHTML = Array.from('MATH BRAVES').map((ch, i) => ch === ' ' ? '<span class="ts-sp"></span>' : `<span class="tl" data-t="${ch}" style="--i:${i}">${ch}</span>`).join('');
    buildTitleName();
    buildTitleHero();
    // 街のシルエット(ビルの高さをばらつかせる)
    const skyline = (seed, lo, hi, step) => {
        const pts = ['0% 100%']; let x = 0, r = seed;
        while (x < 100) { r = (r * 9301 + 49297) % 233280; const h = lo + (r / 233280) * (hi - lo), w = step * (0.7 + (r % 7) / 10); pts.push(`${x}% ${100 - h}%`, `${x + w}% ${100 - h}%`); x += w; }
        pts.push('100% 100%');
        return 'polygon(' + pts.join(',') + ')';
    };
    const sky = GAME.titleSkyline || skyline;      // ゲームごとにシルエット(ビル/城壁など)を変えられる
    document.getElementById('ts-city1').style.clipPath = sky(7, 30, 90, 4.2);
    document.getElementById('ts-city2').style.clipPath = sky(31, 25, 100, 3.4);
    // ロボ軍団(ゲーム内の敵と同じ絵)
    const bots = GAME.titleBots;
    document.getElementById('ts-bots').innerHTML = bots.map(([k, l, t, sc, c], i) =>
        `<div class="ts-bot" style="left:${l}px;top:${t}px;animation-delay:${-i * 0.7}s"><div class="mon" style="--s:${sc};--c:${c}">${monHTML(k)}</div></div>`).join('');
    // ふわふわ飛ぶ数字カード
    const nums = GAME.titleNums || [3, 5, 8, 12, 7, 4, 9, 6];
    document.getElementById('ts-cards').innerHTML = nums.map((n, i) => {
        const left = 60 + (i * 157) % 1160, dur = 11 + (i * 3) % 7, delay = -((i * 2.7) % 14);
        return `<div class="pc" style="left:${left}px;animation-duration:${dur}s;animation-delay:${delay}s;background:${i % 3 === 0 ? 'linear-gradient(160deg,#fff4b0,#ffc93d 55%,#e8a317);color:#7a2a00' : 'linear-gradient(#fff,#dfe8ff);color:#2d3d78'};border-color:#fff;">${n}</div>`;
    }).join('');
    const marks = ['✦', '✧', '＋', '✦', '✧', '＋', '✧', '✦'];
    document.getElementById('ts-floaters').innerHTML = marks.map((m, i) => {
        const left = 30 + (i * 149) % 1200, size = 22 + (i * 13) % 30, dur = 8 + (i * 5) % 8, delay = -((i * 3.1) % 12);
        return `<span style="left:${left}px;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">${m}</span>`;
    }).join('');
}

// ---- 進み具合（★のクリア）と画面遷移 ----
const LAST_STAR_KEY = GAME.keys.lastStar;
let selStar = 1;
try { selStar = Math.max(1, Math.min(3, parseInt(localStorage.getItem(LAST_STAR_KEY), 10) || 1)); } catch (e) {}
function starKey(n) { return 'STAR' + n; }
function starCleared(n) { return getClearCount(starKey(n)) > 0; }
function starUnlocked(n) { return !STAR_LOCK || n === 1 || starCleared(n - 1); }
function bestScore(n) { const l = getLocalRanking(starKey(n)); return l.length ? l[0].score : 0; }
function runSelectVisible() { return !document.getElementById('run-select-screen').classList.contains('hidden'); }

function hideAllOverlays() {
    ['run-select-screen', 'stage-intro', 'stage-clear', 'run-end-screen'].forEach(id => document.getElementById(id).classList.add('hidden'));
    clearTimeout(introTimer);
}
function goRunSelect() {
    hideAllOverlays();
    ui.title.classList.add('hidden');
    document.getElementById('run-select-screen').classList.remove('hidden');
    renderRunSelect();
}

// ---- RUN選択 ----
let runSelIdx = 0;
const RS_CARD_W = 244, RS_GAP = 20;
function pcardBg(n) { return ['linear-gradient(#ff8a7a,#e8503d)', 'linear-gradient(#5cc7ff,#2a8fd8)', 'linear-gradient(#7be05c,#3fae2a)', 'linear-gradient(#ffd24a,#e8a317)', 'linear-gradient(#b48aff,#7a4fd6)'][n % 5]; }
function pcard(n, left, top, rot, extra) {
    return `<div class="pc" style="left:${left}px;top:${top}px;transform:rotate(${rot || 0}deg);background:${pcardBg(n)};${extra || ''}">${n}</div>`;
}
function runArt(id) {
    const sp = (ch, l, t, s, d) => `<div class="spark" style="left:${l}px;top:${t}px;font-size:${s}px;animation-delay:${d || 0}s">${ch}</div>`;
    const white = 'background:linear-gradient(#fff,#dfe8ff);color:#2d3d78;border-color:#c9d3f0;';
    const rn = GAME.runArtNums || [4, 6, 10];       // RUNカードに浮かべる数字(しょうすうは小数)
    const rl = GAME.runArtLayout || [[6, 62, -12], [38, 76, 7], [160, 8, 10]];     // その位置 [left, top, 角度]
    if (id === 'normal') {
        return `<div class="rs-art" style="background:linear-gradient(hsl(calc(var(--h) + 5) 72.3% 32.6%),hsl(calc(var(--h) + 8) 77.8% 17.6%))">
            <div class="rsa-floor"></div>
            <div class="mon" style="position:absolute;left:58px;top:2px;width:150px;height:150px;--c:${GAME.runArt.color};transform:scale(0.92);transform-origin:50% 100%">${monHTML(GAME.runArt.shape)}</div>
            ${pcard(rn[0], rl[0][0], rl[0][1], rl[0][2], white)}${pcard(rn[1], rl[1][0], rl[1][1], rl[1][2], white)}
            ${pcard(rn[2], rl[2][0], rl[2][1], rl[2][2], 'background:linear-gradient(160deg,#fff4b0,#ffc93d 55%,#e8a317);color:#7a2a00;border-color:#b57a00;box-shadow:0 4px 0 rgba(0,0,0,0.3),0 0 18px rgba(255,216,77,0.9);')}
            ${sp('✦', 126, 14, 20)}${sp('✦', 14, 20, 16, 0.6)}${sp('✦', 200, 100, 14, 1.1)}</div>`;
    }
    return `<div class="rs-art" style="background:linear-gradient(#4a4f66,#2a2d40)">
        <div style="position:absolute;left:78px;top:14px;font-size:92px;font-weight:900;color:rgba(255,255,255,0.25)">？</div>
        <div style="position:absolute;left:92px;top:84px;width:44px;height:44px;color:#fff">${ICO.lock}</div></div>`;
}
function renderRunSelect() {
    if (!starUnlocked(selStar)) selStar = 1;
    const cur = RUN_LIST[runSelIdx];
    document.getElementById('rs-strip').innerHTML = RUN_LIST.map((r, i) => {
        const medals = r.locked ? '' : [1, 2, 3].map(n => starCleared(n) ? '★' : '☆').join('');
        return `<div class="rs-card${i === runSelIdx ? ' sel' : ''}${r.locked ? ' locked' : ''}" style="--c:${r.color}" data-idx="${i}">
            <div class="rs-tab">${T('run_' + r.id + '_name')}</div>
            ${runArt(r.id)}
            <div class="rs-body"><div class="rs-short">${T('run_' + r.id + '_short')}</div><div class="rs-medals">${medals}</div></div>
            ${r.locked ? '' : `<button class="rs-go" data-go="1">${T('btn_run_go')}</button>`}
        </div>`;
    }).join('');
    document.querySelectorAll('#rs-strip .rs-card').forEach(el => {
        bindBtn(el, () => { runSelIdx = parseInt(el.dataset.idx, 10); renderRunSelect(); });
    });
    document.querySelectorAll('#rs-strip .rs-go').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); startRun(selStar); });
        el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); startRun(selStar); }, { passive: false });
    });
    centerRunStrip();
    const best = bestScore(selStar);
    document.getElementById('rs-desc').innerHTML = T('run_' + cur.id + '_desc') +
        (best && !cur.locked ? `　<span class="ds-best">${T('best_label', { n: best })}</span>` : '');
    document.getElementById('star-row').innerHTML = [1, 2, 3].map(n => {
        const locked = !starUnlocked(n);
        return `<button class="star-btn${n === selStar ? ' active' : ''}${locked ? ' locked' : ''}${starCleared(n) ? ' cleared' : ''}" data-star="${n}">${'★'.repeat(n)}<small>${locked ? `<span class="ico" style="width:.85em;height:.85em;vertical-align:-.1em">${ICO.lock}</span> ` : ''}${T(['diff_easy', 'diff_normal', 'diff_hard'][n - 1])}</small></button>`;
    }).join('');
    document.querySelectorAll('#star-row .star-btn').forEach(el => {
        bindBtn(el, () => {
            const n = parseInt(el.dataset.star, 10);
            if (!starUnlocked(n)) return;
            selStar = n;
            try { localStorage.setItem(LAST_STAR_KEY, String(n)); } catch (e) {}
            renderRunSelect();
        });
    });
    document.getElementById('chip-row').innerHTML = STAGE_THEMES.slice(0, stageCountFor(selStar)).map((th, i) =>
        `<div class="stage-chip" style="border-color:${th.c}"><small>${T('stage_word')}</small><b>${i + 1}</b></div>`).join('');
    document.getElementById('rs-prev').disabled = runSelIdx <= 0;
    document.getElementById('rs-next').disabled = runSelIdx >= RUN_LIST.length - 1;
}
function centerRunStrip() {
    const vp = document.getElementById('rs-viewport');
    const PAD = 22, n = RUN_LIST.length;
    const total = n * RS_CARD_W + (n - 1) * RS_GAP + PAD * 2;
    const vw = vp.clientWidth || 1010;
    let x = vw / 2 - (PAD + runSelIdx * (RS_CARD_W + RS_GAP) + RS_CARD_W / 2);
    x = Math.max(Math.min(0, vw - total), Math.min(0, x));
    if (total < vw) x = (vw - total) / 2;           // カードが少ない時は中央に寄せる
    document.getElementById('rs-strip').style.transform = `translateX(${x}px)`;
}

// ---- ステージ演出 ----
let introTimer = null;
function showStageIntro(n, cb) {
    const th = STAGE_THEMES[n - 1];
    const el = document.getElementById('stage-intro');
    clearTimeout(introTimer);
    el.className = n === STAGE_COUNT ? 'final' : '';
    el.style.setProperty('--sc', th.c);
    document.getElementById('si-no').textContent = n === STAGE_COUNT ? T('final_title') : `${T('stage_word')} ${n} / ${STAGE_COUNT}`;
    document.getElementById('si-name').textContent = stageName(n);
    el.classList.remove('hidden');
    introTimer = setTimeout(() => { el.classList.add('hidden'); if (cb) cb(); }, n === STAGE_COUNT ? 2300 : 1900);
}

function showStageClear(st, stageScore) {
    const th = STAGE_THEMES[st - 1], nx = STAGE_THEMES[st];
    document.getElementById('sc-title').textContent = T('stage_clear_title', { n: st });
    document.getElementById('sc-theme').textContent = stageName(st);
    const pts = T('unit_pts');
    document.getElementById('sc-rows').innerHTML =
        `<div><span>${T('sc_stage_score')}</span><b>${stageScore}${pts}</b></div>` +
        (GAME.clearRows ? GAME.clearRows(st, stageScore) : `<div><span>${T('sc_time_bonus')}</span><b>+${stageClearTime(st)}</b></div>` +
        `<div><span>${T('sc_time_now')}</span><b>${state.time}</b></div>`) +
        `<div class="big"><span>${T('result_total_score')}</span><b>${state.score}${pts}</b></div>`;
    document.getElementById('sc-next').textContent = T('sc_next', { name: stageName(st + 1) });
    document.getElementById('sc-go').textContent = T('btn_next_stage', { n: st + 1 });
    document.getElementById('stage-clear').classList.remove('hidden');
}
bindBtn(document.getElementById('sc-go'), () => {
    const box = document.getElementById('stage-clear');
    if (box.classList.contains('hidden')) return;
    box.classList.add('hidden');
    startStage(state.stage + 1);
});

// ---- RUNの結果の画面(クリア／ゲームオーバー共通)----
function showRunEnd(cleared, finalScore, isNewRecord, timeBonus, maxScoreBonus) {
    const el = document.getElementById('run-end-screen');
    const pts = T('unit_pts');
    const title = cleared ? T('end_clear_title') : T('gameover_title');
    const ribbon = Array.from(title).map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('');
    const reached = cleared ? STAGE_COUNT : state.stage;
    const journey = Array.from({ length: STAGE_COUNT }, (_, i) => {
        const n = i + 1;
        const ok = cleared ? true : n < state.stage;
        const ng = !cleared && n === state.stage;
        const sc = state.stageScores[i];
        return `<div class="ej${ok ? ' ok' : ''}${ng ? ' ng' : ''}"><div class="dot">${ok ? '✔' : n}</div><div class="sc">${(ok || ng) && sc !== undefined ? sc : ''}</div></div>`;
    }).join('');
    const confetti = cleared ? Array.from({ length: 36 }, (_, i) => {
        const c = ['#ffd84d', '#ff8a50', '#5cc7ff', '#7be05c', '#ff6b8e', '#b48aff'][i % 6];
        return `<i style="left:${(i * 37) % 1280}px;background:${c};animation-duration:${3 + (i % 5)}s;animation-delay:${-(i % 7)}s"></i>`;
    }).join('') : '';
    el.className = cleared ? '' : 'over';
    el.innerHTML = `
        <div class="end-rays"></div><div class="end-confetti">${confetti}</div>
        <div class="end-box${cleared ? '' : ' over'}">
            <div class="end-ribbon">${ribbon}</div>
            <div class="end-run"><span class="rn">${T('run_normal_name')}</span><span>${'★'.repeat(state.star)}　${T(['diff_easy', 'diff_normal', 'diff_hard'][state.star - 1])}</span></div>
            <div class="end-journey">${journey}</div>
            <div class="end-stats">
                <div class="end-stat s1">${isNewRecord ? `<div class="rec">${T('high_score_msg')}</div>` : ''}
                    <div class="lb">${T('result_final_score')}</div><div class="vl">${finalScore}<small style="font-size:1.6rem">${pts}</small></div>
                    <div class="sb">${GAME.endBreakdown ? GAME.endBreakdown(cleared, finalScore, timeBonus, maxScoreBonus) : `⚔️ ${state.score} ＋ ⏱ ${timeBonus} ＋ 🥇 ${maxScoreBonus}`}</div></div>
                <div class="end-stat s2"><div class="lb">${T('end_reached')}</div><div class="vl">${reached}<small style="font-size:1.6rem"> / ${STAGE_COUNT}</small></div>
                    <div class="sb">${stageName(reached)}</div></div>
            </div>
            <div class="end-btns">
                <button class="rs-mini orange" id="end-retry">${T('btn_retry')}</button>
                <button class="rs-mini blue" id="end-runselect">${T('btn_back_runselect')}</button>
                <button class="rs-mini" id="end-title">${T('btn_to_title')}</button>
            </div>
        </div>`;
    el.classList.remove('hidden');
    bindBtn(document.getElementById('end-retry'), () => { el.classList.add('hidden'); startRun(state.star); });
    bindBtn(document.getElementById('end-runselect'), () => { goRunSelect(); });
    bindBtn(document.getElementById('end-title'), () => { backToTitle(); });
}

// タイトル → RUN選択
bindBtn(ui.btnStartMenu, () => { goRunSelect(); });
bindBtn(document.getElementById('rs-back'), () => { backToTitle(); });
bindBtn(document.getElementById('rs-rank'), () => { state.rankingMode = window.currentUser ? 'WORLD' : 'LOCAL'; showRankingScreen(); });
bindBtn(document.getElementById('rs-prev'), () => { if (runSelIdx > 0) { runSelIdx--; renderRunSelect(); } });
bindBtn(document.getElementById('rs-next'), () => { if (runSelIdx < RUN_LIST.length - 1) { runSelIdx++; renderRunSelect(); } });

// ============================================================
// チュートリアル（練習プレイ）
// ============================================================
// 実際のバトル画面で「カードを重ねて数を作り、まとカードにぶつける」を体験する。
// 書き込みはエンジンが止めるので、ランキング・クリア回数は一切汚れない。
bindBtn(document.getElementById('btn-tutorial'), () => startTutorial());

if (ui.btnLogin) bindBtn(ui.btnLogin, () => window.handleLogin());
if (ui.btnLogout) bindBtn(ui.btnLogout, () => window.handleLogout());

bindBtn(ui.btnViewRanking, () => {
    if (window.currentUser) {
        state.rankingMode = 'WORLD';
    } else {
        state.rankingMode = 'LOCAL';
    }
    showRankingScreen();
});

bindBtn(ui.btnCloseRanking, () => {
    ui.rankingScreen.classList.add('hidden');
});

bindBtn(ui.btnToTitle, () => {
    if (state.runMode && state.screen === 'PLAYING') showCustomConfirm(T('confirm_quit'), () => backToTitle());
    else backToTitle();
});

// 遊び方モーダル
const howtoModal   = document.getElementById('howto-modal');
const btnHowto     = document.getElementById('btn-howto');
const btnCloseHowto = document.getElementById('btn-close-howto');
if (btnHowto)      bindBtn(btnHowto, () => howtoModal.classList.remove('hidden'));
if (btnCloseHowto) bindBtn(btnCloseHowto, () => howtoModal.classList.add('hidden'));
howtoModal.addEventListener('click', (e) => { if (e.target === howtoModal) howtoModal.classList.add('hidden'); });

bindBtn(ui.btnIndex, () => {
    window.location.href = "../index.html";
});

bindBtn(ui.btnOpenSettings, () => { document.getElementById('settings-screen').classList.remove('hidden'); });
bindBtn(ui.btnCloseSettings, () => { document.getElementById('settings-screen').classList.add('hidden'); });

bindBtn(ui.btnRankLocal, () => {
    state.rankingMode = 'LOCAL';
    showRankingScreen();
});
bindBtn(ui.btnRankWorld, () => {
    state.rankingMode = 'WORLD';
    showRankingScreen();
});

bindBtn(ui.playerSelectBtn, () => {
    renderPlayerList();
    ui.playerManagerOverlay.classList.remove('hidden');
});

bindBtn(ui.btnClosePlayerManager, () => {
    ui.playerManagerOverlay.classList.add('hidden');
});

bindBtn(ui.btnAddPlayer, () => {
    addPlayer();
});


// 最初の画面を出す
buildTitleDecor();
backToTitle();
applyLanguage();
