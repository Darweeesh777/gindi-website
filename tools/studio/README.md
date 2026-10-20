# Design Studio — room preparation tools

These tools turn a supplied room image into the files the Design Studio
compositor needs (`static/studio/rooms/<style>/`). They are offline tools for
whoever maintains the site; nothing here runs on the website.

## Requirements

- The project's Python (`.venv`), standard library only, with Django settings
  available (the `sheet`, `combos` and `build` commands read `apps/core/studio.py`).
- Google Chrome (headless). Default path
  `C:\Program Files\Google\Chrome\Application\chrome.exe`; set `CHROME` to use another.
- Internet the first time `sam` runs: it downloads transformers.js 3.0.2 (jsDelivr) and
  the Segment Anything model `Xenova/sam-vit-base` (Hugging Face, about 360 MB). Both are
  cached in `tools/studio/work/.chrome-profile/`. Nothing else is installed. The image is
  processed locally in the browser; it is not uploaded anywhere.
- `fetch_scan.py` downloads stone scans from ambientCG (CC0).

Working files go to `tools/studio/work/<style>/` (ignored by git). The room's
recipe — every prompt point, rule and calibration area — is
`tools/studio/rooms/<style>.json` (kept in the repository, so a room can be rebuilt).

## Replacing or adding a room image — the steps

Commands are run from the repository root:
`.venv/Scripts/python.exe tools/studio/studio_tool.py <command> <style> ...`

1. **init** `<style> <image.png>` — copies the image into the work folder.
2. **grid** `<style> x y w h [scale] [step]` — coordinate grids, to read the pixel
   positions of the sofa, chairs, table, wood, cushions and objects.
3. Write the `sam` prompts in `rooms/<style>.json`: one entry per object, a few points
   inside it (`[x, y]`) and, if needed, points to exclude (`[x, y, 0]`). Use
   `"pick": "all"` to get SAM's three candidates and choose the right one.
4. **sam** `<style> [names...]` — runs the prompts (all, or the named ones).
   **masks** `<style> sam/a.png,sam/b.png [x y w h scale]` shows candidates side by side.
5. Write the `recipe`: which object masks form each slot — `upholstery` (red),
   `stone` (green), the third control `wood` (blue) — minus cushions, throws, plants and
   table objects; colour rules (`classes`) separate exposed wood or gilding from fabric
   inside an object; `zones` mark a second upholstery zone (`upholstery2`) and the stone's
   curved side / base (`stone_side`, `stone_base`). The expression language is described
   at the top of `js/compose.js`. **js/probe.js** reports colour values at points (useful
   for colour rules).
6. **compose** `<style>` — writes the slot masks plus `overlay.jpg` and close-up `crop*.jpg`
   (photo above, overlay below). Inspect them at zoom; repeat 3–6 until the edges are clean.
7. **prep** `<style>` — writes `mask.png`, `light.png`, `zone.png` and prints the calibration
   figures: each surface's mean colour (and two-colour split for patterned fabric), the
   stone's mean brightness and the stone parts' bounding boxes.
8. In `apps/core/studio.py`, add or update the style: size, `controls` (names and the
   surfaces they affect, EN/AR), `render` (zone reference colours from step 7, the stone
   parts' geometry — a plane for a flat top, `curve` for a rounded side or pedestal — and
   exposure), and the options and presets. Stone options need a scan: `fetch_scan.py`.
9. **sheet** `<style>` — renders every option (and `sheet_crops` close-ups) with the site's
   own compositor; **combos** `<style> name=u,s,w ...` renders chosen combinations at full
   size (indices; 0 = the image itself). Adjust colours or calibration and repeat.
10. **build** `<style>` — writes `static/studio/rooms/<style>/`: `photo.webp`, `card.webp`,
    `light.webp`, `mask.png`, `zone.png`, the swatches (`swatch` areas in the room file)
    and the quiz crops (`quiz`).
11. Run the tests (`manage.py test apps.core`) and check the page: the default must equal
    the image, and each option must change only its own surfaces.

## Effort

A similar room with the tools as they are: about 2–4 hours, mostly steps 3–6 (clean
edges around carving, legs, cushions and objects take the most attempts). A room with a
new kind of surface (a new zone or finish type) may need compositor or catalogue changes.

## What makes an image easy to prepare

Separate, clearly visible pieces; a stone surface not mostly covered by objects; exposed
wood or gilding that contrasts with the fabric; even, soft lighting without strong
coloured light on the furniture; landscape, about 1500–2000 px wide, sharp.

## Files

| File | |
|---|---|
| `studio_tool.py` | the commands above |
| `fetch_scan.py` | adds an ambientCG stone scan to `static/studio/materials/<asset>/` |
| `cdp.py` | local file server + headless Chrome driver (standard library) |
| `page.html` | the blank page the browser tools run in |
| `js/sam.js` | Segment Anything prompts → object masks |
| `js/compose.js` | recipe → slot masks, zones, overlay, review crops |
| `js/prep.js` | slot masks → `mask.png`, `light.png`, `zone.png`, calibration figures |
| `js/render.js` | option sheets, combinations and the site files, rendered with `static/studio/compositor.js` |
| `js/inspect.js`, `js/probe.js`, `js/hues.js`, `js/contact.js` | review helpers |
| `js/scan.js`, `js/lib.js` | scan conversion; shared helpers |
| `rooms/<style>.json` | each room's prompts, recipe, review areas, swatch and quiz crops |
