import { useState, useRef } from 'react';
import {
  X,
  FileText,
  Loader,
  Download,
  Sparkles,
  Paperclip,
  GitCompare,
  Layers,
  FileCheck2,
  Send,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  encoding: 'base64' | 'text';
  media_type: string;
}

interface ResultItem {
  id: string;
  status: 'loading' | 'done' | 'error';
  referenceNames: string[];
  draftName: string;
  timestamp: string;
  docxUrl?: string;
  docxFilename?: string;
  errorMessage?: string;
  // پیام متنی برای زمانی که هیچ بند ارزش‌افزایی پیدا نشده و فایلی ساخته نمی‌شود
  message?: string;
}

async function fileToUploadedFile(file: File): Promise<UploadedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (ext === 'pdf') {
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return {
      id: Date.now().toString() + Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
      content: base64,
      encoding: 'base64',
      media_type: 'application/pdf',
    };
  }

  if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      id: Date.now().toString() + Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
      content: result.value,
      encoding: 'text',
      media_type: 'text/plain',
    };
  }

  const textContent = await file.text();
  return {
    id: Date.now().toString() + Math.random().toString(36),
    name: file.name,
    size: file.size,
    type: file.type,
    content: textContent,
    encoding: 'text',
    media_type: 'text/plain',
  };
}

export default function DraftReview() {
  const navigate = useNavigate();

  const [referenceFiles, setReferenceFiles] = useState<UploadedFile[]>([]);
  const [draftFile, setDraftFile] = useState<UploadedFile | null>(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const referenceInputRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = referenceFiles.length > 0 && !!draftFile && !loading;

  const handleLogoClick = () => {
    if (loading) return;
    if (results.length > 0 || referenceFiles.length > 0 || draftFile) {
      setShowExitConfirm(true);
    } else {
      navigate('/');
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploaded = await Promise.all(files.map(fileToUploadedFile));
    setReferenceFiles((prev) => [...prev, ...uploaded]);
    if (referenceInputRef.current) referenceInputRef.current.value = '';
  };

  const handleDraftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await fileToUploadedFile(file);
    setDraftFile(uploaded);
    if (draftInputRef.current) draftInputRef.current.value = '';
  };

  const removeReferenceFile = (id: string) => {
    setReferenceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const removeDraftFile = () => {
    setDraftFile(null);
  };

  const resetForm = () => {
    setReferenceFiles([]);
    setDraftFile(null);
    setInstructions('');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !draftFile) return;

    const resultId = Date.now().toString();
    const referenceNames = referenceFiles.map((f) => f.name);
    const draftName = draftFile.name;

    setResults((prev) => [
      {
        id: resultId,
        status: 'loading',
        referenceNames,
        draftName,
        timestamp: new Date().toLocaleString('fa-IR'),
      },
      ...prev,
    ]);
    setLoading(true);

    try {
      const fileContents = [
        ...referenceFiles.map((f) => ({
          name: f.name,
          content: f.content,
          encoding: f.encoding,
          media_type: f.media_type,
          role: 'reference' as const,
        })),
        {
          name: draftFile.name,
          content: draftFile.content,
          encoding: draftFile.encoding,
          media_type: draftFile.media_type,
          role: 'draft' as const,
        },
      ];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/draft-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ question: instructions, fileContents }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `خطای سرور: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('استریم در دسترس نیست');

      const decoder = new TextDecoder();
      let buffer = '';
      let docxReceived = false;
      let messageReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) throw new Error(parsed.error);

            if (parsed.docx) {
              docxReceived = true;
              const binaryString = atob(parsed.docx);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              });
              const url = URL.createObjectURL(blob);
              const filename = parsed.filename || 'گزارش-پیش‌نویس-آریانا';

              setResults((prev) =>
                prev.map((r) =>
                  r.id === resultId
                    ? { ...r, status: 'done', docxUrl: url, docxFilename: filename }
                    : r
                )
              );
            } else if (parsed.message) {
              messageReceived = true;
              setResults((prev) =>
                prev.map((r) =>
                  r.id === resultId ? { ...r, status: 'done', message: parsed.message } : r
                )
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message !== data) throw e;
          }
        }
      }

      if (!docxReceived && !messageReceived) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === resultId
              ? { ...r, status: 'error', errorMessage: 'پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.' }
              : r
          )
        );
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error:', error);
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? {
                ...r,
                status: 'error',
                errorMessage: `خطا در بررسی پیش‌نویس: ${
                  error instanceof Error ? error.message : 'خطای ناشناخته'
                }`,
              }
            : r
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-screen flex flex-col bg-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-4 md:px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-navy-700 flex items-center justify-center flex-shrink-0">
            <GitCompare size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-navy-900 leading-tight">پیش‌نویس</h1>
            <p className="text-xs text-navy-400">دستیار تدوین و تکمیل پیش‌نویس قرارداد</p>
          </div>
        </div>
        <button
          onClick={handleLogoClick}
          disabled={loading}
          className="hover:opacity-80 transition-opacity disabled:pointer-events-none disabled:opacity-40"
          title="بازگشت به صفحه اول"
        >
          <img
            src="/tunnelsaddariana_logo.jpg"
            alt="لوگو"
            className="w-8 h-8 rounded-lg object-contain cursor-pointer"
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 md:px-12 lg:px-24 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-600 to-navy-700 rounded-3xl flex items-center justify-center mb-5 shadow-lg">
                <GitCompare size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">پیش‌نویس</h2>
              <p className="text-navy-400 max-w-md text-sm leading-relaxed">
                چند قرارداد مرجع را که می‌خواهید بندهای مفیدشان بررسی شود بارگذاری کنید، سپس قرارداد
                پیش‌نویس در حال بررسی را اضافه کنید. سامانه بندهای مفید موجود در قراردادهای مرجع که در
                پیش‌نویس شما نیست را استخراج و در قالب یک گزارش Word ارائه می‌دهد.
              </p>
            </div>
          )}

          {/* Step 1: Reference contracts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                ۱
              </div>
              <h3 className="text-sm font-bold text-navy-900">قراردادهای مرجع</h3>
              <span className="text-xs text-navy-400">(چند فایل مجاز است)</span>
            </div>

            <input
              type="file"
              ref={referenceInputRef}
              onChange={handleReferenceUpload}
              multiple
              accept=".txt,.pdf,.doc,.docx"
              className="hidden"
            />

            <button
              onClick={() => referenceInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-navy-400 hover:bg-navy-50 rounded-xl py-4 text-sm text-navy-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip size={16} />
              افزودن قرارداد(های) مرجع
            </button>

            {referenceFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {referenceFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 bg-navy-50 border border-navy-200 rounded-lg px-2.5 py-1.5 text-xs text-navy-700"
                  >
                    <FileText size={12} className="text-navy-500 flex-shrink-0" />
                    <span className="truncate max-w-[140px] md:max-w-xs">{file.name}</span>
                    {!loading && (
                      <button
                        onClick={() => removeReferenceFile(file.id)}
                        className="p-0.5 hover:bg-navy-200 rounded transition-colors flex-shrink-0"
                        title="حذف فایل"
                      >
                        <X size={11} className="text-navy-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Draft contract */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                ۲
              </div>
              <h3 className="text-sm font-bold text-navy-900">قرارداد پیش‌نویس در حال بررسی</h3>
              <span className="text-xs text-navy-400">(یک فایل)</span>
            </div>

            <input
              type="file"
              ref={draftInputRef}
              onChange={handleDraftUpload}
              accept=".txt,.pdf,.doc,.docx"
              className="hidden"
            />

            {!draftFile ? (
              <button
                onClick={() => draftInputRef.current?.click()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-sky-400 hover:bg-sky-50 rounded-xl py-4 text-sm text-navy-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCheck2 size={16} />
                بارگذاری قرارداد پیش‌نویس
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2.5 text-xs text-navy-700">
                <FileCheck2 size={14} className="text-sky-600 flex-shrink-0" />
                <span className="truncate flex-1">{draftFile.name}</span>
                {!loading && (
                  <button
                    onClick={removeDraftFile}
                    className="p-1 hover:bg-sky-200 rounded transition-colors flex-shrink-0"
                    title="حذف فایل"
                  >
                    <Trash2 size={12} className="text-navy-500" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Optional instructions + submit */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                ۳
              </div>
              <h3 className="text-sm font-bold text-navy-900">توضیحات تکمیلی</h3>
              <span className="text-xs text-navy-400">(اختیاری)</span>
            </div>

            <textarea
              ref={textInputRef}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="در صورت نیاز، تمرکز خاصی برای بررسی مشخص کنید (مثلاً تمرکز بر بندهای مالی یا فسخ قرارداد)..."
              disabled={loading}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent text-sm resize-none bg-white disabled:bg-gray-50 disabled:text-navy-300 transition-colors"
              style={{ fontSize: '16px' }}
            />

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-4 py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  در حال بررسی و تطبیق قراردادها...
                </>
              ) : (
                <>
                  <Send size={16} />
                  شروع بررسی و تهیه گزارش
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results.map((r) => (
            <div key={r.id} className="flex justify-start">
              {r.status === 'loading' ? (
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm w-full max-w-md">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-navy-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-navy-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-navy-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-xs text-navy-500">
                      در حال تطبیق {r.referenceNames.length} قرارداد مرجع با «{r.draftName}» — این
                      فرآیند ممکن است چند دقیقه طول بکشد
                    </p>
                  </div>
                </div>
              ) : r.status === 'done' && r.docxUrl ? (
                <div className="max-w-md w-full">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-l from-sky-600 to-navy-700 px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Layers size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {r.docxFilename}.docx
                        </p>
                        <p className="text-xs text-blue-200">گزارش پیش‌نویس Word</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-navy-500">
                        <Sparkles size={13} className="text-amber-500" />
                        <span>گزارش آماده دانلود است</span>
                      </div>
                      <a
                        href={r.docxUrl}
                        download={`${r.docxFilename}.docx`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0 shadow-sm"
                      >
                        <Download size={13} />
                        دانلود
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-navy-300 mt-1">{r.timestamp}</p>
                </div>
              ) : r.status === 'done' && r.message ? (
                <div className="max-w-md w-full">
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-start gap-2.5">
                    <FileCheck2 size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed text-navy-700">{r.message}</p>
                  </div>
                  <p className="text-xs text-navy-300 mt-1">{r.timestamp}</p>
                </div>
              ) : (
                <div className="max-w-md w-full">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm bg-red-50 border border-red-200 text-red-700">
                    <p className="text-sm leading-relaxed">{r.errorMessage}</p>
                  </div>
                  <p className="text-xs text-navy-300 mt-1">{r.timestamp}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-navy-900 mb-2 text-center">خروج از بخش پیش‌نویس</h3>
            <p className="text-sm text-navy-500 text-center mb-6 leading-relaxed">
              اطلاعات وارد شده ذخیره نخواهد شد. آیا مطمئن هستید؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowExitConfirm(false); navigate('/'); }}
                className="flex-1 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                بله، خروج
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-navy-700 rounded-xl text-sm font-semibold transition-colors"
              >
                ماندن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
