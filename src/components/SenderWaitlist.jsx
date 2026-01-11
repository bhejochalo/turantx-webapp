import React, { useEffect, useState } from "react";
import "./SenderWaitlist.css";
import RequestTimeline from "./RequestTimeline";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/turantx-logo.png";


export default function SenderWaitlist() {
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    const phone = localStorage.getItem("PHONE_NUMBER");
    console.log("📞 PHONE:", phone);
  
    if (!phone) {
      setLoading(false);
      return;
    }
  
    // ✅ CORRECT PATH (capital S)
    const detailsRef = doc(db, "users", phone, "Sender", "details");
    console.log("🔥 Listening on:", detailsRef.path);
  
    const unsub = onSnapshot(detailsRef, (snap) => {
      console.log("📡 SNAPSHOT FIRED");
  
      if (!snap.exists()) {
        console.log("❌ DETAILS DOC NOT FOUND");
        setStatus("SEARCHING");
        setLoading(false);
        return;
      }
  
      const data = snap.data();
      console.log("📦 DETAILS DATA:", data);
  
      setStatus(data.requestStatus || "SEARCHING");
      setSummary({
        requestId: data.uniqueKey,
        fromCity: data.from?.city,
        toCity: data.to?.city,
        itemName: data.itemDetails?.itemName,
        weight: data.itemDetails?.totalWeight,
        deliveryType:
          data.itemDetails?.deliveryOption === "SELF_DROP_PICK"
            ? "Self Drop & Pick"
            : "Auto Drop & Pick",
      });
      setLoading(false);
    });
  
    return () => unsub();
  }, []);
  

  const getStep = () => {
    switch (status) {
      case "SEARCHING":
        return 4; // Searching for Match
      case "MATCH_FOUND":
        return 5; // We'll notify on WhatsApp
      default:
        return 3; // Added to Waitlist
    }
  };
  

  if (loading) {
    return (
      <div className="waitlist-page">
        <div className="waitlist-card">
          <p>Loading your request status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="waitlist-page">
      <div className="waitlist-card">
      <img src={logo} alt="TurantX" className="waitlist-logo" />
        <h2>✅ Thanks for sharing the details</h2>

        <p>
          We’re currently running a pilot for{" "}
          <strong>urgent document delivery</strong> via flight travellers.
        </p>
        {summary && (
  <div className="request-summary-card">
    <div className="summary-row">
      <span className="label">Request ID</span>
      <span className="value">TX-{summary.requestId}</span>
    </div>

    <div className="summary-row">
      <span className="label">Route</span>
      <span className="value">
        {summary.fromCity} → {summary.toCity}
      </span>
    </div>

    <div className="summary-row">
      <span className="label">Item</span>
      <span className="value">{summary.itemName}</span>
    </div>

    <div className="summary-row">
      <span className="label">Weight</span>
      <span className="value">{summary.weight}</span>
    </div>

    <div className="summary-row">
      <span className="label">Delivery</span>
      <span className="value">{summary.deliveryType}</span>
    </div>
  </div>
)}

        {status === "SEARCHING" && (
          <>
            <p>
              We’re checking if a suitable traveller is available for your route
              and timing.
            </p>
            <p>
              If a match comes up, we’ll reach out to you on{" "}
              <strong>WhatsApp</strong>.
            </p>
          </>
        )}

        {status === "MATCH_FOUND" && (
          <>
            <p>
              🎉 <strong>Good news!</strong> We’ve found a suitable traveller
              for your request.
            </p>
            <p>
              Our team will contact you shortly on{" "}
              <strong>WhatsApp</strong> to proceed.
            </p>
          </>
        )}

        <p>
          For any queries, use the <strong>Help & Support</strong> button at the
          bottom right. We usually respond within an hour.
        </p>

        <RequestTimeline currentStep={getStep()} />

        <div className="waitlist-note">
          Please note: matches are subject to availability.
        </div>
      </div>

      {/* FOOTER */}
      <footer className="app-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
