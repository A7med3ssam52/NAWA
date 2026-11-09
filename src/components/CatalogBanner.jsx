import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import CountUp from "./CountUp";
import Marquee from "./Marquee";
import { PRODUCTS } from "../data/products";
import { perfumeCount } from "../utils/plural";

const names = PRODUCTS.map((p) => `${p.name} — ${p.nameEn}`);

// بانر الكتالوج — مدخل داكن فاخر بنفس لغة الهيرو (grain + توهج + خط عربي كبير)
// ووراها شريط لفّة بطيء بأسماء العطور تبعث الحنين من أول ثانية
// الطابع بيتبدل مع الفئة في صفحة المنتجات فقط: نسائي واين (بينك عميق) / رجالي فحمي / جنسين بني دافئ
export default function CatalogBanner({ cat = "الكل" }) {
  const isWomen = cat === "نسائي";
  const isUnisex = cat === "للجنسين";
  const sectionBg = isWomen ? "bg-wine-900" : isUnisex ? "bg-[#221E1A]" : "bg-ink-950";
  const glowBg = isWomen ? "bg-[#E08CA3]/20" : "bg-cream-50/10";
  const fadeFrom = isWomen ? "from-wine-900" : isUnisex ? "from-[#221E1A]" : "from-ink-950";
  return (
    <section className={`grain relative overflow-hidden rounded-b-[2.5rem] ${sectionBg} text-cream-50 transition-colors duration-700`}>
      {/* خلفية متوهجة */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 right-1/4 h-96 w-96 rounded-full blur-[120px] ${glowBg}`} />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cream-50/5 blur-[100px]" />
        <div className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t ${fadeFrom} to-transparent`} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-10 text-center md:px-8 md:pt-36 md:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-sm font-bold tracking-[0.3em] text-cream-200/70"
        >
          — الكتالوج —
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="font-display mt-4 text-5xl leading-[1.2] font-bold text-balance md:text-7xl"
        >
          كل عطور <span className="text-shine">نوى</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-base leading-loose text-cream-200/85 md:text-lg"
        >
          تركيز Extrait de Parfum بثبات يدوم من الصبح لآخر اليوم — دوّر على عطرك واطلبه في دقيقتين.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-cream-100/20 bg-cream-50/5 px-6 py-2.5 text-sm font-bold text-cream-100 backdrop-blur"
        >
          <Sparkles size={16} strokeWidth={2.2} />
          <CountUp value={PRODUCTS.length} render={perfumeCount} />
          <span className="text-cream-100/40">·</span>
          <span className="font-semibold tracking-wide text-cream-100/80">Extrait de Parfum</span>
        </motion.div>
      </div>

      <Marquee
        items={names}
        duration={60}
        className="relative border-t border-cream-100/10 py-3.5"
        itemClass="font-display text-lg font-bold text-cream-100/60"
      />
    </section>
  );
}
