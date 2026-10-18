import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// عداد متحرك — بيعدّ من الصفر أول مرة عشان يشدّ النظر، وبعدها بيحرك من قيمته السابقة
// عند كل تغيير (تحريك لطيف وقت الفرز والفلترة). render اختياري: دالة بتحوّل الرقم لنص
// بجمع عربي مطابق زي perfumeCount وperfumeAvailability.
export default function CountUp({ value, render, className = "" }) {
  const prev = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: prev.current === 0 ? 1.1 : 0.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        prev.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value]);

  const shown = Math.round(display);
  return (
    <span className={`tabular-nums ${className}`}>
      {render ? render(shown) : shown.toLocaleString("ar-EG")}
    </span>
  );
}
