import { Stack, Box, Typography, Link, Button } from '@mui/material';
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
      <Stack spacing={2}>
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
        </Stack>
        <DailyMealSelector
          label="Monday"
          value={def.monday}
          onSet={(meal) => onSetMeal(group.groupId, 'monday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'monday', meal)}
        />
        <DailyMealSelector
          label="Tueday"
          value={def.tuesday}
          onSet={(meal) => onSetMeal(group.groupId, 'tuesday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'tuesday', meal)}
        />
        <DailyMealSelector
          label="Wednesday"
          value={def.wednesday}
          onSet={(meal) => onSetMeal(group.groupId, 'wednesday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'wednesday', meal)}
        />
        <DailyMealSelector
          label="Thursday"
          value={def.thursday}
          onSet={(meal) => onSetMeal(group.groupId, 'thursday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'thursday', meal)}
        />
        <DailyMealSelector
          label="Friday"
          value={def.friday}
          onSet={(meal) => onSetMeal(group.groupId, 'friday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'friday', meal)}
        />
        <DailyMealSelector
          label="Saturday"
          value={def.saturday}
          onSet={(meal) => onSetMeal(group.groupId, 'saturday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'saturday', meal)}
        />
        <DailyMealSelector
          label="Sunday"
          value={def.sunday}
          onSet={(meal) => onSetMeal(group.groupId, 'sunday', meal)}
          onUnset={(meal) => onUnsetMeal(group.groupId, 'sunday', meal)}
        />
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" onClick={onSaveDefaultSchedule}>
          Submit your changes
        </Button>
      </Box>
    </Stack>
  );
};

export default DefaultSchedule;
