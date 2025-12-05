import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, IconButton, Badge, Container, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const drawerWidth = 280;

const Layout = ({ 
  children, 
  sidebarContent, 
  notificationCount, 
  onNotificationClick,
  onMenuClick,
  mobileOpen,
  onMobileClose,
  desktopOpen = true,
  authControl
}) => {
  
  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#fff', color: '#5f6368', boxShadow: 'inset 0 -1px 0 0 #dadce0' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
            onClick={handleLogoClick}
          >
            <CalendarTodayIcon sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#5f6368' }}>
              Kalendas
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {authControl}
          <IconButton color="inherit" onClick={onNotificationClick}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {sidebarContent}
      </Drawer>

      {/* Desktop Drawer (Persistent) */}
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: desktopOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: 'none',
            paddingTop: '0px' // Handled by Toolbar spacer
          },
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {sidebarContent}
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
