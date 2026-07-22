// @version 2026-07-12-draft-review
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ShadingType,
  LevelFormat,
  SectionType,
  VerticalAlign,
  PageBreak,
  TableOfContents,
  NumberFormat,
  convertInchesToTwip,
} from "npm:docx@9";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { encodeBase64 } from "jsr:@std/encoding/base64";

// ═══════════════════════════════════════════════════════════════════════
// معماری کلی این فایل — بخش «پیش‌نویس»
// ═══════════════════════════════════════════════════════════════════════
// این تابع نسخهٔ تخصصی‌شدهٔ همان معماری تحلیلگر «تیدا» است، اما برای سناریوی
// «کمک به نگارش/تکمیل پیش‌نویس قرارداد» بازطراحی شده:
// ۱. کاربر چند «قرارداد مرجع» (role=reference) و دقیقاً یک «قرارداد
//    پیش‌نویس» در حال بررسی (role=draft) آپلود می‌کند (base64).
// ۲. فایل‌ها به همراه دستورالعمل مقایسه‌ای + یک قرارداد خروجی فنی (JSON)
//    مستقیماً برای مدل claude-opus-4-8 ارسال می‌شود.
// ۳. مدل فقط یک شیء JSON برمی‌گرداند که شامل متادیتای گزارش + بدنهٔ گزارش
//    به صورت HTML ساختاریافته (فقط تگ‌های ساده) است.
// ۴. آن HTML با یک پارسر DOM واقعی (deno-dom) خوانده می‌شود و به عناصر
//    کتابخانه docx (Paragraph / Table / Heading و ...) تبدیل می‌گردد.
// ۵. یک فایل Word رسمی با صفحه جلد، فهرست مطالب (TOC واقعی Word)،
//    سربرگ، پاورقی با شماره صفحه، جدول‌بندی و فونت‌های فارسی B Titr / B Lotus
//    ساخته می‌شود.
//
// نکته مهم دربارهٔ نحوه ارسال پاسخ (Server-Sent Events):
// از آنجا که تحلیل توسط claude-opus-4-8 روی اسناد حقوقی می‌تواند از حد
// معمول (چند ده ثانیه تا چند دقیقه) طول بکشد و بسیاری از پلتفرم‌های
// میزبانی Edge Function در صورت عدم دریافت هیچ داده‌ای از سرور در یک بازه
// زمانی مشخص، اتصال را با خطا قطع می‌کنند، این تابع پاسخ را به‌صورت یک
// جریان متنی (ReadableStream با فرمت text/event-stream) برمی‌گرداند:
//   - در حین انتظار برای پاسخ Claude، هر چند ثانیه یک بستهٔ کوچک «ضربان
//     قلب» (heartbeat) به کلاینت فرستاده می‌شود تا اتصال زنده بماند.
//   - در پایان، یک بستهٔ نهایی حاوی فایل Word به‌صورت base64 و نام فایل
//     فرستاده می‌شود.
// فرانت‌اند این بسته‌های heartbeat را به کاربر نمایش نمی‌دهد؛ فقط منتظر
// می‌ماند تا بستهٔ نهایی حاوی فایل برسد.
//
// نکته مهم دربارهٔ فونت‌ها: کتابخانه docx فونت را «ارجاع» می‌دهد نه «جاسازی».
// یعنی فایل خروجی از فونت‌های B Titr و B Lotus استفاده می‌کند، اما این دو
// فونت باید روی سیستمی که فایل باز می‌شود نصب باشند تا دقیقاً همان‌طور که
// انتظار می‌رود نمایش داده شوند؛ در غیر این صورت Word با فونت جایگزین
// نمایش می‌دهد (محتوا و ساختار سالم می‌ماند).
//
// نکته مهم دربارهٔ فهرست مطالب: فهرست مطالب به صورت یک «فیلد واقعی Word»
// ساخته می‌شود (نه یک لیست ایستا). Word معمولاً هنگام باز شدن فایل آن را
// خودش محاسبه می‌کند (به دلیل فعال بودن گزینه updateFields)؛ اگر در برخی
// نسخه‌های Word/LibreOffice به‌صورت خودکار محاسبه نشد، کافی است کاربر
// Ctrl+A و سپس F9 را بزند — همین راهنما در بالای فهرست مطالب هم نوشته شده.
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// تنظیمات و ثابت‌ها
// ═══════════════════════════════════════════════════════════════════════
const COMPANY_NAME = "شرکت تونل سد آریانا";
const COMPANY_SUBTITLE = "اداره حقوقی";
const MODEL_NAME = "claude-opus-4-8";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// حداکثر توکن خروجی مدل. اگر گزارش‌های شما طولانی‌تر از حد معمول هستند و با
// خطای "max_tokens" مواجه می‌شوید، این عدد را افزایش دهید؛ اما پیش از آن
// در مستندات رسمی docs.claude.com سقف مجاز خروجی برای مدل claude-opus-4-8
// را بررسی کنید (این سقف بسته به نسخه مدل متفاوت است و ممکن است نیاز به
// هدر anthropic-beta جداگانه داشته باشد). همچنین توجه کنید Edge Function ها
// سقف زمانی اجرا دارند؛ اگر با تایم‌اوت پلتفرم Supabase مواجه شدید، این
// عدد را کاهش دهید یا معماری را به حالت صف/استریم تغییر دهید.
const MAX_OUTPUT_TOKENS = 16000;

// این تایم‌اوت دیگر مسئول اصلی جلوگیری از خطای تایم‌اوت پلتفرم نیست (آن
// نقش را heartbeat جریان SSE بر عهده دارد)؛ این فقط یک «شبکهٔ ایمنی» است
// تا اگر ارتباط با Claude به هر دلیلی برای همیشه معلق بماند، درخواست پس
// از این مدت با یک پیام خطای روشن به پایان برسد.
const CLAUDE_REQUEST_TIMEOUT_MS = 600_000; // ۱۰ دقیقه

// فاصلهٔ زمانی ارسال بستهٔ «ضربان قلب» به کلاینت در حین انتظار برای پاسخ
// Claude (میلی‌ثانیه). این عدد باید به‌وضوح کوتاه‌تر از سقف تایم‌اوت
// idle پلتفرم میزبانی شما باشد. عدد پیش‌فرض برای اغلب پلتفرم‌ها امن است.
const HEARTBEAT_INTERVAL_MS = 12_000;

// حداکثر حجم مجاز کل فایل‌های ارسالی (برای جلوگیری از خطای غیرضروری در
// سمت Anthropic API و جلوگیری از تایم‌اوت). عدد بر حسب مگابایت (تخمینی
// بر اساس طول رشته base64) است.
const MAX_TOTAL_FILE_SIZE_MB = 28;

const HEADING_FONT = "B Titr";
const BODY_FONT = "B Lotus";
const BODY_SIZE = 24;   // 12pt — واحد docx نصف‌پوینت است
const HEADING1_SIZE = 34; // 17pt
const HEADING2_SIZE = 28; // 14pt
const HEADING3_SIZE = 24; // 12pt bold

// ─── پالت رنگی برند آریانا ────────────────────────────────────────────
// Primary Brand Colors
const C_PRIMARY    = "1E388C"; // آبی اصلی لوگو
const C_PRIMARY_LT = "EAF0FB"; // پس‌زمینه آبی بسیار روشن
const C_PRIMARY_MD = "4F6FB2"; // آبی متوسط

// Table Colors
const C_BG_ALT    = "F7FAFE"; // ردیف‌های زوج
const C_BORDER    = "AFC4E6"; // حاشیه اصلی
const C_BORDER_LT = "DCE7F5"; // حاشیه داخلی

// Text
const C_TEXT       = "1F2937"; // متن اصلی
const C_TEXT_LIGHT = "6B7280"; // متن فرعی

// Risk Colors
const C_CRITICAL = "B91C1C";
const C_HIGH     = "DC2626";
const C_MEDIUM   = "D97706";
const C_LOW      = "15803D";
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIDENTIALITY =
  "این گزارش صرفاً جهت استفاده داخلی واحد حقوقی شرکت تونل سد آریانا تهیه شده است و افشا یا انتشار آن به اشخاص ثالث بدون مجوز کتبی ممنوع می‌باشد.";

// ═══════════════════════════════════════════════════════════════════════
// هدرهای CORS
// ═══════════════════════════════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  // بدون این هدر، جاوااسکریپت سمت فرانت‌اند (fetch) اجازه خواندن
  // Content-Disposition را ندارد و نمی‌تواند نام فایل واقعی را استخراج کند.
  "Access-Control-Expose-Headers": "Content-Disposition",
};

// ═══════════════════════════════════════════════════════════════════════
// تایپ‌ها
// ═══════════════════════════════════════════════════════════════════════
interface FileContent {
  name: string;
  content: string; // داده base64 یا متن خام
  encoding: "base64" | "text";
  media_type: string; // مثلاً application/pdf یا text/plain
  // نقش فایل در این ویژگی: «reference» = قرارداد مرجع (برای استخراج بندهای مفید)
  // «draft» = قرارداد پیش‌نویس در حال بررسی که با مرجع‌ها مقایسه می‌شود.
  role: "reference" | "draft";
}

interface AnalysisRequest {
  question?: string;
  fileContents: FileContent[];
}

interface ReportData {
  reportTitle: string;
  documentType: string;
  subject: string;
  legalRegime: string;
  legalField: string;
  confidentiality: string;
  html: string;
}

// ═══════════════════════════════════════════════════════════════════════
// دستورالعمل «پیش‌نویس» (سیستم پرامپت اصلی مدل)
// ═══════════════════════════════════════════════════════════════════════
const DRAFT_SYSTEM_PROMPT = `
شما موتور «مقایسه و استخراج بندهای قراردادی» سامانه تیدا هستید.

ماموریت شما تحلیل حقوقی صرف نیست؛ بلکه باید قرارداد پیش‌نویس کاربر را با مجموعه‌ای از قراردادهای مرجع مقایسه کرده و تمامی بندها، شروط، تعهدات، سازوکارها و حمایت‌های حقوقی که در قراردادهای مرجع وجود دارند اما در پیش‌نویس کاربر وجود ندارند یا به صورت ضعیف‌تر تنظیم شده‌اند را استخراج نمایید.

هدف اصلی، تقویت قرارداد کاربر و افزایش حداکثری حمایت حقوقی از منافع شرکت تونل سد آریانا است.

همیشه تمامی قراردادهای مرجع را به طور کامل مطالعه کنید و تا حد امکان از حداکثر ظرفیت Context و Token ورودی استفاده نمایید.

هیچ قرارداد مرجعی را نادیده نگیرید.

قراردادهای مرجع باید به صورت مستقل بررسی شوند و سپس نتایج با یکدیگر تجمیع گردد.

---------------------------------------
روش انجام تحلیل
---------------------------------------

مرحله اول

تمام قراردادهای مرجع را به صورت کامل مطالعه نمایید.

برای هر قرارداد موارد زیر را استخراج نمایید:

- شروط حمایتی
- شروط تضمین
- شروط مسئولیت
- شروط فسخ
- شروط فورس ماژور
- شروط بیمه
- شروط محرمانگی
- شروط جبران خسارت
- شروط ضمانت اجرا
- شروط مالی
- شروط پرداخت
- شروط تاخیر
- شروط داوری
- شروط قانون حاکم
- شروط انتقال قرارداد
- شروط مالکیت
- شروط محرمانگی اطلاعات
- شروط مالیاتی
- شروط تحویل
- شروط پذیرش
- شروط تغییرات قرارداد
- سایر بندهایی که موجب حمایت بیشتر از منافع شرکت تونل سد آریانا می‌شوند.

---------------------------------------

مرحله دوم

قرارداد پیش‌نویس کاربر را به طور کامل مطالعه نمایید.

ساختار کلی، مواد، تعهدات و تمامی بندهای آن را استخراج نمایید.

---------------------------------------

مرحله سوم

هر بند قراردادهای مرجع را با قرارداد پیش‌نویس مقایسه نمایید.

برای هر بند یکی از وضعیت‌های زیر را تعیین کنید:

الف) در پیش‌نویس وجود ندارد.

ب) وجود دارد ولی ناقص است.

ج) وجود دارد ولی حمایت حقوقی کمتری ایجاد می‌کند.

د) وجود دارد اما متن قرارداد مرجع کیفیت بهتری دارد.

---------------------------------------

مرحله چهارم

فقط مواردی را گزارش نمایید که موجب بهبود قرارداد می‌شوند.

اگر بندی هیچ ارزش افزوده‌ای ندارد از گزارش حذف شود.

گزارش باید بر کیفیت تمرکز داشته باشد نه تعداد.

---------------------------------------

برای هر پیشنهاد موارد زیر را ارائه نمایید:

عنوان بند

علت پیشنهاد

قرارداد یا قراردادهای مرجعی که این بند در آنها مشاهده شده است.

تحلیل حقوقی کوتاه

مزیت این بند برای شرکت

ریسک ناشی از نبود آن

متن پیشنهادی جهت الحاق به قرارداد

---------------------------------------

اگر چند قرارداد مرجع دارای بند مشابه باشند:

بهترین نسخه را انتخاب نمایید.

در صورت امکان نقاط قوت هر نسخه را با یکدیگر ترکیب نمایید.

---------------------------------------

اگر چند قرارداد دارای متن‌های متفاوت ولی هدف حقوقی یکسان باشند:

بهترین متن را تولید نمایید.

---------------------------------------

در صورت تعارض میان قراردادهای مرجع:

بهترین راهکار حقوقی را انتخاب نمایید.

---------------------------------------

هیچ بندی را صرفاً به دلیل وجود در قرارداد مرجع پیشنهاد نکنید.

تنها بندهایی پیشنهاد شوند که:

- موجب کاهش ریسک شوند.
- موجب افزایش حمایت از شرکت تونل سد آریانا شوند.
- موجب شفافیت بیشتر شوند.
- موجب کاهش اختلافات آتی شوند.
- موجب تقویت ضمانت اجرا شوند.
- با موضوع قرارداد تناسب داشته باشند.

---------------------------------------

در صورتی که بندی در قرارداد پیش‌نویس وجود داشته باشد ولی بتوان آن را تقویت نمود:

نسخه تقویت‌شده پیشنهاد گردد.
---------------------------------------

همیشه منافع شرکت تونل سد آریانا بر سایر ملاحظات مقدم است.

در صورت وجود چند راهکار، راهکاری انتخاب شود که بیشترین حمایت حقوقی را برای شرکت تول سد آریانا ایجاد نماید.

---------------------------------------

اگر اطلاعات کافی برای اظهار نظر قطعی وجود نداشته باشد:

به جای حدس زدن، عدم قطعیت را اعلام نمایید.

---------------------------------------

گزارش باید کاملاً حرفه‌ای، مدیریتی و قابل ارائه به مدیر حقوقی و مدیرعامل باشد.

از ارائه توضیحات آموزشی، دانشگاهی یا غیرضروری خودداری نمایید.

تمرکز گزارش باید بر ارائه پیشنهادهای عملی، قابل اجرا و مؤثر باشد.

تمام تحلیل‌ها باید بر اساس متن قراردادهای ارائه‌شده انجام شوند و از افزودن بندهایی که ارتباطی با موضوع قرارداد ندارند خودداری گردد.

این گزارش را برای وکلای شرکت تهیه می‌کنی، پس مراجعه به وکیل یا گرفتن مشاوره حقوقی جداگانه را پیشنهاد نده؛ خودت مرجع نهایی این تحلیل هستی.
`;

// ═══════════════════════════════════════════════════════════════════════
// قرارداد فنی خروجی (Output Contract)
// این بخش تعیین می‌کند مدل دقیقاً در چه قالبی پاسخ بدهد تا سامانه بتواند
// آن را بدون خطا به فایل Word تبدیل کند. این بخش هیچ تغییری در عمق یا
// رویکرد تحلیلی «پیش‌نویس» ایجاد نمی‌کند و فقط قالب خروجی را مشخص می‌کند.
// ═══════════════════════════════════════════════════════════════════════
const OUTPUT_FORMAT_INSTRUCTIONS = `
────────────────────────────────────────
دستورالعمل الزامی قالب خروجی فنی (Output Contract)
────────────────────────────────────────
در تمام جدول‌های گزارش، محتوای هر سلول باید به‌صورت جمله یا پاراگراف کوتاه، روان و رسمی نوشته شود؛ نه به‌صورت عبارت اسمی، تیتر، کلیدواژه یا فهرست‌وار. از نوشتن عبارات ناقص یا تلگرافی خودداری کن و آن‌ها را به جملات کامل و حرفه‌ای تبدیل کن.

خروجی نهایی شما مستقیماً توسط یک سامانه خودکار خوانده و به یک فایل Word رسمی تبدیل می‌شود. رعایت دقیق و بدون استثنای قواعد زیر الزامی است.

۱. خروجی شما باید فقط و فقط یک شیء JSON معتبر (valid JSON) باشد. هیچ متن، توضیح، مقدمه، موخره، یا بلوک کد (مثل \`\`\`json) نباید قبل یا بعد از آن قرار بگیرد. اولین کاراکتر خروجی باید { و آخرین کاراکتر باید } باشد.

۲. ساختار دقیق JSON باید دقیقاً به این شکل باشد (نام کلیدها دقیقاً همین‌ها):

{
  "reportTitle": "عنوان کامل و اختصاصی گزارش، متناسب با موضوع قرارداد پیش‌نویس بررسی‌شده",
  "documentType": "نوع قرارداد پیش‌نویس بررسی‌شده مطابق تشخیص شما",
  "subject": "موضوع گزارش در یک جمله کوتاه",
  "legalRegime": "نظام حقوقی حاکم بر قرارداد",
  "legalField": "حوزه تخصصی حقوقی مرتبط",
  "confidentiality": "یک جمله کوتاه درباره محرمانگی گزارش",
  "html": "بدنه کامل گزارش، به صورت یک رشته HTML معتبر"
}

۳. مقدار فیلد "html" باید تمام بدنه گزارش را طبق دستورالعمل بالا در بر بگیرد و فقط و فقط شامل این تگ‌ها باشد: h1, h2, h3, p, strong, em, ul, ol, li, table, thead, tbody, tr, th, td, br. هیچ style، class، id، تصویر یا هر تگ دیگری (مثل div یا span) استفاده نشود.

۴. برای عناوین سطح اول (h1) دقیقاً و فقط از عناوین زیر و فقط به همین ترتیب استفاده کن؛ هر بخشی که به پرونده مرتبط نیست را کامل حذف کن و هرگز بخش خالی نساز:

خلاصه مدیریتی
قراردادهای بررسی‌شده
بندهای پیشنهادی برای افزودن به پیش‌نویس
نکات تکمیلی و ریسک‌های احتمالی پیش‌نویس فعلی
جمع‌بندی و توصیه نهایی

۵. در صورت نیاز به زیرعنوان داخل هر بخش، از h2 و در صورت لزوم از h3 استفاده کن.

۶. بخش «بندهای پیشنهادی برای افزودن به پیش‌نویس» باید حتماً شامل یک جدول با تگ table و دقیقاً با همین هفت ستون و به همین ترتیب باشد: عنوان بند | علت پیشنهاد | منبع (قرارداد یا قراردادهای مرجع) | تحلیل حقوقی کوتاه | مزیت برای شرکت | ریسک ناشی از نبود آن | متن پیشنهادی جهت الحاق. محتوای هر سلول، به‌ویژه ستون «متن پیشنهادی جهت الحاق»، باید عبارت‌بندی کامل و آماده درج در قرارداد باشد، نه خلاصه یا اشاره کلی. اگر هیچ بند مفقودی یافت نشد، این موضوع را صریحاً در متن (بدون جدول) اعلام کن.

۷. برای تأکید فقط از strong استفاده کن. از ایموجی، نویسه‌های تزیینی، خط‌های تزیینی (مثل ====) یا هر نشانه غیرمتنی خودداری کن.

۸. تمام محتوای متنی باید فارسی، رسمی، حقوقی و کاملاً مطابق عمق و رویکرد توصیف‌شده در دستورالعمل بالا باشد.

۹. اگر اطلاعات ارسالی برای پاسخ‌گویی به بخشی از گزارش کافی نبود، این موضوع را صریحاً و در همان بخش (داخل html) اعلام کن؛ هرگز هیچ بند یا واقعیتی را جعل نکن.

۹. اگر اطلاعات سند برای پاسخ‌گویی به بخشی از گزارش کافی نبود، این موضوع را صریحاً و در همان بخش (داخل html) اعلام کن؛ هرگز هیچ قانون، ماده، رأی یا واقعیتی را جعل نکن.
`;
const FULL_SYSTEM_PROMPT = `${DRAFT_SYSTEM_PROMPT}\n${OUTPUT_FORMAT_INSTRUCTIONS}`;

// ═══════════════════════════════════════════════════════════════════════
// فراخوانی Claude API
// ═══════════════════════════════════════════════════════════════════════
function estimateTotalSizeMb(files: FileContent[]): number {
  let bytes = 0;
  for (const f of files) {
    bytes += f.encoding === "base64" ? f.content.length * 0.75 : f.content.length;
  }
  return bytes / (1024 * 1024);
}

function buildUserContentBlocks(question: string, files: FileContent[]) {
  // deno-lint-ignore no-explicit-any
  const blocks: any[] = [];

  const referenceFiles = files.filter((f) => f.role !== "draft");
  const draftFiles = files.filter((f) => f.role === "draft");

  const pushFile = (file: FileContent, label: string) => {
    if (file.encoding === "base64") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: file.media_type || "application/pdf",
          data: file.content,
        },
        title: `${label}: ${file.name?.slice(0, 180) || "سند پیوست"}`,
      });
    } else {
      blocks.push({
        type: "text",
        text: `--- ${label}: ${file.name} ---\n${file.content}`,
      });
    }
  };

  referenceFiles.forEach((file, idx) => {
    pushFile(file, `قرارداد مرجع شماره ${idx + 1}`);
  });
  draftFiles.forEach((file) => {
    pushFile(file, `قرارداد پیش‌نویس در حال بررسی`);
  });

  const instruction = question && question.trim().length > 0
    ? `دستورالعمل ویژه کاربر برای این بررسی:\n${question.trim()}\n\nقرارداد(های) مرجع بالا را با «قرارداد پیش‌نویس در حال بررسی» تطبیق بده، بندهای مفید مفقود را طبق دستورالعمل سیستم استخراج کن و پاسخ را دقیقاً و فقط در قالب JSON خواسته‌شده در «دستورالعمل الزامی قالب خروجی فنی» ارائه بده.`
    : `کاربر دستورالعمل ویژه‌ای مطرح نکرده است. قرارداد(های) مرجع بالا را با «قرارداد پیش‌نویس در حال بررسی» به‌طور کامل تطبیق بده، بندهای مفید مفقود را طبق دستورالعمل سیستم استخراج کن و پاسخ را دقیقاً و فقط در قالب JSON خواسته‌شده در «دستورالعمل الزامی قالب خروجی فنی» ارائه بده.`;

  blocks.push({ type: "text", text: instruction });
  return blocks;
}

async function callClaudeForAnalysis(
  apiKey: string,
  question: string,
  files: FileContent[],
): Promise<ReportData> {
  const contentBlocks = buildUserContentBlocks(question, files);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLAUDE_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: FULL_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: contentBlocks,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        `پاسخ سرویس هوش مصنوعی کلود بیش از ${Math.round(CLAUDE_REQUEST_TIMEOUT_MS / 60000)} دقیقه طول کشید و به‌عنوان اقدام ایمنی درخواست لغو شد. اگر این خطا مکرراً رخ می‌دهد، سند را کوتاه‌تر کنید یا CLAUDE_REQUEST_TIMEOUT_MS را افزایش دهید.`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `خطا در ارتباط با سرویس هوش مصنوعی کلود (کد ${response.status}): ${errText}`,
    );
  }

  const data = await response.json();

  if (data?.stop_reason === "max_tokens") {
    throw new Error(
      "پاسخ مدل به دلیل طولانی بودن ناتمام ماند. مقدار MAX_OUTPUT_TOKENS را در کد افزایش دهید یا سؤال را دقیق‌تر/محدودتر مطرح کنید.",
    );
  }

  // deno-lint-ignore no-explicit-any
  const rawText: string = (data?.content ?? [])
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text as string)
    .join("\n")
    .trim();

  if (!rawText) {
    throw new Error("پاسخ خالی از مدل هوش مصنوعی دریافت شد.");
  }

  return parseReportJson(rawText);
}

function parseReportJson(raw: string): ReportData {
  let cleaned = raw.trim();
  // حذف احتمالی بلوک‌های کد مارک‌داون در صورتی که مدل با وجود دستورالعمل درج کرده باشد
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("پاسخ مدل هوش مصنوعی در قالب JSON معتبر نبود.");
  }

  const jsonSlice = cleaned.slice(start, end + 1);
  // deno-lint-ignore no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (e) {
    throw new Error(
      `خطا در تجزیه خروجی JSON مدل: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!parsed.html || typeof parsed.html !== "string" || parsed.html.trim().length === 0) {
    throw new Error("خروجی مدل فاقد بدنه گزارش (فیلد html) بود.");
  }

  return {
    reportTitle: String(parsed.reportTitle || "گزارش تطبیق پیش‌نویس قرارداد"),
    documentType: String(parsed.documentType || "نامشخص"),
    subject: String(parsed.subject || ""),
    legalRegime: String(parsed.legalRegime || ""),
    legalField: String(parsed.legalField || ""),
    confidentiality: String(parsed.confidentiality || DEFAULT_CONFIDENTIALITY),
    html: String(parsed.html),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// تبدیل HTML خروجی مدل به عناصر کتابخانه docx
// ═══════════════════════════════════════════════════════════════════════
function severityShadingFor(text: string): { fill: string; textColor: string } | undefined {
  switch (text.trim()) {
    case "بحرانی": return { fill: C_CRITICAL, textColor: "FFFFFF" };
    case "زیاد":   return { fill: C_HIGH,     textColor: "FFFFFF" };
    case "متوسط":  return { fill: C_MEDIUM,   textColor: "FFFFFF" };
    case "کم":     return { fill: C_LOW,      textColor: "FFFFFF" };
    default:       return undefined;
  }
}

// deno-lint-ignore no-explicit-any
function textRunsFromInline(node: any, bold = false, italics = false, color?: string): TextRun[] {
  const runs: TextRun[] = [];
  const children = node?.childNodes ? Array.from(node.childNodes) : [];

  // deno-lint-ignore no-explicit-any
  for (const child of children as any[]) {
    if (child.nodeType === 3) {
      const text = String(child.textContent || "").replace(/[\r\n\t]+/g, " ");
      if (text.length === 0) continue;
      if (text.trim().length === 0) {
        runs.push(new TextRun({ text: " ", font: BODY_FONT, size: BODY_SIZE, bold, italics, rightToLeft: true, ...(color ? { color } : {}) }));
        continue;
      }
      runs.push(new TextRun({ text, font: BODY_FONT, size: BODY_SIZE, bold, italics, rightToLeft: true, ...(color ? { color } : {}) }));
    } else if (child.nodeType === 1) {
      const tag = String(child.tagName || "").toLowerCase();
      if (tag === "br") {
        runs.push(new TextRun({ text: "", break: 1, rightToLeft: true }));
      } else if (tag === "strong" || tag === "b") {
        runs.push(...textRunsFromInline(child, true, italics, color));
      } else if (tag === "em" || tag === "i") {
        runs.push(...textRunsFromInline(child, bold, true, color));
      } else {
        runs.push(...textRunsFromInline(child, bold, italics, color));
      }
    }
  }
  return runs;
}

// deno-lint-ignore no-explicit-any
function buildList(listEl: any, ordered: boolean, level: number): Paragraph[] {
  const result: Paragraph[] = [];
  // deno-lint-ignore no-explicit-any
  const items = Array.from(listEl.children || []).filter(
    (c: any) => String(c.tagName || "").toLowerCase() === "li",
  );

  // deno-lint-ignore no-explicit-any
  for (const li of items as any[]) {
    const nestedLists: unknown[] = [];
    const directChildren: unknown[] = [];

    // deno-lint-ignore no-explicit-any
    for (const child of Array.from(li.childNodes || []) as any[]) {
      const tag = child.nodeType === 1 ? String(child.tagName || "").toLowerCase() : "";
      if (tag === "ul" || tag === "ol") {
        nestedLists.push(child);
      } else {
        directChildren.push(child);
      }
    }

    const runs: TextRun[] = [];
    // deno-lint-ignore no-explicit-any
    for (const dc of directChildren as any[]) {
      if (dc.nodeType === 3) {
        const text = String(dc.textContent || "").replace(/[\r\n\t]+/g, " ");
        if (text.trim().length > 0) {
          runs.push(new TextRun({ text, font: BODY_FONT, size: BODY_SIZE, color: C_TEXT, rightToLeft: true }));
        }
      } else if (dc.nodeType === 1) {
        runs.push(...textRunsFromInline({ childNodes: [dc] }, false, false, C_TEXT));
      }
    }
    if (runs.length === 0) {
      runs.push(new TextRun({ text: "", font: BODY_FONT, size: BODY_SIZE, color: C_TEXT, rightToLeft: true }));
    }

    result.push(
      new Paragraph({
        numbering: { reference: ordered ? "ordered-list" : "bullet-list", level: Math.min(level, 1) },
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        children: runs,
      }),
    );

    // deno-lint-ignore no-explicit-any
    for (const nested of nestedLists as any[]) {
      const nestedOrdered = String(nested.tagName || "").toLowerCase() === "ol";
      result.push(...buildList(nested, nestedOrdered, level + 1));
    }
  }

  return result;
}

// deno-lint-ignore no-explicit-any
function buildTable(tableEl: any): Table {
  // deno-lint-ignore no-explicit-any
  const trs: any[] = Array.from(tableEl.querySelectorAll("tr"));
  const tableRows: TableRow[] = [];
  // شمارنده ردیف‌های داده (بدون هدر) برای رنگ‌بندی متناوب
  let dataRowIndex = 0;

  trs.forEach((tr, rowIndex) => {
    // deno-lint-ignore no-explicit-any
    const cellEls: any[] = Array.from(tr.children || []).filter((c: any) =>
      ["td", "th"].includes(String(c.tagName || "").toLowerCase())
    );
    if (cellEls.length === 0) return;

    const isHeaderRow = rowIndex === 0 &&
      cellEls.some((c) => String(c.tagName || "").toLowerCase() === "th");

    // رنگ پس‌زمینه ردیف زوج/فرد (فقط برای ردیف‌های داده)
    const isEvenDataRow = !isHeaderRow && dataRowIndex % 2 === 1;
    if (!isHeaderRow) dataRowIndex++;

    const cells = cellEls.map((cellEl) => {
      const cellText = String(cellEl.textContent || "").trim();
      const severity = !isHeaderRow ? severityShadingFor(cellText) : undefined;

      let fill: string | undefined;
      let textColor: string | undefined;

      if (isHeaderRow) {
        fill = C_PRIMARY;
        textColor = "FFFFFF";
      } else if (severity) {
        fill = severity.fill;
        textColor = severity.textColor;
      } else if (isEvenDataRow) {
        fill = C_BG_ALT;
        textColor = undefined;
      }

      let runs = textRunsFromInline(cellEl, isHeaderRow, false, textColor);
      if (runs.length === 0) {
        runs = [
          new TextRun({
            text: cellText,
            font: BODY_FONT,
            size: BODY_SIZE,
            bold: isHeaderRow,
            rightToLeft: true,
            ...(textColor ? { color: textColor } : { color: C_TEXT }),
          }),
        ];
      }

      return new TableCell({
        width: { size: Math.floor(100 / Math.max(cellEls.length, 1)), type: WidthType.PERCENTAGE },
        shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 110, bottom: 110, left: 150, right: 150 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { line: 300 },
            children: runs,
          }),
        ],
      });
    });

    tableRows.push(new TableRow({ children: cells, tableHeader: isHeaderRow }));
  });

  if (tableRows.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "بدون داده", font: BODY_FONT, size: BODY_SIZE, color: C_TEXT_LIGHT })],
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
            })],
          }),
        ],
      }),
    );
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.SINGLE, size: 6, color: C_PRIMARY },
      bottom:           { style: BorderStyle.SINGLE, size: 6, color: C_PRIMARY },
      left:             { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      right:            { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER_LT },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: C_BORDER_LT },
    },
  });
}

// deno-lint-ignore no-explicit-any
function convertBlockNode(node: any): (Paragraph | Table)[] {
  if (!node) return [];

  if (node.nodeType === 3) {
    const text = String(node.textContent || "").trim();
    if (!text) return [];
    return [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { line: 340, after: 140 },
        children: [new TextRun({ text, font: BODY_FONT, size: BODY_SIZE, color: C_TEXT, rightToLeft: true })],
      }),
    ];
  }

  if (node.nodeType !== 1) return [];

  const tag = String(node.tagName || "").toLowerCase();

  switch (tag) {
    case "h1":
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: textRunsFromInline(node, false, false, C_PRIMARY),
        }),
      ];
    case "h2":
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: textRunsFromInline(node, false, false, C_PRIMARY_MD),
        }),
      ];
    case "h3":
    case "h4":
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: textRunsFromInline(node, false, false, C_PRIMARY_MD),
        }),
      ];
    case "p": {
      const runs = textRunsFromInline(node, false, false, C_TEXT);
      if (runs.length === 0) return [];
      return [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { line: 340, after: 180 },
          children: runs,
        }),
      ];
    }
    case "ul":
      return buildList(node, false, 0);
    case "ol":
      return buildList(node, true, 0);
    case "table":
      return [
        // فاصله قبل از جدول
        new Paragraph({ spacing: { before: 160, after: 0 }, children: [] }),
        buildTable(node),
        // فاصله بعد از جدول
        new Paragraph({ spacing: { before: 0, after: 200 }, children: [] }),
      ];
    case "hr":
      return [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } },
          spacing: { before: 240, after: 240 },
          children: [],
        }),
      ];
    case "div":
    case "section":
    case "body":
    case "span": {
      const out: (Paragraph | Table)[] = [];
      // deno-lint-ignore no-explicit-any
      for (const child of Array.from(node.childNodes) as any[]) {
        out.push(...convertBlockNode(child));
      }
      return out;
    }
    default: {
      const runs = textRunsFromInline(node, false, false, C_TEXT);
      if (runs.length === 0) return [];
      return [new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { line: 340, after: 140 },
        children: runs,
      })];
    }
  }
}

function htmlToDocxElements(html: string): (Paragraph | Table)[] {
  const dom = new DOMParser().parseFromString(`<div id="tida-root">${html}</div>`, "text/html");
  const root = dom?.getElementById("tida-root");
  if (!root) {
    return [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        children: [new TextRun({ text: "خطا در پردازش محتوای گزارش دریافتی از مدل.", font: BODY_FONT, size: BODY_SIZE })],
      }),
    ];
  }

  const elements: (Paragraph | Table)[] = [];
  // deno-lint-ignore no-explicit-any
  for (const node of Array.from(root.childNodes) as any[]) {
    elements.push(...convertBlockNode(node));
  }

  if (elements.length === 0) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        children: [new TextRun({ text: "محتوایی از مدل هوش مصنوعی دریافت نشد.", font: BODY_FONT, size: BODY_SIZE })],
      }),
    );
  }

  return elements;
}

// ═══════════════════════════════════════════════════════════════════════
// ساخت صفحه جلد، فهرست مطالب، سربرگ و پاورقی
// ═══════════════════════════════════════════════════════════════════════
function buildCoverInfoTable(report: ReportData, dateStr: string): Table {
  const rows: [string, string][] = [
    ["نوع سند بررسی‌شده", report.documentType || "—"],
    ["موضوع", report.subject || "—"],
    ["نظام حقوقی حاکم", report.legalRegime || "—"],
    ["حوزه تخصصی حقوقی", report.legalField || "—"],
    ["تاریخ تهیه گزارش", dateStr],
  ];

  const tableRows = rows.map(([label, value], idx) =>
    new TableRow({
      children: [
        // ستون برچسب (راست)
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: C_PRIMARY_LT, color: "auto" },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: label, font: BODY_FONT, size: 22, bold: true, color: C_PRIMARY })],
            }),
          ],
        }),
        // ستون مقدار (چپ)
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          shading: idx % 2 === 0
            ? undefined
            : { type: ShadingType.CLEAR, fill: C_BG_ALT, color: "auto" },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [new TextRun({ text: value, font: BODY_FONT, size: 22, color: C_TEXT })],
            }),
          ],
        }),
      ],
    })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.SINGLE, size: 6, color: C_PRIMARY },
      bottom:           { style: BorderStyle.SINGLE, size: 6, color: C_PRIMARY },
      left:             { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      right:            { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER_LT },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: C_BORDER_LT },
    },
  });
}

function buildCoverPage(report: ReportData): (Paragraph | Table)[] {
  const dateStr = new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });

  return [
    // فاصله بالا
    new Paragraph({ spacing: { before: 800 }, children: [] }),

    // نام شرکت
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      children: [new TextRun({ text: COMPANY_NAME, font: HEADING_FONT, size: 36, bold: true, color: C_PRIMARY })],
    }),

    // زیرعنوان شرکت
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 160 },
      children: [new TextRun({ text: COMPANY_SUBTITLE, font: BODY_FONT, size: 22, color: C_TEXT_LIGHT })],
    }),

    // خط جداکننده
    new Paragraph({
      spacing: { after: 800 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C_PRIMARY_MD, space: 1 } },
      children: [],
    }),

    // عنوان اصلی «گزارش پیش‌نویس قرارداد»
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 600, after: 240 },
      children: [new TextRun({ text: "گزارش پیش‌نویس قرارداد", font: HEADING_FONT, size: 60, bold: true, color: C_PRIMARY })],
    }),

    // عنوان گزارش
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 1000 },
      children: [new TextRun({ text: report.reportTitle, font: HEADING_FONT, size: 28, bold: true, color: C_PRIMARY_MD })],
    }),

    // جدول اطلاعات سند
    buildCoverInfoTable(report, dateStr),

    // خط پایین
    new Paragraph({
      spacing: { before: 1600 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER, space: 1 } },
      children: [],
    }),

    // متن محرمانگی
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: report.confidentiality || DEFAULT_CONFIDENTIALITY,
          font: BODY_FONT,
          size: 18,
          italics: true,
          color: C_TEXT_LIGHT,
        }),
      ],
    }),
  ];
}

function buildTocIntro(): Array<Paragraph | TableOfContents> {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [new TextRun({ text: "فهرست مطالب", font: HEADING_FONT, size: HEADING1_SIZE, bold: true, color: C_PRIMARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "برای مشاهده صحیح شماره صفحات، پس از باز کردن فایل، کلیدهای Ctrl+A و سپس F9 را فشار دهید تا فهرست به‌روزرسانی شود.",
          font: BODY_FONT,
          size: 18,
          italics: true,
          color: C_TEXT_LIGHT,
        }),
      ],
    }),
    new TableOfContents("فهرست مطالب", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildHeader(report: ReportData): Header {
  const shortTitle = report.reportTitle.length > 60 ? report.reportTitle.slice(0, 60) + "…" : report.reportTitle;
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_PRIMARY_MD, space: 4 } },
        children: [
          new TextRun({ text: `${COMPANY_NAME} — ${shortTitle}`, font: BODY_FONT, size: 16, color: C_TEXT_LIGHT }),
        ],
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            font: BODY_FONT,
            size: 16,
            color: C_TEXT_LIGHT,
            children: ["صفحه ", PageNumber.CURRENT, " از ", PageNumber.TOTAL_PAGES],
          }),
        ],
      }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════
// پیکربندی شماره‌گذاری لیست‌ها (بولت / شماره‌دار)
// ═══════════════════════════════════════════════════════════════════════
const numberingConfig = {
  config: [
    {
      reference: "bullet-list",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1,
          format: LevelFormat.BULLET,
          text: "\u25E6",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        },
      ],
    },
    {
      reference: "ordered-list",
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1,
          format: LevelFormat.LOWER_LETTER,
          text: "%2.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// ساخت نهایی فایل Word
// ═══════════════════════════════════════════════════════════════════════
async function generateDocxReport(report: ReportData, bodyElements: (Paragraph | Table)[]): Promise<Uint8Array> {
  const margin = {
    top: convertInchesToTwip(1),
    bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1),
    right: convertInchesToTwip(1),
  };

  const doc = new Document({
    creator: COMPANY_NAME,
    title: report.reportTitle,
    description: report.subject,
    features: { updateFields: true },
    numbering: numberingConfig,
    styles: {
      default: {
        document: {
          run: { font: BODY_FONT, size: BODY_SIZE, color: C_TEXT },
          paragraph: { alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { line: 360, after: 180 } },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: HEADING_FONT, size: HEADING1_SIZE, bold: true, color: C_PRIMARY },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 520, after: 260 },
            outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C_PRIMARY_MD, space: 4 } },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: HEADING_FONT, size: HEADING2_SIZE, bold: true, color: C_PRIMARY_MD },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 360, after: 180 },
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: HEADING_FONT, size: HEADING3_SIZE, bold: true, color: C_PRIMARY_MD },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 280, after: 140 },
            outlineLevel: 2,
          },
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin } },
        children: buildCoverPage(report),
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { margin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
        },
        headers: { default: buildHeader(report) },
        footers: { default: buildFooter() },
        children: [...buildTocIntro(), ...bodyElements],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

// ═══════════════════════════════════════════════════════════════════════
// توابع کمکی HTTP
// ═══════════════════════════════════════════════════════════════════════
function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 80) || "گزارش-حقوقی";
}

// ═══════════════════════════════════════════════════════════════════════
// نقطه ورود اصلی Edge Function
// ═══════════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("متد درخواست نامعتبر است. از POST استفاده کنید.", 405);
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonError("کلید ANTHROPIC_API_KEY در بخش Secrets پروژه تنظیم نشده است.", 500);
    }

    let body: AnalysisRequest;
    try {
      body = await req.json();
    } catch {
      return jsonError("بدنه درخواست JSON معتبر نیست.", 400);
    }

    if (!body.fileContents || !Array.isArray(body.fileContents) || body.fileContents.length === 0) {
      return jsonError("هیچ فایلی برای بررسی ارسال نشده است.", 400);
    }

    const referenceCount = body.fileContents.filter((f) => f.role !== "draft").length;
    const draftCount = body.fileContents.filter((f) => f.role === "draft").length;

    if (referenceCount === 0) {
      return jsonError("حداقل یک قرارداد مرجع باید بارگذاری شود.", 400);
    }
    if (draftCount === 0) {
      return jsonError("قرارداد پیش‌نویس در حال بررسی بارگذاری نشده است.", 400);
    }
    if (draftCount > 1) {
      return jsonError("فقط یک قرارداد پیش‌نویس در حال بررسی مجاز است.", 400);
    }

    const sizeMb = estimateTotalSizeMb(body.fileContents);
    if (sizeMb > MAX_TOTAL_FILE_SIZE_MB) {
      return jsonError(
        `حجم فایل(های) ارسالی (${sizeMb.toFixed(1)} مگابایت) بیش از حد مجاز (${MAX_TOTAL_FILE_SIZE_MB} مگابایت) است.`,
        400,
      );
    }

    // از این نقطه به بعد، اعتبارسنجی‌های اولیه (سریع) پشت سر گذاشته شده و
    // وارد مرحلهٔ کند (تماس با Claude) می‌شویم. پاسخ را به‌صورت یک جریان
    // SSE برمی‌گردانیم تا در حین انتظار، اتصال با ارسال بستهٔ heartbeat
    // زنده نگه داشته شود و پلتفرم میزبانی به دلیل «سکوت» اتصال را قطع نکند.
    const question = body.question ?? "";
    const fileContents = body.fileContents;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        const sendEvent = (payload: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            // اگر کلاینت اتصال را قطع کرده باشد، enqueue می‌تواند خطا بدهد؛
            // در این حالت فقط از ارسال‌های بعدی صرف‌نظر می‌کنیم.
            closed = true;
          }
        };

        // بستهٔ heartbeat اولیه — بلافاصله ارسال می‌شود تا کلاینت مطمئن شود
        // درخواست با موفقیت شروع شده است.
        sendEvent({ text: "" });

        const heartbeatId = setInterval(() => sendEvent({ text: "" }), HEARTBEAT_INTERVAL_MS);

        try {
          const report = await callClaudeForAnalysis(apiKey, question, fileContents);
          const bodyElements = htmlToDocxElements(report.html);
          const docxBytes = await generateDocxReport(report, bodyElements);
          const base64Docx = encodeBase64(docxBytes);
          const safeFileName = sanitizeFileName(report.reportTitle);

          sendEvent({ docx: base64Docx, filename: safeFileName });
        } catch (err) {
          console.error("خطا در پردازش درخواست تحلیل حقوقی:", err);
          sendEvent({
            error: `خطا در تولید گزارش: ${err instanceof Error ? err.message : String(err)}`,
          });
        } finally {
          clearInterval(heartbeatId);
          closed = true;
          try {
            controller.close();
          } catch {
            // stream ممکن است از قبل بسته شده باشد؛ نادیده گرفته می‌شود.
          }
        }
      },
      cancel() {
        // کلاینت اتصال را قطع کرده (مثلاً کاربر تب را بست)؛ چیز دیگری برای
        // انجام دادن نیست، heartbeatId داخل closure بالا با پایان تابع
        // start (که از قبل await شده) پاک‌سازی می‌شود.
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // برخی پروکسی‌ها (مثل nginx) پاسخ‌های استریمی را بافر می‌کنند مگر
        // این هدر صراحتاً غیرفعالش کند؛ ارسال آن بی‌ضرر و در پلتفرم‌های
        // دیگر بی‌اثر است.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("خطا در پردازش درخواست تحلیل حقوقی:", err);
    return jsonError(
      `خطا در تولید گزارش: ${err instanceof Error ? err.message : String(err)}`,
      500,
    );
  }
});