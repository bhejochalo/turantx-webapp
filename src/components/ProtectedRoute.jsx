import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowIf, children }) {
  const ok = allowIf.every(
    (key) => sessionStorage.getItem(key) === "true"
  );

  if (!ok) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
