import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import BusIcon from '@mui/icons-material/DirectionsBusFilledOutlined';
import BuildIcon from '@mui/icons-material/BuildCircleOutlined';
import BellIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChartIcon from '@mui/icons-material/InsightsOutlined';
import PeopleIcon from '@mui/icons-material/ManageAccountsOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import ShieldIcon from '@mui/icons-material/GppMaybeOutlined';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const DRAWER_WIDTH = 252;

export const NOTIFICATIONS_CHANGED = 'buscare:notifications-changed';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, end: true },
  { to: '/buses', label: 'Buses', icon: <BusIcon /> },
  { to: '/service-records', label: 'Service Records', icon: <BuildIcon /> },
  { to: '/notifications', label: 'Notifications', icon: <BellIcon />, badge: true },
  { to: '/reports', label: 'Reports', icon: <ChartIcon /> },
  { to: '/users', label: 'Users & Roles', icon: <PeopleIcon />, adminOnly: true },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    api
      .get('/notifications')
      .then((res) => setUnread(res.data.filter((n) => !n.readAt).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [location.pathname, refreshUnread]);

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshUnread);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, refreshUnread);
  }, [refreshUnread]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: colors.navy, color: '#E2E8F0' }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: colors.blue, width: 38, height: 38 }}>
          <BusIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.1 }}>
            BusCare
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Fleet maintenance
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: '#CBD5E1',
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 40 },
              '&:hover': { bgcolor: colors.navyLight },
              '&.active': { bgcolor: colors.blue, color: '#fff' },
            }}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={unread} color="error" max={99}>
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: colors.navyLight }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: colors.teal, width: 36, height: 36, fontSize: 15 }}>
          {user?.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" noWrap sx={{ color: '#fff', fontWeight: 600 }}>
            {user?.name}
          </Typography>
          <Chip
            label={user?.role === 'ADMIN' ? 'Administrator' : 'Mechanic'}
            size="small"
            sx={{ height: 20, fontSize: 11, bgcolor: colors.navyLight, color: '#CBD5E1' }}
          />
        </Box>
        <Tooltip title="Log out">
          <IconButton onClick={handleLogout} sx={{ color: '#CBD5E1' }} aria-label="Log out">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ display: { md: 'none' }, bgcolor: '#fff', color: 'text.primary', borderBottom: `1px solid ${colors.border}` }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              BusCare
            </Typography>
            <IconButton onClick={() => navigate('/notifications')} aria-label="Notifications">
              <Badge badgeContent={unread} color="error" max={99}>
                <BellIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, maxWidth: 1400, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>

        <Box
          component="footer"
          sx={{ px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', borderTop: `1px solid ${colors.border}`, bgcolor: '#fff' }}
        >
          <ShieldIcon fontSize="small" />
          <Typography variant="caption">
            BusCare is an administrative aid only. Final roadworthiness decisions remain the responsibility of qualified
            personnel.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
