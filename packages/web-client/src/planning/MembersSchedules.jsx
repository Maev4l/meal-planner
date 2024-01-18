/* eslint-disable no-bitwise */
import { Stack, Box, Typography, Link } from '@mui/material';

import { VIEW_MODE } from './viewmode';
import { MEAL } from '../domain';

const renderColumn = (day, members) => {
  const totals = {
    monday: { lunch: 0, dinner: 0 },
    tuesday: { lunch: 0, dinner: 0 },
    wednesday: { lunch: 0, dinner: 0 },
    thursday: { lunch: 0, dinner: 0 },
    friday: { lunch: 0, dinner: 0 },
    saturday: { lunch: 0, dinner: 0 },
    sunday: { lunch: 0, dinner: 0 },
  };
  return (
    <Stack key={day}>
      <Box sx={{ textTransform: 'capitalize', p: 0.5 }}>{day.slice(0, 3)}</Box>
      <Box sx={{ p: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>L</Box>
          <Box sx={{ width: '100%', textAlign: 'center' }}>D</Box>
        </Box>
      </Box>
      {members.map((m) => {
        const val = m.schedule[day];
        if (val & MEAL.LUNCH) {
          totals[day].lunch += 1;
        } else if (val & MEAL.DINNER) {
          totals[day].dinner += 1;
        }

        return (
          <Box key={`${day}#${m.memberId}`}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  bgcolor: val & MEAL.LUNCH ? 'success.main' : 'error.main',
                  width: '100%',
                  border: '1px solid',
                  borderColors: 'grey.400',
                }}
              >
                &nbsp;
              </Box>
              <Box
                sx={{
                  bgcolor: val & MEAL.DINNER ? 'success.main' : 'error.main',
                  width: '100%',
                  border: '0.5px solid',
                  borderColors: 'grey.400',
                }}
              >
                &nbsp;
              </Box>
            </Box>
          </Box>
        );
      })}
      <Box sx={{ p: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>{totals[day].lunch}</Box>
          <Box sx={{ width: '100%', textAlign: 'center' }}>{totals[day].dinner}</Box>
        </Box>
      </Box>
    </Stack>
  );
};

const MembersSchedules = ({ group, onChangeViewMode }) => {
  const { members } = group;
  const sortedMembers = Object.entries(members)
    .map(([, m]) => m)
    .sort((a, b) => a.memberName.toLowerCase().localeCompare(b.memberName.toLowerCase()));

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography>
          Back to{' '}
          <Link
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onChangeViewMode(VIEW_MODE.PERSONAL_SCHEDULE);
            }}
          >
            your schedule.
          </Link>
        </Typography>
      </Box>
      <Box>
        <Typography variant="h6">Member schedules</Typography>
      </Box>
      <Stack direction="row">
        <Stack>
          <Box sx={{ p: 0.5 }}>&nbsp;</Box>
          <Box sx={{ p: 0.5 }}>&nbsp;</Box>
          {sortedMembers.map((m) => (
            <Box sx={{ pr: 1 }} key={m.memberId}>
              <Typography sx={{ float: 'right' }} display="inline">
                {m.memberName}
              </Typography>
            </Box>
          ))}
          <Box sx={{ p: 0.5 }}>
            <Typography sx={{ float: 'right' }} display="inline">
              Total
            </Typography>
          </Box>
        </Stack>
        {daysOfWeek.map((day) => renderColumn(day, sortedMembers))}
      </Stack>
    </Stack>
  );
};

export default MembersSchedules;
