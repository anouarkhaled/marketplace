import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "./Spinner";

function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner size="lg" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (staffOnly && !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
