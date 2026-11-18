import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from '../supabase/client';
import {
  enrollTotp,
  getAssurance,
  listTotpFactors,
  unenrollFactor,
  type TotpEnrollment,
} from '../supabase/queryHelpers/mfa';
import { safeNextPath } from './requireAdminSession';

function nextFrom(request: Request): string {
  return safeNextPath(new URL(request.url).searchParams.get('neste'));
}

async function requireUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect('/login?reason=not_authenticated');
  return user;
}

/** `/to-faktor`: ask for the code. Nothing to ask for without a verified factor. */
export async function twoFactorChallengeLoader({ request }: LoaderFunctionArgs) {
  await requireUser();
  const next = nextFrom(request);
  const { currentLevel } = await getAssurance();
  if (currentLevel === 'aal2') throw redirect(next);

  const verified = (await listTotpFactors()).filter((f) => f.status === 'verified');
  if (verified.length === 0) {
    throw redirect(`/to-faktor/oppsett?neste=${encodeURIComponent(next)}`);
  }
  return { factorId: verified[0].id, next };
}

export interface TwoFactorSetupData {
  enrollment: TotpEnrollment;
  next: string;
  /** True when the admin already has one factor and is adding a backup. */
  addingBackup: boolean;
}

/**
 * `/to-faktor/oppsett`: start an enrolment. Done in the loader, not an effect, so React's
 * double-invoked effects in development cannot enrol twice. A half-finished enrolment from an
 * earlier visit is removed first: Supabase refuses a second factor with the same name, and an
 * unverified factor is useless anyway.
 */
export async function twoFactorSetupLoader({ request }: LoaderFunctionArgs) {
  await requireUser();
  const next = nextFrom(request);
  const { currentLevel, nextLevel } = await getAssurance();

  // With a verified factor, Supabase only lets an aal2 session add another.
  if (currentLevel === 'aal1' && nextLevel === 'aal2') {
    throw redirect(`/to-faktor?neste=${encodeURIComponent(next)}`);
  }

  const factors = await listTotpFactors();
  await Promise.all(
    factors.filter((f) => f.status === 'unverified').map((f) => unenrollFactor(f.id)),
  );
  const verifiedCount = factors.filter((f) => f.status === 'verified').length;

  const suffix = crypto.randomUUID().slice(0, 4);
  const enrollment = await enrollTotp(`Autentiseringsapp ${verifiedCount + 1} (${suffix})`);
  return { enrollment, next, addingBackup: verifiedCount > 0 } satisfies TwoFactorSetupData;
}
