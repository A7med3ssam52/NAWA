import { Leaf, Timer, Truck, Gift } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { generalLink } from "../config/store";

const feats = [
  { Icon: Leaf, t: "مكونات طبيعية", d: "زيوت عطرية مركزة من فرنسا والهند وكمبوديا" },
  { Icon: Timer, t: "ثبات 12 ساعة", d: "تركيز أو دو برفان عالٍ يثبت على الملابس لأيام" },
  { Icon: Truck, t: "توصيل سريع", d: "شحن لكل المحافظات + معاينة قبل الدفع" },
  { Icon: Gift, t: "تغليف هدايا مجاني", d: "علبة فاخرة مع كارت إهداء حسب طلبك" },
];

export default function Story() {
  return (
    <section className="grain relative overflow-hidden bg-ink-950 py-16 text-cream-50 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/3 h-80 w-80 rounded-full bg-cream-50/10 blur-[110px]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:px-8">
        <Reveal>
          <div className="relative">
            <img
              src="/brand/story-oud.jpg"
              alt="مواد أولية عند نوى — زجاجة Extrait de Parfum وسط خشب العود وراتنج العنبر"
              width={720}
              height={1280}
              className="h-[440px] w-full rounded-[2.5rem] border border-cream-100/20 object-cover object-[50%_58%] shadow-2xl"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute -bottom-6 right-6 left-6 rounded-3xl border border-ink-950/10 bg-cream-50 p-5 text-ink-950 shadow-xl">
              <p className="font-display text-xl font-bold">«العطر مش رفاهية.. العطر ذاكرة»</p>
              <p className="mt-1 text-sm font-bold text-ink-500">— مؤسس دار NAWA</p>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionHeading
            light
            kicker="قصة نوى"
            title="دار عربية بروح عالمية"
          />
          <Reveal delay={0.1}>
            <p className="text-base leading-loose text-cream-200/85 md:text-lg">
              بدأنا NAWA من شغف واحد: ليه العطر الفخم لازم يبقى غالي أوي أو ثابت
              ضعيف؟ جمعنا خبراء عطور عرب وفرنسيين، واخترنا أجود أنواع العود
              والمسك والورد — عشان نقدملك عطر ينافس البراندات العالمية بسعر
              عادل وخدمة تليق بيك.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {feats.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <div className="rounded-3xl border border-cream-100/12 bg-cream-50/5 p-5 backdrop-blur transition-colors hover:border-cream-50/40">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-50/10 text-cream-50">
                    <f.Icon size={24} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-2 font-extrabold text-cream-50">{f.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cream-200/75">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <a
              href={generalLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block rounded-full bg-cream-50 px-8 py-4 font-extrabold text-ink-950 shadow-xl transition-transform hover:scale-105"
            >
              كلمنا واختار عطرك
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
