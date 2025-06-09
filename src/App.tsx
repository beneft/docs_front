import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import SignPage from "./pages/SignPage";
import Verify from "./pages/Verify";
import ResetPassword from "./pages/Reset";

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
          </Routes>
      </Router>
  );
};

export default App;