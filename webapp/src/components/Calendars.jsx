import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Checkbox, Typography, Box, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CircleIcon from '@mui/icons-material/Circle';

const CalendarItem = ({ calendar, allCalendars, onRemoveCalendar, onToggleCalendar, selectedCalendarIds, onInspectCalendar, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const isSelected = selectedCalendarIds.includes(calendar.id);
  const hasSubCalendars = calendar.subCalendars && calendar.subCalendars.length > 0;
  
  // Find subcalendar objects from the IDs
  const subCalendars = hasSubCalendars 
    ? allCalendars.filter(c => calendar.subCalendars.includes(c.id))
    : [];

  const handleToggle = () => {
    if (subCalendars.length > 0) {
      setOpen(!open);
    } else {
      onToggleCalendar(calendar.id);
    }
  };

  return (
    <>
      <ListItem
        secondaryAction={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="end" aria-label="inspect" onClick={() => onInspectCalendar(calendar)} size="small" sx={{ mr: 1 }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton edge="end" aria-label="delete" onClick={() => onRemoveCalendar(calendar.id, calendar.title)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
            {subCalendars.length > 0 && (
               <IconButton edge="end" size="small" onClick={() => setOpen(!open)}>
                 {open ? <ExpandLess /> : <ExpandMore />}
               </IconButton>
            )}
          </Box>
        }
        disablePadding
        sx={{ pl: level * 2 }}
      >
        <ListItemButton onClick={handleToggle} selected={isSelected} sx={{ pr: 16 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {subCalendars.length > 0 ? (
               // Folder icon or similar could go here, but user asked for dropdown behavior
               // We use the expand icon in secondary action or just click to expand
               <Box sx={{ width: 24, height: 24 }} /> 
            ) : (
                <Checkbox
                    edge="start"
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleCalendar(calendar.id);
                    }}
                    icon={<CircleIcon sx={{ color: 'transparent', border: `2px solid #1976d2`, borderRadius: '50%' }} fontSize="small" />}
                    checkedIcon={<CircleIcon sx={{ color: '#1976d2' }} fontSize="small" />}
                />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={calendar.title} 
            primaryTypographyProps={{ 
              variant: 'body2', 
              style: { fontWeight: isSelected ? 600 : 400 },
              noWrap: true
            }} 
          />
        </ListItemButton>
      </ListItem>
      {subCalendars.length > 0 && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {subCalendars.map(sub => (
              <CalendarItem 
                key={sub.id} 
                calendar={sub} 
                allCalendars={allCalendars}
                onRemoveCalendar={onRemoveCalendar}
                onToggleCalendar={onToggleCalendar}
                selectedCalendarIds={selectedCalendarIds}
                onInspectCalendar={onInspectCalendar}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Calendars = ({ calendars, onRemoveCalendar, onToggleCalendar, selectedCalendarIds, onInspectCalendar }) => {
  // Identify root calendars (those that are not subcalendars of anyone)
  // This assumes we have the full list. 
  // If the backend doesn't return the parent relationship, we have to infer it.
  // We can collect all IDs that are in someone's subCalendars list.
  
  const subCalendarIds = new Set();
  calendars.forEach(c => {
    if (c.subCalendars && c.subCalendars.length > 0) {
      c.subCalendars.forEach(id => subCalendarIds.add(id));
    }
  });

  const rootCalendars = calendars.filter(c => !subCalendarIds.has(c.id));

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: '#70757a', px: 2 }}>
        Mis Calendarios
      </Typography>
      <List dense>
        {rootCalendars.map(calendar => (
          <CalendarItem
            key={calendar.id}
            calendar={calendar}
            allCalendars={calendars}
            onRemoveCalendar={onRemoveCalendar}
            onToggleCalendar={onToggleCalendar}
            selectedCalendarIds={selectedCalendarIds}
            onInspectCalendar={onInspectCalendar}
          />
        ))}
      </List>
    </Box>
  );
};

export default Calendars;