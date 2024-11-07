import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';

const ExportDialog = ({
  open,
  onClose,
  items,
  onExport,
  totalItemsAcrossAllLists
}) => {
  const [exportOptions, setExportOptions] = useState({
    '1,1': true,  // Important & Urgent checked by default
    '1,0': false,
    '0,1': false,
    '0,0': false
  });

  const handleExport = () => {
    const selectedItems = items.filter(item => {
      const key = `${item.importanceValue},${item.urgencyValue}`;
      return exportOptions[key];
    });

    const reductionPercent = Math.round(
      ((totalItemsAcrossAllLists - selectedItems.length) / totalItemsAcrossAllLists) * 100
    );

    onExport(selectedItems, reductionPercent);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        Export Items
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>
            Select which items to export:
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions['1,1']}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    '1,1': e.target.checked
                  }))}
                />
              }
              label="Important & Urgent (1,1)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions['1,0']}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    '1,0': e.target.checked
                  }))}
                />
              }
              label="Important, Not Urgent (1,0)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions['0,1']}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    '0,1': e.target.checked
                  }))}
                />
              }
              label="Not Important, Urgent (0,1)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions['0,0']}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    '0,0': e.target.checked
                  }))}
                />
              }
              label="Not Important, Not Urgent (0,0)"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          sx={{
            backgroundColor: 'black',
            '&:hover': {
              backgroundColor: '#333',
            }
          }}
        >
          Export Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;