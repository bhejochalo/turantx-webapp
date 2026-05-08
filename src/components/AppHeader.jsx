import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { showToast } from "./Toast";
import "./AppHeader.css";
import logo from "../assets/turantx-logo.png";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("PHONE_NUMBER");
  const isDark = location.pathname === "/login" || location.pathname === "/";

  useEffect(() => {
    setOverDark(true);

    if (isDark) {
      // Use IntersectionObserver so GSAP-animated pages are handled correctly
      const tryObserve = () => {
        const darkSection = document.querySelector('[data-theme="dark"]');
        if (!darkSection) {
          // Fallback: scroll-based
          const onScroll = () => setOverDark(window.scrollY < 60);
          window.addEventListener("scroll", onScroll, { passive: true });
          return () => window.removeEventListener("scroll", onScroll);
        }
        const obs = new IntersectionObserver(
          ([entry]) => setOverDark(entry.isIntersecting),
          { rootMargin: "-64px 0px 0px 0px", threshold: 0.05 }
        );
        obs.observe(darkSection);
        return () => obs.disconnect();
      };

      // Give GSAP / React a tick to mount the dark section
      const tid = setTimeout(() => {
        const cleanup = tryObserve();
        // Store cleanup fn on a ref-like object so we can call it on unmount
        AppHeader._cleanup = cleanup;
      }, 50);

      return () => {
        clearTimeout(tid);
        AppHeader._cleanup?.();
      };
    } else {
      // Non-dark pages: simple scroll detection for any subtle sticky effects
      const onScroll = () => setOverDark(false);
      setOverDark(false);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [isDark, location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const handleBookNow = () => {
    if (location.pathname === "/login" || location.pathname === "/") {
      document.querySelector(".lp-hero")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/login");
    }
  };

  const handleTrackOrder = async () => {
    const cleaned = trackPhone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      showToast("Enter a valid 10-digit mobile number", "warning");
      return;
    }
    setTrackLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", cleaned));
      if (snap.exists()) {
        setTrackOpen(false);
        setTrackPhone("");
        navigate("/dashboard", { state: { phoneNumber: cleaned } });
      } else {
        showToast("No order found for this number", "error");
      }
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setTrackLoading(false);
    }
  };

  const isTransparent = isDark && overDark;

  return (
    <>
      <header className={`app-header${isTransparent ? " app-header--dark" : " app-header--scrolled"}`}>
        <Link to="/login" className="header-logo">
          <img
            src={logo}
            alt="TurantX"
            className={isTransparent ? "logo-on-dark" : ""}
          />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="nav-links desktop-only">
          <Link to="/info/about">About</Link>
          <Link to="/demo">How it works</Link>
          <Link to="/info/help">Help</Link>
          <button className="nav-track-btn" onClick={() => setTrackOpen(true)}>Track</button>
          {isLoggedIn && (
            <button className="logout-link" onClick={handleLogout}>Logout</button>
          )}
          <button
            className={`header-book-btn${isTransparent ? " header-book-btn--hidden" : ""}`}
            onClick={handleBookNow}
            aria-hidden={isTransparent}
          >Book Now</button>
        </nav>

        {/* MOBILE HAMBURGER */}
        <button
          className="hamburger mobile-only"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link onClick={() => setMenuOpen(false)} to="/info/about">About Us</Link>
          <Link onClick={() => setMenuOpen(false)} to="/demo">How it Works</Link>
          <Link onClick={() => setMenuOpen(false)} to="/info/help">Help & Support</Link>
          <button
            className="mobile-track-btn"
            onClick={() => { setMenuOpen(false); setTrackOpen(true); }}
          >
            Track Order
          </button>
          <Link onClick={() => setMenuOpen(false)} to="/info/privacy">Privacy Policy</Link>
          {isLoggedIn && (
            <button className="mobile-logout-btn" onClick={handleLogout}>Logout</button>
          )}
        </div>
      )}

      {/* TRACK ORDER MODAL */}
      {trackOpen && (
        <div className="track-modal-overlay" onClick={() => setTrackOpen(false)}>
          <div className="track-modal" onClick={(e) => e.stopPropagation()}>
            <button className="track-modal-close" onClick={() => setTrackOpen(false)}>✕</button>
            <span className="track-modal-ping" />
            <h3 className="track-modal-title">Track your order</h3>
            <p className="track-modal-sub">Enter the mobile number used while booking</p>
            <div className="track-modal-input-row">
              <input
                className="track-modal-input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                autoFocus
              />
              <button
                className={`track-modal-btn${trackPhone.length === 10 ? " ready" : ""}`}
                onClick={handleTrackOrder}
                disabled={trackPhone.length !== 10 || trackLoading}
              >
                {trackLoading ? "…" : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

AppHeader._cleanup = null;
