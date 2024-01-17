import { Box, Typography } from '@mui/material';

const GroupPicker = ({ group }) => (
  <Box>
    <Typography variant="h5">{`Group: ${group.groupName}`}</Typography>
  </Box>
);

export default GroupPicker;
