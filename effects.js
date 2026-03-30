/**
 * effects.js v2 — Enhanced Naruto Jutsu Effects Engine
 * 5 jutsu particle systems + shockwave rings + charge scaling
 */
'use strict';

/* ─────────────────────────────────────────
   BASE PARTICLE
───────────────────────────────────────── */
class Particle {
    constructor(x, y, opts = {}) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * (opts.speed || 4);
        this.vy = (Math.random() - 0.5) * (opts.speed || 4);
        this.life = 1.0;
        this.decay = opts.decay || (0.012 + Math.random() * 0.02);
        this.size = opts.size || (3 + Math.random() * 5);
        this.color = opts.color || '#00cfff';
        this.glow = opts.glow || '#00cfff';
        this.gravity = opts.gravity || 0;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.size *= 0.986;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.shadowBlur = 18; ctx.shadowColor = this.glow;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    get alive() { return this.life > 0; }
}

/* ─────────────────────────────────────────
   RASENGAN ORBITAL PARTICLE
───────────────────────────────────────── */
class RasenganParticle extends Particle {
    constructor(cx, cy, chargeScale = 1) {
        const angle = Math.random() * Math.PI * 2;
        const r = (20 + Math.random() * 55) * chargeScale;
        super(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, {
            decay: 0.007 + Math.random() * 0.012,
            size: 2 + Math.random() * 7 * chargeScale,
            color: `hsl(${190 + Math.random() * 30},100%,${68 + Math.random() * 25}%)`,
            glow: '#00cfff',
        });
        this._cx = cx; this._cy = cy; this._r = r; this._a = angle;
        this._speed = (Math.random() > 0.5 ? 1 : -1) * (0.05 + Math.random() * 0.07);
    }
    update() {
        this._a += this._speed; this._r *= 0.996;
        this.x = this._cx + Math.cos(this._a) * this._r;
        this.y = this._cy + Math.sin(this._a) * this._r;
        this.life -= this.decay; this.size *= 0.991;
    }
}

/* ─────────────────────────────────────────
   CHIDORI LIGHTNING PARTICLE
───────────────────────────────────────── */
class ChidoriParticle extends Particle {
    constructor(cx, cy, chargeScale = 1) {
        super(cx, cy, {
            speed: (7 + Math.random() * 9) * chargeScale,
            decay: 0.018 + Math.random() * 0.028,
            size: 1.5 + Math.random() * 4,
            color: `hsl(${42 + Math.random() * 30},100%,${78 + Math.random() * 20}%)`,
            glow: '#ffe000',
        });
        this._zz = 0;
    }
    update() {
        this._zz++;
        if (this._zz % 2 === 0) { this.vx += (Math.random() - 0.5) * 5; this.vy += (Math.random() - 0.5) * 5; }
        super.update();
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.shadowBlur = 28; ctx.shadowColor = '#ffe000';
        ctx.strokeStyle = this.color; ctx.lineWidth = this.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 2.5, this.y + this.vy * 2.5);
        ctx.stroke();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────
   FIRE PARTICLE (Fireball Jutsu)
───────────────────────────────────────── */
class FireParticle extends Particle {
    constructor(cx, cy, chargeScale = 1) {
        const angle = (Math.random() - 0.5) * Math.PI * 0.8;
        const spd = (3 + Math.random() * 7) * chargeScale;
        super(cx, cy, {
            speed: 0, decay: 0.01 + Math.random() * 0.016,
            size: 5 + Math.random() * 12 * chargeScale,
            color: `hsl(${Math.random() * 35},100%,${55 + Math.random() * 30}%)`,
            glow: '#ff5500', gravity: -0.18,
        });
        this.vx = Math.cos(angle) * spd * 0.5;
        this.vy = -spd;
        this._hue = 10 + Math.random() * 30;
    }
    update() {
        this._hue += 2;
        this.color = `hsl(${this._hue},100%,${55 + this.life * 25}%)`;
        super.update();
        this.vx *= 0.97;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.85);
        ctx.shadowBlur = 30; ctx.shadowColor = '#ff6600';
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, '#fff8');
        g.addColorStop(0.3, this.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────
   CLONE PARTICLE (Shadow Clone Jutsu)
───────────────────────────────────────── */
class CloneParticle extends Particle {
    constructor(cx, cy, chargeScale = 1) {
        super(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80, {
            speed: 1.5 + Math.random() * 3,
            decay: 0.006 + Math.random() * 0.01,
            size: 2 + Math.random() * 8 * chargeScale,
            color: `hsl(${140 + Math.random() * 30},100%,${60 + Math.random() * 30}%)`,
            glow: '#00ff88', gravity: -0.04,
        });
        this._pulse = Math.random() * Math.PI * 2;
    }
    update() {
        this._pulse += 0.15;
        this.size *= (1 + Math.sin(this._pulse) * 0.04);
        super.update();
    }
}

/* ─────────────────────────────────────────
   SMOKE PARTICLE (Summoning Jutsu)
───────────────────────────────────────── */
class SmokeParticle extends Particle {
    constructor(cx, cy, chargeScale = 1) {
        super(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 20, {
            speed: 0, decay: 0.005 + Math.random() * 0.009,
            size: 10 + Math.random() * 22 * chargeScale,
            color: `hsl(280,${50 + Math.random() * 40}%,${40 + Math.random() * 30}%)`,
            glow: '#cc44ff', gravity: -0.12,
        });
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(0.5 + Math.random() * 1.5);
    }
    update() {
        this.vx += (Math.random() - 0.5) * 0.3;
        super.update();
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.5);
        ctx.shadowBlur = 20; ctx.shadowColor = '#cc44ff';
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, this.color + 'cc');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────
   SPIRAL RING (Rasengan)
───────────────────────────────────────── */
class SpiralRing {
    constructor(cx, cy, r, color = '#00cfff') {
        this._cx = cx; this._cy = cy; this._r = r;
        this._a = 0; this._speed = 0.07;
        this.life = 1; this.decay = 0.005;
        this._color = color;
    }
    update(cx, cy) { this._cx = cx; this._cy = cy; this._a += this._speed; this.life -= this.decay; }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.55);
        ctx.shadowBlur = 35; ctx.shadowColor = this._color;
        ctx.strokeStyle = this._color; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = this._a + (i * Math.PI * 2) / 3;
            const bx = this._cx + Math.cos(a) * this._r;
            const by = this._cy + Math.sin(a) * this._r;
            i === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
        }
        ctx.closePath(); ctx.stroke();
        ctx.restore();
    }
    get alive() { return this.life > 0; }
}

/* ─────────────────────────────────────────
   LIGHTNING BOLT ARC
───────────────────────────────────────── */
class LightningBolt {
    constructor(x1, y1, x2, y2, color = '#ffe000') {
        this._x1 = x1; this._y1 = y1; this._x2 = x2; this._y2 = y2;
        this._color = color;
        this.life = 1; this.decay = 0.09;
        this._segs = this._build();
    }
    _build() {
        const segs = []; let cx = this._x1, cy = this._y1;
        const steps = 5 + Math.floor(Math.random() * 5);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const nx = this._x1 + (this._x2 - this._x1) * t + (Math.random() - 0.5) * 28;
            const ny = this._y1 + (this._y2 - this._y1) * t + (Math.random() - 0.5) * 28;
            segs.push({ x1: cx, y1: cy, x2: nx, y2: ny }); cx = nx; cy = ny;
        }
        return segs;
    }
    update() { this.life -= this.decay; if (Math.random() > 0.65) this._segs = this._build(); }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.shadowBlur = 22; ctx.shadowColor = this._color;
        ctx.strokeStyle = this._color; ctx.lineWidth = 1.2 + this.life * 2;
        ctx.beginPath();
        for (const s of this._segs) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
        ctx.stroke(); ctx.restore();
    }
    get alive() { return this.life > 0; }
}

/* ─────────────────────────────────────────
   SHOCKWAVE RING (on jutsu release)
───────────────────────────────────────── */
class ShockwaveRing {
    constructor(cx, cy, color) {
        this.cx = cx; this.cy = cy;
        this.r = 10; this.maxR = 180;
        this.life = 1; this.decay = 0.025;
        this.color = color;
    }
    update() { this.r += 8; this.life -= this.decay; }
    draw(ctx) {
        if (this.life <= 0 || this.r > this.maxR) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.7);
        ctx.shadowBlur = 30; ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    get alive() { return this.life > 0 && this.r < this.maxR; }
}

/* ─────────────────────────────────────────
   GLOBAL SHOCKWAVE (full screen canvas)
───────────────────────────────────────── */
class GlobalShockwave {
    constructor(color) {
        this.r = 0; this.maxR = Math.hypot(window.innerWidth, window.innerHeight) * 0.8;
        this.cx = window.innerWidth / 2; this.cy = window.innerHeight / 2;
        this.life = 1; this.decay = 0.04; this.color = color;
    }
    update() { this.r += 28; this.life -= this.decay; }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life * 0.35);
        ctx.strokeStyle = this.color; ctx.lineWidth = 4;
        ctx.shadowBlur = 40; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    get alive() { return this.life > 0; }
}

/* ─────────────────────────────────────────
   EFFECT ENGINE
───────────────────────────────────────── */
const EffectEngine = (() => {
    let _canvas = null, _ctx = null;
    let _shockCanvas = null, _shockCtx = null;
    const _particles = [], _rings = [], _bolts = [], _waves = [], _globalWaves = [];
    let _frame = 0;

    function init(canvas, shockCanvas) {
        _canvas = canvas; _ctx = canvas.getContext('2d');
        _shockCanvas = shockCanvas; _shockCtx = shockCanvas.getContext('2d');
        _resizeShock();
        window.addEventListener('resize', _resizeShock);
    }

    function _resizeShock() {
        if (!_shockCanvas) return;
        _shockCanvas.width = window.innerWidth;
        _shockCanvas.height = window.innerHeight;
    }

    /* Jutsu spawn functions */
    function spawnRasengan(cx, cy, charge = 1) {
        const count = Math.floor(4 + charge * 6);
        for (let i = 0; i < count; i++) _particles.push(new RasenganParticle(cx, cy, 0.5 + charge * 0.8));
        if (_frame % 4 === 0) _rings.push(new SpiralRing(cx, cy, (40 + Math.random() * 35) * (0.6 + charge * 0.6), '#00cfff'));
    }

    function spawnChidori(cx, cy, charge = 1) {
        const count = Math.floor(5 + charge * 8);
        for (let i = 0; i < count; i++) _particles.push(new ChidoriParticle(cx, cy, 0.6 + charge * 0.7));
        if (_frame % 3 === 0) {
            const a = Math.random() * Math.PI * 2;
            const d = (30 + Math.random() * 70) * (0.5 + charge * 0.8);
            _bolts.push(new LightningBolt(cx, cy, cx + Math.cos(a) * d, cy + Math.sin(a) * d, '#ffe000'));
        }
    }

    function spawnFireball(cx, cy, charge = 1) {
        const count = Math.floor(6 + charge * 10);
        for (let i = 0; i < count; i++) _particles.push(new FireParticle(cx, cy, 0.5 + charge * 0.9));
        if (_frame % 5 === 0) _rings.push(new SpiralRing(cx, cy, (35 + Math.random() * 40) * (0.5 + charge * 0.7), '#ff6600'));
    }

    function spawnClone(cx, cy, charge = 1) {
        const count = Math.floor(5 + charge * 8);
        for (let i = 0; i < count; i++) _particles.push(new CloneParticle(cx, cy, 0.5 + charge * 0.8));
        if (_frame % 6 === 0) _rings.push(new SpiralRing(cx, cy, (50 + Math.random() * 40) * (0.5 + charge * 0.7), '#00ff88'));
    }

    function spawnSummoning(cx, cy, charge = 1) {
        const count = Math.floor(4 + charge * 7);
        for (let i = 0; i < count; i++) _particles.push(new SmokeParticle(cx, cy, 0.5 + charge * 0.9));
        if (_frame % 4 === 0) {
            const a = Math.random() * Math.PI * 2;
            const d = (20 + Math.random() * 60) * (0.5 + charge * 0.7);
            _bolts.push(new LightningBolt(cx, cy, cx + Math.cos(a) * d, cy + Math.sin(a) * d, '#cc44ff'));
        }
    }

    /* Shockwave burst (called when charge >= 1 and jutsu fires) */
    function triggerShockwave(px, py, color) {
        _waves.push(new ShockwaveRing(px, py, color));
        _waves.push(new ShockwaveRing(px, py, color));
        _globalWaves.push(new GlobalShockwave(color));
    }

    /* Draw hand skeleton */
    function drawSkeleton(lm, color, W, H) {
        const CONN = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
        ];
        _ctx.save();
        _ctx.shadowBlur = 10; _ctx.shadowColor = color;
        _ctx.strokeStyle = color + 'cc'; _ctx.lineWidth = 1.8;
        for (const [a, b] of CONN) {
            const A = lm[a], B = lm[b];
            _ctx.beginPath(); _ctx.moveTo(A.x * W, A.y * H); _ctx.lineTo(B.x * W, B.y * H); _ctx.stroke();
        }
        for (const p of lm) {
            _ctx.beginPath(); _ctx.arc(p.x * W, p.y * H, 3, 0, Math.PI * 2);
            _ctx.fillStyle = '#fff'; _ctx.fill();
        }
        _ctx.restore();
    }

    function drawPalmGlow(cx, cy, color1, color2) {
        const g = _ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
        g.addColorStop(0, color1 + 'aa');
        g.addColorStop(0.4, color2 + '33');
        g.addColorStop(1, 'transparent');
        _ctx.save(); _ctx.globalAlpha = 0.75; _ctx.fillStyle = g;
        _ctx.beginPath(); _ctx.arc(cx, cy, 100, 0, Math.PI * 2); _ctx.fill(); _ctx.restore();
    }

    /* Main render */
    function render(hands) {
        if (!_ctx || !_canvas) return;
        _frame++;
        const W = _canvas.width, H = _canvas.height;
        _ctx.clearRect(0, 0, W, H);

        if (hands && hands.length > 0) {
            for (const hand of hands) {
                const { landmarks, gesture, palmCenter, charge } = hand;
                const cs = 0.4 + (charge || 0) * 0.8;
                const GLOW = {
                    rasengan: ['#00cfff', '#0044cc'],
                    chidori: ['#ffe000', '#ff9900'],
                    fireball: ['#ff5500', '#ff2200'],
                    shadowclone: ['#00ff88', '#008844'],
                    summoning: ['#cc44ff', '#660088'],
                };
                const col = gesture !== 'none' ? (GLOW[gesture] || ['#ff6b00', '#ff3300']) : ['#ff6b00', '#ff3300'];
                drawSkeleton(landmarks, col[0], W, H);

                if (palmCenter) {
                    const px = palmCenter.x * W, py = palmCenter.y * H;
                    if (gesture !== 'none') drawPalmGlow(px, py, col[0], col[1]);
                    if (gesture === 'rasengan') spawnRasengan(px, py, cs);
                    else if (gesture === 'chidori') spawnChidori(px, py, cs);
                    else if (gesture === 'fireball') spawnFireball(px, py, cs);
                    else if (gesture === 'shadowclone') spawnClone(px, py, cs);
                    else if (gesture === 'summoning') spawnSummoning(px, py, cs);
                }
            }
        }

        // Rings
        const ringCx = hands?.[0]?.palmCenter ? hands[0].palmCenter.x * W : W / 2;
        const ringCy = hands?.[0]?.palmCenter ? hands[0].palmCenter.y * H : H / 2;
        for (let i = _rings.length - 1; i >= 0; i--) {
            if (!_rings[i].alive) { _rings.splice(i, 1); continue; }
            _rings[i].update(ringCx, ringCy); _rings[i].draw(_ctx);
        }
        // Bolts
        for (let i = _bolts.length - 1; i >= 0; i--) {
            if (!_bolts[i].alive) { _bolts.splice(i, 1); continue; }
            _bolts[i].update(); _bolts[i].draw(_ctx);
        }
        // Shockwaves on canvas
        for (let i = _waves.length - 1; i >= 0; i--) {
            if (!_waves[i].alive) { _waves.splice(i, 1); continue; }
            _waves[i].update(); _waves[i].draw(_ctx);
        }
        // Particles
        for (let i = _particles.length - 1; i >= 0; i--) {
            if (!_particles[i].alive) { _particles.splice(i, 1); continue; }
            _particles[i].update(); _particles[i].draw(_ctx);
        }
        if (_particles.length > 900) _particles.splice(0, _particles.length - 900);

        // Global shockwave on full-screen canvas
        if (_shockCtx && _shockCanvas) {
            _shockCtx.clearRect(0, 0, _shockCanvas.width, _shockCanvas.height);
            for (let i = _globalWaves.length - 1; i >= 0; i--) {
                if (!_globalWaves[i].alive) { _globalWaves.splice(i, 1); continue; }
                _globalWaves[i].update(); _globalWaves[i].draw(_shockCtx);
            }
        }
    }

    function clear() {
        _particles.length = 0; _rings.length = 0; _bolts.length = 0;
        _waves.length = 0; _globalWaves.length = 0;
        if (_ctx && _canvas) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }

    return { init, render, clear, triggerShockwave };
})();

window.EffectEngine = EffectEngine;
