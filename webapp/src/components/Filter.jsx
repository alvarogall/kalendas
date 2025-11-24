import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Filter = ({ label, value, onChange }) => (
  <TextField
    label={label}
    variant="outlined"
    size="small"
    fullWidth
    value={value}
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon color="action" />
        </InputAdornment>
      ),
    }}
    sx={{ mb: 2 }}
  />
);

export default Filter;