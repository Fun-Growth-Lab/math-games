// 追加の英単語（小学校 小3〜小6）。書式: "英単語|日本語" または "英単語|日本語|ひらがなの読み"（日本語に漢字・数字がある語は読みを付ける）
// 空白で区切る。日本語・読みの中に空白は入れない。英単語は小文字のアルファベットだけ。
const WORDS_MORE_E = {
  e3: `
sheep|ひつじ squirrel|りす penguin|ペンギン giraffe|キリン zebra|シマウマ koala|コアラ kangaroo|カンガルー snake|へび turtle|かめ mouse|ねずみ
butterfly|ちょうちょう bee|みつばち whale|くじら dolphin|イルカ shark|サメ crab|かに owl|ふくろう chick|ひよこ goat|やぎ deer|しか wolf|おおかみ fox|きつね
strawberry|いちご tomato|トマト potato|じゃがいも carrot|にんじん onion|たまねぎ cucumber|きゅうり pumpkin|かぼちゃ corn|とうもろこし cherry|さくらんぼ
pineapple|パイナップル watermelon|すいか pudding|プリン candy|あめ cookie|クッキー chocolate|チョコレート cheese|チーズ sushi|すし curry|カレー
purple|むらさき brown|茶色|ちゃいろ gray|灰色|はいいろ gold|金色|きんいろ silver|銀色|ぎんいろ
eleven|11|じゅういち twelve|12|じゅうに thirteen|13|じゅうさん fourteen|14|じゅうよん fifteen|15|じゅうご sixteen|16|じゅうろく
seventeen|17|じゅうなな eighteen|18|じゅうはち nineteen|19|じゅうきゅう twenty|20|にじゅう
hello|こんにちは goodbye|さようなら thanks|ありがとう sorry|ごめんなさい yes|はい no|いいえ please|おねがいします
hair|かみの毛|かみのけ face|顔|かお arm|うで finger|指|ゆび knee|ひざ shoulder|かた neck|首|くび tooth|歯|は stomach|おなか back|せなか
scissors|はさみ glue|のり notebook|ノート crayon|クレヨン ruler|定規|じょうぎ clock|とけい ball|ボール doll|人形|にんぎょう toy|おもちゃ box|はこ cup|カップ
spoon|スプーン fork|フォーク knife|ナイフ bottle|びん umbrella|かさ shoes|くつ shirt|シャツ skirt|スカート pants|ズボン hat|ぼうし socks|くつした
`,
  e4: `
grandmother|おばあさん grandfather|おじいさん aunt|おば uncle|おじ cousin|いとこ family|家族|かぞく parents|両親|りょうしん
boy|男の子|おとこのこ girl|女の子|おんなのこ man|男の人|おとこのひと woman|女の人|おんなのひと king|王様|おうさま queen|女王|じょおう prince|王子|おうじ princess|お姫様|おひめさま
yesterday|きのう afternoon|午後|ごご evening|夕方|ゆうがた time|時間|じかん
hot|あつい warm|あたたかい cool|かっこいい cloud|くも storm|あらし thunder|かみなり typhoon|台風|たいふう
big|大きい|おおきい tall|背が高い|せがたかい long|長い|ながい slow|ゆっくりした young|若い|わかい cute|かわいい thirsty|のどがかわいた nice|すてきな good|よい bad|悪い|わるい
funny|おかしい dirty|よごれた heavy|重い|おもい light|軽い|かるい soft|やわらかい sweet|あまい sour|すっぱい salty|塩からい|しおからい bitter|にがい spicy|からい
go|行く|いく come|来る|くる have|持っている|もっている like|好き|すき love|愛する|あいする say|言う|いう call|呼ぶ|よぶ kick|ける hit|打つ|うつ push|押す|おす pull|引く|ひく
fly|空を飛ぶ|そらをとぶ ride|乗る|のる wake|起きる|おきる brush|みがく wear|着る|きる take|取る|とる laugh|笑う|わらう throw|投げる|なげる cut|切る|きる
breakfast|朝食|ちょうしょく snack|おやつ meat|肉|にく vegetable|野菜|やさい fruit|くだもの butter|バター jam|ジャム honey|はちみつ sugar|砂糖|さとう salt|塩|しお coffee|コーヒー bean|豆|まめ
circle|丸|まる square|四角|しかく triangle|三角|さんかく heart|ハート
`,
  e5: `
castle|お城|おしろ temple|お寺|おてら shrine|神社|じんじゃ tower|塔|とう bridge|橋|はし supermarket|スーパーマーケット restaurant|レストラン cafe|カフェ
bookstore|本屋|ほんや florist|花屋|はなや aquarium|水族館|すいぞくかん stadium|スタジアム airport|空港|くうこう harbor|港|みなと hotel|ホテル theater|映画館|えいがかん
pool|プール playground|遊び場|あそびば classroom|教室|きょうしつ office|事務所|じむしょ street|通り|とおり corner|角|かど world|世界|せかい
driver|運転手|うんてんしゅ scientist|科学者|かがくしゃ astronaut|宇宙飛行士|うちゅうひこうし firefighter|消防士|しょうぼうし vet|獣医|じゅうい carpenter|大工|だいく clerk|店員|てんいん
player|選手|せんしゅ writer|作家|さっか actor|俳優|はいゆう comedian|お笑い芸人|おわらいげいにん programmer|プログラマー designer|デザイナー photographer|写真家|しゃしんか pianist|ピアニスト
helicopter|ヘリコプター rocket|ロケット motorcycle|オートバイ ambulance|救急車|きゅうきゅうしゃ balloon|風船|ふうせん wheel|車輪|しゃりん
rugby|ラグビー golf|ゴルフ skating|スケート marathon|マラソン karate|空手|からて kendo|剣道|けんどう sumo|相撲|すもう archery|アーチェリー cycling|サイクリング surfing|サーフィン
snowboard|スノーボード gymnastics|体操|たいそう boxing|ボクシング hockey|ホッケー jogging|ジョギング hiking|ハイキング fishing|つり
subject|教科|きょうか lesson|授業|じゅぎょう class|クラス blackboard|黒板|こくばん textbook|教科書|きょうかしょ dictionary|辞書|じしょ map|地図|ちず chalk|チョーク locker|ロッカー
uniform|制服|せいふく club|クラブ team|チーム schoolyard|校庭|こうてい timetable|時間割|じかんわり score|得点|とくてん goal|ゴール
sofa|ソファー television|テレビ computer|コンピューター telephone|電話|でんわ lamp|ランプ mirror|鏡|かがみ towel|タオル toilet|トイレ stairs|階段|かいだん floor|ゆか wall|かべ roof|屋根|やね
curtain|カーテン refrigerator|れいぞうこ oven|オーブン shower|シャワー camera|カメラ key|かぎ radio|ラジオ piano|ピアノ guitar|ギター violin|バイオリン drum|たいこ flute|フルート trumpet|トランペット
song|歌|うた game|ゲーム movie|映画|えいが comic|まんが magazine|雑誌|ざっし newspaper|新聞|しんぶん letter|手紙|てがみ card|カード ticket|切符|きっぷ
`,
  e6: `
may|5月|ごがつ august|8月|はちがつ september|9月|くがつ october|10月|じゅうがつ november|11月|じゅういちがつ december|12月|じゅうにがつ
tree|木|き flower|花|はな grass|草|くさ leaf|葉|は rock|岩|いわ stone|石|いし sand|砂|すな wave|波|なみ rainbow|にじ volcano|火山|かざん desert|砂漠|さばく
jungle|ジャングル waterfall|滝|たき pond|池|いけ ocean|大洋|たいよう planet|惑星|わくせい space|宇宙|うちゅう sunrise|日の出|ひので sunset|夕日|ゆうひ
england|イギリス germany|ドイツ spain|スペイン russia|ロシア egypt|エジプト peru|ペルー thailand|タイ vietnam|ベトナム singapore|シンガポール mexico|メキシコ
turkey|トルコ greece|ギリシャ kenya|ケニア asia|アジア europe|ヨーロッパ africa|アフリカ tokyo|東京|とうきょう osaka|大阪|おおさか kyoto|京都|きょうと
hokkaido|北海道|ほっかいどう okinawa|沖縄|おきなわ fuji|富士山|ふじさん
sportsday|運動会|うんどうかい concert|コンサート speech|スピーチ performance|発表|はっぴょう graduation|卒業|そつぎょう fireworks|花火|はなび christmas|クリスマス halloween|ハロウィン
memory|思い出|おもいで adventure|冒険|ぼうけん treasure|宝物|たからもの magic|魔法|まほう secret|ひみつ friendship|友情|ゆうじょう wish|願い|ねがい hope|希望|きぼう
proud|ほこりに思う|ほこりにおもう nervous|きんちょうした surprised|おどろいた lonely|さびしい brave|勇敢な|ゆうかんな shy|はずかしがりの friendly|親しみやすい|したしみやすい
clever|かしこい honest|正直な|しょうじきな polite|れいぎ正しい|れいぎただしい careful|注意深い|ちゅういぶかい lucky|運がいい|うんがいい quiet|静かな|しずかな noisy|うるさい
rich|金持ちの|かねもちの poor|貧しい|まずしい
lunchbox|お弁当|おべんとう dessert|デザート recipe|レシピ menu|メニュー stamp|切手|きって cooking|料理|りょうり reading|読書|どくしょ shopping|買い物|かいもの
left|左|ひだり straight|まっすぐ turn|曲がる|まがる next|次の|つぎの near|近い|ちかい far|遠い|とおい front|前|まえ behind|うしろ up|上へ|うえへ down|下へ|したへ
north|北|きた south|南|みなみ east|東|ひがし west|西|にし
minute|分|ふん second|秒|びょう usually|ふつう sometimes|ときどき never|けっして〜ない once|一度|いちど twice|二度|にど tonight|今夜|こんや
thirty|30|さんじゅう forty|40|よんじゅう fifty|50|ごじゅう sixty|60|ろくじゅう seventy|70|ななじゅう eighty|80|はちじゅう ninety|90|きゅうじゅう hundred|100|ひゃく thousand|1000|せん
yen|円(お金)|えん(おかね) dollar|ドル money|お金|おかね price|ねだん cheap|安い|やすい expensive|高い|たかい
`
};
