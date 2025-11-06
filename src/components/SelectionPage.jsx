import React from "react";
import "./SelectionPage.css";
import logo from "../assets/turantx-logo.png"; // adjust path if needed
import { useNavigate } from "react-router-dom";

const SelectionPage = ({ phoneNumber }) => {
  const navigate = useNavigate();

  const handleSender = () => {
    navigate("/sender-profile", { state: { phoneNumber } });
  };

  const handleTraveler = () => {
    navigate("/traveler-profile", { state: { phoneNumber } });
  };

  return (
    <div className="select-container">
      <div className="select-content">
        <img src={logo} alt="turantx" className="select-logo" />

        <button className="select-btn" onClick={handleSender}>
          🙋‍♂️  I'm a Sender
        </button>

        <button className="select-btn" onClick={handleTraveler}>
          ✈️  I'm a Traveller
        </button>
      </div>
    </div>
  );
};

export default SelectionPage;
