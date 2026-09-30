import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, RATES_DOC } from "../lib/firebase";
import { DEFAULT_RATES, withDefaults } from "../utils/defaultRates";

const RatesContext = createContext(null);

export function RatesProvider({ children }) {
  const [rates, setRates] = useState(DEFAULT_RATES);
  // 'loading' | 'saved' (from database) | 'defaults' (nothing saved yet) | 'offline' (no database set up) | 'error'
  const [status, setStatus] = useState(db ? 'loading' : 'offline');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, ...RATES_DOC))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const { data, updatedAt } = snapshot.data();
          setRates(withDefaults(data));
          setUpdatedAt(updatedAt);
          setStatus('saved');
        } else {
          setStatus('defaults');
        }
      })
      .catch((error) => {
        console.error('Failed to load saved rates', error);
        setStatus('error');
      });
  }, []);

  const saveRates = useCallback(async (newRates) => {
    if (!db) throw new Error('No database is set up yet.');
    const now = new Date().toISOString();
    await setDoc(doc(db, ...RATES_DOC), { data: newRates, updatedAt: now });
    setRates(withDefaults(newRates));
    setUpdatedAt(now);
    setStatus('saved');
  }, []);

  return (
    <RatesContext.Provider value={{ rates, status, updatedAt, saveRates }}>
      {children}
    </RatesContext.Provider>
  );
}

export const useRates = () => useContext(RatesContext);
