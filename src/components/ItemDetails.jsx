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

  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    itemName: "",
    weightKg: "",
    weightGram: "",
    deliveryOption: "",
    instructions: "",
    price: "",
  });

  const handleChange = (e) => setItem({ ...item, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!item.itemName || !item.deliveryOption || !item.price) {
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

      alert("✅ Sender details saved successfully!");
      navigate("/traveler-list", { state: { phoneNumber } });
    } catch (err) {
      console.error("❌ Error saving sender:", err);
      alert("Something went wrong while saving sender details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-container page-transition">
      {loading && <Loader />}
      <div className="item-card">
        <h3 className="item-title">📦 Item Details</h3>

        <input name="itemName" value={item.itemName} onChange={handleChange} placeholder="Item Name" />
        <div className="weight-group">
          <input name="weightKg" value={item.weightKg} onChange={handleChange} placeholder="Weight (kg)" />
          <input name="weightGram" value={item.weightGram} onChange={handleChange} placeholder="Weight (grams)" />
        </div>

        <select name="deliveryOption" value={item.deliveryOption} onChange={handleChange}>
          <option value="">Select Delivery Option</option>
          <option value="SELF_DROP">Self Drop</option>
          <option value="PICKUP">Pickup from Address</option>
        </select>

        <input name="price" value={item.price} onChange={handleChange} placeholder="Offered Price (₹)" />
        <textarea name="instructions" value={item.instructions} onChange={handleChange} placeholder="Special Instructions" />

        <button className="item-next" onClick={handleSubmit}>
          Verify & Continue
        </button>
      </div>
    </div>
  );
}
