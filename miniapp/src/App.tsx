// src/App.tsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "./AppProviders";
import Home from "./components/Home";
// import ChatScreen from "./pages/ChatScreen";

const App: React.FC = () => {
  return (
    <Providers>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/chat" element={<ChatScreen />} /> */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Providers>
  );
};

export default App;
