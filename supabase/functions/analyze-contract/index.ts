import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ═══════════════════════════════════════════════════════
// فایل‌های پایگاه دانش حقوقی
// ═══════════════════════════════════════════════════════
const KNOWLEDGE_FILES = [
  "./knowledge/ایین_دادرسی_تجاری_مدنی.txt",
  "./knowledge/شرایط_پیمان_و_ایین_نامه_معاملات_دولتی.txt",
  "./knowledge/قوانین_کاربردی_مدنی_و_تجارت.txt",
];

// ═══════════════════════════════════════════════════════
// هدرهای CORS
// ═══════════════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ═══════════════════════════════════════════════════════
// تایپ‌ها
// ═══════════════════════════════════════════════════════
interface FileContent {
  name: string;
  content: string;
  encoding: "base64" | "text";
  media_type: string;
}

interface AnalysisRequest {
  question: string;
  fileContents: FileContent[];
}

// ═══════════════════════════════════════════════════════
// سیستم پرامپت مدل اول — استخراج منابع حقوقی
// ═══════════════════════════════════════════════════════
const RETRIEVAL_SYSTEM_PROMPT = `
شما موتور استخراج منابع حقوقی هستید.

وظیفه شما تحلیل یا پاسخگویی نیست.

ورودی شما شامل:

1- سوال کاربر
2- متن قرارداد
3- منابع حقوقی پروژه

است.

وظیفه:

فقط مواد قانونی، مقررات، آیین نامه ها، شروط عمومی پیمان و مستندات حقوقی مرتبط را پیدا کن.

خروجی باید فقط شامل:

- نام منبع
- شماره ماده
- متن ماده

باشد.

هیچ تحلیل یا توضیحی ننویس.
`;

// ═══════════════════════════════════════════════════════
// سیستم پرامپت مدل دوم — تحلیل قرارداد
// *** این بخش را با متن دلخواه خود پر کنید ***
// ═══════════════════════════════════════════════════════
const ANALYSIS_SYSTEM_PROMPT = `شما مشاور ارشد قراردادها و مدیریت ریسک حقوقی در نظام حقوقی جمهوری اسلامی ایران هستید.

فرض پایه این است که کاربر نماینده یا مدیر شرکت کارفرما است.

هدف شما تحلیل قرارداد از منظر منافع کارفرما و شناسایی ریسک‌های حقوقی، مالی، اجرایی و قراردادی است.

شما نباید صرفاً قرارداد را شرح دهید؛ بلکه باید بررسی کنید آیا قرارداد برای کارفرما ایمن است یا خیر.

منابع حقوقی استخراج‌شده از دانش پروژه، مبنای اصلی استناد شما هستند. در کنار آن از دانش تخصصی خود نیز استفاده کنید.

قوانین و مقررات فقط زمانی استناد شوند که با موضوع قرارداد مرتبط باشند.

--------------------------------------------------
روش تحلیل
--------------------------------------------------

ابتدا نوع واقعی قرارداد را تشخیص بده.

سپس نقش هر یک از طرفین را مشخص کن.

بررسی کن آیا کاربر در موقعیت کارفرما قرار دارد یا خیر.

در ادامه فقط موارد مهم و مؤثر بر منافع کارفرما را تحلیل کن.

از تحلیل خط به خط تمام بندها خودداری کن مگر اینکه بندی دارای ریسک مهم باشد.

--------------------------------------------------
مواردی که باید بررسی شوند
--------------------------------------------------

1- ریسک‌های مالی

- ابهام در مبلغ
- نحوه پرداخت
- پیش پرداخت
- تعدیل
- خسارت‌های مالی
- افزایش هزینه‌های احتمالی

2- ریسک‌های اجرایی

- ابهام در موضوع قرارداد
- عدم تعیین دقیق تعهدات طرف مقابل
- نبود شاخص ارزیابی عملکرد
- نبود زمان‌بندی دقیق

3- ریسک‌های حقوقی

- شروط غیرمتعارف
- شروط یک‌طرفه به نفع طرف مقابل
- تعارض با قوانین آمره
- مسئولیت‌های نامحدود کارفرما

4- تضامین

- کافی بودن تضامین
- ضمانت‌نامه‌ها
- حسن انجام کار
- خسارت تأخیر
- وجه التزام

5- فسخ و خاتمه

- امکان خروج کارفرما از قرارداد
- شرایط فسخ
- آثار فسخ
- ریسک‌های ناشی از خاتمه

6- حل اختلاف

- داوری
- دادگاه صالح
- هزینه‌های احتمالی پیگیری

--------------------------------------------------
قواعد پاسخ
--------------------------------------------------

فقط ریسک‌های مهم را گزارش کن.

موارد کم‌اهمیت را حذف کن.

برای هر ریسک:

- شدت ریسک را مشخص کن
  (کم / متوسط / زیاد / بحرانی)

- توضیح بده چرا برای کارفرما خطرناک است.

- در صورت امکان راهکار اصلاحی ارائه کن.

- متن جایگزین قراردادی پیشنهاد بده.

در صورت وجود مستند قانونی:

- نام قانون
- شماره ماده
- متن یا خلاصه ماده

را ذکر کن.

اگر قرارداد از منظر کارفرما مناسب باشد نیز صریحاً اعلام کن.

--------------------------------------------------
ساختار پاسخ
--------------------------------------------------

# خلاصه قرارداد

- نوع قرارداد
- موضوع قرارداد
- مبلغ قرارداد
- مدت قرارداد
- طرفین قرارداد
- مهم‌ترین تعهدات

# جمع‌بندی مدیریتی

در حداکثر 10 خط:

- وضعیت کلی قرارداد
- مهم‌ترین نقاط قوت
- مهم‌ترین نقاط ضعف
- توصیه کلی برای امضا یا عدم امضا

# ریسک‌های مهم کارفرما

برای هر ریسک:

## ریسک شماره X

- سطح ریسک:
- محل ریسک در قرارداد:
- توضیح:
- مستند قانونی:
- پیشنهاد اصلاحی:

# بندهای نیازمند اصلاح

فهرست بندهایی که قبل از امضا باید اصلاح شوند.

# متن پیشنهادی اصلاحات

برای هر بند مهم متن جایگزین حقوقی ارائه کن.

# نتیجه نهایی

یکی از این سه حالت را اعلام کن:

1- قابل امضا
2- قابل امضا پس از اصلاح
3- توصیه نمی‌شود `;

// ═══════════════════════════════════════════════════════
// بارگذاری فایل‌های دانش از روی دیسک
// ═══════════════════════════════════════════════════════
async function loadKnowledgeFiles(): Promise<string> {
  const contents: string[] = [];

  for (const filePath of KNOWLEDGE_FILES) {
    try {
      const text = await Deno.readTextFile(filePath);

      contents.push(`
========================
منبع: ${filePath}
========================

${text}
`);
    } catch (error) {
      console.error(`Knowledge file error: ${filePath}`, error);
    }
  }

  return contents.join("\n\n");
}

// ═══════════════════════════════════════════════════════
// ساخت بلوک‌های محتوای Anthropic از فایل‌های آپلودی
// (پشتیبانی از PDF به صورت document block و سایر فرمت‌ها به صورت text)
// ═══════════════════════════════════════════════════════
function buildFileContentBlocks(files: FileContent[]): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];

  for (const file of files) {
    if (file.encoding === "base64" && file.media_type === "application/pdf") {
      // ── PDF: ارسال به صورت document block تا مدل بتواند محتوا را بخواند ──
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.content,
        },
      });
    } else {
      // ── سایر فرمت‌ها (DOCX استخراج‌شده، TXT و ...): ارسال به صورت text ──
      blocks.push({
        type: "text",
        text: `### فایل: ${file.name}\n${file.content}`,
      });
    }
  }

  return blocks;
}

// ═══════════════════════════════════════════════════════
// مرحله اول: استخراج مواد قانونی مرتبط با مدل اول
// ═══════════════════════════════════════════════════════
async function retrieveLegalSources(
  apiKey: string,
  question: string,
  contractFiles: FileContent[],
): Promise<string> {

  const knowledgeBase = await loadKnowledgeFiles();

  // ── ساخت بلوک‌های فایل (با پشتیبانی صحیح از PDF) ──
  // باگ قبلی: content فایل‌های PDF به صورت base64 خام join می‌شد که برای مدل قابل خواندن نبود
  const fileBlocks = buildFileContentBlocks(contractFiles);

  const userContent = [
    // ابتدا فایل‌های قرارداد (PDF یا متن)
    ...fileBlocks,
    // سپس سوال کاربر و منابع حقوقی
    {
      type: "text",
      text: `
سوال کاربر:
${question}

==================
منابع حقوقی پروژه
==================
${knowledgeBase}

وظیفه: فقط مواد قانونی، مقررات و آیین‌نامه‌های مرتبط با این قرارداد و سوال کاربر را از منابع بالا استخراج کن.
`,
    },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8", // مدل اول: سریع و کارآمد برای استخراج منابع
      max_tokens: 16000,
      system: RETRIEVAL_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`خطا در مرحله استخراج منابع حقوقی: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const extractedText = result.content?.[0]?.text;

  if (!extractedText) {
    throw new Error("مدل اول پاسخی ارائه نداد");
  }

  return extractedText;
}

// ═══════════════════════════════════════════════════════
// هندلر اصلی Edge Function
// ═══════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {

  // پاسخ به preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {

    // ── پارس کردن بدنه درخواست ──
    let body: AnalysisRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "فرمت درخواست نامعتبر است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { question, fileContents } = body;

    // ── اعتبارسنجی ورودی‌ها ──
    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: "سوال ارائه نشده است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(fileContents) || fileContents.length === 0) {
      return new Response(
        JSON.stringify({ error: "فایل قراردادی ارائه نشده است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── دریافت کلید API ──
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "کلید API پیکربندی نشده است" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // مرحله اول: استخراج منابع حقوقی مرتبط
    // ════════════════════════════════════════════
    console.log("Stage 1: Retrieving relevant legal sources...");

    let legalSources: string;
    try {
      legalSources = await retrieveLegalSources(apiKey, question, fileContents);
      console.log("Stage 1 completed. Legal sources retrieved successfully.");
      console.log("Preview:", legalSources.slice(0, 300) + "...");
    } catch (retrievalError) {
      console.error("Stage 1 failed:", retrievalError);
      return new Response(
        JSON.stringify({
          error: retrievalError instanceof Error
            ? retrievalError.message
            : "خطا در استخراج منابع حقوقی",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════
    // مرحله دوم: تحلیل جامع قرارداد با مدل دوم (streaming)
    // ════════════════════════════════════════════
    console.log("Stage 2: Starting contract analysis with streaming...");

    // ── ساخت محتوای کاربر برای مدل دوم ──
    // باگ قبلی: legalSources استخراج می‌شد ولی هرگز به مدل دوم پاس داده نمی‌شد!
    const fileBlocks = buildFileContentBlocks(fileContents);

    const userContent = [
      // فایل‌های قرارداد (برای خواندن مستقیم توسط مدل)
      ...fileBlocks,
      // مواد قانونی استخراج‌شده در مرحله اول + سوال کاربر
      {
        type: "text",
        text: `
==========================================
مواد قانونی و منابع حقوقی مرتبط (استخراج‌شده)
==========================================
${legalSources}
==========================================

نیاز کاربر:
${question}

قرارداد در فایل‌های ضمیمه‌شده آمده است.
لطفاً ابتدا نوع قرارداد را تعیین کن و سپس بر اساس سوال کاربر و مواد قانونی استخراج‌شده، تحلیل جامع ارائه بده.
در صورت نیاز، به سایر ریسک‌های مهم قرارداد نیز اشاره کن.
`,
      },
    ];

    const analysisResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8", // مدل دوم: قوی‌ترین مدل برای تحلیل جامع
        max_tokens: 64000,
        stream: true,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      throw new Error(`خطا در مرحله تحلیل قرارداد: ${analysisResponse.status} - ${errorText}`);
    }

    // ── استریم کردن پاسخ به کلاینت ──
    const stream = new ReadableStream({
      async start(controller) {
        const reader = analysisResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const enqueue = (data: string) => {
          controller.enqueue(new TextEncoder().encode(data));
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);

                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta"
                ) {
                  enqueue(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
                } else if (event.type === "message_stop") {
                  enqueue(`data: [DONE]\n\n`);
                } else if (event.type === "error") {
                  enqueue(`data: ${JSON.stringify({ error: event.error?.message || "خطای API" })}\n\n`);
                }
              } catch {
                // خطوط غیرقابل پارس را نادیده می‌گیریم
              }
            }
          }

          enqueue(`data: [DONE]\n\n`);
          controller.close();
        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : "خطای استریم";
          enqueue(`data: ${JSON.stringify({ error: msg })}\n\n`);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "خطای نامشخص",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});