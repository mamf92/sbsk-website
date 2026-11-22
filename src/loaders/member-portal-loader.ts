import { requireMember } from './requireMember';

export async function memberPortalLoader() {
  const { profile } = await requireMember('/medlemsportal');
  return { profile };
}
