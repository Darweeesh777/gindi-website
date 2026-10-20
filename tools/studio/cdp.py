"""Headless Chrome driver for the studio tools (standard library only).

Serves the repository root over a local HTTP server, starts headless Chrome,
loads tools/studio/page.html and runs one of the ES modules in tools/studio/js/
(`export default async function (args)`), returning its result. Values that
are data: URLs are written as files by the caller.
"""
import base64
import functools
import http.server
import json
import os
import socket
import struct
import subprocess
import threading
import time
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'


class WS:
    """Minimal WebSocket client for the Chrome DevTools protocol."""

    def __init__(self, url, timeout=1800):
        host, rest = url[len('ws://'):].split('/', 1)
        h, p = host.split(':')
        self.s = socket.create_connection((h, int(p)))
        self.s.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f'GET /{rest} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\n'
                        f'Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n'
                        'Sec-WebSocket-Version: 13\r\n\r\n').encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            buf += self.s.recv(1)
        self.id = 0
        self.events = []

    def _recv_exact(self, n):
        data = b''
        while len(data) < n:
            chunk = self.s.recv(n - len(data))
            if not chunk:
                raise ConnectionError('DevTools connection closed')
            data += chunk
        return data

    def recv(self):
        msg = b''
        while True:
            b1, b2 = self._recv_exact(2)
            n = b2 & 127
            if n == 126:
                n = struct.unpack('>H', self._recv_exact(2))[0]
            elif n == 127:
                n = struct.unpack('>Q', self._recv_exact(8))[0]
            msg += self._recv_exact(n)
            if b1 & 0x80:
                return json.loads(msg)

    def send(self, method, **params):
        self.id += 1
        payload = json.dumps({'id': self.id, 'method': method, 'params': params}).encode()
        header = bytes([0x81])
        mask = os.urandom(4)
        n = len(payload)
        if n < 126:
            header += bytes([0x80 | n])
        elif n < 65536:
            header += bytes([0x80 | 126]) + struct.pack('>H', n)
        else:
            header += bytes([0x80 | 127]) + struct.pack('>Q', n)
        self.s.sendall(header + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))
        while True:
            m = self.recv()
            if m.get('id') == self.id:
                if 'error' in m:
                    raise RuntimeError(m['error'])
                return m.get('result', {})
            self.events.append(m)


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def _free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class Session:
    """A local server for the repository root plus one headless Chrome tab."""

    def __init__(self, gpu=True, chrome=None, profile=None):
        self.port = _free_port()
        handler = functools.partial(_Quiet, directory=REPO)
        self.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', self.port), handler)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        chrome = chrome or os.environ.get('CHROME') or DEFAULT_CHROME
        debug = _free_port()
        # A persistent profile keeps the downloaded segmentation model cached.
        profile = profile or os.path.join(REPO, 'tools', 'studio', 'work', '.chrome-profile')
        flags = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] if gpu else []
        self.proc = subprocess.Popen([chrome, '--headless=new', f'--remote-debugging-port={debug}', *flags,
                                      '--user-data-dir=' + profile, 'about:blank'],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        page = None
        for _ in range(100):
            try:
                page = next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{debug}/json')) if t['type'] == 'page')
                break
            except Exception:
                time.sleep(0.2)
        if not page:
            self.close()
            raise RuntimeError('Chrome did not start (set CHROME to chrome.exe)')
        self.ws = WS(page['webSocketDebuggerUrl'])
        self.ws.send('Runtime.enable')
        self.ws.send('Page.enable')
        self.ws.send('Page.navigate', url=f'http://127.0.0.1:{self.port}/tools/studio/page.html')
        time.sleep(1)

    def run(self, module, args):
        """Run tools/studio/js/<module>.js with args; return its result (a dict)."""
        expr = f"import('/tools/studio/js/{module}.js?t={time.time()}').then(m => m.default({json.dumps(args)}))"
        r = self.ws.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        for e in self.ws.events:
            if e.get('method') == 'Runtime.consoleAPICalled':
                print('  console:', ' '.join(str(a.get('value', a.get('description', ''))) for a in e['params']['args'])[:300])
        self.ws.events.clear()
        if 'exceptionDetails' in r:
            raise RuntimeError(json.dumps(r['exceptionDetails'])[:1500])
        return r['result'].get('value') or {}

    def close(self):
        try:
            self.proc.kill()
        finally:
            self.httpd.shutdown()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


def save_outputs(result, out_dir, quiet=False):
    """Write data: URL values as files in out_dir; return the other values."""
    os.makedirs(out_dir, exist_ok=True)
    rest = {}
    for k, v in result.items():
        if isinstance(v, str) and v.startswith('data:'):
            path = os.path.join(out_dir, k)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'wb') as f:
                f.write(base64.b64decode(v.split(',', 1)[1]))
            if not quiet:
                print(f'  wrote {os.path.relpath(path, REPO)} ({os.path.getsize(path) // 1024} KB)')
        else:
            rest[k] = v
    return rest
