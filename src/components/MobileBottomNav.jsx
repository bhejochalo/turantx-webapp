import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { showToast } from "./Toast";
import "./MobileBottomNav.css";

const HIDE_PATHS = ["/admin", "/confirm", "/demo"];
/* Routes where the bottom nav is REPLACED by a contextual FormActionBar */
const FORM_PATHS = ["/flight-details", "/item-details", "/from-address", "/to-address"];

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

/* Plus icon — universal primary-action language (Instagram / Twitter / TikTok pattern) */
const IconSendStatic = () => (
  <svg className="mbn-plus-static" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconSupport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4v5h-5" />
    <path d="M9 12h.01M12 12h.01M15 12h.01" />
  </svg>
);

const IconEarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9c-.6-1-1.6-1.5-2.7-1.5-1.6 0-2.8.9-2.8 2.2 0 1.2.9 1.8 2.8 2.3 2 .5 2.9 1.1 2.9 2.4 0 1.4-1.2 2.3-3 2.3-1.3 0-2.4-.5-3-1.5" />
    <path d="M12 5.5v1.5M12 17v1.5" />
  </svg>
);

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const phoneRef = useRef(null);

  const isHidden = HIDE_PATHS.some((p) => location.pathname.startsWith(p));
  const isFormPath = FORM_PATHS.some((p) => location.pathname.startsWith(p));

  /* ── Scroll-hide nav (LinkedIn / Blinkit pattern) ──
     Hides on scroll-down, shows on scroll-up. Mobile-only via media-query CSS.
     Adds body class `tx-nav-hidden` so landing FAB can sync position. */
  useEffect(() => {
    if (isHidden || isFormPath) return;
    const getY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    let lastY = getY();
    let rAF = null;
    const HIDE_DELTA = 8;
    const SHOW_DELTA = 4;
    const TOP_SAFE   = 80;

    const apply = () => {
      rAF = null;
      const y = getY();
      if (y < TOP_SAFE) {
        document.body.classList.remove("tx-nav-hidden");
      } else if (y > lastY + HIDE_DELTA) {
        document.body.classList.add("tx-nav-hidden");
      } else if (y < lastY - SHOW_DELTA) {
        document.body.classList.remove("tx-nav-hidden");
      }
      lastY = y;
    };
    const onScroll = () => {
      if (rAF != null) return;
      rAF = requestAnimationFrame(apply);
    };
    /* Listen with `capture: true` on document so we catch scroll regardless
       of which element actually scrolls (window vs documentElement vs body). */
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("scroll", onScroll);
      if (rAF != null) cancelAnimationFrame(rAF);
      document.body.classList.remove("tx-nav-hidden");
    };
  }, [isHidden, isFormPath, location.pathname]);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => phoneRef.current?.focus(), 240);
      return () => {
        document.body.style.overflow = "";
        clearTimeout(t);
      };
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  if (isHidden || isFormPath) return null;

  const isLogin = location.pathname === "/login" || location.pathname === "/";
  const isSupport = location.pathname.startsWith("/info");

  const goHome = () => {
    if (isLogin) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/login");
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    }
  };

  const focusHeroInput = () => {
    const input = document.querySelector(
      ".hero-form-wrap input:not([type='hidden']), .lp-hero input:not([type='hidden'])"
    );
    input?.focus({ preventScroll: true });
    const hero = document.querySelector(".lp-hero");
    if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSend = () => {
    if (!isLogin) {
      sessionStorage.setItem("openSendMode", "true");
      navigate("/login");
      return;
    }
    window.dispatchEvent(new CustomEvent("tx:openSendSheet"));
    focusHeroInput();
  };

  const goSupport = () => navigate("/info/help");
  const goEarn = () => {
    if (!isLogin) {
      sessionStorage.setItem("openEarnMode", "true");
      navigate("/login");
      return;
    }
    window.dispatchEvent(new CustomEvent("tx:openEarnSheet"));
    focusHeroInput();
  };
  const openTrack = () => {
    setPhone("");
    setTouched(false);
    setSheetOpen(true);
  };

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 10 && /^[6-9]/.test(phoneDigits);

  const submitTrack = async (e) => {
    e?.preventDefault();
    setTouched(true);
    if (!phoneValid || loading) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", phoneDigits));
      if (snap.exists()) {
        setSheetOpen(false);
        navigate("/dashboard", { state: { phoneNumber: phoneDigits } });
      } else {
        showToast("No order found for this number", "error");
      }
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Primary">
        <button
          className={`mbn-item${isLogin ? " active" : ""}`}
          onClick={goHome}
          aria-label="Home"
          aria-current={isLogin ? "page" : undefined}
        >
          <span className="mbn-icon"><IconHome /></span>
          <span className="mbn-label">Home</span>
          <span className="mbn-dot" />
        </button>

        <button
          className="mbn-item mbn-track"
          onClick={openTrack}
          aria-label="Track delivery"
          aria-haspopup="dialog"
        >
          <span className="mbn-icon"><IconTrack /></span>
          <span className="mbn-label">Track</span>
          <span className="mbn-dot" />
        </button>

        <button
          className="mbn-item mbn-center"
          onClick={goSend}
          aria-label="Send a document"
        >
          <span className="mbn-center-halo" aria-hidden />
          <span className="mbn-center-circle">
            <span className="mbn-center-sheen" aria-hidden />
            <span className="mbn-center-icon"><IconSendStatic /></span>
          </span>
          <span className="mbn-center-label">Send</span>
        </button>

        <button
          className={`mbn-item${isSupport ? " active" : ""}`}
          onClick={goSupport}
          aria-label="Support"
          aria-current={isSupport ? "page" : undefined}
        >
          <span className="mbn-icon"><IconSupport /></span>
          <span className="mbn-label">Support</span>
          <span className="mbn-dot" />
        </button>

        <button
          className="mbn-item mbn-earn"
          onClick={goEarn}
          aria-label="Become a Traveller and earn"
        >
          <span className="mbn-icon"><IconEarn /></span>
          <span className="mbn-label">Earn</span>
          <span className="mbn-earn-badge" aria-hidden>₹</span>
          <span className="mbn-dot" />
        </button>
      </nav>

      <div
        className={`mbn-sheet-backdrop${sheetOpen ? " open" : ""}`}
        onClick={() => !loading && setSheetOpen(false)}
        aria-hidden={!sheetOpen}
      />
      <div
        className={`mbn-sheet${sheetOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Track delivery"
        aria-hidden={!sheetOpen}
      >
        <span className="mbn-sheet-grab" aria-hidden />
        <header className="mbn-sheet-head">
          <h3 className="mbn-sheet-title">Track your delivery</h3>
          <p className="mbn-sheet-sub">Enter the phone number used at booking. We&apos;ll text you the live status.</p>
        </header>

        <form className="mbn-sheet-form" onSubmit={submitTrack} noValidate>
          <label className={`mbn-input-wrap${touched && !phoneValid ? " error" : ""}`}>
            <span className="mbn-input-prefix">+91</span>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onBlur={() => setTouched(true)}
              aria-label="Mobile number"
              aria-invalid={touched && !phoneValid}
            />
          </label>
          {touched && !phoneValid && (
            <p className="mbn-input-error">Enter a valid 10-digit Indian mobile number.</p>
          )}

          <button
            type="submit"
            className={`mbn-track-btn${phoneValid ? " ready" : ""}${loading ? " loading" : ""}`}
            disabled={!phoneValid || loading}
          >
            {loading ? (
              <>
                <span className="mbn-spin" aria-hidden />
                <span>Looking up&hellip;</span>
              </>
            ) : (
              <>
                <span>Track Now</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>

          <button
            type="button"
            className="mbn-sheet-cancel"
            onClick={() => !loading && setSheetOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </>
  );
}
