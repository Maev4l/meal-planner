import { AppBar, Box, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { deepOrange } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';

const Header = ({ userName }) => {
  const navigate = useNavigate();
  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography component="h1" variant="h5">
            MEAL PLANNER
          </Typography>
          <IconButton onClick={() => navigate('/settings')}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: deepOrange[500] }}>
              {userName.slice(0, 1).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default Header;
