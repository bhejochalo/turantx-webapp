import React, { useEffect, useState } from "react";
import "./TravelerWaitlist.css";
import logo from "../assets/turantx-logo.png";
import RequestTimeline from "./RequestTimeline";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function TravelerWaitlist() {
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = localStorage.getItem("PHONE_NUMBER");
    console.log("📞 TRAVELER PHONE:", phone);

    if (!phone) {
      setLoading(false);
      return;
    }

    // ✅ Correct Firestore path
    const travelerRef = doc(db, "users", phone, "Traveler", "details");
    console.log("🔥 Listening on:", travelerRef.path);

    const unsub = onSnapshot(travelerRef, (snap) => {
      console.log("📡 Traveler snapshot fired");

      if (!snap.exists()) {
        console.log("❌ Traveler details not found");
        setStatus("SEARCHING");
        setLoading(false);
        return;
      }

      const data = snap.data();
      console.log("📦 Traveler data:", data);

      setStatus(data.requestStatus || "SEARCHING");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getStep = () => {
    switch (status) {
      case "MATCH_FOUND":
        return 5; // We'll notify you on WhatsApp
      case "SEARCHING":
      default:
        return 4; // Searching for Match
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

        <h2>You’re Added to the Traveler Waitlist 🎉</h2>

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

        {status === "MATCH_FOUND" && (
          <>
            <p className="waitlist-text">
              🎉 <strong>Great news!</strong> A delivery request matches your
              route.
            </p>

            <p className="waitlist-subtext">
              Our team will contact you shortly on{" "}
              <strong>WhatsApp</strong>.
            </p>
          </>
        )}

        <RequestTimeline currentStep={getStep()} />
      </div>

      {/* FOOTER */}
      <footer className="app-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
