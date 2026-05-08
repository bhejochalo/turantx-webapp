import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, loading = false, variant = "primary" }) {
  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cm-icon">
          {variant === "danger" ? "⚠️" : "✈️"}
        </div>
        <h3 className="cm-title">{title}</h3>
        <p className="cm-message">{message}</p>
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button className={`cm-btn cm-confirm cm-${variant}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Verifying..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
