import React, { useEffect, useState } from "react";
import "./SelectionPage.css";
import logo from "../assets/turantx-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import StepIndicator from "./StepIndicator";

const SelectionPage = ({ phoneNumber: propPhone }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = propPhone || location.state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";

  const [checking, setChecking] = useState(false);
  const [travelerExists, setTravelerExists] = useState(false);
  const [senderExists, setSenderExists] = useState(false);

  // 🔍 Check existing Traveler / Sender
  useEffect(() => {
    const checkExistingProfiles = async () => {
      if (!phoneNumber) {
        setChecking(false);
        return;
      }

      try {
        // 1️⃣ Check Traveler
        const travelerRef = doc(
          db,
          "users",
          phoneNumber,
          "Traveler",
          "details"
        );
        const travelerSnap = await getDoc(travelerRef);

        if (travelerSnap.exists()) {
          setTravelerExists(true);
          navigate("/traveler-profile", {
            state: { phoneNumber },
          });
          return;
        }

        // 2️⃣ Check Sender
        const senderRef = doc(
          db,
          "users",
          phoneNumber,
          "Sender",
          "details"
        );
        const senderSnap = await getDoc(senderRef);

        if (senderSnap.exists()) {
          setSenderExists(true);
          navigate("/sender-profile", {
            state: { phoneNumber },
          });
          return;
        }
      } catch (err) {
        console.error("Error checking profiles:", err);
      } finally {
        setChecking(false);
      }
    };

    //checkExistingProfiles();
  }, [phoneNumber, navigate]);

  // Manual navigation (new user)
  const handleTraveler = () => {
    localStorage.setItem("USER_ROLE", "TRAVELER");
    navigate("/address-selection", {
      state: { phoneNumber, userType: "TRAVELER" },
    });
  };

  const handleSender = () => {
    localStorage.setItem("USER_ROLE", "SENDER");
    navigate("/address-selection", {
      state: { phoneNumber, userType: "SENDER" },
    });
  };

  // ⏳ Loading
  if (checking) {
    return (
      <div className="select-container page-transition">
        <div className="select-content">
          <img src={logo} alt="TurantX" className="select-logo" />
          <div className="select-loading">
            Checking your profile…
          </div>
        </div>
      </div>
    );
  }

  // 🎯 Role selection
  return (
    <div className="select-container page-transition">
      <div className="select-content">
        <StepIndicator current={1} total={3} label="Choose your role" />
        <img src={logo} alt="TurantX" className="select-logo" />

        <h2 className="select-title">Choose Your Role</h2>
        <p className="select-subtitle">
        Connecting senders and travellers to deliver urgent documents during our pilot.
        </p>

        <div className="select-buttons">
          <button className="select-btn traveler" onClick={handleTraveler}>
            ✈️ I'm a Traveller
          </button>

          <button className="select-btn sender" onClick={handleSender}>
            📦 I'm a Sender
          </button>
        </div>

        {(travelerExists || senderExists) && (
          <div className="select-note">
            <p>
              We found your existing profile. You can still
              register for another role if you want.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionPage;
