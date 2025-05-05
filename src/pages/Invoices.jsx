import mockLoads from "../data/mockLoads.js";

export default function Invoices() {
  const total = mockLoads.reduce((sum, l) => sum + Number(l.rate || 0), 0);

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Invoices</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Load #</th>
            <th className="border p-2 text-left">Origin</th>
            <th className="border p-2 text-left">Destination</th>
            <th className="border p-2 text-left">Rate ($)</th>
          </tr>
        </thead>
        <tbody>
          {mockLoads.map((load) => (
            <tr key={load.id}>
              <td className="border p-2">#{load.id}</td>
              <td className="border p-2">{load.origin}</td>
              <td className="border p-2">{load.destination}</td>
              <td className="border p-2">${load.rate || "0.00"}</td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td colSpan="3" className="border p-2 text-right">Total</td>
            <td className="border p-2">${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
