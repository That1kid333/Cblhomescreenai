import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authClient } from './supabase/authClient';
import keithPhoto from '../../assets/cbl-keith.png';

/**
 * Demo mode — for showing the member experience to the team without a real
 * account: open any page with ?demo-member (e.g. citybucketlist.com/?demo-member).
 * The flag persists in sessionStorage for the tab; "Sign out" ends the demo.
 * Personalized to Keith for demoing to the CBL team. Add `?demo-member` to
 * any page to turn it on (persists for the tab); Sign out exits. Swap in a
 * real headshot by setting `photo` to an imported image; until then the
 * avatar shows the member's initial. Optional `?demo-member=Name` overrides
 * the display name so anyone on the team can preview their own card.
 */
const DEMO_KEY = 'cbl-demo-member';
const DEMO_OFF_KEY = 'cbl-demo-off';
const DEMO_NAME_KEY = 'cbl-demo-name';
const DEMO_PROFILE: MemberProfile = {
  id: 'demo',
  name: 'Keith Schmiedlin',
  photo: keithPhoto, // Keith's portrait from his app driver dashboard
  referral_code: 'k2408a', // Keith's real CBL referral code
  created_at: '2025-02-01T00:00:00Z',
};
const DEMO_SESSION = { user: { id: 'demo', email: 'keith@citybucketlist.com' } } as unknown as Session;

// Preview/staging hosts (and local dev) — NOT the live citybucketlist.com.
function isPreviewHost(): boolean {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.netlify.app');
}

function demoRequested(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('demo-member');
    if (param !== null) {
      sessionStorage.removeItem(DEMO_OFF_KEY);
      sessionStorage.setItem(DEMO_KEY, '1');
      if (param) sessionStorage.setItem(DEMO_NAME_KEY, param);
    }
    // Signed out this tab → stay signed out until they reopen or ?demo-member.
    if (sessionStorage.getItem(DEMO_OFF_KEY) === '1') return false;
    if (sessionStorage.getItem(DEMO_KEY) === '1') return true;
    // Always-on for previews so the member experience (avatar + card) is
    // there for demos without adding ?demo-member; never on production.
    return isPreviewHost();
  } catch {
    return false;
  }
}

function demoProfile(): MemberProfile {
  try {
    const name = sessionStorage.getItem(DEMO_NAME_KEY);
    if (name) return { ...DEMO_PROFILE, name };
  } catch {
    /* ignore */
  }
  return DEMO_PROFILE;
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
        // Keep demo off for this tab even on preview (where it's otherwise
        // always-on), so signing out actually shows the logged-out state.
        sessionStorage.setItem(DEMO_OFF_KEY, '1');
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
    ? { session: DEMO_SESSION, profile: demoProfile(), referralCount: 12, loading: false, signIn, signOut }
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
