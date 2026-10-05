import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

// Shared business records. Every page reads these from here so a customer or
// address edited in one place is immediately current everywhere else.
const COLLECTIONS = {
  customers: { sortBy: 'name' },
  addresses: { sortBy: 'companyName' },
  jobs: { sortBy: 'date', descending: true },
  invoices: { sortBy: 'invoiceNumber', descending: true },
};

const DataContext = createContext(null);

const emptyState = () =>
  Object.fromEntries(Object.keys(COLLECTIONS).map((name) => [name, { items: [], status: 'idle', error: null }]));

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    // Records are private: only subscribe while someone is signed in
    if (!db || !user) {
      setState(emptyState());
      return;
    }
    const unsubscribes = Object.entries(COLLECTIONS).map(([name, { sortBy, descending }]) => {
      setState((prev) => ({ ...prev, [name]: { ...prev[name], status: 'loading' } }));
      return onSnapshot(
        collection(db, name),
        (snapshot) => {
          const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''), undefined, { sensitivity: 'base', numeric: true }));
          if (descending) items.reverse();
          setState((prev) => ({ ...prev, [name]: { items, status: 'ready', error: null } }));
        },
        (error) => {
          console.error(`Failed to load ${name}`, error);
          setState((prev) => ({ ...prev, [name]: { items: [], status: 'error', error } }));
        }
      );
    });
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  const value = useMemo(() => {
    const api = {};
    for (const name of Object.keys(COLLECTIONS)) {
      api[name] = {
        ...state[name],
        byId: (id) => state[name].items.find((item) => item.id === id),
        add: async (data) => {
          const now = new Date().toISOString();
          const ref = await addDoc(collection(db, name), { ...data, createdAt: now, updatedAt: now });
          return ref.id;
        },
        update: (id, data) => updateDoc(doc(db, name, id), { ...data, updatedAt: new Date().toISOString() }),
        remove: (id) => deleteDoc(doc(db, name, id)),
      };
    }
    return api;
  }, [state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useCustomers = () => useContext(DataContext).customers;
export const useAddresses = () => useContext(DataContext).addresses;
export const useJobs = () => useContext(DataContext).jobs;
export const useInvoices = () => useContext(DataContext).invoices;
