import { ImagePlus } from "lucide-react";

// خط زجاجة عطر — رسم تحريري بسيط بدل أيقونة «صورة ناقصة»
function BottleSketch({ className }) {
  return (
    <svg viewBox="0 0 80 116" fill="none" aria-hidden="true" className={className}>
      <rect x="29" y="4" width="22" height="15" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M35 19v9h10v-9" stroke="currentColor" strokeWidth="1.4" />
      <rect x="14" y="30" width="52" height="80" rx="14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 46h52" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <rect x="26" y="58" width="28" height="34" rx="3" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <path d="M31 68h18M31 76h18M31 84h12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// بوستر بديل للعطور اللي صورها لسه ماوصلتش — تصميم مقصود بنفس لغة الموقع الداكنة
export default function PerfumePlaceholder({ name, nameEn, large = false, className = "h-64" }) {
  return (
    <div
      className={`grain relative flex w-full flex-col items-center justify-center overflow-hidden bg-ink-950 text-cream-50 ${className}`}
      role="img"
      aria-label={`${name} — صورة العطر قريباً`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(250,244,227,0.14),transparent_62%)]"
      />
      <span className="relative text-[9px] font-bold tracking-[0.45em] text-cream-100/55">NAWA</span>
      <BottleSketch className={`relative text-cream-100/70 ${large ? "my-3 h-[110px]" : "my-1.5 h-[64px]"}`} />
      <span className={`font-display relative leading-none font-bold ${large ? "text-4xl" : "text-2xl"}`}>
        {name}
      </span>
      {nameEn && (
        <span className={`relative mt-2 font-bold tracking-[0.32em] text-cream-100/50 ${large ? "text-xs" : "text-[10px]"}`}>
          {nameEn}
        </span>
      )}
      <span
        className={`relative inline-flex items-center gap-1 font-bold text-cream-100/40 ${
          large ? "mt-4 text-xs" : "mt-1.5 text-[10px]"
        }`}
      >
        <ImagePlus size={large ? 13 : 11} strokeWidth={2} aria-hidden="true" />
        الصورة قريباً
      </span>
    </div>
  );
}
