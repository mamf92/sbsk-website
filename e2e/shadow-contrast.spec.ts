import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * #139: the hard offset shadow behind `lift` / `lift-chip` / `lift-card` is only a lift if it
 * contrasts with the fill it is painted onto. That is invisible to jsdom — it needs the real
 * cascade, a real `getComputedStyle` and a real ancestor chain — so it lives here.
 *
 * The check walks every lifting element on a route, resolves the `--hard-shadow-color` it would
 * paint and the nearest opaque background behind it, and requires 3:1 between them (WCAG 1.4.11,
 * non-text contrast). Before the fix, 17 of 19 lifting elements on the front page failed in dark
 * mode and the `nyheter` card panel was an exact 1:1 colour match in both themes.
 */

const MINIMUM_CONTRAST = 3;

/* -------------------------------------------------------------------------- */
/* Content fixtures                                                            */
/* -------------------------------------------------------------------------- */

// Cards and chips only exist when there is content, and the smoke suite's empty stub would make
// this spec pass by finding almost nothing. These fixtures cover every category so that every
// `Card` panel fill and every `CATEGORY_STYLES` entry gets measured. No `image` field anywhere:
// an image URL would send the page to cdn.sanity.io, and the components fall back to a local
// asset without one.
const richText = (text: string) => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text, marks: [] }],
  },
];

const POSTS = (['nyheter', 'spillkveldrapporter', 'arrangementer'] as const).map(
  (category, index) => ({
    _id: `post-${category}`,
    title: `Innlegg ${category}`,
    subtitle: 'Undertittel',
    slug: { current: `innlegg-${category}` },
    publishedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    category,
    // Links become `Button`s inside the open panel — the exact element that was casting a
    // darkestblue shadow onto a darkestblue `nyheter` panel.
    links: [{ label: 'Les mer', url: 'https://example.com/les-mer' }],
    content: richText('Brødtekst i innlegget.'),
  }),
);

const EVENTS = (['spillkveld', 'turnering', 'annet'] as const).map((category, index) => {
  const start = new Date(Date.now() + (index + 1) * 86_400_000);
  return {
    _id: `event-${category}`,
    title: `Arrangement ${category}`,
    category,
    eventStartTime: start.toISOString(),
    eventEndTime: new Date(start.getTime() + 3 * 3_600_000).toISOString(),
    location: 'Klubblokalet',
    slug: { current: `arrangement-${category}` },
    content: richText('Beskrivelse av arrangementet.'),
    participants: [],
  };
});

/**
 * The Sanity client sends the GROQ query in the query string, or in the body once it grows past
 * the URL limit, so both are inspected. Matching on a fragment of each query rather than on the
 * whole string means a formatting change in a query helper does not silently drop the fixture
 * and leave the spec measuring an empty page.
 */
async function stubSanity(page: Page) {
  const fulfil = (route: Route, result: unknown) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result }),
    });

  await page.route('**://*.sanity.io/**', (route) => {
    const query = decodeURIComponent(
      new URL(route.request().url()).searchParams.get('query') ?? route.request().postData() ?? '',
    );

    if (query.includes('_type == "post"')) return fulfil(route, POSTS);
    if (query.includes('_type == "event"')) return fulfil(route, EVENTS);
    if (query.includes('homeHero') || query.includes('postsHero') || query.includes('calendarHero'))
      return fulfil(route, null);
    return fulfil(route, []);
  });

  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

/**
 * A calendar card's panel is `hidden` while collapsed and a news card's is zero-height and
 * `inert`, so the buttons that sit on the panel fill — the 1:1 `nyheter` case — are only worth
 * measuring once every card is open. Scoped to `#main` so the header's own disclosures are left
 * alone, and re-queried each round because opening a card re-renders the list.
 */
async function expandEverything(page: Page) {
  // `:not([aria-haspopup])` excludes the sort `Dropdown`'s trigger (#203) — it also carries
  // `aria-expanded`/`aria-controls` while closed, a legitimate ARIA combination for a listbox
  // button, but clicking it here would open the sort panel over the cards this loop still needs
  // to reach rather than expand another card.
  const collapsed = page.locator(
    '#main [aria-expanded="false"][aria-controls]:not([aria-haspopup])',
  );
  for (let round = 0; round < 20; round += 1) {
    if ((await collapsed.count()) === 0) return;
    await collapsed.first().click({ timeout: 5_000 });
  }
}

/* -------------------------------------------------------------------------- */
/* Measurement                                                                 */
/* -------------------------------------------------------------------------- */

type Measurement = {
  element: string;
  shadow: string;
  surface: string;
  ratio: number;
};

/**
 * Runs in the page. Kept as one string-serialised function because it needs the live cascade.
 */
async function measureLiftingElements(page: Page): Promise<Measurement[]> {
  return page.evaluate(() => {
    // Every computed colour goes through a 1×1 canvas rather than a regex. Tailwind's `/50`
    // opacity modifier compiles to `color-mix(…)`, which Chrome computes to
    // `color(srgb 1 1 1 / 0.5)` — 0–1 floats that a channel regex reads as near-black, so
    // `bg-white/50` measured as grey and the hero scrim came out four stops darker than it is.
    // The canvas accepts any CSS colour syntax and hands back un-premultiplied 0–255 bytes.
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;

    const parse = (color: string): [number, number, number, number] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };

    // Alpha fills stack rather than resolve, so a translucent scrim is composited over whatever
    // is behind it until an opaque layer is reached. A photographic backdrop (the hero) is
    // therefore approximated by its scrim over the page fill, which is the best any static
    // measurement can do and is the value the scrim was chosen against anyway.
    const surfaceBehind = (element: Element): string => {
      const layers: [number, number, number, number][] = [];
      let node: Element | null = element.parentElement;
      while (node) {
        const [r, g, b, a] = parse(getComputedStyle(node).backgroundColor);
        if (a > 0) {
          layers.push([r, g, b, a]);
          if (a === 1) break;
        }
        node = node.parentElement;
      }
      // Nothing opaque on the way up means the page's own canvas.
      layers.push(parse(getComputedStyle(document.documentElement).backgroundColor));
      layers.push([255, 255, 255, 1]);

      let [r, g, b] = layers[layers.length - 1];
      for (let index = layers.length - 2; index >= 0; index -= 1) {
        const [sr, sg, sb, sa] = layers[index];
        r = sr * sa + r * (1 - sa);
        g = sg * sa + g * (1 - sa);
        b = sb * sa + b * (1 - sa);
      }
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    // `--hard-shadow-color` holds a `var()` reference on purpose, so it is read through a probe
    // child rather than off the custom property: assigning it to `color` makes the browser
    // resolve the chain and hand back an rgb triple.
    const shadowColorOf = (element: Element): string => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--hard-shadow-color)';
      probe.style.display = 'none';
      element.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };

    const luminance = (color: string) => {
      const [r, g, b] = parse(color).map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const contrast = (a: string, b: string) => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (high + 0.05) / (low + 0.05);
    };

    const describe = (element: Element) => {
      const classes = Array.from(element.classList).filter((name) => name.startsWith('lift'));
      const label = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${element.tagName.toLowerCase()}.${classes.join('.')}${label ? ` "${label}"` : ''}`;
    };

    return Array.from(document.querySelectorAll('.lift, .lift-chip, .lift-card'))
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => {
        const shadow = shadowColorOf(element);
        const surface = surfaceBehind(element);
        return {
          element: describe(element),
          shadow,
          surface,
          ratio: Math.round(contrast(shadow, surface) * 100) / 100,
        };
      });
  });
}

/* -------------------------------------------------------------------------- */
/* Spec                                                                        */
/* -------------------------------------------------------------------------- */

// The front page carries the widest mix (hero buttons, the header toggle, the filter and sort
// chips, and one card per post category); the calendar adds `lift-card` on all three
// `CATEGORY_STYLES` fills; the login panel is the `bg-darkblue` panel case in light mode.
// `/våre-spill` adds `GameCard`'s own `lift-card` and its buy button's `lift`, neither of which
// shares a fill with anything already covered above. An empty games query still measures these:
// `OurGamesSection` renders its bundled fallback collection whenever Sanity has none, so this
// needs no fixture of its own.
const ROUTES = ['/', '/kalender', '/login', '/arrangementer', '/våre-spill'];

for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`${theme} mode: every lift shadow on ${route} clears ${MINIMUM_CONTRAST}:1`, async ({
      page,
    }) => {
      await stubSanity(page);
      await page.addInitScript(
        (preference) => window.localStorage.setItem('theme-preference', preference),
        theme,
      );

      await page.goto(route);
      await expect(page.locator('#main')).not.toBeEmpty();
      await expandEverything(page);

      const measurements = await measureLiftingElements(page);

      const failures = measurements.filter(({ ratio }) => ratio < MINIMUM_CONTRAST);
      expect(
        failures,
        failures
          .map(
            ({ element, ratio, shadow, surface }) =>
              `${ratio}:1  ${shadow} on ${surface}  ${element}`,
          )
          .join('\n'),
      ).toEqual([]);
    });
  }
}

test('the front page really does carry lifting elements to measure', async ({ page }) => {
  await stubSanity(page);
  await page.goto('/');
  await expect(page.locator('#main')).not.toBeEmpty();

  // Without this the contrast tests would pass on an empty page. The count is a floor, not a
  // pin: the header toggle, the burger, two hero buttons, seven chips and three cards.
  await expect(page.locator('.lift, .lift-chip, .lift-card')).not.toHaveCount(0);
  const measurements = await measureLiftingElements(page);
  expect(measurements.length).toBeGreaterThanOrEqual(10);
});
