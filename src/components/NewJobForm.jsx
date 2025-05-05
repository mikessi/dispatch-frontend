import React, { useState, useEffect } from 'react';

const NewJobForm = ({ onSave, onClose, formData, onCompanyChange, uniqueCompanies, uniqueTrucks, uniqueAddresses }) => {
  const zoneOptions = ["A", "B", "C", "D", "E", "F"];
  const typeOptions = ["AI", "AE", "AT", "AET", "OI", "OE", "OT", "PTT"];
  const statusOptions = ["Pending", "En Route PU", "Picking Up", "Picked Up", "En Route Del", "Delivering", "Delivered"];

  const [suggestions, setSuggestions] = useState({
    truck: [],
    from: [],
    to: []
  });

  // Auto-generate job number
  const generateJobNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}-${random}`;
  };

  // Initialize form data with auto-generated job number
  useEffect(() => {
    if (!formData.jobNumber) {
      const updatedFormData = { ...formData, jobNumber: generateJobNumber() };
      onCompanyChange(updatedFormData);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    onCompanyChange(updatedFormData);

    // Update suggestions based on input
    if (name === 'assignedTruck') {
      setSuggestions(prev => ({
        ...prev,
        truck: value ? uniqueTrucks.filter(truck => 
          truck.toLowerCase().includes(value.toLowerCase())
        ) : []
      }));
    } else if (name === 'pickupLocation') {
      setSuggestions(prev => ({
        ...prev,
        from: value ? uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        ) : []
      }));
    } else if (name === 'deliveryLocation') {
      setSuggestions(prev => ({
        ...prev,
        to: value ? uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        ) : []
      }));
    }
  };

  const handleSuggestionClick = (name, value, address = null) => {
    let updatedFormData;
    if (address) {
      updatedFormData = {
        ...formData,
        [name]: address.contact,
        [`${name}Address`]: address.address
      };
    } else {
      updatedFormData = {
        ...formData,
        [name]: value
      };
    }
    onCompanyChange(updatedFormData);
    setSuggestions({
      truck: [],
      from: [],
      to: []
    });
  };

  const handleBlur = (name) => {
    setTimeout(() => {
      setSuggestions(prev => ({
        ...prev,
        [name]: []
      }));
    }, 200);
  };

  const handleFocus = (name) => {
    const value = formData[name] || '';
    if (name === 'pickupLocation') {
      setSuggestions(prev => ({
        ...prev,
        from: value ? uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        ) : []
      }));
    } else if (name === 'deliveryLocation') {
      setSuggestions(prev => ({
        ...prev,
        to: value ? uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        ) : []
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-4/5 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add New Job</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Number</label>
                <input
                  type="text"
                  name="jobNumber"
                  value={formData.jobNumber || ''}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-red-600">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-red-600">Customer *</label>
                <select
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a company</option>
                  {uniqueCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-600">Contact *</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Truck</label>
                <div className="relative">
                  <input
                    type="text"
                    name="assignedTruck"
                    value={formData.assignedTruck || ''}
                    onChange={handleChange}
                    onFocus={() => handleFocus('assignedTruck')}
                    onBlur={() => handleBlur('assignedTruck')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {suggestions.truck.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                      {suggestions.truck.map(truck => (
                        <div
                          key={truck}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSuggestionClick('assignedTruck', truck);
                          }}
                        >
                          {truck}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status || 'Pending'}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-600">From *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation || ''}
                    onChange={handleChange}
                    onFocus={() => handleFocus('pickupLocation')}
                    onBlur={() => handleBlur('pickupLocation')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  {suggestions.from.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                      {suggestions.from.map(address => (
                        <div
                          key={address.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSuggestionClick('pickupLocation', address.contact, address);
                          }}
                        >
                          {address.contact} - {address.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-600">To *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="deliveryLocation"
                    value={formData.deliveryLocation || ''}
                    onChange={handleChange}
                    onFocus={() => handleFocus('deliveryLocation')}
                    onBlur={() => handleBlur('deliveryLocation')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  {suggestions.to.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                      {suggestions.to.map(address => (
                        <div
                          key={address.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSuggestionClick('deliveryLocation', address.contact, address);
                          }}
                        >
                          {address.contact} - {address.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time In</label>
                  <input
                    type="time"
                    name="timeIn"
                    value={formData.timeIn || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Out</label>
                  <input
                    type="time"
                    name="timeOut"
                    value={formData.timeOut || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pro Number</label>
                <input
                  type="text"
                  name="pro"
                  value={formData.pro || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-600">Reference Number *</label>
              <input
                type="text"
                name="reference"
                value={formData.reference || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600">Details *</label>
              <div className="mt-1 grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Pieces</label>
                  <input
                    type="number"
                    name="pcsCount"
                    value={formData.pcsCount || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Weight</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit || 'lbs'}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="lbs">lbs</option>
                    <option value="kgs">kgs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Pallets</label>
                  <input
                    type="number"
                    name="palletCount"
                    value={formData.palletCount || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
        </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
            Cancel
          </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Job
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default NewJobForm;