import { Stack, Box, Typography, Link } from '@mui/material';

import MealsSelector from './MealsSelector';
import CalendarWeekPicker from './CalendarWeekPicker';
import { VIEW_MODE } from './viewmode';

const PersonalSchedule = ({
  group,
  weekStartDay,
  onSaveWeeklySchedule,
  onSetMeal,
  onUnsetMeal,
  onPreviousCalendarWeek,
  onNextCalendarWeek,
  onChangeViewMode,
}) => (
  <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography>
        You can update your default schedule for this group{' '}
        <Link
          style={{ cursor: 'pointer' }}
          onClick={() => {
            onChangeViewMode(VIEW_MODE.DEFAULT_SCHEDULE);
          }}
        >
          here.
        </Link>
      </Typography>
    </Box>
    <CalendarWeekPicker
      weekStartDay={weekStartDay}
      onPrevious={onPreviousCalendarWeek}
      onNext={onNextCalendarWeek}
    />
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography>
        You can view the members schedules{' '}
        <Link
          style={{ cursor: 'pointer' }}
          onClick={() => {
            onChangeViewMode(VIEW_MODE.MEMBERS_SCHEDULES);
          }}
        >
          here.
        </Link>
      </Typography>
    </Box>
    <MealsSelector
      weekStartDay={weekStartDay}
      group={group}
      onSave={onSaveWeeklySchedule}
      onSet={onSetMeal}
      onUnset={onUnsetMeal}
    />
  </Stack>
);

export default PersonalSchedule;
