/**
 * Emoji Picker Standalone Library - Telegram Style (Complete Set)
 * شامل تمام دسته‌بندی‌ها: صورتک‌ها، مردم، حیوانات، غذا، فعالیت، سفر، اشیاء، نمادها (قلب‌ها) و پرچم‌ها
 */

(function(global) {
    'use strict';

    // 1. دیتابیس جامع ایموجی‌ها
    const EMOJI_DATA = {
        smileys: {
            id: 'smileys',
            icon: '😀',
            name: 'صورتک‌ها و احساسات',
            items: [
                '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😙','😚','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊'
            ]
        },
        people: {
            id: 'people',
            icon: '👋',
            name: 'مردم و بدن',
            items: [
                '👋','🤚','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋','🩸','👶','🧒','👦','👧','🧑','👱','👨','🧔','👨‍🦰','👨‍🦱','👨‍🦳','👨‍🦲','👩','👩‍🦰','👩‍🦱','👩‍🦳','👩‍🦲','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🏃','💃','🕺','🕴️','👯','🧖','🧗','🤺','🏇','⛷️','🏂','🏌️','🏄','🚣','🏊','⛹️','🏋️','🚴','🚵','🤸','🤼','🤽','🤾','🤹','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪'
            ]
        },
        animals: {
            id: 'animals',
            icon: '🐶',
            name: 'حیوانات و طبیعت',
            items: [
                '🐶','🐕','🦮','🐕‍🦺','🐩','🐺','🦊','🦝','🐱','🐈','🐈‍⬛','🦁','🐯','🐅','🐆','🐴','🐎','🦄','🦓','🦌','🦬','🐮','🐂','🐃','🐄','🐷','🐖','🐗','🐽','🐏','🐑','🐐','🐪','🐫','🦙','🦒','🐘','🦣','🦏','🦛','🐭','🐁','🐀','🐹','🐰','🐇','🐿️','🦫','🦔','🦇','🐻','🐻‍❄️','🐨','🐼','🦥','🦦','🦨','🦘','🦡','🐾','🦃','🐔','🐓','🐣','🐤','🐥','🐦','🐧','🕊️','🦅','🦆','🦢','🦉','🦤','🪶','🦩','🦚','🦜','🐸','🐊','🐢','🦎','🐍','🐲','🐉','🦕','🦖','🐳','🐋','🐬','🦭','🐟','🐠','🐡','🦈','🐙','🐚','🐌','🦋','🐛','🐜','🐝','🪲','🐞','🦗','🕷️','🕸️','🦂','🦟','🪰','🪱','🦠','💐','🌸','💮','🏵️','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🪴','🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🍄'
            ]
        },
        food: {
            id: 'food',
            icon: '🍔',
            name: 'غذا و نوشیدنی',
            items: [
                '🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤','🧋','🧃','🧉','🧊','🥢','🍽️','🍴','🥄','🔪','🏺'
            ]
        },
        activity: {
            id: 'activity',
            icon: '⚽',
            name: 'فعالیت و ورزش',
            items: [
                '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'
            ]
        },
        travel: {
            id: 'travel',
            icon: '✈️',
            name: 'سفر و مکان‌ها',
            items: [
                '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🦼','🦽','🛴','🛹','🛼','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🛕','🕍','🕋','⛩️','🛤️','🛣️','🗾','🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁'
            ]
        },
        objects: {
            id: 'objects',
            icon: '💡',
            name: 'اشیاء',
            items: [
                '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','🪙','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪓','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'
            ]
        },
        symbols: {
            id: 'symbols',
            icon: '❤️',
            name: 'نمادها و قلب‌ها',
            items: [
                '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','🔀','🔁','🔂','◀️','🔼','🔽','⏫','⏬','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','🔄','↪️','↩️','🔃','⤴️','⤵️','#️⃣','*️⃣','ℹ️','🔤','🔡','🔠','🔣','🎵','🎶','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','🟫','⬛','⬜','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁️‍🗨️','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'
            ]
        },
        flags: {
            id: 'flags',
            icon: '🏁',
            name: 'پرچم‌ها',
            items: [
                '🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇫','🇦🇱','🇩🇿','🇦🇩','🇦🇴','🇦🇷','🇦🇲','🇦🇺','🇦🇹','🇦🇿','🇧🇭','🇧🇩','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇺','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇪🇺','🇫🇯','🇫🇮','🇫🇷','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇷','🇬🇩','🇬🇹','🇬🇳','🇬🇼','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🇯🇴','🇰🇿','🇰🇪','🇰🇮','🇰🇵','🇰🇷','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇮','🇱🇹','🇱🇺','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇭','🇲🇷','🇲🇺','🇲🇽','🇫🇲','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇷','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇲🇰','🇳🇴','🇴🇲','🇵🇰','🇵🇼','🇵🇦','🇵🇬','🇵🇾','🇵🇪','🇵🇭','🇵🇱','🇵🇹','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇰🇳','🇱🇨','🇻🇨','🇼🇸','🇸🇲','🇸🇹','🇸🇦','🇸🇳','🇷🇸','🇸🇨','🇸🇱','🇸🇬','🇸🇰','🇸🇮','🇸e','🇸🇴','🇿🇦','🇸🇸','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇯','🇹🇿','🇹🇭','🇹🇱','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇹🇻','🇺🇬','🇺🇦','🇦🇪','🇬🇧','🇺🇸','🇺🇾','🇺🇿','🇻🇺','🇻🇦','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼'
            ]
        }
    };

    // 2. استایل‌های اختصاصی
    const STYLES = `
        .ep-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--card-bg, #fff);
            border-radius: 12px;
            overflow: hidden;
            font-family: inherit;
            user-select: none;
        }
        .ep-search {
            padding: 8px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .dark-mode .ep-search {
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ep-search input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 20px;
            border: 1px solid transparent;
            background: rgba(127,127,127,0.1);
            color: var(--text-color, #000);
            font-size: 0.9rem;
            outline: none;
            text-align: right;
        }
        .dark-mode .ep-search input {
            color: #fff;
            background: rgba(255,255,255,0.1);
        }
        .ep-tabs {
            display: flex;
            overflow-x: auto;
            padding: 5px;
            background: rgba(127,127,127,0.03);
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .ep-tabs::-webkit-scrollbar { display: none; }
        .ep-tab {
            flex: 0 0 auto;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 1.2rem;
            opacity: 0.6;
            transition: 0.2s;
            background: transparent;
            border: none;
            border-radius: 8px;
        }
        .ep-tab:hover {
            background: rgba(127,127,127,0.05);
        }
        .ep-tab.active {
            opacity: 1;
            background: rgba(127,127,127,0.1);
            transform: scale(1.1);
        }
        .dark-mode .ep-tab.active {
            background: rgba(255,255,255,0.1);
        }
        .ep-body {
            flex: 1;
            overflow-y: auto;
            padding: 5px;
            scroll-behavior: smooth;
            position: relative;
        }
        .ep-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
            gap: 4px;
        }
        .ep-item {
            font-size: 1.6rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 8px;
            transition: transform 0.1s;
            user-select: none;
        }
        .ep-item:hover {
            background: rgba(127,127,127,0.1);
            transform: scale(1.2);
        }
        .ep-category-title {
            grid-column: 1 / -1;
            font-size: 0.85rem;
            font-weight: bold;
            color: var(--text-secondary, #777);
            margin: 15px 5px 5px;
            padding-bottom: 4px;
            border-bottom: 1px dashed rgba(127,127,127,0.2);
            position: sticky;
            top: 0;
            background: var(--card-bg, #fff);
            z-index: 10;
            opacity: 0.95;
        }
        .dark-mode .ep-category-title {
            background: var(--card-bg, #222);
            color: #aaa;
        }
    `;

    // 3. کلاس اصلی EmojiPicker
    class EmojiPicker {
        constructor(container, onSelect) {
            this.container = container;
            this.onSelect = onSelect;
            this.activeTab = 'smileys';
            this.init();
        }

        init() {
            this.injectStyles();
            this.render();
            this.bindEvents();
        }

        injectStyles() {
            if (!document.getElementById('ep-styles')) {
                const style = document.createElement('style');
                style.id = 'ep-styles';
                style.textContent = STYLES;
                document.head.appendChild(style);
            }
        }

        render() {
            this.container.innerHTML = `
                <div class="ep-container">
                    <div class="ep-search">
                        <input type="text" placeholder="جستجو..." id="ep-input">
                    </div>
                    <div class="ep-tabs" id="ep-tabs"></div>
                    <div class="ep-body" id="ep-body"></div>
                </div>
            `;
            this.renderTabs();
            this.renderAllEmojis();
        }

        renderTabs() {
            const tabsContainer = this.container.querySelector('#ep-tabs');
            let html = '';
            for (const [key, data] of Object.entries(EMOJI_DATA)) {
                html += `<button class="ep-tab ${key === this.activeTab ? 'active' : ''}" data-cat="${key}" title="${data.name}">${data.icon}</button>`;
            }
            tabsContainer.innerHTML = html;
        }

        renderAllEmojis() {
            const body = this.container.querySelector('#ep-body');
            // رندر کردن بهینه با استفاده از HTML String
            let html = '<div class="ep-grid">';
            
            for (const [key, data] of Object.entries(EMOJI_DATA)) {
                html += `<div class="ep-category-title" id="cat-${key}">${data.name}</div>`;
                data.items.forEach(emoji => {
                    html += `<div class="ep-item" data-e="${emoji}">${emoji}</div>`;
                });
            }
            
            html += '</div>';
            body.innerHTML = html;
        }

        bindEvents() {
            // 1. کلیک روی تب‌ها
            const tabs = this.container.querySelectorAll('.ep-tab');
            const body = this.container.querySelector('#ep-body');

            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const cat = e.currentTarget.dataset.cat;
                    const targetTitle = this.container.querySelector(`#cat-${cat}`);
                    
                    if (targetTitle) {
                        // اسکرول نرم به دسته‌بندی
                        targetTitle.scrollIntoView({ behavior: 'auto', block: 'start' }); 
                        // کمی فاصله از بالا برای دیده شدن هدر
                        body.scrollTop -= 5;
                    }
                    
                    // آپدیت تب فعال
                    tabs.forEach(t => t.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                });
            });

            // 2. انتخاب ایموجی (Event Delegation برای پرفورمنس)
            body.addEventListener('click', (e) => {
                const item = e.target.closest('.ep-item');
                if (item) {
                    this.onSelect(item.dataset.e);
                }
            });

            // 3. اسکرول اسپای (برای تغییر خودکار تب هنگام اسکرول) - تکمیل شده
            const categoryTitles = body.querySelectorAll('.ep-category-title');
            
            body.addEventListener('scroll', () => {
                let currentActiveCat = this.activeTab;

                // پیدا کردن دسته‌بندی فعلی در محدوده دید (ViewPort)
                categoryTitles.forEach(title => {
                    // محاسبه فاصله با در نظر گرفتن بافر ۳۰ پیکسلی برای هدر چسبان
                    if (title.offsetTop - 30 <= body.scrollTop) {
                        currentActiveCat = title.id.replace('cat-', '');
                    }
                });

                // اگر دسته‌بندی در حین اسکرول تغییر کرد، تب‌ها را آپدیت کن
                if (currentActiveCat !== this.activeTab) {
                    this.activeTab = currentActiveCat;
                    
                    // حذف کلاس active از همه تب‌ها
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // اضافه کردن کلاس active به تب فعلی
                    const activeTabEl = this.container.querySelector(`.ep-tab[data-cat="${currentActiveCat}"]`);
                    if (activeTabEl) {
                        activeTabEl.classList.add('active');
                        
                        // اسکرول خودکار نوار افقی تب‌ها تا تب فعال همیشه دیده شود
                        activeTabEl.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                            inline: 'center'
                        });
                    }
                }
            });
        }
    }

    // اتصال کلاس به محیط Global (Window)
    global.EmojiPicker = EmojiPicker;

})(window);
