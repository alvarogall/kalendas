import React from 'react';
import { Box, IconButton, Typography, Button, ButtonGroup } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const goToMonth = () => {
    toolbar.onView('month');
  };

  const goToWeek = () => {
    toolbar.onView('week');
  };

  const goToDay = () => {
    toolbar.onView('day');
  };

  const label = () => {
    const date = toolbar.date;
    const options = { month: 'long', year: 'numeric' };
    // Capitalize first letter
    const str = date.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button variant="outlined" size="small" onClick={goToCurrent} sx={{ textTransform: 'none', borderRadius: 4, mr: 1 }}>
          Hoy
        </Button>
        <IconButton onClick={goToBack} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={goToNext} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 500, textTransform: 'capitalize' }}>
        {label()}
      </Typography>

      <Box>
        <ButtonGroup variant="outlined" size="small" aria-label="view switcher">
            <Button 
                onClick={goToMonth} 
                variant={toolbar.view === 'month' ? 'contained' : 'outlined'}
            >
                Mes
            </Button>
            <Button 
                onClick={goToWeek}
                variant={toolbar.view === 'week' ? 'contained' : 'outlined'}
            >
                Semana
            </Button>
            <Button 
                onClick={goToDay}
                variant={toolbar.view === 'day' ? 'contained' : 'outlined'}
            >
                Día
            </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default CustomToolbar;
