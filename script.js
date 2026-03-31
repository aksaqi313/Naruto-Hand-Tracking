/**
 * script.js v2 — Enhanced Naruto Jutsu Simulator
 * 5 jutsus · Charge system · Web Audio SFX · Rank/XP · History log
 */
'use strict';

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const GESTURE = {
    NONE: 'none',
    RASENGAN: 'rasengan',
    CHIDORI: 'chidori',
    FIREBALL: 'fireball',
    SHADOWCLONE: 'shadowclone',
    SUMMONING: 'summoning',
};

const JUTSU_META = {
    [GESTURE.RASENGAN]: {
        name: 'Rasengan', sub: 'Minato\'s spiraling chakra sphere',
        emoji: '🔵', color: 'rasengan', css: 'rasengan',
        banner: 'RASENGAN!', kanji: '螺旋丸',
        bannerColor: '#00cfff', xp: 10,
        flashClass: 'blue', shockColor: '#00cfff',
        overlayId: 'rasenganOverlay', guideId: 'guide-rasengan',
    },
    [GESTURE.CHIDORI]: {
        name: 'Chidori', sub: 'A thousand birds — Lightning Release',
        emoji: '⚡', color: 'chidori', css: 'chidori',
        banner: 'CHIDORI!', kanji: '千鳥',
        bannerColor: '#ffe000', xp: 12,
        flashClass: 'yellow', shockColor: '#ffe000',
        overlayId: 'chidoriOverlay', guideId: 'guide-chidori',
    },
    [GESTURE.FIREBALL]: {
        name: 'Fire Release: Fireball', sub: 'Great Fireball Technique',
        emoji: '🔥', color: 'fireball', css: 'fireball',
        banner: 'KATON!', kanji: '火遁',
        bannerColor: '#ff5500', xp: 14,
        flashClass: 'fire', shockColor: '#ff5500',
        overlayId: 'fireballOverlay', guideId: 'guide-fireball',
    },
    [GESTURE.SHADOWCLONE]: {
        name: 'Shadow Clone Jutsu', sub: 'Kage Bunshin no Jutsu',
        emoji: '👥', color: 'shadowclone', css: 'shadowclone',
        banner: 'KAGE BUNSHIN!', kanji: '影分身',
        bannerColor: '#00ff88', xp: 15,
        flashClass: 'green', shockColor: '#00ff88',
        overlayId: 'cloneOverlay', guideId: 'guide-shadowclone',
    },
    [GESTURE.SUMMONING]: {
        name: 'Summoning Jutsu', sub: 'Kuchiyose no Jutsu — Call the ancients',
        emoji: '🐸', color: 'summoning', css: 'summoning',
        banner: 'KUCHIYOSE!', kanji: '口寄せ',
        bannerColor: '#cc44ff', xp: 18,
        flashClass: 'purple', shockColor: '#cc44ff',
        overlayId: 'summonOverlay', guideId: 'guide-summoning',
    },
};

const RANKS = [
    { name: 'Genin', icon: '🌿', xpNeeded: 0, nextXp: 50 },
    { name: 'Chunin', icon: '📜', xpNeeded: 50, nextXp: 150 },
    { name: 'Jonin', icon: '⚔️', xpNeeded: 150, nextXp: 350 },
    { name: 'ANBU', icon: '🐱', xpNeeded: 350, nextXp: 700 },
    { name: 'Kage', icon: '👑', xpNeeded: 700, nextXp: null },
];

/* ═══════════════════════════════════════════
   DOM REFERENCES
═══════════════════════════════════════════ */
const $ = (id) => document.getElementById(id);

const videoEl = $('webcam');
const canvasEl = $('outputCanvas');
const shockCanvasEl = $('shockCanvas');
const statusDot = $('statusDot');
const statusText = $('statusText');
const jutsuCard = $('jutsuCard');
const jutsuNameEl = $('jutsuName');
const jutsuSubEl = $('jutsuSub');
const jutsuEmojiEl = $('jutsuEmoji');
const handCountEl = $('handCount');
const gestureLabelEl = $('gestureLabel');
const jutsuCountEl = $('jutsuCount');
const chakraFill = $('chakraFill');
const chakraGlow = $('chakraGlow');
const chakraPercent = $('chakraPercent');
const fpsValue = $('fpsValue');
const jutsuBanner = $('jutsuBanner');
const bannerText = $('bannerText');
const bannerKanji = $('bannerKanji');
const bannerSub = $('bannerSub');
const chargeArc = $('chargeArc');
const chargeCircle = $('chargeCircle');
const chargeLabel = $('chargeLabel');
const chargeBarFill = $('chargeBarFill');
const chargePct = $('chargePct');
const xpFill = $('xpFill');
const rankXpEl = $('rankXp');
const rankNextEl = $('rankNext');
const rankTitleEl = $('rankTitle');
const rankIconLgEl = $('rankIconLg');
const rankBadgeNameEl = $('rankName');
const rankBadgeIconEl = $('rankIcon');
const historyList = $('historyList');
const comboFlash = $('comboFlash');
const cameraContainer = $('cameraContainer');
const kunaiBg = $('kunaiBg');

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let jutsuCount = 0;
let totalXp = 0;
let chakra = 100;
let currentRank = 0;
let charge = 0;          // 0.0 → 1.0
let lastGesture = GESTURE.NONE;
let gestureDuration = 0;
let jutsuTriggered = false;  // only trigger once per gesture hold
let bannerTimeout = null;
let fpsTimer = 0, frameCount = 0;
const historyItems = [];
const MAX_HISTORY = 5;

/* Charge & chakra tuning */
const CHARGE_RATE = 0.018;  // per frame
const CHAKRA_DRAIN = 0.7;
const CHAKRA_REGEN = 0.35;
const MAX_CHARGE_FRAMES = Math.ceil(1 / CHARGE_RATE); // ~56 frames to full charge

/* ═══════════════════════════════════════════
   WEB AUDIO SFX ENGINE
═══════════════════════════════════════════ */
const AudioFX = (() => {
    let ctx = null;

    function _getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }

    function _osc(freq, type, start, dur, gain = 0.4) {
        const ac = _getCtx();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime + start);
        g.gain.setValueAtTime(gain, ac.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
        o.start(ac.currentTime + start);
        o.stop(ac.currentTime + start + dur);
    }

    function _noise(dur, gain = 0.15) {
        const ac = _getCtx();
        const bufSize = ac.sampleRate * dur;
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        const g = ac.createGain();
        src.buffer = buf;
        const filt = ac.createBiquadFilter();
        filt.type = 'bandpass'; filt.frequency.value = 2000;
        src.connect(filt); filt.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(gain, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        src.start(); src.stop(ac.currentTime + dur);
    }

    const SFX = {
        rasengan() {
            _osc(80, 'sine', 0, 0.6, 0.3);
            _osc(160, 'sine', 0, 0.5, 0.2);
            _osc(1200, 'sine', 0.05, 0.4, 0.08);
            _noise(0.5, 0.06);
        },
        chidori() {
            _noise(0.7, 0.25);
            _osc(3000, 'sawtooth', 0, 0.15, 0.07);
            _osc(5000, 'square', 0.1, 0.25, 0.04);
            _osc(200, 'square', 0.05, 0.6, 0.06);
        },
        fireball() {
            _noise(0.8, 0.3);
            _osc(120, 'sawtooth', 0, 0.6, 0.2);
            _osc(60, 'sine', 0, 0.8, 0.25);
        },
        shadowclone() {
            _osc(400, 'sine', 0, 0.15, 0.2);
            _osc(440, 'sine', 0.08, 0.15, 0.18);
            _osc(480, 'sine', 0.16, 0.15, 0.15);
            _noise(0.3, 0.05);
        },
        summoning() {
            _osc(100, 'sine', 0, 0.8, 0.3);
            _osc(200, 'sine', 0.1, 0.6, 0.2);
            _osc(50, 'sine', 0.05, 1, 0.25);
            _noise(0.4, 0.1);
        },
    };

    function play(gesture) {
        try { if (SFX[gesture]) SFX[gesture](); } catch (e) { }
    }

    return { play };
})();

/* ═══════════════════════════════════════════
   GESTURE CLASSIFIER  (v3 — y-coordinate + smoothing)

   MediaPipe landmark indices (key ones):
     0=wrist
     1=thumb_cmc, 2=thumb_mcp, 3=thumb_ip, 4=thumb_tip
     5=index_mcp, 6=index_pip, 7=index_dip, 8=index_tip
     9=middle_mcp,10=middle_pip,11=middle_dip,12=middle_tip
    13=ring_mcp,  14=ring_pip,  15=ring_dip,  16=ring_tip
    17=pinky_mcp, 18=pinky_pip, 19=pinky_dip, 20=pinky_tip

   Lower y = higher on screen (y=0 top, y=1 bottom).
   A finger is UP when its tip.y < its PIP.y.
   Margin avoids toggling at the boundary.
═══════════════════════════════════════════ */

const MARGIN = 0.03; // hysteresis margin to reduce flicker

/** True when finger tip is clearly above its PIP joint */
function fingerUp(lm, tipIdx, pipIdx) {
    return lm[tipIdx].y < lm[pipIdx].y - MARGIN;
}

/** True when finger tip is clearly BELOW its PIP joint (curled) */
function fingerDown(lm, tipIdx, pipIdx) {
    return lm[tipIdx].y > lm[pipIdx].y + MARGIN;
}

/**
 * Thumb-up: tip is well above wrist AND all other fingers curled.
 * Also works for slightly tilted hands by comparing tip to MCP chain.
 */
function thumbIsUp(lm) {
    // Tip must be above thumb_ip AND thumb_ip above thumb_mcp (straight up)
    const chainUp = lm[4].y < lm[3].y && lm[3].y < lm[2].y;
    // Looser fallback: tip y clearly above wrist y by a big margin
    const farAboveWrist = lm[4].y < lm[0].y - 0.08;
    return chainUp || farAboveWrist;
}

/**
 * Thumb extended sideways (not used for summoning but kept for future).
 * Compares tip distance from index-MCP vs IP distance from index-MCP.
 */
function thumbSideways(lm) {
    const d1 = Math.hypot(lm[4].x - lm[5].x, lm[4].y - lm[5].y);
    const d2 = Math.hypot(lm[3].x - lm[5].x, lm[3].y - lm[5].y);
    return d1 > d2 + 0.02;
}

// ── Gesture smoothing buffer ──────────────────────────────────────────
// Keeps the last N raw gesture reads; outputs the most-frequent one
// to eliminate single-frame mis-classifications.
const SMOOTH_N = 5;
const _gestureBuffer = [];

function smoothedGesture(raw) {
    _gestureBuffer.push(raw);
    if (_gestureBuffer.length > SMOOTH_N) _gestureBuffer.shift();
    // frequency count
    const freq = {};
    let best = raw, bestCount = 0;
    for (const g of _gestureBuffer) {
        freq[g] = (freq[g] || 0) + 1;
        if (freq[g] > bestCount) { bestCount = freq[g]; best = g; }
    }
    return best;
}

/** Raw gesture from landmark positions */
function _rawGesture(lm) {
    if (!lm || lm.length < 21) return GESTURE.NONE;

    // ── Four fingers (using tip vs PIP) ──
    const iUp = fingerUp(lm, 8, 6);   // index
    const mUp = fingerUp(lm, 12, 10);   // middle
    const rUp = fingerUp(lm, 16, 14);   // ring
    const pUp = fingerUp(lm, 20, 18);   // pinky

    // Strictly curled (below PIP) for tight gestures
    const iDn = fingerDown(lm, 8, 6);
    const mDn = fingerDown(lm, 12, 10);
    const rDn = fingerDown(lm, 16, 14);
    const pDn = fingerDown(lm, 20, 18);

    const openCount = [iUp, mUp, rUp, pUp].filter(Boolean).length;

    // ── 1. Summoning — thumbs up ONLY (all 4 fingers curled, thumb pointing up) ──
    if (thumbIsUp(lm) && iDn && mDn && rDn && pDn) return GESTURE.SUMMONING;

    // ── 2. Rasengan — all 4 fingers open ──
    if (openCount >= 4) return GESTURE.RASENGAN;

    // ── 3. Shadow Clone — V/Peace sign (index + middle up, ring + pinky down) ──
    if (iUp && mUp && rDn && pDn) return GESTURE.SHADOWCLONE;

    // ── 4. Fireball — Rock/Horns (index + pinky up, middle + ring down) ──
    if (iUp && mDn && rDn && pUp) return GESTURE.FIREBALL;

    // ── 5. Chidori — index only pointing (middle + ring + pinky curled) ──
    if (iUp && mDn && rDn && pDn) return GESTURE.CHIDORI;

    return GESTURE.NONE;
}

/** Public classifier — returns smoothed gesture */
function classifyGesture(lm) {
    return smoothedGesture(_rawGesture(lm));
}

function getPalmCenter(lm) {
    if (!lm || lm.length < 10) return null;
    return { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 };
}

/* ═══════════════════════════════════════════
   UI UPDATERS
═══════════════════════════════════════════ */
function updateJutsuCard(gesture) {
    const meta = JUTSU_META[gesture];
    jutsuCard.className = 'jutsu-card' + (meta ? ` ${meta.css}` : '');
    jutsuEmojiEl.textContent = meta ? meta.emoji : '🥷';
    jutsuNameEl.textContent = meta ? meta.name : '— Stand By —';
    jutsuSubEl.textContent = meta ? meta.sub : 'Show your hand to activate';

    // Guide row highlight
    document.querySelectorAll('.guide-row').forEach(r => r.classList.remove('active'));
    if (meta) { const gr = $(meta.guideId); if (gr) gr.classList.add('active'); }

    // Camera container glow
    cameraContainer.className = 'camera-container' + (meta ? ` glow-${meta.css}` : '');
}

function updateCharge(gesture) {
    if (gesture !== GESTURE.NONE) {
        charge = Math.min(1, charge + CHARGE_RATE);
    } else {
        charge = Math.max(0, charge - CHARGE_RATE * 3);
    }

    const pct = Math.round(charge * 100);
    chargePct.textContent = `${pct}%`;

    // Bar inside card
    const meta = JUTSU_META[gesture];
    const barColor = meta ? meta.shockColor : '#00cfff';
    chargeBarFill.style.width = `${pct}%`;
    chargeBarFill.style.background = `linear-gradient(90deg, #002244, ${barColor})`;

    // Arc SVG (circumference = 2π×50 ≈ 314)
    const offset = 314 * (1 - charge);
    chargeCircle.style.strokeDashoffset = offset;
    chargeCircle.style.stroke = barColor;
    chargeLabel.textContent = `${pct}%`;

    if (gesture !== GESTURE.NONE) {
        chargeArc.classList.add('visible');
    } else {
        chargeArc.classList.remove('visible');
    }
}

function flashScreen(gesture) {
    const meta = JUTSU_META[gesture];
    if (!meta) return;
    comboFlash.className = `combo-flash ${meta.flashClass} show`;
    setTimeout(() => comboFlash.classList.remove('show'), 300);
}

function showBanner(gesture) {
    const meta = JUTSU_META[gesture];
    if (!meta) return;
    clearTimeout(bannerTimeout);
    bannerKanji.textContent = meta.kanji;
    bannerText.textContent = meta.banner;
    bannerText.style.color = meta.bannerColor;
    bannerSub.textContent = meta.sub;
    jutsuBanner.className = 'jutsu-banner show';
    bannerTimeout = setTimeout(() => { jutsuBanner.className = 'jutsu-banner'; }, 900);
}

function addHistory(gesture) {
    const meta = JUTSU_META[gesture];
    if (!meta) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    historyItems.unshift({ name: meta.name, emoji: meta.emoji, color: meta.shockColor, time });
    if (historyItems.length > MAX_HISTORY) historyItems.pop();

    // Render list
    const emptyItem = historyList.querySelector('.history-empty');
    if (emptyItem) emptyItem.remove();

    historyList.innerHTML = '';
    for (const item of historyItems) {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
      <div class="history-dot" style="background:${item.color};box-shadow:0 0 6px ${item.color}"></div>
      <span class="history-name">${item.emoji} ${item.name}</span>
      <span class="history-time">${item.time}</span>
    `;
        historyList.appendChild(li);
    }
}

function updateRank(addXp) {
    totalXp += addXp;

    // Find rank
    let rank = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalXp >= RANKS[i].xpNeeded) { rank = RANKS[i]; currentRank = i; break; }
    }
    const next = RANKS[currentRank + 1];

    // XP bar
    let xpPct = 100;
    if (next) {
        const span = next.xpNeeded - rank.xpNeeded;
        const prog = totalXp - rank.xpNeeded;
        xpPct = Math.min(100, (prog / span) * 100);
        rankNextEl.textContent = `→ ${next.xpNeeded - totalXp} XP for ${next.name}`;
    } else {
        rankNextEl.textContent = '🏆 Maximum Rank Achieved!';
    }
    xpFill.style.width = `${xpPct}%`;
    rankXpEl.textContent = `${totalXp} XP`;
    rankTitleEl.textContent = rank.name;
    rankIconLgEl.textContent = rank.icon;
    rankBadgeNameEl.textContent = rank.name;
    rankBadgeIconEl.textContent = rank.icon;
}

function updateChakra(gesture) {
    if (gesture !== GESTURE.NONE) {
        chakra = Math.max(0, chakra - CHAKRA_DRAIN * (1 + charge));
    } else {
        chakra = Math.min(100, chakra + CHAKRA_REGEN);
    }
    const pct = chakra.toFixed(0);
    chakraFill.style.width = `${pct}%`;
    chakraGlow.style.width = `${pct}%`;
    chakraPercent.textContent = `${pct}%`;
    if (chakra < 30) {
        chakraFill.style.background = 'linear-gradient(90deg,#660000,#ff4444)';
        chakraGlow.style.background = '#ff4444';
    } else {
        chakraFill.style.background = 'linear-gradient(90deg,#003388,#00cfff,#ffffffaa)';
        chakraGlow.style.background = '#00cfff';
    }
}

function setOverlay(gesture, palmCenter, canvasRect) {
    // Hide all
    ['rasenganOverlay', 'chidoriOverlay', 'fireballOverlay', 'cloneOverlay', 'summonOverlay']
        .forEach(id => {
            const el = $(id);
            el.classList.remove('active', 'charged');
        });

    const meta = JUTSU_META[gesture];
    if (!meta || !palmCenter) return;

    // Overlays are absolutely positioned inside `.camera-container` (not the page),
    // so use container-relative coordinates (and mirror X to match the flipped video).
    const ox = (1 - palmCenter.x) * canvasRect.width;
    const oy = palmCenter.y * canvasRect.height;
    const el = $(meta.overlayId);
    el.style.left = `${ox}px`;
    el.style.top = `${oy}px`;

    // Scale with charge
    const sc = 0.7 + charge * 1.2;
    el.style.transform = `translate(-50%,-50%) scale(${sc})`;
    el.classList.add('active');
    if (charge >= 0.9) el.classList.add('charged');
}

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - fpsTimer >= 1000) {
        fpsValue.textContent = frameCount;
        frameCount = 0; fpsTimer = now;
    }
}

/* ═══════════════════════════════════════════
   MEDIAPIPE RESULT HANDLER
═══════════════════════════════════════════ */
function onResults(results) {
    updateFPS();

    // Resize canvas
    canvasEl.width = videoEl.videoWidth || videoEl.clientWidth;
    canvasEl.height = videoEl.videoHeight || videoEl.clientHeight;

    const detected = results.multiHandLandmarks?.length || 0;
    handCountEl.textContent = detected;

    const handsData = [];

    if (detected > 0) {
        statusDot.className = 'status-dot active';
        statusText.textContent = `${detected} hand${detected > 1 ? 's' : ''} detected`;

        // Use the first hand for primary gesture
        for (const landmarks of results.multiHandLandmarks) {
            const gesture = classifyGesture(landmarks);
            const palmCenter = getPalmCenter(landmarks);
            handsData.push({ landmarks, gesture, palmCenter, charge });
        }

        const primaryGesture = handsData[0].gesture;
        gestureLabelEl.textContent = primaryGesture !== GESTURE.NONE
            ? primaryGesture.charAt(0).toUpperCase() + primaryGesture.slice(1)
            : 'None';

        // Track gesture hold
        if (primaryGesture === lastGesture && primaryGesture !== GESTURE.NONE) {
            gestureDuration++;
        } else {
            gestureDuration = 0;
            jutsuTriggered = false;
            charge = 0;
            // Hide all overlays when gesture changes
            ['rasenganOverlay', 'chidoriOverlay', 'fireballOverlay', 'cloneOverlay', 'summonOverlay']
                .forEach(id => { $(id).classList.remove('active', 'charged'); });
        }
        lastGesture = primaryGesture;

        updateJutsuCard(primaryGesture);
        updateCharge(primaryGesture);
        updateChakra(primaryGesture);

        if (primaryGesture !== GESTURE.NONE) {
            const rect = cameraContainer.getBoundingClientRect();
            setOverlay(primaryGesture, handsData[0].palmCenter, rect);

            // First trigger event at 30 frames of hold
            if (gestureDuration === 30 && !jutsuTriggered) {
                jutsuTriggered = true;
                jutsuCount++;
                jutsuCountEl.textContent = jutsuCount;
                AudioFX.play(primaryGesture);
                showBanner(primaryGesture);
                flashScreen(primaryGesture);
                addHistory(primaryGesture);
                updateRank(JUTSU_META[primaryGesture]?.xp || 10);

                // Shockwave at full charge
                if (handsData[0].palmCenter) {
                    const cx = handsData[0].palmCenter.x * canvasEl.width;
                    const cy = handsData[0].palmCenter.y * canvasEl.height;
                    const meta = JUTSU_META[primaryGesture];
                    if (meta) EffectEngine.triggerShockwave(cx, cy, meta.shockColor);
                }
            }
        } else {
            updateJutsuCard(GESTURE.NONE);
            ['rasenganOverlay', 'chidoriOverlay', 'fireballOverlay', 'cloneOverlay', 'summonOverlay']
                .forEach(id => $(id).classList.remove('active', 'charged'));
        }

    } else {
        statusDot.className = 'status-dot';
        statusText.textContent = 'No hands detected';
        lastGesture = GESTURE.NONE;
        gestureDuration = 0; jutsuTriggered = false;
        updateJutsuCard(GESTURE.NONE);
        updateCharge(GESTURE.NONE);
        updateChakra(GESTURE.NONE);
        gestureLabelEl.textContent = '—';
        ['rasenganOverlay', 'chidoriOverlay', 'fireballOverlay', 'cloneOverlay', 'summonOverlay']
            .forEach(id => $(id).classList.remove('active', 'charged'));
    }

    EffectEngine.render(handsData);
}

/* ═══════════════════════════════════════════
   BACKGROUND KUNAI
═══════════════════════════════════════════ */
function spawnKunai() {
    const syms = ['✦', '✧', '☽', '⚡', '✕', '◈', '忍', '术'];
    for (let i = 0; i < 22; i++) {
        const el = document.createElement('span');
        el.textContent = syms[Math.floor(Math.random() * syms.length)];
        el.style.cssText = `left:${Math.random() * 100}%;font-size:${14 + Math.random() * 22}px;animation-duration:${9 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s`;
        kunaiBg.appendChild(el);
    }
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
async function init() {
    spawnKunai();
    updateRank(0); // Init rank display

    EffectEngine.init(canvasEl, shockCanvasEl);

    statusText.textContent = 'Loading MediaPipe…';

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);

    try {
        statusText.textContent = 'Requesting camera…';
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        videoEl.srcObject = stream;
        await new Promise((res) => (videoEl.onloadedmetadata = res));
        videoEl.play();

        statusDot.className = 'status-dot active';
        statusText.textContent = 'Camera active — show your hand signs!';

        const camera = new Camera(videoEl, {
            onFrame: async () => { await hands.send({ image: videoEl }); },
            width: 1280, height: 720,
        });
        camera.start();

    } catch (err) {
        console.error(err);
        statusDot.className = 'status-dot error';
        statusText.textContent = `Camera error: ${err.message}`;
    }
}

document.addEventListener('DOMContentLoaded', init);
