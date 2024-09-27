import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Paper, Typography, Button } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import RoomHeader from '../components/RoomHeader';
import ParticipantsList from '../components/ParticipantsList';
import VotingSection from '../components/VotingSection';
import VotesDisplay from '../components/VotesDisplay';
import InviteButton from '../components/InviteButton';

interface LocationState {
  userName: string;
}

const votingOptions = [1, 2, 3, 5, 8, 13, 21, '?'];

const Room: React.FC = () => {
  const { roomId: paramRoomId } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  const [userName, setUserName] = useState<string>(location.state?.userName || localStorage.getItem('userName') || '');
  const [roomId, setRoomId] = useState<string | null>(paramRoomId || localStorage.getItem('roomId') || null);
  const [roomName, setRoomName] = useState<string>(''); 

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | string }>({});
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

      socket.emit('joinRoom', { roomId, userName }, ({ success, room }) => {
        if (success) {
          setUsers(room.users);
          setVotes(room.votes);
          setRoomName(room.name); 
          if (room.users[0]?.id === socket.id) {
            setIsCreator(true); 
          }
        }
      });

      socket.on('roomData', (room) => {
        setUsers(room.users);
        setVotes(room.votes);
        setRoomName(room.name); 
      });

      socket.on('votesUpdate', (updatedVotes) => {
        setVotes(updatedVotes);
      });

      socket.on('toggleVotes', (showVotesState) => {
        setShowVotes(showVotesState); 
      });

      return () => {
        socket.off('roomData');
        socket.off('votesUpdate');
        socket.off('toggleVotes'); 
      };
    }
  }, [roomId, userName, socket]);

  const handleVote = (vote: number | string) => {
    if (roomId) {
      socket.emit('vote', { roomId, userId: socket.id, vote }, ({ success }) => {
        if (success) {
          setSelectedVote(vote);
        }
      });
    }
  };

  const handleResetVotes = () => {
    if (roomId && isCreator) {
      socket.emit('resetVotes', { roomId }, ({ success }) => {
        if (!success) {
          alert('Failed to reset votes');
        }
      });
    }
  };

  const handleResetMyVote = () => {
    if (roomId) {
      socket.emit('vote', { roomId, userId: socket.id, vote: null }, ({ success }) => {
        if (!success) {
          alert('Failed to reset my vote');
        } else {
          setSelectedVote(null);
          setVotes((prevVotes) => ({ ...prevVotes, [socket.id]: null }));
        }
      });
    }
  };

  const handleToggleVotes = () => {
    if (isCreator && roomId) {
      const newShowVotes = !showVotes;
      setShowVotes(newShowVotes);
      socket.emit('toggleVotes', { roomId, showVotes: newShowVotes }); 
    }
  };

  if (!roomId || !userName) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md" sx={{ marginTop: 5 }}>
      <Paper elevation={3} sx={{ padding: 3, borderRadius: '10px', backgroundColor: '#f7f9fc' }}>
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
              handleResetVotes={handleResetVotes}
              handleResetMyVote={handleResetMyVote} 
              handleToggleVotes={handleToggleVotes}
              showVotes={showVotes}
              isCreator={isCreator}
            />
          </Grid>
        </Grid>
        <Box sx={{ marginTop: 4 }}>
          <VotesDisplay users={users} votes={votes} showVotes={showVotes} votingOptions={votingOptions} />
        </Box>
      </Paper>
    </Container>
  );
};

export default Room;
