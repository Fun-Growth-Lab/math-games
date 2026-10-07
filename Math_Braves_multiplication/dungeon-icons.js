// かけざんダンジョンのアイテムの絵(SVG)。
// 1〜10=アイテム, 11=カギ, 12=ドア, 13=スコアボーナス, 14=時計(AP回復)。ITEM_IMAGES[id] は <img> 用の Image(src=data URI)
const _SVG_DEFS = '<defs>'
    + '<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".55" stop-color="#ffc93d"/><stop offset="1" stop-color="#d9931a"/></linearGradient>'
    + '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9ff"/><stop offset=".55" stop-color="#b2bcdc"/><stop offset="1" stop-color="#7787b0"/></linearGradient>'
    + '<linearGradient id="em" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8af0b6"/><stop offset=".55" stop-color="#2fbf71"/><stop offset="1" stop-color="#14804a"/></linearGradient>'
    + '<linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb8a8"/><stop offset=".55" stop-color="#ef5a45"/><stop offset="1" stop-color="#b02a1a"/></linearGradient>'
    + '<linearGradient id="vio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c8ff"/><stop offset=".55" stop-color="#a064ea"/><stop offset="1" stop-color="#5a2a9a"/></linearGradient>'
    + '<linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eee6d0"/></linearGradient>'
    + '<linearGradient id="fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a12"/><stop offset=".55" stop-color="#ffa72a"/><stop offset="1" stop-color="#fff3a8"/></linearGradient>'
    + '<radialGradient id="bomb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9aabc8"/><stop offset=".5" stop-color="#3a465c"/><stop offset="1" stop-color="#161e2c"/></radialGradient>'
    + '</defs>';
const _SK = 'stroke="#24352d" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"';
function _svgURI(body) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${_SVG_DEFS}<g ${_SK}>${body}</g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
const _KEY = (t) => `<g transform="${t}"><g transform="rotate(45 50 50)"><circle cx="27" cy="50" r="17" fill="url(#gold)"/><circle cx="27" cy="50" r="6.5" fill="#24352d" stroke="none"/><rect x="41" y="44.5" width="46" height="11" rx="4" fill="url(#gold)"/><rect x="65" y="55" width="8" height="15" rx="2" fill="url(#gold)"/><rect x="77" y="55" width="8" height="10" rx="2" fill="url(#gold)"/></g></g>`;
const _DOOR = (t) => `<g transform="${t}"><path d="M16 94V44a34 34 0 0 1 68 0v50z" fill="url(#steel)"/><path d="M26 94V45a24 24 0 0 1 48 0v49z" fill="url(#em)"/><path d="M50 21v73" fill="none" stroke-width="2.6"/><circle cx="43" cy="68" r="3.6" fill="url(#gold)" stroke-width="2.4"/><circle cx="57" cy="68" r="3.6" fill="url(#gold)" stroke-width="2.4"/></g>`;
const _RADAR = '<path d="M60 38a14 14 0 0 1 14 14M60 24a28 28 0 0 1 28 28" fill="none" stroke="#2fbf71" stroke-width="6"/>';
const _CARD = (x, y, r, w, h, fill) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="7" fill="${fill}"/></g>`;
// ぐるっと回る2本の矢印(中心cx,cy・半径r)
const _ARROWS = (cx, cy, r, col) => `<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r * 0.75} ${cy - r * 0.66}" fill="none" stroke="${col}" stroke-width="7"/><path d="M${cx + r * 1.15} ${cy - r * 1.0}L${cx + r * 1.0} ${cy - r * 0.15}L${cx + r * 0.2} ${cy - r * 0.85}Z" fill="${col}" stroke-width="2.4"/><path d="M${cx + r} ${cy}A${r} ${r} 0 0 1 ${cx - r * 0.75} ${cy + r * 0.66}" fill="none" stroke="${col}" stroke-width="7"/><path d="M${cx - r * 1.15} ${cy + r * 1.0}L${cx - r * 1.0} ${cy + r * 0.15}L${cx - r * 0.2} ${cy + r * 0.85}Z" fill="${col}" stroke-width="2.4"/>`;
const ITEM_SVG = {
    1: _KEY('translate(2 22) scale(.7)') + _RADAR,
    2: _DOOR('translate(-10 14) scale(.72)') + '<path d="M66 30a12 12 0 0 1 12 12M66 17a25 25 0 0 1 25 25" fill="none" stroke="#2fbf71" stroke-width="6"/>',
    3: '<path d="M6 54Q50 16 94 54Q50 92 6 54Z" fill="url(#cream)"/><circle cx="50" cy="54" r="19" fill="url(#em)"/><circle cx="50" cy="54" r="8" fill="#24352d" stroke="none"/><circle cx="56" cy="48" r="3.4" fill="#fff" stroke="none"/><path d="M50 8v10M20 20l6 8M80 20l-6 8" fill="none" stroke-width="5"/>',
    4: '<rect x="10" y="10" width="80" height="80" rx="14" fill="url(#steel)"/>' + _ARROWS(50, 50, 20, '#14a35a'),
    5: '<rect x="8" y="8" width="84" height="84" rx="14" fill="url(#vio)"/><path d="M8 36h84M8 64h84M36 8v84M64 8v84" fill="none" stroke-width="2.6" opacity=".5"/>' + _ARROWS(50, 50, 22, '#ffd24a'),
    6: _CARD(36, 52, -14, 40, 56, 'url(#cream)') + _CARD(60, 48, 12, 40, 56, 'url(#cream)') + '<circle cx="66" cy="68" r="22" fill="url(#em)"/>' + _ARROWS(66, 68, 9, '#fff'),
    7: '<circle cx="46" cy="60" r="30" fill="url(#bomb)"/><rect x="36" y="22" width="20" height="12" rx="3" fill="url(#steel)"/><path d="M56 26c10-2 14-10 18-14" fill="none" stroke="#d9931a" stroke-width="5"/><path d="M80 2l3.5 8 8 1.4-6 5.6 2 8-7.5-4.2-7.2 4.2 1.6-8-5.6-5.6 8-1.4z" fill="url(#fire)" stroke-width="2.4"/><path d="M30 52a16 16 0 0 1 10-9" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>',
    8: '<path d="M38 6h24v32h32v24H62v32H38V62H6V38h32z" fill="url(#fire)"/><circle cx="50" cy="50" r="17" fill="url(#bomb)"/><circle cx="50" cy="50" r="6" fill="#fff3a8" stroke="none"/>',
    9: '<g transform="rotate(45 50 50)"><path d="M50 2l9 14v50H41V16z" fill="url(#steel)"/><path d="M50 8v56" fill="none" stroke-width="2.4" opacity=".5"/><rect x="28" y="66" width="44" height="9" rx="4" fill="url(#gold)"/><rect x="44" y="75" width="12" height="16" rx="3" fill="url(#red)"/><circle cx="50" cy="94" r="5" fill="url(#gold)"/></g><circle cx="27" cy="74" r="20" fill="url(#cream)"/><text x="27" y="83" text-anchor="middle" font-size="27" font-weight="900" fill="#24352d" stroke="none" font-family="sans-serif">½</text>',
    10: _CARD(50, 50, -8, 52, 70, 'url(#cream)') + '<text x="48" y="70" text-anchor="middle" font-size="56" font-weight="900" fill="#14804a" stroke="none" font-family="sans-serif" transform="rotate(-8 50 50)">×</text>',
    11: _KEY(''),
    12: _DOOR(''),
    13: '<rect x="14" y="44" width="72" height="46" rx="8" fill="url(#em)"/><rect x="10" y="30" width="80" height="18" rx="6" fill="url(#em)"/><rect x="42" y="30" width="16" height="60" fill="url(#gold)"/><path d="M50 30c-8-16-28-14-24-4 3 8 24 4 24 4zM50 30c8-16 28-14 24-4-3 8-24 4-24 4z" fill="url(#gold)"/>',
    14: '<circle cx="26" cy="22" r="13" fill="url(#gold)"/><circle cx="74" cy="22" r="13" fill="url(#gold)"/><circle cx="50" cy="58" r="34" fill="url(#gold)"/><circle cx="50" cy="58" r="25" fill="url(#cream)"/><path d="M50 58V40M50 58l13 8" fill="none" stroke-width="5"/><path d="M30 92l-6 6M70 92l6 6" fill="none" stroke-width="5"/>',
};
const ITEM_IMAGES = {};
for (let _ii = 1; _ii <= 14; _ii++) {
    const _img = new Image();
    _img.src = _svgURI(ITEM_SVG[_ii]);
    ITEM_IMAGES[_ii] = _img;
}
// <img>タグの文字列(ログなどで使う)
function itemImgTag(id, px) {
    const im = ITEM_IMAGES[id];
    return im ? `<img class="ii" src="${im.src}" style="width:${px || 18}px;height:${px || 18}px" alt="">` : '';
}
