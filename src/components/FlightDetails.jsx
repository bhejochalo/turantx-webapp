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
  const [showTermsModal, setShowTermsModal] = useState(false);


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
    "Personal Bag"
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
  onChange={() => {
    if (!form.agreeTerms) {
      setShowTermsModal(true);
    } else {
      setForm({ ...form, agreeTerms: false });
    }
  }}
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
{showTermsModal && (
  <div className="modal-overlay">
    <div
      className="modal-card"
      style={{
        maxHeight: "80vh",
        overflow: "hidden",
        width: "90%",
        maxWidth: "600px",
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>
        Terms & Conditions
      </h3>

      {/* Scroll Area */}
      <div
  style={{
    maxHeight: "55vh",
    overflowY: "auto",
    fontSize: "14px",
    lineHeight: "1.6",
    paddingRight: "6px",
  }}
>
  <h4>Terms & Conditions</h4>
  <p><strong>Last updated:</strong> 24-Jan-2026</p>

  <p>
    Welcome to <strong>TurantX Solutions Pvt Ltd</strong> (“TurantX”, “we”, “our”, “us”).
    By accessing or using the TurantX website, mobile application, or services,
    you agree to be bound by these Terms & Conditions.
    If you do not agree, please do not use our services.
  </p>

  <hr />

  <h5>1. About TurantX</h5>
  <p>
    TurantX is a peer-to-peer logistics technology platform that connects senders
    with verified flight travelers to facilitate urgent document delivery.
  </p>
  <p>
    During the pilot phase, TurantX operates on a limited-feature basis and
    currently supports document delivery only.
  </p>

  <h5>2. Pilot Phase Disclaimer</h5>
  <p>
    TurantX is currently operating in a pilot phase. Features, processes, pricing,
    and availability may change without prior notice.
  </p>
  <p>
    Certain services such as doorstep pickup or doorstep delivery are not available
    during the pilot phase.
  </p>

  <h5>3. Eligibility</h5>
  <p>To use TurantX:</p>
  <ul>
    <li>You must be at least 18 years old.</li>
    <li>You must provide accurate and complete information.</li>
    <li>Travelers must complete identity verification as required by TurantX.</li>
  </ul>

  <h5>4. Nature of Items Allowed</h5>
  <p>
    Only documents are permitted during the pilot phase.
  </p>
  <p>
    Prohibited items include (but are not limited to): cash, illegal substances,
    electronics, valuables, perishables, hazardous materials, or any item
    restricted by law or airline regulations.
  </p>
  <p>
    TurantX reserves the right to cancel requests involving prohibited items.
  </p>

  <h5>5. Role of TurantX</h5>
  <p>
    TurantX acts as a technology platform only. We do not physically transport,
    handle, store, or inspect documents.
  </p>
  <p>
    TurantX does not guarantee delivery timelines and is not a courier or cargo company.
  </p>

  <h5>6. Sender Responsibilities</h5>
  <ul>
    <li>Provide accurate pickup and destination details.</li>
    <li>Ensure documents are legal, non-restricted, and properly packaged.</li>
    <li>Hand over documents directly to the matched traveler.</li>
    <li>Coordinate pickup and delivery using shared contact details (e.g. WhatsApp).</li>
  </ul>

  <h5>7. Traveler Responsibilities</h5>
  <ul>
    <li>Carry only documents approved through the TurantX platform.</li>
    <li>Handle documents responsibly and deliver them as agreed.</li>
    <li>Comply with airline rules, airport security regulations, and applicable laws.</li>
    <li>Reject any package that appears suspicious or unsafe.</li>
  </ul>

  <h5>8. Payments & Charges</h5>
  <p>
    During the pilot phase, no payment is required from senders.
    Future pricing, fees, or rewards may be introduced with prior notice.
  </p>
  <p>
    Travelers may receive rewards or earnings as communicated separately.
  </p>

  <h5>9. No Match Policy</h5>
  <p>
    If no suitable traveler is found within 24 hours, the request will be cancelled.
    As no payment is collected during the pilot, no refund applies.
  </p>

  <h5>10. Liability Limitation</h5>
  <p>
    TurantX is not responsible for loss, delay, damage, or misuse of documents.
    Users acknowledge that delivery is facilitated through independent travelers.
  </p>
  <p>
    To the maximum extent permitted by law, TurantX’s liability is limited to the
    extent of fees paid (if any).
  </p>

  <h5>11. Safety & Verification</h5>
  <p>
    Travelers undergo PAN and ID verification. Flights and routes may be manually reviewed.
  </p>
  <p>
    Despite these checks, users acknowledge that peer-to-peer delivery carries inherent risks.
  </p>

  <h5>12. Account Suspension</h5>
  <p>TurantX reserves the right to suspend or terminate accounts if:</p>
  <ul>
    <li>False information is provided</li>
    <li>Terms are violated</li>
    <li>Suspicious or unsafe activity is detected</li>
  </ul>

  <h5>13. Privacy</h5>
  <p>
    Use of TurantX is also governed by our Privacy Policy.
    By using the platform, you consent to the collection and use of information
    as described therein.
  </p>

  <h5>14. Changes to Terms</h5>
  <p>
    TurantX may update these Terms & Conditions from time to time.
    Continued use of the platform constitutes acceptance of the updated terms.
  </p>

  <h5>15. Governing Law</h5>
  <p>
    These Terms shall be governed by and interpreted in accordance with the laws of India.
    Any disputes shall be subject to the jurisdiction of the courts of India.
  </p>

  <h5>16. Contact Us</h5>
  <p>
    For any questions regarding these Terms, please contact:
    <br />
    📧 <strong>support@turantx.com</strong>
  </p>
</div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "15px",
        }}
      >
        <button
          className="modal-btn"
          style={{ background: "#eee", color: "#333" }}
          onClick={() => {
            setShowTermsModal(false);
            setForm({ ...form, agreeTerms: false });
          }}
        >
          Reject
        </button>

        <button
          className="modal-btn"
          onClick={() => {
            setForm({ ...form, agreeTerms: true });
            setShowTermsModal(false);
          }}
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
