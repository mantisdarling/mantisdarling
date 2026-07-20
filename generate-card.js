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
  try { avatar = await loadImage(path.join(__dirname, 'profile.png')); } catch(e) { avatar = null; }
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

    // ── 4. Top & bottom accent bars (CYAN border color) ─────────────────────
    ctx.fillStyle = BORDER_COLOR;
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur  = 8;
    roundRect(ctx, 0, 0, W, 4, 0); ctx.fill();
    roundRect(ctx, 0, H - 4, W, 4, 0); ctx.fill();
    ctx.shadowBlur = 0;

    // ── 5. Avatar ────────────────────────────────────────────────────────────
    const ax = 55, ay = 105, ar = 50;
    ctx.save();
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.arc(ax, ay, ar + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    if (avatar) {
      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatar, ax - ar, ay - ar, ar * 2, ar * 2);
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

    // ── 7. Name ──────────────────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 10;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign   = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Mantis', 115, 76);
    ctx.restore();

    // Separator under name
    const sep = ctx.createLinearGradient(115, 0, 310, 0);
    sep.addColorStop(0, BORDER_COLOR); sep.addColorStop(1, 'rgba(136,68,255,0)');
    ctx.fillStyle = sep; ctx.fillRect(115, 82, 190, 1.5);

    // ── 8. Details ───────────────────────────────────────────────────────────
    const rows = [
      { label: 'cursus',  value: 'AI / CyberSec',           color: '#f1f5f9' },
      { label: 'grade',   value: 'Sensei',                  color: '#f1f5f9' },
      { label: 'connect', value: 'bsky.app/@mantisdarling', color: '#aa88ff' },
    ];
    rows.forEach((r, i) => {
      const y = 96 + i * 24;
      ctx.font      = '12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9ca3af'; ctx.fillText(r.label, 115, y);
      ctx.fillStyle = r.color;
      if (r.label === 'connect') { ctx.save(); ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 6; }
      ctx.fillText(r.value, 178, y);
      if (r.label === 'connect') ctx.restore();
    });

    // ── 9. Divider ────────────────────────────────────────────────────────────
    const div = ctx.createLinearGradient(22, 0, W - 22, 0);
    div.addColorStop(0, BORDER_COLOR); div.addColorStop(1, 'rgba(136,68,255,0)');
    ctx.fillStyle = div; ctx.fillRect(22, 185, W - 44, 1);

    // ── 10. Progress ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px "Segoe UI", Arial';
    ctx.textAlign = 'left';  ctx.fillText('LEVEL PROGRESS', 22, 205);
    ctx.fillStyle = BORDER_COLOR; ctx.textAlign = 'right'; ctx.fillText('69%', W - 22, 205);

    // Track
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, 22, 212, W - 44, 9, 4); ctx.fill();
    // Fill
    const bf = ctx.createLinearGradient(22, 0, 22 + (W - 44) * 0.69, 0);
    bf.addColorStop(0, '#440088'); bf.addColorStop(1, BORDER_COLOR);
    ctx.save(); ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 8;
    ctx.fillStyle = bf; roundRect(ctx, 22, 212, (W - 44) * 0.69, 9, 4); ctx.fill();
    ctx.restore();

    // ── 11. Badges ───────────────────────────────────────────────────────────
    // XPIDER
    ctx.save();
    ctx.strokeStyle = BORDER_COLOR; ctx.lineWidth = 1.5;
    ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, 22, 252, 78, 28, 5); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px "Segoe UI", Arial';
    ctx.textAlign = 'center'; ctx.fillText('XPIDER', 61, 270);

    // 2205 IITM
    ctx.save(); ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right'; ctx.fillText('2205', W - 22, 262);
    ctx.fillStyle = BORDER_COLOR; ctx.font = '10px "Courier New", monospace';
    ctx.fillText('IITM', W - 22, 276);
    ctx.restore();

    // ── 12. Card border ───────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = BORDER_COLOR; ctx.lineWidth = 1.5;
    ctx.shadowColor = BORDER_COLOR; ctx.shadowBlur = 6;
    roundRect(ctx, 0, 0, W, H, 16); ctx.stroke();
    ctx.restore();

    // Add frame
    encoder.addFrame(ctx);
  }

  encoder.finish();
  await new Promise(res => stream.on('finish', res));
  console.log('card.gif generated successfully!');
}

generateCard().catch(console.error);
