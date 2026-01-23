import { Outlet, Link } from "react-router-dom";
import AppFooter from "../components/AppFooter";
import "./InfoLayout.css";

export default function InfoLayout() {
  return (
    <div className="info-shell">
      {/* TOP BAR */}
      <header className="info-header">
        <div className="brand">turant<span>X</span></div>

        <nav className="desktop-nav">
          <Link to="/info/about">About</Link>
          <Link to="/info/privacy">Privacy</Link>
          <Link to="/info/terms">Terms</Link>
        </nav>

        {/* HAMBURGER */}
        <input type="checkbox" id="menu-toggle" />
        <label htmlFor="menu-toggle" className="hamburger">☰</label>

        <div className="mobile-menu">
          <Link to="/info/about">About</Link>
          <Link to="/info/privacy">Privacy</Link>
          <Link to="/info/terms">Terms</Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="info-content">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}
