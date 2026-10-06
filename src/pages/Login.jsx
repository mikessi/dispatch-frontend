import { Navigate, useLocation } from "react-router-dom";
import SignInForm from "../components/SignInForm";
import { Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";

// Staff sign-in. Quotes is public; everything else needs this.
export default function Login() {
  const { user, loading, available } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-1 text-sm text-gray-600">Loading…</p>;
  // Once signed in, go back to the page that asked for it (or Jobs)
  if (user) return <Navigate to={location.state?.from || '/jobs'} replace />;

  return (
    <div className="p-1 space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <Card>
        {available ? (
          <>
            <p className="text-sm text-gray-600 mb-3">Sign in to manage jobs, invoices, customers, addresses and rates.</p>
            <SignInForm />
          </>
        ) : (
          <p className="text-sm text-gray-600">The database isn’t connected, so sign-in isn’t available.</p>
        )}
      </Card>
    </div>
  );
}
