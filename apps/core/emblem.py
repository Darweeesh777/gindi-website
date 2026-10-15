"""
The Gindi Geometric G emblem as SVG geometry, for the architectural reveal in
the Gindi Innovations section (templates/partials/emblem_reveal.html,
static/js/emblem-reveal.js).

No vector version of the emblem exists in the project (in
logo/Gindi-Innovations-Brand-Guide.svg it is an embedded raster image), so
these paths trace static/images/brand/gindi-monogram.png
(279×357 px, transparent background) and use its pixel space as their
coordinate system. Measured on the PNG, the emblem is:

- an arch-topped band, 36 px thick everywhere: concentric arcs (outer radius
  138.5, inner 102.5) on straight sides, closed along the base;
- the G: the band's right side stops at y = 175.75, and a bar of the same
  thickness runs in from the right edge (y 212–248) to x = 140;
- the keystone: an ivory trapezoid at the crown that cuts clean through the
  band, so the gold is two pieces (the main body and the short upper arm).

Rasterised and compared with the PNG, the paths cover the same gold pixels
(99.7% overlap); the only differences are the PNG's 1 px anti-aliasing halo.
"""
import math

EMBLEM_W, EMBLEM_H = 279, 357

# Arch centre and radii.
CX, CY = 139.5, 156.6
R_OUT, R_IN = 138.5, 102.5
# Straight edges.
LEFT_OUT, LEFT_IN = 1, 37
RIGHT_IN, RIGHT_OUT = 242, 278
BASE_IN, BASE_OUT = 321, 357
# The G: end of the upper arm, and the bar.
ARM_END = 175.75
BAR_LEFT, BAR_TOP, BAR_BOTTOM = 140, 212, 248
# Keystone: top edge (y 0) and bottom edge (y 60), left and right x.
KEY_TOP, KEY_BOTTOM = (0, 116, 163), (60, 124, 155)

# The reveal's frame: the section's 3:4 arched image area, in SVG units.
FRAME_W, FRAME_H = 300, 400
# Where the emblem sits in the frame at the start: centred across, half the
# width, in the upper-middle so it is fully on screen while it is drawn (the
# frame is nearly a viewport tall on desktop).
EMBLEM_SCALE = 0.5 * FRAME_W / EMBLEM_W
EMBLEM_X = (FRAME_W - EMBLEM_W * EMBLEM_SCALE) / 2
EMBLEM_Y = 72


def _n(value):
    return f'{value:.3f}'.rstrip('0').rstrip('.')


def _keystone_side(y, side):
    """x of the keystone's left (0) or right (1) side at height y."""
    (y0, *top), (y1, *bottom) = KEY_TOP, KEY_BOTTOM
    return top[side] + (bottom[side] - top[side]) * (y - y0) / (y1 - y0)


def _keystone_meets(radius, side):
    """Where a keystone side crosses an arch circle (upper half)."""
    lo, hi = KEY_TOP[0], CY  # bisect on y
    for _ in range(60):
        y = (lo + hi) / 2
        inside = math.hypot(_keystone_side(y, side) - CX, y - CY) < radius
        lo, hi = (lo, y) if inside else (y, hi)
    return _keystone_side(lo, side), lo


def _point(p):
    return f'{_n(p[0])} {_n(p[1])}'


def paths():
    """SVG path data, all closed, in the PNG's pixel space."""
    left_out, left_in = _keystone_meets(R_OUT, 0), _keystone_meets(R_IN, 0)
    right_out, right_in = _keystone_meets(R_OUT, 1), _keystone_meets(R_IN, 1)
    ro, ri, cy = _n(R_OUT), _n(R_IN), _n(CY)
    (y0, k_tl, k_tr), (y1, k_bl, k_br) = KEY_TOP, KEY_BOTTOM

    # Main body, drawn from the crown: down the outer arch and the left side,
    # along the base, up the right stem and round the bar, then the inner
    # contour back up to the keystone.
    main = (
        f'M {_point(left_out)} A {ro} {ro} 0 0 0 {LEFT_OUT} {cy} V {BASE_OUT} H {RIGHT_OUT} '
        f'V {BAR_TOP} H {BAR_LEFT} V {BAR_BOTTOM} H {RIGHT_IN} V {BASE_IN} H {LEFT_IN} V {cy} '
        f'A {ri} {ri} 0 0 1 {_point(left_in)} Z'
    )
    # Upper arm: from the keystone over the right shoulder to the G's opening.
    arm = (
        f'M {_point(right_out)} A {ro} {ro} 0 0 1 {RIGHT_OUT} {cy} V {_n(ARM_END)} '
        f'H {RIGHT_IN} V {cy} A {ri} {ri} 0 0 0 {_point(right_in)} Z'
    )
    keystone = f'M {k_tl} {y0} H {k_tr} L {k_br} {y1} H {k_bl} Z'
    return {'main': main, 'arm': arm, 'keystone': keystone}


def arch(cx, cy, r, bottom):
    """An arch window: a semicircle of radius r centred on (cx, cy) on straight
    sides down to `bottom`. The emblem's outer silhouette is one (its openings
    filled); so is the section's arched frame."""
    return f'M {_n(cx - r)} {_n(bottom)} V {_n(cy)} A {_n(r)} {_n(r)} 0 0 1 {_n(cx + r)} {_n(cy)} V {_n(bottom)} Z'


def window_start():
    """The emblem's outer silhouette, placed in the frame: (cx, cy, r, bottom)."""
    s, x, y = EMBLEM_SCALE, EMBLEM_X, EMBLEM_Y
    return (x + CX * s, y + CY * s, R_OUT * s, y + BASE_OUT * s)


def window_end():
    """The frame's own arch (radius = half the width), with a 2-unit margin so
    the mask's edge never shows inside the frame's rounded clip."""
    half = FRAME_W / 2
    return (half, half, half + 2, FRAME_H + 2)


def context():
    """Template data for the emblem reveal."""
    return {
        'viewbox': f'0 0 {FRAME_W} {FRAME_H}',
        'frame': {'w': FRAME_W, 'h': FRAME_H},
        'place': f'translate({_n(EMBLEM_X)} {_n(EMBLEM_Y)}) scale({EMBLEM_SCALE:.5f})',
        'paths': paths(),
        'window': arch(*window_start()),
        'window_start': ' '.join(_n(v) for v in window_start()),
        'window_end': ' '.join(_n(v) for v in window_end()),
    }
