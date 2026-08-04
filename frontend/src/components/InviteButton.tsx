import React from 'react';
import { Button } from '@mui/material';

import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const InviteButton: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [open, setOpen] = useState(false);
  const inviteUrl = `${window.location.origin}/join?roomId=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ContentCopyIcon />}
        onClick={copyUrl}
        sx={{
          py: 1,
          px: 3,
          fontSize: '15px',
          fontWeight: 'bold',
          borderRadius: 2,
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        }}
      >
        Copy Room Invite Link
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
          Room invite link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default InviteButton;
