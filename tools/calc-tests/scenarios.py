"""Regression scenarios for the four calculators (static/Tools/*.txt originals
and the integrated pages at /free-tools/<slug>/).

Each scenario is a list of steps run in the page, in order:

    ['set', id, value]     set an input's / select's value, then fire input + change
    ['click', css]         click an element (add a row, …)
    ['del', row]           click the remove button of the row with data-row=row

Element ids, data-row numbers and option values are the originals'; the
integrated pages keep them, so the same steps drive both.
"""

BRICK_THICK = ['نص طوبة', 'طوبة', 'طوبة ونص']


def bricks():
    s = {
        'defaults': [],
        'typical': [['set', 'price', '4500'], ['set', 'l0', '6'], ['set', 'h0', '3'], ['set', 'o0', '2.5'],
                    ['set', 't0', 'طوبة']],
        'multiple-walls': [['click', '#addWall'], ['click', '#addWall'],
                           ['set', 'l1', '4'], ['set', 'h1', '3'], ['set', 'o1', '0'], ['set', 't1', 'طوبة ونص'],
                           ['set', 'l2', '3.5'], ['set', 'h2', '2.8'], ['set', 'o2', '1.89'],
                           ['set', 'brick', '6'], ['set', 'price', '12000']],
        'remove-wall': [['click', '#addWall'], ['click', '#addWall'], ['set', 'l1', '7'], ['set', 'h1', '3'],
                        ['set', 'l2', '2'], ['set', 'h2', '3'], ['set', 't2', 'طوبة'], ['del', 1]],
        'remove-to-one': [['click', '#addWall'], ['set', 'l1', '4'], ['set', 'h1', '2'], ['del', 0]],
        'empty-and-zero': [['set', 'waste', ''], ['set', 'joint', ''], ['set', 'price', '0'],
                           ['set', 'l0', ''], ['set', 'h0', '0']],
        'negative-values': [['set', 'waste', '-5'], ['set', 'joint', '-1'], ['set', 'price', '-100'],
                            ['set', 'o0', '-2']],
        'openings-exceed-wall': [['set', 'o0', '100'], ['set', 'price', '3000']],
        'rounding-exact': [['set', 'joint', '0'], ['set', 'waste', '0'], ['set', 'l0', '3'], ['set', 'h0', '1'],
                           ['set', 'o0', '0']],
        'rounding-just-above': [['set', 'joint', '0'], ['set', 'waste', '0.5'], ['set', 'l0', '3'], ['set', 'h0', '1'],
                                ['set', 'o0', '0']],
        'light-brick-thin-joint': [['set', 'brick', '10'], ['set', 'joint', '0.3'], ['set', 'waste', '15'],
                                   ['set', 'l0', '5.555'], ['set', 'h0', '2.95'], ['set', 'price', '2750.5']],
        'empty-wall-row': [['click', '#addWall'], ['set', 'price', '5000']],
        # up() = Math.ceil(x - 1e-9): an excess below 1e-9 is absorbed, a larger one buys one more brick.
        'rounding-within-epsilon': [['set', 'joint', '0'], ['set', 'waste', '0.00000000005'], ['set', 'l0', '3'], ['set', 'h0', '1'],
                                    ['set', 'o0', '0']],
        'rounding-tiny-above': [['set', 'joint', '0'], ['set', 'waste', '0.00025'], ['set', 'l0', '3'], ['set', 'h0', '1'],
                                ['set', 'o0', '0']],
    }
    # Every brick type, with each wall thickness in turn.
    for k in range(14):
        s[f'brick-type-{k}'] = [['set', 'brick', str(k)], ['set', 't0', BRICK_THICK[k % 3]], ['set', 'price', '3900']]
    return s


TILE_TYPES = [['tl0', '60'], ['tw0', '60'], ['tc0', '1.44'], ['tr0', '350'],
              ['tl1', '30'], ['tw1', '60'], ['tc1', '1.62'], ['tr1', '280'],
              ['tl2', '30'], ['tw2', '30'], ['tc2', '1.08'], ['tr2', '300']]
TILE_AREAS = [['l0', '6'], ['w0', '5'], ['dr0', '1'], ['l1', '4'], ['w1', '3.5'], ['dr1', '0.9'],
              ['l4', '5'], ['w4', '1.2'], ['l5', '3'], ['w5', '2.5'], ['l6', '11'], ['w6', '2.6'], ['o6', '1.5'],
              ['l7', '2'], ['w7', '1.8'], ['l8', '7.6'], ['w8', '2.4'], ['o8', '1.7']]


def _sets(pairs):
    return [['set', k, v] for k, v in pairs]


def tiles():
    typical = _sets(TILE_TYPES) + _sets(TILE_AREAS)
    return {
        'defaults': [],
        'types-only': _sets(TILE_TYPES),
        'typical': typical,
        'glue-and-supplier-in-range': typical + _sets([['glueCov', '4'], ['gluePrice', '180'], ['supplier', '52']]),
        'supplier-high': typical + _sets([['supplier', '1000'], ['glueCov', '4']]),
        'supplier-low': typical + _sets([['supplier', '5'], ['gluePrice', '180']]),
        'missing-carton-area': _sets([['tl0', '60'], ['tw0', '60'], ['tr0', '350'], ['l0', '6'], ['w0', '5']]),
        'no-prices': _sets([['tl0', '60'], ['tw0', '60'], ['tc0', '1.44'], ['l0', '6'], ['w0', '5'],
                            ['tl1', '30'], ['tw1', '60'], ['tc1', '1.62'], ['l6', '11'], ['w6', '2.6']]),
        'partial-prices': _sets(TILE_TYPES[:4] + [['tl1', '30'], ['tw1', '60'], ['tc1', '1.62']]) + _sets(TILE_AREAS),
        'add-and-remove-places': typical + [['click', '#addArea'], ['set', 'l12', '4'], ['set', 'w12', '3'],
                                            ['set', 'n12', '2'], ['set', 't12', 'نوع 3'], ['set', 's12', 'أخرى'],
                                            ['set', 'k12', 'أيوه'], ['set', 'dr12', '0.8'],
                                            ['click', '#addArea'], ['set', 'l13', '2'], ['set', 'w13', '2'],
                                            ['del', 1], ['del', 9]],
        'count-empty-and-zero': typical + _sets([['n0', ''], ['n1', '0'], ['n4', '3']]),
        'skirting-toggles': typical + _sets([['k0', 'لأ'], ['k6', 'أيوه'], ['dr6', '50'], ['skH', '0']]),
        'skirting-settings': typical + _sets([['skH', '12'], ['skX', '0']]),
        'waste-zero': typical + _sets([['wMin', '0'], ['wAvg', '0'], ['wMax', '0'], ['wExtra', '0'], ['joint', '0']]),
        'waste-empty': typical + _sets([['wMin', ''], ['wAvg', ''], ['wMax', ''], ['wExtra', ''], ['joint', '']]),
        'negative-values': typical + _sets([['wAvg', '-3'], ['o0', '-4'], ['tc1', '-1.62'], ['supplier', '-3'],
                                            ['glueCov', '-2']]),
        'openings-exceed': typical + _sets([['o0', '500']]),
        'rounding-exact': _sets([['tl0', '50'], ['tw0', '50'], ['tc0', '1'], ['tr0', '100'], ['wMin', '0'],
                                 ['wAvg', '0'], ['wMax', '0'], ['wExtra', '0'], ['joint', '0'], ['l0', '5'], ['w0', '2'],
                                 ['k0', 'لأ']]),
        'rounding-just-above': _sets([['tl0', '50'], ['tw0', '50'], ['tc0', '1'], ['wMin', '0'], ['wAvg', '0.5'],
                                      ['wMax', '1'], ['wExtra', '0'], ['joint', '0'], ['l0', '5'], ['w0', '2'],
                                      ['k0', 'لأ']]),
        'rounding-tiny-above': _sets([['tl0', '50'], ['tw0', '50'], ['tc0', '1'], ['wMin', '0'], ['wAvg', '0.00005'],
                                      ['wMax', '0'], ['wExtra', '0'], ['joint', '0'], ['l0', '5'], ['w0', '2'], ['k0', 'لأ']]),
        'rounding-within-epsilon': _sets([['tl0', '50'], ['tw0', '50'], ['tc0', '1'], ['wMin', '0'], ['wAvg', '0.000000005'],
                                          ['wMax', '0'], ['wExtra', '0'], ['joint', '0'], ['l0', '5'], ['w0', '2'], ['k0', 'لأ']]),
        'glue-only-coverage': typical + _sets([['glueCov', '3.5']]),
        'glue-zero-coverage': typical + _sets([['glueCov', '0'], ['gluePrice', '150']]),
    }


WIRE_ROOMS = [['click', '#add0'], ['click', '#add0'], ['set', 'k8', '2'], ['set', 'sn8', '4'], ['set', 'l8', '18'],
              ['set', 'sn9', '0'], ['set', 'se_e9', '2'], ['set', 'sl9', '20']]


def wire():
    return {
        'defaults': [],
        'apartment-area': _sets([['area', '120']]),
        'electrician-in-range': _sets([['area', '120'], ['elec', '8']]),
        'electrician-high': _sets([['area', '120'], ['elec', '20']]),
        'electrician-low': _sets([['area', '120'], ['elec', '3']]),
        'electrician-decimal': _sets([['elec', '7.5']]),
        'rooms-and-appliances': _sets([['area', '150']]) + WIRE_ROOMS + [
            ['click', '#add3'], ['click', '#add3'], ['click', '#add4'],
            ['set', 'c1', '1'], ['set', 'c2', '1'], ['set', 'c5', '1'], ['set', 'l11', '22'], ['set', 's12', '6'],
            ['set', 'elec', '14']],
        'remove-rows': WIRE_ROOMS + [['click', '#add3'], ['del', 0], ['del', 10], ['set', 'c1', '2']],
        'extra-items': _sets([['c6', '1'], ['l6', '25'], ['n6', 'كابل العداد'], ['s6', '10'],
                              ['c7', '2'], ['l7', '7.5'], ['s7', '16'], ['w7', '2'], ['a7', 'نعم'], ['area', '90']]),
        'scale-toggles': _sets([['area', '200'], ['a0', 'لا'], ['a3', 'نعم'], ['c1', '1'], ['a1', 'نعم']]),
        'ungrounded-sockets': _sets([['se_e0', '2'], ['sn0', '3'], ['se0', '4.5']]),
        'reference-zero-or-empty': _sets([['area', '120'], ['ref', '0']]),
        'reference-empty': _sets([['area', '120'], ['ref', '']]),
        'roll-zero': _sets([['roll', '0'], ['elec', '5']]),
        'roll-50': _sets([['roll', '50'], ['area', '80']]),
        'margin-and-waste-empty': _sets([['margin', ''], ['wmin', ''], ['wavg', ''], ['wmax', '']]),
        'waste-high': _sets([['wmin', '20'], ['wavg', '25'], ['wmax', '30'], ['margin', '25']]),
        'one-price-cleared': _sets([['p1', ''], ['area', '100']]),
        'all-prices-cleared': _sets([['p0', ''], ['p1', ''], ['p2', ''], ['p3', ''], ['p4', ''], ['p5', '']]),
        'price-edited': _sets([['p0', '1600'], ['p2', '4000.5']]),
        'negative-values': _sets([['area', '-50'], ['k0', '-1'], ['l3', '-15'], ['w4', '-3'], ['p0', '-10'],
                                  ['elec', '-2']]),
        'zero-sockets-zero-switches': _sets([['sn0', '0'], ['k0', '0']]),
        'rounding-exact': _sets([['margin', '0'], ['wmin', '0'], ['wavg', '0'], ['wmax', '0'], ['k0', '0'],
                                 ['sn0', '0'], ['l0', '100'], ['w0', '1'], ['l3', ''], ['l4', ''], ['a0', 'لا']]),
        'rounding-within-epsilon': _sets([['margin', '0'], ['wmin', '0'], ['wavg', '0.00000005'], ['wmax', '0'], ['k0', '0'],
                                          ['sn0', '0'], ['l0', '100'], ['w0', '1'], ['l3', ''], ['l4', ''], ['a0', 'لا']]),
        'rounding-tiny-above': _sets([['margin', '0'], ['wmin', '0'], ['wavg', '0.00005'], ['wmax', '0'], ['k0', '0'],
                                      ['sn0', '0'], ['l0', '100'], ['w0', '1'], ['l3', ''], ['l4', ''], ['a0', 'لا']]),
    }


def paint():
    prices = _sets([['v0', '650'], ['v1', '420'], ['v2', '5'], ['v3', '900'], ['v4', '1100']])
    return {
        'defaults': [],
        'typical-prices': prices + _sets([['labour', '35']]),
        'labour-only': _sets([['labour', '40']]),
        'partial-prices': _sets([['v0', '650'], ['v3', '900']]),
        'brand-glc': [['set', 'brand', 'GLC']] + prices,
        'brand-glc-then-jotun': [['set', 'brand', 'GLC'], ['set', 'brand', 'Jotun']] + prices,
        'manual-sizes': _sets([['len', '95'], ['open', '20'], ['ceil', '70'], ['height', '2.85']]) + prices,
        'manual-zero-sizes': _sets([['len', '0'], ['open', '0'], ['ceil', '0']]) + prices,
        'openings-exceed': _sets([['open', '1000']]) + prices,
        'coats-and-ceiling': _sets([['c0', '0'], ['c1', '3'], ['s1', 'لا'], ['c4', '4'], ['s4', 'لا']]) + prices,
        'no-ceiling-anywhere': _sets([['s0', 'لا'], ['s1', 'لا'], ['s2', 'لا'], ['s3', 'لا'], ['s4', 'لا']]),
        'all-coats-zero': _sets([['c0', '0'], ['c1', '0'], ['c2', '0'], ['c3', '0'], ['c4', '0'], ['labour', '30']]),
        'waste-zero': _sets([['waste', '0']]) + prices,
        'waste-empty': _sets([['waste', '']]) + prices,
        'waste-decimal': _sets([['waste', '12.5']]) + prices + _sets([['labour', '27.5']]),
        'flat-empty': _sets([['flat', ''], ['height', '']]) + prices,
        'flat-large': _sets([['flat', '350'], ['height', '3.2']]) + prices,
        'negative-values': _sets([['flat', '-80'], ['waste', '-10'], ['labour', '-5'], ['v1', '-1']]),
        'zero-price': _sets([['v0', '0'], ['v1', '0'], ['v2', '0'], ['v3', '0'], ['v4', '0']]),
        'other-products': _sets([['p0', '5'], ['p1', '17'], ['p3', '33']]) + prices,
    }


def paint_products(options):
    """One scenario per product, chosen in its stage (options: from the original page:
    {stage: [values]} with the finish stage per brand as 'brand:GLC' / 'brand:Jotun')."""
    out = {}
    for key, values in options.items():
        for v in values:
            if key.startswith('brand:'):
                brand = key.split(':', 1)[1]
                steps = [['set', 'brand', brand], ['set', 'p4', v], ['set', 'v4', '1000'], ['set', 'c4', '3']]
            else:
                steps = [['set', 'p' + key, v], ['set', 'v' + key, '250']]
            out[f'product-{key}-{v}'] = steps
    return out


ALL = {'bricks': bricks, 'tiles': tiles, 'wire': wire, 'paint': paint}
