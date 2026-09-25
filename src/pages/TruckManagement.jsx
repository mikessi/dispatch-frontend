import { useState } from "react";
import mockTrucks from "../data/mockTrucks";

export default function TruckManagement() {
  const [trucks, setTrucks] = useState(mockTrucks);
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [formData, setFormData] = useState({
    number: "",
    make: "",
    model: "",
    year: "",
    status: "Available"
  });

  const handleAdd = () => {
    setShowForm(true);
    setEditingTruck(null);
    setFormData({
      number: "",
      make: "",
      model: "",
      year: "",
      status: "Available"
    });
  };

  const handleEdit = (truck) => {
    setShowForm(true);
    setEditingTruck(truck);
    setFormData(truck);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this truck?")) {
      setTrucks(trucks.filter(t => t.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTruck) {
      setTrucks(trucks.map(t => 
        t.id === editingTruck.id ? { ...formData, id: t.id } : t
      ));
    } else {
      const newId = trucks.length ? Math.max(...trucks.map(t => t.id)) + 1 : 1;
      setTrucks([...trucks, { ...formData, id: newId }]);
    }
    setShowForm(false);
  };

  return (
    <div className="p-2 min-h-screen max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Truck Management</h1>
          <p className="text-gray-600">Manage your fleet of trucks</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Add Truck</span>
        </button>
      </div>

      <div className="card-modern shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Truck Number</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Make</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Model</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Year</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-purple-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {trucks.map(truck => (
                <tr key={truck.id} className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{truck.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{truck.make}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{truck.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{truck.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      truck.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {truck.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(truck)}
                      className="px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border-2 border-blue-600 rounded-lg transition-all font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(truck.id)}
                      className="px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-lg transition-all font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card-modern p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              {editingTruck ? "Edit Truck" : "Add New Truck"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Truck Number</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  {editingTruck ? "Update" : "Add"} Truck
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 