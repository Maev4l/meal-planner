// Edited by Claude.
// Warm Bistro themed groups page with elegant card design
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
  Avatar,
  AvatarGroup,
  alpha,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useSchedules } from '../contexts/SchedulesContext';

// Generate consistent color from string for avatar backgrounds
const stringToColor = (str) => {
  const colors = [
    '#722F37', // burgundy
    '#D4A373', // amber
    '#87A878', // sage
    '#C9705E', // terracotta
    '#8B4049', // burgundy light
    '#B8895C', // amber dark
    '#6B8C5E', // sage dark
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const GroupCard = ({ group, onSelect, delay }) => {
  const { groupName, members } = group;
  const memberList = Object.values(members);
  const memberCount = memberList.length;

  return (
    <Card
      sx={{
        mb: 2,
        overflow: 'visible',
        animation: 'fadeInUp 0.5s ease-out forwards',
        animationDelay: `${delay}s`,
        opacity: 0,
      }}
    >
      <CardActionArea
        onClick={onSelect}
        sx={{
          p: 0.5,
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            p: 2.5,
            '&:last-child': { pb: 2.5 },
          }}
        >
          {/* Group icon with decorative background */}
          <Box
            sx={{
              position: 'relative',
              width: 56,
              height: 56,
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.burgundy.main, 0.1)} 0%, ${alpha(theme.palette.amber.main, 0.1)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RestaurantIcon
              sx={{
                fontSize: 28,
                color: 'primary.main',
              }}
            />
          </Box>

          {/* Group info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.5,
                wordBreak: 'break-word',
              }}
            >
              {groupName}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleOutlineIcon
                sx={{ fontSize: 16, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Typography>
            </Box>
          </Box>

          {/* Member avatars */}
          <AvatarGroup
            max={3}
            sx={{
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: (theme) =>
                  `2px solid ${theme.palette.background.paper}`,
              },
            }}
          >
            {memberList.slice(0, 4).map((member, index) => (
              <Avatar
                key={index}
                sx={{
                  bgcolor: stringToColor(member.memberName),
                }}
              >
                {member.memberName.charAt(0).toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
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
    <Box
      sx={{
        minHeight: 'var(--vh-full)',
        pb: 10,
      }}
    >
      <AppBar
        position="sticky"
        sx={{
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
          top: 0,
        }}
      >
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RestaurantIcon sx={{ fontSize: 24 }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              Your Groups
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ py: 3 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading your groups...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              animation: 'fadeIn 0.3s ease-out forwards',
            }}
          >
            {error}
          </Alert>
        ) : groups.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: (theme) =>
                  alpha(theme.palette.charcoal.main, 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <PeopleOutlineIcon
                sx={{ fontSize: 36, color: 'text.secondary' }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: 'text.primary',
                mb: 1,
              }}
            >
              No groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You&apos;ll see your meal planning groups here
            </Typography>
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                animation: 'fadeIn 0.3s ease-out forwards',
              }}
            >
              Select a group to view and manage meal schedules
            </Typography>
            {groups.map((group, index) => (
              <GroupCard
                key={group.groupId}
                group={group}
                delay={0.1 + index * 0.1}
                onSelect={() =>
                  navigate(
                    `/groups/${group.groupId}/${encodeURIComponent(group.groupName)}`
                  )
                }
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
};

export default GroupsPage;
