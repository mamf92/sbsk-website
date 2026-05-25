import { supabase } from '../client';

export interface MemberData {
  id: string;
  name: string | null;
  surname: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
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
      address: member.address,
      postcode: member.postcode,
      city: member.city,
      phone: member.phone,
      email: member.email,
      is_admin: member.is_admin,
    })
    .select()
    .eq('id', member.id)
    .single();

  if (error) throw error;
  return data;
}
