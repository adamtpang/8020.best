import React, { useState, useEffect } from 'react';
import axios from 'axios';

const useDataPersistence = () => {
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [trashedItems, setTrashedItems] = useState([]);
  const [previousList1, setPreviousList1] = useState([]);
  const [previousList2, setPreviousList2] = useState([]);
  const [previousList3, setPreviousList3] = useState([]);
  const [previousTrashedItems, setPreviousTrashedItems] = useState([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [isSyncError, setIsSyncError] = useState(false);

  useEffect(() => {
    setPreviousList1(list1);
    setPreviousList2(list2);
    setPreviousList3(list3);
    setPreviousTrashedItems(trashedItems);
  }, []);

  const syncChanges = async () => {
    try {
      // Get the last sync time from localStorage on component mount
      const lastSync = localStorage.getItem('lastSyncTime') || null;

      // Find items that were added or modified since last sync
      const changes = {
        list1: {
          added: list1.filter(item => !previousList1.includes(item)),
          removed: previousList1.filter(item => !list1.includes(item))
        },
        list2: {
          added: list2.filter(item => !previousList2.some(prev => prev.idea === item.idea)),
          removed: previousList2.filter(item => !list2.some(curr => curr.idea === item.idea))
        },
        list3: {
          added: list3.filter(item => !previousList3.some(prev => prev.idea === item.idea)),
          removed: previousList3.filter(item => !list3.some(curr => curr.idea === item.idea))
        },
        trashedItems: {
          added: trashedItems.filter(item => !previousTrashedItems.includes(item)),
          removed: previousTrashedItems.filter(item => !trashedItems.includes(item))
        },
        timestamp: new Date().toISOString()
      };

      // Only sync if there are changes
      if (Object.values(changes).some(list =>
        list.added?.length > 0 || list.removed?.length > 0
      )) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/sync-changes`,
          {
            email: user.email,
            changes,
            lastSyncTimestamp: lastSync
          }
        );

        // Update last sync time
        const newSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', newSyncTime);
        setLastSyncTimestamp(newSyncTime);

        // Update previous state references
        setPreviousList1(list1);
        setPreviousList2(list2);
        setPreviousList3(list3);
        setPreviousTrashedItems(trashedItems);
      }
    } catch (error) {
      console.error('Error syncing changes:', error);
      setIsSyncError(true);
    }
  };

  return {
    list1,
    setList1,
    list2,
    setList2,
    list3,
    setList3,
    trashedItems,
    setTrashedItems,
    previousList1,
    setPreviousList1,
    previousList2,
    setPreviousList2,
    previousList3,
    setPreviousList3,
    previousTrashedItems,
    setPreviousTrashedItems,
    lastSyncTimestamp,
    setLastSyncTimestamp,
    isSyncError,
    setIsSyncError,
    syncChanges
  };
};