// Fun & Growth Lab 共通: ニックネームの検査(全ゲーム共通)。
//   FGLName.validate(入力)  → { ok, name, reason }   reason: 'empty' | 'too_long' | 'chars' | 'ng' | 'pii'
//   FGLName.message(reason, lang) → 子どもに見せる文言(lang: 'ja' | 'simple'(ja_easy) | 'en')
//   FGLName.display(name, fallback) → ランキングなどに出すときの名前。NG/個人情報なら fallback('ななしさん')に置きかえる
//   FGLName.isBlocked(name) → NGワード/個人情報を含むか
//
// ルール: 文字と数字なら何語でもOK(ひらがな・カタカナ・漢字・英字・ハングル など)。絵文字・記号・見えない文字は不可。
//         すこしだけ使える記号: 長音(ー)・中黒(・)・スペース・ハイフン・アポストロフィ・ピリオド・アンダーバー。12文字まで。
// NGワードは2段階: HARD=ふくまれていたら不可 / SOFT=それだけ(それだけの組み合わせ)のときだけ不可。
//   「ゆうじ」「かすみ」「あおい」のような ふつうの名前が、短いことばに引っかからないようにするため。
// 抜け道(全角半角・カタカナ・記号や空白でのきりはなし・数字でのいれかえ・同じ字のくりかえし)をふせぐため、
//   比べる前にかならず「そろえる(fold)」。リストの追加は、下の HARD / SOFT に そのまま書けば よい(自動でそろえる)。
(function () {
    const MAX = 12;

    // ---- NGワード ----
    // HARD: ふくまれていたら不可。強いことばだけを入れる(ふつうの名前の一部にならないもの)
    const HARD = [
        // 日本語(暴言・暴力)
        'しね', 'しねよ', 'しんでしまえ', 'しにたい', 'しんじゃえ', 'ころす', 'ころせ', 'ころされ', 'ころしてやる', 'ころしたい', 'さつがい', 'ぎゃくさつ', 'じさつ',
        'くたばれ', '死ね', '氏ね', '死んで', '死にたい', '殺す', '殺せ', '殺して', '殺人', '自殺', '虐殺',
        // 日本語(差別)
        'きちがい', 'きちげえ', 'めくら', 'つんぼ', 'びっこ', 'かたわ', 'ちゃんころ', '穢多', '部落', '池沼', '低能', 'ていのう', '障害者', '基地外', '気違い',
        // 日本語(性的・下品)
        'ちんこ', 'ちんぽ', 'ちんちん', 'まんこ', 'おっぱい', 'せっくす', 'ふぇら', 'ぱいずり', 'うんこ', 'うんち', 'おしっこ', 'おなにー', 'おなに', 'えろい',
        'やりまん', 'ろりこん', 'しょたこん', 'れいぷ', 'ごうかん', 'ちかん', 'いんもう', 'ちくび', '痴漢', '強姦', '売春', '援交', '援助交際', '糞', '屎',
        // 日本語(薬物・犯罪)
        'まやく', 'かくせいざい', 'こかいん', 'へろいん', 'だっぽう',
        // 英語
        'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'retard', 'rapist', 'pedophile', 'paedo', 'cocksucker',
        'motherfucker', 'pussy', 'penis', 'vagina', 'masturbat', 'orgasm', 'porn', 'suicide', 'hitler', 'killyou', 'dieyou', 'killyourself', 'hangyourself',
        // ローマ字(日本語)
        'korosu', 'korose', 'kichigai', 'chinko', 'chinpo', 'oppai',
        // そのほかの言語(ごく一部。足りない分は見つけたらここに足す)
        '去死', '傻逼', '他妈的', '操你', '씨발', '시발', '병신', '개새끼', 'mierda', 'pendejo', 'putain', 'connard', 'salope', 'scheisse', 'arschloch', 'hurensohn', 'пидор', 'блядь'
    ];
    // SOFT: そのことばだけ(または その組み合わせだけ)のときに不可。名前の一部なら通す(ゆうじ・かすみ・Cassie など)
    const SOFT = [
        // 日本語
        'ばか', 'ばかやろう', 'あほ', 'まぬけ', 'ぼけ', 'かす', 'くず', 'ごみ', 'ごみむし', 'ざこ', 'ぶす', 'ぶさいく', 'でぶ', 'はげ', 'ちび', 'うざい', 'うざ',
        'きもい', 'きも', 'きしょい', 'きしょ', 'きえろ', 'うせろ', 'だまれ', 'くそ', 'くそがき', 'くそやろう', 'ばばあ', 'じじい', 'ばくだん', 'てろ', 'てろりすと',
        'はんざい', 'ごうとう', 'ゆうかい', 'ひにん', 'えた', 'こじき', 'へんたい', 'えろ', 'しっこ', 'きらい', 'だいきらい', 'どじ', 'のろま', 'おたく', 'ぼっち',
        '馬鹿', '阿呆', '変態', '土人', '非人', '乞食', '糞', 'ばっか',
        // 英語
        'ass', 'arse', 'damn', 'dumb', 'stupid', 'idiot', 'moron', 'loser', 'ugly', 'fat', 'hate', 'kill', 'die', 'dead', 'death', 'sex', 'sexy', 'rape', 'dick', 'cock',
        'cum', 'anal', 'tits', 'boobs', 'wank', 'piss', 'nazi', 'hentai', 'fag', 'gay', 'crap', 'sucks', 'suck', 'noob', 'trash', 'jerk',
        // ローマ字(日本語)
        'baka', 'aho', 'kuso', 'kasu', 'uzai', 'kimoi', 'kimo', 'unko', 'unchi', 'chinchin', 'ecchi', 'hentai', 'bakayaro', 'manuke', 'manko', 'okama', 'kys',
        // そのほか
        'puta', 'suka', 'сука'
    ];

    // ---- そろえる(fold): 抜け道をふさぐため、比べる前に同じ形にする ----
    const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't', '8': 'b' };
    const SMALL = { 'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お', 'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ' };
    function base(s) {
        s = String(s == null ? '' : s).normalize('NFKC').toLowerCase();
        s = s.replace(/[À-ɏ]+/g, m => m.normalize('NFD').replace(/\p{Mn}/gu, ''));   // é → e (ラテン文字だけ。かなの濁点は残す)
        s = s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));   // カタカナ → ひらがな
        s = s.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, c => SMALL[c]);
        return s;
    }
    // 記号・空白・長音を取りのぞき、同じ字のくりかえしを1つにする
    function squash(s) {
        return s.replace(/[^\p{L}\p{N}]/gu, '').replace(/[ー〜\p{M}]/gu, '').replace(/(.)\1+/gu, '$1');
    }
    // 1つの名前から、くらべる形を いくつか作る(そのまま / 数字をとる / 数字を文字に見たてる)
    function variants(name) {
        const b = base(name);
        const leet = b.replace(/[0-9@$!|+]/g, c => LEET[c] || c);
        const out = new Set([squash(b), squash(b.replace(/\d+/g, '')), squash(leet)]);
        out.delete('');
        return Array.from(out);
    }
    // ALLOW: HARD のことばを たまたま ふくむ ふつうのことば(Scunthorpe問題)。比べる前に取りのぞく
    const ALLOW = [
        'scunthorpe', 'shiitake', 'shitake', 'therapist', 'niggardly', 'penistone', 'pussycat', 'pussywillow',
        'しねま', 'しねまにあ', 'ころすけ', 'うんちく', 'うんちん', 'ちかんじ'
    ];
    const ALLOW_F = ALLOW.map(w => squash(base(w))).filter(Boolean).sort((x, y) => y.length - x.length);
    function maskAllow(v) { let o = v; ALLOW_F.forEach(w => { if (o.includes(w)) o = o.split(w).join('|'); }); return o; }
    const HARD_F = Array.from(new Set(HARD.map(w => squash(base(w))).filter(Boolean)));
    const SOFT_F = new Set(SOFT.map(w => squash(base(w))).filter(Boolean));
    const SOFT_MAX = Math.max.apply(null, Array.from(SOFT_F).map(w => Array.from(w).length));

    // それだけ(SOFTのことばの組み合わせだけ)でできているか
    function onlySoft(s) {
        const cs = Array.from(s), n = cs.length;
        if (!n) return false;
        const ok = new Array(n + 1).fill(false); ok[0] = true;
        for (let i = 0; i < n; i++) {
            if (!ok[i]) continue;
            for (let l = 1; l <= SOFT_MAX && i + l <= n; l++) {
                if (SOFT_F.has(cs.slice(i, i + l).join(''))) ok[i + l] = true;
            }
        }
        return ok[n];
    }
    function hasNg(name) {
        return variants(name).some(v => { const m = maskAllow(v); return HARD_F.some(w => m.includes(w)) || onlySoft(v); });
    }
    // 個人情報(電話番号・メールアドレス・URL)
    function hasPii(name) {
        const s = String(name == null ? '' : name).normalize('NFKC').toLowerCase();
        if (/@|https?|www\.|\.(com|net|org|jp|co|io|me|ly|info|biz)(?![a-z])/.test(s)) return true;
        return /\d(?:[\d\s\-ー−‐]*\d){7,}/.test(s) || (s.replace(/\D/g, '').length >= 9);   // 数字が8けた以上つづく/合計9けた以上
    }

    function clean(raw) { return String(raw == null ? '' : raw).replace(/[\s　]+/g, ' ').trim(); }
    const BAD_CHARS = /[ᅟᅠㅤﾠ⠀︎️]/u;   // 見えない「ハングルのうめ字」など
    const OK_CHARS = /^[\p{L}\p{N}\p{M}・ '.\-_]+$/u;                    // 文字・数字・組み合わせ文字・少しの記号
    function codeLen(s) { return Array.from(s).length; }

    function validate(raw, opt) {
        const max = (opt && opt.max) || MAX;
        const name = clean(raw);
        if (!name) return { ok: false, name: '', reason: 'empty' };
        if (codeLen(name) > max) return { ok: false, name, reason: 'too_long' };
        if (BAD_CHARS.test(name) || !OK_CHARS.test(name) || !squash(base(name))) return { ok: false, name, reason: 'chars' };
        if (hasPii(name)) return { ok: false, name, reason: 'pii' };
        if (hasNg(name)) return { ok: false, name, reason: 'ng' };
        return { ok: true, name, reason: '' };
    }

    // いま遊んでいる言語(各ゲームの currentLang などを見る。なければ <html lang>)
    function autoLang() {
        const ok = (l) => typeof l === 'string' && /^(ja|en|simple|easy|ja_easy|kana)/i.test(l);
        let l = '';
        try { if (typeof currentLang !== 'undefined' && ok(currentLang)) l = currentLang; } catch (e) {}
        if (!l) try { if (typeof curLang !== 'undefined' && ok(curLang)) l = curLang; } catch (e) {}
        if (!l) try { if (typeof lang !== 'undefined' && ok(lang)) l = lang; } catch (e) {}
        if (!l) try { if (typeof LANG !== 'undefined' && ok(LANG)) l = LANG; } catch (e) {}
        if (!l) try { if (typeof gameLang !== 'undefined' && ok(gameLang)) l = gameLang; } catch (e) {}
        if (!l) l = document.documentElement.lang || 'ja';
        if (/^en/i.test(l)) return 'en';
        if (/easy|simple|kana/i.test(l)) return 'simple';
        return 'ja';
    }
    const MSG = {
        empty:    { ja: 'なまえを にゅうりょくしてね', simple: 'なまえを にゅうりょくしてね', en: 'Please enter a name.' },
        too_long: { ja: '12もじ いないで いれてね', simple: '12もじ いないで いれてね', en: 'Please use 12 characters or fewer.' },
        chars:    { ja: 'つかえない もじが はいっています。もじと すうじで いれてね', simple: 'つかえない もじが はいっています。もじと すうじで いれてね', en: 'Please use only letters and numbers.' },
        ng:       { ja: 'この なまえは つかえません。ほかの なまえに してね', simple: 'この なまえは つかえません。ほかの なまえに してね', en: 'That name can\'t be used. Please try another one.' },
        pii:      { ja: 'でんわばんごうや、メールアドレス、URLは いれないでね', simple: 'でんわばんごうや、メールアドレス、URLは いれないでね', en: 'Please don\'t use phone numbers, e-mail addresses or links.' }
    };
    function message(reason, lang) {
        const m = MSG[reason] || MSG.ng;
        const l = lang || autoLang();
        const k = /^en/i.test(l) ? 'en' : /easy|simple|kana/i.test(l) ? 'simple' : 'ja';
        return m[k];
    }
    // 入力欄の下に、赤い小さなメッセージを3.5秒だけ出す(ゲームに専用の表示がないとき用)
    function showError(inputEl, text) {
        if (!inputEl || !inputEl.parentNode) return;
        let el = inputEl._fglErr;
        if (!el) {
            el = document.createElement('div');
            el.style.cssText = 'color:#e5392a;font-size:0.9rem;font-weight:800;line-height:1.3;margin:4px 0 0;text-align:center;font-family:inherit;';
            inputEl.parentNode.insertBefore(el, inputEl.nextSibling);
            inputEl._fglErr = el;
        }
        el.textContent = text;
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.textContent = ''; }, 3500);
    }

    function isBlocked(name) { const s = clean(name); return !!s && (hasPii(s) || hasNg(s)); }
    // ランキングなどに出す名前。NG・個人情報なら fallback。長すぎる名前(古い登録)は16文字でおさえる
    function display(name, fallback) {
        const fb = fallback === undefined ? 'ななしさん' : fallback;
        let s = clean(String(name == null ? '' : name).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, ''));
        if (!s) return fb;
        if (isBlocked(s)) return fb;
        const cs = Array.from(s);
        return cs.length > 16 ? cs.slice(0, 16).join('') : s;
    }

    window.FGLName = { MAX, validate, message, showError, isBlocked, display, _fold: variants };
})();
