# تقرير الفحص الشامل — جاهزية موقع زاهي للإنتاج (Production)

**التاريخ:** 2 أغسطس 2026
**المشروع:** ZAHIEG (Vite 6 + React 19 + TypeScript + Tailwind + Supabase)
**المرجع:** https://zahieg.com — ريبو GitHub: `A7med3ssam52/zahieg`

---

## ملخص تنفيذي

الموقع **مبني صح في الأساس** (تقسيم كود ممتاز، lazy loading لكل الصفحات، i18n متكامل عربي/إنجليزي بنفس عدد المفاتيح 100%، فحص TypeScript صارم، CI يعمل). لكن **مش جاهز للإطلاق الحقيقي** — فيه ٦ مشاكل حرجة لازم تتحل الأول:

1. ملف `.env.production` مرفوع على GitHub (بيانات Supabase حية)
2. خلط دومينين (`zahieg.com` و `zahi.store`) في sitemap/robots/JSON-LD — هيضر الـ SEO
3. البناء `dist/` قديم (من 15 يوليو) — صفحة `/contacts` مش فيه، والنشر منه يكسر الموقع
4. RLS في قاعدة البيانات متساهل جداً (أي مستخدم مسجل يقدر يعدل المنتجات ويقرأ عناوين كل العملاء)
5. الدفع "باي موب" **غير مفعل أصلًا** — صفحة الدفع معلوماتية فقط، والطلبات ممكن متتحفظش في قاعدة البيانات (خطأ صامت)
6. معظم نماذج الموقع وهمية (فورم اتصل بنا، النيوزليتر، إيميلات الطلبات، سبين الحظ)

---

## القسم ١ — مشاكل حرجة (Blockers) لازم تتحل قبل الإطلاق

### ١.١ ملف البيئة مرفوع على GitHub
- **`src/lib/supabase.ts:3-4`**: الكود بيقرا `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `.env.production` **متتبع في git** (تم التحقق: `git ls-files` بيطلّعه) وفيه URL وكي مشروع Supabase حي.
- الخطر الحالي منخفض-متوسط (المفتاح publishable بطبيعته مكشوف في البندل)، لكن لو الملف ده اتضاف له `service_role` يوم من الأيام = اختراق كامل. ولأن `.env` في `.gitignore` بس `.env.production` مش ممنوع، يبقى خطأ إعدادات.
- **الإجراء:** إضافة `.env.production` و `.env.example` (بقيّم فارغة) وحذفه من تاريخ git.

### ١.٢ لا يوجد `.env.example`
- الملف مش موجود (تم التحقق). مشروع جديد أو شخص جديد مايقدرش يشتغل عليه بدون معرفة المتغيرات المطلوبة.

### ١.٣ الموقع بيفرغ (شاشة بيضاء) لو البيئة ناقصة
- `src/lib/supabase.ts` بيستدعي `createClient(supabaseUrl, supabaseKey)` عند تحميل الموديول **بدون أي تحقق**. المكتبة نفسها بتعمل throw بـ "supabaseUrl is required" لو القيمة undefined.
- بما أن كل الخدمات والموديولات بتستورد `supabase` مباشرة، فبناء بدون المتغيرات = انهيار كامل للتطبيق.
- **الإجراء:** التحقق من وجود القيم وعرض رسالة خطأ لطيفة بدل الشاشة البيضاء.

### ١.٤ البناء `dist/` قديم — صفحة `/contacts` مش موجودة فيه
- آخر بناء: **15 يوليو 2026**، آخر تعديلات السورس: **2 أغسطس 2026**.
- `dist/assets/` فيه `ContactPage-*.js` لكن **مفيش `ContactUsPage-*.js`** — صفحة `/contacts` الجديدة مش في البناء.
- **الإجراء:** إعادة `npm run build` قبل أي نشر، أو الاعتماد على الـ auto-deploy بتاع Vercel.

### ١.٥ خلط الدومينين `zahieg.com` vs `zahi.store` (أهم مشكلة SEO)
| الملف | السطر | الدومين المستخدم |
|---|---|---|
| `src/constants/index.ts` | 5 | `https://zahieg.com` ✓ (الصحيح) |
| `index.html` | 30 | `https://zahi.store` (JSON-LD) ✗ |
| `public/robots.txt` | 3 | `https://zahi.store/sitemap.xml` ✗ |
| `public/sitemap.xml` | 3-9 | كل الروابط السبعة `zahi.store` ✗ |
| `src/i18n/ar.json` + `en.json` | 674, 714, 750 | `info@zahi.store` ✗ |

- النتيجة: جوجل هيشوف إشارات متضاربة (canonical/og/JSON-LD على دومين مختلف) = تقسيم قوة الـ SEO.
- **الإجراء:** توحيد كل حاجة على `zahieg.com` وإزالة كل ذكر لـ `zahi.store`.

### ١.٦ سياسات RLS خطيرة في قاعدة البيانات
- `back-end schema/fix_schema.sql:75-93` و `_run_all_combined.sql:1781-1846` (سياسات "مخففة للتطوير" مضافة للسكربت النهائي):
  - `products` / `categories` / `brands` — أي مستخدم مسجل يقدر **يعدل/يحذف/يضيف** منتجات
  - `profiles` — SELECT لأي حد: **أسماء/إيميلات/موبايلات كل العملاء مكشوفة (تسريب PII)**
  - `addresses` — SELECT لأي حد: **عناوين وموبايلات العملاء مكشوفة**
  - `coupons` — أكواد الخصم عامة
- `supabase-complete.sql:217` — سياسة `orders_read` بـ `USING (true)` (كل الطلبات مقروءة لأي حد)
- `supabase-complete.sql:225-227` — `store_settings_write` و `announcements_write` بـ `USING (true)` (أي زائر **مجهول** يقدر يعدل إعدادات المتجر!)
- **الإجراء:** استبدال السياسات المخففة بالسياسات الصارمة (المسجلة في `15_rls_policies.sql`) وحذف فقرة التخفيف من `_run_all_combined.sql`.

---

## القسم ٢ — أمان

| المشكلة | الموقع | الخطر |
|---|---|---|
| `.env.production` مرفوع على GitHub | جذر الريبو | متوسط |
| بيانات ديمو `kiady@zahieg.com` / `123456` مكتوبة في SQL seeds | `supabase-seed.sql:7`, `supabase-complete.sql:307-312` | منخفض (تعليقات بس) |
| `src/data/users.json:27-28` — كلمة مرور plaintext `123456` | ملف بيانات | منخفض (ملف مش مستخدم لكن موجود) |
| الوصول للأدمن عميل-جانب فقط | `AdminLayout.tsx:135-142` | متوسط (بيتظبط لما الـ RLS تشتغل صح) |
| أول أدمن لازم يُعمل يدويًا في SQL | `README.md:55-60` | عملية غير موثقة في الموقع |
| كوبونات السبين مولّدة في المتصفح (`SPIN-...`) | `SpinContext.tsx:177` | قابل للتزوير |
| الـ Rate limit لسبين الحظ في localStorage (يتعمل مسح وميتدخل تاني) | `SpinContext.tsx:89-154` | قابل للتجاوز |

---

## القسم ٣ — وظائف وهمية أو غير مكتملة (بيظهر منها نجاح زائف)

### ٣.١ الدفع — **غير موجود أصلًا**
- `PaymentPage.tsx` صفحة معلوماتية ثابتة 100% — لا SDK ولا API ولا redirect.
- "باي موب" **نص فقط** في الترجمة (`i18n/ar.json:821` و `en.json:821`) — مفيش ولا سطر كود باي موب.
- الـ checkout بيختار طريقة الدفع ويحفظها نص على الطلب بس — **مفيش عملية دفع حقيقية**.

### ٣.٢ الطلبات ممكن تضيع بصمت
- `orderService.ts:50`: نتيجة الـ `insert` للطلب **مهملة** — لو فشل الـ insert في قاعدة البيانات (RLS للزوار، enum غير متوافق)، الطلب "ينجح" في الذاكرة وتبان رسالة نجاح للمستخدم، لكن الطلب **مش محفوظ**.
- **خلل enum:** قاعدة البيانات فيها `vodafone_cash` (underscore) والموقع بيديها `vodafone-cash` (hyphen) من `CheckoutPage.tsx:233` → PostgreSQL بيرفض الحفظ → بياكل الطلب بصمت.
- طلبات الزوار (غير المسجلين) بتتبعت بـ `userId: undefined` → RLS بيرفضها.
- **خلل في AuthContext:** التسجيل بيحفظ بروفايل بـ id الحقيقي بس بيحط في الذاكرة id وهمي `user-${Date.now()}` (`AuthContext.tsx:117`) → طلبات المستخدم الجديد مش هتتربط بحسابه.

### ٣.٣ الإيميلات — كلها وهمية
- `CheckoutPage.tsx:108-111`: بيحفظ سطر في جدول `order_email_logs` وبيطلع `toast.success("تم إرسال إيميل التأكيد")` — **ولا إيميل واحد بيتبعت فعلًا**.
- مفيذ أي اتصال بخدمة إيميل (Resend/SendGrid/SES).

### ٣.٤ فورم اتصل بنا — وهمي
- `ContactPage.tsx:27-33`: مجرد `setTimeout` ثانية + toast نجاح. **مفيش ولا حاجة بتتبعت.** (يوجد جدول `contact_messages` في السكيمة لكن غير مستخدم.)
- صفحة `/contacts` الجديدة مفيش فيها فورم (كروت تواصل بس) — ده تمام، لكن صفحة `/contact` القديمة الوهمية لسه موجودة وموصلة في المتجر.

### ٣.٥ النيوزليتر — وهمي
- `NewsletterSection.tsx:12` و `Footer.tsx:55-57`: زر "اشترك" بيفتح واتساب بس. مفيش تسجيل إيميل. (جدول `newsletter_subscribers` موجود بالسكيمة وغير مستخدم.)

### ٣.٦ سبين الحظ — عميل-جانب بالكامل
- اختيار الجائزة بالـ `Math.random()` في المتصفح، والحد اليومي في localStorage، والكوبون متولد في المتصفح. مفيش `spin_history` بيتكتب.

### ٣.٧ أزرار ميتة في صفحة الدخول
- `LoginPage.tsx:459-467` (Apple) و `468-479` (Google): **مفيش onClick — أزرار زينة.**
- `LoginPage.tsx:315-321` "نسيت كلمة المرور": `onClick={() => {}}` — ولا استعادة ولا تغيير كلمة مرور في كل الكود (grep صفر نتائج).

### ٣.٨ التسجيل مش بيعالج تأكيد الإيميل
- `AuthContext.tsx:112-136`: لو Supabase مفعل فيها email confirmation، `signUp` بترجع `data.user = null` → الكود بيرجع "نجاح" من غير حساب فعلي ومن غير رسالة "افحص إيميلك للتأكيد".

### ٣.٩ Social login والعناوين
- بتاعة الزوار بتترفض في RLS → الطلبات تضيع.
- **خطأ React Hooks:** `LoginPage.tsx:140-148` بيستدعي `useForm`/`useCallback` **بعد** سطر `if (isAuthenticated) return null;` (السطر 138) — مخالفة لقواعد الـ Hooks ممكن تسبب أعطال عند تغيير حالة الدخول.

---

## القسم ٤ — SEO

| البند | الحالة |
|---|---|
| Title + Description | موجودة ✓ |
| **Canonical link** | **مفقودة** |
| **hreflang (ar/en)** | **مفقودة** |
| **og:url** | **مفقودة** (فقط في `src/utils/seo.ts` المهجور) |
| **og:image** | **مفقودة** + الملف المرجع `og-image.jpg` **غير موجود** (404 أكيد) |
| og:site_name / og:locale | مفقودة |
| twitter:title/description/image | مفقودة (فقط twitter:card) |
| **JSON-LD** | بيتكلم عن `zahi.store` ومش فيه `telephone`, `sameAs`, `geo` |
| **الميتا الديناميكية للصفحات** | `src/utils/seo.ts` (getSEO) **غير مستورد في أي مكان** — كود ميت، وكل الصفحات بميتا عامة واحدة |
| **robots.txt** | موجود لكن sitemap على الدومين الغلط |
| **sitemap.xml** | 7 روابط فقط، كلها على `zahi.store`، **مفيش `/contacts` ولا `/privacy` ولا `/terms` ولا `/shipping` ولا `/returns`**، ولا روابط منتجات/تصنيفات |
| **404.html** | مش موجود — Vercel بيرد 200 لأي رابط غلط (سيء للـ SEO) |

---

## القسم ٥ — PWA

| البند | الحالة |
|---|---|
| `manifest.json` | موجود، لكن **أيقونة SVG واحدة بس** — مفيش PNG 192×192 ولا 512×512 ولا maskable (التركيب على أندرويد/سكرين السبلاش هيفشل) |
| `apple-touch-icon.png` | **مفقود** — أيقونة iOS هتبقى لقطة شاشة |
| `favicon.ico` | مفقود (SVG بس) |
| `sw.js` | شغال صح: network-first للـ HTML + cache-first للأصول المثبّتة، نسخة `zahi-v2`، و`vercel.json` بيعمل الـ headers الصحيحة (`no-cache` للـ sw.js و `immutable` للأصول) ✓ |
| app shell precache | مش مسبوق — أول تحميل أوفلاين جزئي |

---

## القسم ٦ — الأداء

| البند | الحالة |
|---|---|
| Lazy loading لكل الصفحات | ✓ ممتاز (`routes/index.tsx`) |
| **حجم JS الأولي ~1.14 MB** | index 554KB + vendor 286KB + motion 115KB + **swiper 105KB بيتحمل على أول زيارة** + icons 41KB + query 37KB |
| **Barrel import** `components/features/index.ts` | بيجيب swiper و framer-motion في البندل الأولي رغم إنهم مش مستخدمين إلا في صفحات lazy — بيضيع تحسين الـ manualChunks |
| `cssCodeSplit: false` | ملف CSS واحد 99KB |
| صورة OG للـ share | 404 |
| `loading="lazy"` للصور | **مفيش في أي مكان** |
| `width`/`height` في Navbar/Footer | ناقصة (CLS) |
| Fonts | ✓ preload + preconnect + noscript ممتاز |
| **Palette FOUC** | المستخدم اللي مختار باليت terracotta هيشوف ومضة taupe عند الفتح (مفيش inline script لـ `data-palette`) |

---

## القسم ٧ — بيانات ومحتوى غير متسق

### ٧.١ أرقام الموبايل — ٤ أرقام مختلفة
| الرقم | المكان | الحالة |
|---|---|---|
| `201037223730` | `ContactUsPage.tsx`, `Footer.tsx` (واتساب) | **الحقيقي** (المفترض) |
| `+20 123 456 7890` | `ContactPage.tsx:92` + FAQ في i18n | **رقم وهمي** |
| `+20 100 123 4567` | `Sidebar.tsx:42` | **رقم وهمي** |
| `+201234567890` | `adminService.ts:581,594,618` + `AdminSettingsPage.tsx` | **رقم وهمي** |

### ٧.٢ الإيميلات — ٣ إيميلات مختلفة
- `sales@zahieg.com` (Footer) / `info@zahieg.com` (ContactPage, Sidebar, admin) / `info@zahi.store` (i18n FAQ/Privacy/Terms — الدومين القديم)

### ٧.٣ بيانات الـ seed كلها صور Placeholder
- `loremflickr.com` و `picsum.photos` و `ui-avatars.com` في كل ملفات `src/data/*.json` — **مفيش صور منتجات حقيقية** (الـ fallback لو قاعدة البيانات فاضية هيصوّر متجر فاضي أو صور عشوائية).
- `src/data/products.json` فيه **منتجين بس** — مش كتالوج حقيقي.

### ٧.٤ الملفات المحلية مش مستخدمة
- `brands.json`, `reviews.json`, `users.json`, `orders.json`, `notifications.json`, `coupons.json`, `addresses.json`, `testimonials.json`, `spin-prizes.json` — **ملفات ميتة**، غير مستوردة في أي مكان.
- ولو Supabase وصلت لكن جدول فاضي/مرفوض بـ RLS، `loadAllData()` بتستبدل الـ local JSON بـ **[]** (متجر فاضي) — الـ fallback الحقيقي شغال فقط لو السيرفر غير قابل للوصول خالص.

---

## القسم ٨ — قاعدة البيانات والسكيمة (Supabase)

- **٣ أجيال متضاربة من السكيمة في الريبو:** `supabase-schema.sql` / `supabase-complete.sql` (نموذج قديم: `profiles.auth_id`, نصية PKs) مقابل `back-end schema/` (نموذج جديد: UUIDs, `category_id`). تشغيل الغلط هيكسر كل الاستعلامات.
- `19_accounting.sql:8` بيستخدم `uuid_generate_v4()` **بدون** `CREATE EXTENSION pgcrypto` → يفشل على مشروع جديد.
- **Storage buckets مش متعملة في السكيمة** (`14_storage_buckets.sql` كله تعليقات، والمطلوب عمل يدوي).
- **عدم تطابق مسار avatars:** RLS بتتطلب `avatars/<user-uuid>/...` لكن الكود (`src/lib/upload.ts:20-23`) بيرفع `avatars/<uuid عشوائي>.ext` → الرفع هيتشال.
- **تضارب اسم الجدول:** الكود بيدخل في `order_email_logs` (موجودة في `back-end schema/`) بينما `supabase-complete.sql` عارف `order_emails`.
- جداول/دوال موجودة بالسكيمة ومش مستخدمة: `get_dashboard_data()`, `validate_coupon()`, `increment_coupon_usage()`, `newsletter_subscribers`, `contact_messages`, `spin_history`, `back_in_stock_requests`.
- `API_BASE_URL = '/api'` في `constants/index.ts:7` — **كود ميت** (مفيش ولا `fetch('/api')` في المشروع).
- `loadAllData()` بيتصل بـ 11 جدول في مرة واحدة بدون معالجة أخطاء على مستوى الجدول.

---

## القسم ٩ — أدوات وتطوير

| البند | الحالة |
|---|---|
| **eslint** | مش مثبت، لكن `.eslintrc.cjs` موجود و`lint:eslint` script مكسور |
| **prettier** | مش مثبت — `format`/`format:check` مكسورين |
| **اختبارات** | مفيش أي test framework ولا خطوة tests في الـ CI |
| CI | `npm ci` + tsc + build فقط — كويس، لكن مفيش deploy workflow (معتمد على Vercel) |
| `serve.js` | بيستخدم `URL.pathname` → بيكسر على Windows (`/C:/...`) ومفيش `start` script يستدعيه |
| `tsconfig.tsbuildinfo` | مرفوع على git (artifact بناء) |
| `package.json` name | `matjar` — مش مطابق لبراند "زاهي" |
| **Analytics** | **مفيش نهائيًا** — لا GA4 ولا Meta Pixel ولا GTM ولا Clarity. متجر إلكتروني من غير tracking = مش هتعرف حاجة عن التحويلات |
| **Error boundary عام** | مفيش class component error boundary فوق الـ providers — خطأ في `ThemeProvider`/`AuthProvider`/`CartContext` = شاشة بيضاء كاملة |
| الصفحات اللّي بلا روت | `DashboardPage.tsx` (dead code) |
| `console.log`/`debugger` | نظيف ✓ (console.warn واحد مشروع في catch) |
| كل الرواات → الملفات | ✓ 30 صفحة + 12 أدمن، كلها موجودة |

---

## خطة الأولويات (Checklist للإطلاق)

### 🔴 مرحلة أولى — قبل الإطلاق بأي ثمن (١-٣ أيام)
- [ ] حذف `.env.production` من git وإضافة `.env.example`
- [ ] إزالة `zahi.store` نهائيًا → كل شيء على `zahieg.com` (sitemap, robots, JSON-LD, إيميلات i18n)
- [ ] تشديد RLS في قاعدة البيانات (حذف سياسات التخفيف، تفعيل `15_rls_policies.sql`)
- [ ] تصحيح enum `payment_method` (vodafone-cash → vodafone_cash) أو تحويله إلى TEXT
- [ ] معالجة أخطاء `insert` الطلبات (فشل = رسالة خطأ حقيقية، مش نجاح زائف)
- [ ] `npm run build` جديد + التحقق إن `/contacts` ظهرت في dist
- [ ] استبدال رقم الموبايل الوهمي `+20 123 456 7890` في `ContactPage.tsx` و i18n والـ Sidebar

### 🟡 مرحلة ثانية — خلال أول أسبوع من الإطلاق
- [ ] ربط `contact_messages` بفورم اتصل بنا أو إيميل حقيقي
- [ ] ربط `newsletter_subscribers` بالنيوزليتر
- [ ] تفعيل إيميلات الطلبات عبر خدمة إيميل حقيقية (أو إزالة الـ toast الكاذب)
- [ ] دمج Paymob فعلي (أو إزالة ادعاء "باي موب" من النصوص)
- [ ] معالجة تأكيد الإيميل في التسجيل + زر "نسيت كلمة المرور" + إصلاح ترتيب الـ hooks في LoginPage
- [ ] تصحيح مسار رفع الـ avatars ليطابق RLS
- [ ] إضافة Analytics (GA4 + Meta Pixel)
- [ ] إضافة Error Boundary عام

### 🟢 مرحلة ثالثة — تحسينات (أسبوع ٢+)
- [ ] أوقاع canonical + hreflang + og:image حقيقية (`og-image.jpg`) + رفع `src/utils/seo.ts` لكل صفحة
- [ ] تحديث sitemap (كل الصفحات + /contacts) على الدومين الصحيح
- [ ] أيقونات PWA PNG (192/512/maskable) + apple-touch-icon
- [ ] إزالة الـ barrel import لـ features عشان swiper يفضل lazy (تقليل الـ bundle الأولي من 1.14MB)
- [ ] صور منتجات حقيقية بدل picsum/loremflickr
- [ ] إصلاح سبين الحظ ليكون server-side (أو إيقافه)
- [ ] توحيد بيانات التواصل في مكان واحد (كونستنت) واستخدامها في كل الموقع
- [ ] تثبيت eslint/prettier أو حذف السكريبتات المكسورة
- [ ] `404.html` + استجابة 404 حقيقية
- [ ] إصلاح `serve.js` (fileURLToPath) أو حذفه
- [ ] منع التتبع الثنائي: نقل بيانات `tsconfig.tsbuildinfo` لـ gitignore

---

## خلاصة

البنية التحتية (الكود، التقسيم، الـ i18n، الـ CI) **ممتازة**. لكن الإطلاق الحقيقي محتاج:
**أولاً:** إصلاحات البيانات الحرجة (env في git، الدومينين، RLS، الطلبات بتضيع) —
**ثانيًا:** قرارات تجارية/تقنية: هل الدفع هيتفعل بـ Paymob فعلًا؟ هل الإيميلات هتتربط بخدمة إيميل؟ هل السوشيال لوجين هيتفعل؟

من غير ١-٦ في خطة المرحلة الأولى، الموقع ممكن يشوفه الناس لكن **الطلبات والدفع وثقة العملاء هتتأثر**.
