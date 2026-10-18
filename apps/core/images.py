"""
Homepage image registry.

Each entry points at WebP files in static/images/site/, named
`<name>-<width>.webp`, generated from the PNG masters in static/images/.
`illustrative=True` marks temporary (AI-generated) images: they are labelled
"Illustrative image" on the page and must never be presented as real studio
projects. Replace them with real photography and set it to False.
"""
from django.templatetags.static import static

IMAGES = {
    'hero-desktop': {'name': 'hero-desktop', 'size': (1672, 941), 'widths': (1100, 1672), 'illustrative': True},
    'hero-mobile': {'name': 'hero-mobile', 'size': (887, 1774), 'widths': (600, 887), 'illustrative': True},
    'project-1': {'name': 'project-1-living-room', 'size': (1536, 1024), 'widths': (800, 1536), 'illustrative': True},
    'project-2': {'name': 'project-2-staircase', 'size': (1122, 1402), 'widths': (640, 1122), 'illustrative': True},
    'project-3': {'name': 'project-3-kitchen', 'size': (1672, 941), 'widths': (900, 1672), 'illustrative': True},
    'project-4': {'name': 'project-4-arched-interior', 'size': (1672, 941), 'widths': (1100, 1672), 'illustrative': True},
    # About page (masters: static/images/image-1 … image-6, supplied for /about/).
    'about-hero': {'name': 'about-hero', 'size': (1981, 794), 'widths': (1200, 1981), 'illustrative': False},
    'about-who': {'name': 'about-who', 'size': (1672, 941), 'widths': (960, 1672), 'illustrative': False},
    'about-what': {'name': 'about-what', 'size': (1536, 1024), 'widths': (960, 1536), 'illustrative': False},
    'about-how': {'name': 'about-how', 'size': (1024, 1536), 'widths': (640, 1024), 'illustrative': False},
    'about-detail-1': {'name': 'about-detail-1', 'size': (1600, 640), 'widths': (960, 1600), 'illustrative': False},
    'about-detail-2': {'name': 'about-detail-2', 'size': (1600, 534), 'widths': (960, 1600), 'illustrative': False},
    # From Vision to Reality: KK Barbershop, Sheikh Zayed (masters: Render.png, real.JPG).
    # Both exported at identical sizes, so they line up in the comparison.
    'kk-design': {'name': 'kk-barbershop-design', 'size': (1536, 1024), 'widths': (960, 1536), 'illustrative': False},
    'kk-reality': {'name': 'kk-barbershop-reality', 'size': (1536, 1024), 'widths': (960, 1536), 'illustrative': False},
    # Project 01, KK Barbershop - Sheikh Zayed: the real photographs and the
    # concept visualization, from static/images/KK/ (originals kept as they
    # are). Each kk-img-NNNN is IMG_NNNN.JPG (2048 x 1365); kk-render-2 is
    # "Render 2.png" (1536 x 1024). The 480 px files are the thumbnails.
    **{f'kk-img-{n}': {'name': f'kk-img-{n}', 'size': (2048, 1365), 'widths': (480, 960, 1536, 2048), 'illustrative': False}
       for n in range(8891, 8897)},
    'kk-render-2': {'name': 'kk-render-2', 'size': (1536, 1024), 'widths': (480, 960, 1536), 'illustrative': False},
    # The other concept visualizations (AI-generated, 1536 x 1024), from
    # static/images/KK/render/ "ChatGPT Image Oct 18, 2026, <time> AM.png":
    # 03_04_03 = stations, 03_04_40 = styling, 03_05_15 = coffee,
    # 03_09_25 = waiting, 03_06_47 = front.
    **{f'kk-concept-{view}': {'name': f'kk-concept-{view}', 'size': (1536, 1024), 'widths': (480, 960, 1536), 'illustrative': False}
       for view in ('stations', 'styling', 'coffee', 'waiting', 'front')},
    # TEMPORARY second comparison (sample, not a project): the hero room empty
    # (master: room-background.png), paired with 'hero-desktop' (the same room
    # furnished, same viewpoint and size). Remove with its VISIONS entry.
    'sample-hall-empty': {'name': 'sample-arched-hall-empty', 'size': (1672, 941), 'widths': (1100, 1672), 'illustrative': True},
    # Revealed through the Geometric G in the About (Gindi Innovations) section.
    'about': {'name': 'about-studio-materials', 'size': (1086, 1448), 'widths': (640, 1086), 'illustrative': True},
}


def resolve(key, alt=''):
    """Return the template-ready data for one image."""
    entry = IMAGES[key]
    urls = [(static(f"images/site/{entry['name']}-{w}.webp"), w) for w in entry['widths']]
    return {
        'src': urls[-1][0],
        'srcset': ', '.join(f'{url} {w}w' for url, w in urls),
        'width': entry['size'][0],
        'height': entry['size'][1],
        'alt': alt,
        'illustrative': entry['illustrative'],
    }


def resolve_content(node):
    """Copy a content tree, replacing every {'image': key, 'alt': ...} item's
    key with resolved image data. Items with image None are left as-is."""
    if isinstance(node, dict):
        out = {k: resolve_content(v) for k, v in node.items()}
        if isinstance(node.get('image'), str):
            out['image'] = resolve(node['image'], node.get('alt', ''))
        return out
    if isinstance(node, list):
        return [resolve_content(item) for item in node]
    return node
