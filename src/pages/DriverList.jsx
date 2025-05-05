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
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Driver Management</h1>

      {/* Add new driver */}
      <div className="mb-4">
        <input
          className="p-2 border rounded mr-2"
          placeholder="New driver name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleAdd}>
          Add Driver
        </button>
      </div>

      {/* List of drivers */}
      <ul className="space-y-2">
        {drivers.map(driver => (
          <li key={driver.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
            {editingId === driver.id ? (
              <input
                className="p-2 border rounded flex-1 mr-3"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              <span className="flex-1">{driver.name}</span>
            )}

            {editingId === driver.id ? (
              <button className="text-green-600 mr-2" onClick={saveEdit}>Save</button>
            ) : (
              <button className="text-blue-600 mr-2" onClick={() => startEditing(driver.id, driver.name)}>Edit</button>
            )}

            <button className="text-red-600" onClick={() => handleDelete(driver.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
