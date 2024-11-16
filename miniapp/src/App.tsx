import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Leaderboard from './pages/Leaderboard';

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route
          path='/'
          element={<Home />}
        />
        <Route
          path='/chat'
          element={<Chat />}
        />
        <Route
          path='/profile'
          element={<Profile />}
        />
        <Route
          path='/store'
          element={<Store />}
        />
        <Route
          path='/leaderboard'
          element={<Leaderboard />}
        />
        <Route
          path='*'
          element={<Home />}
        />
      </Routes>
    </div>
  );
};

export default App;
