import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import SignPage from "./pages/SignPage";
import Verify from "./pages/Verify";
import ResetPassword from "./pages/Reset";
import EmailVerification from "./pages/EmailVerification";
import TwoFactorPage from "./pages/TwoFactorPage";

const App: React.FC = () => {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sign/:id/:mail" element={<SignPage />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/api/email/confirm" element={<EmailVerification />} />
              <Route path="/2fa" element={<TwoFactorPage />} />
          </Routes>
      </Router>
  );
};

export default App;