import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/turantx-logo.png";
import "./ConfirmPage.css";

export default function ConfirmPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | invalid | expired | used | sender | traveler | success
  const [tokenData, setTokenData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sender form
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");

  // Traveler form
  const [pnr, setPnr] = useState("");
  const [baggageConfirmed, setBaggageConfirmed] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function validateToken() {
      try {
        const tokenRef = doc(db, "confirmTokens", token);
        const snap = await getDoc(tokenRef);
        if (!snap.exists()) { setStatus("invalid"); return; }

        const data = snap.data();
        if (data.used) { setStatus("used"); return; }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setStatus("expired"); return;
        }

        setTokenData({ ...data, tokenRef });
        setStatus(data.userType === "SENDER" ? "sender" : "traveler");
      } catch (err) {
        console.error(err);
        setStatus("invalid");
      }
    }
    validateToken();
  }, [token]);

  const validateSender = () => {
    const e = {};
    if (!receiverName.trim()) e.receiverName = true;
    if (!receiverPhone.trim() || !/^\d{10}$/.test(receiverPhone.trim())) e.receiverPhone = true;
    if (!receiverAddress.trim()) e.receiverAddress = true;
    if (!pickupAddress.trim()) e.pickupAddress = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateTraveler = () => {
    const e = {};
    if (!pnr.trim()) e.pnr = true;
    if (!baggageConfirmed) e.baggageConfirmed = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitSender = async () => {
    if (!validateSender()) return;
    setSaving(true);
    try {
      // Update the sender's request doc with receiver details
      const reqRef = doc(db, "users", tokenData.phoneNumber, "requests", tokenData.requestId);
      await updateDoc(reqRef, {
        receiverDetails: {
          name: receiverName.trim(),
          phone: receiverPhone.trim(),
          address: receiverAddress.trim(),
        },
        pickupAddress: pickupAddress.trim(),
        confirmLinkFilledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Mark token as used
      await updateDoc(tokenData.tokenRef, { used: true, usedAt: new Date().toISOString() });
      setStatus("success");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitTraveler = async () => {
    if (!validateTraveler()) return;
    setSaving(true);
    try {
      const reqRef = doc(db, "users", tokenData.phoneNumber, "requests", tokenData.requestId);
      await updateDoc(reqRef, {
        "flightDetails.pnr": pnr.trim(),
        "flightDetails.baggageConfirmedViaLink": true,
        confirmLinkFilledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(tokenData.tokenRef, { used: true, usedAt: new Date().toISOString() });
      setStatus("success");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── LOADING ──
  if (status === "loading") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <div className="cp-spinner" />
          <p className="cp-loading-text">Verifying your link…</p>
        </div>
      </div>
    );
  }

  // ── INVALID ──
  if (status === "invalid") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <div className="cp-icon cp-icon-error">✗</div>
          <h2 className="cp-error-title">Invalid Link</h2>
          <p className="cp-error-text">This link is not valid. Please use the link sent to you by TurantX.</p>
        </div>
      </div>
    );
  }

  // ── EXPIRED ──
  if (status === "expired") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <div className="cp-icon cp-icon-error">⏱</div>
          <h2 className="cp-error-title">Link Expired</h2>
          <p className="cp-error-text">This link has expired (valid for 24 hours). Please contact TurantX support to get a new link.</p>
          <a href="https://wa.me/919999999999" className="cp-support-btn">Contact Support</a>
        </div>
      </div>
    );
  }

  // ── ALREADY USED ──
  if (status === "used") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <div className="cp-icon cp-icon-done">✓</div>
          <h2 className="cp-success-title">Already Submitted</h2>
          <p className="cp-error-text">You've already submitted your details via this link. No action needed.</p>
        </div>
      </div>
    );
  }

  // ── SUCCESS ──
  if (status === "success") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <div className="cp-icon cp-icon-done">✓</div>
          <h2 className="cp-success-title">Details Saved!</h2>
          <p className="cp-success-text">
            {tokenData?.userType === "SENDER"
              ? "Your receiver details have been saved. Our team will coordinate the delivery."
              : "Your PNR has been saved. Our team will verify your flight details."}
          </p>
          <p className="cp-success-sub">Team TurantX will be in touch on WhatsApp.</p>
        </div>
      </div>
    );
  }

  // ── SENDER FORM ──
  if (status === "sender") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <h2 className="cp-title">Receiver Details</h2>
          <p className="cp-subtitle">Please fill in the details of the person receiving your parcel.</p>

          <div className="cp-field">
            <label className="cp-label">Receiver's Full Name</label>
            <input
              className={`cp-input ${errors.receiverName ? "cp-input-error" : ""}`}
              placeholder="e.g. Priya Sharma"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
            {errors.receiverName && <span className="cp-err">Required</span>}
          </div>

          <div className="cp-field">
            <label className="cp-label">Receiver's Phone Number</label>
            <input
              className={`cp-input ${errors.receiverPhone ? "cp-input-error" : ""}`}
              placeholder="10-digit mobile number"
              type="tel"
              maxLength={10}
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ""))}
            />
            {errors.receiverPhone && <span className="cp-err">Enter a valid 10-digit number</span>}
          </div>

          <div className="cp-field">
            <label className="cp-label">Receiver's Full Address</label>
            <textarea
              className={`cp-input cp-textarea ${errors.receiverAddress ? "cp-input-error" : ""}`}
              placeholder="House no, street, area, city, pincode"
              rows={3}
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
            />
            {errors.receiverAddress && <span className="cp-err">Required</span>}
          </div>

          <div className="cp-field">
            <label className="cp-label">Your Pickup Address</label>
            <textarea
              className={`cp-input cp-textarea ${errors.pickupAddress ? "cp-input-error" : ""}`}
              placeholder="Where the traveler should collect from you"
              rows={3}
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
            />
            {errors.pickupAddress && <span className="cp-err">Required</span>}
          </div>

          <button className="cp-submit-btn" onClick={submitSender} disabled={saving}>
            {saving ? "Saving…" : "Submit Details"}
          </button>

          <p className="cp-secure">🔒 Secured by TurantX</p>
        </div>
      </div>
    );
  }

  // ── TRAVELER FORM ──
  if (status === "traveler") {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <img src={logo} alt="TurantX" className="cp-logo" />
          <h2 className="cp-title">Confirm Your Flight</h2>
          <p className="cp-subtitle">Please share your PNR so we can verify your booking and coordinate handover.</p>

          <div className="cp-field">
            <label className="cp-label">PNR Number</label>
            <input
              className={`cp-input ${errors.pnr ? "cp-input-error" : ""}`}
              placeholder="e.g. ABC123"
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              style={{ letterSpacing: "2px", fontWeight: 600 }}
            />
            {errors.pnr && <span className="cp-err">Required</span>}
          </div>

          <label className={`cp-checkbox ${errors.baggageConfirmed ? "cp-checkbox-error" : ""}`}>
            <input
              type="checkbox"
              checked={baggageConfirmed}
              onChange={(e) => setBaggageConfirmed(e.target.checked)}
            />
            <span>I confirm I have baggage space and agree to carry the sender's document</span>
          </label>
          {errors.baggageConfirmed && <span className="cp-err">Please confirm</span>}

          <div className="cp-info-box">
            <h4>What happens next?</h4>
            <ul>
              <li>Our team will verify your PNR</li>
              <li>You'll receive sender's pickup address on WhatsApp</li>
              <li>Collect the document before your flight</li>
            </ul>
          </div>

          <button className="cp-submit-btn" onClick={submitTraveler} disabled={saving}>
            {saving ? "Saving…" : "Confirm & Submit"}
          </button>

          <p className="cp-secure">🔒 Secured by TurantX</p>
        </div>
      </div>
    );
  }

  return null;
}
