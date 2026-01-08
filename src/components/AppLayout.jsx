import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <>
      <Outlet />
      <footer className="app-footer">
        © {new Date().getFullYear()} TurantX Solutions Pvt Ltd
      </footer>
    </>
  );
}
