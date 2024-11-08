import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Check } from '@mui/icons-material';

const SyncIndicator = ({ isSyncing, isError }) => {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      ml: 2,
      opacity: 0.6,
      transition: 'opacity 0.3s ease'
    }}>
      {isSyncing ? (
        <CircularProgress
          size={16}
          thickness={6}
          sx={{
            color: 'black',
            animation: 'rotate 1s linear infinite'
          }}
        />
      ) : isError ? (
        <Box sx={{
          color: 'error.main',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          Sync failed
        </Box>
      ) : (
        <Check
          sx={{
            fontSize: 18,
            color: 'success.main',
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}
    </Box>
  );
};

export default SyncIndicator;