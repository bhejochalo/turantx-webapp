// TravelerProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "../firebase"; // make sure this exports Firestore (modular)
import "./TravelerProfile.css";
import RoleSwitch from "./RoleSwitch";

export default function TravelerProfile({ location }) {
  // Try router state first (if using react-router navigation), fallback to localStorage
  const routeState = (location && location.state) || {};
  const routePhone = routeState.phoneNumber;
  const [phoneNumber, setPhoneNumber] = useState(
    routePhone || localStorage.getItem("PHONE_NUMBER") || ""
  );

  const [loading, setLoading] = useState(true);
  const [traveler, setTraveler] = useState(null);
  const [sender, setSender] = useState(null);
  const [borzoOrder, setBorzoOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("status"); // 'status' | 'sender'
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editingAddressType, setEditingAddressType] = useState("fromAddress");
  const [addressForm, setAddressForm] = useState({});
  const [showEditFlightModal, setShowEditFlightModal] = useState(false);
  const [flightForm, setFlightForm] = useState({});
  const [sliderValue, setSliderValue] = useState(0);
  const [isProcessingSlider, setIsProcessingSlider] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const mounted = useRef(true);

  // helper: traveler doc ref path
  const travelerDocRef = phoneNumber
    ? doc(db, "users", phoneNumber, "Traveler", "details")
    : null;

  useEffect(() => {
    mounted.current = true;
    if (!phoneNumber) {
      setLoading(false);
      setStatusMessage("Not logged in (phone missing).");
      return;
    }
    loadAll();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  async function loadAll() {
    setLoading(true);
    setStatusMessage("");
    try {
      await fetchTraveler();
    } catch (e) {
      console.error("loadAll error:", e);
      if (mounted.current) setStatusMessage("Failed to load data.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  async function fetchTraveler() {
    if (!travelerDocRef) {
      console.warn("fetchTraveler: no phoneNumber set");
      setTraveler(null);
      return;
    }

    try {
      const snap = await getDoc(travelerDocRef);
      if (!snap.exists()) {
        console.warn("No traveler details doc found at users/{phone}/Traveler/details");
        setTraveler(null);
        setStatusMessage("No traveler data available.");
        setSender(null);
        setBorzoOrder(null);
        return;
      }

      const data = snap.data();
      setTraveler(data);
      setFlightForm(data.flightDetails || {});
      // if uniqueKey present, load sender & borzo order
      const uniqueKey = data.uniqueKey || data.flightDetails?.uniqueKey || "";
      if (uniqueKey) {
        await Promise.all([fetchSenderByUniqueKey(uniqueKey), fetchBorzoByUniqueKey(uniqueKey)]);
      } else {
        setSender(null);
        setBorzoOrder(null);
      }
    } catch (err) {
      console.error("Error fetching traveler:", err);
      setTraveler(null);
      setStatusMessage("Error fetching traveler.");
    }
  }

  async function fetchSenderByUniqueKey(uniqueKey) {
    try {
      const colRef = collection(db, "Sender");
      const q = query(colRef, where("uniqueKey", "==", uniqueKey), limit(1));
      const snaps = await getDocs(q);
      if (snaps.empty) {
        setSender(null);
        return;
      }
      setSender(snaps.docs[0].data());
    } catch (err) {
      console.error("fetchSender error:", err);
      setSender(null);
    }
  }

  // borzo_orders: fetch first active order for this uniqueKey
  async function fetchBorzoByUniqueKey(uniqueKey) {
    try {
      const colRef = collection(db, "borzo_orders");
      const q = query(colRef, where("uniqueKey", "==", uniqueKey), limit(5));
      const snaps = await getDocs(q);
      if (snaps.empty) {
        setBorzoOrder(null);
        return;
      }
      // find doc where order.status != 'finished' (defensive)
      let found = null;
      snaps.forEach((d) => {
        const data = d.data();
        const order = data.order || {};
        const st = order.status || data.status || "";
        if (st.toLowerCase() !== "finished" && !found) {
          found = { id: d.id, ...data };
        }
      });
      setBorzoOrder(found);
    } catch (err) {
      console.error("fetchBorzoByUniqueKey error:", err);
      setBorzoOrder(null);
    }
  }

  // ---- Address edit handling ----
  function openEditAddress(type) {
    setEditingAddressType(type);
    const current = traveler?.[type] || {};
    setAddressForm({
      houseNumber: current.houseNumber || "",
      street: current.street || "",
      area: current.area || "",
      city: current.city || "",
      state: current.state || "",
      postalCode: current.postalCode || "",
      fullAddress: current.fullAddress || "",
    });
    setShowEditAddressModal(true);
  }

  function handleAddressChange(e) {
    const { name, value } = e.target;
    setAddressForm((p) => ({ ...p, [name]: value }));
  }

  async function saveAddress() {
    if (!travelerDocRef) return alert("No traveler doc reference");
    // validate minimal
    if (!addressForm.city || !addressForm.state) {
      return alert("Please fill city and state");
    }
    const updates = {};
    const full = addressForm.fullAddress || buildFullAddress(addressForm);
    updates[`${editingAddressType}.fullAddress`] = full;
    // only set fields provided
    ["houseNumber", "street", "area", "city", "state", "postalCode"].forEach((k) => {
      if (addressForm[k] !== undefined) updates[`${editingAddressType}.${k}`] = addressForm[k];
    });

    try {
      await updateDoc(travelerDocRef, updates);
      // refresh
      await fetchTraveler();
      setShowEditAddressModal(false);
      alert("Address updated");
    } catch (err) {
      console.error("saveAddress error:", err);
      alert("Failed to save address");
    }
  }

  function buildFullAddress(a) {
    const parts = [];
    if (a.street) parts.push(a.street);
    if (a.houseNumber) parts.push(a.houseNumber);
    if (a.area) parts.push(a.area);
    if (a.city) parts.push(a.city);
    if (a.state) parts.push(a.state);
    if (a.postalCode) parts.push(a.postalCode);
    return parts.join(", ");
  }

  // ---- Flight edit handling ----
  function openEditFlight() {
    setFlightForm(traveler?.flightDetails || {});
    setShowEditFlightModal(true);
  }
  function handleFlightChange(e) {
    const { name, value, type, checked } = e.target;
    setFlightForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }
  async function saveFlightDetails() {
    if (!travelerDocRef) return alert("No traveler doc reference");
    // basic validation
    if (!flightForm.firstName || !flightForm.airline) return alert("Fill required flight fields");
    try {
      await updateDoc(travelerDocRef, { flightDetails: flightForm });
      await fetchTraveler();
      setShowEditFlightModal(false);
      alert("Flight details updated");
    } catch (err) {
      console.error("saveFlightDetails error:", err);
      alert("Failed to save flight details");
    }
  }

  // ---- Slider confirm (simulate Android slider) ----
  async function confirmArrival() {
    if (!window.confirm("If you confirm you've reached home, we will initiate the final pickup process. Continue?")) {
      setSliderValue(0);
      return;
    }
    setIsProcessingSlider(true);
    try {
      // Update statuses: SecondMileStatus -> Completed, LastMileStatus -> In Progress
      if (!travelerDocRef) throw new Error("No traveler doc");
      await updateDoc(travelerDocRef, {
        SecondMileStatus: "Completed",
        LastMileStatus: "In Progress",
      });
      // refresh
      await fetchTraveler();
      alert("Arrival confirmed. Final pickup initiated.");
    } catch (err) {
      console.error("confirmArrival error:", err);
      alert("Failed to update status");
    } finally {
      setIsProcessingSlider(false);
      setSliderValue(0);
    }
  }

  // ---- OTP verify for last mile ----
  async function verifyLastMileOtp() {
    const expected = traveler?.LastMileOTP || traveler?.LastMileOtp || traveler?.lastMileOtp || "";
    if (!otpInput) return alert("Enter OTP");
    if (otpInput === expected) {
      try {
        if (!travelerDocRef) throw new Error("No traveler doc");
        await updateDoc(travelerDocRef, {
          LastMileStatus: "Completed",
          status: "Completed",
        });
        await fetchTraveler();
        alert("OTP verified. Order completed!");
      } catch (err) {
        console.error("verifyLastMileOtp error:", err);
        alert("Failed to update final status");
      }
    } else {
      alert("Invalid OTP");
      setOtpInput("");
    }
  }

  // ---- UI helpers ----
  const renderAddressBlock = (typeLabel, typeKey) => {
    const addr = traveler?.[typeKey] || {};
    const full = addr.fullAddress || buildFullAddress(addr) || "Not specified";
    return (
      <div className="tp-address-block">
        <div className="tp-address-head">
          <strong>{typeLabel}</strong>
          <button onClick={() => openEditAddress(typeKey)} className="tp-btn small">Edit</button>
        </div>
        <div className="tp-address-text">{full}</div>
        {addr.latitude && addr.longitude && (
          <div className="tp-coords">Lat: {addr.latitude}, Lng: {addr.longitude}</div>
        )}
      </div>
    );
  };

  // ----- RENDER -----
  return (
    <div className="tp-page">
      <div className="tp-topbar">
        <h2>Traveler Profile</h2>
        <div className="tp-sub">Phone: {phoneNumber || "Not logged in"}</div>
        <div className="tp-topbar">
          {/* ROLE SWITCH */}
          <RoleSwitch phoneNumber={phoneNumber} />
        </div>
      </div>

      {loading ? (
        <div className="tp-loading">Loading…</div>
      ) : !traveler ? (
        <div className="tp-empty">
          <p>No traveler data available.</p>
          <p className="tp-note">Make sure traveler was saved as <code>users/{`<phone>`}/Traveler/details</code></p>
        </div>
      ) : (
        <div className="tp-content">
          {/* Addresses */}
          <section className="tp-section">
            <h3>Addresses</h3>
            <div className="tp-addresses">
              {renderAddressBlock("From (Pickup)", "fromAddress")}
              {renderAddressBlock("To (Drop)", "toAddress")}
            </div>
          </section>

          {/* Flight details */}
          <section className="tp-section">
            <div className="tp-section-header">
              <h3>Flight Details</h3>
              <button className="tp-btn" onClick={openEditFlight}>Edit Flight</button>
            </div>
            <div className="tp-flight-grid">
              <div><strong>Name:</strong> {traveler.flightDetails?.firstName || "N/A"} {traveler.flightDetails?.lastName || ""}</div>
              <div><strong>Airline:</strong> {traveler.flightDetails?.airline || "N/A"}</div>
              <div><strong>PNR:</strong> {traveler.flightDetails?.pnr || "N/A"}</div>
              <div><strong>Departure:</strong> {traveler.flightDetails?.departureTime || traveler.flightDetails?.leavingTime || "N/A"}</div>
              <div><strong>Leaving Date:</strong> {traveler.flightDetails?.travelDate || traveler.flightDetails?.leavingDate || "N/A"}</div>
              <div><strong>Available Weight:</strong> {traveler.flightDetails?.baggageSpace || traveler.flightDetails?.weightUpto || "0"} kg</div>
              <div><strong>Carry Type:</strong> {traveler.flightDetails?.carryType || "N/A"}</div>
              <div><strong>Remarks:</strong> {traveler.flightDetails?.remarks || "None"}</div>
            </div>
          </section>

          {/* Tabs: Status / Sender */}
          <section className="tp-section">
            <div className="tp-tabs">
              <button className={activeTab === "status" ? "active" : ""} onClick={() => setActiveTab("status")}>Status</button>
              <button className={activeTab === "sender" ? "active" : ""} onClick={() => setActiveTab("sender")}>Sender</button>
            </div>

            {activeTab === "status" && (

              <div className="tp-status">

                {/* MILE LIST */}
                <div className="tp-mile-list">

                  {/* FIRST MILE */}
                  <div className="tp-mile-row">
                    <div className="tp-mile-left">
                      <strong>First Mile</strong>
                      <span className="tp-mile-status">
                        {traveler.FirstMileStatus || "Not started"}
                      </span>
                    </div>

                    {/* ACTUAL OTP (DISPLAY ONLY) */}
                    {traveler.FirstMileOTP && (
                      <div className="tp-mile-right">
                        <span className="tp-otp-badge">
                          OTP: {traveler.FirstMileOTP}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SECOND MILE */}
                  <div className="tp-mile-row">
                    <div className="tp-mile-left">
                      <strong>Second Mile</strong>
                      <span className="tp-mile-status">
                        {traveler.SecondMileStatus || "Not started"}
                      </span>
                    </div>
                  </div>

                  {/* LAST MILE */}
                  <div className="tp-mile-row">
                    <div className="tp-mile-left">
                      <strong>Last Mile</strong>
                      <span className="tp-mile-status">
                        {traveler.LastMileStatus || "Not started"}
                      </span>
                    </div>

                    {traveler.LastMileStatus !== "Completed" && (
                      <div className="tp-mile-right">
                        <input
                          className="tp-mile-input"
                          placeholder="Enter OTP"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                        />
                        <button
                          className="tp-btn small"
                          onClick={verifyLastMileOtp}
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                <div className={`tp-slide-confirm ${isProcessingSlider ? "processing" : ""}`}>
                  <span className="tp-slide-text">
                    {isProcessingSlider ? "Initiating Pickup..." : "Slide to Initiate Pickup"}
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    disabled={isProcessingSlider}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSliderValue(v);
                      if (v === 100 && !isProcessingSlider) {
                        confirmArrival(); // SAME FUNCTION
                      }
                    }}
                  />
                </div>


                {/* BORZO ORDER (UNCHANGED) */}
                <div className="tp-borzo">
                  <h4>Borzo Order</h4>
                  {borzoOrder ? (
                    <>
                      <div><strong>ID:</strong> {borzoOrder.id}</div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {(borzoOrder.order && borzoOrder.order.status) || borzoOrder.status}
                      </div>
                      {borzoOrder.order?.tracking_url && (
                        <a
                          href={borzoOrder.order.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Tracking
                        </a>
                      )}
                    </>
                  ) : (
                    <div>No active order found</div>
                  )}
                </div>

              </div>
            )}

            {activeTab === "sender" && (
              <div className="tp-sender">
                {sender ? (
                  <>
                    <div><strong>Sender Phone:</strong> {sender.phoneNumber || "N/A"}</div>
                    <div><strong>From:</strong> {sender.fromAddress?.fullAddress || "N/A"}</div>
                    <div><strong>To:</strong> {sender.toAddress?.fullAddress || "N/A"}</div>
                    <div><strong>Item:</strong> {sender.itemDetails?.itemName || "N/A"}</div>
                    <div><strong>Verified:</strong> {sender.isVerified ? "Yes" : "No"}</div>
                  </>
                ) : (
                  <div>No sender details found.</div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {showEditAddressModal && (
        <div className="tp-modal">
          <div className="tp-modal-card">
            <h4>Edit {editingAddressType === "fromAddress" ? "From" : "To"} Address</h4>
            <input name="street" placeholder="Street" value={addressForm.street || ""} onChange={handleAddressChange} />
            <input name="houseNumber" placeholder="House/Flat" value={addressForm.houseNumber || ""} onChange={handleAddressChange} />
            <input name="area" placeholder="Area / Landmark" value={addressForm.area || ""} onChange={handleAddressChange} />
            <input name="city" placeholder="City" value={addressForm.city || ""} onChange={handleAddressChange} />
            <input name="state" placeholder="State" value={addressForm.state || ""} onChange={handleAddressChange} />
            <input name="postalCode" placeholder="Postal Code" value={addressForm.postalCode || ""} onChange={handleAddressChange} />
            <div className="tp-modal-actions">
              <button onClick={() => setShowEditAddressModal(false)} className="tp-btn">Cancel</button>
              <button onClick={saveAddress} className="tp-btn primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditFlightModal && (
        <div className="tp-modal">
          <div className="tp-modal-card">
            <h4>Edit Flight Details</h4>
            <input name="firstName" placeholder="First name" value={flightForm.firstName || ""} onChange={handleFlightChange} />
            <input name="lastName" placeholder="Last name" value={flightForm.lastName || ""} onChange={handleFlightChange} />
            <input name="airline" placeholder="Airline" value={flightForm.airline || ""} onChange={handleFlightChange} />
            <input type="date" name="travelDate" value={flightForm.travelDate || ""} onChange={handleFlightChange} />
            <input type="time" name="departureTime" value={flightForm.departureTime || ""} onChange={handleFlightChange} />
            <input name="baggageSpace" placeholder="Baggage space (kg)" value={flightForm.baggageSpace || ""} onChange={handleFlightChange} />
            <input name="pnr" placeholder="PNR" value={flightForm.pnr || ""} onChange={handleFlightChange} />
            <textarea name="remarks" placeholder="Remarks" value={flightForm.remarks || ""} onChange={handleFlightChange} />
            <div className="tp-modal-actions">
              <button onClick={() => setShowEditFlightModal(false)} className="tp-btn">Cancel</button>
              <button onClick={saveFlightDetails} className="tp-btn primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
