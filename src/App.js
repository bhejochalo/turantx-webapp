import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import IntroPage from "./components/IntroPage";
import LandingPage from "./components/LandingPage";
import OtpPage from "./components/OtpPage";
import SelectionPage from "./components/SelectionPage";
import AddressSelection from "./components/AddressSelection";
import FromAddress from "./components/FromAddress";
import ToAddress from "./components/ToAddress";
import PnrCheck from "./components/PnrCheck";
import FlightDetails from "./components/FlightDetails";
import PanVerification from "./components/PanVerification";
import ItemDetails from "./components/ItemDetails";
import TravelerList from "./components/TravelerList";
import HelpSupport from "./components/HelpSupport";
import LogoAnimation from "./components/LogoAnimation";

function AppRoutes() {
  const location = useLocation();

  // Hide HelpSupport on intro & logo animation pages
  const hideHelp =
    location.pathname === "/" || location.pathname === "/intro";

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LogoAnimation onFinish={() => (window.location.href = "/intro")} />}
        />
         <Route path="/intro" element={<IntroPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/address-selection" element={<AddressSelection />} />
        <Route path="/from-address" element={<FromAddress />} />
        <Route path="/to-address" element={<ToAddress />} />
        <Route path="/flight-details" element={<FlightDetails />} />
        <Route path="/pan-verification" element={<PanVerification />} />
        <Route path="/item-details" element={<ItemDetails />} />
        <Route path="/traveler-list" element={<TravelerList />} />
      </Routes>

      {/* ✅ Show Help only after login */}
      {!hideHelp && <HelpSupport />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
