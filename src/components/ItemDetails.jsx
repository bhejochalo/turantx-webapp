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
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            I understand and agree to the terms above
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




      </div>
    </div>
  );
  
}
