// ضبط عنوان الصفحة والـ meta و OG و canonical — بسيط بدلاً من مكتبة إضافية
const SITE = "NAWA | نوى للعطور";

function upsert(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(
      selector.startsWith("link") ? "link" : selector.startsWith("meta") ? "meta" : "title"
    );
    if (selector.startsWith("meta")) {
      // meta[property] أو meta[name]
      const isProp = selector.includes("property=");
      const key = isProp ? "property" : "name";
      el.setAttribute(key, selector.match(/"(.*?)"/)?.[1] || "");
    }
    if (selector.startsWith("link")) el.setAttribute("rel", selector.match(/"(.*?)"/)?.[1] || "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function setMeta({ title, description, image = "/products/naseem.jpg", path = "" }) {
  const fullTitle = title ? `${title} — NAWA نوى` : SITE;
  document.title = fullTitle;

  const desc = description || "عطور شرقية وفرنسية فاخرة بتركيز عالٍ وثبات يدوم. تصفح الكتالوج واطلب عبر واتساب.";
  const url = `${window.location.origin}${path || window.location.pathname}`;
  const img = `${window.location.origin}${image}`;

  upsert('meta[name="description"]', "content", desc);
  upsert('meta[property="og:title"]', "content", fullTitle);
  upsert('meta[property="og:description"]', "content", desc);
  upsert('meta[property="og:type"]', "content", "website");
  upsert('meta[property="og:locale"]', "content", "ar_EG");
  upsert('meta[property="og:image"]', "content", img);
  upsert('meta[property="og:url"]', "content", url);
  upsert('meta[name="twitter:card"]', "content", "summary_large_image");
  upsert('meta[name="twitter:title"]', "content", fullTitle);
  upsert('meta[name="twitter:description"]', "content", desc);
  upsert('meta[name="twitter:image"]', "content", img);
  upsert('link[rel="canonical"]', "href", url);
}
