import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collectionGroup,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "./SenderProfile.css";

export default function SenderProfile() {
  const phoneNumber = localStorage.getItem("PHONE_NUMBER");

  const [sender, setSender] = useState(null);
  const [traveler, setTraveler] = useState(null);
  const [tab, setTab] = useState("status");
  const [firstMileOtp, setFirstMileOtp] = useState("");

  const senderRef = doc(db, "users", phoneNumber, "Sender", "details");

  useEffect(() => {
    loadSender();
  }, []);

  // 🔹 Load Sender
  const loadSender = async () => {
    const snap = await getDoc(senderRef);
    if (snap.exists()) {
      const data = snap.data();
      setSender(data);

      if (data.uniqueKey) {
        loadTravelerByUniqueKey(data.uniqueKey);
      }
    }
  };

  // 🔹 Load Traveler by uniqueKey
  const loadTravelerByUniqueKey = async (uniqueKey) => {
    const q = query(
      collectionGroup(db, "Traveler"),
      where("uniqueKey", "==", uniqueKey)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      setTraveler(snap.docs[0].data());
    }
  };

  // 🔹 Verify First Mile OTP (Sender enters)
  const verifyFirstMileOtp = async () => {
    if (firstMileOtp !== traveler?.FirstMileOTP) {
      alert("❌ Invalid OTP");
      return;
    }

    // update sender
    await updateDoc(senderRef, {
      FirstMileStatus: "Completed",
      SecondMileStatus: "In Progress",
    });

    // update traveler
    const travelerRef = doc(
      db,
      "users",
      traveler.phoneNumber,
      "Traveler",
      "details"
    );

    await updateDoc(travelerRef, {
      FirstMileStatus: "Completed",
      SecondMileStatus: "In Progress",
    });

    alert("✅ First Mile Completed");
    loadSender();
  };

  if (!sender) return <div className="center">Loading…</div>;

  return (
    <div className="sender-page">
      <h2 className="title">Sender Profile</h2>
      <p className="subtitle">Phone: {phoneNumber}</p>

      {/* FLIGHT STATUS */}
      <div className="card">
        <h3>✈️ Flight Status</h3>
        <p>Airline: {traveler?.flightDetails?.airline || "N/A"}</p>
        <p>Flight No: {traveler?.flightDetails?.pnr || "N/A"}</p>
        <p>Status: {traveler?.status || "WAITING"}</p>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button
          className={tab === "status" ? "active" : ""}
          onClick={() => setTab("status")}
        >
          Status
        </button>
        <button
          className={tab === "traveler" ? "active" : ""}
          onClick={() => setTab("traveler")}
          disabled={!traveler}
        >
          Traveler
        </button>
      </div>

      {/* STATUS TAB */}
      {tab === "status" && (
        <>
          {/* DELIVERY STATUS */}
          <div className="card">
            <h3>🚚 Delivery Status</h3>

            <p>First Mile: {traveler?.FirstMileStatus || "Not Started"}</p>

            {traveler?.FirstMileStatus === "In Progress" && (
              <div className="otp-row">
                <input
                  placeholder="Enter First Mile OTP"
                  value={firstMileOtp}
                  onChange={(e) => setFirstMileOtp(e.target.value)}
                />
                <button onClick={verifyFirstMileOtp}>Verify</button>
              </div>
            )}

            <p>Second Mile: {traveler?.SecondMileStatus || "Not Started"}</p>

            <p>Last Mile: {traveler?.LastMileStatus || "Not Started"}</p>

            {traveler?.LastMileOTP && (
              <p className="otp-show">
                Delivery OTP: <b>{traveler.LastMileOTP}</b>
              </p>
            )}
          </div>

          {/* SENDER ADDRESSES */}
          <div className="card">
            <h3>🏠 Sender Addresses</h3>
            <p>
              <b>From:</b>{" "}
              {sender.from
                ? `${sender.from.houseNumber}, ${sender.from.street}, ${sender.from.city}`
                : "N/A"}
            </p>
            <p>
              <b>To:</b>{" "}
              {sender.to
                ? `${sender.to.houseNumber}, ${sender.to.street}, ${sender.to.city}`
                : "N/A"}
            </p>
            <button>Edit Address</button>
          </div>

          {/* ITEM DETAILS */}
          <div className="card">
            <h3>📦 Item Details</h3>
            {sender.itemDetails ? (
              <>
                <p>Item: {sender.itemDetails.itemName}</p>
                <p>Weight: {sender.itemDetails.totalWeight}</p>
                <p>Price: ₹{sender.itemDetails.price}</p>
                <p>Instructions: {sender.itemDetails.instructions}</p>
              </>
            ) : (
              <p>No item details</p>
            )}
            <button>Edit Item</button>
          </div>
        </>
      )}

      {/* TRAVELER TAB */}
      {tab === "traveler" && traveler && (
        <div className="card">
          <h3>👤 Traveler Information</h3>
          <p>Name: {traveler.flightDetails?.firstName}</p>
          <p>Phone: {traveler.phoneNumber}</p>
          <p>Airline: {traveler.flightDetails?.airline}</p>
          <p>Weight Carrying: {traveler.flightDetails?.baggageSpace} kg</p>

          <div className="map-placeholder">
            📍 Current Location (map integration next)
          </div>
        </div>
      )}
    </div>
  );
}
