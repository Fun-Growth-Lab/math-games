// ぶんすうスロットの設定。braves-common.js より先に読み込む。
// ケーキは「n分割」(RUNで決まる: 3〜10)。大きさは「nぶんのいくつ」の整数で持つ(UNIT_MAX = n = ちょうど1)。
//   RUN(分割数)は 3,4,5,6,7,8,9,10 の8つ。難易度は ★1〜★3 と、シークレットの ★4・★5。
//   全7ステージ。ステージをクリアするとAP回復。ホール(ちょうど1)を作るたびにターゲットが1まい増える。
let UNIT_MAX = 4;                      // いま遊んでいるRUNの分割数(RUNをはじめるときに入れかわる)
const DIVISIONS = [3, 4, 5, 6, 7, 8, 9, 10];
// 点数 = 基本点 × ホールボーナス × ターゲットボーナス
//   基本点: 3つそろえて 100点
//   ホールボーナス: ホール(ちょうど1)を作るたびに +10%(3こで ×1.3)
//   ターゲットボーナス: ターゲットの大きさでそろえたら ×2 / ×3 / ×4 (3だんかい)。はずれは ×1
const BASE_PTS = 100;
const WHOLE_RATE = 0.1;
const TARGET_TIERS = [                 // [ばいりつ, 出る確率(%)] 1ステージ目は かならず ×2
    { mul: 2, w: 70 }, { mul: 3, w: 20 }, { mul: 4, w: 10 },
];
const AP_BONUS_PTS = 5;                // クリア・ゲームオーバー時の のこりAP 1つにつき
// ステージクリアのAP回復(RUN=分割数ごと)。ボットで「ふつう(手札4枚)で ほぼ全員クリアできる」手数を測って決めた
//   (1ステージの平均手数: 3分割1.1 / 4分割1.4 / 5分割1.7 / 6分割1.9 / 7分割2.1 / 8分割2.3 / 9分割2.4 / 10分割2.6)
const AP_HEAL_BY_DIV = { 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3 };
const STAGE_TOTAL = 7;

// 難易度ごとのちがい。のこりAPはすべて同じ(10)で、手札のまい数をかえる(やさしい5・ふつう4・むずかしい3)。
//   ★4・★5(シークレット)は いまは出さない(GAME.starMax=3)。あとで決める
const STAR_TUNING = {
    1: { handSize: 5, startAp: 10 },
    2: { handSize: 4, startAp: 10 },
    3: { handSize: 3, startAp: 10 },
    4: { handSize: 3, startAp: 10 },
    5: { handSize: 3, startAp: 10 },
};
// star(1〜5)と分割数 div から ゲームの設定をつくる。cardTypes は「1/n 〜 n/n」(n/n=ちょうど1 は手札には出ない)
function fracPreset(star, div) {
    const t = STAR_TUNING[star] || STAR_TUNING[1];
    const types = []; for (let v = 1; v <= div; v++) types.push(v);
    return Object.assign({ label: '', cardTypes: types, gridDiv: div, maxRound: STAGE_TOTAL, apHeal: AP_HEAL_BY_DIV[div] || 2 }, t);
}
// 共通部品(braves-common.js)が最初に参照する設定。RUNをはじめるときに fracPreset で上書きされる
const PRESET_EASY = fracPreset(1, 4), PRESET_NORMAL = fracPreset(2, 4), PRESET_HARD = fracPreset(3, 4);
