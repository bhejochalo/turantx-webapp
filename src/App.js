import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import IntroPage from "./components/IntroPage";
import LandingPage from "./components/LandingPage";
import OtpPage from "./components/OtpPage";
import SelectionPage from "./components/SelectionPage";
import AutoCompleteAddress from "./components/AutoCompleteAddress";

function App() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<IntroPage />} />
  <Route path="/login" element={<LandingPage />} />
  <Route path="/otp" element={<OtpPage />} />
  <Route path="/selection" element={<SelectionPage />} />
  <Route path="/address" element={<AutoCompleteAddress />} /> {/* ✅ new route */}
</Routes>
    </Router>
  );
}

export default App;
