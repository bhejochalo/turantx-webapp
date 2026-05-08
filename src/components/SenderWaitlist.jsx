import React, { useEffect, useRef, useState } from "react";
import "./SenderWaitlist.css";
import "./FlightDetails.css"; /* for .fd-btn family */
import RequestTimeline from "./RequestTimeline";
import StepIndicator from "./StepIndicator";
import { doc, onSnapshot, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import TrustStatusBox from "./TrustStatusBox";
import { showToast } from "./Toast";
import { WaitlistSkeleton } from "./Skeleton";
import ConfirmModal from "./ConfirmModal";
import { useNavigate, useLocation } from "react-router-dom";

/* ── Inline SVG icon set (matches FlightDetails) ── */
const Icon = {
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 17l-2 2-3-3 5-5 4 4"/><path d="M14 11l3-3 4 4-5 5-2-2"/><path d="M3 14l3-3"/><path d="M18 10l3-3"/>
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  plane: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  planeFilled: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2.5 19h19v2h-19zM22.07 9.64c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 2.59 4.49.74 1.28 1.56-.42 5.18-1.39 4.32-1.16 5.58-1.5c.81-.22 1.28-1.05 1.06-1.84z"/>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const STATUS_UI = {
  NEW_ORDER: { text: <>Your request has been received. Our team will start matching shortly.</>, icon: "doc",       step: 3 },
  SEARCHING: { text: <><strong>Our operations team is checking</strong> for matching travellers on your route.</>, icon: "search",   step: 4 },
  MATCHED:   { text: <><strong>Match confirmed.</strong> We'll contact you shortly on WhatsApp.</>,                 icon: "check",    step: 6 },
  IN_PROGRESS: { text: <><strong>Your item is on its way.</strong> The traveller is in transit.</>,                 icon: "plane",    step: 7 },
  COMPLETED: { text: <><strong>Delivered successfully.</strong> Thank you for using TurantX.</>,                    icon: "check",    step: 8 },
};

export default function SenderWaitlist() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [opsReviewed, setOpsReviewed] = useState(false);
  const [trust, setTrust] = useState({});
  const [activeTab, setActiveTab] = useState("STATUS");

  // OTP state
  const [confirmedTraveler, setConfirmedTraveler] = useState(null);
  const [senderDocRef, setSenderDocRef] = useState(null);
  const [firstMileOTP, setFirstMileOTP] = useState(null);
  const [lastMileOTP, setLastMileOTP] = useState(null);
  const [lastMileCopied, setLastMileCopied] = useState(false);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Slider state
  const [sliderX, setSliderX] = useState(0);
  const [sliderDone, setSliderDone] = useState(false);
  const sliderTrackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const THUMB = 56;
  const THRESHOLD = 0.78;

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef([]);

  const otpComplete = otpDigits.join("").length === 6;

  const getMax = () => {
    if (!sliderTrackRef.current) return 200;
    return sliderTrackRef.current.offsetWidth - THUMB;
  };
  const onDragStart = (clientX) => {
    if (sliderDone || !otpComplete) return;
    isDragging.current = true;
    startX.current = clientX - sliderX;
  };
  const onDragMove = (clientX) => {
    if (!isDragging.current) return;
    const next = Math.min(Math.max(0, clientX - startX.current), getMax());
    setSliderX(next);
  };
  const onDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sliderX / getMax() >= THRESHOLD) {
      setSliderX(getMax());
      setShowConfirmModal(true);
    } else {
      setSliderX(0);
    }
  };
  const onSliderKeyDown = (e) => {
    if (sliderDone || !otpComplete) return;
    const max = getMax();
    const step = Math.max(20, max * 0.1);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderX((x) => Math.min(max, x + step));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderX((x) => Math.max(0, x - step));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSliderX(0);
    } else if (e.key === "End" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setSliderX(max);
      setShowConfirmModal(true);
    }
  };

  const handleLastMileCopy = () => {
    if (!lastMileOTP) return;
    navigator.clipboard.writeText(String(lastMileOTP));
    setLastMileCopied(true);
    if (typeof navigator.vibrate === "function") navigator.vibrate(15);
    setTimeout(() => setLastMileCopied(false), 2000);
  };

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);
  const handlePullStart = (e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };
  const handlePullEnd = (e) => {
    if (!isPulling.current) return;
    isPulling.current = false;
    const pullDistance = (e.changedTouches?.[0]?.clientY || 0) - pullStartY.current;
    if (pullDistance > 80) {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1500);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setOtpError("");
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const confirmHandover = async () => {
    const entered = otpDigits.join("");
    if (entered.length < 6) { setOtpError("Please enter all 6 digits"); return false; }
    if (!firstMileOTP) { setOtpError("OTP not available. Contact support."); return false; }
    if (String(firstMileOTP) !== entered) {
      setOtpError("Incorrect OTP. Please check with your traveller.");
      return false;
    }
    setOtpLoading(true);
    try {
      await updateDoc(senderDocRef, { status: "IN_PROGRESS" });
      if (confirmedTraveler?.phoneNumber && confirmedTraveler?.requestKey) {
        const travRef = doc(db, "users", confirmedTraveler.phoneNumber, "TravelerRequests", confirmedTraveler.requestKey);
        await updateDoc(travRef, { status: "IN_PROGRESS" });
      }
      setOtpSuccess(true);
      setSliderDone(true);
      setStatus("IN_PROGRESS");
      showToast("Handover confirmed! Item is now in transit.", "success");
      return true;
    } catch (err) {
      setOtpError("Something went wrong. Please try again.");
      setSliderX(0);
      showToast("Failed to confirm handover. Please try again.", "error");
      return false;
    } finally {
      setOtpLoading(false);
      setShowConfirmModal(false);
    }
  };

  /* ── Helpers ── */
  const getETA = (s) => {
    if (s === "MATCHED" || s === "IN_PROGRESS" || s === "COMPLETED") return "Matched";
    if (s === "SEARCHING") return "1–3 hours";
    return "2–6 hours";
  };
  const getStep = () => STATUS_UI[status]?.step || 3;

  /* ── Firestore ── */
  useEffect(() => {
    const phone = location.state?.phoneNumber || localStorage.getItem("PHONE_NUMBER");
    const role = location.state?.role || localStorage.getItem("USER_ROLE");
    if (!phone || (role && role !== "SENDER")) {
      navigate("/login", { replace: true });
      return;
    }

    let unsub = null;
    const startListening = async () => {
      const reqsSnap = await getDocs(collection(db, "users", phone, "SenderRequests"));
      let activeRef = null;
      if (!reqsSnap.empty) {
        const activeDoc = reqsSnap.docs.find((d) => d.data().status !== "COMPLETED" && d.data().LastMileStatus !== "Completed");
        if (activeDoc) activeRef = doc(db, "users", phone, "SenderRequests", activeDoc.id);
      }
      if (!activeRef) activeRef = doc(db, "users", phone, "Sender", "details");
      setSenderDocRef(activeRef);

      unsub = onSnapshot(activeRef, (snap) => {
        if (!snap.exists()) {
          setStatus("SEARCHING");
          setLoading(false);
          return;
        }
        const data = snap.data();
        setStatus(data.status || (data.requestStatus === "MATCH_FOUND" ? "MATCHED" : data.requestStatus) || "NEW_ORDER");
        setTrust(data.trustStatus || {});
        setOpsReviewed(!!data.opsReviewed);
        setConfirmedTraveler(data.confirmedTraveler || null);
        setFirstMileOTP(data.firstMileOTP || null);
        setLastMileOTP(data.lastMileOTP || null);
        setSummary({
          requestId: data.uniqueKey,
          fromCity: data.from?.city,
          toCity: data.to?.city,
          itemName: data.itemDetails?.itemName,
          weight: data.itemDetails?.totalWeight,
          deliveryType: data.itemDetails?.deliveryOption === "SELF_DROP_PICK" ? "Self drop & pick" : "Auto drop & pick",
        });
        setLoading(false);
      });
    };

    startListening();
    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (loading) {
    return (
      <div className="waitlist-page">
        <div className="waitlist-card">
          <WaitlistSkeleton />
        </div>
      </div>
    );
  }

  const sliderPct = Math.round(sliderX / Math.max(1, getMax()) * 100);
  const statusUI = STATUS_UI[status];
  const statusIcon = statusUI ? Icon[statusUI.icon] : null;

  return (
    <div className="waitlist-page" onTouchStart={handlePullStart} onTouchEnd={handlePullEnd}>
      {refreshing && (
        <div className="pull-refresh-indicator">
          <div className="refresh-spinner" />
          <span>Refreshing…</span>
        </div>
      )}

      <div className="waitlist-card">
        <StepIndicator current={4} total={4} label="Match in progress" />

        <h2 className="wl-title">
          <span className="wl-title-icon" aria-hidden>{Icon.doc}</span>
          Thanks for sharing the details
        </h2>
        <p className="wl-subtitle">
          We're running a pilot for <strong>urgent document delivery</strong> via flight travellers.
        </p>

        {/* ---------- TABS ---------- */}
        <div className="tabs" role="tablist" aria-label="Waitlist sections">
          {[
            ["STATUS", "Status"],
            ["REQUEST", "Request"],
            ["PAYMENT", "Payment"],
            ["SAFETY", "Safety"],
          ].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              className={activeTab === key ? "tab active" : "tab"}
              onClick={() => setActiveTab(key)}
            >{label}</button>
          ))}
        </div>

        {/* ---------- STATUS TAB ---------- */}
        {activeTab === "STATUS" && (
          <div className="wl-panel" role="tabpanel">
            {opsReviewed && (
              <div className="ops-badge">
                <span className="dot-green" aria-hidden></span>
                Reviewed by TurantX Operations
              </div>
            )}

            <div className="eta-card">
              <span className="eta-card-icon" aria-hidden>{Icon.clock}</span>
              Estimated matching time:&nbsp;<strong>{getETA(status)}</strong>
            </div>

            {statusUI && (
              <div className="status-banner">
                <span className="status-banner-icon" aria-hidden>{statusIcon}</span>
                <div className="status-banner-text">{statusUI.text}</div>
              </div>
            )}

            {/* ---- HANDOVER OTP ---- */}
            {!otpSuccess && status !== "IN_PROGRESS" && status !== "COMPLETED" && (
              <div className={`otp-card ${status === "MATCHED" ? "" : "is-locked"}`}>
                <div className={`otp-card-badge ${status === "MATCHED" ? "" : "is-muted"}`}>
                  {status === "MATCHED" ? "Action required" : "Step 2 · Coming soon"}
                </div>
                <div className="otp-card-icon-wrap" aria-hidden>
                  {status === "MATCHED" ? Icon.handshake : Icon.lock}
                </div>
                <h3 className="otp-card-title">
                  {status === "MATCHED" ? "Confirm item handover" : "Handover via OTP"}
                </h3>
                <p className="otp-card-subtitle">
                  {status === "MATCHED"
                    ? <>Ask your traveller to show their <strong>6-digit OTP</strong> and enter it below to confirm handover.</>
                    : <>When your traveller is matched, you'll <strong>get an OTP from them</strong> and enter it here to confirm the handover.</>}
                </p>

                <div className="handover-steps">
                  <div className="handover-step">
                    <span className="step-num">1</span>
                    <span>Meet your traveller at the pickup point</span>
                  </div>
                  <div className="handover-step">
                    <span className="step-num">2</span>
                    <span>Ask them to open their <b>TurantX app</b></span>
                  </div>
                  <div className="handover-step">
                    <span className="step-num">3</span>
                    <span>Enter the <b>6-digit OTP</b> shown on their screen</span>
                  </div>
                </div>

                <div className="otp-input-row" onPaste={status === "MATCHED" ? handleOtpPaste : undefined}>
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className={`otp-box ${status !== "MATCHED" ? "is-locked" : ""}`}
                      type="tel"
                      inputMode="numeric"
                      autoComplete={i === 0 && status === "MATCHED" ? "one-time-code" : "off"}
                      maxLength={1}
                      value={status === "MATCHED" ? d : ""}
                      placeholder={status === "MATCHED" ? "" : "•"}
                      readOnly={status !== "MATCHED"}
                      aria-label={`Handover OTP digit ${i + 1}`}
                      onChange={(e) => status === "MATCHED" && handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => status === "MATCHED" && handleOtpKeyDown(e, i)}
                    />
                  ))}
                </div>

                {otpError && <p className="otp-error" role="alert">{otpError}</p>}

                {status === "MATCHED" ? (
                  <>
                    <div
                      ref={sliderTrackRef}
                      className={`slider-track ${!otpComplete ? "slider-disabled" : ""} ${sliderDone ? "slider-done" : ""}`}
                      onMouseMove={(e) => onDragMove(e.clientX)}
                      onMouseUp={onDragEnd}
                      onMouseLeave={onDragEnd}
                      onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                      onTouchEnd={onDragEnd}
                      role="slider"
                      aria-label="Slide to confirm handover"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={sliderPct}
                      aria-disabled={!otpComplete || sliderDone}
                      tabIndex={otpComplete && !sliderDone ? 0 : -1}
                      onKeyDown={onSliderKeyDown}
                    >
                      <div className="runway-dashes" />
                      <div className="slider-fill" style={{ width: sliderX + 60 }} />
                      <span className="slider-label">
                        {sliderDone
                          ? (otpLoading ? "Verifying…" : "Dispatched")
                          : !otpComplete
                            ? "Enter OTP to enable"
                            : (
                              <>
                                Slide to confirm handover
                                <span className="slider-label-icon" aria-hidden>{Icon.arrowRight}</span>
                              </>
                            )}
                      </span>
                      <div
                        className="slider-thumb"
                        style={{ transform: `translateX(${sliderX}px)` }}
                        onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX); }}
                        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                        aria-hidden
                      >
                        <span className="slider-thumb-icon" aria-hidden>{sliderDone ? Icon.check : Icon.planeFilled}</span>
                      </div>
                    </div>
                    <p className="slider-fallback">
                      Or{" "}
                      <button
                        type="button"
                        className="slider-fallback-btn"
                        disabled={!otpComplete || sliderDone}
                        onClick={() => setShowConfirmModal(true)}
                      >tap here to confirm</button>
                    </p>
                    <p className="otp-card-warn">
                      <span className="otp-card-warn-icon" aria-hidden>{Icon.alert}</span>
                      Only enter the OTP shown on your traveller's screen.
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    className="fd-btn fd-btn--primary fd-btn--block otp-card-cta"
                    disabled
                  >
                    <span className="fd-btn-icon" aria-hidden>{Icon.lock}</span>
                    Waiting for match
                  </button>
                )}
              </div>
            )}

            {(otpSuccess || status === "IN_PROGRESS" || status === "COMPLETED") && (
              <div className="success-card">
                <div className="success-card-icon" aria-hidden>{Icon.check}</div>
                <h3>{status === "COMPLETED" ? "Delivered" : "Handover confirmed"}</h3>
                <p>
                  {status === "COMPLETED"
                    ? "Your document has been delivered successfully."
                    : "Your item is now with the traveller. We'll keep you updated."}
                </p>
              </div>
            )}

            {/* ---- LAST MILE OTP — show when IN_PROGRESS ---- */}
            {status === "IN_PROGRESS" && (
              <div className="otp-card">
                <div className="otp-card-badge">Share with receiver</div>
                <div className="otp-card-icon-wrap" aria-hidden>{Icon.key}</div>
                <h3 className="otp-card-title">Delivery OTP</h3>
                <p className="otp-card-subtitle">
                  Share this OTP with your <strong>receiver</strong>. They'll give it to the traveller when the item is delivered.
                </p>
                <div className="otp-digits-row">
                  {String(lastMileOTP || "------").split("").map((d, i) => (
                    <div key={i} className="otp-digit">{d}</div>
                  ))}
                </div>
                <button
                  type="button"
                  className="fd-btn fd-btn--primary fd-btn--block otp-card-cta"
                  onClick={handleLastMileCopy}
                >
                  <span className="fd-btn-icon" aria-hidden>{lastMileCopied ? Icon.check : Icon.copy}</span>
                  {lastMileCopied ? "Copied!" : "Copy OTP"}
                </button>
                <p className="otp-card-warn">
                  <span className="otp-card-warn-icon" aria-hidden>{Icon.shield}</span>
                  Share only with your receiver or trusted contact.
                </p>
              </div>
            )}

            <RequestTimeline currentStep={getStep()} />

            <div className="trust-strip is-info">
              <span className="trust-strip-icon" aria-hidden>{Icon.whatsapp}</span>
              <div className="trust-strip-text">
                <strong>Updates on WhatsApp</strong>
                <p>For any queries, use the Help &amp; Support button at the bottom right. We usually respond within an hour.</p>
              </div>
            </div>

            <div className="waitlist-note">Matches are subject to availability.</div>
          </div>
        )}

        {/* ---------- REQUEST TAB ---------- */}
        {activeTab === "REQUEST" && summary && (
          <div className="wl-panel" role="tabpanel">
            <div className="request-summary-card">
              <div className="summary-row">
                <span className="label">Request ID</span>
                <span className="value">TX-{summary.requestId}</span>
              </div>
              <div className="summary-row">
                <span className="label">Route</span>
                <span className="value">{summary.fromCity} → {summary.toCity}</span>
              </div>
              <div className="summary-row">
                <span className="label">Item</span>
                <span className="value">{summary.itemName}</span>
              </div>
              <div className="summary-row">
                <span className="label">Weight</span>
                <span className="value">{summary.weight}</span>
              </div>
              <div className="summary-row">
                <span className="label">Delivery</span>
                <span className="value">{summary.deliveryType}</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- PAYMENT TAB ---------- */}
        {activeTab === "PAYMENT" && (
          <div className="wl-panel" role="tabpanel">
            <div className="trust-strip is-success">
              <span className="trust-strip-icon" aria-hidden>{Icon.shield}</span>
              <div className="trust-strip-text">
                <strong>Payment</strong>
                <p>This is a pilot service — <b>no payment is taken</b> at this stage.</p>
              </div>
            </div>
            <div className="trust-strip is-info">
              <span className="trust-strip-icon" aria-hidden>{Icon.whatsapp}</span>
              <div className="trust-strip-text">
                <strong>WhatsApp confirmation</strong>
                <p>We'll contact you only from the official TurantX WhatsApp Business account.</p>
              </div>
            </div>
            <div className="invoice-card">
              <h4>Invoice &amp; receipt</h4>
              <p>No payment has been collected during the pilot phase. Once payments are enabled, your invoices will appear here.</p>
              <button
                type="button"
                className="fd-btn fd-btn--ghost fd-btn--block"
                disabled
              >
                Download invoice (coming soon)
              </button>
            </div>
          </div>
        )}

        {/* ---------- SAFETY TAB ---------- */}
        {activeTab === "SAFETY" && (
          <div className="wl-panel" role="tabpanel">
            <TrustStatusBox trust={trust} />
            <div className="trust-strip is-success">
              <span className="trust-strip-icon" aria-hidden>{Icon.shield}</span>
              <div className="trust-strip-text">
                <strong>Verified travellers only</strong>
                <p>Every traveller is manually verified using PAN, government ID, and flight details.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          title="Confirm Handover"
          message="Are you sure you want to hand over the item to this traveller? This action cannot be undone."
          confirmText="Yes, confirm handover"
          cancelText="Go back"
          loading={otpLoading}
          variant="primary"
          onConfirm={confirmHandover}
          onCancel={() => { setShowConfirmModal(false); setSliderX(0); }}
        />
      )}
    </div>
  );
}
