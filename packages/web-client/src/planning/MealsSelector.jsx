import { Stack, Box, Typography, Button } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

import DailyMealSelector from './DailyMealSelector';

const MealsSelector = ({ group, weekStartDay, onSave, onSet, onUnset }) => {
  const { userId } = useOutletContext();
  const { members } = group;
  const { schedule } = members[userId];
  const monday = moment(weekStartDay);
  const tuesday = moment(monday).add(1, 'days');
  const wednesday = moment(monday).add(2, 'days');
  const thursday = moment(monday).add(3, 'days');
  const friday = moment(monday).add(4, 'days');
  const saturday = moment(monday).add(5, 'days');
  const sunday = moment(monday).add(6, 'days');

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <Box sx={{ minWidth: '10rem' }}>&nbsp;</Box>
          <Box sx={{ minWidth: '10rem' }}>
            <Typography>Lunch</Typography>
          </Box>
          <Box sx={{ minWidth: '10rem' }}>
            <Typography>Dinner</Typography>
          </Box>
        </Stack>
        <DailyMealSelector
          dayOfWeek={monday}
          label="Monday"
          value={schedule.monday}
          onSet={(meal) => onSet(group.groupId, 'monday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'monday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={tuesday}
          label="Tueday"
          value={schedule.tuesday}
          onSet={(meal) => onSet(group.groupId, 'tuesday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'tuesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={wednesday}
          label="Wednesday"
          value={schedule.wednesday}
          onSet={(meal) => onSet(group.groupId, 'wednesday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'wednesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={thursday}
          label="Thursday"
          value={schedule.thursday}
          onSet={(meal) => onSet(group.groupId, 'thursday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'thursday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={friday}
          label="Friday"
          value={schedule.friday}
          onSet={(meal) => onSet(group.groupId, 'friday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'friday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={saturday}
          label="Saturday"
          value={schedule.saturday}
          onSet={(meal) => onSet(group.groupId, 'saturday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'saturday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={sunday}
          label="Sunday"
          value={schedule.sunday}
          onSet={(meal) => onSet(group.groupId, 'sunday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'sunday', meal)}
        />
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" onClick={onSave}>
          Submit your changes
        </Button>
      </Box>
    </Stack>
  );
};

export default MealsSelector;
