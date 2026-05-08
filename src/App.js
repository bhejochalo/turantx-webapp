import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ToastContainer from "./components/Toast";
import LandingPage from "./components/LandingPage";
import LandingPage2 from "./components/LandingPage2";
import AddressSelection from "./components/AddressSelection";
import FromAddress from "./components/FromAddress";
import ToAddress from "./components/ToAddress";
import FlightDetails from "./components/FlightDetails";
import PanVerification from "./components/PanVerification";
import ItemDetails from "./components/ItemDetails";
import TravelerList from "./components/TravelerList";
import LogoAnimation from "./components/LogoAnimation";
import TravelerProfile from "./components/TravelerProfile";
import SenderProfile from "./components/SenderProfile";
import TravelerWaitlist from "./components/TravelerWaitlist";
import SenderWaitlist from "./components/SenderWaitlist";
import AppLayout from "./components/AppLayout";
import InfoPage from "./components/InfoPage";
import Dashboard from "./components/Dashboard";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import ConfirmPage from "./components/ConfirmPage";
import DemoPage from "./components/DemoPage";
import Loader from "./components/Loader";

function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LogoAnimation onFinish={() => (window.location.href = "/login")} />} />
          <Route path="/intro" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/v2" element={<LandingPage2 />} />
          <Route path="/selection" element={<AddressSelection />} />
          <Route path="/address-selection" element={<AddressSelection />} />
          <Route path="/from-address" element={<FromAddress />} />
          <Route path="/to-address" element={<ToAddress />} />
          <Route path="/flight-details" element={<FlightDetails />} />
          <Route path="/loader-preview" element={<Loader />} />
          <Route path="/pan-verification" element={<PanVerification />} />
          <Route path="/item-details" element={<ItemDetails />} />
          <Route path="/traveler-list" element={<TravelerList />} />
          <Route path="/traveler-profile" element={<TravelerProfile />} />
          <Route path="/sender-profile" element={<SenderProfile />} />
          <Route path="/traveler-waitlist" element={<TravelerWaitlist />} />
          <Route path="/sender-waitlist" element={<SenderWaitlist />} />
          <Route path="/info/:type" element={<InfoPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/confirm/:token" element={<ConfirmPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>

    </>
  );
}

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <AppRoutes />
    </Router>
  );
}
