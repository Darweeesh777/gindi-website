# Gindi Innovations — Brand Guidelines (extracted)

This document records what the supplied brand guide actually specifies.
It does not add rules of its own. Where the guide is silent, that is
stated explicitly under "Not documented".

**Source:** `logo/Gindi-Innovations-Brand-Guide.svg` (a single 1600×1100 SVG
sheet titled "Logo Elements & Color Palette").

> **Updated 2026-10-14.** The files in `logo/` were replaced after the
> initial project setup. An earlier version of this document described a
> different palette (`#f2e9dd`, `#d3aa67`, `#e0c28b`) and a serif monogram;
> those values are obsolete.

## Supplied assets

The originals in `logo/` must not be edited, recoloured, cropped, renamed or
re-exported in place. Web-ready derivatives live in `static/images/brand/`.

| File | Format | Size | Transparency | Contents |
|---|---|---|---|---|
| `Gindi-Innovations-Brand-Guide.svg` | SVG | 1600×1100 | n/a | Brand guide sheet; embeds the full logo on navy `#1C2C4A` |
| `Gindi Innovations — Navy & Gold Logo.png` | PNG, 8-bit RGB | 584×633 | None (opaque) | Full logo on **solid white** (see limitations) |
| `Gindi-Logo-Elements.png` | PNG, 8-bit RGB | 1600×1050 | None (opaque) | Reference sheet showing each element separately |

SHA-256 (2026-10-14):

```
060744A6A57C4F1F42BF485B5E210DC92ADD929656AA4EF337629909FE9349BB  Gindi Innovations — Navy & Gold Logo.png
ADEE82C71A0CF9C007C8EEB57898E25C668F4F6CD8A30C95EF0A41281555795D  Gindi-Innovations-Brand-Guide.svg
36E3B0375AF8F129A24DBE2C432C5179D2D398CA55C4B88748486C5B226FF755  Gindi-Logo-Elements.png
```

## Colour palette

| Name | HEX | Role (as documented) | Suggested share |
|---|---|---|---|
| Navy | `#1C2C4A` | Primary background and large surfaces | 65% |
| Golden Ochre | `#C8892B` | Primary emblem and brand accents | 20% |
| Warm Ivory | `#F4F1EC` | Wordmark and soft neutral details | 10% |
| Bright Gold | `#FFCA36` | Tagline and small highlights | 5% |

- The percentages are **suggested, not mandatory**: *"Percentages are
  suggested for brand materials; they are not a measured breakdown of the
  logo artwork."*
- The guide sheet also uses `#12213a`, `#091426`, `#d1dae7`, `#26354c` and
  `#43516a` for its own layout. These are not brand colours.
- The website uses Ivory as its main light background, which goes beyond the
  documented role; this is a design decision, not a brand rule.
- Design tokens: `static/css/tokens.css`.

### Contrast (WCAG 2 ratios, calculated)

| Foreground on background | Ratio | Notes |
|---|---|---|
| Ivory on Navy | 12.4:1 | All text |
| Bright Gold on Navy | 9.1:1 | All text |
| Ochre on Navy (and Navy on Ochre) | 4.7:1 | Passes AA, narrowly |
| Navy on Ivory | 12.4:1 | All text |
| Ochre on Ivory | 2.6:1 | **Fails.** Decorative use only |
| Bright Gold on Ivory | 1.4:1 | **Fails.** Never use |

## Logo structure

| Element | Description (as documented) |
|---|---|
| Emblem — geometric G | A bold, open G shape with a centred top cutout (an ivory keystone in the artwork) |
| Wordmark — GINDI | Uppercase sans-serif letters with generous spacing |
| Tagline — INNOVATIONS | Smaller, widely spaced uppercase letters in bright gold |

The elements sheet also shows an ivory **divider** between emblem and wordmark.

**Documented rules:**

- The logo is shown "on the recommended navy background".
- "Keep the emblem, wordmark and tagline aligned."

## Web derivatives (`static/images/brand/`)

Generated from the PNG embedded in the guide SVG. That artwork contains
exactly four flat colours and no antialiasing, so the navy background was made
transparent losslessly, with no recolouring or resizing of the artwork.

| File | Size | Use |
|---|---|---|
| `gindi-logo.png` | 435×585, transparent | Full logo (footer, mobile menu) — on navy only |
| `gindi-monogram.png` | 279×357, transparent | Emblem only (header) — on navy only |
| `favicon-32.png`, `apple-touch-icon.png` | 32², 180² | Emblem on navy |

The ivory wordmark is invisible on light backgrounds, so every derivative is
used on navy only.

## Not documented in the guide

Clear-space and minimum-size rules, the logo typeface, light-background,
monochrome or horizontal variants, an Arabic logo, and misuse rules.

## Known asset limitations

- **The "Navy & Gold" PNG is on white.** Its ivory wordmark has about 1.1:1
  contrast against white, so the file cannot be used as supplied.
- **Transparent PNGs are missing.** The elements sheet says they are
  "provided separately", but they are not in `logo/`.
- **Raster only, no antialiasing.** Edges are hard-pixelled; vector (SVG) files
  are needed for crisp rendering at large sizes.
- **No horizontal lockup.** The stacked logo is too tall for a header, which is
  why the header uses the emblem alone.

## Requested from the designer

1. SVG of the full logo and each element
2. A horizontal lockup and a light-background variant, if approved
3. The wordmark typeface name and licence
4. Clear-space and minimum-size rules
