import { BrowserRouter, Routes, Route, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ScrollToTop } from "./router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import MobileTabBar from "./components/MobileTabBar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// إعادة تركيب PDP مع كل slug — الحالة تبدأ نظيفة من غير أي effect تصفير
function ProductPage() {
  const { id } = useParams();
  return <ProductDetails key={id} />;
}

// انتقال ناعم بين الصفحات — إحساس التطبيق: كل شاشة بتطلع لفه خفيفة (دخول بس، مفيش انتظار خروج)
function AnimatedRoutes() {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* مساحة شريط التنقل السفلي بتتحسب جوه الفوتر نفسه (تحت) — مفيش فراغ كريمي زيادة */}
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <main>
          <AnimatedRoutes />
        </main>
        <Footer />
        <WhatsAppFloat />
        <MobileTabBar />
      </div>
    </BrowserRouter>
  );
}
