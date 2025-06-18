import React from "react";
import { RouteObject, Navigate } from "react-router-dom";
import LayoutDefault from "../components/LayoutDefault/LayoutDefault";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import Home from "../components/Home/Home";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <LayoutDefault />,
    children: [
      {
        path: "",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "home",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]; 