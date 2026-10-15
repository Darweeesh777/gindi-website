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
