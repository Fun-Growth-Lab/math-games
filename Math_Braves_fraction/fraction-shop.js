// ぶんすうスロットの ショップ。ステージクリアのあと(最後のステージのあとは出さない)に ひらく。
// コインで能力アップを買う。品物は6つ(固定4 + その回の「かたち」「おきにいり」)。そのうち1つは半額セール。
//   おかわり  : ステージクリアのAP回復 +0.5(Lv1〜10。はんぱは持ちこして、たまったら+1)
//   スパイス  : ターゲットのボーナス +5%(Lv1〜10)
// 値段は定額(Lvが上がっても変わらない)。
//   チャージ  : いますぐ AP +3(なんども買える)
//   かたち    : ケーキが その大きさでそろったとき、そのステージのスコア ×1.1(ずっと)
//   おきにいり: そのカードを使うたび、最終スコアの倍率 +3%(ずっと)
(function () {
    const LV_MAX = 10;
    const PRICE = { heal: 10, spice: 5, charge: 8, shape: 8, fav: 6 };   // すべて定額
    const S = {
        ja: {
            shop_title: 'ケーキやさんの ショップ', shop_coins: 'コイン', shop_next: 'つぎの ステージへ ▶', shop_sale: 'セール!', shop_max: 'MAX', shop_owned: 'もっている',
            shop_buy: 'かう', shop_short: 'コインが たりない', shop_have: 'もちもの', shop_none: 'まだ なにも もっていません',
            item_heal: 'おかわりAP', desc_heal: 'クリアの AP回復が +0.5(2回で +1)',
            item_spice: 'ターゲットスパイス', desc_spice: 'ターゲットの ボーナスが +5%',
            item_charge: 'APチャージ', desc_charge: 'いますぐ AP が +3',
            item_shape: 'かたちマスター', desc_shape: 'この大きさで そろうと スコア ×1.1(ずっと)',
            item_fav: 'おきにいりカード', desc_fav: 'この カードを つかうたび 最終スコア +3%',
            coin_unit: 'コイン',
        },
        en: {
            shop_title: 'Cake Shop', shop_coins: 'Coins', shop_next: 'Next Stage ▶', shop_sale: 'SALE!', shop_max: 'MAX', shop_owned: 'Owned',
            shop_buy: 'Buy', shop_short: 'Not enough coins', shop_have: 'Your items', shop_none: 'Nothing yet',
            item_heal: 'Extra AP', desc_heal: '+0.5 AP on stage clear (carries over)',
            item_spice: 'Target Spice', desc_spice: 'Target bonus +5%',
            item_charge: 'AP Charge', desc_charge: '+3 AP right now',
            item_shape: 'Shape Master', desc_shape: 'Stage score ×1.1 when cakes match this size',
            item_fav: 'Favorite Card', desc_fav: 'Each use of this card: final score +3%',
            coin_unit: ' coins',
        },
    };
    ['ja', 'simple', 'en'].forEach(l => Object.assign(STRINGS[l], S[l === 'en' ? 'en' : 'ja']));   // 共通部品が すでに文言を重ねたあとなので STRINGS に直接足す

    const TOP_COIN = '<svg viewBox="0 0 24 24" class="coin"><circle cx="12" cy="12" r="10" fill="#ffd24a" stroke="#b07200" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#e8a317" stroke-width="1.5"/><path d="M12 7v10M9.5 9.5h4a1.6 1.6 0 0 1 0 3.2h-3a1.6 1.6 0 0 0 0 3.2h4" stroke="#b07200" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
    window.COIN_SVG = TOP_COIN;
    let cont = null, pool = null, saleId = null;

    function frHtml(v) { return fracHTML(v); }
    // この回の品物をつくる
    function makeItems() {
        const R = state.run, n = UNIT_MAX, items = [];
        items.push({ id: 'heal', lv: R.healUp, price: PRICE.heal, max: R.healUp >= LV_MAX });
        items.push({ id: 'spice', lv: R.spiceLv, price: PRICE.spice, max: R.spiceLv >= LV_MAX });
        items.push({ id: 'charge', price: PRICE.charge });
        // かたち(大きさ1/n〜n/n のうち まだ持っていないもの)と、おきにいり(カードの値 1/n〜(n-1)/n)
        const shapes = []; for (let v = 1; v <= n; v++) if (!R.shapes[v]) shapes.push(v);
        const favs = []; for (let v = 1; v < n; v++) if (!R.favs[v]) favs.push(v);
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        // かたちマスターは 2つ ならべる(ちがう大きさ)
        for (let k = 0; k < 2 && shapes.length; k++) { const v = pick(shapes); shapes.splice(shapes.indexOf(v), 1); items.push({ id: 'shape', value: v, price: PRICE.shape }); }
        if (favs.length) items.push({ id: 'fav', value: pick(favs), price: PRICE.fav });
        // 半額セール(買えるものから1つ)
        const sale = items.filter(it => !it.max);
        if (sale.length) { const it = pick(sale); it.sale = true; it.price = Math.ceil(it.price / 2); }
        return items;
    }
    function owned() {
        const R = state.run, l = [];
        if (R.healUp) l.push(`${T('item_heal')} Lv${R.healUp}`);
        if (R.spiceLv) l.push(`${T('item_spice')} Lv${R.spiceLv}`);
        Object.keys(R.shapes).forEach(v => l.push(`${T('item_shape')} ${fracText(+v)}`));
        Object.keys(R.favs).forEach(v => l.push(`${T('item_fav')} ${fracText(+v)}`));
        return l;
    }
    function render() {
        const R = state.run;
        const cards = pool.map((it, i) => {
            const name = T('item_' + it.id), desc = T('desc_' + it.id);
            const val = it.value ? `<div class="sh-val">${frHtml(it.value)}</div>` : '';
            const lv = it.lv !== undefined ? `<div class="sh-lv">Lv ${it.lv}${it.max ? '' : ' → ' + (it.lv + 1)}</div>` : '';
            const sold = it.sold || it.max;
            const afford = state.coins >= it.price;
            const btn = sold ? `<button class="sh-buy" disabled>${it.max ? T('shop_max') : T('shop_owned')}</button>`
                : `<button class="sh-buy" data-i="${i}"${afford ? '' : ' disabled'}>${afford ? T('shop_buy') : T('shop_short')}<span class="sh-pr">${TOP_COIN}${it.price}</span></button>`;
            return `<div class="sh-card sh-${it.id}${it.sale && !sold ? ' sale' : ''}">${it.sale && !sold ? `<b class="sh-sale">${T('shop_sale')}</b>` : ''}
                <div class="sh-name">${name}</div>${val}${lv}<div class="sh-desc">${desc}</div>${btn}</div>`;
        }).join('');
        const have = owned();
        cont.innerHTML = `<div class="sh-top"><div class="sh-plaque">${T('shop_title')}</div>
                <div class="sh-coins">${TOP_COIN}<b>${state.coins}</b><span>${T('shop_coins')}</span></div></div>
            <div class="sh-grid">${cards}</div>
            <div class="sh-have"><span>${T('shop_have')}</span>${have.length ? have.map(h => `<i>${h}</i>`).join('') : `<em>${T('shop_none')}</em>`}</div>
            <button class="sh-go" id="sh-go">${T('shop_next')}</button>`;
        cont.querySelectorAll('.sh-buy[data-i]').forEach(b => b.addEventListener('click', () => buy(+b.dataset.i)));
        cont.querySelector('#sh-go').addEventListener('click', close);
    }
    function buy(i) {
        const it = pool[i], R = state.run;
        if (!it || it.sold || it.max || state.coins < it.price) return;
        state.coins -= it.price;
        if (it.id === 'heal') R.healUp++;
        else if (it.id === 'spice') R.spiceLv++;
        else if (it.id === 'charge') { state.ap += 3; updateUI(); }
        else if (it.id === 'shape') { R.shapes[it.value] = true; it.sold = true; }
        else if (it.id === 'fav') { R.favs[it.value] = true; it.sold = true; }
        if (it.id === 'heal' || it.id === 'spice') {
            // Lvの上がる品物は、同じ回に続けて買えるように 値段と状態をつくりなおす
            const lvKey = { heal: 'healUp', spice: 'spiceLv' }[it.id], lv = R[lvKey];
            it.lv = lv; it.max = lv >= LV_MAX;
            it.price = PRICE[it.id];                  // 定額(セールは買ったら終わり。次からは定価)
            it.sale = false;
        }
        if (it.id === 'charge') { it.price = PRICE.charge; it.sale = false; }
        updateUI();
        render();
    }
    let doneCb = null;
    function close() {
        cont.classList.add('hidden');
        const cb = doneCb; doneCb = null;
        if (cb) cb();
    }
    function ensure() {
        if (cont) return;
        cont = document.createElement('div');
        cont.id = 'shop-screen';
        cont.className = 'hidden';
        document.getElementById('container').appendChild(cont);
    }
    // ステージクリアのあと: ショップをひらく(チュートリアルでは出さない)
    GAME.beforeNextStage = function (cb) {
        if (state.tutorial) { cb(); return; }
        ensure();
        pool = makeItems();
        doneCb = cb;
        render();
        cont.classList.remove('hidden');
    };
    window.closeShopNow = function () { if (cont) cont.classList.add('hidden'); doneCb = null; };
})();
