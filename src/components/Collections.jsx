import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { COLLECTIONS } from "../data/products";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

// تأخير متدرج بنمط (index % 4) * 0.06
export default function Collections() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <SectionHeading
        kicker="المجموعات"
        title="اختار شخصيتك العطرية"
        desc="3 مجموعات حسب اختيارك — للرجال، للنساء، وللجنسين. كل مجموعة مصممة لمزاج مختلف."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.06}>
            <Link
              to={`/shop?cat=${encodeURIComponent(c.cat)}`}
              className="group relative block overflow-hidden rounded-[2rem] shadow-xl"
            >
              <img
                src={c.image}
                alt={`مجموعة ${c.name} — ${c.desc}`}
                width={720}
                height={1280}
                loading="lazy"
                decoding="async"
                className="h-96 w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${c.tint} via-ink-950/20 to-transparent`} />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream-50">
                <span className="rounded-full bg-cream-50/15 px-3 py-1 text-xs font-bold backdrop-blur">{c.count}</span>
                <h3 className="font-display mt-2 text-3xl font-bold">{c.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cream-200/85">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-cream-50">
                  تسوّق المجموعة <ArrowLeft size={16} strokeWidth={2.4} className="transition-transform group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
