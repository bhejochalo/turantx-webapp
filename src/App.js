import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/address-selection" element={<AddressSelection />} /> {/* ✅ added */}
        <Route path="/from-address" element={<FromAddress />} />
        <Route path="/to-address" element={<ToAddress />} />
        <Route path="/flight-details" element={<FlightDetails />} />
        <Route path="/pan-verification" element={<PanVerification />} />
        <Route path="/item-details" element={<ItemDetails />} />
        <Route path="/traveler-list" element={<TravelerList />} />
      </Routes>
      <HelpSupport />
    </Router>
  );
}

export default App;
