import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useDocumentLang, useTranslatedContent } from './useLocale';
import { setLocale } from '../../utils/locale';

function Shell() {
  useDocumentLang();
  return null;
}

function TranslatedContent() {
  useTranslatedContent();
  return null;
}

function renderAt(path: string, { translated = true } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Shell />
      {translated && <TranslatedContent />}
    </MemoryRouter>,
  );
}

describe('useDocumentLang', () => {
  it('follows the choice on a translated route', () => {
    renderAt('/board-game-masters');
    expect(document.documentElement.lang).toBe('nb');
    act(() => setLocale('en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('stays Norwegian on a route that is not translated, whatever the choice', () => {
    act(() => setLocale('en'));
    renderAt('/om-oss');
    expect(document.documentElement.lang).toBe('nb');
  });

  it('stays Norwegian on a translated route whose page is an error or placeholder', () => {
    act(() => setLocale('en'));
    renderAt('/arrangementer/finnes-ikke', { translated: false });
    expect(document.documentElement.lang).toBe('nb');
  });

  it('decodes the path before matching', () => {
    act(() => setLocale('en'));
    renderAt('/arrangementer/h%C3%B8stturnering');
    expect(document.documentElement.lang).toBe('en');
  });
});
