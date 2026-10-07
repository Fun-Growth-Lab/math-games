// かけざん2の設定(★ごとのHP・ラウンド数・手札の数・アイテム)。braves-common.js より先に読み込む。
// 敵のHP = (ラウンド+4) × (50×ラウンド + hpBase)、のこりアクション = ラウンド+4(元のかけざん2と同じ)
const PRESET_EASY = { label: "やさしい", hpBase: 300 };
const PRESET_NORMAL = { label: "ふつう", hpBase: 350 };
const PRESET_HARD = { label: "むずかしい", hpBase: 400 };
const MAX_ROUND = 6;
const ATTACK_LINE = 100;                 // ばのカードがこの数を こえると こうげき(101いじょう)
const HAND_VALUES = [2, 2, 3, 3, 4, 5, 6, 7, 8, 9];   // 手札に出る数(2と3が出やすい)
const ITEM_KEYS = ['change', 'action_plus', 'x20', 'damage_500', 'all_plus_5'];
