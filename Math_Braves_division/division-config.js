// わりざんの設定(★ごとのノルマ・AP。ラウンド数は RUN_LIST で決まる)。braves-common.js より先に読み込む。
// ノルマ(HITさせるパネルの数) = baseQuota + (ラウンド-1)。APはラウンドごとに ap に戻る(元のわりざんと同じ)
const PRESET_EASY = { label: "やさしい", baseQuota: 10, ap: 10 };
const PRESET_NORMAL = { label: "ふつう", baseQuota: 11, ap: 11 };
const PRESET_HARD = { label: "むずかしい", baseQuota: 12, ap: 12 };
// シークレット★4(名人)・★5(伝説): AP11のまま、ノルマがふえる(名人13・伝説14)
const PRESET_MASTER = { label: "名人", baseQuota: 13, ap: 11 };
const PRESET_LEGEND = { label: "伝説", baseQuota: 14, ap: 11 };
