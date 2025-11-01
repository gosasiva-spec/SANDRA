// FIX: Add React to the import statement to bring the React namespace into scope.
import React, { useState, useEffect } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // This will also trigger the 'storage' event for other tabs
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  // This effect re-reads from localStorage when the key changes (e.g., switching projects)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If there's an item, parse it. Otherwise, fall back to the initial value.
      // This handles switching to a project that doesn't have data for this key yet.
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.log('Error reading from localStorage on key change', error);
      // Fallback to initial value on parsing error
      setStoredValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // This effect adds a listener to sync state between tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === key) {
        try {
          if (event.newValue) {
            setStoredValue(JSON.parse(event.newValue));
          } else {
            // Value was removed or cleared in another tab
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.log('Error handling storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
