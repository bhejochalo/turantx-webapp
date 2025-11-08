import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const from = state?.from;

  const [to, setTo] = useState({
    houseNumber: "",
    street: "",
    area: "",
    postalCode: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setTo({ ...to, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (!to.city || !to.state) {
      alert("Please fill all mandatory fields");
      return;
    }
    navigate("/flight-details", { state: { phoneNumber, from, to } });
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">To Address</h3>
        {Object.keys(to).map((f) => (
          <input
            key={f}
            name={f}
            value={to[f]}
            onChange={handleChange}
            placeholder={f.replace(/([A-Z])/g, " $1")}
            className="addr-input"
          />
        ))}
        <button className="addr-next" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
