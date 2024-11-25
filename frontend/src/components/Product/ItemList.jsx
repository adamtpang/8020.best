import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import "../../styles/ItemList.css";

const getListTitle = (listNumber) => {
  switch (listNumber) {
    case 1: return "Problem?";
    case 2: return "Urgent?";
    case 3: return "Calendar?";
    default: return `List ${listNumber}`;
  }
};

const ItemList = ({
  items,
  selectedIndex,
  onItemSelect,
  onItemCopy,
  onDeleteItems,
  listNumber,
  onClearList,
  peakCount
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const progress = peakCount > 0 ? (items.length / peakCount) * 100 : 0;

  const handleItemClick = (index, event) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelectedItems = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
      setSelectedItems(newSelectedItems);
    } else {
      setSelectedItems([index]);
      setLastSelectedIndex(index);
    }
    onItemSelect(index);
  };

  const handleDelete = () => {
    if (selectedItems.length > 0) {
      const itemsToDelete = selectedItems.map(index => items[index]);
      onDeleteItems(itemsToDelete);
      setSelectedItems([]);
      setLastSelectedIndex(null);
    }
  };

  const handleDoubleClick = async (item) => {
    try {
      const textToCopy = typeof item === 'string' ? item : item.idea;
      await navigator.clipboard.writeText(textToCopy);
      setNotification({
        open: true,
        message: 'Copied to clipboard!',
        severity: 'success'
      });
    } catch (err) {
      setNotification({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    if (selectedIndex !== null) {
      const element = document.querySelector(`[data-listnum="${listNumber}"] [data-index="${selectedIndex}"]`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [selectedIndex, listNumber]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}>
            <Typography variant="subtitle1">
              {getListTitle(listNumber)} ({items.length})
            </Typography>
            <IconButton
              onClick={() => onClearList(listNumber)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <DeleteOutline />
            </IconButton>
          </Box>
          {peakCount > 0 && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: progress > 100 ? '#f44336' : '#2196f3'
                }
              }}
            />
          )}
        </Box>

        {/* List content */}
        <Box sx={{
          flex: 1,
          height: '100%',
        }}>
          <List
            data-listnum={listNumber}
            sx={{
              height: 'calc(100% - 70px)',
              overflowY: 'auto',
              padding: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}
          >
            {items.map((item, index) => (
              <ListItem
                key={index}
                data-index={index}
                selected={selectedIndex === index}
                onClick={(e) => {
                  handleItemClick(index, e);
                  onItemSelect(index);
                }}
                onDoubleClick={() => handleDoubleClick(item)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === index ? 'black !important' :
                    listNumber === 2 ?
                      (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)') :
                      listNumber === 3 ?
                        (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.35)' :
                        (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.35)' :
                        (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.15)' :
                        'rgba(244, 67, 54, 0.15)' :
                      'transparent',
                  color: selectedIndex === index ? 'white !important' : 'inherit',
                  borderLeft: selectedIndex === index ? '6px solid #333' : '6px solid transparent',
                  boxShadow: selectedIndex === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  '&:hover': {
                    backgroundColor: selectedIndex === index ? 'black !important' :
                      listNumber === 2 ?
                        (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)') :
                      listNumber === 3 ?
                        (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.45)' :
                        (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.45)' :
                        (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.2)' :
                        'rgba(244, 67, 54, 0.2)' :
                      'rgba(0, 0, 0, 0.04)',
                  },
                  borderRadius: 1,
                  mb: 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemText
                  primary={typeof item === 'string' ? item : item.idea}
                  sx={{
                    wordBreak: 'break-word',
                    '& .MuiTypography-root': {
                      whiteSpace: 'pre-wrap',
                      color: selectedIndex === index ? 'white' : 'rgba(0, 0, 0, 0.87)',
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ItemList;