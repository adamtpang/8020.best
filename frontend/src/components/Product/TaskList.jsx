import React from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Box } from '@mui/material';

const TaskList = ({
  tasks,
  selectedIndex,
  onTaskSelect,
  onTaskCopy,
  peakCount,
  listNumber
}) => {
  return (
    <Paper sx={{
      flex: 1,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '65vh',
      position: 'relative'
    }}>
      {/* Progress Bar */}
      <Box sx={{
        width: '100%',
        height: 2,
        bgcolor: 'rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${peakCount ? (tasks.length / peakCount) * 100 : 0}%`,
          bgcolor: 'black',
          transition: 'width 0.3s ease'
        }} />
      </Box>

      {/* Task Count */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'text.secondary',
          fontSize: '0.75rem',
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}
      >
        {tasks.length} tasks
      </Typography>

      <List sx={{
        flex: 1,
        overflow: 'auto',
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
      }}>
        {tasks.map((task, index) => (
          <ListItem
            key={index}
            selected={selectedIndex === index}
            onClick={() => onTaskSelect(index)}
            onDoubleClick={() => onTaskCopy(task)}
            sx={{
              cursor: 'pointer',
              backgroundColor: selectedIndex === index ? 'black !important' : 'transparent',
              color: selectedIndex === index ? 'white !important' : 'inherit',
              borderLeft: selectedIndex === index ? '6px solid #333' : '6px solid transparent',
              boxShadow: selectedIndex === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              '&:hover': {
                backgroundColor: selectedIndex === index ? 'black !important' : 'rgba(0, 0, 0, 0.04)',
              },
              borderRadius: 1,
              mb: 0.5,
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemText
              primary={listNumber === 1 ? task :
                listNumber === 2 ? `${task.importanceValue}, ${task.idea}` :
                `${task.importanceValue},${task.urgencyValue},${task.idea}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TaskList;