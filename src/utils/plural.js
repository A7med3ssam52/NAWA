// صيغ العدد العربية — المستعملة لعداد العطور
export function perfumeCount(n) {
  if (n === 0) return "لا يوجد عطور";
  if (n === 1) return "عطر واحد";
  if (n === 2) return "عطران";
  if (n >= 3 && n <= 10) return `${n} عطور`;
  return `${n} عطراً`;
}

// الصيغة مع وصف التوفّر — مطابقة إعرابياً للأعداد (عطران متاحان / عطور متاحة / عطراً متاحاً)
export function perfumeAvailability(n) {
  if (n <= 0) return "لا عطور متاحة";
  if (n === 1) return "عطر واحد متاح";
  if (n === 2) return "عطران متاحان";
  if (n >= 3 && n <= 10) return `${n} عطور متاحة`;
  return `${n} عطراً متاحاً`;
}

// رقم عربي هندي بصفر بادئ للترقيم التحريري على كروت الكتالوج (٠١، ٠٢، ...)
export function toArabicIndex(n) {
  const digits = "٠١٢٣٤٥٦٧٨٩";
  return String(n).padStart(2, "0").replace(/\d/g, (d) => digits[Number(d)]);
}
