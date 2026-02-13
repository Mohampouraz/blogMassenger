/**
 * emoji-picker.js - کامپوننت انتخاب ایموجی به سبک تلگرام
 * این فایل تمام ایموجی‌ها را به صورت دسته‌بندی شده و بدون پرچم‌ها فراهم می‌کند
 * 
 * نحوه استفاده:
 * 1. اضافه کردن فایل به HTML: <script src="/path/to/emoji-picker.js"></script>
 * 2. فراخوانی: const picker = new EmojiPicker(containerElement, callbackFunction);
 */

(function(global) {
    'use strict';

    // ================ دیتابیس کامل ایموجی‌ها (بدون پرچم) ================
    const EMOJI_DATABASE = {
        // ===== 1. صورتک‌ها و احساسات (Smileys & Emotion) =====
        smileys: [
            { emoji: '😀', name: 'خندان', keywords: ['خنده', 'شاد', 'خوشحال'] },
            { emoji: '😃', name: 'خندان با چشم‌های گرد', keywords: ['خنده', 'شاد'] },
            { emoji: '😄', name: 'خندان با چشم‌های خندان', keywords: ['خنده', 'شاد'] },
            { emoji: '😁', name: 'درخشان با چشم‌های خندان', keywords: ['خنده', 'دندان'] },
            { emoji: '😆', name: 'خنده رو به رو', keywords: ['خنده', 'باز'] },
            { emoji: '😅', name: 'خنده با عرق سرد', keywords: ['خنده', 'عرق'] },
            { emoji: '🤣', name: 'غلطیدن از خنده', keywords: ['خنده', 'غلطیدن'] },
            { emoji: '😂', name: 'اشک شوق', keywords: ['خنده', 'اشک', 'گریه'] },
            { emoji: '🙂', name: 'کمی خندان', keywords: ['لبخند', 'ملایم'] },
            { emoji: '🙃', name: 'صورت وارونه', keywords: ['وارونه', 'شوخی'] },
            { emoji: '🫠', name: 'صورت در حال ذوب', keywords: ['ذوب', 'گرم'] },
            { emoji: '😉', name: 'چشمک', keywords: ['چشمک', 'شوخی'] },
            { emoji: '😊', name: 'خندان با چشم‌های خندان', keywords: ['خنده', 'گونه'] },
            { emoji: '😇', name: 'خندان با هاله', keywords: ['فرشته', 'قدیس'] },
            { emoji: '🥰', name: 'صورت با قلب', keywords: ['عشق', 'قلب'] },
            { emoji: '😍', name: 'چشم‌های قلبی', keywords: ['عشق', 'قلب'] },
            { emoji: '🤩', name: 'ستاره در چشم', keywords: ['هیجان', 'ستاره'] },
            { emoji: '😘', name: 'بوسه', keywords: ['بوسه', 'عشق'] },
            { emoji: '😗', name: 'صورت در حال بوسه', keywords: ['بوسه'] },
            { emoji: '☺️', name: 'خندان', keywords: ['لبخند'] },
            { emoji: '😚', name: 'بوسه با چشم بسته', keywords: ['بوسه'] },
            { emoji: '😙', name: 'بوسه با چشم خندان', keywords: ['بوسه'] },
            { emoji: '🥲', name: 'صورت خندان با اشک', keywords: ['اشک', 'شادی'] },
            { emoji: '😋', name: 'مزه مزه کردن', keywords: ['غذا', 'خوشمزه'] },
            { emoji: '😛', name: 'زبان بیرون', keywords: ['زبان', 'شوخی'] },
            { emoji: '😜', name: 'زبان و چشمک', keywords: ['شوخی', 'چشمک'] },
            { emoji: '🤪', name: 'صورت دیوانه', keywords: ['دیوانه', 'شوخی'] },
            { emoji: '😝', name: 'زبان و چشم بسته', keywords: ['شوخی'] },
            { emoji: '🤑', name: 'صورت پول', keywords: ['پول', 'دلار'] },
            { emoji: '🤗', name: 'صورت در آغوش', keywords: ['آغوش', 'بغل'] },
            { emoji: '🤭', name: 'صورت با دست روی دهان', keywords: ['سکوت', 'خفگی'] },
            { emoji: '🫢', name: 'چشم باز و دست روی دهان', keywords: ['تعجب', 'سکوت'] },
            { emoji: '🫣', name: 'چشم نگاه از لای انگشت', keywords: ['مخفی', 'نگاه'] },
            { emoji: '🤫', name: 'صورت سکوت', keywords: ['سکوت', 'آرام'] },
            { emoji: '🤔', name: 'صورت متفکر', keywords: ['فکر', 'چانه'] },
            { emoji: '🫡', name: 'صورت ادای احترام', keywords: ['سلام', 'نظامی'] },
            { emoji: '🤐', name: 'صورت زیپ دهان', keywords: ['سکوت', 'زیپ'] },
            { emoji: '🤨', name: 'صورت با ابرو بالا', keywords: ['شک', 'ابرو'] },
            { emoji: '😐', name: 'صورت خنثی', keywords: ['عادی', 'بی‌تفاوت'] },
            { emoji: '😑', name: 'صورت بی‌حالت', keywords: ['بی‌حالت'] },
            { emoji: '😶', name: 'صورت بی‌دهان', keywords: ['سکوت'] },
            { emoji: '🫥', name: 'صورت با خط چین', keywords: ['مخفی', 'نامرئی'] },
            { emoji: '😏', name: 'صورت نیم‌لبخند', keywords: ['مکار', 'حیله'] },
            { emoji: '😒', name: 'صورت بی‌حوصله', keywords: ['بی‌حوصله'] },
            { emoji: '🙄', name: 'چرخش چشم', keywords: ['بی‌تفاوت'] },
            { emoji: '😬', name: 'صورت دندان‌ها', keywords: ['دندان', 'عصبی'] },
            { emoji: '😮‍💨', name: 'بازدم', keywords: ['آه', 'نفس'] },
            { emoji: '🤥', name: 'صورت دروغگو', keywords: ['دروغ', 'پینوکیو'] },
            { emoji: '🫨', name: 'صورت لرزان', keywords: ['لرزش', 'ترس'] },
            { emoji: '😌', name: 'صورت آرام', keywords: ['آرام', 'راحت'] },
            { emoji: '😔', name: 'صورت متفکر', keywords: ['افسرده', 'غمگین'] },
            { emoji: '😪', name: 'صورت خواب‌آلوده', keywords: ['خواب'] },
            { emoji: '🤤', name: 'آب دهان', keywords: ['آب دهان', 'غذا'] },
            { emoji: '😴', name: 'صورت خواب', keywords: ['خواب'] },
            { emoji: '😷', name: 'صورت با ماسک', keywords: ['ماسک', 'بیمار'] },
            { emoji: '🤒', name: 'صورت با دماسنج', keywords: ['بیمار', 'تب'] },
            { emoji: '🤕', name: 'صورت با باند', keywords: ['زخمی'] },
            { emoji: '🤢', name: 'صورت بیمار', keywords: ['حالت تهوع'] },
            { emoji: '🤮', name: 'صورت استفراغ', keywords: ['استفراغ'] },
            { emoji: '🤧', name: 'صورت عطسه', keywords: ['عطسه'] },
            { emoji: '🥵', name: 'صورت داغ', keywords: ['گرم', 'داغ'] },
            { emoji: '🥶', name: 'صورت سرد', keywords: ['سرد', 'یخ'] },
            { emoji: '🥴', name: 'صورت سرگیجه', keywords: ['سرگیجه'] },
            { emoji: '😵', name: 'صورت چشم ضربدری', keywords: ['سرگیجه'] },
            { emoji: '😵‍💫', name: 'صورت چشمان مارپیچ', keywords: ['سرگیجه'] },
            { emoji: '🤯', name: 'صورت انفجار', keywords: ['انفجار', 'شوک'] },
            { emoji: '🤠', name: 'صورت کابوی', keywords: ['کابوی'] },
            { emoji: '🥳', name: 'صورت جشن', keywords: ['جشن'] },
            { emoji: '🥸', name: 'صورت مبدل', keywords: ['مبدل'] },
            { emoji: '😎', name: 'صورت با عینک', keywords: ['عینک', 'باحال'] },
            { emoji: '🤓', name: 'صورت نرد', keywords: ['عینک', 'نرد'] },
            { emoji: '🧐', name: 'صورت با مونوکل', keywords: ['مونوکل'] },
            { emoji: '😕', name: 'صورت سردرگم', keywords: ['سردرگم'] },
            { emoji: '🫤', name: 'صورت دهان مورب', keywords: ['شک'] },
            { emoji: '😟', name: 'صورت نگران', keywords: ['نگران'] },
            { emoji: '🙁', name: 'صورت کمی ناراحت', keywords: ['ناراحت'] },
            { emoji: '☹️', name: 'صورت ناراحت', keywords: ['ناراحت'] },
            { emoji: '😮', name: 'صورت دهان باز', keywords: ['تعجب'] },
            { emoji: '😯', name: 'صورت حیرت‌زده', keywords: ['حیرت'] },
            { emoji: '😲', name: 'صورت شگفت‌زده', keywords: ['شگفت'] },
            { emoji: '😳', name: 'صورت سرخ شده', keywords: ['خجالت'] },
            { emoji: '🥺', name: 'صورت التماس', keywords: ['التماس'] },
            { emoji: '🥹', name: 'صورت اشک شوق', keywords: ['اشک'] },
            { emoji: '😦', name: 'صورت اخم با دهان باز', keywords: ['اخم'] },
            { emoji: '😧', name: 'صورت عذاب', keywords: ['عذاب'] },
            { emoji: '😨', name: 'صورت ترسیده', keywords: ['ترس'] },
            { emoji: '😰', name: 'صورت عرق سرد', keywords: ['عرق', 'استرس'] },
            { emoji: '😥', name: 'صورت ناامید', keywords: ['ناامید'] },
            { emoji: '😢', name: 'صورت گریان', keywords: ['گریه'] },
            { emoji: '😭', name: 'صورت گریه بلند', keywords: ['گریه'] },
            { emoji: '😱', name: 'صورت جیغ', keywords: ['جیغ', 'ترس'] },
            { emoji: '😖', name: 'صورت گیج', keywords: ['گیج'] },
            { emoji: '😣', name: 'صورت ناامید', keywords: ['ناامید'] },
            { emoji: '😞', name: 'صورت ناامید', keywords: ['ناامید'] },
            { emoji: '😓', name: 'صورت عرق سرد', keywords: ['عرق'] },
            { emoji: '😩', name: 'صورت خسته', keywords: ['خسته'] },
            { emoji: '😫', name: 'صورت خسته', keywords: ['خسته'] },
            { emoji: '🥱', name: 'صورت خمیازه', keywords: ['خمیازه'] },
            { emoji: '😤', name: 'صورت بخار از بینی', keywords: ['عصبانی'] },
            { emoji: '😡', name: 'صورت عصبانی', keywords: ['عصبانی'] },
            { emoji: '😠', name: 'صورت عصبانی', keywords: ['عصبانی'] },
            { emoji: '🤬', name: 'صورت فحش', keywords: ['فحش'] },
            { emoji: '😈', name: 'صورت شیطان خندان', keywords: ['شیطان'] },
            { emoji: '👿', name: 'صورت شیطان عصبانی', keywords: ['شیطان'] },
            { emoji: '💀', name: 'جمجمه', keywords: ['مرگ'] },
            { emoji: '☠️', name: 'جمجمه با استخوان', keywords: ['مرگ'] },
            { emoji: '💩', name: 'مدفوع', keywords: ['مدفوع'] },
            { emoji: '🤡', name: 'صورت دلقک', keywords: ['دلقک'] },
            { emoji: '👹', name: 'اونی', keywords: ['هیولا'] },
            { emoji: '👺', name: 'تنگو', keywords: ['هیولا'] },
            { emoji: '👻', name: 'روح', keywords: ['روح'] },
            { emoji: '👽', name: 'بیگانه', keywords: ['فضایی'] },
            { emoji: '👾', name: 'هیولای فضایی', keywords: ['بازی'] },
            { emoji: '🤖', name: 'ربات', keywords: ['ربات'] },
            { emoji: '😺', name: 'گربه خندان', keywords: ['گربه'] },
            { emoji: '😸', name: 'گربه خندان با چشم‌های خندان', keywords: ['گربه'] },
            { emoji: '😹', name: 'گربه با اشک شوق', keywords: ['گربه'] },
            { emoji: '😻', name: 'گربه با چشم‌های قلبی', keywords: ['گربه'] },
            { emoji: '😼', name: 'گربه با لبخند تلخ', keywords: ['گربه'] },
            { emoji: '😽', name: 'گربه بوسنده', keywords: ['گربه'] },
            { emoji: '🙀', name: 'گربه خسته', keywords: ['گربه'] },
            { emoji: '😿', name: 'گربه گریان', keywords: ['گربه'] },
            { emoji: '😾', name: 'گربه عصبانی', keywords: ['گربه'] },
            { emoji: '💋', name: 'جای بوسه', keywords: ['بوسه'] },
            { emoji: '💌', name: 'نامه عاشقانه', keywords: ['عشق'] },
            { emoji: '💘', name: 'قلب با تیر', keywords: ['عشق'] },
            { emoji: '💝', name: 'قلب با روبان', keywords: ['عشق'] },
            { emoji: '💖', name: 'قلب درخشان', keywords: ['قلب'] },
            { emoji: '💗', name: 'قلب در حال رشد', keywords: ['قلب'] },
            { emoji: '💓', name: 'قلب تپنده', keywords: ['قلب'] },
            { emoji: '💞', name: 'قلب‌های چرخان', keywords: ['قلب'] },
            { emoji: '💕', name: 'دو قلب', keywords: ['قلب'] },
            { emoji: '💟', name: 'قلب تزئینی', keywords: ['قلب'] },
            { emoji: '❣️', name: 'قلب تعجب', keywords: ['قلب'] },
            { emoji: '💔', name: 'قلب شکسته', keywords: ['شکسته'] },
            { emoji: '❤️‍🔥', name: 'قلب آتشین', keywords: ['آتش'] },
            { emoji: '❤️‍🩹', name: 'قلب در حال بهبود', keywords: ['بهبود'] },
            { emoji: '❤️', name: 'قلب قرمز', keywords: ['قلب'] },
            { emoji: '🩷', name: 'قلب صورتی', keywords: ['قلب'] },
            { emoji: '🧡', name: 'قلب نارنجی', keywords: ['قلب'] },
            { emoji: '💛', name: 'قلب زرد', keywords: ['قلب'] },
            { emoji: '💚', name: 'قلب سبز', keywords: ['قلب'] },
            { emoji: '💙', name: 'قلب آبی', keywords: ['قلب'] },
            { emoji: '🩵', name: 'قلب آبی روشن', keywords: ['قلب'] },
            { emoji: '💜', name: 'قلب بنفش', keywords: ['قلب'] },
            { emoji: '🤎', name: 'قلب قهوه‌ای', keywords: ['قلب'] },
            { emoji: '🖤', name: 'قلب سیاه', keywords: ['قلب'] },
            { emoji: '🩶', name: 'قلب خاکستری', keywords: ['قلب'] },
            { emoji: '🤍', name: 'قلب سفید', keywords: ['قلب'] },
            { emoji: '💯', name: 'صد', keywords: ['کامل'] },
            { emoji: '💢', name: 'علامت عصبانیت', keywords: ['عصبانی'] },
            { emoji: '💬', name: 'حباب گفتگو', keywords: ['پیام'] },
            { emoji: '👁️‍🗨️', name: 'چشم در حباب', keywords: ['گواهی'] },
            { emoji: '🗨️', name: 'حباب گفتگوی چپ', keywords: ['پیام'] },
            { emoji: '🗯️', name: 'حباب عصبانیت', keywords: ['عصبانی'] },
            { emoji: '💭', name: 'حباب فکر', keywords: ['فکر'] },
            { emoji: '💤', name: 'خواب', keywords: ['خواب'] }
        ],

        // ===== 2. مردم و بدن (People & Body) =====
        people: [
            { emoji: '👋', name: 'دست تکان دادن', keywords: ['خداحافظ'] },
            { emoji: '🤚', name: 'پشت دست', keywords: ['دست'] },
            { emoji: '🖐️', name: 'دست با انگشتان باز', keywords: ['دست'] },
            { emoji: '✋', name: 'دست بالا', keywords: ['دست'] },
            { emoji: '🖖', name: 'سلام ولکانی', keywords: ['پیشتازان'] },
            { emoji: '🫱', name: 'دست به راست', keywords: ['دست'] },
            { emoji: '🫲', name: 'دست به چپ', keywords: ['دست'] },
            { emoji: '🫳', name: 'کف دست رو به پایین', keywords: ['دست'] },
            { emoji: '🫴', name: 'کف دست رو به بالا', keywords: ['دست'] },
            { emoji: '👌', name: 'علامت اوکی', keywords: ['اوکی'] },
            { emoji: '🤌', name: 'انگشتان جمع شده', keywords: ['ایتالیایی'] },
            { emoji: '🤏', name: 'انگشتان اندازه‌گیری', keywords: ['کم'] },
            { emoji: '✌️', name: 'علامت پیروزی', keywords: ['پیروزی'] },
            { emoji: '🤞', name: 'انگشتان ضربدری', keywords: ['شانس'] },
            { emoji: '🫰', name: 'دست با انگشت اشاره و شست', keywords: ['قلب'] },
            { emoji: '🤟', name: 'علامت دوستت دارم', keywords: ['عشق'] },
            { emoji: '🤘', name: 'علامت شاخ', keywords: ['راک'] },
            { emoji: '🤙', name: 'علامت تماس', keywords: ['تماس'] },
            { emoji: '👈', name: 'انگشت اشاره چپ', keywords: ['اشاره'] },
            { emoji: '👉', name: 'انگشت اشاره راست', keywords: ['اشاره'] },
            { emoji: '👆', name: 'انگشت اشاره بالا', keywords: ['اشاره'] },
            { emoji: '🖕', name: 'انگشت وسط', keywords: ['فحش'] },
            { emoji: '👇', name: 'انگشت اشاره پایین', keywords: ['اشاره'] },
            { emoji: '☝️', name: 'انگشت اشاره به بالا', keywords: ['اشاره'] },
            { emoji: '🫵', name: 'انگشت اشاره به بیننده', keywords: ['اشاره'] },
            { emoji: '👍', name: 'انگشت شست بالا', keywords: ['لایک'] },
            { emoji: '👎', name: 'انگشت شست پایین', keywords: ['دیسلایک'] },
            { emoji: '✊', name: 'مشت', keywords: ['مشت'] },
            { emoji: '👊', name: 'مشت روبرو', keywords: ['مشت'] },
            { emoji: '🤛', name: 'مشت چپ', keywords: ['مشت'] },
            { emoji: '🤜', name: 'مشت راست', keywords: ['مشت'] },
            { emoji: '👏', name: 'دست زدن', keywords: ['تشویق'] },
            { emoji: '🙌', name: 'دست‌های بالا', keywords: ['شادی'] },
            { emoji: '🫶', name: 'دست‌های قلبی', keywords: ['عشق'] },
            { emoji: '👐', name: 'دست‌های باز', keywords: ['باز'] },
            { emoji: '🤲', name: 'کف دست‌های رو به بالا', keywords: ['دعا'] },
            { emoji: '🤝', name: 'دست دادن', keywords: ['توافق'] },
            { emoji: '🙏', name: 'دست‌های به هم', keywords: ['درخواست'] },
            { emoji: '✍️', name: 'دست در حال نوشتن', keywords: ['نوشتن'] },
            { emoji: '💅', name: 'لاک ناخن', keywords: ['ناخن'] },
            { emoji: '🤳', name: 'سلفی', keywords: ['سلفی'] },
            { emoji: '💪', name: 'عضله', keywords: ['قدرت'] },
            { emoji: '🦾', name: 'بازوی مکانیکی', keywords: ['ربات'] },
            { emoji: '🦵', name: 'پا', keywords: ['پا'] },
            { emoji: '🦿', name: 'پای مکانیکی', keywords: ['ربات'] },
            { emoji: '🦶', name: 'پای انسان', keywords: ['پا'] },
            { emoji: '👂', name: 'گوش', keywords: ['گوش'] },
            { emoji: '🦻', name: 'گوش با سمعک', keywords: ['سمعک'] },
            { emoji: '👃', name: 'بینی', keywords: ['بینی'] },
            { emoji: '🧠', name: 'مغز', keywords: ['مغز'] },
            { emoji: '🫀', name: 'قلب', keywords: ['قلب'] },
            { emoji: '🫁', name: 'ریه', keywords: ['ریه'] },
            { emoji: '🦷', name: 'دندان', keywords: ['دندان'] },
            { emoji: '🦴', name: 'استخوان', keywords: ['استخوان'] },
            { emoji: '👀', name: 'چشم‌ها', keywords: ['چشم'] },
            { emoji: '👁️', name: 'چشم', keywords: ['چشم'] },
            { emoji: '👅', name: 'زبان', keywords: ['زبان'] },
            { emoji: '👄', name: 'دهان', keywords: ['دهان'] },
            { emoji: '🫦', name: 'لب', keywords: ['لب'] },
            { emoji: '🧑', name: 'شخص', keywords: ['انسان'] },
            { emoji: '👶', name: 'نوزاد', keywords: ['بچه'] },
            { emoji: '🧒', name: 'کودک', keywords: ['بچه'] },
            { emoji: '👦', name: 'پسر', keywords: ['پسر'] },
            { emoji: '👧', name: 'دختر', keywords: ['دختر'] },
            { emoji: '🧑', name: 'شخص', keywords: ['انسان'] },
            { emoji: '👨', name: 'مرد', keywords: ['مرد'] },
            { emoji: '👩', name: 'زن', keywords: ['زن'] },
            { emoji: '🧔', name: 'شخص با ریش', keywords: ['ریش'] },
            { emoji: '🧔‍♂️', name: 'مرد با ریش', keywords: ['ریش'] },
            { emoji: '🧔‍♀️', name: 'زن با ریش', keywords: ['ریش'] },
            { emoji: '👨‍🦰', name: 'مرد با موی قرمز', keywords: ['مو'] },
            { emoji: '👨‍🦱', name: 'مرد با موی فرفری', keywords: ['مو'] },
            { emoji: '👨‍🦳', name: 'مرد با موی سفید', keywords: ['مو'] },
            { emoji: '👨‍🦲', name: 'مرد طاس', keywords: ['طاس'] },
            { emoji: '👩‍🦰', name: 'زن با موی قرمز', keywords: ['مو'] },
            { emoji: '👩‍🦱', name: 'زن با موی فرفری', keywords: ['مو'] },
            { emoji: '👩‍🦳', name: 'زن با موی سفید', keywords: ['مو'] },
            { emoji: '👩‍🦲', name: 'زن طاس', keywords: ['طاس'] },
            { emoji: '🧓', name: 'سالمند', keywords: ['پیر'] },
            { emoji: '👴', name: 'پیرمرد', keywords: ['پیر'] },
            { emoji: '👵', name: 'پیرزن', keywords: ['پیر'] },
            { emoji: '🙍', name: 'شخص اخمو', keywords: ['اخم'] },
            { emoji: '🙍‍♂️', name: 'مرد اخمو', keywords: ['اخم'] },
            { emoji: '🙍‍♀️', name: 'زن اخمو', keywords: ['اخم'] },
            { emoji: '🙎', name: 'شخص پکر', keywords: ['پکر'] },
            { emoji: '🙎‍♂️', name: 'مرد پکر', keywords: ['پکر'] },
            { emoji: '🙎‍♀️', name: 'زن پکر', keywords: ['پکر'] },
            { emoji: '🙅', name: 'شخص نه', keywords: ['نه'] },
            { emoji: '🙅‍♂️', name: 'مرد نه', keywords: ['نه'] },
            { emoji: '🙅‍♀️', name: 'زن نه', keywords: ['نه'] },
            { emoji: '🙆', name: 'شخص اوکی', keywords: ['اوکی'] },
            { emoji: '🙆‍♂️', name: 'مرد اوکی', keywords: ['اوکی'] },
            { emoji: '🙆‍♀️', name: 'زن اوکی', keywords: ['اوکی'] },
            { emoji: '💁', name: 'شخص پیشنهاد', keywords: ['پیشنهاد'] },
            { emoji: '💁‍♂️', name: 'مرد پیشنهاد', keywords: ['پیشنهاد'] },
            { emoji: '💁‍♀️', name: 'زن پیشنهاد', keywords: ['پیشنهاد'] },
            { emoji: '🙋', name: 'شخص دست بالا', keywords: ['سوال'] },
            { emoji: '🙋‍♂️', name: 'مرد دست بالا', keywords: ['سوال'] },
            { emoji: '🙋‍♀️', name: 'زن دست بالا', keywords: ['سوال'] },
            { emoji: '🧏', name: 'شخص ناشنوا', keywords: ['ناشنوا'] },
            { emoji: '🧏‍♂️', name: 'مرد ناشنوا', keywords: ['ناشنوا'] },
            { emoji: '🧏‍♀️', name: 'زن ناشنوا', keywords: ['ناشنوا'] },
            { emoji: '🙇', name: 'شخص تعظیم', keywords: ['عذرخواهی'] },
            { emoji: '🙇‍♂️', name: 'مرد تعظیم', keywords: ['عذرخواهی'] },
            { emoji: '🙇‍♀️', name: 'زن تعظیم', keywords: ['عذرخواهی'] },
            { emoji: '🤦', name: 'شخص دست به پیشانی', keywords: ['ناراحتی'] },
            { emoji: '🤦‍♂️', name: 'مرد دست به پیشانی', keywords: ['ناراحتی'] },
            { emoji: '🤦‍♀️', name: 'زن دست به پیشانی', keywords: ['ناراحتی'] },
            { emoji: '🤷', name: 'شخص شانه بالا', keywords: ['نمی‌دانم'] },
            { emoji: '🤷‍♂️', name: 'مرد شانه بالا', keywords: ['نمی‌دانم'] },
            { emoji: '🤷‍♀️', name: 'زن شانه بالا', keywords: ['نمی‌دانم'] },
            { emoji: '🧑‍⚕️', name: 'کارمند بهداشت', keywords: ['دکتر'] },
            { emoji: '👨‍⚕️', name: 'مرد پزشک', keywords: ['دکتر'] },
            { emoji: '👩‍⚕️', name: 'زن پزشک', keywords: ['دکتر'] },
            { emoji: '🧑‍🎓', name: 'دانشجو', keywords: ['دانشجو'] },
            { emoji: '👨‍🎓', name: 'مرد دانشجو', keywords: ['دانشجو'] },
            { emoji: '👩‍🎓', name: 'زن دانشجو', keywords: ['دانشجو'] },
            { emoji: '🧑‍🏫', name: 'معلم', keywords: ['معلم'] },
            { emoji: '👨‍🏫', name: 'مرد معلم', keywords: ['معلم'] },
            { emoji: '👩‍🏫', name: 'زن معلم', keywords: ['معلم'] },
            { emoji: '🧑‍⚖️', name: 'قاضی', keywords: ['قاضی'] },
            { emoji: '👨‍⚖️', name: 'مرد قاضی', keywords: ['قاضی'] },
            { emoji: '👩‍⚖️', name: 'زن قاضی', keywords: ['قاضی'] },
            { emoji: '🧑‍🌾', name: 'کشاورز', keywords: ['کشاورز'] },
            { emoji: '👨‍🌾', name: 'مرد کشاورز', keywords: ['کشاورز'] },
            { emoji: '👩‍🌾', name: 'زن کشاورز', keywords: ['کشاورز'] },
            { emoji: '🧑‍🍳', name: 'آشپز', keywords: ['آشپز'] },
            { emoji: '👨‍🍳', name: 'مرد آشپز', keywords: ['آشپز'] },
            { emoji: '👩‍🍳', name: 'زن آشپز', keywords: ['آشپز'] },
            { emoji: '🧑‍🔧', name: 'مکانیک', keywords: ['مکانیک'] },
            { emoji: '👨‍🔧', name: 'مرد مکانیک', keywords: ['مکانیک'] },
            { emoji: '👩‍🔧', name: 'زن مکانیک', keywords: ['مکانیک'] },
            { emoji: '🧑‍🏭', name: 'کارگر', keywords: ['کارگر'] },
            { emoji: '👨‍🏭', name: 'مرد کارگر', keywords: ['کارگر'] },
            { emoji: '👩‍🏭', name: 'زن کارگر', keywords: ['کارگر'] },
            { emoji: '🧑‍💼', name: 'کارمند', keywords: ['اداری'] },
            { emoji: '👨‍💼', name: 'مرد کارمند', keywords: ['اداری'] },
            { emoji: '👩‍💼', name: 'زن کارمند', keywords: ['اداری'] },
            { emoji: '🧑‍🔬', name: 'دانشمند', keywords: ['دانشمند'] },
            { emoji: '👨‍🔬', name: 'مرد دانشمند', keywords: ['دانشمند'] },
            { emoji: '👩‍🔬', name: 'زن دانشمند', keywords: ['دانشمند'] },
            { emoji: '🧑‍💻', name: 'توسعه‌دهنده', keywords: ['برنامه‌نویس'] },
            { emoji: '👨‍💻', name: 'مرد برنامه‌نویس', keywords: ['برنامه‌نویس'] },
            { emoji: '👩‍💻', name: 'زن برنامه‌نویس', keywords: ['برنامه‌نویس'] },
            { emoji: '🧑‍🎤', name: 'خواننده', keywords: ['خواننده'] },
            { emoji: '👨‍🎤', name: 'مرد خواننده', keywords: ['خواننده'] },
            { emoji: '👩‍🎤', name: 'زن خواننده', keywords: ['خواننده'] },
            { emoji: '🧑‍🎨', name: 'هنرمند', keywords: ['نقاش'] },
            { emoji: '👨‍🎨', name: 'مرد هنرمند', keywords: ['نقاش'] },
            { emoji: '👩‍🎨', name: 'زن هنرمند', keywords: ['نقاش'] },
            { emoji: '🧑‍🚀', name: 'فضانورد', keywords: ['فضا'] },
            { emoji: '👨‍🚀', name: 'مرد فضانورد', keywords: ['فضا'] },
            { emoji: '👩‍🚀', name: 'زن فضانورد', keywords: ['فضا'] },
            { emoji: '🧑‍🚒', name: 'آتش‌نشان', keywords: ['آتش'] },
            { emoji: '👨‍🚒', name: 'مرد آتش‌نشان', keywords: ['آتش'] },
            { emoji: '👩‍🚒', name: 'زن آتش‌نشان', keywords: ['آتش'] },
            { emoji: '👮', name: 'پلیس', keywords: ['پلیس'] },
            { emoji: '👮‍♂️', name: 'مرد پلیس', keywords: ['پلیس'] },
            { emoji: '👮‍♀️', name: 'زن پلیس', keywords: ['پلیس'] },
            { emoji: '🕵️', name: 'کارآگاه', keywords: ['کارآگاه'] },
            { emoji: '🕵️‍♂️', name: 'مرد کارآگاه', keywords: ['کارآگاه'] },
            { emoji: '🕵️‍♀️', name: 'زن کارآگاه', keywords: ['کارآگاه'] },
            { emoji: '💂', name: 'نگهبان', keywords: ['نگهبان'] },
            { emoji: '💂‍♂️', name: 'مرد نگهبان', keywords: ['نگهبان'] },
            { emoji: '💂‍♀️', name: 'زن نگهبان', keywords: ['نگهبان'] },
            { emoji: '🥷', name: 'نینجا', keywords: ['نینجا'] },
            { emoji: '👷', name: 'کارگر ساختمانی', keywords: ['ساختمان'] },
            { emoji: '👷‍♂️', name: 'مرد کارگر', keywords: ['ساختمان'] },
            { emoji: '👷‍♀️', name: 'زن کارگر', keywords: ['ساختمان'] },
            { emoji: '🫅', name: 'شخص تاج‌دار', keywords: ['پادشاه'] },
            { emoji: '🤴', name: 'شاهزاده', keywords: ['پادشاه'] },
            { emoji: '👸', name: 'شاهدخت', keywords: ['ملکه'] },
            { emoji: '👰', name: 'عروس با حجاب', keywords: ['عروسی'] },
            { emoji: '👰‍♂️', name: 'داماد با حجاب', keywords: ['عروسی'] },
            { emoji: '👰‍♀️', name: 'عروس با حجاب', keywords: ['عروسی'] },
            { emoji: '🤵', name: 'شخص کت و شلوار', keywords: ['کت و شلوار'] },
            { emoji: '🤵‍♂️', name: 'مرد کت و شلوار', keywords: ['کت و شلوار'] },
            { emoji: '🤵‍♀️', name: 'زن کت و شلوار', keywords: ['کت و شلوار'] },
            { emoji: '👰', name: 'عروس با حجاب', keywords: ['عروسی'] },
            { emoji: '👶', name: 'نوزاد', keywords: ['بچه'] },
            { emoji: '👼', name: 'فرشته', keywords: ['فرشته'] },
            { emoji: '🎅', name: 'بابانوئل', keywords: ['کریسمس'] },
            { emoji: '🤶', name: 'مامان‌نوئل', keywords: ['کریسمس'] },
            { emoji: '🦌', name: 'گوزن', keywords: ['کریسمس'] },
            { emoji: '☃️', name: 'آدم برفی', keywords: ['برف'] },
            { emoji: '🧑‍🎄', name: 'شخص کریسمس', keywords: ['کریسمس'] },
            { emoji: '🦸', name: 'ابر قهرمان', keywords: ['قهرمان'] },
            { emoji: '🦸‍♂️', name: 'مرد ابرقهرمان', keywords: ['قهرمان'] },
            { emoji: '🦸‍♀️', name: 'زن ابرقهرمان', keywords: ['قهرمان'] },
            { emoji: '🦹', name: 'ابر شرور', keywords: ['شرور'] },
            { emoji: '🦹‍♂️', name: 'مرد ابرشرور', keywords: ['شرور'] },
            { emoji: '🦹‍♀️', name: 'زن ابرشرور', keywords: ['شرور'] },
            { emoji: '🧙', name: 'جادوگر', keywords: ['جادو'] },
            { emoji: '🧙‍♂️', name: 'مرد جادوگر', keywords: ['جادو'] },
            { emoji: '🧙‍♀️', name: 'زن جادوگر', keywords: ['جادو'] },
            { emoji: '🧚', name: 'پری', keywords: ['پری'] },
            { emoji: '🧚‍♂️', name: 'مرد پری', keywords: ['پری'] },
            { emoji: '🧚‍♀️', name: 'زن پری', keywords: ['پری'] },
            { emoji: '🧛', name: 'خون‌آشام', keywords: ['خون‌آشام'] },
            { emoji: '🧛‍♂️', name: 'مرد خون‌آشام', keywords: ['خون‌آشام'] },
            { emoji: '🧛‍♀️', name: 'زن خون‌آشام', keywords: ['خون‌آشام'] },
            { emoji: '🧜', name: 'آدم‌آب‌باز', keywords: ['دریایی'] },
            { emoji: '🧜‍♂️', name: 'مرد دریایی', keywords: ['دریایی'] },
            { emoji: '🧜‍♀️', name: 'پری دریایی', keywords: ['دریایی'] },
            { emoji: '🧝', name: 'الف', keywords: ['الف'] },
            { emoji: '🧝‍♂️', name: 'مرد الف', keywords: ['الف'] },
            { emoji: '🧝‍♀️', name: 'زن الف', keywords: ['الف'] },
            { emoji: '🧞', name: 'جن', keywords: ['جن'] },
            { emoji: '🧞‍♂️', name: 'مرد جن', keywords: ['جن'] },
            { emoji: '🧞‍♀️', name: 'زن جن', keywords: ['جن'] },
            { emoji: '🧟', name: 'زامبی', keywords: ['زامبی'] },
            { emoji: '🧟‍♂️', name: 'مرد زامبی', keywords: ['زامبی'] },
            { emoji: '🧟‍♀️', name: 'زن زامبی', keywords: ['زامبی'] },
            { emoji: '💆', name: 'ماساژ صورت', keywords: ['ماساژ'] },
            { emoji: '💆‍♂️', name: 'مرد ماساژ', keywords: ['ماساژ'] },
            { emoji: '💆‍♀️', name: 'زن ماساژ', keywords: ['ماساژ'] },
            { emoji: '💇', name: 'مو کوتاه کن', keywords: ['آرایشگاه'] },
            { emoji: '💇‍♂️', name: 'مرد مو کوتاه کن', keywords: ['آرایشگاه'] },
            { emoji: '💇‍♀️', name: 'زن مو کوتاه کن', keywords: ['آرایشگاه'] },
            { emoji: '🚶', name: 'شخص راه‌رونده', keywords: ['پیاده'] },
            { emoji: '🚶‍♂️', name: 'مرد راه‌رونده', keywords: ['پیاده'] },
            { emoji: '🚶‍♀️', name: 'زن راه‌رونده', keywords: ['پیاده'] },
            { emoji: '🧍', name: 'شخص ایستاده', keywords: ['ایستاده'] },
            { emoji: '🧍‍♂️', name: 'مرد ایستاده', keywords: ['ایستاده'] },
            { emoji: '🧍‍♀️', name: 'زن ایستاده', keywords: ['ایستاده'] },
            { emoji: '🧎', name: 'شخص زانو زده', keywords: ['زانو'] },
            { emoji: '🧎‍♂️', name: 'مرد زانو زده', keywords: ['زانو'] },
            { emoji: '🧎‍♀️', name: 'زن زانو زده', keywords: ['زانو'] },
            { emoji: '👨‍🦯', name: 'مرد با عصا', keywords: ['عصا'] },
            { emoji: '👩‍🦯', name: 'زن با عصا', keywords: ['عصا'] },
            { emoji: '👨‍🦼', name: 'مرد با ویلچر', keywords: ['ویلچر'] },
            { emoji: '👩‍🦼', name: 'زن با ویلچر', keywords: ['ویلچر'] },
            { emoji: '👨‍🦽', name: 'مرد با ویلچر دستی', keywords: ['ویلچر'] },
            { emoji: '👩‍🦽', name: 'زن با ویلچر دستی', keywords: ['ویلچر'] },
            { emoji: '🏃', name: 'شخص دونده', keywords: ['دویدن'] },
            { emoji: '🏃‍♂️', name: 'مرد دونده', keywords: ['دویدن'] },
            { emoji: '🏃‍♀️', name: 'زن دونده', keywords: ['دویدن'] },
            { emoji: '💃', name: 'زن رقصنده', keywords: ['رقص'] },
            { emoji: '🕺', name: 'مرد رقصنده', keywords: ['رقص'] },
            { emoji: '🕴️', name: 'شخص پرواز', keywords: ['پرواز'] },
            { emoji: '👯', name: 'اشخاص با گوش خرگوشی', keywords: ['رقص'] },
            { emoji: '👯‍♂️', name: 'مردان با گوش خرگوشی', keywords: ['رقص'] },
            { emoji: '👯‍♀️', name: 'زنان با گوش خرگوشی', keywords: ['رقص'] },
            { emoji: '🧖', name: 'شخص در سونا', keywords: ['سونا'] },
            { emoji: '🧖‍♂️', name: 'مرد در سونا', keywords: ['سونا'] },
            { emoji: '🧖‍♀️', name: 'زن در سونا', keywords: ['سونا'] },
            { emoji: '🧗', name: 'شخص کوهنورد', keywords: ['کوهنوردی'] },
            { emoji: '🧗‍♂️', name: 'مرد کوهنورد', keywords: ['کوهنوردی'] },
            { emoji: '🧗‍♀️', name: 'زن کوهنورد', keywords: ['کوهنوردی'] },
            { emoji: '🤺', name: 'شمشیرباز', keywords: ['شمشیر'] },
            { emoji: '🏇', name: 'سوارکاری', keywords: ['اسب'] },
            { emoji: '⛷️', name: 'اسکی‌باز', keywords: ['اسکی'] },
            { emoji: '🏂', name: 'اسنوبرد سوار', keywords: ['اسنوبرد'] },
            { emoji: '🏌️', name: 'گلف‌باز', keywords: ['گلف'] },
            { emoji: '🏌️‍♂️', name: 'مرد گلف‌باز', keywords: ['گلف'] },
            { emoji: '🏌️‍♀️', name: 'زن گلف‌باز', keywords: ['گلف'] },
            { emoji: '🏄', name: 'موج‌سوار', keywords: ['موج'] },
            { emoji: '🏄‍♂️', name: 'مرد موج‌سوار', keywords: ['موج'] },
            { emoji: '🏄‍♀️', name: 'زن موج‌سوار', keywords: ['موج'] },
            { emoji: '🚣', name: 'قایقران', keywords: ['قایق'] },
            { emoji: '🚣‍♂️', name: 'مرد قایقران', keywords: ['قایق'] },
            { emoji: '🚣‍♀️', name: 'زن قایقران', keywords: ['قایق'] },
            { emoji: '🏊', name: 'شناگر', keywords: ['شنا'] },
            { emoji: '🏊‍♂️', name: 'مرد شناگر', keywords: ['شنا'] },
            { emoji: '🏊‍♀️', name: 'زن شناگر', keywords: ['شنا'] },
            { emoji: '⛹️', name: 'بازیکن توپ', keywords: ['توپ'] },
            { emoji: '⛹️‍♂️', name: 'مرد بازیکن توپ', keywords: ['توپ'] },
            { emoji: '⛹️‍♀️', name: 'زن بازیکن توپ', keywords: ['توپ'] },
            { emoji: '🏋️', name: 'وزنه‌بردار', keywords: ['وزنه'] },
            { emoji: '🏋️‍♂️', name: 'مرد وزنه‌بردار', keywords: ['وزنه'] },
            { emoji: '🏋️‍♀️', name: 'زن وزنه‌بردار', keywords: ['وزنه'] },
            { emoji: '🚴', name: 'دوچرخه‌سوار', keywords: ['دوچرخه'] },
            { emoji: '🚴‍♂️', name: 'مرد دوچرخه‌سوار', keywords: ['دوچرخه'] },
            { emoji: '🚴‍♀️', name: 'زن دوچرخه‌سوار', keywords: ['دوچرخه'] },
            { emoji: '🚵', name: 'دوچرخه‌سوار کوهستان', keywords: ['دوچرخه'] },
            { emoji: '🚵‍♂️', name: 'مرد دوچرخه‌سوار کوهستان', keywords: ['دوچرخه'] },
            { emoji: '🚵‍♀️', name: 'زن دوچرخه‌سوار کوهستان', keywords: ['دوچرخه'] },
            { emoji: '🤸', name: 'ژیمناست', keywords: ['ژیمناستیک'] },
            { emoji: '🤸‍♂️', name: 'مرد ژیمناست', keywords: ['ژیمناستیک'] },
            { emoji: '🤸‍♀️', name: 'زن ژیمناست', keywords: ['ژیمناستیک'] },
            { emoji: '🤼', name: 'کشتی‌گیران', keywords: ['کشتی'] },
            { emoji: '🤼‍♂️', name: 'مردان کشتی‌گیر', keywords: ['کشتی'] },
            { emoji: '🤼‍♀️', name: 'زنان کشتی‌گیر', keywords: ['کشتی'] },
            { emoji: '🤽', name: 'واترپلو', keywords: ['واترپلو'] },
            { emoji: '🤽‍♂️', name: 'مرد واترپلو', keywords: ['واترپلو'] },
            { emoji: '🤽‍♀️', name: 'زن واترپلو', keywords: ['واترپلو'] },
            { emoji: '🤾', name: 'هندبال', keywords: ['هندبال'] },
            { emoji: '🤾‍♂️', name: 'مرد هندبال', keywords: ['هندبال'] },
            { emoji: '🤾‍♀️', name: 'زن هندبال', keywords: ['هندبال'] },
            { emoji: '🤹', name: 'شعبده‌باز', keywords: ['شعبده'] },
            { emoji: '🤹‍♂️', name: 'مرد شعبده‌باز', keywords: ['شعبده'] },
            { emoji: '🤹‍♀️', name: 'زن شعبده‌باز', keywords: ['شعبده'] },
            { emoji: '🧘', name: 'مدیتیشن', keywords: ['یوگا'] },
            { emoji: '🧘‍♂️', name: 'مرد مدیتیشن', keywords: ['یوگا'] },
            { emoji: '🧘‍♀️', name: 'زن مدیتیشن', keywords: ['یوگا'] },
            { emoji: '🛀', name: 'حمام', keywords: ['حمام'] },
            { emoji: '🛌', name: 'تخت خواب', keywords: ['خواب'] },
            { emoji: '🧑‍🤝‍🧑', name: 'دو نفر دست در دست', keywords: ['دوستی'] },
            { emoji: '👭', name: 'دو زن دست در دست', keywords: ['دوستی'] },
            { emoji: '👫', name: 'زن و مرد دست در دست', keywords: ['دوستی'] },
            { emoji: '👬', name: 'دو مرد دست در دست', keywords: ['دوستی'] },
            { emoji: '💏', name: 'بوسه', keywords: ['عشق'] },
            { emoji: '👩‍❤️‍💋‍👨', name: 'بوسه زن و مرد', keywords: ['عشق'] },
            { emoji: '👨‍❤️‍💋‍👨', name: 'بوسه دو مرد', keywords: ['عشق'] },
            { emoji: '👩‍❤️‍💋‍👩', name: 'بوسه دو زن', keywords: ['عشق'] },
            { emoji: '💑', name: 'زوج با قلب', keywords: ['عشق'] },
            { emoji: '👩‍❤️‍👨', name: 'زوج زن و مرد', keywords: ['عشق'] },
            { emoji: '👨‍❤️‍👨', name: 'زوج دو مرد', keywords: ['عشق'] },
            { emoji: '👩‍❤️‍👩', name: 'زوج دو زن', keywords: ['عشق'] },
            { emoji: '👪', name: 'خانواده', keywords: ['خانواده'] }
        ],

        // ===== 3. حیوانات و طبیعت (Animals & Nature) =====
        animals: [
            { emoji: '🐵', name: 'صورت میمون', keywords: ['میمون'] },
            { emoji: '🐒', name: 'میمون', keywords: ['میمون'] },
            { emoji: '🦍', name: 'گوریل', keywords: ['گوریل'] },
            { emoji: '🦧', name: 'اورانگوتان', keywords: ['میمون'] },
            { emoji: '🐶', name: 'صورت سگ', keywords: ['سگ'] },
            { emoji: '🐕', name: 'سگ', keywords: ['سگ'] },
            { emoji: '🦮', name: 'سگ راهنما', keywords: ['سگ'] },
            { emoji: '🐕‍🦺', name: 'سگ با جلیقه', keywords: ['سگ'] },
            { emoji: '🐩', name: 'پودل', keywords: ['سگ'] },
            { emoji: '🐺', name: 'گرگ', keywords: ['گرگ'] },
            { emoji: '🦊', name: 'روباه', keywords: ['روباه'] },
            { emoji: '🦝', name: 'راکون', keywords: ['راکون'] },
            { emoji: '🐱', name: 'صورت گربه', keywords: ['گربه'] },
            { emoji: '🐈', name: 'گربه', keywords: ['گربه'] },
            { emoji: '🐈‍⬛', name: 'گربه سیاه', keywords: ['گربه'] },
            { emoji: '🦁', name: 'شیر', keywords: ['شیر'] },
            { emoji: '🐯', name: 'صورت ببر', keywords: ['ببر'] },
            { emoji: '🐅', name: 'ببر', keywords: ['ببر'] },
            { emoji: '🐆', name: 'پلنگ', keywords: ['پلنگ'] },
            { emoji: '🐴', name: 'صورت اسب', keywords: ['اسب'] },
            { emoji: '🐎', name: 'اسب', keywords: ['اسب'] },
            { emoji: '🦄', name: 'تک‌شاخ', keywords: ['تک‌شاخ'] },
            { emoji: '🦓', name: 'گورخر', keywords: ['گورخر'] },
            { emoji: '🦌', name: 'گوزن', keywords: ['گوزن'] },
            { emoji: '🦬', name: 'گاومیش', keywords: ['گاومیش'] },
            { emoji: '🐮', name: 'صورت گاو', keywords: ['گاو'] },
            { emoji: '🐂', name: 'گاو نر', keywords: ['گاو'] },
            { emoji: '🐃', name: 'گاومیش آبی', keywords: ['گاومیش'] },
            { emoji: '🐄', name: 'گاو ماده', keywords: ['گاو'] },
            { emoji: '🐷', name: 'صورت خوک', keywords: ['خوک'] },
            { emoji: '🐖', name: 'خوک', keywords: ['خوک'] },
            { emoji: '🐗', name: 'گراز', keywords: ['گراز'] },
            { emoji: '🐽', name: 'بینی خوک', keywords: ['خوک'] },
            { emoji: '🐏', name: 'قوچ', keywords: ['قوچ'] },
            { emoji: '🐑', name: 'گوسفند', keywords: ['گوسفند'] },
            { emoji: '🐐', name: 'بز', keywords: ['بز'] },
            { emoji: '🐪', name: 'شتر', keywords: ['شتر'] },
            { emoji: '🐫', name: 'شتر دوکوهانه', keywords: ['شتر'] },
            { emoji: '🦙', name: 'لاما', keywords: ['لاما'] },
            { emoji: '🦒', name: 'زرافه', keywords: ['زرافه'] },
            { emoji: '🐘', name: 'فیل', keywords: ['فیل'] },
            { emoji: '🦣', name: 'ماموت', keywords: ['ماموت'] },
            { emoji: '🦏', name: 'کرگدن', keywords: ['کرگدن'] },
            { emoji: '🦛', name: 'اسب آبی', keywords: ['اسب آبی'] },
            { emoji: '🐭', name: 'صورت موش', keywords: ['موش'] },
            { emoji: '🐁', name: 'موش', keywords: ['موش'] },
            { emoji: '🐀', name: 'موش صحرایی', keywords: ['موش'] },
            { emoji: '🐹', name: 'همستر', keywords: ['همستر'] },
            { emoji: '🐰', name: 'صورت خرگوش', keywords: ['خرگوش'] },
            { emoji: '🐇', name: 'خرگوش', keywords: ['خرگوش'] },
            { emoji: '🐿️', name: 'سنجاب', keywords: ['سنجاب'] },
            { emoji: '🦫', name: 'بیور', keywords: ['بیور'] },
            { emoji: '🦔', name: 'جوجه‌تیغی', keywords: ['جوجه‌تیغی'] },
            { emoji: '🦇', name: 'خفاش', keywords: ['خفاش'] },
            { emoji: '🐻', name: 'خرس', keywords: ['خرس'] },
            { emoji: '🐻‍❄️', name: 'خرس قطبی', keywords: ['خرس'] },
            { emoji: '🐨', name: 'کوالا', keywords: ['کوالا'] },
            { emoji: '🐼', name: 'پاندا', keywords: ['پاندا'] },
            { emoji: '🦥', name: 'تنبل', keywords: ['تنبل'] },
            { emoji: '🦦', name: 'سمور آبی', keywords: ['سمور'] },
            { emoji: '🦨', name: 'اسکانک', keywords: ['اسکانک'] },
            { emoji: '🦘', name: 'کانگورو', keywords: ['کانگورو'] },
            { emoji: '🦡', name: 'گورکن', keywords: ['گورکن'] },
            { emoji: '🐾', name: 'رد پنجه', keywords: ['پنجه'] },
            { emoji: '🦃', name: 'بوقلمون', keywords: ['بوقلمون'] },
            { emoji: '🐔', name: 'مرغ', keywords: ['مرغ'] },
            { emoji: '🐓', name: 'خروس', keywords: ['خروس'] },
            { emoji: '🐣', name: 'جوجه در حال بیرون آمدن', keywords: ['جوجه'] },
            { emoji: '🐤', name: 'جوجه', keywords: ['جوجه'] },
            { emoji: '🐥', name: 'جوجه ایستاده', keywords: ['جوجه'] },
            { emoji: '🐦', name: 'پرنده', keywords: ['پرنده'] },
            { emoji: '🐧', name: 'پنگوئن', keywords: ['پنگوئن'] },
            { emoji: '🕊️', name: 'کبوتر', keywords: ['صلح'] },
            { emoji: '🦅', name: 'عقاب', keywords: ['عقاب'] },
            { emoji: '🦆', name: 'اردک', keywords: ['اردک'] },
            { emoji: '🦢', name: 'قو', keywords: ['قو'] },
            { emoji: '🦉', name: 'جغد', keywords: ['جغد'] },
            { emoji: '🦤', name: 'دودو', keywords: ['دودو'] },
            { emoji: '🪶', name: 'پر', keywords: ['پر'] },
            { emoji: '🦩', name: 'فلامینگو', keywords: ['فلامینگو'] },
            { emoji: '🦚', name: 'طاووس', keywords: ['طاووس'] },
            { emoji: '🦜', name: 'طوطی', keywords: ['طوطی'] },
            { emoji: '🐸', name: 'قورباغه', keywords: ['قورباغه'] },
            { emoji: '🐊', name: 'تمساح', keywords: ['تمساح'] },
            { emoji: '🐢', name: 'لاک‌پشت', keywords: ['لاک‌پشت'] },
            { emoji: '🦎', name: 'مارمولک', keywords: ['مارمولک'] },
            { emoji: '🐍', name: 'مار', keywords: ['مار'] },
            { emoji: '🐲', name: 'صورت اژدها', keywords: ['اژدها'] },
            { emoji: '🐉', name: 'اژدها', keywords: ['اژدها'] },
            { emoji: '🦕', name: 'ساروپود', keywords: ['دایناسور'] },
            { emoji: '🦖', name: 'تی‌رکس', keywords: ['دایناسور'] },
            { emoji: '🐳', name: 'نهنگ آب‌پاش', keywords: ['نهنگ'] },
            { emoji: '🐋', name: 'نهنگ', keywords: ['نهنگ'] },
            { emoji: '🐬', name: 'دلفین', keywords: ['دلفین'] },
            { emoji: '🦭', name: 'فوک', keywords: ['فوک'] },
            { emoji: '🐟', name: 'ماهی', keywords: ['ماهی'] },
            { emoji: '🐠', name: 'ماهی گرمسیری', keywords: ['ماهی'] },
            { emoji: '🐡', name: 'ماهی بادکنکی', keywords: ['ماهی'] },
            { emoji: '🦈', name: 'کوسه', keywords: ['کوسه'] },
            { emoji: '🐙', name: 'هشت‌پا', keywords: ['هشت‌پا'] },
            { emoji: '🐚', name: 'صدف', keywords: ['صدف'] },
            { emoji: '🐌', name: 'حلزون', keywords: ['حلزون'] },
            { emoji: '🦋', name: 'پروانه', keywords: ['پروانه'] },
            { emoji: '🐛', name: 'کرم', keywords: ['کرم'] },
            { emoji: '🐜', name: 'مورچه', keywords: ['مورچه'] },
            { emoji: '🐝', name: 'زنبور', keywords: ['زنبور'] },
            { emoji: '🪲', name: 'سوسک', keywords: ['سوسک'] },
            { emoji: '🐞', name: 'کفشدوزک', keywords: ['کفشدوزک'] },
            { emoji: '🦗', name: 'ملخ', keywords: ['ملخ'] },
            { emoji: '🪳', name: 'سوسک حمام', keywords: ['سوسک'] },
            { emoji: '🕷️', name: 'عنکبوت', keywords: ['عنکبوت'] },
            { emoji: '🕸️', name: 'تار عنکبوت', keywords: ['تار'] },
            { emoji: '🦂', name: 'عقرب', keywords: ['عقرب'] },
            { emoji: '🦟', name: 'پشه', keywords: ['پشه'] },
            { emoji: '🪰', name: 'مگس', keywords: ['مگس'] },
            { emoji: '🪱', name: 'کرم خاکی', keywords: ['کرم'] },
            { emoji: '🦠', name: 'میکروب', keywords: ['ویروس'] },
            { emoji: '💐', name: 'دسته گل', keywords: ['گل'] },
            { emoji: '🌸', name: 'شکوفه گیلاس', keywords: ['شکوفه'] },
            { emoji: '💮', name: 'مهر سفید', keywords: ['گل'] },
            { emoji: '🏵️', name: 'گل رز', keywords: ['گل'] },
            { emoji: '🌹', name: 'گل رز قرمز', keywords: ['گل'] },
            { emoji: '🥀', name: 'گل پژمرده', keywords: ['گل'] },
            { emoji: '🌺', name: 'هیبیسکوس', keywords: ['گل'] },
            { emoji: '🌻', name: 'آفتابگردان', keywords: ['گل'] },
            { emoji: '🌼', name: 'گل مروارید', keywords: ['گل'] },
            { emoji: '🌷', name: 'لاله', keywords: ['گل'] },
            { emoji: '🌱', name: 'جوانه', keywords: ['گیاه'] },
            { emoji: '🪴', name: 'گیاه گلدانی', keywords: ['گیاه'] },
            { emoji: '🌲', name: 'درخت کاج', keywords: ['درخت'] },
            { emoji: '🌳', name: 'درخت', keywords: ['درخت'] },
            { emoji: '🌴', name: 'درخت نخل', keywords: ['نخل'] },
            { emoji: '🌵', name: 'کاکتوس', keywords: ['کاکتوس'] },
            { emoji: '🌾', name: 'شالی', keywords: ['برنج'] },
            { emoji: '🌿', name: 'گیاه', keywords: ['گیاه'] },
            { emoji: '☘️', name: 'شبدر', keywords: ['شبدر'] },
            { emoji: '🍀', name: 'شبدر چهاربرگ', keywords: ['شانس'] },
            { emoji: '🍁', name: 'برگ افرا', keywords: ['برگ'] },
            { emoji: '🍂', name: 'برگ افتاده', keywords: ['پاییز'] },
            { emoji: '🍃', name: 'برگ در باد', keywords: ['برگ'] },
            { emoji: '🪹', name: 'لانه خالی', keywords: ['لانه'] },
            { emoji: '🪺', name: 'لانه با تخم', keywords: ['لانه'] },
            { emoji: '🍄', name: 'قارچ', keywords: ['قارچ'] },
            { emoji: '🌰', name: 'شاه‌بلوط', keywords: ['بلوط'] },
            { emoji: '🦀', name: 'خرچنگ', keywords: ['خرچنگ'] },
            { emoji: '🦞', name: 'لابستر', keywords: ['لابستر'] },
            { emoji: '🦐', name: 'میگو', keywords: ['میگو'] },
            { emoji: '🦑', name: 'ماهی مرکب', keywords: ['ماهی مرکب'] }
        ],

        // ===== 4. غذا و نوشیدنی (Food & Drink) =====
        food: [
            { emoji: '🍇', name: 'انگور', keywords: ['میوه'] },
            { emoji: '🍈', name: 'خربزه', keywords: ['میوه'] },
            { emoji: '🍉', name: 'هندوانه', keywords: ['میوه'] },
            { emoji: '🍊', name: 'پرتقال', keywords: ['میوه'] },
            { emoji: '🍋', name: 'لیمو', keywords: ['میوه'] },
            { emoji: '🍌', name: 'موز', keywords: ['میوه'] },
            { emoji: '🍍', name: 'آناناس', keywords: ['میوه'] },
            { emoji: '🥭', name: 'انبه', keywords: ['میوه'] },
            { emoji: '🍎', name: 'سیب قرمز', keywords: ['میوه'] },
            { emoji: '🍏', name: 'سیب سبز', keywords: ['میوه'] },
            { emoji: '🍐', name: 'گلابی', keywords: ['میوه'] },
            { emoji: '🍑', name: 'هلو', keywords: ['میوه'] },
            { emoji: '🍒', name: 'گیلاس', keywords: ['میوه'] },
            { emoji: '🍓', name: 'توت فرنگی', keywords: ['میوه'] },
            { emoji: '🫐', name: 'بلوبری', keywords: ['میوه'] },
            { emoji: '🥝', name: 'کیوی', keywords: ['میوه'] },
            { emoji: '🍅', name: 'گوجه', keywords: ['سبزی'] },
            { emoji: '🫒', name: 'زیتون', keywords: ['زیتون'] },
            { emoji: '🥥', name: 'نارگیل', keywords: ['نارگیل'] },
            { emoji: '🥑', name: 'آووکادو', keywords: ['میوه'] },
            { emoji: '🍆', name: 'بادمجان', keywords: ['سبزی'] },
            { emoji: '🥔', name: 'سیب‌زمینی', keywords: ['سبزی'] },
            { emoji: '🥕', name: 'هویج', keywords: ['سبزی'] },
            { emoji: '🌽', name: 'ذرت', keywords: ['سبزی'] },
            { emoji: '🌶️', name: 'فلفل تند', keywords: ['فلفل'] },
            { emoji: '🫑', name: 'فلفل دلمه', keywords: ['فلفل'] },
            { emoji: '🥒', name: 'خیار', keywords: ['سبزی'] },
            { emoji: '🥬', name: 'سبزی برگی', keywords: ['کاهو'] },
            { emoji: '🥦', name: 'کلم بروکلی', keywords: ['کلم'] },
            { emoji: '🧄', name: 'سیر', keywords: ['سیر'] },
            { emoji: '🧅', name: 'پیاز', keywords: ['پیاز'] },
            { emoji: '🥜', name: 'بادام‌زمینی', keywords: ['آجیل'] },
            { emoji: '🫘', name: 'لوبیا', keywords: ['حبوبات'] },
            { emoji: '🌰', name: 'شاه‌بلوط', keywords: ['آجیل'] },
            { emoji: '🍞', name: 'نان', keywords: ['نان'] },
            { emoji: '🥐', name: 'کروسان', keywords: ['نان'] },
            { emoji: '🥖', name: 'باگت', keywords: ['نان'] },
            { emoji: '🫓', name: 'نان تخت', keywords: ['نان'] },
            { emoji: '🥨', name: 'پرتزل', keywords: ['نان'] },
            { emoji: '🥯', name: 'بیگل', keywords: ['نان'] },
            { emoji: '🥞', name: 'پنکیک', keywords: ['صبحانه'] },
            { emoji: '🧇', name: 'ویفل', keywords: ['صبحانه'] },
            { emoji: '🧀', name: 'پنیر', keywords: ['پنیر'] },
            { emoji: '🍖', name: 'گوشت با استخوان', keywords: ['گوشت'] },
            { emoji: '🍗', name: 'ران مرغ', keywords: ['مرغ'] },
            { emoji: '🥩', name: 'استیک', keywords: ['گوشت'] },
            { emoji: '🥓', name: 'بیکن', keywords: ['گوشت'] },
            { emoji: '🍔', name: 'همبرگر', keywords: ['فست‌فود'] },
            { emoji: '🍟', name: 'سیب‌زمینی سرخ کرده', keywords: ['فست‌فود'] },
            { emoji: '🍕', name: 'پیتزا', keywords: ['فست‌فود'] },
            { emoji: '🌭', name: 'هات داگ', keywords: ['فست‌فود'] },
            { emoji: '🥪', name: 'ساندویچ', keywords: ['ساندویچ'] },
            { emoji: '🌮', name: 'تاکو', keywords: ['مکزیکی'] },
            { emoji: '🌯', name: 'بوریتو', keywords: ['مکزیکی'] },
            { emoji: '🫔', name: 'تامال', keywords: ['مکزیکی'] },
            { emoji: '🥙', name: 'پیتا', keywords: ['ساندویچ'] },
            { emoji: '🧆', name: 'فلافل', keywords: ['فلافل'] },
            { emoji: '🥚', name: 'تخم‌مرغ', keywords: ['تخم‌مرغ'] },
            { emoji: '🍳', name: 'تخم‌مرغ نیمرو', keywords: ['صبحانه'] },
            { emoji: '🥘', name: 'تابه غذا', keywords: ['غذا'] },
            { emoji: '🍲', name: 'دیگ غذا', keywords: ['آش'] },
            { emoji: '🫕', name: 'فوندو', keywords: ['پنیر'] },
            { emoji: '🥣', name: 'کاسه و قاشق', keywords: ['صبحانه'] },
            { emoji: '🥗', name: 'سالاد', keywords: ['سالاد'] },
            { emoji: '🍿', name: 'پاپ کورن', keywords: ['فیلم'] },
            { emoji: '🧈', name: 'کره', keywords: ['کره'] },
            { emoji: '🧂', name: 'نمک', keywords: ['نمک'] },
            { emoji: '🥫', name: 'کنسرو', keywords: ['کنسرو'] },
            { emoji: '🍱', name: 'جعبه بنتو', keywords: ['ژاپنی'] },
            { emoji: '🍘', name: 'کراکر برنج', keywords: ['ژاپنی'] },
            { emoji: '🍙', name: 'توپک برنج', keywords: ['ژاپنی'] },
            { emoji: '🍚', name: 'برنج', keywords: ['برنج'] },
            { emoji: '🍛', name: 'کاری', keywords: ['هندی'] },
            { emoji: '🍜', name: 'رامن', keywords: ['نودل'] },
            { emoji: '🍝', name: 'اسپاگتی', keywords: ['پاستا'] },
            { emoji: '🍠', name: 'سیب‌زمینی شیرین', keywords: ['سیب‌زمینی'] },
            { emoji: '🍢', name: 'اودن', keywords: ['ژاپنی'] },
            { emoji: '🍣', name: 'سوشی', keywords: ['ژاپنی'] },
            { emoji: '🍤', name: 'میگوی سوخاری', keywords: ['میگو'] },
            { emoji: '🍥', name: 'کیک ماهی', keywords: ['ژاپنی'] },
            { emoji: '🥮', name: 'کیک ماه', keywords: ['چینی'] },
            { emoji: '🍡', name: 'دانگو', keywords: ['ژاپنی'] },
            { emoji: '🥟', name: 'دیم سام', keywords: ['چینی'] },
            { emoji: '🥠', name: 'کیک شانس', keywords: ['چینی'] },
            { emoji: '🥡', name: 'جعبه غذای چینی', keywords: ['چینی'] },
            { emoji: '🍦', name: 'بستنی نرم', keywords: ['بستنی'] },
            { emoji: '🍧', name: 'بستنی یخی', keywords: ['بستنی'] },
            { emoji: '🍨', name: 'بستنی', keywords: ['بستنی'] },
            { emoji: '🍩', name: 'دونات', keywords: ['شیرینی'] },
            { emoji: '🍪', name: 'کوکی', keywords: ['شیرینی'] },
            { emoji: '🎂', name: 'کیک تولد', keywords: ['تولد'] },
            { emoji: '🍰', name: 'کیک میوه', keywords: ['شیرینی'] },
            { emoji: '🧁', name: 'کاپ‌کیک', keywords: ['شیرینی'] },
            { emoji: '🥧', name: 'پای', keywords: ['شیرینی'] },
            { emoji: '🍫', name: 'شکلات', keywords: ['شکلات'] },
            { emoji: '🍬', name: 'آب‌نبات', keywords: ['شیرینی'] },
            { emoji: '🍭', name: 'آب‌نبات چوبی', keywords: ['شیرینی'] },
            { emoji: '🍮', name: 'کارامل', keywords: ['دسر'] },
            { emoji: '🍯', name: 'عسل', keywords: ['عسل'] },
            { emoji: '🍼', name: 'شیشه شیر', keywords: ['نوزاد'] },
            { emoji: '🥛', name: 'لیوان شیر', keywords: ['شیر'] },
            { emoji: '☕', name: 'قهوه', keywords: ['قهوه'] },
            { emoji: '🫖', name: 'قوری چای', keywords: ['چای'] },
            { emoji: '🍵', name: 'فنجان چای', keywords: ['چای'] },
            { emoji: '🍶', name: 'ساکی', keywords: ['ژاپنی'] },
            { emoji: '🍾', name: 'بطری باز شده', keywords: ['نوشیدنی'] },
            { emoji: '🍷', name: 'شراب قرمز', keywords: ['شراب'] },
            { emoji: '🍸', name: 'کوکتل', keywords: ['نوشیدنی'] },
            { emoji: '🍹', name: 'نوشیدنی گرمسیری', keywords: ['نوشیدنی'] },
            { emoji: '🍺', name: 'لیوان آبجو', keywords: ['آبجو'] },
            { emoji: '🍻', name: 'لیوان‌های آبجو', keywords: ['آبجو'] },
            { emoji: '🥂', name: 'لیوان‌های نان تست', keywords: ['تولد'] },
            { emoji: '🥃', name: 'لیوان ویسکی', keywords: ['نوشیدنی'] },
            { emoji: '🫗', name: 'مایع در حال ریختن', keywords: ['نوشیدنی'] },
            { emoji: '🥤', name: 'لیوان نی‌دار', keywords: ['نوشابه'] },
            { emoji: '🧋', name: 'چای حباب', keywords: ['چای'] },
            { emoji: '🧃', name: 'جعبه نوشیدنی', keywords: ['نوشیدنی'] },
            { emoji: '🧉', name: 'مت', keywords: ['نوشیدنی'] },
            { emoji: '🧊', name: 'یخ', keywords: ['یخ'] },
            { emoji: '🥢', name: 'چاپستیک', keywords: ['قاشق چنگال'] },
            { emoji: '🍽️', name: 'چنگال و قاشق با بشقاب', keywords: ['بشقاب'] },
            { emoji: '🍴', name: 'چنگال و قاشق', keywords: ['قاشق'] },
            { emoji: '🥄', name: 'قاشق', keywords: ['قاشق'] }
        ],

        // ===== 5. سفر و مکان‌ها (Travel & Places) =====
        travel: [
            { emoji: '🚗', name: 'خودرو', keywords: ['ماشین'] },
            { emoji: '🚕', name: 'تاکسی', keywords: ['تاکسی'] },
            { emoji: '🚙', name: 'خودرو ورزشی', keywords: ['ماشین'] },
            { emoji: '🚌', name: 'اتوبوس', keywords: ['اتوبوس'] },
            { emoji: '🚎', name: 'اتوبوس برقی', keywords: ['اتوبوس'] },
            { emoji: '🏎️', name: 'خودرو مسابقه', keywords: ['مسابقه'] },
            { emoji: '🚓', name: 'خودرو پلیس', keywords: ['پلیس'] },
            { emoji: '🚑', name: 'آمبولانس', keywords: ['آمبولانس'] },
            { emoji: '🚒', name: 'ماشین آتش‌نشانی', keywords: ['آتش'] },
            { emoji: '🚐', name: 'ون', keywords: ['ون'] },
            { emoji: '🛻', name: 'وانت', keywords: ['وانت'] },
            { emoji: '🚚', name: 'کامیون', keywords: ['کامیون'] },
            { emoji: '🚛', name: 'کامیون بزرگ', keywords: ['کامیون'] },
            { emoji: '🚜', name: 'تراکتور', keywords: ['تراکتور'] },
            { emoji: '🛵', name: 'موتور', keywords: ['موتور'] },
            { emoji: '🏍️', name: 'موتورسیکلت', keywords: ['موتور'] },
            { emoji: '🚲', name: 'دوچرخه', keywords: ['دوچرخه'] },
            { emoji: '🛴', name: 'اسکوتر', keywords: ['اسکوتر'] },
            { emoji: '🚏', name: 'ایستگاه اتوبوس', keywords: ['اتوبوس'] },
            { emoji: '⛽', name: 'پمپ بنزین', keywords: ['بنزین'] },
            { emoji: '🚨', name: 'چراغ گردان', keywords: ['پلیس'] },
            { emoji: '🚥', name: 'چراغ راهنمایی', keywords: ['راهنمایی'] },
            { emoji: '🚦', name: 'چراغ راهنمایی افقی', keywords: ['راهنمایی'] },
            { emoji: '🛑', name: 'علامت ایست', keywords: ['ایست'] },
            { emoji: '🚧', name: 'ساخت‌وساز', keywords: ['کار'] },
            { emoji: '⚓', name: 'لنگر', keywords: ['دریا'] },
            { emoji: '⛵', name: 'قایق بادبانی', keywords: ['قایق'] },
            { emoji: '🚤', name: 'قایق موتوری', keywords: ['قایق'] },
            { emoji: '🛳️', name: 'کشتی مسافربری', keywords: ['کشتی'] },
            { emoji: '⛴️', name: 'کشتی', keywords: ['کشتی'] },
            { emoji: '🛥️', name: 'قایق موتوری', keywords: ['قایق'] },
            { emoji: '🚂', name: 'قطار', keywords: ['قطار'] },
            { emoji: '🚆', name: 'قطار', keywords: ['قطار'] },
            { emoji: '🚇', name: 'مترو', keywords: ['مترو'] },
            { emoji: '🚈', name: 'قطار سبک', keywords: ['قطار'] },
            { emoji: '🚉', name: 'ایستگاه قطار', keywords: ['قطار'] },
            { emoji: '🚝', name: 'قطار تک‌ریل', keywords: ['قطار'] },
            { emoji: '🚞', name: 'قطار کوهستانی', keywords: ['قطار'] },
            { emoji: '✈️', name: 'هواپیما', keywords: ['پرواز'] },
            { emoji: '🛩️', name: 'هواپیمای کوچک', keywords: ['پرواز'] },
            { emoji: '🛫', name: 'پرواز در حال بلند شدن', keywords: ['پرواز'] },
            { emoji: '🛬', name: 'پرواز در حال فرود', keywords: ['پرواز'] },
            { emoji: '🪂', name: 'چتر نجات', keywords: ['پرواز'] },
            { emoji: '🚁', name: 'بالگرد', keywords: ['هلیکوپتر'] },
            { emoji: '🚟', name: 'قطار معلق', keywords: ['قطار'] },
            { emoji: '🚠', name: 'تله‌کابین', keywords: ['تله‌کابین'] },
            { emoji: '🚡', name: 'تله‌سیژ', keywords: ['تله‌سیژ'] },
            { emoji: '🛰️', name: 'ماهواره', keywords: ['فضا'] },
            { emoji: '🚀', name: 'موشک', keywords: ['فضا'] },
            { emoji: '🛸', name: 'بشقاب پرنده', keywords: ['یوفو'] },
            { emoji: '🛎️', name: 'زنگ پذیرش', keywords: ['هتل'] },
            { emoji: '🧳', name: 'چمدان', keywords: ['سفر'] },
            { emoji: '⌛', name: 'ساعت شنی', keywords: ['زمان'] },
            { emoji: '⏳', name: 'ساعت شنی در حال ریختن', keywords: ['زمان'] },
            { emoji: '⌚', name: 'ساعت مچی', keywords: ['ساعت'] },
            { emoji: '⏰', name: 'ساعت زنگ‌دار', keywords: ['ساعت'] },
            { emoji: '⏱️', name: 'کرنومتر', keywords: ['زمان'] },
            { emoji: '⏲️', name: 'تایمر', keywords: ['زمان'] },
            { emoji: '🕰️', name: 'ساعت دیواری', keywords: ['ساعت'] },
            { emoji: '🕛', name: 'ساعت دوازده', keywords: ['زمان'] },
            { emoji: '🕐', name: 'ساعت یک', keywords: ['زمان'] },
            { emoji: '🕑', name: 'ساعت دو', keywords: ['زمان'] },
            { emoji: '🕒', name: 'ساعت سه', keywords: ['زمان'] },
            { emoji: '🕓', name: 'ساعت چهار', keywords: ['زمان'] },
            { emoji: '🕔', name: 'ساعت پنج', keywords: ['زمان'] },
            { emoji: '🕕', name: 'ساعت شش', keywords: ['زمان'] },
            { emoji: '🕖', name: 'ساعت هفت', keywords: ['زمان'] },
            { emoji: '🕗', name: 'ساعت هشت', keywords: ['زمان'] },
            { emoji: '🕘', name: 'ساعت نه', keywords: ['زمان'] },
            { emoji: '🕙', name: 'ساعت ده', keywords: ['زمان'] },
            { emoji: '🕚', name: 'ساعت یازده', keywords: ['زمان'] },
            { emoji: '🌑', name: 'ماه نو', keywords: ['ماه'] },
            { emoji: '🌒', name: 'هلال ماه', keywords: ['ماه'] },
            { emoji: '🌓', name: 'ماه نیمه', keywords: ['ماه'] },
            { emoji: '🌔', name: 'ماه محدب', keywords: ['ماه'] },
            { emoji: '🌕', name: 'ماه کامل', keywords: ['ماه'] },
            { emoji: '🌖', name: 'ماه محدب کاهشی', keywords: ['ماه'] },
            { emoji: '🌗', name: 'ماه نیمه کاهشی', keywords: ['ماه'] },
            { emoji: '🌘', name: 'هلال کاهشی', keywords: ['ماه'] },
            { emoji: '🌙', name: 'هلال ماه', keywords: ['ماه'] },
            { emoji: '🌚', name: 'ماه نو با صورت', keywords: ['ماه'] },
            { emoji: '🌛', name: 'ماه نیمه با صورت', keywords: ['ماه'] },
            { emoji: '🌜', name: 'ماه نیمه کاهشی با صورت', keywords: ['ماه'] },
            { emoji: '🌡️', name: 'دماسنج', keywords: ['دما'] },
            { emoji: '☀️', name: 'خورشید', keywords: ['آفتاب'] },
            { emoji: '🌝', name: 'ماه کامل با صورت', keywords: ['ماه'] },
            { emoji: '🌞', name: 'خورشید با صورت', keywords: ['خورشید'] },
            { emoji: '🪐', name: 'سیاره زحل', keywords: ['سیاره'] },
            { emoji: '⭐', name: 'ستاره', keywords: ['ستاره'] },
            { emoji: '🌟', name: 'ستاره درخشان', keywords: ['ستاره'] },
            { emoji: '🌠', name: 'ستاره دنباله‌دار', keywords: ['ستاره'] },
            { emoji: '🌌', name: 'کهکشان', keywords: ['فضا'] },
            { emoji: '☁️', name: 'ابر', keywords: ['ابر'] },
            { emoji: '⛅', name: 'نیمه ابری', keywords: ['ابر'] },
            { emoji: '⛈️', name: 'ابر با رعد و برق', keywords: ['رعد'] },
            { emoji: '🌤️', name: 'آفتاب با ابر کم', keywords: ['آفتاب'] },
            { emoji: '🌥️', name: 'آفتاب با ابر زیاد', keywords: ['آفتاب'] },
            { emoji: '🌦️', name: 'آفتاب با باران', keywords: ['باران'] },
            { emoji: '🌧️', name: 'ابر با باران', keywords: ['باران'] },
            { emoji: '🌨️', name: 'ابر با برف', keywords: ['برف'] },
            { emoji: '🌩️', name: 'ابر با رعد', keywords: ['رعد'] },
            { emoji: '🌪️', name: 'طوفان', keywords: ['طوفان'] },
            { emoji: '🌫️', name: 'مه', keywords: ['مه'] },
            { emoji: '🌬️', name: 'باد', keywords: ['باد'] },
            { emoji: '🌀', name: 'چرخند', keywords: ['طوفان'] },
            { emoji: '🌈', name: 'رنگین‌کمان', keywords: ['رنگین‌کمان'] },
            { emoji: '🌂', name: 'چتر بسته', keywords: ['چتر'] },
            { emoji: '☂️', name: 'چتر باز', keywords: ['چتر'] },
            { emoji: '☔', name: 'چتر با قطرات باران', keywords: ['باران'] },
            { emoji: '⛱️', name: 'چتر ساحلی', keywords: ['ساحل'] },
            { emoji: '⚡', name: 'ولتاژ', keywords: ['برق'] },
            { emoji: '❄️', name: 'دانه برف', keywords: ['برف'] },
            { emoji: '☃️', name: 'آدم برفی', keywords: ['برف'] },
            { emoji: '⛄', name: 'آدم برفی بدون برف', keywords: ['برف'] },
            { emoji: '🔥', name: 'آتش', keywords: ['آتش'] },
            { emoji: '💧', name: 'قطره', keywords: ['آب'] },
            { emoji: '🌊', name: 'موج', keywords: ['دریا'] },
            { emoji: '🎄', name: 'درخت کریسمس', keywords: ['کریسمس'] },
            { emoji: '✨', name: 'درخشش', keywords: ['ستاره'] },
            { emoji: '🎋', name: 'درخت تاناباتا', keywords: ['ژاپن'] },
            { emoji: '🎍', name: 'تزئین کاج', keywords: ['ژاپن'] },
            { emoji: '🎇', name: 'ترقه', keywords: ['جشن'] },
            { emoji: '🎆', name: 'آتش‌بازی', keywords: ['جشن'] },
            { emoji: '🧨', name: 'ترقه', keywords: ['جشن'] },
            { emoji: '🎈', name: 'بادکنک', keywords: ['جشن'] },
            { emoji: '🎉', name: 'ترقه جشن', keywords: ['تولد'] },
            { emoji: '🎊', name: 'کوفتی', keywords: ['جشن'] }
        ],

        // ===== 6. فعالیت‌ها و ورزش (Activities & Sports) =====
        activities: [
            { emoji: '⚽', name: 'فوتبال', keywords: ['فوتبال'] },
            { emoji: '🏀', name: 'بسکتبال', keywords: ['بسکتبال'] },
            { emoji: '🏈', name: 'فوتبال آمریکایی', keywords: ['فوتبال'] },
            { emoji: '⚾', name: 'بیسبال', keywords: ['بیسبال'] },
            { emoji: '🥎', name: 'سافت بال', keywords: ['بیسبال'] },
            { emoji: '🎾', name: 'تنیس', keywords: ['تنیس'] },
            { emoji: '🏐', name: 'والیبال', keywords: ['والیبال'] },
            { emoji: '🏉', name: 'راگبی', keywords: ['راگبی'] },
            { emoji: '🥏', name: 'فریزبی', keywords: ['فریزبی'] },
            { emoji: '🎳', name: 'بولینگ', keywords: ['بولینگ'] },
            { emoji: '🏏', name: 'کریکت', keywords: ['کریکت'] },
            { emoji: '🏑', name: 'هاکی روی چمن', keywords: ['هاکی'] },
            { emoji: '🏒', name: 'هاکی روی یخ', keywords: ['هاکی'] },
            { emoji: '🥍', name: 'لاکراس', keywords: ['لاکراس'] },
            { emoji: '🏓', name: 'تنیس روی میز', keywords: ['پینگ پنگ'] },
            { emoji: '🏸', name: 'بدمینتون', keywords: ['بدمینتون'] },
            { emoji: '🥊', name: 'دستکش بوکس', keywords: ['بوکس'] },
            { emoji: '🥋', name: 'کیمونو', keywords: ['کاراته'] },
            { emoji: '🥅', name: 'دروازه', keywords: ['گل'] },
            { emoji: '⛳', name: 'پرچم گلف', keywords: ['گلف'] },
            { emoji: '⛸️', name: 'اسکیت روی یخ', keywords: ['اسکیت'] },
            { emoji: '🎣', name: 'قلاب ماهیگیری', keywords: ['ماهی'] },
            { emoji: '🤿', name: 'ماسک غواصی', keywords: ['غواصی'] },
            { emoji: '🎽', name: 'دو', keywords: ['ورزش'] },
            { emoji: '🎿', name: 'اسکی', keywords: ['اسکی'] },
            { emoji: '🛷', name: 'سورتمه', keywords: ['برف'] },
            { emoji: '🥌', name: 'کِرلینگ', keywords: ['کِرلینگ'] },
            { emoji: '🎯', name: 'تیراندازی', keywords: ['هدف'] },
            { emoji: '🪀', name: 'یویو', keywords: ['بازی'] },
            { emoji: '🪁', name: 'بادبادک', keywords: ['بازی'] },
            { emoji: '🔫', name: 'تفنگ آبی', keywords: ['بازی'] },
            { emoji: '🎱', name: 'بیلیارد', keywords: ['بیلیارد'] },
            { emoji: '🔮', name: 'گوی بلورین', keywords: ['جادو'] },
            { emoji: '🪄', name: 'چوب جادو', keywords: ['جادو'] },
            { emoji: '🎮', name: 'بازی ویدیویی', keywords: ['بازی'] },
            { emoji: '🕹️', name: 'دسته بازی', keywords: ['بازی'] },
            { emoji: '🎰', name: 'اسلات ماشین', keywords: ['قمار'] },
            { emoji: '🎲', name: 'تاس', keywords: ['بازی'] },
            { emoji: '🧩', name: 'پازل', keywords: ['پازل'] },
            { emoji: '🧸', name: 'خرس عروسکی', keywords: ['عروسک'] },
            { emoji: '🪅', name: 'پینیاتا', keywords: ['جشن'] },
            { emoji: '🪩', name: 'گوی آینه‌ای', keywords: ['دیسکو'] },
            { emoji: '🪆', name: 'عروسک تودرتو', keywords: ['عروسک'] },
            { emoji: '♠️', name: 'پیک', keywords: ['کارت'] },
            { emoji: '♥️', name: 'دل', keywords: ['کارت'] },
            { emoji: '♦️', name: 'خشت', keywords: ['کارت'] },
            { emoji: '♣️', name: 'گشنیز', keywords: ['کارت'] },
            { emoji: '♟️', name: 'پیاده شطرنج', keywords: ['شطرنج'] },
            { emoji: '🃏', name: 'ژوکر', keywords: ['کارت'] },
            { emoji: '🀄', name: 'ماهجونگ', keywords: ['ماهجونگ'] },
            { emoji: '🎴', name: 'کارت هانافودا', keywords: ['کارت'] },
            { emoji: '🎭', name: 'هنرهای نمایشی', keywords: ['تئاتر'] },
            { emoji: '🖼️', name: 'تابلوی نقاشی', keywords: ['هنر'] },
            { emoji: '🎨', name: 'پالت نقاشی', keywords: ['نقاشی'] },
            { emoji: '🧵', name: 'نخ', keywords: ['خیاطی'] },
            { emoji: '🪡', name: 'سوزن', keywords: ['خیاطی'] },
            { emoji: '🧶', name: 'کاموا', keywords: ['بافتنی'] },
            { emoji: '🪢', name: 'گره', keywords: ['گره'] },
            { emoji: '🎼', name: 'نت موسیقی', keywords: ['موسیقی'] },
            { emoji: '🎹', name: 'پیانو', keywords: ['موسیقی'] },
            { emoji: '🪇', name: 'ماراکا', keywords: ['موسیقی'] },
            { emoji: '🪈', name: 'فلوت', keywords: ['موسیقی'] },
            { emoji: '🪗', name: 'آکاردئون', keywords: ['موسیقی'] },
            { emoji: '🎺', name: 'ترومپت', keywords: ['موسیقی'] },
            { emoji: '🎸', name: 'گیتار', keywords: ['موسیقی'] },
            { emoji: '🪕', name: 'بانجو', keywords: ['موسیقی'] },
            { emoji: '🥁', name: 'طبل', keywords: ['موسیقی'] },
            { emoji: '🪘', name: 'کنگا', keywords: ['موسیقی'] },
            { emoji: '🎻', name: 'ویولن', keywords: ['موسیقی'] },
            { emoji: '🎫', name: 'بلیت', keywords: ['سینما'] },
            { emoji: '🎟️', name: 'بلیت‌های ورودی', keywords: ['سینما'] },
            { emoji: '🎪', name: 'چادر سیرک', keywords: ['سیرک'] },
            { emoji: '🤹', name: 'شعبده‌باز', keywords: ['شعبده'] },
            { emoji: '🎬', name: 'کلapperboard', keywords: ['فیلم'] },
            { emoji: '🎤', name: 'میکروفون', keywords: ['آواز'] },
            { emoji: '🎧', name: 'هدفون', keywords: ['موسیقی'] },
            { emoji: '🎷', name: 'ساکسوفون', keywords: ['موسیقی'] },
            { emoji: '🎙️', name: 'میکروفون استودیو', keywords: ['موسیقی'] },
            { emoji: '🎚️', name: 'اسلایدر', keywords: ['موسیقی'] },
            { emoji: '🎛️', name: 'کنترل‌کننده', keywords: ['موسیقی'] },
            { emoji: '📻', name: 'رادیو', keywords: ['رادیو'] },
            { emoji: '📱', name: 'موبایل', keywords: ['گوشی'] },
            { emoji: '📲', name: 'موبایل با فلش', keywords: ['گوشی'] },
            { emoji: '☎️', name: 'تلفن', keywords: ['تلفن'] },
            { emoji: '📞', name: 'گوشی تلفن', keywords: ['تلفن'] },
            { emoji: '📟', name: 'پیجر', keywords: ['پیجر'] },
            { emoji: '📠', name: 'فکس', keywords: ['فکس'] },
            { emoji: '🔋', name: 'باتری', keywords: ['شارژ'] },
            { emoji: '🔌', name: 'دوشاخه', keywords: ['برق'] },
            { emoji: '💻', name: 'لپ‌تاپ', keywords: ['کامپیوتر'] },
            { emoji: '🖥️', name: 'کامپیوتر', keywords: ['کامپیوتر'] },
            { emoji: '🖨️', name: 'پرینتر', keywords: ['پرینتر'] },
            { emoji: '⌨️', name: 'کیبورد', keywords: ['کیبورد'] },
            { emoji: '🖱️', name: 'ماوس', keywords: ['ماوس'] },
            { emoji: '🖲️', name: 'ترکبال', keywords: ['ماوس'] },
            { emoji: '💽', name: 'مینی‌دیسک', keywords: ['موسیقی'] },
            { emoji: '💾', name: 'فلاپی دیسک', keywords: ['ذخیره'] },
            { emoji: '💿', name: 'سی‌دی', keywords: ['موسیقی'] },
            { emoji: '📀', name: 'دی‌وی‌دی', keywords: ['فیلم'] },
            { emoji: '🧮', name: 'چرتکه', keywords: ['حساب'] },
            { emoji: '🎥', name: 'دوربین فیلم‌برداری', keywords: ['فیلم'] },
            { emoji: '🎞️', name: 'فریم فیلم', keywords: ['فیلم'] },
            { emoji: '📽️', name: 'پروژکتور', keywords: ['فیلم'] },
            { emoji: '🎬', name: 'کلapperboard', keywords: ['فیلم'] },
            { emoji: '📺', name: 'تلویزیون', keywords: ['تلویزیون'] },
            { emoji: '📷', name: 'دوربین', keywords: ['عکس'] },
            { emoji: '📸', name: 'دوربین با فلش', keywords: ['عکس'] },
            { emoji: '📹', name: 'دوربین فیلم‌برداری', keywords: ['فیلم'] },
            { emoji: '📼', name: 'نوار ویدیو', keywords: ['فیلم'] },
            { emoji: '🔍', name: 'ذره‌بین به چپ', keywords: ['بزرگ‌نمایی'] },
            { emoji: '🔎', name: 'ذره‌بین به راست', keywords: ['بزرگ‌نمایی'] },
            { emoji: '🕯️', name: 'شمع', keywords: ['نور'] },
            { emoji: '💡', name: 'لامپ', keywords: ['ایده'] },
            { emoji: '🔦', name: 'چراغ قوه', keywords: ['نور'] },
            { emoji: '🏮', name: 'فانوس قرمز', keywords: ['نور'] },
            { emoji: '🪔', name: 'دیپا', keywords: ['نور'] },
            { emoji: '📔', name: 'دفتر با جلد', keywords: ['نوشتن'] },
            { emoji: '📕', name: 'کتاب بسته', keywords: ['کتاب'] },
            { emoji: '📖', name: 'کتاب باز', keywords: ['کتاب'] },
            { emoji: '📗', name: 'کتاب سبز', keywords: ['کتاب'] },
            { emoji: '📘', name: 'کتاب آبی', keywords: ['کتاب'] },
            { emoji: '📙', name: 'کتاب نارنجی', keywords: ['کتاب'] },
            { emoji: '📚', name: 'کتاب‌ها', keywords: ['کتاب'] },
            { emoji: '📓', name: 'دفتر', keywords: ['نوشتن'] },
            { emoji: '📒', name: 'دفتر حساب', keywords: ['نوشتن'] },
            { emoji: '📃', name: 'صفحه پیچیده', keywords: ['سند'] },
            { emoji: '📜', name: 'طومار', keywords: ['سند'] },
            { emoji: '📄', name: 'صفحه رو به بالا', keywords: ['سند'] },
            { emoji: '📰', name: 'روزنامه', keywords: ['خبر'] },
            { emoji: '🗞️', name: 'روزنامه پیچیده', keywords: ['خبر'] },
            { emoji: '📑', name: 'بوکمارک', keywords: ['نشانه'] },
            { emoji: '🔖', name: 'نشانه', keywords: ['نشانه'] },
            { emoji: '🏷️', name: 'برچسب', keywords: ['برچسب'] },
            { emoji: '💰', name: 'کیف پول', keywords: ['پول'] },
            { emoji: '🪙', name: 'سکه', keywords: ['پول'] },
            { emoji: '💴', name: 'اسکناس ین', keywords: ['پول'] },
            { emoji: '💵', name: 'اسکناس دلار', keywords: ['پول'] },
            { emoji: '💶', name: 'اسکناس یورو', keywords: ['پول'] },
            { emoji: '💷', name: 'اسکناس پوند', keywords: ['پول'] },
            { emoji: '💸', name: 'پول با بال', keywords: ['پول'] },
            { emoji: '💳', name: 'کارت اعتباری', keywords: ['پول'] },
            { emoji: '🧾', name: 'فاکتور', keywords: ['خرید'] },
            { emoji: '💹', name: 'نمودار صعودی', keywords: ['اقتصاد'] },
            { emoji: '✉️', name: 'پاکت نامه', keywords: ['ایمیل'] },
            { emoji: '📧', name: 'ایمیل', keywords: ['ایمیل'] },
            { emoji: '📨', name: 'پاکت نامه دریافتی', keywords: ['پیام'] },
            { emoji: '📩', name: 'پاکت نامه با فلش', keywords: ['ارسال'] },
            { emoji: '📤', name: 'پاکت نامه خروجی', keywords: ['ارسال'] },
            { emoji: '📥', name: 'پاکت نامه ورودی', keywords: ['دریافت'] },
            { emoji: '📦', name: 'بسته', keywords: ['ارسال'] },
            { emoji: '📫', name: 'صندوق پستی بسته', keywords: ['پست'] },
            { emoji: '📪', name: 'صندوق پستی باز', keywords: ['پست'] },
            { emoji: '📬', name: 'صندوق پستی پر', keywords: ['پست'] },
            { emoji: '📭', name: 'صندوق پستی خالی', keywords: ['پست'] },
            { emoji: '📮', name: 'صندوق پست', keywords: ['پست'] },
            { emoji: '🗳️', name: 'صندوق رای', keywords: ['انتخابات'] },
            { emoji: '✏️', name: 'مداد', keywords: ['نوشتن'] },
            { emoji: '✒️', name: 'خودکار', keywords: ['نوشتن'] },
            { emoji: '🖋️', name: 'خودکار فواره‌ای', keywords: ['نوشتن'] },
            { emoji: '🖊️', name: 'خودکار', keywords: ['نوشتن'] },
            { emoji: '🖌️', name: 'قلم‌مو', keywords: ['نقاشی'] },
            { emoji: '🖍️', name: 'مداد شمعی', keywords: ['نقاشی'] },
            { emoji: '📝', name: 'یادداشت', keywords: ['نوشتن'] },
            { emoji: '📁', name: 'پوشه', keywords: ['فایل'] },
            { emoji: '📂', name: 'پوشه باز', keywords: ['فایل'] },
            { emoji: '🗂️', name: 'دسته‌بندی', keywords: ['فایل'] },
            { emoji: '📅', name: 'تقویم', keywords: ['تاریخ'] },
            { emoji: '📆', name: 'تقویم کندن', keywords: ['تاریخ'] },
            { emoji: '🗒️', name: 'دفتر یادداشت', keywords: ['نوشتن'] },
            { emoji: '🗓️', name: 'تقویم رومیزی', keywords: ['تاریخ'] },
            { emoji: '📇', name: 'پرونده', keywords: ['فایل'] },
            { emoji: '📈', name: 'نمودار صعودی', keywords: ['آمار'] },
            { emoji: '📉', name: 'نمودار نزولی', keywords: ['آمار'] },
            { emoji: '📊', name: 'نمودار میله‌ای', keywords: ['آمار'] },
            { emoji: '📋', name: 'کلیپ‌بورد', keywords: ['لیست'] },
            { emoji: '📌', name: 'سنجاق', keywords: ['نشانه'] },
            { emoji: '📍', name: 'سنجاق گرد', keywords: ['نشانه'] },
            { emoji: '📎', name: 'گیره', keywords: ['فایل'] },
            { emoji: '🖇️', name: 'گیره‌ها', keywords: ['فایل'] },
            { emoji: '📏', name: 'خط‌کش', keywords: ['اندازه'] },
            { emoji: '📐', name: 'گونیا', keywords: ['اندازه'] },
            { emoji: '✂️', name: 'قیچی', keywords: ['برش'] },
            { emoji: '🗃️', name: 'جعبه پرونده', keywords: ['فایل'] },
            { emoji: '🗄️', name: 'کابینت', keywords: ['فایل'] },
            { emoji: '🗑️', name: 'سطل زباله', keywords: ['حذف'] },
            { emoji: '🔒', name: 'قفل بسته', keywords: ['قفل'] },
            { emoji: '🔓', name: 'قفل باز', keywords: ['باز'] },
            { emoji: '🔏', name: 'قفل با خودکار', keywords: ['امضا'] },
            { emoji: '🔐', name: 'قفل بسته با کلید', keywords: ['امن'] },
            { emoji: '🔑', name: 'کلید', keywords: ['کلید'] },
            { emoji: '🗝️', name: 'کلید قدیمی', keywords: ['کلید'] },
            { emoji: '🔨', name: 'چکش', keywords: ['ابزار'] },
            { emoji: '🪓', name: 'تبر', keywords: ['ابزار'] },
            { emoji: '⛏️', name: 'کلنگ', keywords: ['ابزار'] },
            { emoji: '⚒️', name: 'چکش و کلنگ', keywords: ['ابزار'] },
            { emoji: '🛠️', name: 'چکش و آچار', keywords: ['ابزار'] },
            { emoji: '🗡️', name: 'خنجر', keywords: ['اسلحه'] },
            { emoji: '⚔️', name: 'شمشیرهای ضربدری', keywords: ['شمشیر'] },
            { emoji: '🔫', name: 'تفنگ آبی', keywords: ['بازی'] },
            { emoji: '🪃', name: 'بومرنگ', keywords: ['بازی'] },
            { emoji: '🏹', name: 'کمان', keywords: ['تیراندازی'] },
            { emoji: '🛡️', name: 'سپر', keywords: ['دفاع'] },
            { emoji: '🪚', name: 'اره', keywords: ['ابزار'] },
            { emoji: '🔧', name: 'آچار', keywords: ['ابزار'] },
            { emoji: '🪛', name: 'پیچ‌گوشتی', keywords: ['ابزار'] },
            { emoji: '🔩', name: 'مهره و پیچ', keywords: ['ابزار'] },
            { emoji: '⚙️', name: 'چرخ‌دنده', keywords: ['مکانیک'] },
            { emoji: '🗜️', name: 'گیره', keywords: ['ابزار'] },
            { emoji: '⚖️', name: 'ترازو', keywords: ['عدالت'] },
            { emoji: '🦯', name: 'عصا', keywords: ['نابینا'] },
            { emoji: '🔗', name: 'لینک', keywords: ['اتصال'] },
            { emoji: '⛓️', name: 'زنجیر', keywords: ['زنجیر'] },
            { emoji: '🪝', name: 'قلاب', keywords: ['قلاب'] },
            { emoji: '🧰', name: 'جعبه ابزار', keywords: ['ابزار'] },
            { emoji: '🧲', name: 'آهنربا', keywords: ['آهنربا'] },
            { emoji: '🪜', name: 'نردبان', keywords: ['نردبان'] },
            { emoji: '⚗️', name: 'آلنبیک', keywords: ['شیمی'] },
            { emoji: '🧪', name: 'لوله آزمایش', keywords: ['شیمی'] },
            { emoji: '🧫', name: 'پتری دیش', keywords: ['زیست'] },
            { emoji: '🧬', name: 'دی‌ان‌ای', keywords: ['زیست'] },
            { emoji: '🔬', name: 'میکروسکوپ', keywords: ['علم'] },
            { emoji: '🔭', name: 'تلسکوپ', keywords: ['فضا'] },
            { emoji: '📡', name: 'دیش ماهواره', keywords: ['ارتباط'] },
            { emoji: '💉', name: 'سرنگ', keywords: ['پزشکی'] },
            { emoji: '🩸', name: 'قطره خون', keywords: ['خون'] },
            { emoji: '💊', name: 'قرص', keywords: ['دارو'] },
            { emoji: '🩹', name: 'چسب زخم', keywords: ['زخم'] },
            { emoji: '🩼', name: 'عصای زیربغل', keywords: ['معلول'] },
            { emoji: '🩺', name: 'گوشی پزشکی', keywords: ['دکتر'] },
            { emoji: '🩻', name: 'عکس رادیولوژی', keywords: ['پزشکی'] },
            { emoji: '🚪', name: 'درب', keywords: ['درب'] },
            { emoji: '🛗', name: 'آسانسور', keywords: ['آسانسور'] },
            { emoji: '🪞', name: 'آینه', keywords: ['آینه'] },
            { emoji: '🪟', name: 'پنجره', keywords: ['پنجره'] },
            { emoji: '🛏️', name: 'تخت', keywords: ['خواب'] },
            { emoji: '🛋️', name: 'مبل و چراغ', keywords: ['مبلمان'] },
            { emoji: '🪑', name: 'صندلی', keywords: ['صندلی'] },
            { emoji: '🚽', name: 'توالت', keywords: ['دستشویی'] },
            { emoji: '🪠', name: 'تلمبه', keywords: ['لوله‌کشی'] },
            { emoji: '🚿', name: 'دوش', keywords: ['حمام'] },
            { emoji: '🛁', name: 'وان حمام', keywords: ['حمام'] },
            { emoji: '🪤', name: 'تله موش', keywords: ['تله'] },
            { emoji: '🪒', name: 'تیغ', keywords: ['اصلاح'] },
            { emoji: '🧴', name: 'شامپو', keywords: ['بهداشت'] },
            { emoji: '🧷', name: 'سنجاق قفلی', keywords: ['بهداشت'] },
            { emoji: '🧹', name: 'جارو', keywords: ['تمیزی'] },
            { emoji: '🧺', name: 'سبد', keywords: ['لباس'] },
            { emoji: '🧻', name: 'دستمال', keywords: ['بهداشت'] },
            { emoji: '🪣', name: 'سطل', keywords: ['ظرف'] },
            { emoji: '🧼', name: 'صابون', keywords: ['بهداشت'] },
            { emoji: '🫧', name: 'حباب', keywords: ['صابون'] },
            { emoji: '🪥', name: 'مسواک', keywords: ['دندان'] },
            { emoji: '🧽', name: 'اسفنج', keywords: ['تمیزی'] },
            { emoji: '🧯', name: 'کپسول آتش‌نشانی', keywords: ['آتش'] },
            { emoji: '🛒', name: 'چرخ خرید', keywords: ['خرید'] },
            { emoji: '🚬', name: 'سیگار', keywords: ['سیگار'] },
            { emoji: '⚰️', name: 'تابوت', keywords: ['مرگ'] },
            { emoji: '🪦', name: 'سنگ قبر', keywords: ['مرگ'] },
            { emoji: '⚱️', name: 'کوزه خاکستر', keywords: ['مرگ'] },
            { emoji: '🧿', name: 'نظر قربانی', keywords: ['طلسم'] },
            { emoji: '🪬', name: 'دست فاطمه', keywords: ['طلسم'] },
            { emoji: '🗿', name: 'مجسمه', keywords: ['تندیس'] }
        ],

        // ===== 7. اشیاء و نمادها (Objects & Symbols) =====
        objects: [
            { emoji: '🏧', name: 'خودپرداز', keywords: ['بانک'] },
            { emoji: '🚮', name: 'علامت زباله', keywords: ['زباله'] },
            { emoji: '🚰', name: 'آب آشامیدنی', keywords: ['آب'] },
            { emoji: '♿', name: 'ویلچر', keywords: ['معلول'] },
            { emoji: '🚹', name: 'توالت مردانه', keywords: ['مرد'] },
            { emoji: '🚺', name: 'توالت زنانه', keywords: ['زن'] },
            { emoji: '🚻', name: 'توالت', keywords: ['دستشویی'] },
            { emoji: '🚼', name: 'اتاق تعویض کودک', keywords: ['نوزاد'] },
            { emoji: '🚾', name: 'دستشویی', keywords: ['توالت'] },
            { emoji: '🛂', name: 'کنترل پاسپورت', keywords: ['مرز'] },
            { emoji: '🛃', name: 'گمرک', keywords: ['گمرک'] },
            { emoji: '🛄', name: 'تحویل بار', keywords: ['فرودگاه'] },
            { emoji: '🛅', name: 'قفسه بار', keywords: ['فرودگاه'] },
            { emoji: '⚠️', name: 'اخطار', keywords: ['هشدار'] },
            { emoji: '🚸', name: 'کودکان', keywords: ['مدرسه'] },
            { emoji: '⛔', name: 'ورود ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚫', name: 'ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚳', name: 'دوچرخه ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚭', name: 'سیگار ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚯', name: 'زباله ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚱', name: 'آب غیرآشامیدنی', keywords: ['آب'] },
            { emoji: '🚷', name: 'عبور ممنوع', keywords: ['ممنوع'] },
            { emoji: '📵', name: 'موبایل ممنوع', keywords: ['ممنوع'] },
            { emoji: '🔞', name: 'زیر ۱۸ سال ممنوع', keywords: ['ممنوع'] },
            { emoji: '☢️', name: 'رادیواکتیو', keywords: ['خطر'] },
            { emoji: '☣️', name: 'زیست‌خطر', keywords: ['خطر'] },
            { emoji: '⬆️', name: 'فلش بالا', keywords: ['بالا'] },
            { emoji: '↗️', name: 'فلش بالا راست', keywords: ['بالا'] },
            { emoji: '➡️', name: 'فلش راست', keywords: ['راست'] },
            { emoji: '↘️', name: 'فلش پایین راست', keywords: ['پایین'] },
            { emoji: '⬇️', name: 'فلش پایین', keywords: ['پایین'] },
            { emoji: '↙️', name: 'فلش پایین چپ', keywords: ['پایین'] },
            { emoji: '⬅️', name: 'فلش چپ', keywords: ['چپ'] },
            { emoji: '↖️', name: 'فلش بالا چپ', keywords: ['بالا'] },
            { emoji: '↕️', name: 'فلش بالا پایین', keywords: ['بالا'] },
            { emoji: '↔️', name: 'فلش چپ راست', keywords: ['چپ'] },
            { emoji: '↩️', name: 'فلش چپ خمیده', keywords: ['بازگشت'] },
            { emoji: '↪️', name: 'فلش راست خمیده', keywords: ['رفتن'] },
            { emoji: '⤴️', name: 'فلش بالا خمیده', keywords: ['بالا'] },
            { emoji: '⤵️', name: 'فلش پایین خمیده', keywords: ['پایین'] },
            { emoji: '🔃', name: 'فلش‌های عمودی', keywords: ['تازه'] },
            { emoji: '🔄', name: 'فلش چرخشی', keywords: ['چرخش'] },
            { emoji: '🔙', name: 'بازگشت', keywords: ['بازگشت'] },
            { emoji: '🔚', name: 'پایان', keywords: ['پایان'] },
            { emoji: '🔛', name: 'روشن', keywords: ['روشن'] },
            { emoji: '🔜', name: 'به زودی', keywords: ['به زودی'] },
            { emoji: '🔝', name: 'بالا', keywords: ['بالا'] },
            { emoji: '🛐', name: 'عبادتگاه', keywords: ['مذهب'] },
            { emoji: '⚛️', name: 'اتم', keywords: ['علم'] },
            { emoji: '🕉️', name: 'اوم', keywords: ['هندو'] },
            { emoji: '✡️', name: 'ستاره داوود', keywords: ['یهود'] },
            { emoji: '☸️', name: 'چرخ دارما', keywords: ['بودا'] },
            { emoji: '☯️', name: 'یین یانگ', keywords: ['تائو'] },
            { emoji: '✝️', name: 'صلیب', keywords: ['مسیحیت'] },
            { emoji: '☦️', name: 'صلیب ارتدکس', keywords: ['مسیحیت'] },
            { emoji: '☪️', name: 'ستاره و هلال', keywords: ['اسلام'] },
            { emoji: '☮️', name: 'صلح', keywords: ['صلح'] },
            { emoji: '🕎', name: 'منورا', keywords: ['یهود'] },
            { emoji: '🔯', name: 'ستاره شش‌پر', keywords: ['فال'] },
            { emoji: '♈', name: 'بره', keywords: ['حمل'] },
            { emoji: '♉', name: 'گاو', keywords: ['ثور'] },
            { emoji: '♊', name: 'دوپیکر', keywords: ['جوزا'] },
            { emoji: '♋', name: 'خرچنگ', keywords: ['سرطان'] },
            { emoji: '♌', name: 'شیر', keywords: ['اسد'] },
            { emoji: '♍', name: 'دوشیزه', keywords: ['سنبله'] },
            { emoji: '♎', name: 'ترازو', keywords: ['میزان'] },
            { emoji: '♏', name: 'عقرب', keywords: ['عقرب'] },
            { emoji: '♐', name: 'کمان', keywords: ['قوس'] },
            { emoji: '♑', name: 'بز', keywords: ['جدی'] },
            { emoji: '♒', name: 'دلو', keywords: ['دلو'] },
            { emoji: '♓', name: 'ماهی', keywords: ['حوت'] },
            { emoji: '⛎', name: 'مارافسای', keywords: ['افعی'] },
            { emoji: '🔀', name: 'پخش تصادفی', keywords: ['شفل'] },
            { emoji: '🔁', name: 'تکرار', keywords: ['تکرار'] },
            { emoji: '🔂', name: 'تکرار یک', keywords: ['تکرار'] },
            { emoji: '▶️', name: 'پخش', keywords: ['پخش'] },
            { emoji: '⏩', name: 'جلو سریع', keywords: ['سریع'] },
            { emoji: '⏭️', name: 'بعدی', keywords: ['بعدی'] },
            { emoji: '⏯️', name: 'پخش یا توقف', keywords: ['پخش'] },
            { emoji: '◀️', name: 'عقب', keywords: ['عقب'] },
            { emoji: '⏪', name: 'عقب سریع', keywords: ['سریع'] },
            { emoji: '⏮️', name: 'قبلی', keywords: ['قبلی'] },
            { emoji: '🔼', name: 'بالا', keywords: ['بالا'] },
            { emoji: '⏫', name: 'بالا سریع', keywords: ['سریع'] },
            { emoji: '🔽', name: 'پایین', keywords: ['پایین'] },
            { emoji: '⏬', name: 'پایین سریع', keywords: ['سریع'] },
            { emoji: '⏸️', name: 'مکث', keywords: ['مکث'] },
            { emoji: '⏹️', name: 'توقف', keywords: ['توقف'] },
            { emoji: '⏺️', name: 'ضبط', keywords: ['ضبط'] },
            { emoji: '⏏️', name: 'خارج', keywords: ['خارج'] },
            { emoji: '🎦', name: 'سینما', keywords: ['فیلم'] },
            { emoji: '🔅', name: 'کم نور', keywords: ['نور'] },
            { emoji: '🔆', name: 'پر نور', keywords: ['نور'] },
            { emoji: '📶', name: 'آنتن', keywords: ['موبایل'] },
            { emoji: '📳', name: 'لرزش', keywords: ['موبایل'] },
            { emoji: '📴', name: 'خاموش', keywords: ['موبایل'] },
            { emoji: '♀️', name: 'نماد زن', keywords: ['زن'] },
            { emoji: '♂️', name: 'نماد مرد', keywords: ['مرد'] },
            { emoji: '⚧️', name: 'تراجنسیتی', keywords: ['جنسیت'] },
            { emoji: '✖️', name: 'ضربدر', keywords: ['ضرب'] },
            { emoji: '➕', name: 'بعلاوه', keywords: ['جمع'] },
            { emoji: '➖', name: 'منهای', keywords: ['تفریق'] },
            { emoji: '➗', name: 'تقسیم', keywords: ['تقسیم'] },
            { emoji: '🟰', name: 'مساوی', keywords: ['مساوی'] },
            { emoji: '♾️', name: 'بی‌نهایت', keywords: ['بی‌نهایت'] },
            { emoji: '‼️', name: 'علامت تعجب دوتایی', keywords: ['تعجب'] },
            { emoji: '⁉️', name: 'تعجب و سوال', keywords: ['تعجب'] },
            { emoji: '❓', name: 'علامت سوال', keywords: ['سوال'] },
            { emoji: '❔', name: 'علامت سوال سفید', keywords: ['سوال'] },
            { emoji: '❕', name: 'علامت تعجب سفید', keywords: ['تعجب'] },
            { emoji: '❗', name: 'علامت تعجب', keywords: ['تعجب'] },
            { emoji: '〰️', name: 'موج دار', keywords: ['خط'] },
            { emoji: '💱', name: 'صرافی', keywords: ['پول'] },
            { emoji: '💲', name: 'دلار', keywords: ['پول'] },
            { emoji: '⚕️', name: 'نماد پزشکی', keywords: ['پزشکی'] },
            { emoji: '♻️', name: 'بازیافت', keywords: ['بازیافت'] },
            { emoji: '⚜️', name: 'نیلوفر', keywords: ['گل'] },
            { emoji: '🔱', name: 'سه‌شاخ', keywords: ['پوزئیدون'] },
            { emoji: '📛', name: 'برچسب نام', keywords: ['اسم'] },
            { emoji: '🔰', name: 'نشان مبتدی', keywords: ['تازه‌کار'] },
            { emoji: '⭕', name: 'دایره قرمز', keywords: ['دایره'] },
            { emoji: '✅', name: 'علامت تیک سفید', keywords: ['تایید'] },
            { emoji: '☑️', name: 'جعبه تیک', keywords: ['تایید'] },
            { emoji: '✔️', name: 'تیک', keywords: ['تایید'] },
            { emoji: '❌', name: 'ضربدر', keywords: ['غلط'] },
            { emoji: '❎', name: 'ضربدر در مربع', keywords: ['غلط'] },
            { emoji: '➰', name: 'حلقه', keywords: ['فر'] },
            { emoji: '➿', name: 'حلقه دوتایی', keywords: ['فر'] },
            { emoji: '〽️', name: 'علامت بخش', keywords: ['بخش'] },
            { emoji: '✳️', name: 'هشت‌پر', keywords: ['ستاره'] },
            { emoji: '✴️', name: 'ستاره هشت‌پر', keywords: ['ستاره'] },
            { emoji: '❇️', name: 'جرقه', keywords: ['جرقه'] },
            { emoji: '©️', name: 'کپی‌رایت', keywords: ['کپی'] },
            { emoji: '®️', name: 'علامت ثبت', keywords: ['ثبت'] },
            { emoji: '™️', name: 'علامت تجاری', keywords: ['تجاری'] },
            { emoji: '♠️', name: 'پیک', keywords: ['کارت'] },
            { emoji: '♥️', name: 'دل', keywords: ['کارت'] },
            { emoji: '♦️', name: 'خشت', keywords: ['کارت'] },
            { emoji: '♣️', name: 'گشنیز', keywords: ['کارت'] },
            { emoji: '🀄', name: 'ماهجونگ', keywords: ['بازی'] },
            { emoji: '🎴', name: 'هانافودا', keywords: ['کارت'] },
            { emoji: '🔇', name: 'بی‌صدا', keywords: ['صدا'] },
            { emoji: '🔈', name: 'بلندگو کم', keywords: ['صدا'] },
            { emoji: '🔉', name: 'بلندگو متوسط', keywords: ['صدا'] },
            { emoji: '🔊', name: 'بلندگو بلند', keywords: ['صدا'] },
            { emoji: '📢', name: 'بلندگو اعلام', keywords: ['اعلام'] },
            { emoji: '📣', name: 'مگافون', keywords: ['اعلام'] },
            { emoji: '📯', name: 'بوق', keywords: ['پست'] },
            { emoji: '🔔', name: 'زنگ', keywords: ['زنگ'] },
            { emoji: '🔕', name: 'زنگ خط‌خور', keywords: ['بی‌صدا'] },
            { emoji: '🎼', name: 'نت', keywords: ['موسیقی'] },
            { emoji: '🎵', name: 'نت', keywords: ['موسیقی'] },
            { emoji: '🎶', name: 'نت‌ها', keywords: ['موسیقی'] },
            { emoji: '💹', name: 'نمودار', keywords: ['اقتصاد'] },
            { emoji: '🏧', name: 'خودپرداز', keywords: ['بانک'] },
            { emoji: '🚮', name: 'زباله', keywords: ['زباله'] },
            { emoji: '🚰', name: 'آب', keywords: ['آب'] },
            { emoji: '♿', name: 'ویلچر', keywords: ['معلول'] },
            { emoji: '🚹', name: 'مرد', keywords: ['مرد'] },
            { emoji: '🚺', name: 'زن', keywords: ['زن'] },
            { emoji: '🚻', name: 'دستشویی', keywords: ['توالت'] },
            { emoji: '🚼', name: 'نوزاد', keywords: ['بچه'] },
            { emoji: '🚾', name: 'دستشویی', keywords: ['توالت'] },
            { emoji: '🛂', name: 'پاسپورت', keywords: ['مرز'] },
            { emoji: '🛃', name: 'گمرک', keywords: ['گمرک'] },
            { emoji: '🛄', name: 'بار', keywords: ['فرودگاه'] },
            { emoji: '🛅', name: 'قفسه', keywords: ['فرودگاه'] },
            { emoji: '⚠️', name: 'اخطار', keywords: ['هشدار'] },
            { emoji: '🚸', name: 'کودکان', keywords: ['مدرسه'] },
            { emoji: '⛔', name: 'ورود ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚫', name: 'ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚳', name: 'دوچرخه ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚭', name: 'سیگار ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚯', name: 'زباله ممنوع', keywords: ['ممنوع'] },
            { emoji: '🚱', name: 'آب غیرآشامیدنی', keywords: ['آب'] },
            { emoji: '🚷', name: 'عبور ممنوع', keywords: ['ممنوع'] },
            { emoji: '📵', name: 'موبایل ممنوع', keywords: ['ممنوع'] },
            { emoji: '🔞', name: 'زیر ۱۸ سال ممنوع', keywords: ['ممنوع'] },
            { emoji: '☢️', name: 'رادیواکتیو', keywords: ['خطر'] },
            { emoji: '☣️', name: 'زیست‌خطر', keywords: ['خطر'] },
            { emoji: '💯', name: 'صد', keywords: ['نمره'] },
            { emoji: '🔠', name: 'حروف بزرگ', keywords: ['حروف'] },
            { emoji: '🔡', name: 'حروف کوچک', keywords: ['حروف'] },
            { emoji: '🔢', name: 'اعداد', keywords: ['اعداد'] },
            { emoji: '🔣', name: 'نمادها', keywords: ['نماد'] },
            { emoji: '🔤', name: 'حروف انگلیسی', keywords: ['الفبا'] },
            { emoji: '🅰️', name: 'A', keywords: ['حرف'] },
            { emoji: '🆎', name: 'AB', keywords: ['گروه خونی'] },
            { emoji: '🅱️', name: 'B', keywords: ['حرف'] },
            { emoji: '🆑', name: 'CL', keywords: ['پاک'] },
            { emoji: '🆒', name: 'COOL', keywords: ['باحال'] },
            { emoji: '🆓', name: 'FREE', keywords: ['رایگان'] },
            { emoji: 'ℹ️', name: 'اطلاعات', keywords: ['اطلاعات'] },
            { emoji: '🆔', name: 'ID', keywords: ['شناسه'] },
            { emoji: 'Ⓜ️', name: 'M', keywords: ['حرف'] },
            { emoji: '🆕', name: 'NEW', keywords: ['جدید'] },
            { emoji: '🆖', name: 'NG', keywords: ['بد'] },
            { emoji: '🅾️', name: 'O', keywords: ['گروه خونی'] },
            { emoji: '🆗', name: 'OK', keywords: ['اوکی'] },
            { emoji: '🅿️', name: 'P', keywords: ['پارکینگ'] },
            { emoji: '🆘', name: 'SOS', keywords: ['اضطراری'] },
            { emoji: '🆙', name: 'UP', keywords: ['بالا'] },
            { emoji: '🆚', name: 'VS', keywords: ['مقابل'] },
            { emoji: '🈁', name: 'اینجا', keywords: ['ژاپنی'] },
            { emoji: '🈂️', name: 'سرویس', keywords: ['ژاپنی'] },
            { emoji: '🈷️', name: 'ماه', keywords: ['ژاپنی'] },
            { emoji: '🈶', name: 'دارایی', keywords: ['ژاپنی'] },
            { emoji: '🈯', name: 'رزرو', keywords: ['ژاپنی'] },
            { emoji: '🉐', name: 'تخفیف', keywords: ['ژاپنی'] },
            { emoji: '🈹', name: 'تخفیف', keywords: ['ژاپنی'] },
            { emoji: '🈚', name: 'رایگان', keywords: ['ژاپنی'] },
            { emoji: '🈲', name: 'ممنوع', keywords: ['ژاپنی'] },
            { emoji: '🉑', name: 'قبول', keywords: ['ژاپنی'] },
            { emoji: '🈸', name: 'درخواست', keywords: ['ژاپنی'] },
            { emoji: '🈴', name: 'قبول', keywords: ['ژاپنی'] },
            { emoji: '🈳', name: 'خالی', keywords: ['ژاپنی'] },
            { emoji: '㊗️', name: 'تبریک', keywords: ['ژاپنی'] },
            { emoji: '㊙️', name: 'مخفی', keywords: ['ژاپنی'] },
            { emoji: '🈺', name: 'باز', keywords: ['ژاپنی'] },
            { emoji: '🈵', name: 'پر', keywords: ['ژاپنی'] },
            { emoji: '🔴', name: 'دایره قرمز', keywords: ['دایره'] },
            { emoji: '🟠', name: 'دایره نارنجی', keywords: ['دایره'] },
            { emoji: '🟡', name: 'دایره زرد', keywords: ['دایره'] },
            { emoji: '🟢', name: 'دایره سبز', keywords: ['دایره'] },
            { emoji: '🔵', name: 'دایره آبی', keywords: ['دایره'] },
            { emoji: '🟣', name: 'دایره بنفش', keywords: ['دایره'] },
            { emoji: '🟤', name: 'دایره قهوه‌ای', keywords: ['دایره'] },
            { emoji: '⚫', name: 'دایره سیاه', keywords: ['دایره'] },
            { emoji: '⚪', name: 'دایره سفید', keywords: ['دایره'] },
            { emoji: '🟥', name: 'مربع قرمز', keywords: ['مربع'] },
            { emoji: '🟧', name: 'مربع نارنجی', keywords: ['مربع'] },
            { emoji: '🟨', name: 'مربع زرد', keywords: ['مربع'] },
            { emoji: '🟩', name: 'مربع سبز', keywords: ['مربع'] },
            { emoji: '🟦', name: 'مربع آبی', keywords: ['مربع'] },
            { emoji: '🟪', name: 'مربع بنفش', keywords: ['مربع'] },
            { emoji: '🟫', name: 'مربع قهوه‌ای', keywords: ['مربع'] },
            { emoji: '⬛', name: 'مربع سیاه', keywords: ['مربع'] },
            { emoji: '⬜', name: 'مربع سفید', keywords: ['مربع'] },
            { emoji: '🔶', name: 'لوزی نارنجی', keywords: ['لوزی'] },
            { emoji: '🔷', name: 'لوزی آبی', keywords: ['لوزی'] },
            { emoji: '🔸', name: 'لوزی کوچک نارنجی', keywords: ['لوزی'] },
            { emoji: '🔹', name: 'لوزی کوچک آبی', keywords: ['لوزی'] },
            { emoji: '🔺', name: 'مثلث قرمز بالا', keywords: ['مثلث'] },
            { emoji: '🔻', name: 'مثلث قرمز پایین', keywords: ['مثلث'] },
            { emoji: '💠', name: 'لوزی نقطه‌دار', keywords: ['لوزی'] },
            { emoji: '🔘', name: 'دکمه رادیویی', keywords: ['دکمه'] },
            { emoji: '🔳', name: 'دکمه سفید', keywords: ['دکمه'] },
            { emoji: '🔲', name: 'دکمه سیاه', keywords: ['دکمه'] }
        ]
    };

    // ================ کلاس اصلی EmojiPicker ================
    class EmojiPicker {
        constructor(containerElement, onEmojiSelect) {
            if (!containerElement) {
                throw new Error('Container element is required for EmojiPicker');
            }

            this.container = containerElement;
            this.onEmojiSelect = onEmojiSelect || function(emoji) {};
            this.pickerElement = null;
            this.activeCategory = 'smileys';
            this.searchTimeout = null;
            
            this.init();
        }

        // === مقداردهی اولیه ===
        init() {
            // ایجاد المان اصلی پیکر
            this.pickerElement = document.createElement('div');
            this.pickerElement.className = 'emoji-picker-container';
            this.pickerElement.dir = 'rtl';
            
            // اضافه کردن استایل‌ها
            this.addStyles();
            
            // ساختار HTML
            this.renderPicker();
            
            // رویدادها
            this.attachEvents();
            
            // افزودن به کانتینر
            this.container.appendChild(this.pickerElement);
        }

        // === افزودن استایل‌های CSS ===
        addStyles() {
            const styleId = 'emoji-picker-styles';
            if (document.getElementById(styleId)) return;
            
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* کانتینر اصلی پیکر */
                .emoji-picker-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: var(--card-bg, #ffffff);
                    border-radius: 20px;
                    overflow: hidden;
                    font-family: var(--font-body, 'Vazirmatn', sans-serif);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    border: 1px solid var(--glass-border, rgba(255,255,255,0.8));
                }
                
                /* نوار جستجو */
                .emoji-search-container {
                    padding: 15px;
                    border-bottom: 1px solid rgba(127,127,127,0.1);
                }
                
                .emoji-search-input {
                    width: 100%;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 30px;
                    background: rgba(127,127,127,0.08);
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: var(--text-color, #1a1a1a);
                    outline: none;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                
                .emoji-search-input:focus {
                    background: rgba(127,127,127,0.12);
                    border-color: var(--accent-color, #111);
                    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
                }
                
                /* نوار دسته‌بندی */
                .emoji-categories {
                    display: flex;
                    justify-content: space-around;
                    padding: 10px;
                    border-bottom: 1px solid rgba(127,127,127,0.1);
                    background: rgba(127,127,127,0.02);
                }
                
                .emoji-category-btn {
                    background: none;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-size: 1.3rem;
                    transition: all 0.2s ease;
                    color: var(--text-secondary, #555);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }
                
                .emoji-category-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--text-secondary, #555);
                    transition: all 0.2s ease;
                }
                
                .emoji-category-btn.active {
                    background: var(--accent-color, #667eea);
                    color: white;
                    transform: scale(1.05);
                }
                
                .emoji-category-btn.active .emoji-category-label {
                    color: white;
                }
                
                .emoji-category-btn:hover {
                    background: rgba(102,126,234,0.1);
                    transform: translateY(-2px);
                }
                
                /* شبکه ایموجی‌ها */
                .emoji-grid-container {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 15px;
                    scroll-behavior: smooth;
                }
                
                .emoji-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
                    gap: 8px;
                }
                
                .emoji-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    font-size: 1.7rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: rgba(127,127,127,0.02);
                    border: 1px solid transparent;
                }
                
                .emoji-item:hover {
                    background: rgba(102,126,234,0.1);
                    transform: scale(1.15);
                    border-color: rgba(102,126,234,0.3);
                    box-shadow: 0 5px 15px rgba(102,126,234,0.2);
                }
                
                /* حالت تاریک */
                .dark-mode .emoji-picker-container {
                    background: rgba(30,30,30,0.95);
                    border-color: rgba(255,255,255,0.08);
                }
                
                .dark-mode .emoji-search-input {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                }
                
                .dark-mode .emoji-category-btn {
                    color: rgba(255,255,255,0.6);
                }
                
                .dark-mode .emoji-category-btn.active {
                    background: var(--accent-color, #764ba2);
                    color: white;
                }
                
                .dark-mode .emoji-item {
                    background: rgba(255,255,255,0.03);
                }
                
                .dark-mode .emoji-item:hover {
                    background: rgba(102,126,234,0.3);
                }
                
                /* پیام عدم نتیجه */
                .no-results {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary, #888);
                    font-size: 0.95rem;
                }
                
                /* ریسپانسیو */
                @media (max-width: 480px) {
                    .emoji-category-btn {
                        padding: 8px 10px;
                        font-size: 1.2rem;
                    }
                    
                    .emoji-category-label {
                        display: none;
                    }
                    
                    .emoji-grid {
                        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                    }
                    
                    .emoji-item {
                        font-size: 1.5rem;
                        padding: 6px;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }

        // === رندر پیکر ===
        renderPicker() {
            // جستجو
            const searchHtml = `
                <div class="emoji-search-container">
                    <input type="text" class="emoji-search-input" placeholder="🔍 جستجوی ایموجی..." id="emojiSearchInput">
                </div>
            `;
            
            // دسته‌بندی‌ها
            const categories = [
                { id: 'smileys', icon: '😀', name: 'صورتک‌ها' },
                { id: 'people', icon: '👋', name: 'مردم' },
                { id: 'animals', icon: '🐶', name: 'حیوانات' },
                { id: 'food', icon: '🍔', name: 'غذا' },
                { id: 'travel', icon: '✈️', name: 'سفر' },
                { id: 'activities', icon: '⚽', name: 'فعالیت‌ها' },
                { id: 'objects', icon: '💡', name: 'اشیاء' }
            ];
            
            let categoriesHtml = '<div class="emoji-categories">';
            categories.forEach(cat => {
                const activeClass = cat.id === this.activeCategory ? 'active' : '';
                categoriesHtml += `
                    <button class="emoji-category-btn ${activeClass}" data-category="${cat.id}">
                        ${cat.icon}
                        <span class="emoji-category-label">${cat.name}</span>
                    </button>
                `;
            });
            categoriesHtml += '</div>';
            
            // شبکه ایموجی‌ها
            const gridHtml = `
                <div class="emoji-grid-container" id="emojiGridContainer">
                    ${this.renderEmojiGrid(this.activeCategory)}
                </div>
            `;
            
            this.pickerElement.innerHTML = searchHtml + categoriesHtml + gridHtml;
        }

        // === رندر شبکه ایموجی‌ها ===
        renderEmojiGrid(categoryId) {
            const emojis = EMOJI_DATABASE[categoryId];
            if (!emojis || emojis.length === 0) {
                return '<div class="no-results">ایموجی‌ای یافت نشد</div>';
            }
            
            let grid = '<div class="emoji-grid">';
            emojis.forEach(emojiData => {
                grid += `<div class="emoji-item" data-emoji="${emojiData.emoji}" data-name="${emojiData.name}">${emojiData.emoji}</div>`;
            });
            grid += '</div>';
            
            return grid;
        }

        // === جستجوی ایموجی ===
        searchEmojis(query) {
            if (!query.trim()) {
                // نمایش دسته فعال
                const container = document.getElementById('emojiGridContainer');
                if (container) {
                    container.innerHTML = this.renderEmojiGrid(this.activeCategory);
                }
                return;
            }
            
            query = query.toLowerCase().trim();
            const results = [];
            
            // جستجو در تمام دسته‌ها
            for (const category in EMOJI_DATABASE) {
                const emojis = EMOJI_DATABASE[category];
                const filtered = emojis.filter(emoji => 
                    emoji.name.includes(query) || 
                    emoji.keywords.some(keyword => keyword.includes(query))
                );
                results.push(...filtered);
            }
            
            // نمایش نتایج
            const container = document.getElementById('emojiGridContainer');
            if (container) {
                if (results.length === 0) {
                    container.innerHTML = '<div class="no-results">❌ هیچ ایموجی با این کلمه پیدا نشد</div>';
                } else {
                    let grid = '<div class="emoji-grid">';
                    // محدودیت برای نمایش
                    results.slice(0, 100).forEach(emojiData => {
                        grid += `<div class="emoji-item" data-emoji="${emojiData.emoji}" data-name="${emojiData.name}">${emojiData.emoji}</div>`;
                    });
                    grid += '</div>';
                    if (results.length > 100) {
                        grid += `<div class="no-results" style="padding:15px;">و ${results.length - 100} ایموجی دیگر...</div>`;
                    }
                    container.innerHTML = grid;
                }
            }
        }

        // === رویدادها ===
        attachEvents() {
            // کلیک روی دسته‌بندی
            this.pickerElement.querySelectorAll('.emoji-category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const category = e.currentTarget.dataset.category;
                    this.activeCategory = category;
                    
                    // آپدیت کلاس active
                    this.pickerElement.querySelectorAll('.emoji-category-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    e.currentTarget.classList.add('active');
                    
                    // پاک کردن جستجو
                    const searchInput = this.pickerElement.querySelector('.emoji-search-input');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // رندر ایموجی‌ها
                    const container = document.getElementById('emojiGridContainer');
                    if (container) {
                        container.innerHTML = this.renderEmojiGrid(category);
                    }
                });
            });
            
            // جستجو
            const searchInput = this.pickerElement.querySelector('.emoji-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    if (this.searchTimeout) {
                        clearTimeout(this.searchTimeout);
                    }
                    
                    this.searchTimeout = setTimeout(() => {
                        this.searchEmojis(e.target.value);
                    }, 300); // دیبونس برای عملکرد بهتر
                });
            }
            
            // کلیک روی ایموجی (تفویض رویداد)
            this.pickerElement.addEventListener('click', (e) => {
                const emojiItem = e.target.closest('.emoji-item');
                if (emojiItem) {
                    const emoji = emojiItem.dataset.emoji;
                    if (emoji) {
                        this.onEmojiSelect(emoji);
                    }
                }
            });
        }

        // === متد عمومی برای نمایش پیکر ===
        show() {
            this.pickerElement.style.display = 'flex';
        }

        // === متد عمومی برای مخفی کردن پیکر ===
        hide() {
            this.pickerElement.style.display = 'none';
        }

        // === متد عمومی برای تغییر وضعیت نمایش ===
        toggle() {
            if (this.pickerElement.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }

        // === متد عمومی برای دریافت ایموجی بر اساس دسته ===
        static getEmojisByCategory(category) {
            return EMOJI_DATABASE[category] || [];
        }

        // === متد عمومی برای جستجوی ایموجی ===
        static searchEmojis(query) {
            if (!query) return [];
            
            query = query.toLowerCase().trim();
            const results = [];
            
            for (const category in EMOJI_DATABASE) {
                const emojis = EMOJI_DATABASE[category];
                const filtered = emojis.filter(emoji => 
                    emoji.name.includes(query) || 
                    emoji.keywords.some(keyword => keyword.includes(query))
                );
                results.push(...filtered);
            }
            
            return results;
        }

        // === متد عمومی برای دریافت همه دسته‌بندی‌ها ===
        static getCategories() {
            return [
                { id: 'smileys', name: 'صورتک‌ها', icon: '😀' },
                { id: 'people', name: 'مردم', icon: '👋' },
                { id: 'animals', name: 'حیوانات', icon: '🐶' },
                { id: 'food', name: 'غذا', icon: '🍔' },
                { id: 'travel', name: 'سفر', icon: '✈️' },
                { id: 'activities', name: 'فعالیت‌ها', icon: '⚽' },
                { id: 'objects', name: 'اشیاء', icon: '💡' }
            ];
        }
    }

    // ================ صادر کردن به محیط global ================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EmojiPicker;
    } else {
        global.EmojiPicker = EmojiPicker;
        window.EmojiPicker = EmojiPicker;
    }

})(typeof window !== 'undefined' ? window : this);
