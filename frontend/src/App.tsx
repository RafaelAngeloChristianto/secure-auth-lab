import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginScreen from "./pages/LoginScreen.tsx";
import HomeScreen from "./pages/HomeScreen.tsx";
import SignUpScreen from "./pages/SignUpScreen.tsx";
import OTPScreen from "./pages/OTPScreen.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white scale-wrapper">
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/otpscreen" element={<OTPScreen />} />
      </Routes>
    </div>
  );
};
