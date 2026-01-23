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
  const distance = state?.distance || "";
  const [showTerms, setShowTerms] = useState(false);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    airline: "",
    customAirline: "", // ✅ for Others
    travelDate: "",
    departureTime: "",
    baggageSpace: "",
    spaceAvailableWhen: "",
    carryType: "",
    remarks: "",
    checkParcel: false,
    agreeTerms: false,
  });

  // ✅ Airlines + Others
  const airlines = [
    "Air India",
    "Air India Express",
    "IndiGo",
    "SpiceJet",
    "Vistara",
    "AirAsia India",
    "Akasa Air",
    "Others",
  ];

  const carryOptions = [
    { label: "Documents", enabled: true },
    { label: "Laptop", enabled: false },
    { label: "Medicines", enabled: false },
    { label: "Electronics", enabled: false },
    { label: "Clothes", enabled: false },
    { label: "Books", enabled: false },
    { label: "Gifts", enabled: false },
  ];

  // ✅ Bag naming fixed
  const spaceAvail = [
    "All Bags",
    "Cabin Bag",
    "Luggage Bag",
    "Personal Bag",
    "No Bag Space",
  ];

  // ✅ Handle change (block negative kg)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "baggageSpace" && value < 0) return;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    // ✅ Validation (Others included)
    if (
      !form.firstName ||
      !form.lastName ||
      !form.airline ||
      (form.airline === "Others" && !form.customAirline)
    ) {
      alert("⚠️ Please fill all mandatory fields");
      return;
    }

    if (!form.agreeTerms) {
      alert("⚠️ Please agree to Terms and Conditions");
      return;
    }

    const payload = {
      phoneNumber,
      userType: "TRAVELER",
      from,
      to,
      distance,
      flightDetails: {
        ...form,

        // ✅ Real airline name
        airline:
          form.airline === "Others"
            ? form.customAirline
            : form.airline,
      },
    };

    setLoading(true);

    try {
      const res = await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/saveUserData",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Server error");

      alert("✅ Traveler details saved successfully!");

      navigate("/traveler-waitlist", { state: { phoneNumber } });
    } catch (err) {
      console.error("❌ Error saving traveler:", err);

      alert("Something went wrong while saving traveler details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flight-page">
      {loading && <Loader />}

      <div className="flight-card">
        <h2 className="flight-title">
          Tell Us About Your Flight ✈️
        </h2>

        <div className="flight-form">
          {/* Name */}
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
          />

          {/* Airline */}
          <select
            name="airline"
            value={form.airline}
            onChange={handleChange}
          >
            <option value="">Select Airline</option>

            {airlines.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          {/* Others input */}
          {form.airline === "Others" && (
            <input
              name="customAirline"
              placeholder="Enter Airline Name"
              value={form.customAirline}
              onChange={handleChange}
            />
          )}

          {/* Date */}
          <label className="label">
            Select date you'll leave home
          </label>

          <input
            type="date"
            name="travelDate"
            value={form.travelDate}
            onChange={handleChange}
          />

          {/* Time */}
          <label className="label">
            Select time you'll leave home for the airport
          </label>

          <input
            type="time"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
          />

          {/* Baggage */}
          <input
            type="number"
            name="baggageSpace"
            min="0"
            placeholder="Free Space in Baggage (kg)"
            value={form.baggageSpace}
            onChange={handleChange}
          />

          {/* Where space */}
          <select
            name="spaceAvailableWhen"
            value={form.spaceAvailableWhen}
            onChange={handleChange}
            disabled={
              !form.baggageSpace ||
              form.baggageSpace == 0
            }
          >
            <option value="">
              Where Space is Available?
            </option>

            {spaceAvail.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {/* Carry type */}
          <select
            name="carryType"
            value={form.carryType}
            onChange={handleChange}
          >
            <option value="">
              What Can You Carry?
            </option>

            {carryOptions.map((c) => (
              <option
                key={c.label}
                value={c.label}
                disabled={!c.enabled}
                style={
                  !c.enabled ? { color: "#aaa" } : {}
                }
              >
                {c.label}
              </option>
            ))}
          </select>

          {/* Remarks */}
          <textarea
            name="remarks"
            placeholder="Add Remarks (optional)"
            value={form.remarks}
            onChange={handleChange}
          />

          {/* Checkbox */}
          <label>
            <input
              type="checkbox"
              name="checkParcel"
              checked={form.checkParcel}
              onChange={handleChange}
            />
            {" "}I want to check parcel before carrying
          </label>

          <label>
            <input
              type="checkbox"
              name="agreeTerms"
              checked={form.agreeTerms}
              onChange={() => setShowTerms(true)}
            />
            {" "}I agree to Terms & Conditions
          </label>

          <button
            className="verify-btn"
            onClick={handleSubmit}
          >
            Verify & Continue
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="terms-overlay">
          <div className="terms-modal">
            <h3>Terms & Conditions</h3>

            <p>
              By continuing, you agree that:
              <br />• You are responsible for items you carry
              <br />• You will not carry illegal items
              <br />• TurantX is only a facilitator
              <br />• Final responsibility is yours
            </p>

            <div className="terms-actions">
              <button
                onClick={() => setShowTerms(false)}
                className="cancel-btn"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setForm({
                    ...form,
                    agreeTerms: true,
                  });

                  setShowTerms(false);
                }}
                className="accept-btn"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
