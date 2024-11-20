import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, IconButton } from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';

const ReadingModeControls = ({
  isReadingMode,
  setIsReadingMode,
  speechRate,
  setSpeechRate
}) => {
  const handleSpeedChange = (event, newSpeed) => {
    if (newSpeed !== null) {
      setSpeechRate(newSpeed);
    }
  };

  return (
    <>
      <IconButton
        onClick={() => setIsReadingMode(!isReadingMode)}
        size="small"
        sx={{
          backgroundColor: 'black',
          color: 'white',
          '&:hover': { backgroundColor: '#333' },
          width: 40,
          height: 40
        }}
      >
        {isReadingMode ? <VolumeUp /> : <VolumeOff />}
      </IconButton>

      {isReadingMode && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'white',
          padding: '4px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          ml: 1
        }}>
          <Typography variant="body2" sx={{ color: 'black' }}>Speed:</Typography>
          <ToggleButtonGroup
            value={speechRate}
            exclusive
            onChange={handleSpeedChange}
            size="small"
          >
            <ToggleButton value={1}>1x</ToggleButton>
            <ToggleButton value={2}>2x</ToggleButton>
            <ToggleButton value={3}>3x</ToggleButton>
            <ToggleButton value={4}>4x</ToggleButton>
            <ToggleButton value={5}>5x</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </>
  );
};

export default ReadingModeControls;