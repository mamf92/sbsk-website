import { supabase } from '../client';

export interface AdminTypes {
  id: number;
  name: string;
  email: string;
}

export async function getAdmins() {
  const { data } = await supabase.from('admins').select('*');
  if (!data) throw new Response('Admins not found', { status: 404 });
  return { data };
}
