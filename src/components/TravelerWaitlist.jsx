import React, { useEffect, useState } from "react";
import "./TravelerWaitlist.css";
import logo from "../assets/turantx-logo.png";
import RequestTimeline from "./RequestTimeline";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function TravelerWaitlist() {
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [opsReviewed, setOpsReviewed] = useState(false);

  useEffect(() => {
    const phone = localStorage.getItem("PHONE_NUMBER");
    if (!phone) {
      setLoading(false);
      return;
    }

    let unsub = null;

    const startListening = async () => {
      // Try requests subcollection first (new structure)
      const reqsSnap = await getDocs(collection(db, "users", phone, "TravelerRequests"));
      let activeRef = null;

      if (!reqsSnap.empty) {
        const activeDoc = reqsSnap.docs.find((d) => d.data().LastMileStatus !== "Completed");
        if (activeDoc) {
          activeRef = doc(db, "users", phone, "TravelerRequests", activeDoc.id);
        }
      }

      // Fallback to old details doc
      if (!activeRef) {
        activeRef = doc(db, "users", phone, "Traveler", "details");
      }

      unsub = onSnapshot(activeRef, (snap) => {
        if (!snap.exists()) {
          setStatus("SEARCHING");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setStatus(data.requestStatus || "SEARCHING");
        setOpsReviewed(!!data.opsReviewed);
        setLoading(false);
      });
    };

    startListening();
    return () => { if (unsub) unsub(); };
  }, []);

  const getStep = () => {
    switch (status) {
      case "MATCH_FOUND":
        return 5;
      case "SEARCHING":
      default:
        return 4;
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

        <h2>You’re Added to the Traveller Waitlist 🎉</h2>

        {status === "SEARCHING" && (
          <>
            <p className="waitlist-text">
              We’ll notify you on <strong>WhatsApp</strong> when a suitable
              delivery request matches your route.
            </p>

            <p className="waitlist-subtext">
              There is <strong>no obligation</strong> to accept any request.
              You’re always in control.
            </p>
          </>
        )}

        {opsReviewed && (
          <div className="ops-badge">
            <span className="dot-green"></span>
            Reviewed by TurantX Operations
          </div>
        )}

        {status === "MATCH_FOUND" && (
          <>
            <p className="waitlist-text">
              🎉 <strong>Great news!</strong> A delivery request matches your
              route.
              You're added to the traveller waitlist. we'll notify you on whatsapp if a suitable request comes up. no obligation to accept
            </p>

            <p className="waitlist-subtext">
              Our team will contact you shortly on{" "}
              <strong>WhatsApp</strong>.
            </p>
          </>
        )}

        <RequestTimeline currentStep={getStep()} />

        <div className="whatsapp-banner">
          <div className="wa-icon">✔️</div>

          <div className="wa-text">
            <strong>Official WhatsApp Only</strong>
            <p>
              We will contact you <b>only</b> from TurantX’s verified
              WhatsApp Business account.
              <br />
              Please ignore messages from personal numbers.
            </p>
          </div>
        </div>

        <div className="verify-banner">
          <div className="verify-icon">🛡️</div>

          <div className="verify-text">
            <strong>Verified Travellers Only</strong>
            <p>
              Every traveller on TurantX is manually verified using
              <b> PAN, government ID and flight details</b>.
              <br />
              No unverified traveller is allowed on the platform.
            </p>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
