import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
  MapPinIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const { user, signOut } = useAuth();
  // Only Quotes is enabled for now; uncomment items to re-enable pages.
  const navItems = [
    { path: '/quotes', label: 'Quotes', icon: DocumentTextIcon },
    { path: '/jobs', label: 'Jobs', icon: ClipboardDocumentListIcon },
    { path: '/invoices', label: 'Invoices', icon: DocumentDuplicateIcon },
    { path: '/customers', label: 'Customers', icon: UserGroupIcon },
    { path: '/addresses', label: 'Addresses', icon: MapPinIcon },
    { path: '/rate-settings', label: 'Rate Settings', icon: Cog6ToothIcon },
    // { path: '/dispatch', label: 'Dispatch Board', icon: ClipboardDocumentListIcon },
    // { path: '/drivers', label: 'Drivers', icon: UserGroupIcon },
    // { path: '/trucks', label: 'Trucks', icon: TruckIcon },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50 flex flex-col print:hidden">
      <div className="p-6">
        <div className="gradient-primary text-white px-6 py-3 rounded-xl shadow-lg">
          <span className="text-2xl font-bold tracking-tight">Dispatch</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 gradient-primary rounded-full"></div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
      {user && (
        <div className="p-4 border-t text-sm">
          <p className="text-gray-500">Signed in as</p>
          <p className="font-medium text-gray-800 truncate" title={user.email}>{user.email}</p>
          <button onClick={signOut} className="mt-1 text-purple-600 hover:underline">Sign out</button>
        </div>
      )}
    </nav>
  );
} 