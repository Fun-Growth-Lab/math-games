// トレジャークラフト2: アイテムのドット絵。文字で形を描き、まわりの黒ふちは自動でつける。
'use strict';
const PX_LOG = ['...bbbbbbbbbb', '.yybbBbbbbBbb', 'yttybbbbBbbbb', 'ytyybBbbbbbBb', 'yttybbbbbBbbb', '.yybbbBbbbbbb', '...bbbbbbbbbb'];
const PX_LUMP = ['....ssss....', '..ssLLsssd..', '.sLLsssssdd.', 'sLssssdsssdd', 'ssssdsssssdd', '.sssssssddd.', '..dddddddd..'];
const PX_ORE = ['...ddd......', '..dNnnd.....', '..dnnnd.ddd.', '...ddd.dNnnd', '.ddd...dnnnd', 'dNnnd...ddd.', 'dnnnd.......', '.ddd........'];   // 鉱石: まるい粒が3つ
const PX_INGOT = ['...HHHHHHH..', '..HhhhhhhhH.', '.HhhhhhhhhhD', 'HhhhhhhhhhDD', 'DDDDDDDDDDD.'];
const PX_FEATHER = ['.........ww.', '.......wWWw.', '......wWWwg.', '....wWWWwgg.', '...wWWWwgg..', '..wWWWwgg...', '..wWWwgg....', '...wwgg.....', '..q.........', '.q..........'];
const PX_CARROT = ['.........g.g', '........gGg.', '.......gGGg.', '......OOgg..', '.....OOOOg..', '....OoOOO...', '...OOOoO....', '..OOoOO.....', '.OOOO.......', 'OO..........'];
const stonePal = { s: '#9a9a96', L: '#c0c0ba', d: '#6e6e6a' };
const orePal = (n, N, d, L) => ({ n, N, d, L });
const ingotPal = (h, H, D) => ({ h, H, D });
const PIX_ART = {
    wood: [PX_LOG, { b: '#8a5a2c', B: '#6e4622', y: '#e0bc80', t: '#c09858' }],
    nwood: [PX_LOG, { b: '#6c2448', B: '#4e1632', y: '#d87aa0', t: '#a84a70' }],
    leaf: [['......gg....', '....ggGGg...', '..ggGGGgGg..', '.gGGgGGgGGg.', 'gGGGGgGGGGg.', '.gGGGGgGGg..', '..ggGGGgg...', '....ggg.b...', '.........b..'], { g: '#3f9a45', G: '#6cc860', b: '#7c5228' }],
    stone: [PX_LUMP, stonePal],
    coal: [PX_ORE, { d: '#141418', n: '#2e2e38', N: '#8a9ab8' }],
    charcoal: [['...bbbbbbb..', '.yybBbbbBbb.', 'yttybbBbbbbb', 'ytyybbbbbBbb', 'yttybBbbbbbb', '.yybbbbBbbb.', '...bbbbbbb..'], { b: '#3a3028', B: '#5c4c3c', y: '#6a5c4c', t: '#2a221c' }],
    ore_cu: [PX_ORE, { d: '#9a4a1a', n: '#e07a3c', N: '#ffc890' }], ore_fe: [PX_ORE, { d: '#6a707a', n: '#c4c9d2', N: '#ffffff' }], ore_au: [PX_ORE, { d: '#a87a14', n: '#f2c840', N: '#fff6b8' }],
    ore_n: [PX_ORE, { d: '#5a165a', n: '#c040b0', N: '#ffc8f4' }],
    ingot_cu: [PX_INGOT, ingotPal('#d8803c', '#f4b078', '#a85a24')], ingot_fe: [PX_INGOT, ingotPal('#c0c8d0', '#eef2f6', '#8a929a')],
    ingot_au: [PX_INGOT, ingotPal('#f0c030', '#fff0a0', '#c09010')], ingot_n: [PX_INGOT, ingotPal('#8a2a9c', '#d070e0', '#5c1c6c')],
    star: [['.....C......', '....CcC.....', '....Ccc.C...', '.C..Ccc.Cc..', '.Cc.Cccd.Cc.', '.CccCccdCcd.', '..CccccdCd..', '...Cccddd...', '.....ddd....'], { C: '#d0f6ff', c: '#6ad4f6', d: '#2a90c0' }],
    core: [['...rrrrrr...', '..rOOyyOOr..', '.rOyyyyyyOr.', '.rOyYYYyyOr.', '.rOyYYyyyOr.', '.rOOyyyyOOr.', '..rOOOOOOr..', '...rrrrrr...'], { r: '#a82c1c', O: '#e8602c', y: '#ffb03c', Y: '#fff0a0' }],
    ancient: [['...aaa......', '..aAAaa.....', '.aAAaAaaa...', '.aAdaAAAaa..', '..aAdAAdAa..', '...aAAdAAa..', '....aaAAa...', '.....aaa....'], { a: '#2a8a70', A: '#5ac8a8', d: '#c8fff0' }],
    bone: [['.........bb.', '........bBBb', '.......bBBbb', '......bBBb..', '.....bBBb...', '....bBBb....', '...bBBb.....', 'bbbBBb......', 'bBBBb.......', '.bbb........'], { b: '#c8c0a8', B: '#f6f0de' }],
    hide: [['b........b..', 'bbb....bbb..', '.bBBBBBBb...', '.bBBbBBBb...', '..bBBBbBb...', '..bBBBBBb...', '.bBbBBBBBb..', 'bb.bBBBb.bb.', '....bbb.....'], { b: '#7c5230', B: '#b08050' }],
    wool: [['...ww..ww...', '..wWWwwWWw..', '.wWWWWWWWWw.', 'wWWWgWWWWWWw', 'wWWWWWWgWWWw', '.wWWWWWWWWw.', '..wwWWwwWw..', '....ww..w...'], { w: '#dcd8cc', W: '#fbf9f2', g: '#c8c4b8' }],
    feather: [PX_FEATHER, { w: '#c8cdd4', W: '#fbfbfb', g: '#9aa0a8', q: '#7c6a50' }],
    feather_home: [PX_FEATHER, { w: '#e8b830', W: '#fff0a0', g: '#c09010', q: '#a87c20' }],
    silk: [['...wwwww....', '..wWWgWWw...', '.wWgWWWgWw..', '.wgWWgWWWw..', '.wWWgWWgWw..', '..wWWWgWw.t.', '...wwwwwtt..', '..........t.'], { w: '#c8c8d8', W: '#f6f6ff', g: '#a8a8bc', t: '#e8e8f4' }],
    berry: [['......gg....', '.....gG.....', '...bb.bb....', '..bBbbBbb...', '..bbbbbbb...', '....bb.bb...', '...bBbbBb...', '...bbbbbb...', '....bb......'], { g: '#3f9a45', G: '#6cc860', b: '#5a4ad0', B: '#a8a0ff' }],
    carrot: [PX_CARROT, { g: '#3f9a45', G: '#6cc860', O: '#f08a24', o: '#c8641c' }],
    roast: [PX_CARROT, { g: '#5c4a24', G: '#7c6a34', O: '#c8641c', o: '#6e3410' }],
    wheat: [['.....y......', '....yYy.....', '...y.Y.y....', '...yYYYy....', '....yYy.....', '...yYYYy....', '....yYy.....', '.....s......', '.....s......', '.....s......', '...ss.......'], { y: '#e0b83c', Y: '#ffe88a', s: '#a89040' }],
    cactus: [['....gGg.....', '...pPPpp....', '..pPPpppp...', '..pPppdpp...', '..ppdpppd...', '..ppppdpp...', '...pppp.....'], { g: '#4e9a4a', G: '#7ac874', p: '#d84a80', P: '#f49ac0', d: '#fff0d0' }],
    mush: [['...rrrrrr...', '..rRRrrWWr..', '.rWWrrrrrRr.', '.rrrrWWrrrr.', '..wwwwwwww..', '....wWWw....', '....wWWw....', '....wWWw....', '....wwww....'], { r: '#c8443c', R: '#f07a6c', W: '#fff6e8', w: '#d8cfb8' }],
    herb: [['......y.....', '....g.gg....', '...gGgGGg...', '..gGGgGgg...', '...ggGgg.gg.', '..gg.G.gGGg.', '.gGGgG.ggg..', '..ggg.G.....', '......G.....'], { g: '#2c8a5c', G: '#6ad89a', y: '#fff08a' }],
    jelly: [['...jjjjjj...', '..jJJjjjjj..', '.jJJjjjjjjj.', '.jJjjjkjkjj.', '.jjjjjjjjjj.', 'jjjjjjjjjjjj', '.dddddddddd.'], { j: '#7cd86a', J: '#c8f8b8', k: '#2a5a20', d: '#4ea840' }],
    meat: [['...rrrrrr...', '..rRRrrrrr..', '.rRRrwwrrrr.', '.rrrwWWwrrr.', '.rrrwWWwrrd.', '.rrrrwwrrd..', '..rrrrrrdd..', '...ddddd....'], { r: '#d84a50', R: '#f4909a', w: '#f0d8d0', W: '#fff6f0', d: '#a02c34' }],
    steak: [['...bbbbb....', '..bBBbbbb...', '.bBBbbbbbb..', '.bbbbbbbdb..', '.bbbbbbddb..', '..bbbbddb...', '...bbbdb....', '....ddbww...', '.......wWw..', '........wWw.', '.........w..'], { b: '#a8642c', B: '#e0a060', d: '#6e3e18', w: '#d8d0b8', W: '#fbf6e6' }],
    bread: [['...bbbbbb...', '..bBBBBBBb..', '.bBBbBBbBBb.', '.bBBBbBBbBb.', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb', '.dddddddddd.'], { b: '#c88a3c', B: '#f0c070', d: '#8a5a20' }],
    stew: [['.s...s......', '..s...s.....', '.s...s......', '.ooOgOOrOOo.', 'bbbbbbbbbbbb', 'bBBbbbbbbbbd', '.bBbbbbbbbd.', '..bbbbbbdd..', '...dddddd...'], { s: '#f0f0f0', o: '#c87a30', O: '#e8a050', g: '#5ab04a', r: '#e8821c', b: '#a8743c', B: '#d8a868', d: '#6e4622' }],
    pie: [['.....rr.....', '...ccccccc..', '..cCcCcCcCc.', '.cCCcCCcCCCc', '.pppppppppp.', 'cccccccccccc', '.dddddddddd.'], { r: '#5a4ad0', c: '#c88a3c', C: '#f0c070', p: '#6a5ae0', d: '#8a5a20' }],
    feast: [['....bbb.gg..', '...bBBbbgGg.', '...bbbbbggg.', '.oo.bbbbrr..', 'oOOo.ww.rRr.', 'oOOo.wWw.rr.', 'PPPPPPPPPPPP', '.pppppppppp.'], { b: '#a8642c', B: '#e0a060', g: '#3f9a45', G: '#6cc860', o: '#c88a3c', O: '#f0c070', w: '#d8d0b8', W: '#fff', r: '#c8443c', R: '#f07a6c', P: '#f4f4f0', p: '#c8c8c0' }],
    potion: [['....cccc....', '....wwww....', '.....ww.....', '....wttw....', '...wrrrrw...', '..wrRrrrrw..', '..wrRrrrrw..', '..wrrrrrrw..', '...wwwwww...'], { c: '#8a5a2c', w: '#d8ecf4', t: '#eef8fc', r: '#e0486c', R: '#ff9ab0' }],
    // 種は種ぶくろ。ふくろの絵で にんじんと麦を見分ける
    seed_c: [['.....tt.....', '....bttb....', '...bbBBbb...', '..bBBBBgBb..', '.bBBBBggBBb.', '.bBBBOOBBBb.', '.bBBOOOBBBb.', '.bBOOBBBBBb.', '..bbbbbbbb..', '.o..o...o.o.'], { t: '#7c5228', b: '#a88860', B: '#e8d4a8', g: '#3f9a45', O: '#f08a24', o: '#a8642c' }],
    egg: [['....ee....', '...eWee...', '..eWWeee..', '..eWeeee..', '.eWeeeeed.', '.eeeeeeed.', '.eeeeeeed.', '.eeeeeedd.', '.eeeeeedd.', '..eeeedd..', '...dddd...'], { e: '#f6eedc', W: '#ffffff', d: '#d8c6a0' }],
    fegg: [['..wwww......', '.wWWWWww.ww.', 'wWWWWWWwwWWw', 'wWWyyyWWWWWw', 'wWyYyyyWWWw.', 'wWyyyyyWWWw.', '.wWyyyWWWWWw', '.wWWWWWWWWw.', '..wwwWWww...', '.....ww.....'], { w: '#d8d0c0', W: '#fbf8f0', y: '#f0a820', Y: '#ffe070' }],
    nseed: [['....dd....', '...dPPd...', '..dPLPPd..', '..dPPPPd..', '.dPPPPPpd.', '.dPPPPppd.', '..dPPppd..', '...dddd...'], { d: '#3c1048', P: '#a04ac0', p: '#7a2a8c', L: '#e0a0ff' }],
    seed_w: [['.....tt.....', '....bttb....', '...bbBBbb...', '..bBByYBBb..', '.bBBByYyBBb.', '.bBByYyBBBb.', '.bBBByYBBBb.', '.bBBBsBBBBb.', '..bbbbbbbb..', '.y..y...y.y.'], { t: '#7c5228', b: '#a88860', B: '#f4ecd4', y: '#e0b83c', Y: '#ffe88a', s: '#a89040' }],
    crystal: [['.....C......', '....CcC.C...', '.C..Ccc.Cc..', '.Cc.Ccd.Cd..', '.CccCcdCcd..', '..CccccCd...', '...Cccdd....', '....ddd.....'], { C: '#f0e4ff', c: '#b8a0ff', d: '#7a5ad0' }],
    arrow: [['.........HH', '........Hhh', '.......shH.', '......s.h..', '.....s.....', '....s......', '...s.......', 'f.s........', 'ff.........', '.ff........'], { h: '#8e8e8a', H: '#b8b8b2', s: '#a8743c', f: '#d8352c' }],
    dirt: [['...........', '....dd.....', '...dDdd....', '..dddDdd...', '.ddDddkdd..', 'ddddddDddd.', 'dDddkdddkd.'], { d: '#8a6038', D: '#a87848', k: '#5e3e22' }],
    sand: [['...........', '....ss.....', '...sSss....', '..sssSss...', '.ssSsssss..', 'ssssssSsss.', 'sSssssssss.'], { s: '#e2cd8e', S: '#c8b070' }],
    glass: [['GGGGGGGGGG', 'GwwggggggG', 'GwgggggggG', 'GgggggggwG', 'GggggggwgG', 'GgggggwggG', 'GggggggggG', 'GGGGGGGGGG'], { G: '#7fb8d0', g: '#cfeefc', w: '#ffffff' }],
    rdust: [['...........', '.....r.....', '...rRr..r..', '..rRrrRr...', '.rrRrrrrRr.', 'rRrrRrrRrr.'], { r: '#d8301c', R: '#ff6a4c' }],
    bottle: [['...ccc...', '...ggg...', '...g.g...', '..gg.gg..', '.gw...gg.', '.gw....g.', '.g.....g.', '.g.....g.', '.ggggggg.'], { c: '#a8743c', g: '#9ccbe0', w: '#ffffff' }],
    bottle_w: [['...ccc...', '...ggg...', '...g.g...', '..gg.gg..', '.gw...gg.', '.gwbbbbg.', '.gbbbbbg.', '.gbbbbbg.', '.ggggggg.'], { c: '#a8743c', g: '#9ccbe0', w: '#ffffff', b: '#4a9fd8' }],
    gem: [['...HHH...', '..HhhhH..', '.HhhwhhH.', 'HhhwhhhhH', '.HhhhhhH.', '..HhhhH..', '...HhH...', '....H....'], { H: '#c84aa8', h: '#ff6ac8', w: '#ffffff' }],
    arrow_fe: [['........HHH', '.......HhhH', '.......shhH', '......s.hH.', '.....s.....', '....s......', '...s.......', 'f.s........', 'ff.........', '.ff........'], { h: '#c8d0d8', H: '#ffffff', s: '#7c5228', f: '#3c7ad8' }],
    rod: [['..........ss', '.........sS.', '........sS.t', '.......sS..t', '......sS...t', '.....sS....t', '....sS.....t', '...sS......t', '..sS......rW', '.sS.......Wr', 'sS..........'], { s: '#8a5a2c', S: '#b8854c', t: '#e8e8f4', r: '#d8352c', W: '#ffffff' }],
    fish: [['.......f....', '..ffff.ff...', '.fFFFFfff..f', 'fFeFFFFFfffF', 'fFFFFFFFfffF', '.fFFFFfff..f', '..ffff.ff...'], { f: '#4a88c0', F: '#8ac0e8', e: '#111' }],
    gfish: [['.......f....', '..ffff.ff...', '.fFFFFfff..f', 'fFeFFFFFfffF', 'fFFFFFFFfffF', '.fFFFFfff..f', '..ffff.ff...'], { f: '#a8642c', F: '#d8a060', e: '#3a2010' }],
    kfish: [['.......f....', '..ffff.ff...', '.fFFFFfff..f', 'fFeFFFFFfffF', 'fFFFFFFFfffF', '.fFFFFfff..f', '..ffff.ff...'], { f: '#e0a820', F: '#ffe88a', e: '#3a2010' }],
    cfish: [['.......f....', '..ffff.ff...', '.fFFFFfff..f', 'fFeFFFFFfffF', 'fFFFFFFFfffF', '.fFFFFfff..f', '..ffff.ff...'], { f: '#8a68e0', F: '#d8c8ff', e: '#fff' }],
    shard: [['.ppppp..ppp.', 'pPPPPPppPPp.', 'pPrPPPPPPPp.', 'pPPrPgPPPPpp', 'pPPPgggPbbPp', '.pPPPgPPbPPp', '..ppPPPPPPp.', '....ppp.pp..'], { p: '#b8966a', P: '#f0dfb8', r: '#d8352c', g: '#5aa83f', b: '#4a9fd8' }]
};
// 道具: h=頭 H=頭の明るい所 d=頭の暗い所 s=柄 S=柄の明るい所
const PIX_TOOL = {
    sword: ['............Hh', '...........Hhd', '..........Hhd.', '.........Hhd..', '........Hhd...', '.......Hhd....', '......Hhd.....', '.d...Hhd......', '.dd.Hhd.......', '..ddhd........', '...dds........', '..s.dd........', '.sS...........', 'sS............'],
    pick: ['.....hhhhh....', '...hhhHHHhhh..', '..hh....sdhhh.', '.h.....sS..hhh', '......sS....hh', '.....sS.....hh', '....sS.......h', '...sS.........', '..sS..........', '.sS...........', 'sS............'],
    axe: ['......hhhh....', '.....hHHHHh...', '.....hHHHHHh..', '.....ddhHsShh.', '.......dsShhh.', '......sSd.hh..', '.....sS.......', '....sS........', '...sS.........', '..sS..........', '.sS...........'],
    shovel: ['..........hh..', '.........hHHh.', '........hHHHhd', '.......hHHHhd.', '........hHhd..', '.......sSdd...', '......sS......', '.....sS.......', '....sS........', '...sS.........', '.ssS..........', 'sSs...........'],
    hoe: ['.....hhhhhsS..', '....hHHHHsS...', '....hhh.sS....', '.......sS.....', '......sS......', '.....sS.......', '....sS........', '...sS.........', '..sS..........', '.sS...........'],
    bow: ['...hh..S', '..hH...S', '.hH....S', '.hH....S', 'hh.....S', '.hH....S', '.hH....S', '..hH...S', '...hh..S'],
    armor: ['.hhh....hhh.', 'hHHhh..hhHHh', 'hHHHhhhhHHHh', 'hHHHHHHHHHHh', '.ddHHHHHHdd.', '...hHHHHh...', '...hHHHHh...', '...hHHHHh...', '...dddddd...']
};
const MAT_PAL = {
    wood: ['#a8743c', '#c89a5c', '#7c5228'], stone: ['#8e8e8a', '#b8b8b2', '#6a6a66'], bone: ['#d8d0b8', '#f6f0de', '#b0a890'], copper: ['#d8803c', '#f4b078', '#a85a24'],
    gold: ['#f0c030', '#fff0a0', '#c09010'], iron: ['#b8c0c8', '#eef2f6', '#8a929a'], ancient: ['#3fb898', '#8ae8cc', '#2a8a70'], star: ['#5ac8f0', '#d0f6ff', '#2a90c0'],
    demon: ['#8a2a9c', '#d070e0', '#5c1c6c'], hide: ['#8c6038', '#b88858', '#64421f']
};
const HANDLE_PAL = { silk: ['#e8e8f4', '#f6f6ff'], wood: ['#8a5a2c', '#b8854c'], bone: ['#c8c0a8', '#f6f0de'], hide: ['#7c5230', '#a87848'], copper: ['#c9743c', '#f0a868'], nwood: ['#5c1c3c', '#8a3058'] };

const PX_SIZE = 18, PX_SCALE = 4;
function pixelIcon(rows, pal) {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length, ox = Math.floor((PX_SIZE - w) / 2), oy = Math.floor((PX_SIZE - h) / 2);
    const on = (x, y) => { const r = rows[y - oy]; const c = r && r[x - ox]; return c && c !== '.' ? c : null; };
    const c = document.createElement('canvas'); c.width = c.height = PX_SIZE * PX_SCALE;
    const g = c.getContext('2d');
    for (let y = 0; y < PX_SIZE; y++) for (let x = 0; x < PX_SIZE; x++) {
        const v = on(x, y);
        if (v) g.fillStyle = pal[v] || '#f0f';
        else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.fillStyle = '#2a1c10';
        else continue;
        g.fillRect(x * PX_SCALE, y * PX_SCALE, PX_SCALE, PX_SCALE);
    }
    return c.toDataURL();
}
const toolIconCache = {};
function toolIconUrl(t) {
    const id = t.k + '_' + t.a + '_' + (t.k === 'armor' ? '' : t.b);
    if (toolIconCache[id]) return toolIconCache[id];
    const m = MAT_PAL[t.a] || MAT_PAL.iron, h = HANDLE_PAL[t.b] || HANDLE_PAL.wood;
    return (toolIconCache[id] = pixelIcon(PIX_TOOL[t.k], { h: m[0], H: m[1], d: m[2], s: h[0], S: h[1] }));
}
