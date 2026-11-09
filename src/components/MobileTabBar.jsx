import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ShoppingBag, BookHeart, MessageCircle, ShoppingCart } from "lucide-react";

// شريط التنقل السفلي — قلب إحساس التطبيق على الموبايل
const TABS = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/shop", label: "المتجر", icon: ShoppingBag },
  { to: "/cart", label: "السلة", icon: ShoppingCart },
  { to: "/about", label: "قصتنا", icon: BookHeart },
  { to: "/contact", label: "تواصل", icon: MessageCircle },
];

export default function MobileTabBar() {
  return (
    <nav
      aria-label="تنقل سريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-100/10 bg-ink-950/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => {
              // إعادة الضغط على تاب مفتوح = رجوع لأول الصفحة (سلوك التطبيقات)
              if (window.location.pathname === to) window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative flex min-w-0 flex-1 touch-manipulation flex-col items-center gap-1 py-2.5 select-none"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                    className="absolute inset-x-2.5 inset-y-1 rounded-2xl bg-cream-50/10"
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={`relative transition-all group-active:scale-90 ${
                    isActive ? "text-cream-50" : "text-cream-100/55 group-active:text-cream-50"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`relative text-[10px] font-extrabold transition-colors ${
                    isActive ? "text-cream-50" : "text-cream-100/55"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
