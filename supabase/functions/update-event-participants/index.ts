// supabase/functions/update-event-participants/index.ts
//
// Writes to public.event_participants (issue #98). The acting member is always the verified
// JWT's own `user.id` — the request body carries only `action` and `eventId`, never a
// participant object or a supabaseId, so a client cannot spoof another member's identity or
// display name/photo (the #96 finding this closes). `name`/`surname`/`photo_url` are read
// server-side from the caller's own `profiles` row, which they always have permission to read.
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://10.0.0.33:5173',
  'https://mamf92.github.io',
]);

const makeCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://mamf92.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

type RequestBody = {
  action: 'join' | 'leave';
  eventId: string;
};

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') ?? '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const publishableKeysRaw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}';
    const publishableKeys = JSON.parse(publishableKeysRaw);

    const anonKey =
      Deno.env.get('EDGE_SUPABASE_ANON_KEY') ??
      publishableKeys?.anon ??
      Object.values(publishableKeys)[0] ??
      '';

    if (!supabaseUrl || !anonKey) {
      console.error('Missing Supabase env', { hasUrl: !!supabaseUrl, hasAnon: !!anonKey });
      return new Response('Missing Supabase env', { status: 500, headers: corsHeaders });
    }

    // A user-scoped client, not a service-role one: every write below relies on
    // event_participants' own RLS policies (self-insert, self-or-admin delete) to enforce that a
    // member can only ever act as themselves.
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Unauthorized', error);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const body = (await req.json()) as RequestBody;
    const { action, eventId } = body;

    if (!eventId || (action !== 'join' && action !== 'leave')) {
      return new Response('Bad request', { status: 400, headers: corsHeaders });
    }

    if (action === 'leave') {
      const { error: deleteError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('supabase_id', user.id);

      if (deleteError) {
        console.error('leave error', deleteError);
        return new Response('Leave failed', { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, surname, photo_url')
      .eq('supabase_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('profile lookup failed', profileError);
      return new Response('Profile not found', { status: 400, headers: corsHeaders });
    }

    // No upsert: event_participants has no update policy (see the migration comment), only
    // self-insert and self/admin-delete. Re-joining after an edited profile is what refreshes
    // the snapshot, so delete first — idempotent if the member was not already joined.
    const { error: deleteError } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('supabase_id', user.id);

    if (deleteError) {
      console.error('join (pre-delete) error', deleteError);
      return new Response('Join failed', { status: 500, headers: corsHeaders });
    }

    const { error: insertError } = await supabase.from('event_participants').insert({
      event_id: eventId,
      supabase_id: user.id,
      name: profile.name ?? '',
      surname: profile.surname ?? '',
      photo_url: profile.photo_url ?? '',
    });

    if (insertError) {
      console.error('join (insert) error', insertError);
      return new Response('Join failed', { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('fatal', err);
    return new Response(String(err), { status: 500, headers: corsHeaders });
  }
});
