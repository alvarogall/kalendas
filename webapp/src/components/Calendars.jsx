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
    const subCalendars = calendar.subCalendars || [];
    const hasSubCalendars = subCalendars.length > 0;
    
    // Función de Expansión/Contracción (con stopPropagation para no seleccionar)
    const handleToggle = (e) => {
        e.stopPropagation();
        setOpen(!open);
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
                    </Box>
                }
                disablePadding
                sx={{ pl: level * 2 }}
            >
                {/* ListItemButton para la SELECCIÓN */}
                <ListItemButton onClick={() => onToggleCalendar(calendar.id)} selected={isSelected} sx={{ pr: 16 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                        {/* Checkbox SIEMPRE PRESENTE */}
                        <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                            icon={<CircleIcon sx={{ color: 'transparent', border: `2px solid #1976d2`, borderRadius: '50%' }} fontSize="small" />}
                            checkedIcon={<CircleIcon sx={{ color: '#1976d2' }} fontSize="small" />}
                        />
                    </ListItemIcon>
                    
                    <ListItemText 
                        primary={calendar.title} 
                        primaryTypographyProps={{ 
                            variant: 'body2', 
                            style: { fontWeight: isSelected ? 600 : 400 },
                            noWrap: true
                        }} 
                    />

                    {/* ✅ BOTÓN DE EXPANSIÓN: AHORA DENTRO DE ListItemButton */}
                    {hasSubCalendars && (
                        <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={handleToggle} 
                            sx={{ ml: 1, mr: 6 }} 
                        >
                            {open ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    )}
                </ListItemButton>
            </ListItem>

            {/* Recursión y Collapse */}
            {hasSubCalendars && (
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
    
    // ✅ FILTRO CRÍTICO:
    // Solo mostramos en la lista raíz los calendarios que NO tienen padre.
    // Los que sí tienen padre (parentId) ya se mostrarán anidados dentro de sus padres gracias a CalendarItem.
    const rootCalendars = calendars.filter(calendar => !calendar.parentId);

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: '#70757a', px: 2 }}>
                Mis Calendarios
            </Typography>
            <List dense>
                {/* Mapeamos sobre la lista FILTRADA (rootCalendars) */}
                {rootCalendars.map(calendar => (
                    <CalendarItem
                        key={calendar.id}
                        calendar={calendar}
                        allCalendars={calendars} // Pasamos la lista completa por si acaso se necesita en recursión
                        onRemoveCalendar={onRemoveCalendar}
                        onToggleCalendar={onToggleCalendar}
                        selectedCalendarIds={selectedCalendarIds}
                        onInspectCalendar={onInspectCalendar}
                        level={0}
                    />
                ))}
            </List>
        </Box>
    );
};

export default Calendars;