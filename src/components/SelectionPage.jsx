import React from "react";
import "./SelectionPage.css";
import logo from "../assets/turantx-logo.png";
import { useNavigate } from "react-router-dom";

const SelectionPage = ({ phoneNumber }) => {
  const navigate = useNavigate();

  const handleTraveler = () => {
    navigate("/address-selection", { state: { phoneNumber, userType: "TRAVELER" } });
  };

  return (
    <div className="select-container page-transition">
      <div className="select-content">
        <img src={logo} alt="TurantX" className="select-logo" />
        <h2 className="select-title">Choose Your Role</h2>
        <p className="select-subtitle">
          Travel smart. Deliver smarter. Earn rewards on every trip.
        </p>

        <button className="select-btn traveler" onClick={handleTraveler}>
          ✈️ I’m a Traveler
        </button>
      </div>
    </div>
  );
};

export default SelectionPage;
