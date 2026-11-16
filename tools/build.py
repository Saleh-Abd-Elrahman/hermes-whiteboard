#!/usr/bin/env python3
"""Build everything: geometry -> self-contained HTML pages -> PDFs + PNG previews (headless Chrome).

    python3 tools/build.py            # all
    python3 tools/build.py --no-geom  # skip the STL extraction
"""
import base64, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if '--no-geom' not in sys.argv:
    subprocess.run([sys.executable, str(ROOT / 'tools/extract_views.py')], check=True)

font = base64.b64encode((ROOT / 'vendor/patrick-hand-400.woff2').read_bytes()).decode()
rough = (ROOT / 'vendor/rough-4.6.6.js').read_text()
geom = (ROOT / 'build/geometry.js').read_text()
board = (ROOT / 'src/board.js').read_text()

PAGES = {   # file: (mode, @page size, title)
    'hermes_board.html': ('board', '600mm 850mm', 'HERMES whiteboard'),
    'board_map.html': ('map', '400mm 566.7mm', 'HERMES board map'),
    'board_panels.html': ('panels', '297mm 210mm', 'HERMES board panels'),
}
CSS = """
@font-face { font-family: 'Patrick Hand'; src: url(data:font/woff2;base64,%s) format('woff2'); }
:root { color-scheme: light; }
html, body { margin: 0; background: #fff; }
svg { font-family: 'Patrick Hand', 'Comic Sans MS', cursive; display: block; }
body.board svg, body.map svg { max-width: 100%%; height: auto; }
.page { width: 297mm; height: 210mm; display: flex; align-items: center; justify-content: center; page-break-after: always; }
@page { size: %s; margin: 0; }
"""
DIST.mkdir(exist_ok=True)
for name, (mode, size, title) in PAGES.items():
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><style>{CSS % (font, size)}</style></head>
<body><div id="root"></div>
<script>window.MODE = {mode!r};</script>
<script>{rough}</script>
<script>{geom}</script>
<script>{board}</script>
</body></html>"""
    (DIST / name).write_text(html)

# drawing guide: markdown -> html with the vendored marked
md = (ROOT / 'DRAWING_GUIDE.md').read_text()
marked = (ROOT / 'vendor/marked-15.0.12.umd.js').read_text()
guide = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Drawing guide</title>
<style>
@page {{ size: A4; margin: 16mm 15mm; }}
body {{ font: 11pt/1.45 -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1e1e1e; max-width: 180mm; margin: 0 auto; }}
h1 {{ font-size: 20pt; }} h2 {{ font-size: 14pt; margin-top: 1.4em; page-break-after: avoid; border-bottom: 1px solid #ccc; }}
h3 {{ font-size: 11.5pt; page-break-after: avoid; }}
table {{ border-collapse: collapse; margin: .5em 0; }} td, th {{ border: 1px solid #bbb; padding: 2px 6px; vertical-align: top; }}
code {{ font-size: 9.5pt; background: #f3f3f3; padding: 0 2px; }} li {{ margin: 2px 0; }}
.k {{ color: #1e1e1e; font-weight: bold; }} .b {{ color: #1864ab; font-weight: bold; }}
.r {{ color: #c92a2a; font-weight: bold; }} .g {{ color: #2b8a3e; font-weight: bold; }}
</style></head><body><div id="c"></div>
<script>{marked}</script>
<script>document.getElementById('c').innerHTML = marked.parse({md!r});</script>
</body></html>"""
(DIST / 'drawing_guide.html').write_text(guide)


def chrome(*args):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--hide-scrollbars',
                    '--virtual-time-budget=8000', *args], check=True, capture_output=True)


for src, pdf in (('hermes_board.html', 'hermes_board.pdf'), ('board_map.html', 'board_map.pdf'),
                 ('board_panels.html', 'board_panels.pdf'), ('drawing_guide.html', 'DRAWING_GUIDE.pdf')):
    chrome(f'--print-to-pdf={DIST / pdf}', (DIST / src).as_uri())
    print('wrote', pdf)
# PNG previews for checking by eye (board is 1200 x 1700 units -> 2400 x 3400 px)
chrome('--window-size=2268,3213', f'--screenshot={DIST / "hermes_board.png"}', (DIST / 'hermes_board.html').as_uri())
chrome('--window-size=1512,2142', f'--screenshot={DIST / "board_map.png"}', (DIST / 'board_map.html').as_uri())
print('wrote previews')
