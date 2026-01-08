import React from "react";
import "./TravelerWaitlist.css";
import logo from "../assets/turantx-logo.png";

export default function TravelerWaitlist() {
  return (
    <div className="waitlist-page">
      <div className="waitlist-card">
        <img src={logo} alt="TurantX" className="waitlist-logo" />

        <h2>You’re Added to the Traveler Waitlist 🎉</h2>

        <p className="waitlist-text">
          We’ll notify you on <strong>WhatsApp</strong> when a suitable delivery
          request matches your route.
        </p>

        <p className="waitlist-subtext">
          There is <strong>no obligation</strong> to accept any request.
          You’re always in control.
        </p>

        <div className="waitlist-badge">
          ⏳ Waiting for a match
        </div>
      </div>

      {/* ✅ FOOTER */}
      <footer className="app-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
