# H.E.R.M.E.S whiteboard

A hand-copyable whiteboard write-up of the latest H.E.R.M.E.S system: the wireless pod vest, the desk dock, XIAO nRF52840 BLE gloves and hub,
and the ROS 2 side unchanged. It is laid out for a **170 × 120 cm landscape** whiteboard.

**Live site:** https://saleh-abd-elrahman.github.io/hermes-whiteboard/ (GitHub Pages, built from `main` at the repo root; `index.html` is the landing page).

## Open these

| File | What |
|---|---|
| `dist/hermes_board.html` / `.pdf` | the digital whiteboard (hand-drawn style, offline, 1:2 scale PDF) |
| `dist/board_map.html` / `.pdf` | the board map: panels to scale, sizes and positions in cm, drawing order |
| `dist/board_panels.pdf` | one page per panel, to hold while drawing |
| `sources/current_mapping_fix-gesture-bugs.md` | the current gesture table, generated from the fix/gesture-bugs branch (panel G) |
| `DRAWING_GUIDE.md` / `dist/DRAWING_GUIDE.pdf` | panel by panel, what to draw in which order and colour; sources and the [VERIFY] list |

Marker code: black = structure · blue = data / radio · red = power · green = magnets / mechanical.

## Rebuild

```bash
python3 tools/build.py        # STL -> outlines -> HTML -> PDFs + PNG previews
```

- `tools/extract_views.py` reads (never writes) `~/Desktop/haptic-vest/stl`, `src/` and the H.E.R.M.E.S glove enclosure STLs.
  It turns them into simplified silhouettes and sections in `build/geometry.js`, and prints the line count of each view.
- `src/board.js` draws every panel with rough.js (1 SVG unit = 1 mm on the real board).
- Needs Python with numpy, scipy, scikit-image, pillow and shapely, plus Google Chrome for the PDFs.
- Everything is vendored in `vendor/`: rough.js 4.6.6 (MIT), the Patrick Hand font (OFL) and marked 15.0.12 (MIT).
