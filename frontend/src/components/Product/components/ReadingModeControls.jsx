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
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      position: 'fixed',
      bottom: 20,
      right: 20,
      backgroundColor: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <IconButton
        onClick={() => setIsReadingMode(!isReadingMode)}
        color={isReadingMode ? "primary" : "default"}
      >
        {isReadingMode ? <VolumeUp /> : <VolumeOff />}
      </IconButton>

      {isReadingMode && (
        <>
          <Typography variant="body2" sx={{ mr: 1 }}>Speed:</Typography>
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
        </>
      )}
    </Box>
  );
};

export default ReadingModeControls;