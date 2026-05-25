import { supabase } from '../client';

export async function canViewMembers(): Promise<boolean> {
  const { count, error } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true });

  if (error) return false;
  return (count ?? 0) > 0;
}
