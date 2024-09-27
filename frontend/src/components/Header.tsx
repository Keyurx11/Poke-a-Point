// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';

const Header: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              CFF Planning Poker
            </Link>
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
