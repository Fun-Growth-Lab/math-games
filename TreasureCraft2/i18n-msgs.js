// トレジャークラフト2: ことばの辞書 ③ メッセージ・目標・ボタンの行動・鳴き声
// [日本語, かんたんなにほんご(null=日本語のまま), English]
'use strict';
I18N_DICT.push(
    // ----- 目標 -----
    ['木を切って 木材を5こ集めよう', 'きを きって もくざいを 5こ あつめよう', 'Chop trees and gather 5 Wood'],
    ['作業台をつくって 置こう', 'さぎょうだいを つくって おこう', 'Make a Workbench and place it'],
    ['作業台で 木のつるはしをつくろう', 'さぎょうだいで きの つるはしを つくろう', 'Build a Wood Pickaxe at the Workbench'],
    ['岩をこわして 石を8こ集めよう', 'いわを こわして いしを 8こ あつめよう', 'Break rocks and gather 8 Stone'],
    ['葉っぱを集めて 寝床をつくって置こう(夜にそなえる)', 'はっぱを あつめて ねどこを つくって おこう(よるに そなえる)', 'Gather Leaves, make a Bed and place it (get ready for night)'],
    ['かまどをつくって置こう', 'かまどを つくって おこう', 'Make a Furnace and place it'],
    ['かまどで木炭をつくって 作業台で松明をつくろう', 'かまどで もくたんを つくって さぎょうだいで たいまつを つくろう', 'Make Charcoal in the Furnace, then a Torch at the Workbench'],
    ['かべで囲って松明をともした部屋で 朝まで眠ろう', 'かべで かこって たいまつを ともした へやで あさまで ねむろう', 'Sleep till morning in a walled room lit by a torch'],
    ['「ほる」で穴をほって、はしごをかけて地下へ行こう', '「ほる」で あなを ほって、はしごを かけて ちかへ いこう', 'Dig a hole, put a Ladder in it and go underground'],
    ['地下で銅鉱石を掘って、銅のかたまりをつくろう', 'ちかで どうこうせきを ほって、どうの かたまりを つくろう', 'Mine Copper Ore underground and smelt a Copper Ingot'],
    ['石のつるはし以上で 鉄鉱石を掘ろう', 'いしの つるはし いじょうで てっこうせきを ほろう', 'Mine Iron Ore with a Stone Pickaxe or better'],
    ['鉄のつるはしをつくろう(星晶を掘るのに必要)', 'てつの つるはしを つくろう(せいしょうを ほるのに ひつよう)', 'Build an Iron Pickaxe (needed for Starstone)'],
    ['地下B4より深い階で 星晶を6こ集めよう', 'ちか B4より ふかい かいで せいしょうを 6こ あつめよう', 'Gather 6 Starstone on B4 or deeper'],
    ['夜の山などにいる岩ゴーレムをたおして 大地の核を3こ集めよう', 'よるの やまなどに いる いわゴーレムを たおして だいちの かくを 3こ あつめよう', 'Defeat Rock Golems (mountains at night) for 3 Earth Cores'],
    ['夜の雪原にいる雪オニをたおして とけない氷を3こ集めよう', 'よるの せつげんに いる ゆきオニを たおして とけない こおりを 3こ あつめよう', 'Defeat Yetis (snowfields at night) for 3 Everfrost'],
    ['砂漠のサソリをたおして 太陽の砂を3こ集めよう', 'さばくの サソリを たおして たいようの すなを 3こ あつめよう', 'Defeat desert Scorpions for 3 Sun Sand'],
    ['作業台で 門をつくって 地上に建てよう', 'さぎょうだいで もんを つくって ちじょうに たてよう', 'Make a Gate at the Workbench and build it on the surface'],
    ['門をくぐって 異世界へ行こう', 'もんを くぐって いせかいへ いこう', 'Go through the Gate to the Otherworld'],
    ['魔鉱石で 魔鋼をつくって 武器とよろいを強くしよう', 'まこうせきで まこうを つくって ぶきと よろいを つよく しよう', 'Smelt Demon Steel from Demon Ore and upgrade your gear'],
    ['魔王城へ行って 魔王をたおそう', 'まおうじょうへ いって まおうを たおそう', 'Go to the Demon Castle and defeat the Demon King'],
    // ----- ボタンの行動 -----
    ['こうげき', null, 'Attack'], ['こわす', null, 'Break'], ['向き', 'むき', 'Turn'], ['はずす', null, 'Remove'], ['たがやす', null, 'Till'], ['うつ', null, 'Shoot'], ['ひく', null, 'Reel in'], ['つる', null, 'Fish'],
    ['あげる', null, 'Feed'], ['食べる', 'たべる', 'Eat'], ['飲む', 'のむ', 'Drink'], ['植える', 'うえる', 'Plant'], ['置く', 'おく', 'Place'], ['うめる', null, 'Fill'], ['かける', null, 'Set'], ['建てる', 'たてる', 'Build'], ['ひらく', null, 'Open'],
    // ----- 鳴き声 -----
    ['コケコッコー', null, 'Cock-a-doodle-doo'], ['ブーブー', null, 'Oink oink'], ['メェー', null, 'Baa'], ['モー', null, 'Moo'], ['ピョン', null, 'Hop'], ['ニャー', null, 'Meow'], ['ベェー', null, 'Maa'], ['グワッ', null, 'Quack'], ['コン', null, 'Yip'],
    // ----- セーブ・持ち物 -----
    ['回路の世界', 'かいろの せかい', 'Circuit World'], ['セーブできませんでした(ほぞん容量がいっぱいです)', 'セーブ できなかったよ(ほぞんする ばしょが いっぱい)', "Couldn't save (storage is full)"],
    ['持ち物がいっぱい! 近くに落とした', 'もちものが いっぱい! ちかくに おとした', 'Bag full! Dropped it nearby'], ['持ち物がいっぱいで はずせない', 'もちものが いっぱいで はずせない', "Bag full, can't remove it"],
    ['持ち物がいっぱいで 拾えない', 'もちものが いっぱいで ひろえない', "Bag full, can't pick it up"], ['荷物を拾った。持ちきれない分は 残っている', 'にもつを ひろった。もちきれない ぶんは のこっている', "Picked up items. What didn't fit is still there"],
    ['{0}を装備した', '{0}を そうびした', 'Equipped {0}'], ['{0}がこわれた!', '{0}が こわれた!', '{0} broke!'], ['{0}ができた!', '{0}が できた!', 'Made {0}!'],
    ['{0}を落とした', '{0}を おとした', 'Dropped {0}'],
    // ----- 村人 -----
    ['{0}「{1}」', null, '{0}: "{1}"'], ['めずらしい種をもらった!', 'めずらしい たねを もらった!', 'Got a rare seed!'],
    ['{0}から 麦の種3こと にんじんの種3こを もらった', '{0}から むぎの たね 3こと にんじんの たね 3こを もらった', 'Got 3 Wheat Seeds and 3 Carrot Seeds from the {0}'],
    ['{0}が {1}を なおしてくれた', '{0}が {1}を なおしてくれた', 'The {0} fixed your {1}'], ['装備している道具は どれも きれいだね', 'そうびしている どうぐは どれも きれいだね', 'Your gear is all in good shape!'],
    ['{0}から 回復薬をもらった', '{0}から かいふくやくを もらった', 'Got a Potion from the {0}'], ['{0}から 薬草を3こ もらった', '{0}から やくそうを 3こ もらった', 'Got 3 Herbs from the {0}'],
    ['{0}の料理を食べた(満腹度+50)', '{0}の りょうりを たべた(まんぷくど+50)', "Ate the {0}'s cooking (Food +50)"], ['もう おなかいっぱいみたいだね', null, 'Looks like you are already full!'],
    ['{0}が けがを治してくれた', '{0}が けがを なおしてくれた', 'The {0} healed you'], ['どこも けがは していませんね', null, "You don't seem hurt anywhere."],
    ['{0}から {1}を{2}こ もらった', '{0}から {1}を {2}こ もらった', 'Got {2} {1} from the {0}'], ['満腹+50', 'まんぷく+50', 'Food +50'],
    // ----- 魔物・戦い -----
    ['何か光るものが 遠くを走っていった!', 'なにか ひかる ものが とおくを はしっていった!', 'Something shiny ran by in the distance!'], ['ジャラジャラと音がする…', 'ジャラジャラと おとが する…', 'You hear jingling...'],
    ['{0}が光りだした! はなれて!', '{0}が ひかりだした! はなれて!', 'The {0} is glowing! Get away!'], ['{0}の矢', '{0}の や', "{0}'s arrow"], ['爆発', 'ばくはつ', 'an explosion'],
    ['オオカミが たおれた', null, 'Your wolf fell'], ['毒で おなかが減った', 'どくで おなかが へった', 'Poison made you hungry'], ['{0}から {1} のダメージ', '{0}から {1} の ダメージ', '{1} damage from {0}'],
    ['{0}をたおした!', '{0}を たおした!', 'Defeated the {0}!'], ['良い物を落とした', 'よい ものを おとした', 'It dropped something good'],
    ['おぼれたこと', 'おぼれたこと', 'drowning'], ['空腹', 'くうふく', 'hunger'], ['落下', 'らっか', 'a fall'], ['わなの矢', 'わなの や', 'a trap arrow'], ['食あたり', 'しょくあたり', 'food poisoning'],
    ['{0}にやられた。', '{0}に やられた。', 'Taken down by {0}.'],
    // 魔王
    ['たたきつけ', null, 'Ground Slam'], ['魔王の大波動(柱やかべの陰へ!)', 'まおうの だいはどう(はしらや かべの かげへ!)', 'Demon Wave (hide behind a pillar or wall!)'], ['手下を呼ぶ', 'てしたを よぶ', 'Summon'],
    ['炎の息', 'ほのおの いき', 'Fire Breath'], ['星ふり', 'ほしふり', 'Star Fall'], ['魔王が手下を呼んだ!', 'まおうが てしたを よんだ!', 'The Demon King summoned minions!'],
    ['光ったマスから にげろ!', 'ひかった マスから にげろ!', 'Run from the glowing tiles!'], ['魔王の {0}!', 'まおうの {0}!', "Demon King's {0}!"],
    // ----- 時間・体 -----
    ['おなかが減ってきた…', 'おなかが へってきた…', 'Getting hungry...'], ['おなかがペコペコで HPが減っている!', 'おなかが ペコペコで HPが へっている!', "You're starving and losing HP!"],
    ['{0}日目の朝がきた', '{0}にちめの あさが きた', 'Morning of day {0}'], ['夜になった。まものに気をつけて', 'よるに なった。まものに きをつけて', 'Night has come. Watch out for monsters'],
    ['泳いでいる!', 'およいでいる!', "You're swimming!"], ['息が苦しくなってきた!', 'いきが くるしく なってきた!', 'Running out of breath!'],
    // ----- 場所 -----
    ['{0}だ!', null, "It's the {0}!"], ['この場所の主。にげてもいい', 'この ばしょの ぬし。にげても いい', 'Guardian of this place. You can run away'],
    ['モンスターハウスだ!', null, 'Monster House!'], ['発見! {0}', 'はっけん! {0}', 'Found: {0}!'],
    ['村人にぶつかると 手伝ってくれる', 'むらびとに ぶつかると てつだってくれる', 'Bump into villagers and they will help you'], ['案内人にぶつかると 役に立つ物をくれる', 'あんないにんに ぶつかると やくに たつ ものを くれる', 'Bump into the guide for something useful'],
    ['入口はない。かべを掘りぬこう(鉄のつるはし以上)', 'いりぐちは ない。かべを ほりぬこう(てつの つるはし いじょう)', 'No entrance. Dig through the wall (Iron Pickaxe or better)'],
    ['光るきのこは 明かりになる', 'ひかる きのこは あかりに なる', 'Glowshrooms work as lights'], ['入ると地下へ行ける', 'はいると ちかへ いける', 'Go in to reach the underground'], ['巣をこわさないと まものがわき続ける', 'すを こわさないと まものが わきつづける', 'Monsters keep coming until you break the nest'],
    ['門をくぐって 異世界へ!', 'もんを くぐって いせかいへ!', 'Through the Gate to the Otherworld!'], ['地上へ もどった', 'ちじょうへ もどった', 'Back to the surface'], ['ここが世界のはしだ', 'ここが せかいの はしだ', 'This is the edge of the world'],
    ['落とし穴だ!', 'おとしあなだ!', 'A pitfall!'], ['下にはしごがあって 助かった', 'したに はしごが あって たすかった', 'Luckily there was a ladder below'], ['わなだ!', null, "It's a trap!"],
    ['化石だ!', 'かせきだ!', 'A fossil!'], ['晶洞だ!', 'しょうどうだ!', 'A geode!'], ['大鉱脈だ!', 'だいこうみゃくだ!', 'A big ore vein!'],
    ['大きな生き物の骨が 岩にうまっている', 'おおきな いきものの ほねが いわに うまっている', "A huge creature's bones are buried in the rock"], ['水晶の中に 宝石が光っている', 'すいしょうの なかに ほうせきが ひかっている', 'Gems shine inside the crystal'],
    ['{0}が まとまって ねむっている', '{0}が まとまって ねむっている', 'Lots of {0} sleeping here'], ['おたからだ!', null, 'A treasure!'], ['お宝だ!', 'おたからだ!', 'Treasure!'],
    // ----- 動物 -----
    ['もう なかまは いっぱいだ', null, 'You have enough buddies'], ['なかまになった!', null, 'Joined you!'], ['オオカミがついてくる', 'オオカミが ついてくる', 'The wolf will follow you'], ['肉を食べたが まだなつかない', 'にくを たべたが まだ なつかない', "It ate the meat but isn't tame yet"],
    ['{0}がなついた!', '{0}が なついた!', 'The {0} is tame!'], ['{0}の赤ちゃんが生まれた!', '{0}の あかちゃんが うまれた!', 'A baby {0} was born!'], ['おいしそうに 食べた', 'おいしそうに たべた', 'It ate happily'],
    // ----- こわす・ほる -----
    ['若木が育っている', 'わかぎが そだっている', 'The sapling is growing'], ['マグマだ!', null, 'Magma!'], ['こわせないようだ', null, "Can't break that"], ['{0}は こわせない', null, "Can't break the {0}"],
    ['{0}を掘るには 強いつるはしに持ちかえよう', '{0}を ほるには つよい つるはしに もちかえよう', 'Switch to a stronger pickaxe to mine {0}'], ['{0}を掘るには もっと強いつるはしが必要', '{0}を ほるには もっと つよい つるはしが ひつよう', 'You need a stronger pickaxe to mine {0}'],
    ['寝床をこわしたので 復活地点が はじまりの場所にもどった', 'ねどこを こわしたので ふっかつ ちてんが はじまりの ばしょに もどった', 'Your bed is gone, so you will respawn at the starting point'],
    ['まだ育っていない', 'まだ そだっていない', 'Not grown yet'], ['{0}は なかまだ', null, '{0} is your buddy'], ['ここは ほれないようだ', null, "Can't dig here"],
    ['{0}は「はずす」で 外せる', '{0}は「はずす」で はずせる', 'Use "Remove" to take the {0}'],
    // ----- 眠る -----
    ['まものが近くて 眠れない!', 'まものが ちかくて ねむれない!', "Monsters are too close to sleep!"], ['おそわれた!', null, 'Attacked!'], ['{0}に起こされた', '{0}に おこされた', 'Woken up by {0}'],
    ['{0}日目の朝', '{0}にちめの あさ', 'Morning of day {0}'], ['ぐっすり眠れた', 'ぐっすり ねむれた', 'You slept well'], ['朝まで無事だった', 'あさまで ぶじだった', 'You made it to morning'], ['少し休んだ。HPが回復した', 'すこし やすんだ。HPが かいふくした', 'You rested. HP restored'],
    // ----- 使う -----
    ['だれかがいる', 'だれかが いる', 'Someone is there'], ['ここでは 使えないようだ', 'ここでは つかえないようだ', "Can't use it here"], ['ここは たがやせないようだ', null, "Can't till here"], ['ここでは つれないようだ', null, "Can't fish here"],
    ['ここには 植えられないようだ', 'ここには うえられないようだ', "Can't plant here"], ['羽にみちびかれて もどった', 'はねに みちびかれて もどった', 'The feather led you home'], ['地図のかけらで 周りが地図に のった', 'ちずの かけらで まわりが ちずに のった', 'The map piece revealed the area'],
    ['何も持っていない', 'なにも もっていない', "You're not holding anything"], ['{0}は ぶつかったり「{1}」で 使われる', '{0}は ぶつかったり「{1}」で つかわれる', 'The {0} is used by bumping or "{1}"'], ['{0}は 材料だ', '{0}は ざいりょうだ', '{0} is a material'],
    ['弓を持っていない', 'ゆみを もっていない', "You don't have a bow"], ['矢がない', 'やが ない', 'No arrows'], ['にげられた…', null, 'It got away...'], ['まだ何もかかっていない', 'まだ なにも かかっていない', 'Nothing on the hook yet'],
    ['お宝を釣った!', 'おたからを つった!', 'Fished up a treasure!'], ['光る魚だ!', 'ひかる さかなだ!', 'A glowing fish!'], ['金の魚だ!', 'きんの さかなだ!', 'A golden fish!'],
    ['おなかいっぱいだ', null, "You're full"], ['生肉で おなかをこわした…', 'なまにくで おなかを こわした…', 'The raw meat made you sick...'], ['そこには 置けない', 'そこには おけない', "Can't place it there"],
    ['ここには かけられないようだ', null, "Can't set it here"], ['ここでは はしごは使えない', 'ここでは はしごは つかえない', "Can't use a ladder here"], ['ここには 建てられないようだ', 'ここには たてられないようだ', "Can't build it here"],
    ['門が開いた', 'もんが ひらいた', 'The Gate is open'], ['乗ると 異世界へ行ける', 'のると いせかいへ いける', 'Step on it to go to the Otherworld'],
    // ----- 回路 -----
    ['矢を {0}本 入れた(中に {1}本)', 'やを {0}ほん いれた(なかに {1}ほん)', 'Loaded {0} arrows ({1} inside)'], ['矢の発射台(中に {0}本)', 'やの はっしゃだい(なかに {0}ほん)', 'Arrow Launcher ({0} inside)'],
    ['…zzz', null, '...zzz'],
);
