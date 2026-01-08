import React from "react";
import "./SenderWaitlist.css";

export default function SenderWaitlist() {
  return (
    <div className="waitlist-page">
      <div className="waitlist-card">
        <h2>✅ Thanks for sharing the details</h2>

        <p>
          We’re currently running a pilot for <strong>urgent document delivery</strong> via flight travellers.
        </p>

        <p>
          We’ll check if a suitable traveller is available for your route and timing.
        </p>

        <p>
          If a match comes up, we’ll reach out to you on <strong>WhatsApp</strong>.
        </p>

        <div className="waitlist-note">
          Please note: matches are subject to availability.
        </div>
      </div>
    </div>
  );
}
