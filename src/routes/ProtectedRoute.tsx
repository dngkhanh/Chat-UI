import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hook/AuthContext";
import socketService from "../socket/Socket";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);
    
    if (!isAuthenticated) {
      console.log("ProtectedRoute: Redirecting to login");
      navigate("/login");
    } else {
      console.log("ProtectedRoute: User authenticated, connecting socket");
      socketService.connect();
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  return children;
};

export default ProtectedRoute; 