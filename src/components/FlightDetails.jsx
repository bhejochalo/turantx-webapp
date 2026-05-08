import { useState, useRef, useEffect, useCallback } from "react";
import "./FlightDetails.css";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";
import StepIndicator from "./StepIndicator";
import { showToast } from "./Toast";
import FormActionBar from "./FormActionBar";

/* ── Inline SVG icon set (replaces all emoji) ── */
const Icon = {
  plane: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const AIRLINES = [
  "IndiGo", "Air India", "Air India Express", "Akasa Air", "SpiceJet",
  "AIX Connect (AirAsia India)", "Star Air", "Flybig", "TruJet", "Others",
];
const SPACE_TYPES = ["All Bags", "Cabin Bag", "Luggage Bag", "Personal Bag"];

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
  firstName: (v) => (!v.trim() ? "First name is required" : v.trim().length < 2 ? "Too short" : ""),
  lastName:  (v) => (!v.trim() ? "Last name is required"  : v.trim().length < 2 ? "Too short" : ""),
  phone:     (v) => (!v ? "Mobile number is required" : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit mobile" : ""),
  travelDate:(v) => {
    if (!v) return "Travel date is required";
    if (v < todayISO()) return "Date cannot be in the past";
    if (v > oneYearOutISO()) return "Date too far ahead";
    return "";
  },
  airline:       (v) => (!v ? "Please select an airline" : ""),
  customAirline: (v, form) => (form.airline === "Others" && !v.trim() ? "Enter airline name" : ""),
  pnr:           (v) => (v && !/^[A-Z0-9]{6}$/i.test(v) ? "PNR must be 6 alphanumeric characters" : ""),
  departureTime: () => "",
  baggageSpace:  (v) => (v && Number(v) < 0 ? "Cannot be negative" : v && Number(v) > 30 ? "Up to 30 kg" : ""),
};

export default function FlightDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const from = state?.from;
  const to = state?.to;
  const distance = state?.distance || "";

  useEffect(() => {
    const role = localStorage.getItem("USER_ROLE");
    if (role !== "TRAVELER") navigate("/login", { replace: true });
  }, [navigate]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDepartureHelp, setShowDepartureHelp] = useState(false);
  const [capacityOpen, setCapacityOpen] = useState(false);

  const fieldRefs = useRef({});

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("flightDetailsForm");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      firstName: "",
      lastName: "",
      phone: localStorage.getItem("PHONE_NUMBER") || "",
      airline: "",
      customAirline: "",
      travelDate: tomorrowISO(),
      departureTime: "",
      baggageSpace: "",
      spaceAvailableWhen: "",
      remarks: "",
      checkParcel: false,
      pnr: "",
    };
  });

  /* ── persist draft ── */
  useEffect(() => {
    sessionStorage.setItem("flightDetailsForm", JSON.stringify(form));
  }, [form]);

  /* ── change handler ── */
  const handleChange = (e) => {
    const { name, type, checked } = e.target;
    let value = e.target.value;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    if (name === "pnr")   value = value.toUpperCase().slice(0, 6);
    if (name === "baggageSpace" && value !== "" && Number(value) < 0) return;

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));

    // re-validate field if it was previously touched (live error clearing)
    if (touched[name]) {
      const fn = validators[name];
      if (fn) {
        const updatedForm = { ...form, [name]: type === "checkbox" ? checked : value };
        setErrors((prev) => ({ ...prev, [name]: fn(value, updatedForm) }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fn = validators[name];
    if (fn) setErrors((prev) => ({ ...prev, [name]: fn(value, form) }));
  };

  const validateAll = useCallback(() => {
    const next = {};
    Object.keys(validators).forEach((key) => {
      const err = validators[key](form[key] || "", form);
      if (err) next[key] = err;
    });
    return next;
  }, [form]);

  const handleSubmit = async () => {
    const errs = validateAll();

    if (Object.keys(errs).length > 0) {
      // Toast-driven UX: scroll + focus the first invalid field, show a friendly toast.
      // No inline errors painted on submit — keeps the form clean.
      const order = ["firstName", "lastName", "phone", "travelDate", "departureTime", "airline", "customAirline", "pnr", "baggageSpace"];
      const first = order.find((k) => errs[k]);
      if (first) {
        const friendly = {
          firstName:     "Please enter your first name",
          lastName:      "Please enter your last name",
          phone:         errs.phone === "Mobile number is required" ? "Please enter your mobile number" : errs.phone,
          travelDate:    errs.travelDate === "Travel date is required" ? "Please pick your travel date" : errs.travelDate,
          departureTime: "Please pick a departure time",
          airline:       "Please select your airline",
          customAirline: errs.customAirline,
          pnr:           errs.pnr,
          baggageSpace:  errs.baggageSpace,
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

    localStorage.setItem("PHONE_NUMBER", form.phone);
    await submitData(form.phone);
  };

  const submitData = async (phone) => {
    setLoading(true);
    const payload = {
      phoneNumber: phone,
      userType: "TRAVELER",
      from, to, distance,
      flightDetails: {
        ...form,
        airline: form.airline === "Others" ? form.customAirline : form.airline,
      },
    };
    try {
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
      showToast("Traveler details saved successfully!", "success");
      sessionStorage.removeItem("flightDetailsForm");
      navigate("/traveler-waitlist", { state: { phoneNumber: phone } });
    } catch (err) {
      console.error("Error saving traveler:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const setRef = (name) => (el) => { fieldRefs.current[name] = el; };

  /* Inline errors are suppressed for empty fields — "required" is handled
     via toast on submit. Inline errors only surface when the user has
     typed/selected something invalid (e.g. wrong PNR format). */
  const hasValue = (name) => {
    const v = form[name];
    if (typeof v === "string") return v.trim().length > 0;
    return !!v;
  };
  const fieldError = (name) => {
    if (!touched[name]) return null;
    if (!errors[name]) return null;
    if (!hasValue(name)) return null;        // empty → no inline error
    return errors[name];
  };
  const fieldClass = (name) => {
    const err = fieldError(name);
    const filled = hasValue(name);
    return `fd-input${err ? " is-error" : ""}${filled && !err ? " is-filled" : ""}`;
  };

  return (
    <div className="fd-page">
      {loading && <Loader />}

      <div className="fd-card">
        <StepIndicator current={3} total={3} label="Flight details" />
        <h2 className="fd-title">
          <span className="fd-title-icon" aria-hidden>{Icon.plane}</span>
          Tell us about your flight
        </h2>
        <p className="fd-subtitle">Takes about 60 seconds. We'll match you with a sender on your route.</p>

        <form className="fd-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>

          {/* ───── YOU ───── */}
          <div className="fd-section">
            <div className="fd-row fd-row-2">
              <div className="fd-field">
                <label className="fd-label" htmlFor="firstName">First name <span className="fd-req">*</span></label>
                <input
                  id="firstName" name="firstName" type="text"
                  ref={setRef("firstName")}
                  value={form.firstName}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Rahul"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  className={fieldClass("firstName")}
                  aria-invalid={!!fieldError("firstName")}
                  aria-describedby="err-firstName"
                />
                {fieldError("firstName") && <span id="err-firstName" className="fd-error">{fieldError("firstName")}</span>}
              </div>
              <div className="fd-field">
                <label className="fd-label" htmlFor="lastName">Last name <span className="fd-req">*</span></label>
                <input
                  id="lastName" name="lastName" type="text"
                  ref={setRef("lastName")}
                  value={form.lastName}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Sharma"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  className={fieldClass("lastName")}
                  aria-invalid={!!fieldError("lastName")}
                  aria-describedby="err-lastName"
                />
                {fieldError("lastName") && <span id="err-lastName" className="fd-error">{fieldError("lastName")}</span>}
              </div>
            </div>

            <div className="fd-field">
              <label className="fd-label" htmlFor="phone">Mobile number <span className="fd-req">*</span></label>
              <div className="fd-input-prefix">
                <span className="fd-prefix" aria-hidden>+91</span>
                <input
                  id="phone" name="phone" type="tel"
                  ref={setRef("phone")}
                  value={form.phone}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  className={`${fieldClass("phone")} fd-input--prefixed`}
                  aria-invalid={!!fieldError("phone")}
                  aria-describedby="err-phone"
                />
              </div>
              {fieldError("phone")
                ? <span id="err-phone" className="fd-error">{fieldError("phone")}</span>
                : <span className="fd-hint"><span className="fd-hint-icon" aria-hidden>{Icon.shield}</span>We'll WhatsApp your match here. Never shared.</span>}
            </div>
          </div>

          {/* ───── FLIGHT ───── */}
          <div className="fd-section">
            <div className="fd-row fd-row-2">
              <div className="fd-field">
                <label className="fd-label" htmlFor="travelDate">Travel date <span className="fd-req">*</span></label>
                <input
                  id="travelDate" type="date" name="travelDate"
                  ref={setRef("travelDate")}
                  min={todayISO()} max={oneYearOutISO()}
                  value={form.travelDate}
                  onChange={handleChange} onBlur={handleBlur}
                  className={fieldClass("travelDate")}
                  aria-invalid={!!fieldError("travelDate")}
                  aria-describedby="err-travelDate"
                />
                {fieldError("travelDate")
                  ? <span id="err-travelDate" className="fd-error">{fieldError("travelDate")}</span>
                  : form.travelDate && <span className="fd-hint">{formatPrettyDate(form.travelDate)}</span>}
              </div>
              <div className="fd-field">
                <label className="fd-label" htmlFor="departureTime">
                  Leaving home by
                  <button type="button" className="fd-info-btn" aria-label="What does this mean?"
                    onClick={() => setShowDepartureHelp((v) => !v)}>
                    <span className="fd-info-icon">{Icon.info}</span>
                  </button>
                </label>
                <input
                  id="departureTime" type="time" name="departureTime" step="900"
                  ref={setRef("departureTime")}
                  value={form.departureTime}
                  onChange={handleChange} onBlur={handleBlur}
                  className={fieldClass("departureTime")}
                />
                {showDepartureHelp && (
                  <span className="fd-hint fd-hint--help">
                    What time will you leave home? We'll ensure the parcel reaches you before this.
                  </span>
                )}
                {!showDepartureHelp && form.departureTime && (
                  <span className="fd-hint">{formatPrettyTime(form.departureTime)}</span>
                )}
              </div>
            </div>

            <div className="fd-row fd-row-2">
              <div className="fd-field">
                <label className="fd-label" htmlFor="airline">Airline <span className="fd-req">*</span></label>
                <select
                  id="airline" name="airline"
                  ref={setRef("airline")}
                  value={form.airline}
                  onChange={handleChange} onBlur={handleBlur}
                  className={fieldClass("airline")}
                  aria-invalid={!!fieldError("airline")}
                  aria-describedby="err-airline"
                >
                  <option value="">Select airline</option>
                  {AIRLINES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {fieldError("airline") && <span id="err-airline" className="fd-error">{fieldError("airline")}</span>}
              </div>

              <div className="fd-field">
                <label className="fd-label" htmlFor="pnr">
                  PNR <span className="fd-optional">optional</span>
                </label>
                <input
                  id="pnr" name="pnr" type="text"
                  ref={setRef("pnr")}
                  value={form.pnr}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. ABC123"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={6}
                  className={fieldClass("pnr")}
                  aria-invalid={!!fieldError("pnr")}
                  aria-describedby="err-pnr"
                />
                {fieldError("pnr")
                  ? <span id="err-pnr" className="fd-error">{fieldError("pnr")}</span>
                  : <span className="fd-hint">Speeds up verification. 6 letters/digits.</span>}
              </div>
            </div>

            {form.airline === "Others" && (
              <div className="fd-field">
                <label className="fd-label" htmlFor="customAirline">Airline name <span className="fd-req">*</span></label>
                <input
                  id="customAirline" name="customAirline" type="text"
                  ref={setRef("customAirline")}
                  value={form.customAirline}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Enter airline name"
                  className={fieldClass("customAirline")}
                  aria-invalid={!!fieldError("customAirline")}
                />
                {fieldError("customAirline") && <span className="fd-error">{fieldError("customAirline")}</span>}
              </div>
            )}
          </div>

          {/* ───── CAPACITY (optional, collapsed by default on mobile) ───── */}
          <div className={`fd-section fd-section--collapsible${capacityOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="fd-collapse-toggle"
              onClick={() => setCapacityOpen((v) => !v)}
              aria-expanded={capacityOpen}
              aria-controls="fd-capacity-fields"
            >
              <span className="fd-collapse-label">
                <span className="fd-collapse-plus" aria-hidden>{capacityOpen ? "−" : "+"}</span>
                {capacityOpen ? "Capacity details" : "Add baggage capacity"}
                <span className="fd-collapse-meta">optional</span>
              </span>
              <span className="fd-collapse-chevron" aria-hidden>▾</span>
            </button>

            <div id="fd-capacity-fields" className="fd-collapse-body">
            <div className="fd-row fd-row-2">
              <div className="fd-field">
                <label className="fd-label" htmlFor="baggageSpace">Available space (kg)</label>
                <input
                  id="baggageSpace" type="number" name="baggageSpace"
                  ref={setRef("baggageSpace")}
                  min="0" max="30" step="0.5"
                  inputMode="decimal" pattern="[0-9]*"
                  value={form.baggageSpace}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. 5"
                  className={fieldClass("baggageSpace")}
                />
                {fieldError("baggageSpace") && <span className="fd-error">{fieldError("baggageSpace")}</span>}
              </div>
              <div className="fd-field">
                <label className="fd-label" htmlFor="spaceAvailableWhen">Bag type</label>
                <select
                  id="spaceAvailableWhen" name="spaceAvailableWhen"
                  value={form.spaceAvailableWhen}
                  onChange={handleChange}
                  disabled={!form.baggageSpace || Number(form.baggageSpace) === 0}
                  className={fieldClass("spaceAvailableWhen")}
                >
                  <option value="">Select bag type</option>
                  {SPACE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            </div>
          </div>

          {/* ───── NOTES + AGREEMENTS ───── */}
          <div className="fd-section">
            <div className="fd-field">
              <label className="fd-label" htmlFor="remarks">
                Remarks <span className="fd-optional">optional</span>
              </label>
              <textarea
                id="remarks" name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Any special instructions for the sender…"
                rows={3}
                className={fieldClass("remarks")}
              />
            </div>

            <label className="fd-checkbox-card">
              <input
                type="checkbox" name="checkParcel"
                checked={form.checkParcel}
                onChange={handleChange}
                className="fd-checkbox"
              />
              <span className="fd-checkbox-label">I want to check the parcel before carrying</span>
            </label>
          </div>

          {/* ───── TRUST + ACTIONS ───── */}
          <div className="fd-trust-row">
            <span className="fd-trust-icon" aria-hidden>{Icon.shield}</span>
            <span>Your data is secure. PNR is used only for flight verification — never shared.</span>
          </div>

          <div className="fd-actions">
            <button
              type="button"
              className="fd-btn fd-btn--ghost"
              onClick={() => navigate("/login")}
            >
              <span className="fd-btn-icon" aria-hidden>{Icon.back}</span>
              Back
            </button>
            <button type="submit" className="fd-btn fd-btn--primary">
              Continue
              <span className="fd-btn-icon" aria-hidden>{Icon.arrow}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mobile-only contextual action bar (replaces bottom nav) */}
      <FormActionBar
        onBack={() => navigate("/login")}
        onContinue={handleSubmit}
        continueLabel="Continue"
      />
    </div>
  );
}
