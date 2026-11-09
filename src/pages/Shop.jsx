import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Crown, Droplets, Flame, Grape, RotateCcw, Search, SearchX, SlidersHorizontal } from "lucide-react";
import CatalogBanner from "../components/CatalogBanner";
import CountUp from "../components/CountUp";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, FAMILY_KEYWORDS, MOODS, PRODUCTS, SEASONS } from "../data/products";
import { perfumeAvailability } from "../utils/plural";
import { setMeta } from "../utils/setMeta";

// أيقونات line الموضوعة بجانب المزاج — من نفس مجموعة الموقع (لون currentColor بتدخل مع حالة الشيب)
const MOOD_ICONS = {
  fresh: Droplets,
  warm: Flame,
  sweet: Grape,
  bold: Crown,
};

// تسطيح النص للبحث العربي: نزع الحركات والتطويل + توحيد الهمزات والتاء المربوطة والألف المقصورة
const normalize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

const searchHaystack = (p) =>
  [p.name, p.nameEn, p.tagline, p.category, p.notes?.top, p.notes?.heart, p.notes?.base, p.desc]
    .filter(Boolean)
    .map(normalize)
    .join(" ");

// فلترة + ترتيب نقية برا الكومبوننت — كل الشروط أند، و«طوال العام» بيولّف أي موسم مختار
function buildList({ cat, moodsKey, season, family, query, sort }) {
  let r = [...PRODUCTS];
  if (cat !== "الكل") r = r.filter((p) => p.category === cat);
  if (moodsKey) {
    const chosen = moodsKey.split(",");
    const activeMoods = MOODS.filter((m) => chosen.includes(m.id));
    r = r.filter((p) => activeMoods.some((m) => m.match(p)));
  }
  if (season)
    r = r.filter((p) => (p.season ?? []).includes(season) || (p.season ?? []).includes("طوال العام"));
  if (family) r = r.filter((p) => String(p.family || "").includes(family));
  const q = normalize(query.trim());
  if (q) r = r.filter((p) => searchHaystack(p).includes(q));

  // الأسعار حالياً null — نتجنب أي NaN ونخلّي المنتجات من غير سعر في الآخر
  const priceOf = (x) => (typeof x.price === "number" ? x.price : null);
  const nullsLast = (a, b, cmp) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return cmp(pa, pb);
  };
  if (sort === "cheap") r.sort((a, b) => nullsLast(a, b, (x, y) => x - y));
  if (sort === "expensive") r.sort((a, b) => nullsLast(a, b, (x, y) => y - x));
  if (sort === "rating") r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return r;
}

// لما مفيش نتايج — بنرشح أقرب 3 عطور: بندوّر على تقاطع كلمات البحث مع العائلة والنوتات والموسم
// ولو مفيش بحث أصلاً (مجرد فلتر قفران) بنرشح أول 3 عطور من الترتيب التميز
function pickSuggestions(list, query) {
  if (list.length > 0) return [];
  const tokens = normalize(query.trim()).split(/\s+/).filter((t) => t.length >= 2);
  const scored = PRODUCTS.map((p) => {
    const hay = normalize(
      [p.family, p.notes?.top, p.notes?.heart, p.notes?.base, p.tagline, (p.season ?? []).join(" ")]
        .filter(Boolean)
        .join(" ")
    );
    return { p, score: tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score);
  const top = tokens.length ? scored.filter((s) => s.score > 0).slice(0, 3) : scored.slice(0, 3);
  return top.map((s) => s.p);
}

export default function Shop() {
  const [params, setSearchParams] = useSearchParams();
  const cat = params.get("cat") || "الكل";
  const moods = (params.get("mood") || "").split(",").filter(Boolean);
  const season = params.get("season") || "";
  const family = params.get("family") || "";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  // لو حد فتح رابط فيه فلاتر موسم/عائلة — نخلّي الباب الممدود مفتوح من الأول
  // الباب الممتد للموسم/العائلة: يرجّع تلقائياً من الفلاتر لما المستخدم ما يتلمسش (وصل من رابط فيه فلاتر)
  const [advancedChoice, setAdvancedChoice] = useState(null); // null = مش متلمس
  const showAdvanced = advancedChoice ?? Boolean(season || family);

  useEffect(() => {
    setMeta({
      title: "كل العطور",
      description: "كتالوج NAWA كامل — عطور رجالية ونسائية وللجنسين بتركيز Extrait de Parfum وثبات يدوم. اختار عطرك واطلب عبر واتساب.",
      path: "/shop",
    });
  }, []);

  // كل الفلاتر مصدرها الـ URL — روابط الكتالوج تفضل قابلة للمشاركة من أي تركيبة فلاتر
  const setParam = (key, next) => {
    const nextParams = new URLSearchParams(params);
    if (next === null || next === "") nextParams.delete(key);
    else nextParams.set(key, next);
    setSearchParams(nextParams, { replace: true });
  };

  const updateCat = (next) => setParam("cat", next === "الكل" ? null : next);

  const toggleMood = (id) =>
    setParam("mood", moods.includes(id) ? moods.filter((m) => m !== id).join(",") : [...moods, id].join(","));

  // مفتاح نصي للمزاقات المختارة — دندنسي بسيط ينفع للفحص الثابت واللينت
  const moodsKey = moods.join(",");

  const hasActiveFilters = cat !== "الكل" || moods.length > 0 || !!season || !!family;

  const clearFilters = () => {
    setQuery("");
    setSort("featured");
    // نداء واحد مجمع — نداءات متتالية بـparams قديمة تتداس على بعضها
    setSearchParams(() => {
      const nextParams = new URLSearchParams(params);
      ["cat", "mood", "season", "family"].forEach((k) => nextParams.delete(k));
      return nextParams;
    }, { replace: true });
  };

  const list = buildList({ cat, moodsKey, season, family, query, sort });

  // خيارات السعر/التقييم معطّلة لحد ما البيانات الفعلية تتوفر من صاحب المتجر
  const hasPrices = PRODUCTS.some((p) => typeof p.price === "number");
  const hasRatings = PRODUCTS.some((p) => typeof p.rating === "number");

  // الكارت المميز يظهر بس في الوضع الافتراضي — عشان الحركة تفضل ناعمة وقت الفلترة
  const isClean = !query.trim() && cat === "الكل" && moods.length === 0 && !season && !family;

  // حالة فراغ ذكية: بنركّب أقرب 3 عطور للبحث الدايق ( تقاطع كلمات مع العائلة والنوتات والموسم )
  const suggestions = pickSuggestions(list, query);

  const moodLabel = (id) => MOODS.find((m) => m.id === id)?.label;

  // طابع الصور في صفحة المنتجات فقط — الباك جراوند ياخد نفس طابع الفئة المختارة
  const shopBg = cat === "نسائي" ? "bg-blush-50" : cat === "رجالي" ? "bg-[#F7EFE0]" : cat === "للجنسين" ? "bg-[#FBF6E9]" : "bg-cream-100";
  const activeCatBg = (c) => (c === "نسائي" ? "bg-wine-900 text-cream-50 shadow-lg" : "bg-ink-950 text-cream-50 shadow-lg");

  return (
    <div className={`${shopBg} transition-colors duration-700`}>
      <CatalogBanner cat={cat} />

      {/* البحث والترتيب — بيتحركوا مع الصفحة عادي، مفيش حاجة لاصقة أثناء التكنول */}
      <div className={`border-b border-ink-950/10 ${shopBg} transition-colors duration-700`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 md:px-8">
          <label className="relative min-w-[170px] flex-1">
            <span className="sr-only">بحث في العطور</span>
            <Search size={17} strokeWidth={2.2} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="دوّر بالاسم أو بالنوتات.."
              className="w-full rounded-full border border-ink-950/10 bg-cream-50 py-2.5 pr-11 pl-4 text-sm font-semibold outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="ترتيب النتايج"
            className="shrink-0 rounded-full border border-ink-950/10 bg-cream-50 px-4 py-2.5 text-sm font-bold outline-none"
          >
            <option value="featured">الأكثر تميزاً</option>
            {!hasRatings && <option value="rating" disabled>الأعلى تقييماً — بعد إضافة التقييمات</option>}
            {!hasPrices && <option value="cheap" disabled>السعر: من الأقل — بعد إضافة الأسعار</option>}
            {!hasPrices && <option value="expensive" disabled>السعر: من الأعلى — بعد إضافة الأسعار</option>}
          </select>
          {(hasActiveFilters || query.trim()) && (
            <button
              onClick={clearFilters}
              title="مسح كل الفلاتر"
              aria-label="مسح كل الفلاتر"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-950 p-2.5 text-cream-50 shadow-lg transition-transform hover:scale-105 sm:gap-1.5 sm:p-0 sm:px-4 sm:py-2.5 sm:text-xs sm:font-extrabold"
            >
              <RotateCcw size={14} strokeWidth={2.6} />
              <span className="hidden whitespace-nowrap sm:inline">مسح</span>
              <span className="sr-only">كل الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-8">
        {/* الفئات */}
        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => updateCat(c)}
              aria-pressed={cat === c}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-extrabold transition-all ${
                cat === c
                  ? activeCatBg(c)
                  : "border border-ink-950/12 bg-cream-50 hover:border-ink-950"
              }`}
            >
              {c}
              <span
                className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                  cat === c ? "bg-cream-50/15" : "bg-ink-950/6 text-ink-500"
                }`}
              >
                {c === "الكل" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
        </div>

        {/* اختار مزاجك — إحساس بدل مصطلحات */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold tracking-widest text-ink-400">اختار مزاجك</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const MoodIcon = MOOD_ICONS[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMood(m.id)}
                  aria-pressed={moods.includes(m.id)}
                  title={m.hint}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold transition-all ${
                    moods.includes(m.id)
                      ? "bg-ink-950 text-cream-50 shadow-lg"
                      : "border border-ink-950/12 bg-cream-50 hover:border-ink-950"
                  }`}
                >
                  {MoodIcon && <MoodIcon size={15} strokeWidth={2.4} aria-hidden="true" />}
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* فلاتر أعمق للمحترفين — موسم وعائلة عطرية */}
        <div>
          <button
            onClick={() => setAdvancedChoice(!showAdvanced)}
            aria-expanded={showAdvanced}
            className="inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-4 py-2 text-xs font-extrabold text-ink-500 transition-all hover:border-ink-950 hover:text-ink-950 border border-ink-950/12"
          >
            <SlidersHorizontal size={13} strokeWidth={2.6} />
            فلاتر أكثر
            {(season || family) && (
              <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] text-cream-50 tabular-nums">
                {(season ? 1 : 0) + (family ? 1 : 0)}
              </span>
            )}
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold text-ink-400">الموسم</span>
                    {SEASONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setParam("season", season === s ? null : s)}
                        aria-pressed={season === s}
                        className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all ${
                          season === s
                            ? "bg-ink-950 text-cream-50 shadow"
                            : "border border-ink-950/12 bg-cream-50 hover:border-ink-950"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold text-ink-400">العائلة العطرية</span>
                    {FAMILY_KEYWORDS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setParam("family", family === f ? null : f)}
                        aria-pressed={family === f}
                        className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all ${
                          family === f
                            ? "bg-ink-950 text-cream-50 shadow"
                            : "border border-ink-950/12 bg-cream-50 hover:border-ink-950"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* العداد الحي — الرقم بيتعد مع كل فلتر */}
        <p className="mt-5 mb-5 text-sm font-bold text-ink-500" aria-live="polite">
          <CountUp value={list.length} render={perfumeAvailability} />
          {cat !== "الكل" && ` في فئة ${cat}`}
          {moods.length > 0 && ` بمزاج ${moods.map(moodLabel).filter(Boolean).join(" / ")}`}
          {season && ` لموسم ${season}`}
          {family && ` بعائلة ${family}`}
          {query.trim() && " مع بحثك"}
        </p>

        {list.length === 0 ? (
          /* حالة فراغ ذكية — مش «مفيش» وخلاص، بنقترح أقرب حاجة */
          <div className="rounded-3xl border border-dashed border-ink-950/20 bg-cream-50 p-10 text-center md:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ink-950/6 text-ink-400">
              <SearchX size={30} strokeWidth={1.8} />
            </span>
            <p className="font-display mt-4 text-3xl font-bold">مفيش عطر مطابق للفلاتر دي</p>
            <p className="mt-2 text-ink-500">امسح الفلاتر أو جرّب كلمة مختلفة — ويمكن واحد من دول يحلوها:</p>

            <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-ink-950/10 bg-cream-100 p-3 text-right transition-all hover:border-ink-950 hover:shadow-lg"
                >
                  {p.image ? (
                    <img src={p.image} alt="" loading="lazy" className="h-16 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 text-ink-400">
                      <SearchX size={18} strokeWidth={1.8} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-lg font-bold">{p.name}</span>
                    <span className="block truncate text-[11px] font-bold text-ink-400">{p.family}</span>
                  </span>
                  <ArrowLeft size={16} strokeWidth={2.4} className="shrink-0 text-ink-400 transition-transform group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>

            <button
              onClick={clearFilters}
              className="mt-6 rounded-full bg-ink-950 px-8 py-3 font-extrabold text-cream-50 shadow-lg transition-transform hover:scale-105"
            >
              مسح الفلاتر وارجع للكل
            </button>
          </div>
        ) : (
          <motion.div layout className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {list.map((p, i) => (
                <ProductCard key={p.id} p={p} index={i} featured={isClean && i === 0} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
