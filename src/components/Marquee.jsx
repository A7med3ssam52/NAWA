import { Sparkle } from "lucide-react";

const defaultItems = [
  "برغموت",
  "فانيلا",
  "عود",
  "ورد",
  "ياسمين",
  "مسك أبيض",
  "عنبر",
  "جريب فروت",
  "ثبات يدوم",
  "توصيل سريع",
];

// شريط لفّة متحرك — بنفس التركيبة في الهيرو، ويقبل أسماء مخصصة بأي سرعة وأي ألوان
// (في بانر الكتالوج بنلف أسماء العطور نفسها ببطء أكبر وإحساس أهدأ)
export default function Marquee({
  items = defaultItems,
  duration = 28,
  className = "border-y border-ink-950 bg-ink-950 py-3",
  itemClass = "text-sm font-extrabold tracking-wide text-cream-100",
}) {
  const row = [...items, ...items];
  return (
    <div dir="ltr" className={`overflow-hidden ${className}`}>
      <div
        className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap"
        style={{ animationName: "marquee", animationDuration: `${duration}s` }}
      >
        {row.map((t, i) => (
          <span key={i} className={`flex items-center gap-8 whitespace-nowrap ${itemClass}`}>
            {t} <Sparkle size={14} strokeWidth={2.5} className="opacity-50" />
          </span>
        ))}
      </div>
    </div>
  );
}
