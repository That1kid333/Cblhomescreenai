import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authClient } from './supabase/authClient';
import demoAvatar from '../../assets/cbl-demo-member.png';

/**
 * Demo mode — for showing the member experience to the team without a real
 * account: open any page with ?demo-member (e.g. citybucketlist.com/?demo-member).
 * The flag persists in sessionStorage for the tab; "Sign out" ends the demo.
 * Demo data mirrors the rider-dashboard artwork (Alex Morgan / r/k2417).
 */
const DEMO_KEY = 'cbl-demo-member';
const DEMO_PROFILE: MemberProfile = {
  id: 'demo',
  name: 'Alex Morgan',
  photo: demoAvatar,
  referral_code: 'k2417',
  created_at: '2025-02-01T00:00:00Z',
};
const DEMO_SESSION = { user: { id: 'demo', email: 'alex.morgan@example.com' } } as unknown as Session;

function demoRequested(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('demo-member')) {
      sessionStorage.setItem(DEMO_KEY, '1');
    }
    return sessionStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Site-wide member auth state (riders first — drivers/concierges later).
 * Sessions come from the main app's Supabase auth; the profile is the
 * member's own `riders` row (RLS: auth.uid() = id), which every account has.
 * A missing row is tolerated — the UI falls back to the email initial.
 */

export type MemberProfile = {
  id: string;
  name: string | null;
  photo: string | null;
  referral_code: string | null;
  created_at: string | null;
};

type AuthState = {
  session: Session | null;
  profile: MemberProfile | null;
  referralCount: number | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  referralCount: null,
  loading: true,
  signIn: async () => ({ error: 'Auth not ready' }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemo] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [referralCount, setReferralCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoRequested()) {
      setDemo(true);
      setLoading(false);
      return;
    }
    authClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = authClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (demo || !session?.user?.id) {
      if (!demo) {
        setProfile(null);
        setReferralCount(null);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: rider }, { count }] = await Promise.all([
        authClient
          .from('riders')
          .select('id, name, photo, referral_code, created_at')
          .eq('id', session.user.id)
          .maybeSingle(),
        authClient
          .from('rider_referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', session.user.id),
      ]);
      if (cancelled) return;
      setProfile((rider as MemberProfile) ?? null);
      setReferralCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    if (demo) {
      try {
        sessionStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignore */
      }
      setDemo(false);
      // Strip the ?demo-member flag so a refresh doesn't re-enter the demo.
      // Always land on the home path — never echo location-derived strings
      // into replace(), so a crafted path can't become a redirect gadget.
      window.location.replace('/');
      return;
    }
    await authClient.auth.signOut();
  }, [demo]);

  const value: AuthState = demo
    ? { session: DEMO_SESSION, profile: DEMO_PROFILE, referralCount: 12, loading: false, signIn, signOut }
    : { session, profile, referralCount, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** First name for greetings: profile name → email local part → 'Member'. */
export function firstNameOf(profile: MemberProfile | null, session: Session | null): string {
  const source = profile?.name?.trim() || session?.user?.email?.split('@')[0] || 'Member';
  return source.split(/\s+/)[0].replace(/^./, (c) => c.toUpperCase());
}
