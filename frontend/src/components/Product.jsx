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
} from "@mui/material";
import { Close as CloseIcon, ContentPaste, DeleteOutline, ContentCopy, HelpOutline, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import axios from "axios";

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

  // Add handler for adding tasks
  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setList1(prev => [newTask.trim(), ...prev]);
      setNewTask('');
      // Auto-select the new task
      setSelectedIndex1(0);
      setActiveList(1);
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

      setList2(prevList => {
        const newList = [{ importance, importanceValue, idea: selectedItem }, ...prevList];
        return newList;
      });

      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length === 0) {
          // If list1 is now empty, select first item in list2
          setSelectedIndex1(null);
          setSelectedIndex2(0);
          setActiveList(2);
        } else {
          // If there are still items in list1, select the next one
          const nextIndex = selectedIndex1 < newList.length ? selectedIndex1 : newList.length - 1;
          setSelectedIndex1(nextIndex);
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
      setClipboardContent(text);
      setIsDialogOpen(true);
      document.activeElement.blur();
    } catch (error) {
      console.error('Error reading clipboard:', error);
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

  // Update the export handler
  const handleExportList3 = async () => {
    setIsExportDialogOpen(true);
  };

  // Add handler for actual export
  const handleConfirmExport = async () => {
    try {
      const selectedTasks = list3.filter(item => {
        const key = `${item.importanceValue},${item.urgencyValue}`;
        return exportOptions[key];
      });

      const exportText = selectedTasks
        .map(item => `${item.importanceValue},${item.urgencyValue},${item.idea}`)
        .join('\n');

      await navigator.clipboard.writeText(exportText);
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Update useEffect to track peak counts
  useEffect(() => {
    if (list1.length > peakCount1) setPeakCount1(list1.length);
  }, [list1.length]);

  useEffect(() => {
    if (list2.length > peakCount2) setPeakCount2(list2.length);
  }, [list2.length]);

  useEffect(() => {
    if (list3.length > peakCount3) setPeakCount3(list3.length);
  }, [list3.length]);

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
      {/* Selected Task Bar */}
      <Paper
        sx={{
          p: 1.5,
          backgroundColor: 'black',
          color: 'white',
          minHeight: '35px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '1rem',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
        >
          {getSelectedTaskText() || "No task selected"}
        </Typography>
      </Paper>

      {/* Slider */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Slider
          value={sliderValue}
          onChange={(_, newValue) => setSliderValue(newValue)}
          step={1}
          marks
          min={0}
          max={1}
          sx={{
            width: 200,
            '& .MuiSlider-track': {
              backgroundColor: 'black',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#ccc',
            },
            '& .MuiSlider-thumb': {
              backgroundColor: 'black',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.16)',
              },
            },
            '& .MuiSlider-mark': {
              backgroundColor: '#bbb',
            },
            '& .MuiSlider-markActive': {
              backgroundColor: 'black',
            }
          }}
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
        {/* List 1: Initial Tasks */}
        <Paper sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '65vh'
        }}>
          {/* Top Controls Container */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            mb: 2,
            alignItems: 'center'  // Align items vertically
          }}>
            {/* Import Button */}
            <IconButton
              onClick={handleClipboardImport}
              size="small"
              sx={{ flexShrink: 0 }}  // Prevent button from shrinking
            >
              <ContentPaste />
            </IconButton>

            {/* Add Task Form */}
            <Box
              component="form"
              onSubmit={handleAddTask}
              sx={{ flex: 1 }}  // Take remaining space
            >
              <TextField
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add new task..."
                size="small"
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
              />
            </Box>
          </Box>

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
            {list1.length > 0 ? (
              list1.map((item, index) => (
                <ListItem
                  id={`list-1-item-${index}`}
                  key={index}
                  selected={selectedIndex1 === index}
                  onClick={() => handleSelectItem(1, index)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedIndex1 === index ? 'black !important' : 'transparent',
                    color: selectedIndex1 === index ? 'white !important' : 'inherit',
                    borderLeft: selectedIndex1 === index ? '6px solid #333' : '6px solid transparent',
                    boxShadow: selectedIndex1 === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    '&:hover': {
                      backgroundColor: selectedIndex1 === index ? 'black !important' : 'rgba(0, 0, 0, 0.04)',
                    },
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemText primary={item} />
                </ListItem>
              ))
            ) : (
              <ListItem
                sx={{
                  color: 'text.disabled',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  backgroundColor: selectedIndex1 === 0 ? 'black !important' : 'transparent',
                  borderLeft: selectedIndex1 === 0 ? '6px solid #333' : '6px solid transparent',
                  boxShadow: selectedIndex1 === 0 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '& .MuiListItemText-root': {
                    color: selectedIndex1 === 0 ? 'white !important' : 'text.disabled',
                  }
                }}
              >
                <ListItemText primary="Empty list" />
              </ListItem>
            )}
          </List>

          {/* Clear Button */}
          <IconButton
            onClick={() => {
              setListToClear(1);
              setClearConfirmOpen(true);
              document.activeElement.blur();
            }}
            size="small"
            color="default"
            sx={{ mt: 1, alignSelf: 'center', color: 'black', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          >
            <DeleteOutline />
          </IconButton>

          {/* Progress Line */}
          <Box
            sx={{
              width: '100%',
              height: 2,
              mb: 1,
              bgcolor: 'rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${peakCount1 ? (list1.length / peakCount1) * 100 : 0}%`,
                bgcolor: 'black',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Paper>

        {/* List 2: With Importance */}
        <Paper sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '65vh'
        }}>
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
            {list2.map((item, index, array) => {
              // Check if this item is the last '1' before the '0's start
              const isLastImportantItem =
                item.importanceValue === 1 &&
                (array[index + 1]?.importanceValue === 0);

              return (
                <React.Fragment key={index}>
                  <ListItem
                    id={`list-2-item-${index}`}
                    selected={selectedIndex2 === index}
                    onClick={() => handleSelectItem(2, index)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedIndex2 === index ? 'black !important' : 'transparent',
                      borderLeft: selectedIndex2 === index ? '6px solid #333' : '6px solid transparent',
                      boxShadow: selectedIndex2 === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                      '&:hover': {
                        backgroundColor: selectedIndex2 === index ? 'black !important' : 'rgba(0, 0, 0, 0.04)',
                      },
                      borderRadius: 1,
                      mb: isLastImportantItem ? 0 : 0.5,
                      transition: 'all 0.2s ease',
                      '& .MuiListItemText-root': {
                        color: selectedIndex2 === index ? 'white !important' : 'text.disabled',
                      }
                    }}
                  >
                    <ListItemText primary={`${item.importanceValue}, ${item.idea}`} />
                  </ListItem>
                  {isLastImportantItem && (
                    <Box
                      sx={{
                        my: 2,
                        height: '2px',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)',
                        position: 'relative',
                        '&::after': {
                          content: '"Not Important"',
                          position: 'absolute',
                          top: '-10px',
                          right: 0,
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          backgroundColor: 'white',
                          padding: '0 8px'
                        }
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </List>

          {/* Clear Button */}
          <IconButton
            onClick={() => {
              setListToClear(2);
              setClearConfirmOpen(true);
              document.activeElement.blur();
            }}
            size="small"
            color="default"
            sx={{ mt: 1, alignSelf: 'center', color: 'black', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          >
            <DeleteOutline />
          </IconButton>

          {/* Progress Line */}
          <Box
            sx={{
              width: '100%',
              height: 2,
              mb: 1,
              bgcolor: 'rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${peakCount2 ? (list2.length / peakCount2) * 100 : 0}%`,
                bgcolor: 'black',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Paper>

        {/* List 3: Final List */}
        <Paper sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '65vh'
        }}>
          {/* Add Export Button at top */}
          <IconButton
            onClick={handleExportList3}
            size="small"
            sx={{ alignSelf: 'flex-start', mb: 1, color: 'black', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          >
            <ContentCopy />
          </IconButton>

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
            {list3.length > 0 ? (
              list3.map((item, index) => (
                <ListItem
                  id={`list-3-item-${index}`}
                  key={index}
                  selected={selectedIndex3 === index}
                  onClick={() => handleSelectItem(3, index)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedIndex3 === index ? 'black !important' : 'transparent',
                    color: selectedIndex3 === index ? 'white !important' : 'inherit',
                    borderLeft: selectedIndex3 === index ? '6px solid #333' : '6px solid transparent',
                    boxShadow: selectedIndex3 === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    '&:hover': {
                      backgroundColor: selectedIndex3 === index ? 'black !important' : 'rgba(0, 0, 0, 0.04)',
                    },
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemText primary={`${item.importanceValue},${item.urgencyValue},${item.idea}`} />
                </ListItem>
              ))
            ) : (
              <ListItem
                sx={{
                  color: 'text.disabled',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  backgroundColor: selectedIndex3 === 0 ? 'black !important' : 'transparent',
                  borderLeft: selectedIndex3 === 0 ? '6px solid #333' : '6px solid transparent',
                  boxShadow: selectedIndex3 === 0 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '& .MuiListItemText-root': {
                    color: selectedIndex3 === 0 ? 'white !important' : 'text.disabled',
                  }
                }}
              >
                <ListItemText primary="Empty list" />
              </ListItem>
            )}
          </List>

          {/* Clear Button */}
          <IconButton
            onClick={() => {
              setListToClear(3);
              setClearConfirmOpen(true);
              document.activeElement.blur();
            }}
            size="small"
            color="default"
            sx={{ mt: 1, alignSelf: 'center', color: 'black', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          >
            <DeleteOutline />
          </IconButton>

          {/* Progress Line */}
          <Box
            sx={{
              width: '100%',
              height: 2,
              mb: 1,
              bgcolor: 'rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${peakCount3 ? (list3.length / peakCount3) * 100 : 0}%`,
                bgcolor: 'black',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Paper>
      </Box>

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
    </Box>
  );
};

export default Product;
