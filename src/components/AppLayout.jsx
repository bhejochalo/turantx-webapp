import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";

export default function AppLayout() {
  return (
    <>
      <Outlet />
      <AppFooter />
    </>
  );
}
