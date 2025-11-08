import React, { useState } from "react";
import "./FlightDetails.css";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function FlightDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const travelerId = state?.travelerId || "default"; // in case you store by id

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
    if (!form.firstName || !form.lastName || !form.airline || !form.baggageSpace) {
      alert("Please fill all mandatory fields");
      return;
    }
    if (!form.agreeTerms) {
      alert("Please agree to Terms and Conditions");
      return;
    }

    setLoading(true);
    try {
      const travelerRef = doc(db, "users", phoneNumber);
      await updateDoc(travelerRef, {
        flightDetails: arrayUnion({
          ...form,
          createdAt: new Date().toISOString(),
        }),
      });
      alert("Flight details saved successfully!");
      navigate("/sender-dashboard", { state: { phoneNumber } });
    } catch (error) {
      console.error("Error saving flight:", error);
      alert("Something went wrong while saving flight details.");
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
          <input
            name="firstName"
            placeholder="Enter First Name"
            value={form.firstName}
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Enter Last Name"
            value={form.lastName}
            onChange={handleChange}
          />

          <select name="airline" value={form.airline} onChange={handleChange}>
            <option value="">Select Airline</option>
            {airlines.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <label className="label">Select Date You’ll Travel</label>
          <input
            type="date"
            name="travelDate"
            value={form.travelDate}
            onChange={handleChange}
          />

          <label className="label">Departure Time</label>
          <input
            type="time"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
          />

          <label className="label required">Free Space in Baggage (kg)</label>
          <input
            name="baggageSpace"
            type="number"
            placeholder="Enter available space"
            value={form.baggageSpace}
            onChange={handleChange}
          />

          <select
            name="spaceAvailableWhen"
            value={form.spaceAvailableWhen}
            onChange={handleChange}
          >
            <option value="">When is Space Available?</option>
            {spaceAvail.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select name="carryType" value={form.carryType} onChange={handleChange}>
            <option value="">What Can You Carry?</option>
            {carryOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <textarea
            name="remarks"
            placeholder="Add remarks (optional)"
            value={form.remarks}
            onChange={handleChange}
          />

          <div className="checkboxes">
            <label>
              <input
                type="checkbox"
                name="checkParcel"
                checked={form.checkParcel}
                onChange={handleChange}
              />
              I want to check the parcel before carrying
            </label>
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
              />
              I agree to the Terms and Conditions
            </label>
          </div>

          <button className="verify-btn" onClick={handleSubmit}>
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
