import React, { useEffect, useState } from "react";
import "./TravelerWaitlist.css";
import "./FlightDetails.css"; /* for .fd-btn family */
import RequestTimeline from "./RequestTimeline";
import StepIndicator from "./StepIndicator";
import { onSnapshot, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { showToast } from "./Toast";
import { WaitlistSkeleton } from "./Skeleton";
import ConfirmModal from "./ConfirmModal";
import { useNavigate, useLocation } from "react-router-dom";

/* ── Inline SVG icon set (matches FlightDetails) ── */
const Icon = {
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
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
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
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

export default function TravelerWaitlist() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("SEARCHING");
  const [loading, setLoading] = useState(true);
  const [opsReviewed, setOpsReviewed] = useState(false);
  const [firstMileOTP, setFirstMileOTP] = useState(null);
  const [lastMileOTP, setLastMileOTP] = useState(null);
  const [confirmedForSender, setConfirmedForSender] = useState(null);
  const [travelerDocRef, setTravelerDocRef] = useState(null);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("STATUS");

  // Last Mile OTP entry
  const [lmDigits, setLmDigits] = useState(["", "", "", "", "", ""]);
  const [lmError, setLmError] = useState("");
  const [lmLoading, setLmLoading] = useState(false);
  const [lmSuccess, setLmSuccess] = useState(false);
  const lmRefs = React.useRef([]);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Slider state
  const [sliderX, setSliderX] = useState(0);
  const [sliderDone, setSliderDone] = useState(false);
  const sliderTrackRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const THUMB = 56;
  const THRESHOLD = 0.78;

  const otpComplete = lmDigits.join("").length === 6;

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

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = React.useRef(0);
  const isPulling = React.useRef(false);
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

  const handleCopy = () => {
    if (!firstMileOTP) return;
    navigator.clipboard.writeText(String(firstMileOTP));
    setCopied(true);
    if (typeof navigator.vibrate === "function") navigator.vibrate(15);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLmChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...lmDigits];
    next[idx] = val;
    setLmDigits(next);
    setLmError("");
    if (val && idx < 5) lmRefs.current[idx + 1]?.focus();
  };
  const handleLmKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !lmDigits[idx] && idx > 0) lmRefs.current[idx - 1]?.focus();
  };
  const handleLmPaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) {
      setLmDigits(p.split(""));
      lmRefs.current[5]?.focus();
    }
  };

  const confirmDelivery = async () => {
    const entered = lmDigits.join("");
    if (entered.length < 6) { setLmError("Please enter all 6 digits"); return false; }
    if (String(lastMileOTP) !== entered) { setLmError("Incorrect OTP. Please check with the sender."); return false; }
    setLmLoading(true);
    try {
      await updateDoc(travelerDocRef, { status: "COMPLETED" });
      if (confirmedForSender?.senderPhone && confirmedForSender?.senderRequestKey) {
        const sRef = doc(db, "users", confirmedForSender.senderPhone, "SenderRequests", confirmedForSender.senderRequestKey);
        await updateDoc(sRef, { status: "COMPLETED" });
      }
      setLmSuccess(true);
      setSliderDone(true);
      setStatus("COMPLETED");
      showToast("Delivery confirmed successfully!", "success");
      return true;
    } catch {
      setLmError("Something went wrong. Try again.");
      setSliderX(0);
      showToast("Failed to confirm delivery. Please try again.", "error");
      return false;
    } finally {
      setLmLoading(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    const phone = location.state?.phoneNumber || localStorage.getItem("PHONE_NUMBER");
    const role = location.state?.role || localStorage.getItem("USER_ROLE");
    if (!phone || (role && role !== "TRAVELER")) {
      navigate("/login", { replace: true });
      return;
    }

    let unsub = null;
    const startListening = () => {
      unsub = onSnapshot(collection(db, "users", phone, "TravelerRequests"), (snap) => {
        const activeDoc = snap.docs.find(
          (d) => d.data().status !== "COMPLETED" && d.data().LastMileStatus !== "Completed"
        );
        if (!activeDoc) {
          setStatus("SEARCHING");
          setLoading(false);
          return;
        }
        const data = activeDoc.data();
        setStatus(data.status || (data.requestStatus === "MATCH_FOUND" ? "MATCHED" : data.requestStatus) || "NEW_ORDER");
        setOpsReviewed(!!data.opsReviewed);
        setFirstMileOTP(data.FirstMileOTP || null);
        setLastMileOTP(data.LastMileOTP || null);
        setConfirmedForSender(data.confirmedForSender || null);
        setTravelerDocRef(doc(db, "users", phone, "TravelerRequests", activeDoc.id));
        setSummary({
          requestId: data.uniqueKey,
          fromCity: data.from?.city,
          toCity: data.to?.city,
          airline: data.flightDetails?.airline,
          travelDate: data.flightDetails?.travelDate,
          departureTime: data.flightDetails?.departureTime,
          baggageSpace: data.flightDetails?.baggageSpace,
          spaceAvailable: data.flightDetails?.spaceAvailableWhen,
          carryType: data.flightDetails?.carryType,
          firstName: data.flightDetails?.firstName,
          lastName: data.flightDetails?.lastName,
        });
        setLoading(false);
      });
    };

    startListening();
    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const getStep = () => {
    switch (status) {
      case "COMPLETED": return 8;
      case "IN_PROGRESS": return 7;
      case "MATCHED": return 6;
      case "SEARCHING": return 4;
      default: return 3;
    }
  };

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
          <span className="wl-title-icon" aria-hidden>{Icon.plane}</span>
          You're on the Traveller Waitlist
        </h2>
        <p className="wl-subtitle">
          We'll notify you on <strong>WhatsApp</strong> the moment a delivery request matches your route.
        </p>

        {/* ---------- TABS ---------- */}
        <div className="tabs" role="tablist" aria-label="Waitlist sections">
          <button
            role="tab"
            aria-selected={activeTab === "STATUS"}
            className={activeTab === "STATUS" ? "tab active" : "tab"}
            onClick={() => setActiveTab("STATUS")}
          >Status</button>
          <button
            role="tab"
            aria-selected={activeTab === "REQUEST"}
            className={activeTab === "REQUEST" ? "tab active" : "tab"}
            onClick={() => setActiveTab("REQUEST")}
          >Request</button>
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

            {(status === "NEW_ORDER" || status === "SEARCHING") && (
              <div className="status-banner">
                <span className="status-banner-icon" aria-hidden>{Icon.shield}</span>
                <div className="status-banner-text">
                  <strong>You're all set.</strong> We'll WhatsApp you as soon as a delivery request
                  matches your route. There's <strong>no obligation</strong> to accept.
                </div>
              </div>
            )}

            {status === "MATCHED" && (
              <div className="status-banner">
                <span className="status-banner-icon" aria-hidden>{Icon.check}</span>
                <div className="status-banner-text">
                  <strong>Great news — a delivery request matches your route.</strong> Our team will
                  contact you shortly on WhatsApp. No obligation to accept.
                </div>
              </div>
            )}

            {/* ---- STEP 1 OTP ---- */}
            {status !== "IN_PROGRESS" && status !== "COMPLETED" && (
              status !== "MATCHED" ? (
                <div className="otp-card is-locked" aria-live="polite">
                  <div className="otp-card-badge is-muted">Step 1 · Pickup OTP</div>
                  <div className="otp-card-icon-wrap" aria-hidden>{Icon.lock}</div>
                  <h3 className="otp-card-title">Pickup OTP</h3>
                  <p className="otp-card-subtitle">Appears here once a sender is matched to you.</p>
                  <div className="otp-digits-row" aria-hidden>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="otp-digit">•</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="otp-card" aria-live="polite">
                  <div className="otp-card-badge">Share with sender</div>
                  <div className="otp-card-icon-wrap" aria-hidden>{Icon.package}</div>
                  <h3 className="otp-card-title">Your Pickup OTP</h3>
                  <p className="otp-card-subtitle">
                    Show this OTP to your <strong>sender</strong> when they hand over the item.
                  </p>
                  <div className="otp-digits-row">
                    {(firstMileOTP ? String(firstMileOTP).split("") : ["•", "•", "•", "•", "•", "•"]).map((d, i) => (
                      <div key={i} className="otp-digit">{d}</div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="fd-btn fd-btn--primary fd-btn--block otp-card-cta"
                    onClick={handleCopy}
                  >
                    <span className="fd-btn-icon" aria-hidden>{copied ? Icon.check : Icon.copy}</span>
                    {copied ? "Copied!" : "Copy OTP"}
                  </button>
                  <p className="otp-card-warn">
                    <span className="otp-card-warn-icon" aria-hidden>{Icon.shield}</span>
                    Share only with your matched sender.
                  </p>
                </div>
              )
            )}

            {/* ---- FIRST MILE SUCCESS ---- */}
            {(status === "IN_PROGRESS" || status === "COMPLETED") && (
              <div className="success-card">
                <div className="success-card-icon" aria-hidden>{Icon.check}</div>
                <h3>You now have the parcel</h3>
                <p>The sender will arrange for the receiver to collect the item from you at your destination.</p>
              </div>
            )}

            {/* ---- STEP 2 OTP ---- */}
            {!lmSuccess && status !== "COMPLETED" && (
              status !== "IN_PROGRESS" ? (
                <div className="otp-card is-locked">
                  <div className="otp-card-badge is-muted">Step 2 · Delivery OTP</div>
                  <div className="otp-card-icon-wrap" aria-hidden>{Icon.lock}</div>
                  <h3 className="otp-card-title">Delivery OTP</h3>
                  <p className="otp-card-subtitle">Unlocks after the item pickup is confirmed by the sender.</p>
                </div>
              ) : (
                <div className="otp-card">
                  <div className="otp-card-badge">Confirm delivery</div>
                  <div className="otp-card-icon-wrap" aria-hidden>{Icon.inbox}</div>
                  <h3 className="otp-card-title">Enter Delivery OTP</h3>
                  <p className="otp-card-subtitle">
                    When the receiver collects the item, ask them for the <strong>OTP shared by the sender</strong>
                    {" "}and enter it here to confirm handover.
                  </p>

                  <div className="otp-input-row" onPaste={handleLmPaste}>
                    {lmDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (lmRefs.current[i] = el)}
                        className="otp-box"
                        type="tel"
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={d}
                        aria-label={`Delivery OTP digit ${i + 1}`}
                        onChange={(e) => handleLmChange(e.target.value, i)}
                        onKeyDown={(e) => handleLmKeyDown(e, i)}
                      />
                    ))}
                  </div>
                  {lmError && <p className="otp-error" role="alert">{lmError}</p>}

                  <div
                    ref={sliderTrackRef}
                    className={`slider-track ${!otpComplete ? "slider-disabled" : ""} ${sliderDone ? "slider-done" : ""}`}
                    onMouseMove={(e) => onDragMove(e.clientX)}
                    onMouseUp={onDragEnd}
                    onMouseLeave={onDragEnd}
                    onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                    onTouchEnd={onDragEnd}
                    role="slider"
                    aria-label="Slide to confirm delivery"
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
                        ? (lmLoading ? "Verifying…" : "Delivery confirmed")
                        : !otpComplete
                          ? "Enter OTP to enable"
                          : (
                            <>
                              Slide to confirm delivery
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
                    Only confirm after the receiver has physically collected the item.
                  </p>
                </div>
              )
            )}

            {(lmSuccess || status === "COMPLETED") && (
              <div className="success-card">
                <div className="success-card-icon" aria-hidden>{Icon.check}</div>
                <h3>Delivery complete</h3>
                <p>Thank you for delivering with TurantX.</p>
              </div>
            )}

            <RequestTimeline currentStep={getStep()} />

            <div className="trust-strip is-info">
              <span className="trust-strip-icon" aria-hidden>{Icon.whatsapp}</span>
              <div className="trust-strip-text">
                <strong>Official WhatsApp only</strong>
                <p>We will only contact you from the verified TurantX WhatsApp Business account. Please ignore messages from personal numbers.</p>
              </div>
            </div>

            <div className="trust-strip is-success">
              <span className="trust-strip-icon" aria-hidden>{Icon.shield}</span>
              <div className="trust-strip-text">
                <strong>Verified travellers only</strong>
                <p>Every traveller on TurantX is manually verified using PAN, government ID, and flight details.</p>
              </div>
            </div>
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
                <span className="label">Name</span>
                <span className="value">{summary.firstName} {summary.lastName}</span>
              </div>
              <div className="summary-row">
                <span className="label">Route</span>
                <span className="value">{summary.fromCity} → {summary.toCity}</span>
              </div>
              <div className="summary-row">
                <span className="label">Airline</span>
                <span className="value">{summary.airline || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Travel date</span>
                <span className="value">{summary.travelDate || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Departure time</span>
                <span className="value">{summary.departureTime || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Baggage space</span>
                <span className="value">{summary.baggageSpace ? `${summary.baggageSpace} kg` : "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Space in</span>
                <span className="value">{summary.spaceAvailable || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Can carry</span>
                <span className="value">{summary.carryType || "—"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          title="Confirm Delivery"
          message="Are you sure the receiver has physically collected the item? This action cannot be undone."
          confirmText="Yes, confirm delivery"
          cancelText="Go back"
          loading={lmLoading}
          variant="primary"
          onConfirm={confirmDelivery}
          onCancel={() => { setShowConfirmModal(false); setSliderX(0); }}
        />
      )}
    </div>
  );
}
