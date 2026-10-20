# GINDI Design Studio — assets

The studio page (`/design-studio/`) shows three fixed concept images supplied by
the studio — **Classic / كلاسيك**, **Modern / مودرن**, **Organic Modern / مودرن عضوي** —
and changes their materials in place. The catalogue (controls, options, names,
presets, calibration, the guide's questions) is `apps/core/studio.py`. The images are
**AI-generated concept visuals**, not photographs of completed GINDI projects; the page,
the guide and the saved board say so. To prepare a new image: `tools/studio/README.md`.

## How it works

- `compositor.js` — WebGL 2. Draws the style's image at its own size and changes pixels
  only inside the prepared masks. Every control's first option is "as shown in the
  image": the default view and Reset are the supplied image exactly (checked pixel for pixel).
- `studio-page.js` — style cards, panels, address, presets, Reset, full-image view,
  Save design board, the guide.

| Change | How | Kept from the image |
|---|---|---|
| Stone | A real ambientCG scan (CC0) replaces the stone. A flat top is mapped in perspective through its own plane; curved sides and pedestals are wrapped around their curve, continuing from the top, at a real-world scale. | The light on each stone part, broad reflections, the edge's shading |
| Fabric | A new colour. Patterned fabric is two-tone: its ground and motif colours map to two new colours, so the damask or weave pattern stays. | Weave, pattern, folds, seams, tufting, highlights, contact shadows |
| Wood | A new tone. | Grain direction, joints, edges, shading, highlights |
| Gilded finish | A new metal colour (highlights take it too); one wood tone. | The carving and its relief |

A recoloured surface keeps its texture and finish, so options are named by colour; no
option converts a fabric into another fabric type or leather, or matte into gloss.

## Rooms (`rooms/<style>/`)

| File | |
|---|---|
| `photo.webp` | the supplied image (WebP, quality 95), 1536 × 1024 |
| `card.webp` | reduced copy (style cards, homepage) |
| `mask.png` | R = upholstery control, G = stone, B = third control; soft edges, one control per pixel |
| `light.webp` | local brightness of each surface, blurred within the surface |
| `zone.png` | R = second upholstery zone / stone part, G = stone rim, B = fine stone brightness |
| `swatches/` | each option's swatch, cropped from the image rendered with that option |
| `quiz-*.webp` | details used by the "Discover your style" questions |

| Style | Source image | Controls (surfaces) |
|---|---|---|
| Classic | ChatGPT Image Oct 19, 2026, 07_23_06 PM.png | Upholstery (sofa + armchairs, two-tone patterns) · Stone (coffee-table and side-table tops) · Furniture finish (carved, gilded frames) |
| Modern | ChatGPT Image Oct 19, 2026, 07_23_12 PM.png | Upholstery (sofa + cream armchair; olive armchair) · Stone (table top, rounded edge, pedestal) · Wood (armchair frames, side table, console) |
| Organic Modern | ChatGPT Image Oct 19, 2026, 07_22_59 PM.png | Sofa · Accent chairs (no exposed wood in this room) · Stone (table top and rounded sides) |

## Stone scans (`materials/<asset>/`)

`color.webp` (2048 px, tiles seamlessly) and `swatch.webp`, from [ambientCG](https://ambientcg.com) (CC0):

| Folder | Used as |
|---|---|
| `marble020` | Classic: Warm Cream Marble |
| `marble019` | Classic: White Marble, Grey Veins |
| `marble014` | Classic: Warm Beige Marble |
| `marble001` | Modern: Soft White Marble |
| `marble024` | Modern: Honed Grey Stone |
| `marble011` | Modern: Charcoal Marble |
| `travertine009` | Organic Modern: Cream Travertine |
| `marble004` | Organic Modern: Warm White Marble |
| `marble025` | Organic Modern: Pale Greige Stone |

ambientCG has no true limestone slab scans; the "grey limestone" and "pale greige
limestone" of the brief are offered as a honed grey marble and a pale greige marble,
named "stone" rather than "limestone".
