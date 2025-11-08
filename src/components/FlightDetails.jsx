import React, { useState } from "react";
import "./FlightDetails.css";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";

export default function FlightDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const from = state?.from;
  const to = state?.to;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    airline: "",
    travelDate: "",
    departureTime: "",
    baggageSpace: "",
    spaceAvailableWhen: "",
    carryType: "",
    remarks: "",
    checkParcel: false,
    agreeTerms: false,
  });

  const airlines = ["Air India", "IndiGo", "SpiceJet", "Vistara", "Go First", "AirAsia India"];
  const carryOptions = ["Cabin", "Luggage", "Personal Bag", "All"];
  const spaceAvail = ["Before Flight", "After Flight", "Anytime"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.airline) {
      alert("Please fill all mandatory fields");
      return;
    }
    if (!form.agreeTerms) {
      alert("Please agree to Terms and Conditions");
      return;
    }

    const fullData = {
      phoneNumber,
      from,
      to,
      flightDetails: form,
    };

    setLoading(true);
    try {
      const res = await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/saveTraveler",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullData),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Traveler saved successfully!");
      navigate("/sender-dashboard", { state: { phoneNumber } });
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving traveler details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flight-page">
      {loading && <Loader />}
      <div className="flight-card">
        <h2 className="flight-title">Tell Us About Your Flight ✈️</h2>

        <div className="flight-form">
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />

          <select name="airline" value={form.airline} onChange={handleChange}>
            <option value="">Select Airline</option>
            {airlines.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <input type="date" name="travelDate" value={form.travelDate} onChange={handleChange} />
          <input type="time" name="departureTime" value={form.departureTime} onChange={handleChange} />

          <input type="number" name="baggageSpace" placeholder="Free Space in Baggage (kg)" value={form.baggageSpace} onChange={handleChange} />

          <select name="spaceAvailableWhen" value={form.spaceAvailableWhen} onChange={handleChange}>
            <option value="">When is Space Available?</option>
            {spaceAvail.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select name="carryType" value={form.carryType} onChange={handleChange}>
            <option value="">What Can You Carry?</option>
            {carryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <textarea name="remarks" placeholder="Add Remarks (optional)" value={form.remarks} onChange={handleChange} />

          <label>
            <input type="checkbox" name="checkParcel" checked={form.checkParcel} onChange={handleChange} /> I want to check parcel before carrying
          </label>
          <label>
            <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} /> I agree to Terms & Conditions
          </label>

          <button className="verify-btn" onClick={handleSubmit}>Verify & Continue</button>
        </div>
      </div>
    </div>
  );
}
