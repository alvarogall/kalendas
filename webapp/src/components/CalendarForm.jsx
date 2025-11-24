import React from 'react';
import { TextField, Button, Box, MenuItem } from '@mui/material';

const CalendarForm = ({ 
  onSubmit, 
  titleValue, onTitleChange, 
  descriptionValue, onDescriptionChange,
  keywordsValue, onKeywordsChange,
  startDateValue, onStartDateChange,
  endDateValue, onEndDateChange,
  parentCalendarValue, onParentCalendarChange,
  availableCalendars
}) => (
  <form onSubmit={onSubmit}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField
        label="Título"
        variant="outlined"
        fullWidth
        value={titleValue}
        onChange={onTitleChange}
        required
        autoFocus
      />
      <TextField
        label="Descripción"
        variant="outlined"
        fullWidth
        multiline
        rows={3}
        value={descriptionValue}
        onChange={onDescriptionChange}
      />
      <TextField
        label="Palabras clave (separadas por coma)"
        variant="outlined"
        fullWidth
        value={keywordsValue}
        onChange={onKeywordsChange}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Fecha Inicio"
          type="date"
          variant="outlined"
          fullWidth
          value={startDateValue}
          onChange={onStartDateChange}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Fecha Fin"
          type="date"
          variant="outlined"
          fullWidth
          value={endDateValue}
          onChange={onEndDateChange}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      
      <TextField
        select
        label="Calendario Padre (Opcional)"
        value={parentCalendarValue}
        onChange={onParentCalendarChange}
        fullWidth
        helperText="Selecciona si este calendario es un subcalendario"
      >
        <MenuItem value="">
          <em>Ninguno</em>
        </MenuItem>
        {availableCalendars.map((calendar) => (
          <MenuItem key={calendar.id} value={calendar.id}>
            {calendar.title}
          </MenuItem>
        ))}
      </TextField>

      <Button type="submit" variant="contained" color="primary" sx={{ alignSelf: 'flex-end' }}>
        Guardar
      </Button>
    </Box>
  </form>
);

export default CalendarForm;
