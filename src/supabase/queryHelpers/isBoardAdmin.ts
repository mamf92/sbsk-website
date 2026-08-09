import { supabase } from '../client';

// Admin (board) status is decided by the database, not by the client. `member_is_admin()`
// is a SECURITY DEFINER RPC that returns whether the current user is an admin in the
// `members` registry. We ask it directly rather than probing a table count, so the flag
// reflects an explicit claim instead of a side effect of row visibility.
export async function isBoardAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('member_is_admin');

  if (error) return false;
  return data === true;
}
