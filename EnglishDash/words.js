// 英単語リスト（学年別）。書式: "英単語|日本語"  英単語は小文字のアルファベットだけ（スペース・記号なし）
// 追加するときは、同じ学年・ほかの学年と英単語/日本語がかぶらないようにする（tools の検査で確認）
const WORD_GRADES = [
  { id: 'e3', label: '小3', full: '小学3年' },
  { id: 'e4', label: '小4', full: '小学4年' },
  { id: 'e5', label: '小5', full: '小学5年' },
  { id: 'e6', label: '小6', full: '小学6年' },
  { id: 'j1', label: '中1', full: '中学1年' },
  { id: 'j2', label: '中2', full: '中学2年' },
  { id: 'j3', label: '中3', full: '中学3年' }
];

const WORDS_RAW = {
  // 小3: 身のまわりのもの・どうぶつ・食べもの・色・数
  e3: [
    'dog|犬','cat|ねこ','bird|鳥','fish|魚','rabbit|うさぎ','monkey|さる','lion|ライオン','tiger|とら','panda|パンダ','bear|くま',
    'frog|かえる','duck|あひる','horse|馬','pig|ぶた','cow|うし','elephant|ぞう',
    'apple|りんご','banana|バナナ','orange|オレンジ','grape|ぶどう','peach|もも','melon|メロン','lemon|レモン','cake|ケーキ','milk|牛乳','egg|たまご',
    'bread|パン','rice|ごはん',
    'red|赤','blue|青','yellow|黄色','green|緑','white|白','black|黒','pink|ピンク',
    'one|1','two|2','three|3','four|4','five|5','six|6','seven|7','eight|8','nine|9','ten|10',
    'head|頭','eye|目','nose|鼻','mouth|口','ear|耳','hand|手','foot|足',
    'book|本','pen|ペン','desk|つくえ','bag|かばん','pencil|えんぴつ','eraser|消しゴム'
  ],
  // 小4: 家族・曜日・天気・食べもの・動作
  e4: [
    'mother|お母さん','father|お父さん','sister|お姉さん','brother|お兄さん','baby|赤ちゃん','friend|友だち','teacher|先生','student|生徒',
    'monday|月曜日','tuesday|火曜日','wednesday|水曜日','thursday|木曜日','friday|金曜日','saturday|土曜日','sunday|日曜日',
    'sunny|晴れ','rainy|雨の','cloudy|くもり','snowy|雪の','windy|風の強い','sun|太陽','moon|月','star|星','rain|雨','snow|雪','wind|風',
    'soup|スープ','salad|サラダ','pizza|ピザ','steak|ステーキ','sandwich|サンドイッチ','hamburger|ハンバーガー','spaghetti|スパゲッティ','juice|ジュース','tea|お茶','water|水',
    'run|走る','jump|とぶ','swim|泳ぐ','sing|歌う','dance|おどる','read|読む','write|書く','eat|食べる','drink|飲む','walk|歩く',
    'draw|えがく','play|あそぶ','cook|料理する','wash|あらう','open|開ける','close|閉める','sit|すわる','stand|立つ','sleep|ねる','clean|そうじする'
  ],
  // 小5: 場所・職業・乗りもの・学校・好きなこと
  e5: [
    'school|学校','library|図書館','park|公園','hospital|病院','station|駅','museum|博物館','zoo|動物園','shop|店','post|郵便','bank|銀行',
    'house|家','room|部屋','kitchen|台所','garden|庭','bathroom|ふろ場','door|ドア','window|窓','bed|ベッド','chair|いす','table|テーブル',
    'doctor|医者','nurse|看護師','singer|歌手','baker|パン屋さん','farmer|農家の人','pilot|パイロット','artist|芸術家','dentist|歯医者','police|警察','chef|シェフ',
    'bus|バス','train|電車','car|自動車','bike|自転車','ship|船','plane|飛行機','taxi|タクシー','boat|ボート','subway|地下鉄','truck|トラック',
    'soccer|サッカー','baseball|野球','tennis|テニス','basketball|バスケットボール','volleyball|バレーボール','swimming|水泳','judo|柔道','skiing|スキー','badminton|バドミントン','dodgeball|ドッジボール',
    'music|音楽','math|算数','science|理科','english|英語','art|図工','lunch|給食','recess|休み時間','homework|宿題','test|テスト','gym|体育館'
  ],
  // 小6: 行事・自然・世界・気持ち・きせつ
  e6: [
    'spring|春','summer|夏','autumn|秋','winter|冬','january|1月','february|2月','march|3月','april|4月','june|6月','july|7月',
    'festival|祭り','birthday|誕生日','holiday|休日','vacation|休暇','trip|旅行','picnic|ピクニック','camp|キャンプ','party|パーティー','present|プレゼント','dream|夢',
    'mountain|山','river|川','lake|みずうみ','sea|海','forest|森','island|島','beach|浜辺','field|野原','sky|空','earth|地球',
    'japan|日本','america|アメリカ','china|中国','korea|韓国','france|フランス','italy|イタリア','canada|カナダ','india|インド','brazil|ブラジル','australia|オーストラリア',
    'happy|うれしい','sad|悲しい','angry|おこった','tired|つかれた','hungry|おなかがすいた','sleepy|ねむい','excited|わくわくした','scared|こわがった','kind|親切な','strong|強い',
    'beautiful|美しい','delicious|おいしい','famous|有名な','popular|人気のある','special|特別な','useful|役に立つ','important|大切な','difficult|難しい','interesting|おもしろい','wonderful|すばらしい'
  ],
  // 中1: 基本の動詞・形容詞・名詞
  j1: [
    'answer|答え','ask|たずねる','begin|始める','bring|持ってくる','busy|いそがしい','buy|買う','carry|運ぶ','catch|つかまえる','child|子ども','city|都市',
    'climb|登る','cold|寒い','collect|集める','country|国','cry|泣く','dinner|夕食','early|早い','easy|簡単な','enjoy|楽しむ','every|すべての',
    'farm|農場','fast|速い','favorite|お気に入りの','find|見つける','finish|終える','forget|忘れる','give|与える','gentle|やさしい','huge|巨大な','hard|かたい',
    'help|助ける','hobby|趣味','hurry|急ぐ','idea|考え','join|参加する','keep|保つ','know|知っている','late|おそい','learn|学ぶ','leave|出発する',
    'listen|聞く','live|住む','look|見る','make|作る','many|たくさんの','meet|会う','morning|朝','move|動く','name|名前','need|必要とする',
    'new|新しい','night|夜','number|数','often|しばしば','old|古い','people|人々','picture|絵','place|場所','practice|練習する','put|置く',
    'question|質問','quick|すばやい','remember|覚えている','right|右','road|道','short|短い','show|見せる','small|小さい','speak|話す','start|始まる',
    'stop|止まる','story|物語','study|勉強する','tell|伝える','think|思う','today|今日','tomorrow|明日','town|町','try|試す',
    'use|使う','visit|訪れる','wait|待つ','want|ほしい','watch|じっと見る','week|週','weekend|週末','work|働く','year|年'
  ],
  // 中2: 発展の動詞・形容詞・名詞
  j2: [
    'accept|受け入れる','agree|賛成する','allow|許す','amazing|驚くべき','ancient|古代の','attend|出席する','beauty|美','believe|信じる','borrow|借りる','branch|枝',
    'cancel|取り消す','celebrate|祝う','century|世紀','challenge|挑戦','character|性格','choose|選ぶ','comfortable|快適な','compare|比べる','complete|完成させる','contest|コンテスト',
    'continue|続ける','correct|正しい','create|創造する','culture|文化','customer|客','decide|決める','describe|描写する','develop|発展させる','different|ちがった','discover|発見する',
    'divide|分ける','double|2倍の','during|のあいだ','education|教育','either|どちらか','enough|十分な','environment|環境','exchange|交換する','exciting|わくわくさせる','experience|経験',
    'explain|説明する','foreign|外国の','future|未来','gather|集まる','general|一般的な','history|歴史','imagine|想像する','invite|招待する','message|伝言','mistake|まちがい',
    'neighbor|隣人','notice|気づく','offer|申し出る','paint|絵の具','perform|演じる','prepare|準備する','problem|問題','protect|守る','receive|受け取る','repeat|くり返す',
    'return|戻る','review|復習する','safe|安全な','save|救う','share|分け合う','simple|単純な','smile|ほほえむ','sound|音','succeed|成功する','surprise|驚き',
    'travel|旅する','trouble|困りごと','understand|理解する','village|村','volunteer|ボランティア','wonder|不思議に思う','worry|心配する','tradition|伝統'
  ],
  // 中3: 受験・長文でよく出る語
  j3: [
    'achieve|達成する','advice|助言','affect|影響する','ability|能力','absent|欠席の','according|よれば','activity|活動','addition|追加','advantage|利点','against|に反対して',
    'although|だけれども','amount|量','analysis|分析','announce|発表する','appear|現れる','arrange|整える','article|記事','atmosphere|雰囲気','attention|注意','audience|観客',
    'average|平均','balance|バランス','benefit|利益','boundary|境界','broadcast|放送する','calm|落ち着いた','capital|首都','career|経歴','cause|原因','certain|確かな',
    'chance|機会','climate|気候','communicate|伝え合う','community|地域社会','condition|状態','confident|自信のある','connect|つなぐ','consider|よく考える','contain|ふくむ','conversation|会話',
    'courage|勇気','crowd|群衆','damage|損害','dangerous|危険な','decision|決定','demand|要求','depend|頼る','design|設計','destroy|破壊する','disaster|災害',
    'distance|距離','economy|経済','effort|努力','emergency|緊急','energy|エネルギー','entire|全体の','equal|等しい','escape|逃げる','event|出来事','evidence|証拠',
    'expect|期待する','freedom|自由','government|政府','guess|推測する','habit|習慣','improve|改善する','include|含む','increase|増える','influence|影響','information|情報',
    'justice|正義','knowledge|知識','language|言語','mention|言及する','nature|自然','opinion|意見','peace|平和','prevent|防ぐ','purpose|目的','society|社会'
  ]
};

// 追加分(words_more_*.js)を合流する。書式 "英|日" または "英|日|よみ"。形式がおかしい行・英単語の重複は読み込み時に捨てる
const WORDS = {};
const _seenEn = {};
function _addWord(gid, en, ja, yomi) {
    if (!/^[a-z]+$/.test(en) || !ja || _seenEn[en]) return;
    _seenEn[en] = 1;
    const w = { en: en, ja: ja };
    if (yomi) w.yomi = yomi;
    WORDS[gid].push(w);
}
WORD_GRADES.forEach(g => {
    WORDS[g.id] = [];
    (WORDS_RAW[g.id] || []).forEach(s => { const p = s.split('|'); if (p.length === 2) _addWord(g.id, p[0], p[1]); });
});
[typeof WORDS_MORE_E !== 'undefined' ? WORDS_MORE_E : {}, typeof WORDS_MORE_J1 !== 'undefined' ? WORDS_MORE_J1 : {},
 typeof WORDS_MORE_J2 !== 'undefined' ? WORDS_MORE_J2 : {}, typeof WORDS_MORE_J3 !== 'undefined' ? WORDS_MORE_J3 : {}].forEach(more => {
    WORD_GRADES.forEach(g => {
        if (!more[g.id]) return;
        more[g.id].trim().split(/\s+/).forEach(tok => { const p = tok.split('|'); if (p.length === 2 || p.length === 3) _addWord(g.id, p[0], p[1], p[2]); });
    });
});

// 日本語ヒントの区別(words_fix.js)を反映し、「どれを打っても正解」の組(WORD_ALTS: 英単語 -> 受けつける別の英単語)を作る
const WORD_ALTS = {};
(function () {
    if (typeof WORD_FIX !== 'undefined') {
        WORD_GRADES.forEach(g => WORDS[g.id].forEach(w => { const f = WORD_FIX[w.en]; if (f) { if (f.ja) w.ja = f.ja; if (f.yomi) w.yomi = f.yomi; } }));
    }
    const has = {}; WORD_GRADES.forEach(g => WORDS[g.id].forEach(w => { has[w.en] = 1; }));
    const add = (a, b) => { if (a === b || !has[a] || !has[b]) return; (WORD_ALTS[a] = WORD_ALTS[a] || []); if (WORD_ALTS[a].indexOf(b) < 0) WORD_ALTS[a].push(b); };
    if (typeof ALT_GROUPS !== 'undefined') ALT_GROUPS.forEach(gr => gr.forEach(a => gr.forEach(b => add(a, b))));
    if (typeof ALT_ONEWAY !== 'undefined') Object.keys(ALT_ONEWAY).forEach(a => ALT_ONEWAY[a].forEach(b => add(a, b)));
})();
