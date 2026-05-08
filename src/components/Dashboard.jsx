import { useEffect, useState } from "react";
import "./Dashboard.css";
import "./FlightDetails.css"; /* for .fd-btn family */
import Loader from "./Loader";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

/* ── Inline SVG icon set (matches fd-* design system) ── */
const Icon = {
  plane: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  arrowSlim: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    </svg>
  ),
};

const STATUS_LABELS = {
  NEW_ORDER: "Request received",
  SEARCHING: "Searching for match",
  MATCHED: "Match confirmed",
  IN_PROGRESS: "Item in transit",
  COMPLETED: "Delivered",
};

const STATUS_PILL_VARIANT = {
  MATCHED: "is-matched",
  IN_PROGRESS: "is-progress",
  COMPLETED: "",
};

/* ── Extract a usable display name from a request doc ── */
const nameFromDoc = (d, role) => {
  if (role === "TRAVELER") {
    const fn = (d.flightDetails?.firstName || "").trim();
    const ln = (d.flightDetails?.lastName || "").trim();
    const full = `${fn} ${ln}`.trim();
    return { full, first: fn || full.split(" ")[0] || "" };
  }
  const full = (d.itemDetails?.senderName || "").trim();
  return { full, first: full.split(" ")[0] || "" };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [userName, setUserName] = useState({ full: "", first: "" });
  const [activeBooking, setActiveBooking] = useState(null);
  const [pastBookings, setPastBookings] = useState([]);

  useEffect(() => {
    const storedPhone =
      localStorage.getItem("PHONE_NUMBER") || location.state?.phoneNumber;
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
      let nameCandidate = { full: "", first: "" };
      const noteName = (d, role) => {
        if (nameCandidate.full) return;
        const n = nameFromDoc(d, role);
        if (n.full) nameCandidate = n;
      };

      // --- Traveler ---
      const travelerReqsSnap = await getDocs(collection(db, "users", ph, "TravelerRequests"));
      if (!travelerReqsSnap.empty) {
        const docs = travelerReqsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.forEach((d) => {
          noteName(d, "TRAVELER");
          const entry = {
            role: "TRAVELER",
            from: d.from?.city || "—",
            to: d.to?.city || "—",
            status: d.status || (d.requestStatus === "MATCH_FOUND" ? "MATCHED" : d.requestStatus) || "NEW_ORDER",
          };
          if (d.status === "COMPLETED" || d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        });
      } else {
        const travelerDetailsSnap = await getDoc(doc(db, "users", ph, "Traveler", "details"));
        if (travelerDetailsSnap.exists()) {
          const d = travelerDetailsSnap.data();
          noteName(d, "TRAVELER");
          const entry = {
            role: "TRAVELER",
            from: d.from?.city || "—",
            to: d.to?.city || "—",
            status: d.status || (d.requestStatus === "MATCH_FOUND" ? "MATCHED" : d.requestStatus) || "NEW_ORDER",
          };
          if (d.status === "COMPLETED" || d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        }
      }

      // --- Sender ---
      const senderReqsSnap = await getDocs(collection(db, "users", ph, "SenderRequests"));
      if (!senderReqsSnap.empty) {
        const docs = senderReqsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.forEach((d) => {
          noteName(d, "SENDER");
          const entry = {
            role: "SENDER",
            from: d.from?.city || "—",
            to: d.to?.city || "—",
            status: d.status || (d.requestStatus === "MATCH_FOUND" ? "MATCHED" : d.requestStatus) || "NEW_ORDER",
          };
          if (d.status === "COMPLETED" || d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        });
      } else {
        const senderDetailsSnap = await getDoc(doc(db, "users", ph, "Sender", "details"));
        if (senderDetailsSnap.exists()) {
          const d = senderDetailsSnap.data();
          noteName(d, "SENDER");
          const entry = {
            role: "SENDER",
            from: d.from?.city || "—",
            to: d.to?.city || "—",
            status: d.status || (d.requestStatus === "MATCH_FOUND" ? "MATCHED" : d.requestStatus) || "NEW_ORDER",
          };
          if (d.status === "COMPLETED" || d.LastMileStatus === "Completed") past.push(entry);
          else if (!active) active = entry;
        }
      }

      setUserName(nameCandidate);
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
    navigate(path, { state: { phoneNumber: getPhone(), role: booking.role } });
  };

  const avatarInitial =
    (userName.first || userName.full || "").trim().charAt(0) ||
    (phone || "").trim().slice(-2, -1) ||
    "T";
  const greeting = userName.first
    ? `Welcome back, ${userName.first}`
    : "Welcome back";

  if (loading) return <Loader />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">

        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-avatar" aria-hidden>{avatarInitial.toUpperCase()}</div>
          <div className="dash-header-text">
            <h2 className="dash-greeting" title={userName.full || undefined}>{greeting}</h2>
            <p className="dash-phone">+91 {phone}</p>
          </div>
        </div>

        {/* ACTIVE BOOKING */}
        {activeBooking && (
          <div className="dash-section">
            <h4 className="dash-section-title">Active delivery</h4>
            <div className="dash-active-card">
              <div className="dash-active-head">
                <span className="dash-active-badge">
                  <span className="dash-active-badge-icon" aria-hidden>
                    {activeBooking.role === "TRAVELER" ? Icon.plane : Icon.package}
                  </span>
                  {activeBooking.role === "TRAVELER" ? "Traveller" : "Sender"}
                </span>
                <span className={`dash-status-pill ${STATUS_PILL_VARIANT[activeBooking.status] || ""}`}>
                  <span className="dash-status-pill-dot" aria-hidden></span>
                  {STATUS_LABELS[activeBooking.status] || activeBooking.status}
                </span>
              </div>

              <div className="dash-route">
                <span>{activeBooking.from}</span>
                <span className="dash-route-arrow" aria-hidden>{Icon.arrowSlim}</span>
                <span>{activeBooking.to}</span>
              </div>

              <button
                type="button"
                className="fd-btn fd-btn--primary fd-btn--block"
                onClick={() => goToWaitlist(activeBooking)}
              >
                View status
                <span className="fd-btn-icon" aria-hidden>{Icon.arrowRight}</span>
              </button>
            </div>
          </div>
        )}

        {/* NEW REQUEST — only when no active order */}
        {!activeBooking && (
          <div className="dash-new-section">
            <div className="dash-new-icon" aria-hidden>{Icon.sparkle}</div>
            <h3>Ready for another delivery?</h3>
            <p>Your last delivery is complete. Start a new request in under a minute.</p>
            <button
              type="button"
              className="fd-btn fd-btn--primary fd-btn--block"
              onClick={() => navigate("/login")}
              style={{ maxWidth: 360 }}
            >
              <span className="fd-btn-icon" aria-hidden>{Icon.plus}</span>
              Start new request
            </button>
          </div>
        )}

        {/* PAST BOOKINGS */}
        {pastBookings.length > 0 && (
          <div className="dash-section">
            <h4 className="dash-section-title">Past deliveries</h4>
            <div className="dash-past-list">
              {pastBookings.map((b, i) => (
                <div key={i} className="dash-past-card">
                  <span className="dash-past-role">
                    <span className="dash-past-role-icon" aria-hidden>
                      {b.role === "TRAVELER" ? Icon.plane : Icon.package}
                    </span>
                    {b.role === "TRAVELER" ? "Traveller" : "Sender"}
                  </span>
                  <span className="dash-past-route">{b.from} → {b.to}</span>
                  <span className="dash-past-status">
                    <span className="dash-past-status-icon" aria-hidden>{Icon.check}</span>
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="dash-footer-note">
          For queries, use the Help &amp; Support button below.
        </p>
      </div>

      <footer className="dash-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </div>
  );
}
