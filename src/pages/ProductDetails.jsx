import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star, FlaskConical, Check, MessageCircle, Sparkles, Sun, Clock, Gauge, Timer, Sunrise, Heart, Moon, ShoppingCart,
} from "lucide-react";
import { PRODUCTS } from "../data/products";
import ProductCard from "../components/ProductCard";
import PerfumePlaceholder from "../components/PerfumePlaceholder";
import Marquee from "../components/Marquee";
import CountUp from "../components/CountUp";
import { orderLink } from "../config/store";
import { useCart } from "../context/CartContext";
import { setMeta } from "../utils/setMeta";
import { toArabicIndex } from "../utils/plural";
import { SEASON_ICONS, intensityLevel } from "../utils/perfume";

// رحلة العطر: ٣ مراحل بترتيب زمني — ولون المرحلة بيغمق مع العمق (من الرشة الأولى للقاعدة)
const NOTE_STAGES = [
  { key: "المقدمة", field: "top", icon: Sunrise, hint: "أول 15 دقيقة", chip: "bg-ink-950/8 text-ink-950" },
  { key: "القلب", field: "heart", icon: Heart, hint: "من 15 دقيقة لـ3 ساعات", chip: "bg-ink-800 text-cream-50" },
  { key: "القاعدة", field: "base", icon: Moon, hint: "من 3 ساعات لآخر اليوم", chip: "bg-ink-950 text-cream-50" },
];

const TRUST = ["الدفع عند الاستلام", "معاينة قبل الدفع", "استبدال 7 أيام", "تغليف هدايا مجاني"];

// النوتات مخزّنة نص واحد بفواصل «،» → بنفوّقها شيبس مستقلة
const splitNotes = (t) =>
  String(t || "")
    .split(/[،,]/)
    .map((x) => x.trim())
    .filter(Boolean);

// أطول مدة في نص الثبات («8-10 ساعات» → 10) — للشريط البصري فقط
const longevityHours = (t) => {
  const nums = String(t || "").match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 0;
};

// الحجم الافتراضي المختار: ٥٠ مل لو متاح (الأكثر طلباً)، وإلا أول حجم موجود
function defaultSize(p) {
  if (!p) return null;
  return p.sizes?.find((s) => String(s).includes("50")) || p.sizes?.[0] || p.size || null;
}

// حركة موحّدة للأقسام — تظهر مرة واحدة مع نزول الصفحة
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function ProductDetails() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === id);
  const [size, setSize] = useState(() => defaultSize(product));
  const { addItem } = useCart();
  const [imgIndex, setImgIndex] = useState(0);

  // بيانات meta كبدائيات حتى الاختيارات تبقى نظيفة ومراقَبة
  const metaTitle = product?.name;
  const metaImage = product?.images?.[0] || "/products/Naseem_50ml.png";
  const metaDesc = product
    ? `${product.tagline} — عائلة ${product.family} بتركيز ${product.concentration}. اطلب عبر واتساب`
    : undefined;
  const metaPath = product ? `/product/${product.id}` : window.location.pathname;

  useEffect(() => {
    if (metaTitle) {
      setMeta({ title: metaTitle, description: metaDesc, image: metaImage, path: metaPath });
    } else {
      setMeta({
        title: "العطر مش موجود",
        description: "الرابط اللي وصلت منه مش لعطر من كتالوج NAWA — تصفح كل العطور من صفحة المتجر.",
        path: metaPath,
      });
    }
  }, [metaTitle, metaDesc, metaImage, metaPath]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-36 pb-20 text-center">
        <p className="font-display text-4xl font-bold">العطر مش موجود</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink-950 px-8 py-3 font-bold text-cream-50">
          ارجع للمتجر
        </Link>
      </div>
    );
  }

  const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const shown = related.length ? related : PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  const images = product.images || [];
  const mainImg = images[imgIndex] || product.image;
  // طابع الصورة: حريمي بينك / رجالي فحمي / جنسين بني — في صفحة المنتج فقط
  const isWomen = product.category === "نسائي";
  const isUnisex = product.category === "للجنسين";
  const heroBg = isWomen ? "bg-wine-900" : isUnisex ? "bg-[#221E1A]" : "bg-ink-950";
  const heroGlow = isWomen ? "bg-[#E08CA3]/20" : "bg-cream-100/12";

  const notes = product.notes || {};
  const allNotes = [...splitNotes(notes.top), ...splitNotes(notes.heart), ...splitNotes(notes.base)];
  const level = intensityLevel(product.intensity);
  const hours = longevityHours(product.longevity);
  const hasPrice = typeof product.price === "number";

  // مواصفات عطرية — النص الجاف بقى بصر: أيقونات موسم، شيبس مناسبة، شرائط شدة وثبات
  const tiles = [
    {
      k: "العائلة العطرية",
      icon: Sparkles,
      node: <p className="font-extrabold text-ink-950">{product.family}</p>,
    },
    {
      k: "التركيز",
      icon: FlaskConical,
      node: <p className="font-extrabold text-ink-950">{product.concentration}</p>,
    },
    {
      k: "الموسم",
      icon: Sun,
      node: (
        <div className="flex flex-wrap gap-1.5">
          {(product.season ?? []).map((s) => {
            const Icon = SEASON_ICONS[s];
            return (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-cream-200/70 px-2.5 py-1 text-xs font-bold text-ink-800">
                {Icon && <Icon size={13} strokeWidth={2.2} aria-hidden="true" />}
                {s}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      k: "المناسبة",
      icon: Clock,
      node: (
        <div className="flex flex-wrap gap-1.5">
          {(product.occasion ?? []).map((o) => (
            <span key={o} className="rounded-full bg-cream-200/70 px-2.5 py-1 text-xs font-bold text-ink-800">
              {o}
            </span>
          ))}
        </div>
      ),
    },
    {
      k: "شدة الحضور",
      icon: Gauge,
      node: (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <motion.span
                key={n}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: n * 0.08 }}
                className={`h-2 w-7 origin-right rounded-full ${n <= level ? "bg-ink-950" : "bg-ink-950/12"}`}
              />
            ))}
          </span>
          <span className="text-xs font-bold text-ink-500">{product.intensity}</span>
        </div>
      ),
    },
    {
      k: "الثبات",
      icon: Timer,
      node: (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-950/10">
            <motion.span
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, Math.round((hours / 12) * 100))}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="block h-full rounded-full bg-ink-950"
            />
          </div>
          <p className="mt-1.5 text-xs font-bold text-ink-500">{product.longevity}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="pb-16">
      {/* ===== الهيرو الداكن: صورة معلّقة في إطار + قرار الشراء كله فوق ===== */}
      <section className={`grain relative overflow-hidden rounded-b-[2.5rem] ${heroBg} px-4 pt-24 pb-12 text-cream-50 md:px-8 md:pt-32 md:pb-16 transition-colors duration-700`}>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl md:h-[560px] md:w-[560px] ${heroGlow}`}
        />
        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-6 text-sm font-bold text-cream-100/60">
            <Link to="/" className="hover:text-cream-50">الرئيسية</Link> /{" "}
            <Link to="/shop" className="hover:text-cream-50">المتجر</Link> /{" "}
            <span className="text-cream-50">{product.name}</span>
          </nav>

          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {/* الصورة */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-6 rounded-[3rem] bg-cream-100/10 blur-2xl" />
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-ink-900 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] ring-1 ring-cream-100/12">
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={`عطر ${product.name} — ${product.tagline}`}
                      width={720}
                      height={1280}
                      fetchPriority="high"
                      decoding="async"
                      className="h-[380px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] md:h-[560px]"
                    />
                  ) : (
                    <PerfumePlaceholder name={product.name} nameEn={product.nameEn} large className="h-[380px] md:h-[560px]" />
                  )}
                  {/* لمعة زجاجية تعبر الصورة مع الهوفر */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-cream-50/25 to-transparent transition-transform duration-[1100ms] group-hover:translate-x-full"
                  />
                  {product.badge && (
                    <span className="absolute top-4 right-4 rounded-full bg-ink-950/90 px-4 py-2 text-sm font-extrabold text-cream-50 backdrop-blur">
                      {product.badge}
                    </span>
                  )}
                  <span className="absolute bottom-4 right-4 -rotate-6 rounded-full bg-cream-50/95 px-3 py-1.5 text-[11px] font-extrabold text-ink-950 shadow-lg">
                    {product.concentration}
                  </span>
                </div>
              </div>

              {images.length > 1 && (
                <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setImgIndex(i)}
                      className={`shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                        i === imgIndex ? "border-cream-50 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`صورة ${i + 1} من ${product.name}`}
                    >
                      <img src={src} alt="" className="h-20 w-20 object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* قرار الشراء */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="text-xs font-bold tracking-[0.3em] text-cream-100/65">
                {product.category} · <span className="text-shine font-extrabold">{product.nameEn}</span>
              </p>
              <h1 className="font-display mt-2 text-5xl leading-tight font-bold md:text-7xl">{product.name}</h1>
              <p className="mt-3 max-w-lg text-lg text-cream-100/75">{product.tagline}</p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-cream-100/15 bg-cream-50/5 px-3 py-1.5 text-xs font-bold text-cream-100/80">
                <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
                مستوحى من {product.inspiredBy}
              </span>

              {typeof product.rating === "number" && (
                <div className="mt-4 flex items-center gap-2">
                  <Star size={19} strokeWidth={0} fill="currentColor" className="text-cream-50" />
                  <b className="text-lg">{product.rating}</b>
                  <span className="text-cream-100/60">({product.reviews} تقييم موثّق)</span>
                </div>
              )}

              <div className="mt-6 flex items-end gap-3">
                {hasPrice ? (
                  <>
                    <p className="text-4xl font-black">{product.price.toLocaleString("ar-EG")} ج</p>
                    {product.oldPrice && (
                      <p className="pb-1 text-lg font-bold text-cream-100/50 line-through">
                        {product.oldPrice.toLocaleString("ar-EG")} ج
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-3xl font-black">اطلب لمعرفة السعر</p>
                )}
              </div>

              {product.sizes?.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-extrabold text-cream-100/70">اختار الحجم:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        aria-pressed={size === s}
                        className={`rounded-full px-6 py-2.5 font-extrabold transition-all ${
                          size === s
                            ? "bg-cream-50 text-ink-950 shadow-lg"
                            : "border border-cream-100/20 text-cream-50 hover:border-cream-100/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <a
                  href={orderLink(product.name, size || product.size, product.sizes)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cream-50 px-6 py-4 text-center text-lg font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-[1.03] active:scale-[0.99]"
                >
                  <MessageCircle size={20} strokeWidth={2.2} aria-hidden="true" />
                  اطلب عبر واتساب
                </a>
                <button
                  type="button"
                  onClick={() => addItem(product, size || product.size)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-6 py-4 text-center text-lg font-extrabold text-cream-50 shadow-xl transition-transform hover:scale-[1.03] active:scale-[0.99]"
                >
                  <ShoppingCart size={20} strokeWidth={2.2} aria-hidden="true" />
                  أضف للسلة
                </button>
                <Link
                  to="/shop"
                  className="rounded-full border border-cream-100/25 px-6 py-4 text-center text-lg font-extrabold text-cream-50 transition-colors hover:bg-cream-50/10"
                >
                  كمّل تصفّح
                </Link>
              </div>
              <p className="mt-3 text-sm font-semibold text-cream-100/65">
                سعر العطر والحجم يتأكّد معك على واتساب قبل الشحن — من دون أي التزام.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-cream-100/70">
                {TRUST.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-cream-50/10 px-3 py-1.5">
                    <Check size={13} strokeWidth={3} className="text-cream-50" aria-hidden="true" />
                    {t}
                  </span>
                ))}
              </div>

              {/* لمحة سريعة */}
              <div className="mt-7 grid grid-cols-3 gap-3 border-t border-cream-100/10 pt-5">
                {[
                  { icon: FlaskConical, k: "التركيز", v: product.concentration },
                  { icon: Timer, k: "الثبات", v: product.longevity },
                  { icon: Sparkles, k: "العائلة", v: product.family },
                ].map(({ icon: Icon, k, v }) => (
                  <div key={k}>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-cream-100/60">
                      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
                      {k}
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-cream-50">{v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-12 md:px-8 md:pt-16">
        {/* ===== قصة العطر — الوصف بقى اقتباس تحريري ===== */}
        <motion.section {...rise()} className="relative overflow-hidden rounded-[2rem] border border-ink-950/10 bg-cream-50 p-6 shadow-sm md:p-10">
          <span
            aria-hidden="true"
            className="font-display pointer-events-none absolute -top-8 left-4 text-[8rem] leading-none text-ink-950/5 select-none"
          >
            ”
          </span>
          <p className="relative text-xs font-extrabold tracking-[0.3em] text-ink-400">قصة العطر</p>
          <p className="font-display relative mt-3 text-xl leading-loose font-bold text-ink-950 md:text-2xl md:leading-[1.9]">
            {product.desc}
          </p>
          <p className="relative mt-4 text-sm font-bold text-ink-400">
            {product.family} · {product.concentration}
          </p>
        </motion.section>

        {/* ===== رحلة العطر — النوتات على ٣ مراحل بترتيب زمني ===== */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">رحلة العطر</h2>
              <p className="mt-1 text-sm font-bold text-ink-500">
                <CountUp value={allNotes.length} /> نوتة عطرية على ٣ مراحل — من الرشة الأولى لآخر اليوم
              </p>
            </div>
            <span className="hidden text-xs font-bold tracking-widest text-ink-400 md:block">TOP · HEART · BASE</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {NOTE_STAGES.map(({ key, field, icon: Icon, hint, chip }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-ink-950/10 bg-cream-50 p-5 shadow-sm"
              >
                <span className="font-display pointer-events-none absolute -top-2 left-3 text-5xl leading-none font-bold text-ink-950/6 select-none">
                  {toArabicIndex(i + 1)}
                </span>
                <span className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${chip}`}>
                  <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                  <span className="text-xs font-extrabold">{key}</span>
                </span>
                <p className="relative mt-3 text-[11px] font-bold tracking-wider text-ink-400">{hint}</p>
                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  {splitNotes(notes[field]).length ? (
                    splitNotes(notes[field]).map((n) => (
                      <span key={n} className="rounded-full bg-cream-200/70 px-2.5 py-1 text-xs font-bold text-ink-800">
                        {n}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-ink-400">تُضاف قريباً — افتتاحية وقاعدة من البوستر الرسمي</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== المواصفات — كل نص جاف بقى بصر ===== */}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-bold md:text-4xl">المواصفات العطرية</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map(({ k, icon: Icon, node }, i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
                className="rounded-2xl border border-ink-950/10 bg-cream-50 p-4 shadow-sm"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-950/6 text-ink-800">
                  <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <p className="mt-2.5 text-[11px] font-bold tracking-wider text-ink-500">{k}</p>
                <div className="mt-1">{node}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== نهاية داكنة: القرار + لفة النوتات ===== */}
        <motion.section {...rise()} className={`grain relative mt-12 overflow-hidden rounded-[2.5rem] ${heroBg} text-cream-50 transition-colors duration-700`}>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-32 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-3xl ${heroGlow}`}
          />
          <div className="relative px-6 pt-10 pb-8 text-center md:px-12">
            <h2 className="font-display text-3xl leading-snug font-bold text-balance md:text-4xl">
              خلاص عرفت عطرك؟
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-cream-100/70">
              {product.name} — {product.tagline}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={orderLink(product.name, size || product.size, product.sizes)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-7 py-4 text-lg font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-[1.03] active:scale-[0.99]"
              >
                <MessageCircle size={20} strokeWidth={2.2} aria-hidden="true" />
                اطلب {product.name} على واتساب
              </a>
              <Link
                to="/shop"
                className="rounded-full border border-cream-100/25 px-7 py-4 text-lg font-extrabold text-cream-50 transition-colors hover:bg-cream-50/10"
              >
                شوف كل العطور
              </Link>
            </div>
          </div>
          <Marquee
            items={allNotes.length ? allNotes : [product.name]}
            duration={36}
            className="border-t border-cream-100/10 py-3"
            itemClass="font-display text-base font-bold text-cream-100/55"
          />
        </motion.section>

        {/* ===== عطور مشابهة ===== */}
        <div className="mt-14">
          <h2 className="font-display mb-6 text-3xl font-bold">عطور مشابهة هتعجبك</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
