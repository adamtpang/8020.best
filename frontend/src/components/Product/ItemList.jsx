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
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle1">
          List {listNumber} ({items.length} items)
          {peakCount > 0 && ` - Peak: ${peakCount}`}
        </Typography>
        <IconButton
          onClick={() => onClearList(listNumber)}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <DeleteOutline />
        </IconButton>
      </Box>

      {/* List content */}
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: 0,
        }}
      >
        {items.map((item, index) => (
          <ListItem
            key={index}
            selected={selectedItems.includes(index)}
            onClick={(e) => handleItemClick(index, e)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ListItemText
              primary={typeof item === 'string' ? item : item.idea}
              sx={{
                wordBreak: 'break-word',
                '& .MuiTypography-root': {
                  whiteSpace: 'pre-wrap',
                }
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onItemCopy(item);
              }}
            >
              <DeleteOutline />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ItemList;