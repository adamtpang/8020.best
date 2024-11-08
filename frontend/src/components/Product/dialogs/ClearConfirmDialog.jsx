import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const ClearConfirmDialog = ({ open, onClose, onConfirm, listNumber }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Clear List {listNumber}?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to clear all items from List {listNumber}? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
        >
          Clear List
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClearConfirmDialog;