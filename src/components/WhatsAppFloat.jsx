import { MessageCircle } from "lucide-react";
import { generalLink } from "../config/store";

export default function WhatsAppFloat() {
  return (
    <a
      href={generalLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل واتساب"
      className="group fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-5 z-50 flex items-center gap-3 md:bottom-5"
    >
      <span className="hidden rounded-full border border-ink-950/10 bg-cream-50 px-4 py-2 text-sm font-extrabold shadow-xl group-hover:block">
        محتاج مساعدة؟ كلمنا
      </span>
      <span className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-cream-50/15 bg-ink-950 text-cream-50 shadow-2xl transition-transform hover:scale-110 md:h-14 md:w-14">
        <MessageCircle size={24} strokeWidth={2} className="relative md:hidden" />
        <MessageCircle size={26} strokeWidth={2} className="relative hidden md:block" />
      </span>
    </a>
  );
}
