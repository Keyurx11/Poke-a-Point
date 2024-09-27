// src/pages/Room.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Paper } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import RoomHeader from '../components/RoomHeader';
import ParticipantsList from '../components/ParticipantsList';
import VotingSection from '../components/VotingSection';
import VotesDisplay from '../components/VotesDisplay';
import InviteButton from '../components/InviteButton';

interface User {
  id: string;
  name: string;
}

interface RoomData {
  name: string;
  users: User[];
  votes: { [key: string]: number | string | null };
  showVotes: boolean;
}

const votingOptions = [1, 2, 3, 5, 8, 13, 21, '?'];

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || '');
  const [roomName, setRoomName] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | string | null }>({});
  const [selectedVote, setSelectedVote] = useState<number | string | null>(null);
  const [showVotes, setShowVotes] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (!roomId || !userName) {
      navigate('/join');
    }
  }, [roomId, userName, navigate]);

  useEffect(() => {
    if (roomId && userName) {
      localStorage.setItem('roomId', roomId);
      localStorage.setItem('userName', userName);

      socket.emit('joinRoom', { roomId, userName }, ({ success, room }: { success: boolean; room: RoomData }) => {
        if (success) {
          setUsers(room.users);
          setVotes(room.votes);
          setRoomName(room.name);
          setShowVotes(room.showVotes);
          if (room.users[0]?.id === socket.id) {
            setIsCreator(true);
          }
        } else {
          navigate('/join');
        }
      });

      socket.on('roomData', (room: RoomData) => {
        setUsers(room.users);
        setVotes(room.votes);
        setRoomName(room.name);
      });

      socket.on('votesUpdate', (updatedVotes) => {
        setVotes(updatedVotes);
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
  }, [roomId, userName, socket, navigate]);

  const handleVote = (vote: number | string) => {
    if (roomId) {
      socket.emit('vote', { roomId, userId: socket.id, vote }, ({ success }: { success: boolean }) => {
        if (success) {
          setSelectedVote(vote);
        }
      });
    }
  };

  const handleResetVotes = () => {
    if (roomId && isCreator) {
      socket.emit('resetVotes', { roomId }, ({ success }: { success: boolean }) => {
        if (success) {
          setShowVotes(false);
          setSelectedVote(null);
        } else {
          alert('Failed to reset votes');
        }
      });
    }
  };

  const handleResetMyVote = () => {
    if (roomId) {
      socket.emit('vote', { roomId, userId: socket.id, vote: null }, ({ success }: { success: boolean }) => {
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
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md" sx={{ marginTop: 5 }}>
      <Paper
        elevation={3}
        sx={{ padding: 3, borderRadius: '10px', backgroundColor: '#f7f9fc', minHeight: '80vh' }}
      >
        <RoomHeader roomId={roomId} roomName={roomName} userName={userName} />
        <Box textAlign="center" sx={{ marginBottom: 3 }}>
          <InviteButton roomId={roomId} />
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <ParticipantsList users={users} />
          </Grid>
          <Grid item xs={12} md={6}>
            <VotingSection
              votingOptions={votingOptions}
              selectedVote={selectedVote}
              handleVote={handleVote}
              handleResetMyVote={handleResetMyVote}
            />
          </Grid>
        </Grid>

        <Box sx={{ marginTop: 4 }}>
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