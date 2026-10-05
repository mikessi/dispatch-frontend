import { Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Quotes from "./pages/Quotes";
import RateSettings from "./pages/RateSettings";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Addresses from "./pages/Addresses";
import Jobs from "./pages/Jobs";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { CompanyProvider } from "./context/CompanyContext";
import { RatesProvider } from "./context/RatesContext";
// Temporarily disabled — only the Quotes page is enabled for now.
// import DispatchBoard from "./pages/DispatchBoard";
// import DriverList from "./pages/DriverList";
// import TruckManagement from "./pages/TruckManagement";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RatesProvider>
          <CompanyProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 print:bg-none print:bg-white">
              <Navigation />
              <main className="ml-64 w-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in print:ml-0 print:p-0">
                <Routes>
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/addresses" element={<Addresses />} />
                  <Route path="/rate-settings" element={<RateSettings />} />
                  {/* Temporarily disabled:
                  <Route path="/dispatch" element={<DispatchBoard />} />
                  <Route path="/drivers" element={<DriverList />} />
                  <Route path="/trucks" element={<TruckManagement />} />
                  */}
                  <Route path="*" element={<Navigate to="/quotes" replace />} />
                </Routes>
              </main>
            </div>
          </CompanyProvider>
        </RatesProvider>
      </DataProvider>
    </AuthProvider>
  );
}
