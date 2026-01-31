import { Box, Typography, AppBar, Toolbar } from '@mui/material';

const SettingsPage = () => {
  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
          top: 0,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Settings will be available here.
        </Typography>
      </Box>
    </>
  );
};

export default SettingsPage;
