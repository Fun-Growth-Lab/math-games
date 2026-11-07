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
        pause:       '<rect x="5.5" y="4.5" width="4.5" height="15" rx="1" fill="#5a6a85"/><rect x="14" y="4.5" width="4.5" height="15" rx="1" fill="#5a6a85"/>'
    };

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
        '🌐': 'globe', '🔊': 'speaker', '🔇': 'mute', '⏭': 'next', '⏸': 'pause'
    };

    // 絵文字らしい文字(対応表にないものも拾って「未対応」として記録する)
    // ZWJ でつながった絵文字・肌色・異体字セレクタもひとかたまりで拾う
    var EMO = '(?:[\\u{1F000}-\\u{1FAFF}]|[\\u2600-\\u26FF]|[\\u2700-\\u27BF]|[\\u23E9-\\u23FA]|\\u2B50|\\u2B55|\\u2B1B|\\u2B1C)';
    var RE = new RegExp(EMO + '(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D' + EMO + '\\uFE0F?)*', 'gu');
    // 日本語フォントにある記号は変換しない
    var KEEP = /^[♠-♧★☆☐-☒←-⇿■-◿♪♫✓✕✖✦✧✂☀-☃♀♂←]$/u;

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

    function convertText(tn) {
        var s = tn.nodeValue;
        if (!s || !hasEmoji(s)) return;
        var p = tn.parentNode;
        if (!p || SKIP[p.nodeName] || p.isContentEditable) return;
        if (p.closest && p.closest('svg,.fgi')) return;
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
    function flush() {
        scheduled = false;
        var q = pending; pending = [];
        for (var i = 0; i < q.length; i++) if (q[i].isConnected !== false) convert(q[i]);
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

    window.FGLIcons = {
        ICONS: ICONS, MAP: MAP,
        svg: svg, html: html, nameOf: nameOf, convert: convert,
        missing: function () { return Object.assign({}, missing); }
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
