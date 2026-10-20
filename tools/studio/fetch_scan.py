"""Add a stone scan from ambientCG (CC0) to the studio.

    python tools/studio/fetch_scan.py Marble020 [Marble019 ...]

Downloads the 2K pack, keeps only its colour map (in tools/studio/work/scans/,
not committed), and writes static/studio/materials/<assetid>/color.webp (up to
2048 px, seamless, used by the compositor) and swatch.webp (a 320 px crop from
the centre at real detail). Then reference it in apps/core/studio.py as
_scan(..., '<assetid>', scale) with scale = metres covered by one repeat.
"""
import os
import sys
import urllib.request
import zipfile

from cdp import REPO, Session, save_outputs

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'work', 'scans')


def download(asset, res='2K-JPG'):
    os.makedirs(RAW, exist_ok=True)
    out = os.path.join(RAW, f'{asset}_Color.jpg')
    if os.path.isfile(out):
        return out
    req = urllib.request.Request(f'https://ambientcg.com/get?file={asset}_{res}.zip',
                                 headers={'User-Agent': 'Mozilla/5.0 (GINDI studio scan import)'})
    zpath = os.path.join(RAW, f'{asset}.zip')
    with urllib.request.urlopen(req, timeout=180) as r, open(zpath, 'wb') as f:
        f.write(r.read())
    with zipfile.ZipFile(zpath) as z:
        name = next(m for m in z.namelist() if m.lower().endswith('_color.jpg') and '/' not in m)
        with z.open(name) as src, open(out, 'wb') as dst:  # only the colour map, flat (no archive paths)
            dst.write(src.read())
    os.remove(zpath)
    return out


def main(assets):
    if not assets:
        sys.exit(__doc__)
    paths = {a: download(a) for a in assets}
    with Session(gpu=False, profile=os.path.join(HERE, 'work', '.chrome-profile-scan')) as s:
        for asset, path in paths.items():
            src = '/' + os.path.relpath(path, REPO).replace(os.sep, '/')
            r = s.run('scan', {'src': src})
            save_outputs(r, os.path.join(REPO, 'static', 'studio', 'materials', asset.lower()))


if __name__ == '__main__':
    main(sys.argv[1:])
