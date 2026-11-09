import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartIcon({ className = "" }) {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label="السلة"
      className={`relative grid h-11 w-11 place-items-center rounded-xl border border-cream-100/20 text-cream-50 transition-colors hover:bg-cream-50/10 ${className}`}
    >
      <ShoppingCart size={20} strokeWidth={2.2} />
      {count > 0 && (
        <span className="absolute -top-1 -left-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-cream-50 px-1 text-[10px] font-extrabold text-ink-950 shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}