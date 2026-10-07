// かけざん2のアイテムの絵(SVG)。ITEM_IMAGES[キー] は <img> 用の Image(src=data URI)
const _SVG_DEFS = '<defs>'
    + '<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".55" stop-color="#ffc93d"/><stop offset="1" stop-color="#d9931a"/></linearGradient>'
    + '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9ff"/><stop offset=".55" stop-color="#b2bcdc"/><stop offset="1" stop-color="#7787b0"/></linearGradient>'
    + '<linearGradient id="em" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8af0b6"/><stop offset=".55" stop-color="#2fbf71"/><stop offset="1" stop-color="#14804a"/></linearGradient>'
    + '<linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb8a8"/><stop offset=".55" stop-color="#ef5a45"/><stop offset="1" stop-color="#b02a1a"/></linearGradient>'
    + '<linearGradient id="vio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c8ff"/><stop offset=".55" stop-color="#a064ea"/><stop offset="1" stop-color="#5a2a9a"/></linearGradient>'
    + '<linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eee6d0"/></linearGradient>'
    + '<linearGradient id="fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a12"/><stop offset=".55" stop-color="#ffa72a"/><stop offset="1" stop-color="#fff3a8"/></linearGradient>'
    + '</defs>';
const _SK = 'stroke="#24352d" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"';
function _svgURI(body) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${_SVG_DEFS}<g ${_SK}>${body}</g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
const _CARD = (x, y, r, w, h, fill) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="7" fill="${fill}"/></g>`;
// ぐるっと回る2本の矢印(中心cx,cy・半径r)
const _ARROWS = (cx, cy, r, col) => `<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r * 0.75} ${cy - r * 0.66}" fill="none" stroke="${col}" stroke-width="7"/><path d="M${cx + r * 1.15} ${cy - r * 1.0}L${cx + r * 1.0} ${cy - r * 0.15}L${cx + r * 0.2} ${cy - r * 0.85}Z" fill="${col}" stroke-width="2.4"/><path d="M${cx + r} ${cy}A${r} ${r} 0 0 1 ${cx - r * 0.75} ${cy + r * 0.66}" fill="none" stroke="${col}" stroke-width="7"/><path d="M${cx - r * 1.15} ${cy + r * 1.0}L${cx - r * 1.0} ${cy + r * 0.15}L${cx - r * 0.2} ${cy + r * 0.85}Z" fill="${col}" stroke-width="2.4"/>`;
const _TXT = (x, y, size, fill, str, outline) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="900" fill="${fill}" ${outline ? `stroke="${outline[0]}" stroke-width="${outline[1]}" paint-order="stroke"` : 'stroke="none"'} font-family="sans-serif">${str}</text>`;
const ITEM_SVG = {
    // チェンジ: カードを引きなおす
    change: _CARD(36, 52, -14, 40, 56, 'url(#cream)') + _CARD(60, 48, 12, 40, 56, 'url(#cream)') + '<circle cx="66" cy="68" r="22" fill="url(#em)"/>' + _ARROWS(66, 68, 9, '#fff'),
    // アクション+1: いなずまに +1
    action_plus: '<path d="M58 4L22 54h22l-8 42L78 40H55z" fill="url(#gold)"/><circle cx="74" cy="72" r="22" fill="url(#em)"/>' + _TXT(74, 82, 28, '#fff', '+1'),
    // ×20: 金のバッジ
    x20: '<path d="M50 4l10 14 17-5 2 17 16 6-10 14 8 15-17 3-3 17-15-8-15 8-3-17-17-3 8-15L5 36l16-6 2-17 17 5z" fill="url(#gold)"/>' + _TXT(50, 62, 32, '#14804a', '×20', ['#fff', 3]),
    // ダメージ500: 爆発
    damage_500: '<path d="M50 2l9 22 22-12-8 24 24 4-20 14 16 18-24-2 2 24-19-16-19 16 2-24-24 2 16-18L2 40l24-4-8-24 22 12z" fill="url(#fire)"/>' + _TXT(50, 62, 30, '#fff', '500', ['#b02a1a', 5]),
    // ぜんぶ+5: 3まいのカードに +5
    all_plus_5: _CARD(26, 56, -18, 34, 48, 'url(#cream)') + _CARD(50, 50, 0, 34, 48, 'url(#cream)') + _CARD(74, 56, 18, 34, 48, 'url(#cream)') + '<circle cx="50" cy="70" r="24" fill="url(#em)"/>' + _TXT(50, 80, 28, '#fff', '+5'),
};
const ITEM_IMAGES = {};
Object.keys(ITEM_SVG).forEach(k => {
    const im = new Image();
    im.src = _svgURI(ITEM_SVG[k]);
    ITEM_IMAGES[k] = im;
});
// <img>タグの文字列(一覧・ログ・ポップアップで使う)
function itemImgTag(key, px) {
    const im = ITEM_IMAGES[key];
    return im ? `<img class="ii" src="${im.src}" style="width:${px || 18}px;height:${px || 18}px" alt="">` : '';
}
