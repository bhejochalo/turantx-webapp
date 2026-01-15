import React from "react";
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
            <a>About Us</a>
            <a>How It Works</a>
            <a>Why TurantX</a>
          </div>

          <div>
            <span>Support</span>
            <a>Help & Support</a>
            <a>Contact Us</a>
            <a>Safety & Trust</a>
          </div>

          <div>
            <span>Legal</span>
            <a>Terms & Conditions</a>
            <a>Privacy Policy</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd. All rights reserved.
      </div>
    </footer>
  );
}
