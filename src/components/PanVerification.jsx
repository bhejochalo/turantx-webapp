import React, { useState } from "react";
import Tesseract from "tesseract.js";
import "./PanVerification.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function PanVerification() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;

  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | scanning | success | failed
  const [detectedPAN, setDetectedPAN] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setOcrText("");
      setProgress(0);
      setStatus("idle");
      setDetectedPAN("");
    }
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setStatus("scanning");
    setProgress(0);
    setOcrText("");
    setDetectedPAN("");

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

      const panRegex = /([A-Z]{5}[0-9]{4}[A-Z]{1})/;
      const found = text.match(panRegex);

      if (found) {
        setDetectedPAN(found[0]);
        setStatus("success");
      } else {
        setStatus("failed");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setStatus("failed");
    }
  };

  const handleNext = () => {
    const panDetails = { verified: true, panNumber: detectedPAN };
    navigate("/address-selection", { state: { phoneNumber, userType: "SENDER", panDetails } });
  };

  return (
    <div className="pan-container page-transition">
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

        {/* Progress Bar */}
        {status === "scanning" && (
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div className="progress" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">Scanning PAN... {progress}%</p>
          </div>
        )}

        {status === "idle" && selectedImage && (
          <button className="scan-btn" onClick={handleScan}>
            Start Scanning
          </button>
        )}

        {/* ✅ Verified / ❌ Failed Status */}
        {status === "success" && (
          <div className="result-box success">
            <h3>✅ PAN Verified Successfully</h3>
            <p><strong>PAN Number:</strong> {detectedPAN}</p>

            {/* ✅ Continue button appears after success */}
            <button className="next-btn" onClick={handleNext}>
              Continue →
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="result-box failed">
            <h3>❌ Verification Failed</h3>
            <p>Could not detect a valid PAN number. Please try again with a clearer image.</p>
          </div>
        )}

        {ocrText && (
          <div className="ocr-output">
            <h4>Extracted Text (Preview):</h4>
            <pre>{ocrText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
