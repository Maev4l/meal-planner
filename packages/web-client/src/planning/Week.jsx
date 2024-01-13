import { Typography, Box } from '@mui/material';

const Week = ({ year, weekNumber }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Typography variant="h3">{`Calendar Week: ${year} - ${weekNumber}`}</Typography>
  </Box>
);

export default Week;
