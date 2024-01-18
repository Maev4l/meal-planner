/* eslint-disable no-bitwise */
import { Box, Typography, Button, Grid } from '@mui/material';
import { Fragment } from 'react';
import moment from 'moment';

import { MEAL } from '../domain';

const PresentButton = ({ disabled, onClick }) => (
  <Box sx={{ pl: 1, pr: 1 }}>
    <Button
      variant="contained"
      color="success"
      sx={{ width: '100%' }}
      disabled={disabled}
      onClick={onClick}
    >
      Present
    </Button>
  </Box>
);

const AbsentButton = ({ disabled, onClick }) => (
  <Box sx={{ pl: 1, pr: 1 }}>
    <Button
      variant="contained"
      color="error"
      sx={{ width: '100%' }}
      disabled={disabled}
      onClick={onClick}
    >
      Absent
    </Button>
  </Box>
);
const DailyMealSelector = ({ dayOfWeek, label, value, onSet, onUnset }) => {
  const now = moment();
  let endOfDay = null;
  if (dayOfWeek !== null) {
    endOfDay = moment(dayOfWeek).endOf('day');
  }

  return (
    <Fragment>
      <Grid item xs={4}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
        </Box>
        {dayOfWeek && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography>{dayOfWeek.format('MMMM DD')}</Typography>
          </Box>
        )}
      </Grid>
      <Grid item xs={4} align="center">
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
      </Grid>
      <Grid item xs={4} align="center">
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
      </Grid>
    </Fragment>
  );
};

export default DailyMealSelector;
