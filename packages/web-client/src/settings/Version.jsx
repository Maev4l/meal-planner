import { Box, Stack, Typography } from '@mui/material';

const Version = () => (
  <Stack sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
    <Box>Version: {process.env.version}</Box>
    <Box>
      <Typography variant="caption">Build: {process.env.commitHash}</Typography>
    </Box>
  </Stack>
);

export default Version;
