// ぶんすうの設定(★ごとの手札・カード・ケーキの切り目・AP回復)。braves-common.js より先に読み込む。
// ルールは元のぶんすうと同じ: 大きさは「24分の○」で持つ(24=ちょうど1)。10ラウンド、APは10からスタート。
//   しょきゅう(★1)=4等分(1/4きざみ)、ちゅうきゅう(★2)=8等分(1/8きざみ)、じょうきゅう(★3)=12等分(1/12きざみ)
const UNIT_MAX = 24;
const PRESET_EASY = { label: "しょきゅう", handSize: 3, cardTypes: [6, 12, 18, 24], gridDiv: 4, apHeal: 2, maxRound: 10 };
const PRESET_NORMAL = { label: "ちゅうきゅう", handSize: 4, cardTypes: [3, 6, 9, 12, 15, 18, 21, 24], gridDiv: 8, apHeal: 3, maxRound: 10 };
const PRESET_HARD = { label: "じょうきゅう", handSize: 5, cardTypes: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], gridDiv: 12, apHeal: 4, maxRound: 10 };
