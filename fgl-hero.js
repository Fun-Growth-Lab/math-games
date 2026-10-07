// タイトル画面の「主役の絵」を作る小さな道具(HTML文字列を返す)。位置はタイトルの舞台(1280x720)のpx。
// ゲームごとに内容を吟味して、これらと SVG・絵文字・ゲームの絵を組み合わせて 主役のシーンを作る。
// 絵文字をきれいに出すフォント指定(style に足す)
const EMO = 'font-family:Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif;';
const FH = {
    card(txt, l, t, w, h, o) {
        o = o || {};
        return `<div class="hv-card${o.gold ? ' gold' : ''}${o.dark ? ' dark' : ''}${o.cls ? ' ' + o.cls : ''}" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;--r:${o.r || 0}deg;font-size:${o.fs || Math.round(h * 0.4)}px;${o.style || ''}">${txt}</div>`;
    },
    coin(txt, l, t, size, o) {
        o = o || {};
        return `<div class="hv-coin${o.cls ? ' ' + o.cls : ''}" style="left:${l}px;top:${t}px;width:${size}px;height:${size}px;font-size:${o.fs || Math.round(size * 0.55)}px;${o.style || ''}">${txt}</div>`;
    },
    pill(txt, l, t, o) {
        o = o || {};
        return `<div class="hv-pill${o.cls ? ' ' + o.cls : ''}" style="left:${l}px;top:${t}px;${o.w ? 'width:' + o.w + 'px;' : ''}${o.style || ''}">${txt}</div>`;
    },
    hp(l, t, w, pct, txt, o) {
        o = o || {};
        return `<div class="hv-hp" style="left:${l}px;top:${t}px;width:${w}px;"><i style="width:${pct}%;${o.fill ? 'background:' + o.fill + ';' : ''}"></i><b>${txt || ''}</b></div>`;
    },
    glow(l, t, size, color) {
        return `<div class="hv-glow" style="left:${l}px;top:${t}px;width:${size}px;height:${size}px;${color ? '--gc:' + color + ';' : ''}"></div>`;
    },
    burst(txt, l, t, size, o) {
        o = o || {};
        return `<div class="hv-burst" style="left:${l}px;top:${t}px;width:${size}px;height:${size}px;font-size:${o.fs || Math.round(size * 0.3)}px;--r:${o.r || 0}deg;${o.bc ? '--bc:' + o.bc + ';' : ''}${o.sk ? '--sk:' + o.sk + ';' : ''}">${txt}</div>`;
    },
    star(ch, l, t, size, delay) {
        return `<div class="hv-star" style="left:${l}px;top:${t}px;font-size:${size}px;animation-delay:${delay || 0}s">${ch || '✦'}</div>`;
    },
    // 盤のマス
    cell(txt, l, t, w, h, bg, o) {
        o = o || {};
        return `<div class="hv-cell${o.cls ? ' ' + o.cls : ''}" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;background:${bg};font-size:${o.fs || Math.round(h * 0.5)}px;${o.style || ''}">${txt === undefined ? '' : txt}</div>`;
    },
    // ゲームの絵(.mon の箱150x150)を、左上(l,t)に、倍率 s で置く
    mon(html, l, t, s, color, o) {
        o = o || {};
        return `<div style="position:absolute;left:${l}px;top:${t}px;width:150px;height:150px;transform:scale(${s});transform-origin:0 0;${o.style || ''}"><div class="mon${o.bob === false ? '' : ' hv-bob'}" style="position:relative;width:150px;height:150px;--c:${color || '#9b59b6'};">${html}</div></div>`;
    }
};
