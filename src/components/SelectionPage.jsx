import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // make sure you have firebaseConfig.js setup
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "./SelectionPage.css"; // optional if you want to style

const SelectionPage = ({ phoneNumber }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handles Traveler selection
  const handleTraveler = async () => {
    if (!phoneNumber) {
      setMessage("Phone number not found");
      return;
    }
    setLoading(true);
    try {
      const travelerRef = collection(db, "traveler");
      const q = query(travelerRef, where("phoneNumber", "==", phoneNumber));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log("Existing Traveler:", data);
        setMessage("Traveler found → Navigate to Traveler Profile");
      } else {
        console.log("New Traveler → Navigate to Address Page");
        setMessage("New traveler → Navigate to Address Setup");
      }
    } catch (e) {
      console.error("Traveler check failed", e);
      setMessage("Error checking traveler");
    } finally {
      setLoading(false);
    }
  };

  // Handles Sender selection
  const handleSender = async () => {
    if (!phoneNumber) {
      setMessage("Phone number not found");
      return;
    }
    setLoading(true);
    try {
      const senderRef = collection(db, "Sender");
      const q = query(senderRef, where("phoneNumber", "==", phoneNumber));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log("Existing Sender:", data);
        setMessage("Sender found → Navigate to Sender Profile");
      } else {
        console.log("New Sender → Navigate to Verification Page");
        setMessage("New sender → Navigate to Verification Page");
      }
    } catch (e) {
      console.error("Sender check failed", e);
      setMessage("Error checking sender");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="selection-container">
      <h2>Select User Type</h2>
      <p className="phone-display">Phone: {phoneNumber}</p>

      <div className="btn-group">
        <button className="select-btn sender" onClick={handleSender} disabled={loading}>
          {loading ? "Checking..." : "I am a Sender"}
        </button>
        <button className="select-btn traveler" onClick={handleTraveler} disabled={loading}>
          {loading ? "Checking..." : "I am a Traveler"}
        </button>
      </div>

      {message && <p className="status">{message}</p>}
    </div>
  );
};

export default SelectionPage;
