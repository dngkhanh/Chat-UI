import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hook/AuthContext";
import socketService from "../socket/Socket";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);
    
    if (isAuthenticated) {
      console.log("ProtectedRoute: User authenticated, connecting socket");
      socketService.connect();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 