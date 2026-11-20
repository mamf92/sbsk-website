# Image and poster design language

How the club's AI-made images and posters look, and how to get them without the usual AI
flaws. The admin page (`/styreportal`, «Plakat-prompt») builds the prompt below from the event's
title, date, time and place and copies it, so the board pastes it into their own AI tool and gets
a finished poster back. The site never calls an AI API.
The prompt lives in `src/utils/posterPrompt.ts`; keep it and this file in step.

## The look

- **Palette (only these):** deep navy `#002F5F` (background, about 60%), darkest navy `#031F3B`
  (shadows), warm orange `#F29D35` (accent), dark orange `#CB7925` (secondary accent), cream
  `#FAF3E4` (highlights). Same tokens as `src/index.css`.
- **Style:** flat vector-like illustration with a soft paper texture. Chunky wooden game pieces
  (meeples, hexagonal tiles, cards). Soft light from the upper left, gentle shadows, no glow.
- **Composition:** one focal object, two or three simple shapes overlapping it, a straight-on
  or slightly elevated view, and plain navy space left free for the poster text.
- **Poster text is part of the image.** The prompt gives the exact title, date, time and place
  in quotes and asks for sharp, correctly spelled Norwegian (æ, ø, å): title largest in cream,
  date and time in orange, place smaller in cream, nothing else. Still no logos, watermark,
  people or faces, and no invented text. Check the spelling of every word on the result; if the
  tool garbles it, regenerate, or overlay the text yourself (BGM banners use `bgm/bgm.py`).
  Artwork-only images (site heroes such as the calendar default) remain text-free.
- **Aspect ratios:** 2:1 (2048x1024) for site heroes such as the calendar; 16:9 for events and
  Facebook cover; 3:2 for general use; 4:5 or 9:16 for portrait posters and stories. Ask for the
  ratio in the prompt and check the tool's size setting too.

## The house prompt

The builder writes the instruction to design a finished poster, the exact text lines (`Title:`,
`Date:`, `Time:`, `Place:`, empty ones left out), then the style, the typography rules and the
format (portrait A-format 2:3, or landscape 16:9/3:2):

> Flat vector-style illustration with a soft paper-like texture, calm and uncluttered. Palette strictly limited to deep navy #002F5F (background, about 60%), darkest navy #031F3B (shadows), warm orange #F29D35 (accent), dark orange #CB7925 (secondary accent) and cream #FAF3E4 (highlights). No other colours. Soft light from the upper left, gentle shadows, no glow, no gradients beyond subtle shading. Straight-on or slightly elevated view, ONE clear focal object, two or three simple supporting shapes that overlap it, . Wooden board game pieces (meeples, hexagonal tiles, cards) in simple chunky shapes. No logos, no people, no faces, no watermark. Avoid: dice, boxes of games, horizon lines or landscapes, rows of identical meeples, more than five objects, tiny details.

## Avoid, and how to prompt around it

| Flaw                             | Why it happens                              | What to do                                                                       |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Wobbly or shifting horizon lines | The model draws far-away edges badly        | No landscapes or rooms. Plain navy background, or a flat table seen from above   |
| Dice                             | Pips, edges and perspective come out wrong  | Never ask for dice; the prompt bans them. Use hexagonal tiles or cards instead   |
| Boxes of games                   | Box art becomes garbled fake text and logos | Ban boxes. Show pieces, never packaging                                          |
| Meeples in a row or crowd        | Copies drift: wrong limbs, merged bodies    | One meeple, or two overlapping. Never "many" or "lots of"                        |
| Too many objects                 | Details degrade as the count rises          | At most five objects. Name the focal one first                                   |
| Garbled text, numbers, logos     | Image models can misspell                   | Give exact strings in quotes, ban any other text and logos, proofread the result |
| Faces and hands                  | Uncanny results                             | Ban people. Gingerbread or meeples are fine                                      |

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
