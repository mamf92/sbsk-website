---
name: sbsk-component
description: Add or change a shared UI component in the SBSK design system. Use when creating a reusable primitive in src/components/ui/, changing an existing one such as Button, adding an icon, adding a Tailwind theme token, or lifting markup that is currently inlined in a section into a shared component. Also use when porting a component from the Claude Design library.
---

# Adding or changing a UI component

`src/components/ui/` is the design system. Anything reused across more than one section
belongs there. Sections in `src/components/sections/` compose these primitives; they should
not define their own button, input or card styling.

## Before writing anything

1. Read the existing component if you are changing one. `Buttons.tsx` is the reference for
   how a primitive is structured here.
2. Check whether the styling you need already exists as a token in the `@theme` block of
   `src/index.css`. If a colour is not there, add it as a token rather than hardcoding a hex
   value in a class.

## Structure of a primitive

Follow the shape `Buttons.tsx` already uses:

```tsx
type FooProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
};

const base = '...classes shared by every variant...';
const variants = { primary: '...', secondary: '...' } as const;
const sizes = { sm: '...', md: '...' } as const;

export const Foo = React.forwardRef<HTMLButtonElement, FooProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={[base, variants[variant], sizes[size], className].join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
);

Foo.displayName = 'Foo';
```

Non-negotiables:

- **Extend the native props type** so callers can pass `type`, `aria-label`, `onClick` and
  the rest without new props being invented for each one.
- **Spread `...props`** onto the element.
- **Accept and merge `className`** — appended last so callers can override.
- **Forward the ref**, and set `displayName`.
- **Variants and sizes as `as const` lookup objects**, not conditionals inside JSX.

## Styling rules

- Tailwind v4. There is no `tailwind.config.js` and adding one will not work — tokens live in
  the `@theme` block of `src/index.css`.
- Use theme tokens: `bg-darkblue`, `text-orange`, `font-heading`, `font-body`. Never a raw hex.
- Dark mode is the `dark:` variant, driven by a class on `<html>`. Style both modes. Never
  toggle the class yourself; `src/utils/theme.ts` owns that.
- Watch for missing spaces when concatenating class strings. `w-5fill-current` silently
  produced no styling and shipped unnoticed — the Button tests now guard it.

## Icons

Do not add an inline `<svg>` and do not add a new prop per icon.

1. Drop the SVG into `src/assets/icons/arrows/` or `src/assets/icons/symbols/`.
2. Import it with the SVGR suffix: `import Add from '../../assets/icons/symbols/add.svg?react'`.
3. Add it to the component's icon map and to the `icon` union type.

Callers then pass `icon="add"`.

## Norwegian copy

All user-facing text is Norwegian. Props, component names, comments and commit messages are
English. Do not translate a route slug or a label to English "for clarity".

## Tests

Every component in `src/components/ui/` needs a test file beside it. Pin the _contract_, not
the class strings — the classes change when the design system is re-themed, the contract
must not:

- renders children, reachable by role
- forwards clicks and arbitrary native attributes
- each variant and each size produces a distinct class list
- caller `className` survives
- ref reaches the DOM node

`Buttons.test.tsx` is the model. Copy its shape.

## Porting from the Claude Design library

One component per change, never a bulk sweep.

1. Reconcile tokens first — add whatever colours, spacing or radii the component needs to
   `@theme`, keeping existing token names working so nothing breaks at once.
2. Port the component into `src/components/ui/` in the structure above. It is a rewrite into
   this codebase's conventions, not a copy-paste.
3. Write the contract tests before migrating consumers.
4. Migrate consumers smallest-first.

## Verify

```bash
npm run lint
npm run test
npm run build
```
