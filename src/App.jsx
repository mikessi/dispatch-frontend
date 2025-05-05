import { Routes, Route, Link } from "react-router-dom";
import DispatchBoard from "./pages/DispatchBoard";
import CustomerManagement from "./pages/CustomerManagement";
import AddressManagement from "./pages/AddressManagement";
import TruckManagement from "./pages/TruckManagement";
import Quotes from "./pages/Quotes";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Dispatch System</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dispatch Board
                </Link>
                <Link
                  to="/customers"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Customer Management
                </Link>
                <Link
                  to="/addresses"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Address Management
                </Link>
                <Link
                  to="/trucks"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Truck Management
                </Link>
                <Link
                  to="/quotes"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Quotes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Routes>
        <Route path="/" element={<DispatchBoard />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/addresses" element={<AddressManagement />} />
          <Route path="/trucks" element={<TruckManagement />} />
          <Route path="/quotes" element={<Quotes />} />
      </Routes>
      </main>
    </div>
  );
}
