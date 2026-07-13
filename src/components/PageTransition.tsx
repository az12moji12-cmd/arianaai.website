import { useEffect, useState } from 'react';

interface Props {
  active: boolean;
  onDone: () => void;
}

export default function PageTransition({ active, onDone }: Props) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!active) return;
    setFadingOut(false);
    const fadeTimer = setTimeout(() => setFadingOut(true), 1600);
    const doneTimer = setTimeout(() => {
      onDone();
      setFadingOut(false);
    }, 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div
      className={`page-transition-overlay active ${fadingOut ? 'pt-fade-out' : ''}`}
      dir="rtl"
    >
      <div className="pt-grid" />

      {/* Rotating dashed rings */}
      <div className="pt-ring pt-ring-1" />
      <div className="pt-ring pt-ring-2" />
      <div className="pt-ring pt-ring-3" />

      {/* Glow behind logo */}
      <div className="pt-glow" />

      {/* Orbiting geometric shapes */}
      <div className="pt-shape pt-shape-1">
        <div className="w-4 h-4 rounded-full bg-sky-400/60 shadow-[0_0_12px_rgba(0,136,240,0.5)]" />
      </div>
      <div className="pt-shape pt-shape-2">
        <div className="w-3 h-3 rotate-45 bg-blue-500/50 shadow-[0_0_10px_rgba(37,87,214,0.4)]" />
      </div>
      <div className="pt-shape pt-shape-3">
        <div className="w-3.5 h-3.5 rounded-sm border border-sky-300/50 shadow-[0_0_10px_rgba(0,136,240,0.3)]" />
      </div>

      {/* Logo center */}
      <div className="pt-logo-wrap relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
          <img
            src="/tunnelsaddariana_logo.jpg"
            alt="لوگو"
            className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-xl"
          />
        </div>
        <p className="mt-5 text-white/80 text-sm md:text-base font-semibold tracking-wide">
          در حال ورود...
        </p>
      </div>
    </div>
  );
}
