import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
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



  // ---------------- LOAD PHONE ----------------
  useEffect(() => {
    const pn =
      sessionStorage.getItem(STORAGE_PHONE_KEY) ||
      localStorage.getItem(STORAGE_PHONE_KEY);
    setPhoneNumber(pn || null);
  }, []);

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        const senderRef = doc(db, "users", phoneNumber, "Sender", "details");
        const senderSnap = await getDoc(senderRef);
        if (!senderSnap.exists()) return;

        const senderData = senderSnap.data();
        setSender(senderData);

        if (senderData.uniqueKey) {
          const usersSnap = await getDocs(collection(db, "users"));
          for (const u of usersSnap.docs) {
            const tRef = doc(db, "users", u.id, "Traveler", "details");
            const tSnap = await getDoc(tRef);
            if (
              tSnap.exists() &&
              tSnap.data().uniqueKey === senderData.uniqueKey
            ) {
              setTraveler({ phoneNumber: u.id, ...tSnap.data() });
              break;
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [phoneNumber]);

  const formatAddress = (a) =>
    a
      ? [a.houseNumber, a.street, a.area, a.city, a.state, a.postalCode]
          .filter(Boolean)
          .join(", ")
      : "N/A";

  if (loading) return <div className="loader">Loading…</div>;

  if (!phoneNumber) {
    return (
      <div className="session-expired">
        <h3>Session expired</h3>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="sender-wrapper">
      <h2 className="title">Sender Profile</h2>
      <p className="phone">Phone: {phoneNumber}</p>

      {/* ===== FLIGHT FROM / TO ===== */}
      <div className="card">
        <div className="row between">
          <div>
            <p className="label">From</p>
            <p>{traveler?.from?.city || "N/A"}</p>
          </div>
          <button className="edit-btn">Edit</button>
        </div>

        <div className="row between">
          <div>
            <p className="label">To</p>
            <p>{traveler?.to?.city || "N/A"}</p>
          </div>
          <button className="edit-btn">Edit</button>
        </div>

        <p className="flight-line">
          Airline: {traveler?.flightDetails?.airline || "N/A"} | Flight:{" "}
          {traveler?.flightDetails?.flightNumber || "N/A"}
        </p>
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

            <p>✅ 1st Stage: {traveler?.FirstMileStatus || "Not Started"}</p>
            <p>✈️ 2nd Stage: {traveler?.SecondMileStatus || "Not Started"}</p>
            <p>📦 3rd Stage: {traveler?.LastMileStatus || "Not Started"}</p>
          </div>

          <div className="card">
            <h4>📍 Sender From Address</h4>
            <p>{formatAddress(sender?.from)}</p>
            <button className="edit-btn">Edit</button>
          </div>

          <div className="card">
            <h4>📍 Sender To Address</h4>
            <p>{formatAddress(sender?.to)}</p>
            <button className="edit-btn">Edit</button>
          </div>

          <div className="card">
            <h4>📦 Item Details</h4>
            <p>Item: {sender?.itemDetails?.itemName}</p>
            <p>Weight: {sender?.itemDetails?.totalWeight}</p>
            <p>Instructions: {sender?.itemDetails?.instructions}</p>
            <p>Delivery: {sender?.itemDetails?.deliveryOption}</p>
            <button className="edit-btn">Edit</button>
          </div>
        </>
      )}

      {/* ===== TRAVELER TAB ===== */}
      {activeTab === "traveler" && (
        <>
          {traveler?.status === "Request Accepted By Traveler" ? (
            <div className="card">
              <h4>🧑 Traveler Info</h4>
              <p>Name: {traveler?.flightDetails?.firstName}</p>
              <p>Phone: {traveler?.phoneNumber}</p>
              <p>Accepting upto: {traveler?.flightDetails?.baggageSpace} kg</p>
            </div>
          ) : (
            <div className="card muted">
              Traveler details visible after acceptance
            </div>
          )}
        </>
      )}
    </div>
  );
}
