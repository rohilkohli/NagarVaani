'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BrandMark from './BrandMark';

const STAFF_ROLES = ['admin', 'supervisor', 'operator', 'auditor'];

export function isAdminSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  const token = sessionStorage.getItem('nv_dashboard_token');
  const role = sessionStorage.getItem('nv_dashboard_role');
  const expiresAt = Number(sessionStorage.getItem('nv_dashboard_expires_at') || '0');
  return Boolean(token && STAFF_ROLES.includes(role || '') && expiresAt > Date.now());
}

export function clearDashboardSession(): void {
  if (typeof window === 'undefined') return;
  for (const key of ['nv_dashboard_authorized', 'nv_dashboard_role', 'nv_dashboard_token', 'nv_dashboard_expires_at']) {
    sessionStorage.removeItem(key);
  }
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = sessionStorage.getItem('nv_dashboard_token');
      const expiresAt = Number(sessionStorage.getItem('nv_dashboard_expires_at') || '0');
      if (!token || expiresAt <= Date.now()) {
        clearDashboardSession();
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !STAFF_ROLES.includes(data?.role)) {
          clearDashboardSession();
          return;
        }
        sessionStorage.setItem('nv_dashboard_role', String(data.role));
        sessionStorage.setItem('nv_dashboard_expires_at', String(Date.now() + Number(data.expiresIn || 3600) * 1000));
        setIsUnlocked(true);
      } catch {
        clearDashboardSession();
      } finally {
        setIsLoading(false);
      }
    };
    void validateSession();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      if (!auth) throw new Error('Firebase Auth is not configured for this environment.');
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Your account is not provisioned.');

      sessionStorage.setItem('nv_dashboard_token', String(data.token));
      sessionStorage.setItem('nv_dashboard_role', String(data.role));
      sessionStorage.setItem('nv_dashboard_expires_at', String(Date.now() + Number(data.expiresIn || 3600) * 1000));
      sessionStorage.setItem('nv_dashboard_authorized', 'true');
      setIsUnlocked(true);
      setError('');
    } catch (requestError) {
      console.error('Identity auth request failed:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Authentication service is unavailable.');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[var(--bg-base)]" />;
  if (isUnlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-base)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <BrandMark size={40} className="shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Restricted access</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard access</h2>
          </div>
        </div>
        <div className="mb-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Sign in with an authorised operational staff account.</span>
          </div>
        </div>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-4 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
