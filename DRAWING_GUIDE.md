# H.E.R.M.E.S whiteboard: drawing guide

How to copy `dist/hermes_board.pdf` onto a **170 cm wide × 120 cm tall** whiteboard (landscape), panel by panel.
The board map (`dist/board_map.pdf`) shows where each panel goes. `dist/board_panels.pdf` has every panel on its own page,
so you can hold the page for the panel you are drawing.

**What it shows:** the latest system. A wireless pod vest and a desk dock, XIAO nRF52840 BLE gloves and hub, and the ROS 2 side unchanged.
Anything designed but not built yet is labelled that way on the board.

## Marker colours (fixed)

| Marker | Means | Examples |
|---|---|---|
| <span class="k">black</span> | structure | outlines, boxes, frames, ROS nodes, dimensions |
| <span class="b">blue</span> | data / radio | BLE links, USB serial, ROS topics, firmware, XIAO parts |
| <span class="r">red</span> | power | USB-C 5 V, pogo pins, brass pads, batteries, charge path |
| <span class="g">green</span> | magnets / mechanical | magnets, key rib / groove, snap-on notes, sewing holes |

Grey text in the PDF (view names, scale notes, small notes) is written in black on the board, smaller.

## Conventions

- **Positions** are in cm from the **top-left corner of the panel**, written (across, down).
- **Scale "2:1"** means 1 real mm is drawn as 2 mm on the board. The pod is 52 mm long, so at 2:1 it is drawn 10.4 cm long.
- Dimensions on the board are **real sizes in mm**, never board sizes.
- Every view is a simplified outline taken from the STL files (`tools/extract_views.py`), with at most ~20 straight lines and circles.
  Corners that are rounded or chamfered by less than 1 mm are drawn square.
- **[VERIFY]** marks a number that is not measured or not in the sources. Write it on the board too.
- Hatching (diagonal lines) inside a part in the PDF means the part is filled with that colour. On the board, 3–4 quick diagonal strokes are enough.

## Order of work (about 2–3 hours in total)

1. With a long ruler, draw all panel frames in black, using the board map. Write each panel letter and title in its top-left corner.
2. Fill the panels row by row, in the board map's order: top row A, E, G · middle row D1, D2, D3, D5, then D4 (the wide gloves panel under D3 + D5) · bottom row B, C, F. Each panel below lists its steps in drawing order: structure (black) first, then data (blue), power (red), mechanics (green), then the labels.

---

## Panel A: System overview (top-left (0, 0), 90 × 37 cm)

1. **Legend**, top row from (28, 3): four short thick strokes, one in each colour, each followed by what it means.
2. **Operator, seen from the BACK** (black), around (15, 18), so the wearer's left is on the left of the drawing. Write "OPERATOR (seen from the back)" at (15, 6).
   Draw the head (Ø3.6) at (15, 10) and a short neck. Draw the vest as a rectangle 9 × 11 cm, top-left at (10.5, 13), with "vest" in its middle.
   Arms go from the vest's top corners out and down to the gloves. Draw the hips below the vest, then two legs ending at y 32.
3. **Pods**: six small numbered hexagons. **1** on the left upper arm and **2** on the right upper arm (sleeves). **3** and **4** at the vest's top corners (shoulders).
   **5** and **6** at the vest's bottom corners (torso). Bottom-left key in two lines at (2, 34): "pods: 1 L sleeve · 2 R sleeve · 3 L shoulder / 4 R shoulder · 5 L torso · 6 R torso".
4. **Gloves**: one small square at each hand. "L glove · 4 flex + IMU" on the left, "R glove · 4 FSR" on the right.
5. **Pi 5 + hub + power bank on the vest**: on the vest, between the pods, a small black box "Pi", a small <span class="b">blue hub</span> beside it, and below them a <span class="r">red hatched power bank</span> with a short red cable up to the Pi.
   **Zoom box** (dashed frame 30 × 12.8 cm at (30, 13.4)), joined to the vest's Pi by a dashed line. Inside, top-left: "ON THE VEST (zoom)". Then <span class="b">hub XIAO box</span> (5.6 × 3.4 cm),
   a thick USB cable labelled "USB 921 600", and the Pi box (15 × 5.8 cm) "Raspberry Pi 5 · ROS 2 nodes". Under the Pi, a <span class="r">red box "USB-C power bank 5 V 5 A"</span> with a red cable up to the Pi.
6. **Robots** (black): three boxes 7.6 × 4.6 cm with two wheels each, at (64, 19), (72.5, 19) and (81, 19), labelled ROSbot r1, r2, r3.
   OptiTrack: three small camera boxes at (74.5, 7), with "OptiTrack cameras" above them.
7. **Desk dock** (black, with green hexagons): a sloped bar 17 cm long at (30, 31.6) with six small green hexagons. Caption above: "desk dock: 6 pockets · pods snap in by magnet".
8. **Blue (dashed arrows):**
   - from each glove to the hub on the vest, and from the hub to a sleeve pod. Text at (21, 9): "BLE to the hub on the vest: / gloves 50 Hz · L 48 B · R 9 B / pods ≤ 20 Hz on change + 10 Hz keepalive · 2 B";
   - in the zoom box: "BLE central (8 links)" under the hub, and "↑ hermes.hub.v1 JSON lines / ↓ V1,<seq>,m1..m6 @ 20 Hz" at its lower left;
   - a double arrow from the zoomed Pi to the robots, with "ROS 2 over Wi-Fi / /hermes/swarm_intent 10 Hz → / ← /hermes/robot_state_beacon" at (59, 10);
   - from the cameras down to the robots: "NatNet poses → pose beacons". Under the robots: "each robot: own agent node → /cmd_vel 20 Hz".
9. **Red:** an arrow into the dock's right end: "USB-C 5 V".
10. **Status** (black), bottom right from (59, 30): "BUILT: ROS 2 nodes · ROSbots · OptiTrack · v1 glove carrier boards" ·
    "DESIGNED, NOT BUILT: pods · dock · vest mounts" · "COMPILED, NEVER FLASHED: hub / pod / glove BLE firmware".

## Panel E: Power and charging (top-left (90, 0), 32 × 37 cm)

1. **Dock → pod charging**, red boxes 8.8 × 3.2 cm, three per row, following a snake from (1.8, 6.4):
   USB-C 5 V → Adafruit 6050 (5.1 k CC) → 6 pin boards (daisy-chain) ↓ 2 pogo pins per pocket ← … → pod brass pads (+5 V at +x)
   ↓ wires in floor grooves → XIAO VBUS → charger 50 mA → LiPo 150 mAh.
2. **Pod motor driver** (schematic) from (5, 21.8):
   - red BAT+ rail along the top;
   - black motor circle "M" hanging from it, with the 1N4148W diode beside it in parallel (triangle pointing up, bar at the top = stripe toward BAT+);
   - below them, MOSFET box "Q1" (D at the top, S at the bottom to the ground symbol);
   - <span class="b">blue "D0 PWM" line into G</span>, and a 100 k zig-zag from the gate line to ground.
   Notes: "diode 1N4148W across the motor, stripe → BAT+", "Q1 = SI2302 MOSFET, source to GND, gate held low by 100 k".
3. Two red lines at the bottom: "Pi: power bank 5 V 5 A → Pi 5 USB-C · Pi USB → hub" and "glove: LiPo 500 mAh → XIAO Sense, charged on its own USB-C at 100 mA".

## Panel G: Gesture vocabulary (top-left (122, 0), 48 × 37 cm)

Three columns: mode (x 1.2) · CURRENT (fix/gesture-bugs) (x 8.6, black) · <span class="b">OPTION B, in development (x 28.6, blue)</span>. Draw a light line between rows.

| Left posture → mode | Current (right FSR), fix/gesture-bugs | Option B, in development |
|---|---|---|
| OPEN → DRIVE | left hand tilt drives · M tap soft stop, M 2× resume · R tap yaw toggle · R hold precision | I hold + right wrist tilt drives (30° full, 4° dead zone) · M hold + roll: speed 0–4 · R hold + roll: aggression 1–4 · P tap yaw |
| POINT → SELECT | I/M/R/P tap: group A–D, 2×: E–G · P 2× confirm group · group edit: tap r1–r4, hold r5 / r6 | I/M/R/P tap: toggle r1–r4 · I/M hold: toggle r5 / r6 · R hold: all ⇄ none |
| FIST → FORMATION | tap: LINE, COLUMN, WEDGE, CIRCLE · 2×: ECHELON_L, ECHELON_R, GRID, DIAMOND · hold: I orient, M apply, R spacing, P break | tap: LINE, COLUMN, WEDGE, CIRCLE · I hold + roll: menu of 9 · M: spacing 0.70–1.60 m · R: heading 45°/step · P hold: confirm |
| TWO → BEHAVIOR | tap: PATROL, FOLLOW_PATH, HOLD_ANCHOR, RETURN_HOME · I/M 2×: PATROL_PERIMETER, FOLLOW_PATH_LOOP · R/P hold: FOLLOW_ME, DISPERSE_SCAN | tap: PATROL, FOLLOW_PATH, HOLD_ANCHOR, RETURN_HOME · I hold + roll: menu of 8 · P hold: confirm |
| THREE → PARAMS | I/M tap: speed −/+ · R/P tap: spacing −/+ · R/P 2×: aggression −/+ · hold = min / max | removed: speed, spacing and aggression become dials |
| SAFETY (any mode) | left palm-up = deadman off · left shake = ESTOP | palm-up gate · knock = PAUSE · two-hand shake = ESTOP · P hold 600 ms = confirm / RESUME |

Footer: "I M R P = right index / middle / ring / pinky FSR · 2× = double tap · roll = right wrist (B) · B: taxonomy:=b".
The CURRENT column is regenerated from the `fix/gesture-bugs` branch (bug fixes: yaw toggle and precision now work while driving, break formation is P hold and no longer shadowed by ECHELON_R). The full table is in `sources/current_mapping_fix-gesture-bugs.md`.

## Panel D1: Pod (top-left (0, 37), 55 × 48 cm), full detail

Views are third-angle: TOP above FRONT, SIDE to the right of FRONT.

1. **TOP 2:1** (black), at (4, 8.6), 10.4 × 6.4 cm: a long hexagon. Points at the left and right ends, and flat top and bottom edges 6 cm long.
   Dimensions: 52 across the top, 32 on the left. Write "→ +x key side" at the right end.
2. **FRONT 2:1** at (4, 18.4), 10.4 × 3.8 cm: rectangle with the top corners chamfered (top edge 7.5 cm long, chamfer starts 1 cm below the top).
   Dashed line at z 8 ("split z 8": base below, lid above). Dimension 19 on the left.
3. **SIDE 2:1** at (20.4, 18.4), 6.4 × 3.8 cm: same shape, top edge 4 cm. Dimension 32 below.
4. **BOTTOM 2:1** (dock side) at (29, 8.6): the same hexagon as TOP, then inside it:
   <span class="g">magnet Ø10.2 (2 cm circle, hatched) in the centre</span>; <span class="r">two pads Ø4 (8 mm circles) 4.4 cm apart (22 mm real), "− pad" left, "+5 V pad" right</span>;
   <span class="g">key groove = thin rectangle 2.6 × 0.5 cm near the right tip</span>. Dimension "22" between the pads in red.
5. **ISO SKETCH** around (47, 16): hexagonal prism about 10 cm long, with the top chamfered inward (smaller hexagon on top). Draw the near edges only.
6. **SECTION through pads + magnet (y = 0), 3.4:1** at (29, 26.2), about 17.7 × 6.5 cm: base tray and lid outlines (black), then inside, from the bottom up:
   <span class="g">magnet</span> in the floor centre, <span class="r">LiPo</span> (hatched red, 10.9 cm wide), backpack PCB (thin black), <span class="b">XIAO</span> (hatched blue, left part),
   <span class="g">motor</span> (hatched green, 3.4 cm, right, against the ceiling). Label each one on the right. Caption: "USB-C toward −x · motor beside the XIAO".
7. **EXPLODED STACK 2.6:1** from (4, 31) down to (4, 45). Draw these layers spaced about 1 cm apart. Widths are at 2.6:1, centred on the 13.5 cm base.
   Label each layer on its right with its height range (z, mm above the bottom):

   | Layer (top → bottom) | Colour | Width | z (mm) |
   |---|---|---|---|
   | lid (snap fit): chamfered cap outline | black | 13.5 cm | 8–19 |
   | motor 10 × 3 (in lid ring) | green | 2.6 cm, right of centre | 13.7–16.7 |
   | XIAO nRF52840 | blue | 5.5 cm, left of centre | 10.5–12.1 |
   | backpack PCB 30 × 20 | black | 7.8 cm | 8.8–10.4 |
   | LiPo 150 mAh 32 × 18 × 4.5 | red | 8.3 cm | 3.9–8.4 |
   | foam tape 0.3 | black | 8.3 cm | 3.6–3.9 |
   | base: floor 3.6 + lip, with the magnet (green) and 2 pads (red) underneath | black | 13.5 cm | 0–3.6 |

   Caption in green: "magnet + 2 brass pads sit in pockets under the floor".

## Panel D2: Desk dock (top-left (55, 37), 55 × 48 cm), full detail

1. **TOP FACE 1:1** (looking square onto the 20° slope) at (2, 6.4), 22.1 × 6.9 cm: rounded-corner bar with **six gem pockets** side by side.
   Dimension "221 along the face · pockets 37 apart".
2. **SIDE 1.3:1** at (26.8, 7.6), 9.4 × 4.4 cm: wedge. Low front (left), slope up to the tall back (right). "20°" at the slope, dimensions 72 and 34.2.
3. **POCKET PLAN 2:1, in the same orientation as the top face**, at (44, 8.4), 8.8 × 12.8 cm: tall gem outline (black); <span class="g">magnet Ø10.2 hatched in the centre,
   key rib bar across the top end (back of the pocket)</span>; <span class="r">pogo pins at ±11 above and below the magnet</span>; black M2 pilot dots left and right.
4. **UNDERSIDE 1:1, seen from below (front edge at the top)**, at (2, 17.2), 22.8 × 7.2 cm:
   1. black: outer wall and inner wall (the bar is hollow, 3 mm walls). Six small grey marks along the front are bits of the pocket floors cut at the same height; draw them lightly or leave them out;
   2. black: **6 pin boards** (squares, 30 × 28 projected), each with **2 M2 screws** (small circles, left and right of the centre);
   3. <span class="r">red dots: the 2 pogo pin tails per board (front row and back row)</span>;
   4. <span class="r">red rectangle at the back wall: USB-C board (Adafruit 6050, 20.4 × 14.7 [VERIFY dims]) on its ledge, connector poking through the back wall</span>;
   5. **daisy-chain**: a <span class="r">red +5 V line</span> from the USB board along the back pogo row to all six boards, and a black GND line along the front pogo row. Note: "route [VERIFY]".
5. **DOCKING SEQUENCE 2.4:1**, three steps side by side from (1.4, 31.8), each 14.4 × 10.6 cm, cut along the pod axis. Title: "dock = hatched, pod = dashed outline".
   In every step: the dock skin around the pocket (black outline, grey hatching), the pin board (black), the dock magnet (green), two pogo pins (red bars) and the key rib.
   The pod is a **dashed** outline with its magnet (green), two brass pads (red) and the key groove.
   1. **pod above the pocket**: pod 10 mm up. Under it: "pins up: tip 0.7 proud (stroke 1.40)".
   2. **magnets pull it in**: pod 0.6 mm up, two green arrows pushing it down, key rib entering the groove. Under it, in green: "key rib enters the groove · magnets ≈ 870 gf vs pins ≈ 187 gf → 4.6 × [VERIFY]".
   3. **seated: 5 V flows**: pod down, pins pressed ~0.65. Add the backpack (black) and the <span class="b">XIAO (blue)</span> inside the pod.
      Draw the <span class="r">thick red 5 V path: pin board → up the pogo pin → brass pad → (dashed: wire beside the battery) → XIAO</span>.
      Labels sit on **vertical leader lines** with the text to the left of each line, so no two leaders cross.
      Below: pin board · dock magnet · pogo pin, pressed ~0.65 · key rib in groove. Above: XIAO (VBUS → charger) · pod magnet · brass pad → 5 V path.

## Panel D3: Vest mount ×6 (top-left (110, 37), 30 × 24 cm), medium

1. **TOP 1.3:1** at (3, 6.8), 9.9 × 5.7 cm: octagon (corners cut 45°), the gem pocket hexagon inside it, two strap slots (thin rectangles) at the ends,
   <span class="g">magnet Ø10.2 in the centre</span>, 6 small sewing holes along the long edges. Dimensions 76 and 44.
2. **FRONT** below it: a thin base plate with a raised wall on top. Dimension 8.1.
3. **ISO** at (20, 9.5): flat octagon plate with a lower octagon ring on top.
4. Green notes: "magnet Ø10.2 flush · key rib · thumb notch · 6 sewing holes · 2 strap slots (20 mm)".

## Panel D5: Hub + Pi 5 (top-left (140, 37), 30 × 24 cm), medium

1. **WHERE** (left, from (1.4, 5.8)): a small stick operator wearing the vest, with the **Pi 5 + hub + power bank on the vest** (black box, small blue hub, small red bank below them), a glove on each hand and a pod on each sleeve.
   <span class="b">Blue dashed BLE arrows from both gloves and a sleeve pod to the hub</span>; a <span class="b">blue dashed Wi-Fi arrow from the Pi to a small ROSbot</span>;
   a <span class="r">red leader from the bank: "bank 5 V 5 A"</span>. Notes: "Pi 5 + hub + USB-C power bank on the vest", "BLE: gloves + pods → hub".
2. **Pi 5 outline 1:1** at (15, 6.2), 8.5 × 5.6 cm. Dimensions 85 and 56. Draw only the ports that matter:
   two USB-A pairs and Ethernet on the right short edge, and <span class="r">USB-C power on the bottom edge, near the left</span>.
   Notes: <span class="r">"USB-C power in (power bank)"</span> and "Ethernet unused (Wi-Fi)".
3. <span class="b">Hub XIAO 2:1</span> (4.2 × 3.6 cm) at (19.6, 16), with its USB-C on the right end. A thick black USB cable runs from the Pi's top USB-A port down to it.
   Note: "hub 21 × 17.8".
4. **RUNS HERE** (bottom left, from (1.4, 17.6)): <span class="b">"hub XIAO: hub firmware (BLE central, 8 links → JSON over USB)"</span> and
   "Pi 5 (ROS 2): vest_serial_bridge, gesture_pipeline, swarm_control, haptic_vest, optitrack_pose_beacon".

## Panel D4: Gloves (L + R) (top-left (110, 61), 60 × 24 cm), medium

1. **Two hands, back view**, with the wrist at y 19: **LEFT** centred at x 7.5 (thumb on the right) and **RIGHT** centred at x 22.5 (thumb on the left). Draw them at 0.75:1.
   The palm is 6 cm wide and 5.6 cm from wrist to knuckles (80 mm hand, 75 mm knuckle to wrist in the glove PCB spec). Add four finger outlines, a thumb, and the wrist strap (two thick lines).
2. On each hand: **the box** (black, 4.9 × 4.6 cm, 65 × 61 real) on the back of the hand, and the <span class="r">battery (small red block) on the wrist strap,
   with a 2-wire tether up to the box</span>. Thin blue sensor cables run from the box to the fingers.
3. Left hand: <span class="g">a green splint along each finger</span>, holding the flex sensor. Note: "flex sensor in a splint along each finger".
4. Right hand: <span class="b">a blue FSR pad at each fingertip</span>. Notes: <span class="g">"thumb = contact"</span> next to the thumb, and "FSR pad at each fingertip, pressed by the thumb".
5. Bottom line, in red: "battery on the wrist strap, 2-wire tether; box on the back of the hand (glove PCB spec)".
6. **INSIDE THE BOX: carrier v1 60 × 56, 2:1** at (28.2, 8.4), 12 × 11.2 cm: board outline (rounded top corners, chamfered bottom corners);
   4 connectors **J1–J4** along the top edge, 2.4 cm apart (12 mm pitch), labelled <span class="b">A3 A2 A1 A0</span> above them, plus the note "J1 index … J4 pinky";
   below them the 4 divider channels (R1–R8 + C1–C4, three small marks per channel); the <span class="b">XIAO Sense (hatched blue, 21 × 17.8)</span> in its sockets with the USB-C on the right;
   <span class="r">J5 battery</span> at the lower left; 4 mounting holes in the corners.
7. **L vs R table** at (44.6, 6.2):

   | | LEFT | RIGHT |
   |---|---|---|
   | sensors | 4 flex | 4 FSR402 |
   | divider | 68 k | 10 k |
   | in | R1–R4 | R5–R8 |
   | IMU | deadman, shake ESTOP | off now; B: wrist drive |
   | box h | 25.6 | 22.6 |

## Panel B: What is part of what (top-left (0, 85), 60 × 35 cm)

1. Write "H.E.R.M.E.S system" centred at (30, 6) and underline it.
2. **Left tree** from (2, 8.8). Indent about 2 cm per level, one line every 1.45 cm, with grey/black connector lines (└ / ├):
   - **Operator wearables**
     - **Left glove** → enclosure v1 (base + lid) · carrier PCB v1, 60 × 56 → <span class="b">XIAO nRF52840 Sense (IMU on)</span> · 4 flex sensors + 4 × 68 kΩ · <span class="r">LiPo 500 mAh</span>
     - **Right glove**: same carrier → XIAO Sense (IMU off) · 4 FSR402 + 4 × 10 kΩ
     - **Vest** → 6 vest mounts → 6 pods (see the right tree) · Raspberry Pi 5 (ROS 2 nodes) · <span class="b">hub: XIAO nRF52840 on Pi USB</span> · <span class="r">USB-C power bank 5 V 5 A</span>
3. **Right tree** from (33, 8.8):
   - **Pod (×6, in the vest mounts)** → case: base + snap lid · backpack PCB: MOSFET · diode · 100 kΩ · <span class="b">XIAO nRF52840 · coin motor</span> · <span class="r">LiPo 150 mAh</span> · <span class="g">underside: magnet, 2 pads, key groove</span>
   - **Desk dock** → desk bar (one print) · 6 pockets → pin board 30 × 30 → <span class="r">2 pogo pins</span>; <span class="g">magnet under 0.5 skin</span>; <span class="g">key rib</span> · <span class="r">USB-C board (Adafruit 6050)</span>
   - **Swarm** → 3 ROSbots r1–r3 (agent each) · <span class="b">OptiTrack (NatNet poses)</span>

   There is no "Base station" any more: the Pi and the hub ride on the vest.

## Panel C: Component list (top-left (60, 85), 60 × 35 cm)

Two tables side by side, at (1.2, 6) (POD + VEST) and (30.8, 6) (DOCK + GLOVES). Columns: part · qty · role · español. One row every 1.5 cm. Group headers in capitals.

| Group | Part | Qty | Role | Español |
|---|---|---|---|---|
| POD (per pod / ×6) | XIAO nRF52840 | 1 / 6 | BLE · charger | micro |
| | SI2302 MOSFET | 1 / 6 | motor switch | transistor |
| | 1N4148W diode | 1 / 6 | flyback | diodo |
| | 100 kΩ 0805 | 1 / 6 | gate pull-down | resistencia |
| | coin motor 10 × 3 | 1 / 6 | vibration | motor |
| | LiPo 150 mAh | 1 / 6 | power | batería |
| | magnet 10 × 3 | 1 / 6 | holds pod | imán |
| | brass pad Ø4 | 2 / 12 | charge contact | latón |
| | backpack PCB | 1 / 6 | carries parts | circuito |
| | case base + lid | 1 / 6 | shell | carcasa |
| VEST | vest mount | 6 | pod cradle | soporte |
| | magnet 10 × 3 | 6 | holds pod | imán |
| | velcro strap 20 mm | 6 | to the vest | velcro |
| | Raspberry Pi 5 | 1 | ROS 2 nodes | ordenador |
| | XIAO nRF52840 hub | 1 | BLE central | micro |
| | power bank, USB-C PD 5 V 5 A | 1 | Pi power | batería externa |
| DOCK | desk bar print | 1 | holds 6 pods | base |
| | pogo pin Mill-Max 7911 | 12 | spring contact | contacto |
| | pin board 30 × 30 | 6 | holds 2 pins | circuito |
| | magnet 10 × 3 | 6 | pulls pod in | imán |
| | USB-C board Adafruit 6050 | 1 | 5 V in | conector |
| | M2 × 6 screw | 14 | board mounts | tornillo |
| GLOVES (per glove / ×2) | XIAO nRF52840 Sense [VERIFY] | 1 / 2 | BLE · IMU | micro |
| | carrier PCB v1 | 1 / 2 | sockets | circuito |
| | flex (L) / FSR402 (R) | 4 / 8 | finger input | sensor |
| | 68 kΩ (L) / 10 kΩ (R) | 4 / 8 | divider | resistencia |
| | LiPo 500 mAh | 1 / 2 | power | batería |

Footnotes under the right table: <span class="r">"power bank: USB-C PD, 5 V 5 A, powers the Pi 5"</span>; <span class="g">magnets: 6 pod + 6 dock + 6 vest = 18</span>; "[VERIFY] shopping list orders 1 Sense; 2 gloves need 2".

## Panel F: Software map (top-left (120, 85), 50 × 35 cm)

1. <span class="b">Blue firmware boxes</span> at x 1.4: glove_left (48 B @ 50 Hz), glove_right (9 B @ 50 Hz), pod ×6 (2 B, stop after 300 ms).
   Arrows to the blue "hub fw (BLE central)" box at (15, 4.8). Write "ROS 2 side: unchanged" at (30, 5.8).
   Grey note at (1.4, 16): "firmware: Arduino + Bluefruit, shared lib hv_common".
   Blue protocol note at (1.4, 19): "hub → Pi: hermes.hub.v1, .status, .devices (1/s) · Pi → hub: V1,<seq>,m1..m6".
2. Black ROS node boxes in a column at x 15, 12 × 3.2 cm, joined by blue arrows going down, with the topic written to the right of each arrow (x 27.6):
   vest_serial_bridge_node (blue double arrow up to the hub: "USB 921 600") → `/hermes/raw_input` → gesture_pipeline_node → `/hermes/command_packets` →
   swarm_control_node → `/hermes/swarm_intent 10 Hz` → robot agent ×3 (ROSbots) → `/cmd_vel 20 Hz`.
3. haptic_vest_node at (38, 22.8), right of swarm_control_node, with an arrow from swarm_control_node into it. A dashed blue line runs from its top up to the bridge, labelled "vest_serial_tx 20 Hz".
4. **optitrack_pose_beacon_node** at (1.4, 24), left of swarm_control_node, with "/hermes/robot_state_beacon" written above it. Draw two blue arrows from it:
   one straight into swarm_control_node, and one down, along the bottom of the panel (y 33.6, under the robot box), and up into haptic_vest_node.


---

## Where the numbers come from

| Topic | Source |
|---|---|
| Pod, dock and vest-mount outlines and sizes | `haptic-vest/stl/*.stl` (current build, newer than the last geometry commit), sliced and projected by `tools/extract_views.py` |
| Pod z stack, pad / magnet / key positions | `haptic-vest/src/cad3.py` constants (`FLOOR`, `BAT_*`, `BP_*`, `XIAO_*`, `MOTOR_*`, `CONTACT_X`, `KEY_X`) |
| Pogo, magnet skin, pin board depth, pocket pitch, slope | `haptic-vest/src/cad_dock.py`, `deskbar2.py`, `CLAUDE.md` |
| Charge and motor paths, magnet vs pins estimate | `haptic-vest/CLAUDE.md` |
| BLE rates and payloads, serial protocol, pod labels, charge currents | `haptic-vest/docs/SOFTWARE_PLAN.md` |
| BOM and Spanish context | `haptic-vest/shopping_list.csv`, `H.E.R.M.E.S Project/hardware/pcb/BOM.md` |
| Glove enclosures 65 × 61 × 25.6 / 22.6 | `H.E.R.M.E.S Project/hardware/enclosure/pod_v1_{left,right}_*.stl`, `SPEC.md` |
| Glove layout: box on the back of the hand, battery on the wrist strap with a 2-wire tether, hand 80 × 75 | `H.E.R.M.E.S Project/docs/superpowers/specs/2026-09-30-glove-pcb-design.md` |
| Carrier board outline, J1–J5, dividers, XIAO position | `hardware/pcb/glove_carrier/glove_carrier.kicad_pcb`, `DESIGN_TOUR.md`, `BOM.md` |
| Flex sensors in splints along the fingers; FSRs at the fingertips, one per finger, with the thumb as the contact | HERMES paper `Paper_New_HERMES/.../main.tex` (glove section, l. 110: "four FSR sensors (h--k), one per finger, with the thumb acting as the active contact point"; four flex sensors on the left glove) and the glove photo `H.E.R.M.E.S Project/docs/talk/img/gloves.jpg` |
| Pi 5 + hub on the vest; Pi powered by a USB-C power bank 5 V 5 A; Pi 5 85 × 56 | confirmed by the user |
| Dock underside: pin boards, M2 screws, USB board + ledge | `haptic-vest/src/cad_dock.py` slots, `deskbar2.py` (`SCREW_V`, `USB_BOARDS`, `LEDGE_*`, `WALL_IN`) |
| Glove pin map, IMU on/off | `haptic-vest/firmware/glove_left`, `glove_right` |
| ROS nodes, topics, rates | `H.E.R.M.E.S Project/ros_version/src/hermes_control/hermes_control/*_node.py` parameter defaults |
| 3 ROSbots (r1–r3) | `ros_version/.../config/optitrack_version1_lab.yaml` (`robot_ids: [r1, r2, r3]`) |
| Current gestures | `fix/gesture-bugs` branch, `gestures/matcher.py` run through `taxonomy-review:docs/taxonomy/tools/gen_current_table.py` (read with `git archive`, no branch switch) → `sources/current_mapping_fix-gesture-bugs.md`; + `README.md` safety section |
| Option B | `taxonomy-b:docs/taxonomy/05_option_b_design.md` §5.0–5.2 |

The Spanish one-word names are translations, not taken from a source.

## [VERIFY] list

- Magnet pull vs pogo pins (4.6×) is an estimate (N35 assumed, not measured).
- Adafruit 6050 USB-C board dimensions are provisional (dock stays out of the print pack until it is measured with calipers).
- The shopping list orders 1 XIAO nRF52840 Sense; two gloves need 2.
- Left-glove lid height (25.6) was set by the GY-521. With the Sense's onboard IMU, a lower lid may be possible.
- The dock's daisy-chain wire route.
- Not yet measured or flashed: pod, dock and vest-mount parts, all BLE firmware (compiled, never flashed), and the motor PWM frequency.
