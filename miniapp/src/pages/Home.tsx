// src/components/Home.tsx

import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    // Navigate to the chat screen when the user clicks the button
    navigate("/chat");
  };

  return (
    <div className="home-container">
      <h1>Home</h1>
      <button onClick={handleStartChat} className="start-chat-button">
        Start Chat
      </button>
    </div>
  );
};

export default Home;
