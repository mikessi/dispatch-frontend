import { useState } from "react";
import mockCustomers from "../data/mockCustomers";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    company: "",
    contact: "",
    phone: "",
    email: ""
  });

  const handleAdd = () => {
    setShowForm(true);
    setEditingCustomer(null);
    setFormData({
      company: "",
      contact: "",
      phone: "",
      email: ""
    });
  };

  const handleEdit = (customer) => {
    setShowForm(true);
    setEditingCustomer(customer);
    setFormData(customer);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? { ...formData, id: c.id } : c
      ));
    } else {
      const newId = customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      setCustomers([...customers, { ...formData, id: newId }]);
    }
    setShowForm(false);
  };

  return (
    <div className="p-2 min-h-screen max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Add Customer</span>
        </button>
      </div>

      <div className="card-modern shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-purple-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-purple-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border-2 border-blue-600 rounded-lg transition-all font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
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
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  {editingCustomer ? "Update" : "Add"} Customer
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