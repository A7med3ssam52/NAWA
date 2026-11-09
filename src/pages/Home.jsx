import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import SectionHeading from "../components/SectionHeading";
import ProductCard from "../components/ProductCard";
import Collections from "../components/Collections";
import Story from "../components/Story";
import Reviews from "../components/Reviews";
import FAQ from "../components/FAQ";
import Reveal from "../components/Reveal";
import { PRODUCTS } from "../data/products";
import { generalLink } from "../config/store";
import { perfumeCount } from "../utils/plural";
import { setMeta } from "../utils/setMeta";
import { useEffect } from "react";

// الأكثر طلباً — مختار يدوياً بالفئات: رجالي · للجنسين · للجنسين · نسائي (كلها بصور سليمة)
const BEST_SELLER_IDS = ["naseem", "abaq", "qarar", "rouh"];

export default function Home() {
  const best = BEST_SELLER_IDS
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  useEffect(() => {
    setMeta({
      title: "عطور تُشبهك",
      description: "عطور NAWA شرقية وفرنسية بتركيز Extrait de Parfum وثبات يدوم 8-12 ساعة — اطلب عبر واتساب مع توصيل لكل المحافظات.",
      path: "/",
      image: "/products/Naseem_50ml.png",
    });
  }, []);
  return (
    <>
      <Hero />
      <Marquee />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          kicker="الأكثر طلباً"
          title="عطور خطفت قلوب عملائنا"
          desc="الأكثر طلباً هذا الشهر على واتساب — من كل الفئات."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink-950 px-10 py-4 font-extrabold transition-colors hover:bg-ink-950 hover:text-cream-50"
          >
            عرض كل العطور
            <ArrowLeft size={18} strokeWidth={2.4} />
          </Link>
        </Reveal>
      </section>

      <Collections />
      <Story />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink-950 p-8 text-center text-cream-50 md:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-cream-50/10 blur-[100px]" />
          </div>
          <Reveal>
            <p className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.3em] text-cream-50">
              <Sparkles size={18} strokeWidth={2} />
              وصل حديثاً
            </p>
            <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl leading-snug font-bold text-balance md:text-5xl">
              تشكيلة <span className="text-shine">NAWA</span> الجديدة وصلت
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream-200/80">
              {perfumeCount(PRODUCTS.length)} بالكامل — رجالي، نسائي، وللجنسين. اطلب عبر واتساب واحجز عطرك اللي يعبّر عنك.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={generalLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-105"
              >
                <MessageCircle size={19} strokeWidth={2.2} />
                احجز واتساب
              </a>
              <Link
                to="/shop"
                className="rounded-full border border-cream-100/25 px-8 py-4 font-bold text-cream-50 hover:border-cream-50"
              >
                تصفح الكتالوج
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Reviews />
      <FAQ />
    </>
  );
}
