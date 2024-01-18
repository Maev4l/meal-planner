import { Stack, Box, Typography, Button, Grid } from '@mui/material';
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
    <Stack spacing={1}>
      <Grid container justifyContent="center" alignItems="center">
        {/* Header row */}
        <Grid item xs={4}>
          &nbsp;
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Typography>Lunch</Typography>
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Typography>Dinner</Typography>
        </Grid>
        <DailyMealSelector
          dayOfWeek={monday}
          label="Monday"
          meals={schedule.monday.meals}
          onSet={(meal) => onSet(group.groupId, 'monday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'monday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={tuesday}
          label="Tuesday"
          meals={schedule.tuesday.meals}
          onSet={(meal) => onSet(group.groupId, 'tuesday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'tuesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={wednesday}
          label="Wednesday"
          meals={schedule.wednesday.meals}
          onSet={(meal) => onSet(group.groupId, 'wednesday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'wednesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={thursday}
          label="Thursday"
          meals={schedule.thursday.meals}
          onSet={(meal) => onSet(group.groupId, 'thursday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'thursday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={friday}
          label="Friday"
          meals={schedule.friday.meals}
          onSet={(meal) => onSet(group.groupId, 'friday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'friday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={saturday}
          label="Saturday"
          meals={schedule.saturday.meals}
          onSet={(meal) => onSet(group.groupId, 'saturday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'saturday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={sunday}
          label="Sunday"
          meals={schedule.sunday.meals}
          onSet={(meal) => onSet(group.groupId, 'sunday', meal)}
          onUnset={(meal) => onUnset(group.groupId, 'sunday', meal)}
        />
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" onClick={onSave}>
          Submit your changes
        </Button>
      </Box>
    </Stack>
  );
};

export default MealsSelector;
