import React, { useState } from 'react';
import mockAddresses from '../data/mockAddresses';

export default function AddressManagement() {
  const [addresses, setAddresses] = useState(mockAddresses);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (address) => {
    setEditingAddress(address);
    setEditForm({ ...address });
  };

  const handleCloseEdit = () => {
    setEditingAddress(null);
    setEditForm(null);
  };

  const handleSave = () => {
    if (editingAddress) {
      setAddresses(addresses.map(addr => 
        addr.id === editForm.id ? editForm : addr
      ));
    } else {
      const newId = Math.max(...addresses.map(a => a.id)) + 1;
      setAddresses([...addresses, { ...editForm, id: newId }]);
    }
    handleCloseEdit();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const handleAdd = () => {
    setEditingAddress({});
    setEditForm({
      companyName: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      type: '',
      hours: '',
      contactName: '',
      phones: [''],
      emails: [''],
      appointmentRequired: false,
      appointmentNotes: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setEditForm(prev => ({
        ...prev,
        [name]: e.target.checked
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayInputChange = (field, index, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setEditForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setEditForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const filteredAddresses = addresses.filter(address => {
    const searchLower = searchTerm.toLowerCase();
    return (
      address.companyName.toLowerCase().includes(searchLower) ||
      address.address.toLowerCase().includes(searchLower) ||
      address.city.toLowerCase().includes(searchLower) ||
      address.state.toLowerCase().includes(searchLower) ||
      address.zip.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Address Management</h1>
          <p className="text-gray-600">Manage pickup and delivery locations</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Add Address</span>
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search by company, address, city, state, or zip..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all shadow-sm text-lg"
        />
      </div>

      <div className="card-modern shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Address</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">City/State/Zip</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Type</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Hours</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Phones</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Emails</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Appointment</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAddresses.map((address) => (
                <tr key={address.id} className="hover:bg-gray-50">
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">{address.companyName}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">{address.address}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">
                    {address.city}, {address.state} {address.zip}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">{address.type}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">{address.hours}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">{address.contactName}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">
                    {address.phones.map((phone, index) => (
                      <div key={index}>{phone}</div>
                    ))}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">
                    {address.emails.map((email, index) => (
                      <div key={index}>{email}</div>
                    ))}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-gray-200">
                    {address.appointmentRequired ? 'Yes' : 'No'}
                    {address.appointmentRequired && (
                      <div className="text-xs text-gray-500">{address.appointmentNotes}</div>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingAddress && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editForm.id ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={handleCloseEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={editForm.companyName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                      type="text"
                      name="type"
                      value={editForm.type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={editForm.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={editForm.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zip</label>
                    <input
                      type="text"
                      name="zip"
                      value={editForm.zip}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hours</label>
                  <input
                    type="text"
                    name="hours"
                    value={editForm.hours}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    type="text"
                    name="contactName"
                    value={editForm.contactName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phones</label>
                  {editForm.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handleArrayInputChange('phones', index, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('phones', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('phones')}
                    className="mt-2 text-blue-600 hover:text-blue-900"
                  >
                    + Add Phone
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Emails</label>
                  {editForm.emails.map((email, index) => (
                    <div key={index} className="flex gap-2 mt-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleArrayInputChange('emails', index, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('emails', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('emails')}
                    className="mt-2 text-blue-600 hover:text-blue-900"
                  >
                    + Add Email
                  </button>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="appointmentRequired"
                    checked={editForm.appointmentRequired}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Appointment Required</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Notes</label>
                  <textarea
                    name="appointmentNotes"
                    value={editForm.appointmentNotes}
                    onChange={handleInputChange}
                    rows="2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editForm.id ? 'Save' : 'Add'}
                  </button>
                  <button
                    onClick={handleCloseEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 