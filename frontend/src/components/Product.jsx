// src/components/Product.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Paper,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { Close as CloseIcon, ContentPaste, DeleteOutline, ContentCopy, HelpOutline, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import axios from "axios";
import TaskList from './Product/TaskList';
import TaskInput from './Product/TaskInput';
import ExportStatsDialog from './Product/ExportStatsDialog';

const Product = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  // Core state
  const [list1, setList1] = useState([]);  // Initial list
  const [list2, setList2] = useState([]); // With importance
  const [list3, setList3] = useState([]); // With importance & urgency
  const [selectedIndex1, setSelectedIndex1] = useState(null);
  const [selectedIndex2, setSelectedIndex2] = useState(null);
  const [selectedIndex3, setSelectedIndex3] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [activeList, setActiveList] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clipboardContent, setClipboardContent] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [listToClear, setListToClear] = useState(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  // Add new state for import progress
  const [importProgress, setImportProgress] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [remainingLines, setRemainingLines] = useState(0);

  // Add new state for peak counts
  const [peakCount1, setPeakCount1] = useState(0);
  const [peakCount2, setPeakCount2] = useState(0);
  const [peakCount3, setPeakCount3] = useState(0);

  // Add new state for export dialog and options
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    '1,1': true,  // 11s checked by default
    '1,0': false,
    '0,1': false,
    '0,0': false
  });

  // Add new state for text input
  const [newTask, setNewTask] = useState('');

  // Add new state for notification
  const [notification, setNotification] = useState({ open: false, message: '' });

  // Add handler for adding tasks
  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setList1(prev => [newTask.trim(), ...prev]);
      setNewTask('');
      // Auto-highlight the new task
      setSelectedIndex1(0);  // Select first item since we add to top
      setActiveList(1);

      // If this is the first task, update peak count
      if (list1.length === 0) {
        setPeakCount1(1);
      }
    }
  };

  // Handle selecting an item
  const handleSelectItem = (listNumber, index) => {
    if (listNumber === 1) {
      setActiveList(1);
      setSelectedIndex2(null);
      setSelectedIndex3(null);
      setSelectedIndex1(index);
    } else if (listNumber === 2) {
      setActiveList(2);
      setSelectedIndex1(null);
      setSelectedIndex3(null);
      setSelectedIndex2(index);
    } else if (listNumber === 3) {
      setActiveList(3);
      setSelectedIndex1(null);
      setSelectedIndex2(null);
      setSelectedIndex3(index);
    }
  };

  // Move items between lists
  const handleMoveToList2 = () => {
    if (selectedIndex1 !== null) {
      const selectedItem = list1[selectedIndex1];
      const importanceValue = Number(sliderValue === 1);
      const importance = importanceValue === 1;

      // Add new item and sort list2
      setList2(prevList => {
        const newList = [
          ...prevList,
          {
            importance,
            importanceValue,
            idea: selectedItem
          }
        ].sort((a, b) => {
          // Sort by importanceValue in descending order (1s first, then 0s)
          return b.importanceValue - a.importanceValue;
        });

        return newList;
      });

      // Remove from list1
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          const nextIndex = selectedIndex1 < newList.length ? selectedIndex1 : newList.length - 1;
          setSelectedIndex1(nextIndex);
        } else {
          setSelectedIndex1(null);
        }
        return newList;
      });
    }
  };

  const handleMoveToList3 = () => {
    if (selectedIndex2 !== null) {
      const selectedItem = list2[selectedIndex2];
      console.log('Moving to List 3 - Current slider value:', sliderValue);
      const urgencyValue = Number(sliderValue === 1);
      const urgency = urgencyValue === 1;
      console.log('Calculated urgency value:', urgencyValue);

      // Add new item and sort list3
      const newList3 = [...list3, {
        importance: selectedItem.importance,
        importanceValue: selectedItem.importanceValue,
        urgency,
        urgencyValue,
        idea: selectedItem.idea
      }].sort((a, b) => {
        // First sort by importance
        if (b.importanceValue !== a.importanceValue) {
          return b.importanceValue - a.importanceValue;
        }
        // Then by urgency if importance is equal
        return b.urgencyValue - a.urgencyValue;
      });

      setList3(newList3);

      // Remove item from list2 and update selection
      setList2(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
        if (newList.length > 0) {
          const nextIndex = selectedIndex2 < newList.length ? selectedIndex2 : newList.length - 1;
          setSelectedIndex2(nextIndex);
        } else {
          setSelectedIndex2(null);
        }
        return newList;
      });
    }
  };

  // Remove items
  const handleRemoveItem = (listNumber) => {
    if (listNumber === 1 && selectedIndex1 !== null) {
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          if (selectedIndex1 >= newList.length) {
            setSelectedIndex1(newList.length - 1);
          }
        } else {
          setSelectedIndex1(null);
        }
        return newList;
      });
    } else if (listNumber === 2 && selectedIndex2 !== null) {
      setList2(list2.filter((_, idx) => idx !== selectedIndex2));
      setSelectedIndex2(null);
    } else if (listNumber === 3 && selectedIndex3 !== null) {
      setList3(list3.filter((_, idx) => idx !== selectedIndex3));
      setSelectedIndex3(null);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('Loading data for user:', user.uid);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/get-user-data/${user.uid}`);
          const userData = response.data;

          if (userData) {
            console.log('Loaded user data:', userData);
            setList1(userData.list1 || []);
            setList2(userData.list2 || []);
            setList3(userData.list3 || []);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    // Add auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      }
    });

    // Initial load
    loadUserData();

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Save data when it changes
  useEffect(() => {
    const saveUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/save-user-data`, {
            userId: user.uid,
            list1,
            list2,
            list3
          });
        }
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    };

    if (list1.length > 0 || list2.length > 0 || list3.length > 0) {
      const debounceTimer = setTimeout(saveUserData, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [list1, list2, list3]);

  // Add clipboard import functions
  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newItems = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (newItems.length > 0) {
        setList1(prev => [...newItems, ...prev]);
        // Auto-highlight the first imported task
        setSelectedIndex1(0);
        setActiveList(1);

        // Update peak count if needed
        setPeakCount1(prev => Math.max(prev, newItems.length));
      }
    } catch (error) {
      console.error('Error importing from clipboard:', error);
    }
  };

  // Add effect to auto-select top task in List 1
  useEffect(() => {
    if (list1.length > 0 && selectedIndex1 === null) {
      setSelectedIndex1(0);
      setActiveList(1);
    }
  }, [list1]);

  // Update handleConfirmImport to show progress
  const handleConfirmImport = () => {
    const newItems = clipboardContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    setTotalLines(newItems.length);
    setRemainingLines(newItems.length);
    setImportProgress(0);

    // Add items one by one with progress
    newItems.forEach((item, index) => {
      setTimeout(() => {
        setList1(prevList => [item, ...prevList]);
        setRemainingLines(prev => prev - 1);
        setImportProgress(((index + 1) / newItems.length) * 100);
      }, index * 50); // 50ms delay between each item
    });

    // Close dialog after all items are added
    setTimeout(() => {
      setIsDialogOpen(false);
      setClipboardContent("");
      setImportProgress(0);
      setTotalLines(0);
      setRemainingLines(0);
      setSelectedIndex1(0);
      setActiveList(1);
    }, newItems.length * 50);
  };

  // Helper function to get currently selected task text
  const getSelectedTaskText = () => {
    if (selectedIndex1 !== null) {
      return list1[selectedIndex1];
    } else if (selectedIndex2 !== null) {
      return list2[selectedIndex2].idea;
    } else if (selectedIndex3 !== null) {
      return list3[selectedIndex3].idea;
    }
    return null;
  };

  // Update the keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSliderValue(0);
      } else if (e.key === 'ArrowRight') {
        setSliderValue(1);
      } else if (e.key === 'Enter') {
        if (selectedIndex1 !== null) {
          handleMoveToList2();
        } else if (selectedIndex2 !== null) {
          handleMoveToList3();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIndex1 !== null) {
          setList1(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
            if (newList.length > 0) {
              if (selectedIndex1 >= newList.length) {
                setSelectedIndex1(newList.length - 1);
              }
            } else {
              setSelectedIndex1(null);
            }
            return newList;
          });
        } else if (selectedIndex2 !== null) {
          setList2(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
            if (newList.length > 0) {
              if (selectedIndex2 >= newList.length) {
                setSelectedIndex2(newList.length - 1);
              }
            } else {
              setSelectedIndex2(null);
            }
            return newList;
          });
        } else if (selectedIndex3 !== null) {
          setList3(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex3);
            if (newList.length > 0) {
              if (selectedIndex3 >= newList.length) {
                setSelectedIndex3(newList.length - 1);
              }
            } else {
              setSelectedIndex3(null);
            }
            return newList;
          });
        }
      } else if (e.key === '[' || e.key === ']') {
        // Handle bracket key navigation between lists
        let nextList;
        if (e.key === '[') {
          // Move left
          if (selectedIndex2 !== null || activeList === 2) {
            nextList = 1;
            setSelectedIndex2(null);
            // Don't set selection if list is empty
            setSelectedIndex1(list1.length > 0 ? 0 : null);
          } else if (selectedIndex3 !== null || activeList === 3) {
            nextList = 2;
            setSelectedIndex3(null);
            // Don't set selection if list is empty
            setSelectedIndex2(list2.length > 0 ? 0 : null);
          }
        } else {
          // Move right (])
          if (selectedIndex1 !== null || activeList === 1) {
            nextList = 2;
            setSelectedIndex1(null);
            // Don't set selection if list is empty
            setSelectedIndex2(list2.length > 0 ? 0 : null);
          } else if (selectedIndex2 !== null || activeList === 2) {
            nextList = 3;
            setSelectedIndex2(null);
            // Don't set selection if list is empty
            setSelectedIndex3(list3.length > 0 ? 0 : null);
          }
        }
        if (nextList) {
          setActiveList(nextList);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent page scrolling

        // Determine which list is active and its current selection
        let currentList, currentIndex, setIndex, maxIndex;
        if (selectedIndex1 !== null) {
          currentList = 1;
          currentIndex = selectedIndex1;
          setIndex = setSelectedIndex1;
          maxIndex = list1.length - 1;
        } else if (selectedIndex2 !== null) {
          currentList = 2;
          currentIndex = selectedIndex2;
          setIndex = setSelectedIndex2;
          maxIndex = list2.length - 1;
        } else if (selectedIndex3 !== null) {
          currentList = 3;
          currentIndex = selectedIndex3;
          setIndex = setSelectedIndex3;
          maxIndex = list3.length - 1;
        }

        // If we have an active list, handle navigation
        if (currentList) {
          let newIndex;
          if (e.key === 'ArrowUp') {
            // Move up (decrease index)
            newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
          } else {
            // Move down (increase index)
            newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
          }
          setIndex(newIndex);

          // Scroll the selected item into view
          setTimeout(() => {
            const selectedElement = document.querySelector(`#list-${currentList}-item-${newIndex}`);
            if (selectedElement) {
              selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedIndex1,
    selectedIndex2,
    selectedIndex3,
    list1.length,
    list2.length,
    list3.length,
    sliderValue,
    activeList  // Add activeList to dependencies
  ]);

  const handleClearConfirm = () => {
    switch(listToClear) {
      case 1:
        setList1([]);
        setSelectedIndex1(null);
        break;
      case 2:
        setList2([]);
        setSelectedIndex2(null);
        break;
      case 3:
        setList3([]);
        setSelectedIndex3(null);
        break;
    }
    setClearConfirmOpen(false);
    setListToClear(null);
  };

  // Add to state
  const [exportStats, setExportStats] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  // Update handleExportList3 function
  const handleExportList3 = async () => {
    try {
      const exportText = list3
        .map(item => `${item.importanceValue},${item.urgencyValue},${item.idea}`)
        .join('\n');

      await navigator.clipboard.writeText(exportText);

      // Calculate stats
      const totalOriginalTasks = peakCount1;
      const finalTasks = list3.length;
      const tasksReduced = totalOriginalTasks - finalTasks;
      const percentageReduced = Math.round((tasksReduced / totalOriginalTasks) * 100);

      setExportStats({
        original: totalOriginalTasks,
        final: finalTasks,
        reduced: tasksReduced,
        percentage: percentageReduced
      });

      setNotification({
        open: true,
        message: 'Tasks exported! Opening stats...'
      });

      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Error exporting:', error);
      setNotification({
        open: true,
        message: 'Failed to export tasks'
      });
    }
  };

  // Stats Dialog component
  <Dialog
    open={Boolean(exportStats) && statsDialogOpen}
    onClose={() => {
      setStatsDialogOpen(false);
      setExportStats(null);
    }}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
      Task Reduction Results
    </DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'black' }}>
          {exportStats?.percentage}% Reduced
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          You started with <b>{exportStats?.original}</b> tasks and ended with <b>{exportStats?.final}</b> tasks.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          That's <b>{exportStats?.reduced}</b> fewer tasks to focus on!
        </Typography>

        {exportStats?.percentage >= 50 ? (
          <Typography variant="body1" sx={{ color: 'success.main' }}>
            Great job cutting down your task list! 🎉
          </Typography>
        ) : (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Consider being more selective to reduce your task load further.
          </Typography>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={() => {
          setStatsDialogOpen(false);
          setExportStats(null);
        }}
        variant="contained"
        sx={{
          backgroundColor: 'black',
          '&:hover': {
            backgroundColor: '#333',
          }
        }}
      >
        Close
      </Button>
    </DialogActions>
  </Dialog>

  // Add copy handler function
  const handleTaskCopy = async (task) => {
    try {
      // Format task based on which list it's in
      let textToCopy;
      if (typeof task === 'string') {
        textToCopy = task;  // List 1
      } else if (task.urgencyValue !== undefined) {
        textToCopy = `${task.importanceValue},${task.urgencyValue},${task.idea}`;  // List 3
      } else {
        textToCopy = `${task.importanceValue},${task.idea}`;  // List 2
      }

      await navigator.clipboard.writeText(textToCopy);
      setNotification({
        open: true,
        message: 'Task copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      setNotification({
        open: true,
        message: 'Failed to copy task'
      });
    }
  };

  return (
    <Box sx={{
      height: '85vh',
      overflow: 'hidden',
      display: "flex",
      flexDirection: "column",
      p: 2,
      gap: 1.5,
      position: 'relative'
    }}>
      {/* Slider */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Slider
          value={sliderValue}
          onChange={(_, newValue) => setSliderValue(newValue)}
          step={1}
          marks
          min={0}
          max={1}
          sx={{ width: 200 }}
          size="small"
        />
      </Box>

      {/* Lists Container */}
      <Box sx={{
        display: "flex",
        gap: 2,
        flex: 1,
        minHeight: 0,
        maxHeight: '60vh'
      }}>
        <TaskList
          tasks={list1}
          selectedIndex={selectedIndex1}
          onTaskSelect={(index) => handleSelectItem(1, index)}
          onTaskCopy={handleTaskCopy}
          peakCount={peakCount1}
          listNumber={1}
        />
        <TaskList
          tasks={list2}
          selectedIndex={selectedIndex2}
          onTaskSelect={(index) => handleSelectItem(2, index)}
          onTaskCopy={handleTaskCopy}
          peakCount={peakCount2}
          listNumber={2}
        />
        <TaskList
          tasks={list3}
          selectedIndex={selectedIndex3}
          onTaskSelect={(index) => handleSelectItem(3, index)}
          onTaskCopy={handleTaskCopy}
          peakCount={peakCount3}
          listNumber={3}
        />
      </Box>

      <ExportStatsDialog
        open={Boolean(exportStats) && statsDialogOpen}
        onClose={() => {
          setStatsDialogOpen(false);
          setExportStats(null);
        }}
        stats={exportStats}
      />

      {/* Add Import Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        aria-labelledby="clipboard-preview-dialog-title"
      >
        <DialogTitle id="clipboard-preview-dialog-title">
          Import from Clipboard
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to add the following items to the top of List 1?
          </DialogContentText>
          <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
            {clipboardContent.split("\n").map((line, index) => (
              <Typography key={index} variant="body2">
                {line}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDialogOpen(false);
              setImportProgress(0);
              setTotalLines(0);
              setRemainingLines(0);
            }}
            disabled={importProgress > 0}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            autoFocus
            disabled={importProgress > 0}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Clear Confirmation Dialog */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => {
          setClearConfirmOpen(false);
          setListToClear(null);
        }}
      >
        <DialogTitle>Clear List</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear this list?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setClearConfirmOpen(false);
              setListToClear(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearConfirm}
            color="error"
            autoFocus
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Button */}
      <IconButton
        onClick={() => setIsInstructionsOpen(true)}
        size="small"
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: 'black',
          color: 'white',
          '&:hover': {
            backgroundColor: '#333'
          },
          boxShadow: 1,
          width: 40,
          height: 40
        }}
      >
        <HelpOutline />
      </IconButton>

      {/* Instructions Dialog */}
      <Dialog
        open={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          How to Use Hower
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Step by Step Guide</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography paragraph>
                1. <b>Import Tasks</b><br />
                • Paste your tasks using the clipboard icon, or<br />
                • Type tasks one by one in the input box
              </Typography>

              <Typography paragraph>
                2. <b>Rate Tasks by Importance</b><br />
                • Navigate tasks using Up/Down arrow keys<br />
                • Use Left/Right arrow keys to set importance (0 or 1)<br />
                • Press Enter to move task to next list
              </Typography>

              <Typography paragraph>
                3. <b>Rate Tasks by Urgency</b><br />
                • Navigate to second list using ] key<br />
                • Use Left/Right arrow keys to set urgency (0 or 1)<br />
                • Press Enter to move task to final list
              </Typography>

              <Typography paragraph>
                4. <b>Review Final List</b><br />
                • Tasks are automatically sorted by importance and urgency<br />
                • Format: importance,urgency,task<br />
                • Use the copy icon to export your prioritized tasks
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Keyboard Shortcuts</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography>
                • <b>[ and ]</b> - Move between lists<br />
                • <b>↑/↓</b> - Navigate tasks<br />
                • <b>←/→</b> - Toggle rating (0/1)<br />
                • <b>Enter</b> - Move task forward<br />
                • <b>Delete/Backspace</b> - Remove task
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Task Ratings</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography>
                • <b>1,1</b> - Important & Urgent<br />
                • <b>1,0</b> - Important, Not Urgent<br />
                • <b>0,1</b> - Not Important, Urgent<br />
                • <b>0,0</b> - Not Important, Not Urgent
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsInstructionsOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: 'black',
              '&:hover': {
                backgroundColor: '#333',
              }
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Export Dialog */}
      <Dialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Tasks</DialogTitle>
        <DialogContent>
          <Typography gutterBottom sx={{ mb: 2 }}>
            Select which tasks to export:
          </Typography>
          <FormGroup>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmExport}
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

      {/* Add Snackbar component at the end of your JSX */}
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity="success"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '.MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Product;
