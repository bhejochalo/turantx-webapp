import "./TrustStatusBox.css";

export default function TrustStatusBox({ trust = {} }) {
  const Row = ({ done, text }) => (
    <div className={`trust-row ${done ? "done" : "pending"}`}>
      <span className="icon">{done ? "✔" : "⏳"}</span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="trust-box">
      <h4>🔒 Trust & Safety Status</h4>

      <Row done={trust.phoneVerified} text="Phone number verified" />
      <Row done={trust.panVerified} text="PAN verified" />
      <Row done={trust.paymentVerified} text="Payment secured via Razorpay" />
      <Row done={trust.manualReviewDone} text="Manual review by TurantX team" />
      <Row done={trust.travelerMatched} text="Traveller verification completed" />
    </div>
  );
}
