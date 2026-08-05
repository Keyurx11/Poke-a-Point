// src/pages/Room.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Paper, CircularProgress } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import RoomHeader from '../components/RoomHeader';
import ParticipantsList from '../components/ParticipantsList';
import VotingSection from '../components/VotingSection';
import VotesDisplay from '../components/VotesDisplay';
import InviteButton from '../components/InviteButton';
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
      socket.emit('vote', { roomId, userId, vote }, ({ success }: { success: boolean }) => {
        if (success) {
          setSelectedVote(vote);
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
      socket.emit('vote', { roomId, userId, vote: null }, ({ success }: { success: boolean }) => {
        if (success) {
          setSelectedVote(null);
        } else {
          alert('Failed to reset your vote');
        }
      });
    }
  };

  const handleToggleVotes = () => {
    if (isCreator && roomId) {
      const newShowVotes = !showVotes;
      socket.emit('toggleVotes', { roomId, showVotes: newShowVotes });
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
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 3,
          backgroundColor: '#ffffff',
          minHeight: '80vh',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        <RoomHeader roomId={roomId} roomName={roomName} userName={userName} isCreator={isCreator} />
        <Box textAlign="center" sx={{ mb: 4 }}>
          <InviteButton roomId={roomId} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <ParticipantsList users={users} votes={votes} showVotes={showVotes} creatorId={creatorId} />
          </Grid>
          <Grid item xs={12} md={7}>
            <VotingSection
              votingOptions={votingOptions}
              selectedVote={selectedVote}
              handleVote={handleVote}
              handleResetMyVote={handleResetMyVote}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <VotesDisplay
            users={users}
            votes={votes}
            showVotes={showVotes}
            votingOptions={votingOptions}
            isCreator={isCreator}
            handleResetVotes={handleResetVotes}
            handleToggleVotes={handleToggleVotes}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default Room;