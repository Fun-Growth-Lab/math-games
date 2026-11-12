// トレジャークラフト2: 実績。世界をまたいで残る。回数を積むだけの作業にならないよう、「出来事」「工夫」「発見」「しばり」「失敗」で作る。
// hide:true は達成するまで名前も条件も見えない(hint だけ出す)。
'use strict';
const ACH_CATS = [['life', 'くらし'], ['find', '発見'], ['battle', '戦い'], ['craft', 'ものづくり'], ['boss', '魔王'], ['oops', 'しっぱい']];
const ACH = [
    // くらし
    { id: 'treasure_all', c: 'find', n: 'おたから はかせ', d: 'おたからを 全部(' + 21 + 'こ) 集める' },
    { id: 'first_morning', c: 'life', n: 'はじめての朝', d: '最初の夜を越える' },
    { id: 'home', c: 'life', n: 'わが家', d: 'かべで囲った明るい部屋で 朝まで眠る' },
    { id: 'night_owl', c: 'life', n: '夜ふかし', d: '一度も眠らずに 夜を越える' },
    { id: 'close_call', c: 'life', n: 'ギリギリの朝', d: 'HP10以下で 起きたまま朝をむかえる' },
    { id: 'water_home', c: 'life', n: '水の上のくらし', d: '水の上に床を広げて 朝まで眠る', hide: 1, hint: 'ふつうは家を建てない場所で眠る' },
    { id: 'under_home', c: 'life', n: 'もぐらの寝床', d: '地下で 朝まで眠る' },
    { id: 'nether_nap', c: 'life', n: 'こわいもの知らず', d: '異世界で 朝まで眠る', hide: 1, hint: '一番おそろしい場所で眠る' },
    { id: 'harvest', c: 'life', n: 'はじめての収穫', d: '畑の作物を 実らせて収穫する' },
    { id: 'forester', c: 'life', n: '森をつくる人', d: '木の実を植えて 木に育てる' },
    { id: 'baby', c: 'life', n: '赤ちゃん誕生', d: 'なついた動物に 赤ちゃんが生まれる' },
    { id: 'friend', c: 'life', n: 'なかま', d: 'オオカミを なかまにする' },
    { id: 'helper', c: 'life', n: '村の人気者', d: '村人や案内人に 3回 手伝ってもらう' },
    // 発見
    { id: 'below', c: 'find', n: '地の底へ', d: 'はじめて地下へ行く' },
    { id: 'otherworld', c: 'find', n: '門の向こう', d: '門をくぐって 異世界へ行く' },
    { id: 'far', c: 'find', n: 'はるか遠く', d: 'はじまりの場所から 400マスはなれる' },
    { id: 'edge', c: 'find', n: '世界のはし', d: '世界の いちばんはしに たどりつく' },
    { id: 'all_land', c: 'find', n: '名所めぐり', d: '1つの世界で 地上の6つの名所を全部見つける' },
    { id: 'all_under', c: 'find', n: '地底探検家', d: '1つの世界で 地下の4つの名所を全部見つける' },
    { id: 'buried', c: 'find', n: 'ここ掘れ', d: 'ひびの入った岩から お宝を掘りあてる' },
    { id: 'deer', c: 'find', n: '金色の出会い', d: '金色のシカを つかまえる', hide: 1, hint: '光るものを追いかけて' },
    { id: 'goblin', c: 'find', n: 'ジャラジャラ', d: '宝ゴブリンを つかまえる', hide: 1, hint: 'あの音の正体は?' },
    { id: 'gold_fish', c: 'find', n: '大物だ!', d: '金の魚か 光る魚を釣る' },
    { id: 'fish_treasure', c: 'find', n: '何か重いぞ', d: '魚ではなく お宝を釣りあげる', hide: 1, hint: '釣れるのは魚だけじゃない' },
    // 戦い
    { id: 'bare', c: 'battle', n: 'この手で', d: '武器を何も持たずに まものをたおす', hide: 1, hint: '道具にたよらない' },
    { id: 'david', c: 'battle', n: '小さな勇者', d: '木の武器で 岩ゴーレムをたおす', hide: 1, hint: '一番弱い武器で 大きな相手に' },
    { id: 'sniper', c: 'battle', n: '遠矢', d: '5マス以上はなれた敵を 矢でたおす' },
    { id: 'dud', c: 'battle', n: '不発', d: '光っている ばくだんキノコを 爆発する前にたおす' },
    { id: 'teamwork', c: 'battle', n: 'いっしょに戦う', d: 'なかまのオオカミが 敵にとどめをさす' },
    { id: 'elite', c: 'battle', n: 'ヌシをたおす', d: '場所の主を はじめてたおす' },
    { id: 'all_elite', c: 'battle', n: 'ヌシ退治の旅', d: '8種類の主を 全部たおす(世界が変わっても数える)' },
    // ものづくり
    { id: 'gold_pick', c: 'craft', n: 'ぜいたくな道具', d: '金のつるはしをつくる' },
    { id: 'crown', c: 'craft', n: '王さまの宝', d: '宝石の王冠をつくって かざる' },
    { id: 'gem_tool', c: 'craft', n: 'きらきらの相棒', d: '宝石の飾りをつけた道具をつくる' },
    { id: 'bone_bone', c: 'craft', n: '骨のずいまで', d: '骨の刃と骨の柄で 道具をつくる', hide: 1, hint: '同じ素材でそろえてみる' },
    { id: 'masterpiece', c: 'craft', n: '最高の一本', d: '魔鋼の刃と魔樹の柄で 剣をつくる' },
    { id: 'full_gear', c: 'craft', n: 'フル装備', d: '剣・つるはし・斧・クワ・よろい・弓を 全部そろえる' },
    { id: 'feast', c: 'craft', n: 'ごちそうさま', d: 'ごちそうをつくる' },
    { id: 'gate', c: 'craft', n: '門を建てる者', d: '異世界への門を 建てる' },
    // 魔王
    { id: 'victory', c: 'boss', n: '魔王をたおした', d: '魔王ヴォルガをたおす' },
    { id: 'no_death', c: 'boss', n: '一度も力つきず', d: '一度も力つきずに 魔王をたおす' },
    { id: 'quick', c: 'boss', n: 'いそぎの旅', d: '30日以内に 魔王をたおす' },
    { id: 'archer_king', c: 'boss', n: '指一本ふれず', d: '近づいて攻撃せずに 魔王をたおす', hide: 1, hint: '魔王に一度もさわらない' },
    { id: 'underdog', c: 'boss', n: '下克上', d: '魔鋼の武器もよろいも使わずに 魔王をたおす', hide: 1, hint: '一番強い素材を使わない' },
    { id: 'nova_wall', c: 'boss', n: 'その手があったか', d: '魔王の大波動を 自分で置いたかべで防ぐ' },
    // しっぱい
    { id: 'first_death', c: 'oops', n: 'はじめての失敗', d: 'はじめて力つきる' },
    { id: 'retrieve', c: 'oops', n: 'おかえり荷物', d: '力つきた場所まで 荷物を取りにもどる' },
    { id: 'midnight', c: 'oops', n: 'ねこみを襲われた', d: '眠っている間に おそわれる' },
    { id: 'pit', c: 'oops', n: '足もと注意', d: '遺跡の落とし穴に落ちる', hide: 1, hint: '遺跡の床には気をつけて' },
    { id: 'boom', c: 'oops', n: 'どかーん', d: 'ばくだんキノコの爆発を受ける' },
    { id: 'bad_meat', c: 'oops', n: '焼けばよかった', d: '生肉で おなかをこわす', hide: 1, hint: 'おなかが減っていても 生は…' },
    { id: 'drown', c: 'oops', n: 'およげなかった', d: 'おぼれて力つきる', hide: 1, hint: '息は長く続かない' },
    { id: 'breath', c: 'oops', n: 'ぷはっ', d: '息がなくなる寸前に 岸へ上がる' }
];
const ACH_KEY = 'tc2_ach';
let achData = {};
try { achData = JSON.parse(localStorage.getItem(ACH_KEY)) || {}; } catch (e) { achData = {}; }
if (!achData.done) achData = { done: {}, elites: {} };
const achHas = id => !!achData.done[id];
const achCount = () => ACH.filter(a => achData.done[a.id]).length;
