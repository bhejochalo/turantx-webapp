import React from "react";
import "./StepIndicator.css";

export default function StepIndicator({ current, total, label }) {
  return (
    <div className="step-indicator">
      <div className="step-dots">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`step-dot ${i < current - 1 ? "done" : ""} ${i === current - 1 ? "active" : ""}`}
          />
        ))}
      </div>
      <p className="step-label">Step {current} of {total}{label ? ` — ${label}` : ""}</p>
    </div>
  );
}
