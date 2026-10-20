"""GINDI Design Studio — room preparation tool.

Prepares a style's image for the material compositor: object masks (SAM),
slot masks (recipe), lighting/zone maps, review sheets and the files the site
serves (static/studio/rooms/<style>/). See tools/studio/README.md.

    python tools/studio/studio_tool.py <command> <style> [args]

Commands
    init <style> <source.png>        copy the source image into the work folder
    grid <style> x y w h [scale] [step]   coordinate grid of a region (to place prompt points)
    sam <style> [name ...]           run the SAM prompts from the room file (all, or the named ones)
    masks <style> m1,m2,... [x y w h scale]   view masks (paths relative to the work folder)
    compose <style>                  slot masks + zones from the recipe; overlay and review crops
    prep <style>                     mask.png / light.png / zone.png + calibration figures
    sheet <style>                    every option rendered (needs the style in apps/core/studio.py)
    combos <style> name=u,s,w ...    full-size renders of option indices (0 = the image itself)
    build <style>                    write static/studio/rooms/<style>/ (image, maps, swatches, quiz crops)

Room files: tools/studio/rooms/<style>.json. Work files: tools/studio/work/<style>/ (not committed).
"""
import json
import os
import shutil
import sys

from cdp import REPO, Session, save_outputs

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')


def room_file(style):
    with open(os.path.join(HERE, 'rooms', f'{style}.json'), encoding='utf-8') as f:
        return json.load(f)


def work(style, *parts):
    return os.path.join(WORK, style, *parts)


def url(path):
    """Server URL for a path inside the repository."""
    return '/' + os.path.relpath(path, REPO).replace(os.sep, '/')


def catalogue(style):
    """The style's entry in apps/core/studio.py and its options in the compositor's form."""
    sys.path.insert(0, REPO)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    import django
    django.setup()
    from apps.core import studio
    s = next((x for x in studio.STYLES if x['id'] == style), None)
    if not s:
        sys.exit(f'{style} is not in apps/core/studio.py STYLES')
    slots = {}
    for slot in studio.SLOTS:
        slots[slot] = []
        for m in s['materials'].get(slot, []):
            o = {'id': m['id'], 'original': bool(m.get('original'))}
            if m.get('scan'):
                o.update(scan=m['scan'], scale=m['scale'], map=f"/static/studio/materials/{m['scan']}/color.webp")
            for k in ('colors', 'finish'):
                if m.get(k):
                    o[k] = m[k]
            slots[slot].append(o)
    w, h = s['size']
    room = {'width': w, 'height': h, 'photo': url(work(style, 'source.png')),
            'maps': {k: url(work(style, 'prep', f'{k}.png')) for k in ('mask', 'light', 'zone')},
            'render': s['render']}
    return s, room, slots


def show(rest):
    for k, v in rest.items():
        print(f'  {k}: {json.dumps(v)}')


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd, style, args = argv[0], argv[1], argv[2:]
    src = url(work(style, 'source.png'))

    if cmd == 'init':
        os.makedirs(work(style), exist_ok=True)
        shutil.copyfile(args[0], work(style, 'source.png'))
        print('  copied to', os.path.relpath(work(style, 'source.png'), REPO))
        return

    cfg = room_file(style)
    gpu = cmd in ('sheet', 'combos', 'build')
    # SAM keeps its own profile (the downloaded model stays cached there); the other
    # commands use a second one, so a review can run while SAM is still working.
    profile = os.path.join(WORK, '.chrome-profile' if cmd == 'sam' else '.chrome-profile-review')
    with Session(gpu=gpu, profile=profile) as s:
        if cmd == 'grid':
            x, y, w, h = map(int, args[:4])
            scale = float(args[4]) if len(args) > 4 else 2
            step = int(args[5]) if len(args) > 5 else 20
            r = s.run('inspect', {'mode': 'grid', 'src': src, 'crop': [x, y, w, h], 'scale': scale, 'step': step})
            r = {f'grid_{x}_{y}.jpg': r['grid.jpg']}
            save_outputs(r, work(style, 'review'))
        elif cmd == 'sam':
            prompts = [p for p in cfg['sam'] if not args or p['name'] in args]
            show(save_outputs(s.run('sam', {'src': src, 'prompts': prompts}), work(style, 'sam'), quiet=True))
            print('  masks in', os.path.relpath(work(style, 'sam'), REPO), '(debug.jpg shows them)')
        elif cmd == 'masks':
            masks = [url(work(style, m)) for m in args[0].split(',')]
            crop = [int(v) for v in args[1:5]] if len(args) >= 5 else None
            scale = float(args[5]) if len(args) > 5 else 0.5
            r = s.run('inspect', {'mode': 'masks', 'src': src, 'masks': masks, 'crop': crop, 'scale': scale})
            save_outputs(r, work(style, 'review'))
        elif cmd == 'compose':
            r = s.run('compose', {'src': src, 'samDir': url(work(style, 'sam')), 'recipe': cfg['recipe'],
                                  'crops': cfg.get('review_crops', [])})
            show(save_outputs(r, work(style, 'mask'), quiet=True))
            print('  review:', os.path.relpath(work(style, 'mask', 'overlay.jpg'), REPO), 'and crop*.jpg')
        elif cmd == 'prep':
            r = s.run('prep', {'src': src, 'maskDir': url(work(style, 'mask')), **cfg.get('prep', {})})
            show(save_outputs(r, work(style, 'prep'), quiet=True))
        elif cmd == 'sheet':
            _, room, slots = catalogue(style)
            r = s.run('render', {'mode': 'sheet', 'room': room, 'slots': slots, 'crops': cfg.get('sheet_crops', []),
                                 'combos': cfg.get('sheet_combos', {})})
            save_outputs(r, work(style, 'sheet'))
        elif cmd == 'combos':
            _, room, slots = catalogue(style)
            combos = {}
            for a in args:
                name, sel = a.split('=')
                u, st, w = (int(v) for v in sel.split(','))
                combos[name] = {'upholstery': u, 'stone': st, 'wood': w}
            save_outputs(s.run('render', {'mode': 'combos', 'room': room, 'slots': slots, 'combos': combos}), work(style, 'combos'))
        elif cmd == 'build':
            _, room, slots = catalogue(style)
            dest = os.path.join(REPO, 'static', 'studio', 'rooms', style)
            if os.path.isdir(os.path.join(dest, 'swatches')):
                shutil.rmtree(os.path.join(dest, 'swatches'))
            r = s.run('render', {'mode': 'build', 'room': room, 'slots': slots, 'lightPNG': url(work(style, 'prep', 'light.png')),
                                 'swatch': cfg['swatch'], 'quiz': cfg.get('quiz', {})})
            save_outputs(r, dest)
            for name in ('mask.png', 'zone.png'):
                shutil.copyfile(work(style, 'prep', name), os.path.join(dest, name))
                print('  wrote', os.path.relpath(os.path.join(dest, name), REPO))
        else:
            sys.exit(f'unknown command {cmd}\n{__doc__}')


if __name__ == '__main__':
    main(sys.argv[1:])
