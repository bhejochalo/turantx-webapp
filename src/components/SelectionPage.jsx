import React from "react";
import "./SelectionPage.css";
import logo from "../assets/turantx-logo.png";
import { useNavigate } from "react-router-dom";

const SelectionPage = ({ phoneNumber }) => {
  const navigate = useNavigate();

  // Handle Sender
  const handleSender = () => {
    navigate("/address", { state: { phoneNumber, userType: "SENDER" } });
  };

  // Handle Traveler
  const handleTraveler = () => {
    navigate("/address", { state: { phoneNumber, userType: "TRAVELER" } });
  };

  return (
    <div className="select-container">
      <div className="select-content">
        <img src={logo} alt="TurantX Logo" className="select-logo" />

        <h2 className="select-title">Select Your Role</h2>
        <p className="select-subtitle">
          Whether you want to send items or earn while traveling — choose below.
        </p>

        <button className="select-btn sender" onClick={handleSender}>
          🙋‍♂️ I'm a Sender
        </button>

        <button className="select-btn traveler" onClick={handleTraveler}>
          ✈️ I'm a Traveller
        </button>
      </div>
    </div>
  );
};

export default SelectionPage;
