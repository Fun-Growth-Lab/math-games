// Math Braves 共通部品(UI): 画面のひな形・多言語・アイコン・プレーヤー管理・ランキング保存・画面サイズ調整など。
// 使い方: 各ゲームのhtmlで先に `const GAME = {...}` などを定義してから、このファイルを読み込む。
//   GAME.sbGame   : Supabaseに保存するゲームID
//   GAME.keys     : localStorageのキー(lang / lastStar / ranking(diff) / clearCount(diff))
//   GAME.strings  : ゲーム固有の文言 {ja, simple, en}
//   GAME.titleBots / GAME.runArt : タイトルとRUNカードに出すロボの配置
//   GAME.rules    : ゲーム固有のルール(merge / canAttack / damage / damageNumber / mergeHint)
// ほかに PRESET_EASY/NORMAL/HARD, STAGE_CLEAR_TIME, BOSS_MIN_SCALE, ENEMY_COLORS, RUN_LIST, ROBOTS, ROBOT_BOSS をゲーム側で定義する。
// ゲーム画面(左右パネル+盤面)と遊び方は、ゲームごとに GAME.gameLayerHTML / GAME.howtoHTML で差し替えられる
const _GAME_LAYER_HTML = `
    <div id="game-layer">
        <div id="left-panel">
            <div class="sp-brand"><i class="ico" data-ico="robot"></i><span data-i18n="subject_badge">たしざん</span><i class="ico" data-ico="robot"></i></div>
            <div class="sp-mode"><span class="rn" id="sp-run"></span><span class="df" id="sp-diff"></span></div>
            <div class="sp-card sp-player">
                <div class="av" id="sp-av">な</div>
                <div class="who"><div class="sp-lb" data-i18n="label_player" data-noemo>プレーヤー</div><span id="disp-player-name">ななしさん</span></div>
            </div>
            <div class="sp-card">
                <div class="sp-lb"><i class="ico" data-ico="flag"></i><span data-i18n="label_stage" data-noemo>ステージ</span><b class="rt-num" id="disp-difficulty-label"></b></div>
                <div class="rt-list" id="sp-route"></div>
            </div>
            <div class="sp-card">
                <div class="sp-lb"><i class="ico" data-ico="robot"></i><span data-i18n="label_enemies_left" data-noemo>のこりの てき</span><b class="rt-num" id="disp-enemies">0</b></div>
                <div class="foes" id="sp-foes"></div>
                <div class="sp-sub"><span data-i18n="label_enemy_range" data-noemo>てきの すうじ</span><b id="disp-enemy-range"></b></div>
            </div>
            <div class="sp-spacer"></div>
            <button id="btn-howto" class="sp-btn"><i class="ico" data-ico="book"></i><span data-i18n="btn_howto" data-noemo>あそびかた</span></button>
            <button id="btn-to-title" class="sp-btn red hidden title-menu-btn"><i class="ico" data-ico="home"></i><span data-i18n="btn_to_title">タイトルへ もどる</span></button>
        </div>

        <div id="game-area">
            <canvas id="gameCanvas"></canvas>
            <div id="game-result" style="display: none;"></div>
        </div>

        <div id="right-panel">
            <div id="right-panel-content">
                <div class="sp-card">
                    <div class="sp-lb"><i class="ico" data-ico="trophy"></i><span data-i18n="label_total_score" data-noemo>ごうけい スコア</span></div>
                    <div id="disp-total-score" class="sp-score">0</div>
                </div>
                <div class="sp-card">
                    <div class="sp-lb"><i class="ico" data-ico="medal"></i><span data-i18n="label_max_score" data-noemo>さいだい スコア</span></div>
                    <div id="disp-max-score" class="sp-best">0</div>
                </div>
                <div class="sp-card">
                    <div class="sp-lb"><i class="ico" data-ico="sword"></i><span data-i18n="lh_title">さいごの こうげき</span></div>
                    <div class="sp-formula">
                        <div class="t"><i class="ico" data-ico="sword"></i><b id="lh-a">–</b><span data-i18n="calc_t1">カード</span></div><div class="x">×</div>
                        <div class="t"><i class="ico" data-ico="star"></i><b id="lh-b">–</b><span data-i18n="calc_t2">ほし</span></div><div class="x">×</div>
                        <div class="t"><i class="ico" data-ico="hash"></i><b id="lh-c">–</b><span data-i18n="calc_t3">黄色の数字</span></div>
                    </div>
                    <div class="sp-eq">＝ <b id="lh-d">–</b> <span data-i18n="lh_dmg">ダメージ</span></div>
                </div>
                <div class="sp-card sp-log">
                    <div class="sp-lb"><i class="ico" data-ico="list"></i><span data-i18n="panel_battle_log" data-noemo>バトルログ</span></div>
                    <div id="battle-log-entries"></div>
                </div>
            </div>
        </div>
    </div>
`;
const _HOWTO_HTML = `
    <!-- 遊び方モーダル -->
    <div id="howto-modal" class="hidden">
        <div class="howto-inner">
            <button id="btn-close-howto">✕</button>
            <h2 style="color:#fb8c00; border-bottom:3px dotted #ffcc80; padding-bottom:10px; margin-top:0; font-size:1.3rem;" data-i18n="howto_title">あそびかた</h2>
            <div style="font-size:0.92rem; line-height:1.75;">
                <p data-i18n-html="howto_p1">1. 手札カードを <strong>てきの まとカード</strong>に<br>ぶつけて たおそう！<br>
                まとカードと <strong>おなじかず</strong>を つくってね。</p>
                <p data-i18n-html="howto_p2">2. カードを <strong>かさねる</strong>と かずが たされ<br>
                カードの <strong>⚔️</strong> が ふえるよ。<br>
                ⚔️が おおいほど ダメージが アップ！<br>
                かさねると <strong>のこり じかん</strong>が へるよ。</p>
                <p data-i18n-html="howto_p3">3. <strong>ダメージ = ⚔️ × ⭐ × かず</strong><br>
                まとカードの <strong>⭐</strong> が おおいほど<br>ダメージが たかくなるよ。</p>
                <p data-i18n-html="howto_p4">4. いらないカードは したの <strong>すてば</strong> へ。<br>すてても じかんが へるよ。</p>
                <p data-i18n-html="howto_p5">5. てきを たおすと <strong>のこり じかん</strong>が ふえるよ。</p>
                <p style="margin-bottom:0;" data-i18n-html="howto_p6">6. <strong>ボス</strong>を たおすと ゲームクリアだ！</p>
            </div>
        </div>
    </div>
`;
document.getElementById('container').innerHTML = (GAME.gameLayerHTML || _GAME_LAYER_HTML) + (GAME.howtoHTML || _HOWTO_HTML) + `
    <!-- ==================== TITLE ==================== -->
    <div id="title-screen" class="intro">
        <div class="ts-bg">
            <div class="ts-stars"></div><div class="ts-sun"></div>
            <div class="ts-city far" id="ts-city1"></div><div class="ts-city" id="ts-city2"></div>
            <div class="ts-floor"></div><div class="ts-hz"></div>
            <div id="ts-bots"></div><div class="ts-cards" id="ts-cards"></div><div class="ts-vig"></div>
        </div>
        <div class="ts-glow"></div>
        <div class="ts-floaters" id="ts-floaters"></div>
        <div class="ts-logo">
            <div class="ts-emblem"><i class="ico" data-ico="sword"></i><i class="ico" data-ico="sword"></i></div>
            <span class="l1" id="ts-l1"></span>
            <span class="l2" id="ts-l2"></span>
            <div class="ts-sub" data-i18n="title_plaque">たしざんバトル</div>
        </div>
        <div class="ts-menu">
            <button id="btn-start-menu" class="tm-btn primary" data-i18n="btn_start">はじめる</button>
            <button id="btn-tutorial" class="tm-btn"><span class="ic"><i class="ico" data-ico="help"></i></span><span data-i18n="tm_tutorial">チュートリアル</span></button>
            <button id="btn-view-ranking" class="tm-btn"><span class="ic"><i class="ico" data-ico="trophy"></i></span><span data-i18n="tm_ranking">ランキング</span></button>
            <button id="btn-open-settings" class="tm-btn"><span class="ic"><i class="ico" data-ico="gear"></i></span><span data-i18n="tm_settings">設定</span></button>
            <button id="player-select-btn" class="tm-btn sub" title="プレーヤーをへんこうする"><span class="ic"><i class="ico" data-ico="user"></i></span><span id="current-player-name-display">ななしさん</span></button>
            <button id="btn-index" class="tm-btn"><span class="ic"><i class="ico" data-ico="home"></i></span><span data-i18n="tm_index">INDEXへ</span></button>
            <button id="btn-login" class="btn btn-auth title-menu-btn" style="display:none;">Googleでログイン</button>
            <button id="btn-logout" class="btn btn-danger title-menu-btn hidden" style="display:none;">ログアウト</button>
            <div id="auth-status" style="display:none;"></div>
        </div>
    </div>

    <!-- ==================== RUN SELECT ==================== -->
    <div id="run-select-screen" class="screen hidden">
        <div class="rs-top">
            <button class="rs-mini" id="rs-back" data-i18n="btn_back_title">◀ タイトルへ</button>
            <div class="rs-plaque" data-i18n="runselect_title">RUNをえらぼう</div>
            <button class="rs-mini blue" id="rs-rank" data-i18n="btn_ranking">🏆 ランキング</button>
        </div>
        <div class="rs-stage">
            <button class="rs-arrow" id="rs-prev">◀</button>
            <div class="rs-viewport" id="rs-viewport"><div id="rs-strip"></div></div>
            <button class="rs-arrow" id="rs-next">▶</button>
        </div>
        <div class="rs-bottom">
            <div class="rs-desc" id="rs-desc"></div>
            <div class="rs-bottom-row">
                <div class="star-row" id="star-row"></div>
                <div class="chip-row" id="chip-row"></div>
            </div>
        </div>
    </div>

    <!-- ==================== ステージ演出 ==================== -->
    <div id="stage-intro" class="hidden"><div class="si-dim"></div><div class="si-band"><div class="si-no" id="si-no"></div><div class="si-name" id="si-name"></div></div></div>

    <div id="stage-clear" class="hidden">
        <div class="sc-box">
            <div class="sc-ribbon" id="sc-title"></div>
            <div class="sc-theme" id="sc-theme"></div>
            <div class="sc-rows" id="sc-rows"></div>
            <div class="sc-next" id="sc-next"></div>
            <button class="rs-go" id="sc-go"></button>
        </div>
    </div>

    <div id="run-end-screen" class="hidden"></div>

    <div id="settings-screen" class="hidden">
        <div class="overlay-content" style="width: 380px;">
            <h2 style="color: #7e57c2; margin-top: 0; border:none;" data-i18n="settings_title">⚙ 設定</h2>
            <p style="font-size:0.9rem; color:#888; margin-bottom:16px;" data-i18n="settings_sub">言語 / Language</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button id="lang-btn-simple" class="btn lang-btn" onclick="selectLanguage('simple')" data-i18n="lang_simple">かんたんなにほんご</button>
                <button id="lang-btn-ja"     class="btn lang-btn" onclick="selectLanguage('ja')"     data-i18n="lang_ja">日本語</button>
                <button id="lang-btn-en"     class="btn lang-btn" onclick="selectLanguage('en')"     data-i18n="lang_en">English</button>
            </div>
            <button id="btn-close-settings" class="btn" style="margin-top:20px;" data-i18n="btn_close">とじる</button>
        </div>
    </div>

    <div id="ranking-screen" class="hidden">
        <div id="ranking-overlay">
            <div class="overlay-content" style="width: 95%; max-width: 900px;">
                <h2 id="ranking-header-title" style="color: #ff7043; margin-top: 0; border:none;">ベストスコア 10</h2>

                <div style="margin-bottom: 20px;">
                    <button id="btn-rank-world" class="btn btn-toggle active" data-i18n="rank_tab_world">ワールド</button>
                    <button id="btn-rank-local" class="btn btn-toggle" data-i18n="rank_tab_local">ローカル</button>
                </div>

                <div class="ranking-container">
                    <div class="ranking-box">
                        <div class="ranking-title" style="color: #4caf50;" data-i18n="rank_star_1">★ やさしい</div>
                        <ul id="rank-list-star1" class="ranking-list"></ul>
                    </div>
                    <div class="ranking-box">
                        <div class="ranking-title" style="color: #29b6f6;" data-i18n="rank_star_2">★★ ふつう</div>
                        <ul id="rank-list-star2" class="ranking-list"></ul>
                    </div>
                    <div class="ranking-box">
                        <div class="ranking-title" style="color: #ef5350;" data-i18n="rank_star_3">★★★ むずかしい</div>
                        <ul id="rank-list-star3" class="ranking-list"></ul>
                    </div>
                </div>
                <button id="btn-close-ranking" class="btn" data-i18n="btn_close">とじる</button>
            </div>
        </div>
    </div>

    <div id="player-manager-overlay" class="hidden">
        <div class="overlay-content" style="width: 400px;">
            <h2 style="color: #ff7043; margin-top: 0; border:none;" data-i18n="pm_title">プレーヤーをえらぶ</h2>
            <p style="font-size: 0.9rem; color: #888; line-height: 1.5;" data-i18n-html="pm_hint">
                <b>ひらがな</b>　でにゅうりょくしてね<br>
                みんなが見るなまえです<br>
                ていねいなことばをつかってね
            </p>

            <div class="add-player-form">
                <input type="text" id="input-new-player" class="input-name" placeholder="なまえ (ひらがな 12もじ)" maxlength="12" data-i18n-placeholder="pm_placeholder">
                <button id="btn-add-player" class="btn btn-success" style="border-radius:10px;" data-i18n="btn_add">ついか</button>
            </div>

            <ul id="player-list-ul" class="player-list">
                </ul>

            <button id="btn-close-player-manager" class="btn" data-i18n="btn_close">とじる</button>
        </div>
    </div>

    <!-- ブラウザ標準alert()の代替 -->
    <div id="custom-alert-overlay" class="simple-overlay hidden">
        <div class="overlay-content">
            <p id="custom-alert-msg" class="simple-overlay-msg"></p>
            <div class="simple-overlay-btns">
                <button id="custom-alert-ok-btn" class="btn btn-success" style="width:120px;">OK</button>
            </div>
        </div>
    </div>

    <!-- ブラウザ標準confirm()の代替 -->
    <div id="custom-confirm-overlay" class="simple-overlay hidden">
        <div class="overlay-content">
            <p id="custom-confirm-msg" class="simple-overlay-msg"></p>
            <div class="simple-overlay-btns">
                <button id="custom-confirm-yes-btn" class="btn btn-danger" style="width:110px;">はい</button>
                <button id="custom-confirm-no-btn" class="btn" style="width:110px;">いいえ</button>
            </div>
        </div>
    </div>
`;

(function(){
    const _b = 'https://rpxassndgiunoqkxqcco.supabase.co/rest/v1';
    const _k = 'sb_publishable_Wnge6OPvSf5l2YEgaPg4rw_nj4CyYAH';
    const _h = {'apikey':_k,'Authorization':'Bearer '+_k,'Content-Type':'application/json','Prefer':'return=minimal'};
    const _rh = {'apikey':_k,'Authorization':'Bearer '+_k};

    window.currentUser = {uid:'guest', displayName:''};

    window.saveOnlineScore = async (uid, name, difficulty, score, stage, tag) => {
        if ((score||0) <= 0) return;
        try {
            const res = await fetch(`${_b}/rankings`, {
                method:'POST', headers:_h, keepalive:true,
                body: JSON.stringify({
                    game: GAME.sbGame,
                    difficulty: difficulty||'normal',
                    player_name: name||'ゲスト',
                    point_score: Math.round(score)||0,
                    stage_score: stage||0,
                    turns: stage||0,
                    class_name: tag||''
                })
            });
            if (!res.ok) { const t=await res.text(); throw new Error(`HTTP ${res.status}: ${t}`); }
            console.log('Ranking: 登録成功', {name, score});
        } catch(e) { console.error('Ranking save error:', e); throw e; }
    };

    window.fetchOnlineRanking = async (difficulty) => {
        try {
            const q = new URLSearchParams({
                select: 'player_name,point_score,created_at,class_name,stage_score',
                game: `eq.${GAME.sbGame}`,
                difficulty: `eq.${difficulty||'normal'}`,
                point_score: 'gt.0',
                order: 'point_score.desc,created_at.asc',
                limit: '10'
            });
            const res = await fetch(`${_b}/rankings?${q}`, {headers:_rh});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.map(r=>({
                uid: '',
                name: r.player_name,
                score: r.point_score,
                stage: r.stage_score || 0,
                clear: r.class_name === 'クリア',
                date: r.created_at ? new Date(r.created_at).toLocaleDateString('ja-JP') : ''
            }));
        } catch(e) { console.error('Ranking load error:', e); return null; }
    };
})();

function bindBtn(btn, callback) {
    if (btn) {
        btn.addEventListener('click', (e) => { e.preventDefault(); callback(); });
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); callback(); }, {passive: false});
    }
}

// ブラウザ標準のalert()/confirm()の代わりに使うゲーム内ポップアップ
function showCustomAlert(msg, onClose){
    document.getElementById('custom-alert-msg').textContent = msg;
    document.getElementById('custom-alert-overlay').classList.remove('hidden');
    document.getElementById('custom-alert-ok-btn').onclick = () => {
        document.getElementById('custom-alert-overlay').classList.add('hidden');
        if (onClose) onClose();
    };
}
function showCustomConfirm(msg, onYes){
    document.getElementById('custom-confirm-msg').textContent = msg;
    document.getElementById('custom-confirm-overlay').classList.remove('hidden');
    document.getElementById('custom-confirm-yes-btn').onclick = () => {
        document.getElementById('custom-confirm-overlay').classList.add('hidden');
        if (onYes) onYes();
    };
    document.getElementById('custom-confirm-no-btn').onclick = () => {
        document.getElementById('custom-confirm-overlay').classList.add('hidden');
    };
}

// ============================================================
//  I18N（かんたんなにほんご／日本語／English）
// ============================================================
const STRINGS = {
    ja: {
        "panel_battle_info": "⚔️ バトル情報",
        "label_player": "👤 プレーヤー",
        "label_level": "🎯 レベル",
        "label_enemy_range": "🔢 まとの すうじ",
        "label_enemies_left": "👾 のこりの てき",
        "btn_howto": "📖 あそびかた",
        "btn_to_title": "タイトルへ もどる",
        "panel_score": "🏆 スコア",
        "label_max_score": "🥇 さいだい スコア",
        "label_total_score": "✨ ごうけい スコア",
        "calc_box_html": "★ダメージのけいさん<br><span style=\"font-size:1.1rem; display:block; margin-top:5px;\"><span class=\"emoji-red\">⚔️</span> × <span class=\"emoji-star\">⭐</span> × かず</span>",
        "panel_battle_log": "📋 バトルログ",
        "lh_title": "さいごの こうげき",
        "calc_t1": "カード",
        "calc_t2": "ほし",
        "lh_dmg": "ダメージ",
        "hint_hit": "⚔️ こうげき！ {n} ダメージ",
        "hint_bad": "すうじが ちがうよ",
        "hint_trash": "すてる（のこり −1）",
        "howto_title": "あそびかた",
        "howto_p1": "1. 手札カードを <strong>てきの まとカード</strong>に<br>ぶつけて たおそう！<br>まとカードと <strong>おなじかず</strong>を つくってね。",
        "howto_p4": "4. いらないカードは したの <strong>すてば</strong> へ。<br>すてても じかんが へるよ。",
        "howto_p5": "5. てきを たおすと <strong>のこり じかん</strong>が ふえるよ。",
        "btn_start": "はじめる",
        "btn_tutorial": "🔰 チュートリアル",
        "player_change_suffix": "(へんこう)",
        "player_change_title": "プレーヤーをへんこうする",
        "btn_ranking": "🏆 ランキング",
        "btn_settings": "⚙ 設定",
        "btn_index": "🏠 INDEXへ",
        "diff_easy": "やさしい",
        "diff_normal": "ふつう",
        "diff_hard": "むずかしい",
        "btn_back": "もどる",
        "clear_count": "{n}回クリア",
        "settings_title": "⚙ 設定",
        "settings_sub": "言語 / Language",
        "lang_simple": "かんたんなにほんご",
        "lang_ja": "日本語",
        "lang_en": "English",
        "btn_close": "とじる",
        "rank_tab_world": "ワールド",
        "rank_tab_local": "ローカル",
        "rank_header_world": "みんなのベストスコア (オンライン)",
        "rank_header_local": "{name} のベストスコア (ローカル)",
        "rank_loading": "読み込み中…",
        "rank_login_required": "ログインが必要です",
        "rank_empty": "記録なし",
        "pm_title": "プレーヤーをえらぶ",
        "pm_hint": "<b>ひらがな</b>　でにゅうりょくしてね<br>みんなが見るなまえです<br>ていねいなことばをつかってね",
        "pm_placeholder": "なまえ (ひらがな 12もじ)",
        "pm_empty_list": "プレーヤーがいません。<br>うえから ついか してね。",
        "pm_delete_title": "さくじょ",
        "btn_add": "ついか",
        "delete_confirm": "{name} をさくじょしますか？",
        "alert_hiragana_only": "ひらがな で にゅうりょく してね。（カタカナや かんじは つかえません）",
        "alert_ng_word": "そのなまえは つかえません。",
        "alert_max_players": "とうろくできるのは 5人 までです。",
        "alert_duplicate_name": "すでに そのなまえは あります。",
        "boss_appear": "👹 <b>ボスが あらわれた！</b>",
        "time_bonus_particle": "じかん +{amount}",
        "boss_attack_log": "💥 <b style=\"color:#ff8a80\">ボスのこうげき！</b> <span style=\"white-space:nowrap\">じかん <b style=\"color:#ff8a80\">-1</b></span>",
        "boss_attack_flash": "💥 ボスのこうげき！",
        "high_score_msg": "自己ベストこうしん！",
        "gameover_title": "ゲームオーバー",
        "gameclear_title": "ゲームクリア！",
        "result_total_score": "ごうけいスコア：",
        "result_time_bonus": "タイムボーナス：",
        "result_max_bonus": "MAXスコアボーナス：",
        "result_final_score": "最終スコア：",
        "unit_pts": "点",
        "canvas_time_left": "のこり",
        "canvas_discard_hint": "いらないカードは ここへ",
        "tm_tutorial": "チュートリアル",
        "tm_ranking": "ランキング",
        "tm_settings": "設定",
        "tm_index": "INDEXへ",
        "label_stage": "🗺️ ステージ",
        "btn_back_title": "◀ タイトルへ",
        "runselect_title": "RUNをえらぼう",
        "run_normal_name": "基本",
        "run_normal_short": "まずは ここから！",
        "run_locked_name": "じゅんびちゅう",
        "run_locked_short": "あたらしい しばりが くるよ！",
        "run_locked_desc": "あたらしいしばりは じゅんびちゅう。おたのしみに！",
        "btn_run_go": "はじめる ▶",
        "best_label": "ベスト {n}点",
        "stage_chip": "ステージ{n}",
        "stage_word": "STAGE",
        "rank_stage_prefix": "S",
        "final_title": "ファイナルステージ！",
        "stage_log": "🗺️ <b>ステージ{n}</b> {name}",
        "stage_clear_title": "ステージ{n} クリア！",
        "sc_stage_score": "このステージのスコア",
        "sc_time_bonus": "クリアボーナス（残り時間）",
        "sc_time_now": "いまの残り時間",
        "sc_next": "つぎは… {name}",
        "btn_next_stage": "ステージ{n}へ ▶",
        "end_clear_title": "RUNクリア！",
        "end_reached": "とうたつ ステージ",
        "btn_retry": "もういちど",
        "btn_back_runselect": "RUNをえらびなおす",
        "confirm_quit": "いまのRUNをやめて、タイトルにもどりますか？",
        "rank_star_1": "★ やさしい",
        "rank_star_2": "★★ ふつう",
        "rank_star_3": "★★★ むずかしい",
    },
    simple: {
        "panel_battle_info": "⚔️ バトルじょうほう",
        "label_player": "👤 プレーヤー",
        "label_level": "🎯 レベル",
        "label_enemy_range": "🔢 まとの すうじ",
        "label_enemies_left": "👾 のこりの てき",
        "btn_howto": "📖 あそびかた",
        "btn_to_title": "タイトルへ もどる",
        "panel_score": "🏆 スコア",
        "label_max_score": "🥇 さいだい スコア",
        "label_total_score": "✨ ごうけい スコア",
        "calc_box_html": "★ダメージの けいさん<br><span style=\"font-size:1.1rem; display:block; margin-top:5px;\"><span class=\"emoji-red\">⚔️</span> × <span class=\"emoji-star\">⭐</span> × かず</span>",
        "panel_battle_log": "📋 バトルの きろく",
        "lh_title": "さいごの こうげき",
        "calc_t1": "カード",
        "calc_t2": "ほし",
        "lh_dmg": "ダメージ",
        "hint_hit": "⚔️ こうげき！ {n} ダメージ",
        "hint_bad": "かずが ちがうよ",
        "hint_trash": "すてる（のこり −1）",
        "howto_title": "あそびかた",
        "howto_p1": "1. てふだカードを <strong>てきの まとカード</strong>に<br>ぶつけて たおそう！<br>まとカードと <strong>おなじかず</strong>を つくってね。",
        "howto_p4": "4. いらないカードは したの <strong>すてば</strong> へ。<br>すてても じかんが へるよ。",
        "howto_p5": "5. てきを たおすと <strong>のこり じかん</strong>が ふえるよ。",
        "btn_start": "はじめる",
        "btn_tutorial": "🔰 チュートリアル",
        "player_change_suffix": "(へんこう)",
        "player_change_title": "プレーヤーを へんこうする",
        "btn_ranking": "🏆 ランキング",
        "btn_settings": "⚙ せってい",
        "btn_index": "🏠 INDEXへ",
        "diff_easy": "やさしい",
        "diff_normal": "ふつう",
        "diff_hard": "むずかしい",
        "btn_back": "もどる",
        "clear_count": "{n}かい クリア",
        "settings_title": "⚙ せってい",
        "settings_sub": "言語 / Language",
        "lang_simple": "かんたんなにほんご",
        "lang_ja": "日本語",
        "lang_en": "English",
        "btn_close": "とじる",
        "rank_tab_world": "ワールド",
        "rank_tab_local": "ローカル",
        "rank_header_world": "みんなの ベストスコア (オンライン)",
        "rank_header_local": "{name} の ベストスコア (ローカル)",
        "rank_loading": "よみこみちゅう…",
        "rank_login_required": "ログインが ひつようです",
        "rank_empty": "きろくなし",
        "pm_title": "プレーヤーを えらぶ",
        "pm_hint": "<b>ひらがな</b>　で にゅうりょくしてね<br>みんなが みる なまえです<br>ていねいな ことばを つかってね",
        "pm_placeholder": "なまえ (ひらがな 12もじ)",
        "pm_empty_list": "プレーヤーが いません。<br>うえから ついか してね。",
        "pm_delete_title": "さくじょ",
        "btn_add": "ついか",
        "delete_confirm": "{name} を さくじょしますか？",
        "alert_hiragana_only": "ひらがな で にゅうりょく してね。（カタカナや かんじは つかえません）",
        "alert_ng_word": "そのなまえは つかえません。",
        "alert_max_players": "とうろくできるのは 5人 までです。",
        "alert_duplicate_name": "すでに そのなまえは あります。",
        "boss_appear": "👹 <b>ボスが あらわれた！</b>",
        "time_bonus_particle": "じかん +{amount}",
        "boss_attack_log": "💥 <b style=\"color:#ff8a80\">ボスの こうげき！</b> <span style=\"white-space:nowrap\">じかん <b style=\"color:#ff8a80\">-1</b></span>",
        "boss_attack_flash": "💥 ボスの こうげき！",
        "high_score_msg": "じこベスト こうしん！",
        "gameover_title": "ゲームオーバー",
        "gameclear_title": "ゲームクリア！",
        "result_total_score": "ごうけい スコア：",
        "result_time_bonus": "タイム ボーナス：",
        "result_max_bonus": "MAXスコア ボーナス：",
        "result_final_score": "さいしゅう スコア：",
        "unit_pts": "てん",
        "canvas_time_left": "のこり",
        "canvas_discard_hint": "いらない カードは ここへ",
        "tm_tutorial": "チュートリアル",
        "tm_ranking": "ランキング",
        "tm_settings": "せってい",
        "tm_index": "INDEXへ",
        "label_stage": "🗺️ ステージ",
        "btn_back_title": "◀ タイトルへ",
        "runselect_title": "RUNを えらぼう",
        "run_normal_name": "きほん",
        "run_normal_short": "まずは ここから！",
        "run_locked_name": "じゅんびちゅう",
        "run_locked_short": "あたらしい しばりが くるよ！",
        "run_locked_desc": "あたらしい しばりは じゅんびちゅう。おたのしみに！",
        "btn_run_go": "はじめる ▶",
        "best_label": "ベスト {n}てん",
        "stage_chip": "ステージ{n}",
        "stage_word": "STAGE",
        "rank_stage_prefix": "S",
        "final_title": "ファイナルステージ！",
        "stage_log": "🗺️ <b>ステージ{n}</b> {name}",
        "stage_clear_title": "ステージ{n} クリア！",
        "sc_stage_score": "この ステージの スコア",
        "sc_time_bonus": "クリアボーナス（のこりじかん）",
        "sc_time_now": "いまの のこりじかん",
        "sc_next": "つぎは… {name}",
        "btn_next_stage": "ステージ{n}へ ▶",
        "end_clear_title": "RUNクリア！",
        "end_reached": "とうたつ ステージ",
        "btn_retry": "もういちど",
        "btn_back_runselect": "RUNを えらびなおす",
        "confirm_quit": "いまの RUNを やめて、タイトルに もどりますか？",
        "rank_star_1": "★ やさしい",
        "rank_star_2": "★★ ふつう",
        "rank_star_3": "★★★ むずかしい",
    },
    en: {
        "panel_battle_info": "⚔️ Battle Info",
        "label_player": "👤 Player",
        "label_level": "🎯 Level",
        "label_enemy_range": "🔢 Target Numbers",
        "label_enemies_left": "👾 Enemies Left",
        "btn_howto": "📖 How to Play",
        "btn_to_title": "Back to Title",
        "panel_score": "🏆 Score",
        "label_max_score": "🥇 Max Score",
        "label_total_score": "✨ Total Score",
        "calc_box_html": "★ Damage Calculation<br><span style=\"font-size:1.1rem; display:block; margin-top:5px;\"><span class=\"emoji-red\">⚔️</span> × <span class=\"emoji-star\">⭐</span> × number</span>",
        "panel_battle_log": "📋 Battle Log",
        "lh_title": "Last Attack",
        "calc_t1": "Cards",
        "calc_t2": "Stars",
        "lh_dmg": "DMG",
        "hint_hit": "⚔️ Attack! {n} DMG",
        "hint_bad": "Numbers differ",
        "hint_trash": "Discard (Time −1)",
        "howto_title": "How to Play",
        "howto_p1": "1. Drag a hand card into an <strong>enemy's target card</strong> to defeat it!<br>Make the <strong>same number</strong> as the target card.",
        "howto_p4": "4. Send cards you don't need to the <strong>discard area</strong> below.<br>Discarding also uses up time.",
        "howto_p5": "5. Defeating an enemy <strong>restores time</strong>.",
        "btn_start": "Start",
        "btn_tutorial": "🔰 Tutorial",
        "player_change_suffix": "(change)",
        "player_change_title": "Change player",
        "btn_ranking": "🏆 Ranking",
        "btn_settings": "⚙ Settings",
        "btn_index": "🏠 To INDEX",
        "diff_easy": "Easy",
        "diff_normal": "Normal",
        "diff_hard": "Hard",
        "btn_back": "Back",
        "clear_count": "{n} clears",
        "settings_title": "⚙ Settings",
        "settings_sub": "言語 / Language",
        "lang_simple": "かんたんなにほんご",
        "lang_ja": "日本語",
        "lang_en": "English",
        "btn_close": "Close",
        "rank_tab_world": "World",
        "rank_tab_local": "Local",
        "rank_header_world": "Everyone's Best Scores (Online)",
        "rank_header_local": "{name}'s Best Scores (Local)",
        "rank_loading": "Loading…",
        "rank_login_required": "Login required",
        "rank_empty": "No records",
        "pm_title": "Choose Player",
        "pm_hint": "Use <b>Hiragana</b> only<br>This name is shown to everyone<br>Please use polite language",
        "pm_placeholder": "Name (Hiragana, up to 12)",
        "pm_empty_list": "No players yet.<br>Add one above.",
        "pm_delete_title": "Delete",
        "btn_add": "Add",
        "delete_confirm": "Delete {name}?",
        "alert_hiragana_only": "Please use Hiragana only (no Katakana or Kanji).",
        "alert_ng_word": "That name cannot be used.",
        "alert_max_players": "You can register up to 5 players.",
        "alert_duplicate_name": "That name is already registered.",
        "boss_appear": "👹 <b>A boss appeared!</b>",
        "time_bonus_particle": "Time +{amount}",
        "boss_attack_log": "💥 <b style=\"color:#ff8a80\">Boss attack!</b> <span style=\"white-space:nowrap\">Time <b style=\"color:#ff8a80\">-1</b></span>",
        "boss_attack_flash": "💥 Boss attack!",
        "high_score_msg": "New best score!",
        "gameover_title": "Game Over",
        "gameclear_title": "Game Clear!",
        "result_total_score": "Total Score:",
        "result_time_bonus": "Time Bonus:",
        "result_max_bonus": "Max Score Bonus:",
        "result_final_score": "Final Score:",
        "unit_pts": "pt",
        "canvas_time_left": "Time",
        "canvas_discard_hint": "Discard unwanted cards here",
        "tm_tutorial": "Tutorial",
        "tm_ranking": "Ranking",
        "tm_settings": "Settings",
        "tm_index": "To INDEX",
        "label_stage": "🗺️ Stage",
        "btn_back_title": "◀ Title",
        "runselect_title": "Choose a RUN",
        "run_normal_name": "Basic",
        "run_normal_short": "Start here!",
        "run_locked_name": "Coming Soon",
        "run_locked_short": "New twists on the way!",
        "run_locked_desc": "New twists are being prepared. Stay tuned!",
        "btn_run_go": "Start ▶",
        "best_label": "Best {n} pts",
        "stage_chip": "Stage {n}",
        "stage_word": "STAGE",
        "rank_stage_prefix": "S",
        "final_title": "FINAL STAGE!",
        "stage_log": "🗺️ <b>Stage {n}</b> {name}",
        "stage_clear_title": "Stage {n} Clear!",
        "sc_stage_score": "Stage score",
        "sc_time_bonus": "Clear bonus (time)",
        "sc_time_now": "Time left now",
        "sc_next": "Next: {name}",
        "btn_next_stage": "To Stage {n} ▶",
        "end_clear_title": "RUN Clear!",
        "end_reached": "Reached Stage",
        "btn_retry": "Try Again",
        "btn_back_runselect": "Choose Another RUN",
        "confirm_quit": "Quit this RUN and go back to the title?",
        "rank_star_1": "★ Easy",
        "rank_star_2": "★★ Normal",
        "rank_star_3": "★★★ Hard",
    },
};
// ゲームごとの文言を重ねる(GAME.strings は各ゲームのhtmlで定義)
['ja', 'simple', 'en'].forEach(l => Object.assign(STRINGS[l], (GAME.strings || {})[l] || {}));

let currentLang = localStorage.getItem(GAME.keys.lang) || 'ja';
function T(key, params) {
    const dict = STRINGS[currentLang] || STRINGS.ja;
    let str = dict[key] !== undefined ? dict[key] : (STRINGS.ja[key] || key);
    if (params) { Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); }); }
    return str;
}
// ---- アイコン(絵文字は使わずSVGで描く) ----
const _svg = (body, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${body}</svg>`;
const ICO = {
    sword: _svg('<path d="M4 4l11 11"/><path d="M20 4 9 15"/><path d="M13 17l4-4"/><path d="M11 17l-4-4"/><path d="M15 15l4 4"/><path d="M9 15l-4 4"/>'),
    star: _svg('<path fill="currentColor" stroke="none" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/>'),
    user: _svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
    flag: _svg('<path d="M5 21V4"/><path d="M5 4h13l-3 4.5L18 13H5"/>'),
    robot: _svg('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.6" r="1.4"/><circle cx="9" cy="13" r="1.3" fill="currentColor"/><circle cx="15" cy="13" r="1.3" fill="currentColor"/><path d="M9.5 17h5"/>'),
    trophy: _svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M12 14v4M8 21h8M9.5 18h5"/>'),
    medal: _svg('<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10 6 3h5l1 4M15.5 10 18 3h-5"/>'),
    list: _svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>'),
    hash: _svg('<path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"/>'),
    book: _svg('<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/>'),
    home: _svg('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    gear: _svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    help: _svg('<circle cx="12" cy="12" r="9"/><path d="M9.3 9.5a2.7 2.7 0 1 1 3.8 2.5c-.8.4-1.1 1-1.1 1.8"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>'),
    trash: _svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
    lock: _svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
};
function initIcons() { document.querySelectorAll('[data-ico]').forEach(el => { if (!el.innerHTML) el.innerHTML = ICO[el.dataset.ico] || ''; }); }
initIcons();
// 文字列の中の ⚔️ ⭐ は、絵文字ではなく描いた絵にする
function emo(h) { return String(h).replace(/\u2694\uFE0F?/g, ICO.sword).replace(/\u2B50\uFE0F?/g, '<i class="gs"></i>'); }

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        let t = T(el.getAttribute('data-i18n'));
        if (el.hasAttribute('data-noemo')) t = t.replace(/^[^\p{L}\p{N}]+/u, '');
        el.textContent = t;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T(el.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', T(el.getAttribute('data-i18n-placeholder'))); });
    ['simple', 'ja', 'en'].forEach(l => {
        const btn = document.getElementById('lang-btn-' + l);
        if (btn) btn.classList.toggle('active', l === currentLang);
    });
    const psb = document.getElementById('player-select-btn');
    if (psb) psb.title = T('player_change_title');
    if (typeof updateTitleScreenStats === 'function') updateTitleScreenStats();
}
function selectLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(GAME.keys.lang, lang);
    applyLanguage();
}
function openSettings() {
    document.getElementById('settings-screen').classList.remove('hidden');
}
function closeSettings() {
    document.getElementById('settings-screen').classList.add('hidden');
}
/**
 * Game Configuration & State
 */

// NGワードリスト（ひらがな）
const NG_WORDS_HIRAGANA = [
    'しね', 'しぬ', 'しに', 'ころす', 'ころせ', 'さつがい', 'くたばれ',
    'じさつ', 'ぎさつ', 'つるす', 'れんたん', 'しにたい',
    'てろ', 'てろりすと', 'ばくは', 'ばくだん', 'ほうか',
    'はんざい', 'ごうとう', 'ゆうかい', 'かんきん', 'おそう',
    'やくざ', 'ぼうりょく', 'はんぐれ', 'ちんぴら', 'まふぃあ',
    'たいま', 'まやく', 'かくせいざい', 'しゃぶ', 'どらっぐ', 'こかいん',
    'へろいん', 'えくすたしー', 'だっぽう', 'きめせく',
    'いじめ', 'ぎゃくたい',
    'ばか', 'あほ', 'まぬけ', 'きちがい', 'き違い',
    'うざい', 'うざ', 'きもい', 'きも', 'きしょい', 'きえろ',
    'くず', 'ごみ', 'ごみむし', 'かす', 'ざこ', 'ぜつ',
    'ぶす', 'でぶ', 'はげ', 'ちび', 'でっぱ', 'いなかもの',
    'うじ', 'はいぼく', 'まけいぬ', 'おつむ', 'のうたりん',
    'ていのう', 'ちしょう', 'しょうがい', 'がいじ', 'かたわ', 'びっこ',
    'めくら', 'つんぼ', 'おし', 'どじん', 'えた', 'ひにん',
    'たひ', 'たひね',
    'うせろ', 'だまれ',
    'ちんちん', 'ちんこ', 'ちんぽ', 'ちんか', 'まら', 'さお',
    'まんこ', 'まんしゅう', 'まんげ', 'われめ', 'おまた',
    'くり', 'くりとりす', 'いんしん', 'いんかく', 'びらびら',
    'こうがん', 'たまきん', 'きんたま', 'ふぐり',
    'おっぱい', 'ちち', 'にゅうりん', 'にゅうとう', 'きょにゅう', 'ひんにゅう',
    'けつ', 'あなる', 'こうもん', 'けつのあな',
    'えろ', 'えっち', 'すけべ', 'へんたい', 'むっつり', 'しこ',
    'せっくす', 'せいこう', 'まぐわい', 'そうにゅう', 'はめる',
    'おなにー', 'じい', 'しこしこ', 'ふぇら', 'ぱいずり', 'くんに',
    'いらま', 'しっしん', 'なかだし', 'ごっくん', 'ぶっかけ',
    'しおふき', 'ぜっちょう', 'いく', 'いかせろ', 'あえぎ',
    'どうてい', 'しょじょ', 'やりまん', 'やりちん', 'びっち',
    'せふれ', 'ぱこ', 'ぱこぱこ', 'わいせつ', 'ろり', 'しょた', 'ぺど',
    'きんしん', 'じゅうかん', 'りょうじょく', 'らんこう', 'すかんと',
    'のーぱん', 'ぱんちら',
    'れいぷ', 'ごうかん', 'ちかん', 'とうさつ', 'のぞき', 'ろしゅつ',
    'ふうぞく', 'そーぷ', 'へるす', 'でりへる', 'ぴんさろ', 'いめくら',
    'あだると', 'えーぶい', 'えぶい', 'ぽるの', 'うらびでお', 'むしゅうせい',
    'えんこう', 'えんじょ', 'うり', 'かいしゅん', 'ばいしゅん',
    'ぱぱかつ', 'ままかつ', 'うりせん',
    'うんこ', 'うんち', 'くそ', 'げり', 'べん', 'ふん',
    'しっこ', 'しょんべん', 'にょう', 'ほうにょう',
    'へ', 'おなら', 'げろ', 'たん',
    'うんえい', 'こうしき', 'すたっふ', 'かんり', 'ぱとろーる',
    'じえむ', 'げーむますたー', 'ますたー', 'あどみん', 'しすてむ',
    'さーばー', 'あかばん', 'ばん', 'ちーと', 'ちーたー', 'ばぐ',
    'らいん', 'かかお', 'すかいぷ', 'いんすた', 'ついったー', 'でぃすこ',
    'でんわ', 'ばんごう', 'けいたい', 'あどれす', 'めあど', 'じゅうしょ',
    'あお', 'あいたい', 'まちあわせ', 'ほてる', 'らぶほ', 'おふかい',
    'ぱすわーど', 'ぱす', 'あかうんと', 'こじんじょうほう'
];

let CONFIG = Object.assign({}, PRESET_NORMAL);

let state = {
    screen: 'TITLE', 
    difficulty: 'NORMAL', 
    time: 15,
    score: 0,
    lastScore: 0,
    maxScore: 0, 
    enemiesRemaining: 0, 
    cards: [null, null, null, null, null],
    enemies: [],
    particles: [],
    boss: null,          
    bossSpawned: false, 
    width: 0,
    height: 0,
    dragInfo: null,
    isGameOverProcessing: false,
    isGameClearProcessing: false, 
    inputLocked: false,
    defeatedCount: 0,
    totalConsumedTime: 0,
    forbiddenValue: null,
    shakeFrames: 0,
    flyingCards: [],
    rankingMode: 'LOCAL',
    playerName: "ななしさん",
    bossTurnCount: 0,
    bossAttackEffect: 0,
    battleLog: [],
    star: 1,
    stage: 1,
    runMode: false,
    normalKills: 0,
    stageStartScore: 0,
    stageScores: []
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = {
    rightPanelContent: document.getElementById('right-panel-content'),
    difficultyLabel: document.getElementById('disp-difficulty-label'),
    enemyRange: document.getElementById('disp-enemy-range'),
    enemies: document.getElementById('disp-enemies'),
    maxScore: document.getElementById('disp-max-score'),

    totalScore: document.getElementById('disp-total-score'),
    playerNameDisplay: document.getElementById('disp-player-name'), 
    
    title: document.getElementById('title-screen'),
    
    result: document.getElementById('game-result'),
    rankingScreen: document.getElementById('ranking-screen'),
    rankingHeaderTitle: document.getElementById('ranking-header-title'),
    
    // タイトルメニューボタン
    btnStartMenu: document.getElementById('btn-start-menu'),
    btnViewRanking: document.getElementById('btn-view-ranking'),
    btnIndex: document.getElementById('btn-index'),
    btnLogin: document.getElementById('btn-login'),
    btnLogout: document.getElementById('btn-logout'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    
    btnCloseRanking: document.getElementById('btn-close-ranking'),
    btnToTitle: document.getElementById('btn-to-title'),
    
    btnRankLocal: document.getElementById('btn-rank-local'),
    btnRankWorld: document.getElementById('btn-rank-world'),

    playerSelectBtn: document.getElementById('player-select-btn'),
    currentPlayerDisplay: document.getElementById('current-player-name-display'),
    playerManagerOverlay: document.getElementById('player-manager-overlay'),
    inputNewPlayer: document.getElementById('input-new-player'),
    btnAddPlayer: document.getElementById('btn-add-player'),
    playerListUl: document.getElementById('player-list-ul'),
    btnClosePlayerManager: document.getElementById('btn-close-player-manager')
};

// 縦持ちスマホでも横長ゲームを大きく表示するため、縦持ち×スマホ幅のときは
// CSSで90度回転させ、画面の縦幅を「横幅」として使うスケール計算に切り替える。
// （回転中はgetEventPos()でのタップ座標の変換も回転考慮の計算式に切り替わる）
let isMobileRotated = false;
let currentScale = 1;
function resize() {
    const container = document.getElementById('container');
    const BASE_WIDTH = 1280;
    const BASE_HEIGHT = 720;
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
    // Xアプリ内蔵ブラウザ等、bodyのflexセンタリングがcontainer(1280x720という
    // ビューポートよりずっと大きいtransform前サイズ)を正しく中央寄せできない環境が
    // あるため、flexに頼らずJSでleft/topを絶対座標指定する(scale/rotateに依存しない)
    // (白いふち分もふくめた実際の大きさ offsetWidth/Height で中央に置く。1280x720だけで計算すると、ふちの分だけ右下にずれて切れる)
    container.style.left = `${winW / 2 - container.offsetWidth / 2}px`;
    container.style.top = `${winH / 2 - container.offsetHeight / 2}px`;
    isMobileRotated = winW < winH && winW <= 900;
    if (isMobileRotated) {
        const scale = Math.min(winH / BASE_WIDTH, winW / BASE_HEIGHT);
        currentScale = scale;
        container.style.transform = `rotate(90deg) scale(${scale})`;
    } else {
        const scale = Math.min(winW / BASE_WIDTH, winH / BASE_HEIGHT);
        currentScale = scale;
        container.style.transform = `scale(${scale})`;
    }

    if (state.width === 0) {
        state.width = canvas.parentElement.clientWidth;
        state.height = canvas.parentElement.clientHeight;
        canvas.width = state.width;
        canvas.height = state.height;
    }
}
window.addEventListener('resize', resize);
resize();
// X(Twitter)等アプリ内ブラウザは起動直後にビューポート値が未確定のことがあり、
// その時点でscale計算をしてしまうと後からズレる。少し遅らせて再計算する。
setTimeout(resize, 300);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

// 縦持ちスマホでの回転表示(rotate(90deg))中は、ランキング等のCSS
// overflow-y:auto + touch-action:pan-yによるネイティブのタッチスクロールが
// 正しく効かないブラウザがあるため、回転中だけタッチ位置の差分から
// scrollTopを直接操作する簡易スクロールに切り替える
// （回転していない時はネイティブのタッチスクロールに任せる）
(function setupRotatedTouchScroll(){
    const root = document.getElementById('container');
    if(!root) return;
    function findScrollable(el){
        while(el && el!==root){
            const cs = getComputedStyle(el);
            if((cs.overflowY==='auto'||cs.overflowY==='scroll') && el.scrollHeight>el.clientHeight) return el;
            el = el.parentElement;
        }
        return null;
    }
    let box=null, dragging=false, startX=0, startScrollTop=0;
    root.addEventListener('touchstart', e=>{
        if(!isMobileRotated || e.touches.length!==1) return;
        box = findScrollable(e.target);
        if(!box) return;
        dragging=true; startX=e.touches[0].clientX; startScrollTop=box.scrollTop;
    }, {passive:true});
    root.addEventListener('touchmove', e=>{
        if(!dragging || !box || !isMobileRotated) return;
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        box.scrollTop = startScrollTop - dx / (currentScale || 1);
    }, {passive:false});
    root.addEventListener('touchend', ()=>{ dragging=false; box=null; });
})();

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeightedRandom(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
        if (r < weights[i]) return i + 1;
        r -= weights[i];
    }
    return weights.length;
}

const PLAYER_LIST_KEY = 'math_braves_player_list';
const SELECTED_PLAYER_KEY = 'math_braves_selected_player_index';

function loadPlayers() {
    const list = JSON.parse(localStorage.getItem(PLAYER_LIST_KEY));
    if (!Array.isArray(list)) {
        return [];
    }
    return list;
}

function savePlayers(list) {
    localStorage.setItem(PLAYER_LIST_KEY, JSON.stringify(list));
}

function getSelectedPlayerIndex() {
    const idx = parseInt(localStorage.getItem(SELECTED_PLAYER_KEY));
    return isNaN(idx) ? -1 : idx;
}

function setSelectedPlayerIndex(index) {
    localStorage.setItem(SELECTED_PLAYER_KEY, index);
    updateCurrentPlayerDisplay();
}

function updateCurrentPlayerDisplay() {
    const list = loadPlayers();
    const idx = getSelectedPlayerIndex();
    
    if (idx >= 0 && idx < list.length) {
        state.playerName = list[idx];
    } else {
        state.playerName = "ななしさん";
    }
    ui.currentPlayerDisplay.textContent = state.playerName;
    if (ui.playerNameDisplay) ui.playerNameDisplay.textContent = state.playerName;
}

function renderPlayerList() {
    const list = loadPlayers();
    const selectedIdx = getSelectedPlayerIndex();
    
    ui.playerListUl.innerHTML = '';
    
    if (list.length === 0) {
        ui.playerListUl.innerHTML = `<li style="color:#bdc3c7; text-align:center;">${T('pm_empty_list')}</li>`;
    }

    list.forEach((name, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        if (index === selectedIdx) li.classList.add('selected');
        
        li.addEventListener('click', () => {
            setSelectedPlayerIndex(index);
            renderPlayerList();
        });

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-item-name';
        nameSpan.textContent = name;
        li.appendChild(nameSpan);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.title = T('pm_delete_title');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCustomConfirm(T('delete_confirm', {name}), () => {
                deletePlayer(index);
            });
        });
        li.appendChild(delBtn);

        ui.playerListUl.appendChild(li);
    });
}

function checkNGWord(text) {
    for (const ng of NG_WORDS_HIRAGANA) {
        if (text.includes(ng)) {
            return true;
        }
    }
    return false;
}

function validateHiragana(text) {
    const regex = /^[ぁ-んー]+$/;
    return regex.test(text);
}

function addPlayer() {
    const name = ui.inputNewPlayer.value.trim();
    if (!name) return;

    if (!validateHiragana(name)) {
        showCustomAlert(T('alert_hiragana_only'));
        return;
    }

    if (checkNGWord(name)) {
        showCustomAlert(T('alert_ng_word'));
        return;
    }

    let list = loadPlayers();
    if (list.length >= 5) {
        showCustomAlert(T('alert_max_players'));
        return;
    }

    if (list.includes(name)) {
        showCustomAlert(T('alert_duplicate_name'));
        return;
    }

    list.push(name);
    savePlayers(list);
    
    setSelectedPlayerIndex(list.length - 1);
    
    ui.inputNewPlayer.value = '';
    renderPlayerList();
}

function deletePlayer(index) {
    let list = loadPlayers();
    list.splice(index, 1);
    savePlayers(list);
    
    let currentSel = getSelectedPlayerIndex();
    if (currentSel === index) {
        setSelectedPlayerIndex(-1);
    } else if (currentSel > index) {
        setSelectedPlayerIndex(currentSel - 1);
    } else {
        updateCurrentPlayerDisplay(); 
    }
    
    renderPlayerList();
}

function getRankingKey(diff) {
    return GAME.keys.ranking(diff);
}

function getClearCountKey(diff) {
    return GAME.keys.clearCount(diff);
}

function getLocalRanking(difficulty) {
    const key = getRankingKey(difficulty);
    const list = JSON.parse(localStorage.getItem(key)) || [];
    // 旧形式（数値のみの配列）との互換のため、数値ならオブジェクトに正規化する
    return list.map(item => typeof item === 'number' ? { score: item, name: state.playerName, date: '' } : item);
}

function getClearCount(difficulty) {
    const key = getClearCountKey(difficulty);
    return parseInt(localStorage.getItem(key)) || 0;
}

function incrementClearCount(difficulty) {
    const key = getClearCountKey(difficulty);
    let count = getClearCount(difficulty);
    count++;
    localStorage.setItem(key, count);
    return count;
}

function saveScore(difficulty, score, stage, cleared) {
    const key = getRankingKey(difficulty);
    let ranking = getLocalRanking(difficulty);
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

    const entry = { score, name: state.playerName, date: dateStr, stage: stage || 0, clear: !!cleared };
    ranking.push(entry);
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(ranking));

    const isNewRecord = (ranking.length > 0 && ranking[0] === entry) || (ranking.length > 0 && ranking[0].score === score && ranking[0].date === dateStr && ranking[0].name === entry.name);

    if (window.currentUser && window.saveOnlineScore) {
        window.saveOnlineScore(window.currentUser.uid, state.playerName, difficulty, score, stage, cleared ? 'クリア' : 'ステージ' + stage);
    }

    return isNewRecord;
}

function updateTitleScreenStats() {
    // 言語が変わった時などに、RUN選択を開いていれば描き直す
    if (typeof runSelectVisible === 'function' && runSelectVisible()) renderRunSelect();
}

async function showRankingScreen() {
    ui.rankingScreen.classList.remove('hidden');

    if (state.rankingMode === 'WORLD') {
        ui.btnRankWorld.classList.add('active');
        ui.btnRankLocal.classList.remove('active');
        ui.rankingHeaderTitle.textContent = T('rank_header_world');
    } else {
        ui.btnRankWorld.classList.remove('active');
        ui.btnRankLocal.classList.add('active');
        ui.rankingHeaderTitle.textContent = T('rank_header_local', {name: state.playerName});
    }

    const ids = [1, 2, 3].map(n => 'rank-list-star' + n);
    ids.forEach(id => {
        document.getElementById(id).innerHTML = `<li style="justify-content:center; color:#7f8c8d;">${T('rank_loading')}</li>`;
    });

    const render = (ul, list, isOnline) => {
        ul.innerHTML = '';
        if (!list || list.length === 0) {
            ul.innerHTML = `<li style="justify-content:center; color:#7f8c8d;">${T('rank_empty')}</li>`;
            return;
        }
        list.forEach((data, index) => {
            const li = document.createElement('li');
            const rankSpan = document.createElement('span'); rankSpan.className = 'ranking-rank'; rankSpan.textContent = `${index + 1}.`;
            const nameSpan = document.createElement('span'); nameSpan.className = 'ranking-name'; nameSpan.textContent = data.name || state.playerName;
            if (isOnline) nameSpan.style.cssText = 'color:#888;';
            const scoreSpan = document.createElement('span'); scoreSpan.className = 'ranking-score'; scoreSpan.textContent = data.score;
            li.appendChild(rankSpan); li.appendChild(nameSpan);
            if (data.stage) {
                const tag = document.createElement('span');
                tag.className = 'ranking-tag' + (data.clear ? ' clear' : '');
                tag.textContent = data.clear ? '👑' : T('rank_stage_prefix') + data.stage;
                li.appendChild(tag);
            }
            li.appendChild(scoreSpan);
            if (data.date) { const dateSpan = document.createElement('span'); dateSpan.className = 'ranking-date'; dateSpan.textContent = data.date; li.appendChild(dateSpan); }
            ul.appendChild(li);
        });
    };

    if (state.rankingMode === 'WORLD') {
        if (!window.fetchOnlineRanking) return;
        await Promise.all([1, 2, 3].map(async n => {
            const list = await window.fetchOnlineRanking(starKey(n));
            render(document.getElementById('rank-list-star' + n), list, true);
        }));
    } else {
        [1, 2, 3].forEach(n => render(document.getElementById('rank-list-star' + n), getLocalRanking(starKey(n)), false));
    }
}
