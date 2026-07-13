import "./PageTransition.css";
import { useEffect, useRef, useState } from 'react';

interface Props {
  active: boolean;
  onDone: () => void;
}

export default function PageTransition({ active, onDone }: Props) {
  const [fadingOut, setFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    setFadingOut(false);
    setMounted(false);

    const mountTimer = requestAnimationFrame(() => setMounted(true));
    const fadeTimer = setTimeout(() => setFadingOut(true), 1400);
    const doneTimer = setTimeout(() => {
      onDoneRef.current();
      setFadingOut(false);
      setMounted(false);
    }, 1900);

    return () => {
      cancelAnimationFrame(mountTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [active]);

  return (
    <div
      className={`page-transition-overlay ${mounted ? 'active' : ''} ${fadingOut ? 'pt-fade-out' : ''}`}
      dir="rtl"
    >
      <div className="pt-grid" />

      <div className="pt-ring pt-ring-1" />
      <div className="pt-ring pt-ring-2" />
      <div className="pt-ring pt-ring-3" />
      <div className="pt-ring pt-ring-4" />

      <div className="pt-glow" />

      <div className="pt-shape pt-shape-1">
        <div className="w-4 h-4 rounded-full bg-sky-400/60 shadow-[0_0_12px_rgba(0,136,240,0.5)]" />
      </div>
      <div className="pt-shape pt-shape-2">
        <div className="w-3 h-3 rotate-45 bg-blue-500/50 shadow-[0_0_10px_rgba(37,87,214,0.4)]" />
      </div>
      <div className="pt-shape pt-shape-3">
        <div className="w-3.5 h-3.5 rounded-sm border border-sky-300/50 shadow-[0_0_10px_rgba(0,136,240,0.3)]" />
      </div>
      <div className="pt-shape pt-shape-4">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-300/50 shadow-[0_0_8px_rgba(0,136,240,0.4)]" />
      </div>
      <div className="pt-shape pt-shape-5">
        <div className="w-3 h-3 rotate-12 border border-blue-400/40 shadow-[0_0_8px_rgba(37,87,214,0.3)]" />
      </div>
      <div className="pt-shape pt-shape-6">
        <div className="w-2 h-2 rotate-45 bg-sky-300/50 shadow-[0_0_8px_rgba(0,136,240,0.3)]" />
      </div>

      <div className="pt-logo-wrap relative z-10 flex items-center justify-center">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
          <img
            src="/tunnelsaddariana_logo.jpg"
            alt="لوگو"
            className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
