import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./FlightDetails.css";
import "./ItemDetails.css";
import Loader from "./Loader";
import StepIndicator from "./StepIndicator";
import { showToast } from "./Toast";
import FormActionBar from "./FormActionBar";

/* ── Inline SVG icon set ── */
const Icon = {
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 17h14M3 17V11l2-6h14l2 6v6"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
};

/* ── helpers ── */
const todayISO = () => new Date().toISOString().split("T")[0];
const oneYearOutISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
};
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const formatPrettyDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};
const formatPrettyTime = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

/* ── per-field validators ── */
const validators = {
  senderName: (v) => (!v.trim() ? "Full name is required" : v.trim().length < 2 ? "Too short" : ""),
  phone:      (v) => (!v ? "Mobile number is required" : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit mobile" : ""),
  sendingDate:(v) => {
    if (!v) return "Sending date is required";
    if (v < todayISO()) return "Date cannot be in the past";
    if (v > oneYearOutISO()) return "Date too far ahead";
    return "";
  },
  lastDropTime: (v) => (!v ? "Pick a handover time" : ""),
  itemName:     (v) => (!v.trim() ? "Document type is required" : ""),
  weightGrams:  (v) => {
    if (!v) return "Weight is required";
    const n = Number(v);
    if (isNaN(n) || n <= 0) return "Enter a valid weight";
    if (n > 10000) return "Up to 10,000 g";
    return "";
  },
  instructions: () => "",
};

export default function ItemDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const from = state?.from;
  const to = state?.to;
  const distance = state?.distance || "";
  const panDetails = state?.panDetails || {};

  useEffect(() => {
    const role = localStorage.getItem("USER_ROLE");
    if (role !== "SENDER") navigate("/login", { replace: true });
  }, [navigate]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const fieldRefs = useRef({});

  const [item, setItem] = useState(() => {
    try {
      const saved = sessionStorage.getItem("itemDetailsForm");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      senderName: "",
      phone: localStorage.getItem("PHONE_NUMBER") || "",
      sendingDate: tomorrowISO(),
      lastDropTime: "",
      itemName: "",
      weightGrams: "",
      instructions: "",
    };
  });

  /* Persist draft */
  useEffect(() => {
    sessionStorage.setItem("itemDetailsForm", JSON.stringify(item));
  }, [item]);

  /* ── change / blur handlers ── */
  const handleChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    if (name === "weightGrams" && value !== "" && Number(value) < 0) return;

    setItem((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const fn = validators[name];
      if (fn) setErrors((prev) => ({ ...prev, [name]: fn(value, { ...item, [name]: value }) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fn = validators[name];
    if (fn) setErrors((prev) => ({ ...prev, [name]: fn(value, item) }));
  };

  const validateAll = useCallback(() => {
    const next = {};
    Object.keys(validators).forEach((key) => {
      const err = validators[key](item[key] || "", item);
      if (err) next[key] = err;
    });
    return next;
  }, [item]);

  const hasValue = (name) => {
    const v = item[name];
    if (typeof v === "string") return v.trim().length > 0;
    return !!v;
  };
  const fieldError = (name) => {
    if (!touched[name]) return null;
    if (!errors[name]) return null;
    if (!hasValue(name)) return null;
    return errors[name];
  };
  const fieldClass = (name) => {
    const err = fieldError(name);
    const filled = hasValue(name);
    return `fd-input${err ? " is-error" : ""}${filled && !err ? " is-filled" : ""}`;
  };
  const setRef = (name) => (el) => { fieldRefs.current[name] = el; };

  const handleSubmit = async () => {
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      const order = ["senderName", "phone", "sendingDate", "lastDropTime", "itemName", "weightGrams"];
      const first = order.find((k) => errs[k]);
      if (first) {
        const friendly = {
          senderName:   "Please enter your full name",
          phone:        errs.phone === "Mobile number is required" ? "Please enter your mobile number" : errs.phone,
          sendingDate:  errs.sendingDate === "Sending date is required" ? "Please pick a sending date" : errs.sendingDate,
          lastDropTime: "Please pick a handover time",
          itemName:     "Please enter the document type",
          weightGrams:  errs.weightGrams === "Weight is required" ? "Please enter weight (in grams)" : errs.weightGrams,
        };
        showToast(friendly[first] || errs[first], "warning");
        const el = fieldRefs.current[first];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.focus?.(), 350);
        }
      }
      return;
    }

    localStorage.setItem("PHONE_NUMBER", item.phone);
    await submitData(item.phone);
  };

  const submitData = async (phone) => {
    const grams = parseInt(item.weightGrams || "0", 10);
    setLoading(true);
    try {
      const payload = {
        phoneNumber: phone,
        userType: "SENDER",
        from, to, distance, panDetails,
        itemDetails: {
          senderName: item.senderName,
          sendingDate: item.sendingDate,
          lastDropTime: item.lastDropTime,
          itemName: item.itemName,
          weightGrams: item.weightGrams,
          instructions: item.instructions,
          deliveryOption: "SELF_DROP_PICK",
          totalWeight: grams >= 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams}g`,
          weightKg: Math.floor(grams / 1000).toString(),
          weightGram: (grams % 1000).toString(),
        },
      };
      const res = await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/saveUserData",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      sessionStorage.removeItem("itemDetailsForm");
      navigate("/sender-waitlist", { state: { phoneNumber: phone } });
    } catch (err) {
      console.error("Error saving sender:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fd-page">
      {loading && <Loader />}

      <div className="fd-card">
        <StepIndicator current={3} total={3} label="Document details" />
        <h2 className="fd-title">
          <span className="fd-title-icon" aria-hidden>{Icon.doc}</span>
          Tell us about your document
        </h2>
        <p className="fd-subtitle">Just a few quick details and you're all set.</p>

        <form className="fd-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>

          {/* ── YOU ── */}
          <div className="fd-section">
            <div className="fd-field">
              <label className="fd-label" htmlFor="senderName">Full name <span className="fd-req">*</span></label>
              <input
                id="senderName" name="senderName" type="text"
                ref={setRef("senderName")}
                value={item.senderName}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
                autoCapitalize="words"
                className={fieldClass("senderName")}
              />
              {fieldError("senderName") && <span className="fd-error">{fieldError("senderName")}</span>}
            </div>

            <div className="fd-field">
              <label className="fd-label" htmlFor="phone">Mobile number <span className="fd-req">*</span></label>
              <div className="fd-input-prefix">
                <span className="fd-prefix" aria-hidden>+91</span>
                <input
                  id="phone" name="phone" type="tel"
                  ref={setRef("phone")}
                  value={item.phone}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  className={`${fieldClass("phone")} fd-input--prefixed`}
                />
              </div>
              {fieldError("phone")
                ? <span className="fd-error">{fieldError("phone")}</span>
                : <span className="fd-hint"><span className="fd-hint-icon" aria-hidden>{Icon.shield}</span>We'll WhatsApp your match here. Never shared.</span>}
            </div>
          </div>

          {/* ── WHEN ── */}
          <div className="fd-section">
            <div className="fd-row fd-row-2">
              <div className="fd-field">
                <label className="fd-label" htmlFor="sendingDate">Sending date <span className="fd-req">*</span></label>
                <input
                  id="sendingDate" type="date" name="sendingDate"
                  ref={setRef("sendingDate")}
                  min={todayISO()} max={oneYearOutISO()}
                  value={item.sendingDate}
                  onChange={handleChange} onBlur={handleBlur}
                  className={fieldClass("sendingDate")}
                />
                {fieldError("sendingDate")
                  ? <span className="fd-error">{fieldError("sendingDate")}</span>
                  : item.sendingDate && <span className="fd-hint">{formatPrettyDate(item.sendingDate)}</span>}
              </div>
              <div className="fd-field">
                <label className="fd-label" htmlFor="lastDropTime">Latest handover <span className="fd-req">*</span></label>
                <input
                  id="lastDropTime" type="time" name="lastDropTime" step="900"
                  ref={setRef("lastDropTime")}
                  value={item.lastDropTime}
                  onChange={handleChange} onBlur={handleBlur}
                  className={fieldClass("lastDropTime")}
                />
                {fieldError("lastDropTime")
                  ? <span className="fd-error">{fieldError("lastDropTime")}</span>
                  : item.lastDropTime && <span className="fd-hint">{formatPrettyTime(item.lastDropTime)}</span>}
              </div>
            </div>
          </div>

          {/* ── DOCUMENT ── */}
          <div className="fd-section">
            <div className="fd-field">
              <label className="fd-label" htmlFor="itemName">Document type <span className="fd-req">*</span></label>
              <input
                id="itemName" name="itemName" type="text"
                ref={setRef("itemName")}
                value={item.itemName}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. Agreement, Application, Certificate"
                autoCapitalize="words"
                className={fieldClass("itemName")}
              />
              {fieldError("itemName") && <span className="fd-error">{fieldError("itemName")}</span>}
            </div>

            <div className="fd-field">
              <label className="fd-label" htmlFor="weightGrams">Weight (grams) <span className="fd-req">*</span></label>
              <input
                id="weightGrams" type="number" name="weightGrams"
                ref={setRef("weightGrams")}
                min="1" max="10000" step="1"
                inputMode="numeric" pattern="[0-9]*"
                value={item.weightGrams}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. 200"
                className={fieldClass("weightGrams")}
              />
              {fieldError("weightGrams") && <span className="fd-error">{fieldError("weightGrams")}</span>}
            </div>
          </div>

          {/* ── DELIVERY MODE INFO ── */}
          <div className="it-info-strip">
            <span className="it-info-icon" aria-hidden>{Icon.car}</span>
            <span className="it-info-text">
              <strong>Self drop &amp; pick</strong>
              <span className="it-info-sub">You arrange drop-off to traveler · receiver picks up at destination.</span>
            </span>
          </div>

          {/* ── NOTES (optional, collapsed by default) ── */}
          <div className={`fd-section fd-section--collapsible${notesOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="fd-collapse-toggle"
              onClick={() => setNotesOpen((v) => !v)}
              aria-expanded={notesOpen}
              aria-controls="it-notes-fields"
            >
              <span className="fd-collapse-label">
                <span className="fd-collapse-plus" aria-hidden>{notesOpen ? "−" : "+"}</span>
                {notesOpen ? "Special instructions" : "Add special instructions"}
                <span className="fd-collapse-meta">optional</span>
              </span>
              <span className="fd-collapse-chevron" aria-hidden>▾</span>
            </button>
            <div id="it-notes-fields" className="fd-collapse-body">
              <div className="fd-field">
                <label className="fd-label" htmlFor="instructions">Notes for the traveler</label>
                <textarea
                  id="instructions" name="instructions"
                  value={item.instructions}
                  onChange={handleChange}
                  placeholder="Any special handling instructions…"
                  rows={3}
                  className={fieldClass("instructions")}
                />
              </div>
            </div>
          </div>

          {/* ── TRUST + WHAT NEXT ── */}
          <div className="fd-trust-row">
            <span className="fd-trust-icon" aria-hidden>{Icon.shield}</span>
            <span>
              <strong>Pilot offer:</strong> first 100 deliveries at no cost. We'll WhatsApp you the moment a match is found.
            </span>
          </div>

          {/* Desktop inline actions — hidden on mobile (FormActionBar replaces) */}
          <div className="fd-actions">
            <button
              type="button"
              className="fd-btn fd-btn--ghost"
              onClick={() => navigate("/login")}
            >
              ← Back
            </button>
            <button type="submit" className="fd-btn fd-btn--primary">
              Continue →
            </button>
          </div>
        </form>
      </div>

      <FormActionBar
        onBack={() => navigate("/login")}
        onContinue={handleSubmit}
        continueLabel="Continue"
      />
    </div>
  );
}
