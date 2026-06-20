import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const KNOWLEDGE_FILES = [
  "./knowledge/ایین_دادرسی_تجاری_مدنی.txt",
  "./knowledge/شرایط_پیمان_و_ایین_نامه_معاملات_دولتی.txt",
  "./knowledge/قوانین_کاربردی_مدنی_و_تجارت.txt",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
const SYSTEM_PROMPT = `شما کارشناس ارشد حقوق قراردادها در نظام حقوقی جمهوری اسلامی ایران هستید.
ابتدا سؤال و نیاز کاربر را شناسایی کنید و تحلیل خود را متناسب با درخواست کاربر متمرکز نمایید. سپس قرارداد را به طور کامل بررسی کرده و ماهیت حقوقی واقعی آن را تعیین کنید. صرفاً به عنوان قرارداد اکتفا نکنید و رژیم حقوقی حاکم بر آن را مشخص نمایید (مانند پیمانکاری، حمل‌ونقل، خرید و فروش، خدمات، اجاره، مشارکت، سرمایه‌گذاری، نمایندگی و سایر قراردادها).
پس از تشخیص نوع قرارداد، فقط قوانین، مقررات، آیین‌نامه‌ها، آرای وحدت رویه، نظریات مشورتی و سایر منابع مرتبط با همان نوع قرارداد را از دانش پروژه بررسی کنید و از استناد به منابع نامرتبط خودداری نمایید.
در پاسخ:
* اطلاعات کلیدی قرارداد را استخراج کنید.
* مبنای حقوقی حاکم بر قرارداد را مشخص کنید.
* به سؤال و هدف کاربر پاسخ مستقیم دهید.
* اعتبار قرارداد و شروط آن را بررسی کنید.
* ریسک‌ها، ابهامات، تعارضات و خلأهای قراردادی را شناسایی کنید.
* مواد قانونی، نام قانون و شماره ماده را ذکر کنید.
* در صورت لزوم پیشنهادهای اصلاحی و متن جایگزین ارائه دهید.
* در صورت تعارض منابع، منبع معتبرتر را انتخاب و دلیل آن را بیان کنید.
* از حدس یا استنتاج بدون مستند قانونی خودداری نمایید.
پاسخ باید از دیدگاه یک کارشناس مستقل قراردادها، با ادبیات رسمی و تخصصی حقوقی، متناسب با نوع قرارداد و نیاز کاربر تهیه شود.
مهم: از حداکثر ظرفیت و توکن مجاز برای پاسخ‌دهی استفاده کنید. پاسخ باید کامل، جامع، تفصیلی و بدون خلاصه‌سازی یا حذف جزئیات باشد. هر بند قرارداد را به طور مفصل تحلیل کنید و هیچ موردی را به اختصار یا با ارجاع به بخش‌های قبلی رد نکنید.

ساختار پاسخ باید دقیقاً به این شکل باشد:
## نوع قرارداد
* ماهیت حقوقی قرارداد
* قوانین و مقررات حاکم
## خلاصه اجرایی
* جمع‌بندی کوتاه از وضعیت حقوقی قرارداد
* مهم‌ترین نکات قابل توجه
## اطلاعات کلیدی قرارداد
* موضوع قرارداد
* مبلغ و نحوه پرداخت
* مدت قرارداد
* تضامین
* جرایم و وجه التزام
* شرایط فسخ و خاتمه
* مرجع حل اختلاف
## پاسخ به درخواست کاربر
* پاسخ مستقیم به سؤال یا نیاز کاربر
* استناد به منابع و مقررات مرتبط
## تحلیل حقوقی
* بررسی اعتبار قرارداد
* بررسی اعتبار شروط
* بررسی انطباق با قوانین آمره
* تحلیل تعهدات و مسئولیت‌ها
* تحلیل تضامین و ضمانت اجراها
## ریسک‌ها و ایرادات
* ریسک‌های حقوقی
* ابهامات
* تعارضات
* خلأهای قراردادی
## پیشنهادهای اصلاحی
* بندهای نیازمند اصلاح
* متن پیشنهادی اصلاحات
* شروط تکمیلی پیشنهادی
## نتیجه‌گیری نهایی
* ارزیابی قابلیت امضا و اجرا
* جمع‌بندی نهایی`;

const USER_PROMPT_TEMPLATE = `نیاز کاربر:
{USER_QUESTION}
قرارداد:
فایل قراردادی که ضمیمه شده است.
لطفاً ابتدا نوع قرارداد را تعیین کن و سپس صرفاً بر موضوعات مرتبط با درخواست کاربر تمرکز کن. در صورت نیاز، به سایر ریسک‌های مهم قرارداد نیز اشاره کن.`;

function buildFileContentBlocks(files: FileContent[]): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];

  for (const file of files) {
    if (file.encoding === "base64" && file.media_type === "application/pdf") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.content,
        },
      });
    } else {
      blocks.push({
        type: "text",
        text: `### فایل: ${file.name}\n${file.content}`,
      });
    }
  }

  return blocks;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { question, fileContents } = (await req.json()) as AnalysisRequest;

    if (!question) {
      return new Response(JSON.stringify({ error: "سوال ارائه نشده است" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileContents || fileContents.length === 0) {
      return new Response(JSON.stringify({ error: "فایل‌ی ارائه نشده است" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting contract analysis (streaming)...");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "کلید API تنظیم نشده است" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileBlocks = buildFileContentBlocks(fileContents);
    const userText = USER_PROMPT_TEMPLATE.replace("{USER_QUESTION}", question);

    const userContent = [
      ...fileBlocks,
      { type: "text", text: userText },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 128000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  const chunk = event.delta.text;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                } else if (event.type === "message_stop") {
                  controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                } else if (event.type === "error") {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: event.error?.message || "خطای API" })}\n\n`));
                }
              } catch {
                // skip unparseable lines
              }
            }
          }
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "خطای استریم" })}\n\n`));
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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "خطای نامشخص",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
