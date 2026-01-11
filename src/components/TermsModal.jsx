import React, { useEffect, useRef, useState } from "react";
import "./TermsModal.css";

export default function TermsModal({ onAccept, onClose }) {
  const scrollRef = useRef(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const reachedBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      if (reachedBottom) setScrolledToEnd(true);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="terms-overlay">
      <div className="terms-modal">
        <header className="terms-header">
          <h3>TurantX Terms & Trust Promise</h3>
        </header>

        <div className="terms-content" ref={scrollRef}>
          <h4>What TurantX Does</h4>
          <p>
            TurantX connects senders with verified flight travelers for urgent,
            hand-carried deliveries. We are not a courier company and do not
            transport items ourselves.
          </p>

          <h4>Traveler Verification</h4>
          <ul>
            <li>PAN & Government ID verified</li>
            <li>Flight details manually reviewed</li>
            <li>Repeat offenders permanently banned</li>
          </ul>

          <h4>What You Can Send</h4>
          <ul>
            <li>Documents & legal papers</li>
            <li>No illegal, restricted or dangerous items</li>
            <li>No cash, gold, drugs, weapons</li>
          </ul>

          <h4>Payments & Refunds</h4>
          <p>
            Payments cover verification & coordination costs.  
            If no suitable traveler is found within <b>24 hours</b>, your
            payment is <b>automatically refunded</b>.
          </p>

          <h4>Liability</h4>
          <p>
            TurantX acts only as a facilitator. Final responsibility of items
            lies between sender and traveler.
          </p>

          <p style={{ marginTop: 24 }}>
            By continuing, you confirm that you have read and understood these
            terms fully.
          </p>
        </div>

        <footer className="terms-footer">
          <label className={`terms-check ${scrolledToEnd ? "" : "disabled"}`}>
            <input
              type="checkbox"
              disabled={!scrolledToEnd}
              onChange={onAccept}
            />
            I have read and agree to the Terms
          </label>

          <div className="terms-actions">
            <button className="secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
