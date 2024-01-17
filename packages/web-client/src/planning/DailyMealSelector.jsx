/* eslint-disable no-bitwise */
import { Stack, Box, Typography, Button } from '@mui/material';
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

const DailyMealSelector = ({ dayOfWeek, label, value, onSet, onUnset }) => {
  const now = moment();
  let endOfDay = null;
  if (dayOfWeek !== null) {
    endOfDay = moment(dayOfWeek).endOf('day');
  }

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
            <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
          </Box>
          {dayOfWeek && (
            <Box>
              <Box>{dayOfWeek.format('MMMM DD')}</Box>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ minWidth: '10rem' }}>
        {value & MEAL.LUNCH ? (
          <PresentButton
            disabled={endOfDay !== null && now.isAfter(endOfDay)}
            onClick={() => onUnset(MEAL.LUNCH)}
          />
        ) : (
          <AbsentButton
            disabled={endOfDay !== null && now.isAfter(endOfDay)}
            onClick={() => onSet(MEAL.LUNCH)}
          />
        )}
      </Box>
      <Box sx={{ minWidth: '10rem' }}>
        {value & MEAL.DINNER ? (
          <PresentButton
            disabled={endOfDay !== null && now.isAfter(endOfDay)}
            onClick={() => onUnset(MEAL.DINNER)}
          />
        ) : (
          <AbsentButton
            disabled={endOfDay !== null && now.isAfter(endOfDay)}
            onClick={() => onSet(MEAL.DINNER)}
          />
        )}
      </Box>
    </Stack>
  );
};

export default DailyMealSelector;
