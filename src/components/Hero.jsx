import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Star, MessageCircle, ArrowLeft } from "lucide-react";
import { STORE, generalLink } from "../config/store";
import { PRODUCTS } from "../data/products";

export default function Hero() {
  const featured = PRODUCTS[0];
  return (
    <section className="grain relative overflow-hidden bg-ink-950 pt-28 pb-16 text-cream-50 md:pt-40 md:pb-24">
      {/* خلفية متوهجة */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-cream-50/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cream-50/5 blur-[100px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:px-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-sm font-bold tracking-[0.3em] text-cream-200/70"
          >
            {STORE.tagline}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl leading-[1.25] font-bold text-balance md:text-7xl md:leading-[1.2]"
          >
            عطرك هو <span className="text-shine">توقيعك الخاص</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-loose text-cream-200/85 md:text-xl"
          >
            {STORE.brandAr} بتقدملك عطور شرقية وفرنسية بتركيز عالٍ وثبات يدوم من
            الصبح لآخر اليوم. اختار عطرك، ودوس زرار واحد — وهنوصلهولك لحد البيت.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 text-base font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-105"
            >
              تسوّق الكتالوج
              <ArrowLeft size={18} strokeWidth={2.4} />
            </Link>
            <a
              href={generalLink()}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-cream-100/25 px-8 py-4 text-base font-bold text-cream-50 backdrop-blur transition-colors hover:border-cream-50 hover:text-cream-50"
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={18} strokeWidth={2} />
                استشارة واتساب مجانية
              </span>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex items-center gap-8"
          >
            {[
              ["+2500", "عميل سعيد"],
              ["4.9", "متوسط التقييم"],
              ["12h", "ثبات العطر"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold text-cream-50 md:text-3xl">{n}</p>
                <p className="text-sm text-cream-200/70">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* صورة البطل */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-cream-50/10 blur-[90px]" />
          <div className="animate-float overflow-hidden rounded-[2.5rem] border border-cream-100/20 shadow-2xl shadow-black/60">
            <img
              src="/products/Naseem_50ml.png"
              alt="زجاجة عطر نسيم من نوى — Extrait de Parfum بتركيز عالٍ، مستوحاة من الليمون والبرغموت والقرفة والشاي الأسود"
              width={714}
              height={1280}
              className="h-[480px] w-full object-cover object-[50%_40%]"
              fetchPriority="high"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent" />
          </div>

          <div className="absolute -right-3 top-8 rounded-2xl border border-cream-100/20 bg-ink-950/85 px-4 py-3 shadow-xl backdrop-blur md:-right-8">
            <Link to={`/product/${featured.id}`} className="block text-right">
              <p className="text-xs font-bold text-cream-50">وصل حديثاً</p>
              <p className="flex items-center gap-1.5 font-display text-lg font-bold">
                {featured.name} <Crown size={18} strokeWidth={2.2} className="text-cream-50" />
              </p>
              <p className="text-sm font-semibold text-cream-100">{featured.tagline}</p>
            </Link>
          </div>

          <div className="absolute -left-3 bottom-8 rounded-2xl border border-cream-100/15 bg-cream-50/95 px-4 py-3 shadow-xl backdrop-blur md:-left-8">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink-500">
              <Star size={13} strokeWidth={0} fill="currentColor" className="text-ink-950" />
              4.9 من 800+ تقييم
            </p>
            <p className="text-sm font-extrabold text-ink-950">ثبات مضمون أو الاستبدال</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
