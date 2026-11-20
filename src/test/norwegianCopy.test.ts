import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import nbEvents from '../i18n/locales/nb/events.json';

/**
 * The site is Norwegian-first. English slipped in as hard-coded JSX copy ("Placeholder
 * profile") and as locale values nobody translated. This reads every component's JSX text and
 * its reader-facing attributes, and the Norwegian locale files, and fails on common English
 * words. It is a tripwire for obvious leaks, not a language detector: if a word is legitimately
 * English (a game title, the language toggle), add the file or the word to the lists below.
 */

const SRC = join(import.meta.dirname, '..');
const ENGLISH = new Set(
  (
    'the and with your you our are was not this that from have please loading error cancel ' +
    'save delete submit close back next previous search password message welcome failed required ' +
    'invalid retry click read more show hide view upload download settings dashboard placeholder ' +
    'getting there events registration login logout'
  ).split(' '),
);
// Intentionally bilingual: each label is written in the language it switches to.
const SKIP_FILES = new Set(['components/ui/LanguageToggle.tsx']);
const READER_ATTRIBUTES = new Set(['aria-label', 'title', 'placeholder', 'alt', 'label']);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) && !/\.(test|stories)\.tsx$/.test(entry.name) ? [path] : [];
  });
}

function englishWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((word) => ENGLISH.has(word));
}

describe('Norwegian copy', () => {
  it('has no obvious English in component text or reader-facing attributes', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const name = relative(SRC, file);
      if (SKIP_FILES.has(name)) continue;
      const sf = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const report = (node: ts.Node, text: string) => {
        const hits = englishWords(text);
        // One English word in an otherwise Norwegian sentence is fine ("Spill" etc. are not
        // listed); two or more, or a short all-English label, is a leak.
        if (hits.length >= 2 || (hits.length === 1 && text.trim().split(/\s+/).length <= 3)) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
          offenders.push(`${name}:${line + 1} "${text.trim()}"`);
        }
      };
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) report(node, node.text);
        if (
          ts.isJsxAttribute(node) &&
          READER_ATTRIBUTES.has(node.name.getText()) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer)
        ) {
          report(node, node.initializer.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    expect(offenders).toEqual([]);
  });

  it('has no English in the Norwegian locale files', () => {
    const offenders: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (englishWords(value).length >= 1) offenders.push(`${path}: ${value}`);
      } else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
      }
    };
    walk(nbEvents, 'nb/events');
    expect(offenders).toEqual([]);
  });
});
