import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { auth } from '../../../firebase-config';

const useDataPersistence = ({
  list1,
  list2,
  list3,
  setList1,
  setList2,
  setList3,
  setIsLoading
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);
  const [user, setUser] = useState(null);
  const isInitialLoad = useRef(true);  // Track initial load

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        setList1([]);
        setList2([]);
        setList3([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load data when user is available
  useEffect(() => {
    const loadLists = async () => {
      if (!user?.email) {
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

        if (response.data.success && response.data.lists) {
          console.log('Successfully loaded lists:', response.data.lists);
          if (Array.isArray(response.data.lists.list1)) setList1(response.data.lists.list1);
          if (Array.isArray(response.data.lists.list2)) setList2(response.data.lists.list2);
          if (Array.isArray(response.data.lists.list3)) setList3(response.data.lists.list3);
          isInitialLoad.current = false;  // Mark initial load as complete
        }
      } catch (error) {
        console.error('Error loading lists:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };

    if (user?.email) {
      loadLists();
    }
  }, [user?.email]);

  // Save data when lists change
  useEffect(() => {
    // Don't save during initial load
    if (isInitialLoad.current) {
      return;
    }

    const saveLists = async () => {
      if (!user?.email) return;

      setIsSyncing(true);
      setIsSyncError(false);

      try {
        console.log('Saving lists for user:', user.email);
        console.log('Lists to save:', { list1, list2, list3 });

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/save-lists`,
          {
            email: user.email,
            lists: {
              list1,
              list2,
              list3
            }
          }
        );
        console.log('Lists saved successfully');
      } catch (error) {
        console.error('Error saving lists:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(saveLists, 1000);
    return () => clearTimeout(timeoutId);
  }, [list1, list2, list3, user?.email]);

  return { isSyncing, isSyncError };
};

export default useDataPersistence;