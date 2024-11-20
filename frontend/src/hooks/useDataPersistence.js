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
      const lastSync = localStorage.getItem('lastSyncTime') || null;

      // Log sizes before calculating changes
      console.log('Current list sizes:', {
        list1: list1.length,
        list2: list2.length,
        list3: list3.length,
        trashedItems: trashedItems.length
      });

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

      // Log the size of changes being sent
      console.log('Changes to sync:', {
        list1: { added: changes.list1.added.length, removed: changes.list1.removed.length },
        list2: { added: changes.list2.added.length, removed: changes.list2.removed.length },
        list3: { added: changes.list3.added.length, removed: changes.list3.removed.length },
        trashedItems: { added: changes.trashedItems.added.length, removed: changes.trashedItems.removed.length }
      });

      // Only sync if there are actual changes
      if (Object.values(changes).some(list =>
        list.added?.length > 0 || list.removed?.length > 0
      )) {
        console.log('Sending sync request...');

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/sync-changes`,
          {
            email: user.email,
            changes,
            lastSyncTimestamp: lastSync
          },
          {
            // Add timeout and size monitoring
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            onUploadProgress: (progressEvent) => {
              console.log('Upload progress:', progressEvent);
            }
          }
        );

        console.log('Sync response:', response.data);

        const newSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', newSyncTime);
        setLastSyncTimestamp(newSyncTime);

        // Update previous state references
        setPreviousList1(list1);
        setPreviousList2(list2);
        setPreviousList3(list3);
        setPreviousTrashedItems(trashedItems);

        setIsSyncError(false);
      } else {
        console.log('No changes to sync');
      }
    } catch (error) {
      console.error('Sync error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
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