import { supabase } from '../client';

export interface MemberData {
  id: string;
  name: string;
  surname: string;
  phone: string | null;
  email: string;
  is_admin: boolean;
}

export async function editMember(member: MemberData) {
  const { data, error } = await supabase
    .from('members')
    .update({
      name: member.name,
      surname: member.surname,
      phone: member.phone || null,
      email: member.email,
      is_admin: member.is_admin,
    })
    .select()
    .eq('id', member.id)
    .single();

  if (error) throw error;
  return data;
}
