import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DocumentTextIcon,
  TruckIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MapPinIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const { user, available, signOut } = useAuth();
  // Quotes is public; everything else is for signed-in staff
  const publicItems = [
    { path: '/quotes', label: 'Quotes', icon: DocumentTextIcon },
  ];
  const staffItems = [
    { path: '/dispatch', label: 'Dispatch Board', icon: CalendarDaysIcon },
    { path: '/jobs', label: 'Jobs', icon: ClipboardDocumentListIcon },
    { path: '/invoices', label: 'Invoices', icon: DocumentDuplicateIcon },
    { path: '/customers', label: 'Customers', icon: UserGroupIcon },
    { path: '/addresses', label: 'Addresses', icon: MapPinIcon },
    { path: '/trucks', label: 'Trucks', icon: TruckIcon },
    { path: '/rate-settings', label: 'Rate Settings', icon: Cog6ToothIcon },
    // { path: '/drivers', label: 'Drivers', icon: UserGroupIcon },
  ];
  const navItems = user ? [...publicItems, ...staffItems] : publicItems;

  // On phones the menu slides in from the left. After each page change, close it
  // and start the new page at the top.
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 bg-white/95 backdrop-blur px-4 py-3 shadow print:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-1 rounded-lg p-2 text-gray-700 hover:bg-purple-50"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
      <span className="gradient-primary text-white px-3 py-1 rounded-lg text-lg font-bold tracking-tight">Dispatch</span>
    </header>
    {open && (
      <div className="md:hidden fixed inset-0 z-40 bg-black/40 print:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
    )}
    <nav className={`fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50 flex flex-col print:hidden transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-2">
        <div className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl shadow-lg">
          <span className="text-2xl font-bold tracking-tight">Dispatch</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
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
      <div className="p-4 border-t text-sm">
        {user ? (
          <>
            <p className="text-gray-500">Signed in as</p>
            <p className="font-medium text-gray-800 truncate" title={user.email}>{user.email}</p>
            <div className="mt-1 flex items-center justify-between">
              <button onClick={signOut} className="text-purple-600 hover:underline">Sign out</button>
              <NavLink to="/sample-data" className="text-xs text-gray-400 hover:text-purple-600">Sample data</NavLink>
            </div>
          </>
        ) : (
          available && <NavLink to="/login" className="text-purple-600 hover:underline">Staff sign in</NavLink>
        )}
      </div>
    </nav>
    </>
  );
} 