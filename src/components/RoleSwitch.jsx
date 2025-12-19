import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSwitch.css";

export default function RoleSwitch({ phoneNumber }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(
    localStorage.getItem("ACTIVE_ROLE") || "TRAVELER"
  );

  useEffect(() => {
    localStorage.setItem("ACTIVE_ROLE", role);
  }, [role]);

  const toggleRole = () => {
    if (role === "TRAVELER") {
      setRole("SENDER");

      // 👉 Sender flow start
      navigate("/from-address", {
        state: { phoneNumber },
      });
    } else {
      setRole("TRAVELER");

      // 👉 Traveler profile
      navigate("/traveler-profile", {
        state: { phoneNumber },
      });
    }
  };

  return (
    <div className="role-switch" onClick={toggleRole}>
      <div className={`switch-thumb ${role === "SENDER" ? "right" : ""}`} />
      <span className="label left">Traveler</span>
      <span className="label right">Sender</span>
    </div>
  );
}
