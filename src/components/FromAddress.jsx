import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";

export default function FromAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;

  const [from, setFrom] = useState({
    houseNumber: "",
    street: "",
    area: "",
    postalCode: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFrom({ ...from, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (!from.city || !from.state) {
      alert("Please fill all mandatory fields");
      return;
    }
    navigate("/to-address", { state: { phoneNumber, from } });
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">From Address</h3>
        {Object.keys(from).map((f) => (
          <input
            key={f}
            name={f}
            value={from[f]}
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
