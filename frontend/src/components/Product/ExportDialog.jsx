import React, { useState, useEffect } from 'react';
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
  Checkbox,
  Divider
} from '@mui/material';

const ExportDialog = ({
  open,
  onClose,
  items,
  onExport,
  list1Length,
  list2Length,
  list3Length,
  trashedItemsLength
}) => {
  const [exportOptions, setExportOptions] = useState({
    '1,1': true,
    '1,0': false,
    '0,1': false,
    '0,0': false
  });

  const totalStartingItems = list1Length + list2Length + list3Length + trashedItemsLength;

  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const newSelectedItems = items.filter(item => {
      const key = `${item.importanceValue},${item.urgencyValue}`;
      return exportOptions[key];
    });
    setSelectedItems(newSelectedItems);
  }, [items, exportOptions]);

  const handleExport = () => {
    const itemsKept = selectedItems.length;
    const itemsCurated = totalStartingItems - itemsKept;
    const reductionPercent = Math.round((itemsCurated / totalStartingItems) * 100);

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
          {/* Current Status */}
          <Typography variant="h6" gutterBottom>Current Item Distribution</Typography>
          <Box sx={{ pl: 2, mb: 3 }}>
            <Typography>List 1: {list1Length} items</Typography>
            <Typography>List 2: {list2Length} items</Typography>
            <Typography>List 3: {list3Length} items</Typography>
            <Typography>Trash: {trashedItemsLength} items</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography fontWeight="bold">
              Total Items Processed: {totalStartingItems} items
            </Typography>
          </Box>

          {/* Export Options */}
          <Typography variant="h6" gutterBottom>Select Items to Export</Typography>
          <FormGroup sx={{ pl: 2 }}>
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

          {/* Curation Score Preview */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Curation Score Preview</Typography>
            <Typography>
              Starting Items: {totalStartingItems}<br />
              Items to Keep: {selectedItems.length}<br />
              Items Curated Away: {totalStartingItems - selectedItems.length}<br />
              <Box sx={{ mt: 1, fontWeight: 'bold' }}>
                Curation Score: {Math.round((totalStartingItems - selectedItems.length) / totalStartingItems * 100)}%
              </Box>
            </Typography>
          </Box>
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