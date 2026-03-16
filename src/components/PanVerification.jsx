import AddressSelection from "./AddressSelection";
import { useLocation } from "react-router-dom";

export default function PanVerification() {
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
  const userType = "SENDER";

  return (
    <AddressSelection
      phoneNumber={phoneNumber}
      userType={userType}
    />
  );
}
