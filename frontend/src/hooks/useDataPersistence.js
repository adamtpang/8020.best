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

  const CHUNK_SIZE = 500; // Number of items per chunk

  const syncChanges = async () => {
    try {
      const lastSync = localStorage.getItem('lastSyncTime') || null;

      // Calculate changes
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

      // Split large changes into chunks
      for (const listName in changes) {
        if (listName === 'timestamp') continue;

        const { added, removed } = changes[listName];
        if (added?.length > CHUNK_SIZE || removed?.length > CHUNK_SIZE) {
          // Split into chunks and sync sequentially
          for (let i = 0; i < added.length; i += CHUNK_SIZE) {
            const chunkChanges = {
              ...changes,
              [listName]: {
                added: added.slice(i, i + CHUNK_SIZE),
                removed: removed.slice(i, i + CHUNK_SIZE)
              },
              timestamp: new Date().toISOString()
            };

            console.log(`Syncing chunk ${i/CHUNK_SIZE + 1} of ${Math.ceil(added.length/CHUNK_SIZE)}`);

            await axios.post(
              `${import.meta.env.VITE_API_URL}/api/purchases/sync-changes`,
              {
                email: user.email,
                changes: chunkChanges,
                lastSyncTimestamp: lastSync
              }
            );
          }
        } else {
          // Sync normally for small changes
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/purchases/sync-changes`,
            {
              email: user.email,
              changes,
              lastSyncTimestamp: lastSync
            }
          );
        }
      }

      // Update after successful sync
      const newSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', newSyncTime);
      setLastSyncTimestamp(newSyncTime);

      // Update previous state references
      setPreviousList1(list1);
      setPreviousList2(list2);
      setPreviousList3(list3);
      setPreviousTrashedItems(trashedItems);

      setIsSyncError(false);
    } catch (error) {
      console.error('Sync error:', error);
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