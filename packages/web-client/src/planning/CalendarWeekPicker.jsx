import { Typography, Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import moment from 'moment';

const CalendarWeekPicker = ({ weekStartDay, onPrevious, onNext }) => {
  const nowStartDay = moment().startOf('isoweek');
  const year = weekStartDay.year();
  const weekNumber = weekStartDay.isoWeek();

  const prevWeekStartDay = moment(weekStartDay).subtract(1, 'isoweek');

  moment();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <IconButton
        size="large"
        onClick={onPrevious}
        disabled={nowStartDay.isAfter(prevWeekStartDay)}
      >
        <ChevronLeft fontSize="inherit" />
      </IconButton>
      <Typography variant="h6">
        {`Calendar Week: ${year} - ${String(weekNumber).padStart(2, '0')}`}
      </Typography>
      <IconButton size="large" onClick={onNext}>
        <ChevronRight fontSize="inherit" />
      </IconButton>
    </Box>
  );
};

export default CalendarWeekPicker;
