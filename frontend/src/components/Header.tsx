// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Box, Toolbar } from '@mui/material';
import logo from '../../public/logo.svg';
const Header: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
      <AppBar position="static" sx={{ backgroundColor: '#0D47A1' }}>
        <Toolbar sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Poke-a-Point Logo" style={{ height: '85px' }} />
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
