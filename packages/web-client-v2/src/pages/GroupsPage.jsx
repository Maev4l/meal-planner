import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { useSchedules } from '../contexts/SchedulesContext';

const GroupCard = ({ group, onSelect }) => {
  const { groupName, members } = group;
  const memberCount = Object.keys(members).length;

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea onClick={onSelect}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GroupIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              {groupName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { schedules: groups, loading, error, fetchSchedules } = useSchedules();

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
          top: 0,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Groups
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : groups.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No groups found.
          </Typography>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.groupId}
              group={group}
              onSelect={() => navigate(`/groups/${group.groupId}/${encodeURIComponent(group.groupName)}`)}
            />
          ))
        )}
      </Box>
    </>
  );
};

export default GroupsPage;
