import React from 'react';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const Header: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'center', alignItems: 'center' }}> {/* Center the content */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}> {/* Full width for centering */}
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>  {/* Add Link to homepage */}
              CFF Planning Poker
            </Link>
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
