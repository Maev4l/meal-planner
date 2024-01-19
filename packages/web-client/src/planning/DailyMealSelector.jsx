/* eslint-disable no-bitwise */
import { Box, Typography, Button, Grid, IconButton } from '@mui/material';
import { EditNote } from '@mui/icons-material';
import { Fragment } from 'react';
import moment from 'moment';

import { MEAL } from '../domain';

const AttendanceButton = ({ attendance, disabled, onClickAttendance, onClickNote }) => (
  <Box sx={{ pl: 1, pr: 1, display: 'flex' }}>
    <Button
      variant="contained"
      color={attendance ? 'success' : 'error'}
      sx={{ width: '100%' }}
      disabled={disabled}
      onClick={onClickAttendance}
    >
      {attendance ? 'Present' : 'Absent'}
    </Button>
    {onClickNote && (
      <IconButton size="small" disabled={disabled} onClick={onClickNote}>
        <EditNote />
      </IconButton>
    )}
  </Box>
);

const DailyMealSelector = ({ dayOfWeek, label, meals, onSet, onUnset, onClickComment }) => {
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
        <AttendanceButton
          attendance={meals & MEAL.LUNCH}
          disabled={endOfDay !== null && now.isAfter(endOfDay)}
          onClickAttendance={
            meals & MEAL.LUNCH ? () => onUnset(MEAL.LUNCH) : () => onSet(MEAL.LUNCH)
          }
          onClickNote={onClickComment ? () => onClickComment(MEAL.LUNCH, dayOfWeek) : null}
        />
      </Grid>
      <Grid item xs={4} align="center">
        <AttendanceButton
          attendance={meals & MEAL.DINNER}
          disabled={endOfDay !== null && now.isAfter(endOfDay)}
          onClickAttendance={
            meals & MEAL.DINNER ? () => onUnset(MEAL.DINNER) : () => onSet(MEAL.DINNER)
          }
          onClickNote={onClickComment ? () => onClickComment(MEAL.DINNER, dayOfWeek) : null}
        />
      </Grid>
    </Fragment>
  );
};

export default DailyMealSelector;
