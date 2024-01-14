import { Stack, Box, Typography } from '@mui/material';

import MealsSelector from './MealsSelector';

const GroupName = ({ group }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Typography variant="h4">{`Group: ${group.groupName}`}</Typography>
  </Box>
);

const Group = ({ group, weekStartDay, onSaveWeeklySchedule, onSetMeal, onUnsetMeal }) => (
  <Stack spacing={2}>
    <GroupName group={group} />
    <MealsSelector
      weekStartDay={weekStartDay}
      group={group}
      onSave={(schedule) => onSaveWeeklySchedule(group.groupId, schedule)}
      onSet={onSetMeal}
      onUnset={onUnsetMeal}
    />
  </Stack>
);

export default Group;
