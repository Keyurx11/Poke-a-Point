import React from 'react';
import { Button } from '@mui/material';

const InviteButton: React.FC<{ roomId: string }> = ({ roomId }) => {
  const inviteUrl = `${window.location.origin}/join?roomId=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('Room invite link copied to clipboard!');
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={copyUrl}
      sx={{ padding: '10px 20px', fontSize: '16px', borderRadius: '8px' }}
    >
      Invite Players
    </Button>
  );
};

export default InviteButton;
