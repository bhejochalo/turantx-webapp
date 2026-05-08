import "./FormActionBar.css";

/**
 * FormActionBar — mobile-only bottom action bar for form pages.
 * Replaces MobileBottomNav contextually with [Back] [Continue].
 *
 * Props:
 *  - onBack:    () => void      (left button)
 *  - onContinue: () => void     (primary button)
 *  - continueLabel?: string     (default "Continue")
 *  - backLabel?:    string      (default "Back")
 *  - disabled?:     boolean     (greys out continue)
 */
export default function FormActionBar({
  onBack,
  onContinue,
  continueLabel = "Continue",
  backLabel = "Back",
  disabled = false,
}) {
  return (
    <div className="fab-wrap" role="toolbar" aria-label="Form actions">
      <button
        type="button"
        className="fab-btn fab-btn--ghost"
        onClick={onBack}
        aria-label={backLabel}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{backLabel}</span>
      </button>
      <button
        type="button"
        className="fab-btn fab-btn--primary"
        onClick={onContinue}
        disabled={disabled}
      >
        <span>{continueLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
