import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MessageCircle, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import { whatsappLink } from "../config/store";

const STEPS = [
  { key: "cart", label: "السلة" },
  { key: "info", label: "المعلومات" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "تم" },
];

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    customer,
    subtotal,
    hasPrice,
    removeItem,
    updateQty,
    clearCart,
    setCustomer,
  } = useCart();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(
    () =>
      customer || {
        name: "",
        phone: "",
        city: "",
        address: "",
        notes: "",
        payment: "whatsapp",
      }
  );
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  // redirect if empty cart on first steps
  if (items.length === 0 && step < 3) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-cream-200/60">
          <ShoppingBag size={36} strokeWidth={1.6} className="text-ink-500" />
        </div>
        <h1 className="font-display text-4xl font-bold text-ink-950">السلة فارغة</h1>
        <p className="max-w-md text-ink-700">لم تضف أي عطر بعد. ابدأ بتصفح المتجر.</p>
        <Link
          to="/shop"
          className="rounded-full bg-ink-950 px-8 py-3 text-sm font-extrabold text-cream-50 shadow-lg transition-transform hover:scale-105"
        >
          تصفح المتجر
        </Link>
      </div>
    );
  }

  const validateInfo = () => {
    const e = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.phone.trim()) e.phone = "رقم الجوال مطلوب";
    else if (!/^[0-9+\s-]{8,15}$/.test(form.phone.trim())) e.phone = "رقم غير صالح";
    if (!form.city.trim()) e.city = "المدينة مطلوبة";
    if (!form.address.trim()) e.address = "العنوان مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0) setStep(1);
    else if (step === 1) {
      if (validateInfo()) {
        setCustomer(form);
        setStep(2);
      }
    } else if (step === 2) {
      finalizeOrder();
    }
  };

  const goBack = () => {
    if (step > 0 && step < 3) setStep(step - 1);
  };

  const finalizeOrder = () => {
    setSending(true);
    const lines = [];
    lines.push("طلب جديد — NAWA 🤍");
    lines.push("");
    lines.push("المنتجات:");
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}${it.size ? ` — ${it.size}` : ""} × ${it.qty}`);
    });
    lines.push("");
    if (hasPrice) lines.push(`المجموع: ${subtotal}`);
    lines.push("");
    lines.push("معلومات العميل:");
    lines.push(`الاسم: ${form.name}`);
    lines.push(`الجوال: ${form.phone}`);
    lines.push(`المدينة: ${form.city}`);
    lines.push(`العنوان: ${form.address}`);
    if (form.notes.trim()) lines.push(`ملاحظات: ${form.notes}`);
    lines.push("");
    lines.push(`طريقة الدفع: ${form.payment === "cod" ? "الدفع عند الاستلام" : "WhatsApp / تحويل"}`);

    const url = whatsappLink(lines.join("\n"));
    // open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
    setStep(3);
    clearCart();
    clearCustomerStorage();
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-colors ${
                i < step
                  ? "bg-ink-950 text-cream-50"
                  : i === step
                  ? "bg-cream-50 text-ink-950 ring-2 ring-ink-950"
                  : "bg-cream-200/60 text-ink-500"
              }`}
            >
              {i < step ? <Check size={16} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`hidden text-xs font-bold sm:inline ${
                i === step ? "text-ink-950" : "text-ink-500"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-ink-950" : "bg-cream-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <CartItemsStep
          items={items}
          hasPrice={hasPrice}
          subtotal={subtotal}
          updateQty={updateQty}
          removeItem={removeItem}
        />
      )}
      {step === 1 && (
        <CustomerInfoStep
          form={form}
          setForm={setForm}
          errors={errors}
        />
      )}
      {step === 2 && (
        <ReviewStep
          items={items}
          customer={form}
          hasPrice={hasPrice}
          subtotal={subtotal}
        />
      )}
      {step === 3 && <SuccessStep onDone={() => navigate("/shop")} />}

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-ink-950/20 px-6 py-3 text-sm font-extrabold text-ink-950 transition-colors hover:bg-ink-950/5"
            >
              <ArrowRight size={16} strokeWidth={2.4} />
              رجوع
            </button>
          ) : (
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-ink-950/20 px-6 py-3 text-sm font-extrabold text-ink-950 transition-colors hover:bg-ink-950/5"
            >
              <ArrowRight size={16} strokeWidth={2.4} />
              متابعة التسوق
            </Link>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-8 py-3 text-sm font-extrabold text-cream-50 shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
          >
            {step === 2 ? (
              <>
                <MessageCircle size={16} strokeWidth={2.2} />
                {sending ? "جارٍ الإرسال..." : "تأكيد وإرسال عبر WhatsApp"}
              </>
            ) : (
              <>
                متابعة
                <ArrowLeft size={16} strokeWidth={2.4} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function CartItemsStep({ items, hasPrice, subtotal, updateQty, removeItem }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-ink-950 md:text-4xl">سلتك</h1>
      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={`${it.id}::${it.size || ""}`}
            className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-100">
              {it.image ? (
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-ink-400">
                  <ShoppingBag size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink-950 truncate">{it.name}</p>
              {it.size && <p className="text-xs text-ink-500">{it.size}</p>}
              {typeof it.price === "number" && (
                <p className="text-sm font-extrabold text-ink-950">{it.price}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQty(it.id, it.size, it.qty - 1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-cream-200 text-ink-950 hover:bg-cream-100"
                aria-label="تقليل"
              >
                <Minus size={14} strokeWidth={2.4} />
              </button>
              <span className="w-6 text-center text-sm font-extrabold">{it.qty}</span>
              <button
                type="button"
                onClick={() => updateQty(it.id, it.size, it.qty + 1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-cream-200 text-ink-950 hover:bg-cream-100"
                aria-label="زيادة"
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(it.id, it.size)}
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600"
              aria-label="حذف"
            >
              <Trash2 size={16} strokeWidth={2.2} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-cream-200 bg-cream-100 px-5 py-4">
        <span className="font-bold text-ink-950">المجموع</span>
        <span className="font-display text-2xl font-bold text-ink-950">
          {hasPrice ? subtotal : "سيُحدد عند التأكيد"}
        </span>
      </div>
      {!hasPrice && (
        <p className="text-xs text-ink-500">
          الأسعار تُؤكد عبر WhatsApp (سيتم إرسال الطلب وتأكيد السعر).
        </p>
      )}
    </div>
  );
}

function CustomerInfoStep({ form, setForm, errors }) {
  const field = (key, label, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-ink-950">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ink-950/20 ${
          errors[key] ? "border-red-400" : "border-cream-200"
        }`}
      />
      {errors[key] && <p className="text-xs font-semibold text-red-600">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-ink-950 md:text-4xl">معلوماتك</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "الاسم الكامل", "text", "أحمد...")}
        {field("phone", "رقم الجوال", "tel", "05xxxxxxxx")}
        {field("city", "المدينة", "text", "الرياض")}
        {field("address", "العنوان (الحي/الشارع)", "text", "حي ... شارع ...")}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-ink-950">ملاحظات (اختياري)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ink-950/20"
          placeholder="أي ملاحظة إضافية..."
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-ink-950">طريقة الدفع</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "whatsapp", label: "WhatsApp / تحويل" },
            { value: "cod", label: "الدفع عند الاستلام" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, payment: opt.value }))}
              className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition-colors ${
                form.payment === opt.value
                  ? "bg-ink-950 text-cream-50"
                  : "border border-ink-950/20 text-ink-950 hover:bg-ink-950/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ items, customer, hasPrice, subtotal }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-ink-950 md:text-4xl">مراجعة الطلب</h1>
      <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-extrabold text-ink-950">المنتجات</h2>
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={`${it.id}::${it.size || ""}`} className="flex items-center justify-between text-sm">
              <span className="text-ink-950">
                {it.name} {it.size ? `(${it.size})` : ""} × {it.qty}
              </span>
              {typeof it.price === "number" && (
                <span className="font-bold text-ink-950">{it.price * it.qty}</span>
              )}
            </li>
          ))}
        </ul>
        {hasPrice && (
          <div className="mt-4 flex items-center justify-between border-t border-cream-200 pt-3">
            <span className="font-bold text-ink-950">المجموع</span>
            <span className="font-display text-xl font-bold text-ink-950">{subtotal}</span>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-extrabold text-ink-950">معلومات العميل</h2>
        <ul className="space-y-1.5 text-sm text-ink-950">
          <li><span className="font-bold">الاسم:</span> {customer.name}</li>
          <li><span className="font-bold">الجوال:</span> {customer.phone}</li>
          <li><span className="font-bold">المدينة:</span> {customer.city}</li>
          <li><span className="font-bold">العنوان:</span> {customer.address}</li>
          {customer.notes && <li><span className="font-bold">ملاحظات:</span> {customer.notes}</li>}
          <li>
            <span className="font-bold">الدفع:</span>{" "}
            {customer.payment === "cod" ? "الدفع عند الاستلام" : "WhatsApp / تحويل"}
          </li>
        </ul>
      </div>
      <p className="text-xs text-ink-500">
        بالضغط على "تأكيد" سيتم فتح WhatsApp لإرسال الطلب. سيتم تفريغ السلة بعد الإرسال.
      </p>
    </div>
  );
}

function SuccessStep({ onDone }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-ink-950 text-cream-50">
        <Check size={40} strokeWidth={2.4} />
      </div>
      <h1 className="font-display text-4xl font-bold text-ink-950">تم إرسال الطلب!</h1>
      <p className="max-w-md text-ink-700">
        تم فتح WhatsApp. أرسل الرسالة لإكمال الطلب. سنقوم بتأكيد السعر وطريقة الدفع.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="rounded-full bg-ink-950 px-8 py-3 text-sm font-extrabold text-cream-50 shadow-lg transition-transform hover:scale-105"
      >
        العودة للمتجر
      </button>
    </div>
  );
}