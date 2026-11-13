import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { resources, useEventsT } from './index';
import { useLocale } from '../hooks/locale/useLocale';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { LOCALE_STORAGE_KEY } from '../utils/locale';

function keyPaths(tree: unknown, prefix = ''): string[] {
  if (typeof tree !== 'object' || tree === null) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) =>
    keyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('locale files', () => {
  it('English has exactly the Norwegian keys, in every namespace', () => {
    expect(Object.keys(resources.en).sort()).toEqual(Object.keys(resources.nb).sort());
    for (const namespace of Object.keys(resources.nb) as (keyof typeof resources.nb)[]) {
      expect(keyPaths(resources.en[namespace]).sort(), namespace).toEqual(
        keyPaths(resources.nb[namespace]).sort(),
      );
    }
  });

  it('has no empty strings', () => {
    for (const locale of [resources.nb, resources.en]) {
      for (const namespace of Object.values(locale)) {
        for (const path of keyPaths(namespace)) {
          const value = path
            .split('.')
            .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], namespace);
          expect(typeof value === 'string' && value.trim().length > 0, path).toBe(true);
        }
      }
    }
  });

  it('keeps the same interpolation variables in both languages', () => {
    const variables = (text: string) => [...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();
    for (const namespace of Object.keys(resources.nb) as (keyof typeof resources.nb)[]) {
      for (const path of keyPaths(resources.nb[namespace])) {
        const read = (tree: unknown) =>
          path.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], tree);
        expect(variables(read(resources.en[namespace]) as string), path).toEqual(
          variables(read(resources.nb[namespace]) as string),
        );
      }
    }
  });
});

function Harness() {
  const t = useEventsT();
  const { locale, setLocale } = useLocale();
  return (
    <>
      <LanguageToggle locale={locale} onChange={setLocale} />
      <h2>{t('program.title')}</h2>
      <p>{t('signup.opensInNewTab', { host: 'spond.com' })}</p>
    </>
  );
}

describe('switching language', () => {
  it('changes the visible copy and the stored choice', async () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Program' })).toBeInTheDocument();
    expect(screen.getByText('Åpner spond.com i en ny fane')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Change language to English/ }));

    expect(screen.getByRole('heading', { name: 'Programme' })).toBeInTheDocument();
    expect(screen.getByText('Opens spond.com in a new tab')).toBeInTheDocument();
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');

    await userEvent.click(screen.getByRole('button', { name: /Bytt språk til norsk/ }));
    expect(screen.getByRole('heading', { name: 'Program' })).toBeInTheDocument();
  });

  it('useLocale reports the active locale', async () => {
    let seen = '';
    function Probe() {
      seen = useLocale().locale;
      return null;
    }
    render(<Probe />);
    expect(seen).toBe('nb');
  });

  it('does not double-escape interpolated text (React escapes it)', () => {
    function Probe() {
      const t = useEventsT();
      return <p>{t('venue.contact', { name: 'Kari & Ola' })}</p>;
    }
    render(<Probe />);
    expect(screen.getByText('Kontaktperson på stedet: Kari & Ola')).toBeInTheDocument();
  });
});
