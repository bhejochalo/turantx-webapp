import { Link } from "react-router-dom";
import "./AppFooter.css";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h4>TurantX Solutions Pvt Ltd</h4>
          <p>
            TurantX is a trusted peer-to-peer delivery platform that connects
            senders with verified travelers for fast, secure & reliable
            deliveries.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <span>Company</span>
            <Link to="/info/about">About Us</Link>
            <Link to="/info/how-it-works">How It Works</Link>
            <Link to="/info/why-turantx">Why TurantX</Link>
          </div>

          <div>
            <span>Support</span>
            <Link to="/info/help">Help & Support</Link>
            <Link to="/info/contact">Contact Us</Link>
            <Link to="/info/safety">Safety & Trust</Link>
          </div>

          <div>
            <span>Legal</span>
            <Link to="/info/terms">Terms & Conditions</Link>
            <Link to="/info/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd. All rights reserved.
      </div>
    </footer>
  );
}
