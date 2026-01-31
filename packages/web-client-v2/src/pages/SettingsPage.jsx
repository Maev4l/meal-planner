import { Box, Typography } from '@mui/material';

const SettingsPage = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Settings will be available here.
      </Typography>
    </Box>
  );
};

export default SettingsPage;
