/* =========================================================================
   PageTransition.css
   ترنزیشن سه‌بعدی «پورتال هولوگرافیک» — هم‌رنگ با تم آبی سامانه
   رنگ‌های پایه: آبی آسمانی #0088F0  /  آبی تیره #2557D6
   فقط استایل است؛ به ساختار JSX دست نخورده و کلاس‌های موجود هدف قرار گرفته‌اند.
   ========================================================================= */

.page-transition-overlay {
  --pt-sky: #0088f0;
  --pt-blue: #2557d6;
  --pt-sky-light: #38bdf8;
  --pt-bg-1: #061226;
  --pt-bg-2: #020610;

  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  background: radial-gradient(ellipse 120% 90% at 50% 42%, var(--pt-bg-1) 0%, var(--pt-bg-2) 60%, #010308 100%);
  perspective: 1400px;
  perspective-origin: 50% 45%;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.45s ease, visibility 0s linear 0.45s;
}

.page-transition-overlay.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.4s ease, visibility 0s linear 0s;
}

/* اشعه‌های نوری چرخان پشت صحنه برای عمق بیشتر */
.page-transition-overlay::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  margin: -500px 0 0 -500px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(56, 189, 248, 0.08) 10deg, transparent 20deg,
    transparent 90deg, rgba(37, 87, 214, 0.07) 100deg, transparent 110deg,
    transparent 180deg, rgba(56, 189, 248, 0.08) 190deg, transparent 200deg,
    transparent 270deg, rgba(37, 87, 214, 0.07) 280deg, transparent 290deg,
    transparent 360deg
  );
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
}
.page-transition-overlay.active::before {
  opacity: 1;
  animation: pt-rays-spin 20s linear infinite;
}

/* وینیت برای تمرکز نگاه روی مرکز صحنه */
.page-transition-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 45%, transparent 38%, rgba(1, 3, 8, 0.7) 100%);
  pointer-events: none;
}

@keyframes pt-rays-spin {
  to { transform: rotate(360deg); }
}

/* -------------------------------------------------------------------------
   خروج کلی صحنه (fade-out) — سرعت گرفتن و محو شدن به سمت دوربین
   ------------------------------------------------------------------------- */
.page-transition-overlay.pt-fade-out {
  transition: opacity 0.5s ease, visibility 0s linear 0.5s;
  opacity: 0;
}

/* =========================================================================
   کف شبکه‌ای سه‌بعدی (Tron-grid)
   ========================================================================= */
.pt-grid {
  position: absolute;
  left: 50%;
  bottom: -15%;
  width: 240%;
  height: 75%;
  transform: translateX(-50%) rotateX(80deg);
  transform-style: preserve-3d;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.35) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 55% 85% at 50% 15%, black 15%, transparent 78%);
  mask-image: radial-gradient(ellipse 55% 85% at 50% 15%, black 15%, transparent 78%);
  opacity: 0;
}

.active .pt-grid {
  opacity: 1;
  transition: opacity 0.7s ease 0.1s;
  animation: pt-grid-flow 5s linear infinite 0.1s;
}

.pt-fade-out .pt-grid {
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: pt-grid-flow 1.2s linear infinite;
}

@keyframes pt-grid-flow {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 0 56px, 0 56px; }
}

/* =========================================================================
   حلقه‌های هولوگرافیک (پورتال) — چهار حلقه با تیلت و چرخش سه‌بعدی متفاوت
   ========================================================================= */
.pt-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform-style: preserve-3d;
  opacity: 0;
}

.pt-ring-1 {
  width: 150px; height: 150px; margin: -75px 0 0 -75px;
  border: 1.5px solid rgba(56, 189, 248, 0.55);
  box-shadow: 0 0 22px rgba(0, 136, 240, 0.4), inset 0 0 18px rgba(0, 136, 240, 0.18);
}
.pt-ring-2 {
  width: 235px; height: 235px; margin: -117.5px 0 0 -117.5px;
  border: 1.5px solid rgba(37, 87, 214, 0.5);
  box-shadow: 0 0 24px rgba(37, 87, 214, 0.35), inset 0 0 18px rgba(37, 87, 214, 0.15);
}
.pt-ring-3 {
  width: 330px; height: 330px; margin: -165px 0 0 -165px;
  border: 1.5px dashed rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 20px rgba(0, 136, 240, 0.22);
}
.pt-ring-4 {
  width: 435px; height: 435px; margin: -217.5px 0 0 -217.5px;
  border: 1px solid rgba(37, 87, 214, 0.3);
  box-shadow: 0 0 18px rgba(37, 87, 214, 0.18);
}

.active .pt-ring-1 { animation: pt-ring-in-1 0.75s cubic-bezier(.2,.85,.25,1.15) forwards 0.05s, pt-ring-spin-1 7s linear infinite 0.8s; }
.active .pt-ring-2 { animation: pt-ring-in-2 0.75s cubic-bezier(.2,.85,.25,1.15) forwards 0.12s, pt-ring-spin-2 9s linear infinite 0.87s; }
.active .pt-ring-3 { animation: pt-ring-in-3 0.75s cubic-bezier(.2,.85,.25,1.15) forwards 0.19s, pt-ring-spin-3 11s linear infinite 0.94s; }
.active .pt-ring-4 { animation: pt-ring-in-4 0.75s cubic-bezier(.2,.85,.25,1.15) forwards 0.26s, pt-ring-spin-4 13s linear infinite 1.01s; }

@keyframes pt-ring-in-1 {
  0%   { opacity: 0; transform: translate(-50%,-50%) rotateX(90deg) rotateY(0deg) scale(.25); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translate(-50%,-50%) rotateX(58deg) rotateY(0deg) scale(1); }
}
@keyframes pt-ring-spin-1 {
  from { transform: translate(-50%,-50%) rotateX(58deg) rotateY(0deg) scale(1); }
  to   { transform: translate(-50%,-50%) rotateX(58deg) rotateY(360deg) scale(1); }
}

@keyframes pt-ring-in-2 {
  0%   { opacity: 0; transform: translate(-50%,-50%) rotateX(-90deg) rotateY(0deg) scale(.25); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translate(-50%,-50%) rotateX(-54deg) rotateY(0deg) scale(1); }
}
@keyframes pt-ring-spin-2 {
  from { transform: translate(-50%,-50%) rotateX(-54deg) rotateY(360deg) scale(1); }
  to   { transform: translate(-50%,-50%) rotateX(-54deg) rotateY(0deg) scale(1); }
}

@keyframes pt-ring-in-3 {
  0%   { opacity: 0; transform: translate(-50%,-50%) rotateX(90deg) rotateZ(18deg) scale(.25); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translate(-50%,-50%) rotateX(63deg) rotateZ(18deg) scale(1); }
}
@keyframes pt-ring-spin-3 {
  from { transform: translate(-50%,-50%) rotateX(63deg) rotateZ(18deg) rotateY(0deg) scale(1); }
  to   { transform: translate(-50%,-50%) rotateX(63deg) rotateZ(18deg) rotateY(360deg) scale(1); }
}

@keyframes pt-ring-in-4 {
  0%   { opacity: 0; transform: translate(-50%,-50%) rotateX(-90deg) rotateZ(-14deg) scale(.25); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: translate(-50%,-50%) rotateX(-60deg) rotateZ(-14deg) scale(1); }
}
@keyframes pt-ring-spin-4 {
  from { transform: translate(-50%,-50%) rotateX(-60deg) rotateZ(-14deg) rotateY(360deg) scale(1); }
  to   { transform: translate(-50%,-50%) rotateX(-60deg) rotateZ(-14deg) rotateY(0deg) scale(1); }
}

/* خروج حلقه‌ها: چرخش تندتر و پرتاب رو به دوربین همراه با محو شدن */
.pt-fade-out .pt-ring-1 { animation: pt-ring-out-1 0.48s cubic-bezier(.5,0,.85,1) forwards; }
.pt-fade-out .pt-ring-2 { animation: pt-ring-out-2 0.48s cubic-bezier(.5,0,.85,1) forwards 0.02s; }
.pt-fade-out .pt-ring-3 { animation: pt-ring-out-3 0.48s cubic-bezier(.5,0,.85,1) forwards 0.04s; }
.pt-fade-out .pt-ring-4 { animation: pt-ring-out-4 0.48s cubic-bezier(.5,0,.85,1) forwards 0.06s; }

@keyframes pt-ring-out-1 {
  from { opacity: 1; transform: translate(-50%,-50%) rotateX(58deg) rotateY(0deg) scale(1); }
  to   { opacity: 0; transform: translate(-50%,-50%) rotateX(58deg) rotateY(200deg) scale(1.7) translateZ(220px); }
}
@keyframes pt-ring-out-2 {
  from { opacity: 1; transform: translate(-50%,-50%) rotateX(-54deg) rotateY(0deg) scale(1); }
  to   { opacity: 0; transform: translate(-50%,-50%) rotateX(-54deg) rotateY(-200deg) scale(1.7) translateZ(220px); }
}
@keyframes pt-ring-out-3 {
  from { opacity: 1; transform: translate(-50%,-50%) rotateX(63deg) rotateZ(18deg) rotateY(0deg) scale(1); }
  to   { opacity: 0; transform: translate(-50%,-50%) rotateX(63deg) rotateZ(18deg) rotateY(220deg) scale(1.8) translateZ(240px); }
}
@keyframes pt-ring-out-4 {
  from { opacity: 1; transform: translate(-50%,-50%) rotateX(-60deg) rotateZ(-14deg) rotateY(0deg) scale(1); }
  to   { opacity: 0; transform: translate(-50%,-50%) rotateX(-60deg) rotateZ(-14deg) rotateY(-220deg) scale(1.8) translateZ(240px); }
}

/* =========================================================================
   درخشش مرکزی پشت لوگو
   ========================================================================= */
.pt-glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 520px; height: 520px;
  margin: -260px 0 0 -260px;
  background: radial-gradient(circle, rgba(0, 136, 240, 0.38) 0%, rgba(37, 87, 214, 0.18) 35%, transparent 70%);
  filter: blur(14px);
  opacity: 0;
}

.active .pt-glow {
  animation: pt-glow-in 0.9s ease forwards, pt-glow-pulse 2.6s ease-in-out infinite 0.9s;
}
.pt-fade-out .pt-glow {
  animation: pt-glow-out 0.5s ease forwards;
}

@keyframes pt-glow-in {
  from { opacity: 0; transform: translateZ(-110px) scale(.5); }
  to   { opacity: 1; transform: translateZ(-80px) scale(1); }
}
@keyframes pt-glow-pulse {
  0%, 100% { transform: translateZ(-80px) scale(1); opacity: .75; }
  50%      { transform: translateZ(-55px) scale(1.18); opacity: 1; }
}
@keyframes pt-glow-out {
  from { opacity: 1; }
  to   { opacity: 0; transform: translateZ(80px) scale(1.7); }
}

/* =========================================================================
   ذرات شناور سه‌بعدی دور لوگو (۶ شکل)
   ========================================================================= */
.pt-shape {
  position: absolute;
  top: 50%; left: 50%;
  margin: -8px 0 0 -8px;
  opacity: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

.active .pt-shape-1 { animation: pt-orbit-in-1 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.3s, pt-float-1 4.2s ease-in-out infinite 1s; }
.active .pt-shape-2 { animation: pt-orbit-in-2 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.35s, pt-float-2 4.6s ease-in-out infinite 1.05s; }
.active .pt-shape-3 { animation: pt-orbit-in-3 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.4s, pt-float-3 5s ease-in-out infinite 1.1s; }
.active .pt-shape-4 { animation: pt-orbit-in-4 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.45s, pt-float-4 4.4s ease-in-out infinite 1.15s; }
.active .pt-shape-5 { animation: pt-orbit-in-5 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.5s, pt-float-5 4.8s ease-in-out infinite 1.2s; }
.active .pt-shape-6 { animation: pt-orbit-in-6 0.7s cubic-bezier(.2,.9,.3,1.1) forwards 0.55s, pt-float-6 5.2s ease-in-out infinite 1.25s; }

@keyframes pt-orbit-in-1 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(0px,-140px,40px) scale(1); } }
@keyframes pt-orbit-in-2 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(122px,-70px,-30px) scale(1); } }
@keyframes pt-orbit-in-3 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(122px,70px,55px) scale(1); } }
@keyframes pt-orbit-in-4 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(0px,140px,-40px) scale(1); } }
@keyframes pt-orbit-in-5 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(-122px,70px,45px) scale(1); } }
@keyframes pt-orbit-in-6 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(-122px,-70px,-25px) scale(1); } }

@keyframes pt-float-1 { 0%,100% { transform: translate3d(0px,-140px,40px) rotate(0deg); }   50% { transform: translate3d(6px,-158px,65px) rotate(180deg); } }
@keyframes pt-float-2 { 0%,100% { transform: translate3d(122px,-70px,-30px) rotate(0deg); } 50% { transform: translate3d(138px,-84px,-8px) rotate(-160deg); } }
@keyframes pt-float-3 { 0%,100% { transform: translate3d(122px,70px,55px) rotate(0deg); }   50% { transform: translate3d(140px,86px,80px) rotate(160deg); } }
@keyframes pt-float-4 { 0%,100% { transform: translate3d(0px,140px,-40px) rotate(0deg); }   50% { transform: translate3d(-8px,160px,-15px) rotate(-180deg); } }
@keyframes pt-float-5 { 0%,100% { transform: translate3d(-122px,70px,45px) rotate(0deg); }  50% { transform: translate3d(-140px,84px,70px) rotate(180deg); } }
@keyframes pt-float-6 { 0%,100% { transform: translate3d(-122px,-70px,-25px) rotate(0deg); } 50% { transform: translate3d(-138px,-88px,-5px) rotate(-160deg); } }

.pt-fade-out .pt-shape-1 { animation: pt-orbit-out-1 0.42s ease-in forwards; }
.pt-fade-out .pt-shape-2 { animation: pt-orbit-out-2 0.42s ease-in forwards 0.02s; }
.pt-fade-out .pt-shape-3 { animation: pt-orbit-out-3 0.42s ease-in forwards 0.04s; }
.pt-fade-out .pt-shape-4 { animation: pt-orbit-out-4 0.42s ease-in forwards 0.06s; }
.pt-fade-out .pt-shape-5 { animation: pt-orbit-out-5 0.42s ease-in forwards 0.08s; }
.pt-fade-out .pt-shape-6 { animation: pt-orbit-out-6 0.42s ease-in forwards 0.1s; }

@keyframes pt-orbit-out-1 { from { opacity:1; } to { opacity:0; transform: translate3d(0px,-280px,220px) scale(1.4); } }
@keyframes pt-orbit-out-2 { from { opacity:1; } to { opacity:0; transform: translate3d(244px,-140px,220px) scale(1.4); } }
@keyframes pt-orbit-out-3 { from { opacity:1; } to { opacity:0; transform: translate3d(244px,140px,220px) scale(1.4); } }
@keyframes pt-orbit-out-4 { from { opacity:1; } to { opacity:0; transform: translate3d(0px,280px,220px) scale(1.4); } }
@keyframes pt-orbit-out-5 { from { opacity:1; } to { opacity:0; transform: translate3d(-244px,140px,220px) scale(1.4); } }
@keyframes pt-orbit-out-6 { from { opacity:1; } to { opacity:0; transform: translate3d(-244px,-140px,220px) scale(1.4); } }

/* =========================================================================
   کارت لوگو — ورود با فلیپ سه‌بعدی، شناوری زنده، حلقه نوری چرخان و درخشش عبوری
   ========================================================================= */
.pt-logo-wrap {
  transform-style: preserve-3d;
}

.pt-logo-wrap > div {
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  opacity: 0;
  transform: perspective(1000px) rotateY(-130deg) rotateX(8deg) scale(.4) translateZ(-90px);
}

.active .pt-logo-wrap > div {
  animation: pt-logo-in 0.85s cubic-bezier(.2,.8,.25,1.15) forwards 0.35s,
             pt-logo-float 3.4s ease-in-out infinite 1.25s;
  box-shadow: 0 0 0 rgba(0, 136, 240, 0);
}

.pt-fade-out .pt-logo-wrap > div {
  animation: pt-logo-out 0.5s cubic-bezier(.5,0,.8,1) forwards;
}

@keyframes pt-logo-in {
  0%   { opacity: 0; transform: perspective(1000px) rotateY(-130deg) rotateX(8deg) scale(.4) translateZ(-90px); }
  55%  { opacity: 1; }
  75%  { transform: perspective(1000px) rotateY(14deg) rotateX(-5deg) scale(1.07) translateZ(15px); }
  100% { opacity: 1; transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0); }
}
@keyframes pt-logo-float {
  0%, 100% { transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0) translateZ(0); }
  50%      { transform: perspective(1000px) rotateY(7deg) rotateX(-4deg) translateY(-9px) translateZ(22px); }
}
@keyframes pt-logo-out {
  0%   { opacity: 1; transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0); }
  100% { opacity: 0; transform: perspective(1000px) rotateY(38deg) rotateX(-8deg) scale(2) translateZ(300px); }
}

/* حلقه نوری چرخان دور کارت لوگو */
.pt-logo-wrap > div::before {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    transparent 0%, rgba(56, 189, 248, 0.95) 12%, transparent 28%,
    transparent 68%, rgba(37, 87, 214, 0.95) 84%, transparent 100%
  );
  opacity: 0;
  filter: blur(1.5px);
}
.active .pt-logo-wrap > div::before {
  opacity: 1;
  transition: opacity 0.5s ease 0.6s;
  animation: pt-border-spin 3.2s linear infinite;
}
.pt-fade-out .pt-logo-wrap > div::before {
  transition: opacity 0.3s ease;
  opacity: 0;
}
@keyframes pt-border-spin {
  to { transform: rotate(360deg); }
}

/* درخشش عبوری (shine) روی سطح کارت */
.pt-logo-wrap > div::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 35%, rgba(255, 255, 255, 0.28) 50%, transparent 65%);
  background-size: 240% 240%;
  background-position: -160% -160%;
  opacity: 0;
  pointer-events: none;
}
.active .pt-logo-wrap > div::after {
  opacity: 1;
  animation: pt-shine 2.8s ease-in-out infinite 1.5s;
}

@keyframes pt-shine {
  0%       { background-position: -160% -160%; }
  55%, 100%{ background-position: 160% 160%; }
}

/* نفس‌کشیدن ملایم خود تصویر لوگو */
.active .pt-logo-wrap img {
  animation: pt-logo-breathe 3.4s ease-in-out infinite 1.25s;
}
@keyframes pt-logo-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}

/* =========================================================================
   واکنش‌گرا برای موبایل — کوچک‌سازی مقیاس صحنه
   ========================================================================= */
@media (max-width: 640px) {
  .pt-ring-1 { width: 110px; height: 110px; margin: -55px 0 0 -55px; }
  .pt-ring-2 { width: 172px; height: 172px; margin: -86px 0 0 -86px; }
  .pt-ring-3 { width: 240px; height: 240px; margin: -120px 0 0 -120px; }
  .pt-ring-4 { width: 316px; height: 316px; margin: -158px 0 0 -158px; }
  .pt-glow   { width: 360px; height: 360px; margin: -180px 0 0 -180px; }

  @keyframes pt-orbit-in-1 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(0px,-95px,30px) scale(1); } }
  @keyframes pt-orbit-in-2 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(82px,-48px,-22px) scale(1); } }
  @keyframes pt-orbit-in-3 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(82px,48px,38px) scale(1); } }
  @keyframes pt-orbit-in-4 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(0px,95px,-30px) scale(1); } }
  @keyframes pt-orbit-in-5 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(-82px,48px,32px) scale(1); } }
  @keyframes pt-orbit-in-6 { from { opacity:0; transform: translate3d(0,0,0) scale(.2); } to { opacity:1; transform: translate3d(-82px,-48px,-18px) scale(1); } }
}

/* =========================================================================
   احترام به تنظیمات کاهش انیمیشن سیستم‌عامل
   ========================================================================= */
@media (prefers-reduced-motion: reduce) {
  .pt-grid, .pt-ring, .pt-shape, .pt-glow,
  .page-transition-overlay::before {
    animation: none !important;
    transition: opacity .3s ease !important;
  }
  .pt-ring { opacity: .6; transform: translate(-50%, -50%) scale(1); }
  .pt-logo-wrap > div {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .pt-logo-wrap > div::before,
  .pt-logo-wrap > div::after,
  .pt-logo-wrap img { animation: none !important; }
}