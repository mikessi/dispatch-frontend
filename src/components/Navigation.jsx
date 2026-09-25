import { NavLink } from 'react-router-dom';
import {
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
  MapPinIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  // Only Quotes is enabled for now; uncomment items to re-enable pages.
  const navItems = [
    { path: '/quotes', label: 'Quotes', icon: DocumentTextIcon },
    { path: '/quotes-plus-15', label: 'Quotes+15%', icon: DocumentTextIcon },
    // { path: '/dispatch', label: 'Dispatch Board', icon: ClipboardDocumentListIcon },
    // { path: '/drivers', label: 'Drivers', icon: UserGroupIcon },
    // { path: '/customers', label: 'Customers', icon: UserGroupIcon },
    // { path: '/trucks', label: 'Trucks', icon: TruckIcon },
    // { path: '/addresses', label: 'Addresses', icon: MapPinIcon },
    // { path: '/invoices', label: 'Invoices', icon: DocumentDuplicateIcon },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50 flex flex-col">
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
    </nav>
  );
} 