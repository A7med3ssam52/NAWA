import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { STORE, generalLink } from "../config/store";

export default function Footer() {
  return (
    <footer className="bg-ink-950 pt-14 pb-[calc(5.875rem+env(safe-area-inset-bottom))] text-cream-100 md:pb-8">
      {/* pb على الموبايل = هامش الفوتر (2rem) + ارتفاع شريط التنقل بالظبط — فالشريط يقعد على نفس الخلفية الداكنة والفراغ ميعديش الهامش الطبيعي */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="inline-grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white p-0.5 shadow-xl ring-1 ring-ink-950/5">
              <Logo />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-cream-200/70">
              دار عطور عربية — تشكيلة رجالية ونسائية بتركيز عالٍ وثبات يدوم.
              اطلب بضغطة واحدة عبر واتساب.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-cream-50">تسوّق</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm font-semibold text-cream-200/80">
              <li><Link to="/shop" className="hover:text-cream-50">كل العطور</Link></li>
              <li><Link to="/shop?cat=رجالي" className="hover:text-cream-50">عطور رجالية</Link></li>
              <li><Link to="/shop?cat=نسائي" className="hover:text-cream-50">عطور نسائية</Link></li>
              <li><Link to="/shop?cat=للجنسين" className="hover:text-cream-50">عطور للجنسين</Link></li>
              <li><Link to="/about" className="hover:text-cream-50">قصتنا</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-extrabold text-cream-50">مساعدة</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm font-semibold text-cream-200/80">
              <li><Link to="/contact" className="hover:text-cream-50">تواصل معانا</Link></li>
              <li><span>الشحن: 1-4 أيام</span></li>
              <li><span>الدفع عند الاستلام</span></li>
              <li><span>استبدال خلال 7 أيام</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-extrabold text-cream-50">اطلب الآن</h3>
            <p className="mt-4 text-sm text-cream-200/70">{STORE.hours}<br />{STORE.city}</p>
            <a
              href={generalLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-full bg-cream-50 px-6 py-3 text-center font-extrabold text-ink-950 shadow-lg transition-transform hover:scale-105"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <MessageCircle size={17} strokeWidth={2.2} />
                واتساب مباشر
              </span>
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-cream-100/10 pt-6 text-center text-xs text-cream-200/50">
          <p>© 2026 NAWA للعطور — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
