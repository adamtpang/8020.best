// src/components/Product.jsx

import React, { useState, useEffect } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Slider,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Avatar,
  CircularProgress,
  Backdrop,
  Chip,
} from "@mui/material";
import {
  ContentPaste as PasteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import ItemList from "./Product/ItemList";
import useDataPersistence from './Product/hooks/useDataPersistence';
import MainLayout from "./Product/components/MainLayout";
import InstructionsDialog from "./Product/dialogs/InstructionsDialog";
import TrashDialog from "./Product/dialogs/TrashDialog";
import { analyzeTasks as analyzeTasksAPI, categorizeTasks } from '../services/aiPrioritization';
import CreditPurchaseDialog from './Product/dialogs/CreditPurchaseDialog';
import { getCredits } from '../services/api';

const Product = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashedItems, setTrashedItems] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [credits, setCredits] = useState(null);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(1);

  const { loadData, saveData, isLoading, isSyncing, isSyncError, setSyncSuccess, setSyncError } = useDataPersistence();

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await loadData();
        if (data) {
          setList1(data.list1 || []);
          setList2(data.list2 || []);
          setList3(data.list3 || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setNotification({
          open: true,
          message: 'Failed to load your data. Please try refreshing the page.',
          severity: 'error'
        });
      }
    };

    initializeData();
  }, [loadData]);

  // Save data when lists change
  useEffect(() => {
    if (isLoading) return;

    const saveTimeout = setTimeout(async () => {
      try {
        await saveData({ list1, list2, list3 });
        console.log('Data saved successfully');
      } catch (error) {
        console.error('Error saving data:', error);
        setNotification({
          open: true,
          message: 'Failed to save your changes. Please try again.',
          severity: 'error'
        });
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [list1, list2, list3, saveData, isLoading]);

  // Only analyze automatically on initial load or when specifically triggered
  useEffect(() => {
    const analyzeTasksIfNeeded = async () => {
      // Skip if already analyzed, no tasks, or currently analyzing
      if (hasAnalyzed || list1.length === 0 || isAnalyzing) return;

      await handleAnalyzeTasks();
      setHasAnalyzed(true);
    };

    analyzeTasksIfNeeded();
  }, [list1, hasAnalyzed]);

  // Load credits on component mount
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const data = await getCredits();
        setCredits(data.credits);
      } catch (error) {
        console.error('Error loading credits:', error);
      }
    };

    loadCredits();
  }, []);

  // Check for credit purchase dialog trigger
  useEffect(() => {
    const shouldShowPurchase = localStorage.getItem('showCreditPurchase');
    if (shouldShowPurchase === 'true') {
      const needed = Number(localStorage.getItem('creditsNeeded') || 1);
      setCreditsNeeded(needed);
      setShowCreditPurchase(true);
    }
  }, []);

  // Function to analyze tasks that can be called manually
  const handleAnalyzeTasks = async () => {
    if (list1.length === 0 || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      const analysis = await analyzeTasksAPI(list1);
      const { important, urgent, regular } = categorizeTasks(list1, analysis);

      setList1(regular);
      setList2(important);
      setList3(urgent);

      // Update notification
      setSyncSuccess(true);
      setHasAnalyzed(true);
      setTimeout(() => setSyncSuccess(false), 3000);

      // Update credits from localStorage if available
      const updatedCredits = localStorage.getItem('credits');
      if (updatedCredits) {
        setCredits(Number(updatedCredits));
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setSyncError(true);
      setTimeout(() => setSyncError(false), 3000);

      // Check if error is due to insufficient credits
      if (error.response && error.response.status === 403) {
        const needed = error.response.data.creditsNeeded || 1;
        setCreditsNeeded(needed);
        setShowCreditPurchase(true);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteItems = (listNumber, items) => {
    console.log('Deleting items:', { listNumber, items });
    switch (listNumber) {
      case 1:
        setList1(prev => prev.filter(item => !items.includes(item)));
        break;
      case 2:
        setList2(prev => prev.filter(item => !items.includes(item)));
        break;
      case 3:
        setList3(prev => prev.filter(item => !items.includes(item)));
        break;
    }
    // Add to trash
    setTrashedItems(prev => [...items, ...prev]);
  };

  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!newItem.trim()) return;

    setList1(prev => [newItem.trim(), ...prev]);
    setNewItem('');
    setHasAnalyzed(false); // Reset analyzed state when new items are added
  };

  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newItems = [...new Set(
        text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      )];

      if (newItems.length > 0) {
        const uniqueNewItems = newItems.filter(item => !list1.includes(item));
        if (uniqueNewItems.length > 0) {
          setList1(prev => [...uniqueNewItems, ...prev]);
          setNotification({
            open: true,
            message: `Imported ${uniqueNewItems.length} unique items`,
            severity: 'success'
          });
          setHasAnalyzed(false); // Reset analyzed state on import
        } else {
          setNotification({
            open: true,
            message: 'No new unique items to import',
            severity: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to import items',
        severity: 'error'
      });
    }
  };

  const handleExportList3 = async () => {
    try {
      const currentList = activeTab === 0 ? list1 : activeTab === 1 ? list2 : list3;
      const text = currentList.join('\n');
      await navigator.clipboard.writeText(text);
      setNotification({
        open: true,
        message: `Exported ${currentList.length} items to clipboard`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting to clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to export items',
        severity: 'error'
      });
    }
  };

  const handleRestoreFromTrash = (items) => {
    setList1(prev => [...items, ...prev]);
    setTrashedItems(prev => prev.filter(item => !items.includes(item)));
    setNotification({
      open: true,
      message: `Restored ${items.length} item${items.length === 1 ? '' : 's'}`,
      severity: 'success'
    });
  };

  const handleClearTrash = () => {
    setTrashedItems([]);
    setNotification({
      open: true,
      message: 'Trash cleared',
      severity: 'success'
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setNotification({
        open: true,
        message: 'Failed to sign out. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle credit purchase dialog close
  const handleCreditPurchaseClose = () => {
    setShowCreditPurchase(false);

    // Refresh credits after purchase dialog closes
    getCredits()
      .then(data => setCredits(data.credits))
      .catch(err => console.error('Error updating credits:', err));
  };

  return (
    <>
      <MainLayout
        navigate={navigate}
        newItem={newItem}
        setNewItem={setNewItem}
        handleClipboardImport={handleClipboardImport}
        handleAddItem={handleAddItem}
        handleExportList3={handleExportList3}
        setIsInputFocused={setIsInputFocused}
        setIsInstructionsOpen={setIsInstructionsOpen}
        setIsTrashOpen={setIsTrashOpen}
        isSyncing={isSyncing || isAnalyzing}
        isSyncError={isSyncError}
        trashedItems={trashedItems}
        onTriggerAnalysis={handleAnalyzeTasks}
        isAnalyzing={isAnalyzing}
        credits={credits}
      >
        <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {credits !== null && (
              <Chip
                label={`${credits} credits`}
                color={credits > 10 ? 'primary' : 'error'}
                size="small"
                onClick={() => setShowCreditPurchase(true)}
                sx={{ mr: 1, cursor: 'pointer' }}
              />
            )}
          </div>
        </div>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: '#fff'
              },
              '& .MuiTab-root': {
                color: '#999',
                '&.Mui-selected': {
                  color: '#fff'
                }
              }
            }}
          >
            <Tab label={`Unimportant (${list1.length})`} />
            <Tab label={`Important (${list2.length})`} />
            <Tab label={`Urgent (${list3.length})`} />
          </Tabs>

          <Box sx={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 1,
            border: '1px solid #333',
            overflow: 'hidden'
          }}>
            {activeTab === 0 && (
              <ItemList
                items={list1}
                listNumber={1}
                onDeleteItems={(items) => handleDeleteItems(1, items)}
                onAddItem={handleAddItem}
              />
            )}
            {activeTab === 1 && (
              <ItemList
                items={list2}
                listNumber={2}
                onDeleteItems={(items) => handleDeleteItems(2, items)}
                onAddItem={handleAddItem}
              />
            )}
            {activeTab === 2 && (
              <ItemList
                items={list3}
                listNumber={3}
                onDeleteItems={(items) => handleDeleteItems(3, items)}
                onAddItem={handleAddItem}
              />
            )}
          </Box>
        </Box>
      </MainLayout>

      {/* AI Analysis Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={isAnalyzing}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Analyzing tasks with AI...</Typography>
      </Backdrop>

      <InstructionsDialog
        open={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      <TrashDialog
        open={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        items={trashedItems}
        onRestore={handleRestoreFromTrash}
        onClear={handleClearTrash}
      />

      <CreditPurchaseDialog
        open={showCreditPurchase}
        onClose={handleCreditPurchaseClose}
        creditsNeeded={creditsNeeded}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Product;