# 🍃 Naruto Jutsu Simulator — Hand Tracking

A real-time Naruto jutsu simulator powered by **MediaPipe Hands** (Google) running entirely in the browser. No backend needed — pure HTML + CSS + JavaScript.

---

## ✋ Gesture Controls

| Gesture | Jutsu | How To |
|---|---|---|
| 🖐️ Open Palm | **Rasengan** | Hold all 4 fingers extended toward the camera |
| ☝️ Pointing Finger | **Chidori** | Extend only your index finger (other fingers curled) |
| 🤘 Horns | **Fireball** | Index + pinky up (middle + ring curled) |
| ✌️ Peace/V | **Shadow Clone** | Index + middle up (ring + pinky curled) |
| 👍 Thumbs Up | **Summoning** | Thumb up with all other fingers curled |

---

## 🚀 Quick Start

### Requirements
- [Node.js](https://nodejs.org/) (v14+) — for the local server
- A modern browser (Chrome, Edge, Firefox)
- A webcam

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the local server (auto-opens browser)
npm start
```

The app will open at **http://localhost:3000** automatically.

> ⚠️ **Important:** The app MUST be served from a local HTTP server (not opened directly as a file). Browsers block webcam access and CDN scripts on `file://` URLs.

---

## 📁 Project Structure

```
naruto-hand-tracking/
│
├── index.html       ← Main UI structure
├── style.css        ← Dark ninja theme & animations
├── script.js        ← MediaPipe integration & gesture logic
├── effects.js       ← Particle effects engine (Rasengan / Chidori)
├── package.json     ← Node.js project config
└── assets/
    ├── rasengan.gif ← Rasengan visual overlay
    └── chidori.gif  ← Chidori visual overlay
```

---

## 🔧 How It Works

### 1️⃣ **Hand Tracking & Landmark Detection**
The app uses **MediaPipe Hands**, Google's pre-trained machine learning model loaded via CDN. It detects **21 3D landmarks** on each hand in real time:
- **Wrist** (0) — base of the hand
- **Fingers** (5 fingers × 4 joints each = 20 landmarks)

**System Flow:**
```
📹 Webcam Feed → MediaPipe Model → 21 Landmarks per hand → Gesture Recognition
```

Every frame (~30-60 FPS), MediaPipe updates the hand positions with confidence values (0-1). Low confidence detections are filtered out to prevent false gestures.

---

### 2️⃣ **Gesture Recognition Algorithm**
The classifier in `script.js` analyzes **finger extension ratios** to recognize 5 jutsu gestures:

| Gesture | Logic |
|---|---|
| 🖐️ **Rasengan** | All 4 fingers extended (thumb can be relaxed) |
| ☝️ **Chidori** | Only index finger up; all 3 other fingers curled |
| 🤘 **Fireball** | Index + Pinky up; Middle + Ring down |
| ✌️ **Shadow Clone** | Index + Middle up; Ring + Pinky down |
| 👍 **Summoning** | Thumb extended; all fingers curled or pointing down |

**How Detection Works:**
```javascript
For each finger:
  1. Get Y-coordinate of fingertip vs middle knuckle
  2. If fingertip Y < middle knuckle Y → EXTENDED
  3. If fingertip Y > middle knuckle Y → CURLED
  4. Aggregate all 5 finger states → Match gesture pattern
```

**Confidence & Smoothing:**
- MediaPipe gives a confidence score (0-1) for each landmark
- Only process hands with >0.7 confidence
- Smooth hand coordinates over 3 frames to prevent jitter
- Lock gesture for 0.5 sec to prevent flickering

---

### 3️⃣ **Jutsu Charging System**
Once a gesture is detected and held for >0.5 seconds, **chakra charging** begins:

```
Hold Gesture (0.5s) → Charge builds → Release Gesture → JUTSU TRIGGERED!
```

**Charge Mechanics:**
- Charge bar fills from 0% → 100% over ~2 seconds
- **Charge Rate:** +1.8% per frame (at 60 FPS)
- Visual feedback: 
  - Blue circular arc in bottom-left corner
  - Full-screen kamae (pose) image on release
  - Shockwave rings emanate from palm center

**Chakra/Energy System:**
- Each jutsu costs **0.7 chakra units** to fire
- Chakra regenerates at **+0.35 units/frame** when idle
- Max chakra capacity: **100 units**
- If chakra < jutsu cost → animation plays but **no particles spawn**

---

### 4️⃣ **Particle Effect Engine** (`effects.js`)
When a jutsu triggers, custom particle systems create anime-style visual effects:

#### **Rasengan Particles** 🔵
- **Type:** Orbital spin particles
- **Behavior:** Spiraling chakra sphere that rotates and shrinks
- **Color:** Cyan (`#00cfff`) with glow effect
- **Count:** 30-50 particles per cast
- **Duration:** 1-2 seconds with alpha fade
- **Physics:** Gravity-free orbital motion

#### **Chidori Particles** ⚡
- **Type:** Lightning arcs
- **Behavior:** Chaotic zigzag paths with random jitter
- **Color:** Golden-yellow (`#ffe000`)
- **Special:** Lines drawn from particle center for lightning effect
- **Count:** 40-60 particles
- **Physics:** Random velocity perturbations every 2 frames

#### **Fireball Particles** 🔥
- **Type:** Expanding fire puffs
- **Behavior:** Upward trajectories with gravity pull-down
- **Color:** Orange → Red gradient shift
- **Count:** 25-40 particles
- **Hue Animation:** Continuously shifts 10°-40° for flame effect
- **Physics:** Velocity slowdown + gravity (-0.18)

#### **Shadow Clone Particles** 👥
- **Type:** Swirling green shadows
- **Behavior:** Radius spread with pulse scaling
- **Color:** Green (`#00ff88`)
- **Count:** 35-55 particles
- **Animation:** Sine-wave size pulsing for mystical feel
- **Physics:** Reduced gravity (-0.04)

#### **Summoning Particles** 🐸
- **Type:** Purple smoke clouds
- **Behavior:** Upward billowing with turbulence
- **Color:** Purple (`#cc44ff`)
- **Count:** 25-40 large particles
- **Physics:** Walnut-brown-ish gravitational drift (-0.12)
- **Special:** Radial gradient for smoky silhouette effect

---

### 5️⃣ **Shockwave & Visual Effects**
On jutsu trigger:
1. **Banner Flash:** Full-screen overlay with jutsu name + kanji flashes for 0.6s
2. **Shockwave Ring:** Expanding circle from palm center with scaling opacity
3. **GIF Overlay:** Pre-rendered jutsu animation (Rasengan/Chidori GIF) appears at palm for 1.5s
4. **Combo Flash:** White screen flash on consecutive rapid jutsus (×2 or more in 3 seconds)

---

### 6️⃣ **Rank & XP System**
Every jutsu cast grants **skill points (XP):**

| Jutsu | XP |
|---|---|
| Rasengan | +10 |
| Chidori | +12 |
| Fireball | +14 |
| Shadow Clone | +15 |
| Summoning | +18 |

**Rank Progression:**
```
Genin (0 XP) → Chunin (50 XP) → Jonin (150 XP) 
→ ANBU (350 XP) → Kage (700 XP)
```

Rank badge updates in top-right header (icon + title). Historical jutsu casts logged in sidebar.

---

### 7️⃣ **Error Handling & Auto-Refresh**
If the camera disconnects or MediaPipe fails:
- **Auto-Refresh Enabled:** Attempts to restart camera every **5 seconds**
- **Refresh Button:** Click 🔄 button or press **R** key for manual reset
- **Status Indicator:** Green dot = camera active | Red dot = error
- **Error Messages:** Clear feedback in bottom-left corner

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|---|---|
| **R** | Refresh camera / Restart hand tracking |
| **Space** | Toggle camera on/off |
| **1-5** | Quick jutsu trigger (debug mode) |

---

## 🌐 Tech Stack

| Technology | Purpose |
|---|---|
| MediaPipe Hands (CDN) | Real-time hand landmark detection |
| HTML5 Canvas | Particle effect rendering |
| Vanilla CSS | Animations, dark theme, glassmorphism |
| JavaScript ES6+ | Gesture logic, UI state management |
| http-server (npm) | Local development server |

---

## 💡 Tips

- Use in a **well-lit room** for best detection accuracy
- Keep your hand **30–60 cm** from the camera
- Chrome gives best performance for MediaPipe WebAssembly
