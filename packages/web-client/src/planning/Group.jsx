import { Stack, Box, Typography } from '@mui/material';

import DatePicker from './DatePicker';

const GroupName = ({ group }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Typography variant="h4">{`Group: ${group.groupName}`}</Typography>
  </Box>
);

const Group = ({ group, year, weekNumber }) => (
  <Stack spacing={2}>
    <GroupName group={group} />
    <DatePicker year={year} weekNumber={weekNumber} />
  </Stack>
);

export default Group;
