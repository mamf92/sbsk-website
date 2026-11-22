import { supabase } from '../supabase/client';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { isBoardAdmin } from '../supabase/queryHelpers/isBoardAdmin';
import {
  isActiveMember,
  sendSignInCode,
  verifySignInCode,
} from '../supabase/queryHelpers/memberAuth';
import { hasAcceptedCurrentTerms } from '../utils/legal';
import { safeNextPath } from '../loaders/requireAdminSession';
import { useAuth } from './authContext/authContext';
import { memberPortalEnabled } from '../utils/featureFlags';

interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignInResult {
  isAdmin: boolean;
  /** First sign-in, or the privacy policy and terms changed since the member accepted them. */
  needsOnboarding: boolean;
}

/** Thrown when the login works but the board has disabled the member. */
export class MemberDisabledError extends Error {
  constructor() {
    super('User is banned');
    this.name = 'MemberDisabledError';
  }
}

/**
 * Where to go after a successful sign-in. First-time setup wins over everything; then a safe
 * `neste` path; then the portal the person belongs in.
 */
export function destinationAfterSignIn(result: SignInResult, next: string | null = null): string {
  const fallback = result.isAdmin ? '/styreportal' : '/medlemsportal';
  const target = safeNextPath(next, fallback);
  if (result.needsOnboarding) return `/lag-medlemsprofil?neste=${encodeURIComponent(target)}`;
  return target;
}

export const useAuthActions = () => {
  const { login, logout, refreshSession } = useAuth();

  // The shared second half of both sign-in methods. A disabled member still has a login (their
  // history is kept), so the session is ended here rather than leaving them on an empty page.
  const finishSignIn = async (userId: string): Promise<SignInResult> => {
    if (!(await isActiveMember())) {
      await logout();
      throw new MemberDisabledError();
    }
    const profile = await getProfile(userId);
    login(profile);
    await refreshSession();
    const isAdmin = await isBoardAdmin();
    // Terms are only asked for once member sign-up is open: until then only the board signs
    // in, and the texts are not published.
    const needsOnboarding =
      memberPortalEnabled && !hasAcceptedCurrentTerms(profile.terms_accepted_version);
    return { isAdmin, needsOnboarding };
  };

  const signInWithPassword = async ({ email, password }: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Innlogging mislyktes');
    }

    return finishSignIn(data.session.user.id);
  };

  const requestSignInCode = (email: string) => sendSignInCode(email);

  const signInWithCode = async (email: string, code: string) => {
    await verifySignInCode(email, code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Token has expired or is invalid');
    return finishSignIn(user.id);
  };

  const signOut = async () => {
    await logout();
  };

  return {
    signInWithPassword,
    requestSignInCode,
    signInWithCode,
    signOut,
  };
};
