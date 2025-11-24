import React from 'react';
import { List, ListItem, ListItemText, IconButton, Typography, Box, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';

const NotificationList = ({ notifications, onMarkAsRead, onDelete }) => {
  if (notifications.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No notifications</Typography>;
  }

  return (
    <List sx={{ width: '100%', minWidth: 300, bgcolor: 'background.paper' }}>
      {notifications.map((n, index) => (
        <React.Fragment key={n.id}>
          <ListItem
            alignItems="flex-start"
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => onDelete(n.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <IconButton 
              edge="start" 
              aria-label="mark as read" 
              onClick={() => onMarkAsRead(n.id)} 
              disabled={n.read}
              sx={{ mt: 0.5, mr: 1 }}
            >
              {n.read ? <CheckCircleIcon color="disabled" fontSize="small" /> : <CircleIcon color="primary" fontSize="small" />}
            </IconButton>
            <ListItemText
              primary={n.message}
              secondary={
                <Typography
                  sx={{ display: 'inline' }}
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {n.channel}
                </Typography>
              }
            />
          </ListItem>
          {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default NotificationList;