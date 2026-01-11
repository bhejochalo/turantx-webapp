import React, { useEffect, useState } from "react";
import "./SenderWaitlist.css";
import RequestTimeline from "./RequestTimeline";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/turantx-logo.png";
import TrustStatusBox from "./TrustStatusBox";


export default function SenderWaitlist() {
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [opsReviewed, setOpsReviewed] = useState(false);
  const [trust, setTrust] = useState({});
  const [activeTab, setActiveTab] = useState("STATUS");


  const getETA = (status, opsReviewed) => {
    if (status === "MATCH_FOUND") return "Matched";
    if (opsReviewed) return "1–3 hours";
    return "2–6 hours";
  };
  const STATUS_UI = {
    SEARCHING: {
      text: "Our operations team is checking for matching travelers",
      icon: "🔄",
      step: 4,
    },
    SHORTLISTED: {
      text: "A suitable traveler has been shortlisted",
      icon: "🧩",
      step: 4,
    },
    MATCH_FOUND: {
      text: "Match confirmed. We’ll contact you shortly on WhatsApp",
      icon: "🎉",
      step: 5,
    },
  };
  

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
      setTrust(data.trustStatus || {});
      setOpsReviewed(!!data.opsReviewed);
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
    return STATUS_UI[status]?.step || 3;
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
      <div className="tabs">
  <button
    className={activeTab === "STATUS" ? "tab active" : "tab"}
    onClick={() => setActiveTab("STATUS")}
  >
    Status
  </button>

  <button
    className={activeTab === "REQUEST" ? "tab active" : "tab"}
    onClick={() => setActiveTab("REQUEST")}
  >
    Request
  </button>

  <button
    className={activeTab === "PAYMENT" ? "tab active" : "tab"}
    onClick={() => setActiveTab("PAYMENT")}
  >
    Payment
  </button>

  <button
    className={activeTab === "SAFETY" ? "tab active" : "tab"}
    onClick={() => setActiveTab("SAFETY")}
  >
    Safety
  </button>
</div>

        <h2>✅ Thanks for sharing the details</h2>

        <p>
          We’re currently running a pilot for{" "}
          <strong>urgent document delivery</strong> via flight travellers.
        </p>
        {opsReviewed && (
  <div className="ops-badge">
    <span className="dot-green"></span>
    Reviewed by TurantX Operations
  </div>
)}

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
        <div className="eta-card">
  ⏱️ Estimated matching time:{" "}
  <strong>{getETA(status, opsReviewed)}</strong>
</div>

<div className="refund-banner">
  <div className="refund-icon">🛡️</div>

  <div className="refund-text">
    <strong>Refund Guarantee</strong>
    <p>
      If no suitable traveller is found within <b>24 hours</b>,
      your payment will be <b>automatically refunded</b>.
    </p>
  </div>
</div>
<div className="whatsapp-box">
  <div className="whatsapp-icon">💬</div>

  <div className="whatsapp-content">
    <strong>Next Step: WhatsApp Verification</strong>

    <p>
      Our team will contact you via
      <strong> TurantX Official WhatsApp Business</strong>
      <br />
      <span className="time">
        Expected response: within 1–2 hours
      </span>
    </p>

    <p className="note">
      Please do not message random numbers claiming to be TurantX.
      We will always reach out from our verified business account.
    </p>
  </div>
</div>

<div className="verify-banner">
  <div className="verify-icon">🛡️</div>

  <div className="verify-text">
    <strong>Verified Travelers Only</strong>
    <p>
      Every traveler on TurantX is manually verified using
      <b> PAN, government ID and flight details</b>.
      <br />
      No unverified traveler is allowed on the platform.
    </p>
  </div>
</div>

        <p>
          For any queries, use the <strong>Help & Support</strong> button at the
          bottom right. We usually respond within an hour.
        </p>
        {STATUS_UI[status] && (
  <div className="ops-banner">
    <span className="ops-icon">
      {STATUS_UI[status].icon}
    </span>

    <div className="ops-text">
      {STATUS_UI[status].text}
    </div>
  </div>
)}

        <RequestTimeline currentStep={getStep()} />
        <TrustStatusBox trust={trust} />

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
