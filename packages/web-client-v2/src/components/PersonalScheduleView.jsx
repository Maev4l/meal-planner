import { Box, Typography, Switch } from '@mui/material';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const PersonalScheduleView = ({ schedule, dates, onToggle, year, week }) => {
  const todayIndex = getTodayIndex(year, week);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 600,
        }}
      >
        <Box sx={{ width: 100, py: 1, pl: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>Day</Typography>
        </Box>
        <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={600}>Lunch</Typography>
        </Box>
        <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={600}>Dinner</Typography>
        </Box>
      </Box>
      {DAYS.map((day, index) => {
        const attendance = schedule?.[day] ?? 0;
        const hasLunch = (attendance & MEAL.LUNCH) !== 0;
        const hasDinner = (attendance & MEAL.DINNER) !== 0;
        const isToday = index === todayIndex;

        return (
          <Box
            key={day}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              borderLeft: isToday ? 4 : 0,
              borderLeftColor: 'primary.main',
            }}
          >
            <Box sx={{ width: 100, py: 1, pl: 2 }}>
              <Typography variant="body2">{DAY_LABELS[index]}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dates[index]}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Switch
                checked={hasLunch}
                onChange={() => onToggle(day, MEAL.LUNCH)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Switch
                checked={hasDinner}
                onChange={() => onToggle(day, MEAL.DINNER)}
                size="small"
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PersonalScheduleView;
