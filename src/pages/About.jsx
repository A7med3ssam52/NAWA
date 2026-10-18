import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Leaf, Timer, Truck, Gift, Sparkles, ArrowLeft, MessageCircle,
  Compass, FlaskConical, Droplets, Package,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { STORE, generalLink } from "../config/store";
import { setMeta } from "../utils/setMeta";

const steps = [
  { n: "٠١", Icon: Compass, title: "انتقاء", desc: "عود كمبودي، مسك أبيض، ورد طائفي، زيوت حمضية من جنوب فرنسا — كل مادة تُختار بيد، لا بآلة." },
  { n: "٠٢", Icon: FlaskConical, title: "مزج", desc: "خبراء عطور عرب وفرنسيون يمزجون النوتات حتى تتناغم — مقدمة منعشة، قلب معبر، قاعدة ثابتة." },
  { n: "٠٣", Icon: Droplets, title: "تركيز", desc: "Extrait de Parfum — أعلى تركيز، ثبات 8-12 ساعة على الملابس وفوحان يملأ الغرفة." },
  { n: "٠٤", Icon: Package, title: "تغليف", desc: "علبة فاخرة + كارت إهداء حسب طلبك، جاهزة للتسليم لحد البيت." },
];

const values = [
  { Icon: Leaf, t: "مكونات طبيعية", d: "زيوت عطرية مركزة من فرنسا والهند وكمبوديا" },
  { Icon: Timer, t: "ثبات يدوم", d: "تركيز عالٍ يثبت على الملابس لأيام" },
  { Icon: Truck, t: "توصيل سريع", d: "شحن لكل المحافظات + معاينة قبل الدفع" },
  { Icon: Gift, t: "تغليف هدايا", d: "علبة فاخرة مع كارت إهداء حسب طلبك" },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function About() {
  useEffect(() => {
    setMeta({
      title: "قصتنا",
      description: "دار NAWA — رحلة عطر من شغف واحد إلى 15 عطراً فاخراً بتركيز Extrait de Parfum. تعرف على قصتنا وفلسفتنا.",
      path: "/about",
      image: "/products/qarar.jpg",
    });
  }, []);

  return (
    <div className="bg-cream-100">
      {/* ── ١. مقدمة ── */}
      <section className="grain relative overflow-hidden bg-ink-950 pt-32 pb-20 text-cream-50 md:pt-44 md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-cream-50/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cream-50/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-bold tracking-[0.4em] text-cream-200/70"
          >
            قصتنا
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display mt-4 text-5xl leading-[1.15] font-bold text-balance md:text-7xl"
          >
            رحلة عطر يُشبهك
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base leading-loose text-cream-200/85 md:text-xl"
          >
            من شغف واحد — ليه العطر الفخم لازم يبقى غالي أوي أو ثابت ضعيف؟ —
            إلى دار عربية بروح عالمية، صممت 15 عطراً لتكون توقيعك.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10"
          >
            <a
              href="#journey"
              className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-105"
            >
              اقرأ الرحلة
              <ArrowLeft size={18} strokeWidth={2.4} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── ٢. الفصل الأول: البداية ── */}
      <section id="journey" className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <div className="relative">
              <span className="absolute -top-6 -right-2 font-display text-[8rem] leading-none font-bold text-ink-950/6 md:text-[10rem]">
                ٠١
              </span>
              <p className="relative text-sm font-bold tracking-[0.3em] text-ink-500">الفصل الأول</p>
              <h2 className="font-display relative mt-2 text-3xl leading-snug font-bold md:text-5xl">
                البداية
              </h2>
              <p className="relative mt-6 text-base leading-loose text-ink-700 md:text-lg">
                بدأنا NAWA من شغف واحد: ليه العطر الفخم لازم يبقى غالي أوي أو ثابت
                ضعيف؟ جمعنا خبراء عطور عرب وفرنسيين، واخترنا أجود أنواع العود والمسك
                والورد — عشان نقدملك عطر ينافس البراندات العالمية بسعر عادل وخدمة تليق
                بيك. كل عطر هو "مستوحى من" أصل عالمي، لكن بروح عربية وثبات يدوم.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <img
              src="/products/qarar.jpg"
              alt="زجاجة عطر قرار من نوى — Extrait de Parfum بتركيز عالٍ"
              width={714}
              height={1280}
              className="h-[440px] w-full rounded-[2.5rem] border border-ink-950/10 object-cover object-[50%_45%] shadow-2xl"
              loading="lazy"
              decoding="async"
            />
          </Reveal>
        </div>
      </section>

      {/* ── ٣. الفصل الثاني: الرحلة ── */}
      <section className="grain relative overflow-hidden bg-ink-950 py-20 text-cream-50 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/3 h-80 w-80 rounded-full bg-cream-50/10 blur-[110px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading
            light
            kicker="الفصل الثاني"
            title="من زهرة إلى زجاجة"
            desc="كل عطر NAWA يمر بأربع مراحل — بيد، لا بآلة."
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 grid gap-6 md:grid-cols-4"
          >
            {steps.map((s) => (
              <motion.div
                variants={itemVariants}
                key={s.title}
                className="relative rounded-3xl border border-cream-100/12 bg-cream-50/5 p-6 backdrop-blur transition-colors hover:border-cream-50/40"
              >
                <span className="font-display absolute -top-4 right-6 text-5xl font-bold text-cream-50/15">
                  {s.n}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-50/10 text-cream-50">
                  <s.Icon size={22} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-extrabold text-cream-50">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-200/75">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ٤. الفصل الثالث: ما يميزنا ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <SectionHeading
          kicker="الفصل الثالث"
          title="ما يميزنا"
          desc="أربعة وعود — من زجاجة إلى بابك."
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {values.map((v) => (
            <motion.div
              variants={itemVariants}
              key={v.t}
              className="rounded-3xl border border-ink-950/10 bg-cream-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 text-cream-50">
                <v.Icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 font-extrabold text-ink-950">{v.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{v.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── ٥. الفصل الرابع: الإحساس ── */}
      <section className="grain relative overflow-hidden bg-ink-950 py-24 text-cream-50 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream-50/5 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
          <Sparkles size={28} strokeWidth={1.6} className="mx-auto text-cream-200/60" />
          <Reveal>
            <p className="font-display mt-6 text-3xl leading-snug font-bold text-balance md:text-5xl">
              «العطر مش رفاهية.. العطر ذاكرة»
            </p>
            <p className="mt-4 text-sm font-bold tracking-[0.3em] text-cream-200/60">
              — مؤسس دار NAWA
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 text-right md:grid-cols-3">
            {[
              ["هوية", "العطر هو توقيعك — من يشمّك يذكرك."],
              ["ذاكرة", "رائحة تربط لحظة بمكان، ومكان بمشاعر."],
              ["اختيار", "ما ترتديه يعبّر عنك قبل أن تتحدث."],
            ].map(([t, d]) => (
              <Reveal key={t} delay={0.1}>
                <div className="rounded-3xl border border-cream-100/12 bg-cream-50/5 p-6 backdrop-blur">
                  <h3 className="font-display text-xl font-bold text-cream-50">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-200/75">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ٦. CTA ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink-950 p-8 text-center text-cream-50 md:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-cream-50/10 blur-[100px]" />
          </div>
          <Reveal>
            <p className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.3em] text-cream-50">
              <Sparkles size={18} strokeWidth={2} />
              رحلتك تبدأ هنا
            </p>
            <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl leading-snug font-bold text-balance md:text-5xl">
              اختر عطرك — <span className="text-shine">وكون توقيعك</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream-200/80">
              15 عطراً — رجالي، نسائي، وللجنسين. اطلب عبر واتساب واحجز عطرك.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-105"
              >
                تسوّق الكتالوج
                <ArrowLeft size={18} strokeWidth={2.4} />
              </Link>
              <a
                href={generalLink()}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-cream-100/25 px-8 py-4 font-bold text-cream-50 hover:border-cream-50"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle size={18} strokeWidth={2} />
                  استشارة واتساب مجانية
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}