'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) router.replace(next); else setError('Wrong password');
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sheet shadow-pop"><BookOpen size={30} className="text-accent" /></div>
      <h1 className="mb-6 text-[24px] font-bold text-ink">Reader</h1>
      <form onSubmit={submit} className="w-full max-w-xs">
        <input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="mb-3 h-12 w-full rounded-group bg-surface-group px-4 text-[16px] text-ink placeholder:text-ink-2 focus:outline-none" />
        {error && <p className="mb-3 text-center text-[13px] text-danger">{error}</p>}
        <button type="submit" disabled={busy || !password} className="h-12 w-full rounded-full bg-accent text-[16px] font-semibold text-bg disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
