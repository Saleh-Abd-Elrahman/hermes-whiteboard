#!/usr/bin/env python3
"""Turn the real STL meshes into hand-drawable outlines for the whiteboard.

Reads (never writes) ~/Desktop/haptic-vest (stl/, src/) and the H.E.R.M.E.S glove enclosures.
Writes build/geometry.js  (window.GEOM = {...}) and prints the line count of every view.

Views:  silhouette = triangles projected on a plane, rasterised, outer contour, Douglas-Peucker simplified.
        section    = mesh sliced by a plane, rings polygonised (shapely), simplified; round rings become circles.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from skimage.measure import find_contours, approximate_polygon
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize, unary_union

HV = Path.home() / 'Desktop/haptic-vest'
HE = Path.home() / 'Desktop/H.E.R.M.E.S Project/hardware/enclosure'
OUT = Path(__file__).resolve().parent.parent / 'build'
sys.path.insert(0, str(HV / 'src'))
import cad3, cad_dock   # noqa: E402  (constants + slot transforms only)


def load(p):
    d = open(p, 'rb').read()
    n = int(np.frombuffer(d[80:84], '<u4')[0])
    a = np.frombuffer(d[84:84 + 50 * n], dtype=np.dtype([('n', '<3f4'), ('v', '<9f4'), ('a', '<u2')]))
    return a['v'].reshape(-1, 3, 3).astype(np.float64)


def circle_of(pts):
    c = pts.mean(0); r = np.hypot(*(pts - c).T)
    if len(pts) >= 10 and r.std() / r.mean() < 0.04:
        return [round(c[0], 2), round(c[1], 2), round(r.mean(), 2)]
    return None


def silhouette(tris, ax, tol, res=0.1):
    """Outer outline of the projection on axes ax=(i, j). Returns list of rings in mm."""
    p = tris[:, :, ax]
    lo = p.reshape(-1, 2).min(0) - 1; hi = p.reshape(-1, 2).max(0) + 1
    W, H = ((hi - lo) / res).astype(int) + 1
    img = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(img)
    q = (p - lo) / res
    for t in q:
        dr.polygon([tuple(v) for v in t], fill=255, outline=255)
    a = np.asarray(img) > 0
    rings = []
    for c in find_contours(a.astype(float), 0.5):
        mm = c[:, ::-1] * res + lo
        if Polygon(mm).area < 4:          # drop specks
            continue
        rings.append(mm)
    rings.sort(key=lambda r: -Polygon(r).area)
    return [simplify(rings[0], tol)]      # outer outline only: a silhouette has no holes worth drawing


def simplify(ring, tol):
    c = circle_of(ring)
    if c:
        return {'circle': c}
    s = approximate_polygon(np.asarray(ring), tol)
    return {'poly': np.round(s, 2).tolist()}


def section(tris, origin, ex, ey, ez, tol, min_area=0.5, clip=None):
    """Slice by the plane through origin with normal ez; return rings in (ex, ey) coords."""
    o = np.asarray(origin, float)
    loc = np.stack([(tris - o) @ ex, (tris - o) @ ey, (tris - o) @ ez], -1)
    segs = []
    for t in loc:
        d = t[:, 2]
        if d.min() > 0 or d.max() < 0:
            continue
        pts = []
        for i, j in ((0, 1), (1, 2), (2, 0)):
            a, b = t[i], t[j]
            if (a[2] > 0) != (b[2] > 0):
                if tuple(a) > tuple(b):     # canonical edge order -> identical points on shared edges
                    a, b = b, a
                k = a[2] / (a[2] - b[2])
                pts.append(tuple(np.round(a[:2] + k * (b[:2] - a[:2]), 5)))
        if len(pts) == 2 and pts[0] != pts[1]:
            segs.append(LineString(pts))
    polys = list(polygonize(unary_union(segs)))
    if clip:                                  # (x0, y0, x1, y1): keep only this window
        from shapely.geometry import box as _box
        win = _box(*clip); cl = []
        for pg in polys:
            g = pg.intersection(win)
            cl += [q for q in getattr(g, 'geoms', [g]) if q.geom_type == 'Polygon']
        polys = cl
    rings = {}
    for pg in polys:
        if pg.area < min_area:
            continue
        key = tuple(np.round(pg.exterior.coords[0], 2))
        rings[key] = np.asarray(pg.exterior.coords)
    out = [simplify(r, tol) for r in sorted(rings.values(), key=lambda r: -Polygon(r).area)]
    return out


def bbox(tris, ax):
    v = tris.reshape(-1, 3)[:, ax]
    return np.round(v.min(0), 2).tolist() + np.round(v.max(0), 2).tolist()


def count(shapes):
    n = 0
    for s in shapes:
        n += 1 if 'circle' in s else len(s['poly']) - 1
    return n


G = {}
X, Y, Z = 0, 1, 2

# ---------------------------------------------------------------- pod (base + lid, assembled frame)
pb, pl = load(HV / 'stl/pod_gem_base.stl'), load(HV / 'stl/pod_gem_lid.stl')
pod = np.concatenate([pb, pl])
I = np.eye(3)
G['pod'] = {
    'bbox': bbox(pod, [0, 1, 2]),
    'top': silhouette(pod, (X, Y), 0.4),
    'front': silhouette(pod, (X, Z), 0.3),          # looking along +y: x right, z up
    'side': silhouette(pod, (Y, Z), 0.3),           # looking along -x: y right, z up
    # bottom face features: slice the base 0.05 above the bottom (magnet pocket, pad holes, key groove)
    'bottom': section(pb, (0, 0, 0.3), I[0], -I[1], I[2], 0.3),
    # long section through pads + magnet (y = 0), base and lid separately
    'sec_base': section(pb, (0, 0, 0), I[0], I[2], -I[1], 0.25),
    'sec_lid': section(pl, (0, 0, 0), I[0], I[2], -I[1], 0.25),
}

# internal stack (z ranges straight from cad3's derived constants)
c = cad3
G['pod']['stack'] = [
    # name, z0, z1, x0, x1, colour key
    ['floor (base)', 0.0, c.FLOOR, -24.0, 24.0, 'k'],
    ['foam tape 0.3', c.FLOOR, c.BAT_Z0, -c.BAT_L / 2, c.BAT_L / 2, 'k'],
    ['LiPo 150 mAh', c.BAT_Z0, c.BAT_Z0 + c.BAT_T, -c.BAT_L / 2, c.BAT_L / 2, 'r'],
    ['swell gap 0.4', c.BAT_Z0 + c.BAT_T, c.BP_Z0, -c.BAT_L / 2, c.BAT_L / 2, 'k'],
    ['backpack PCB', c.BP_Z0, c.BP_Z1, -c.BP_L / 2, c.BP_L / 2, 'k'],
    ['XIAO nRF52840', c.XIAO_Z0, c.XIAO_Z1, c.XIAO_X - c.XIAO_L / 2, c.XIAO_X + c.XIAO_L / 2, 'b'],
    ['motor 10x3', c.ZT - c.MOTOR_T, c.ZT, c.MOTOR_X - c.MOTOR_R, c.MOTOR_X + c.MOTOR_R, 'g'],
    ['lid top', c.POD_H, c.POD_H, -26.0, 26.0, 'k'],
]
G['pod']['consts'] = dict(
    FLOOR=c.FLOOR, SPLIT=c.SPLIT, WALL=c.WALL, POD_H=c.POD_H, KEY_X=c.KEY_X, CONTACT_X=c.CONTACT_X,
    MAG_D=c.MAG_POCKET_D, MAG_DEPTH=c.MAG_POCKET_DEPTH, BP=[c.BP_L, c.BP_W, c.BACKPACK_T],
    BAT=[c.BAT_L, c.BAT_W, c.BAT_T], XIAO=[c.XIAO_L, c.XIAO_W, c.XIAO_PCB_T, c.XIAO_X],
    MOTOR=[c.MOTOR_D, c.MOTOR_T, c.MOTOR_X, c.ZT], FIT=c.FIT, SNAP_H=c.SNAP_H, LIP_H=c.LIP_H,
)

# ---------------------------------------------------------------- dock
dk = load(HV / 'stl/dock_deskbar.stl')
_, slots, _ = cad_dock.deskbar()
o0, R = slots[0]
R = np.asarray(R)
ex, ey, ez = R[:, 0], R[:, 1], R[:, 2]       # slot frame axes (u = pod long axis, w = up out of the pocket)
D = cad_dock
G['dock'] = {
    'bbox': bbox(dk, [0, 1, 2]),
    'top': silhouette(dk, (X, Y), 0.6),
    'front': silhouette(dk, (X, Z), 0.6),
    'side': silhouette(dk, (Y, Z), 0.4),
    # plan of the tilted top face, cut 1 mm under the surface: bar outline + 6 gem pockets
    'face': section(dk, np.asarray(o0) + ez * 5.0, I[0] @ np.eye(3), np.cross(ez, I[0]), ez, 0.4),
    # one pocket, cut along the pod axis (v = 0): floor skin, magnet pocket, pogo holes, key rib
    'pocket_sec': section(dk, o0, ex, ez, ey, 0.15, min_area=0.2, clip=(-30, -11, 30, 7)),
    # pocket plan in the slot frame: just above the floor (gem outline + key rib), and 2 below it (magnet + pogo holes)
    'pocket_plan': section(dk, np.asarray(o0) + ez * 0.3, ex, ey, ez, 0.2, min_area=0.2, clip=(-32, -22, 32, 22)),
    'pocket_below': section(dk, np.asarray(o0) - ez * 2.0, ex, ey, ez, 0.2, min_area=0.2, clip=(-32, -22, 32, 22)),
    'slots': [[round(float(np.asarray(o)[0]), 2), round(float(np.asarray(o)[1]), 2), round(float(np.asarray(o)[2]), 2)] for o, _ in slots],
    'tilt_deg': round(float(np.degrees(np.arctan2(R[1, 2] * -1, R[2, 2]))), 1),
}
# face section uses ex' = dock x, ey' = up the slope within the face plane
G['dock']['consts'] = dict(
    POCKET_D=D.POCKET_D, KEY_RIB_H=D.KEY_RIB_H, BOARD_DEPTH=D.BOARD_DEPTH, BT=1.6, BOARD=30.0,
    POGO_PROUD=D.POGO_TIP_PROUD, POGO_TRAVEL=D.POGO_TRAVEL, POGO_HOLE_D=round(D.POGO_HOLE_D, 2),
    MAG_SKIN=D.MAG_SKIN, CONTACT_X=c.CONTACT_X, PITCH=37.0, WALL=D.WALL, CLEAR=D.CLEAR,
)
# pod section placed in the pocket (pod frame == slot frame when seated)
# underside: shell walls + USB ledge cut 1.5 above the desk, pin boards / screws / pogo pins projected onto the desk (dock x, y)
import deskbar2 as DB2
G['dock']['under'] = section(dk, (0, 0, 1.5), I[0], I[1], I[2], 0.4)
pb_, m2_, pg_ = [], [], []
for o, Rm in slots:
    o, Rm = np.asarray(o), np.asarray(Rm)
    to_dock = lambda u, v, w: (o + Rm @ np.array([u, v, w]))[:2].round(2).tolist()
    wb = -D.BOARD_DEPTH - 0.8
    pb_.append([to_dock(u, v, wb) for u, v in ((-15, -15), (15, -15), (15, 15), (-15, 15))])
    m2_ += [to_dock(0, s * DB2.SCREW_V, wb) for s in (-1, 1)]
    pg_ += [to_dock(s * c.CONTACT_X, 0, wb) for s in (-1, 1)]
U = DB2.USB
G['dock']['pinboards'], G['dock']['m2'], G['dock']['pogo'] = pb_, m2_, pg_
G['dock']['usb'] = {'board': [-U['L'] / 2, DB2.WALL_IN - U['W'], U['L'] / 2, DB2.WALL_IN],
                    'holes': [[hx, DB2.WALL_IN + hy] for hx, hy in U['holes']],
                    'ledge': [-DB2.LEDGE_HX, DB2.LEDGE_Y0, DB2.LEDGE_HX, DB2.WALL_IN]}
G['dock']['pod_low'] = section(pb, (0, 0, 0), I[0], I[2], -I[1], 0.25, clip=(-30, -1, 30, 6.5))

# ---------------------------------------------------------------- vest mount
vm = load(HV / 'stl/vest_mount_gem.stl')
G['mount'] = {
    'bbox': bbox(vm, [0, 1, 2]),
    'top': silhouette(vm, (X, Y), 0.5),
    'front': silhouette(vm, (X, Z), 0.3),
    'side': silhouette(vm, (Y, Z), 0.3),
    'face': section(vm, (0, 0, 1.5), I[0], I[1], I[2], 0.4),    # base plate: magnet pocket, strap slots, sewing holes
    'rim': section(vm, (0, 0, 5.0), I[0], I[1], I[2], 0.4),     # pocket wall: gem outline, key rib, thumb notch
}

# ---------------------------------------------------------------- gloves (square v1 carrier enclosures)
for side, h in (('left', 'pod_v1_left'), ('right', 'pod_v1_right')):
    b, l = load(HE / f'{h}_base.stl'), load(HE / f'{h}_lid.stl')
    t = np.concatenate([b, l])
    G[f'glove_{side}'] = {
        'bbox': bbox(t, [0, 1, 2]),
        'top': silhouette(t, (X, Y), 0.5),
        'front': silhouette(t, (X, Z), 0.4),
        'side': silhouette(t, (Y, Z), 0.4),
    }

OUT.mkdir(exist_ok=True)
(OUT / 'geometry.js').write_text('window.GEOM = ' + json.dumps(G) + ';\n')
for k, v in G.items():
    print(k, 'bbox', v['bbox'], ' '.join(f'{n}:{count(s)}' for n, s in v.items()
                                         if isinstance(s, list) and s and isinstance(s[0], dict)))
