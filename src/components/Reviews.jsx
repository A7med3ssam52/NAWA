import { Star } from "lucide-react";
import { REVIEWS } from "../data/products";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

function Stars({ n }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`تقييم ${n} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          strokeWidth={0}
          fill="currentColor"
          className={i < n ? "text-ink-950" : "text-ink-950/15"}
        />
      ))}
    </span>
  );
}

export default function Reviews() {
  return (
    <section className="bg-cream-200/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          kicker="آراء العملاء"
          title="ناس جرّبت.. ومش قادرة تستغنى"
          desc="تقييم 4.9 من أكتر من 800 عميل في القاهرة والمحافظات."
        />
        <div className="grid gap-5 md:grid-cols-4">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-3xl border border-ink-950/8 bg-cream-50 p-6 shadow-lg">
                <Stars n={r.stars} />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-800">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-4 border-t border-ink-950/8 pt-4">
                  <p className="font-extrabold">{r.name} <span className="font-semibold text-ink-400">· {r.city}</span></p>
                  <p className="text-xs font-bold text-ink-500">اشترى: {r.product}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
