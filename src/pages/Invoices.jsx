import mockLoads from "../data/mockLoads.js";

export default function Invoices() {
  const total = mockLoads.reduce((sum, l) => sum + Number(l.rate || 0), 0);

  return (
    <div className="p-2 min-h-screen max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Invoices</h1>
        <p className="text-gray-600">View and manage billing information</p>
      </div>

      <div className="card-modern shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider border-b-2 border-purple-200">Load #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider border-b-2 border-purple-200">Origin</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider border-b-2 border-purple-200">Destination</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-purple-800 uppercase tracking-wider border-b-2 border-purple-200">Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mockLoads.map((load) => (
                <tr key={load.id} className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{load.id}</td>
                  <td className="px-6 py-4 text-gray-700">{load.origin}</td>
                  <td className="px-6 py-4 text-gray-700">{load.destination}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">${load.rate || "0.00"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gradient-to-r from-purple-100 to-blue-100">
              <tr>
                <td colSpan="3" className="px-6 py-5 text-right text-lg font-bold text-purple-900 border-t-2 border-purple-300">Total Amount</td>
                <td className="px-6 py-5 text-right text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent border-t-2 border-purple-300">
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}