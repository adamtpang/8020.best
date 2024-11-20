import React, { useState, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

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
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setPreviousList1(list1);
    setPreviousList2(list2);
    setPreviousList3(list3);
    setPreviousTrashedItems(trashedItems);
  }, []);

  const CHUNK_SIZE = 100; // Smaller chunks for better reliability

  const syncData = async () => {
    if (!user || !isAuthReady) return;

    try {
      setIsSyncing(true);
      console.log('Starting sync for user:', user.email);

      // Split list1 into chunks
      const list1Chunks = [];
      for (let i = 0; i < list1.length; i += CHUNK_SIZE) {
        list1Chunks.push(list1.slice(i, i + CHUNK_SIZE));
      }

      // Process each chunk
      for (let i = 0; i < list1Chunks.length; i++) {
        console.log(`Syncing list1 chunk ${i + 1}/${list1Chunks.length}`);
        const chunk = {
          email: user.email,
          changes: {
            list1: {
              added: list1Chunks[i],
              removed: []
            },
            list2: i === 0 ? { added: list2, removed: [] } : { added: [], removed: [] },
            list3: i === 0 ? { added: list3, removed: [] } : { added: [], removed: [] },
            trashedItems: i === 0 ? { added: trashedItems, removed: [] } : { added: [], removed: [] },
            timestamp: new Date().toISOString()
          }
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/sync-changes`,
          chunk,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Chunk ${i + 1} sync response:`, response.data);
      }

      setIsSyncing(false);
      setIsSyncError(false);
      console.log('Sync completed successfully');

    } catch (error) {
      console.error('Sync error:', error);
      setIsSyncError(true);
      setIsSyncing(false);
    }
  };

  // Add debounced sync
  useEffect(() => {
    const debouncedSync = debounce(syncData, 2000);

    if (user && isAuthReady) {
      debouncedSync();
    }

    return () => debouncedSync.cancel();
  }, [list1, list2, list3, trashedItems, user, isAuthReady]);

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
    isSyncing,
    setIsSyncing
  };
};