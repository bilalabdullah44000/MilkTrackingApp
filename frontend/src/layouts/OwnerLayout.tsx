import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Avatar,
  Divider, useMediaQuery, useTheme, Tooltip,
} from '@mui/material';
import {
  Dashboard, People, Store, ShoppingCart, LocalShipping,
  Receipt, AccountBalance, Menu as MenuIcon, Logout, ChevronLeft,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { FAB } from '../components/common/FAB';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Vendors', icon: <Store />, path: '/vendors' },
  { label: 'Customers', icon: <People />, path: '/customers' },
  { label: 'Purchases', icon: <ShoppingCart />, path: '/purchases' },
  { label: 'Deliveries', icon: <LocalShipping />, path: '/deliveries' },
  { label: 'Billing', icon: <Receipt />, path: '/billing' },
  { label: 'Team', icon: <AccountBalance />, path: '/users' },
];

export function OwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed && !isMobile ? 68 : DRAWER_WIDTH;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        {!collapsed && (
          <Typography variant="h6" color="primary" fontWeight={700} noWrap>
            MilkPro
          </Typography>
        )}
        {!isMobile && (
          <IconButton size="small" onClick={() => setCollapsed((c) => !c)}>
            <ChevronLeft sx={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                  selected={active}
                  sx={{
                    mx: 1, borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
          {user?.fullName?.charAt(0)}
        </Avatar>
        {!collapsed && (
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">Owner</Typography>
          </Box>
        )}
        <IconButton size="small" onClick={logout} color="error" title="Logout">
          <Logout fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: 'none' },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} color="primary">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ flex: 1, ml: 1 }}>
            MilkPro
          </Typography>
          <IconButton onClick={logout} color="error" size="small">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.2s',
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 8, md: 2 },
          px: { xs: 2, md: 3 },
          pb: 10,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: 'width 0.2s',
        }}
      >
        <Outlet />
      </Box>

      <FAB role="OWNER" />
    </Box>
  );
}
