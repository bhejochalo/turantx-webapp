import { useState } from "react";
import { Link } from "react-router-dom";
import "./AppHeader.css";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false); // ✅ FIX HERE

  return (
    <>
      <header className="app-header">

        {/* DESKTOP NAV */}
        <nav className="nav-links desktop-only">
          <Link to="/info/about">About</Link>
          <Link to="/info/how-it-works">How it works</Link>
          <Link to="/info/help">Help</Link>
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
          <Link onClick={() => setMenuOpen(false)} to="/info/about">
            About Us
          </Link>
          <Link onClick={() => setMenuOpen(false)} to="/info/how-it-works">
            How it Works
          </Link>
          <Link onClick={() => setMenuOpen(false)} to="/info/help">
            Help & Support
          </Link>
          <Link onClick={() => setMenuOpen(false)} to="/info/privacy">
            Privacy Policy
          </Link>
        </div>
      )}
    </>
  );
}
