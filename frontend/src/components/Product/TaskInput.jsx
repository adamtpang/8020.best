import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { ContentPaste } from '@mui/icons-material';

const TaskInput = ({
  value,
  onChange,
  onSubmit,
  onImport
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <IconButton
        onClick={onImport}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <ContentPaste />
      </IconButton>
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{ flex: 1 }}
      >
        <TextField
          value={value}
          onChange={onChange}
          placeholder="Add new task..."
          size="small"
          fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default TaskInput;