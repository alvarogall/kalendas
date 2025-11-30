import React from 'react';

import { TextField, Button, Box, InputLabel, Select, MenuItem, FormControl, Typography, CircularProgress } from '@mui/material';
import CoordinateMap from './CoordinateMap';


const EventForm = ({ 
  onSubmit, 
  title, onTitleChange, 
  start, onStartChange, 
  end, onEndChange, 
  location, onLocationChange, 
  description, onDescriptionChange, 
  onImageChange,
  image,
  onRemoveImage,
  attachment,
  onAttachmentChange,
  onRemoveAttachment,
  uploadingAttachment,
  uploadingAttachmentName,
  calendars, selectedCalendar, onCalendarChange,
  coordinates, onCoordinatesChange

}) => {
  const renderCalendarOptions = (cals, level = 0) => {
    return cals.reduce((acc, cal) => {
      // 1. Añadimos el calendario actual (Padre o Hijo)
      acc.push(
        <MenuItem 
          key={cal.id} 
          value={cal.id} 
          sx={{ 
            pl: 2 + (level * 2), // Añade indentación visual según el nivel
            fontWeight: level === 0 ? 500 : 400 // Negrita para padres
          }}
        >
          {/* Añadimos un pequeño indicador visual si es hijo */}
          {level > 0 && "└ "} {cal.title}
        </MenuItem>
      );

      // 2. Si tiene subcalendarios, llamamos a la función recursivamente (nivel + 1)
      if (cal.subCalendars && cal.subCalendars.length > 0) {
        acc.push(...renderCalendarOptions(cal.subCalendars, level + 1));
      }

      return acc;
    }, []);
  };
    
  return (
    <form onSubmit={onSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Title"
          variant="outlined"
          fullWidth
          value={title}
          onChange={onTitleChange}
          required
          autoFocus
        />
        
        <FormControl fullWidth required>
          <InputLabel id="calendar-select-label">Calendar</InputLabel>
          <Select
            labelId="calendar-select-label"
            value={selectedCalendar}
            label="Calendar"
            onChange={onCalendarChange}
          >
            {renderCalendarOptions(calendars)}
          </Select>
        </FormControl>

        <TextField
          label="Start Time"
          type="datetime-local"
          variant="outlined"
          fullWidth
          value={start}
          onChange={onStartChange}
          InputLabelProps={{
            shrink: true,
          }}
          required
        />
        <TextField
          label="End Time"
          type="datetime-local"
          variant="outlined"
          fullWidth
          value={end}
          onChange={onEndChange}
          InputLabelProps={{
            shrink: true,
          }}
          required
        />
        <TextField
          label="Location"
          variant="outlined"
          fullWidth
          value={location}
          onChange={onLocationChange}
        />
        
        <CoordinateMap 
          coordinates={coordinates}
          onCoordinatesChange={onCoordinatesChange}
          onLocationChange={onLocationChange}
        />
        
        <TextField
          label="Description"
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={onDescriptionChange}
        />
        <Box>
          <InputLabel shrink>Image</InputLabel>
          <input 
            type="file" 
            accept="image/*" 
            onChange={onImageChange} 
            style={{ marginTop: 8 }}
          />
          {image && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src={image} alt="preview" style={{ maxHeight: 80, borderRadius: 4 }} />
              <Button size="small" color="error" onClick={onRemoveImage}>Remove</Button>
            </Box>
          )}
        </Box>
        <Box>
          <InputLabel shrink>Attachment (document)</InputLabel>
          <input
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onAttachmentChange}
            style={{ marginTop: 8 }}
          />
          {attachment && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{attachment.name}</Typography>
              <Button size="small" color="error" onClick={onRemoveAttachment}>Remove</Button>
            </Box>
          )}
          {uploadingAttachment && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Subiendo {uploadingAttachmentName || 'archivo'}...</Typography>
            </Box>
          )}
        </Box>
        <Button type="submit" variant="contained" color="primary" sx={{ alignSelf: 'flex-end' }} disabled={uploadingAttachment}>
          {uploadingAttachment ? 'Subiendo...' : 'Save'}
        </Button>
      </Box>
    </form>
  );
};

export default EventForm;