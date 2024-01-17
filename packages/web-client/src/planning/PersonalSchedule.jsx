import { Stack, Box, Typography, Link } from '@mui/material';

import MealsSelector from './MealsSelector';
import CalendarWeekPicker from './CalendarWeekPicker';

const PersonalSchedule = ({
  group,
  weekStartDay,
  onSaveWeeklySchedule,
  onSetMeal,
  onUnsetMeal,
  onPreviousCalendarWeek,
  onNextCalendarWeek,
}) => (
  <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
    <CalendarWeekPicker
      weekStartDay={weekStartDay}
      onPrevious={onPreviousCalendarWeek}
      onNext={onNextCalendarWeek}
    />
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography>
        You can update your default schedule for this group{' '}
        <Link
          onClick={() => {
            console.log('click');
          }}
        >
          here.
        </Link>
      </Typography>
    </Box>
    <MealsSelector
      weekStartDay={weekStartDay}
      group={group}
      onSave={(schedule) => onSaveWeeklySchedule(group.groupId, schedule)}
      onSet={onSetMeal}
      onUnset={onUnsetMeal}
    />
  </Stack>
);

export default PersonalSchedule;
