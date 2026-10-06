import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { inputClass, primaryButtonClass } from "./ui";

export default function SignInForm({ stacked = false }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Sign-in failed. Check the email and password.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={stacked ? "space-y-2" : "flex flex-wrap items-start gap-2"}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        autoComplete="username" className={`${inputClass} ${stacked ? '' : 'max-w-xs'}`} />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
        autoComplete="current-password" className={`${inputClass} ${stacked ? '' : 'max-w-xs'}`} />
      <button type="submit" disabled={busy} className={`${primaryButtonClass} ${stacked ? 'w-full' : ''}`}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
