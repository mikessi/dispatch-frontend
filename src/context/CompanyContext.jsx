import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Your own business details, printed at the top of invoices.
// Stored in Firestore at settings/company.
export const EMPTY_COMPANY = {
  name: '', street: '', city: '', state: '', zip: '', phone: '', email: '',
  // Printed at the bottom of every invoice, e.g. payment terms
  invoiceFooter: '',
};

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(EMPTY_COMPANY);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'company'))
      .then((snapshot) => {
        if (snapshot.exists()) setCompany({ ...EMPTY_COMPANY, ...snapshot.data() });
      })
      .catch((error) => console.error('Failed to load company details', error));
  }, []);

  const saveCompany = useCallback(async (details) => {
    await setDoc(doc(db, 'settings', 'company'), details);
    setCompany({ ...EMPTY_COMPANY, ...details });
  }, []);

  return <CompanyContext.Provider value={{ company, saveCompany }}>{children}</CompanyContext.Provider>;
}

export const useCompany = () => useContext(CompanyContext);
