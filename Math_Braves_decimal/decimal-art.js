// しょうすうの絵。てき・たから・おかしは元のゲームと同じ絵文字(インベーダーのような👾がこのゲームの味)をそのまま使う。
// パネルの小さな絵(ハート・ダイヤ)は他のゲームと同じ線画で足す
ICO.heart = _svg('<path d="M12 20.5s-8-4.9-8-11.2C4 6.2 6.1 4.5 8.3 4.5c1.5 0 2.8.8 3.7 2.3.9-1.5 2.2-2.3 3.7-2.3 2.2 0 4.3 1.7 4.3 4.8 0 6.3-8 11.2-8 11.2z"/>');
ICO.gem = _svg('<path d="M6.5 3.5h11l4 5.5L12 21 2.5 9z"/><path d="M2.5 9h19M9.5 3.5 7.5 9 12 21l4.5-12-2-5.5"/>');
initIcons();

// おかし12種(ぜんぶ あつめると さいごの ボーナスが大きい)
const ALL_SNACKS = ['🍩', '🎂', '🍫', '🍭', '🍹', '🍸', '🍪', '🍨', '🍧', '🍦', '🥐', '🥞'];
// イベントの絵文字。てき(👾・ドラゴン🐲)・たから(🪙・💰)・ダイヤ💎・おかし
const EMOJI_FONT = `'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`;
const ART_EMOJI = ['👾', '🐲', '🪙', '💰', '💎'].concat(ALL_SNACKS);

// タイトル・RUNカードの飾り(150x150の箱に絵文字をひとつ)。👾はインベーダーのようにカクカク動く
function monHTML(shape) {
    const em = ART_EMOJI[shape % ART_EMOJI.length];
    return `<div class="dc-em${shape === 0 ? ' inv' : ''}">${em}</div>`;
}

// すごろくの こま(ポーン)。リボンの先頭に立って、すすむ
function pawnHTML() {
    return `<div class="pw-sh"></div><div class="pw-bs"></div><div class="pw-bd"></div><div class="pw-cl"></div><div class="pw-hd"><i></i></div>`;
}
