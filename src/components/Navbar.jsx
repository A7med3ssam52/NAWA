import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { STORE, generalLink } from "../config/store";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/shop", label: "المتجر" },
  { to: "/about", label: "قصتنا" },
  { to: "/contact", label: "تواصل" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-cream-100/15 bg-ink-950/90 shadow-2xl backdrop-blur-xl"
          : "bg-gradient-to-b from-ink-950/80 to-transparent"
      }`}
    >
      <div className="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link to="/" className="group flex items-center">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white p-0.5 shadow-lg ring-1 ring-ink-950/5 transition-all group-hover:scale-105 group-hover:shadow-xl">
            <Logo />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative text-[15px] font-bold transition-colors hover:text-cream-50 ${
                  isActive ? "text-cream-50" : "text-cream-100/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={`absolute -bottom-2 right-0 h-0.5 rounded-full bg-cream-50 transition-all ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
          <a
            href={generalLink()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-cream-50 px-6 py-2.5 text-sm font-extrabold text-ink-950 shadow-lg transition-transform hover:scale-105"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={16} strokeWidth={2.2} />
              اطلب واتساب
            </span>
          </a>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-cream-100/20 text-cream-50 md:hidden"
          aria-label={open ? "إغلاق القائمة" : "القائمة"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            id="mobile-menu"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
            className="grain fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink-950 px-6 pt-24 pb-10 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-cream-50/10 blur-[100px]" />
              <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cream-50/5 blur-[100px]" />
            </div>

            <nav className="relative flex flex-1 flex-col justify-center gap-2">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 + i * 0.07 }}
                >
                  <NavLink
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between border-b border-cream-100/10 py-5 ${
                        isActive ? "text-cream-50" : "text-cream-50/80"
                      }`
                    }
                  >
                    <span className="font-display text-4xl font-bold">{l.label}</span>
                    <span className="text-sm font-bold text-cream-200/40">
                      0{i + 1}
                    </span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="relative"
            >
              <a
                href={generalLink()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-cream-50 px-4 py-4 text-center text-lg font-extrabold text-ink-950 shadow-xl"
              >
                <MessageCircle size={20} strokeWidth={2.2} />
                اطلب عبر واتساب
              </a>
              <p className="mt-4 text-center text-xs font-semibold text-cream-200/50">
                {STORE.hours} · {STORE.city}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
