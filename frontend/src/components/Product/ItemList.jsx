import React from 'react';
import { Box, Typography, IconButton, Paper, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

const ItemList = ({ items, color = '#f5f5f5' }) => {
  const handleCopyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  if (items.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          backgroundColor: color,
          border: '1px dashed rgba(0, 150, 136, 0.2)',
          color: 'text.secondary',
          fontStyle: 'italic',
          fontSize: '0.9rem'
        }}
      >
        No items yet
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: '4px'
        }}
      >
        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              backgroundColor: color,
              mb: index !== items.length - 1 ? '2px' : 0,
              transition: 'all 0.2s',
              position: 'relative',
              '&:hover': {
                backgroundColor: `rgba(0, 150, 136, 0.08)`,
                transform: 'translateX(3px)'
              },
              '&:hover .copy-button': {
                opacity: 1
              }
            }}
          >
            <Typography
              sx={{
                fontSize: '0.95rem',
                lineHeight: 1.5,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '30px'
              }}
            >
              {item}
            </Typography>

            <Tooltip title="Copy to clipboard">
              <IconButton
                size="small"
                className="copy-button"
                onClick={() => handleCopyToClipboard(item)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: '8px',
                  transform: 'translateY(-50%)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'white'
                  },
                  width: '24px',
                  height: '24px'
                }}
              >
                <CopyIcon fontSize="small" sx={{ fontSize: '14px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default ItemList;