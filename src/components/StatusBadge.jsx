// Paid / unpaid pill for invoices
export default function StatusBadge({ status, className = "" }) {
  const isPaid = status === 'paid';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      } ${className}`}
    >
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
}
