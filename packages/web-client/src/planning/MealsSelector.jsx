import { Stack, Box, Typography, Button, Grid } from '@mui/material';

import moment from 'moment';

import DailyMealSelector from './DailyMealSelector';

const MealsSelector = ({ schedule, weekStartDay, onSave, onSet, onUnset, onClickComment }) => {
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
          onSet={(meal) => onSet('monday', meal)}
          onUnset={(meal) => onUnset('monday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'monday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={tuesday}
          label="Tuesday"
          meals={schedule.tuesday.meals}
          onSet={(meal) => onSet('tuesday', meal)}
          onUnset={(meal) => onUnset('tuesday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'tuesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={wednesday}
          label="Wednesday"
          meals={schedule.wednesday.meals}
          onSet={(meal) => onSet('wednesday', meal)}
          onUnset={(meal) => onUnset('wednesday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'wednesday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={thursday}
          label="Thursday"
          meals={schedule.thursday.meals}
          onSet={(meal) => onSet('thursday', meal)}
          onUnset={(meal) => onUnset('thursday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'thursday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={friday}
          label="Friday"
          meals={schedule.friday.meals}
          onSet={(meal) => onSet('friday', meal)}
          onUnset={(meal) => onUnset('friday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'friday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={saturday}
          label="Saturday"
          meals={schedule.saturday.meals}
          onSet={(meal) => onSet('saturday', meal)}
          onUnset={(meal) => onUnset('saturday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'saturday', meal)}
        />
        <DailyMealSelector
          dayOfWeek={sunday}
          label="Sunday"
          meals={schedule.sunday.meals}
          onSet={(meal) => onSet('sunday', meal)}
          onUnset={(meal) => onUnset('sunday', meal)}
          onClickComment={(meal, dayOfWeek) => onClickComment(dayOfWeek, 'sunday', meal)}
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
