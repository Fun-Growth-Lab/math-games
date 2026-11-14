// トレジャークラフト2: ことばの辞書 ② 名前(アイテム・魔物・マス・場所・素材・主人公・村人)
// [日本語, かんたんなにほんご(null=日本語のまま), English]
'use strict';
I18N_DICT.push(
    // ----- アイテム -----
    ['矢', 'や', 'Arrow'], ['釣りざお', 'つりざお', 'Fishing Rod'], ['魚', 'さかな', 'Fish'], ['焼き魚', 'やきざかな', 'Grilled Fish'], ['金の魚', 'きんの さかな', 'Golden Fish'], ['光る魚', 'ひかる さかな', 'Glowing Fish'],
    ['木材', 'もくざい', 'Wood'], ['葉っぱ', 'はっぱ', 'Leaves'], ['石', 'いし', 'Stone'], ['石炭', 'せきたん', 'Coal'], ['木炭', 'もくたん', 'Charcoal'], ['骨', 'ほね', 'Bone'], ['皮', 'かわ', 'Leather'],
    ['羊毛', 'ようもう', 'Wool'], ['羽', 'はね', 'Feather'], ['クモの糸', 'クモの いと', 'Spider Silk'], ['銅鉱石', 'どうこうせき', 'Copper Ore'], ['鉄鉱石', 'てっこうせき', 'Iron Ore'], ['金鉱石', 'きんこうせき', 'Gold Ore'],
    ['魔鉱石', 'まこうせき', 'Demon Ore'], ['銅のかたまり', 'どうの かたまり', 'Copper Ingot'], ['鉄のかたまり', 'てつの かたまり', 'Iron Ingot'], ['金のかたまり', 'きんの かたまり', 'Gold Ingot'], ['魔鋼', 'まこう', 'Demon Steel'],
    ['水晶', 'すいしょう', 'Crystal'], ['置くと 光る', 'おくと ひかる', 'Glows when placed'], ['柵', 'さく', 'Fence'], ['向こうが見える', 'むこうが みえる', 'You can see through'], ['星晶', 'せいしょう', 'Starstone'],
    ['大地の核', 'だいちの かく', 'Earth Core'], ['とけない氷', 'とけない こおり', 'Everfrost'], ['太陽の砂', 'たいようの すな', 'Sun Sand'], ['魔樹の木材', 'まじゅの もくざい', 'Demonwood'], ['古代のかけら', 'こだいの かけら', 'Ancient Shard'],
    ['木の実', 'きのみ', 'Berry'], ['にんじん', null, 'Carrot'], ['麦', 'むぎ', 'Wheat'], ['サボテンの実', 'サボテンの み', 'Cactus Fruit'], ['きのこ', null, 'Mushroom'], ['薬草', 'やくそう', 'Herb'], ['ゼリー', null, 'Jelly'],
    ['生肉', 'なまにく', 'Raw Meat'], ['焼き肉', 'やきにく', 'Cooked Meat'], ['焼きにんじん', 'やきにんじん', 'Roast Carrot'], ['パン', null, 'Bread'], ['シチュー', null, 'Stew'], ['木の実パイ', 'きのみパイ', 'Berry Pie'],
    ['ごちそう', null, 'Feast'], ['回復薬', 'かいふくやく', 'Potion'], ['にんじんの種', 'にんじんの たね', 'Carrot Seeds'], ['魔樹の種', 'まじゅの たね', 'Demon Seed'], ['植えると 魔樹が育つ', 'うえると まじゅが そだつ', 'Grows a demon tree'],
    ['麦の種', 'むぎの たね', 'Wheat Seeds'], ['帰還の羽', 'きかんの はね', 'Homing Feather'], ['地図のかけら', 'ちずの かけら', 'Map Piece'], ['作業台', 'さぎょうだい', 'Workbench'], ['かまど', null, 'Furnace'], ['金床', 'かなとこ', 'Anvil'],
    ['寝床', 'ねどこ', 'Bed'], ['箱', 'はこ', 'Chest'], ['松明', 'たいまつ', 'Torch'], ['木のかべ', 'きの かべ', 'Wood Wall'], ['敵の視線をさえぎる', 'てきの しせんを さえぎる', 'Blocks enemy sight'], ['石のかべ', 'いしの かべ', 'Stone Wall'],
    ['爆発に1回たえる', 'ばくはつに 1かい たえる', 'Survives 1 blast'], ['扉', 'とびら', 'Door'], ['木の床', 'きの ゆか', 'Wood Floor'], ['鉄の矢', 'てつの や', 'Iron Arrow'], ['弓の攻撃+5', 'ゆみの こうげき+5', 'Bow ATK +5'],
    ['線路', 'せんろ', 'Rail'], ['床にしく', 'ゆかに しく', 'Lay on the floor'], ['はしご', null, 'Ladder'], ['門', 'もん', 'Gate'],
    ['銅のかべ', 'どうの かべ', 'Copper Wall'], ['爆発に2回たえる', 'ばくはつに 2かい たえる', 'Survives 2 blasts'], ['銅の扉', 'どうの とびら', 'Copper Door'], ['銅の柵', 'どうの さく', 'Copper Fence'], ['銅の床', 'どうの ゆか', 'Copper Floor'],
    ['鉄のかべ', 'てつの かべ', 'Iron Wall'], ['爆発でこわれない', 'ばくはつで こわれない', 'Blast-proof'], ['鉄の扉', 'てつの とびら', 'Iron Door'], ['鉄の柵', 'てつの さく', 'Iron Fence'], ['鉄の床', 'てつの ゆか', 'Iron Floor'],
    ['金のかべ', 'きんの かべ', 'Gold Wall'], ['光る', 'ひかる', 'Glows'], ['金の扉', 'きんの とびら', 'Gold Door'], ['金の柵', 'きんの さく', 'Gold Fence'], ['金の床', 'きんの ゆか', 'Gold Floor'],
    ['星晶のかべ', 'せいしょうの かべ', 'Starstone Wall'], ['強く光る', 'つよく ひかる', 'Glows brightly'], ['星晶の扉', 'せいしょうの とびら', 'Starstone Door'], ['星晶の柵', 'せいしょうの さく', 'Starstone Fence'], ['星晶の床', 'せいしょうの ゆか', 'Starstone Floor'],
    ['魔鋼のかべ', 'まこうの かべ', 'Demon Steel Wall'], ['いちばん丈夫', 'いちばん じょうぶ', 'The toughest'], ['魔鋼の扉', 'まこうの とびら', 'Demon Steel Door'], ['魔鋼の柵', 'まこうの さく', 'Demon Steel Fence'], ['魔鋼の床', 'まこうの ゆか', 'Demon Steel Floor'],
    ['石畳', 'いしだたみ', 'Cobblestone'], ['石の柵', 'いしの さく', 'Stone Fence'], ['石の扉', 'いしの とびら', 'Stone Door'], ['魔樹の柵', 'まじゅの さく', 'Demonwood Fence'], ['魔樹の扉', 'まじゅの とびら', 'Demonwood Door'], ['木の扉より丈夫', 'きの とびらより じょうぶ', 'Tougher than a wood door'],
    // おたから
    ['古いコイン', 'ふるい コイン', 'Old Coin'], ['むかしのお金', 'むかしの おかね', 'Money from long ago'], ['貝がら', 'かいがら', 'Seashell'], ['海のかおり', 'うみの かおり', 'Smells like the sea'], ['木ぼりの小鳥', 'きぼりの ことり', 'Wooden Bird'], ['ていねいな手作り', 'ていねいな てづくり', 'Carefully handmade'],
    ['砂時計', 'すなどけい', 'Hourglass'], ['時をはかる', 'ときを はかる', 'Measures time'], ['古いつぼ', 'ふるい つぼ', 'Old Pot'], ['遺跡のつぼ', 'いせきの つぼ', 'A pot from the ruins'], ['アンモナイト', null, 'Ammonite'], ['うずまきの化石', 'うずまきの かせき', 'A spiral fossil'],
    ['恐竜の歯', 'きょうりゅうの は', 'Dino Tooth'], ['大きな歯の化石', 'おおきな はの かせき', 'A big fossil tooth'], ['水晶玉', 'すいしょうだま', 'Crystal Ball'], ['すきとおった玉', 'すきとおった たま', 'A clear orb'], ['古代の歯車', 'こだいの はぐるま', 'Ancient Gear'], ['なぞの歯車', 'なぞの はぐるま', 'A mystery gear'],
    ['ほたる石のびん', 'ほたるいしの びん', 'Fluorite Jar'], ['ほんのり光る', 'ほんのり ひかる', 'Glows softly'], ['竜のうろこ', 'りゅうの うろこ', 'Dragon Scale'], ['かたくて美しい', 'かたくて うつくしい', 'Hard and beautiful'], ['火の鳥の羽', 'ひのとりの はね', 'Firebird Feather'], ['ほんのり あたたかい', null, 'Slightly warm'],
    ['星くずのびん', 'ほしくずの びん', 'Stardust Jar'], ['夜空のかけら', 'よぞらの かけら', 'A piece of night sky'], ['魔界のランタン', 'まかいの ランタン', 'Demon Lantern'], ['紫に光る', 'むらさきに ひかる', 'Glows purple'], ['黒曜の仮面', 'こくようの かめん', 'Obsidian Mask'], ['あやしい仮面', 'あやしい かめん', 'A spooky mask'],
    ['コインの山', 'コインの やま', 'Coin Pile'], ['お金もち気分', 'おかねもち きぶん', 'Feel rich'], ['化石の標本', 'かせきの ひょうほん', 'Fossil Display'], ['博物館みたい', 'はくぶつかん みたい', 'Like a museum'], ['からくり時計', 'からくりどけい', 'Clockwork Clock'], ['歯車で動く', 'はぐるまで うごく', 'Runs on gears'],
    ['星空の水晶玉', 'ほしぞらの すいしょうだま', 'Starry Orb'], ['星が光る', 'ほしが ひかる', 'Stars shine inside'], ['不死鳥の像', 'ふしちょうの ぞう', 'Phoenix Statue'], ['炎が光る', 'ほのおが ひかる', 'Flames glow'], ['竜の宝つぼ', 'りゅうの たからつぼ', 'Dragon Urn'], ['竜のかざり', 'りゅうの かざり', 'A dragon ornament'],
    // 回路・そのほか
    ['砂', 'すな', 'Sand'], ['水や穴を うめる', 'みずや あなを うめる', 'Fills water or holes'], ['土', 'つち', 'Dirt'], ['ガラス', null, 'Glass'], ['赤い石の粉', 'あかい いしの こな', 'Redstone Dust'], ['導線を置く', 'どうせんを おく', 'Lays wire'],
    ['ガラスのかべ', 'ガラスの かべ', 'Glass Wall'], ['外が見える かべ', 'そとが みえる かべ', 'A wall you can see through'], ['ガラスびん', null, 'Glass Bottle'], ['回復薬の材料', 'かいふくやくの ざいりょう', 'For making potions'],
    ['スイッチ', null, 'Switch'], ['ぶつかって ON/OFF', null, 'Bump to turn ON/OFF'], ['感圧板', 'かんあつばん', 'Pressure Plate'], ['乗ると ON', 'のると ON', 'ON when stepped on'], ['電球', 'でんきゅう', 'Lamp'], ['信号で 光る', 'しんごうで ひかる', 'Lights up with a signal'],
    ['動く床', 'うごく ゆか', 'Conveyor'], ['信号で 上の物を運ぶ', 'しんごうで うえの ものを はこぶ', 'Carries things with a signal'], ['高速で動く床', 'こうそくで うごく ゆか', 'Fast Conveyor'], ['信号で 上の物を速く運ぶ', 'しんごうで うえの ものを はやく はこぶ', 'Carries things fast with a signal'],
    ['矢の発射台', 'やの はっしゃだい', 'Arrow Launcher'], ['信号で 矢を撃つ', 'しんごうで やを うつ', 'Shoots arrows with a signal'], ['水晶のランプ', 'すいしょうの ランプ', 'Crystal Lamp'], ['松明より明るい', 'たいまつより あかるい', 'Brighter than a torch'],
    ['宝石の王冠', 'ほうせきの おうかん', 'Jeweled Crown'], ['かざる宝物', 'かざる たからもの', 'A treasure to display'], ['カーペット', null, 'Carpet'], ['上にいると 回復が少し速い', 'うえに いると かいふくが すこし はやい', 'Heal a bit faster standing on it'],
    ['魔樹のかべ', 'まじゅの かべ', 'Demonwood Wall'], ['木のかべより丈夫', 'きの かべより じょうぶ', 'Tougher than a wood wall'], ['魔樹の床', 'まじゅの ゆか', 'Demonwood Floor'], ['たまご', null, 'Egg'], ['ミルク', null, 'Milk'], ['上等な毛皮', 'じょうとうな けがわ', 'Fine Fur'],
    ['ヤギの角', 'ヤギの つの', 'Goat Horn'], ['ウサギのお守り', 'ウサギの おまもり', 'Rabbit Charm'], ['落とし物が ときどき2倍', 'おとしものが ときどき 2ばい', 'Drops are sometimes doubled'], ['目玉焼き', 'めだまやき', 'Fried Egg'],
    ['リピーター', null, 'Repeater'], ['信号を強くする(一方通行)', 'しんごうを つよくする(いっぽうつうこう)', 'Boosts the signal (one-way)'], ['インバーター', null, 'Inverter'], ['信号を強く 反対にする(一方通行)', 'しんごうを つよく はんたいに する(いっぽうつうこう)', 'Boosts and flips the signal (one-way)'],
    ['宝石', 'ほうせき', 'Gem'], ['光るきのこ', 'ひかる きのこ', 'Glowshroom'], ['置くと 明るい', 'おくと あかるい', 'Bright when placed'], ['弓', 'ゆみ', 'Bow'],
    // ----- 生き物 -----
    ['ニワトリ', null, 'Chicken'], ['ブタ', null, 'Pig'], ['ヒツジ', null, 'Sheep'], ['ウシ', null, 'Cow'], ['ウサギ', null, 'Rabbit'], ['ネコ', null, 'Cat'], ['ヤギ', null, 'Goat'], ['カモ', null, 'Duck'], ['キツネ', null, 'Fox'], ['カメ', null, 'Turtle'],
    ['金色のシカ', 'きんいろの シカ', 'Golden Deer'], ['宝ゴブリン', 'たからゴブリン', 'Treasure Goblin'], ['なかまのオオカミ', 'なかまの オオカミ', 'Wolf Buddy'], ['地底の案内人', 'ちていの あんないにん', 'Underground Guide'], ['村人', 'むらびと', 'Villager'],
    ['ばくだんキノコ', null, 'Boom Shroom'], ['スライム', null, 'Slime'], ['ゾンビ', null, 'Zombie'], ['ガイコツ', null, 'Skeleton'], ['オオカミ', null, 'Wolf'], ['サソリ', null, 'Scorpion'], ['雪オニ', 'ゆきオニ', 'Yeti'], ['岩ゴーレム', 'いわゴーレム', 'Rock Golem'],
    ['コウモリ', null, 'Bat'], ['洞くつグモ', 'どうくつグモ', 'Cave Spider'], ['モグラ兵', 'モグラへい', 'Mole Soldier'], ['鉱石ゴーレム', 'こうせきゴーレム', 'Ore Golem'], ['炎の子', 'ほのおの こ', 'Imp'], ['溶岩スライム', 'ようがんスライム', 'Magma Slime'], ['魔眼', 'まがん', 'Evil Eye'],
    ['魔骸騎士', 'まがいきし', 'Dread Knight'], ['森のヌシ', 'もりの ヌシ', 'Forest Guardian'], ['塔の番人', 'とうの ばんにん', 'Tower Warden'], ['ファラオ', null, 'Pharaoh'], ['星の獣', 'ほしの けもの', 'Star Beast'], ['幽霊船長', 'ゆうれいせんちょう', 'Ghost Captain'],
    ['巣の女王', 'すの じょおう', 'Nest Queen'], ['水晶の巨人', 'すいしょうの きょじん', 'Crystal Giant'], ['地底湖のヌシ', 'ちていこの ヌシ', 'Lake Lord'], ['魔王ヴォルガ', 'まおう ヴォルガ', 'Demon King Volga'],
    // ----- マス -----
    ['草地', 'くさち', 'Grass'], ['雪', 'ゆき', 'Snow'], ['洞くつの床', 'どうくつの ゆか', 'Cave Floor'], ['灰の地面', 'はいの じめん', 'Ash Ground'], ['遺跡の床', 'いせきの ゆか', 'Ruin Floor'], ['魔王城の床', 'まおうじょうの ゆか', 'Castle Floor'],
    ['畑', 'はたけ', 'Farmland'], ['水', 'みず', 'Water'], ['マグマ', null, 'Magma'], ['かたい岩盤', 'かたい がんばん', 'Bedrock'], ['木', 'き', 'Tree'], ['もみの木', 'もみの き', 'Fir Tree'], ['サボテン', null, 'Cactus'],
    ['木の実のしげみ', 'きのみの しげみ', 'Berry Bush'], ['野生のにんじん', 'やせいの にんじん', 'Wild Carrot'], ['野生の麦', 'やせいの むぎ', 'Wild Wheat'], ['岩', 'いわ', 'Rock'], ['穴', 'あな', 'Hole'], ['はしご(下へ)', 'はしご(したへ)', 'Ladder (down)'],
    ['はしご(上へ)', 'はしご(うえへ)', 'Ladder (up)'], ['土のかべ', 'つちの かべ', 'Dirt Wall'], ['深部のかたい岩', 'しんぶの かたい いわ', 'Deep Hard Rock'], ['骨の山', 'ほねの やま', 'Bone Pile'], ['赤い岩', 'あかい いわ', 'Red Rock'], ['魔樹', 'まじゅ', 'Demon Tree'],
    ['魔王城のかべ', 'まおうじょうの かべ', 'Castle Wall'], ['遺跡のかべ', 'いせきの かべ', 'Ruin Wall'], ['古い宝箱', 'ふるい たからばこ', 'Old Treasure Chest'], ['にんじん畑', 'にんじんばたけ', 'Carrot Field'], ['麦畑', 'むぎばたけ', 'Wheat Field'], ['落とした荷物', 'おとした にもつ', 'Dropped Items'],
    ['深い草地', 'ふかい くさち', 'Tall Grass'], ['花畑', 'はなばたけ', 'Flowers'], ['洞窟の入口', 'どうくつの いりぐち', 'Cave Entrance'], ['巨木', 'きょぼく', 'Giant Tree'], ['塔のかべ', 'とうの かべ', 'Tower Wall'], ['ピラミッドの石', 'ピラミッドの いし', 'Pyramid Stone'],
    ['隕石', 'いんせき', 'Meteorite'], ['焼けた地面', 'やけた じめん', 'Scorched Ground'], ['船のかべ', 'ふねの かべ', 'Ship Hull'], ['帆柱', 'ほばしら', 'Mast'], ['家のかべ', 'いえの かべ', 'House Wall'], ['まものの巣', 'まものの す', 'Monster Nest'], ['若木', 'わかぎ', 'Sapling'],
    ['赤い石', 'あかい いし', 'Redstone'], ['導線', 'どうせん', 'Wire'], ['化石', 'かせき', 'Fossil'], ['宝石の結晶', 'ほうせきの けっしょう', 'Gem Crystal'], ['光る大きなきのこ', 'ひかる おおきな きのこ', 'Giant Glowshroom'], ['封印のかべ', 'ふういんの かべ', 'Sealed Wall'],
    ['階段(上へ)', 'かいだん(うえへ)', 'Stairs (up)'], ['導線つきのかべ', 'どうせんつきの かべ', 'Wired Wall'],
    // ----- 場所・階・土地 -----
    ['崩れた塔', 'くずれた とう', 'Ruined Tower'], ['砂漠のピラミッド', 'さばくの ピラミッド', 'Desert Pyramid'], ['隕石のクレーター', 'いんせきの クレーター', 'Meteor Crater'], ['難破船', 'なんぱせん', 'Shipwreck'], ['村', 'むら', 'Village'],
    ['水晶の洞窟', 'すいしょうの どうくつ', 'Crystal Cave'], ['地底湖', 'ちていこ', 'Underground Lake'], ['廃坑', 'はいこう', 'Old Mine'], ['小さな遺跡', 'ちいさな いせき', 'Small Ruin'], ['光るきのこの森', 'ひかる きのこの もり', 'Glowshroom Forest'],
    ['地底の案内人の小屋', 'ちていの あんないにんの こや', "Guide's Hut"], ['封印の宝物庫', 'ふういんの ほうもつこ', 'Sealed Vault'], ['晶洞', 'しょうどう', 'Geode'], ['大鉱脈', 'だいこうみゃく', 'Big Ore Vein'], ['モンスターハウス', null, 'Monster House'],
    ['地上', 'ちじょう', 'Surface'], ['地下 B1', 'ちか B1', 'Underground B1'], ['異世界', 'いせかい', 'Otherworld'], ['地下 B2', 'ちか B2', 'Underground B2'], ['地下 B3', 'ちか B3', 'Underground B3'], ['地下 B4', 'ちか B4', 'Underground B4'], ['地下 B5', 'ちか B5', 'Underground B5'],
    ['平原', 'へいげん', 'Plains'], ['森', 'もり', 'Forest'], ['砂漠', 'さばく', 'Desert'], ['雪原', 'せつげん', 'Snowfield'], ['山', 'やま', 'Mountain'],
    // ----- 道具の素材・部品 -----
    ['銅', 'どう', 'Copper'], ['金', 'きん', 'Gold'], ['掘るのが速い・たまに2倍とれる', 'ほるのが はやい・たまに 2ばい とれる', 'Digs fast, sometimes double'], ['鉄', 'てつ', 'Iron'], ['古代', 'こだい', 'Ancient'], ['へりにくい', null, 'Wears slowly'],
    ['炎の追加ダメージ', 'ほのおの ついかダメージ', 'Extra fire damage'], ['木の柄', 'きの え', 'Wood Handle'], ['骨の柄', 'ほねの え', 'Bone Handle'], ['耐久+40%', 'たいきゅう+40%', 'Dur +40%'], ['皮まきの柄', 'かわまきの え', 'Leather Grip'], ['攻撃+1', 'こうげき+1', 'ATK +1'],
    ['銅の柄', 'どうの え', 'Copper Handle'], ['掘る力+1・耐久+20%', 'ほる ちから+1・たいきゅう+20%', 'Dig +1, Dur +20%'], ['角の柄', 'つのの え', 'Horn Handle'], ['攻撃+2', 'こうげき+2', 'ATK +2'], ['魔樹の柄', 'まじゅの え', 'Demonwood Handle'], ['攻撃+3・耐久+10%', 'こうげき+3・たいきゅう+10%', 'ATK +3, Dur +10%'],
    ['裏地なし', 'うらじ なし', 'No lining'], ['羊毛の裏地', 'ようもうの うらじ', 'Wool Lining'], ['皮の裏地', 'かわの うらじ', 'Leather Lining'], ['守り+1', 'まもり+1', 'DEF +1'], ['糸の裏地', 'いとの うらじ', 'Silk Lining'], ['なぐられると3やり返す', 'なぐられると 3 やりかえす', 'Hits back 3 when struck'],
    ['毛皮の裏地', 'けがわの うらじ', 'Fur Lining'], ['HP+10・守り+2', 'HP+10・まもり+2', 'HP +10, DEF +2'], ['皮のつる', 'かわの つる', 'Leather String'], ['射程5', 'しゃてい5', 'Range 5'], ['糸のつる', 'いとの つる', 'Silk String'], ['射程7・攻撃+2', 'しゃてい7・こうげき+2', 'Range 7, ATK +2'],
    ['HP+15', null, 'HP +15'],
    ['剣', 'けん', 'Sword'], ['刃', 'は', 'Blade'], ['つるはし', null, 'Pickaxe'], ['頭', 'あたま', 'Head'], ['斧', 'おの', 'Axe'], ['クワ', null, 'Hoe'], ['スコップ', null, 'Shovel'], ['よろい', null, 'Armor'], ['胴', 'どう', 'Body'], ['本体', 'ほんたい', 'Frame'],
    ['宝石つき {0}', 'ほうせきつき {0}', 'Gem {0}'],
    // ----- 主人公 -----
    ['そら', null, 'Sora'], ['探検家', 'たんけんか', 'Explorer'], ['赤マント', 'あかマント', 'Red Cape'], ['鉱夫', 'こうふ', 'Miner'], ['宝さがし', 'たからさがし', 'Treasure Hunter'], ['パーカー', null, 'Hoodie'], ['剣士', 'けんし', 'Swordsman'],
    ['旅人', 'たびびと', 'Traveler'], ['さくら', null, 'Sakura'], ['ポニー', null, 'Pony'], ['ツイン', null, 'Twin'], ['ひまわり', null, 'Sunflower'], ['うみ', null, 'Umi'], ['こおり', null, 'Kori'], ['リボン', null, 'Ribbon'], ['魔法使い', 'まほうつかい', 'Wizard'],
    // ----- 村人・案内人 -----
    ['農夫', 'のうふ', 'Farmer'], ['畑の種を わけてあげよう。たまに めずらしい種も あるよ', 'はたけの たねを わけてあげよう。たまに めずらしい たねも あるよ', "I'll share some seeds. Sometimes there's a rare one!"], ['種をもらう', 'たねを もらう', 'Get seeds'],
    ['鍛冶屋', 'かじや', 'Blacksmith'], ['装備している道具を 1つ なおしてあげよう', 'そうびしている どうぐを 1つ なおしてあげよう', "I'll fix one of your equipped tools."], ['なおしてもらう', null, 'Get it fixed'],
    ['薬師', 'くすし', 'Healer'], ['薬を わけてあげよう', 'くすりを わけてあげよう', "I'll give you some medicine."], ['薬をもらう', 'くすりを もらう', 'Get medicine'],
    ['料理人', 'りょうりにん', 'Cook'], ['ごはんを 食べていきな', 'ごはんを たべていきな', 'Have something to eat!'], ['ごはんを食べる', 'ごはんを たべる', 'Eat'],
    ['僧侶', 'そうりょ', 'Priest'], ['けがを 治してあげましょう', 'けがを なおして あげましょう', "Let me heal your wounds."], ['治してもらう', 'なおしてもらう', 'Get healed'],
    ['地下で役に立つ物を わけてあげよう', 'ちかで やくに たつ ものを わけてあげよう', "I'll share something useful underground."], ['もらう', null, 'Take it'],
    // ----- 名前の組み合わせ -----
    ['{0} ×{1}', null, '{0} ×{1}'], ['+{0} {1}', null, '+{0} {1}'], ['{0} {1}/{2}', null, '{0} {1}/{2}'],
);
// 道具の名前は 素材と種類の組み合わせ(英語は「Iron Pickaxe」の順)
function i18nToolName(t) {
    if (LANG === 'ja') return null;
    const g = t.gem ? (LANG === 'en' ? 'Gem ' : 'ほうせきつき ') : '';
    if (t.k === 'armor') return g + (LANG === 'en' ? tr(BODIES[t.a].n) + ' Armor' : tr(BODIES[t.a].n) + 'の よろい');
    return g + (LANG === 'en' ? tr(HEADS[t.a].n) + ' ' + tr(TOOL_KINDS[t.k].n) : tr(HEADS[t.a].n) + 'の ' + tr(TOOL_KINDS[t.k].n));
}
