// Small shared form pieces so every page looks and behaves the same

// Tinted fill + visible border so a field is obvious before it's clicked.
// inputBase has no width so it can be combined with w-16, flex-1, etc.
export const inputBase =
  "rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 " +
  "hover:border-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 " +
  "disabled:bg-gray-100 disabled:text-gray-700 disabled:hover:border-gray-300";

export const inputClass = `block w-full ${inputBase}`;

// For short quantity boxes that sit inline next to a label
export const smallInputBase = inputBase.replace('px-3 py-2', 'px-2 py-1');

export const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1.5";

export const checkboxClass = "h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-300";

export const primaryButtonClass =
  "px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50";

export const secondaryButtonClass =
  "px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50";

export const dangerButtonClass =
  "px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 bg-white hover:bg-red-50 disabled:opacity-50";

export function Field({ label, hint, required = false, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

export function Card({ title, actions, children, className = "" }) {
  return (
    <section className={`bg-white border border-gray-200 shadow-sm rounded-xl p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Message({ message }) {
  if (!message) return null;
  return (
    <div className={`rounded-md p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
      {message.text}
    </div>
  );
}
