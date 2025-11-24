import React, { useState } from 'react';
import { Box, TextField, Button, Collapse, Typography, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const AdvancedSearch = ({ onSearch }) => {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = () => {
    onSearch({ keywords, organizer, startDate, endDate });
  };

  const handleClear = () => {
    setKeywords('');
    setOrganizer('');
    setStartDate('');
    setEndDate('');
    onSearch({});
  };

  return (
    <Box sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" color="text.secondary">Búsqueda Avanzada</Typography>
        <IconButton onClick={() => setOpen(!open)} size="small">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Nombre del calendario"
            size="small"
            value={keywords} // Reusing keywords state for title search as per App.jsx logic
            onChange={(e) => setKeywords(e.target.value)}
            fullWidth
          />
          <TextField
            label="Organizador"
            size="small"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={handleClear} size="small">Limpiar</Button>
            <Button variant="contained" onClick={handleSearch} size="small">Buscar</Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default AdvancedSearch;
