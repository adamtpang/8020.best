import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

const ExportStatsDialog = ({
  open,
  onClose,
  stats
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        Task Reduction Results
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'black' }}>
            {stats?.percentage}% Reduced
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            You started with <b>{stats?.original}</b> tasks and ended with <b>{stats?.final}</b> tasks.
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            That's <b>{stats?.reduced}</b> fewer tasks to focus on!
          </Typography>

          {stats?.percentage >= 50 ? (
            <Typography variant="body1" sx={{ color: 'success.main' }}>
              Great job cutting down your task list! 🎉
            </Typography>
          ) : (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Consider being more selective to reduce your task load further.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: 'black',
            '&:hover': {
              backgroundColor: '#333',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportStatsDialog;