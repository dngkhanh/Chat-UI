import React, { createContext, useContext, useState, useEffect } from "react";
import { token, updateToken } from "../components/store/tokenContext";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthContext: Checking token", token);
    if (!token) {
      setIsAuthenticated(false);
      console.log("AuthContext: No token found, user not authenticated");
    } else {
      setIsAuthenticated(true);
      console.log("AuthContext: Token found, user authenticated");
    }
  }, []);

  const login = (accessToken: string, user: any) => {
    document.cookie = `accessToken=${accessToken}`;
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);
    updateToken(accessToken);
    setIsAuthenticated(true);
    navigate("/home");
  };

  const logout = () => {
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    updateToken("");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 