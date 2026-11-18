import { supabase } from '../client';

export interface MemberData {
  name: string;
  surname: string;
  phone: string | null;
  email: string;
  is_admin: boolean;
}

export async function createMember(member: MemberData) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: member.name,
      surname: member.surname,
      phone: member.phone || null,
      email: member.email,
      is_admin: member.is_admin,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
