const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const fs = require('fs');
const path = require('path');

const W = 580;           // logical width
const H = 300;           // logical height
const SCALE = 3;         // render at 3x for maximum sharpness
const FRAMES = 12;       // fewer frames = smaller file
const FRAME_DELAY = 16;  // 160ms per frame = smooth loop
const BORDER_COLOR = '#8844ff';

// Spider web center (right side, not covering text)
const WEB_CX = 460;
const WEB_CY = 150;
const SPOKES = 12;
const RINGS  = 5;
const MAX_R  = 180;

function getWebPoints() {
  // Compute spoke endpoints and ring intersection points
  const points = [];
  for (let s = 0; s < SPOKES; s++) {
    const angle = (s / SPOKES) * Math.PI * 2 - Math.PI / 2;
    points.push({ angle, cos: Math.cos(angle), sin: Math.sin(angle) });
  }
  return points;
}

function drawWeb(ctx, dashOffset) {
  const spokes = getWebPoints();
  const ringRadii = Array.from({ length: RINGS }, (_, i) => MAX_R * ((i + 1) / RINGS));

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  // ── Draw RINGS (concentric arcs) ──────────────────────────────────────────
  ringRadii.forEach((r, ri) => {
    const alpha = 0.18 + ri * 0.06;
    const dashLen = 10 + ri * 4;
    const gap     = 8  + ri * 3;
    const period  = dashLen + gap;
    // Offset advances each frame
    const offset = (dashOffset * 2.5) % period;

    // Outer glow
    ctx.beginPath();
    ctx.arc(WEB_CX, WEB_CY, r, 0, Math.PI * 2);
    ctx.setLineDash([dashLen, gap]);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = `rgba(255, 20, 20, ${alpha * 0.4})`;
    ctx.lineWidth   = 6;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur  = 14;
    ctx.stroke();

    // Core line
    ctx.beginPath();
    ctx.arc(WEB_CX, WEB_CY, r, 0, Math.PI * 2);
    ctx.setLineDash([dashLen, gap]);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = `rgba(255, 60, 60, ${alpha + 0.25})`;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 6;
    ctx.stroke();
  });

  // ── Draw SPOKES (radial lines) ────────────────────────────────────────────
  spokes.forEach((sp, si) => {
    const period = 28;
    const offset = (dashOffset * 1.8 + si * 3) % period;

    // Outer glow
    ctx.beginPath();
    ctx.moveTo(WEB_CX, WEB_CY);
    ctx.lineTo(WEB_CX + sp.cos * MAX_R, WEB_CY + sp.sin * MAX_R);
    ctx.setLineDash([14, 14]);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = 'rgba(255, 30, 30, 0.20)';
    ctx.lineWidth   = 5;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur  = 10;
    ctx.stroke();

    // Core
    ctx.beginPath();
    ctx.moveTo(WEB_CX, WEB_CY);
    ctx.lineTo(WEB_CX + sp.cos * MAX_R, WEB_CY + sp.sin * MAX_R);
    ctx.setLineDash([14, 14]);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.55)';
    ctx.lineWidth   = 1.2;
    ctx.shadowBlur  = 5;
    ctx.stroke();
  });

  // Reset dash
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // ── Center dot ────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(WEB_CX, WEB_CY, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur  = 12;
  ctx.fill();

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateCard() {
  // Pre-load images
  let bg, avatar, logo;
  try { bg     = await loadImage(path.join(__dirname, 'bg.jpg'));      } catch(e) { bg = null; }
  try { avatar = await loadImage(path.join(__dirname, 'avatar.jpg')); } catch(e) {
    try { avatar = await loadImage(path.join(__dirname, 'avatar.png')); } catch(e2) {
      try { avatar = await loadImage(path.join(__dirname, 'profile.png')); } catch(e3) { avatar = null; }
    }
  }
  try { logo   = await loadImage(path.join(__dirname, 'iitm.svg'));    } catch(e) { logo = null; }

  // Setup GIF encoder at 2x resolution
  const encoder = new GIFEncoder(W * SCALE, H * SCALE, 'octree', true);
  const stream  = fs.createWriteStream(path.join(__dirname, 'card.gif'));
  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY * 10);
  encoder.setQuality(1);  // best quality
  encoder.setTransparent(0xFF00FF); // magenta = transparent (rounded corners)

  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx    = canvas.getContext('2d');
  // Scale all drawing to 2x
  ctx.scale(SCALE, SCALE);
  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.antialias = 'subpixel';

  for (let f = 0; f < FRAMES; f++) {
    // Fill canvas with magenta (transparent chroma key) — corners stay transparent
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(0, 0, W, H);

    // Clip ALL drawing to rounded card shape (18px like masenjo's card)
    ctx.save();
    roundRect(ctx, 0, 0, W, H, 18); ctx.clip();

    // ── 1. Background ───────────────────────────────────────────────────────
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);
    }

    // ── 2. Dark overlay ─────────────────────────────────────────────────────
    const overlay = ctx.createLinearGradient(0, 0, W, 0);
    overlay.addColorStop(0,    'rgba(0,0,0,0.82)');
    overlay.addColorStop(0.55, 'rgba(0,0,0,0.60)');
    overlay.addColorStop(1,    'rgba(0,0,0,0.18)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);

    // ── 3. Animated spider web ───────────────────────────────────────────────
    drawWeb(ctx, f);
    ctx.shadowBlur = 0;

    // ── 4. Title — top left (like masenjo's Profile) ─────────────────────────
    ctx.save();
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(255,255,255,0.25)';
    ctx.shadowBlur  = 4;
    ctx.fillText("mantisdarling's Profile", 18, 32);
    ctx.restore();

    // ── 5. IITM badge — top right (like UM6P badge in screenshot) ────────────
    const bdgW = 58, bdgH = 24, bdgX = W - bdgW - 14, bdgY = 12;
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.fillStyle   = 'rgba(0,0,0,0.55)';
    roundRect(ctx, bdgX, bdgY, bdgW, bdgH, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('IITM', bdgX + bdgW / 2, bdgY + bdgH / 2);
    ctx.restore();

    // ── 6. Avatar — square rounded, left side below title ────────────────────
    const avX = 18, avY = 46, avW = 100, avH = 130, avR = 8;
    if (avatar) {
      ctx.save();
      roundRect(ctx, avX, avY, avW, avH, avR);
      ctx.clip();
      ctx.drawImage(avatar, avX, avY, avW, avH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#1a0020';
      roundRect(ctx, avX, avY, avW, avH, avR); ctx.fill();
      ctx.fillStyle = '#00d4e8';
      ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('M', avX + avW / 2, avY + avH / 2);
      ctx.restore();
    }

    // ── 7. Text rows — right of avatar, like masenjo's layout ────────────────
    const LABEL_X   = 132;
    const VALUE_X   = 208;
    const LABEL_CLR = '#8892a4';
    const VALUE_CLR = '#00d4e8';
    const rows = [
      { label: 'name:',    value: 'Mantis'                  },
      { label: 'cursus:',  value: 'AI / CyberSec'           },
      { label: 'grade:',   value: 'Sensei'                   },
      { label: 'connect:', value: 'bsky.app/@mantisdarling'  },
    ];
    rows.forEach((r, i) => {
      const y = 72 + i * 27;
      ctx.save();
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = LABEL_CLR; ctx.shadowBlur = 0;
      ctx.fillText(r.label, LABEL_X, y);
      ctx.restore();
      ctx.save();
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = VALUE_CLR;
      ctx.shadowColor = VALUE_CLR; ctx.shadowBlur = 8;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(r.value, VALUE_X, y);
      ctx.restore();
    });

    // ── 8. Progress bar — full width below avatar section ────────────────────
    const barX = 18, barY = 192, barW = W - 36, barH = 30, barR = 6;
    // Track
    ctx.fillStyle = 'rgba(10,10,25,0.80)';
    roundRect(ctx, barX, barY, barW, barH, barR); ctx.fill();
    // Fill
    const fillW = barW * 0.69;
    const bf = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    bf.addColorStop(0, '#1a40c0'); bf.addColorStop(1, '#00d4e8');
    ctx.save();
    ctx.shadowColor = '#00d4e8'; ctx.shadowBlur = 12;
    ctx.fillStyle = bf;
    roundRect(ctx, barX, barY, fillW, barH, barR); ctx.fill();
    ctx.restore();
    // Text inside bar
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 5;
    ctx.fillText('level 69  -  69%', barX + barW / 2, barY + barH / 2);
    ctx.restore();

    // ── 9. XPIDER badge — bottom left like "STUDENT" ────────────────────────
    ctx.save();
    ctx.strokeStyle = VALUE_CLR; ctx.lineWidth = 1.8;
    ctx.fillStyle   = 'rgba(0,20,30,0.60)';
    roundRect(ctx, 18, 242, 84, 28, 5); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = VALUE_CLR;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('XPIDER', 60, 256);
    ctx.restore();

    // ── 10. 2205 + IITM logo — bottom right like "1337 42 NETWORK" ───────────
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('2205', W - 90, 268);
    ctx.restore();
    // IITM logo circle
    if (logo) {
      ctx.save();
      ctx.beginPath(); ctx.arc(W - 64, 257, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.clip();
      ctx.drawImage(logo, W - 80, 241, 32, 32);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = VALUE_CLR;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('I  I  T  M', W - 44, 257);
    ctx.restore();

    ctx.restore(); // end rounded card clip

    // Add frame
    encoder.addFrame(ctx);
  }

  encoder.finish();
  await new Promise(res => stream.on('finish', res));
  console.log('card.gif generated successfully!');
}

generateCard().catch(console.error);
