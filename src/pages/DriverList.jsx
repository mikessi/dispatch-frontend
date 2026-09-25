import { useState } from "react";

export default function DriverList() {
  const [drivers, setDrivers] = useState([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" }
  ]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    setDrivers([...drivers, { id: Date.now(), name: newName.trim() }]);
    setNewName("");
  };

  const handleDelete = (id) => {
    setDrivers(drivers.filter((d) => d.id !== id));
  };

  const startEditing = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = () => {
    setDrivers(drivers.map(d => d.id === editingId ? { ...d, name: editName } : d));
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="p-2 min-h-screen max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Driver Management</h1>
        <p className="text-gray-600">Manage your driver roster</p>
      </div>

      <div className="card-modern p-6 mb-6 shadow-lg">
        <div className="flex space-x-3">
          <input
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            placeholder="Enter new driver name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2"
            onClick={handleAdd}
          >
            <span className="text-xl">+</span>
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => (
          <div key={driver.id} className="card-modern p-5 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 mr-4">
                {editingId === driver.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(driver.id, driver.name)}
                      className="px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border-2 border-blue-600 rounded-lg transition-all font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-lg transition-all font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center shadow-md">
                    <span className="text-white text-lg font-bold">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === driver.id ? (
                    <input
                      className="px-3 py-2 border-2 border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-200 transition-all"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    />
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-500">{driver.phone || 'No phone number'}</p>
                    </>
                  )}
                </div>
                {driver.status && (
                  <div className="flex items-center space-x-6 border-l-2 border-gray-200 pl-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                      <p className="text-sm font-medium text-gray-900">{driver.status}</p>
                    </div>
                    {driver.licenseNumber && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">License</p>
                        <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
                      </div>
                    )}
                    {driver.licenseExpiry && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Expiry</p>
                        <p className="text-sm font-medium text-gray-900">{driver.licenseExpiry}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
