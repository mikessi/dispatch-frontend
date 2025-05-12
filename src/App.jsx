import { Routes, Route, Navigate } from "react-router-dom";
import Quotes from "./pages/Quotes";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/quotes" replace />} />
          <Route path="/quotes" element={<Quotes />} />
        </Routes>
      </main>
    </div>
  );
}
