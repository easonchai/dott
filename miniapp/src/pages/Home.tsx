// src/components/Home.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Nav from '../components/Nav/Nav.tsx';
('./components/Nav');
import BottomMenu from '../components/BottomMenu/BottomMenu.tsx';
import ArtistCard from '../components/ArtistCard/ArtistCard.tsx';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    // Navigate to the chat screen when the user clicks the button
    navigate('/chat');
  };

  return (
    <div className='home-container'>
      <Nav />
      <div className='content'>
        <div className='total-score'>
          <div className='score-number'>12,356</div>
          <div className='user-score'>YOUR 한국어 SCORE</div>
        </div>
        <div className='artist-cards'>
          <div className='artist-cards-cta'>
            Get inspired by your<br></br> favorite KPOP idols ✦
          </div>
          <div className='artist-cards-container'>
            <ArtistCard />
            <ArtistCard />
            <ArtistCard />
          </div>
        </div>
        <button
          onClick={handleStartChat}
          className='start-chat-button'
        >
          Start Chat
        </button>
        <div className='vocabulary'>
          <div className='banner'>
            Dive into KPOP<br></br>vocabulary!
          </div>
        </div>
      </div>
      <BottomMenu />
    </div>
  );
};

export default Home;
