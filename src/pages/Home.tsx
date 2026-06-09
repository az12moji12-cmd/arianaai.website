import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  FileText,
  PenTool,
  Globe,
  ChevronLeft,
  Shield,
  Zap,
  Brain,
  Award,
  Users,
  ArrowLeft,
  Scale,
  CheckCircle,
} from 'lucide-react';

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
    title: 'تحلیل قرارداد فارسی',
    description:
      'بارگذاری متن قرارداد و دریافت تحلیل حقوقی کامل شامل استخراج اطلاعات، بررسی ریسک‌ها و پیشنهاد اصلاحیه بر اساس قوانین ایران.',
    tags: ['تحلیل ریسک', 'بررسی بندها', 'توصیه حقوقی'],
    color: 'from-navy-700 to-navy-900',
    lightColor: 'bg-navy-50',
    accentColor: 'text-navy-600',
    borderColor: 'border-navy-200',
    iconBg: 'bg-navy-100',
    badgeColor: 'bg-navy-100 text-navy-700',
    href: '/fa-analysis',
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
  },
  {
    id: 'intl-analysis',
    icon: Globe,
    title: 'تحلیل قرارداد بین‌المللی',
    description:
      'بررسی قراردادهای بین‌المللی پروژه‌های عمرانی و پیمانکاری با تطبیق بر استانداردهای FIDIC، اینکوترمز و حقوق تجارت بین‌الملل.',
    tags: ['FIDIC', 'اینکوترمز', 'حقوق بین‌الملل'],
    color: 'from-blue-600 to-navy-800',
    lightColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
    href: '/intl-analysis',
  },
];

const STATS = [
  { value: '+۵۰۰', label: 'قرارداد تحلیل شده' },
  { value: '۹۸٪', label: 'دقت در تحلیل' },
  { value: '+۱۰', label: 'سال تجربه حقوقی' },
  { value: '۲۴/۷', label: 'در دسترس' },
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

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'دستیار هوش مصنوعی حقوقی';

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

  return (
    <div className="min-h-screen bg-white font-vazir" dir="rtl">

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
      <section id="home" className="hero-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Animated background circles - continuous slow rotation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Continuously spinning rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" style={{ animation: 'spin 30s linear infinite' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/4" style={{ animation: 'spin 45s linear infinite reverse' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-white/3" style={{ animation: 'spin 60s linear infinite' }} />
          {/* Dots on rings */}
          <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-sky-400/60" style={{ animation: 'orbitLarge 30s linear infinite', marginTop: '-6px', marginLeft: '-6px' }} />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-blue-300/50" style={{ animation: 'orbitMedium 45s linear infinite reverse', marginTop: '-4px', marginLeft: '-4px' }} />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/40" style={{ animation: 'orbitLarge2 60s linear infinite', animationDelay: '-20s', marginTop: '-4px', marginLeft: '-4px' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
          {/* Gradient orbs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl animate-pulse-slow delay-400" />
        </div>

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

          {/* Title - single line, no wrapping issue */}
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

          {/* Description - internal team tone */}
          <p className="animate-fade-in delay-400 text-blue-100/80 text-base md:text-lg leading-loose max-w-2xl mx-auto mb-10">
            سامانه اختصاصی دپارتمان حقوقی شرکت تونل سد آریانا برای تحلیل، تحریر و بررسی قراردادها با استفاده از هوش مصنوعی
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in delay-500 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/fa-analysis')}
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-600 rounded-full px-4 py-2 text-sm font-medium mb-5 border border-navy-100">
              <Zap size={14} />
              ابزارهای سامانه
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-navy-900 mb-5 leading-tight">
              سه ابزار کاربردی
              <span className="gradient-text"> برای دپارتمان حقوقی</span>
            </h2>
            <p className="text-navy-500 text-base md:text-lg max-w-2xl mx-auto leading-loose">
              هر بخش برای یک نیاز مشخص طراحی شده است. برای شروع، بخش موردنظر را انتخاب کنید.
            </p>
          </AnimatedSection>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.id} className={`delay-${(i + 1) * 200}`}>
                  <button
                    onClick={() => navigate(feature.href)}
                    className="card-glow block bg-white rounded-3xl border border-navy-100 overflow-hidden group h-full shadow-sm hover:shadow-navy-100 w-full text-right"
                  >
                    {/* Card gradient top bar */}
                    <div className={`h-1.5 bg-gradient-to-l ${feature.color}`} />

                    <div className="p-7">
                      {/* Icon */}
                      <div className={`feature-icon-wrap w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                        <Icon size={30} className={feature.accentColor} />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-navy-600 transition-colors">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-navy-500 text-sm leading-7 mb-5">
                        {feature.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`${feature.badgeColor} text-xs font-medium px-3 py-1.5 rounded-full`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-sm font-semibold text-navy-600 group-hover:gap-3 transition-all">
                        <span>ورود به بخش</span>
                        <ArrowLeft size={16} className="group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </div>
                  </button>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / How it works */}
      <section id="about" className="py-24 bg-gradient-to-br from-navy-950 to-navy-800 relative overflow-hidden">
        {/* BG decoration */}
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
                  {/* Central circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 border border-white/10 flex items-center justify-center shadow-2xl animate-glow">
                      <img
                        src="/tunnelsaddariana_logo.jpg"
                        alt="آریانا"
                        className="w-28 h-28 object-contain rounded-xl"
                      />
                    </div>
                  </div>
                  {/* Rotating outer ring */}
                  <div className="absolute inset-8 rounded-full border border-blue-400/20 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border border-sky-400/10" style={{ animation: 'spin 15s linear infinite reverse' }} />
                  {/* Feature dots orbiting */}
                  {[FileText, PenTool, Globe, Shield].map((Icon, i) => {
                    const angle = (i * 90 * Math.PI) / 180;
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

              {/* Checklist */}
              {[
                'تحلیل سریع متن قراردادهای فارسی در کمتر از چند دقیقه',
                'شناسایی خودکار بندهای ریسک‌دار و مبهم',
                'پیشنهاد اصلاحیه بر اساس قوانین و رویه جاری ایران',
                'پشتیبانی از قراردادهای پیمانکاری، حمل‌ونقل و سایر انواع',
                'نگهداری سابقه مکالمات و تحلیل‌های پیشین',
              ].map((item, i) => (
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
      <section className="py-16 bg-gradient-to-l from-sky-50 to-white border-y border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Brain, title: 'هوش مصنوعی پیشرفته', desc: 'مبتنی بر جدیدترین مدل‌های زبانی' },
                { icon: Shield, title: 'اطلاعات محرمانه', desc: 'حفاظت کامل از اسناد و مکالمات' },
                { icon: Zap, title: 'پردازش سریع', desc: 'تحلیل قرارداد در کمترین زمان' },
                { icon: Award, title: 'دقت بالا', desc: 'استناد به قوانین و مقررات جاری' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-5 rounded-2xl hover:bg-navy-50 transition-all group"
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
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-3xl p-10 md:p-14 shadow-2xl shadow-navy-200/50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 0%, #0088f0, transparent 60%)',
                }}
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
                  onClick={() => navigate('/fa-analysis')}
                  className="btn-primary text-white font-bold px-10 py-4 rounded-2xl inline-flex items-center gap-3 text-base"
                >
                  <Zap size={20} />
                  ورود به سامانه
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Footer top grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

            {/* Brand */}
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

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm">دسترسی سریع</h4>
              <ul className="space-y-3">
                {[
                  { label: 'تحلیل قرارداد فارسی', href: '/fa-analysis' },
                  { label: 'تحریر قرارداد', href: '/drafting' },
                  { label: 'تحلیل قرارداد بین‌المللی', href: '/intl-analysis' },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-blue-200/60 hover:text-sky-300 text-sm transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft size={12} className="text-sky-500/50" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company info */}
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

          {/* Footer bottom */}
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

    </div>
  );
}
