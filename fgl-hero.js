// タイトル画面の「主役の絵」を作る小さな道具(HTML文字列を返す)。位置はタイトルの舞台(1280x720)のpx。
// ゲームごとに内容を吟味して、これらと SVG・絵文字・ゲームの絵を組み合わせて 主役のシーンを作る。
// 絵文字をきれいに出すフォント指定(style に足す)
const EMO = 'font-family:Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif;';
// 題名の色(ゲームごとに変える)。fill=文字の塗り、stroke=ふち、shadow=かげ
const FH = {
    PAL: (function () {
        const g = (a, b, c, d) => 'linear-gradient(180deg,' + a + ' 0%,' + b + ' 36%,' + c + ' 58%,' + d + ' 100%)';
        return {
            sky: { fill: g('#ffffff', '#bfe6ff', '#3aa0f0', '#9fd4ff'), stroke: '#08305f', shadow: '#041c3c' },
            candy: { fill: g('#ffffff', '#ffc4e4', '#ff4aa8', '#ff9ad0'), stroke: '#5a0a3a', shadow: '#3a0524' },
            coral: { fill: g('#ffffff', '#ffd2c8', '#ff7a68', '#ffb4a6'), stroke: '#6a0a1a', shadow: '#400510' },
            lime: { fill: g('#fbffe0', '#d4f58a', '#8fd13a', '#c4ee7a'), stroke: '#164a14', shadow: '#0a2c0a' },
            mint: { fill: g('#f2fff0', '#9af0a8', '#2fbf5a', '#8de0a0'), stroke: '#0e4a24', shadow: '#052a14' },
            teal: { fill: g('#eaffff', '#6ff0d0', '#12c8a0', '#7fe8d0'), stroke: '#04403a', shadow: '#022a26' },
            purple: { fill: g('#ffffff', '#e4d4ff', '#a070f0', '#cdb0ff'), stroke: '#2a0a5a', shadow: '#180636' },
            orange: { fill: g('#fff3d0', '#ffb74d', '#ff7a00', '#ffa94d'), stroke: '#5a2400', shadow: '#3a1600' },
            cream: { fill: g('#ffffff', '#fff4d8', '#ffe0a0', '#fff0c8'), stroke: '#6a2a00', shadow: '#3e1800' },
            ice: { fill: g('#ffffff', '#dff4ff', '#8fd0f0', '#e8f8ff'), stroke: '#0a2a4a', shadow: '#051a30' },
            violet: { fill: g('#ffffff', '#ffd6f5', '#ff8ae0', '#ffc4f0'), stroke: '#4a0a5a', shadow: '#2c0636' },
            plum: { fill: g('#ffffff', '#fff6e0', '#ffe9b0', '#fff2d0'), stroke: '#5a0a3a', shadow: '#36051f' },
            fire: { fill: g('#fff0d0', '#ffb060', '#e8501a', '#ff9a50'), stroke: '#4a1204', shadow: '#2c0a02' },
            ruby: { fill: g('#ffffff', '#ffd0d6', '#ff4a62', '#ff9aaa'), stroke: '#3a0612', shadow: '#22030a' },
            magenta: { fill: g('#ffffff', '#ffc4dc', '#ec407a', '#ff9ac0'), stroke: '#4a0a2a', shadow: '#2a0418' },
            green: { fill: g('#f4ffe0', '#b6f070', '#58c030', '#a6e860'), stroke: '#1a4a0a', shadow: '#0c2c04' },
            rainbow: { fill: 'linear-gradient(90deg,#ff7a3a 0%,#ffd23a 25%,#3ad07a 55%,#3aa8ff 80%,#a070f0 100%)', stroke: '#1d3a5a', shadow: '#0e2036' },
            multi: { fill: 'linear-gradient(90deg,#ff5a5a 0%,#ffb84a 35%,#4ac86a 65%,#4a9aff 100%)', stroke: '#2a1060', shadow: '#150838' }
        };
    })(),
    // 題名の色を、要素(の子の文字)に反映する。pal を省くと 金色(既定)
    applyTitleColors(el, pal) {
        if (!el || !pal) return;
        el.style.setProperty('--tfill', pal.fill); el.style.setProperty('--tstroke', pal.stroke); el.style.setProperty('--tshadow', pal.shadow || pal.stroke);
    },
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
    // 本物のゲーム画面の切りぬきを、まん中にならべる。items=[{f:'board', w, h, dy, r}] (w,h=見せる大きさ)。想像で描かず、実際の画面を使う
    shots(items, o) {
        o = o || {};
        const gap = o.gap === undefined ? 34 : o.gap, cy = o.cy || 371, tot = items.reduce((a, it) => a + it.w, 0) + gap * (items.length - 1);
        let x = 640 - tot / 2, h = '';
        items.forEach(it => {
            h += `<img class="hv-shot" src="title_parts/${it.f}.webp" alt="" style="left:${Math.round(x)}px;top:${Math.round(cy - it.h / 2 + (it.dy || 0))}px;width:${it.w}px;height:${it.h}px;--r:${it.r || 0}deg">`;
            x += it.w + gap;
        });
        return h;
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
