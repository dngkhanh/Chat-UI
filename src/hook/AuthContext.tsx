import React, { createContext, useContext, useState, useEffect } from "react";
import { token } from "../components/store/tokenContext";

const AuthContext = createContext<{ isAuthenticated: boolean }>({
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    console.log("AuthContext: Checking token", token);
    if (!token) {
      setIsAuthenticated(false);
      console.log("AuthContext: No token found, user not authenticated");
    } else {
      console.log("AuthContext: Token found, user authenticated");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 