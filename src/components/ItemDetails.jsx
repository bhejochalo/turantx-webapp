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

  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    itemName: "",
    weightKg: "",
    weightGram: "",
    deliveryOption: "",
    instructions: "",
  });
  const openRazorpay = async () => {
    const loadRazorpay = () =>
      new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
  
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }
  
    const options = {
      key: "rzp_test_4HNx49ek9VPhNQ",
      amount: 200 * 100,
      currency: "INR",
      name: "TurantX",
      description: "Urgent document delivery (Pilot)",
      handler: function (response) {
        console.log("✅ Payment Success", response);
  
        navigate("/sender-waitlist", {
          state: {
            paymentId: response.razorpay_payment_id,
          },
        });
      },
      theme: {
        color: "#ff7b29",
      },
    };
  
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
  
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
      await openRazorpay();
  
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

      <div className="item-card">
        <h3 className="item-title">📦 Item Details</h3>

        <input
          name="itemName"
          value={item.itemName}
          onChange={handleChange}
          placeholder="Item Name"
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

        <button className="item-next" onClick={handleSubmit}>
          Verify & Continue
        </button>
      </div>
    </div>
  );
}
