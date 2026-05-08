import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AppFooter.css";

export default function AppFooter() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Landing page: full footer always visible (mobile + desktop).
  // Other pages: full footer on desktop; on mobile collapse behind a "Know more" toggle.
  const isLanding =
    location.pathname === "/login" || location.pathname === "/";

  const fullFooter = (
    <>
      {/* Top hairline gradient — subtle premium edge */}
      <div className="footer-edge" aria-hidden></div>

      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-brand-mark">
            Turant<span className="footer-brand-x">X</span>
          </div>
          <p className="footer-brand-legal">TurantX Solutions Pvt Ltd</p>
          <p className="footer-brand-desc">
            A trusted peer-to-peer delivery network connecting senders with
            verified flight travellers — fast, secure, and human-reviewed.
          </p>

          <ul className="footer-stats" aria-label="Network at a glance">
            <li className="footer-stat">
              <span className="footer-stat-value">5</span>
              <span className="footer-stat-label">cities live</span>
            </li>
            <li className="footer-stat">
              <span className="footer-stat-value">1,200<span className="footer-stat-plus">+</span></span>
              <span className="footer-stat-label">deliveries</span>
            </li>
            <li className="footer-stat">
              <span className="footer-stat-value">100<span className="footer-stat-plus">%</span></span>
              <span className="footer-stat-label">PNR verified</span>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <span className="footer-col-title">Company</span>
            <Link to="/info/about">About Us</Link>
            <Link to="/info/how-it-works">How It Works</Link>
            <Link to="/info/why-turantx">Why TurantX</Link>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Support</span>
            <Link to="/info/help">Help &amp; Support</Link>
            <Link to="/info/contact">Contact Us</Link>
            <Link to="/info/safety">Safety &amp; Trust</Link>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Legal</span>
            <Link to="/info/terms">Terms &amp; Conditions</Link>
            <Link to="/info/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="footer-divider" aria-hidden></div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <span className="footer-status" aria-label="System status">
            <span className="footer-status-dot" aria-hidden></span>
            All systems operational
          </span>
        </div>
        <div className="footer-bottom-center">
          © {new Date().getFullYear()} TurantX Solutions Pvt Ltd. All rights reserved.
        </div>
        <div className="footer-bottom-right">
          <span className="footer-made">
            Crafted in
            <svg viewBox="0 0 24 16" className="footer-flag" aria-hidden>
              <rect width="24" height="5.33" y="0"     fill="#FF9933"/>
              <rect width="24" height="5.33" y="5.33"  fill="#ffffff"/>
              <rect width="24" height="5.33" y="10.66" fill="#138808"/>
              <circle cx="12" cy="8" r="1.4" fill="none" stroke="#000080" strokeWidth="0.5"/>
            </svg>
            India
          </span>
        </div>
      </div>
    </>
  );

  return (
    <footer
      className={`app-footer${isLanding ? " app-footer--landing" : " app-footer--collapsible"}${open ? " is-open" : ""}`}
    >
      {/* Mobile minimal chevron toggle — hint that more lies below */}
      <button
        type="button"
        className="footer-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="footer-content"
        aria-label={open ? "Hide footer details" : "Show footer details"}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="footer-toggle-chevron"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div id="footer-content" className="footer-content">
        {fullFooter}
      </div>
    </footer>
  );
}
