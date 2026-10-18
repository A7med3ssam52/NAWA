import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { FAQS } from "../data/products";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      <SectionHeading kicker="أسئلة شائعة" title="كل اللي محتاج تعرفه قبل ما تطلب" />
      <div className="flex flex-col gap-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} delay={(i % 4) * 0.06}>
              <div
                className={`overflow-hidden rounded-3xl border transition-colors ${
                  isOpen ? "border-ink-950 bg-cream-50 shadow-xl" : "border-ink-950/10 bg-cream-50/70"
                }`}
              >
                <button
                  id={`faq-btn-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right font-extrabold"
                >
                  <span>{f.q}</span>
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all ${
                      isOpen ? "rotate-45 bg-ink-950 text-cream-50" : "bg-ink-950/8"
                    }`}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{
                    height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.25 },
                  }}
                  className="overflow-hidden"
                >
                  <p id={`faq-panel-${i}`} className="px-6 pb-6 leading-loose text-ink-700">{f.a}</p>
                </motion.div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
