import { useState } from "react";
import "./RequestTimeline.css";

export default function RequestTimeline({ currentStep = 1 }) {
  const [expanded, setExpanded] = useState(false);

  const steps = [
    "Details Submitted",
    "Verification Ongoing",
    "Added to Waitlist",
    "Searching for Match",
    "Match Confirmed",
    "In Progress",
    "Completed",
  ];

  const activeLabel = steps[Math.min(currentStep - 1, steps.length - 1)] || steps[0];
  const doneCount = Math.min(currentStep - 1, steps.length);

  return (
    <div className="timeline-card">
      <button
        className="timeline-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="timeline-summary">
          <div className="dot active">⏳</div>
          <div className="timeline-summary-text">
            <span className="timeline-current-step">{activeLabel}</span>
            <span className="timeline-step-count">{doneCount} of {steps.length} steps done</span>
          </div>
        </div>
        <svg
          className={`timeline-chevron${expanded ? " is-open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`timeline-collapse${expanded ? " is-open" : ""}`}>
        <div className="timeline-inner">
          <div className="timeline">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const done = stepNumber < currentStep;
              const active = stepNumber === currentStep;
              return (
                <div key={index} className="timeline-item">
                  <div className={`dot${done ? " done" : active ? " active" : ""}`}>
                    {done ? "✓" : active ? "⏳" : ""}
                  </div>
                  <span className={`label${done ? " done" : active ? " active" : ""}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
