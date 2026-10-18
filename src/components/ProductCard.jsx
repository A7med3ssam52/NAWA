import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MessageCircle, Sparkles } from "lucide-react";
import { orderLink } from "../config/store";
import { toArabicIndex } from "../utils/plural";
import { SEASON_ICONS, intensityLevel } from "../utils/perfume";
import PerfumePlaceholder from "./PerfumePlaceholder";

// صفوف النوتات الثلاثة — بتنستعمل في الأوفرلاي وفي الكارت المميز
function noteRows(p) {
  return [
    ["مقدمة", p.notes?.top],
    ["قلب", p.notes?.heart],
    ["قاعدة", p.notes?.base],
  ].filter(([, v]) => v);
}

// «10 مل · 50 مل · 100 مل» → «10 · 50 · 100 مل» — نص مختصر يليق بشيب الكارت
function sizesLabel(sizes, fallback) {
  if (!sizes?.length) return fallback || null;
  const numbers = sizes.map((s) => String(s).replace(/\s*مل\s*/g, "").trim());
  return `${numbers.join(" · ")} مل`;
}

export default function ProductCard({ p, index = 0, featured = false }) {
  const imgSrc = p.images?.[0] || p.image;
  const hasPrice = typeof p.price === "number";
  const discount =
    p.oldPrice && hasPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const level = intensityLevel(p.intensity);
  const num = toArabicIndex(index + 1);
  const sizeChip = sizesLabel(p.sizes, p.size);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.22 } }}
      transition={{
        y: { duration: 0.55, delay: (index % 4) * 0.08 },
        opacity: { duration: 0.55, delay: (index % 4) * 0.08 },
        layout: { type: "spring", bounce: 0.18, duration: 0.6 },
      }}
      className={`group relative overflow-hidden rounded-3xl border border-ink-950/8 bg-cream-50 shadow-[0_10px_40px_-15px_rgba(10,10,10,0.25)] transition-[box-shadow,translate] duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_-15px_rgba(10,10,10,0.35)] ${
        featured ? "sm:col-span-2 sm:grid sm:grid-cols-2" : ""
      }`}
    >
      {/* ===== الصورة ===== */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${p.id}`} aria-label={`تفاصيل ${p.name}`}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={p.name}
              loading="lazy"
              className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${featured ? "h-72 sm:absolute sm:inset-0 sm:h-full" : "h-64"}`}
            />
          ) : (
            <PerfumePlaceholder
              name={p.name}
              nameEn={p.nameEn}
              large={featured}
              className={featured ? "h-72" : "h-64"}
            />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* الرقم التحريري — إحساس مجلة عطرية */}
        <span
          className={`pointer-events-none absolute top-3 left-4 z-[5] font-display leading-none font-bold text-cream-50/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] ${
            featured ? "text-7xl" : "text-5xl"
          }`}
        >
          {num}
        </span>

        {/* النوتات الظاهرة عند الـhover — تقرر من غير ما تسيب الصفحة */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-2.5 bg-gradient-to-t from-ink-950/95 via-ink-950/70 to-ink-950/35 p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="font-display text-lg font-bold text-cream-50">النوتات العطرية</p>
          {noteRows(p).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="shrink-0 rounded-full bg-cream-50/15 px-2.5 py-0.5 text-[10px] font-bold text-cream-100">
                {k}
              </span>
              <span className="text-xs leading-relaxed text-cream-100/90">{v}</span>
            </div>
          ))}
        </div>

        {/* طلب واتساب سريع يظهر مع الـhover — مركز تحت الصورة */}
        <a
          href={orderLink(p.name, p.size, p.sizes)}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-cream-100/25 bg-cream-50/15 px-4 py-2 text-xs font-extrabold whitespace-nowrap text-cream-50 opacity-0 backdrop-blur transition-all duration-300 group-hover:flex group-hover:opacity-100"
        >
          <MessageCircle size={14} strokeWidth={2.4} />
          اطلب واتساب سريع
        </a>

        {p.badge && (
          <span className="absolute top-3 right-3 z-20 rounded-full bg-ink-950/90 px-3 py-1.5 text-xs font-extrabold text-cream-50 backdrop-blur">
            {p.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute bottom-3 left-3 z-20 rounded-full bg-cream-50 px-3 py-1.5 text-xs font-extrabold text-ink-950 shadow-lg">
            خصم {discount}%
          </span>
        )}
        {sizeChip && (
          <span className="absolute bottom-3 right-3 z-20 rounded-full bg-cream-50/90 px-3 py-1 text-xs font-bold text-ink-800 backdrop-blur">
            {sizeChip}
          </span>
        )}
      </div>

      {/* ===== المحتوى ===== */}
      <div className={`flex flex-col ${featured ? "justify-center p-6 md:p-7" : "p-5"}`}>
        <p className="text-xs font-bold tracking-widest text-ink-500">{p.category} · {p.nameEn}</p>
        <Link to={`/product/${p.id}`}>
          <h3 className={`font-display mt-1 font-bold transition-colors hover:text-ink-700 ${featured ? "text-3xl" : "text-2xl"}`}>
            {p.name}
          </h3>
        </Link>
        {p.inspiredBy && (
          <span className="mt-2 inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-ink-950/10 bg-cream-100 px-3 py-1 text-[11px] font-bold text-ink-500">
            <Sparkles size={12} strokeWidth={2} className="shrink-0 text-ink-400" />
            <span className="truncate">مستوحى من {p.inspiredBy}</span>
          </span>
        )}
        <p className={`mt-1 leading-relaxed text-ink-500 ${featured ? "line-clamp-3 text-sm" : "line-clamp-2 min-h-[3.25em] text-sm"}`}>
          {p.tagline}
        </p>

        {/* المميز: النوتات ظاهرة دايماً — نفسه ورقة العطر */}
        {featured && (
          <div className="mt-3 grid gap-1.5 rounded-2xl bg-cream-100 p-3 text-xs font-semibold text-ink-700">
            {noteRows(p).map(([k, v]) => (
              <div key={k} className="flex min-w-0 gap-2">
                <span className="shrink-0 font-extrabold text-ink-950">{k}:</span>
                <span className="min-w-0 flex-1 truncate">{v}</span>
              </div>
            ))}
          </div>
        )}
        {featured && typeof p.rating === "number" && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <Star size={15} strokeWidth={0} fill="currentColor" className="text-ink-950" />
            <b>{p.rating}</b>
            <span className="text-ink-400">({p.reviews} تقييم)</span>
          </div>
        )}

        {/* الشدة بالنقط + أيقونات الموسم + الثبات */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold text-ink-500">
          <span className="inline-flex items-center gap-1" title={`الشدة: ${p.intensity}`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-3.5 rounded-full ${n <= level ? "bg-ink-950" : "bg-ink-950/15"}`}
              />
            ))}
            <span className="sr-only">شدة {p.intensity}</span>
          </span>
          {(p.season ?? []).map((s) => {
            const Icon = SEASON_ICONS[s];
            if (!Icon) return null;
            return (
              <span key={s} className="inline-flex items-center text-ink-800" title={s}>
                <Icon size={14} strokeWidth={2} aria-label={s} />
              </span>
            );
          })}
          {p.longevity && <span className="text-ink-400">{p.longevity}</span>}
        </div>

        {typeof p.rating === "number" && !featured && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star size={15} strokeWidth={0} fill="currentColor" className="text-ink-950" />
            <b>{p.rating}</b>
            <span className="text-ink-400">({p.reviews} تقييم)</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            {hasPrice ? (
              <p className="text-2xl font-black text-ink-950">{p.price.toLocaleString("ar-EG")} ج</p>
            ) : (
              <p className="text-lg font-black text-ink-950">السعر عند الطلب</p>
            )}
            {p.oldPrice && (
              <p className="text-sm font-bold text-ink-400 line-through">{p.oldPrice.toLocaleString("ar-EG")} ج</p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <a
            href={orderLink(p.name, p.size, p.sizes)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-4 py-3 text-center text-[15px] font-extrabold text-cream-50 shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <MessageCircle size={16} strokeWidth={2.3} aria-hidden="true" />
            اطلب عبر واتساب
          </a>
          <Link
            to={`/product/${p.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-950/15 px-4 py-2.5 text-center text-sm font-extrabold transition-colors hover:border-ink-950 hover:bg-ink-950/5"
          >
            التفاصيل والنوتات
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
