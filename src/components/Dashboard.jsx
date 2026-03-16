import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import logo from "../assets/turantx-logo.png";
import Loader from "./Loader";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS = {
  SEARCHING: "Searching for match",
  SHORTLISTED: "Traveler shortlisted",
  MATCH_FOUND: "Match found",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [activeBooking, setActiveBooking] = useState(null);
  const [pastBookings, setPastBookings] = useState([]);

  useEffect(() => {
    const storedPhone = localStorage.getItem("PHONE_NUMBER");
    if (!storedPhone) {
      navigate("/login");
      return;
    }
    setPhone(storedPhone);
    loadBookings(storedPhone);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async (ph) => {
    try {
      const past = [];
      let active = null;

      // --- Traveler ---
      const travelerReqsSnap = await getDocs(collection(db, "users", ph, "TravelerRequests"));
      if (!travelerReqsSnap.empty) {
        // Sort by createdAt if available, newest first
        const docs = travelerReqsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.forEach((d) => {
          const entry = { role: "TRAVELER", from: d.from?.city || "—", to: d.to?.city || "—", requestStatus: d.requestStatus || "SEARCHING", lastMileStatus: d.LastMileStatus || "Not started" };
          if (d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        });
      } else {
        // Fallback to old details doc
        const travelerDetailsSnap = await getDoc(doc(db, "users", ph, "Traveler", "details"));
        if (travelerDetailsSnap.exists()) {
          const d = travelerDetailsSnap.data();
          const entry = { role: "TRAVELER", from: d.from?.city || "—", to: d.to?.city || "—", requestStatus: d.requestStatus || "SEARCHING", lastMileStatus: d.LastMileStatus || "Not started" };
          if (d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        }
      }

      // --- Sender ---
      const senderReqsSnap = await getDocs(collection(db, "users", ph, "SenderRequests"));
      if (!senderReqsSnap.empty) {
        const docs = senderReqsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.forEach((d) => {
          const entry = { role: "SENDER", from: d.from?.city || "—", to: d.to?.city || "—", requestStatus: d.requestStatus || "SEARCHING", lastMileStatus: d.LastMileStatus || "Not started" };
          if (d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        });
      } else {
        // Fallback to old details doc
        const senderDetailsSnap = await getDoc(doc(db, "users", ph, "Sender", "details"));
        if (senderDetailsSnap.exists()) {
          const d = senderDetailsSnap.data();
          const entry = { role: "SENDER", from: d.from?.city || "—", to: d.to?.city || "—", requestStatus: d.requestStatus || "SEARCHING", lastMileStatus: d.LastMileStatus || "Not started" };
          if (d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        }
      }

      setActiveBooking(active);
      setPastBookings(past);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPhone = () => phone || localStorage.getItem("PHONE_NUMBER") || "";

  const goToWaitlist = (booking) => {
    const path = booking.role === "TRAVELER" ? "/traveler-waitlist" : "/sender-waitlist";
    navigate(path, { state: { phoneNumber: getPhone() } });
  };

  if (loading) return <Loader />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">

        {/* HEADER */}
        <div className="dash-header">
          <img src={logo} alt="TurantX" />
          <div>
            <h2>Welcome back</h2>
            <p className="dash-phone">+91 {phone}</p>
          </div>
        </div>

        {/* ACTIVE BOOKING */}
        {activeBooking && (
          <div className="dash-active-card">
            <div className="dash-active-label">
              {activeBooking.role === "TRAVELER" ? "✈ Active — Traveler" : "📦 Active — Sender"}
            </div>
            <div className="dash-route">
              {activeBooking.from} → {activeBooking.to}
            </div>
            <div className="dash-status-badge">
              {STATUS_LABELS[activeBooking.requestStatus] || activeBooking.requestStatus}
            </div>
            <button className="dash-view-btn" onClick={() => goToWaitlist(activeBooking)}>
              View Status
            </button>
          </div>
        )}

        <hr className="dash-divider" />

        {/* START NEW REQUEST */}
        <div className="dash-new-section">
          <p>
            {activeBooking
              ? "Want to make another booking?"
              : "Your last delivery is complete. Ready for another one?"}
          </p>
          <button
            className="dash-cta-btn"
            onClick={() => navigate("/selection", { state: { phoneNumber: getPhone() } })}
          >
            + Start New Request
          </button>
        </div>

        {/* PAST BOOKINGS */}
        {pastBookings.length > 0 && (
          <div className="dash-past-section">
            <h4 className="dash-section-title">Past Deliveries</h4>
            {pastBookings.map((b, i) => (
              <div key={i} className="dash-past-card">
                <span className="dash-past-role">
                  {b.role === "TRAVELER" ? "✈ Traveler" : "📦 Sender"}
                </span>
                <span className="dash-past-route">{b.from} → {b.to}</span>
                <span className="dash-past-status">Completed</span>
              </div>
            ))}
          </div>
        )}

        <p className="dash-footer-note">
          For queries, use the Help & Support button below.
        </p>
      </div>

      <footer className="dash-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
