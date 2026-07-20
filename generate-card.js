const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const fs = require('fs');
const path = require('path');

const W = 580;
const H = 300;
const FRAMES = 30;
const FRAME_DELAY = 8;
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

  // Setup GIF encoder
  const encoder = new GIFEncoder(W, H, 'neuquant', true);
  const stream  = fs.createWriteStream(path.join(__dirname, 'card.gif'));
  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0);    // loop forever
  encoder.setDelay(FRAME_DELAY * 10); // ms
  encoder.setQuality(10);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  for (let f = 0; f < FRAMES; f++) {
    ctx.clearRect(0, 0, W, H);

    // ── 1. Background ───────────────────────────────────────────────────────
    if (bg) {
      ctx.save();
      roundRect(ctx, 0, 0, W, H, 16);
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0a0000';
      roundRect(ctx, 0, 0, W, H, 16);
      ctx.fill();
    }

    // ── 2. Dark overlay ─────────────────────────────────────────────────────
    const overlay = ctx.createLinearGradient(0, 0, W, 0);
    overlay.addColorStop(0,    'rgba(0,0,0,0.45)');
    overlay.addColorStop(0.40, 'rgba(0,0,0,0.25)');
    overlay.addColorStop(1,    'rgba(0,0,0,0.00)');
    ctx.fillStyle = overlay;
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.fill();

    // ── 3. Animated spider web ───────────────────────────────────────────────
    drawWeb(ctx, f);

    // ── 4. No border bars — clean card like Abel's ──────────────────────────
    ctx.shadowBlur = 0;

    // ── 5. Avatar (rounded square like Abel's) ───────────────────────────────
    const avX = 18, avY = 40, avW = 90, avH = 110, avR = 10;
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
      ctx.fillStyle = BORDER_COLOR;
      ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('M', avX + avW/2, avY + avH/2);
      ctx.restore();
    }

    // ── 6. IITM logo ─────────────────────────────────────────────────────────
    const lx = W - 40, ly = 40, lr = 26;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth   = 2;
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.restore();
    if (logo) {
      ctx.save();
      ctx.beginPath(); ctx.arc(lx, ly, lr - 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logo, lx - lr + 2, ly - lr + 2, (lr - 2) * 2, (lr - 2) * 2);
      ctx.restore();
    }

    // ── 7. Title ──────────────────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign   = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(200,200,255,0.6)'; ctx.shadowBlur = 8;
    ctx.fillText("mantisdarling's Profile", 120, 50);
    ctx.restore();

    // ── 8. Details (label: value format like Abel) ──────────────────────────
    const LABEL_X = 120;
    const VALUE_X = 200;
    const rows = [
      { label: 'name:',    value: 'Mantis',                  color: '#ffffff' },
      { label: 'cursus:',  value: 'AI / CyberSec',           color: '#38bdf8' },
      { label: 'grade:',   value: 'Sensei',                  color: '#38bdf8' },
      { label: 'connect:', value: 'bsky.app/@mantisdarling', color: '#818cf8' },
    ];
    rows.forEach((r, i) => {
      const y = 72 + i * 28;
      // Label
      ctx.font      = '12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText(r.label, LABEL_X, y);
      // Value
      ctx.save();
      ctx.font      = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur  = r.label === 'name:' ? 0 : 10;
      ctx.fillText(r.value, VALUE_X, y);
      ctx.restore();
    });

    // ── 9. Divider ────────────────────────────────────────────────────────────
    const div = ctx.createLinearGradient(22, 0, W - 22, 0);
    div.addColorStop(0, '#38bdf8'); div.addColorStop(0.5, '#818cf8'); div.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = div; ctx.fillRect(22, 190, W - 44, 1);

    // ── 10. Progress bar (text INSIDE like Abel) ──────────────────────────────
    const barX = 22, barY = 202, barW = W - 44, barH = 26, barRadius = 5;
    // Track
    ctx.fillStyle = 'rgba(15,15,30,0.75)';
    roundRect(ctx, barX, barY, barW, barH, barRadius); ctx.fill();
    // Fill 69%
    const fillW = barW * 0.69;
    const bf = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    bf.addColorStop(0, '#1d4ed8'); bf.addColorStop(1, '#38bdf8');
    ctx.save();
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
    ctx.fillStyle = bf;
    roundRect(ctx, barX, barY, fillW, barH, barRadius); ctx.fill();
    ctx.restore();
    // Text inside bar — "level 69 - 69%" like Abel
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText('level 69  -  69%', barX + barW / 2, barY + barH / 2);
    ctx.restore();

    // ── 11. Bottom badges (like Abel) ────────────────────────────────────────
    // XPIDER badge — plain outlined, like Abel's STUDENT
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 22, 242, 80, 26, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('XPIDER', 62, 259);

    // 2205 IITM — large monospace right side like Abel's 1337
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.letterSpacing = '4px';
    ctx.fillText('2205', W - 22, 260);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('I  I  T  M', W - 22, 274);
    ctx.restore();

    // ── 12. No card border (clean look) ──────────────────────────────────────

    // Add frame
    encoder.addFrame(ctx);
  }

  encoder.finish();
  await new Promise(res => stream.on('finish', res));
  console.log('card.gif generated successfully!');
}

generateCard().catch(console.error);
