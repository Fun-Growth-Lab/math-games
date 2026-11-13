// トレジャークラフト2: データ定義(マス・アイテム・素材・レシピ・魔物)。画面に依存しない。
'use strict';

// ---------- マス ----------
// solid:通れない / hp:こわす回数の元 / tool:'pick'|'axe'|null / tier:必要な道具の強さ / drop:[id,最小,最大,確率]
// back:置いた物なら こわすと戻るアイテム / light:明かりの半径
const T = {}, TILE = [];
function defT(key, o) { T[key] = TILE.length; o.key = key; TILE.push(o); }
// 地面
defT('GRASS', { n: '草地', ground: 1 });
defT('DIRT', { n: '土', ground: 1 });
defT('SAND', { n: '砂', ground: 1 });
defT('SNOW', { n: '雪', ground: 1 });
defT('CAVE', { n: '洞くつの床', ground: 1 });
defT('ASH', { n: '灰の地面', ground: 1 });
defT('RFLOOR', { n: '遺跡の床', ground: 1 });
defT('CFLOOR', { n: '魔王城の床', ground: 1 });
defT('WFLOOR', { n: '木の床', hp: 3, tool: 'axe', back: 'floor', floorlike: 1 });
defT('FARM', { n: '畑', hp: 1, floorlike: 1 });
// 液体・境界
defT('WATER', { n: '水', swim: 1, liquid: 1 });   // 泳げる。息が続くあいだだけ
defT('MAGMA', { n: 'マグマ', solid: 1, liquid: 1, light: 3 });
defT('BEDROCK', { n: 'かたい岩盤', solid: 1, wall: 1 });
// 地上の物
defT('TREE', { n: '木', solid: 1, hp: 8, tool: 'axe', drop: [['wood', 2, 3], ['leaf', 1, 2], ['berry', 1, 2, .35]] });
defT('PINE', { n: 'もみの木', solid: 1, hp: 9, tool: 'axe', drop: [['wood', 2, 4], ['leaf', 1, 1], ['berry', 1, 1, .15]] });
defT('CACTUS', { n: 'サボテン', solid: 1, hp: 3, tool: 'axe', drop: [['cactus', 1, 2]] });
defT('BERRY', { n: '木の実のしげみ', solid: 1, hp: 1, drop: [['berry', 2, 3]] });
defT('VEG', { n: '野生のにんじん', solid: 1, hp: 1, drop: [['carrot', 1, 2], ['seed_c', 1, 1]] });
defT('WHEATW', { n: '野生の麦', solid: 1, hp: 1, drop: [['wheat', 1, 2], ['seed_w', 1, 1]] });
defT('HERB', { n: '薬草', solid: 1, hp: 1, drop: [['herb', 1, 1]] });
defT('ROCK', { n: '岩', solid: 1, hp: 8, tool: 'pick', tier: 1, drop: [['stone', 2, 3], ['coal', 1, 1, .12]] });
defT('PIT', { n: '穴', solid: 1 });
defT('LADDER_D', { n: 'はしご(下へ)' , light: 2 });
defT('LADDER_U', { n: 'はしご(上へ)', light: 2 });
// 地下
defT('WDIRT', { n: '土のかべ', solid: 1, wall: 1, hp: 3, tool: 'pick', tier: 0, drop: [['dirt', 1, 1]] });
defT('WSTONE', { n: '石のかべ', solid: 1, wall: 1, hp: 8, tool: 'pick', tier: 1, drop: [['stone', 1, 2]] });
defT('WHARD', { n: '深部のかたい岩', solid: 1, wall: 1, hp: 16, tool: 'pick', tier: 3, drop: [['stone', 2, 2]] });
defT('ORE_COAL', { n: '石炭', solid: 1, wall: 1, hp: 7, tool: 'pick', tier: 1, drop: [['coal', 1, 2]] });
defT('ORE_CU', { n: '銅鉱石', solid: 1, wall: 1, hp: 10, tool: 'pick', tier: 2, drop: [['ore_cu', 1, 2]] });
defT('ORE_FE', { n: '鉄鉱石', solid: 1, wall: 1, hp: 14, tool: 'pick', tier: 3, drop: [['ore_fe', 1, 2]] });
defT('ORE_AU', { n: '金鉱石', solid: 1, wall: 1, hp: 14, tool: 'pick', tier: 3, drop: [['ore_au', 1, 1]] });
defT('ORE_STAR', { n: '星晶', solid: 1, wall: 1, hp: 26, tool: 'pick', tier: 4, drop: [['star', 1, 1]], light: 2 });
defT('MUSH', { n: 'きのこ', solid: 1, hp: 1, drop: [['mush', 1, 2]] });
defT('BONES', { n: '骨の山', solid: 1, hp: 2, drop: [['bone', 1, 2]] });
// 異世界
defT('NROCK', { n: '赤い岩', solid: 1, wall: 1, hp: 12, tool: 'pick', tier: 3, drop: [['stone', 1, 1]] });
defT('NTREE', { n: '魔樹', solid: 1, hp: 14, tool: 'axe', drop: [['nwood', 2, 3]] });
defT('ORE_N', { n: '魔鉱石', solid: 1, wall: 1, hp: 26, tool: 'pick', tier: 4, drop: [['ore_n', 1, 2]], light: 2 });
defT('CWALL', { n: '魔王城のかべ', solid: 1, wall: 1 });
defT('GATE', { n: '門', light: 5 });
// 遺跡
defT('RWALL', { n: '遺跡のかべ', solid: 1, hp: 12, tool: 'pick', tier: 2, drop: [['stone', 1, 2]] });
defT('CHEST_W', { n: '古い宝箱', solid: 1 });
// 置く物
defT('WALL_W', { n: '木のかべ', solid: 1, hp: 7, tool: 'axe', back: 'wall_w' });
defT('WALL_S', { n: '石のかべ', solid: 1, hp: 14, tool: 'pick', tier: 1, back: 'wall_s', blast: 1 });
defT('DOOR', { n: '扉', door: 1, hp: 5, tool: 'axe', back: 'door' });
defT('TORCH', { n: '松明', hp: 1, back: 'torch', light: 6 });   // 上を歩ける。「はずす」で しまう
defT('BENCH', { n: '作業台', solid: 1, hp: 5, tool: 'axe', back: 'bench', station: 'bench' });
defT('FURNACE', { n: 'かまど', solid: 1, hp: 7, tool: 'pick', back: 'furnace', station: 'furnace', light: 2 });
defT('ANVIL', { n: '金床', solid: 1, hp: 9, tool: 'pick', back: 'anvil', station: 'bench' }); // 金床は廃止(作業台に統一)。古いセーブに置いてある物は作業台として使える
defT('BED', { n: '寝床', solid: 1, hp: 4, tool: 'axe', back: 'bed' });
defT('CHEST', { n: '箱', solid: 1, hp: 5, tool: 'axe', back: 'chest' });
defT('CROP_C', { n: 'にんじん畑', solid: 1 });
defT('CROP_W', { n: '麦畑', solid: 1 });
defT('GRAVE', { n: '落とした荷物' });   // 上に乗ると拾う

// 地面の変化(番号がずれないよう最後に足す)
defT('GRASS2', { n: '深い草地', ground: 1 });
defT('FLOWER', { n: '花畑', ground: 1 });

// 見どころのマス
defT('CAVEIN', { n: '洞窟の入口', light: 2 });
defT('TRAP_PIT', { n: '遺跡の床', trap: 'pit' });
defT('TRAP_ARROW', { n: '遺跡の床', trap: 'arrow' });
defT('BURIED', { n: '岩', solid: 1, hp: 8, tool: 'pick', tier: 1, drop: [['stone', 2, 3]], buried: 1 });
defT('GIANT', { n: '巨木', solid: 1 });
defT('GIANTB', { n: '巨木', solid: 1 });
defT('TOWERW', { n: '塔のかべ', solid: 1, hp: 22, tool: 'pick', tier: 3, drop: [['stone', 2, 3]] });
defT('SANDB1', { n: 'ピラミッドの石', solid: 1, hp: 14, tool: 'pick', tier: 2, drop: [['stone', 1, 1]] });
defT('SANDB2', { n: 'ピラミッドの石', solid: 1, hp: 14, tool: 'pick', tier: 2, drop: [['stone', 1, 1]] });
defT('SANDB3', { n: 'ピラミッドの石', solid: 1, hp: 14, tool: 'pick', tier: 2, drop: [['stone', 1, 1]] });
defT('METEOR', { n: '隕石', solid: 1, hp: 30, tool: 'pick', tier: 3, light: 4, drop: [['star', 2, 2], ['ancient', 1, 1]] });
defT('SCORCH', { n: '焼けた地面', ground: 1 });
defT('HULL', { n: '船のかべ', solid: 1, hp: 6, tool: 'axe', drop: [['wood', 1, 1]] });
defT('MAST', { n: '帆柱', solid: 1, hp: 8, tool: 'axe', drop: [['wood', 2, 3]] });
defT('HUTW', { n: '家のかべ', solid: 1 });
defT('FENCE', { n: '柵', solid: 1, low: 1, hp: 3, tool: 'axe', back: 'fence' });   // 向こうが見える・矢が通る
defT('CRYSTAL', { n: '水晶', solid: 1, wall: 1, hp: 8, tool: 'pick', tier: 2, light: 3, drop: [['crystal', 1, 2]] });
defT('SPAWNER', { n: 'まものの巣', solid: 1, hp: 22, tool: 'pick', tier: 2, light: 2, drop: [['ancient', 1, 1], ['bone', 2, 4]] });
defT('RAIL', { n: '線路', ground: 1, back: 'rail' });

defT('SAPLING', { n: '若木', solid: 1, hp: 1, back: 'berry' });
// ガラスと回路
defT('GLASS', { n: 'ガラスのかべ', solid: 1, hp: 2, back: 'glass_w' });   // 視線と明かりは通す・敵と矢は通さない
defT('ORE_RS', { n: '赤い石', solid: 1, wall: 1, hp: 12, tool: 'pick', tier: 2, drop: [['rdust', 2, 4]] });
defT('WIRE', { n: '導線', hp: 1, back: 'rdust' });   // 床に置いた導線。上を歩ける
defT('SWITCH_OFF', { n: 'スイッチ', solid: 1, hp: 2, back: 'switch' });
defT('SWITCH_ON', { n: 'スイッチ', solid: 1, hp: 2, back: 'switch' });
defT('PLATE', { n: '感圧板', hp: 2, tool: 'pick', back: 'plate' });
defT('BULB', { n: '電球', solid: 1, hp: 2, back: 'bulb', dev: 1 });
['N', 'E', 'S', 'W'].forEach((c, i) => {
    defT('CONV_' + c, { n: '動く床', hp: 3, tool: 'pick', back: 'conv', dev: 1, belt: { d: i, n: 1 } });
    defT('FCONV_' + c, { n: '高速で動く床', hp: 3, tool: 'pick', back: 'fconv', dev: 1, belt: { d: i, n: 2 } });
    defT('DISP_' + c, { n: '矢の発射台', solid: 1, hp: 8, tool: 'pick', back: 'disp', dev: 1, disp: i + 1, opaque: 1 });
});
// 金属の建材: 銅=爆発に2回たえる / 鉄=爆発でこわれない / 金=光る(松明のかわりになる)
const METALS = { cu: { n: '銅', hp: 2, blast: 2 }, fe: { n: '鉄', hp: 3, blast: 99 }, au: { n: '金', hp: 1.5, blast: 0, light: 4 } };
const METAL_DESC = { cu: '爆発に2回たえる', fe: '爆発でこわれない', au: '光る' };
for (const m in METALS) {
    const M = METALS[m], U = m.toUpperCase(), lt = M.light ? { light: M.light } : {};
    defT('WALL_' + U, Object.assign({ n: M.n + 'のかべ', solid: 1, hp: Math.round(10 * M.hp), tool: 'pick', tier: 1, back: 'wall_' + m, blast: M.blast, opaque: 1, metal: m }, lt));
    defT('DOOR_' + U, Object.assign({ n: M.n + 'の扉', door: 1, hp: Math.round(5 * M.hp), tool: 'pick', tier: 1, back: 'door_' + m, blast: M.blast, opaque: 1, metal: m }, lt));
    defT('FENCE_' + U, Object.assign({ n: M.n + 'の柵', solid: 1, low: 1, hp: Math.round(4 * M.hp), tool: 'pick', tier: 1, back: 'fence_' + m, blast: M.blast, metal: m }, lt));
    defT('FLOOR_' + U, Object.assign({ n: M.n + 'の床', hp: Math.round(3 * M.hp), tool: 'pick', tier: 1, back: 'floor_' + m, floorlike: 1, blast: M.blast, metal: m }, lt));
}


// 地下の見どころ
defT('FOSSIL', { n: '化石', solid: 1, wall: 1, hp: 10, tool: 'pick', tier: 1, drop: [['bone', 2, 3], ['ancient', 1, 1, .3]] });
defT('GEM', { n: '宝石の結晶', solid: 1, hp: 6, tool: 'pick', tier: 2, light: 4, drop: [['gem', 1, 2]] });
defT('GMUSH', { n: '光る大きなきのこ', solid: 1, hp: 3, light: 5, drop: [['mush', 2, 3], ['gmush', 1, 2]] });
defT('GLOWM', { n: '光るきのこ', solid: 1, hp: 1, light: 5, back: 'gmush' });
defT('VWALL', { n: '封印のかべ', solid: 1, wall: 1, hp: 30, tool: 'pick', tier: 4 });
defT('CARPET', { n: 'カーペット', hp: 2, tool: 'axe', back: 'carpet', floorlike: 1 });   // 上にいると HPの自然回復が少し速い
defT('WALL_NW', { n: '魔樹のかべ', solid: 1, hp: 12, tool: 'axe', back: 'wall_nw', opaque: 1 });
defT('FLOOR_NW', { n: '魔樹の床', hp: 5, tool: 'axe', back: 'floor_nw', floorlike: 1 });
defT('CLAMP', { n: '水晶のランプ', solid: 1, low: 1, hp: 2, back: 'clamp', light: 8 });   // 信号がいらない明るい明かり
defT('CROWN', { n: '宝石の王冠', solid: 1, low: 1, hp: 3, back: 'crown', light: 3 });   // 飾り
defT('STAIRS_U', { n: '階段(上へ)', light: 2 });   // 洞窟の入口・天然の穴の下
defT('WIRE_W', { n: '導線つきのかべ', solid: 1, hp: 8, back: 'rdust', opaque: 1 });   // 置いたかべに粉をぬった物。信号は赤いパネルと同じに伝える
// 回路の素子(床に置く。上を歩ける)。リピーター=後ろから前へ 強さを16にもどす(一方通行) / インバーター=後ろに信号が来ていなければ 前へ出す(来ていれば 前はOFF)する
'NESW'.split('').forEach((c, i) => defT('REP_' + c, { n: 'リピーター', hp: 2, back: 'rep', rep: i + 1 }));
defT('NOT_N', { n: 'インバーター', hp: 2, back: 'notg', inv: 1 });
defT('NOT_E', { n: 'インバーター', hp: 2, back: 'notg', inv: 2 });
// おたから: [id, 名前, 出る所(0=地上 1=地下 2=異界 c=組み合わせ), 説明, 明るさ]。置いて飾るだけ
const DECOS = [
    ['coin', '古いコイン', 0, 'むかしのお金'], ['shell', '貝がら', 0, '海のかおり'], ['wbird', '木ぼりの小鳥', 0, 'ていねいな手作り'], ['sglass', '砂時計', 0, '時をはかる'], ['opot', '古いつぼ', 0, '遺跡のつぼ'],
    ['ammon', 'アンモナイト', 1, 'うずまきの化石'], ['dtooth', '恐竜の歯', 1, '大きな歯の化石'], ['cball', '水晶玉', 1, 'すきとおった玉'], ['gear', '古代の歯車', 1, 'なぞの歯車'], ['fbottle', 'ほたる石のびん', 1, 'ほんのり光る', 4],
    ['dscale', '竜のうろこ', 2, 'かたくて美しい'], ['pfeath', '火の鳥の羽', 2, 'ほんのり あたたかい'], ['sdust', '星くずのびん', 2, '夜空のかけら'], ['dlant', '魔界のランタン', 2, '紫に光る', 6], ['omask', '黒曜の仮面', 2, 'あやしい仮面'],
    ['coinpile', 'コインの山', 'c', 'お金もち気分'], ['fossil', '化石の標本', 'c', '博物館みたい'], ['mclock', 'からくり時計', 'c', '歯車で動く'], ['sball', '星空の水晶玉', 'c', '星が光る', 6], ['phoenix', '不死鳥の像', 'c', '炎が光る', 5], ['dpot', '竜の宝つぼ', 'c', '竜のかざり']
];
DECOS.forEach(([id, n, tier, desc, light]) => defT('DC_' + id.toUpperCase(), Object.assign({ n, solid: 1, hp: 2, back: id, deco: 1 }, light ? { light } : {})));
defT('NOT_S', { n: 'インバーター', hp: 2, back: 'notg', inv: 3 });
defT('NOT_W', { n: 'インバーター', hp: 2, back: 'notg', inv: 4 });
// 石と魔樹の 床・柵・扉
defT('FLOOR_ST', { n: '石畳', hp: 6, tool: 'pick', tier: 1, back: 'floor_s', floorlike: 1, blast: 1 });
defT('FENCE_ST', { n: '石の柵', solid: 1, low: 1, hp: 8, tool: 'pick', tier: 1, back: 'fence_s', blast: 1 });
defT('DOOR_ST', { n: '石の扉', door: 1, hp: 10, tool: 'pick', tier: 1, back: 'door_s', blast: 1, opaque: 1 });
defT('FENCE_NW', { n: '魔樹の柵', solid: 1, low: 1, hp: 6, tool: 'axe', back: 'fence_nw' });
defT('DOOR_NW', { n: '魔樹の扉', door: 1, hp: 9, tool: 'axe', back: 'door_nw', opaque: 1 });
// 金より上の金属: 星晶=強く光る / 魔鋼=いちばん丈夫
const METALS2 = { sr: { n: '星晶', hp: 4, blast: 99, light: 7 }, dm: { n: '魔鋼', hp: 6, blast: 99 } };
for (const m in METALS2) {
    const M = METALS2[m], U = m.toUpperCase(), lt = M.light ? { light: M.light } : {};
    defT('WALL_' + U, Object.assign({ n: M.n + 'のかべ', solid: 1, hp: Math.round(10 * M.hp), tool: 'pick', tier: 1, back: 'wall_' + m, blast: M.blast, opaque: 1, metal: m }, lt));
    defT('DOOR_' + U, Object.assign({ n: M.n + 'の扉', door: 1, hp: Math.round(5 * M.hp), tool: 'pick', tier: 1, back: 'door_' + m, blast: M.blast, opaque: 1, metal: m }, lt));
    defT('FENCE_' + U, Object.assign({ n: M.n + 'の柵', solid: 1, low: 1, hp: Math.round(4 * M.hp), tool: 'pick', tier: 1, back: 'fence_' + m, blast: M.blast, metal: m }, lt));
    defT('FLOOR_' + U, Object.assign({ n: M.n + 'の床', hp: Math.round(3 * M.hp), tool: 'pick', tier: 1, back: 'floor_' + m, floorlike: 1, blast: M.blast, metal: m }, lt));
}
// 視線をさえぎる物。木や柵はさえぎらない
['ROCK', 'BURIED', 'WALL_W', 'WALL_S', 'DOOR', 'RWALL', 'TOWERW', 'SANDB1', 'SANDB2', 'SANDB3', 'HUTW', 'HULL', 'GIANT', 'GIANTB', 'METEOR', 'SPAWNER'].forEach(k => { TILE[T[k]].opaque = 1; });
TILE.forEach(d => { if (d.wall) d.opaque = 1; });

// ---------- アイテム ----------
// e:絵文字 / c:ブロック風アイコンの色 / tile:そのマスの絵をアイコンに / food:満腹 / heal:HP / place:置くマス
const ITEM = {
    arrow: { n: '矢', c: '#c8a878' }, rod: { n: '釣りざお', c: '#a8743c', use: 'rod' },
    fish: { n: '魚', c: '#6aa8d8', food: 8, raw: 1 }, gfish: { n: '焼き魚', c: '#c8843c', food: 28, heal: 5 }, kfish: { n: '金の魚', c: '#ffd84a', food: 40, heal: 40 }, cfish: { n: '光る魚', c: '#b8a0ff', food: 20, heal: 25 },
    wood: { n: '木材', c: '#a8743c' }, leaf: { n: '葉っぱ', c: '#4a9e45' }, stone: { n: '石', c: '#9a9a96' },
    coal: { n: '石炭', c: '#2d2d33' }, charcoal: { n: '木炭', c: '#3a3028' }, bone: { n: '骨', e: '🦴' }, hide: { n: '皮', c: '#9c6a3c' }, wool: { n: '羊毛', c: '#f4f1e8' },
    feather: { n: '羽', e: '🪶' }, silk: { n: 'クモの糸', c: '#e3e3ee' },
    ore_cu: { n: '銅鉱石', c: '#c9743c' }, ore_fe: { n: '鉄鉱石', c: '#d8b89a' }, ore_au: { n: '金鉱石', c: '#e8c84a' }, ore_n: { n: '魔鉱石', c: '#b0349a' },
    ingot_cu: { n: '銅のかたまり', c: '#e08a4a' }, ingot_fe: { n: '鉄のかたまり', c: '#d9dde2' }, ingot_au: { n: '金のかたまり', c: '#ffd84a' }, ingot_n: { n: '魔鋼', c: '#8a2a9c' },
    crystal: { n: '水晶', c: '#b8a0ff', tile: 'CRYSTAL', place: 'CRYSTAL', desc: '置くと 光る' }, fence: { n: '柵', tile: 'FENCE', place: 'FENCE', desc: '向こうが見える' },
    star: { n: '星晶', c: '#7fe8ff' }, core: { n: '大地の核', c: '#d8552c' }, frost: { n: 'とけない氷', c: '#a8e4ff' }, sunsand: { n: '太陽の砂', c: '#ffd84a' }, nwood: { n: '魔樹の木材', c: '#7a2c4a' }, ancient: { n: '古代のかけら', c: '#5ac8a8' },
    berry: { n: '木の実', e: '🫐', food: 9, plant: 1 }, carrot: { n: 'にんじん', e: '🥕', food: 14 }, wheat: { n: '麦', e: '🌾' }, cactus: { n: 'サボテンの実', e: '🌵', food: 6 },
    mush: { n: 'きのこ', e: '🍄', food: 8 }, herb: { n: '薬草', e: '🌿', heal: 20 }, jelly: { n: 'ゼリー', c: '#7cd86a', food: 5 },
    meat: { n: '生肉', e: '🥩', food: 8, raw: 1 }, steak: { n: '焼き肉', e: '🍖', food: 32, heal: 5 }, roast: { n: '焼きにんじん', e: '🍠', food: 26 },
    bread: { n: 'パン', e: '🍞', food: 30 }, stew: { n: 'シチュー', e: '🍲', food: 55, heal: 15 }, pie: { n: '木の実パイ', e: '🥧', food: 45, heal: 10 },
    feast: { n: 'ごちそう', e: '🍱', food: 100, heal: 40 }, potion: { n: '回復薬', e: '🧪', heal: 60 },
    seed_c: { n: 'にんじんの種', e: '🌱', seed: 'CROP_C' }, nseed: { n: '魔樹の種', c: '#a8306c', plant: 'NTREE', desc: '植えると 魔樹が育つ' }, seed_w: { n: '麦の種', e: '🌱', seed: 'CROP_W' },
    feather_home: { n: '帰還の羽', e: '🕊️', use: 'home' }, shard: { n: '地図のかけら', e: '🗺️', use: 'shard', old: 1 },   // もう手に入らない(古いセーブ用)
    bench: { n: '作業台', tile: 'BENCH', place: 'BENCH' }, furnace: { n: 'かまど', tile: 'FURNACE', place: 'FURNACE' }, anvil: { n: '金床', tile: 'ANVIL', place: 'ANVIL' },
    bed: { n: '寝床', tile: 'BED', place: 'BED' }, chest: { n: '箱', tile: 'CHEST', place: 'CHEST' }, torch: { n: '松明', tile: 'TORCH', place: 'TORCH' },
    wall_w: { n: '木のかべ', tile: 'WALL_W', place: 'WALL_W', desc: '敵の視線をさえぎる' }, wall_s: { n: '石のかべ', tile: 'WALL_S', place: 'WALL_S', desc: '爆発に1回たえる' }, door: { n: '扉', tile: 'DOOR', place: 'DOOR' },
    floor: { n: '木の床', tile: 'WFLOOR', place: 'WFLOOR' }, arrow_fe: { n: '鉄の矢', c: '#d9dde2', desc: '弓の攻撃+5' }, rail: { n: '線路', tile: 'RAIL', place: 'RAIL', desc: '床にしく' }, ladder: { n: 'はしご', tile: 'LADDER_D', use: 'ladder' }, gate: { n: '門', tile: 'GATE', use: 'gate' }
};

// ---------- 部品クラフトの素材 ----------
// 刃(頭)の素材。tier=掘れる強さ、atk=攻撃、mine=掘る力、dur=耐久、def=よろいの守り
const HEADS = {
    wood: { n: '木', item: 'wood', cost: 3, st: 'bench', tier: 1, atk: 2, mine: 2, dur: 45 },
    stone: { n: '石', item: 'stone', cost: 3, st: 'bench', tier: 2, atk: 4, mine: 3, dur: 90 },
    bone: { n: '骨', item: 'bone', cost: 3, st: 'bench', tier: 1, atk: 5, mine: 2, dur: 70 },
    copper: { n: '銅', item: 'ingot_cu', cost: 3, st: 'bench', tier: 3, atk: 6, mine: 4, dur: 160 },
    gold: { n: '金', item: 'ingot_au', cost: 3, st: 'bench', tier: 3, atk: 7, mine: 7, dur: 80, luck: 1, note: '掘るのが速い・たまに2倍とれる' },
    iron: { n: '鉄', item: 'ingot_fe', cost: 3, st: 'bench', tier: 4, atk: 9, mine: 6, dur: 280 },
    ancient: { n: '古代', item: 'ancient', cost: 2, st: 'bench', tier: 4, atk: 12, mine: 7, dur: 380, note: 'へりにくい', tough: 1 },
    star: { n: '星晶', item: 'star', cost: 2, st: 'bench', tier: 5, atk: 13, mine: 9, dur: 520 },
    demon: { n: '魔鋼', item: 'ingot_n', cost: 3, st: 'bench', tier: 6, atk: 19, mine: 12, dur: 800, burn: 1, note: '炎の追加ダメージ' }
};
// 柄の素材
const HANDLES = {
    wood: { n: '木の柄', item: 'wood', cost: 1, durMul: 1 },
    bone: { n: '骨の柄', item: 'bone', cost: 1, durMul: 1.4, note: '耐久+40%' },
    hide: { n: '皮まきの柄', item: 'hide', cost: 1, durMul: 1, atk: 1, note: '攻撃+1' },
    copper: { n: '銅の柄', item: 'ingot_cu', cost: 1, durMul: 1.2, mine: 1, note: '掘る力+1・耐久+20%' },
    horn: { n: '角の柄', item: 'horn', cost: 1, durMul: 1, atk: 2, note: '攻撃+2' },
    nwood: { n: '魔樹の柄', item: 'nwood', cost: 1, durMul: 1.1, atk: 3, note: '攻撃+3・耐久+10%' }
};
// よろいの胴
const BODIES = {
    hide: { n: '皮', item: 'hide', cost: 4, st: 'bench', def: 2, dur: 90 },
    copper: { n: '銅', item: 'ingot_cu', cost: 5, st: 'bench', def: 5, dur: 180 },
    iron: { n: '鉄', item: 'ingot_fe', cost: 5, st: 'bench', def: 9, dur: 320 },
    star: { n: '星晶', item: 'star', cost: 3, st: 'bench', def: 12, dur: 480 },
    demon: { n: '魔鋼', item: 'ingot_n', cost: 5, st: 'bench', def: 16, dur: 700 }
};
// よろいの裏地
const LININGS = {
    none: { n: '裏地なし', item: null, cost: 0 },
    wool: { n: '羊毛の裏地', item: 'wool', cost: 2, hp: 15, note: 'HP+15' },
    hide: { n: '皮の裏地', item: 'hide', cost: 2, def: 1, note: '守り+1' },
    silk: { n: '糸の裏地', item: 'silk', cost: 3, thorn: 3, note: 'なぐられると3やり返す' },
    fur: { n: '毛皮の裏地', item: 'fur', cost: 2, hp: 10, def: 2, note: 'HP+10・守り+2' }
};
// 弓のつる
const STRINGS = {
    hide: { n: '皮のつる', item: 'hide', cost: 1, range: 5, note: '射程5' },
    silk: { n: '糸のつる', item: 'silk', cost: 1, range: 7, atk: 2, note: '射程7・攻撃+2' }
};
const TOOL_KINDS = { sword: { n: '剣', e: '🗡️', head: '刃' }, pick: { n: 'つるはし', e: '⛏️', head: '頭' }, axe: { n: '斧', e: '🪓', head: '頭' }, hoe: { n: 'クワ', e: '🔱', head: '頭' }, shovel: { n: 'スコップ', e: '🪏', head: '頭' }, armor: { n: 'よろい', e: '🛡️', head: '胴' }, bow: { n: '弓', e: '🏹', head: '本体' } };

function toolStats(t) {
    if (t.k === 'armor') {
        const b = BODIES[t.a], l = LININGS[t.b];
        return { def: b.def + (l.def || 0), hp: l.hp || 0, thorn: l.thorn || 0, dur: Math.round(b.dur * (t.gem ? 1.3 : 1)) };
    }
    if (t.k === 'bow') {
        const h = HEADS[t.a], g = STRINGS[t.b];
        return { atk: Math.round(h.atk * .8) + (g.atk || 0), range: g.range, mine: 0, tier: 0, dur: Math.round(h.dur * (t.gem ? 1.3 : 1)), luck: 0, tough: h.tough || 0, burn: h.burn || 0 };
    }
    const h = HEADS[t.a], g = HANDLES[t.b];
    const kindAtk = t.k === 'sword' ? 1 : t.k === 'axe' ? .7 : .4;
    return {
        atk: Math.round(h.atk * kindAtk) + (g.atk || 0), mine: h.mine + (g.mine || 0), tier: h.tier,
        dur: Math.round(h.dur * g.durMul * (t.gem ? 1.3 : 1)), luck: h.luck || 0, tough: h.tough || 0, burn: h.burn || 0
    };
}
function toolName(t) {
    const g = t.gem ? '宝石つき ' : '';
    if (t.k === 'armor') return g + BODIES[t.a].n + 'のよろい';
    return g + HEADS[t.a].n + 'の' + TOOL_KINDS[t.k].n;
}

// ---------- ふつうのレシピ(個数) ----------
const RECIPES = [
    { out: 'bench', need: { wood: 5 } },
    { out: 'torch', n: 2, need: { wood: 1, charcoal: 1 }, st: 'bench' },
    { out: 'torch', n: 3, need: { wood: 1, coal: 1 }, st: 'bench' },
    { out: 'arrow', n: 8, need: { wood: 1, stone: 1, feather: 1 }, st: 'bench' },
    { out: 'carpet', n: 2, need: { wool: 1 }, st: 'bench' },
    { out: 'rep', need: { stone: 2, rdust: 2 }, st: 'bench' },
    { out: 'notg', need: { stone: 2, rdust: 1, torch: 1 }, st: 'bench' },
    { out: 'clamp', need: { crystal: 2, rdust: 1 }, st: 'bench' },
    // おたからの組み合わせ
    { out: 'coinpile', need: { coin: 3 }, st: 'bench' },
    { out: 'fossil', need: { ammon: 1, dtooth: 1 }, st: 'bench' },
    { out: 'mclock', need: { sglass: 1, gear: 1 }, st: 'bench' },
    { out: 'sball', need: { cball: 1, sdust: 1 }, st: 'bench' },
    { out: 'phoenix', need: { wbird: 1, pfeath: 1 }, st: 'bench' },
    { out: 'dpot', need: { opot: 1, dscale: 1 }, st: 'bench' },
    { out: 'crown', need: { gem: 5, ingot_au: 2 }, st: 'bench', t: 3 },
    { out: 'wall_nw', n: 2, need: { nwood: 2 }, st: 'bench' },
    { out: 'floor_nw', n: 2, need: { nwood: 1 }, st: 'bench' },
    { out: 'fegg', need: { egg: 1 }, st: 'furnace', t: 2 },
    { out: 'arrow_fe', n: 8, need: { wood: 1, ingot_fe: 1, feather: 1 }, st: 'bench' },
    { out: 'glass_w', n: 2, need: { glass: 1 }, st: 'bench' },
    { out: 'bottle', n: 2, need: { glass: 1 }, st: 'bench' },
    { out: 'switch', need: { stone: 1, rdust: 1 }, st: 'bench' },
    { out: 'plate', need: { stone: 2, rdust: 1 }, st: 'bench' },
    { out: 'bulb', need: { glass: 1, rdust: 1, torch: 1 }, st: 'bench' },
    { out: 'conv', n: 2, need: { ingot_fe: 1, rdust: 1, wood: 2 }, st: 'bench' },
    { out: 'fconv', n: 2, need: { conv: 2, ingot_au: 1 }, st: 'bench' },
    { out: 'disp', need: { stone: 4, rdust: 2, bow_t: 1 }, st: 'bench' },
    { out: 'rod', need: { wood: 3, leaf: 2 }, st: 'bench' },
    { out: 'gfish', need: { fish: 1 }, st: 'furnace', t: 2 },
    { out: 'wall_w', n: 2, need: { wood: 2 }, st: 'bench' },
    { out: 'fence', n: 3, need: { wood: 2 }, st: 'bench' },
    { out: 'floor', n: 2, need: { wood: 1 }, st: 'bench' },
    { out: 'door', need: { wood: 3 }, st: 'bench' },
    { out: 'ladder', n: 2, need: { wood: 3 }, st: 'bench' },
    { out: 'rail', n: 8, need: { ingot_fe: 1, wood: 1 }, st: 'bench' },
    { out: 'bed', need: { wood: 4, leaf: 5 }, st: 'bench' },
    { out: 'chest', need: { wood: 6 }, st: 'bench' },
    { out: 'furnace', need: { stone: 8 }, st: 'bench' },
    { out: 'wall_s', n: 2, need: { stone: 2 }, st: 'bench' },
    { out: 'bread', need: { wheat: 3 }, st: 'bench' },
    { out: 'feather_home', need: { feather: 2, ingot_cu: 1 }, st: 'bench' },
    { out: 'charcoal', need: { wood: 2 }, st: 'furnace', t: 2 },
    { out: 'glass', need: { sand: 2 }, st: 'furnace', t: 2 },
    { out: 'ingot_cu', need: { ore_cu: 2, coal: 1 }, st: 'furnace', t: 3 },
    { out: 'ingot_fe', need: { ore_fe: 2, coal: 1 }, st: 'furnace', t: 3 },
    { out: 'ingot_au', need: { ore_au: 2, coal: 1 }, st: 'furnace', t: 3 },
    { out: 'ingot_n', need: { ore_n: 2, coal: 2 }, st: 'furnace', t: 5 },
    { out: 'steak', need: { meat: 1 }, st: 'furnace', t: 2 },
    { out: 'roast', need: { carrot: 1 }, st: 'furnace', t: 2 },
    { out: 'stew', need: { carrot: 2, meat: 1, mush: 1 }, st: 'furnace', t: 3 },
    { out: 'pie', need: { berry: 3, wheat: 2 }, st: 'furnace', t: 3 },
    { out: 'feast', need: { steak: 2, stew: 1, pie: 1 }, st: 'furnace', t: 4 },
    { out: 'potion', need: { herb: 2, mush: 1, bottle: 1 }, st: 'furnace', t: 2 },
    { out: 'gate', need: { star: 6, core: 3, frost: 3, sunsand: 3, stone: 30 }, st: 'bench', t: 10 }
];
for (const m in METALS) {
    const M = METALS[m], U = m.toUpperCase(), d = METAL_DESC[m];
    ITEM['wall_' + m] = { n: M.n + 'のかべ', tile: 'WALL_' + U, place: 'WALL_' + U, desc: d };
    ITEM['door_' + m] = { n: M.n + 'の扉', tile: 'DOOR_' + U, place: 'DOOR_' + U, desc: d };
    ITEM['fence_' + m] = { n: M.n + 'の柵', tile: 'FENCE_' + U, place: 'FENCE_' + U, desc: '向こうが見える' };
    ITEM['floor_' + m] = { n: M.n + 'の床', tile: 'FLOOR_' + U, place: 'FLOOR_' + U, desc: d };
}
Object.assign(METAL_DESC, { sr: '強く光る', dm: 'いちばん丈夫' });
for (const m in METALS2) {
    const M = METALS2[m], U = m.toUpperCase(), d = METAL_DESC[m];
    ITEM['wall_' + m] = { n: M.n + 'のかべ', tile: 'WALL_' + U, place: 'WALL_' + U, desc: d };
    ITEM['door_' + m] = { n: M.n + 'の扉', tile: 'DOOR_' + U, place: 'DOOR_' + U, desc: d };
    ITEM['fence_' + m] = { n: M.n + 'の柵', tile: 'FENCE_' + U, place: 'FENCE_' + U, desc: '向こうが見える' };
    ITEM['floor_' + m] = { n: M.n + 'の床', tile: 'FLOOR_' + U, place: 'FLOOR_' + U, desc: d };
}
Object.assign(ITEM, {
    floor_s: { n: '石畳', tile: 'FLOOR_ST', place: 'FLOOR_ST', desc: '爆発に1回たえる' }, fence_s: { n: '石の柵', tile: 'FENCE_ST', place: 'FENCE_ST', desc: '向こうが見える' }, door_s: { n: '石の扉', tile: 'DOOR_ST', place: 'DOOR_ST', desc: '爆発に1回たえる' },
    fence_nw: { n: '魔樹の柵', tile: 'FENCE_NW', place: 'FENCE_NW', desc: '向こうが見える' }, door_nw: { n: '魔樹の扉', tile: 'DOOR_NW', place: 'DOOR_NW', desc: '木の扉より丈夫' }
});
RECIPES.push({ out: 'floor_s', n: 4, need: { stone: 1 }, st: 'bench' }, { out: 'fence_s', n: 3, need: { stone: 2 }, st: 'bench' }, { out: 'door_s', need: { stone: 3 }, st: 'bench' },
    { out: 'fence_nw', n: 3, need: { nwood: 1 }, st: 'bench' }, { out: 'door_nw', need: { nwood: 2 }, st: 'bench' });
for (const m of ['cu', 'fe', 'au', 'sr', 'dm']) {
    const ing = { cu: 'ingot_cu', fe: 'ingot_fe', au: 'ingot_au', sr: 'star', dm: 'ingot_n' }[m];
    RECIPES.push({ out: 'wall_' + m, n: 2, need: { [ing]: 1 }, st: 'bench' }, { out: 'door_' + m, need: { [ing]: 2 }, st: 'bench' },
        { out: 'fence_' + m, n: 3, need: { [ing]: 1 }, st: 'bench' }, { out: 'floor_' + m, n: 4, need: { [ing]: 1 }, st: 'bench' });
}
Object.assign(ITEM, {
    ...Object.fromEntries(DECOS.map(([id, n, tier, desc]) => [id, { n, tile: 'DC_' + id.toUpperCase(), place: 'DC_' + id.toUpperCase(), desc, deco: tier }])),
    sand: { n: '砂', use: 'fill', desc: '水や穴を うめる' }, dirt: { n: '土', use: 'fill', desc: '水や穴を うめる' }, glass: { n: 'ガラス' }, rdust: { n: '赤い石の粉', use: 'rdust', desc: '導線を置く' },
    glass_w: { n: 'ガラスのかべ', tile: 'GLASS', place: 'GLASS', desc: '外が見える かべ' },
    bottle: { n: 'ガラスびん', desc: '回復薬の材料' },
    switch: { n: 'スイッチ', tile: 'SWITCH_OFF', place: 'SWITCH_OFF', desc: 'ぶつかって ON/OFF' },
    plate: { n: '感圧板', tile: 'PLATE', place: 'PLATE', desc: '乗ると ON' },
    bulb: { n: '電球', tile: 'BULB', place: 'BULB', desc: '信号で 光る' },
    conv: { n: '動く床', tile: 'CONV_S', place: 'CONV_N', dir: 'CONV', desc: '信号で 上の物を運ぶ' },
    fconv: { n: '高速で動く床', tile: 'FCONV_S', place: 'FCONV_N', dir: 'FCONV', desc: '信号で 上の物を速く運ぶ' },
    disp: { n: '矢の発射台', tile: 'DISP_S', place: 'DISP_N', dir: 'DISP', desc: '信号で 矢を撃つ' },
    clamp: { n: '水晶のランプ', tile: 'CLAMP', place: 'CLAMP', desc: '松明より明るい' },
    crown: { n: '宝石の王冠', tile: 'CROWN', place: 'CROWN', desc: 'かざる宝物' },
    carpet: { n: 'カーペット', tile: 'CARPET', place: 'CARPET', desc: '上にいると 回復が少し速い' },
    wall_nw: { n: '魔樹のかべ', tile: 'WALL_NW', place: 'WALL_NW', desc: '木のかべより丈夫' }, floor_nw: { n: '魔樹の床', tile: 'FLOOR_NW', place: 'FLOOR_NW' },
    egg: { n: 'たまご', c: '#f4ecd8', food: 6 }, milk: { n: 'ミルク', c: '#ffffff', food: 10, heal: 20 },
    fur: { n: '上等な毛皮', c: '#e8803c' }, horn: { n: 'ヤギの角', c: '#d8ccb0' }, rfoot: { n: 'ウサギのお守り', c: '#f08aa8', desc: '落とし物が ときどき2倍' }, fegg: { n: '目玉焼き', c: '#ffd84a', food: 22, heal: 5 },
    rep: { n: 'リピーター', tile: 'REP_E', place: 'REP_N', dir: 'REP', desc: '信号を強くする(一方通行)' }, notg: { n: 'インバーター', tile: 'NOT_E', place: 'NOT_N', dir: 'NOT', desc: '信号を強く 反対にする(一方通行)' },
    gem: { n: '宝石', tile: 'GEM', place: 'GEM', desc: '置くと 光る' }, gmush: { n: '光るきのこ', tile: 'GLOWM', place: 'GLOWM', desc: '置くと 明るい' },
    bow_t: { n: '弓', pseudo: 1 }   // レシピの材料にする「持っている弓(どれでも)」
});
const STATION_NAME = { bench: '作業台', furnace: 'かまど' };

// ---------- 魔物 ----------
// 箱の絵は 1マスを 0〜1 とした [x0,y0,z0,x1,y1,z1,色]。+y(手前)が正面
const withPose = (b, pose) => { b.pose = pose; return b; };   // 歩くときに足を動かす体の形
const humanoid = (body, head, leg, eye, arm) => withPose([
    [.3, .4, 0, .44, .6, .4, leg], [.56, .4, 0, .7, .6, .4, leg],
    [.28, .38, .4, .72, .62, .85, body], [.16, .42, .42, .28, .58, .84, arm || body], [.72, .42, .42, .84, .58, .84, arm || body],
    [.3, .34, .85, .7, .7, 1.22, head], [.36, .7, 1.02, .46, .72, 1.1, eye], [.54, .7, 1.02, .64, .72, 1.1, eye]
], 'h');
const quad = (body, head, leg, s, eye) => {
    s = s || 1; const z = .34 * s;
    return withPose([
        [.28, .2, 0, .4, .32, z, leg], [.6, .2, 0, .72, .32, z, leg], [.28, .68, 0, .4, .8, z, leg], [.6, .68, 0, .72, .8, z, leg],
        [.22, .16, z, .78, .84, z + .36 * s, body], [.3, .7, z + .18, .7, 1, z + .58 * s, head],
        [.36, 1, z + .34, .44, 1.02, z + .42, eye || '#222'], [.56, 1, z + .34, .64, 1.02, z + .42, eye || '#222']
    ], 'q');
};
const blob = (c, d, eye, s) => { s = s || 1; return [[.5 - .36 * s, .5 - .36 * s, 0, .5 + .36 * s, .5 + .36 * s, .6 * s, c], [.5 - .24 * s, .5 + .36 * s, .3 * s, .5 - .08 * s, .5 + .38 * s, .44 * s, eye], [.5 + .08 * s, .5 + .36 * s, .3 * s, .5 + .24 * s, .5 + .38 * s, .44 * s, eye], [.5 - .2 * s, .5 - .2 * s, .6 * s, .5 + .2 * s, .5 + .2 * s, .72 * s, d]]; };

// 体を大きくする(当たり判定は1マスのまま)
const enlarge = (box, s) => box.map(b => [.5 + (b[0] - .5) * s, .5 + (b[1] - .5) * s, b[2] * s, .5 + (b[3] - .5) * s, .5 + (b[4] - .5) * s, b[5] * s, b[6]]);
const MOBS = {
    // 動物
    chicken: { n: 'ニワトリ', hp: 6, spd: .6, animal: 1, drop: [['meat', 1, 1], ['feather', 1, 2]], box: [[.42, .42, 0, .48, .48, .18, '#e8a020'], [.54, .42, 0, .6, .48, .18, '#e8a020'], [.3, .28, .18, .7, .7, .5, '#f6f4ec'], [.36, .62, .46, .64, .86, .76, '#f6f4ec'], [.44, .86, .56, .56, .94, .64, '#e8a020'], [.44, .7, .76, .56, .8, .84, '#d8352c']] },
    pig: { n: 'ブタ', hp: 10, spd: .5, animal: 1, drop: [['meat', 2, 3]], box: quad('#f0a8b0', '#f4b8c0', '#d88a94', .8) },
    sheep: { n: 'ヒツジ', hp: 9, spd: .45, animal: 1, drop: [['wool', 2, 2], ['meat', 1, 1]], box: quad('#f6f3ea', '#3c3c3c', '#3c3c3c', .9, '#fff') },
    cow: { n: 'ウシ', hp: 14, spd: .45, animal: 1, drop: [['meat', 2, 3], ['hide', 1, 2]], box: quad('#6a4a30', '#7a5636', '#4a3220', 1.1) },
    // 珍しい生き物(すぐ逃げる)
    // ウサギ(雪原)・ネコ(砂漠のオアシス)・ヤギ(山)・カモ(水べ)・キツネ(森。すぐにげる)・カメ(砂浜)
    rabbit: { n: 'ウサギ', hp: 5, spd: 1.1, animal: 1, wary: 1, drop: [['meat', 1, 1], ['rfoot', 1, 1, .5]], box: withPose(quad('#f4f4f0', '#fafaf6', '#dcdcd6', .6, '#d84a6a').slice(0, 8).concat([[.36, .76, .55, .44, .84, .86, '#fafaf6'], [.56, .76, .55, .64, .84, .86, '#fafaf6'], [.38, .8, .6, .42, .82, .82, '#f0a8b8'], [.58, .8, .6, .62, .82, .82, '#f0a8b8'], [.42, .08, .26, .58, .2, .42, '#ffffff']]), 'q') },
    cat: { n: 'ネコ', hp: 8, spd: .7, animal: 1, drop: [], box: withPose(quad('#e8a050', '#eeae60', '#c8803c', .7, '#3a8a3a').slice(0, 8).concat([[.32, .82, .64, .4, .9, .76, '#c8803c'], [.6, .82, .64, .68, .9, .76, '#c8803c'], [.3, .36, .5, .7, .44, .54, '#c8803c'], [.3, .56, .5, .7, .62, .54, '#c8803c'], [.46, .06, .36, .54, .14, .7, '#c8803c']]), 'q') },
    goat: { n: 'ヤギ', hp: 10, spd: .5, animal: 1, drop: [['meat', 1, 2], ['horn', 1, 1]], box: withPose(quad('#e8e0d0', '#f0e8d8', '#8a7a6a', .95).slice(0, 8).concat([[.32, .76, .87, .4, .84, 1.06, '#6a5a4a'], [.6, .76, .87, .68, .84, 1.06, '#6a5a4a'], [.44, .98, .44, .56, 1.03, .58, '#d0c8b8']]), 'q') },
    duck: { n: 'カモ', hp: 5, spd: .5, animal: 1, swims: 1, drop: [['meat', 1, 1], ['feather', 1, 2]], box: [[.4, .44, 0, .46, .5, .16, '#f0a020'], [.56, .44, 0, .62, .5, .16, '#f0a020'], [.26, .22, .16, .74, .76, .44, '#c8b898'], [.3, .16, .3, .7, .3, .46, '#8a7a5a'], [.38, .62, .4, .62, .84, .68, '#2a7a4a'], [.38, .62, .36, .62, .84, .4, '#ffffff'], [.42, .84, .46, .58, .98, .54, '#f0a020']] },
    fox: { n: 'キツネ', hp: 8, spd: 1.1, animal: 1, wary: 1, drop: [['fur', 1, 1], ['meat', 1, 1, .5]], box: withPose(quad('#e0702c', '#e8803c', '#3a2a20', .75, '#222').slice(0, 8).concat([[.32, .84, .69, .4, .92, .84, '#e0702c'], [.6, .84, .69, .68, .92, .84, '#e0702c'], [.4, .98, .3, .6, 1.02, .5, '#fff4e8'], [.42, -.04, .3, .58, .2, .5, '#e0702c'], [.43, -.12, .32, .57, -.04, .48, '#ffffff']]), 'q') },
    turtle: { n: 'カメ', hp: 20, def: 3, spd: .2, animal: 1, drop: [['meat', 1, 1]], box: withPose([[.24, .24, 0, .36, .36, .12, '#8ab86a'], [.64, .24, 0, .76, .36, .12, '#8ab86a'], [.24, .64, 0, .36, .76, .12, '#8ab86a'], [.64, .64, 0, .76, .76, .12, '#8ab86a'], [.2, .18, .1, .8, .82, .36, '#4a7a3a'], [.28, .26, .36, .72, .74, .48, '#5c8c44'], [.38, .36, .48, .62, .64, .54, '#6e9c52'], [.4, .8, .08, .6, 1.02, .3, '#8ab86a'], [.42, 1.02, .2, .48, 1.03, .26, '#222'], [.52, 1.02, .2, .58, 1.03, .26, '#222']], 'q') },
    deer: { n: '金色のシカ', hp: 12, spd: 1.1, animal: 1, shy: 1, drop: [['ingot_au', 1, 2], ['meat', 1, 2]], box: quad('#e8c040', '#f4d860', '#b89020', 1.1) },
    goblin: { n: '宝ゴブリン', hp: 16, spd: 1.2, animal: 1, shy: 1, drop: [['ancient', 1, 1], ['ingot_fe', 1, 2], ['potion', 1, 1, .5], ['star', 1, 1, .25]], box: humanoid('#7a5a2c', '#6cb84a', '#4a3a1c', '#111', '#6cb84a').concat([[.2, .1, .4, .8, .4, .9, '#d8b84a']]) },
    pet: { n: 'なかまのオオカミ', hp: 60, spd: 1, animal: 1, pet: 1, box: quad('#d8d8e0', '#e8e8f0', '#a8a8b4', .9, '#222').concat([[.28, .7, .66, .72, 1.02, .74, '#d8352c']]) },
    dwarf: { n: '地底の案内人', hp: 40, spd: .3, animal: 1, npc: 1, box: withPose(humanoid('#5a6a8a', '#f2c9a0', '#3a2c24', '#222', '#5a6a8a').concat([[.3, .66, .84, .7, .74, 1.0, '#d8d8d8'], [.27, .29, 1.14, .73, .73, 1.3, '#8a8a94']]), 'h') },
    villager: { n: '村人', hp: 40, spd: .3, animal: 1, npc: 1, box: humanoid('#8a5a3c', '#f2c9a0', '#6a4428', '#222', '#8a5a3c') },
    // 地上の敵
    bomber: { n: 'ばくだんキノコ', hp: 18, atk: 0, spd: .7, agg: 8, bomb: 1, drop: [['mush', 1, 2], ['coal', 1, 2]], box: [[.34, .34, 0, .66, .66, .42, '#efe6d0'], [.14, .14, .42, .86, .86, .78, '#d8352c'], [.26, .86, .54, .4, .88, .66, '#fff'], [.6, .86, .54, .74, .88, .66, '#fff'], [.38, .66, .16, .46, .68, .26, '#222'], [.54, .66, .16, .62, .68, .26, '#222']] },
    slime: { n: 'スライム', hp: 12, atk: 4, spd: .6, agg: 6, drop: [['jelly', 1, 2]], box: blob('#6cd05a', '#8ae078', '#1a3a14') },
    zombie: { n: 'ゾンビ', hp: 26, atk: 8, spd: .7, agg: 9, drop: [['bone', 1, 1, .5], ['hide', 1, 1, .3]], box: humanoid('#7a5a6c', '#9ab48c', '#4a3c3a', '#c8302c', '#9ab48c').concat([[.24, .3, .48, .76, .7, .56, '#5c4450']]) },
    skeleton: { n: 'ガイコツ', hp: 20, atk: 6, spd: .6, agg: 9, shoot: 5, drop: [['bone', 1, 2]], box: humanoid('#d8d8cc', '#eeeee2', '#c8c8bc', '#222') },
    wolf: { n: 'オオカミ', hp: 22, atk: 9, spd: 1, agg: 12, drop: [['hide', 1, 1], ['meat', 1, 1, .5]], box: quad('#8a8a92', '#a0a0a8', '#6e6e76', .9, '#ffd84a') },
    scorpion: { n: 'サソリ', hp: 32, atk: 10, spd: .8, agg: 8, poison: 6, drop: [['sunsand', 1, 1, .35], ['silk', 1, 1, .5]], box: [[.16, .2, 0, .84, .84, .24, '#b8862c'], [.42, .06, .24, .58, .3, .7, '#a07020'], [.42, .06, .7, .58, .5, .84, '#d8352c'], [.1, .8, .04, .34, 1.02, .2, '#a07020'], [.66, .8, .04, .9, 1.02, .2, '#a07020']] },
    yeti: { n: '雪オニ', hp: 42, atk: 12, spd: .65, agg: 9, drop: [['frost', 1, 1, .6], ['hide', 1, 2], ['meat', 1, 2]], box: humanoid('#e6f0f8', '#f6fbff', '#c8d8e6', '#2a4a6a') },
    golem: { n: '岩ゴーレム', hp: 95, atk: 15, def: 3, spd: .5, agg: 8, drop: [['core', 1, 1], ['stone', 3, 5]], box: humanoid('#8c8c86', '#a4a49c', '#6c6c66', '#ff6a2c', '#6c6c66') },
    // 地下の敵
    bat: { n: 'コウモリ', hp: 10, atk: 5, spd: 1.2, agg: 7, erratic: 1, drop: [['hide', 1, 1, .25]], box: [[.38, .38, .5, .62, .62, .8, '#4a3a5c'], [.04, .44, .62, .38, .56, .68, '#3a2c4a'], [.62, .44, .62, .96, .56, .68, '#3a2c4a'], [.42, .62, .68, .48, .64, .74, '#ff5a5a'], [.52, .62, .68, .58, .64, .74, '#ff5a5a']] },
    spider: { n: '洞くつグモ', hp: 22, atk: 9, spd: .8, agg: 8, drop: [['silk', 1, 2]], box: [[.24, .24, .12, .76, .76, .42, '#3a2a3c'], [.34, .66, .18, .66, .92, .42, '#4a3a4c'], [.04, .3, 0, .24, .38, .22, '#2a1c2c'], [.76, .3, 0, .96, .38, .22, '#2a1c2c'], [.04, .6, 0, .24, .68, .22, '#2a1c2c'], [.76, .6, 0, .96, .68, .22, '#2a1c2c'], [.38, .92, .3, .46, .94, .38, '#d8352c'], [.54, .92, .3, .62, .94, .38, '#d8352c']] },
    mole: { n: 'モグラ兵', hp: 32, atk: 11, spd: .6, agg: 8, drop: [['hide', 1, 1], ['coal', 1, 2]], box: humanoid('#6a4a34', '#7c5a40', '#4a3424', '#111', '#e8d8a8') },
    orec: { n: '鉱石ゴーレム', hp: 75, atk: 17, def: 4, spd: .55, agg: 8, drop: [['ore_fe', 2, 3], ['star', 1, 1, .2]], box: humanoid('#5c6470', '#7fe8ff', '#4a525c', '#102a3a', '#4a525c') },
    // 異世界の敵
    imp: { n: '炎の子', hp: 42, atk: 16, spd: .9, agg: 10, drop: [['coal', 1, 2]], box: blob('#ff7a2c', '#ffc23c', '#3a1408', .85) },
    mslime: { n: '溶岩スライム', hp: 65, atk: 20, spd: .5, agg: 8, drop: [['ore_n', 1, 1, .5], ['coal', 1, 1]], box: blob('#c8341c', '#ff9a2c', '#ffe08a', 1.1) },
    eye: { n: '魔眼', hp: 50, atk: 16, spd: .6, agg: 10, shoot: 6, drop: [['ore_n', 1, 1, .4]], box: [[.2, .2, .4, .8, .8, 1, '#5c1c6c'], [.32, .8, .54, .68, .82, .9, '#f6f3ea'], [.44, .82, .64, .56, .84, .8, '#d8352c']] },
    knight: { n: '魔骸騎士', hp: 95, atk: 24, def: 6, spd: .7, agg: 10, drop: [['ore_n', 1, 2], ['bone', 1, 2]], box: humanoid('#3c2a4c', '#d8d8cc', '#2a1c38', '#ff3a3a', '#5c1c6c') },
    // 中ボス: 特別な場所にいる主。たおさなくても進めるが、良い物を落とす
    ent: { n: '森のヌシ', elite: 1, hp: 150, atk: 13, def: 3, spd: .6, agg: 11, drop: [['wood', 8, 12], ['ancient', 2, 2], ['potion', 1, 2]], box: enlarge(humanoid('#7c5228', '#4aa850', '#5c3c1c', '#ffd84a', '#6e4622'), 1.5) },
    warden: { n: '塔の番人', elite: 1, hp: 170, atk: 15, def: 5, spd: .6, agg: 11, drop: [['ingot_fe', 3, 5], ['ancient', 2, 2]], box: enlarge(humanoid('#7c8088', '#a0a4ac', '#585c64', '#ff5a3c', '#6c7078'), 1.5) },
    mummy: { n: 'ファラオ', elite: 1, hp: 190, atk: 16, def: 4, spd: .65, agg: 11, poison: 8, drop: [['ingot_au', 3, 5], ['star', 1, 2]], box: enlarge(humanoid('#e8dcc0', '#e8c84a', '#d8ccb0', '#111', '#f0e4c8'), 1.5) },
    starbeast: { n: '星の獣', elite: 1, hp: 210, atk: 18, def: 6, spd: .7, agg: 11, drop: [['star', 2, 3], ['ancient', 1, 2]], box: enlarge(quad('#2a2a44', '#3a3a5c', '#1c1c30', 1.1, '#7fe8ff'), 1.5) },
    captain: { n: '幽霊船長', elite: 1, hp: 160, atk: 14, def: 3, spd: .6, agg: 11, shoot: 6, drop: [['ingot_au', 2, 3], ['ancient', 2, 2], ['feather_home', 1, 1]], box: enlarge(humanoid('#3a4a6c', '#c8e8e0', '#2a3450', '#111', '#3a4a6c').concat([[.2, .24, 1.22, .8, .8, 1.34, '#1c1c28']]), 1.45) },
    queen: { n: '巣の女王', elite: 1, hp: 200, atk: 16, def: 4, spd: .7, agg: 11, poison: 10, drop: [['silk', 4, 7], ['ancient', 2, 2], ['potion', 1, 2]], box: enlarge([[.24, .24, .12, .76, .76, .42, '#5c1c6c'], [.34, .66, .18, .66, .92, .42, '#7a2c8c'], [.04, .3, 0, .24, .38, .22, '#2a1c2c'], [.76, .3, 0, .96, .38, .22, '#2a1c2c'], [.04, .6, 0, .24, .68, .22, '#2a1c2c'], [.76, .6, 0, .96, .68, .22, '#2a1c2c'], [.38, .92, .3, .46, .94, .38, '#ffd84a'], [.54, .92, .3, .62, .94, .38, '#ffd84a']], 1.7) },
    crystalg: { n: '水晶の巨人', elite: 1, hp: 220, atk: 17, def: 7, spd: .55, agg: 11, drop: [['crystal', 6, 10], ['star', 1, 2]], box: enlarge(humanoid('#a080f0', '#c8a8ff', '#7a5ad0', '#fff', '#e0c8ff'), 1.5) },
    lakelord: { n: '地底湖のヌシ', elite: 1, hp: 180, atk: 15, def: 4, spd: .4, agg: 12, shoot: 7, drop: [['cfish', 3, 5], ['ancient', 2, 2]], box: blob('#3a6ca8', '#7ac0e8', '#ffe08a', 1.6) },
    // ボス
    boss: { n: '魔王ヴォルガ', hp: 650, atk: 30, def: 8, spd: .34, boss: 1, box: [
        [.4, .9, 0, 1.2, 1.9, 1.1, '#3a1c4c'], [1.8, .9, 0, 2.6, 1.9, 1.1, '#3a1c4c'], [.3, .7, 1.1, 2.7, 2.2, 2.7, '#5c1c6c'],
        [-.2, 1, 1.3, .3, 1.8, 2.6, '#7a2c8c'], [2.7, 1, 1.3, 3.2, 1.8, 2.6, '#7a2c8c'], [.8, 1.1, 2.7, 2.2, 2.5, 3.8, '#8a2a3c'],
        [1, 2.5, 3.2, 1.3, 2.52, 3.5, '#ffd84a'], [1.7, 2.5, 3.2, 2, 2.52, 3.5, '#ffd84a'],
        [.7, 1.5, 3.8, .95, 1.8, 4.5, '#e8e0c8'], [2.05, 1.5, 3.8, 2.3, 1.8, 4.5, '#e8e0c8']] }
};
// 主人公
// 主人公の見た目(設定でえらぶ)。男の子8・女の子8
const SKIN = '#f2c9a0', EYE = '#2a2a44';
const HAIR = {
    short: h => [[.28, .3, 1.12, .72, .72, 1.28, h], [.28, .3, .88, .72, .4, 1.14, h]],
    spiky: h => [[.28, .3, 1.12, .72, .72, 1.28, h], [.28, .3, .88, .72, .4, 1.14, h], [.34, .4, 1.28, .44, .5, 1.36, h], [.56, .44, 1.28, .66, .54, 1.36, h]],
    long: h => [[.27, .28, 1.12, .73, .72, 1.29, h], [.26, .27, .52, .74, .4, 1.16, h], [.25, .4, .78, .3, .62, 1.14, h], [.7, .4, .78, .75, .62, 1.14, h]],
    bob: h => [[.27, .28, 1.12, .73, .72, 1.29, h], [.26, .27, .8, .74, .42, 1.16, h], [.25, .42, .84, .3, .7, 1.14, h], [.7, .42, .84, .75, .7, 1.14, h]],
    pony: h => [[.28, .3, 1.12, .72, .72, 1.28, h], [.28, .3, .9, .72, .4, 1.14, h], [.42, .18, .62, .58, .3, 1.16, h]],
    twin: h => [[.28, .3, 1.12, .72, .72, 1.28, h], [.28, .3, .9, .72, .4, 1.14, h], [.14, .42, .56, .26, .56, 1.1, h], [.74, .42, .56, .86, .56, 1.1, h]]
};
const HATS = {
    explorer: [[.2, .24, 1.2, .8, .8, 1.25, '#7a5230'], [.32, .36, 1.25, .68, .68, 1.44, '#8a6038'], [.31, .35, 1.25, .69, .69, 1.3, '#3a2414']],
    helmet: [[.27, .29, 1.14, .73, .73, 1.32, '#f2c42c'], [.42, .73, 1.16, .58, .77, 1.28, '#fff4a0']],
    bandana: c => [[.28, .3, 1.12, .72, .72, 1.26, c], [.24, .3, 1.0, .3, .36, 1.18, c]],
    ribbon: c => [[.36, .3, 1.26, .48, .42, 1.38, c], [.52, .3, 1.26, .64, .42, 1.38, c], [.46, .32, 1.28, .54, .4, 1.36, c]]
};
function makeLook(o) {
    let l = humanoid(o.body, SKIN, o.leg, EYE, o.arm || o.body).slice();
    if (o.hair) l = l.concat(HAIR[o.style || 'short'](o.hair));
    if (o.skirt) l.push([.25, .35, .28, .75, .65, .5, o.skirt]);
    if (o.cape) l.push([.24, .28, .3, .76, .34, 1.0, o.cape]);
    if (o.scarf) l.push([.27, .36, .78, .73, .65, .88, o.scarf]);
    if (o.belt) l.push([.28, .38, .5, .72, .62, .56, o.belt]);
    if (o.hat) l = l.concat(typeof HATS[o.hat] === 'function' ? HATS[o.hat](o.hatc) : HATS[o.hat]);
    return withPose(l, 'h');
}
const LOOKS = [
    { id: 'b1', g: 'm', n: 'そら', body: '#2ca8a0', leg: '#e8dcc0', arm: SKIN, hair: '#2a2a34', scarf: '#ff9a1c' },
    { id: 'b2', g: 'm', n: '探検家', body: '#4a8a3c', leg: '#a8865a', arm: '#e8dcc0', hair: '#6a3e20', hat: 'explorer', belt: '#7a5230' },
    { id: 'b3', g: 'm', n: '赤マント', body: '#c8342c', leg: '#3a2c24', hair: '#e8c040', cape: '#7a1c1c', belt: '#3a2414' },
    { id: 'b4', g: 'm', n: '鉱夫', body: '#e8822c', leg: '#3a4a8a', arm: '#7a7a84', hair: '#3a2a1c', hat: 'helmet' },
    { id: 'b5', g: 'm', n: '宝さがし', body: '#f4f1e8', leg: '#5a3c24', arm: SKIN, hair: '#2a2a2a', hat: 'bandana', hatc: '#2a8ac8', scarf: '#e8c040' },
    { id: 'b6', g: 'm', n: 'パーカー', body: '#7a4ab8', leg: '#2a2a3c', hair: '#1c1c24', style: 'spiky' },
    { id: 'b7', g: 'm', n: '剣士', body: '#2c8a6a', leg: '#5a4a3c', arm: '#e8dcc0', hair: '#c8642c', style: 'spiky', belt: '#5a3c24' },
    { id: 'b8', g: 'm', n: '旅人', body: '#2a2a34', leg: '#1c1c24', arm: '#3a3a48', hair: '#d8d8e0', cape: '#4a2a6c' },
    { id: 'g1', g: 'f', n: 'さくら', body: '#f07aa8', leg: '#5a3c6c', arm: SKIN, hair: '#6a3e20', style: 'long', skirt: '#c8487c' },
    { id: 'g2', g: 'f', n: 'ポニー', body: '#f2c42c', leg: '#2c3f7c', hair: '#3a2a1c', style: 'pony', skirt: '#3f6fd0' },
    { id: 'g3', g: 'f', n: 'ツイン', body: '#6ac8e8', leg: '#f4f1e8', arm: SKIN, hair: '#e8a03c', style: 'twin', skirt: '#2a8ac8' },
    { id: 'g4', g: 'f', n: 'ひまわり', body: '#f2a83c', leg: '#5a8a3c', arm: SKIN, hair: '#3a2a1c', style: 'long', skirt: '#5a8a3c', hat: 'ribbon', hatc: '#ffe04a' },
    { id: 'g5', g: 'f', n: 'うみ', body: '#2a7ab8', leg: '#f4f1e8', arm: SKIN, hair: '#1c1c24', style: 'bob', skirt: '#f4f1e8', scarf: '#d8352c' },
    { id: 'g6', g: 'f', n: 'こおり', body: '#c8e8f4', leg: '#4a6a9a', hair: '#f4f8ff', style: 'pony', cape: '#7ab8e8' },
    { id: 'g7', g: 'f', n: 'リボン', body: '#f4f1e8', leg: '#3a2c24', arm: SKIN, hair: '#4a2a1c', style: 'long', skirt: '#d8352c', hat: 'ribbon', hatc: '#ff5a8a' },
    { id: 'g8', g: 'f', n: '魔法使い', body: '#5a3a9a', leg: '#2a1c44', hair: '#b8a0ff', style: 'long', skirt: '#3a2a6c', scarf: '#ffd84a' }
];
LOOKS.forEach(o => { o.box = makeLook(o); });
const LOOK_KEY = 'tc2_look';
function lookId() { try { const v = localStorage.getItem(LOOK_KEY); if (LOOKS.some(o => o.id === v)) return v; } catch (e) { } return 'b1'; }
const curLook = () => LOOKS.find(o => o.id === lookId());
const PLAYER_BOX = LOOKS[0].box;

// 動物を飼う: 好きな食べ物と、なでるともらえる物
const FEED = { chicken: ['wheat', 'berry', 'seed_w'], pig: ['carrot', 'berry'], sheep: ['wheat'], cow: ['wheat'], rabbit: ['carrot'], cat: ['fish'], goat: ['wheat'], duck: ['wheat', 'seed_w'], fox: ['berry', 'meat'], turtle: ['berry'] };
const PRODUCT = { chicken: 'feather', sheep: 'wool', cow: 'milk', pig: 'mush', cat: 'fish', duck: 'feather', turtle: 'shell' };
const CRY = { chicken: 'コケコッコー', pig: 'ブーブー', sheep: 'メェー', cow: 'モー', rabbit: 'ピョン', cat: 'ニャー', goat: 'ベェー', duck: 'グワッ', fox: 'コン', turtle: '…' };   // なついた動物の 鳴き声
// 村人の手伝い(物の交換はしない)。1人につき1日1回
const HELPERS = [
    { n: '農夫', job: 'seeds', say: '畑の種を わけてあげよう。たまに めずらしい種も あるよ', btn: '種をもらう' },
    { n: '鍛冶屋', job: 'repair', say: '装備している道具を 1つ なおしてあげよう', btn: 'なおしてもらう' },
    { n: '薬師', job: 'medicine', say: '薬を わけてあげよう', btn: '薬をもらう' },
    { n: '料理人', job: 'meal', say: 'ごはんを 食べていきな', btn: 'ごはんを食べる' },
    { n: '僧侶', job: 'heal', say: 'けがを 治してあげましょう', btn: '治してもらう' },
    { n: '地底の案内人', job: 'under', say: '地下で役に立つ物を わけてあげよう', btn: 'もらう' }
];
// 地底の案内人がくれる物(どれか1つ)
const UNDER_GIFTS = [['torch', 6], ['steak', 3], ['bread', 3], ['ladder', 4], ['coal', 6], ['ore_cu', 4], ['ore_fe', 3], ['ore_au', 2]];
// 遺跡の宝箱の中身 [id,最小,最大,重み]
const LOOT = {
    0: [['stone', 3, 6, 3], ['wood', 3, 6, 3], ['coal', 2, 4, 3], ['potion', 1, 1, 2], ['ingot_cu', 1, 3, 2], ['ancient', 1, 1, 3], ['feather', 2, 4, 2], ['seed_c', 1, 3, 2], ['seed_w', 1, 3, 2], ['feather_home', 1, 1, 1], ['ladder', 2, 4, 2]],
    1: [['ingot_fe', 1, 3, 3], ['ingot_au', 1, 2, 2], ['crystal', 2, 4, 2], ['ancient', 1, 2, 3], ['potion', 1, 2, 2], ['star', 1, 1, 2], ['gem', 1, 2, 1], ['feather_home', 1, 1, 1]],
    2: [['ingot_n', 1, 2, 3], ['ore_n', 2, 4, 3], ['potion', 1, 2, 3], ['feast', 1, 1, 2], ['nwood', 2, 4, 2], ['star', 1, 2, 1]]
};
// 目標の順番(HUDに1行で出す)
const GOALS = [
    { t: '木を切って 木材を5こ集めよう', ok: g => g.wood >= 5 },
    { t: '作業台をつくって 置こう', ok: g => g.placed_bench },
    { t: '作業台で 木のつるはしをつくろう', ok: g => g.tool_pick },
    { t: '岩をこわして 石を8こ集めよう', ok: g => g.stone >= 8 },
    { t: '葉っぱを集めて 寝床をつくって置こう(夜にそなえる)', ok: g => g.placed_bed },
    { t: 'かまどをつくって置こう', ok: g => g.placed_furnace },
    { t: 'かまどで木炭をつくって 作業台で松明をつくろう', ok: g => g.torch >= 1 },
    { t: 'かべで囲って松明をともした部屋で 朝まで眠ろう', ok: g => g.slept || g.slept_safe },
    { t: '「ほる」で穴をほって、はしごをかけて地下へ行こう', ok: g => g.reach_1 },
    { t: '地下で銅鉱石を掘って、銅のかたまりをつくろう', ok: g => g.ingot_cu >= 1 },
    { t: '石のつるはし以上で 鉄鉱石を掘ろう', ok: g => g.ore_fe >= 1 },
    { t: '鉄のつるはしをつくろう(星晶を掘るのに必要)', ok: g => g.pick_tier >= 4 },
    { t: '地下B4より深い階で 星晶を6こ集めよう', ok: g => g.star >= 6 },
    { t: '夜の山などにいる岩ゴーレムをたおして 大地の核を3こ集めよう', ok: g => g.core >= 3 || g.placed_gate },
    { t: '夜の雪原にいる雪オニをたおして とけない氷を3こ集めよう', ok: g => g.frost >= 3 || g.placed_gate },
    { t: '砂漠のサソリをたおして 太陽の砂を3こ集めよう', ok: g => g.sunsand >= 3 || g.placed_gate },
    { t: '作業台で 門をつくって 地上に建てよう', ok: g => g.placed_gate },
    { t: '門をくぐって 異世界へ行こう', ok: g => g.reach_2 },
    { t: '魔鉱石で 魔鋼をつくって 武器とよろいを強くしよう', ok: g => g.ingot_n >= 3 },
    { t: '魔王城へ行って 魔王をたおそう', ok: g => g.boss_dead }
];

if (typeof module !== 'undefined') module.exports = {};
