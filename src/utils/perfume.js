import { Sparkles, Sun, Snowflake, Leaf, Flower2 } from "lucide-react";

// أيقونات المواسم — من نفس مجموعة lucide المستعملة في الموقع كله
export const SEASON_ICONS = {
  "الربيع": Flower2,
  "الصيف": Sun,
  "الخريف": Leaf,
  "الشتاء": Snowflake,
  "طوال العام": Sparkles,
};

// مستوى الشدة من ١ إلى ٣ — «متوسط إلى قوي» بيتحسب قوي لأن الكلمة الأولى للحضور الكبير
export const intensityLevel = (intensity) => {
  const t = String(intensity || "");
  if (t.includes("قوي")) return 3;
  if (t.includes("خفيف")) return 1;
  return 2;
};
