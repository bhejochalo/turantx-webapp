import React, { useState } from "react";
import "./LandingPage.css";
import logo from "../assets/turantxlogo.gif";
import Loader from "./Loader";
import OtpPage from "./OtpPage";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import AppHeader from "./AppHeader";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const [mode, setMode] = useState("LOGIN"); // LOGIN | SIGNUP
  const [showAlreadyModal, setShowAlreadyModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  localStorage.setItem("PHONE_NUMBER", phoneNumber);

  /* ---------------- HELPERS ---------------- */

  const checkUserExists = async (phone) => {
    try {
      const userRef = doc(db, "users", phone);
      const snap = await getDoc(userRef);
      return snap.exists();
    } catch (err) {
      console.error("Firestore check failed", err);
      return false;
    }
  };

  const waitMinLoader = async (startTime, min = 2500) => {
    const elapsed = Date.now() - startTime;
  
    if (elapsed < min) {
      await new Promise((res) =>
        setTimeout(res, min - elapsed)
      );
    }
  };

  // ✅ Check traveler / sender role + whether delivery is completed
  const getUserDestination = async (phone) => {
    try {
      // Check Traveler — new requests subcollection first, fallback to details
      const travelerReqsSnap = await getDocs(collection(db, "users", phone, "TravelerRequests"));
      if (!travelerReqsSnap.empty) {
        const hasActive = travelerReqsSnap.docs.some((d) => d.data().LastMileStatus !== "Completed");
        return { role: "TRAVELER", isCompleted: !hasActive };
      }
      const travelerDetailsSnap = await getDoc(doc(db, "users", phone, "Traveler", "details"));
      if (travelerDetailsSnap.exists()) {
        return { role: "TRAVELER", isCompleted: travelerDetailsSnap.data().LastMileStatus === "Completed" };
      }

      // Check Sender — new requests subcollection first, fallback to details
      const senderReqsSnap = await getDocs(collection(db, "users", phone, "SenderRequests"));
      if (!senderReqsSnap.empty) {
        const hasActive = senderReqsSnap.docs.some((d) => d.data().LastMileStatus !== "Completed");
        return { role: "SENDER", isCompleted: !hasActive };
      }
      const senderDetailsSnap = await getDoc(doc(db, "users", phone, "Sender", "details"));
      if (senderDetailsSnap.exists()) {
        return { role: "SENDER", isCompleted: senderDetailsSnap.data().LastMileStatus === "Completed" };
      }

      return { role: null, isCompleted: false };
    } catch (err) {
      console.error("Role check failed", err);
      return { role: null, isCompleted: false };
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setIsValid(/^[6-9]\d{9}$/.test(value));
  };

  /* ---------------- CONTINUE ---------------- */

  const handleContinue = async () => {
    if (!isValid) return;
  
    const startTime = Date.now(); // ⏱ start timer
    setLoading(true);
  
    // 🔍 Check main user
    const exists = await checkUserExists(phoneNumber);
  
    // 🚫 SIGNUP but exists
    if (mode === "SIGNUP" && exists) {
      await waitMinLoader(startTime);
      setLoading(false);
      setShowAlreadyModal(true);
      return;
    }
  
    // 🚫 LOGIN but not exists
    if (mode === "LOGIN" && !exists) {
      await waitMinLoader(startTime);
      setLoading(false);
      setShowNotFoundModal(true);
      return;
    }
  
    // ✅ LOGIN + already exists → check role
    if (mode === "LOGIN" && exists) {
      const { role, isCompleted } = await getUserDestination(phoneNumber);

      await waitMinLoader(startTime);
      setLoading(false);

      if (role === "TRAVELER") {
        navigate(isCompleted ? "/dashboard" : "/traveler-waitlist", {
          state: { phoneNumber },
        });
        return;
      }

      if (role === "SENDER") {
        navigate(isCompleted ? "/dashboard" : "/sender-waitlist", {
          state: { phoneNumber },
        });
        return;
      }
  
      setShowOtp(true);
      return;
    }
  
    // ✅ SIGNUP + new user → init
    if (mode === "SIGNUP" && !exists) {
      await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/initUser",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        }
      );
    }
  
    // ✅ New signup → OTP
    await waitMinLoader(startTime);
  
    sessionStorage.setItem("AUTH_OK", "true");
    sessionStorage.setItem("AUTH_MODE", mode);
  
    setLoading(false);
    setShowOtp(true);
  };
  
  /* ---------------- STATES ---------------- */

  if (loading) return <Loader />;
  if (showOtp) return <OtpPage phoneNumber={phoneNumber} />;

  /* ---------------- UI ---------------- */

  return (
    <>
      <AppHeader />

      <div className="login-wrapper">
        {/* LEFT */}
        <div className="login-left">
          <div className="brand-content">
            <h1>
              Fast. Trusted.
              <br />
              Human-Powered Document Delivery
            </h1>

            <p>
              Send urgent items with verified flight travellers.
              <br />
              Or carry documents on your flight and earn money.
            </p>

            <ul className="trust-points">
              <li>✔ PAN & ID verified travellers</li>
              <li>✔ Flights manually reviewed</li>
              <li>✔ Refund guaranteed if no match</li>
            </ul>
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="login-card">
            <img src={logo} alt="TurantX" className="login-logo" />

            {/* MODE */}
            <div className="login-toggle">
              <button
                className={mode === "LOGIN" ? "active" : ""}
                onClick={() => setMode("LOGIN")}
              >
                Login
              </button>

              <button
                className={mode === "SIGNUP" ? "active" : ""}
                onClick={() => setMode("SIGNUP")}
              >
                Sign Up
              </button>
            </div>

            <h2>
              {mode === "LOGIN"
                ? "Login to TurantX"
                : "Create your TurantX account"}
            </h2>

            <p className="login-subtitle">
              Enter your mobile number to continue
            </p>

            <label>Mobile Number</label>

            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChange={handleChange}
              maxLength={10}
              className={isValid ? "active" : ""}
            />

            <button
              className={`login-btn ${isValid ? "active" : ""}`}
              onClick={handleContinue}
              disabled={!isValid}
            >
              {mode === "LOGIN" ? "Continue" : "Sign Up"}
            </button>

            <p className="login-note">
              By continuing, you agree to TurantX’s
              <br />
              <span>Terms & Privacy Policy</span>
            </p>
          </div>
        </div>

        {/* ALREADY */}
        {showAlreadyModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3>Already Registered</h3>

              <p>
                This mobile number is already registered.
                <br />
                Please log in.
              </p>

              <div className="modal-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    setShowAlreadyModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  onClick={() => {
                    setShowAlreadyModal(false);
                    setMode("LOGIN");
                  }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOT FOUND */}
        {showNotFoundModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3>Account Not Found</h3>

              <p>
                This number is not registered.
                <br />
                Please sign up.
              </p>

              <div className="modal-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    setShowNotFoundModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  onClick={() => {
                    setShowNotFoundModal(false);
                    setMode("SIGNUP");
                  }}
                >
                  Go to Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
