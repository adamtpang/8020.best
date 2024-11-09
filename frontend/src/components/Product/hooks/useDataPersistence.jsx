import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { auth } from '../../../firebase-config';

const useDataPersistence = ({
  user,
  isAuthReady,
  list1,
  list2,
  list3,
  trashedItems,
  setList1,
  setList2,
  setList3,
  setTrashedItems,
  setIsLoading
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);
  const isInitialLoad = useRef(true);  // Track initial load

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setList1([]);
        setList2([]);
        setList3([]);
        setTrashedItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load data when user is available
  useEffect(() => {
    const loadLists = async () => {
      if (!isAuthReady || !user?.email) {
        setIsLoading(false);
        return;
      }

      setIsSyncing(true);
      setIsSyncError(false);

      try {
        console.log('Loading lists for user:', user.email);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/purchases/load-lists`,
          {
            params: { email: user.email }
          }
        );

        console.log('Raw response:', response.data);

        if (response.data.success) {
          const lists = response.data.lists;

          console.log('Full lists data:', lists);
          console.log('Trash data:', lists.list4);

          if (Array.isArray(lists.list1)) {
            console.log('Setting list1:', lists.list1.length, 'items');
            setList1(lists.list1);
          }
          if (Array.isArray(lists.list2)) {
            console.log('Setting list2:', lists.list2.length, 'items');
            setList2(lists.list2);
          }
          if (Array.isArray(lists.list3)) {
            console.log('Setting list3:', lists.list3.length, 'items');
            setList3(lists.list3);
          }
          if (Array.isArray(lists.list4)) {
            console.log('Setting trash items:', lists.list4.length, 'items');
            setTrashedItems(lists.list4);
          } else {
            console.log('No trash items found in response');
          }
        }
      } catch (error) {
        console.error('Error loading lists:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };

    loadLists();
  }, [isAuthReady, user?.email]);

  // Save data when lists change
  useEffect(() => {
    const saveLists = async () => {
      if (!user?.email) return;

      setIsSyncing(true);
      setIsSyncError(false);

      try {
        console.log('Saving lists for user:', user.email);
        console.log('Lists to save:', {
          list1: list1.length + ' items',
          list2: list2.length + ' items',
          list3: list3.length + ' items',
          list4: trashedItems.length + ' items',
          trashedItems  // Log full trash items
        });

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/save-lists`,
          {
            email: user.email,
            lists: {
              list1,
              list2,
              list3,
              list4: trashedItems
            }
          }
        );

        console.log('Save response:', response.data);
      } catch (error) {
        console.error('Error saving lists:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    // Only save if we have a user and any list has items
    if (user?.email && (list1.length > 0 || list2.length > 0 || list3.length > 0 || trashedItems.length > 0)) {
      const timeoutId = setTimeout(saveLists, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [list1, list2, list3, trashedItems, user?.email]);

  return { isSyncing, isSyncError };
};

export default useDataPersistence;