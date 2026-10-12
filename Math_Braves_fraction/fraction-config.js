// ぶんすうスロットの設定。braves-common.js より先に読み込む。
// ケーキは「n分割」(RUNで決まる: 3〜10)。大きさは「nぶんのいくつ」の整数で持つ(UNIT_MAX = n = ちょうど1)。
//   RUN(分割数)は 3,4,5,6,7,8,9,10 の8つ。難易度は ★1〜★3 と、シークレットの ★4・★5。
//   全7ステージ。ステージをクリアするとAP回復。ホール(ちょうど1)を作るたびにターゲットが1まい増える。
let UNIT_MAX = 4;                      // いま遊んでいるRUNの分割数(RUNをはじめるときに入れかわる)
const DIVISIONS = [3, 4, 5, 6, 7, 8, 9, 10];
// 点数: ケーキ1つ100点。トッピングが「ケーキの大きさ(○こ分)」の倍数ぴったりなら そのケーキは300点。
//   3つともぴったりなら パーフェクトボーナス +100(=1000点)。ターゲットに当たったら、そのステージの点をもう1回ずつ加える。
const CAKE_PTS = 100;
const CAKE_PERFECT_PTS = 300;
const PERFECT_BONUS = 100;
const TOP_INIT_MAX = 2;                // はじめのケーキにのっているトッピング(1〜この数)
const STAGE_TOTAL = 7;

// 難易度ごとのちがい。のこりAPはすべて同じ(10)で、手札のまい数をかえる(やさしい5・ふつう4・むずかしい3)。
//   ★4・★5(シークレット)は いまは出さない(GAME.starMax=3)。あとで決める
const STAR_TUNING = {
    1: { handSize: 5, startAp: 10, apHeal: 3 },
    2: { handSize: 4, startAp: 10, apHeal: 3 },
    3: { handSize: 3, startAp: 10, apHeal: 3 },
    4: { handSize: 3, startAp: 10, apHeal: 3 },
    5: { handSize: 3, startAp: 10, apHeal: 3 },
};
// star(1〜5)と分割数 div から ゲームの設定をつくる。cardTypes は「1/n 〜 n/n」(n/n=ちょうど1 は手札には出ない)
function fracPreset(star, div) {
    const t = STAR_TUNING[star] || STAR_TUNING[1];
    const types = []; for (let v = 1; v <= div; v++) types.push(v);
    return Object.assign({ label: '', cardTypes: types, gridDiv: div, maxRound: STAGE_TOTAL }, t);
}
// 共通部品(braves-common.js)が最初に参照する設定。RUNをはじめるときに fracPreset で上書きされる
const PRESET_EASY = fracPreset(1, 4), PRESET_NORMAL = fracPreset(2, 4), PRESET_HARD = fracPreset(3, 4);
