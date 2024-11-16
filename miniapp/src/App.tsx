// src/App.tsx

import React from "react";
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "./AppProviders";
import Home from "./pages/Home";
import Login from "./components/Login";

// import ChatScreen from "./pages/Chat";

const App: React.FC = () => {
  return (
    <Providers>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          {/* <Route path="/chat" element={<ChatScreen />} /> */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
    </Providers>
  );
};

export default App;
