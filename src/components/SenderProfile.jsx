import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import "./SenderProfile.css";

const STORAGE_PHONE_KEY = "PHONE_NUMBER";

export default function SenderProfile() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sender, setSender] = useState(null);
  const [traveler, setTraveler] = useState(null);

  const [activeTab, setActiveTab] = useState("status");

  const [editType, setEditType] = useState(null); // "from" | "to" | "item"
  const [formData, setFormData] = useState({});

  /* ---------------- LOAD PHONE ---------------- */
  useEffect(() => {
    const pn =
      sessionStorage.getItem(STORAGE_PHONE_KEY) ||
      localStorage.getItem(STORAGE_PHONE_KEY);
    setPhoneNumber(pn || null);
  }, []);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }
    const loadAll = async () => {
      try {
        // ---- Sender ----
        const senderRef = doc(db, "users", phoneNumber, "Sender", "details");
        const senderSnap = await getDoc(senderRef);
        if (!senderSnap.exists()) return;
    
        const senderData = senderSnap.data();
        setSender(senderData);
    
        // ---- Traveler (SAME phone number) ----
        const travelerRef = doc(
          db,
          "users",
          senderData.phoneNumber,
          "Traveler",
          "details"
        );
    
        const travelerSnap = await getDoc(travelerRef);
    
        if (travelerSnap.exists()) {
          setTraveler({
            phoneNumber: senderData.phoneNumber,
            ...travelerSnap.data(),
          });
        } else {
          console.warn("Traveler details not found");
        }
      } catch (e) {
        console.error("SenderProfile load error:", e);
      } finally {
        setLoading(false);
      }
    };
    

    loadAll();
  }, [phoneNumber]);

  /* ---------------- HELPERS ---------------- */
  const formatAddress = (a) =>
    a
      ? `${a.houseNumber}, ${a.street}, ${a.area}, ${a.city}, ${a.state} - ${a.postalCode}`
      : "N/A";

  const openEdit = (type, data) => {
    setEditType(type);
    setFormData(data || {});
  };

  const closeEdit = () => {
    setEditType(null);
    setFormData({});
  };

  const saveEdit = async () => {
    const ref = doc(db, "users", phoneNumber, "Sender", "details");

    if (editType === "from") {
      await updateDoc(ref, { from: formData });
      setSender({ ...sender, from: formData });
    }

    if (editType === "to") {
      await updateDoc(ref, { to: formData });
      setSender({ ...sender, to: formData });
    }

    if (editType === "item") {
      await updateDoc(ref, { itemDetails: formData });
      setSender({ ...sender, itemDetails: formData });
    }

    closeEdit();
  };

  /* ---------------- UI STATES ---------------- */
  if (loading) return <div className="loader">Loading…</div>;

  if (!phoneNumber) {
    return (
      <div className="session-expired">
        <h3>Session expired</h3>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="sender-wrapper">
      <h2 className="title">Sender Profile</h2>
      <p className="phone">Phone: {phoneNumber}</p>

{/* ===== ROUTE + FLIGHT CARD ===== */}
<div className="route-card">
  <div className="route-row">
    <div className="route-point">
      <span className="route-label">From</span>
      <span className="route-city">
        {traveler?.from?.city}, {traveler?.from?.state}
      </span>
    </div>

    <div className="route-plane">
      ✈️
      <span className="route-line" />
    </div>

    <div className="route-point right">
      <span className="route-label">To</span>
      <span className="route-city">
        {traveler?.to?.city}, {traveler?.to?.state}
      </span>
    </div>
  </div>

  <div className="flight-info">
    <div>✈ Airline: <b>{traveler?.flightDetails?.airline}</b></div>
    <div>📅 Date: {traveler?.flightDetails?.travelDate}</div>
    <div>🕒 Departure: {traveler?.flightDetails?.departureTime}</div>
    <div>🎒 Carry: {traveler?.flightDetails?.carryType}</div>
    <div>⚖ Baggage: {traveler?.flightDetails?.baggageSpace} kg</div>
  </div>
</div>


      {/* ===== TABS ===== */}
      <div className="tabs">
        <button
          className={activeTab === "status" ? "active" : ""}
          onClick={() => setActiveTab("status")}
        >
          Status
        </button>
        <button
          className={activeTab === "traveler" ? "active" : ""}
          onClick={() => setActiveTab("traveler")}
        >
          Traveler
        </button>
      </div>

      {/* ===== STATUS TAB ===== */}
      {activeTab === "status" && (
        <>
          <div className="card">
            <h4>🚚 Delivery Status</h4>
            <p>1️⃣ First Mile: {traveler?.FirstMileStatus} (OTP: {traveler?.FirstMileOTP})</p>
            <p>2️⃣ Second Mile: {traveler?.SecondMileStatus}</p>
            <p>3️⃣ Last Mile: {traveler?.LastMileStatus} (OTP: {traveler?.LastMileOTP})</p>
          </div>

          <div className="card">
            <h4>📍 Sender From Address</h4>
            <p>{formatAddress(sender?.from)}</p>
            <button onClick={() => openEdit("from", sender?.from)}>Edit</button>
          </div>

          <div className="card">
            <h4>📍 Sender To Address</h4>
            <p>{formatAddress(sender?.to)}</p>
            <button onClick={() => openEdit("to", sender?.to)}>Edit</button>
          </div>

          <div className="card">
            <h4>📦 Item Details</h4>
            <p>Item: {sender?.itemDetails?.itemName}</p>
            <p>Weight: {sender?.itemDetails?.totalWeight}</p>
            <p>Instructions: {sender?.itemDetails?.instructions}</p>
            <button onClick={() => openEdit("item", sender?.itemDetails)}>Edit</button>
          </div>
        </>
      )}

{activeTab === "traveler" && traveler && (
  <>
    {/* ===== TRAVELER PROFILE ===== */}
    <div className="card traveler-profile">
      <div className="traveler-header">
        <div className="avatar">👤</div>
        <div>
          <h4>
            {traveler.firstName} {traveler.lastName}
          </h4>
          <p className="sub">📞 {traveler.phoneNumber}</p>
        </div>
        <span className={`badge ${traveler.status === "WAITING" ? "waiting" : "active"}`}>
          {traveler.status}
        </span>
      </div>
    </div>

    {/* ===== JOURNEY CARD ===== */}
    <div className="card journey-card">
      <div className="journey-row">
        <div>
          <span className="label">FROM</span>
          <p className="city">
            {traveler.from?.city}, {traveler.from?.state}
          </p>
        </div>

        <div className="plane">✈️</div>

        <div>
          <span className="label">TO</span>
          <p className="city">
            {traveler.to?.city}, {traveler.to?.state}
          </p>
        </div>
      </div>

      <div className="journey-meta">
        <span>🛫 {traveler.airline}</span>
        <span>📅 {traveler.travelDate}</span>
        <span>🕒 {traveler.departureTime}</span>
        <span>🎒 {traveler.carryType}</span>
        <span>⚖ {traveler.baggageSpace} kg</span>
      </div>
    </div>

    {/* ===== STATUS TIMELINE ===== */}
    <div className="card">
      <h4>🚚 Delivery Progress</h4>

      <div className={`timeline-item ${traveler.FirstMileStatus === "Completed" ? "done" : ""}`}>
        <span>📦 First Mile</span>
        <small>OTP: {traveler.FirstMileOTP}</small>
      </div>

      <div className={`timeline-item ${traveler.SecondMileStatus === "Completed" ? "done" : ""}`}>
        <span>✈️ Second Mile</span>
        <small>{traveler.SecondMileStatus}</small>
      </div>

      <div className={`timeline-item ${traveler.LastMileStatus === "Completed" ? "done" : ""}`}>
        <span>🏁 Last Mile</span>
        <small>OTP: {traveler.LastMileOTP}</small>
      </div>
    </div>

    {/* ===== MAP ===== */}
    <div className="card">
      <h4>📍 Destination Map</h4>

      <iframe
        title="map"
        className="map"
        loading="lazy"
        src={`https://www.google.com/maps?q=${traveler.to?.latitude || 20},${traveler.to?.longitude || 77}&z=6&output=embed`}
      />
    </div>

    {/* ===== BOTTOM ACTION BAR ===== */}
    <div className="bottom-actions">
      <a href={`tel:${traveler.phoneNumber}`} className="action-btn">
        📞 Call
      </a>

      <a
        target="_blank"
        rel="noreferrer"
        className="action-btn secondary"
        href={`https://www.google.com/maps/dir/?api=1&destination=${traveler.to?.city}`}
      >
        🧭 Directions
      </a>

      <button className="action-btn ghost">🔄 Refresh</button>
    </div>
  </>
)}


      {/* ===== MODAL ===== */}
      {editType && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Edit Details</h3>

            {Object.keys(formData || {}).map((k) => (
              <input
                key={k}
                placeholder={k}
                value={formData[k] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [k]: e.target.value })
                }
              />
            ))}

            <div className="modal-actions">
              <button onClick={saveEdit}>Save</button>
              <button className="cancel" onClick={closeEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
