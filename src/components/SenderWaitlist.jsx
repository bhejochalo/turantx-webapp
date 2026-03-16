import React, { useEffect, useState } from "react";
import "./SenderWaitlist.css";
import RequestTimeline from "./RequestTimeline";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/turantx-logo.png";
import TrustStatusBox from "./TrustStatusBox";
import { generateInvoicePDF } from "../utils/invoiceGenerator";


export default function SenderWaitlist() {
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [opsReviewed, setOpsReviewed] = useState(false);
  const [trust, setTrust] = useState({});
  const [activeTab, setActiveTab] = useState("STATUS"); // ✅ NEW

  /* ---------------- HELPERS ---------------- */

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

  const getStep = () => {
    return STATUS_UI[status]?.step || 3;
  };

  /* ---------------- FIRESTORE ---------------- */

  useEffect(() => {
    const phone = localStorage.getItem("PHONE_NUMBER");
    if (!phone) {
      setLoading(false);
      return;
    }

    let unsub = null;

    const startListening = async () => {
      // Try requests subcollection first (new structure)
      const reqsSnap = await getDocs(collection(db, "users", phone, "SenderRequests"));
      let activeRef = null;

      if (!reqsSnap.empty) {
        const activeDoc = reqsSnap.docs.find((d) => d.data().LastMileStatus !== "Completed");
        if (activeDoc) {
          activeRef = doc(db, "users", phone, "SenderRequests", activeDoc.id);
        }
      }

      // Fallback to old details doc
      if (!activeRef) {
        activeRef = doc(db, "users", phone, "Sender", "details");
      }

      unsub = onSnapshot(activeRef, (snap) => {
        if (!snap.exists()) {
          setStatus("SEARCHING");
          setLoading(false);
          return;
        }

        const data = snap.data();

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
    };

    startListening();
    return () => { if (unsub) unsub(); };
  }, []);

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="waitlist-page">
        <div className="waitlist-card">
          <p>Loading your request status…</p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="waitlist-page">
      <div className="waitlist-card">
        <img src={logo} alt="TurantX" className="waitlist-logo" />

        <h2>✅ Thanks for sharing the details</h2>

        <p>
          We’re currently running a pilot for{" "}
          <strong>urgent document delivery</strong> via flight travellers.
        </p>

        {/* ---------- TABS ---------- */}
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

        {/* ---------- STATUS TAB ---------- */}
        {activeTab === "STATUS" && (
          <>
            {opsReviewed && (
              <div className="ops-badge">
                <span className="dot-green"></span>
                Reviewed by TurantX Operations
              </div>
            )}

            <div className="eta-card">
              ⏱️ Estimated matching time:{" "}
              <strong>{getETA(status, opsReviewed)}</strong>
            </div>

            {STATUS_UI[status] && (
              <div className="ops-banner">
                <span className="ops-icon">{STATUS_UI[status].icon}</span>
                <div className="ops-text">{STATUS_UI[status].text}</div>
              </div>
            )}

            <RequestTimeline currentStep={getStep()} />
          </>
        )}

        {/* ---------- REQUEST TAB ---------- */}
        {activeTab === "REQUEST" && summary && (
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

        {/* ---------- PAYMENT TAB ---------- */}
        {activeTab === "PAYMENT" && (
          <>
            <div className="refund-banner">
              <div className="refund-icon">🛡️</div>
              <div className="refund-text">
                <strong>Payment</strong>
                <p>
                  This is a pilot service — <b>no payment is taken</b> at this stage.
                </p>

              </div>
            </div>

            <div className="whatsapp-box">
              <div className="whatsapp-icon">💬</div>
              <div className="whatsapp-content">
                <strong>WhatsApp Confirmation</strong>
                <p>
                  We’ll contact you only from{" "}
                  <strong>TurantX Official WhatsApp Business</strong>.
                </p>
              </div>
            </div>
            <div className="invoice-card">
  <h4>Invoice & Receipt</h4>

  <p>
    Download your official TurantX payment receipt for records,
    reimbursements or compliance.
  </p>

  <button
    className="download-btn"
    onClick={() =>
      generateInvoicePDF({
        requestId: summary.requestId,
        phone: localStorage.getItem("PHONE_NUMBER"),
        fromCity: summary.fromCity,
        toCity: summary.toCity,
        item: summary.itemName,
        weight: summary.weight,
        delivery: summary.deliveryType,
        paymentId: "RAZORPAY_TXN_ID", // replace later dynamically
        amount: 0.00,
        createdAt: new Date().toISOString(),
      })
    }
  >
    ⬇️ Download Invoice (PDF)
  </button>
</div>
          </>
        )}

        {/* ---------- SAFETY TAB ---------- */}
        {activeTab === "SAFETY" && (
          <>
            <TrustStatusBox trust={trust} />

            <div className="verify-banner">
              <div className="verify-icon">🛡️</div>
              <div className="verify-text">
                <strong>Verified Travelers Only</strong>
                <p>
                  Every traveler is manually verified using{" "}
                  <b>PAN, government ID & flight details</b>.
                </p>
              </div>
            </div>

          </>
        )}

        <p>
          For any queries, use the <strong>Help & Support</strong> button at the
          bottom right. We usually respond within an hour.
        </p>

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
