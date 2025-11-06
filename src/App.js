import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import IntroPage from "./components/IntroPage";
import LandingPage from "./components/LandingPage";
import OtpPage from "./components/OtpPage";
import SelectionPage from "./components/SelectionPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* First Screen */}
        <Route path="/" element={<IntroPage />} />

        {/* Landing / Phone Input */}
        <Route path="/login" element={<LandingPage />} />

        {/* OTP Page */}
        <Route path="/otp" element={<OtpPage />} />

        {/* Sender / Traveler Choose Page */}
        <Route path="/selection" element={<SelectionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
