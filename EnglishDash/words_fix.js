// 答えが1つに決まらない問題への対策データ。
//  1) WORD_FIX: 同じ読み・同じ意味に見える「日本語のヒント」を、区別できる形に直す（英単語 -> {ja, yomi}）
//  2) ALT_GROUPS: どれを打っても正解にする「同じ意味の英単語」の組（たがいに正解）
//  3) ALT_ONEWAY: 左の単語の出題で、右の単語も正解にする（一方向）
const WORD_FIX = {
  statue: { ja: '銅像', yomi: 'どうぞう' },
  position: { ja: '位置(場所)', yomi: 'いち(ばしょ)' },
  nose: { yomi: 'はな(かお)' }, flower: { yomi: 'はな(くさばな)' },
  candy: { ja: 'キャンディー' },
  tooth: { yomi: 'は(くちの)' }, leaf: { yomi: 'は(きの)' },
  ocean: { ja: '海洋', yomi: 'かいよう' },
  hot: { ja: '暑い', yomi: 'あつい(てんき)' }, thick: { yomi: 'あつい(ぶあつい)' },
  wear: { yomi: 'きる(ふくを)' }, cut: { yomi: 'きる(はさみで)' },
  emperor: { yomi: 'こうてい(おうさま)' },
  leather: { yomi: 'かわ(かばんの)' },
  line: { yomi: 'せん(ひく)' },
  year: { ja: '1年', yomi: 'いちねん' },
  climb: { yomi: 'のぼる(やま)' }, rise: { ja: '昇る', yomi: 'のぼる(たいよう)' },
  early: { yomi: 'はやい(じかん)' }, fast: { yomi: 'はやい(スピード)' },
  state: { yomi: 'しゅう(アメリカの)' },
  fix: { yomi: 'なおす(こわれを)' }, cure: { yomi: 'なおす(びょうきを)' },
  fold: { yomi: 'おる(おりがみ)' }, weave: { yomi: 'おる(はた)' },
  forgive: { ja: 'ゆるす(わるいことを)', yomi: 'ゆるす(わるいことを)' }, allow: { ja: '許す(してよい)', yomi: 'ゆるす(してよい)' },
  regret: { yomi: 'こうかいする(くやむ)' }, sail: { yomi: 'こうかいする(ふねで)' },
  coin: { yomi: 'こうか(おかね)' }, effect: { yomi: 'こうか(ききめ)' },
  machine: { yomi: 'きかい(どうぐ)' }, chance: { yomi: 'きかい(チャンス)' },
  seat: { yomi: 'せき(すわる)' }, cough: { ja: 'せき(ごほん)' },
  while: { ja: '〜するあいだ', yomi: '〜するあいだ' }, during: { ja: '〜のあいだ(きかん)', yomi: '〜のあいだ(きかん)' },
  create: { yomi: 'そうぞうする(つくる)' }, imagine: { yomi: 'そうぞうする(おもいうかべる)' },
  boundary: { yomi: 'きょうかい(さかい)' },
  contain: { ja: '中に入っている', yomi: 'なかにはいっている' },
  expensive: { ja: 'ねだんが高い', yomi: 'ねだんがたかい' }, high: { ja: '位置が高い', yomi: 'いちがたかい' },
  large: { ja: '大型の', yomi: 'おおがたの' }
};

// たがいに正解になる組（同じ意味で使える英単語）
const ALT_GROUPS = [
  ['begin', 'start'], ['fast', 'quick'], ['big', 'large'], ['easy', 'simple'], ['sick', 'illness'], ['normal', 'standard'],
  ['look', 'watch'], ['fix', 'repair'], ['contain', 'include'], ['while', 'during'], ['kind', 'gentle'], ['clever', 'smart'],
  ['mistake', 'error'], ['trip', 'journey'], ['present', 'gift'], ['reply', 'answer'], ['protect', 'defend']
];
// 左を出題したとき、右も正解にする（一方向）
const ALT_ONEWAY = { huge: ['big', 'large'], tiny: ['small', 'little'], little: ['small'] };
