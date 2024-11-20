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

  const syncData = async () => {
    if (!user || !isAuthReady) return;

    try {
      setIsSyncing(true);
      console.log('Starting chunked sync for user:', user.email);

      // Function to sync a single chunk
      const syncChunk = async (items, listName) => {
        const CHUNK_SIZE = 50;
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
          const chunk = items.slice(i, Math.min(i + CHUNK_SIZE, items.length));
          console.log(`Syncing ${listName} chunk ${i/CHUNK_SIZE + 1}/${Math.ceil(items.length/CHUNK_SIZE)}`);

          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/purchases/sync-chunk`,
            {
              email: user.email,
              listName,
              chunk: {
                items: chunk,
                startIndex: i,
                endIndex: Math.min(i + CHUNK_SIZE, items.length),
                totalItems: items.length
              }
            }
          );
        }
      };

      // Sync each list in chunks
      if (list1.length > 0) await syncChunk(list1, 'list1');
      if (list2.length > 0) await syncChunk(list2, 'list2');
      if (list3.length > 0) await syncChunk(list3, 'list3');
      if (trashedItems.length > 0) await syncChunk(trashedItems, 'trashedItems');

      // Final sync to update metadata
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchases/sync-complete`,
        {
          email: user.email,
          metadata: {
            list1Length: list1.length,
            list2Length: list2.length,
            list3Length: list3.length,
            trashedItemsLength: trashedItems.length,
            lastSyncedAt: new Date().toISOString()
          }
        }
      );

      setIsSyncing(false);
      setIsSyncError(false);

    } catch (error) {
      console.error('Sync error:', error);
      setIsSyncError(true);
      setIsSyncing(false);
    }
  };

  // Debounced sync
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