import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  FileText,
  PenTool,
  ChevronLeft,
  Shield,
  Zap,
  Brain,
  Award,
  Users,
  ArrowLeft,
  Scale,
  CheckCircle,
  Target,
  Clock,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';

const NAV_ITEMS = [
  { label: 'خانه', href: '#home' },
  { label: 'امکانات', href: '#features' },
  { label: 'درباره ما', href: '#about' },
  { label: 'تماس', href: '#contact' },
];

const FEATURES = [
  {
    id: 'fa-analysis',
    icon: FileText,
    title: 'تحلیلگر تیدا',
    description:
      'بارگذاری فایل و دریافت تحلیل حقوقی کامل شامل استخراج اطلاعات، بررسی ریسک‌ها و پیشنهاد اصلاحیه بر اساس قوانین حاکم.',
    tags: ['تحلیل ریسک', 'بررسی بندها', 'توصیه حقوقی'],
    color: 'from-navy-700 to-navy-900',
    lightColor: 'bg-navy-50',
    accentColor: 'text-navy-600',
    borderColor: 'border-navy-200',
    iconBg: 'bg-navy-100',
    badgeColor: 'bg-navy-100 text-navy-700',
    href: '/fa-analysis',
    index: '۰۱',
  },
  {
    id: 'drafting',
    icon: PenTool,
    title: 'تحریر قرارداد',
    description:
      'تهیه پیش‌نویس قراردادهای پیمانکاری، خرید، خدمات و سایر انواع قراردادهای مورد نیاز شرکت با ساختار استاندارد و بندهای حقوقی دقیق.',
    tags: ['پیش‌نویس هوشمند', 'ساختار استاندارد', 'قراردادهای تخصصی'],
    color: 'from-sky-600 to-sky-800',
    lightColor: 'bg-sky-50',
    accentColor: 'text-sky-600',
    borderColor: 'border-sky-200',
    iconBg: 'bg-sky-100',
    badgeColor: 'bg-sky-100 text-sky-700',
    href: '/drafting',
    index: '۰۲',
  },
];

const STATS = [
  { value: '+۵۰۰', label: 'قرارداد تحلیل شده', icon: FileText },
  { value: '۹۸٪', label: 'دقت در تحلیل', icon: Target },
  { value: '+۱۰', label: 'سال تجربه حقوقی', icon: Award },
  { value: '۲۴/۷', label: 'در دسترس', icon: Clock },
];

const CAPABILITIES = [
  { icon: Brain, title: 'هوش مصنوعی پیشرفته', desc: 'مبتنی بر جدیدترین مدل‌های زبانی' },
  { icon: Shield, title: 'اطلاعات محرمانه', desc: 'حفاظت کامل از اسناد و مکالمات' },
  { icon: Zap, title: 'پردازش سریع', desc: 'تحلیل قرارداد در کمترین زمان' },
  { icon: Award, title: 'دقت بالا', desc: 'استناد به قوانین و مقررات جاری' },
];

const CHECKLIST = [
  'تحلیل سریع متن قراردادهای فارسی در کمتر از چند دقیقه',
  'شناسایی خودکار بندهای ریسک‌دار و مبهم',
  'پیشنهاد اصلاحیه بر اساس قوانین و رویه جاری ایران',
  'پشتیبانی از قراردادهای پیمانکاری، حمل‌ونقل و سایر انواع',
  'نگهداری سابقه مکالمات و تحلیل‌های پیشین',
];

function useIntersectionObserver(ref: React.RefObject<Element>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isVisible;
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersectionObserver(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * One global stylesheet for the page's visual language: "blueprint & aperture".
 * Everything the page needs — the tunnel rings, the drafting-table grid, the
 * corner survey-marks, the ruler ticks — lives here once, so every section
 * below can reuse the same handful of classes instead of re-inventing motion.
 */
function MotifStyles() {
  return (
    <style>{`
      .bp-grid {
        background-image:
          linear-gradient(var(--bp-line, rgba(15,36,71,0.08)) 1px, transparent 1px),
          linear-gradient(90deg, var(--bp-line, rgba(15,36,71,0.08)) 1px, transparent 1px);
        background-size: var(--bp-size, 56px) var(--bp-size, 56px);
      }
      .bp-grid-drift { animation: bpDrift 46s linear infinite; }
      @keyframes bpDrift {
        from { background-position: 0 0; }
        to   { background-position: 56px 56px; }
      }

      .corner-frame { position: relative; }
      .corner-frame::before,
      .corner-frame::after,
      .corner-frame .cf-br,
      .corner-frame .cf-bl {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        border-color: var(--cf-color, rgba(56,189,248,0.55));
        pointer-events: none;
      }
      .corner-frame::before { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
      .corner-frame::after  { top: -1px; left: -1px;  border-top: 2px solid; border-left: 2px solid; }
      .corner-frame .cf-br  { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }
      .corner-frame .cf-bl  { bottom: -1px; left: -1px;  border-bottom: 2px solid; border-left: 2px solid; }

      .tunnel-ring {
        position: absolute;
        border-radius: 9999px;
        border: 1px solid rgba(125,211,252,0.55);
        transform: translate(-50%, -50%) scale(0.1);
        opacity: 0;
        animation: tunnelRing 6.5s cubic-bezier(0.16, 0.6, 0.3, 1) infinite;
      }
      @keyframes tunnelRing {
        0%   { transform: translate(-50%, -50%) scale(0.08); opacity: 0; }
        8%   { opacity: 0.9; }
        70%  { opacity: 0.35; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }
      .tunnel-ring-soft {
        position: absolute;
        border-radius: 9999px;
        border: 1px solid rgba(125,211,252,0.28);
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 0;
        animation: tunnelRingSoft 8s cubic-bezier(0.16, 0.6, 0.3, 1) infinite;
      }
      @keyframes tunnelRingSoft {
        0%   { transform: translate(-50%, -50%) scale(0.15); opacity: 0; }
        12%  { opacity: 0.5; }
        75%  { opacity: 0.15; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }

      .mote {
        position: absolute;
        bottom: -4%;
        border-radius: 9999px;
        background: rgba(186,230,253,0.85);
        animation: moteRise linear infinite;
      }
      @keyframes moteRise {
        0%   { transform: translateY(0) scale(1); opacity: 0; }
        10%  { opacity: 0.9; }
        90%  { opacity: 0.35; }
        100% { transform: translateY(-112vh) scale(0.4); opacity: 0; }
      }

      .ruler-line {
        background-image: repeating-linear-gradient(
          90deg,
          rgba(56,189,248,0.35) 0,
          rgba(56,189,248,0.35) 1px,
          transparent 1px,
          transparent 10px
        );
        height: 1px;
      }

      .path-draw {
        stroke-dasharray: 6 8;
        animation: pathDraw 3.6s linear infinite;
      }
      @keyframes pathDraw {
        to { stroke-dashoffset: -140; }
      }

      @media (prefers-reduced-motion: reduce) {
        .bp-grid-drift,
        .tunnel-ring,
        .tunnel-ring-soft,
        .mote,
        .path-draw { animation: none !important; opacity: 0.3; }
      }
    `}</style>
  );
}

function BlueprintGrid({
  className = '',
  line = 'rgba(15,36,71,0.08)',
  size = 56,
  drift = false,
}: {
  className?: string;
  line?: string;
  size?: number;
  drift?: boolean;
}) {
  return (
    <div
      className={`bp-grid ${drift ? 'bp-grid-drift' : ''} ${className}`}
      style={{ ['--bp-line' as any]: line, ['--bp-size' as any]: `${size}px` }}
      aria-hidden="true"
    />
  );
}

function CornerFrame({
  children,
  color = 'rgba(56,189,248,0.55)',
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`corner-frame ${className}`} style={{ ['--cf-color' as any]: color }}>
      <span className="cf-br" />
      <span className="cf-bl" />
      {children}
    </div>
  );
}

/**
 * TunnelAperture — signature hero motion.
 * A sequence of receding rings converging on a point of light behind the
 * logo, echoing both the company's identity ("تونل سد آریانا" — tunnel/dam
 * construction) and the product's role as an AI guide through a legal
 * document ("light at the end of the tunnel").
 */
function TunnelAperture() {
  const RING_COUNT = 7;
  const rings = Array.from({ length: RING_COUNT });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 55%), linear-gradient(180deg, #050b18 0%, #0a1a33 45%, #0f2447 100%)',
        }}
      />
      <BlueprintGrid
        className="absolute -inset-[10%] opacity-[0.09]"
        line="rgba(125,211,252,0.9)"
        size={64}
        drift
      />
      {rings.map((_, i) => {
        const size = 180 + i * 130;
        return (
          <div
            key={`ring-${i}`}
            className="tunnel-ring"
            style={{
              top: '42%',
              left: '50%',
              width: size,
              height: size,
              animationDelay: `${i * (6.5 / RING_COUNT)}s`,
            }}
          />
        );
      })}
      {Array.from({ length: 22 }).map((_, i) => {
        const left = (i * 47.3) % 100;
        const duration = 9 + (i % 6) * 2.2;
        const delay = -(i * 1.6) % duration;
        const size = i % 4 === 0 ? 4 : 2;
        return (
          <div
            key={`mote-${i}`}
            className="mote"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Quieter variant of the aperture rings for use behind dark section cards. */
function TunnelGlowStatic() {
  const rings = Array.from({ length: 4 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {rings.map((_, i) => {
        const size = 140 + i * 160;
        return (
          <div
            key={i}
            className="tunnel-ring-soft"
            style={{
              top: '0%',
              left: '50%',
              width: size,
              height: size,
              animationDelay: `${i * 2}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const fullText = 'دستیار هوش مصنوعی حقوقی';

  const navigateWithTransition = useCallback((path: string) => {
    pendingNavRef.current = path;
    setTransitioning(true);
  }, []);

  const handleTransitionDone = useCallback(() => {
    const path = pendingNavRef.current;
    setTransitioning(false);
    pendingNavRef.current = null;
    if (path) navigate(path);
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const handleHeroPointerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  }, []);

  return (
    <div className="min-h-screen bg-white font-vazir" dir="rtl">
      <MotifStyles />

      {/* Navbar */}
      <nav
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-400 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-navy-100/40'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo in nav */}
            <a href="#home" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/tunnelsaddariana_logo.jpg"
                  alt="تونل سد آریانا"
                  className="h-9 w-9 rounded-lg object-contain shadow-md"
                />
                <div className="absolute inset-0 rounded-lg bg-navy-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-bold leading-tight transition-colors ${scrolled ? 'text-navy-800' : 'text-white'}`}>
                  دستیار حقوقی آریانا
                </p>
                <p className={`text-xs transition-colors ${scrolled ? 'text-navy-400' : 'text-blue-200'}`}>
                  تونل سد آریانا
                </p>
              </div>
            </a>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`nav-link text-sm font-medium transition-colors ${
                    scrolled ? 'text-navy-700 hover:text-navy-500' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#features"
                className="btn-primary text-white text-sm font-semibold px-5 py-2 rounded-xl flex items-center gap-2"
              >
                <Zap size={15} />
                ورود به سامانه
              </a>
            </div>

            {/* Hamburger */}
            <button
              className={`md:hidden p-2 rounded-xl transition-all ${
                scrolled
                  ? 'text-navy-700 hover:bg-navy-50'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="منو"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className="ruler-line opacity-60" />

        {/* Mobile menu */}
        <div
          className={`md:hidden mobile-menu overflow-hidden ${
            menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-navy-950 border-t border-white/10 px-4 py-3 space-y-1 shadow-xl">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-white hover:text-sky-300 hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              >
                <ChevronLeft size={14} className="text-sky-400" />
                {item.label}
              </a>
            ))}
            <div className="pt-2 pb-1">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="btn-primary text-white text-sm font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 w-full"
              >
                <Zap size={15} />
                ورود به سامانه
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        ref={heroRef}
        onMouseMove={handleHeroPointerMove}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ ['--mx' as any]: '50%', ['--my' as any]: '42%' }}
      >
        <TunnelAperture />
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(420px circle at var(--mx) var(--my), rgba(125,211,252,0.10), transparent 70%)',
          }}
        />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-24 pb-16">

          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in-down">
            <div className="relative inline-block">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl animate-glow">
                <img
                  src="/tunnelsaddariana_logo.jpg"
                  alt="لوگو تونل سد آریانا"
                  className="w-20 h-20 md:w-28 md:h-28 object-contain rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="animate-fade-in delay-200 mb-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight whitespace-nowrap">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-300 to-blue-300">
                دستیار حقوقی آریانا
              </span>
            </h1>
          </div>

          {/* Typed subtitle */}
          <div className="animate-fade-in delay-300 mb-6">
            <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5">
              <Brain size={16} className="text-sky-300 flex-shrink-0" />
              <span className="text-sky-200 text-sm font-medium">
                {typedText}
                <span className="cursor-blink text-sky-300">|</span>
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="animate-fade-in delay-400 text-blue-100/80 text-base md:text-lg leading-loose max-w-2xl mx-auto mb-10">
            سامانه اختصاصی دپارتمان حقوقی شرکت تونل سد آریانا برای تحلیل، تحریر و بررسی اسناد با استفاده از هوش مصنوعی
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in delay-500 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigateWithTransition('/fa-analysis')}
              className="btn-primary text-white font-semibold px-8 py-4 rounded-2xl flex items-center gap-3 text-base w-full sm:w-auto justify-center"
            >
              <Zap size={20} />
              ورود به سامانه
              <ArrowLeft size={18} />
            </button>
            <a
              href="#features"
              className="glass text-white font-medium px-8 py-4 rounded-2xl flex items-center gap-3 text-base hover:bg-white/15 transition-all w-full sm:w-auto justify-center"
            >
              <Scale size={18} />
              امکانات سامانه
            </a>
          </div>

        </div>

        {/* Stats strip */}
        <div className="relative z-10 w-full px-4 sm:px-6 pb-10">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass rounded-2xl px-4 py-4 text-center flex flex-col items-center gap-1.5">
                <Icon size={16} className="text-sky-300" />
                <span className="text-white font-bold text-xl md:text-2xl">{value}</span>
                <span className="text-blue-200/70 text-[11px] md:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-white overflow-hidden">
        <BlueprintGrid className="absolute inset-0 opacity-60" size={48} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(60% 45% at 50% 0%, rgba(255,255,255,0) 0%, white 78%)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-600 rounded-full px-4 py-2 text-sm font-medium mb-5 border border-navy-100">
              <Zap size={14} />
              ابزارهای سامانه
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-navy-900 mb-5 leading-tight">
              دو ابزار کاربردی
              <span className="gradient-text"> برای دپارتمان حقوقی</span>
            </h2>
            <p className="text-navy-500 text-base md:text-lg max-w-2xl mx-auto leading-loose">
              هر بخش برای یک نیاز مشخص طراحی شده است. برای شروع، بخش موردنظر را انتخاب کنید.
            </p>
          </AnimatedSection>

          {/* Feature Cards */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

            {/* connecting flow line between the two modules (desktop only) */}
            <svg
              className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
              width="90" height="40" viewBox="0 0 90 40" fill="none" aria-hidden="true"
            >
              <path d="M85 20 Q45 4 5 20" stroke="#7dd3fc" strokeWidth="1.5" className="path-draw" />
            </svg>

            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.id} className="relative z-10">
                  <CornerFrame
                    color={feature.id === 'fa-analysis' ? 'rgba(30,58,109,0.35)' : 'rgba(2,132,199,0.35)'}
                  >
                    <button
                      onClick={() => navigateWithTransition(feature.href)}
                      className="group relative block w-full text-right rounded-3xl overflow-hidden border border-navy-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy-200/40"
                    >
                      <div
                        className={`absolute -inset-px rounded-3xl bg-gradient-to-l ${feature.color} opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500`}
                        aria-hidden="true"
                      />
                      <div className="relative bg-white rounded-3xl h-full">
                        <div className={`h-1.5 bg-gradient-to-l ${feature.color}`} />

                        <div className="p-7">
                          <div className="flex items-start justify-between mb-6">
                            <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                              <Icon size={30} className={feature.accentColor} />
                            </div>
                            <span className="text-xs font-mono tracking-widest text-navy-300 pt-1">
                              {feature.index}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-navy-600 transition-colors">
                            {feature.title}
                          </h3>

                          <p className="text-navy-500 text-sm leading-7 mb-5">
                            {feature.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {feature.tags.map((tag) => (
                              <span key={tag} className={`${feature.badgeColor} text-xs font-medium px-3 py-1.5 rounded-full`}>
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 text-sm font-semibold text-navy-600 group-hover:gap-3 transition-all">
                            <span>ورود به بخش</span>
                            <ArrowLeft size={16} className="group-hover:translate-x-[-4px] transition-transform" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </CornerFrame>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / How it works */}
      <section id="about" className="relative py-24 bg-gradient-to-br from-navy-950 to-navy-800 overflow-hidden">
        <BlueprintGrid className="absolute inset-0 opacity-[0.06]" line="rgba(125,211,252,0.9)" size={64} drift />
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, #2557d6 0%, transparent 60%), radial-gradient(circle at 70% 30%, #0088f0 0%, transparent 50%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Visual */}
            <AnimatedSection className="order-2 lg:order-1">
              <div className="relative">
                <div className="w-full aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 border border-white/10 flex items-center justify-center shadow-2xl animate-glow">
                      <img
                        src="/tunnelsaddariana_logo.jpg"
                        alt="آریانا"
                        className="w-28 h-28 object-contain rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="absolute inset-8 rounded-full border border-blue-400/20 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border border-sky-400/10" style={{ animation: 'spin 15s linear infinite reverse' }} />
                  <div className="absolute inset-12 rounded-full border border-dashed border-sky-300/10" style={{ animation: 'spin 22s linear infinite' }} />
                  {[FileText, PenTool, Shield].map((Icon, i) => {
                    const angle = (i * 120 * Math.PI) / 180;
                    const radius = 42;
                    const top = 50 - radius * Math.cos(angle);
                    const right = 50 - radius * Math.sin(angle);
                    return (
                      <div
                        key={i}
                        className="absolute w-14 h-14 glass-light rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          top: `${top}%`,
                          right: `${right}%`,
                          transform: 'translate(50%, -50%)',
                          animation: `float ${5 + i}s ease-in-out infinite`,
                          animationDelay: `${i * 0.8}s`,
                        }}
                      >
                        <Icon size={24} className="text-navy-600" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>

            {/* Right: Text */}
            <AnimatedSection className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-white/10">
                <Brain size={14} />
                درباره سامانه
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                ابزار اختصاصی
                <span className="text-sky-300"> دپارتمان حقوقی</span>
              </h2>
              <p className="text-blue-100/70 text-base leading-loose mb-8">
                این سامانه به طور اختصاصی برای پشتیبانی از فعالیت‌های روزمره دپارتمان حقوقی شرکت تونل سد آریانا طراحی شده است و امکان بررسی سریع و دقیق قراردادها را فراهم می‌کند.
              </p>

              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-sky-400/20 border border-sky-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={14} className="text-sky-400" />
                  </div>
                  <p className="text-blue-100/80 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Capabilities highlight band */}
      <section className="relative py-16 bg-gradient-to-l from-sky-50 to-white border-y border-navy-100 overflow-hidden">
        <BlueprintGrid className="absolute inset-0 opacity-40" size={48} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-x-reverse md:divide-navy-100">
              {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center px-5 py-2 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-navy-100 to-sky-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Icon size={24} className="text-navy-600" />
                  </div>
                  <h4 className="text-navy-800 font-bold text-sm mb-1">{title}</h4>
                  <p className="text-navy-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-24 bg-white overflow-hidden">
        <BlueprintGrid className="absolute inset-0 opacity-50" size={48} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection>
            <CornerFrame color="rgba(125,211,252,0.4)">
              <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-3xl p-10 md:p-14 shadow-2xl shadow-navy-200/50 relative overflow-hidden">
                <TunnelGlowStatic />
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #0088f0, transparent 60%)' }}
                />
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <Scale size={30} className="text-sky-300" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    شروع به کار
                  </h2>
                  <p className="text-blue-100/70 text-base leading-loose mb-8 max-w-lg mx-auto">
                    برای تحلیل قرارداد، فایل متنی یا تصویری قرارداد را بارگذاری کنید و سؤال حقوقی خود را مطرح نمایید.
                  </p>
                  <button
                    onClick={() => navigateWithTransition('/fa-analysis')}
                    className="btn-primary text-white font-bold px-10 py-4 rounded-2xl inline-flex items-center gap-3 text-base"
                  >
                    <Zap size={20} />
                    ورود به سامانه
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </div>
            </CornerFrame>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-navy-950 text-white pt-14 pb-8 overflow-hidden">
        <BlueprintGrid className="absolute inset-0 opacity-[0.05]" line="rgba(125,211,252,0.9)" size={64} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/tunnelsaddariana_logo.jpg"
                  alt="تونل سد آریانا"
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <div>
                  <p className="font-bold text-base text-white">دستیار حقوقی آریانا</p>
                  <p className="text-blue-300/60 text-xs">Ariana Legal Assistant</p>
                </div>
              </div>
              <p className="text-blue-200/50 text-sm leading-loose">
                سامانه اختصاصی دپارتمان حقوقی شرکت تونل سد آریانا برای بررسی و تحلیل قراردادها.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-5 text-sm">دسترسی سریع</h4>
              <ul className="space-y-3">
                {[
                  { label: 'تحلیل قرارداد فارسی', href: '/fa-analysis' },
                  { label: 'تحریر قرارداد', href: '/drafting' },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigateWithTransition(link.href)}
                      className="text-blue-200/60 hover:text-sky-300 text-sm transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft size={12} className="text-sky-500/50" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-5 text-sm">شرکت تونل سد آریانا</h4>
              <p className="text-blue-200/50 text-sm leading-loose mb-4">
                این سامانه صرفاً برای استفاده داخلی دپارتمان حقوقی شرکت تونل سد آریانا طراحی شده است.
              </p>
              <div className="flex items-center gap-2 text-blue-200/40 text-xs">
                <Users size={12} />
                <span>دپارتمان حقوقی شرکت تونل سد آریانا</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-blue-200/40 text-xs">
              <Scale size={13} />
              <span>تمامی حقوق برای شرکت تونل سد آریانا محفوظ است — ۱۴۰۴</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200/35 text-xs">
              <Brain size={13} className="text-sky-500/50" />
              <span>
                طراحی و توسعه توسط{' '}
                <span className="text-sky-400/70 font-semibold">مجتبی آگاه زمان</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      <PageTransition active={transitioning} onDone={handleTransitionDone} />
    </div>
  );
}
