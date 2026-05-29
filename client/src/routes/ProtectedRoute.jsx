import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function ProtectedRoute({ fallback, children }) {
  const { isCheckingSession, user } = useAuth();

  if (isCheckingSession) return fallback ?? null;
  if (!user) return <Navigate replace to="/login" />;
  return children;
}

