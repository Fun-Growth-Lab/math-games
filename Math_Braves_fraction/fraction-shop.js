// ぶんすうスロットの ショップ。ステージクリアのあと(最後のステージのあとは出さない)に ひらく。
// 文字を減らして、絵と数字で見せる。値段は定額。毎回1品が半額セール。
//   おかわりAP : ステージクリアのAP回復 +0.5/Lv(Lv1〜10。はんぱは持ちこして、たまったら+1)
//   スパイス   : ターゲットのボーナス +5%/Lv(Lv1〜10)
//   APチャージ : いますぐ AP +3(なんども買える)
//   かたち     : ケーキが その大きさでそろったとき ×1.1(ずっと。その回の2つ)
//   おきにいり : そのカードを使うたび 最終スコア +3%(ずっと)
(function () {
    const LV_MAX = 10;
    const PRICE = { heal: 10, spice: 5, charge: 8, shape: 8, fav: 6 };   // すべて定額
    const S = {
        ja: { shop_title: 'ショップ', shop_next: 'つぎの ステージへ', shop_sale: 'セール', shop_max: 'MAX', shop_owned: 'ゲット済み',
              item_heal: 'おかわりAP', item_spice: 'スパイス', item_charge: 'APチャージ', item_shape: 'かたち', item_fav: 'おきにいり', coin_unit: 'コイン' },
        en: { shop_title: 'Shop', shop_next: 'Next Stage', shop_sale: 'SALE', shop_max: 'MAX', shop_owned: 'Owned',
              item_heal: 'Extra AP', item_spice: 'Spice', item_charge: 'AP Charge', item_shape: 'Shape', item_fav: 'Favorite', coin_unit: ' coins' },
    };
    ['ja', 'simple', 'en'].forEach(l => Object.assign(STRINGS[l], S[l === 'en' ? 'en' : 'ja']));   // 共通部品が すでに文言を重ねたあとなので STRINGS に直接足す

    const COIN = '<svg viewBox="0 0 24 24" class="coin"><circle cx="12" cy="12" r="10" fill="#ffd24a" stroke="#b07200" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#e8a317" stroke-width="1.5"/><path d="M12 7v10M9.5 9.5h4a1.6 1.6 0 0 1 0 3.2h-3a1.6 1.6 0 0 0 0 3.2h4" stroke="#b07200" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
    let cont = null, pool = null, doneCb = null;

    function cakePic(v) {
        const d = document.createElement('div'); d.innerHTML = cakeSVG(UNIT_MAX); paintCake(d.firstElementChild, v, UNIT_MAX);
        return d.innerHTML;
    }
    // 品物の絵と、効果の数字
    function pic(it) {
        if (it.id === 'heal') return '<div class="pic-ap"><span>AP</span><b>+</b></div>';
        if (it.id === 'charge') return '<div class="pic-ap big"><span>AP</span><b>+3</b></div>';
        if (it.id === 'spice') return '<div class="pic-spice"><b>%</b></div>';
        if (it.id === 'shape') return `<div class="pic-cake"><div class="pk">${cakePic(it.value)}</div><div class="pf" style="--cc:${sizeColor(it.value)}">${fracHTML(it.value)}</div></div>`;
        return `<div class="pic-card" style="--cc:${sizeColor(it.value)}">${fracHTML(it.value)}</div>`;
    }
    function eff(it) {
        if (it.id === 'heal') { const a = it.lv * 0.5, b = (it.lv + 1) * 0.5; return `<b>+${a}</b>${it.max ? '' : `<i>▶</i><b class="nx">+${b}</b>`}`; }
        if (it.id === 'spice') { const a = 50 + it.lv * 5, b = a + 5; return `<b>+${a}%</b>${it.max ? '' : `<i>▶</i><b class="nx">+${b}%</b>`}`; }
        if (it.id === 'charge') return '<b class="nx">AP +3</b>';
        if (it.id === 'shape') return '<b class="nx">×1.1</b>';
        return '<b class="nx">+3%</b>';
    }
    function lvPips(lv) {
        let h = '';
        for (let i = 1; i <= LV_MAX; i++) h += `<i class="${i <= lv ? 'on' : ''}"></i>`;
        return `<div class="sh-pips">${h}</div>`;
    }

    // この回の品物をつくる
    function makeItems() {
        const R = state.run, n = UNIT_MAX, items = [];
        items.push({ id: 'heal', lv: R.healUp, price: PRICE.heal, max: R.healUp >= LV_MAX });
        items.push({ id: 'spice', lv: R.spiceLv, price: PRICE.spice, max: R.spiceLv >= LV_MAX });
        items.push({ id: 'charge', price: PRICE.charge });
        const shapes = []; for (let v = 1; v <= n; v++) if (!R.shapes[v]) shapes.push(v);
        const favs = []; for (let v = 1; v < n; v++) if (!R.favs[v]) favs.push(v);
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        for (let k = 0; k < 2 && shapes.length; k++) { const v = pick(shapes); shapes.splice(shapes.indexOf(v), 1); items.push({ id: 'shape', value: v, price: PRICE.shape }); }
        if (favs.length) items.push({ id: 'fav', value: pick(favs), price: PRICE.fav });
        // 半額セール(買えるものから1つ)
        const sale = items.filter(it => !it.max);
        if (sale.length) { const it = pick(sale); it.sale = true; it.price = Math.ceil(it.price / 2); }
        return items;
    }
    function render() {
        const cards = pool.map((it, i) => {
            const sold = it.sold || it.max;
            const afford = state.coins >= it.price;
            const btn = sold
                ? `<button class="sh-buy" disabled>${it.max ? T('shop_max') : T('shop_owned')}</button>`
                : `<button class="sh-buy" data-i="${i}"${afford ? '' : ' disabled'}><span class="sh-pr">${COIN}${it.price}</span></button>`;
            return `<div class="sh-card sh-${it.id}${it.sale && !sold ? ' sale' : ''}${sold ? ' sold' : ''}">
                ${it.sale && !sold ? `<b class="sh-sale">${T('shop_sale')}</b>` : ''}
                <div class="sh-name">${T('item_' + it.id)}</div>
                <div class="sh-pic">${pic(it)}</div>
                <div class="sh-eff">${eff(it)}</div>
                ${it.lv !== undefined ? lvPips(it.lv) : '<div class="sh-pips none"></div>'}
                ${btn}</div>`;
        }).join('');
        cont.innerHTML = `<div class="sh-top"><div class="sh-plaque">${T('shop_title')}</div>
                <div class="sh-coins">${COIN}<b>${state.coins}</b></div></div>
            <div class="sh-grid">${cards}</div>
            <button class="sh-go" id="sh-go">${T('shop_next')} <i>▶</i></button>`;
        cont.querySelectorAll('.sh-buy[data-i]').forEach(b => b.addEventListener('click', () => buy(+b.dataset.i)));
        cont.querySelector('#sh-go').addEventListener('click', close);
    }
    function buy(i) {
        const it = pool[i], R = state.run;
        if (!it || it.sold || it.max || state.coins < it.price) return;
        state.coins -= it.price;
        if (it.id === 'heal') R.healUp++;
        else if (it.id === 'spice') R.spiceLv++;
        else if (it.id === 'charge') { state.ap += 3; }
        else if (it.id === 'shape') { R.shapes[it.value] = true; it.sold = true; }
        else if (it.id === 'fav') { R.favs[it.value] = true; it.sold = true; }
        if (it.id === 'heal' || it.id === 'spice') {
            const lv = it.id === 'heal' ? R.healUp : R.spiceLv;
            it.lv = lv; it.max = lv >= LV_MAX; it.price = PRICE[it.id]; it.sale = false;   // 定額(セールは買ったら終わり)
        }
        if (it.id === 'charge') { it.price = PRICE.charge; it.sale = false; }
        updateUI();
        render();
    }
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
