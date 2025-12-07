import React, { useEffect, useState } from "react";
import "./SelectionPage.css";
import logo from "../assets/turantx-logo.png";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const SelectionPage = ({ phoneNumber }) => {
  const navigate = useNavigate();
  const [checkingTraveler, setCheckingTraveler] = useState(true);
  const [travelerExists, setTravelerExists] = useState(false);

  // Check if traveler data exists on component mount
  useEffect(() => {
    const checkExistingTraveler = async () => {
      if (!phoneNumber) {
        setCheckingTraveler(false);
        return;
      }

      try {
        const travelerDocRef = doc(db, "users", phoneNumber, "Traveler", "details");
        const snap = await getDoc(travelerDocRef);
        
        if (snap.exists()) {
          setTravelerExists(true);
          // Redirect to traveler profile if data exists
          navigate("/traveler-profile", { 
            state: { phoneNumber } 
          });
        } else {
          setTravelerExists(false);
        }
      } catch (error) {
        console.error("Error checking traveler data:", error);
        setTravelerExists(false);
      } finally {
        setCheckingTraveler(false);
      }
    };

    checkExistingTraveler();
  }, [phoneNumber, navigate]);

  const handleTraveler = () => {
    navigate("/address-selection", { state: { phoneNumber, userType: "TRAVELER" } });
  };

  const handleSender = () => {
    navigate("/pan-verification", { state: { phoneNumber, userType: "SENDER" } });
  };

  // Show loading while checking
  if (checkingTraveler) {
    return (
      <div className="select-container page-transition">
        <div className="select-content">
          <img src={logo} alt="TurantX" className="select-logo" />
          <div className="select-loading">Checking your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="select-container page-transition">
      <div className="select-content">
        <img src={logo} alt="TurantX" className="select-logo" />

        <h2 className="select-title">Choose Your Role</h2>
        <p className="select-subtitle">
          Travel smart. Deliver smarter. Earn rewards on every trip.
        </p>

        <div className="select-buttons">
          <button className="select-btn traveler" onClick={handleTraveler}>
            ✈️ I'm a Traveler
          </button>

          <button className="select-btn sender" onClick={handleSender}>
            📦 I'm a Sender
          </button>
        </div>

        {/* Show message if traveler data was found but user came back to this page */}
        {travelerExists && (
          <div className="select-note">
            <p>We found your existing traveler profile. You can still choose to register as a sender.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionPage;