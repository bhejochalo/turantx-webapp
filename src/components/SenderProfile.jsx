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

      {/* ===== TRAVELER TAB ===== */}
      {activeTab === "traveler" && (
        <>
          {traveler?.status !== "WAITING" ? (
            <div className="card">
              <h4>🧑 Traveler Info</h4>
              <p>Name: {traveler?.flightDetails?.firstName} {traveler?.flightDetails?.lastName}</p>
              <p>Phone: {traveler?.phoneNumber}</p>
            </div>
          ) : (
            <div className="card muted">
              Traveler details visible after acceptance
            </div>
          )}
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
