"""Responsive WebP copies of photographs for the site (static/images/site/).

    python tools/studio/web_images.py villa

Reads the originals (never changed) and writes static/images/site/<name>-<width>.webp
for each width listed for that image in apps/core/images.py. Portrait and landscape
photos keep their proportions; nothing is cropped. Uses headless Chrome (see README).

Sets:
    villa   every photo in "static/images/Villa ( pictures )/" (Project 02), registered in
            images.py as villa-<first 8 characters of the file name, lowercase>
"""
import os
import sys

from cdp import REPO, Session, save_outputs

HERE = os.path.dirname(os.path.abspath(__file__))
SETS = {'villa': ('static/images/Villa ( pictures )', 'villa-')}


def main(argv):
    if not argv or argv[0] not in SETS:
        sys.exit(__doc__)
    folder, prefix = SETS[argv[0]]
    sys.path.insert(0, REPO)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    import django
    django.setup()
    from apps.core.images import IMAGES

    out_dir = os.path.join(REPO, 'static', 'images', 'site')
    files = sorted(f for f in os.listdir(os.path.join(REPO, folder)) if f.lower().endswith('.png'))
    with Session(gpu=False, profile=os.path.join(HERE, 'work', '.chrome-profile-review')) as s:
        for f in files:
            key = prefix + f[:8].lower()
            entry = IMAGES.get(key)
            if not entry:
                print('  not in images.py:', key)
                continue
            src = '/' + '/'.join([folder.replace(' ', '%20'), f])
            r = s.run('resize', {'src': src, 'widths': list(entry['widths'])})
            if tuple(r['size']) != tuple(entry['size']):
                print('  size differs from images.py:', key, r['size'], entry['size'])
            save_outputs({f"{entry['name']}-{w}.webp": r[f'{w}.webp'] for w in entry['widths']}, out_dir, quiet=True)
            print('  ok', key)


if __name__ == '__main__':
    main(sys.argv[1:])
