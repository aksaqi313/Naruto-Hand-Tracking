# 🍃 Naruto Jutsu Simulator — Hand Tracking

A real-time Naruto jutsu simulator powered by **MediaPipe Hands** (Google) running entirely in the browser. No backend needed — pure HTML + CSS + JavaScript.

---

## ✋ Gesture Controls

| Gesture | Jutsu | How To |
|---|---|---|
| 🖐️ Open Palm | **Rasengan** | Hold all 4 fingers extended toward the camera |
| ☝️ Pointing Finger | **Chidori** | Extend only your index finger |
| ✊ Closed Fist | **Chakra Focus** | Curl all fingers into a fist |

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

1. **MediaPipe Hands** detects 21 hand landmarks per hand in real time via CDN
2. **Gesture Classifier** (`script.js`) analyzes finger extension ratios to identify Rasengan / Chidori / Fist
3. **Effect Engine** (`effects.js`) renders canvas particle systems (orbital chakra spheres, lightning arcs) on top of the webcam feed
4. **GIF Overlays** are positioned over the detected palm center for each jutsu

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
