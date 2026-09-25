import { Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Quotes from "./pages/Quotes";
// Temporarily disabled — only the Quotes page is enabled for now.
// import DispatchBoard from "./pages/DispatchBoard";
// import DriverList from "./pages/DriverList";
// import CustomerManagement from "./pages/CustomerManagement";
// import TruckManagement from "./pages/TruckManagement";
// import AddressManagement from "./pages/AddressManagement";
// import Invoices from "./pages/Invoices";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navigation />
      <main className="ml-64 w-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Routes>
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes-plus-15" element={<Quotes key="quotes-plus-15" title="Quotes+15%" rateMultiplier={1.15} />} />
          {/* Temporarily disabled:
          <Route path="/dispatch" element={<DispatchBoard />} />
          <Route path="/drivers" element={<DriverList />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/trucks" element={<TruckManagement />} />
          <Route path="/addresses" element={<AddressManagement />} />
          <Route path="/invoices" element={<Invoices />} />
          */}
          <Route path="*" element={<Navigate to="/quotes" replace />} />
        </Routes>
      </main>
    </div>
  );
}
