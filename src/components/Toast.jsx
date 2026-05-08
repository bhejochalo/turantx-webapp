import React, { useEffect, useState } from "react";
import "./Toast.css";

let toastQueue = [];
let setToastState = null;

export function showToast(message, type = "info", duration = 3500) {
  const id = Date.now() + Math.random();
  const toast = { id, message, type, duration };
  toastQueue = [...toastQueue, toast];
  if (setToastState) setToastState([...toastQueue]);

  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    if (setToastState) setToastState([...toastQueue]);
  }, duration);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastState = setToasts;
    return () => { setToastState = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "!" : "i"}
          </span>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => {
              toastQueue = toastQueue.filter((x) => x.id !== t.id);
              setToasts([...toastQueue]);
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
