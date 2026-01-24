import React from "react";
import "./RequestTimeline.css";

export default function RequestTimeline({ currentStep = 1 }) {
  const steps = [
    "Details Submitted",
    "Verification Ongoing",
    "Added to Waitlist",
    "Searching for Match",
    "We’ll notify you on WhatsApp",
  ];

  return (
    <div className="timeline-card">
      <h3 className="timeline-title">Request Status</h3>

      <div className="timeline">
        {steps.map((step, index) => {
          const stepNumber = index + 1;

          const done = stepNumber < currentStep;
          const active = stepNumber === currentStep;

          return (
            <div key={index} className="timeline-item">
              <div
                className={`dot ${
                  done ? "done" : active ? "active" : ""
                }`}
              >
                {done ? "✓" : active ? "⏳" : ""}
              </div>

              <span
                className={`label ${
                  done ? "done" : active ? "active" : ""
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
