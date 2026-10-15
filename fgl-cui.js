// canvas描画のゲーム用: 九九ポーカー風の立体UI部品(面 + ふち + 下の濃い縁)。
//   <script src="../fgl-cui.js"></script> のあと  CUI.use(ctx, "'M PLUS Rounded 1c',sans-serif") で使う。
//   CUI.panel(x,y,w,h,r,fill,bd,edge,lw,depth)  … 立体パネル。縁は下に depth だけ出る(次の部品との間を depth+8px 以上あける)
//   CUI.ribbon(cx,cy,text,fs,c1,c2,edge,minW)    … 丸いリボンの見出し
//   CUI.button(x,y,w,h,label,c1,c2,edge,ink,fs,r)… 立体ボタン(面は上下グラデーション、下に縁)
//   CUI.mix(a,b,t) / CUI.shade(c,k)              … 色を まぜる / 明るく(k>0)・暗く(k<0)
(function () {
    let ctx = null, FF = "'M PLUS Rounded 1c','Nunito',sans-serif";
    const rgb = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
    const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
    const shade = (h, k) => k < 0 ? mix(h, '#000000', -k) : mix(h, '#ffffff', k);
    function text(s, x, y, sz, col, align) {
        ctx.font = '900 ' + sz + 'px ' + FF;
        ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s, x, y);
    }
    function panel(x, y, w, h, r, fill, bd, edge, lw, depth, soft, shadowCol) {
        lw = lw === undefined ? 3 : lw; depth = depth === undefined ? 6 : depth;
        ctx.save();
        if (soft !== false) { ctx.shadowColor = shadowCol || 'rgba(0,0,0,0.30)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = depth + 4; }
        ctx.beginPath(); ctx.roundRect(x, y + depth, w, h, r); ctx.fillStyle = edge; ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
        if (bd) { ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke(); }
    }
    function ribbon(cx, cy, label, fs, c1, c2, edge, minW) {
        ctx.font = '900 ' + fs + 'px ' + FF;
        const w = Math.max(minW || 0, ctx.measureText(label).width + 40), h = fs + 16, x = cx - w / 2, y = cy - h / 2;
        ctx.beginPath(); ctx.roundRect(x, y + 4, w, h, h / 2); ctx.fillStyle = edge; ctx.fill();
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowOffsetY = 2; ctx.shadowBlur = 0;
        text(label, cx, cy + 1, fs, '#ffffff'); ctx.restore();
    }
    function button(x, y, w, h, label, c1, c2, edge, ink, fs, r, depth) {
        depth = depth === undefined ? 5 : depth; r = r === undefined ? h / 2.4 : r;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = depth + 3;
        ctx.beginPath(); ctx.roundRect(x, y + depth, w, h, r); ctx.fillStyle = edge; ctx.fill();
        ctx.restore();
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
        if (label) text(label, x + w / 2, y + h / 2 + 1, fs, ink || '#ffffff');
    }
    window.CUI = {
        use: (c, ff) => { ctx = c; if (ff) FF = ff; },
        panel, ribbon, button, text, mix, shade
    };
})();
