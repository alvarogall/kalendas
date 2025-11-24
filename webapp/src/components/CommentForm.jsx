import React from 'react';
import { TextField, Button, Box } from '@mui/material';

const CommentForm = ({ onSubmit, text, onTextChange, user, onUserChange }) => (
  <form onSubmit={onSubmit}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField
        label="User"
        variant="outlined"
        fullWidth
        value={user}
        onChange={onUserChange}
        required
      />
      <TextField
        label="Comment"
        variant="outlined"
        fullWidth
        multiline
        rows={2}
        value={text}
        onChange={onTextChange}
        required
      />
      <Button type="submit" variant="contained" color="primary" sx={{ alignSelf: 'flex-end' }}>
        Add Comment
      </Button>
    </Box>
  </form>
);

export default CommentForm;