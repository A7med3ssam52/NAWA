import { Link } from "react-router-dom";
import { MessageCircle, SearchX } from "lucide-react";
import { generalLink } from "../config/store";
import { setMeta } from "../utils/setMeta";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    setMeta({
      title: "الصفحة مش موجودة",
      description: "الرابط اللي وصلت منه مش موجود. تصفح كتالوج NAWA كامل واختار عصرك التالي.",
    });
  }, []);

  return (
    <div className="grain relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-36 pb-24 text-center md:pt-48">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-ink-950/6 text-ink-500">
        <SearchX size={38} strokeWidth={1.6} />
      </span>
      <p className="mt-6 text-sm font-bold tracking-[0.3em] text-ink-500">404 — المسار مش موجود</p>
      <h1 className="font-display mt-3 text-4xl leading-snug font-bold text-balance md:text-6xl">
        الصفحة دي ريحتها طارت
      </h1>
      <p className="mt-4 max-w-md leading-loose text-ink-700">
        يبدو إن الرابط اتغيّر أو الصفحة اتنقلت. مش مشكلة — العطور كلها موجودة، محتاج بس إنك تختار من أول.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-8 py-4 font-extrabold text-cream-50 shadow-xl transition-transform hover:scale-105"
        >
          تصفح العطور
        </Link>
        <a
          href={generalLink()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border-2 border-ink-950 px-8 py-4 font-extrabold transition-colors hover:bg-ink-950 hover:text-cream-50"
        >
          <MessageCircle size={18} strokeWidth={2.2} />
          اسألنا على واتساب
        </a>
      </div>
    </div>
  );
}
