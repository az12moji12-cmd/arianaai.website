import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  X,
  FileText,
  Loader,
  Plus,
  Menu,
  Copy,
  Download,
  Trash2,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: Array<{ name: string; size: number }>;
  timestamp: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  encoding: 'base64' | 'text';
  media_type: string;
}

export default function ContractAnalysis() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; timestamp: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => Date.now().toString());

  const handleLogoClick = () => {
    if (loading) return;
    if (messages.length > 0) {
      setShowExitConfirm(true);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const newMessageAdded = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (newMessageAdded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isStreamingRef.current) {
      const container = scrollContainerRef.current;
      if (container) {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 200) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }, [messages]);

  const startNewConversation = () => {
    if (messages.length > 0) {
      const title = messages[0]?.files?.[0]?.name || messages[0]?.content?.slice(0, 30) || 'مکالمه جدید';
      setConversations((prev) => [
        { id: currentConversationId, title, timestamp: new Date().toLocaleString('fa-IR') },
        ...prev,
      ]);
    }
    setCurrentConversationId(Date.now().toString());
    setMessages([]);
    setUploadedFiles([]);
    setQuestion('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(async (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();

      if (ext === 'pdf') {
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64,
          encoding: 'base64',
          media_type: 'application/pdf',
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      } else if (ext === 'docx' || ext === 'doc') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          size: file.size,
          type: file.type,
          content: result.value,
          encoding: 'text',
          media_type: 'text/plain',
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      } else {
        const textContent = await file.text();
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          size: file.size,
          type: file.type,
          content: textContent,
          encoding: 'text',
          media_type: 'text/plain',
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      }
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSendMessage = async () => {
    if (!question.trim() || uploadedFiles.length === 0 || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      files: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
      timestamp: new Date().toLocaleString('fa-IR'),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setQuestion('');
    setLoading(true);
    isStreamingRef.current = true;

    try {
      const fileContents = uploadedFiles.map((f) => ({
        name: f.name,
        content: f.content,
        encoding: f.encoding,
        media_type: f.media_type,
      }));

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleString('fa-IR'),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-contract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            question,
            fileContents,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `خطای سرور: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('استریم در دسترس نیست');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

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
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message !== data) throw e;
          }
        }
      }

      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: 'پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.' }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'متأسفانه در انجام تحلیل خطایی رخ داد. لطفاً دوباره تلاش کنید.',
        timestamp: new Date().toLocaleString('fa-IR'),
      };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return [...prev.slice(0, -1), errorMessage];
        }
        return [...prev, errorMessage];
      });
    } finally {
      isStreamingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="chat-screen flex bg-white" dir="rtl">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-navy-950 text-white flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-white/10">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            <Plus size={18} />
            مکالمه جدید
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-blue-200/30 text-xs text-center py-6 px-2">سابقه مکالمه‌ای وجود ندارد</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-right px-3 py-2 text-sm text-blue-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MessageCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate">{conv.title}</p>
                      <p className="text-xs text-blue-200/30 mt-0.5">{conv.timestamp}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-2 text-blue-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
            <Settings size={16} />
            تنظیمات
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-navy-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-navy-900">تحلیل قرارداد فارسی</h1>
              <p className="text-xs text-navy-500">دستیار حقوقی آریانا</p>
            </div>
          </div>
          <button
            onClick={handleLogoClick}
            disabled={loading}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:pointer-events-none disabled:opacity-40"
            title="بازگشت به صفحه اول"
          >
            <img
              src="/tunnelsaddariana_logo.jpg"
              alt="لوگو"
              className="w-8 h-8 rounded-lg object-contain cursor-pointer"
            />
          </button>
        </div>

        {/* Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-navy-100 to-sky-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={32} className="text-navy-600" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">شروع تحلیل قرارداد</h2>
              <p className="text-navy-500 max-w-md">
                فایل قرارداد خود را آپلود کنید و سؤالات حقوقی را مطرح کنید. دستیار آریانا تحلیل جامع حقوقی ارائه می‌دهد.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-navy-600 text-white rounded-2xl rounded-tr-none'
                    : 'bg-white border border-gray-200 text-navy-900 rounded-2xl rounded-tl-none shadow-sm'
                } px-5 py-4`}
              >
                {msg.role === 'user' ? (
                  <div>
                    <p className="text-sm leading-relaxed mb-2">{msg.content}</p>
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                        {msg.files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-blue-100">
                            <FileText size={12} />
                            <span>{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="prose prose-sm max-w-none">
                      <div
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/^#{1,3}\s+/gm, '<strong>$&</strong>')
                            .replace(/\n/g, '<br />'),
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="کپی متن"
                      >
                        <Copy size={14} className="text-navy-400" />
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([msg.content], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `تحلیل-آریانا-${msg.timestamp.replace(/[/:]/g, '-')}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="دانلود متن"
                      >
                        <Download size={14} className="text-navy-400" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader size={16} className="text-navy-600 animate-spin" />
                  <p className="text-sm text-navy-600">در حال تحلیل قرارداد...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4 md:p-6">
          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-900 mb-2">فایل‌های آپلود شده:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2"
                  >
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-xs text-blue-900 truncate max-w-xs">{file.name}</span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                    >
                      <X size={14} className="text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".txt,.pdf,.doc,.docx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-3 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                title="آپلود فایل"
              >
                <Upload size={18} className="text-navy-600" />
              </button>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="سؤال خود را بنویسید..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading || !question.trim() || uploadedFiles.length === 0}
              className="flex-shrink-0 p-3 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy-900 mb-2 text-center">خروج از مکالمه</h3>
            <p className="text-sm text-navy-500 text-center mb-6 leading-relaxed">
              مکالمه جاری ذخیره نخواهد شد. آیا مطمئن هستید؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowExitConfirm(false); navigate('/'); }}
                className="flex-1 py-2.5 bg-navy-600 hover:bg-navy-700 text-white rounded-xl text-sm font-semibold transition-colors"
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
