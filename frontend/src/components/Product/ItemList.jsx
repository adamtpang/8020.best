import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

const ItemList = ({
  items,
  selectedIndex,
  onItemSelect,
  onItemCopy,
  onDeleteItems,
  peakCount,
  listNumber,
  onClearList
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

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
    const itemsToDelete = selectedItems.map(index => items[index]);
    onDeleteItems(itemsToDelete);
    setSelectedItems([]);
    setLastSelectedIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItems.length > 0) {
          handleDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems]);

  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '65vh',
      position: 'relative',
    }}>
      {/* List Label */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          mb: 1,
          fontSize: '0.75rem',
          opacity: 0.7
        }}
      >
        {listNumber === 1 ? "Problem?" :
         listNumber === 2 ? "Urgent?" :
         "Calendar?"}
      </Typography>

      <List
        id={`list-${listNumber}`}
        sx={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 1,
          p: 1,
          position: 'relative',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
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
        <Box sx={{
          position: 'relative',
          minHeight: '100%'
        }}>
          {items.map((item, index) => (
            <ListItem
              key={index}
              data-index={index}
              selected={selectedItems.includes(index)}
              onClick={(e) => handleItemClick(index, e)}
              onDoubleClick={() => onItemCopy(item)}
              sx={{
                cursor: 'pointer',
                backgroundColor: selectedItems.includes(index) ? 'black !Problem' :
                  listNumber === 1 ? 'transparent' :
                  listNumber === 2 ?
                    (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)') :
                  (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.35)' :
                  (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.35)' :
                  (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.15)' :
                  'rgba(244, 67, 54, 0.15)',
                color: selectedItems.includes(index) ? 'white !Problem' : 'inherit',
                borderLeft: selectedItems.includes(index) ? '6px solid #333' : '6px solid transparent',
                boxShadow: selectedItems.includes(index) ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                '&:hover': {
                  backgroundColor: selectedItems.includes(index) ? 'black !Problem' :
                    listNumber === 1 ? 'rgba(0, 0, 0, 0.04)' :
                    listNumber === 2 ?
                      (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)') :
                    (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.45)' :
                    (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.45)' :
                    (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.2)' :
                    'rgba(244, 67, 54, 0.2)',
                },
                borderRadius: 1,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemText
                primary={typeof item === 'string' ? item : item.idea}
                sx={{
                  m: 0,
                  width: '100%',
                  '& .MuiTypography-root': {
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    pr: 1,
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }
                }}
              />
            </ListItem>
          ))}
        </Box>
      </List>

      {/* Bottom Controls */}
      <Box sx={{
        mt: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1,
        position: 'relative',
      }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          {items.length} items
        </Typography>

        <IconButton
          onClick={handleDelete}
          size="small"
          sx={{
            color: 'black',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <DeleteOutline />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ItemList;