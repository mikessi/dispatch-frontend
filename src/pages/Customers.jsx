import { useState } from "react";
import { Link } from "react-router-dom";
import RequireSignIn from "../components/RequireSignIn";
import { Card, inputClass, primaryButtonClass } from "../components/ui";
import { useCustomers } from "../context/DataContext";
import { countRateOverrides } from "../utils/customerRates";

const matches = (customer, query) => {
  const haystack = [
    customer.name, customer.phone, customer.email,
    customer.street, customer.city, customer.state, customer.zip,
    ...(customer.contacts || []).flatMap((c) => [c.name, c.phone, c.email]),
  ].join(' ').toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
};

function CustomerList() {
  const { items, status } = useCustomers();
  const [query, setQuery] = useState('');
  const visible = items.filter((customer) => matches(customer, query));

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
        placeholder="Search by business, contact, phone, email or city"
        className={inputClass}
      />

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
        {visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4 font-medium">Business</th>
                  <th className="py-2 pr-4 font-medium">City</th>
                  <th className="py-2 pr-4 font-medium">Main phone</th>
                  <th className="py-2 pr-4 font-medium">Main email</th>
                  <th className="py-2 pr-4 font-medium">Contacts</th>
                  <th className="py-2 font-medium">Rates</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => {
                  const customCount = countRateOverrides(customer.rateOverrides);
                  return (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <Link to={`/customers/${customer.id}`} className="font-medium text-purple-700 hover:underline">
                          {customer.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{[customer.city, customer.state].filter(Boolean).join(', ')}</td>
                      <td className="py-2 pr-4">{customer.phone}</td>
                      <td className="py-2 pr-4">{customer.email}</td>
                      <td className="py-2 pr-4">{(customer.contacts || []).length}</td>
                      <td className="py-2">
                        {customCount > 0 ? (
                          <span className="inline-block rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-medium">
                            {customCount} custom
                          </span>
                        ) : (
                          <span className="text-gray-400">Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
