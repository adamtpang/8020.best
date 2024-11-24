import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  LinearProgress
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

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

  return (
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
              selected={selectedIndex === index}
              onClick={(e) => {
                handleItemClick(index, e);
                onItemSelect(index);
              }}
              sx={{
                cursor: 'pointer',
                '&.MuiListItem-root': {
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.5) !important',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.6) !important',
                    }
                  }
                }
              }}
            >
              <ListItemText
                primary={typeof item === 'string' ? item : item.idea}
                sx={{
                  wordBreak: 'break-word',
                  '& .MuiTypography-root': {
                    whiteSpace: 'pre-wrap',
                    color: selectedIndex === index ? 'white' : 'inherit',
                    fontWeight: selectedIndex === index ? 500 : 400,
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ItemList;