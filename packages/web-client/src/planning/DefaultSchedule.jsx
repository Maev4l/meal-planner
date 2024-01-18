import { Stack, Box, Typography, Link, Button, Grid } from '@mui/material';
import { useOutletContext } from 'react-router-dom';

import DailyMealSelector from './DailyMealSelector';
import { VIEW_MODE } from './viewmode';

const DefaultSchedule = ({
  group,
  onChangeViewMode,
  onSetMeal,
  onUnsetMeal,
  onSaveDefaultSchedule,
}) => {
  const { userId } = useOutletContext();
  const { members } = group;

  const { default: def } = members[userId];

  return (
    <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5">{`Group: ${group.groupName}`}</Typography>
      </Box>
      <Box>
        <Typography variant="h6">Your default schedule for this group.</Typography>
      </Box>
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
      <Grid container spacing={1} justifyContent="center" alignItems="center">
        {/* Header row */}
        <Grid item xs={4}>
          &nbsp;
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Typography>Lunch</Typography>
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Typography>Dinner</Typography>
        </Grid>
        <DailyMealSelector
          label="Monday"
          meals={def.monday}
          onSet={(meal) => onSetMeal(group.groupId, 'monday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'monday', meal)}
        />
        <DailyMealSelector
          label="Tueday"
          meals={def.tuesday}
          onSet={(meal) => onSetMeal(group.groupId, 'tuesday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'tuesday', meal)}
        />
        <DailyMealSelector
          label="Wednesday"
          meals={def.wednesday}
          onSet={(meal) => onSetMeal(group.groupId, 'wednesday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'wednesday', meal)}
        />
        <DailyMealSelector
          label="Thursday"
          meals={def.thursday}
          onSet={(meal) => onSetMeal(group.groupId, 'thursday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'thursday', meal)}
        />
        <DailyMealSelector
          label="Friday"
          meals={def.friday}
          onSet={(meal) => onSetMeal(group.groupId, 'friday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'friday', meal)}
        />
        <DailyMealSelector
          label="Saturday"
          meals={def.saturday}
          onSet={(meal) => onSetMeal(group.groupId, 'saturday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'saturday', meal)}
        />
        <DailyMealSelector
          label="Sunday"
          meals={def.sunday}
          onSet={(meal) => onSetMeal(group.groupId, 'sunday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'sunday', meal)}
        />
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" onClick={onSaveDefaultSchedule}>
          Submit your changes
        </Button>
      </Box>
    </Stack>
  );
};

export default DefaultSchedule;
