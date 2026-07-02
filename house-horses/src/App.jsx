import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Heart,
  MessageCircle,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Sun,
  Truck,
  X,
} from "lucide-react";
import "./App.css";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const STORE_SLUG = (import.meta.env.VITE_STORE_SLUG || "hgagy").trim().toLowerCase();
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "store-assets";
const DEFAULT_WHATSAPP = (import.meta.env.VITE_STORE_WHATSAPP || "").trim();
const FALLBACK_WHATSAPP_BY_STORE = {
  hgagy: "01557221816",
};
const DEFAULT_STORE = {
  name: "بيت الخيول",
  store_name: "بيت الخيول",
  slug: STORE_SLUG,
  whatsapp: DEFAULT_WHATSAPP || FALLBACK_WHATSAPP_BY_STORE[STORE_SLUG] || "",
};
const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1511199147662-55eb9df2fcb6?auto=format&fit=crop&w=900&q=82";
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1511199147662-55eb9df2fcb6?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=900&q=82",
];

function formatPrice(value) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeProduct(product, index) {
  const imagePaths = Array.isArray(product.image_paths) ? product.image_paths : [];
  const metadata = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
  const category =
    product.category_name || product.category || product.type || product.breed || "مختارات بيت الخيول";

  return {
    id: product.id ?? product.slug ?? `product-${index + 1}`,
    slug: product.slug || `product-${index + 1}`,
    sku: product.sku || metadata.sku || "",
    name: product.name || product.title || "خيل عربي أصيل",
    description: product.short_description || product.description || "اختيار فاخر بتفاصيل دقيقة وخدمة موثوقة.",
    fullDescription:
      product.description || product.short_description || "اختيار فاخر بتفاصيل دقيقة وخدمة موثوقة.",
    price: Number(product.price || 0),
    compareAtPrice: Number(product.compare_at_price || product.old_price || 0),
    category,
    isFeatured: Boolean(product.is_featured || metadata.featured),
    imagePaths,
    imageUrl: product.image_url || product.image || product.thumbnail_url || "",
    badge: product.badge || product.status || product.condition || "جاهز للعرض",
    stock: Number(product.inventory_quantity ?? product.stock_quantity ?? product.quantity ?? product.stock ?? 1),
    metadata,
  };
}

function getPublicAssetUrl(client, path) {
  if (!path || !client) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return client.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function getProductImages(client, product, index) {
  const urls = [];
  if (product.imageUrl) urls.push(product.imageUrl);

  product.imagePaths.forEach((path) => {
    const url = getPublicAssetUrl(client, path);
    if (url && !urls.includes(url)) urls.push(url);
  });

  return urls.length ? urls : [FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]];
}

function getDiscount(product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}

function getSavedTheme() {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("horse_house_theme") || "light";
}

function normalizeWhatsapp(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits || digits.length < 8) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function resolveWhatsapp(store) {
  return normalizeWhatsapp(
    store?.whatsapp ||
      store?.store_whatsapp ||
      store?.phone ||
      store?.store_phone ||
      store?.contact?.whatsapp ||
      store?.contact?.phone ||
      store?.contact?.mobile ||
      DEFAULT_WHATSAPP ||
      FALLBACK_WHATSAPP_BY_STORE[STORE_SLUG]
  );
}

function createWhatsappUrl(product, store) {
  const phone = resolveWhatsapp(store);
  const message = [
    `مرحبا، أريد شراء: ${product.name}`,
    `السعر: ${formatPrice(product.price)}`,
    product.sku ? `كود المنتج: ${product.sku}` : "",
    `المتجر: ${store?.name || store?.store_name || "بيت الخيول"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "";
}

function createCartWhatsappUrl(cartItems, store) {
  const phone = resolveWhatsapp(store);
  const lines = cartItems.flatMap(({ product, quantity }, index) => [
    `${index + 1}. ${product.name}`,
    `الكمية: ${quantity}`,
    `السعر: ${formatPrice(product.price)}`,
    product.sku ? `كود المنتج: ${product.sku}` : "",
  ]);
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const message = [
    `مرحبا، أريد الاستفسار عن المنتجات التالية من ${store?.name || store?.store_name || "بيت الخيول"}:`,
    "",
    ...lines.filter(Boolean),
    "",
    `الإجمالي التقريبي: ${formatPrice(total)}`,
  ].join("\n");

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "";
}

function getStoreContact(store) {
  return {
    phone: store?.phone || store?.store_phone || store?.contact?.phone || "",
    whatsapp: resolveWhatsapp(store),
    email: store?.email || store?.contact?.email || "",
  };
}

function pickStoreFromProduct(product) {
  if (!product) return null;

  return {
    id: product.store_id,
    name: product.store_name,
    slug: product.store_slug,
    phone: product.phone || product.store_phone,
    whatsapp: product.whatsapp || product.store_whatsapp,
    email: product.email || product.store_email,
    contact: product.contact,
  };
}

function readCart() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem("horse_house_cart") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(SUPABASE_URL && SUPABASE_KEY));
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(0);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [theme, setTheme] = useState(getSavedTheme);
  const [store, setStore] = useState(DEFAULT_STORE);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cart, setCart] = useState(readCart);
  const [cartOpen, setCartOpen] = useState(false);

  const client = supabase;

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set(products.map((item) => item.category).filter(Boolean)))],
    [products]
  );

  const highestPrice = useMemo(
    () => Math.max(0, ...products.map((item) => item.price)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const priceLimit = Number(maxPrice || highestPrice);

    return products
      .filter((product) => {
        const matchesQuery =
          !normalizedQuery ||
          `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalizedQuery);
        const matchesCategory = category === "الكل" || product.category === category;
        const matchesPrice = !priceLimit || product.price <= priceLimit;
        const matchesOffer = !onlyOffers || getDiscount(product) > 0;

        return matchesQuery && matchesCategory && matchesPrice && matchesOffer;
      })
      .sort((first, second) => {
        if (sortBy === "price-low") return first.price - second.price;
        if (sortBy === "price-high") return second.price - first.price;
        if (sortBy === "name") return first.name.localeCompare(second.name, "ar");
        return getDiscount(second) - getDiscount(first);
      });
  }, [category, highestPrice, maxPrice, onlyOffers, products, query, sortBy]);

  const totalValue = useMemo(
    () => products.reduce((sum, product) => sum + product.price, 0),
    [products]
  );
  const storeContact = useMemo(() => getStoreContact(store), [store]);
  const cartItems = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          product: products.find((product) => String(product.id) === String(item.id)),
        }))
        .filter((item) => item.product),
    [cart, products]
  );
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    document.title = "بيت الخيول | متجر فاخر";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("horse_house_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("horse_house_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    }

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  useEffect(() => {
    if (highestPrice && !maxPrice) {
      setMaxPrice(highestPrice);
    }
  }, [highestPrice, maxPrice]);

  async function loadProducts() {
    if (!client) {
      setLoading(false);
      setIsError(true);
      setStatus("المنتجات غير متاحة حاليا.");
      return;
    }

    setLoading(true);
    setIsError(false);
    setStatus("");

    try {
      const productsResult = await client.rpc("get_public_store_products", {
        _store_slug: STORE_SLUG,
      });

      if (productsResult.error) throw productsResult.error;

      const normalized = Array.isArray(productsResult.data) ? productsResult.data.map(normalizeProduct) : [];
      if (Array.isArray(productsResult.data) && productsResult.data[0]) {
        const productStore = pickStoreFromProduct(productsResult.data[0]);
        setStore((currentStore) => ({
          ...currentStore,
          ...Object.fromEntries(Object.entries(productStore).filter(([, value]) => Boolean(value))),
        }));
      }
      setProducts(normalized);
      setCategory("الكل");
      setMaxPrice(Math.max(0, ...normalized.map((item) => item.price)));
      setStatus("");
    } catch (error) {
      console.error(error);
      setProducts([]);
      setStatus("تعذر تحميل المنتجات. حاول مرة أخرى بعد قليل.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setCategory("الكل");
    setSortBy("featured");
    setMaxPrice(highestPrice);
    setOnlyOffers(false);
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  }

  function handleProductKeyDown(event, product) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct(product);
    }
  }

  function openWhatsapp(product) {
    const url = createWhatsappUrl(product, store);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setStatus("رقم واتساب المتجر غير متاح حاليا.");
    setIsError(true);
  }

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return items.map((item) =>
          String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...items, { id: product.id, quantity: 1 }];
    });
    setStatus("تمت إضافة المنتج إلى السلة.");
    setIsError(false);
  }

  function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      setCart((items) => items.filter((item) => String(item.id) !== String(productId)));
      return;
    }

    setCart((items) =>
      items.map((item) => (String(item.id) === String(productId) ? { ...item, quantity } : item))
    );
  }

  function removeFromCart(productId) {
    setCart((items) => items.filter((item) => String(item.id) !== String(productId)));
  }

  function openCartWhatsapp() {
    if (!cartItems.length) {
      setStatus("السلة فارغة حاليا.");
      setIsError(true);
      return;
    }

    const url = createCartWhatsappUrl(cartItems, store);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setStatus("رقم واتساب المتجر غير متاح حاليا.");
    setIsError(true);
  }

  const emptyState = !loading && filteredProducts.length === 0;
  const themeLabel = theme === "dark" ? "الوضع النهاري" : "الوضع الليلي";

  return (
    <main className="site-shell" dir="rtl">
      <section className="hero" style={{ "--hero-image": `url(${HERO_IMAGE})` }}>
        <div className="hero-atmosphere" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <nav className="topbar" aria-label="التنقل الرئيسي">
          <a className="brand" href="#top" aria-label="بيت الخيول">
            <Crown size={24} aria-hidden="true" />
            <span>بيت الخيول</span>
          </a>
          <div className="topbar-actions">
            <a href="#collection">المجموعة</a>
            {storeContact.whatsapp ? (
              <a href={`https://wa.me/${storeContact.whatsapp}`} target="_blank" rel="noreferrer">
                واتساب
              </a>
            ) : (
              <a href="#contact">التواصل</a>
            )}
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
              title={themeLabel}
              aria-label={themeLabel}
            >
              {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </button>
            <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label="فتح السلة">
              <ShoppingBag size={19} aria-hidden="true" />
              <span>{cartCount}</span>
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <h1>{store?.name || store?.store_name || "بيت الخيول"}</h1>
          <p>
            وجهة راقية لاختيار الخيول ومستلزماتها بعرض منظم، صور واضحة، فلاتر دقيقة،
            وتجربة شراء تليق بعميل يبحث عن الجودة والثقة.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#collection">تسوق الآن</a>
          </div>
          <div className="hero-trust">
            <span>تجربة شراء راقية</span>
            <span>فلترة فورية</span>
            <span>أفضل الأسعار</span>
          </div>
        </div>
        <a className="scroll-cue" href="#collection" aria-label="انتقل إلى المنتجات">
          <span />
        </a>
      </section>

      <section className="commerce-strip" id="advantages" aria-label="مميزات المتجر">
        <div>
          <ShieldCheck size={22} aria-hidden="true" />
          <strong>فحص موثق</strong>
          <span>تفاصيل واضحة قبل الشراء</span>
        </div>
        <div>
          <Truck size={22} aria-hidden="true" />
          <strong>تنسيق تسليم</strong>
          <span>متابعة منظمة حسب المدينة</span>
        </div>
        <div>
          <Crown size={22} aria-hidden="true" />
          <strong>اختيارات نخبة</strong>
          <span>منتجات منتقاة للذوق الرفيع</span>
        </div>
      </section>

      {status ? (
        <div className={isError ? "status error" : "status"} aria-live="polite">
          {status}
        </div>
      ) : null}

      <section className="catalog" id="collection">
        <div className="section-heading">
          <div>
            <h2>اختر من المجموعة المتاحة</h2>
          </div>
        </div>

        <div className="filters-panel" id="filters">
          <div className="search-field">
            <Search size={20} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم، الوصف، أو التصنيف"
            />
          </div>

          <label className="control">
            <Filter size={18} aria-hidden="true" />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="control">
            <ArrowDownUp size={18} aria-hidden="true" />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">العروض أولا</option>
              <option value="price-low">السعر من الأقل</option>
              <option value="price-high">السعر من الأعلى</option>
              <option value="name">الاسم</option>
            </select>
          </label>

          <label className="range-control">
            <span>حتى {formatPrice(maxPrice || highestPrice)}</span>
            <input
              type="range"
              min="0"
              max={highestPrice || 0}
              value={maxPrice || 0}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>

          <button
            className={onlyOffers ? "icon-toggle active" : "icon-toggle"}
            type="button"
            onClick={() => setOnlyOffers((value) => !value)}
            title="العروض فقط"
            aria-pressed={onlyOffers}
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
            العروض
          </button>

          <button className="reset-button" type="button" onClick={resetFilters} title="إعادة ضبط الفلاتر">
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="products-grid" aria-live="polite">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="product-card skeleton" key={index} />
            ))}
          </div>
        ) : emptyState ? (
          <div className="empty-state">لا توجد منتجات مطابقة حاليا.</div>
        ) : (
          <div className="products-grid" aria-live="polite">
            {filteredProducts.map((product, index) => {
              const imageUrl = getProductImages(client, product, index)[0];
              const discount = getDiscount(product);

              return (
                <article
                  className="product-card"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProduct(product)}
                  onKeyDown={(event) => handleProductKeyDown(event, product)}
                >
                  <div className="media-wrap">
                    <img src={imageUrl} alt={product.name} loading="lazy" />
                    <span className="badge">{discount ? `خصم ${discount}%` : product.badge}</span>
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      <span>{product.category}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="price-row">
                      <strong>{formatPrice(product.price)}</strong>
                      {product.compareAtPrice ? <del>{formatPrice(product.compareAtPrice)}</del> : null}
                    </div>
                    <button
                      className="cart-add-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <ShoppingBag size={18} aria-hidden="true" />
                      إضافة للسلة
                    </button>
                    <button
                      className="buy-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openWhatsapp(product);
                      }}
                    >
                      <MessageCircle size={18} aria-hidden="true" />
                      اطلب عبر واتساب
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="site-footer" id="contact">
        <div className="footer-brand">
          <Crown size={28} aria-hidden="true" />
          <h2>بيت الخيول</h2>
          <p>متجر عربي فاخر مصمم لعرض المنتجات بثقة، سرعة، وشراء مباشر عبر واتساب.</p>
        </div>
        <div>
          <h3>المتجر</h3>
          <a href="#collection">المنتجات</a>
        </div>
        <div>
          <h3>الخدمة</h3>
          {storeContact.phone ? <span>{storeContact.phone}</span> : <span>دعم قبل الشراء</span>}
          {storeContact.email ? <span>{storeContact.email}</span> : null}
          <span>تنسيق معاينة</span>
          <span>متابعة الطلبات</span>
        </div>
        <div className="footer-cta">
          <h3>جاهز للاختيار؟</h3>
          {storeContact.whatsapp ? (
            <a href={`https://wa.me/${storeContact.whatsapp}`} target="_blank" rel="noreferrer">
              تواصل واتساب
            </a>
          ) : (
            <a href="#collection">ابدأ التسوق</a>
          )}
        </div>
      </footer>

      {cartOpen ? (
        <div className="cart-drawer" role="dialog" aria-modal="true" aria-label="سلة المنتجات">
          <button className="cart-backdrop" type="button" onClick={() => setCartOpen(false)} />
          <aside className="cart-panel">
            <div className="cart-header">
              <div>
                <span>سلة المنتجات</span>
                <strong>{cartCount} عنصر</strong>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {cartItems.length ? (
              <>
                <div className="cart-items">
                  {cartItems.map(({ product, quantity }) => {
                    const productIndex = products.findIndex((item) => item.id === product.id);
                    const imageUrl = getProductImages(client, product, Math.max(productIndex, 0))[0];

                    return (
                      <article className="cart-item" key={product.id}>
                        <img src={imageUrl} alt={product.name} />
                        <div>
                          <h3>{product.name}</h3>
                          <span>{formatPrice(product.price)}</span>
                          <div className="quantity-control">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, quantity - 1)}
                              aria-label="تقليل الكمية"
                            >
                              -
                            </button>
                            <strong>{quantity}</strong>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, quantity + 1)}
                              aria-label="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button className="remove-item" type="button" onClick={() => removeFromCart(product.id)}>
                          حذف
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="cart-summary">
                  <div>
                    <span>الإجمالي التقريبي</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                  <button className="buy-button" type="button" onClick={openCartWhatsapp}>
                    <MessageCircle size={18} aria-hidden="true" />
                    اسأل عن الكل على واتساب
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={34} aria-hidden="true" />
                <h3>السلة فارغة</h3>
                <p>أضف المنتجات التي تريد السؤال عنها ثم أرسلها كلها في رسالة واتساب واحدة.</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {selectedProduct ? (
        <div className="product-modal" role="dialog" aria-modal="true" aria-label={selectedProduct.name}>
          <button className="modal-backdrop" type="button" onClick={() => setSelectedProduct(null)} />
          <div className="modal-panel">
            <button className="modal-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="إغلاق">
              <X size={22} aria-hidden="true" />
            </button>
            {(() => {
              const productIndex = products.findIndex((item) => item.id === selectedProduct.id);
              const images = getProductImages(client, selectedProduct, Math.max(productIndex, 0));
              const activeImage = images[selectedImageIndex] || images[0];
              const discount = getDiscount(selectedProduct);

              return (
                <>
                  <div className="modal-gallery">
                    <div className="modal-image">
                      <img src={activeImage} alt={selectedProduct.name} />
                      {images.length > 1 ? (
                        <div className="gallery-nav">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImageIndex((value) => (value + images.length - 1) % images.length)
                            }
                            aria-label="الصورة السابقة"
                          >
                            <ChevronRight size={20} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedImageIndex((value) => (value + 1) % images.length)}
                            aria-label="الصورة التالية"
                          >
                            <ChevronLeft size={20} aria-hidden="true" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {images.length > 1 ? (
                      <div className="thumbs">
                        {images.map((image, index) => (
                          <button
                            className={index === selectedImageIndex ? "active" : ""}
                            type="button"
                            key={image}
                            onClick={() => setSelectedImageIndex(index)}
                            aria-label={`عرض صورة ${index + 1}`}
                          >
                            <img src={image} alt="" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-content">
                    <div className="modal-meta">
                      <span>{selectedProduct.category}</span>
                      {selectedProduct.isFeatured ? <span>مميز</span> : null}
                      {discount ? <span>خصم {discount}%</span> : null}
                    </div>
                    <h2>{selectedProduct.name}</h2>
                    <p>{selectedProduct.fullDescription}</p>
                    <dl className="details-list">
                      <div>
                        <dt>السعر</dt>
                        <dd>{formatPrice(selectedProduct.price)}</dd>
                      </div>

                    </dl>
                    <div className="modal-actions">
                      <button className="buy-button" type="button" onClick={() => openWhatsapp(selectedProduct)}>
                        <MessageCircle size={18} aria-hidden="true" />
                        شراء عبر واتساب
                      </button>
                      <button className="outline-button" type="button" onClick={() => setSelectedProduct(null)}>
                        متابعة التسوق
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </main>
  );
}
