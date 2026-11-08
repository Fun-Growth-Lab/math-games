// fgl-icons.js — 絵文字を端末に依存しない自前のSVGアイコンに置き換える共通部品
//
// 端末によっては絵文字が「×」や豆腐(□)になって意味がわからなくなるため、
// 画面に出た絵文字を自動でインラインSVGに差し替える。
//
// 使い方:
//   <script src="../fgl-icons.js?v=..."></script>   ← <body> の前でも後でもよい
//   これだけで、ページ内のテキスト(後から innerHTML/textContent で入る文字も)の絵文字が
//   <span class="fgi fgi-名前"><svg>…</svg></span> に変わる。I18N辞書の文字列はそのままでよい。
//
//   FGLIcons.html('gem')          … アイコンのHTML文字列(名前 or 絵文字)
//   FGLIcons.convert(el)          … 手動で変換(ふつうは不要)
//   FGLIcons.missing()            … 対応表にない絵文字の一覧(展開作業のときに console で確認する)
//
// 注意:
//   - canvas の fillText に描く絵文字は変換できない(ゲーム側で FGLIcons.draw などを使うこと)
//   - <option> と <title> の中はSVGを入れられないので、絵文字を取りのぞくだけ
//   - ♥♦♠♣ ▶◀ → ■□ ★☆ などの記号は日本語フォントにあるので変換しない
(function () {
    'use strict';
    if (window.FGLIcons) return;

    // 輪郭(暗い背景でも明るい背景でも形がわかるように、うすい影色のふち)
    var O = 'stroke="rgba(0,0,0,.45)" stroke-width="1" stroke-linejoin="round"';

    // ---- アイコンの形(viewBox 0 0 24 24) ----
    var HEART = 'M12 21.2C9 19 2.4 14.6 2.4 8.9 2.4 5.9 4.7 3.6 7.5 3.6c1.9 0 3.5 1 4.5 2.6 1-1.6 2.6-2.6 4.5-2.6 2.8 0 5.1 2.3 5.1 5.3 0 5.7-6.6 10.1-9.6 12.3z';
    var STAR5 = 'M12 2.2l2.9 6.2 6.8.8-5 4.6 1.4 6.7L12 17.1l-6.1 3.4 1.4-6.7-5-4.6 6.8-.8z';
    var SKULL = '<path d="M12 2.5c-4.6 0-8 3.2-8 7.6 0 2.6 1.2 4.4 3 5.4V19c0 .8.6 1.4 1.4 1.4h7.2c.8 0 1.4-.6 1.4-1.4v-3.5c1.8-1 3-2.8 3-5.4 0-4.4-3.4-7.6-8-7.6z" fill="#f1ede4" stroke="#6b6458" stroke-width="1.1" stroke-linejoin="round"/>'
        + '<circle cx="8.6" cy="11" r="2.1" fill="#2b2430"/><circle cx="15.4" cy="11" r="2.1" fill="#2b2430"/>'
        + '<path d="M12 13.4l-1.3 2.2h2.6z" fill="#2b2430"/><path d="M9.5 18.2v2M12 18.2v2M14.5 18.2v2" stroke="#2b2430" stroke-width="1.1"/>';
    var CARD = function (inner) { return '<rect x="4.5" y="2.5" width="15" height="19" rx="2.2" fill="#fbf7ee" ' + O + '/>' + inner; };
    var MEDAL = function (c1, c2, n) {
        return '<path d="M7 2h4l2 6H9z" fill="#3f78d8"/><path d="M17 2h-4l-2 6h4z" fill="#d84a4a"/>'
            + '<circle cx="12" cy="15" r="7" fill="' + c1 + '" ' + O + '/><circle cx="12" cy="15" r="5" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>'
            + '<text x="12" y="18.2" text-anchor="middle" font-size="8.5" font-weight="900" font-family="Arial,sans-serif" fill="' + c2 + '">' + n + '</text>';
    };

    // 顔の絵(動物・人)の共通部品
    var FACE = function (fill, extra) { return '<circle cx="12" cy="13" r="8.5" fill="' + fill + '" ' + O + '/>' + (extra || ''); };
    var EYES = '<circle cx="9" cy="12.3" r="1.15" fill="#2b2430"/><circle cx="15" cy="12.3" r="1.15" fill="#2b2430"/>';
    var SMILE = '<path d="M9.5 15.6c1.4 1.3 3.6 1.3 5 0" stroke="#2b2430" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    var LETTER = function (bg, txt, size) { return '<rect x="2" y="2" width="20" height="20" rx="4.5" fill="' + bg + '" ' + O + '/><text x="12" y="' + (12 + size * 0.36) + '" text-anchor="middle" font-size="' + size + '" font-weight="900" font-family="Arial,sans-serif" fill="#fff">' + txt + '</text>'; };

    var ICONS = {
        heart:       '<path d="' + HEART + '" fill="#ec3b55" ' + O + '/><ellipse cx="7.4" cy="8" rx="1.9" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 7.4 8)"/>',
        heart_green: '<path d="' + HEART + '" fill="#3cc65c" ' + O + '/><ellipse cx="7.4" cy="8" rx="1.9" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 7.4 8)"/>',
        shield:      '<path d="M12 2l8.2 3v6.2c0 5.2-3.5 9.3-8.2 10.9C7.3 20.5 3.8 16.4 3.8 11.2V5z" fill="#4b80d6" ' + O + '/><path d="M12 4.3l6 2.2v4.7c0 3.9-2.5 7.1-6 8.4z" fill="#3463b4"/><path d="M12 6v12.5M7 11h10" stroke="#f3c64a" stroke-width="2.2" stroke-linecap="round"/>',
        swords:      '<g stroke-linecap="round"><path d="M4 4l11.5 11.5M20 4L8.5 15.5" stroke="#5a6475" stroke-width="3.8"/><path d="M4 4l11.5 11.5M20 4L8.5 15.5" stroke="#dfe7f2" stroke-width="2.2"/>'
                   + '<path d="M13.2 18.4l5.2-5.2M10.8 18.4L5.6 13.2" stroke="#e0a83a" stroke-width="2.2"/><path d="M17.3 17.3l2.8 2.8M6.7 17.3l-2.8 2.8" stroke="#8a5a2b" stroke-width="2.6"/></g>',
        dagger:      '<g stroke-linecap="round"><path d="M19.5 4.5L9 15" stroke="#5a6475" stroke-width="4.2"/><path d="M19.5 4.5L9 15" stroke="#dfe7f2" stroke-width="2.6"/><path d="M6.6 12.6l4.8 4.8" stroke="#e0a83a" stroke-width="2.4"/><path d="M8.1 15.9L4.5 19.5" stroke="#8a5a2b" stroke-width="2.8"/></g>',
        sparkles:    '<path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z" fill="#ffd43b" ' + O + '/><path d="M18 13l.9 2.6 2.6.9-2.6.9L18 20l-.9-2.6-2.6-.9 2.6-.9z" fill="#ffe680" ' + O + '/><path d="M18.5 2.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="#fff3b0"/>',
        star:        '<path d="' + STAR5 + '" fill="#ffc928" ' + O + '/><path d="M12 5.5l1.8 3.9" stroke="#fff6c4" stroke-width="1.3" stroke-linecap="round"/>',
        star_glow:   '<g stroke="#ffe680" stroke-width="1.6" stroke-linecap="round"><path d="M12 .8v1.6M1.6 8.6l1.5.5M22.4 8.6l-1.5.5M4.8 21.6l1-1.3M19.2 21.6l-1-1.3"/></g><path d="' + STAR5 + '" fill="#ffb020" ' + O + ' transform="translate(12 12) scale(.82) translate(-12 -12)"/>',
        dizzy:       '<path d="M3 15c1-6 8-10 14-7" fill="none" stroke="#ffcf3b" stroke-width="2" stroke-linecap="round"/><path d="M5 19c4 1 10-1 12-5" fill="none" stroke="#ffe680" stroke-width="1.5" stroke-linecap="round"/><path d="M17 3.5l1.3 2.9 3.2.4-2.4 2.2.7 3.2-2.8-1.6-2.8 1.6.7-3.2-2.4-2.2 3.2-.4z" fill="#ffc928" ' + O + '/>',
        skull:       SKULL,
        skull_bones: '<g stroke-linecap="round"><path d="M3.5 13.5l17 7M20.5 13.5l-17 7" stroke="#6b6458" stroke-width="3.8"/><path d="M3.5 13.5l17 7M20.5 13.5l-17 7" stroke="#f1ede4" stroke-width="2.3"/></g><g transform="translate(12 9) scale(.78) translate(-12 -11)">' + SKULL + '</g>',
        crystal:     '<path d="M6 19h12l1.5 3h-15z" fill="#a8743e" ' + O + '/><circle cx="12" cy="10.5" r="8" fill="#9a5ce0" ' + O + '/><circle cx="12" cy="10.5" r="5.5" fill="#b884f2" opacity=".7"/><ellipse cx="9" cy="7.5" rx="2.2" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-35 9 7.5)"/>',
        wand:        '<path d="M4 20.5L15 9.5" stroke="#2c2433" stroke-width="2.8" stroke-linecap="round"/><path d="M13.3 11.2L15 9.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M18 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="#ffd43b"/><circle cx="21" cy="10.5" r="1" fill="#ffe680"/><circle cx="13" cy="3.5" r=".9" fill="#ffe680"/>',
        joker:       CARD('<path d="M12 6.5l1.5 3.2 3.5.4-2.6 2.4.7 3.4L12 14.2l-3.1 1.7.7-3.4L7 10.1l3.5-.4z" fill="#e0344e"/><text x="7" y="7.6" font-size="4.6" font-weight="900" font-family="Arial,sans-serif" fill="#2a2a3a" text-anchor="middle">J</text><text x="17" y="20" font-size="4.6" font-weight="900" font-family="Arial,sans-serif" fill="#2a2a3a" text-anchor="middle">J</text>'),
        flowercard:  CARD('<rect x="6.5" y="4.5" width="11" height="15" rx="1" fill="#c8332f"/><circle cx="12" cy="9" r="3" fill="#f7f1e1"/><path d="M7 16.5c2-2 3.5-2 5 0s3 2 5 0" stroke="#2b6b3a" stroke-width="1.6" fill="none"/>'),
        bolt:        '<path d="M13.8 1.8L4.8 13.4h6.1l-1.5 8.8 9.1-11.8h-6.2z" fill="#ffd21f" ' + O + '/>',
        gem:         '<path d="M6.5 3.5h11l4 5.2L12 21 2.5 8.7z" fill="#4fd2f0" ' + O + '/><path d="M2.5 8.7h19M6.5 3.5L9 8.7 12 21l3-12.3 2.5-5.2M9 8.7L12 3.5l3 5.2" fill="none" stroke="#1d8fb3" stroke-width=".9"/><path d="M6.8 4.5L5 8h3z" fill="#c9f4ff"/>',
        shuffle:     '<rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#3a8ee6" ' + O + '/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h3c3.5 0 4.5 8 8 8h2.5M5 16h3c1.4 0 2.3-1.2 3-2.7M13 10.7c.7-1.5 1.6-2.7 3-2.7h2.5"/><path d="M16.5 5.5L19 8l-2.5 2.5M16.5 13.5L19 16l-2.5 2.5"/></g>',
        question:    '<circle cx="12" cy="12" r="10" fill="#e8384f" ' + O + '/><path d="M9 9.3c0-1.8 1.4-3 3.1-3 1.8 0 3.1 1.2 3.1 2.8 0 2.3-3.1 2.4-3.1 4.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12.1" cy="17.4" r="1.45" fill="#fff"/>',
        party:       '<path d="M3 21l4.8-13.5 8.7 8.7z" fill="#ffb422" ' + O + '/><path d="M5 15.4l3.6 3.6M6.4 11.3l6.3 6.3" stroke="#e8384f" stroke-width="1.5"/><circle cx="15" cy="4" r="1.3" fill="#3a8ee6"/><circle cx="20.5" cy="9" r="1.3" fill="#e8384f"/><path d="M11 3.5c1 1.5 0 3 1 4.5M16 12c1.5-1 3 0 4.5-1" stroke="#3cc65c" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19 3l.6 1.6L21 5l-1.4.5L19 7l-.6-1.5L17 5l1.4-.4z" fill="#ffd43b"/>',
        gear:        '<path d="M10.3 1.8h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9L3.3 6.1l2.4-2.4 2.2 1.5 1.9-.8z" fill="#9aa6b8" ' + O + '/><circle cx="12" cy="12" r="3.6" fill="#4a5466"/>',
        crown:       '<path d="M2.5 7.5l4.7 4.2L12 4l4.8 7.7 4.7-4.2-1.8 11.5H4.3z" fill="#ffc928" ' + O + '/><path d="M4.6 16.5h14.8" stroke="#d68a12" stroke-width="1.3"/><circle cx="12" cy="13.2" r="1.6" fill="#e8384f"/><circle cx="7.3" cy="14" r="1.1" fill="#3a8ee6"/><circle cx="16.7" cy="14" r="1.1" fill="#3cc65c"/>',
        person:      '<circle cx="12" cy="8" r="4.6" fill="#7d8fb3" ' + O + '/><path d="M3.5 21.5c0-4.6 3.8-7.6 8.5-7.6s8.5 3 8.5 7.6z" fill="#7d8fb3" ' + O + '/>',
        trophy:      '<path d="M7 3h10v5.5c0 3-2.2 5.4-5 5.4S7 11.5 7 8.5z" fill="#ffc928" ' + O + '/><path d="M7 5H4c0 3 1.2 4.6 3.4 5M17 5h3c0 3-1.2 4.6-3.4 5" fill="none" stroke="#e8a317" stroke-width="1.6"/><path d="M10.8 13.6h2.4v3.4h-2.4z" fill="#e8a317"/><rect x="7" y="17" width="10" height="4" rx="1" fill="#a8743e" ' + O + '/><path d="M9.5 5v3.5" stroke="#fff3b0" stroke-width="1.3" stroke-linecap="round"/>',
        books:       '<rect x="3" y="15.5" width="18" height="5" rx="1" fill="#e8384f" ' + O + '/><rect x="4.5" y="10.5" width="15" height="5" rx="1" fill="#3a8ee6" ' + O + '/><rect x="3.5" y="5.5" width="16" height="5" rx="1" fill="#3cc65c" ' + O + '/><path d="M5.5 18h13M6.5 13h11M5.5 8h12" stroke="#fff" stroke-width=".9" opacity=".75"/>',
        beginner:    '<path d="M12 7l-7-4.5v13L12 21z" fill="#ffd21f" ' + O + '/><path d="M12 7l7-4.5v13L12 21z" fill="#22a94b" ' + O + '/>',
        house:       '<path d="M2.5 11.5L12 3l9.5 8.5" fill="none" stroke="#c8332f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10.5V21h14V10.5L12 4.5z" fill="#f4e3c4" ' + O + '/><rect x="10" y="14" width="4" height="7" fill="#a8743e"/>',
        trash:       '<path d="M5.5 7h13l-1.2 14H6.7z" fill="#9aa6b8" ' + O + '/><rect x="3.5" y="4.5" width="17" height="2.6" rx="1" fill="#7a8699" ' + O + '/><path d="M9.5 4.5V3h5v1.5" fill="none" stroke="#7a8699" stroke-width="1.5"/><path d="M9.5 10v8M12 10v8M14.5 10v8" stroke="#5a6475" stroke-width="1.2"/>',
        boom:        '<path d="M12 1.5l2.2 5.3 5.1-2.9-1.9 5.6 5.1 1.6-4.9 2.3 3.3 4.7-5.6-1-.6 5.7L12 18.3l-2.7 4.5-.6-5.7-5.6 1 3.3-4.7L1.5 11.1l5.1-1.6-1.9-5.6 5.1 2.9z" fill="#ff7a1a" ' + O + '/><path d="M12 6.5l1.3 3.2 3.3-.8-2 2.7 2.7 2-3.4.3.3 3.3L12 15l-2.2 2.2.3-3.3-3.4-.3 2.7-2-2-2.7 3.3.8z" fill="#ffd43b"/>',
        check_box:   '<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#2fb85a" ' + O + '/><path d="M6.5 12.5l3.7 3.7 7.3-8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
        check:       '<path d="M3.5 12.5l5.5 5.5L20.5 6" fill="none" stroke="#2fb85a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>',
        cross:       '<path d="M5 5l14 14M19 5L5 19" stroke="#e8384f" stroke-width="4" stroke-linecap="round"/>',
        oni:         '<path d="M5.5 7L4 1.8 9 5.2M18.5 7L20 1.8 15 5.2" fill="#f4e3c4" ' + O + '/><circle cx="12" cy="13" r="9" fill="#e0443a" ' + O + '/><path d="M7 10.5l3 1.2M17 10.5l-3 1.2" stroke="#2b1a1a" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="12.6" r="1.1" fill="#ffd21f"/><circle cx="15" cy="12.6" r="1.1" fill="#ffd21f"/><path d="M7.5 16.5h9l-1 2.5h-7z" fill="#2b1a1a"/><path d="M8.6 16.5l.8 1.5.8-1.5M13.8 16.5l.8 1.5.8-1.5" fill="#fff"/>',
        slot:        '<rect x="3" y="4" width="15" height="17" rx="2.5" fill="#e8384f" ' + O + '/><rect x="5" y="7" width="11" height="6" rx="1" fill="#fff"/><text x="10.5" y="12.2" text-anchor="middle" font-size="5.6" font-weight="900" font-family="Arial,sans-serif" fill="#e8384f">777</text><rect x="6" y="15.5" width="9" height="2.5" rx="1" fill="#ffc928"/><path d="M18 8.5h1.5V4" stroke="#7a8699" stroke-width="1.5" fill="none"/><circle cx="19.5" cy="3.5" r="1.8" fill="#ffc928" ' + O + '/>',
        circle_green:'<circle cx="12" cy="12" r="9.5" fill="#2fb85a" ' + O + '/>',
        circle_red:  '<circle cx="12" cy="12" r="9.5" fill="#e8384f" ' + O + '/>',
        circle_blue: '<circle cx="12" cy="12" r="9.5" fill="#3a8ee6" ' + O + '/>',
        circle_yellow:'<circle cx="12" cy="12" r="9.5" fill="#ffc928" ' + O + '/>',
        wizard:      '<path d="M12 1.5L5.5 13h13z" fill="#6a3fc0" ' + O + '/><path d="M3 13.5h18" stroke="#4a2a90" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="4" fill="#f6d2b0" ' + O + '/><path d="M8.5 18.5c1 3.5 6 3.5 7 0l-3.5 4z" fill="#eee"/><path d="M11 6.5l.5 1.3 1.3.4-1.3.4-.5 1.3-.4-1.3-1.3-.4 1.3-.4z" fill="#ffd43b"/>',
        note:        '<path d="M9 18V5l11-2.5v13" fill="none" stroke="#3a8ee6" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="6.3" cy="18.3" rx="3.3" ry="2.6" fill="#3a8ee6"/><ellipse cx="17.3" cy="15.8" rx="3.3" ry="2.6" fill="#3a8ee6"/>',
        bat:         '<path d="M12 9c-1.5-2.5-3-3.5-5-3.3C5 6 3 7.5 1.5 10c1.5-.5 2.6 0 3 1.5 1-1 2.6-1 3.2.6.8-1.2 2.3-1.2 2.8.4L12 15l1.5-2.5c.5-1.6 2-1.6 2.8-.4.6-1.6 2.2-1.6 3.2-.6.4-1.5 1.5-2 3-1.5-1.5-2.5-3.5-4-5.5-4.3-2-.2-3.5.8-5 3.3z" fill="#4b3a6b" ' + O + '/><path d="M10.8 7.5l-.5-1.6M13.2 7.5l.5-1.6" stroke="#4b3a6b" stroke-width="1.2"/><circle cx="11.2" cy="10" r=".6" fill="#ff5a5a"/><circle cx="12.8" cy="10" r=".6" fill="#ff5a5a"/>',
        zombie:      '<rect x="4.5" y="3.5" width="15" height="17" rx="6.5" fill="#8cc06a" ' + O + '/><circle cx="9.3" cy="10.5" r="2" fill="#fff"/><circle cx="9.3" cy="10.5" r=".9" fill="#222"/><circle cx="15" cy="11" r="1.4" fill="#222"/><path d="M8.5 16.2h7" stroke="#2f3a24" stroke-width="1.6" stroke-linecap="round"/><path d="M10 15.4v1.6M12 15.4v1.6M14 15.4v1.6" stroke="#2f3a24" stroke-width=".9"/><path d="M6 6.5l2.5 1.5" stroke="#5b8a40" stroke-width="1.2"/>',
        vase:        '<path d="M9 2.5h6v2l-1 1.5c3.5 1.8 5.5 4.6 5.5 8 0 4.4-3.4 7.5-7.5 7.5s-7.5-3.1-7.5-7.5c0-3.4 2-6.2 5.5-8L9 4.5z" fill="#d07a3a" ' + O + '/><path d="M5.5 12h13M6 15.5h12" stroke="#2b2430" stroke-width="1.3"/><path d="M8 13.7l2-1.7 2 1.7 2-1.7 2 1.7" stroke="#2b2430" stroke-width=".9" fill="none"/>',
        moai:        '<path d="M7 3.5h9.5l1 4-1.3 1.5.8 4-1.5 1 .5 3.5-2 3.5H8.5l-1-3.5z" fill="#8f9aa8" ' + O + '/><path d="M8.5 9h3.2M13.5 9h2.5" stroke="#3d4450" stroke-width="1.7" stroke-linecap="round"/><path d="M14.5 9.5l1.3 4.5h-2.5" fill="none" stroke="#3d4450" stroke-width="1.1"/><path d="M10.5 17h4" stroke="#3d4450" stroke-width="1.5" stroke-linecap="round"/><path d="M7 3.5h9.5v2H7z" fill="#6f7987"/>',
        dragon:      '<path d="M4 19c0-6 3-10 8-10.5L13 4l2.5 3 2-2.5.5 4.5c2.5 1.2 3.8 3.5 3.5 6l-3-.5-1.5 2.5c-1.5-1.5-3.5-1.8-5-1L9.5 19c-2.5 1-4 1.8-5.5 0z" fill="#3fae5a" ' + O + '/><circle cx="17" cy="10.5" r="1.2" fill="#ffd21f"/><circle cx="17.2" cy="10.6" r=".5" fill="#222"/><path d="M8 13.5l1.5 2M10.5 12l1.2 2" stroke="#2a7a3c" stroke-width="1.1" stroke-linecap="round"/><path d="M20.5 14.5l1.6.6" stroke="#ff7a1a" stroke-width="1.3" stroke-linecap="round"/>',
        eye:         '<path d="M1.5 12C4 7.5 7.8 5 12 5s8 2.5 10.5 7c-2.5 4.5-6.3 7-10.5 7s-8-2.5-10.5-7z" fill="#fff" ' + O + '/><circle cx="12" cy="12" r="4.3" fill="#7a4a24"/><circle cx="12" cy="12" r="2.1" fill="#1a1a1a"/><circle cx="13.3" cy="10.7" r=".9" fill="#fff"/>',
        target:      '<circle cx="12" cy="12" r="10" fill="#e8384f" ' + O + '/><circle cx="12" cy="12" r="7" fill="#fff"/><circle cx="12" cy="12" r="4.2" fill="#e8384f"/><circle cx="12" cy="12" r="1.7" fill="#fff"/><path d="M12 12l8-8" stroke="#3a3a4a" stroke-width="1.6" stroke-linecap="round"/><path d="M19 2.5v2.5h2.5" stroke="#3a8ee6" stroke-width="1.6" fill="none"/>',
        dove:        '<path d="M2.5 13c3-.5 5-2 6-4.5C10 5 12.5 3.5 15.5 4l1.5-1.5.5 2.5 3.5 1.5-3 1c-.5 4-1.5 7-4 9l2.5 3.5H12l-1.3-2.4C7 18.5 4 16.5 2.5 13z" fill="#fff" stroke="#7a8699" stroke-width="1.1" stroke-linejoin="round"/><path d="M9 10.5c1.5 2 4 3 7 2.5" fill="none" stroke="#b9c3d0" stroke-width="1.1"/><circle cx="16.3" cy="5.6" r=".7" fill="#222"/>',
        lock:        '<path d="M7.5 10.5V7.5a4.5 4.5 0 019 0v3" fill="none" stroke="#9aa6b8" stroke-width="2.4"/><rect x="4.5" y="10.5" width="15" height="11" rx="2" fill="#ffc928" ' + O + '/><circle cx="12" cy="15" r="1.6" fill="#7a5410"/><path d="M12 15.5v3" stroke="#7a5410" stroke-width="1.6" stroke-linecap="round"/>',
        unlock:      '<path d="M7.5 10.5V7a4.5 4.5 0 018.6-1.9" fill="none" stroke="#9aa6b8" stroke-width="2.4" stroke-linecap="round"/><rect x="4.5" y="10.5" width="15" height="11" rx="2" fill="#ffc928" ' + O + '/><circle cx="12" cy="15" r="1.6" fill="#7a5410"/><path d="M12 15.5v3" stroke="#7a5410" stroke-width="1.6" stroke-linecap="round"/>',
        medal1:      MEDAL('#ffc928', '#a8740e', '1'),
        medal2:      MEDAL('#d3dae4', '#6f7b8c', '2'),
        medal3:      MEDAL('#d98a4a', '#7a4318', '3'),
        globe:       '<circle cx="12" cy="12" r="9.5" fill="#3a8ee6" ' + O + '/><path d="M2.5 12h19M12 2.5c-3.5 3.5-3.5 15.5 0 19M12 2.5c3.5 3.5 3.5 15.5 0 19M4.2 7h15.6M4.2 17h15.6" fill="none" stroke="#d6ecff" stroke-width="1"/>',
        speaker:     '<path d="M3 9h4l5-4.5v15L7 15H3z" fill="#5a6a85" ' + O + '/><path d="M15 8.5c1.5 1.8 1.5 5.2 0 7M18 6c2.8 3.2 2.8 8.8 0 12" fill="none" stroke="#3a8ee6" stroke-width="2" stroke-linecap="round"/>',
        mute:        '<path d="M3 9h4l5-4.5v15L7 15H3z" fill="#5a6a85" ' + O + '/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="#e8384f" stroke-width="2.2" stroke-linecap="round"/>',
        next:        '<path d="M3 5l8 7-8 7zM11 5l8 7-8 7z" fill="#5a6a85"/><rect x="19" y="5" width="2.4" height="14" fill="#5a6a85"/>',
        pause:       '<rect x="5.5" y="4.5" width="4.5" height="15" rx="1" fill="#5a6a85"/><rect x="14" y="4.5" width="4.5" height="15" rx="1" fill="#5a6a85"/>',
        // ---- アビスラビリンス ----
        heart_yellow:'<path d="' + HEART + '" fill="#ffcc1f" ' + O + '/><ellipse cx="7.4" cy="8" rx="1.9" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 7.4 8)"/>',
        heart_pink:  '<path d="' + HEART + '" fill="#ff7eb6" ' + O + '/><ellipse cx="7.4" cy="8" rx="1.9" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 7.4 8)"/>',
        circle_purple:'<circle cx="12" cy="12" r="9.5" fill="#9a5ce0" ' + O + '/>',
        monster:     '<path d="M7 4l2 3h6l2-3M3 11h2V8h14v3h2v6h-2v-2H5v2H3z" fill="#9a5ce0" ' + O + '/><path d="M5 15h14v2h-3v3h-2v-3h-4v3H8v-3H5z" fill="#9a5ce0" ' + O + '/><rect x="8" y="10" width="2.4" height="2.4" fill="#fff"/><rect x="13.6" y="10" width="2.4" height="2.4" fill="#fff"/>',
        pill:        '<g transform="rotate(-40 12 12)"><rect x="3" y="8" width="18" height="8" rx="4" fill="#fff"/><path d="M12 8h5a4 4 0 010 8h-5z" fill="#e8384f"/><rect x="3" y="8" width="18" height="8" rx="4" fill="none" ' + O + '/></g>',
        reload:      '<rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#3a8ee6" ' + O + '/><g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 10a6 6 0 00-10.6-2.2M6.5 14a6 6 0 0010.6 2.2"/><path d="M6 4.5v3.6h3.6M18 19.5v-3.6h-3.6"/></g>',
        repeat:      '<rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#3a8ee6" ' + O + '/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V9.5A2.5 2.5 0 018.5 7H17M18 13v1.5a2.5 2.5 0 01-2.5 2.5H7"/><path d="M15 4.8L17.3 7 15 9.2M9 14.8L6.7 17 9 19.2"/></g>',
        chart:       '<rect x="2.5" y="2.5" width="19" height="19" rx="2.5" fill="#fff" ' + O + '/><rect x="5.5" y="12" width="3" height="6.5" fill="#3a8ee6"/><rect x="10.5" y="7" width="3" height="11.5" fill="#e8384f"/><rect x="15.5" y="10" width="3" height="8.5" fill="#2fb85a"/>',
        fire:        '<path d="M12 22c-4.4 0-7.5-3-7.5-7 0-3.5 2.3-5.6 3.8-8 .4 2 1.4 3.2 2.6 3.7C11 7 12.3 4 15 2c-.4 3 1.3 5 2.7 6.8 1.2 1.6 1.8 3.4 1.8 5.2 0 4.6-3.1 8-7.5 8z" fill="#ff6a1a" ' + O + '/><path d="M12 22c-2.3 0-3.8-1.6-3.8-3.8 0-2.3 1.8-3.6 2.8-5.2.3 1.4 1 2.1 1.8 2.4.4-1.6 1.2-2.6 2.2-3.4-.1 1.8.8 3 1.4 4 .4.7.6 1.4.6 2.2 0 2.3-2 3.8-5 3.8z" fill="#ffd43b"/>',
        diamond_dot: '<path d="M12 1.8L22.2 12 12 22.2 1.8 12z" fill="#3fb8e8" ' + O + '/><path d="M12 5.5L18.5 12 12 18.5 5.5 12z" fill="#8fdcff"/><circle cx="12" cy="12" r="2.2" fill="#1d6fa8"/>',
        diamond_blue:'<path d="M12 2L21 12 12 22 3 12z" fill="#3a7fe6" ' + O + '/><path d="M12 2L7.5 12H3zM12 2l4.5 10H21z" fill="#7fb2ff" opacity=".7"/>',
        bag:         '<path d="M9 6V4.5a3 3 0 016 0V6" fill="none" stroke="#7a4a24" stroke-width="1.8"/><rect x="4" y="6" width="16" height="15.5" rx="4" fill="#d07a3a" ' + O + '/><rect x="7" y="13" width="10" height="6" rx="1.5" fill="#a85a24"/><path d="M4.5 11h15" stroke="#a85a24" stroke-width="1.4"/><circle cx="12" cy="11" r="1.2" fill="#ffc928"/>',
        book:        '<path d="M12 6c-2.5-2-6-2.4-9.5-1.5v14c3.5-.9 7-.5 9.5 1.5 2.5-2 6-2.4 9.5-1.5v-14C18 3.6 14.5 4 12 6z" fill="#fff" ' + O + '/><path d="M12 6v14" stroke="#a8743e" stroke-width="1.2"/><path d="M4.5 8.5c2-.4 4-.2 5.5.6M4.5 11.5c2-.4 4-.2 5.5.6M14 9.1c1.5-.8 3.5-1 5.5-.6M14 12.1c1.5-.8 3.5-1 5.5-.6" stroke="#9aa6b8" stroke-width=".9" fill="none"/><path d="M2.5 18.5c3.5-.9 7-.5 9.5 1.5 2.5-2 6-2.4 9.5-1.5v1.5c-3.5-.6-7-.2-9.5 1.5-2.5-1.7-6-2.1-9.5-1.5z" fill="#3a8ee6"/>',
        map:         '<path d="M2.5 5.5l6-2 7 2.5 6-2v15l-6 2-7-2.5-6 2z" fill="#f4e3b4" ' + O + '/><path d="M8.5 3.5v15M15.5 6v15" stroke="#c8a96a" stroke-width="1"/><path d="M5 14c2-1 3-3 6-2s4 0 5.5-2" stroke="#e8384f" stroke-width="1.4" stroke-dasharray="1.6 1.4" fill="none"/><path d="M17 7.5l2 2M19 7.5l-2 2" stroke="#e8384f" stroke-width="1.4" stroke-linecap="round"/><path d="M4 8c1 .5 2 .3 3-.5" stroke="#3cc65c" stroke-width="1.6" fill="none"/>',
        scroll:      '<rect x="5" y="4" width="14" height="16" fill="#f4e3b4" ' + O + '/><rect x="3" y="2.5" width="18" height="3.5" rx="1.75" fill="#d9b878" ' + O + '/><rect x="3" y="18" width="18" height="3.5" rx="1.75" fill="#d9b878" ' + O + '/><path d="M8 9h8M8 12h8M8 15h5" stroke="#8a6a3a" stroke-width="1.2" stroke-linecap="round"/>',
        bow:         '<path d="M5 3c8 2 14 8 16 16" fill="none" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/><path d="M5 3l16 16" stroke="#cfd8e3" stroke-width=".9"/><path d="M3 21L17 7" stroke="#6b4a2b" stroke-width="1.6" stroke-linecap="round"/><path d="M19.5 4.5L15 6l3 3z" fill="#9aa6b8" ' + O + '/><path d="M3 21l-.5-3M3 21l3 .5" stroke="#e8384f" stroke-width="1.6" stroke-linecap="round"/>',
        gift:        '<rect x="3" y="9" width="18" height="12.5" rx="1.5" fill="#e8384f" ' + O + '/><rect x="2" y="6.5" width="20" height="4" rx="1" fill="#ff5a6e" ' + O + '/><path d="M12 6.5v15" stroke="#ffc928" stroke-width="3"/><path d="M12 6.5C10 2.5 6 3 7 5.5c.6 1.5 3 1 5 1zM12 6.5c2-4 6-3.5 5-1-.6 1.5-3 1-5 1z" fill="#ffc928" ' + O + '/>',
        snow:        '<g stroke="#5cc6f2" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" stroke-width="2"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3 10.5l3.4-.9-.9-3.4M21 13.5l-3.4.9.9 3.4M3 13.5l3.4.9-.9 3.4M21 10.5l-3.4-.9.9-3.4" stroke-width="1.6"/></g>',
        ice:         '<path d="M4 7l8-4.5L20 7v10l-8 4.5L4 17z" fill="#9fe0fa" ' + O + '/><path d="M4 7l8 4.5L20 7M12 11.5v10" fill="none" stroke="#5cb8e0" stroke-width="1"/><path d="M6.5 8.5l3 1.7" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>',
        hammer:      '<path d="M13.5 10.5L4 20" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><path d="M10 7.5l5-5 6.5 6.5-2.3 2.3-2-1.3-2.7 2.7-1.3-2-2.2 2.2-1-1z" fill="#8f9aa8" ' + O + '/>',
        tools:       '<path d="M15 9L4 20" stroke="#8a5a2b" stroke-width="2.8" stroke-linecap="round"/><path d="M12.5 5l3.5-3 6 6-3 3.5-2-1.5-1.5-1.5z" fill="#8f9aa8" ' + O + '/><path d="M9 9L20 20" stroke="#9aa6b8" stroke-width="2.8" stroke-linecap="round"/><path d="M3 6a3.5 3.5 0 004.8 3.3L9 10.5 10.5 9 9.3 7.8A3.5 3.5 0 006 3l1.8 1.8-.8 2.2-2.2.8z" fill="#9aa6b8" ' + O + '/>',
        trap:        '<rect x="3" y="15" width="18" height="5" rx="1" fill="#a8743e" ' + O + '/><path d="M5 15V8M19 15V8" stroke="#8f9aa8" stroke-width="2"/><path d="M5 8h14" stroke="#8f9aa8" stroke-width="1.6"/><path d="M5 8.5l2 6M8 8.5l2 6M11 8.5l2 6M14 8.5l2 6" stroke="#cfd8e3" stroke-width="1"/><circle cx="17" cy="12.5" r="2" fill="#ffc928" ' + O + '/>',
        medal:       '<path d="M7 2h4l2 6H9z" fill="#3cc65c"/><path d="M17 2h-4l-2 6h4z" fill="#3a8ee6"/><circle cx="12" cy="15" r="7" fill="#ffc928" ' + O + '/><path d="M12 10.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1L12 17.5 9.2 19l.6-3.1-2.3-2.1 3.1-.4z" fill="#fff6c4"/>',
        tengu:       '<circle cx="12" cy="11" r="9" fill="#d9302a" ' + O + '/><path d="M12 11l9 5-9 1z" fill="#c42a24" ' + O + '/><path d="M6 7.5l4 1.5M18 7.5l-4 1.5" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><circle cx="8.5" cy="10.5" r="1" fill="#fff"/><circle cx="15.5" cy="10.5" r="1" fill="#fff"/><path d="M7 15.5c1.5 2 4 2.5 5 2.5" stroke="#fff" stroke-width="1.5" fill="none"/>',
        fairy:       '<ellipse cx="7" cy="10" rx="5" ry="6" fill="#bfe8ff" opacity=".9" ' + O + ' transform="rotate(-25 7 10)"/><ellipse cx="17" cy="10" rx="5" ry="6" fill="#bfe8ff" opacity=".9" ' + O + ' transform="rotate(25 17 10)"/><path d="M9.5 21l2.5-9 2.5 9z" fill="#ff7eb6" ' + O + '/><circle cx="12" cy="8.5" r="3.3" fill="#f6d2b0" ' + O + '/><path d="M8.8 8c0-3 6.4-3 6.4 0-1-1-2-1.3-3.2-1.3S9.8 7 8.8 8z" fill="#ffc928"/>',
        elf:         '<path d="M4 9l4.5 2.5M20 9l-4.5 2.5" stroke="#f6d2b0" stroke-width="2.4" stroke-linecap="round"/><path d="M6 11v10M18 11v10" stroke="#ffd96b" stroke-width="2.4"/><circle cx="12" cy="12" r="6" fill="#f6d2b0" ' + O + '/><path d="M5.8 11c0-5 3-7.5 6.2-7.5s6.2 2.5 6.2 7.5c-1-2.3-3-3.4-6.2-3.6C9 7.6 7 8.7 5.8 11z" fill="#ffd96b" ' + O + '/><circle cx="9.8" cy="12.5" r=".9" fill="#2b5a2b"/><circle cx="14.2" cy="12.5" r=".9" fill="#2b5a2b"/><path d="M10.5 15.3c1 .7 2 .7 3 0" stroke="#b5654a" stroke-width="1" fill="none" stroke-linecap="round"/>',
        muscle:      '<path d="M5 21c-1.5-4-1-9 2-13l2-4.5c1.2-1 2.8-.8 3.5.4l-.8 3.6c-.5 1.2-1.6 1.6-2.7 1.5L8 12c2.5-2.5 6.5-3 9.5-1 2.5 1.7 3 5.5 1 8.5-.9 1.3-2.4 1.5-3.5 1.5z" fill="#ffc48a" ' + O + '/><path d="M10 15c1.5-1.3 4-1.6 6-.3" stroke="#d89058" stroke-width="1.1" fill="none"/>',
        box:         '<path d="M2.5 7.5L12 3l9.5 4.5v10L12 22l-9.5-4.5z" fill="#d9a65a" ' + O + '/><path d="M2.5 7.5L12 12l9.5-4.5M12 12v10" fill="none" stroke="#a8743e" stroke-width="1.1"/><path d="M7 5.2l9.5 4.5v3" fill="none" stroke="#f4e3c4" stroke-width="1.6"/>',
        clipboard:   '<rect x="4" y="3.5" width="16" height="18.5" rx="2" fill="#c8915a" ' + O + '/><rect x="6" y="6" width="12" height="14" rx="1" fill="#fff"/><rect x="8.5" y="2" width="7" height="3.5" rx="1" fill="#9aa6b8" ' + O + '/><path d="M8 10h8M8 13h8M8 16h5" stroke="#9aa6b8" stroke-width="1.2" stroke-linecap="round"/>',
        save:        '<path d="M3 3h15l3 3v15H3z" fill="#3a6fd4" ' + O + '/><rect x="7" y="3" width="9" height="6" fill="#dfe7f2"/><rect x="13" y="4" width="2" height="4" fill="#3a6fd4"/><rect x="6" y="13" width="12" height="8" rx="1" fill="#fff"/>',
        arrow_right: '<rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#3a8ee6" ' + O + '/><path d="M5.5 12h11M12.5 7l5 5-5 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
        arrow_shot:  '<path d="M3 21L19 5" stroke="#8a5a2b" stroke-width="1.8" stroke-linecap="round"/><path d="M21.5 2.5L15.5 4.5l4 4z" fill="#9aa6b8" ' + O + '/><path d="M3 21l-.6-3.6M3 21l3.6.6M5 19l-.6-3.6M5 19l3.6.6" stroke="#e8384f" stroke-width="1.5" stroke-linecap="round"/>',
        ox:          '<path d="M4 6C1.5 6 1 3 2 2c.5 2 2 2.5 4 2.5M20 6c2.5 0 3-3 2-4-.5 2-2 2.5-4 2.5" fill="#f4e3c4" ' + O + '/><path d="M5 6.5C6 4 18 4 19 6.5c1 3-1 6-1 9 0 3.5-2.5 6-6 6s-6-2.5-6-6c0-3-2-6-1-9z" fill="#8a5a3a" ' + O + '/><ellipse cx="12" cy="17.5" rx="4.5" ry="3.3" fill="#d8a888"/><circle cx="10.3" cy="17.5" r=".9" fill="#5a3a2a"/><circle cx="13.7" cy="17.5" r=".9" fill="#5a3a2a"/><circle cx="8.6" cy="10.5" r="1.1" fill="#1a1a1a"/><circle cx="15.4" cy="10.5" r="1.1" fill="#1a1a1a"/>',
        wolf:        '<path d="M4 2.5l4.5 4.5h7L20 2.5l.5 9.5L12 22 3.5 12z" fill="#8f9aa8" ' + O + '/><path d="M7 13l5 9 5-9c-1.5-1-3.3-1.4-5-1.4S8.5 12 7 13z" fill="#e8edf3"/><path d="M5.5 5l2 3M18.5 5l-2 3" stroke="#5a6475" stroke-width="1.6"/><path d="M7.5 10.5l2.5.8M16.5 10.5l-2.5.8" stroke="#ffc928" stroke-width="1.6" stroke-linecap="round"/><path d="M10.8 17.5h2.4l-1.2 1.6z" fill="#1a1a1a"/>',
        eagle:       '<path d="M1.5 9c3-2 6.5-2 9 0 2.5-2 6-2 9 0l2 1.5-5 .5c-1 0-2 .7-2.5 1.5L12 21l-2-8.5C9.5 11.7 8.5 11 7.5 11l-5-.5z" fill="#7a4a24" ' + O + '/><circle cx="12" cy="9" r="3.2" fill="#fff" ' + O + '/><path d="M12 9.5l3.2.5-2 1.6z" fill="#ffc928" ' + O + '/><circle cx="12.5" cy="8.3" r=".6" fill="#1a1a1a"/>',
        ghost:       '<path d="M4.5 21V11a7.5 7.5 0 0115 0v10l-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2z" fill="#f2f4fb" stroke="#7a8699" stroke-width="1.1" stroke-linejoin="round"/><ellipse cx="9.3" cy="11" rx="1.4" ry="2" fill="#2b2430"/><ellipse cx="14.7" cy="11" rx="1.4" ry="2" fill="#2b2430"/><ellipse cx="12" cy="15.3" rx="1.6" ry="1.2" fill="#2b2430"/>',
        moon_new:    '<circle cx="12" cy="12" r="9.5" fill="#3a3f55" stroke="#9aa6b8" stroke-width="1"/><circle cx="9" cy="9" r="1.8" fill="#2a2e40"/><circle cx="14.5" cy="14.5" r="2.4" fill="#2a2e40"/>',
        search:      '<circle cx="10" cy="10" r="6.5" fill="#cfefff" stroke="#5a6475" stroke-width="2.4"/><path d="M15 15l6 6" stroke="#8a5a2b" stroke-width="3.2" stroke-linecap="round"/><path d="M7 8a3.5 3.5 0 013-2.2" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
        flask:       '<path d="M9 2.5h6M10 2.5v7L4.5 19a2 2 0 001.8 2.9h11.4a2 2 0 001.8-2.9L14 9.5v-7" fill="#e8f4ff" ' + O + '/><path d="M7.3 14h9.4l2.5 5a2 2 0 01-1.8 2.9H6.6A2 2 0 014.8 19z" fill="#3cc65c"/><circle cx="10" cy="17" r="1" fill="#b9f2c8"/><circle cx="13.5" cy="18.8" r=".7" fill="#b9f2c8"/>',
        egg:         '<path d="M12 2.5c-4 0-7 6-7 11s3 8 7 8 7-3 7-8-3-11-7-11z" fill="#fdf6e3" stroke="#a8743e" stroke-width="1.1"/><circle cx="9.5" cy="12" r="1.4" fill="#e8b66a"/><circle cx="14" cy="16" r="1.8" fill="#e8b66a"/><circle cx="14.5" cy="9" r="1" fill="#e8b66a"/>',
        gi:          '<path d="M7 3l5 4 5-4 5 4-3 4-1-1v12H6V10l-1 1-3-4z" fill="#f4f6fa" ' + O + '/><path d="M7 3l5 9 5-9" fill="none" stroke="#9aa6b8" stroke-width="1.2"/><rect x="6" y="13" width="12" height="2.4" fill="#2b2430"/><path d="M11 15.4l-1.5 4M13 15.4l1.5 4" stroke="#2b2430" stroke-width="1.6"/>',
        mountain:    '<path d="M1.5 20.5L9 7l3.5 5.5L15.5 9l7 11.5z" fill="#8a7a6a" ' + O + '/><path d="M9 7l-2 3.8 1.6-.8 1 1.2 1.3-1.4z" fill="#b9a994"/>',
        mountain_snow:'<path d="M1.5 20.5L10 5l4 6.5L16.5 8l6 12.5z" fill="#6b7a99" ' + O + '/><path d="M10 5l-3.2 5.8 1.8-.8 1.6 1.4 1.8-1.4 1.3.6z" fill="#fff"/><path d="M16.5 8l-1.7 3.4 1.2-.4 1 .8 1-.6z" fill="#fff"/>',
        tree:        '<path d="M12 2l5.5 7h-2.5l4.5 6h-3l4 5.5H3.5l4-5.5h-3l4.5-6H6.5z" fill="#2f9a4a" ' + O + '/><rect x="10.6" y="20" width="2.8" height="3" fill="#8a5a2b"/>',
        drop:        '<path d="M12 2.5C9 7.5 5.5 11 5.5 15a6.5 6.5 0 0013 0c0-4-3.5-7.5-6.5-12.5z" fill="#3fa8f0" ' + O + '/><path d="M8.8 15a3.2 3.2 0 002.4 3.2" stroke="#d6f0ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        town:        '<path d="M1.5 12L7 6.5l5.5 5.5v9.5h-11z" fill="#f4e3c4" ' + O + '/><path d="M.8 12.5L7 6l6.2 6.5" fill="none" stroke="#c8332f" stroke-width="2" stroke-linecap="round"/><path d="M11.5 11l6-5.5L23 11v10.5H11.5z" fill="#e6d0a8" ' + O + '/><path d="M10.8 11.5L17.5 5l6 6.5" fill="none" stroke="#3a6fd4" stroke-width="2" stroke-linecap="round"/><rect x="5.5" y="16" width="3" height="5.5" fill="#a8743e"/><rect x="15.5" y="15" width="3" height="3" fill="#7fc8ff"/>',
        castle:      '<path d="M2.5 9h4V6.5h2V9h2V6.5h3V9h2V6.5h2V9h4v12.5h-19z" fill="#b9c3d0" ' + O + '/><path d="M9.5 21.5V16a2.5 2.5 0 015 0v5.5z" fill="#6b4a2b"/><path d="M12 6.5V1.5l3.5 1.2L12 4" fill="#e8384f" stroke="#5a6475" stroke-width=".8"/><rect x="5" y="12" width="2" height="3" fill="#5a6475"/><rect x="17" y="12" width="2" height="3" fill="#5a6475"/>',
        sprout:      '<path d="M12 21v-9" stroke="#2f9a4a" stroke-width="2.2" stroke-linecap="round"/><path d="M12 12C12 7 8.5 4.5 3.5 5c0 4.5 3.5 7.3 8.5 7z" fill="#3cc65c" ' + O + '/><path d="M12 14c0-4 3-6.5 8.5-6 0 4-3.5 6.3-8.5 6z" fill="#7ad65a" ' + O + '/><path d="M6 21.5h12" stroke="#8a5a2b" stroke-width="2" stroke-linecap="round"/>',
        ninja:       '<path d="M19.5 8l3-2.5M19.5 9l3.3.3" stroke="#e8384f" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="9.5" fill="#2b2f45" ' + O + '/><rect x="4" y="9" width="16" height="5" rx="2.5" fill="#f6d2b0"/><path d="M6.5 11.5l3.5-.8M17.5 11.5l-3.5-.8" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>',
        earth:       '<circle cx="12" cy="12" r="9.5" fill="#3a8ee6" ' + O + '/><path d="M5 7c2 0 3.5 1 3 3s-2 2.5-1.5 4.5S8 18 6.5 18.5C4 16.5 2.8 13 3.4 9.5zM13 4c2 .5 2 2.5 4 2.5s2.5 3 1 4.5-3 0-4 2 1.5 3.5 0 5.5c-2 .5-2.5-2-2-4.5S10 11 11 9s1-3.5 2-5z" fill="#3fae5a"/>',
        galaxy:      '<circle cx="12" cy="12" r="10" fill="#1d1f4a" ' + O + '/><path d="M12 12c3-3 7-1 6 2.5S11 20 7 16 8 4 15 5" fill="none" stroke="#b98cff" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8" fill="#fff6c4"/><circle cx="6" cy="7" r=".7" fill="#fff"/><circle cx="18" cy="17.5" r=".7" fill="#fff"/><circle cx="17" cy="6" r=".5" fill="#fff"/>',
        devil:       '<path d="M4 3.5c0 3 1 4.5 3 5.5M20 3.5c0 3-1 4.5-3 5.5" fill="none" stroke="#7a3fc0" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="13.5" r="8.5" fill="#9a5ce0" ' + O + '/><path d="M7.5 11l3 1.2M16.5 11l-3 1.2" stroke="#2b1a3a" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="13.3" r="1" fill="#2b1a3a"/><circle cx="15" cy="13.3" r="1" fill="#2b1a3a"/><path d="M7.5 16.5c2.5 2.5 6.5 2.5 9 0" stroke="#2b1a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        cyclone:     '<path d="M12 12.5c1.2 0 1.7-1.6.5-2.3-2-1.2-4.4 1-3.8 3.4.8 3.2 5.4 3.8 7.6 1.4 3-3.2.7-8.6-3.8-9.2C7 5 3.5 9.5 4.5 14c1.3 5.5 8.8 8.2 13.5 5" fill="none" stroke="#3a8ee6" stroke-width="2.2" stroke-linecap="round"/>',
        // ---- ブラックジャック・アルカナ ----
        coin:        '<circle cx="12" cy="12" r="9.5" fill="#ffc928" ' + O + '/><circle cx="12" cy="12" r="6.8" fill="none" stroke="#d68a12" stroke-width="1.3"/><path d="M12 7.5v9M9.8 9.5h4.4M9.8 14.5h4.4" stroke="#d68a12" stroke-width="1.6" stroke-linecap="round"/><path d="M7 8.5a6 6 0 012.5-2.3" stroke="#fff6c4" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
        cart:        '<path d="M1.5 3.5h3l2.5 11.5h11.5l2-8H6" fill="none" stroke="#5a6475" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.3 7h14.2l-2 7.5H7.8z" fill="#3a8ee6" opacity=".85"/><circle cx="9" cy="19.5" r="1.9" fill="#5a6475"/><circle cx="17" cy="19.5" r="1.9" fill="#5a6475"/>',
        torii:       '<path d="M2 4.5c4 1 16 1 20 0l-.8 2.8H2.8z" fill="#e0402f" ' + O + '/><rect x="3.5" y="9.5" width="17" height="2.2" fill="#e0402f" ' + O + '/><rect x="5.5" y="7" width="2.4" height="15" fill="#e0402f" ' + O + '/><rect x="16.1" y="7" width="2.4" height="15" fill="#e0402f" ' + O + '/><rect x="11" y="7.2" width="2" height="2.4" fill="#e0402f"/>',
        dice:        '<rect x="3" y="3" width="18" height="18" rx="4" fill="#fff" stroke="#7a8699" stroke-width="1.2"/><circle cx="8" cy="8" r="1.7" fill="#e8384f"/><circle cx="12" cy="12" r="1.7" fill="#2b2430"/><circle cx="16" cy="16" r="1.7" fill="#2b2430"/><circle cx="16" cy="8" r="1.7" fill="#2b2430"/><circle cx="8" cy="16" r="1.7" fill="#2b2430"/>',
        puzzle:      '<path d="M4 7h4a2.5 2.5 0 115 0h4v4a2.5 2.5 0 110 5v4H13a2.5 2.5 0 10-5 0H4v-4.5a2.5 2.5 0 100-5z" fill="#3cc65c" ' + O + '/>',
        flag_white:  '<path d="M5 2.5v19" stroke="#7a8699" stroke-width="2" stroke-linecap="round"/><path d="M6 3.5c4-1.5 7 1.5 13 0v9c-6 1.5-9-1.5-13 0z" fill="#fff" stroke="#7a8699" stroke-width="1.1" stroke-linejoin="round"/>',
        fountain:    '<path d="M12 4c-3 0-5 2-5 5M12 4c3 0 5 2 5 5M12 4v6" fill="none" stroke="#5cc6f2" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="3.5" r="1.3" fill="#5cc6f2"/><rect x="9" y="10" width="6" height="2" rx="1" fill="#b9c3d0" ' + O + '/><rect x="11" y="12" width="2" height="4" fill="#b9c3d0"/><path d="M3 15.5h18v3a3 3 0 01-3 3H6a3 3 0 01-3-3z" fill="#b9c3d0" ' + O + '/><path d="M4.5 15.5h15v1.5h-15z" fill="#5cc6f2"/>',
        thinking:    '<circle cx="12" cy="12" r="9.5" fill="#ffd43b" ' + O + '/><path d="M7.5 9l2.5-.6M14.3 8.2l2.5.8" stroke="#5a3a10" stroke-width="1.4" stroke-linecap="round"/><circle cx="9" cy="11" r="1.1" fill="#5a3a10"/><circle cx="15" cy="11" r="1.1" fill="#5a3a10"/><path d="M10.5 15.5h4" stroke="#5a3a10" stroke-width="1.4" stroke-linecap="round"/><path d="M6 17.5c1-1.5 3-1.5 4-.5l1.5 2c.5.8-.3 1.8-1.2 1.4L6.5 19.5" fill="#ffb41f" ' + O + '/>',
        candle:      '<path d="M12 2c-1.8 2.4-2.6 3.8-2.6 5.2a2.6 2.6 0 005.2 0C14.6 5.8 13.8 4.4 12 2z" fill="#ffb422" ' + O + '/><path d="M12 5.5c-.7 1-1 1.6-1 2.1a1 1 0 002 0c0-.5-.3-1.1-1-2.1z" fill="#fff3b0"/><rect x="8.5" y="10.5" width="7" height="11" rx="1" fill="#f4eee0" ' + O + '/><path d="M8.5 13c1.5 1 2 0 2.5 1.5" stroke="#d9cfb8" stroke-width="1" fill="none"/>',
        bulb:        '<path d="M12 2.5a6.5 6.5 0 00-3.8 11.8c.8.6 1.3 1.5 1.3 2.5v.7h5v-.7c0-1 .5-1.9 1.3-2.5A6.5 6.5 0 0012 2.5z" fill="#ffd43b" ' + O + '/><rect x="9.3" y="17.5" width="5.4" height="2" rx=".6" fill="#9aa6b8" ' + O + '/><rect x="10" y="19.5" width="4" height="2" rx="1" fill="#7a8699"/><path d="M8.7 8.5a3.5 3.5 0 012.6-3" stroke="#fff6c4" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
        walk:        '<circle cx="13.5" cy="4" r="2.4" fill="#5a6a85"/><path d="M13 7.5l-3 6 3 3-1 5.5M12.5 8.5l3.5 3.5 3 .5M10.5 10l-3 1-1.5 3M10 13.5l-3.5 8" fill="none" stroke="#5a6a85" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
        bottle:      '<rect x="9.5" y="2" width="5" height="3" rx="1" fill="#e8384f" ' + O + '/><path d="M10 5h4v2.5c2.5 1 4 3 4 5.5v6.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 016 19.5V13c0-2.5 1.5-4.5 4-5.5z" fill="#ffd8e4" ' + O + '/><rect x="8" y="13" width="8" height="5" rx="1" fill="#fff"/><path d="M12 14.2v2.6M10.7 15.5h2.6" stroke="#e8384f" stroke-width="1.2" stroke-linecap="round"/>',
        pray:        '<path d="M11.5 3c-1 0-1.6.8-1.8 1.8L8 13l-3.5 3.5L7 21l4.5-4.5z" fill="#ffc48a" ' + O + '/><path d="M12.5 3c1 0 1.6.8 1.8 1.8L16 13l3.5 3.5L17 21l-4.5-4.5z" fill="#ffc48a" ' + O + '/><path d="M3 18l3.5 4M21 18l-3.5 4" stroke="#3a8ee6" stroke-width="2.4" stroke-linecap="round"/>',
        storm:       '<path d="M6.5 13.5a4.5 4.5 0 01-.3-9 6 6 0 0111.4 1.6A3.8 3.8 0 0117.5 13.5z" fill="#7a8699" ' + O + '/><path d="M12.5 12l-3 5h2.5l-1.5 5 4.5-6.5H12.5l1.5-3.5z" fill="#ffd21f" ' + O + '/><path d="M6 16l-1 3M17.5 16l-1 3" stroke="#5cb8f0" stroke-width="1.6" stroke-linecap="round"/>',
        tired:       '<circle cx="12" cy="12" r="9.5" fill="#ffd43b" ' + O + '/><path d="M6.5 9.5l3 1.5-3 1.5M17.5 9.5l-3 1.5 3 1.5" fill="none" stroke="#5a3a10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 18c0-3 8-3 8 0z" fill="#5a3a10"/>',
        bubbles:     '<circle cx="9" cy="14" r="6" fill="#bfeeff" opacity=".7" stroke="#5cc6f2" stroke-width="1.2"/><circle cx="17.5" cy="7.5" r="3.8" fill="#bfeeff" opacity=".7" stroke="#5cc6f2" stroke-width="1.2"/><circle cx="18" cy="17.5" r="2.3" fill="#bfeeff" opacity=".7" stroke="#5cc6f2" stroke-width="1.1"/><path d="M6 11.5a3.5 3.5 0 012-1.7M16 6a2 2 0 011-.8" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
        cherry:      '<path d="M8 15c1-5 3-9 9-12.5M16 15c0-4 0-8 1-12.5" fill="none" stroke="#3f8a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M17 2.5c-3 0-5 1.5-5.5 3.5 3 .5 5-1 5.5-3.5z" fill="#3cc65c"/><circle cx="7.5" cy="17" r="4.5" fill="#e0233f" ' + O + '/><circle cx="16.5" cy="17" r="4.5" fill="#e0233f" ' + O + '/><circle cx="6" cy="15.5" r="1.1" fill="#fff" opacity=".7"/><circle cx="15" cy="15.5" r="1.1" fill="#fff" opacity=".7"/>',
        bell:        '<path d="M12 3a6 6 0 00-6 6v4.5L3.5 17.5h17L18 13.5V9a6 6 0 00-6-6z" fill="#ffc928" ' + O + '/><circle cx="12" cy="19.5" r="2" fill="#d68a12"/><circle cx="12" cy="2.5" r="1.2" fill="#d68a12"/><path d="M8.5 8a3.5 3.5 0 012-2.5" stroke="#fff6c4" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
        confetti:    '<path d="M12 4v2" stroke="#7a8699" stroke-width="1.4"/><path d="M4 10a8 8 0 0116 0z" fill="#ffc928" ' + O + '/><path d="M12 10l-6 11M12 10l-2 12M12 10l2 12M12 10l6 11" stroke="#e8384f" stroke-width="1.3" stroke-dasharray="2 1.5"/><circle cx="4" cy="15" r="1" fill="#3a8ee6"/><circle cx="20" cy="15" r="1" fill="#3cc65c"/><path d="M7 2.5l1 1.5M17 2.5l-1 1.5" stroke="#ff7eb6" stroke-width="1.4" stroke-linecap="round"/>',
        lantern:     '<rect x="9" y="2" width="6" height="2.5" rx=".8" fill="#2b2430"/><ellipse cx="12" cy="12" rx="7.5" ry="7.8" fill="#e8402f" ' + O + '/><path d="M5 9.5h14M4.6 12h14.8M5 14.5h14" stroke="#b8261a" stroke-width=".9"/><rect x="9" y="19.5" width="6" height="2.5" rx=".8" fill="#2b2430"/><ellipse cx="12" cy="12" rx="3" ry="7.5" fill="#ffb422" opacity=".55"/>',
        zzz:         '<text x="3" y="21" font-size="10" font-weight="900" font-family="Arial,sans-serif" fill="#5c8af0">Z</text><text x="10" y="14" font-size="8" font-weight="900" font-family="Arial,sans-serif" fill="#7aa2ff">Z</text><text x="16" y="8" font-size="6.5" font-weight="900" font-family="Arial,sans-serif" fill="#9fbcff">Z</text>',
        // ---- 道具・UI ----
        pickaxe:     '<path d="M12.5 11.5L4 20" stroke="#8a5a2b" stroke-width="2.8" stroke-linecap="round"/><path d="M3.5 7.5C8 2.5 15 2 20.5 3.5 22 9 21.5 16 16.5 20.5c1-4.5.5-9-2.5-12S7.5 6.5 3.5 7.5z" fill="#9aa6b8" ' + O + '/>',
        hammer_pick: '<path d="M7 7l13 13M17 7L4 20" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/><path d="M2.5 6.5c3-3.5 7-4 10-3-2.5.5-5 2.5-6 6z" fill="#9aa6b8" ' + O + '/><rect x="14" y="2.5" width="8" height="5" rx="1" fill="#8f9aa8" ' + O + ' transform="rotate(45 18 5)"/>',
        moneybag:    '<path d="M9 3h6l-1.5 3.5h-3z" fill="#c8915a" ' + O + '/><path d="M10 6.5h4c4 2 7 6 7 10 0 3-2 5-5 5H8c-3 0-5-2-5-5 0-4 3-8 7-10z" fill="#d9a65a" ' + O + '/><text x="12" y="18.5" text-anchor="middle" font-size="9" font-weight="900" font-family="Arial,sans-serif" fill="#7a4a10">$</text>',
        money_wings: '<path d="M2 9c2-3 5-3 6.5-1L7 12c-2 0-4-1-5-3zM22 9c-2-3-5-3-6.5-1L17 12c2 0 4-1 5-3z" fill="#fff" stroke="#7a8699" stroke-width="1"/><rect x="6.5" y="7" width="11" height="12" rx="1.5" fill="#6fcf7a" ' + O + ' transform="rotate(-8 12 13)"/><circle cx="12" cy="13" r="2.4" fill="#3f9a4a"/>',
        alarm:       '<circle cx="12" cy="13" r="8" fill="#e8384f" ' + O + '/><circle cx="12" cy="13" r="6" fill="#fff"/><path d="M12 9v4.3l2.8 1.8" stroke="#2b2430" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M3 6.5l3.5-3M21 6.5l-3.5-3" stroke="#e8384f" stroke-width="2.4" stroke-linecap="round"/><path d="M7 21l1.5-1.8M17 21l-1.5-1.8" stroke="#5a6475" stroke-width="1.8" stroke-linecap="round"/>',
        stopwatch:   '<rect x="10" y="1.5" width="4" height="2.5" rx=".8" fill="#5a6475"/><circle cx="12" cy="13.5" r="8.5" fill="#dfe7f2" ' + O + '/><circle cx="12" cy="13.5" r="6.5" fill="#fff"/><path d="M12 13.5V8.5" stroke="#e8384f" stroke-width="1.8" stroke-linecap="round"/><path d="M18.5 6l1.5-1.5" stroke="#5a6475" stroke-width="2" stroke-linecap="round"/>',
        hourglass:   '<rect x="4.5" y="2" width="15" height="2.5" rx="1" fill="#a8743e" ' + O + '/><rect x="4.5" y="19.5" width="15" height="2.5" rx="1" fill="#a8743e" ' + O + '/><path d="M6.5 4.5h11c0 4-5.5 5.5-5.5 7.5s5.5 3.5 5.5 7.5h-11c0-4 5.5-5.5 5.5-7.5S6.5 8.5 6.5 4.5z" fill="#e8f4ff" ' + O + '/><path d="M8.5 19.5c0-2 3.5-3 3.5-4.5s3.5 2.5 3.5 4.5zM9 7h6c-1 1.5-3 2-3 3s-2-1.5-3-3z" fill="#ffc928"/>',
        oldkey:      '<circle cx="7" cy="12" r="4.5" fill="none" stroke="#c8963a" stroke-width="2.6"/><path d="M11.5 12h10M18 12v4M21 12v3" stroke="#c8963a" stroke-width="2.6" stroke-linecap="round"/>',
        key:         '<circle cx="7.5" cy="12" r="5" fill="#ffc928" ' + O + '/><circle cx="6.5" cy="12" r="1.8" fill="#fff6c4"/><path d="M12 12h9.5M18.5 12v3.5M21 12v2.5" stroke="#e8a317" stroke-width="2.8" stroke-linecap="round"/>',
        rock:        '<path d="M3 18l2.5-7 4.5-4.5 5.5 1 4 4.5 2 6-3 2.5H6z" fill="#8f8a84" ' + O + '/><path d="M10 6.5l1 5-6.5-1M15.5 7.5l-4.5 4 9 1" fill="none" stroke="#6f6a64" stroke-width="1"/>',
        wind:        '<g fill="none" stroke="#7fc8f0" stroke-width="2.2" stroke-linecap="round"><path d="M2.5 9h12a3 3 0 10-3-3"/><path d="M2.5 13.5h16a3 3 0 11-3 3"/><path d="M4 18h6"/></g>',
        square_white:'<rect x="3" y="3" width="18" height="18" rx="2.5" fill="#fff" stroke="#7a8699" stroke-width="1.3"/>',
        warning:     '<path d="M12 2.5L22.5 20.5h-21z" fill="#ffc928" ' + O + ' stroke-linejoin="round"/><path d="M12 9v5.5" stroke="#2b2430" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.4" fill="#2b2430"/>',
        compass:     '<circle cx="12" cy="12" r="9.5" fill="#f4e3c4" ' + O + '/><circle cx="12" cy="12" r="7.5" fill="#fff" stroke="#c8a96a" stroke-width="1"/><path d="M12 4.8l2.3 7.2h-4.6z" fill="#e8384f"/><path d="M12 19.2l2.3-7.2h-4.6z" fill="#5a6475"/><circle cx="12" cy="12" r="1.2" fill="#2b2430"/>',
        fireworks:   '<circle cx="12" cy="12" r="10.5" fill="#1d1f4a"/><g stroke-linecap="round" stroke-width="1.6"><path d="M12 12V4M12 12v8M12 12H4M12 12h8" stroke="#ffd43b"/><path d="M12 12l5.5-5.5M12 12l-5.5 5.5M12 12l-5.5-5.5M12 12l5.5 5.5" stroke="#ff7eb6"/></g><circle cx="12" cy="12" r="1.6" fill="#fff"/>',
        shooting_star:'<path d="M2 21l9-8" stroke="#ffe680" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><path d="M5 22l5-4.5M1.5 17.5L7 13" stroke="#ffe680" stroke-width="1.4" stroke-linecap="round" opacity=".6"/><path d="M15 2.5l2 4.3 4.7.6-3.4 3.2.9 4.7-4.2-2.3-4.2 2.3.9-4.7-3.4-3.2 4.7-.6z" fill="#ffc928" ' + O + '/>',
        forbidden:   '<circle cx="12" cy="12" r="9" fill="#fff" stroke="#e8384f" stroke-width="3"/><path d="M5.8 5.8l12.4 12.4" stroke="#e8384f" stroke-width="3"/>',
        checkered:   '<path d="M5 2.5v19" stroke="#5a6475" stroke-width="2" stroke-linecap="round"/><rect x="6" y="3.5" width="14" height="10" fill="#fff" ' + O + '/><path d="M6 3.5h3.5v3.3H6zM13 3.5h3.5v3.3H13zM9.5 6.8H13v3.4H9.5zM16.5 6.8H20v3.4h-3.5zM6 10.2h3.5v3.3H6zM13 10.2h3.5v3.3H13z" fill="#2b2430"/>',
        flag_red:    '<path d="M5 2.5v19" stroke="#7a8699" stroke-width="2" stroke-linecap="round"/><path d="M6 3.5l13 4.5-13 4.5z" fill="#e8384f" ' + O + '/>',
        wrench:      '<path d="M14.5 3a5 5 0 00-4.7 6.7L3 16.5a2 2 0 002.8 2.8l6.8-6.8A5 5 0 0019.5 8l-3 1.5-2.5-2.5 1.5-3A5 5 0 0014.5 3z" fill="#9aa6b8" ' + O + '/>',
        eyes:        '<ellipse cx="7.5" cy="12" rx="4.8" ry="7" fill="#fff" ' + O + '/><ellipse cx="16.5" cy="12" rx="4.8" ry="7" fill="#fff" ' + O + '/><circle cx="8.5" cy="13" r="2.4" fill="#2b2430"/><circle cx="17.5" cy="13" r="2.4" fill="#2b2430"/>',
        palette:     '<path d="M12 2.5c-5.5 0-9.5 4-9.5 9s4 9.5 9 9.5c1.5 0 2.2-1 2-2.2-.3-1.5.5-2.8 2-2.8H18c2.2 0 3.5-1.6 3.5-3.8 0-5.3-4.2-9.7-9.5-9.7z" fill="#f4dcb0" ' + O + '/><circle cx="7" cy="11" r="1.8" fill="#e8384f"/><circle cx="9.5" cy="6.5" r="1.8" fill="#ffc928"/><circle cx="14.5" cy="6.5" r="1.8" fill="#3cc65c"/><circle cx="18" cy="10" r="1.8" fill="#3a8ee6"/>',
        paintbrush:  '<path d="M20.5 3.5L11 13" stroke="#8a5a2b" stroke-width="2.6" stroke-linecap="round"/><path d="M10.5 12l2 2" stroke="#9aa6b8" stroke-width="3"/><path d="M9.5 13.5c-3 0-4.5 2-4.5 4S3.5 21 2.5 21c4 1 9 .5 9-4.5z" fill="#e8384f" ' + O + '/>',
        sweat:       '<path d="M8 3c-2 3.5-4 6-4 8.5a4 4 0 008 0C12 9 10 6.5 8 3z" fill="#5cc6f2" ' + O + '/><path d="M17 10c-1.5 2.5-3 4.3-3 6a3 3 0 006 0c0-1.7-1.5-3.5-3-6z" fill="#5cc6f2" ' + O + '/>',
        robot:       '<path d="M12 2v3" stroke="#7a8699" stroke-width="1.6"/><circle cx="12" cy="2.2" r="1.3" fill="#e8384f"/><rect x="4" y="5" width="16" height="13" rx="3" fill="#b9c3d0" ' + O + '/><rect x="6.5" y="8" width="11" height="5.5" rx="2" fill="#2b3550"/><circle cx="9.5" cy="10.7" r="1.3" fill="#5cf2e0"/><circle cx="14.5" cy="10.7" r="1.3" fill="#5cf2e0"/><path d="M9 15.8h6" stroke="#5a6475" stroke-width="1.4" stroke-linecap="round"/><rect x="2" y="9" width="2" height="5" rx="1" fill="#7a8699"/><rect x="20" y="9" width="2" height="5" rx="1" fill="#7a8699"/><rect x="7" y="18" width="10" height="4" rx="1" fill="#9aa6b8" ' + O + '/>',
        gamepad:     '<path d="M6.5 7h11c3 0 5 3 5 7 0 3-1.5 4.5-3 4.5-1.8 0-2.5-2.5-4.5-2.5h-6c-2 0-2.7 2.5-4.5 2.5-1.5 0-3-1.5-3-4.5 0-4 2-7 5-7z" fill="#5a6a85" ' + O + '/><path d="M7.5 10v4M5.5 12h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.1" fill="#e8384f"/><circle cx="18" cy="13" r="1.1" fill="#3cc65c"/>',
        phone:       '<rect x="6" y="1.5" width="12" height="21" rx="2.5" fill="#3a3f55" ' + O + '/><rect x="7.5" y="4" width="9" height="14.5" rx=".8" fill="#7fc8ff"/><circle cx="12" cy="20.3" r=".9" fill="#9aa6b8"/>',
        calendar:    '<rect x="3" y="4" width="18" height="17.5" rx="2" fill="#fff" ' + O + '/><path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v3H3z" fill="#e8384f"/><path d="M8 2.5v3M16 2.5v3" stroke="#5a6475" stroke-width="1.8" stroke-linecap="round"/><text x="12" y="18.5" text-anchor="middle" font-size="8.5" font-weight="900" font-family="Arial,sans-serif" fill="#2b2430">7</text>',
        numbers:     LETTER('#3a8ee6', '1234', 6.2),
        ten:         LETTER('#3a8ee6', '10', 11),
        hundred:     '<text x="12" y="15" text-anchor="middle" font-size="11" font-weight="900" font-style="italic" font-family="Arial,sans-serif" fill="#e8384f">100</text><path d="M3.5 18.5h17M4.5 21h15" stroke="#e8384f" stroke-width="1.6" stroke-linecap="round"/>',
        plus:        '<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#2fb85a" ' + O + '/><path d="M12 6.5v11M6.5 12h11" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
        abc:         LETTER('#3a8ee6', 'abc', 9),
        letter_a:    LETTER('#e8384f', 'A', 14),
        up_word:     LETTER('#3a8ee6', 'UP', 10),
        infinity:    '<path d="M12 12c-2-3-3.5-4.5-6-4.5a4.5 4.5 0 000 9c2.5 0 4-1.5 6-4.5s3.5-4.5 6-4.5a4.5 4.5 0 010 9c-2.5 0-4-1.5-6-4.5z" fill="none" stroke="#9a5ce0" stroke-width="2.6"/>',
        recycle:     '<g fill="none" stroke="#2fb85a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5l3-3 3 3M12 2.5v0M7.5 9.5L12 2.5l4.5 7"/><path d="M18 14.5l2.5 4.5h-8.5M14.5 21.5l-2.5-2.5 2.5-2.5"/><path d="M6 14.5l-2.5 4.5H9M3.5 9.5l3.5 0-.5 3.5"/></g>',
        mirror:      '<ellipse cx="12" cy="10" rx="7" ry="8" fill="#c8915a" ' + O + '/><ellipse cx="12" cy="10" rx="5.3" ry="6.3" fill="#cfefff"/><path d="M9 7.5l3-2M9.5 11l5-4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M12 18v4" stroke="#c8915a" stroke-width="2.6" stroke-linecap="round"/>',
        fast_forward:'<path d="M3 5l9 7-9 7zM12 5l9 7-9 7z" fill="#3a8ee6" ' + O + '/>',
        prev:        '<path d="M21 5l-8 7 8 7zM13 5l-8 7 8 7z" fill="#5a6a85"/><rect x="2.6" y="5" width="2.4" height="14" fill="#5a6a85"/>',
        bomb:        '<circle cx="10.5" cy="14" r="7.5" fill="#2b2f45" ' + O + '/><rect x="13.5" y="5" width="4" height="4" rx="1" fill="#5a6475" transform="rotate(45 15.5 7)"/><path d="M17 5c1-2 3-2.5 4-1.5" stroke="#a8743e" stroke-width="1.4" fill="none"/><path d="M21.5 2l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L19.5 4l1.5-.5z" fill="#ffc928"/><circle cx="7.5" cy="11.5" r="1.6" fill="#fff" opacity=".5"/>',
        ring:        '<circle cx="12" cy="15" r="6.5" fill="none" stroke="#ffc928" stroke-width="2.6"/><path d="M9 3.5h6l2 3-5 5-5-5z" fill="#7fe0ff" ' + O + '/>',
        thread:      '<rect x="6" y="2.5" width="12" height="3" rx="1" fill="#a8743e" ' + O + '/><rect x="6" y="18.5" width="12" height="3" rx="1" fill="#a8743e" ' + O + '/><rect x="7.5" y="5.5" width="9" height="13" fill="#e8384f"/><path d="M7.5 8l9 2M7.5 11l9 2M7.5 14l9 2" stroke="#b8261a" stroke-width="1"/>',
        wood:        '<rect x="2" y="8" width="16" height="9" rx="1" fill="#b07a42" ' + O + '/><ellipse cx="18" cy="12.5" rx="4" ry="4.5" fill="#e8c38a" ' + O + '/><ellipse cx="18" cy="12.5" rx="2" ry="2.3" fill="none" stroke="#b07a42" stroke-width="1"/><path d="M4 11h9M6 14h8" stroke="#8a5a2b" stroke-width="1"/>',
        nut_bolt:    '<path d="M8 3l4 2.3v4.6L8 12.2 4 9.9V5.3z" fill="#9aa6b8" ' + O + '/><circle cx="8" cy="7.6" r="1.6" fill="#5a6475"/><path d="M15 8l5 5-1.5 1.5-5-5zM18.5 14.5l-6 6" stroke="#9aa6b8" stroke-width="3" stroke-linecap="round"/>',
        inbox:       '<path d="M3 13l3-8h12l3 8v7H3z" fill="#dfe7f2" ' + O + '/><path d="M3 13h5l1.5 2.5h5L16 13h5" fill="none" stroke="#7a8699" stroke-width="1.2"/><path d="M12 3v7M9 7.5l3 3 3-3" stroke="#3a8ee6" stroke-width="2" fill="none" stroke-linecap="round"/>',
        outbox:      '<path d="M3 13l3-6h3M21 13l-3-6h-3M3 13h5l1.5 2.5h5L16 13h5v7H3z" fill="#dfe7f2" ' + O + '/><path d="M12 11V3M9 6l3-3 3 3" stroke="#3a8ee6" stroke-width="2" fill="none" stroke-linecap="round"/>',
        folder:      '<path d="M2.5 6a1.5 1.5 0 011.5-1.5h5l2 2h9A1.5 1.5 0 0121.5 8v11a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 19z" fill="#ffc94a" ' + O + '/><path d="M2.5 10h19" stroke="#e8a317" stroke-width="1.2"/>',
        email:       '<rect x="2" y="5" width="20" height="14" rx="2" fill="#fff" ' + O + '/><path d="M2.5 6l9.5 7.5L21.5 6" fill="none" stroke="#3a8ee6" stroke-width="1.8"/>',
        school:      '<path d="M2.5 10L12 4l9.5 6v11h-19z" fill="#f4e3c4" ' + O + '/><rect x="9.5" y="15" width="5" height="6" fill="#a8743e"/><circle cx="12" cy="10" r="2.3" fill="#fff" stroke="#5a6475" stroke-width="1"/><path d="M12 8.8v1.4l1 .6" stroke="#5a6475" stroke-width=".8" fill="none"/><rect x="4.5" y="13" width="3" height="3" fill="#7fc8ff"/><rect x="16.5" y="13" width="3" height="3" fill="#7fc8ff"/>',
        broom:       '<path d="M19 3l-8 9" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/><path d="M10 10.5l3.5 3L9 21c-2 .5-5 0-6.5-1.5L4 16z" fill="#f2c94c" ' + O + '/><path d="M6 17.5l2 2.5M8 15.5l2.5 2.5" stroke="#c89a2a" stroke-width="1"/>',
        hospital:    '<rect x="3" y="5" width="18" height="16.5" fill="#fff" ' + O + '/><rect x="9" y="7" width="6" height="6" fill="#e8384f"/><path d="M12 8v4M10 10h4" stroke="#fff" stroke-width="1.6"/><rect x="10" y="16" width="4" height="5.5" fill="#7fc8ff"/><rect x="5" y="15" width="3" height="3" fill="#7fc8ff"/><rect x="16" y="15" width="3" height="3" fill="#7fc8ff"/>',
        classical:   '<path d="M2.5 8L12 2.5 21.5 8z" fill="#dfe7f2" ' + O + '/><rect x="3" y="8" width="18" height="2" fill="#c3ccd8"/><path d="M5.5 10v8.5M9.5 10v8.5M14.5 10v8.5M18.5 10v8.5" stroke="#dfe7f2" stroke-width="2.2"/><rect x="2.5" y="18.5" width="19" height="3" fill="#c3ccd8" ' + O + '/>',
        derelict:    '<path d="M3 11l9-7 9 7v10.5H3z" fill="#a89a84" ' + O + '/><path d="M8 21.5v-6h4v6" fill="#6b5a44"/><path d="M14 13l3 3M17 13l-3 3" stroke="#5a4a34" stroke-width="1.2"/><path d="M10 6.5l1.5 3-2 1.5" stroke="#5a4a34" stroke-width="1" fill="none"/>',
        volcano:     '<path d="M1.5 21.5L8.5 9h7l7 12.5z" fill="#8a5a3a" ' + O + '/><path d="M8.5 9l2 4 1.5-2 1.5 2.5 2-4.5z" fill="#ff6a1a"/><path d="M12 7c-1-2 0-4 2-4.5M10 7.5C8 6 8 3.5 9 2.5M14 7.5c2-1 3.5-1 4.5 0" stroke="#9aa6b8" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        bed:         '<rect x="2" y="12" width="20" height="5" rx="1" fill="#3a8ee6" ' + O + '/><rect x="2" y="8" width="3" height="13" rx="1" fill="#a8743e"/><rect x="5.5" y="9.5" width="5.5" height="3" rx="1.5" fill="#fff" ' + O + '/><path d="M21 17v4" stroke="#a8743e" stroke-width="2.4"/>',
        picture:     '<rect x="2.5" y="4" width="19" height="16" rx="1.5" fill="#c8915a" ' + O + '/><rect x="4.5" y="6" width="15" height="12" fill="#bfe8ff"/><path d="M4.5 18l5-6 3.5 4 2-2.5 4.5 4.5z" fill="#3fae5a"/><circle cx="16" cy="9" r="1.6" fill="#ffc928"/>',
        ticket:      '<path d="M2.5 7h19v3a2 2 0 000 4v3h-19v-3a2 2 0 000-4z" fill="#ffc928" ' + O + '/><path d="M8 7v10" stroke="#d68a12" stroke-width="1.2" stroke-dasharray="1.5 1.2"/><path d="M14.5 9.5l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2z" fill="#e8384f"/>',
        military:    '<path d="M8 2h8v7l-4 2-4-2z" fill="#3a6fd4" ' + O + '/><path d="M10.5 2v8M13.5 2v8" stroke="#e8384f" stroke-width="1.2"/><path d="M12 11l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 16.1l4.8-.7z" fill="#ffc928" ' + O + '/>',
        link:        '<g fill="none" stroke="#7a8699" stroke-width="2.6" stroke-linecap="round"><path d="M10 14a4 4 0 005.6 0l3.2-3.2a4 4 0 00-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 00-5.6 0l-3.2 3.2a4 4 0 005.6 5.6l1-1"/></g>',
        blood:       '<path d="M12 2.5C9 7.5 5.5 11 5.5 15a6.5 6.5 0 0013 0c0-4-3.5-7.5-6.5-12.5z" fill="#d61f3a" ' + O + '/><path d="M8.8 15a3.2 3.2 0 002.4 3.2" stroke="#ff9aa8" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        bandage:     '<rect x="2" y="8.5" width="20" height="7" rx="3.5" fill="#f4c99a" ' + O + ' transform="rotate(-35 12 12)"/><rect x="8.5" y="9" width="7" height="6" fill="#fde7d0" transform="rotate(-35 12 12)"/><circle cx="11" cy="11.5" r=".6" fill="#d89a64"/><circle cx="13" cy="12.5" r=".6" fill="#d89a64"/>',
        syringe:     '<path d="M15.5 3.5l5 5M18 6l-3 3" stroke="#7a8699" stroke-width="1.8" stroke-linecap="round"/><path d="M16 7.5L7 16.5 5 19l-1.5 1.5M16 7.5l-3-3L4 13.5l3 3z" fill="#dfe7f2" stroke="#7a8699" stroke-width="1.1" stroke-linejoin="round"/><path d="M7 13l4-4 2 2-4 4z" fill="#e8384f"/>',
        ladder:      '<path d="M7 2v20M17 2v20" stroke="#a8743e" stroke-width="2.4" stroke-linecap="round"/><path d="M7 6h10M7 10.5h10M7 15h10M7 19.5h10" stroke="#c8915a" stroke-width="2"/>',
        scales:      '<path d="M12 3v17M6 21h12M4 7h16" stroke="#c8963a" stroke-width="1.8" stroke-linecap="round"/><path d="M4 7l-2.5 6h5zM20 7l-2.5 6h5z" fill="none" stroke="#c8963a" stroke-width="1.2"/><path d="M1.5 13a2.5 2 0 005 0zM17.5 13a2.5 2 0 005 0z" fill="#ffc928" ' + O + '/><circle cx="12" cy="3" r="1.5" fill="#ffc928"/>',
        red_envelope:'<rect x="4" y="2.5" width="16" height="19" rx="2" fill="#e0233f" ' + O + '/><path d="M4 8c4 3 12 3 16 0" fill="none" stroke="#b8162c" stroke-width="1.2"/><circle cx="12" cy="10" r="2.6" fill="#ffc928" ' + O + '/>',
        meat:        '<path d="M14 3c4 0 7 3 7 7 0 5-5 8-9 7l-3 3c.5 1.2-.5 2.8-2 2.3-1.2-.4-1.2-1.6-1-2-.6.2-1.8.1-2.1-1.1-.4-1.5 1.2-2.5 2.3-2L9 14c-1-4 1-11 5-11z" fill="#c8562a" ' + O + '/><path d="M14 6c2 0 4 2 4 4" stroke="#f0a070" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M4.5 19.5l3-3" stroke="#f4eee0" stroke-width="2.4" stroke-linecap="round"/>',
        door:        '<rect x="5" y="2.5" width="14" height="19" rx="1.5" fill="#a8743e" ' + O + '/><rect x="7.5" y="5" width="9" height="6" rx="1" fill="#8a5a2b"/><rect x="7.5" y="12.5" width="9" height="6.5" rx="1" fill="#8a5a2b"/><circle cx="16" cy="12" r="1.1" fill="#ffc928"/>',
        point_up:    '<path d="M10 3a1.5 1.5 0 013 0v8l4.5.8c1.5.3 2.5 1.5 2.3 3l-.6 4.2A3.5 3.5 0 0115.7 22H11c-1.2 0-2.3-.6-3-1.6L5 16a1.5 1.5 0 012.3-1.9L10 16z" fill="#ffc48a" ' + O + '/>',
        hand:        '<path d="M7 11V5a1.5 1.5 0 013 0v5V3.5a1.5 1.5 0 013 0V10V4.5a1.5 1.5 0 013 0V12V7.5a1.5 1.5 0 013 0V15c0 4-3 7-7 7-3 0-5-1.5-6.5-4L3.5 14a1.5 1.5 0 012.5-1.5z" fill="#ffc48a" ' + O + '/>',
        ear:         '<path d="M7 9a5.5 5.5 0 0111 0c0 3-2 4-3 5.5S13.5 18 13 19.5c-.6 1.8-2.5 2.5-4 1.8" fill="#ffc48a" ' + O + '/><path d="M10 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2 3" fill="none" stroke="#d89058" stroke-width="1.3" stroke-linecap="round"/>',
        foot:        '<path d="M8 21c-3 0-4.5-2.5-4-5.5L6 8c.8-3 5-3 6 0l1.5 4.5c1.5 2 6 2.5 6.5 5.5.3 2-1 3-3 3z" fill="#ffc48a" ' + O + '/><circle cx="20" cy="15" r="1.1" fill="#ffc48a" ' + O + '/>',
        brain:       '<path d="M12 4c-1.5-1.5-5-1.5-6 1-2.5.5-3.5 3-2.5 5-1.5 1.5-1 4.5 1 5.5 0 2.5 2.5 4 4.5 3.5 1 1.5 2 1.5 3 1 1 .5 2 .5 3-1 2 .5 4.5-1 4.5-3.5 2-1 2.5-4 1-5.5 1-2 0-4.5-2.5-5-1-2.5-4.5-2.5-6-1z" fill="#ffaac4" ' + O + '/><path d="M12 4v15.5M8 8c1 1 1 3 0 4M16 8c-1 1-1 3 0 4M7 15c1.5 0 2.5 1 2.5 2M17 15c-1.5 0-2.5 1-2.5 2" fill="none" stroke="#e07a9a" stroke-width="1.1"/>',
        dividers:    '<rect x="3" y="5" width="18" height="15" rx="1.5" fill="#c8915a" ' + O + '/><rect x="5" y="3" width="6" height="4" rx="1" fill="#e8384f"/><rect x="11" y="3.5" width="6" height="3.5" rx="1" fill="#3a8ee6"/><rect x="5" y="7" width="14" height="11" rx="1" fill="#fff"/>',
        memo:        '<rect x="4" y="2.5" width="14" height="19" rx="1.5" fill="#fff" ' + O + '/><path d="M7 7h8M7 10.5h8M7 14h5" stroke="#9aa6b8" stroke-width="1.2" stroke-linecap="round"/><path d="M21.5 9L13 17.5l-2.5.8.8-2.5L19.8 7.3z" fill="#ffc928" ' + O + '/>',
        pencil:      '<path d="M4 20l1-4.5L16.5 4l3.5 3.5L8.5 19z" fill="#ffc928" ' + O + '/><path d="M4 20l1-4.5 3.5 3.5z" fill="#f4dcb0"/><path d="M4 20l.4-1.8 1.4 1.4z" fill="#2b2430"/><path d="M15 5.5l3.5 3.5" stroke="#e8384f" stroke-width="2.4"/>',
        keyboard:    '<rect x="1.5" y="6" width="21" height="12" rx="2" fill="#dfe7f2" ' + O + '/><path d="M4.5 9h1.5M8 9h1.5M11.5 9H13M15 9h1.5M18 9h1.5M4.5 12h1.5M8 12h1.5M11.5 12H13M15 12h1.5M18 12h1.5M7 15h10" stroke="#5a6475" stroke-width="1.6" stroke-linecap="round"/>',
        glasses:     '<circle cx="6.5" cy="13" r="4" fill="#bfe8ff" stroke="#3a6fd4" stroke-width="2"/><circle cx="17.5" cy="13" r="4" fill="#bfe8ff" stroke="#3a6fd4" stroke-width="2"/><path d="M10.5 12.5c1-1 2-1 3 0M2.5 12l-1-3M21.5 12l1-3" stroke="#3a6fd4" stroke-width="1.8" fill="none"/>',
        mic:         '<rect x="9" y="2" width="6" height="11" rx="3" fill="#b9c3d0" ' + O + '/><path d="M6 10a6 6 0 0012 0M12 16v5M8.5 21.5h7" stroke="#9aa6b8" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
        violin:      '<path d="M19 2l-6 6" stroke="#2b2430" stroke-width="1.6"/><path d="M12 7c2 0 3 1.5 2.5 3-.4 1 .5 2 1.5 2 2 0 3 2 2 4.5-1 2.5-4 3.5-6 2.5-1-.5-2-.5-2.5.5-1 2-4 2-5.5 0-1.5-2 0-5 2-5 1 0 1.5-1 1-2-.5-2.5 1.5-5.5 5-5.5z" fill="#c8562a" ' + O + '/><path d="M15 9l-6 6" stroke="#2b2430" stroke-width="1.2"/>',
        // ---- 色・形 ----
        circle_orange:'<circle cx="12" cy="12" r="9.5" fill="#ff8a1f" ' + O + '/>',
        diamond_sblue:'<path d="M12 6l6 6-6 6-6-6z" fill="#3a8ee6" ' + O + '/>',
        diamond_sorange:'<path d="M12 6l6 6-6 6-6-6z" fill="#ff8a1f" ' + O + '/>',
        heart_white: '<path d="' + HEART + '" fill="#fff" stroke="#9aa6b8" stroke-width="1.1"/>',
        moon:        '<path d="M15 2.5A9.5 9.5 0 1021.5 15 7.5 7.5 0 0115 2.5z" fill="#ffd43b" ' + O + '/>',
        sun_face:    '<g stroke="#ffb020" stroke-width="2" stroke-linecap="round"><path d="M12 1v2.5M12 20.5V23M1 12h2.5M20.5 12H23M4.2 4.2L6 6M18 18l1.8 1.8M4.2 19.8L6 18M18 6l1.8-1.8"/></g><circle cx="12" cy="12" r="6.8" fill="#ffd43b" ' + O + '/><circle cx="9.8" cy="11" r=".9" fill="#7a4a10"/><circle cx="14.2" cy="11" r=".9" fill="#7a4a10"/><path d="M9.8 14c1.2 1 3.2 1 4.4 0" stroke="#7a4a10" stroke-width="1.1" fill="none" stroke-linecap="round"/>',
        sunrise:     '<rect x="1.5" y="3" width="21" height="18" rx="3" fill="#ffb27a"/><circle cx="12" cy="15" r="5" fill="#ffd43b"/><rect x="1.5" y="15" width="21" height="6" rx="0" fill="#3a8ee6"/><path d="M5 17.5h4M14 18.5h5" stroke="#bfe8ff" stroke-width="1.2" stroke-linecap="round"/>',
        rainbow:     '<g fill="none" stroke-width="2"><path d="M2 19a10 10 0 0120 0" stroke="#e8384f"/><path d="M4.2 19a7.8 7.8 0 0115.6 0" stroke="#ffc928"/><path d="M6.4 19a5.6 5.6 0 0111.2 0" stroke="#3cc65c"/><path d="M8.6 19a3.4 3.4 0 016.8 0" stroke="#3a8ee6"/></g>',
        cherry_blossom:'<g fill="#ffb3cf" ' + O + '><circle cx="12" cy="6" r="4"/><circle cx="18" cy="10.5" r="4"/><circle cx="15.7" cy="17.5" r="4"/><circle cx="8.3" cy="17.5" r="4"/><circle cx="6" cy="10.5" r="4"/></g><circle cx="12" cy="12.2" r="2.6" fill="#ffd43b"/>',
        leaf:        '<path d="M4 20C4 10 10 4 21 3c-1 11-7 17-17 17z" fill="#3cc65c" ' + O + '/><path d="M4 20L15 9" stroke="#2a8a44" stroke-width="1.3"/>',
        herb:        '<path d="M12 22V9" stroke="#2a8a44" stroke-width="1.6"/><path d="M12 9c-1-4 1-6 0-7.5C10 3 9 6 12 9zM12 13c-3-1-6 0-7-2 3-1 5 0 7 2zM12 13c3-1 6 0 7-2-3-1-5 0-7 2zM12 18c-3-1-6 0-7-2 3-1 5 0 7 2zM12 18c3-1 6 0 7-2-3-1-5 0-7 2z" fill="#3cc65c" ' + O + '/>',
        clover:      '<g fill="#2fb85a" ' + O + '><circle cx="8.5" cy="8.5" r="4"/><circle cx="15.5" cy="8.5" r="4"/><circle cx="8.5" cy="15.5" r="4"/><circle cx="15.5" cy="15.5" r="4"/></g><path d="M12 12l5 10" stroke="#2a8a44" stroke-width="1.8" stroke-linecap="round"/>',
        cactus:      '<path d="M9.5 21V5a2.5 2.5 0 015 0v16z" fill="#3fae5a" ' + O + '/><path d="M9.5 13H7a2 2 0 01-2-2V8M14.5 11H17a2 2 0 002-2V6" fill="none" stroke="#3fae5a" stroke-width="3" stroke-linecap="round"/><rect x="6" y="20" width="12" height="3" rx="1" fill="#c8562a"/>',
        wilted:      '<path d="M12 22c0-6 0-9 3-12" stroke="#5a7a3a" stroke-width="1.8" fill="none"/><path d="M15 10c-1-3 1-5 3-5 1 2 2 4 0 6 1 2-1 4-3 3-1 0-1-2 0-4z" fill="#8a2a3a" ' + O + '/><path d="M10 17c-2-1-4-1-5 1 2 1 4 1 5-1z" fill="#6a8a4a"/>',
        camping:     '<path d="M1.5 21.5L12 4l10.5 17.5z" fill="#3fae5a" ' + O + '/><path d="M12 9l-4 12.5h8z" fill="#2a7a3c"/><circle cx="19" cy="4" r="2" fill="#ffd43b"/>',
        snowman:     '<circle cx="12" cy="16.5" r="5.5" fill="#fff" stroke="#7a8699" stroke-width="1.1"/><circle cx="12" cy="8.5" r="4" fill="#fff" stroke="#7a8699" stroke-width="1.1"/><rect x="8.5" y="2" width="7" height="3" rx=".6" fill="#2b2430"/><circle cx="10.5" cy="8" r=".8" fill="#2b2430"/><circle cx="13.5" cy="8" r=".8" fill="#2b2430"/><path d="M12 9.2l2 .8-2 .5z" fill="#ff8a1f"/><circle cx="12" cy="15" r=".9" fill="#2b2430"/><circle cx="12" cy="18" r=".9" fill="#2b2430"/>',
        pumpkin:     '<path d="M12 5.5c0-2 1-3 2.5-3.5" stroke="#3f8a3a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="13.5" rx="9.5" ry="8" fill="#ff8a1f" ' + O + '/><path d="M12 5.5v16M7 7c-2 4-2 9 0 13M17 7c2 4 2 9 0 13" stroke="#d96a0a" stroke-width="1" fill="none"/><path d="M7.5 11.5l2 1.5h-2.5zM16.5 11.5l-2 1.5h2.5zM8 16.5l2 1.2 2-1.2 2 1.2 2-1.2" fill="#5a2a0a" stroke="#5a2a0a" stroke-width="1"/>',
        mahjong:     '<rect x="5" y="2" width="14" height="20" rx="2" fill="#fbf7ee" ' + O + '/><rect x="5" y="17.5" width="14" height="4.5" rx="2" fill="#3fae5a"/><text x="12" y="14" text-anchor="middle" font-size="10" font-weight="900" fill="#d61f3a">中</text>',
        // ---- 乗りもの ----
        rocket:      '<path d="M12 2c4 3 5 8 3.5 13h-7C7 10 8 5 12 2z" fill="#eef2f8" ' + O + '/><circle cx="12" cy="9" r="2" fill="#3a8ee6" ' + O + '/><path d="M8.5 13l-3 4 3.5-1M15.5 13l3 4-3.5-1" fill="#e8384f" ' + O + '/><path d="M10 15.5c0 3 1 5 2 6.5 1-1.5 2-3.5 2-6.5z" fill="#ff8a1f"/>',
        airplane:    '<path d="M21.5 4.5c-.8-.8-2.5-.5-3.5.5L14.5 8.5 5 6l-2 2 7.5 4L7 15.5H4L2.5 17l4 1.5 1.5 4 1.5-1.5v-3L13 14.5l4 7.5 2-2-2.5-9.5L20 7c1-1 1.3-2.7.5-3.5z" fill="#dfe7f2" ' + O + '/>',
        bus:         '<rect x="3" y="3" width="18" height="16" rx="3" fill="#ffc928" ' + O + '/><rect x="5" y="5.5" width="14" height="6" rx="1" fill="#bfe8ff"/><circle cx="7" cy="15" r="1.2" fill="#fff"/><circle cx="17" cy="15" r="1.2" fill="#fff"/><rect x="5" y="19" width="3.5" height="2.5" rx="1" fill="#2b2430"/><rect x="15.5" y="19" width="3.5" height="2.5" rx="1" fill="#2b2430"/>',
        train:       '<rect x="4" y="2.5" width="16" height="16" rx="3.5" fill="#3cc65c" ' + O + '/><rect x="6" y="5" width="12" height="6" rx="1" fill="#bfe8ff"/><circle cx="8" cy="14.5" r="1.2" fill="#fff"/><circle cx="16" cy="14.5" r="1.2" fill="#fff"/><path d="M7 18.5l-2 3.5M17 18.5l2 3.5" stroke="#5a6475" stroke-width="1.8" stroke-linecap="round"/>',
        firetruck:   '<rect x="1.5" y="9" width="14" height="8" fill="#e8384f" ' + O + '/><path d="M15.5 11h3.5l3 3v3h-6.5z" fill="#e8384f" ' + O + '/><rect x="16.5" y="12" width="2.5" height="2" fill="#bfe8ff"/><path d="M2.5 7.5l11-2.5M3.5 8.5l1-3M7 7.7l1-3M10.5 6.9l1-3" stroke="#9aa6b8" stroke-width="1.2"/><circle cx="5.5" cy="18" r="2.2" fill="#2b2430"/><circle cx="17.5" cy="18" r="2.2" fill="#2b2430"/>',
        bicycle:     '<circle cx="6" cy="16" r="4" fill="none" stroke="#8a96aa" stroke-width="2"/><circle cx="18" cy="16" r="4" fill="none" stroke="#8a96aa" stroke-width="2"/><path d="M6 16l4-7h6l2 7M10 9l3 7h-7M16 9l-1-3h-2M9 9H7" fill="none" stroke="#e8384f" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
        motorcycle:  '<circle cx="5.5" cy="16.5" r="3.5" fill="none" stroke="#8a96aa" stroke-width="2.2"/><circle cx="18.5" cy="16.5" r="3.5" fill="none" stroke="#8a96aa" stroke-width="2.2"/><path d="M5.5 16.5l4-5h6l3 5M15.5 11.5l-1-4h2.5" fill="none" stroke="#9aa6b8" stroke-width="1.8" stroke-linecap="round"/><path d="M8 11.5h8.5l-1.5 3H10z" fill="#e8384f" ' + O + '/>',
        helicopter:  '<path d="M3 4h18M12 4v3" stroke="#5a6475" stroke-width="1.8" stroke-linecap="round"/><path d="M5 12c0-3 3-5 7-5s6 2 6 5-3 5-7 5H8c-2 0-3-2-3-5z" fill="#ffc928" ' + O + '/><path d="M12 8c2 0 4 1.5 4 4h-4z" fill="#bfe8ff"/><path d="M5 12H1.5M1.5 10v4" stroke="#5a6475" stroke-width="1.6"/><path d="M8 17v3M15 17v3M5 20.5h13" stroke="#5a6475" stroke-width="1.5" stroke-linecap="round"/>',
        roller_skate:'<path d="M5 3h5v8l7 2c2 .5 3 2 3 3.5V17H4V4a1 1 0 011-1z" fill="#ff7eb6" ' + O + '/><path d="M7 7h3M7 10h3" stroke="#fff" stroke-width="1.2"/><circle cx="7" cy="20" r="2" fill="#7a8699"/><circle cx="17" cy="20" r="2" fill="#7a8699"/>',
        tower:       '<path d="M12 1.5v3M10.5 4.5h3L18 22h-3l-3-9-3 9H6z" fill="#e8402f" ' + O + '/><path d="M8.5 13h7M7.3 17h9.4" stroke="#fff" stroke-width="1.4"/>',
        // ---- 食べもの ----
        apple:       '<path d="M12 6.5c-2-1.5-6-1.5-7.5 2-1.5 4 0 9 3 11.5 1.5 1.2 3 1 4.5.3 1.5.7 3 .9 4.5-.3 3-2.5 4.5-7.5 3-11.5-1.5-3.5-5.5-3.5-7.5-2z" fill="#e8243c" ' + O + '/><path d="M12 6.5c0-2 .5-3.5 2-4.5" stroke="#6b4a2b" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M13 4.5c1.5-1.5 4-1.5 5 0-1.5 1.5-3.5 1.5-5 0z" fill="#3cc65c"/><ellipse cx="8" cy="10" rx="1.2" ry="2" fill="#fff" opacity=".5"/>',
        carrot:      '<path d="M17.5 6.5L3 21l1-5 9.5-9.5c1.5-1.5 3-1.5 4 0z" fill="#ff8a1f" ' + O + '/><path d="M8 13l2 1M6 16l2 1M11 10l2 1" stroke="#d96a0a" stroke-width="1"/><path d="M16 7c0-3 1-5 3-5 0 2-1 4-3 5zM17 8c3 0 5-1 5-3-2 0-4 1-5 3z" fill="#3cc65c"/>',
        banana:      '<path d="M4 6c1 8 6 13 15 13.5 1.5 0 2-1.5.8-2.3C12 15 8 11 7 5c-.3-1.5-3.2-1.5-3 1z" fill="#ffd43b" ' + O + '/><path d="M4.5 4.5L5 2.5" stroke="#6b4a2b" stroke-width="1.6" stroke-linecap="round"/>',
        tomato:      '<circle cx="12" cy="13.5" r="8.5" fill="#e8302f" ' + O + '/><path d="M12 5l1.5 2.5L16.5 6 15 8.5l2.5 1L14 10l-2 2-2-2-3.5-.5L9 8.5 7.5 6l3 1.5z" fill="#3cc65c"/><ellipse cx="8.5" cy="13" rx="1.2" ry="2" fill="#fff" opacity=".45"/>',
        pizza:       '<path d="M12 21.5L2.5 5c6-3.5 13-3.5 19 0z" fill="#ffc94a" ' + O + '/><path d="M2.5 5c6-3.5 13-3.5 19 0l-1 1.8c-5.5-3-11.5-3-17 0z" fill="#d9944a"/><circle cx="9.5" cy="9" r="1.6" fill="#e0402f"/><circle cx="14.5" cy="10" r="1.6" fill="#e0402f"/><circle cx="12" cy="14.5" r="1.4" fill="#e0402f"/>',
        cake:        '<path d="M3 13l18-5v12H3z" fill="#fff3e0" ' + O + '/><path d="M3 13l18-5v3L3 16z" fill="#ffb3cf"/><path d="M14 9V4" stroke="#3a8ee6" stroke-width="1.4"/><path d="M14 2c-.8 1-.8 1.8 0 2 .8-.2.8-1 0-2z" fill="#ff8a1f"/><circle cx="17.5" cy="7.5" r="1.5" fill="#e0233f"/>',
        birthday_cake:'<rect x="3" y="12" width="18" height="9" rx="1.5" fill="#fff3e0" ' + O + '/><path d="M3 15c3 1.5 6 1.5 9 0s6-1.5 9 0v-3H3z" fill="#ffb3cf"/><path d="M8 12V8M12 12V8M16 12V8" stroke="#3a8ee6" stroke-width="1.4"/><path d="M8 5.5c-.8 1-.8 1.8 0 2 .8-.2.8-1 0-2zM12 5.5c-.8 1-.8 1.8 0 2 .8-.2.8-1 0-2zM16 5.5c-.8 1-.8 1.8 0 2 .8-.2.8-1 0-2z" fill="#ff8a1f"/>',
        onigiri:     '<path d="M12 3c3 0 9.5 10 9.5 14 0 2.5-2 4-5 4H7.5c-3 0-5-1.5-5-4C2.5 13 9 3 12 3z" fill="#fff" stroke="#9aa6b8" stroke-width="1.1"/><rect x="7.5" y="14" width="9" height="7" fill="#2b3a2b"/>',
        milk:        '<path d="M7 7l2-4h6l2 4v14H7z" fill="#fff" stroke="#7a8699" stroke-width="1.1" stroke-linejoin="round"/><rect x="7" y="11" width="10" height="6" fill="#3a8ee6"/><path d="M9 3h6" stroke="#3a8ee6" stroke-width="1.4"/>',
        bread:       '<path d="M4 10c-2-4 2-7 8-7s10 3 8 7v10H4z" fill="#e8b66a" ' + O + '/><path d="M6 10c0-2 2.5-4 6-4s6 2 6 4v8H6z" fill="#fde7c0"/>',
        donut:       '<circle cx="12" cy="12" r="9.5" fill="#d9944a" ' + O + '/><path d="M3.5 11c1-5 5-8 8.5-8s7.5 3 8.5 8c-1 2-2.5 1-3.5 2.5s-2 .5-3 1.5-2 0-3 .5-2-1-3-.5-2 .5-2.5-1S3 12 3.5 11z" fill="#ff7eb6"/><circle cx="12" cy="12" r="3" fill="#fff" ' + O + '/><path d="M7 7l1 .5M15 6l.8.8M17.5 10l1 .2M9 9.5l.5 1" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>',
        chocolate:   '<rect x="5" y="2.5" width="14" height="19" rx="1.5" fill="#6b3a1a" ' + O + '/><path d="M5 9h14M5 15.5h14M12 2.5v19" stroke="#4a2410" stroke-width="1.2"/><path d="M5 13l14-4v12.5H5z" fill="#e8384f"/>',
        lollipop:    '<path d="M12 13v9" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8.5" r="6.5" fill="#ff7eb6" ' + O + '/><path d="M12 8.5c0-1 1.5-1 1.5 0 0 2-3 2-3 0 0-3 4.5-3 4.5 0 0 4-6 4-6 0" fill="none" stroke="#fff" stroke-width="1.3"/>',
        ramen:       '<path d="M2.5 11h19c0 5.5-4 9.5-9.5 9.5S2.5 16.5 2.5 11z" fill="#e8384f" ' + O + '/><path d="M4 11c1-2 2-2 3 0s2 2 3 0 2-2 3 0 2 2 3 0 2-2 3 0" stroke="#ffd96b" stroke-width="1.4" fill="none"/><path d="M14 9L21 2M16 9.5L22 4" stroke="#a8743e" stroke-width="1.4" stroke-linecap="round"/><path d="M7 14.5c1.5 1 3 1 4.5 0" stroke="#fff" stroke-width="1.2" fill="none"/>',
        tropical:    '<path d="M4 6h14l-6 8z" fill="#ffb27a" ' + O + '/><path d="M12 14v6M8 21h8" stroke="#9aa6b8" stroke-width="1.6" stroke-linecap="round"/><path d="M15 9l4-7" stroke="#3cc65c" stroke-width="1.4"/><circle cx="6.5" cy="5.5" r="2.5" fill="#ffd43b" ' + O + '/>',
        // ---- 生きもの・人 ----
        dog:         '<path d="M4 5c-2 2-2 7 0 9l2.5-4zM20 5c2 2 2 7 0 9l-2.5-4z" fill="#8a5a2b" ' + O + '/>' + FACE('#e8b66a', EYES + '<ellipse cx="12" cy="15.3" rx="1.6" ry="1.1" fill="#2b2430"/><path d="M12 16.4v1.2M10 17.6c1 .8 3 .8 4 0" stroke="#2b2430" stroke-width="1" fill="none" stroke-linecap="round"/>'),
        cat:         '<path d="M4.5 9L5 2.5l5 4M19.5 9L19 2.5l-5 4" fill="#ffb84a" ' + O + '/>' + FACE('#ffb84a', EYES + '<path d="M11.2 15l.8.8.8-.8z" fill="#e0607a"/><path d="M3 14h4M3 16.5l4-1M21 14h-4M21 16.5l-4-1" stroke="#7a4a10" stroke-width=".9"/>'),
        rabbit:      '<ellipse cx="8.5" cy="5.5" rx="2.2" ry="5" fill="#fff" stroke="#9aa6b8" stroke-width="1"/><ellipse cx="15.5" cy="5.5" rx="2.2" ry="5" fill="#fff" stroke="#9aa6b8" stroke-width="1"/><circle cx="12" cy="14" r="7.5" fill="#fff" stroke="#9aa6b8" stroke-width="1"/>' + EYES.replace(/12.3/g, '13.5') + '<path d="M11.2 16l.8.8.8-.8z" fill="#e0607a"/>',
        panda:       '<circle cx="5.5" cy="6" r="3" fill="#2b2430"/><circle cx="18.5" cy="6" r="3" fill="#2b2430"/>' + FACE('#fff', '<ellipse cx="8.8" cy="12.3" rx="2" ry="2.6" fill="#2b2430"/><ellipse cx="15.2" cy="12.3" rx="2" ry="2.6" fill="#2b2430"/><circle cx="9" cy="12" r=".7" fill="#fff"/><circle cx="15" cy="12" r=".7" fill="#fff"/><ellipse cx="12" cy="16" rx="1.3" ry=".9" fill="#2b2430"/>'),
        polar_bear:  '<circle cx="5.5" cy="6" r="2.8" fill="#fff" stroke="#9aa6b8" stroke-width="1"/><circle cx="18.5" cy="6" r="2.8" fill="#fff" stroke="#9aa6b8" stroke-width="1"/><circle cx="12" cy="13" r="8.5" fill="#fff" stroke="#9aa6b8" stroke-width="1"/>' + EYES + '<ellipse cx="12" cy="16" rx="1.4" ry="1" fill="#2b2430"/>',
        tiger:       '<path d="M5 5l3 3M19 5l-3 3" stroke="#ffa31f" stroke-width="4" stroke-linecap="round"/>' + FACE('#ffa31f', EYES + '<path d="M12 4.5v3M9.5 5l.8 2.5M14.5 5l-.8 2.5M3.5 12h2.5M18 12h2.5M4 15h2.5M17.5 15H20" stroke="#2b2430" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="12" cy="16.5" rx="3" ry="2.2" fill="#fff3e0"/><path d="M11.2 15.5l.8.7.8-.7z" fill="#2b2430"/>'),
        lion:        '<circle cx="12" cy="12.5" r="11" fill="#c8761a"/>' + FACE('#ffc94a', EYES + '<ellipse cx="12" cy="16" rx="2.8" ry="2" fill="#fff3e0"/><path d="M11.2 15l.8.7.8-.7z" fill="#2b2430"/>'),
        cow:         '<path d="M3 8l3 1.5M21 8l-3 1.5" stroke="#9aa6b8" stroke-width="2.5" stroke-linecap="round"/>' + FACE('#fff', EYES + '<path d="M6 7c2 0 3 2 2 3.5-1 1-3 .5-3.5-1zM16.5 6c1.5.5 2 2 1 3" fill="#2b2430"/><ellipse cx="12" cy="17" rx="4.5" ry="3" fill="#ffb3cf"/><circle cx="10.5" cy="17" r=".7" fill="#2b2430"/><circle cx="13.5" cy="17" r=".7" fill="#2b2430"/>'),
        frog:        '<circle cx="7.5" cy="7" r="3.5" fill="#5ccf5a" ' + O + '/><circle cx="16.5" cy="7" r="3.5" fill="#5ccf5a" ' + O + '/><ellipse cx="12" cy="14" rx="9.5" ry="7" fill="#5ccf5a" ' + O + '/><circle cx="7.5" cy="7" r="1.5" fill="#2b2430"/><circle cx="16.5" cy="7" r="1.5" fill="#2b2430"/><path d="M6 15c3 3 9 3 12 0" stroke="#2b5a2b" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
        chick:       '<path d="M3 15c0-5 4-9 9-9s9 4 9 9c0 4-3 6.5-9 6.5S3 19 3 15z" fill="#fff" stroke="#9aa6b8" stroke-width="1"/><path d="M3 15l3-2 3 2 3-2 3 2 3-2 3 2" fill="none" stroke="#9aa6b8" stroke-width="1"/><circle cx="12" cy="8" r="5" fill="#ffd43b" ' + O + '/><circle cx="10.5" cy="7.5" r=".8" fill="#2b2430"/><circle cx="13.5" cy="7.5" r=".8" fill="#2b2430"/><path d="M11 9.3h2l-1 1.2z" fill="#ff8a1f"/>',
        mouse:       '<circle cx="5.5" cy="7" r="4" fill="#b9c3d0" ' + O + '/><circle cx="18.5" cy="7" r="4" fill="#b9c3d0" ' + O + '/><circle cx="5.5" cy="7" r="2.2" fill="#ffb3cf"/><circle cx="18.5" cy="7" r="2.2" fill="#ffb3cf"/>' + FACE('#b9c3d0', EYES + '<circle cx="12" cy="16" r="1.1" fill="#e0607a"/>'),
        elephant:    '<circle cx="5" cy="11" r="4.5" fill="#9aa6c8" ' + O + '/><circle cx="19" cy="11" r="4.5" fill="#9aa6c8" ' + O + '/><circle cx="12" cy="10" r="6.5" fill="#aab4d4" ' + O + '/><path d="M12 13c0 3 0 5 1.5 7.5 1 1.5 3 1 3-.5" fill="none" stroke="#aab4d4" stroke-width="3.2" stroke-linecap="round"/><circle cx="9.5" cy="9.5" r="1" fill="#2b2430"/><circle cx="14.5" cy="9.5" r="1" fill="#2b2430"/>',
        bird:        '<path d="M2.5 12c3 0 4-3 7-4 4-1.5 8 0 10 3l2.5.5-2.2 1.3c-1 4-4.5 6.5-9 6.5-3 0-6-2-8.3-7.3z" fill="#3a8ee6" ' + O + '/><path d="M8 12c2 2 5 2.5 7 1.5" stroke="#1d6fa8" stroke-width="1.2" fill="none"/><circle cx="17" cy="10" r=".9" fill="#fff"/>',
        phoenix:     '<path d="M12 4c-2 3-8 4-9.5 9 3-1 5-1 6.5 1-2 2-3 4-2.5 7 2-2 4-3 5.5-3s3.5 1 5.5 3c.5-3-.5-5-2.5-7 1.5-2 3.5-2 6.5-1-1.5-5-7.5-6-9.5-9z" fill="#ff6a1a" ' + O + '/><path d="M12 7c-1 2-3 3-4 5h8c-1-2-3-3-4-5z" fill="#ffd43b"/><circle cx="12" cy="5" r="2" fill="#ff8a1f" ' + O + '/>',
        ant:         '<circle cx="5" cy="13" r="2.8" fill="#b0482a"/><ellipse cx="10.5" cy="13" rx="2.6" ry="2.2" fill="#b0482a"/><ellipse cx="17.5" cy="13" rx="4.5" ry="3.5" fill="#b0482a"/><path d="M8 15l-2 4M10.5 15v4.5M13 15l2 4M8 11l-2-3.5M13 11l2-4M4 10.5L2 7M6 10.5l1-3.5" stroke="#b0482a" stroke-width="1.1" stroke-linecap="round"/>',
        trex:        '<path d="M3 21l2-6c-1-3 0-6 2-8 2-3 6-4.5 10-4 3 .3 4.5 2 4.5 4s-1.5 3-3.5 3h-3l-1 2 2 1-1 1.5-2-.5L12 18l1 3H10l-1-3-2 3z" fill="#3fae5a" ' + O + '/><circle cx="15" cy="6" r="1" fill="#2b2430"/><path d="M14 10l1.5 1M16 10l1 1" stroke="#fff" stroke-width=".9"/>',
        smile:       FACE('#ffd43b', '<path d="M8 11.5c.5-1 1.5-1 2 0M14 11.5c.5-1 1.5-1 2 0" stroke="#5a3a10" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M7.5 14.5c1.5 3.5 7.5 3.5 9 0z" fill="#5a3a10"/>'),
        cool:        FACE('#ffd43b', '<path d="M4.5 10.5h15l-.5 1.5c-.5 2-1.5 2.5-3 2.5s-2.5-.5-3-2.2h-2c-.5 1.7-1.5 2.2-3 2.2s-2.5-.5-3-2.5z" fill="#2b2430"/><path d="M9 17c2 1.2 4.5 1 6-.5" stroke="#5a3a10" stroke-width="1.4" fill="none" stroke-linecap="round"/>'),
        imp:         '<path d="M4 3.5c0 3 1 4.5 3 5.5M20 3.5c0 3-1 4.5-3 5.5" fill="none" stroke="#6a2fb0" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="13.5" r="8.5" fill="#8a4ad0" ' + O + '/><path d="M7.5 10.5l3 1.5M16.5 10.5l-3 1.5" stroke="#2b1a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M8 17.5c2.5-2 5.5-2 8 0" stroke="#2b1a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        teddy:       '<circle cx="6" cy="5.5" r="2.8" fill="#b07a42" ' + O + '/><circle cx="18" cy="5.5" r="2.8" fill="#b07a42" ' + O + '/>' + FACE('#c8915a', EYES + '<ellipse cx="12" cy="15.8" rx="3" ry="2.3" fill="#f0d0a8"/><ellipse cx="12" cy="15" rx="1.2" ry=".8" fill="#2b2430"/>'),
        man:         '<circle cx="12" cy="13" r="8" fill="#f6d2b0" ' + O + '/><path d="M4 12c0-6 4-8.5 8-8.5s8 2.5 8 8.5c-1-3-3-4-8-4s-7 1-8 4z" fill="#3a2a1a"/>' + EYES.replace(/12.3/g, '13') + SMILE.replace('15.6', '16.3'),
        woman:       '<path d="M3.5 14c0-7 3.5-11 8.5-11s8.5 4 8.5 11v7h-17z" fill="#8a4a1a"/><circle cx="12" cy="13" r="7" fill="#f6d2b0" ' + O + '/><path d="M5 11c1-4 4-6 7-6s6 2 7 6c-3-1-6-3-7-5-1 2-4 4-7 5z" fill="#8a4a1a"/>' + EYES.replace(/12.3/g, '13') + SMILE.replace('15.6', '16.3'),
        boy:         '<circle cx="12" cy="13" r="8" fill="#f6d2b0" ' + O + '/><path d="M4 12c0-5 3-8 8-8 2 0 4 1 5 2.5 1.5-.5 3 0 3 2-1 1-2 1-3 .5-3 0-8 0-13 3z" fill="#5a3a1a"/>' + EYES.replace(/12.3/g, '13') + SMILE.replace('15.6', '16.3'),
        grandma:     '<circle cx="12" cy="4.5" r="3" fill="#dfe2e8" ' + O + '/><circle cx="12" cy="13.5" r="7.8" fill="#f6d2b0" ' + O + '/><path d="M4.2 12.5c0-4 3.5-6.5 7.8-6.5s7.8 2.5 7.8 6.5c-2-2.5-5-3.5-7.8-3.5s-5.8 1-7.8 3.5z" fill="#dfe2e8"/><circle cx="9" cy="13.3" r="2" fill="none" stroke="#5a6475" stroke-width="1"/><circle cx="15" cy="13.3" r="2" fill="none" stroke="#5a6475" stroke-width="1"/>' + SMILE.replace('15.6', '17')    };

    // ---- 絵文字 → アイコン名 ----
    // キーは異体字セレクタ(U+FE0F)なしで書く(変換時に取りのぞいてから引く)
    var MAP = {
        '❤': 'heart', '💚': 'heart_green', '🛡': 'shield', '⚔': 'swords', '🗡': 'dagger',
        '✨': 'sparkles', '⭐': 'star', '🌟': 'star_glow', '💫': 'dizzy',
        '💀': 'skull', '☠': 'skull_bones', '🔮': 'crystal', '🪄': 'wand',
        '🃏': 'joker', '🎴': 'flowercard', '⚡': 'bolt', '💎': 'gem', '🔀': 'shuffle',
        '❓': 'question', '🎉': 'party', '⚙': 'gear', '👑': 'crown', '👤': 'person',
        '🏆': 'trophy', '📚': 'books', '🔰': 'beginner', '🏠': 'house', '🗑': 'trash',
        '💥': 'boom', '✅': 'check_box', '✔': 'check', '❌': 'cross', '👹': 'oni',
        '🎰': 'slot', '🟢': 'circle_green', '🔴': 'circle_red', '🔵': 'circle_blue', '🟡': 'circle_yellow',
        '🧙‍♂': 'wizard', '🧙': 'wizard', '🎵': 'note', '🎶': 'note',
        '🦇': 'bat', '🧟': 'zombie', '🏺': 'vase', '🗿': 'moai', '🐉': 'dragon', '👁': 'eye',
        '🎯': 'target', '🕊': 'dove', '🔒': 'lock', '🔓': 'unlock',
        '🥇': 'medal1', '🥈': 'medal2', '🥉': 'medal3',
        '🌐': 'globe', '🔊': 'speaker', '🔇': 'mute', '⏭': 'next', '⏸': 'pause',
        '💛': 'heart_yellow', '💗': 'heart_pink', '💖': 'heart_pink', '🟣': 'circle_purple',
        '👾': 'monster', '💊': 'pill', '🔄': 'reload', '🔁': 'repeat', '📊': 'chart', '🔥': 'fire',
        '💠': 'diamond_dot', '🔷': 'diamond_blue', '🎒': 'bag', '📖': 'book', '🗺': 'map', '📜': 'scroll',
        '🏹': 'bow', '🎁': 'gift', '❄': 'snow', '🧊': 'ice', '🔨': 'hammer', '🛠': 'tools', '🪤': 'trap',
        '🐲': 'dragon', '🏅': 'medal', '👺': 'tengu', '🧚': 'fairy', '🧝': 'elf', '💪': 'muscle',
        '📦': 'box', '📋': 'clipboard', '💾': 'save', '➡': 'arrow_right', '➹': 'arrow_shot',
        '🐂': 'ox', '🐺': 'wolf', '🦅': 'eagle', '👻': 'ghost', '🌑': 'moon_new', '🔍': 'search',
        '🧪': 'flask', '🥚': 'egg', '🥋': 'gi', '⛰': 'mountain', '🏔': 'mountain_snow', '🌲': 'tree',
        '💧': 'drop', '🏘': 'town', '🏰': 'castle', '🌱': 'sprout', '🥷': 'ninja', '🌎': 'earth', '🌍': 'earth', '🌏': 'earth',
        '🌌': 'galaxy', '😈': 'devil', '🌀': 'cyclone',
        '🪙': 'coin', '🛒': 'cart', '⛩': 'torii', '🎲': 'dice', '🧩': 'puzzle', '🏳': 'flag_white',
        '⛲': 'fountain', '🤔': 'thinking', '🕯': 'candle', '💡': 'bulb', '🚶': 'walk', '🧴': 'bottle',
        '🙏': 'pray', '⛈': 'storm', '😩': 'tired', '🫧': 'bubbles', '🍒': 'cherry', '🔔': 'bell',
        '🎊': 'confetti', '🏮': 'lantern', '💤': 'zzz',
        '⛏': 'pickaxe', '⚒': 'hammer_pick', '💰': 'moneybag', '💸': 'money_wings', '⏰': 'alarm', '⏱': 'stopwatch', '⏳': 'hourglass', '⌛': 'hourglass',
        '🗝': 'oldkey', '🔑': 'key', '🪨': 'rock', '💨': 'wind', '⬜': 'square_white', '⚠': 'warning', '🧭': 'compass',
        '🎆': 'fireworks', '🎇': 'fireworks', '🌠': 'shooting_star', '🚫': 'forbidden', '🏁': 'checkered', '🚩': 'flag_red', '🔧': 'wrench',
        '👀': 'eyes', '🎨': 'palette', '🖌': 'paintbrush', '💦': 'sweat', '🤖': 'robot', '🎮': 'gamepad', '📱': 'phone',
        '📅': 'calendar', '📆': 'calendar', '🔢': 'numbers', '🔟': 'ten', '💯': 'hundred', '➕': 'plus', '🔤': 'abc', '🅰': 'letter_a', '🆙': 'up_word',
        '♾': 'infinity', '♻': 'recycle', '🪞': 'mirror', '⏩': 'fast_forward', '⏮': 'prev', '💣': 'bomb', '💍': 'ring',
        '🧵': 'thread', '🪵': 'wood', '🔩': 'nut_bolt', '📥': 'inbox', '📤': 'outbox', '📂': 'folder', '📁': 'folder', '📧': 'email', '✉': 'email',
        '🏫': 'school', '🧹': 'broom', '🏥': 'hospital', '🏛': 'classical', '🏚': 'derelict', '🌋': 'volcano', '🛏': 'bed', '🖼': 'picture',
        '🎟': 'ticket', '🎫': 'ticket', '🎖': 'military', '🔗': 'link', '🩸': 'blood', '🩹': 'bandage', '💉': 'syringe', '🪜': 'ladder', '⚖': 'scales',
        '🧧': 'red_envelope', '🍖': 'meat', '🚪': 'door', '👆': 'point_up', '☝': 'point_up', '✋': 'hand', '🖐': 'hand', '👂': 'ear', '🦶': 'foot',
        '🧠': 'brain', '🗂': 'dividers', '📝': 'memo', '✏': 'pencil', '⌨': 'keyboard', '👓': 'glasses', '🎤': 'mic', '🎻': 'violin',
        '🟠': 'circle_orange', '🔹': 'diamond_sblue', '🔸': 'diamond_sorange', '🤍': 'heart_white', '🌙': 'moon', '🌛': 'moon', '🌞': 'sun_face', '🌅': 'sunrise',
        '🌈': 'rainbow', '🌸': 'cherry_blossom', '🍃': 'leaf', '🌿': 'herb', '🍀': 'clover', '🌵': 'cactus', '🥀': 'wilted', '🏕': 'camping',
        '⛄': 'snowman', '🎃': 'pumpkin', '🀄': 'mahjong',
        '🚀': 'rocket', '✈': 'airplane', '🚌': 'bus', '🚃': 'train', '🚒': 'firetruck', '🚲': 'bicycle', '🏍': 'motorcycle', '🚁': 'helicopter', '🛼': 'roller_skate', '🗼': 'tower',
        '🍎': 'apple', '🥕': 'carrot', '🍌': 'banana', '🍅': 'tomato', '🍕': 'pizza', '🍰': 'cake', '🎂': 'birthday_cake', '🍙': 'onigiri', '🥛': 'milk', '🍞': 'bread',
        '🍩': 'donut', '🍫': 'chocolate', '🍭': 'lollipop', '🍜': 'ramen', '🍹': 'tropical',
        '🐶': 'dog', '🐱': 'cat', '🐰': 'rabbit', '🐼': 'panda', '🐻‍❄': 'polar_bear', '🐯': 'tiger', '🦁': 'lion', '🐮': 'cow', '🐸': 'frog', '🐣': 'chick',
        '🐭': 'mouse', '🐘': 'elephant', '🐦‍🔥': 'phoenix', '🐦': 'bird', '🐜': 'ant', '🦖': 'trex', '😄': 'smile', '😊': 'smile', '😎': 'cool', '👿': 'imp', '🧸': 'teddy',
        '👨': 'man', '👩': 'woman', '👦': 'boy', '👵': 'grandma'
    };

    // 絵文字らしい文字(対応表にないものも拾って「未対応」として記録する)
    // ZWJ でつながった絵文字・肌色・異体字セレクタもひとかたまりで拾う
    var EMO = '(?:[\\u{1F000}-\\u{1FAFF}]|\\u2328|\\u231A|\\u231B|[\\u2600-\\u26FF]|[\\u2700-\\u27BF]|[\\u23E9-\\u23FA]|\\u2B50|\\u2B55|\\u2B1B|\\u2B1C)';
    var RE = new RegExp(EMO + '(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D' + EMO + '\\uFE0F?)*', 'gu');
    // 日本語フォントにある記号は変換しない
    var KEEP = /^[♠-♧★☆☐-☒←-⇿■-◿♪♫♬✓✕✖✦✧✂☀-☃♀♂←]$/u;

    var LEAD = new RegExp('^\\s*(' + EMO + '(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D' + EMO + '\\uFE0F?)*)', 'u');   // 文字の頭の絵文字
    var missing = {};

    function nameOf(emo) {
        var k = emo.replace(/️/g, '');
        if (MAP[k]) return MAP[k];
        // ZWJ つなぎで未登録なら先頭の絵文字で引く
        var head = k.split('‍')[0];
        if (MAP[head]) return MAP[head];
        return null;
    }

    function svg(name) {
        var body = ICONS[name];
        if (!body) return '';
        return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>';
    }
    function html(nameOrEmoji) {
        var n = ICONS[nameOrEmoji] ? nameOrEmoji : nameOf(nameOrEmoji);
        if (!n) return '';
        return '<span class="fgi fgi-' + n + '" data-fgi="' + n + '">' + svg(n) + '</span>';
    }

    // ---- 見た目 ----
    var css = '.fgi{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.2em;line-height:1;flex:none;}'
        + '.fgi>svg{display:block;width:100%;height:100%;overflow:visible;}';
    function injectCss() {
        if (document.getElementById('fgl-icons-css')) return;
        var st = document.createElement('style');
        st.id = 'fgl-icons-css';
        st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
    }

    // ---- テキストの絵文字を差し替える ----
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, CANVAS: 1, SVG: 1, svg: 1 };
    var STRIP = { OPTION: 1, TITLE: 1 };   // SVGを入れられない所は絵文字を取りのぞく

    function hasEmoji(s) { RE.lastIndex = 0; return RE.test(s); }

    // 変換で1つの文字から分かれた部品(文字・アイコン)の組。
    // 「先頭の文字ノードだけ書き換える」作りのゲーム(多言語切替など)で、
    // 古いアイコンが残って2重にならないように、書き直されたら同じ組の古い部品を片づける。
    var groupOf = typeof WeakMap === 'function' ? new WeakMap() : null;

    function convertText(tn) {
        var s = tn.nodeValue;
        if (!s || !hasEmoji(s)) return;
        var p = tn.parentNode;
        if (!p || SKIP[p.nodeName] || p.isContentEditable) return;
        if (p.closest && p.closest('svg,.fgi')) return;
        if (groupOf && groupOf.has(tn)) {
            var old = groupOf.get(tn);
            for (var gi = 0; gi < old.length; gi++) {
                if (old[gi] !== tn && old[gi].parentNode === p) p.removeChild(old[gi]);
            }
            groupOf.delete(tn);
        }
        // 複製された部品でも同じことが起きるので、文字の頭にある絵文字と同じアイコンが
        // すぐ前に並んでいたら(=前回の変換の残り)片づける
        var prev = tn.previousSibling;
        if (prev && prev.nodeType === 1 && prev.classList && prev.classList.contains('fgi')) {
            var lead = [], lm, rest = s;
            while ((lm = LEAD.exec(rest))) { lead.push(nameOf(lm[1])); rest = rest.slice(lm[0].length); }
            var li = lead.length - 1;
            while (prev && li >= 0 && prev.nodeType === 1 && prev.classList && prev.classList.contains('fgi') && prev.getAttribute('data-fgi') === lead[li]) {
                var pp = prev.previousSibling; p.removeChild(prev); prev = pp; li--;
            }
        }
        if (STRIP[p.nodeName]) {
            var t = s.replace(RE, function (m) { return KEEP.test(m) ? m : ''; }).replace(/^\s+/, '');
            if (t !== s) tn.nodeValue = t;
            return;
        }
        RE.lastIndex = 0;
        var frag = null, last = 0, m;
        while ((m = RE.exec(s))) {
            var e = m[0];
            if (KEEP.test(e.replace(/️/g, ''))) continue;
            var n = nameOf(e);
            if (!n) { missing[e] = (missing[e] || 0) + 1; continue; }
            if (!frag) frag = document.createDocumentFragment();
            if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
            var sp = document.createElement('span');
            sp.className = 'fgi fgi-' + n;
            sp.setAttribute('data-fgi', n);
            sp.setAttribute('role', 'img');
            sp.setAttribute('aria-label', e);
            sp.innerHTML = svg(n);
            frag.appendChild(sp);
            last = m.index + e.length;
        }
        if (!frag) return;
        if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
        if (groupOf) {
            var group = Array.prototype.slice.call(frag.childNodes);
            for (var k = 0; k < group.length; k++) if (group[k].nodeType === 3) groupOf.set(group[k], group);
        }
        p.replaceChild(frag, tn);
    }

    function convert(root) {
        if (!root) return;
        if (root.nodeType === 3) { convertText(root); return; }
        if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        if (root.nodeType === 1 && SKIP[root.nodeName]) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], tn;
        while ((tn = w.nextNode())) { if (hasEmoji(tn.nodeValue)) list.push(tn); }
        for (var i = 0; i < list.length; i++) convertText(list[i]);
    }

    // ---- 自動変換(後から入る文字も) ----
    var pending = [], scheduled = false;
    var stats = { flushes: 0, nodes: 0, ms: 0 };   // 重さの確認用(FGLIcons.stats)
    function flush() {
        scheduled = false;
        var q = pending; pending = [];
        var t0 = performance.now();
        for (var i = 0; i < q.length; i++) if (q[i].isConnected !== false) convert(q[i]);
        stats.flushes++; stats.nodes += q.length; stats.ms += performance.now() - t0;
    }
    function start() {
        injectCss();
        convert(document.body);
        if (document.title && hasEmoji(document.title)) document.title = document.title.replace(RE, '').trim();
        var mo = new MutationObserver(function (recs) {
            for (var i = 0; i < recs.length; i++) {
                var r = recs[i];
                if (r.type === 'characterData') { pending.push(r.target); }
                else for (var j = 0; j < r.addedNodes.length; j++) pending.push(r.addedNodes[j]);
            }
            // 同じタスク内で変換してちらつきを出さない(マイクロタスク)
            if (!scheduled && pending.length) { scheduled = true; Promise.resolve().then(flush); }
        });
        mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    // ---- canvas の fillText / strokeText / measureText ----
    // canvas に描く文字の絵文字も、自前アイコンの画像で描く(ゲーム側の変更は不要)。
    // 画像は最初に全部読みこんでおく。読みこみ前に描かれた分は、次の描き直しから絵になる。
    var imgCache = {};
    function iconImage(n) {
        var im = imgCache[n];
        if (!im) {
            im = new Image();
            im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="128" height="128">' + ICONS[n] + '</svg>');
            imgCache[n] = im;
        }
        return im;
    }
    function fontPx(ctx) {
        var m = /(\d+(?:\.\d+)?)px/.exec(ctx.font || '');
        return m ? parseFloat(m[1]) : 10;
    }
    // 文字列を「文字」と「アイコン」の並びに分ける(絵文字がなければ null)
    function splitIcons(text) {
        text = String(text);
        if (!hasEmoji(text)) return null;
        var parts = [], last = 0, m, found = false;
        RE.lastIndex = 0;
        while ((m = RE.exec(text))) {
            var e = m[0];
            if (KEEP.test(e.replace(/️/g, ''))) continue;
            var n = nameOf(e);
            if (!n) { missing[e] = (missing[e] || 0) + 1; continue; }
            if (m.index > last) parts.push({ t: text.slice(last, m.index) });
            parts.push({ icon: n, e: e });
            last = m.index + e.length; found = true;
        }
        if (!found) return null;
        if (last < text.length) parts.push({ t: text.slice(last) });
        return parts;
    }
    function patchCanvas() {
        var P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
        if (!P || P.__fgiPatched) return;
        P.__fgiPatched = true;
        var oFill = P.fillText, oStroke = P.strokeText, oMeasure = P.measureText;
        var ICON_W = 1.15;   // アイコンの幅(文字の大きさに対する倍率)
        function layout(ctx, parts) {
            var px = fontPx(ctx), w = 0;
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                p.w = p.icon ? px * ICON_W : oMeasure.call(ctx, p.t).width;
                w += p.w;
            }
            return { px: px, w: w };
        }
        function draw(ctx, parts, x, y, stroke, orig) {
            var L = layout(ctx, parts), px = L.px;
            var align = ctx.textAlign, base = ctx.textBaseline;
            var x0 = x;
            if (align === 'center') x0 = x - L.w / 2;
            else if (align === 'right' || (align === 'end' && ctx.direction !== 'rtl')) x0 = x - L.w;
            var s = px * ICON_W, top;
            if (base === 'middle') top = y - s / 2;
            else if (base === 'top' || base === 'hanging') top = y - (s - px) / 2;
            else if (base === 'bottom' || base === 'ideographic') top = y - s;
            else top = y - px * 0.88 - (s - px) / 2;   // alphabetic
            ctx.textAlign = 'left';
            try {
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i];
                    if (p.icon) {
                        if (!stroke) {
                            var im = iconImage(p.icon);
                            if (im.complete && im.naturalWidth) ctx.drawImage(im, x0, top, s, s);
                            else orig.call(ctx, p.e, x0, y);   // 読みこみ前はもとの絵文字で
                        }
                    } else if (p.t) {
                        orig.call(ctx, p.t, x0, y);
                    }
                    x0 += p.w;
                }
            } finally { ctx.textAlign = align; }
        }
        P.fillText = function (text, x, y, maxW) {
            var parts = splitIcons(text);
            if (!parts) return maxW === undefined ? oFill.call(this, text, x, y) : oFill.call(this, text, x, y, maxW);
            draw(this, parts, x, y, false, oFill);
        };
        P.strokeText = function (text, x, y, maxW) {
            var parts = splitIcons(text);
            if (!parts) return maxW === undefined ? oStroke.call(this, text, x, y) : oStroke.call(this, text, x, y, maxW);
            draw(this, parts, x, y, true, oStroke);
        };
        P.measureText = function (text) {
            var parts = splitIcons(text);
            var r = oMeasure.call(this, text);
            if (!parts) return r;
            var w = layout(this, parts).w, o = {};
            for (var k in r) o[k] = r[k];
            o.width = w;
            return o;
        };
        // 画像を先に読みこんでおく
        for (var n in ICONS) iconImage(n);
    }
    try { patchCanvas(); } catch (e) { /* canvas がない環境 */ }

    window.FGLIcons = {
        ICONS: ICONS, MAP: MAP,
        svg: svg, html: html, nameOf: nameOf, convert: convert,
        image: iconImage,
        missing: function () { return Object.assign({}, missing); },
        stats: stats
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
