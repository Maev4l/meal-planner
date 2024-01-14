/* eslint-disable no-bitwise */
import { Stack, Box, Typography, Button } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

import { MEAL } from '../domain';

const PresentButton = ({ disabled, onClick }) => (
  <Button variant="contained" color="success" disabled={disabled} onClick={onClick}>
    Present
  </Button>
);

const AbsentButton = ({ disabled, onClick }) => (
  <Button variant="contained" color="error" disabled={disabled} onClick={onClick}>
    Absent
  </Button>
);

const DailyMealSelector = ({ dayOfWeek, value, onSet, onUnset }) => {
  const now = moment();
  const endOfDay = moment(dayOfWeek).endOf('day');

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          minWidth: '10rem',
          display: 'flex',
          justifyContent: 'flex-end',
          pr: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography sx={{ fontWeight: 'bold' }}>{dayOfWeek.format('dddd')}</Typography>
          </Box>
          <Box>
            <Box>{dayOfWeek.format('MMMM DD')}</Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ minWidth: '10rem' }}>
        {value & MEAL.LUNCH ? (
          <PresentButton disabled={now.isAfter(endOfDay)} onClick={() => onUnset(MEAL.LUNCH)} />
        ) : (
          <AbsentButton disabled={now.isAfter(endOfDay)} onClick={() => onSet(MEAL.LUNCH)} />
        )}
      </Box>
      <Box sx={{ minWidth: '10rem' }}>
        {value & MEAL.DINNER ? (
          <PresentButton disabled={now.isAfter(endOfDay)} onClick={() => onUnset(MEAL.DINNER)} />
        ) : (
          <AbsentButton disabled={now.isAfter(endOfDay)} onClick={() => onSet(MEAL.DINNER)} />
        )}
      </Box>
    </Stack>
  );
};

const MealsSelector = ({ group, weekStartDay, onSave, onSet, onUnset }) => {
  const [userId] = useOutletContext();
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
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack spacing={2}>
        <Typography>
          {schedule.overriden
            ? 'Your have overriden your default weekly schedule.'
            : 'Your schedule is based on your default weekly schedule.'}
        </Typography>
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
            value={schedule.monday}
            onSet={(meal) => onSet(group.groupId, 'monday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'monday', meal)}
          />
          <DailyMealSelector
            dayOfWeek={tuesday}
            value={schedule.tuesday}
            onSet={(meal) => onSet(group.groupId, 'tuesday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'tuesday', meal)}
          />
          <DailyMealSelector
            dayOfWeek={wednesday}
            value={schedule.wednesday}
            onSet={(meal) => onSet(group.groupId, 'wednesday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'wednesday', meal)}
          />
          <DailyMealSelector
            dayOfWeek={thursday}
            value={schedule.thursday}
            onSet={(meal) => onSet(group.groupId, 'thursday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'thursday', meal)}
          />
          <DailyMealSelector
            dayName="friday"
            dayOfWeek={friday}
            value={schedule.friday}
            onSet={(meal) => onSet(group.groupId, 'friday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'friday', meal)}
          />
          <DailyMealSelector
            dayName="saturday"
            dayOfWeek={saturday}
            value={schedule.saturday}
            onSet={(meal) => onSet(group.groupId, 'saturday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'saturday', meal)}
          />
          <DailyMealSelector
            dayName="sunday"
            dayOfWeek={sunday}
            value={schedule.sunday}
            onSet={(meal) => onSet(group.groupId, 'sunday', meal)}
            onUnset={(meal) => onUnset(group.groupId, 'sunday', meal)}
          />
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => onSave(schedule)}>
            Submit your changes
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default MealsSelector;
