import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ItemDetails.css";
import Loader from "./Loader";

export default function ItemDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber;
  const from = state?.from;
  const to = state?.to;
  const distance = state?.distance || "";
  const panDetails = state?.panDetails || {};
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsAlert, setShowTermsAlert] = useState(false);
  const [showFieldAlert, setShowFieldAlert] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isValidWeight = (kg, gram) => {
    const kgVal = parseInt(kg || "0", 10);
    const gramVal = parseInt(gram || "0", 10);
  
    if (isNaN(kgVal) || isNaN(gramVal)) return false;
    if (kgVal < 0 || gramVal < 0) return false;
  
    return kgVal > 0 || gramVal > 0;
  };
  

  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    itemName: "",
    weightKg: "",
    weightGram: "",
    deliveryOption: "",
    instructions: "",
  });
  // const openRazorpay = async () => {
  //   const loadRazorpay = () =>
  //     new Promise((resolve) => {
  //       const script = document.createElement("script");
  //       script.src = "https://checkout.razorpay.com/v1/checkout.js";
  //       script.onload = () => resolve(true);
  //       script.onerror = () => resolve(false);
  //       document.body.appendChild(script);
  //     });

  //   const res = await loadRazorpay();
  //   if (!res) {
  //     alert("Razorpay SDK failed to load");
  //     return;
  //   }

  //   const options = {
  //     key: "rzp_test_4HNx49ek9VPhNQ",
  //     amount: 200 * 100,
  //     currency: "INR",
  //     name: "TurantX",
  //     description: "Urgent document delivery (Pilot)",
  //     handler: function (response) {
  //       console.log("✅ Payment Success", response);

  //       navigate("/sender-waitlist", {
  //         state: {
  //           paymentId: response.razorpay_payment_id,
  //         },
  //       });
  //     },
  //     theme: {
  //       color: "#ff7b29",
  //     },
  //   };

  //   const paymentObject = new window.Razorpay(options);
  //   paymentObject.open();
  // };

  const handleChange = (e) =>
    setItem({ ...item, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!item.itemName || !item.deliveryOption) {
      alert("⚠️ Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phoneNumber,
        userType: "SENDER",
        from,
        to,
        distance,
        panDetails,
        itemDetails: {
          ...item,
          totalWeight: `${item.weightKg || 0}kg ${item.weightGram || 0}g`,
        },
      };

      console.log("📦 Sending payload:", payload);

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

      // ✅ ONLY AFTER SUCCESS → open Razorpay
      navigate("/sender-waitlist", {
        state: {
          phoneNumber,
        },
      });

    } catch (err) {
      console.error("❌ Error saving sender:", err);
      alert("Something went wrong while saving details.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="item-container page-transition">
      {loading && <Loader />}
      {showTermsAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Please accept the Terms</h3>

            <p>
              To continue, please read and accept the terms and conditions related to
              our pilot delivery service.
            </p>

            <button
              className="modal-btn"
              onClick={() => setShowTermsAlert(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="item-card">
        <h3 className="item-title">📦 Document Details</h3>
        {showFieldAlert && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Missing Details</h3>

              <p>
                Please fill all the required item and delivery details to continue.
              </p>

              <button
                className="modal-btn"
                onClick={() => setShowFieldAlert(false)}
              >
                Okay
              </button>
            </div>
          </div>
        )}

        <input
          name="itemName"
          value={item.itemName}
          onChange={handleChange}
          placeholder="Document type (e.g. Agreement, Application)"
        />

        <div className="weight-group">
          <input
            name="weightKg"
            value={item.weightKg}
            onChange={handleChange}
            placeholder="Weight (kg)"
          />
          <input
            name="weightGram"
            value={item.weightGram}
            onChange={handleChange}
            placeholder="Weight (grams)"
          />
        </div>

        <select
          name="deliveryOption"
          value={item.deliveryOption}
          onChange={handleChange}
        >
          <option value="">Select Delivery Option</option>

          {/* ✅ Enabled */}
          <option value="SELF_DROP_PICK">
            Self Drop & Pick
          </option>

          {/* 🚫 Disabled */}
          <option value="AUTO_DROP_PICK" disabled>
            Auto Drop & Pick (Coming Soon)
          </option>
        </select>

        <textarea
          name="instructions"
          value={item.instructions}
          onChange={handleChange}
          placeholder="Special Instructions (optional)"
        />
        <div className="trust-box">

          <h4>What happens next?</h4>
          <ul>
            <li>Your request is added to our sender waitlist</li>
            <li>We check for matching flight travellers</li>
            <li>If a match is found, we’ll contact you on WhatsApp</li>
            <li>No obligation to proceed</li>
          </ul>

         {/* h4>Why is payment required?</h4>
          <ul>
            <li>Covers verification & coordination cost</li>
            <li>Prevents spam and fake requests</li>
            <li><strong>Refunded if no match is found</strong></li>
          </ul> */}

          <label className="terms-checkbox">
          <input
  type="checkbox"
  checked={acceptedTerms}
  onChange={() => {
    if (!acceptedTerms) {
      setShowTermsModal(true);
    } else {
      setAcceptedTerms(false);
    }
  }}
/>

            I understand and agree to the terms and conditions
          </label>

          <p className="secure-text">
          Pilot offer: First 100 document deliveries at no cost.
          </p>
        </div>
        <button
  className="item-next"
  onClick={() => {
    if (
      !item.itemName.trim() ||
      !item.deliveryOption ||
      !isValidWeight(item.weightKg, item.weightGram)
    ) {
      setShowFieldAlert(true);
      return;
    }

    if (!acceptedTerms) {
      setShowTermsAlert(true);
      return;
    }

    handleSubmit();
  }}
>
  Verify & Continue
</button>

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
            setAcceptedTerms(false);
          }}
        >
          Reject
        </button>

        <button
          className="modal-btn"
          onClick={() => {
            setAcceptedTerms(true);
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
    </div>
  );
  
}
