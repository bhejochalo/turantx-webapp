import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";
import AppHeader from "./AppHeader";
import MobileBottomNav from "./MobileBottomNav";

export default function AppLayout() {
  return (
    <>
      <AppHeader />
      <div className="header-spacer" />
      <Outlet />
      <AppFooter />
      <MobileBottomNav />
    </>
  );
}
