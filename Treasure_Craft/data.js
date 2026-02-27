// data.js
// 『トレジャー＆クラフト　～7つの秘境と幻の竜～』 データ定義ファイル

// -------------------------------------------------------------
// 1. 探索場所（ステージ）データ
// -------------------------------------------------------------
const STAGES = [
    { lv: 1, name: "はじまりの森", apCost: 5 },
    { lv: 2, name: "銅の鉱山", apCost: 10 },
    { lv: 3, name: "鉄の岩壁", apCost: 15 },
    { lv: 4, name: "銀の廃都", apCost: 20 },
    { lv: 5, name: "黄金の神殿", apCost: 25 },
    { lv: 6, name: "天空の砦", apCost: 30 },
    { lv: 7, name: "竜の火口", apCost: 35 }
];

// -------------------------------------------------------------
// 2. アイテム種類（カテゴリ）定義
// -------------------------------------------------------------
const ITEM_TYPES = {
    WEAPON: 1,     // 武器
    SHIELD: 2,     // 盾
    ARMOR: 3,      // 鎧（服）
    ACCESSORY: 4,  // 装飾品
    POTION: 5,     // 薬
    PROCESSED: 6,  // 加工済み素材 (合成材料)
    RAW: 7,        // 未加工素材 (精錬・研磨材料)
    TRASH: 8,      // 拾得物 (換金専用)
    PART: 9,       // 共通パーツ (お店で購入)
    RECIPE: 10     // レシピ (お店で購入)
};

// -------------------------------------------------------------
// 3. アイテムデータ
// プロパティ: id, lv(必要/出現Lv), name(名前), type(種類ID), stat(ステータス値), price(売値/買値基準), prob(出現確率ウェイト)
// -------------------------------------------------------------
const ITEMS = [
    // --- Lv0: 共通パーツ (お店専用) ---
    { id: 1, lv: 0, name: "棒", type: 9, stat: 0, price: 10, prob: 0 },
    { id: 2, lv: 0, name: "ひも", type: 9, stat: 0, price: 10, prob: 0 },
    { id: 3, lv: 0, name: "布", type: 9, stat: 0, price: 20, prob: 0 },
    { id: 4, lv: 0, name: "指輪", type: 9, stat: 0, price: 30, prob: 0 },
    { id: 5, lv: 0, name: "水", type: 9, stat: 0, price: 5, prob: 0 },

    // --- Lv1: はじまりの森 ---
    { id: 6, lv: 1, name: "木", type: 7, stat: 0, price: 15, prob: 10 },
    { id: 7, lv: 1, name: "木の剣", type: 1, stat: 5, price: 60, prob: 0 },
    { id: 8, lv: 1, name: "木の盾", type: 2, stat: 5, price: 30, prob: 0 },
    { id: 9, lv: 1, name: "木の胸当て", type: 3, stat: 5, price: 90, prob: 0 },
    { id: 10, lv: 1, name: "きれいな石", type: 7, stat: 0, price: 20, prob: 4 },
    { id: 11, lv: 1, name: "石の指輪", type: 4, stat: 3, price: 100, prob: 0 },
    { id: 12, lv: 1, name: "薬草", type: 7, stat: 0, price: 10, prob: 8 },
    { id: 13, lv: 1, name: "初級ポーション", type: 5, stat: 0, price: 30, prob: 0 },
    { id: 14, lv: 1, name: "どんぐり", type: 8, stat: 0, price: 3, prob: 10 },
    { id: 15, lv: 1, name: "虫の抜け殻", type: 8, stat: 0, price: 4, prob: 9 },
    { id: 16, lv: 1, name: "枯れ枝", type: 8, stat: 0, price: 4, prob: 9 },
    { id: 17, lv: 1, name: "丸い石", type: 8, stat: 0, price: 5, prob: 8 },
    { id: 18, lv: 1, name: "綺麗な花", type: 8, stat: 0, price: 6, prob: 7 },
    { id: 19, lv: 1, name: "つる", type: 8, stat: 0, price: 7, prob: 6 },
    { id: 20, lv: 1, name: "硬い実", type: 8, stat: 0, price: 8, prob: 5 },
    { id: 21, lv: 1, name: "派手な羽根", type: 8, stat: 0, price: 12, prob: 3 },
    { id: 22, lv: 1, name: "キノコ", type: 8, stat: 0, price: 15, prob: 2 },
    { id: 23, lv: 1, name: "薬草の根", type: 8, stat: 0, price: 25, prob: 1 },

    // --- Lv2: 銅の鉱山 ---
    { id: 24, lv: 2, name: "銅鉱石", type: 7, stat: 0, price: 20, prob: 10 },
    { id: 25, lv: 2, name: "銅", type: 6, stat: 0, price: 50, prob: 0 },
    { id: 26, lv: 2, name: "銅の剣", type: 1, stat: 15, price: 200, prob: 0 },
    { id: 27, lv: 2, name: "銅の盾", type: 2, stat: 15, price: 100, prob: 0 },
    { id: 28, lv: 2, name: "銅の鎧", type: 3, stat: 15, price: 300, prob: 0 },
    { id: 29, lv: 2, name: "アメジスト原石", type: 7, stat: 0, price: 50, prob: 4 },
    { id: 30, lv: 2, name: "アメジスト", type: 6, stat: 0, price: 120, prob: 0 },
    { id: 31, lv: 2, name: "紫水晶の指輪", type: 4, stat: 10, price: 350, prob: 0 },
    { id: 32, lv: 2, name: "苦い草", type: 7, stat: 0, price: 20, prob: 8 },
    { id: 33, lv: 2, name: "毒消しポーション", type: 5, stat: 0, price: 80, prob: 0 },
    { id: 34, lv: 2, name: "石炭", type: 8, stat: 0, price: 10, prob: 10 },
    { id: 35, lv: 2, name: "粘土", type: 8, stat: 0, price: 12, prob: 9 },
    { id: 36, lv: 2, name: "鉄さび", type: 8, stat: 0, price: 12, prob: 9 },
    { id: 37, lv: 2, name: "湿った苔", type: 8, stat: 0, price: 15, prob: 8 },
    { id: 38, lv: 2, name: "銅のクズ", type: 8, stat: 0, price: 18, prob: 7 },
    { id: 39, lv: 2, name: "岩塩", type: 8, stat: 0, price: 20, prob: 6 },
    { id: 40, lv: 2, name: "発火石", type: 8, stat: 0, price: 25, prob: 5 },
    { id: 41, lv: 2, name: "コウモリの翼", type: 8, stat: 0, price: 35, prob: 3 },
    { id: 42, lv: 2, name: "土竜の爪", type: 8, stat: 0, price: 40, prob: 2 },
    { id: 43, lv: 2, name: "掘り出し物", type: 8, stat: 0, price: 80, prob: 1 },

    // --- Lv3: 鉄の岩壁 ---
    { id: 44, lv: 3, name: "鉄鉱石", type: 7, stat: 0, price: 60, prob: 9 },
    { id: 45, lv: 3, name: "鉄", type: 6, stat: 0, price: 150, prob: 0 },
    { id: 46, lv: 3, name: "鉄の剣", type: 1, stat: 40, price: 600, prob: 0 },
    { id: 47, lv: 3, name: "鉄の盾", type: 2, stat: 40, price: 300, prob: 0 },
    { id: 48, lv: 3, name: "鉄の鎧", type: 3, stat: 40, price: 900, prob: 0 },
    { id: 49, lv: 3, name: "サファイア原石", type: 7, stat: 0, price: 150, prob: 4 },
    { id: 50, lv: 3, name: "サファイア", type: 6, stat: 0, price: 350, prob: 0 },
    { id: 51, lv: 3, name: "蒼玉の指輪", type: 4, stat: 30, price: 1000, prob: 0 },
    { id: 52, lv: 3, name: "光る草", type: 7, stat: 0, price: 60, prob: 8 },
    { id: 53, lv: 3, name: "中級ポーション", type: 5, stat: 0, price: 250, prob: 0 },
    { id: 54, lv: 3, name: "灰色の砂", type: 8, stat: 0, price: 25, prob: 10 },
    { id: 55, lv: 3, name: "重い石", type: 8, stat: 0, price: 30, prob: 9 },
    { id: 56, lv: 3, name: "削れた角", type: 8, stat: 0, price: 30, prob: 9 },
    { id: 57, lv: 3, name: "頑丈な骨", type: 8, stat: 0, price: 40, prob: 8 },
    { id: 58, lv: 3, name: "鉄の破片", type: 8, stat: 0, price: 50, prob: 7 },
    { id: 59, lv: 3, name: "山鳥の卵", type: 8, stat: 0, price: 60, prob: 6 },
    { id: 60, lv: 3, name: "トカゲの尾", type: 8, stat: 0, price: 70, prob: 5 },
    { id: 61, lv: 3, name: "磁石石", type: 8, stat: 0, price: 100, prob: 3 },
    { id: 62, lv: 3, name: "鋭い牙", type: 8, stat: 0, price: 120, prob: 2 },
    { id: 63, lv: 3, name: "化石", type: 8, stat: 0, price: 200, prob: 1 },

    // --- Lv4: 銀の廃都 ---
    { id: 64, lv: 4, name: "銀鉱石", type: 7, stat: 0, price: 150, prob: 9 },
    { id: 65, lv: 4, name: "銀", type: 6, stat: 0, price: 400, prob: 0 },
    { id: 66, lv: 4, name: "銀の剣", type: 1, stat: 100, price: 1600, prob: 0 },
    { id: 67, lv: 4, name: "銀の盾", type: 2, stat: 100, price: 800, prob: 0 },
    { id: 68, lv: 4, name: "銀の鎧", type: 3, stat: 100, price: 2400, prob: 0 },
    { id: 69, lv: 4, name: "エメラルド原石", type: 7, stat: 0, price: 400, prob: 4 },
    { id: 70, lv: 4, name: "エメラルド", type: 6, stat: 0, price: 900, prob: 0 },
    { id: 71, lv: 4, name: "翠玉の指輪", type: 4, stat: 80, price: 2600, prob: 0 },
    { id: 72, lv: 4, name: "ひんやり草", type: 7, stat: 0, price: 150, prob: 8 },
    { id: 73, lv: 4, name: "耐熱ポーション", type: 5, stat: 0, price: 600, prob: 0 },
    { id: 74, lv: 4, name: "欠けた皿", type: 8, stat: 0, price: 60, prob: 10 },
    { id: 75, lv: 4, name: "割れた鏡", type: 8, stat: 0, price: 80, prob: 9 },
    { id: 76, lv: 4, name: "煤けたロウソク", type: 8, stat: 0, price: 80, prob: 9 },
    { id: 77, lv: 4, name: "ガラス瓶", type: 8, stat: 0, price: 100, prob: 8 },
    { id: 78, lv: 4, name: "白い布切れ", type: 8, stat: 0, price: 120, prob: 7 },
    { id: 79, lv: 4, name: "古い銀貨", type: 8, stat: 0, price: 150, prob: 6 },
    { id: 80, lv: 4, name: "錆びた鍵", type: 8, stat: 0, price: 180, prob: 5 },
    { id: 81, lv: 4, name: "銀の砂", type: 8, stat: 0, price: 250, prob: 3 },
    { id: 82, lv: 4, name: "水晶の粒", type: 8, stat: 0, price: 300, prob: 2 },
    { id: 83, lv: 4, name: "古びた手記", type: 8, stat: 0, price: 500, prob: 1 },

    // --- Lv5: 黄金の神殿 ---
    { id: 84, lv: 5, name: "金鉱石", type: 7, stat: 0, price: 400, prob: 8 },
    { id: 85, lv: 5, name: "金", type: 6, stat: 0, price: 1000, prob: 0 },
    { id: 86, lv: 5, name: "金の剣", type: 1, stat: 250, price: 4000, prob: 0 },
    { id: 87, lv: 5, name: "金の盾", type: 2, stat: 250, price: 2000, prob: 0 },
    { id: 88, lv: 5, name: "金の鎧", type: 3, stat: 250, price: 6000, prob: 0 },
    { id: 89, lv: 5, name: "ルビー原石", type: 7, stat: 0, price: 1000, prob: 4 },
    { id: 90, lv: 5, name: "ルビー", type: 6, stat: 0, price: 2200, prob: 0 },
    { id: 91, lv: 5, name: "紅玉の指輪", type: 4, stat: 200, price: 6400, prob: 0 },
    { id: 92, lv: 5, name: "黄金の草", type: 7, stat: 0, price: 400, prob: 8 },
    { id: 93, lv: 5, name: "上級ポーション", type: 5, stat: 0, price: 1500, prob: 0 },
    { id: 94, lv: 5, name: "神殿の瓦礫", type: 8, stat: 0, price: 180, prob: 10 },
    { id: 95, lv: 5, name: "金の砂", type: 8, stat: 0, price: 240, prob: 9 },
    { id: 96, lv: 5, name: "謎のメダル", type: 8, stat: 0, price: 240, prob: 9 },
    { id: 97, lv: 5, name: "黄金の羽根", type: 8, stat: 0, price: 300, prob: 8 },
    { id: 98, lv: 5, name: "儀式の飾り", type: 8, stat: 0, price: 360, prob: 7 },
    { id: 99, lv: 5, name: "輝く粉", type: 8, stat: 0, price: 450, prob: 6 },
    { id: 100, lv: 5, name: "琥珀", type: 8, stat: 0, price: 500, prob: 5 },
    { id: 101, lv: 5, name: "太陽の石", type: 8, stat: 0, price: 750, prob: 3 },
    { id: 102, lv: 5, name: "聖なる雫", type: 8, stat: 0, price: 900, prob: 2 },
    { id: 103, lv: 5, name: "天使の落とし物", type: 8, stat: 0, price: 1500, prob: 1 },

    // --- Lv6: 天空の砦 ---
    { id: 104, lv: 6, name: "ミスリル鉱石", type: 7, stat: 0, price: 1000, prob: 8 },
    { id: 105, lv: 6, name: "ミスリル", type: 6, stat: 0, price: 2500, prob: 0 },
    { id: 106, lv: 6, name: "ミスリルソード", type: 1, stat: 600, price: 10000, prob: 0 },
    { id: 107, lv: 6, name: "ミスリルシールド", type: 2, stat: 600, price: 5000, prob: 0 },
    { id: 108, lv: 6, name: "ミスリルメイル", type: 3, stat: 600, price: 15000, prob: 0 },
    { id: 109, lv: 6, name: "ダイヤ原石", type: 7, stat: 0, price: 2500, prob: 4 },
    { id: 110, lv: 6, name: "ダイヤモンド", type: 6, stat: 0, price: 5500, prob: 0 },
    { id: 111, lv: 6, name: "金剛石の指輪", type: 4, stat: 500, price: 16000, prob: 0 },
    { id: 112, lv: 6, name: "天使の草", type: 7, stat: 0, price: 1000, prob: 8 },
    { id: 113, lv: 6, name: "特級ポーション", type: 5, stat: 0, price: 4000, prob: 0 },
    { id: 114, lv: 6, name: "歯車", type: 8, stat: 0, price: 500, prob: 10 },
    { id: 115, lv: 6, name: "壊れた回路", type: 8, stat: 0, price: 600, prob: 9 },
    { id: 116, lv: 6, name: "雲の綿", type: 8, stat: 0, price: 600, prob: 9 },
    { id: 117, lv: 6, name: "風の結晶", type: 8, stat: 0, price: 800, prob: 8 },
    { id: 118, lv: 6, name: "浮遊石", type: 8, stat: 0, price: 1000, prob: 7 },
    { id: 119, lv: 6, name: "月の砂", type: 8, stat: 0, price: 1200, prob: 6 },
    { id: 120, lv: 6, name: "瑠璃色の羽", type: 8, stat: 0, price: 1500, prob: 5 },
    { id: 121, lv: 6, name: "雷の石", type: 8, stat: 0, price: 2000, prob: 3 },
    { id: 122, lv: 6, name: "星の欠片", type: 8, stat: 0, price: 2500, prob: 2 },
    { id: 123, lv: 6, name: "彗星の尾", type: 8, stat: 0, price: 4000, prob: 1 },

    // --- Lv7: 竜の火口 ---
    { id: 124, lv: 7, name: "オリハルコン鉱石", type: 7, stat: 0, price: 3000, prob: 7 },
    { id: 125, lv: 7, name: "オリハルコン", type: 6, stat: 0, price: 8000, prob: 0 },
    { id: 126, lv: 7, name: "究極の剣", type: 1, stat: 1500, price: 32000, prob: 0 },
    { id: 127, lv: 7, name: "究極の盾", type: 2, stat: 1500, price: 16000, prob: 0 },
    { id: 128, lv: 7, name: "究極の鎧", type: 3, stat: 1500, price: 48000, prob: 0 },
    { id: 129, lv: 7, name: "虹色の結晶", type: 7, stat: 0, price: 8000, prob: 4 },
    { id: 130, lv: 7, name: "虹色の宝石", type: 6, stat: 0, price: 18000, prob: 0 },
    { id: 131, lv: 7, name: "虹の指輪", type: 4, stat: 1200, price: 54000, prob: 0 },
    { id: 132, lv: 7, name: "命の草", type: 7, stat: 0, price: 3000, prob: 8 },
    { id: 133, lv: 7, name: "エリクサー", type: 5, stat: 0, price: 12000, prob: 0 },
    { id: 134, lv: 7, name: "灰の塊", type: 8, stat: 0, price: 1500, prob: 10 },
    { id: 135, lv: 7, name: "燃える石", type: 8, stat: 0, price: 2000, prob: 9 },
    { id: 136, lv: 7, name: "黒曜石", type: 8, stat: 0, price: 2000, prob: 9 },
    { id: 137, lv: 7, name: "溶岩液", type: 8, stat: 0, price: 2500, prob: 8 },
    { id: 138, lv: 7, name: "巨大な爪", type: 8, stat: 0, price: 3000, prob: 7 },
    { id: 139, lv: 7, name: "竜の鱗", type: 8, stat: 0, price: 4000, prob: 6 },
    { id: 140, lv: 7, name: "竜の牙", type: 8, stat: 0, price: 5000, prob: 5 },
    { id: 141, lv: 7, name: "竜の角", type: 8, stat: 0, price: 6000, prob: 3 },
    { id: 142, lv: 7, name: "獄炎の草", type: 8, stat: 0, price: 8000, prob: 2 },
    { id: 143, lv: 7, name: "竜の血", type: 8, stat: 0, price: 15000, prob: 1 },

    // --- レシピ (お店で購入) ---
    { id: 144, lv: 1, name: "木の剣のレシピ", type: 10, stat: 0, price: 20, prob: 0 },
    { id: 145, lv: 1, name: "木の盾のレシピ", type: 10, stat: 0, price: 20, prob: 0 },
    { id: 146, lv: 1, name: "木の胸当てのレシピ", type: 10, stat: 0, price: 20, prob: 0 },
    { id: 147, lv: 1, name: "石の指輪のレシピ", type: 10, stat: 0, price: 20, prob: 0 },
    { id: 148, lv: 1, name: "初級ポーションのレシピ", type: 10, stat: 0, price: 20, prob: 0 },
    { id: 149, lv: 2, name: "銅精錬のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 150, lv: 2, name: "アメジスト研磨のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 151, lv: 2, name: "銅の剣のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 152, lv: 2, name: "銅の盾のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 153, lv: 2, name: "銅の鎧のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 154, lv: 2, name: "紫水晶の指輪のレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 155, lv: 2, name: "毒消しポーションのレシピ", type: 10, stat: 0, price: 60, prob: 0 },
    { id: 156, lv: 3, name: "鉄精錬のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 157, lv: 3, name: "サファイア研磨のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 158, lv: 3, name: "鉄の剣のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 159, lv: 3, name: "鉄の盾のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 160, lv: 3, name: "鉄の鎧のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 161, lv: 3, name: "蒼玉の指輪のレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 162, lv: 3, name: "中級ポーションのレシピ", type: 10, stat: 0, price: 200, prob: 0 },
    { id: 163, lv: 4, name: "銀精錬のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 164, lv: 4, name: "エメラルド研磨のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 165, lv: 4, name: "銀の剣のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 166, lv: 4, name: "銀の盾のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 167, lv: 4, name: "銀の鎧のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 168, lv: 4, name: "翠玉の指輪のレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 169, lv: 4, name: "耐熱ポーションのレシピ", type: 10, stat: 0, price: 500, prob: 0 },
    { id: 170, lv: 5, name: "金精錬のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 171, lv: 5, name: "ルビー研磨のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 172, lv: 5, name: "金の剣のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 173, lv: 5, name: "金の盾のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 174, lv: 5, name: "金の鎧のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 175, lv: 5, name: "紅玉の指輪のレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 176, lv: 5, name: "上級ポーションのレシピ", type: 10, stat: 0, price: 1200, prob: 0 },
    { id: 177, lv: 6, name: "ミスリル精錬のレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 178, lv: 6, name: "ダイヤモンド研磨のレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 179, lv: 6, name: "ミスリルソードのレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 180, lv: 6, name: "ミスリルシールドのレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 181, lv: 6, name: "ミスリルメイルのレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 182, lv: 6, name: "金剛石の指輪のレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 183, lv: 6, name: "特級ポーションのレシピ", type: 10, stat: 0, price: 3000, prob: 0 },
    { id: 184, lv: 7, name: "オリハルコン精錬のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 185, lv: 7, name: "虹色の宝石研磨のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 186, lv: 7, name: "究極の剣のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 187, lv: 7, name: "究極の盾のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 188, lv: 7, name: "究極の鎧のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 189, lv: 7, name: "虹の指輪のレシピ", type: 10, stat: 0, price: 10000, prob: 0 },
    { id: 190, lv: 7, name: "エリクサーのレシピ", type: 10, stat: 0, price: 10000, prob: 0 }
];

// -------------------------------------------------------------
// 4. クラフト（加工・合成）ロジック用の定義辞書
// 本体側で「どのアイテムを作るのに何が必要か」を逆引きしやすくします。
// -------------------------------------------------------------

// クラフト対応表の定義（結果アイテムID : { recipeId, mat1Id, mat2Id(合成のみ) } ）
const CRAFT_RULES = {
    // Lv1
    7: { recipeId: 144, mat1Id: 6, mat2Id: 1 },     // 木の剣
    8: { recipeId: 145, mat1Id: 6, mat2Id: 2 },     // 木の盾
    9: { recipeId: 146, mat1Id: 6, mat2Id: 3 },     // 木の胸当て
    11: { recipeId: 147, mat1Id: 10, mat2Id: 4 },   // 石の指輪
    13: { recipeId: 148, mat1Id: 12, mat2Id: 5 },   // 初級ポーション
    // Lv2
    25: { recipeId: 149, mat1Id: 24, mat2Id: null }, // 銅 (精錬)
    30: { recipeId: 150, mat1Id: 29, mat2Id: null }, // アメジスト (研磨)
    26: { recipeId: 151, mat1Id: 25, mat2Id: 1 },    // 銅の剣
    27: { recipeId: 152, mat1Id: 25, mat2Id: 2 },    // 銅の盾
    28: { recipeId: 153, mat1Id: 25, mat2Id: 3 },    // 銅の鎧
    31: { recipeId: 154, mat1Id: 30, mat2Id: 4 },    // 紫水晶の指輪
    33: { recipeId: 155, mat1Id: 32, mat2Id: 5 },    // 毒消しポーション
    // Lv3
    45: { recipeId: 156, mat1Id: 44, mat2Id: null },
    50: { recipeId: 157, mat1Id: 49, mat2Id: null },
    46: { recipeId: 158, mat1Id: 45, mat2Id: 1 },
    47: { recipeId: 159, mat1Id: 45, mat2Id: 2 },
    48: { recipeId: 160, mat1Id: 45, mat2Id: 3 },
    51: { recipeId: 161, mat1Id: 50, mat2Id: 4 },
    53: { recipeId: 162, mat1Id: 52, mat2Id: 5 },
    // Lv4
    65: { recipeId: 163, mat1Id: 64, mat2Id: null },
    70: { recipeId: 164, mat1Id: 69, mat2Id: null },
    66: { recipeId: 165, mat1Id: 65, mat2Id: 1 },
    67: { recipeId: 166, mat1Id: 65, mat2Id: 2 },
    68: { recipeId: 167, mat1Id: 65, mat2Id: 3 },
    71: { recipeId: 168, mat1Id: 70, mat2Id: 4 },
    73: { recipeId: 169, mat1Id: 72, mat2Id: 5 },
    // Lv5
    85: { recipeId: 170, mat1Id: 84, mat2Id: null },
    90: { recipeId: 171, mat1Id: 89, mat2Id: null },
    86: { recipeId: 172, mat1Id: 85, mat2Id: 1 },
    87: { recipeId: 173, mat1Id: 85, mat2Id: 2 },
    88: { recipeId: 174, mat1Id: 85, mat2Id: 3 },
    91: { recipeId: 175, mat1Id: 90, mat2Id: 4 },
    93: { recipeId: 176, mat1Id: 92, mat2Id: 5 },
    // Lv6
    105: { recipeId: 177, mat1Id: 104, mat2Id: null },
    110: { recipeId: 178, mat1Id: 109, mat2Id: null },
    106: { recipeId: 179, mat1Id: 105, mat2Id: 1 },
    107: { recipeId: 180, mat1Id: 105, mat2Id: 2 },
    108: { recipeId: 181, mat1Id: 105, mat2Id: 3 },
    111: { recipeId: 182, mat1Id: 110, mat2Id: 4 },
    113: { recipeId: 183, mat1Id: 112, mat2Id: 5 },
    // Lv7
    125: { recipeId: 184, mat1Id: 124, mat2Id: null },
    130: { recipeId: 185, mat1Id: 129, mat2Id: null },
    126: { recipeId: 186, mat1Id: 125, mat2Id: 1 },
    127: { recipeId: 187, mat1Id: 125, mat2Id: 2 },
    128: { recipeId: 188, mat1Id: 125, mat2Id: 3 },
    131: { recipeId: 189, mat1Id: 130, mat2Id: 4 },
    133: { recipeId: 190, mat1Id: 132, mat2Id: 5 }
};