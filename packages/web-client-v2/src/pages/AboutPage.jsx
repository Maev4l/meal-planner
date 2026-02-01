import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/settings')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            About
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Typography variant="body1" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default AboutPage;
