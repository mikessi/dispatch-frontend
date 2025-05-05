import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import NewJobForm from "../components/NewJobForm";
import ViewJob from "../components/ViewJob";
import ResizableTableHeader from "../components/ResizableTableHeader";
import mockLoads from "../data/mockLoads";
import mockCustomers from "../data/mockCustomers";
import mockTrucks from "../data/mockTrucks";
import mockAddresses from "../data/mockAddresses";

export default function DispatchBoard() {
  const [loads, setLoads] = useState(mockLoads);
  const [customers, setCustomers] = useState(mockCustomers);
  const [trucks, setTrucks] = useState(mockTrucks);
  const [addresses, setAddresses] = useState(mockAddresses);
  const [editCell, setEditCell] = useState({ id: null, field: null });
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [viewJob, setViewJob] = useState(null);
  const [suggestions, setSuggestions] = useState({
    truck: [],
    from: [],
    to: []
  });
  const [columns, setColumns] = useState([
    { id: "jobNumber", label: "Job Number", width: 100 },
    { id: "date", label: "Date", width: 100 },
    { id: "company", label: "Customer", width: 150 },
    { id: "contact", label: "Contact", width: 120 },
    { id: "assignedTruck", label: "Truck", width: 100 },
    { id: "status", label: "Status", width: 120 },
    { id: "pickupLocation", label: "From", width: 150 },
    { id: "deliveryLocation", label: "To", width: 150 },
    { id: "pickupDate", label: "Pickup Date", width: 120 },
    { id: "deliveryDate", label: "Delivery Date", width: 120 },
    { id: "timeIn", label: "Time In/Out", width: 150 },
    { id: "pro", label: "Pro Number", width: 120 },
    { id: "reference", label: "Reference Number", width: 150 },
    { id: "details", label: "Details", width: 150 },
    { id: "notes", label: "Notes", width: 200 },
    { id: "actions", label: "Actions", width: 100 }
  ]);

  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({
    jobNumber: "",
    date: "",
    company: "",
    contact: "",
    phone: "",
    email: "",
    assignedTruck: "",
    pickupLocation: "",
    pickupLocationAddress: "",
    deliveryLocation: "",
    deliveryLocationAddress: "",
    status: "Pending",
    zone: "A",
    type: "AI"
  });

  const zoneOptions = ["A", "B", "C", "D", "E", "F"];
  const typeOptions = ["AI", "AE", "AT", "AET", "OI", "OE", "OT", "PTT"];
  const statusOptions = ["Pending", "En Route PU", "Picking Up", "Picked Up", "En Route Del", "Delivering", "Delivered"];

  // Get unique values for validation
  const uniqueCompanies = [...new Set(customers.map(c => c.company))];
  const uniqueTrucks = [...new Set(trucks.map(t => t.number))];
  const uniqueAddresses = addresses; // Use the full address objects

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const [month, day, year] = dateString.split('/');
    return `20${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [month, day, year] = dateString.split('/');
    return `${month}/${day}`;
  };

  const handleResize = (columnId, width) => {
    setColumns(columns.map(column => 
      column.id === columnId ? { ...column, width } : column
    ));
  };

  const handleChange = (e, loadId, field) => {
    const updatedLoads = loads.map(load =>
      load.id === loadId ? { ...load, [field]: e.target.value } : load
    );
    setLoads(updatedLoads);
  };

  const handleBlur = () => {
    setEditCell({ id: null, field: null });
  };

  const handleKeyDown = (e, loadId, field) => {
    if (e.key === 'Enter') {
      setEditCell({ id: null, field: null });
    }
  };

  const handleCustomerChange = (e, loadId, field) => {
    const selectedCompany = e.target.value;
    const selectedCustomer = customers.find(c => c.company === selectedCompany);
    
    const updatedLoads = loads.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          customerCompany: selectedCompany,
          customerContact: selectedCustomer ? selectedCustomer.contact : "",
          phone: selectedCustomer ? selectedCustomer.phone : "",
          email: selectedCustomer ? selectedCustomer.email : ""
        };
      }
      return load;
    });
    setLoads(updatedLoads);
  };

  const handleTruckChange = (e, loadId, field) => {
    const selectedTruck = e.target.value;
    const updatedLoads = loads.map(load => {
      if (load.id === loadId) {
        return {
          ...load,
          [field]: selectedTruck
        };
      }
      return load;
    });
    setLoads(updatedLoads);
  };

  const handleAdd = () => {
    setShowForm(true);
    setEditingRow(null);
    setFormData({
      jobNumber: "",
      date: "",
      company: "",
      contact: "",
      phone: "",
      email: "",
      assignedTruck: "",
      pickupLocation: "",
      pickupLocationAddress: "",
      deliveryLocation: "",
      deliveryLocationAddress: "",
      status: "Pending",
      zone: "A",
      type: "AI"
    });
  };

  const handleAddJob = (newJob) => {
    const nextId = loads.length ? Math.max(...loads.map(l => l.id)) + 1 : 1;
    const formattedJob = {
      id: nextId,
      ...newJob,
      pickupLocation: newJob.pickupLocation || "",
      pickupLocationAddress: newJob.pickupLocationAddress || "",
      deliveryLocation: newJob.deliveryLocation || "",
      deliveryLocationAddress: newJob.deliveryLocationAddress || ""
    };
    setLoads([formattedJob, ...loads]);
    setShowForm(false);
  };

  const handleCompanyChange = (updatedFormData) => {
    setFormData(updatedFormData);
  };

  const handleDeleteJob = (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      setLoads(loads.filter(load => load.id !== id));
    }
  };

  const handleView = (load) => {
    setViewJob(load);
  };

  const handleEdit = (load) => {
    setEditingRow(load.id);
  };

  const handleSave = (loadId) => {
    setEditingRow(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(loads);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLoads(items);
  };

  const filteredLoads = filterDate
    ? loads.filter(load => {
        const [month, day, year] = load.date.split('/');
        const loadDate = `20${year}-${month}-${day}`;
        return loadDate === filterDate;
      })
    : loads;

  const handleSuggestionClick = (loadId, field, value, address = null) => {
    const updatedLoads = loads.map(load => {
      if (load.id === loadId) {
        if (address) {
          return {
            ...load,
            [field]: address.contact,
            [`${field}Address`]: address.address
          };
        } else {
          return {
            ...load,
            [field]: value
          };
        }
      }
      return load;
    });
    setLoads(updatedLoads);
    setSuggestions(prev => ({
      ...prev,
      [field]: []
    }));
  };

  const handleInputChange = (e, loadId, field) => {
    const value = e.target.value;
    handleChange(e, loadId, field);

    // Update suggestions based on input
    if (field === 'truck') {
      setSuggestions(prev => ({
        ...prev,
        truck: uniqueTrucks.filter(truck => 
          truck.toLowerCase().includes(value.toLowerCase())
        )
      }));
    } else if (field === 'from') {
      setSuggestions(prev => ({
        ...prev,
        from: uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        )
      }));
    } else if (field === 'to') {
      setSuggestions(prev => ({
        ...prev,
        to: uniqueAddresses.filter(address => 
          address.contact.toLowerCase().includes(value.toLowerCase())
        )
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dispatch Board</h1>
        <div className="flex space-x-4">
            <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
            Add New Job
            </button>
          </div>
        </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
                {columns.map((column) => (
                  <ResizableTableHeader
                    key={column.id}
                    column={column}
                    onResize={handleResize}
                  />
                ))}
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loads
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((load, index) => {
                  const showDateHeader = index === 0 || 
                    new Date(load.date).toDateString() !== new Date(loads[index - 1].date).toDateString();
                  
                  return (
                    <React.Fragment key={load.id}>
                      {showDateHeader && (
                        <tr className="bg-gray-100 sticky top-[48px] z-10">
                          <td colSpan="16" className="px-6 py-4 text-sm font-semibold text-gray-700 bg-gray-100" style={{ height: '48px' }}>
                            {new Date(load.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[0].width }}>{load.jobNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[1].width }}>
                          {new Date(load.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[2].width }}>{load.company}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[3].width }}>{load.contact}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[4].width }}>
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={load.assignedTruck || ''}
                              onChange={(e) => handleInputChange(e, load.id, 'assignedTruck')}
                              onFocus={() => handleFocus('assignedTruck', load.id)}
                              onBlur={() => handleBlur('assignedTruck')}
                              className="w-full px-2 py-1 border rounded-md"
                            />
                            {suggestions.truck.length > 0 && (
                              <div className="absolute z-30 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.truck.map(truck => (
                                  <div
                                    key={truck}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSuggestionClick(load.id, 'assignedTruck', truck)}
                                  >
                                    {truck}
                                  </div>
                                ))}
                              </div>
                            )}
      </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[5].width }}>
                          <select
                            value={load.status || 'Pending'}
                            onChange={(e) => handleInputChange(e, load.id, 'status')}
                            className="w-full px-2 py-1 border rounded-md"
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[6].width }}>
                          <div className="relative w-full">
                      <input
                              type="text"
                              value={load.pickupLocation || ''}
                              onChange={(e) => handleInputChange(e, load.id, 'pickupLocation')}
                              onFocus={() => handleFocus('pickupLocation', load.id)}
                              onBlur={() => handleBlur('pickupLocation')}
                              className="w-full px-2 py-1 border rounded-md"
                      />
                            {suggestions.from.length > 0 && (
                              <div className="absolute z-30 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.from.map(address => (
                                  <div
                                    key={address.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSuggestionClick(load.id, 'pickupLocation', address.contact, address)}
                                  >
                                    {address.contact} - {address.address}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[7].width }}>
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={load.deliveryLocation || ''}
                              onChange={(e) => handleInputChange(e, load.id, 'deliveryLocation')}
                              onFocus={() => handleFocus('deliveryLocation', load.id)}
                              onBlur={() => handleBlur('deliveryLocation')}
                              className="w-full px-2 py-1 border rounded-md"
                            />
                            {suggestions.to.length > 0 && (
                              <div className="absolute z-30 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.to.map(address => (
                                  <div
                                    key={address.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSuggestionClick(load.id, 'deliveryLocation', address.contact, address)}
                                  >
                                    {address.contact} - {address.address}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[8].width }}>
                          <input
                            type="date"
                            value={load.pickupDate || ''}
                            onChange={(e) => handleInputChange(e, load.id, 'pickupDate')}
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[9].width }}>
                          <input
                            type="date"
                            value={load.deliveryDate || ''}
                            onChange={(e) => handleInputChange(e, load.id, 'deliveryDate')}
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[10].width }}>
                          <div className="flex space-x-2 w-full">
                            <input
                              type="time"
                              value={load.timeIn || ''}
                              onChange={(e) => handleInputChange(e, load.id, 'timeIn')}
                              className="w-20 px-2 py-1 border rounded-md"
                            />
                            <input
                              type="time"
                              value={load.timeOut || ''}
                              onChange={(e) => handleInputChange(e, load.id, 'timeOut')}
                              className="w-20 px-2 py-1 border rounded-md"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[11].width }}>
                          <input
                            type="text"
                            value={load.pro || ''}
                            onChange={(e) => handleInputChange(e, load.id, 'pro')}
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[12].width }}>
                          <input
                            type="text"
                            value={load.reference || ''}
                            onChange={(e) => handleInputChange(e, load.id, 'reference')}
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[13].width }}>
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <div>
                              <span className="text-gray-500">Pieces:</span> {load.pcsCount}
                            </div>
                            <div>
                              <span className="text-gray-500">Weight:</span> {load.weight} {load.unit}
                            </div>
                            <div>
                              <span className="text-gray-500">Pallets:</span> {load.palletCount}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[14].width }}>
                          <input
                            type="text"
                            value={load.notes || ''}
                            onChange={(e) => handleInputChange(e, load.id, 'notes')}
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: columns[15].width }}>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleView(load)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                  <button
                    onClick={() => handleDeleteJob(load.id)}
                              className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                          </div>
                </td>
              </tr>
                    </React.Fragment>
                  );
                })}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <NewJobForm
          onSave={handleAddJob}
          onClose={() => setShowForm(false)}
          formData={formData}
          onCompanyChange={handleCompanyChange}
          uniqueCompanies={uniqueCompanies}
          uniqueTrucks={uniqueTrucks}
          uniqueAddresses={uniqueAddresses}
        />
      )}

      {viewJob && (
        <ViewJob job={viewJob} onClose={() => setViewJob(null)} />
      )}
    </div>
  );
}
