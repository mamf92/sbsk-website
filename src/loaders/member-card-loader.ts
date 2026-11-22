import { getMember } from '../supabase/queryHelpers/getMember';
import { getMemberSeasonStatus } from '../supabase/queryHelpers/getSeasonStatus';
import { requireMember } from './requireMember';
import { settle } from './settle';

/**
 * `/medlemsportal/medlemskort`: the member's register row (name, card token) and this season's
 * payment status. `paid` is null when the status could not be read: the card then says so
 * rather than guessing "Ikke betalt".
 */
export async function memberCardLoader() {
  const { user } = await requireMember('/medlemsportal/medlemskort');
  const me = await settle(getMember(user.id));
  const status = me.data ? await settle(getMemberSeasonStatus(me.data.id)) : null;
  return {
    member: me.data,
    paid: status && !status.failed ? (status.data?.paid ?? false) : null,
  };
}

export type MemberCardData = Awaited<ReturnType<typeof memberCardLoader>>;
