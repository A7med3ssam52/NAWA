import Reveal from "./Reveal";

export default function SectionHeading({ kicker, title, desc, light = false }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      <p
        className={`mb-3 text-sm font-bold tracking-[0.25em] ${
          light ? "text-cream-100/80" : "text-ink-500"
        }`}
      >
        — {kicker} —
      </p>
      <h2 className="font-display text-3xl leading-snug font-bold text-balance md:text-5xl">
        {title}
      </h2>
      {desc && (
        <p className={`mt-4 text-base leading-relaxed md:text-lg ${light ? "text-cream-200/80" : "text-ink-500"}`}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}
