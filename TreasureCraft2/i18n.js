// トレジャークラフト2: ことばの切りかえ(日本語 / かんたんなにほんご / English)
// しくみ: 画面に出た日本語の文を 辞書(i18n-dict.js の I18N_DICT)で 引いて置きかえる。
//   ・辞書の見出しは 日本語の文そのまま。{0} {1} は 入れかわる部分(数・名前)
//   ・#stage の中の文字は 見張っていて、出たときに自動で置きかえる(ゲームのコードは日本語のまま書ける)
//   ・キャンバスに書く文字は tr() を通す
//   ・言語を変えたら 読みこみ直す(遊んでいる途中では変えない)
'use strict';
const LANG_KEY = 'tc2_lang', LANGS = ['ja', 'ja_easy', 'en'];
const LANG = (() => { try { const v = localStorage.getItem(LANG_KEY); return LANGS.includes(v) ? v : 'ja'; } catch (e) { return 'ja'; } })();
const LANG_LABEL = { ja: '日本語', ja_easy: 'かんたんなにほんご', en: 'English' };
const langSimple = () => LANG === 'ja_easy' ? 'simple' : LANG;   // 共通部品(タイトル・あそびかた)の書き方
const langEasy = () => LANG === 'ja_easy' ? 'easy' : LANG;       // チュートリアルの書き方
function setLang(l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) { } location.reload(); }

const HAS_JA = /[぀-ヿ㐀-鿿！-～「」『』・…]/;
const I18N = { exact: new Map(), tpl: [], cache: new Map(), miss: new Set(), outs: new Set() };
// 辞書を組み立てる(i18n-dict.js が先に読みこまれている)
function i18nBuild(list) {
    if (LANG === 'ja') return;
    const col = LANG === 'en' ? 2 : 1;
    for (const e of list) {
        const ja = e[0], v = e[col] === null || e[col] === undefined || e[col] === '' ? (col === 1 ? ja : null) : e[col];
        if (v === null) continue;
        if (/\{\d\}/.test(ja)) {
            const re = new RegExp('^' + ja.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d)\\\}/g, '([\\s\\S]+?)') + '$');
            const idx = [...ja.matchAll(/\{(\d)\}/g)].map(m => +m[1]);
            I18N.exact.set(ja, v);   // trf() で そのまま引けるように
            I18N.tpl.push({ re, idx, out: v, len: ja.replace(/\{\d\}/g, '').length });
        } else I18N.exact.set(ja, v);
    }
    I18N.tpl.sort((a, b) => b.len - a.len);   // 決まった文字の多い(くわしい)見出しを 先に
}
// 入れかわる部分: 数や 訳しおわった文字は そのまま、日本語なら 引く
const trArg = a => HAS_JA.test(a) ? tr(a) : a;
function tr(s) {
    if (LANG === 'ja' || !s || !HAS_JA.test(s) || I18N.outs.has(s)) return s;   // 訳した後の文(かんたんなにほんご)は そのまま
    let c = I18N.cache.get(s);
    if (c !== undefined) return c;
    c = I18N.exact.get(s);
    if (c === undefined) {
        const t = s.trim();
        if (t !== s && t) c = s.replace(t, tr(t));
    }
    if (c === undefined) for (const t of I18N.tpl) {
        const m = s.match(t.re);
        if (!m) continue;
        const args = []; t.idx.forEach((n, i) => { args[n] = m[i + 1]; });
        c = t.out.replace(/\{(\d)\}/g, (_, n) => trArg(args[+n]));
        break;
    }
    if (c === undefined) { c = s; I18N.miss.add(s); }
    if (I18N.cache.size > 6000) I18N.cache.clear();
    I18N.cache.set(s, c); I18N.outs.add(c);
    return c;
}
// コードから使う: 見出しで引いて {0}… をうめる
function trf(key, ...args) { const t = LANG === 'ja' ? key : (I18N.exact.get(key) || key); return t.replace(/\{(\d)\}/g, (_, n) => trArg(String(args[+n]))); }

// ---------- 画面の文字を 見張って置きかえる ----------
const I18N_SKIP = el => el && el.closest && el.closest('script,style,textarea,.notr');
function trNode(n) {
    if (n.nodeType === 3) {
        const s = n.data;
        if (!HAS_JA.test(s) || I18N_SKIP(n.parentElement)) return;
        const o = tr(s);
        if (o !== s) n.data = o;
        return;
    }
    if (n.nodeType !== 1 || I18N_SKIP(n)) return;
    for (const a of ['placeholder', 'title', 'data-tip']) if (n.hasAttribute && n.hasAttribute(a)) { const v = n.getAttribute(a); if (HAS_JA.test(v)) { const o = tr(v); if (o !== v) n.setAttribute(a, o); } }
    for (const c of n.childNodes) trNode(c);
}
function i18nStart() {
    if (LANG === 'ja') return;
    i18nBuild(typeof I18N_DICT !== 'undefined' ? I18N_DICT : []);
    document.documentElement.lang = LANG === 'en' ? 'en' : 'ja';
    if (LANG === 'en') document.title = 'Treasure Craft 2 - Fun & Growth Lab';
    const root = document.getElementById('stage');
    trNode(root);
    new MutationObserver(list => {
        for (const m of list) {
            if (m.type === 'characterData') trNode(m.target);
            else if (m.type === 'attributes') trNode(m.target);
            else m.addedNodes.forEach(trNode);
        }
    }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'data-tip'] });
}
i18nStart();
