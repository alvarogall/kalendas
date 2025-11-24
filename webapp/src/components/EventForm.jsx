import React from 'react';
import { TextField, Button, Box, InputLabel, Select, MenuItem, FormControl } from '@mui/material';

const EventForm = ({ 
  onSubmit, 
  title, onTitleChange, 
  start, onStartChange, 
  end, onEndChange, 
  location, onLocationChange, 
  description, onDescriptionChange, 
  onImageChange,
  calendars, selectedCalendar, onCalendarChange
}) => (
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
          {calendars.map(cal => (
            <MenuItem key={cal.id} value={cal.id}>{cal.title}</MenuItem>
          ))}
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
      </Box>
      <Button type="submit" variant="contained" color="primary" sx={{ alignSelf: 'flex-end' }}>
        Save
      </Button>
    </Box>
  </form>
);

export default EventForm;