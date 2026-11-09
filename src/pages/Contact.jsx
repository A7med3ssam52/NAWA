import { useState, useEffect } from "react";
import { MessageCircle, MapPin, Clock, Truck, Send } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { STORE, whatsappLink } from "../config/store";
import { setMeta } from "../utils/setMeta";

export default function Contact() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMeta({
      title: "تواصل معانا",
      description: "كلمنا على واتساب وأرسل رسالتك — بنرد خلال دقائق يومياً من 10 صباحاً لـ 11 مساءً.",
      path: "/contact",
    });
  }, []);

  // الرسالة بتبني مباشرة في الـ href — أنكر من window.open ومانع عارض البوب-أبس
  const waLink = whatsappLink(
    `أهلاً NAWA 🤍\nالاسم: ${name || "—"}\nالرسالة: ${msg || "عايز استفسر عن العطور"}`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 md:px-8 md:pt-36">
      <SectionHeading
        kicker="تواصل معانا"
        title="نسمعك في أي وقت"
        desc="ابعت رسالتك وهتتحول لواتساب مباشرة — بنرد عادة خلال دقائق."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="rounded-[2rem] bg-ink-950 p-8 text-cream-50 shadow-2xl">
            <h3 className="font-display text-2xl font-bold text-cream-50">معلومات التواصل</h3>
            <ul className="mt-6 flex flex-col gap-4 font-semibold">
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-50/10 text-cream-50"><MessageCircle size={18} strokeWidth={2} /></span> واتساب: <span dir="ltr">{STORE.whatsapp}</span></li>
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-50/10 text-cream-50"><MapPin size={18} strokeWidth={2} /></span> {STORE.city}</li>
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-50/10 text-cream-50"><Clock size={18} strokeWidth={2} /></span> {STORE.hours}</li>
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-50/10 text-cream-50"><Truck size={18} strokeWidth={2} /></span> شحن لكل المحافظات 1-4 أيام</li>
            </ul>
            <div className="mt-8 rounded-3xl border border-cream-50/20 bg-cream-50/10 p-5 text-sm leading-relaxed text-cream-200/85">
              لو محتار تختار عطر — ابعتلنا: بتحب الشرقي التقيل ولا الخفيف؟ للاستخدام اليومي ولا المناسبات؟ وهنرشحلك الأنسب لذوقك وميزانيتك.
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[2rem] border border-ink-950/10 bg-cream-50 p-8 shadow-xl">
            <label htmlFor="contact-name" className="font-extrabold">اسمك</label>
            <input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد عصام"
              className="mt-2 w-full rounded-2xl border border-ink-950/12 bg-cream-100 px-5 py-3 font-semibold outline-none focus:border-ink-950"
            />
            <label htmlFor="contact-msg" className="mt-5 block font-extrabold">رسالتك</label>
            <textarea
              id="contact-msg"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={5}
              placeholder="عايز أسأل عن..."
              className="mt-2 w-full rounded-2xl border border-ink-950/12 bg-cream-100 px-5 py-3 font-semibold outline-none focus:border-ink-950"
            />
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 py-4 text-lg font-extrabold text-cream-50 shadow-xl transition-transform hover:scale-[1.02]"
            >
              <Send size={19} strokeWidth={2.2} className="-scale-x-100" />
              ابعت عبر واتساب
            </a>
            <p className="mt-3 text-center text-xs text-ink-400">بالضغط على الزرار هتتفتح محادثة واتساب جاهزة برسالتك</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
