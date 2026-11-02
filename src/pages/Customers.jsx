import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable";
import RequireSignIn from "../components/RequireSignIn";
import { Card, inputClass, primaryButtonClass } from "../components/ui";
import { useCustomers } from "../context/DataContext";
import { countRateOverrides } from "../utils/customerRates";

const matches = (customer, query) => {
  const haystack = [
    customer.name, customer.phone, customer.email,
    ...(customer.contacts || []).flatMap((c) => [c.name, c.phone, c.email]),
  ].join(' ').toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
};

function CustomerList() {
  const { items, status } = useCustomers();
  const [query, setQuery] = useState('');
  const visible = items.filter((customer) => matches(customer, query));

  const columns = [
    {
      key: 'name', label: 'Business', width: 280,
      render: (customer) => (
        <Link to={`/customers/${customer.id}`} className="font-medium text-purple-700 hover:underline">{customer.name}</Link>
      ),
    },
    { key: 'phone', label: 'Main phone', width: 160, render: (customer) => customer.phone },
    { key: 'email', label: 'Main email', width: 280, render: (customer) => customer.email },
    { key: 'contacts', label: 'Contacts', width: 100, render: (customer) => String((customer.contacts || []).length) },
    {
      key: 'rates', label: 'Rates', width: 130,
      render: (customer) => {
        const customCount = countRateOverrides(customer.rateOverrides);
        return customCount > 0 ? (
          <span className="inline-block rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-medium">
            {customCount} custom
          </span>
        ) : (
          <span className="text-gray-400">Standard</span>
        );
      },
    },
  ];

  return (
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link to="/customers/new" className={primaryButtonClass}>Add customer</Link>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by business, contact, phone or email"
        className={inputClass}
      />

      {visible.length === 0 ? (
        <Card>
          {status === 'loading' && <p className="text-sm text-gray-600">Loading customers…</p>}
          {status === 'error' && (
            <p className="text-sm text-red-600">
              Couldn’t load customers. The database rules may not allow it yet — see firebase/README.md.
            </p>
          )}
          {status === 'ready' && items.length === 0 && (
            <p className="text-sm text-gray-600">No customers yet. Add your first one to get started.</p>
          )}
          {status === 'ready' && items.length > 0 && visible.length === 0 && (
            <p className="text-sm text-gray-600">No customers match “{query}”.</p>
          )}
        </Card>
      ) : (
        <DataTable storageKey="customers" columns={columns} rows={visible} />
      )}
    </div>
  );
}

export default function Customers() {
  return (
    <RequireSignIn title="Customers">
      <CustomerList />
    </RequireSignIn>
  );
}
