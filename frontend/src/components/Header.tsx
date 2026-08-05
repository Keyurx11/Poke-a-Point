// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Box, Toolbar } from '@mui/material';

const Header: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, marginBottom: 1.5 }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', alignItems: 'center', minHeight: '64px !important', py: 0.75 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="Poke-a-Point Logo" style={{ height: '60px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
