// 「かんたんなにほんご」用: 漢字・数字をふくむ日本語の「ひらがな」の読み。書式: "英単語:よみ"（スペース区切り）
// ここに無い語は、日本語の表示をそのまま使う（ひらがな・カタカナだけの語）
const EASY_READINGS_RAW = `
dog:いぬ bird:とり fish:さかな horse:うま milk:ぎゅうにゅう red:あか blue:あお yellow:きいろ green:みどり white:しろ black:くろ
one:いち two:に three:さん four:よん five:ご six:ろく seven:なな eight:はち nine:きゅう ten:じゅう
head:あたま eye:め nose:はな mouth:くち ear:みみ hand:て foot:あし book:ほん eraser:けしゴム
mother:おかあさん father:おとうさん sister:おねえさん brother:おにいさん baby:あかちゃん friend:ともだち teacher:せんせい student:せいと
monday:げつようび tuesday:かようび wednesday:すいようび thursday:もくようび friday:きんようび saturday:どようび sunday:にちようび
sunny:はれ rainy:あめの snowy:ゆきの windy:かぜのつよい sun:たいよう moon:つき star:ほし rain:あめ snow:ゆき wind:かぜ tea:おちゃ water:みず
run:はしる swim:およぐ sing:うたう read:よむ write:かく eat:たべる drink:のむ walk:あるく cook:りょうりする open:あける close:しめる stand:たつ
school:がっこう library:としょかん park:こうえん hospital:びょういん station:えき museum:はくぶつかん zoo:どうぶつえん shop:みせ post:ゆうびん bank:ぎんこう
house:いえ room:へや kitchen:だいどころ garden:にわ bathroom:ふろば window:まど
doctor:いしゃ nurse:かんごし singer:かしゅ baker:パンやさん farmer:のうかのひと artist:げいじゅつか dentist:はいしゃ police:けいさつ
train:でんしゃ car:じどうしゃ bike:じてんしゃ ship:ふね plane:ひこうき subway:ちかてつ
baseball:やきゅう swimming:すいえい judo:じゅうどう music:おんがく math:さんすう science:りか english:えいご art:ずこう lunch:きゅうしょく
recess:やすみじかん homework:しゅくだい gym:たいいくかん
spring:はる summer:なつ autumn:あき winter:ふゆ january:いちがつ february:にがつ march:さんがつ april:しがつ june:ろくがつ july:しちがつ
festival:おまつり birthday:たんじょうび holiday:きゅうじつ vacation:きゅうか trip:りょこう dream:ゆめ
mountain:やま river:かわ sea:うみ forest:もり island:しま beach:はまべ field:のはら sky:そら earth:ちきゅう
japan:にほん china:ちゅうごく korea:かんこく
sad:かなしい kind:しんせつな strong:つよい beautiful:うつくしい famous:ゆうめいな popular:にんきのある special:とくべつな useful:やくにたつ
important:たいせつな difficult:むずかしい
answer:こたえ begin:はじめる bring:もってくる buy:かう carry:はこぶ child:こども city:とし climb:のぼる cold:さむい collect:あつめる country:くに cry:なく
dinner:ゆうしょく early:はやい easy:かんたんな enjoy:たのしむ farm:のうじょう fast:はやい favorite:おきにいりの find:みつける finish:おえる forget:わすれる
give:あたえる huge:きょだいな help:たすける hobby:しゅみ hurry:いそぐ idea:かんがえ join:さんかする keep:たもつ know:しっている learn:まなぶ leave:しゅっぱつする
listen:きく live:すむ look:みる make:つくる meet:あう morning:あさ move:うごく name:なまえ need:ひつようとする new:あたらしい night:よる number:かず old:ふるい
people:ひとびと picture:え place:ばしょ practice:れんしゅうする put:おく question:しつもん remember:おぼえている right:みぎ road:みち short:みじかい show:みせる
small:ちいさい speak:はなす start:はじまる stop:とまる story:ものがたり study:べんきょうする tell:つたえる think:おもう today:きょう tomorrow:あした town:まち
try:ためす use:つかう visit:おとずれる wait:まつ watch:じっとみる week:しゅう weekend:しゅうまつ work:はたらく year:とし
accept:うけいれる agree:さんせいする allow:ゆるす amazing:おどろくべき ancient:こだいの attend:しゅっせきする beauty:び believe:しんじる borrow:かりる branch:えだ
cancel:とりけす celebrate:いわう century:せいき challenge:ちょうせん character:せいかく choose:えらぶ comfortable:かいてきな compare:くらべる complete:かんせいさせる
continue:つづける correct:ただしい create:そうぞうする culture:ぶんか customer:きゃく decide:きめる describe:びょうしゃする develop:はってんさせる discover:はっけんする
divide:わける double:にばいの education:きょういく enough:じゅうぶんな environment:かんきょう exchange:こうかんする experience:けいけん explain:せつめいする
foreign:がいこくの future:みらい gather:あつまる general:いっぱんてきな history:れきし imagine:そうぞうする invite:しょうたいする message:でんごん neighbor:りんじん
notice:きづく offer:もうしでる paint:えのぐ perform:えんじる prepare:じゅんびする problem:もんだい protect:まもる receive:うけとる repeat:くりかえす return:もどる
review:ふくしゅうする safe:あんぜんな save:すくう share:わけあう simple:たんじゅんな sound:おと succeed:せいこうする surprise:おどろき travel:たびする
trouble:こまりごと understand:りかいする village:むら wonder:ふしぎにおもう worry:しんぱいする tradition:でんとう
achieve:たっせいする advice:じょげん affect:えいきょうする ability:のうりょく absent:けっせきの activity:かつどう addition:ついか advantage:りてん against:にはんたいして
amount:りょう analysis:ぶんせき announce:はっぴょうする appear:あらわれる arrange:ととのえる article:きじ atmosphere:ふんいき attention:ちゅうい audience:かんきゃく
average:へいきん benefit:りえき boundary:きょうかい broadcast:ほうそうする calm:おちついた capital:しゅと career:けいれき cause:げんいん certain:たしかな chance:きかい
climate:きこう communicate:つたえあう community:ちいきしゃかい condition:じょうたい confident:じしんのある consider:よくかんがえる conversation:かいわ courage:ゆうき
crowd:ぐんしゅう damage:そんがい dangerous:きけんな decision:けってい demand:ようきゅう depend:たよる design:せっけい destroy:はかいする disaster:さいがい distance:きょり
economy:けいざい effort:どりょく emergency:きんきゅう entire:ぜんたいの equal:ひとしい escape:にげる event:できごと evidence:しょうこ expect:きたいする freedom:じゆう
government:せいふ guess:すいそくする habit:しゅうかん improve:かいぜんする include:ふくむ increase:ふえる influence:えいきょう information:じょうほう justice:せいぎ
knowledge:ちしき language:げんご mention:げんきゅうする nature:しぜん opinion:いけん peace:へいわ prevent:ふせぐ purpose:もくてき society:しゃかい
`;
const EASY_READINGS = {};
EASY_READINGS_RAW.trim().split(/\s+/).forEach(p => { const i = p.indexOf(':'); if (i > 0) EASY_READINGS[p.slice(0, i)] = p.slice(i + 1); });
