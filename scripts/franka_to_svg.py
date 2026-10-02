#!/usr/bin/env python3
"""Convert the Franka Research 3 URDF, with a Robotiq 2F-85 gripper on the flange,
into an animatable side-view line drawing.

The arm comes from franka_description (Apache 2.0, Franka Robotics GmbH):
    git clone https://github.com/frankaemika/franka_description.git
The gripper comes from robotiq_description (BSD 3-Clause, PickNik Robotics):
    git clone https://github.com/PickNikRobotics/ros2_robotiq_gripper.git

Joints 1, 3, 5, 7 are frozen so the whole arm lies in the world XZ plane; joints
2, 4, 6 then all rotate about the world Y axis, which is the camera axis. Seen
from the side, every link is therefore a rigid 2D shape that only rotates about
its joint pivot, so one projected drawing per link is exact for every pose. The
gripper is mounted so its finger linkage turns about the same axis.

Outputs
    <out>.svg   one <g id="linkN"> per link, nested in kinematic order
    <out>.json  pivots, axis signs, joint limits, keyframes, scene geometry
    <out>.html  standalone page: the SVG, the JSON and armAnimation.js inlined, GSAP from a CDN

Usage
    pip install xacro trimesh pycollada numpy shapely scipy
    python scripts/franka_to_svg.py \\
        --franka-description /path/to/franka_description \\
        --robotiq-description /path/to/ros2_robotiq_gripper/robotiq_description
"""

import argparse
import json
import math
import os
import xml.etree.ElementTree as ET

import numpy as np
import trimesh
import xacro
import xacro.substitution_args
from scipy.optimize import brentq, least_squares
from shapely.geometry import LineString, MultiLineString, Polygon
from shapely.ops import linemerge, unary_union

# ---------- tunables ----------

WIDTH_PX = 1000
X_MIN, X_MAX = -0.36, 0.92  # world metres in view; +x points left on screen
Z_PAD_TOP = 0.05  # metres of air above the highest pose
GROUND_PAD_PX = 26  # room under the ground line

CREASE_DEG = 28.0  # dihedral angle above which an edge is drawn
SIMPLIFY_PX = 0.5  # Douglas-Peucker tolerance
MIN_DETAIL_PX = 9.0  # drop detail polylines shorter than this
MAX_BYTES = 150_000
ZBUF_SS = 3  # depth-buffer pixels per output pixel
ZBUF_EPS = 0.004  # metres of slack in the visibility test

# Stroke widths in screen pixels (they do not scale with the drawing).
W_OUTLINE, W_DETAIL = 1.7, 0.55  # silhouettes, and the lines inside them
W_FINE_OUTLINE, W_FINE_DETAIL = 0.95, 0.45  # the gripper's small parts
W_ACCENT = 2.0

BG = '#000000'
INK = '#FFFFFF'
ACCENT = '#FF6A00'
STOP = '#FF3B30'  # the base light while the animation is held under the pointer

# Fixed joints. With joint 7 at 0 and the gripper mounted square on the flange,
# the finger linkage turns about the camera axis, so it opens in the view plane.
FIXED = {'joint1': 0.0, 'joint3': 0.0, 'joint5': 0.0, 'joint7': 0.0}
MOUNT_RPY = '0 0 0'  # gripper base relative to the flange (fr3_link8)
# Neutral pose for the animated joints (the usual Franka "ready" pose), gripper open.
# 'gripper' is the Robotiq knuckle joint: 0 is fully open, 0.8 rad fully closed.
NEUTRAL = {'joint2': -math.pi / 4, 'joint4': -3 * math.pi / 4, 'joint6': math.pi / 2, 'gripper': 0.0}
ANIMATED = ['joint2', 'joint4', 'joint6']

FLANGE = 'fr3_link8'
GRIPPER_BASE = 'robotiq_85_base_link'
GRIPPER_JOINT = 'robotiq_85_left_knuckle_joint'  # every other gripper joint mimics this one
TIP_LINKS = ['robotiq_85_left_finger_tip_link', 'robotiq_85_right_finger_tip_link']

# Links drawn, in kinematic order, with the id each gets in the SVG.
LINK_IDS = {
    'fr3_link0': 'link0', 'fr3_link1': 'link1', 'fr3_link2': 'link2', 'fr3_link3': 'link3',
    'fr3_link4': 'link4', 'fr3_link5': 'link5', 'fr3_link6': 'link6', 'fr3_link7': 'link7',
    GRIPPER_BASE: 'hand',
    'robotiq_85_left_inner_knuckle_link': 'inner-knuckle-left',
    'robotiq_85_right_inner_knuckle_link': 'inner-knuckle-right',
    'robotiq_85_left_knuckle_link': 'knuckle-left',
    'robotiq_85_right_knuckle_link': 'knuckle-right',
    'robotiq_85_left_finger_link': 'finger-left',
    'robotiq_85_right_finger_link': 'finger-right',
    'robotiq_85_left_finger_tip_link': 'tip-left',
    'robotiq_85_right_finger_tip_link': 'tip-right',
}
# Children that should be drawn underneath their parent's outline instead of on top.
UNDER_PARENT = {'link1', 'link3', 'link5'}

# Scene, metres: PC A is a tower on the left, PC B a small box between it and the robot.
# B carries a grip tab, since the gripper only opens to 85 mm.
PC_W = 0.20
PC_A_H, PC_B_H = 0.36, 0.10
PC_A_X, PC_B_X = 0.62, 0.38  # centres
TAB_W, TAB_H = 0.044, 0.034
BASE_LIGHT = (-0.10, 0.034)  # status light on the robot's base: world x, z


# ---------- URDF ----------

def load_urdf(pkgs):
    """Run xacro without ROS and bolt the gripper onto the arm's flange.

    pkgs maps ROS package names to checkouts, so $(find <package>) resolves.
    """
    xacro.substitution_args._eval_find = lambda name: pkgs[name]
    arm = ET.fromstring(xacro.process_file(
        os.path.join(pkgs['franka_description'], 'robots', 'fr3', 'fr3.urdf.xacro'),
        mappings={'hand': 'false'},
    ).toxml())
    gripper = ET.fromstring(xacro.process_file(
        os.path.join(pkgs['robotiq_description'], 'urdf', 'robotiq_2f_85_gripper.urdf.xacro'),
    ).toxml())
    for el in gripper:
        if el.tag == 'link' and el.get('name') != 'world':
            arm.append(el)
        elif el.tag == 'joint':
            if el.find('parent').get('link') == 'world':  # the gripper's mounting joint
                el.find('parent').set('link', FLANGE)
                el.find('origin').set('rpy', MOUNT_RPY)
            arm.append(el)
    return arm


def rpy_matrix(xyz, rpy):
    r, p, y = rpy
    cr, sr, cp, sp, cy, sy = math.cos(r), math.sin(r), math.cos(p), math.sin(p), math.cos(y), math.sin(y)
    T = np.eye(4)
    T[:3, :3] = [
        [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
        [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
        [-sp, cp * sr, cp * cr],
    ]
    T[:3, 3] = xyz
    return T


def origin_of(el):
    o = el.find('origin')
    if o is None:
        return np.eye(4)
    xyz = [float(v) for v in o.get('xyz', '0 0 0').split()]
    rpy = [float(v) for v in o.get('rpy', '0 0 0').split()]
    return rpy_matrix(xyz, rpy)


class Robot:
    def __init__(self, root, pkgs):
        self.visuals = {}  # link name -> [(mesh path, origin)]
        for link in root.findall('link'):
            vis = []
            for v in link.findall('visual'):
                mesh = v.find('geometry/mesh')
                if mesh is not None:
                    path = mesh.get('filename')
                    for name, checkout in pkgs.items():
                        path = path.replace(f'package://{name}', checkout)
                    vis.append((path, origin_of(v)))
            self.visuals[link.get('name')] = vis
        self.joints = {}  # child link -> joint record
        for j in root.findall('joint'):
            axis = j.find('axis')
            limit = j.find('limit')
            mimic = j.find('mimic')
            self.joints[j.find('child').get('link')] = {
                'name': j.get('name'),
                'type': j.get('type'),
                'parent': j.find('parent').get('link'),
                'origin': origin_of(j),
                'axis': np.array([float(v) for v in axis.get('xyz').split()]) if axis is not None else None,
                'limits': [float(limit.get('lower')), float(limit.get('upper'))] if limit is not None else None,
                # (master joint, multiplier) for joints that follow another one
                'mimic': (mimic.get('joint'), float(mimic.get('multiplier', 1))) if mimic is not None else None,
            }
        self.by_name = {j['name']: j for j in self.joints.values()}
        self._meshes = {}

    def drive(self, name):
        """(key into a pose dict, multiplier) for the value that moves this joint."""
        mimic = self.by_name[name]['mimic']
        if mimic:
            key, mult = self.drive(mimic[0])
            return key, mult * mimic[1]
        return ('gripper' if name == GRIPPER_JOINT else name.replace('fr3_', '')), 1.0

    def joint_value(self, name, q):
        key, mult = self.drive(name)
        return mult * q[key]

    def fk(self, q):
        """World transform of every link, plus the world frame of every joint."""
        links, frames = {}, {}

        def solve(link):
            if link in links:
                return links[link]
            j = self.joints.get(link)
            if j is None:
                links[link] = np.eye(4)
                return links[link]
            T = solve(j['parent']) @ j['origin']
            frames[j['name']] = T.copy()
            if j['type'] in ('revolute', 'prismatic'):
                v = self.joint_value(j['name'], q)
                M = np.eye(4)
                if j['type'] == 'revolute':
                    M[:3, :3] = trimesh.transformations.rotation_matrix(v, j['axis'])[:3, :3]
                else:
                    M[:3, 3] = j['axis'] * v
                T = T @ M
            links[link] = T
            return T

        for link in self.visuals:
            solve(link)
        return links, frames

    def mesh(self, link):
        """The link's visual mesh in the link frame, vertices welded by position."""
        if link not in self._meshes:
            parts = []
            for path, origin in self.visuals[link]:
                m = trimesh.load(path, force='mesh')
                m.apply_transform(origin)
                parts.append(m)
            m = trimesh.util.concatenate(parts)
            m.merge_vertices(merge_tex=True, merge_norm=True)
            self._meshes[link] = m
        return self._meshes[link]


# ---------- camera ----------

class Camera:
    """Orthographic, at y = +inf looking along -y. Screen right = -x, up = +z."""

    def __init__(self, z_max):
        self.scale = WIDTH_PX / (X_MAX - X_MIN)
        self.z_max = z_max
        self.height = round(z_max * self.scale + GROUND_PAD_PX)

    def px(self, pts):
        pts = np.atleast_2d(pts)
        return np.column_stack([(X_MAX - pts[:, 0]) * self.scale, (self.z_max - pts[:, 2]) * self.scale])

    def point(self, x, z):
        return [(X_MAX - x) * self.scale, (self.z_max - z) * self.scale]


# ---------- per-link drawing ----------

def depth_buffer(xy, depth, faces):
    """Nearest depth per pixel over the link's own triangles."""
    lo = np.floor(xy.min(axis=0) * ZBUF_SS).astype(int) - 2
    hi = np.ceil(xy.max(axis=0) * ZBUF_SS).astype(int) + 2
    w, h = hi - lo + 1
    buf = np.full((h, w), np.inf)
    P = xy * ZBUF_SS - lo
    for f in faces:
        a, b, c = P[f]
        x0, x1 = int(min(a[0], b[0], c[0])), int(max(a[0], b[0], c[0])) + 1
        y0, y1 = int(min(a[1], b[1], c[1])), int(max(a[1], b[1], c[1])) + 1
        den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(den) < 1e-12:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / den
        w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / den
        w2 = 1 - w0 - w1
        inside = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
        d = w0 * depth[f[0]] + w1 * depth[f[1]] + w2 * depth[f[2]]
        region = buf[y0:y1 + 1, x0:x1 + 1]
        np.minimum(region, np.where(inside, d, np.inf), out=region)
    return buf, lo


def visible(points, depths, buf, lo):
    """True where a point is not hidden behind a nearer part of the same link."""
    ij = np.floor(points * ZBUF_SS - lo).astype(int)
    h, w = buf.shape
    out = np.zeros(len(points), dtype=bool)
    for k, (i, j) in enumerate(ij):
        patch = buf[max(j - 1, 0):min(j + 2, h), max(i - 1, 0):min(i + 2, w)]
        finite = patch[np.isfinite(patch)]
        out[k] = finite.size == 0 or depths[k] <= finite.max() + ZBUF_EPS
    return out


def draw_link(mesh, T, cam):
    """Silhouette polygon and detail polylines of one link, in output pixels."""
    V = trimesh.transformations.transform_points(mesh.vertices, T)
    xy = cam.px(V)
    depth = -V[:, 1]
    faces = mesh.faces

    tris = xy[faces]
    e1, e2 = tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0]
    area = 0.5 * np.abs(e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0])
    silhouette = unary_union([Polygon(t) for t in tris[area > 1e-4]]).buffer(0.3).buffer(-0.3)

    # Edges worth drawing: sharp creases, and contours where the surface turns away.
    normals = (T[:3, :3] @ mesh.face_normals.T).T
    front = normals[:, 1] > 0
    pairs = mesh.face_adjacency
    fa, fb = front[pairs[:, 0]], front[pairs[:, 1]]
    crease = (mesh.face_adjacency_angles > math.radians(CREASE_DEG)) & (fa | fb)
    contour = fa != fb
    edges = mesh.face_adjacency_edges[crease | contour]

    buf, lo = depth_buffer(xy, depth, faces)
    keep = np.ones(len(edges), dtype=bool)
    for t in (0.2, 0.5, 0.8):
        p = xy[edges[:, 0]] * (1 - t) + xy[edges[:, 1]] * t
        d = depth[edges[:, 0]] * (1 - t) + depth[edges[:, 1]] * t
        keep &= visible(p, d, buf, lo)
    edges = edges[keep]

    segs = np.round(np.stack([xy[edges[:, 0]], xy[edges[:, 1]]], axis=1), 2)
    segs = [s for s in segs if not np.allclose(s[0], s[1])]
    details = []
    if segs:
        merged = linemerge(MultiLineString([LineString(s) for s in segs]))
        # The outline already draws the rim, so cut detail lines that run along it.
        inside = merged.difference(silhouette.boundary.buffer(1.4))
        for line in getattr(inside, 'geoms', [inside]):
            if isinstance(line, LineString) and not line.is_empty:
                details.append(line)
    return silhouette, details


def finish(silhouette, details, simplify_px, min_px):
    sil = silhouette.simplify(simplify_px)
    polys = [p for p in getattr(sil, 'geoms', [sil]) if p.area > 30]
    lines = [ln.simplify(simplify_px) for ln in details]
    lines = [ln for ln in lines if ln.length >= min_px]
    return polys, lines


def fmt(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def ring_path(coords):
    pts = list(coords)[:-1]
    return 'M' + 'L'.join(f'{fmt(x)},{fmt(y)}' for x, y in pts) + 'Z'


def link_markup(polys, lines, fine=False):
    cls = ' fine' if fine else ''  # small parts get lighter lines
    d = ''.join(
        ring_path(p.exterior.coords) + ''.join(ring_path(r.coords) for r in p.interiors if Polygon(r).area > 20)
        for p in polys
    )
    out = [f'<path class="sil{cls}" d="{d}"/>']
    if lines:
        dd = ''.join('M' + 'L'.join(f'{fmt(x)},{fmt(y)}' for x, y in ln.coords) for ln in lines)
        out.append(f'<path class="det{cls}" d="{dd}"/>')
    return out


# ---------- keyframes ----------

def gripper_geometry(robot):
    """Knuckle angle that closes the pads onto the tab, and how far the TCP sits along the gripper axis."""

    def tips(angle):
        links, _ = robot.fk({**FIXED, **NEUTRAL, 'gripper': angle})
        inv = np.linalg.inv(links[GRIPPER_BASE])
        return [
            trimesh.transformations.transform_points(robot.mesh(link).vertices, inv @ links[link])
            for link in TIP_LINKS
        ]

    def gap(angle):
        a, b = tips(angle)
        lo, hi = (a, b) if a[:, 0].mean() < b[:, 0].mean() else (b, a)
        return hi[:, 0].min() - lo[:, 0].max()

    closed = brentq(lambda angle: gap(angle) - TAB_W, 0.0, 0.8)
    # The fingertips swing along the axis as they close; keep them clear of the box in both states.
    tip_end = max(v[:, 2].max() for angle in (NEUTRAL['gripper'], closed) for v in tips(angle))
    print(f'gripper: opens to {gap(0.0) * 1000:.1f} mm, holds the {TAB_W * 1000:.0f} mm tab at {closed:.3f} rad')
    return closed, tip_end - TAB_H / 2 + 0.004  # fingertips stop 4 mm above the box


def tcp_pose(robot, q):
    links, _ = robot.fk({**FIXED, **q})
    T = links[GRIPPER_BASE]
    p = T @ [0, 0, robot.tcp_depth, 1]
    return p[0], p[2], T[:3, 2]  # x, z, approach direction


def solve_pose(robot, x, z, gripper, guess):
    """Joint angles 2, 4, 6 that put the TCP at (x, z) with the hand pointing straight down."""
    limits = [robot.joints[f'fr3_link{n}']['limits'] for n in (2, 4, 6)]

    def residual(v):
        q = dict(zip(ANIMATED, v), gripper=gripper)
        px, pz, approach = tcp_pose(robot, q)
        return [px - x, pz - z, 0.2 * approach[0], 0.2 * (approach[2] + 1)]

    sol = least_squares(
        residual, [guess[j] for j in ANIMATED],
        bounds=([lo for lo, _ in limits], [hi for _, hi in limits]),
    )
    if np.abs(sol.fun[:2]).max() > 1e-4:
        raise SystemExit(f'pose ({x}, {z}) is out of reach, error {sol.fun}')
    return dict(zip(ANIMATED, (float(a) for a in sol.x)), gripper=gripper)


def make_keyframes(robot):
    grip_z = PC_B_H + TAB_H / 2  # TCP height when holding B's tab on the ground
    stack_z = grip_z + PC_A_H  # the same, with B sitting on A
    op, cl = NEUTRAL['gripper'], robot.grip_angle
    plan = [
        ('reach', PC_B_X, grip_z + 0.10, op),
        ('grip', PC_B_X, grip_z, op),
        ('gripClosed', PC_B_X, grip_z, cl),
        ('raise', PC_B_X - 0.03, grip_z + 0.22, cl),  # straight up first, so B does not swing into A
        ('lift', PC_B_X - 0.02, stack_z + 0.06, cl),  # high enough to clear the top of A
        ('aboveA', PC_A_X, stack_z + 0.06, cl),
        ('stack', PC_A_X, stack_z, cl),
        ('release', PC_A_X, stack_z, op),
        ('retreat', PC_A_X, stack_z + 0.06, op),
    ]
    frames = [('neutral', dict(NEUTRAL))]
    guess = NEUTRAL
    for name, x, z, gripper in plan:
        guess = solve_pose(robot, x, z, gripper, guess)
        frames.append((name, guess))
    return frames


# ---------- scene ----------

def pc_markup(cam, pc_id, x_centre, height, tower, tab=False):
    """A PC seen from the front. tower: drive bays, power button, LED, vents. Otherwise a small box."""
    s = cam.scale
    x0, y0 = cam.point(x_centre + PC_W / 2, height)  # top-left corner on screen
    w, h = PC_W * s, height * s
    cx = x0 + w / 2
    f = fmt
    out = [f'<g id="{pc_id}">']
    if tab:
        tw, th = TAB_W * s, TAB_H * s
        out.append(
            f'<path class="sil" d="M{f(cx - tw / 2)},{f(y0)}v{f(-th + 4)}q0,-4 4,-4h{f(tw - 8)}q4,0 4,4v{f(th - 4)}"/>'
        )
    out.append(f'<rect class="sil" x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" rx="3"/>')
    m = 0.09 * w  # margin inside the front panel
    det = []
    if tower:
        bay_h = 0.045 * s
        for i in range(2):  # drive bays
            by = y0 + m + i * (bay_h + 0.012 * s)
            det.append(f'M{f(x0 + m)},{f(by)}h{f(w - 2 * m)}v{f(bay_h)}h{f(-(w - 2 * m))}Z')
        button = (x0 + m + 0.016 * s, y0 + m + 2 * bay_h + 0.05 * s)
        led = (button[0], button[1] + 0.034 * s)
        for i in range(9):  # vent ticks along the bottom
            vx = x0 + m + i * 0.011 * s
            det.append(f'M{f(vx)},{f(y0 + h - m)}v{f(-0.026 * s)}')
        out.append(f'<circle class="det" cx="{f(button[0])}" cy="{f(button[1])}" r="{f(0.011 * s)}"/>')
    else:
        slot_w, slot_h = 0.07 * s, 0.03 * s
        det.append(f'M{f(x0 + m)},{f(y0 + h / 2 - slot_h / 2)}h{f(slot_w)}v{f(slot_h)}h{f(-slot_w)}Z')  # display slot
        led = (x0 + m + slot_w + 0.03 * s, y0 + h / 2)
        for i in range(6):  # vent ticks on the right
            vx = x0 + w - m - i * 0.009 * s
            det.append(f'M{f(vx)},{f(y0 + h / 2 - 0.013 * s)}v{f(0.026 * s)}')
    out.append(f'<path class="det" d="{"".join(det)}"/>')
    out.append(f'<circle class="acc" id="{pc_id}-led" cx="{f(led[0])}" cy="{f(led[1])}" r="{f(0.0065 * s)}"/>')
    out.append('</g>')
    return out


# ---------- main ----------

def build(pkgs, out_base):
    robot = Robot(load_urdf(pkgs), pkgs)
    robot.grip_angle, robot.tcp_depth = gripper_geometry(robot)
    keyframes = make_keyframes(robot)

    # Canvas height: tall enough for the arm in every keyframe.
    z_top = 0.0
    for _, q in keyframes:
        links, _ = robot.fk({**FIXED, **q})
        for link in LINK_IDS:
            V = trimesh.transformations.transform_points(robot.mesh(link).vertices, links[link])
            z_top = max(z_top, V[:, 2].max())
    cam = Camera(z_top + Z_PAD_TOP)

    q0 = {**FIXED, **NEUTRAL}
    links, frames = robot.fk(q0)

    raw = {link: draw_link(robot.mesh(link), links[link], cam) for link in LINK_IDS}

    # Joint records: pivot in pixels at the neutral pose, and which way positive turns on screen.
    joints = {}
    for link, svg_id in LINK_IDS.items():
        j = robot.joints.get(link)
        if not j or j['type'] == 'fixed':
            continue
        F = frames[j['name']]
        axis = F[:3, :3] @ j['axis']
        short = j['name'].replace('fr3_', '')
        rec = {'link': svg_id, 'limits': j['limits'], 'pivot': [round(v, 2) for v in cam.px(F[:3, 3])[0]]}
        if short in FIXED:
            rec['fixedAt'] = FIXED[short]
        else:
            # Everything that moves must turn about the camera axis for the 2D rig to be exact.
            assert j['type'] == 'revolute' and abs(abs(axis[1]) - 1) < 1e-6, f'{j["name"]} leaves the view plane: {axis}'
            # The link turns by sign * multiplier * (pose[drive] - neutral[drive]) degrees on screen,
            # clockwise positive, as in SVG.
            rec['drive'], rec['multiplier'] = robot.drive(j['name'])
            rec['sign'] = -int(round(axis[1]))
        joints[short] = rec

    children = {}
    for link in LINK_IDS:
        parent = robot.joints[link]['parent'] if link in robot.joints else None
        while parent is not None and parent not in LINK_IDS:
            parent = robot.joints[parent]['parent'] if parent in robot.joints else None
        children.setdefault(parent, []).append(link)

    pivot_of = {rec['link']: rec['pivot'] for rec in joints.values()}

    def render(simplify_px, min_px):
        def group(link, depth):
            svg_id = LINK_IDS[link]
            pad = '  ' * depth
            attrs = f' data-pivot="{pivot_of[svg_id][0]},{pivot_of[svg_id][1]}"' if svg_id in pivot_of else ''
            own = link_markup(*finish(*raw[link], simplify_px, min_px), fine=link.startswith('robotiq'))
            if svg_id == 'link0':
                lx, ly = cam.point(*BASE_LIGHT)
                own.append(f'<circle class="acc" id="arm-light" cx="{fmt(lx)}" cy="{fmt(ly)}" '
                           f'r="{fmt(0.0065 * cam.scale)}"/>')
            kids = [(LINK_IDS[c], group(c, depth + 1)) for c in children.get(link, [])]
            under = [m for cid, m in kids if cid in UNDER_PARENT]
            over = [m for cid, m in kids if cid not in UNDER_PARENT]
            body = [x for m in under for x in m] + [pad + '  ' + p for p in own] + [x for m in over for x in m]
            return [f'{pad}<g id="{svg_id}"{attrs}>'] + body + [f'{pad}</g>']

        ground_y = cam.point(0, 0)[1]
        stack_dy = -PC_A_H * cam.scale
        lines = [
            f'<svg xmlns="http://www.w3.org/2000/svg" id="franka-arm" viewBox="0 0 {WIDTH_PX} {cam.height}" '
            f'width="{WIDTH_PX}" height="{cam.height}">',
            '<!-- Arm derived from franka_description (c) Franka Robotics GmbH, Apache License 2.0. '
            'Gripper derived from robotiq_description (c) PickNik Robotics, BSD 3-Clause. -->',
            '<style>',
            # Scoped to the svg id so the rules stay put when the SVG is inlined in a page.
            f'#franka-arm .sil,#franka-arm .det,#franka-arm .acc'
            f'{{vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}}',
            # Line weights: outlines, then interior detail, then the gripper's small parts.
            # --k thins everything on narrow screens, where the strokes do not scale down with the drawing.
            f'#franka-arm{{--k:1}}',
            f'@media (max-width:700px){{#franka-arm{{--k:.62}}}}',
            f'#franka-arm .sil{{fill:{BG};stroke:{INK};stroke-width:calc(var(--k)*{W_OUTLINE}px);fill-rule:evenodd}}',
            f'#franka-arm .det{{fill:none;stroke:{INK};stroke-width:calc(var(--k)*{W_DETAIL}px)}}',
            f'#franka-arm .sil.fine{{stroke-width:calc(var(--k)*{W_FINE_OUTLINE}px)}}',
            f'#franka-arm .det.fine{{stroke-width:calc(var(--k)*{W_FINE_DETAIL}px)}}',
            f'#franka-arm .acc{{fill:none;stroke:{ACCENT};stroke-width:calc(var(--k)*{W_ACCENT}px)}}',
            # Hovering pauses the animation (armAnimation.js); the base light goes from white to red while it is held.
            f'#franka-arm #arm-light{{stroke:{INK};transition:fill .2s,stroke .2s,filter .2s}}',
            f'#franka-arm:hover #arm-light{{fill:{STOP};stroke:{STOP};filter:drop-shadow(0 0 5px {STOP})}}',
            '</style>',
            f'<rect id="bg" width="{WIDTH_PX}" height="{cam.height}" fill="{BG}"/>',
            f'<path id="ground" class="det" d="M0,{fmt(ground_y)}H{WIDTH_PX}"/>',
            '<g id="scene">',
        ]
        lines += pc_markup(cam, 'pcA', PC_A_X, PC_A_H, tower=True)
        lines += pc_markup(cam, 'pcB', PC_B_X, PC_B_H, tower=False, tab=True)
        # The merged tower: hidden until the two stacked boxes become one.
        merged = pc_markup(cam, 'pcMerged', PC_A_X, PC_A_H + PC_B_H, tower=True)
        merged[0] = '<g id="pcMerged" opacity="0">'
        lines += merged
        lines.append(f'<path id="seam" class="acc" opacity="0" d="M{fmt(cam.point(PC_A_X + PC_W / 2, 0)[0])},'
                     f'{fmt(ground_y + stack_dy)}h{fmt(PC_W * cam.scale)}"/>')
        lines.append('</g>')
        lines.append('<g id="arm">')
        lines += group('fr3_link0', 1)
        lines.append('</g>')
        lines.append('</svg>')
        return '\n'.join(lines) + '\n'

    # Coarsen the detail until the file fits the size budget.
    simplify_px, min_px = SIMPLIFY_PX, MIN_DETAIL_PX
    svg = render(simplify_px, min_px)
    while len(svg.encode()) > MAX_BYTES:
        min_px *= 1.25
        simplify_px *= 1.1
        svg = render(simplify_px, min_px)

    tcp = (links[GRIPPER_BASE] @ [0, 0, robot.tcp_depth, 1])[:3]
    meta = {
        'source': 'franka_description fr3 (Apache 2.0, Franka Robotics GmbH) + '
                  'robotiq_description 2F-85 (BSD 3-Clause, PickNik Robotics)',
        'viewBox': [0, 0, WIDTH_PX, cam.height],
        'pxPerMetre': round(cam.scale, 3),
        'groundY': round(cam.point(0, 0)[1], 2),
        'joints': joints,
        'tcpNeutral': [round(v, 2) for v in cam.px(tcp)[0]],
        'scene': {
            'pcA': {'x': round(cam.point(PC_A_X, 0)[0], 2), 'size': [round(PC_W * cam.scale, 2), round(PC_A_H * cam.scale, 2)]},
            'pcB': {'x': round(cam.point(PC_B_X, 0)[0], 2), 'size': [round(PC_W * cam.scale, 2), round(PC_B_H * cam.scale, 2)]},
            # Where pcB has to move to sit on pcA.
            'stackOffset': [round((PC_B_X - PC_A_X) * cam.scale, 2), round(-PC_A_H * cam.scale, 2)],
        },
        # Degrees. 'gripper' is the Robotiq knuckle joint: 0 open, about 45.8 fully closed.
        'keyframes': [
            {'name': name, **{j: round(math.degrees(q[j]), 2) for j in ANIMATED + ['gripper']}}
            for name, q in keyframes
        ],
    }

    with open(out_base + '.svg', 'w') as fh:
        fh.write(svg)
    with open(out_base + '.json', 'w') as fh:
        json.dump(meta, fh, indent=2)
        fh.write('\n')
    print(f'{out_base}.svg  {len(svg.encode()) / 1024:.1f} KB  (simplify {simplify_px:.2f} px, min detail {min_px:.1f} px)')
    print(f'{out_base}.json')
    write_html(out_base, svg, meta)
    for kf in meta['keyframes']:
        print('  ', kf)


GSAP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'


def write_html(out_base, svg, meta):
    """Standalone page. The animation code is armAnimation.js, next to the outputs."""
    anim_path = os.path.join(os.path.dirname(out_base), 'armAnimation.js')
    if not os.path.exists(anim_path):
        print(f'no {anim_path}, skipping the standalone HTML')
        return
    with open(anim_path) as fh:
        anim = fh.read().replace('export function', 'function')
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Franka Research 3: two PCs into one</title>
<style>
html, body {{ margin: 0; height: 100%; background: {BG}; }}
body {{ display: grid; place-items: center; }}
svg {{ width: min(100vw, 1000px); height: auto; display: block; }}
</style>
</head>
<body>
{svg}
<script src="{GSAP_CDN}"></script>
<script>
const meta = {json.dumps(meta)}
{anim}
// window.armAnimation.timeline is the GSAP timeline, handy for scrubbing in the console.
window.armAnimation = createArmAnimation(gsap, document.getElementById('franka-arm'), meta, {{
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
}})
</script>
</body>
</html>
'''
    with open(out_base + '.html', 'w') as fh:
        fh.write(html)
    print(f'{out_base}.html')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--franka-description', required=True, help='path to a franka_description checkout')
    ap.add_argument('--robotiq-description', required=True,
                    help='path to robotiq_description inside a ros2_robotiq_gripper checkout')
    ap.add_argument(
        '--out',
        default=os.path.join(here, '..', 'src', 'app', 'blog', 'droid-one-pc', 'franka-arm'),
        help='output path without extension',
    )
    args = ap.parse_args()
    build(
        {
            'franka_description': os.path.abspath(args.franka_description),
            'robotiq_description': os.path.abspath(args.robotiq_description),
        },
        os.path.normpath(args.out),
    )
