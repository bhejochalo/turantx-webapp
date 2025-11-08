import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./HelpSupport.css";

export default function HelpSupport() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    queryType: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact || !form.message) {
      alert("⚠️ Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "help"), {
        ...form,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      setLoading(false);
      setForm({ name: "", contact: "", queryType: "", message: "" });
      setOpen(false);
      alert("✅ Your request has been submitted! We'll contact you soon.");
    } catch (error) {
      console.error("❌ Error saving help request:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="help-fab"
        onClick={() => setOpen(!open)}
        title="Help & Support"
      >
        ❔
      </button>

      {/* Popup Modal */}
      {open && (
        <div className="help-overlay" onClick={() => setOpen(false)}>
          <div className="help-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="help-title">Help & Support 💬</h3>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
            />
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="Phone or Email"
            />
            <select
              name="queryType"
              value={form.queryType}
              onChange={handleChange}
            >
              <option value="">Select Query Type</option>
              <option value="Payment Issue">💳 Payment Issue</option>
              <option value="Booking Issue">📦 Booking Issue</option>
              <option value="App Feedback">💬 App Feedback</option>
              <option value="Other">📞 Other</option>
            </select>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Describe your issue..."
              rows={4}
            />

            <button
              className="help-submit"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Sending..." : "📞 Request Callback"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
