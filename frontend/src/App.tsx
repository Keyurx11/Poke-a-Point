import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom'; 
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';
import { SocketProvider } from './context/SocketContext';

const App: React.FC = () => {
  return (
    <SocketProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />            {/* Home page */}
          <Route path="/create" element={<CreateRoom />} /> {/* Create Room page */}
          <Route path="/join" element={<JoinRoom />} />     {/* Join Room page */}
          <Route path="/room/:roomId" element={<Room />} /> {/* Room page */}
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
