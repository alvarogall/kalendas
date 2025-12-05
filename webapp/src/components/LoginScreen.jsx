import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const LoginScreen = ({ onSuccess, onError }) => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%',
            borderRadius: 2
          }}
        >
          <Box sx={{ m: 1, bgcolor: 'primary.main', p: 2, borderRadius: '50%' }}>
            <CalendarTodayIcon sx={{ color: 'white', fontSize: 40 }} />
          </Box>
          <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
            Kalendas
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Gestiona tus eventos y calendarios de forma colaborativa
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
              size="large"
              theme="filled_blue"
              shape="pill"
              text="signin_with"
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginScreen;
