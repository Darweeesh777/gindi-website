"""Calculator regression checks (headless Chrome, standard library + Django).

    python tools/calc-tests/run.py record      # baselines from the originals (static/Tools/*.txt)
    python tools/calc-tests/run.py check       # the integrated pages (EN and AR) against the baselines
    python tools/calc-tests/run.py originals   # the originals still give the recorded baselines
    python tools/calc-tests/run.py pure        # the pure calculation modules (pure.js cases)

Options: --tool bricks|tiles|wire|paint (repeatable), --chrome PATH.
Baselines: tools/calc-tests/baselines/<tool>.json. Scenarios: scenarios.py.
The originals are served as HTML copies in tools/calc-tests/work/ (ignored by
git); the integrated pages are rendered with Django's test client into the
same folder and use the repository's static files directly.
"""
import argparse
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, 'tools', 'studio'))
sys.path.insert(0, HERE)

from cdp import Session  # noqa: E402
import scenarios  # noqa: E402

ORIGINALS = {'bricks': 'brick-calculator.txt', 'tiles': 'ceramic-calculator.txt',
             'wire': 'wire-calculator.txt', 'paint': 'paint-calculator.txt', 'plaster': 'plaster-calculator.txt'}
WORK = os.path.join(HERE, 'work')
BASE = os.path.join(HERE, 'baselines')
HARNESS = open(os.path.join(HERE, 'harness.js'), encoding='utf-8').read()


class Runner:
    def __init__(self, chrome=None):
        os.makedirs(WORK, exist_ok=True)
        self.s = Session(gpu=False, chrome=chrome, profile=os.path.join(WORK, '.chrome-profile'))
        self.ws = self.s.ws
        self.s.httpd.handle_error = lambda *a: None  # Chrome drops connections when a page is left

    def js(self, expr):
        r = self.ws.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(r['exceptionDetails'].get('exception', {}).get('description', json.dumps(r['exceptionDetails']))[:800])
        return r['result'].get('value')

    def open(self, path):
        self.ws.events.clear()
        self.ws.send('Page.navigate', url=f'http://127.0.0.1:{self.s.port}/{path}?t={time.time()}')
        for _ in range(200):
            time.sleep(0.05)
            try:
                if self.js("document.readyState === 'complete' && !!document.getElementById('report') && document.getElementById('report').innerHTML.length > 0"):
                    break
            except RuntimeError:
                pass
        else:
            raise RuntimeError('page did not finish loading: ' + path)
        self.js(HARNESS)

    def run(self, path, tool, steps, side):
        self.open(path)
        self.js(f'window.__calc.apply({json.dumps(steps, ensure_ascii=False)})')
        out = self.js(f'window.__calc.capture({json.dumps(tool)}, {json.dumps(side)})')
        errs = [e for e in self.ws.events if e.get('method') == 'Runtime.exceptionThrown']
        if errs:
            raise RuntimeError(json.dumps(errs[0]['params']['exceptionDetails'])[:800])
        return out

    def close(self):
        self.s.close()


def original_page(tool):
    src = os.path.join(REPO, 'static', 'Tools', ORIGINALS[tool])
    dst = os.path.join(WORK, f'original-{tool}.html')
    shutil.copyfile(src, dst)
    return f'tools/calc-tests/work/original-{tool}.html'


def tool_scenarios(runner, tool):
    s = scenarios.ALL[tool]()
    if tool == 'paint':
        # Every product, in its own stage (option values read from the original).
        runner.open(original_page('paint'))
        opts = runner.js("""(() => { const o = {}; for (let i = 0; i < 4; i++) o[i] = [...document.getElementById('p' + i).options].map(x => x.value);
            for (const b of ['GLC', 'Jotun']) { const br = document.getElementById('brand'); br.value = b; br.dispatchEvent(new Event('change'));
              o['brand:' + b] = [...document.getElementById('p4').options].map(x => x.value); } return o; })()""")
        s.update(scenarios.paint_products(opts))
    return s


def rendered_pages(tools):
    """The integrated pages, EN and AR, rendered by Django into WORK."""
    sys.path.insert(0, REPO)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    import django
    django.setup()
    from django.test import Client
    from django.test.utils import setup_test_environment
    setup_test_environment()
    client = Client()
    pages = {}
    for tool in tools:
        for lang, prefix in (('en', ''), ('ar', '/ar')):
            r = client.get(f'{prefix}/free-tools/{tool}/')
            assert r.status_code == 200, (tool, lang, r.status_code)
            name = f'page-{tool}-{lang}.html'
            with open(os.path.join(WORK, name), 'w', encoding='utf-8') as f:
                f.write(r.content.decode())
            pages[(tool, lang)] = f'tools/calc-tests/work/{name}'
    return pages


def diff(a, b, path=''):
    """The first few differences between two captures."""
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                out.append(f'{path}/{k}: only in {"new" if k not in a else "baseline"}')
            else:
                out += diff(a[k], b[k], f'{path}/{k}')
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            out += diff(x, y, f'{path}[{i}]')
    elif a != b:
        out.append(f'{path}: baseline {json.dumps(a, ensure_ascii=False)[:300]} != new {json.dumps(b, ensure_ascii=False)[:300]}')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['record', 'check', 'originals', 'pure'])
    ap.add_argument('--tool', action='append', choices=list(ORIGINALS))  # noqa: E501
    ap.add_argument('--chrome')
    ap.add_argument('--only', help='scenario name prefix')
    args = ap.parse_args()
    tools = args.tool or list(ORIGINALS)
    os.makedirs(BASE, exist_ok=True)
    runner = Runner(args.chrome)
    failures = 0
    try:
        if args.mode == 'pure':
            runner.ws.send('Page.navigate', url=f'http://127.0.0.1:{runner.s.port}/tools/calc-tests/pure.html?t={time.time()}')
            time.sleep(1.5)
            res = runner.js('window.__pure')
            for line in res['lines']:
                print(ascii(line))
            failures = res['failed']
            print(f'pure: {res["passed"]} passed, {res["failed"]} failed')
            return failures
        pages = rendered_pages(tools) if args.mode == 'check' else {}
        for tool in tools:
            scen = tool_scenarios(runner, tool)
            path = os.path.join(BASE, f'{tool}.json')
            if args.mode == 'record':
                data = {}
                for name, steps in scen.items():
                    data[name] = {'steps': steps, 'out': runner.run(original_page(tool), tool, steps, 'original')}
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=1)
                print(f'{tool}: recorded {len(data)} scenarios')
                continue
            base = json.load(open(path, encoding='utf-8'))
            targets = [('original', original_page(tool))] if args.mode == 'originals' else \
                [(lang, pages[(tool, lang)]) for lang in ('en', 'ar')]
            for label, page in targets:
                ok = 0
                for name, rec in base.items():
                    if args.only and not name.startswith(args.only):
                        continue
                    try:
                        got = runner.run(page, tool, rec['steps'], 'original' if label == 'original' else 'new')
                        d = diff(rec['out'], got)
                    except RuntimeError as e:
                        d = [f'error: {e}']
                    if d:
                        failures += 1
                        print(ascii(f'FAIL {tool} [{label}] {name}'))
                        for line in d[:8]:
                            print(ascii('     ' + line))
                    else:
                        ok += 1
                print(f'{tool} [{label}]: {ok} scenarios match')
    finally:
        runner.close()
    print('FAILURES:', failures)
    return failures


if __name__ == '__main__':
    sys.exit(1 if main() else 0)
