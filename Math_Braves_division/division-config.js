// わりざんの設定(★ごとのノルマ・AP・ラウンド数)。braves-common.js より先に読み込む。
// ノルマ(HITさせるパネルの数) = baseQuota + (ラウンド-1)。APはラウンドごとに ap に戻る(元のわりざんと同じ)
const PRESET_EASY = { label: "やさしい", baseQuota: 10, ap: 10, maxRound: 3 };
const PRESET_NORMAL = { label: "ふつう", baseQuota: 11, ap: 11, maxRound: 5 };
const PRESET_HARD = { label: "むずかしい", baseQuota: 12, ap: 12, maxRound: 7 };
// シークレット★4(名人)・★5(伝説): APがへる(名人11)/ノルマもふえる(伝説は13でAP11)。ボットでの めやす: ★3 9% → 名人 3.6% → 伝説 0.4%
const PRESET_MASTER = { label: "名人", baseQuota: 12, ap: 11, maxRound: 7 };
const PRESET_LEGEND = { label: "伝説", baseQuota: 13, ap: 11, maxRound: 7 };
