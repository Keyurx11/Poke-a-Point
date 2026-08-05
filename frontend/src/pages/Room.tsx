// src/pages/Room.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Paper, CircularProgress } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import RoomHeader from '../components/RoomHeader';
import ParticipantsList from '../components/ParticipantsList';
import VotesDisplay from '../components/VotesDisplay';
import { getUserId } from '../utils/userSession';

interface User {
  id: string;
  name: string;
  socketId: string;
}

interface RoomData {
  id: string;
  name: string;
  creatorId: string;
  users: User[];
  votes: { [key: string]: number | string | null };
  showVotes: boolean;
  votingOptions?: (number | string)[];
}

const DEFAULT_VOTING_OPTIONS = [1, 2, 3, 5, 8, 13, 21, '?'];

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  const mainContentRef = React.useRef<HTMLDivElement>(null);

  const userId = getUserId();
  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || '');
  const [roomName, setRoomName] = useState<string>('');
  const [creatorId, setCreatorId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | string | null }>({});
  const [selectedVote, setSelectedVote] = useState<number | string | null>(null);
  const [showVotes, setShowVotes] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [votingOptions, setVotingOptions] = useState<(number | string)[]>(DEFAULT_VOTING_OPTIONS);

  useEffect(() => {
    if (roomId && userName) {
      const timer = setTimeout(() => {
        if (mainContentRef.current) {
          mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [roomId, userName]);

  useEffect(() => {
    if (!roomId || !userName) {
      navigate('/join');
    }
  }, [roomId, userName, navigate]);

  useEffect(() => {
    if (roomId && userName && socket) {
      localStorage.setItem('roomId', roomId);
      localStorage.setItem('userName', userName);

      const joinPayload = { roomId, userName, userId };

      const handleRoomState = (room: RoomData) => {
        setUsers(room.users);
        setVotes(room.votes || {});
        setRoomName(room.name);
        setCreatorId(room.creatorId || '');
        setShowVotes(room.showVotes);
        setIsCreator(room.creatorId === userId);
        if (room.votingOptions && room.votingOptions.length > 0) {
          setVotingOptions(room.votingOptions);
        }
        if (room.votes && room.votes[userId] !== undefined) {
          setSelectedVote(room.votes[userId]);
        }
      };

      socket.emit('joinRoom', joinPayload, ({ success, room }: { success: boolean; room: RoomData }) => {
        if (success && room) {
          handleRoomState(room);
        } else {
          navigate('/join');
        }
      });

      socket.on('roomData', (room: RoomData) => {
        handleRoomState(room);
      });

      socket.on('votesUpdate', (updatedVotes) => {
        setVotes(updatedVotes || {});
        if (updatedVotes && updatedVotes[userId] !== undefined) {
          setSelectedVote(updatedVotes[userId]);
        } else if (updatedVotes && !(userId in updatedVotes)) {
          setSelectedVote(null);
        }
      });

      socket.on('toggleVotes', (showVotesState: boolean) => {
        setShowVotes(showVotesState);
      });

      return () => {
        socket.off('roomData');
        socket.off('votesUpdate');
        socket.off('toggleVotes');
      };
    }
  }, [roomId, userName, userId, socket, navigate]);

  const handleVote = (vote: number | string) => {
    if (roomId) {
      socket.emit('vote', { roomId, userId, vote }, ({ success, error }: { success: boolean; error?: string }) => {
        if (success) {
          setSelectedVote(vote);
        } else if (error) {
          alert(error);
        }
      });
    }
  };

  const handleResetVotes = () => {
    if (roomId && isCreator) {
      socket.emit('resetVotes', { roomId }, ({ success, error }: { success: boolean; error?: string }) => {
        if (success) {
          setShowVotes(false);
          setSelectedVote(null);
        } else {
          alert(error || 'Failed to reset votes');
        }
      });
    }
  };

  const handleResetMyVote = () => {
    if (roomId) {
      socket.emit('vote', { roomId, userId, vote: null }, ({ success, error }: { success: boolean; error?: string }) => {
        if (success) {
          setSelectedVote(null);
        } else {
          alert(error || 'Failed to reset your vote');
        }
      });
    }
  };

  const handleToggleVotes = () => {
    if (isCreator && roomId) {
      const newShowVotes = !showVotes;
      socket.emit('toggleVotes', { roomId, showVotes: newShowVotes }, (response?: { success: boolean; error?: string }) => {
        if (response && !response.success && response.error) {
          alert(response.error);
        }
      });
    }
  };

  if (!roomId || !userName) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ my: 0.5 }}>
      <Paper
        ref={mainContentRef}
        elevation={2}
        sx={{
          p: { xs: 1.25, sm: 2 },
          borderRadius: 2.5,
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <RoomHeader roomId={roomId} roomName={roomName} userName={userName} isCreator={isCreator} />

        <Box sx={{ mb: 1.5 }}>
          <ParticipantsList users={users} votes={votes} showVotes={showVotes} creatorId={creatorId} />
        </Box>

        <VotesDisplay
          users={users}
          votes={votes}
          showVotes={showVotes}
          votingOptions={votingOptions}
          isCreator={isCreator}
          handleResetVotes={handleResetVotes}
          handleToggleVotes={handleToggleVotes}
          selectedVote={selectedVote}
          handleVote={handleVote}
          handleResetMyVote={handleResetMyVote}
        />
      </Paper>
    </Container>
  );
};

export default Room;