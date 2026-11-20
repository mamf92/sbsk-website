# Image and poster design language

How the club's AI-made images and posters look, and how to get them without the usual AI
flaws. The admin page (`/styreportal`, «Plakat-prompt») builds the prompt below from one line
and copies it, so the board pastes it into their own AI tool. The site never calls an AI API.
The prompt lives in `src/utils/posterPrompt.ts`; keep it and this file in step.

## The look

- **Palette (only these):** deep navy `#002F5F` (background, about 60%), darkest navy `#031F3B`
  (shadows), warm orange `#F29D35` (accent), dark orange `#CB7925` (secondary accent), cream
  `#FAF3E4` (highlights). Same tokens as `src/index.css`.
- **Style:** flat vector-like illustration with a soft paper texture. Chunky wooden game pieces
  (meeples, hexagonal tiles, cards). Soft light from the upper left, gentle shadows, no glow.
- **Composition:** one focal object, two or three simple shapes overlapping it, a straight-on
  or slightly elevated view, and at least a third of the frame left as empty navy for text.
- **No text in the image.** AI tools garble letters. Add title, date and logo afterwards in
  Canva, Figma or similar (the BGM banners do it with `bgm/bgm.py`).
- **Aspect ratios:** 2:1 (2048x1024) for site heroes such as the calendar; 16:9 for events and
  Facebook cover; 3:2 for general use; 4:5 or 9:16 for portrait posters and stories. Ask for the
  ratio in the prompt and check the tool's size setting too.

## The house prompt

The builder writes `Poster artwork for: <your line>.` then this, then the ratio:

> Flat vector-style illustration with a soft paper-like texture, calm and uncluttered. Palette strictly limited to deep navy #002F5F (background, about 60%), darkest navy #031F3B (shadows), warm orange #F29D35 (accent), dark orange #CB7925 (secondary accent) and cream #FAF3E4 (highlights). No other colours. Soft light from the upper left, gentle shadows, no glow, no gradients beyond subtle shading. Straight-on or slightly elevated view, ONE clear focal object, two or three simple supporting shapes that overlap it, and generous empty navy space (at least a third of the frame) where text can be added later. Wooden board game pieces (meeples, hexagonal tiles, cards) in simple chunky shapes. No text, no letters, no numbers, no logos, no people, no faces, no watermark. Avoid: dice, boxes of games, horizon lines or landscapes, rows of identical meeples, more than five objects, tiny details.

## Avoid, and how to prompt around it

| Flaw                             | Why it happens                              | What to do                                                                     |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| Wobbly or shifting horizon lines | The model draws far-away edges badly        | No landscapes or rooms. Plain navy background, or a flat table seen from above |
| Dice                             | Pips, edges and perspective come out wrong  | Never ask for dice; the prompt bans them. Use hexagonal tiles or cards instead |
| Boxes of games                   | Box art becomes garbled fake text and logos | Ban boxes. Show pieces, never packaging                                        |
| Meeples in a row or crowd        | Copies drift: wrong limbs, merged bodies    | One meeple, or two overlapping. Never "many" or "lots of"                      |
| Too many objects                 | Details degrade as the count rises          | At most five objects. Name the focal one first                                 |
| Garbled text, numbers, logos     | Image models cannot spell                   | Ban all text. Add it afterwards                                                |
| Faces and hands                  | Uncanny results                             | Ban people. Gingerbread or meeples are fine                                    |

Other tricks that work: overlap objects instead of placing them side by side; keep pieces
large and few; say "straight-on" or "slightly elevated"; if a result is almost right, change one
thing in the next prompt rather than rewriting it.

## Examples

Made with the prompt above (project files `image-style/`):

- `calendar-default.webp`: the calendar page's default hero (`src/assets/images/`).
- `sample-julespillkveld.png`: «Julespillkveld med pepperkaker».
- `sample-turnering.png`: «Turnering i Catan, premie til vinneren».

Older examples with a busier style: `examples-events/` in the project files.

## Where the default calendar image applies

`CalendarSection.tsx` shows `calendar-default.webp` when the Sanity `calendarHero` document has
no image. If an editor uploads an image in Studio («Kalender» hero), that image wins; remove it
to get the default back.
