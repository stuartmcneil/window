# stuartmcneil.github.io

A single-photograph home page. The front page is the windowsill above my desk in Cardiff —
no headings, no nav bar. The objects on the sill are the navigation.

## How it works

Everything lives in `index.html`: one photo, one stylesheet, one script, no dependencies,
no tracking. The photograph is set inside a thick white mount, like a framed print, on a
dark blurred ground. Hotspots are invisible buttons measured from the photograph's own
top-left corner, so they stay locked to their objects however the print is sized.

- Nothing is visible at rest — no markers, no hints, no chrome.
- Hovering (or keyboard-focusing) an object shows its name. No glow, no outline — the label is the only tell.
- Clicking opens a panel. `Esc` or a click outside closes it.
- Deep links work: `/#contact`, `/#music`, and so on. An object with an `href` follows its link instead of opening a panel.
- An **Index** caption sits small and white in the photograph's bottom-right corner. Since
  hovering is the only way in, touch devices and screen readers need it — it lists every
  live object. Delete the `#menuBtn` markup if you would rather the page gave nothing away
  at all.

Keyboard: `Tab` cycles the hotspots · `E` toggles edit mode.

## Editing the hotspots

Open `index.html` and find the `SPOTS` array near the top of the `<script>`.

```js
{ id:'writing', object:'Pen and stylus on the sill', label:'Writing',
  points:[[475,558],[715,608],[715,642],[475,592]],
  kicker:'Notes and longer pieces', title:'Writing',
  body:`<ul> … </ul>` },
```

Coordinates are **pixels of the original photograph** (1919 × 1081), so you can read them
straight off the image in any editor.

| field | meaning |
|---|---|
| `id` | used for the deep link, `/#contact` |
| `object` | the subtitle shown under the name in the index, and the screen-reader description. Leave it identical to `label` and no subtitle is shown |
| `label` | the word shown on hover |
| `points` | the object's outline, `[[x,y], …]` — the clickable area is the polygon itself, not its bounding box. Use this for anything tilted, angled or irregular (the pen, the tin, the canvas) |
| `rect` | `[x,y,w,h]`, for genuinely rectangular targets |
| `kicker` `title` `body` | the panel's contents; `body` is raw HTML |
| `href` | set this instead of `body` to link straight out. A link to somewhere on this same site opens in the current tab; anything off-site opens in a new one |
| `target:null` | dormant — not hoverable, not clickable |

### What is live

| object | goes to |
|---|---|
| Canvas of the woman at a laptop | CV at `/cv/` — *An interactive display of my career* |
| Small white frame | The McNeil Family Tree at `/family-tree/` |
| Far-left frame | Nate's Film Catalogue at `/films/` — *Nate as a baby* |
| Second frame from the left | Izzie's Coffee Shops at `/izzies-coffee/` |
| iPad on the desk | Books — Goodreads *(new tab)* |
| Pen and stylus on the sill | Writing — Overleaf *(new tab)* |
| USB drive on the sill | GitHub — @stuartmcneil *(new tab)* |
| Upright headphone jack | Music — a panel: Discogs collection, Spotify playlist |
| Red toy car | Cars *(panel, placeholder)* |
| Handmade wooden table | Making *(panel, placeholder)* |
| The window itself | Colophon *(panel)* |

Everything on this site opens in the current tab; everything off it opens in a new one.
Four objects still open a panel: Music, Cars, Making and the window.

Eight objects are catalogued but dormant at the bottom of the array — the pilea plant, the
playing-card tin, the sailboat painting, the bicycle card, the jade plant, the flowering
cactus, the carved coaster and the cork trivet. Their outlines are already measured; give
one a `label` and a `body` and it wakes up.

A panel can link to another panel rather than reloading the page — give the anchor a
`data-jump="<id>"` attribute, as in `<a href="#music" data-jump="music">`. Nothing uses it
at the moment: the frames that would have needed it each point at a site of their own.

**To find coordinates for a new object:** load the page, press `E`, then drag a box around
the object. A `rect:` and a four-point `points:` line appear bottom-left in photo pixels,
ready to paste. For an angled object, drag a rough box, paste the `points:` line, then move
the four corners onto the object — order them clockwise.

## Running it locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## The mount

Two numbers in `fit()` control the framing, both derived from the smaller side of the window:

```js
const gap    = clamp(10, min * 0.035, 56);   // dark ground around the mount
const border = clamp(16, min * 0.048, 62);   // the white mount itself
```

Raise `border` for a heavier mount, raise `gap` for a smaller print. The photograph is
always shown whole — it is never cropped to fill the window.

## Photograph

`desk.jpg` (1919 × 1081) with a `desk.webp` served first where supported.
Replacing the photo means re-measuring the hotspots — press `E` and drag. If the replacement
is a different size, update `NAT_W` / `NAT_H` in the script to match.
