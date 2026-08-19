import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { __unstable__loadDesignSystem } from 'tailwindcss';

/**
 * Tailwind drops a class it does not recognise without a warning: `npm run lint`,
 * `npm run test` and `npm run build` all pass with `text-bold` in the tree, and the
 * styling simply never arrives. This suite is the guard — it resolves every class-looking
 * token in `src/` through Tailwind's own design system, built from our real `src/index.css`,
 * and fails on anything that compiles to no CSS.
 *
 * Resolving against the design system rather than a hand-written denylist means the custom
 * `@utility` rules (`lift`, `lift-chip`, `lift-card`), the `@theme` tokens and the `xs`
 * breakpoint are all understood for free, and a token deleted from `@theme` starts failing
 * here on its own.
 */

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const SRC = join(REPO_ROOT, 'src');
const ENTRY_CSS = join(SRC, 'index.css');
const TAILWIND_DIR = join(REPO_ROOT, 'node_modules', 'tailwindcss');

/**
 * `src/index.css` imports `tailwindcss`, which the bundler resolves and the design system
 * loader does not — it asks us for the contents of every `@import` instead.
 */
const STYLESHEETS: Record<string, string> = {
  tailwindcss: 'index.css',
  'tailwindcss/preflight': 'preflight.css',
  'tailwindcss/theme': 'theme.css',
  'tailwindcss/utilities': 'utilities.css',
};

async function loadDesignSystem() {
  return __unstable__loadDesignSystem(readFileSync(ENTRY_CSS, 'utf8'), {
    base: SRC,
    loadStylesheet: async (id: string) => {
      const file = STYLESHEETS[id];
      if (!file) throw new Error(`Unexpected @import '${id}' in a stylesheet under src/`);
      const path = join(TAILWIND_DIR, file);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
  });
}

/**
 * Hand-written CSS classes in `src/index.css` (`.sbsk-dice`, `.sbsk-rt`, `.dark`, …) are real
 * styling that Tailwind knows nothing about, so they are read out of the stylesheet rather
 * than listed here. Only Tailwind's own marker classes, which deliberately emit no rules of
 * their own, need naming.
 */
const MARKER_CLASSES = new Set(['group', 'peer']);

function handWrittenClasses(): Set<string> {
  const css = readFileSync(ENTRY_CSS, 'utf8');
  const names = new Set<string>();
  for (const match of css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) names.add(match[1]);
  return names;
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(path);
  }
  return found;
}

/**
 * Class lists in this codebase are not only in `className=` — most of the design system keeps
 * them in module-level consts and category maps (`Buttons.tsx`'s `variants`, `Card.tsx`'s
 * `headers`), so restricting the scan to the attribute would miss where the tokens actually
 * live. Every string literal is collected instead, and `looksLikeClassList` below decides
 * which of them are class lists.
 *
 * Template literals contribute their static chunks only. Nothing in the tree currently glues
 * a class fragment to an interpolation (`text-${size}`), and a fragment that did would be
 * unresolvable by definition, so a chunk boundary drops the token adjacent to it.
 */
function stringLiterals(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  const literals: string[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literals.push(node.text);
    } else if (ts.isTemplateExpression(node)) {
      // Head keeps its leading token and loses its trailing one; a middle/tail span loses its
      // leading token. Padding with a space on the interpolation side does exactly that once
      // the caller splits on whitespace.
      literals.push(`${node.head.text} `);
      for (const span of node.templateSpans) {
        literals.push(
          ts.isTemplateTail(span.literal) ? ` ${span.literal.text}` : ` ${span.literal.text} `,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return literals;
}

/**
 * A class list is told apart from Norwegian copy by how much of it Tailwind understands. Prose
 * resolves nothing ("Legg til navn"), a class list resolves nearly everything — so a string
 * where most tokens are real utilities is a class list, and the few that resolve to nothing are
 * the bug. Deliberately conservative: a lone dead token in a one-token string is not caught,
 * which is the trade for never failing on a sentence.
 */
function looksLikeClassList(tokens: string[], isKnown: (token: string) => boolean) {
  const known = tokens.filter(isKnown).length;
  return tokens.length >= 2 && known >= 2 && known / tokens.length >= 0.5;
}

describe('every class name in src/ compiles to CSS', () => {
  it('has no class that Tailwind silently drops', async () => {
    const design = await loadDesignSystem();
    const allowed = handWrittenClasses();

    const resolves = new Map<string, boolean>();
    const isKnown = (token: string) => {
      let known = resolves.get(token);
      if (known === undefined) {
        known =
          allowed.has(token) ||
          MARKER_CLASSES.has(token.split('/')[0]) ||
          design.candidatesToCss([token])[0] !== null;
        resolves.set(token, known);
      }
      return known;
    };

    const dead: string[] = [];

    for (const file of sourceFiles(SRC)) {
      for (const literal of stringLiterals(file)) {
        const tokens = literal.split(/\s+/).filter(Boolean);
        if (!looksLikeClassList(tokens, isKnown)) continue;
        for (const token of tokens) {
          if (!isKnown(token)) dead.push(`${relative(REPO_ROOT, file)}: ${token}`);
        }
      }
    }

    expect(dead).toEqual([]);
  });

  it('recognises the custom utilities and theme tokens, so the check is not vacuous', async () => {
    const design = await loadDesignSystem();

    expect(design.candidatesToCss(['lift', 'lift-chip', 'lift-card'])).not.toContain(null);
    expect(design.candidatesToCss(['bg-darkestblue', 'text-h1', 'xs:text-base'])).not.toContain(
      null,
    );
  });

  it('reports the confusable prefixes that #143 found as dead', async () => {
    const design = await loadDesignSystem();

    // Right token, wrong utility namespace — `--font-body` exists, `--text-body` does not.
    expect(design.candidatesToCss(['text-bold', 'text-regular', 'text-body', 'text-md'])).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});

/**
 * `--container-shell` / `-content` / `-form` are the site's three page widths (#146). Before
 * them every section picked its own — six widths in two notations, so the content column
 * jumped inward between routes while the header and footer stayed put. Nothing stops a
 * seventh from appearing: `max-w-5xl` and `max-w-[1100px]` both compile, so the suite above
 * has nothing to say about them.
 *
 * The rule this pins is only about *page* widths. A `max-w-*` small enough to be a component
 * (`max-w-12.25` on the footer wordmark) is not a container and is left alone; the cut is at
 * 24rem, above which a max-width is constraining a column of content rather than sizing a box.
 */
const CONTAINER_TOKENS = new Set(['max-w-shell', 'max-w-content', 'max-w-form']);

/** Tailwind's named container scale — `max-w-md`, `max-w-5xl`, `max-w-prose`, … */
const NAMED_CONTAINER_STEP = /^(?:[3-7]?xs|sm|md|lg|[2-7]?xl|prose)$/;

/** 24rem in Tailwind spacing steps: `max-w-96` is 384px, the narrowest width we call a column. */
const PAGE_WIDTH_FLOOR = 96;

function isRawPageWidth(token: string): boolean {
  const value = token.slice('max-w-'.length);
  if (NAMED_CONTAINER_STEP.test(value)) return true;
  // A one-off `max-w-[1100px]`: the exact shape a converted inline style comes back as.
  if (value.startsWith('[')) return true;
  const steps = Number(value);
  return Number.isFinite(steps) && steps >= PAGE_WIDTH_FLOOR;
}

describe('page containers come from the container tokens', () => {
  it('has no section that picks its own page width', () => {
    const raw: string[] = [];

    for (const file of sourceFiles(SRC)) {
      for (const literal of stringLiterals(file)) {
        for (const token of literal.split(/\s+/).filter(Boolean)) {
          // `md:max-w-content` is the same decision as the unprefixed one.
          const utility = token.slice(token.lastIndexOf(':') + 1);
          if (!utility.startsWith('max-w-') || CONTAINER_TOKENS.has(utility)) continue;
          if (isRawPageWidth(utility)) raw.push(`${relative(REPO_ROOT, file)}: ${token}`);
        }
      }
    }

    expect(raw).toEqual([]);
  });

  it('knows which widths it is looking for, so the check is not vacuous', () => {
    expect(
      ['max-w-5xl', 'max-w-md', 'max-w-200', 'max-w-[1100px]'].filter(isRawPageWidth),
    ).toHaveLength(4);
    // Component-sized, not a container: the footer wordmark's 49px box.
    expect(isRawPageWidth('max-w-12.25')).toBe(false);
  });
});
