export const STORE = {
  brand: "NAWA",
  brandAr: "نوى",
  tagline: "عطور تُشبهك",
  whatsapp: "201043903771", // رقم الواتساب الحقيقي — صيغة عالمية wa.me (010 + 43903771)
  instagram: "#",
  tiktok: "#",
  facebook: "#",
  city: "القاهرة، مصر",
  hours: "يومياً من 10ص إلى 11م",
};

export function whatsappLink(message) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${STORE.whatsapp}?text=${text}`;
}

export function orderLink(productName, size, sizes) {
  // لو العميل طلب من الكارت من غير ما يختار حجم، بنكتب الأحجام المتاحة في الرسالة
  const sizeLine = size
    ? `\n• الحجم: ${size}`
    : sizes?.length
      ? `\n• الحجم: ${sizes.join(" / ")} — هأكد الحجم معاك`
      : `\n• الحجم: هتكلم معاك ونحددو مع بعض`;
  return whatsappLink(
    `أهلاً NAWA 🤍\nعايز أطلب:\n• ${productName}${sizeLine}\nممكن تأكيد السعر والشحن؟`
  );
}

export function generalLink() {
  return whatsappLink(`أهلاً NAWA 🤍\nعايز استفسر عن العطور المتاحة.`);
}
