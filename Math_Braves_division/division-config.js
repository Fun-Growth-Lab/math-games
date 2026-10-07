// わりざんの設定(★ごとのノルマ・AP・ラウンド数)。braves-common.js より先に読み込む。
// ノルマ(HITさせるパネルの数) = baseQuota + (ラウンド-1)。APはラウンドごとに ap に戻る(元のわりざんと同じ)
const PRESET_EASY = { label: "やさしい", baseQuota: 10, ap: 10, maxRound: 3 };
const PRESET_NORMAL = { label: "ふつう", baseQuota: 11, ap: 11, maxRound: 5 };
const PRESET_HARD = { label: "むずかしい", baseQuota: 12, ap: 12, maxRound: 7 };
