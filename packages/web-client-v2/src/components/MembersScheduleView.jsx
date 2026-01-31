import { Box, Typography, Paper } from '@mui/material';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const MembersScheduleView = ({ members, dates, year, week, todayRef }) => {
  const getMealAttendees = (dayKey, mealType) => {
    return Object.entries(members)
      .filter(([, member]) => ((member.schedule?.[dayKey] ?? 0) & mealType) !== 0)
      .map(([, member]) => member.memberName.toUpperCase())
      .sort();
  };

  const todayIndex = getTodayIndex(year, week);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {DAYS.map((day, index) => {
        const lunchAttendees = getMealAttendees(day, MEAL.LUNCH);
        const dinnerAttendees = getMealAttendees(day, MEAL.DINNER);
        const isToday = index === todayIndex;

        return (
          <Paper
            key={day}
            ref={isToday ? todayRef : null}
            elevation={2}
            sx={{
              p: 2,
              borderLeft: isToday ? 4 : 0,
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              {DAY_LABELS[index]}, {dates[index]}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" component="span">
                  Lunch ({lunchAttendees.length}):{' '}
                </Typography>
                <Typography variant="body2" component="span">
                  {lunchAttendees.length > 0 ? lunchAttendees.join(', ') : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" component="span">
                  Dinner ({dinnerAttendees.length}):{' '}
                </Typography>
                <Typography variant="body2" component="span">
                  {dinnerAttendees.length > 0 ? dinnerAttendees.join(', ') : '—'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default MembersScheduleView;
