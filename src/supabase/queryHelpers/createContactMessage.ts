import { supabase } from '../client';
import type { ContactValues } from '../../schemas/contact';

/**
 * Sends a Kontakt oss submission to `public.contact_messages` (see the migration this shipped
 * with). Unlike `createMember`, this does not chain `.select().single()` — the insert-only RLS
 * policy on this table gives `anon` no read grant at all, so reading the row back would fail
 * even though the insert itself succeeded.
 */
export async function createContactMessage(values: ContactValues): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: values.name,
    email: values.email,
    message: values.message,
  });

  if (error) throw error;
}
