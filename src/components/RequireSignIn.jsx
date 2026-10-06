import { useAuth } from "../context/AuthContext";
import SignInForm from "./SignInForm";
import { Card } from "./ui";

// Wraps pages whose data is private (customers, addresses)
export default function RequireSignIn({ title, children }) {
  const { user, loading, available } = useAuth();

  if (loading) return <p className="p-1 text-sm text-gray-600">Loading…</p>;
  if (user) return children;

  return (
    <div className="p-1 space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        {available ? (
          <>
            <p className="text-sm text-gray-600 mb-3">Sign in to view and edit {title.toLowerCase()}.</p>
            <SignInForm />
          </>
        ) : (
          <p className="text-sm text-gray-600">The database isn’t connected, so {title.toLowerCase()} aren’t available.</p>
        )}
      </Card>
    </div>
  );
}
