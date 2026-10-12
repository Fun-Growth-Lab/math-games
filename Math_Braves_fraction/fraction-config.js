// ぶんすうスロットの設定。braves-common.js より先に読み込む。
// ケーキは「n分割」(RUNで決まる: 3〜10)。大きさは「nぶんのいくつ」の整数で持つ(UNIT_MAX = n = ちょうど1)。
//   RUN(分割数)は 3,4,5,6,7,8,9,10 の8つ。10をこえる分割は 計算がたいへんなので つくらない。
//   ケーキは 3つ。難易度は いまは なし(★は1つだけ)。
//   全7ステージ。ケーキの大きさをそろえて「できあがり」ボタンを押すとステージクリア。
let UNIT_MAX = 4;                      // いま遊んでいるRUNの分割数(RUNをはじめるときに入れかわる)
const DIVISIONS = [3, 4, 5, 6, 7, 8, 9, 10];
// 点数 = 基本点 × ホールボーナス × ターゲットボーナス
//   基本点: そろえて 100点
//   ホールボーナス: ホール(ちょうど1)を作るたびに +20%(3こで ×1.6)
//   ターゲットボーナス: ターゲットの大きさでそろえたら ×2 / ×3 / ×4 / ×5 (4だんかい)。はずれは ×1
const BASE_PTS = 100;
const WHOLE_RATE = 0.2;
const TARGET_TIERS = [                 // 出る確率(%)は 昔の 70/15/10/5。1ステージ目は かならず いちばん下
    { mul: 2, w: 70, key: 'target_chance', color: '#ffe27a' },        // チャンス
    { mul: 3, w: 15, key: 'target_good', color: '#ffb35a' },          // グッドチャンス
    { mul: 4, w: 10, key: 'target_big', color: '#ff9a7a' },           // ビッグチャンス
    { mul: 5, w: 5, key: 'target_supergood', color: '#e8a0ff' },      // スーパービッグチャンス
];
const AP_BONUS_PTS = 5;                // クリア・ゲームオーバー時の のこりAP 1つにつき
const AP_WHOLE_HEAL = 1;               // ケーキ1つにつき、ステージで1回だけ ホールを作ると AP +1

// ステージクリアのAP回復(ケーキの数 → RUN=分割数ごと)。ボットで「手札3まいで ほぼ全員クリアできる」手数を測って決めた
//   (1ステージの平均手数: ケーキ3つ=1.1〜3.2手 / 4つ=1.5〜5.0手 / 5つ=2.0〜7.1手。分割が多いほど多い)
const AP_HEAL = {
    3: { 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3 },
    4: { 3: 1, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 6, 10: 6 },
    5: { 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 8 },
};
const STAGE_TOTAL = 7;

// 難易度なし: ケーキ3つ・手札3まい・APは10スタート(★2〜5は ひとまず ★1と同じ)
const STAR_TUNING = {
    1: { cakes: 3, handSize: 3, startAp: 10 },
    2: { cakes: 3, handSize: 3, startAp: 10 },
    3: { cakes: 3, handSize: 3, startAp: 10 },
    4: { cakes: 3, handSize: 3, startAp: 10 },
    5: { cakes: 3, handSize: 3, startAp: 10 },
};
// star(1〜5)と分割数 div から ゲームの設定をつくる。cardTypes は「1/n 〜 n/n」(n/n=ちょうど1 は手札には出ない)
function fracPreset(star, div) {
    const t = STAR_TUNING[star] || STAR_TUNING[1];
    const types = []; for (let v = 1; v <= div; v++) types.push(v);
    const heal = (AP_HEAL[t.cakes] && AP_HEAL[t.cakes][div]) || 2;
    return Object.assign({ label: '', cardTypes: types, gridDiv: div, maxRound: STAGE_TOTAL, apHeal: heal }, t);
}
// 共通部品(braves-common.js)が最初に参照する設定。RUNをはじめるときに fracPreset で上書きされる
const PRESET_EASY = fracPreset(1, 4), PRESET_NORMAL = fracPreset(2, 4), PRESET_HARD = fracPreset(3, 4);
