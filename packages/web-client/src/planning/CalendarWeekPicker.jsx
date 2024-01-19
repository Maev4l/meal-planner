import { Typography, Box, IconButton, Stack, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import moment from 'moment';

const CalendarWeekPicker = ({ weekStartDay, onPrevious, onNext, onResetWeek }) => {
  const nowStartDay = moment().startOf('isoweek');
  const year = weekStartDay.year();
  const weekNumber = weekStartDay.isoWeek();

  const prevWeekStartDay = moment(weekStartDay).subtract(1, 'isoweek');

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <IconButton
        size="large"
        onClick={onPrevious}
        disabled={nowStartDay.isAfter(prevWeekStartDay)}
      >
        <ChevronLeft fontSize="inherit" />
      </IconButton>
      <Stack alignItems="center">
        <Typography variant="h6">
          {`Calendar Week: ${year} - ${String(weekNumber).padStart(2, '0')}`}
        </Typography>
        <Button size="small" disabled={moment().isAfter(weekStartDay)} onClick={onResetWeek}>
          Go to current week
        </Button>
      </Stack>
      <IconButton size="large" onClick={onNext}>
        <ChevronRight fontSize="inherit" />
      </IconButton>
    </Box>
  );
};

export default CalendarWeekPicker;
