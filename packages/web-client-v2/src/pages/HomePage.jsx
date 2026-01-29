import { Box, Typography } from '@mui/material';

const HomePage = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Meal Planner
      </Typography>
      <Typography variant="body1">
        Welcome to Meal Planner. Start planning your meals with your groups.
      </Typography>
    </Box>
  );
};

export default HomePage;
