import { useEffect, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";

export default function Preloader({ onComplete }) {
  const [exiting, setExiting] = useState(false);

  useLayoutEffect(() => {
    const el = document.getElementById("initial-preloader");
    if (el) el.remove();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 900);
    const t2 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.02 : 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ink-950 text-cream-50"
      aria-label="جارٍ التحميل"
      role="status"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream-50/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: exiting ? 0 : 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-cream-50/20">
          <Logo />
        </div>

        <h1 className="mt-6 font-display text-5xl font-bold tracking-wide text-cream-50">
          NAWA
        </h1>

        <p className="mt-2 text-sm font-semibold tracking-[0.3em] text-cream-200/70">
          عطور تُشبهك
        </p>
      </motion.div>

      <div className="absolute bottom-16 left-1/2 w-48 -translate-x-1/2">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-cream-50/10">
          <div className="h-full w-1/3 rounded-full bg-cream-50 nawa-preload-bar" />
        </div>
        <p className="mt-3 text-center text-[10px] font-bold tracking-[0.4em] text-cream-200/50">
          LOADING
        </p>
      </div>

      <style>{`
        .nawa-preload-bar {
          animation: nawa-preload-bar 1.1s ease-in-out infinite;
        }
        @keyframes nawa-preload-bar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(100%); width: 60%; }
          100% { transform: translateX(250%); width: 30%; }
        }
      `}</style>
    </motion.div>
  );
}