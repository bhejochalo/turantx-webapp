import React, { useState } from "react";
import Tesseract from "tesseract.js";
import "./PanVerification.css";
import Loader from "./Loader";

export default function PanVerification() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setOcrText("");
      setVerified(false);
      setProgress(0);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      alert("Please upload a PAN card image first.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setOcrText("");

    try {
      const result = await Tesseract.recognize(selectedImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      setOcrText(text);

      // ✅ Simple validation — looks for "INCOME TAX" and PAN-like pattern
      const panRegex = /([A-Z]{5}[0-9]{4}[A-Z]{1})/;
      const found = text.match(panRegex);

      if (found) {
        setVerified(true);
        alert(`✅ PAN Verified: ${found[0]}`);
      } else {
        alert("❌ Could not detect a valid PAN number. Please try again.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      alert("Something went wrong during scanning.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pan-container page-transition">
      {loading && <Loader />}

      <div className="pan-card">
        <h2 className="pan-title">PAN Card Verification 🧾</h2>

        <label className="upload-label">
          Upload PAN Card Image
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>

        {selectedImage && (
          <div className="preview-section">
            <img src={selectedImage} alt="PAN Preview" className="preview-img" />
          </div>
        )}

        {/* Progress bar */}
        {loading && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }} />
            <p>Scanning PAN... {progress}%</p>
          </div>
        )}

        {!loading && selectedImage && (
          <button className="scan-btn" onClick={handleScan}>
            Start Scanning
          </button>
        )}

        {ocrText && (
          <div className="ocr-output">
            <h4>Extracted Text:</h4>
            <pre>{ocrText}</pre>
          </div>
        )}

        {verified && (
          <div className="verified-box">
            <span>✅ Verified Successfully</span>
          </div>
        )}
      </div>
    </div>
  );
}
