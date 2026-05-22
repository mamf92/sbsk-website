import { supabase } from '../client';

export default async function getMembers() {
  const { data, error } = await supabase.from('members').select('*');
  if (error) {
    console.error('Error fetching members:', error);
  } else {
    return data;
  }
}
