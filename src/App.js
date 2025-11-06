import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import OtpPage from "./components/OtpPage";
import SelectionPage from "./components/SelectionPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/selection" element={<SelectionPage />} />

      </Routes>
    </Router>
  );
}

export default App;
