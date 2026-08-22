import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './csp';

/** Pulls one directive's sources out of the serialised policy. */
function directive(policy: string, name: string): string[] {
  const found = policy.split('; ').find((part) => part.startsWith(`${name} `));
  return found ? found.slice(name.length + 1).split(' ') : [];
}

const supabaseUrl = 'https://abcdefgh.supabase.co';

describe('buildContentSecurityPolicy', () => {
  it('falls back to same-origin for anything without its own directive', () => {
    expect(directive(buildContentSecurityPolicy(), 'default-src')).toEqual(["'self'"]);
  });

  it('allows no script source beyond our own origin in a production build', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl });

    expect(directive(policy, 'script-src')).toEqual(["'self'"]);
    expect(policy).not.toContain('unsafe-eval');
  });

  it('opens script-src only far enough for the dev server preamble', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl, dev: true });

    expect(directive(policy, 'script-src')).toContain("'unsafe-inline'");
    expect(directive(policy, 'connect-src')).toContain('ws://localhost:*');
    // Even in dev, an inline <script> is the only concession — eval stays out.
    expect(policy).not.toContain('unsafe-eval');
  });

  it('reaches Sanity for content and images through one wildcard', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl });

    expect(directive(policy, 'connect-src')).toContain('https://*.sanity.io');
    expect(directive(policy, 'connect-src')).toContain('wss://*.api.sanity.io');
    expect(directive(policy, 'img-src')).toContain('https://*.sanity.io');
  });

  it('derives both the request and the realtime origin from the Supabase URL', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl });

    expect(directive(policy, 'connect-src')).toContain('https://abcdefgh.supabase.co');
    expect(directive(policy, 'connect-src')).toContain('wss://abcdefgh.supabase.co');
    // Profile images are served from the same origin through storage.
    expect(directive(policy, 'img-src')).toContain('https://abcdefgh.supabase.co');
  });

  it('uses the insecure websocket scheme for a local Supabase, as CI and the e2e suite do', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl: 'http://localhost:54321' });

    expect(directive(policy, 'connect-src')).toContain('http://localhost:54321');
    expect(directive(policy, 'connect-src')).toContain('ws://localhost:54321');
    expect(policy).not.toContain('wss://localhost');
  });

  it.each([undefined, '', 'abcdefgh.supabase.co'])(
    'emits no Supabase source rather than a broken one for %j',
    (value) => {
      // A URL without a scheme is the documented Phase 0 failure; the app is already broken by
      // then. The policy must not carry `undefined` or a half-parsed host into production.
      const policy = buildContentSecurityPolicy({ supabaseUrl: value });

      expect(policy).not.toContain('undefined');
      expect(policy).not.toContain('supabase');
    },
  );

  it('locks down the directives that have no legitimate use here', () => {
    const policy = buildContentSecurityPolicy({ supabaseUrl });

    expect(directive(policy, 'object-src')).toEqual(["'none'"]);
    expect(directive(policy, 'frame-src')).toEqual(["'none'"]);
    expect(directive(policy, 'base-uri')).toEqual(["'self'"]);
    expect(directive(policy, 'form-action')).toEqual(["'self'"]);
  });

  it('leaves out the directives a browser ignores in a meta element', () => {
    // Present in meta, these do nothing except log a console warning on every page load.
    const policy = buildContentSecurityPolicy({ supabaseUrl });

    expect(policy).not.toContain('frame-ancestors');
    expect(policy).not.toContain('report-uri');
    expect(policy).not.toContain('report-to');
    expect(policy).not.toContain('sandbox');
  });
});
