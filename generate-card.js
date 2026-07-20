const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 700;
const H = 340;

async function generateCard() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── 1. BACKGROUND: Spider-Man image covering full card ──────────────────
  try {
    const bg = await loadImage(path.join(__dirname, 'bg.jpg'));
    ctx.save();
    // Rounded rect clip
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.clip();
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.restore();
  } catch (e) {
    // Fallback dark red gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0a0000');
    grad.addColorStop(1, '#1a0000');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.fill();
  }

  // ── 2. DARK OVERLAY (left side denser for readability) ──────────────────
  const overlay = ctx.createLinearGradient(0, 0, W, 0);
  overlay.addColorStop(0,    'rgba(0,0,0,0.88)');
  overlay.addColorStop(0.55, 'rgba(0,0,0,0.70)');
  overlay.addColorStop(1,    'rgba(0,0,0,0.30)');
  ctx.fillStyle = overlay;
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  // ── 3. RED WEB LINES (static, spider-web aesthetic) ─────────────────────
  drawWebLines(ctx, W, H);

  // ── 4. TOP & BOTTOM ACCENT BARS ─────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0,   '#cc0000');
  accentGrad.addColorStop(0.5, '#ff4444');
  accentGrad.addColorStop(1,   '#880000');
  ctx.fillStyle = accentGrad;
  roundRect(ctx, 0, 0, W, 4, 0);
  ctx.fill();
  ctx.fillStyle = accentGrad;
  roundRect(ctx, 0, H - 4, W, 4, 0);
  ctx.fill();

  // ── 5. PROFILE AVATAR ────────────────────────────────────────────────────
  const avatarX = 62, avatarY = 100, avatarR = 54;
  // Glow ring
  ctx.save();
  ctx.shadowColor = '#cc0000';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  try {
    const avatar = await loadImage(path.join(__dirname, 'profile.png'));
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  } catch(e) {
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', avatarX, avatarY);
  }

  // ── 6. IITM LOGO (top right circle) ──────────────────────────────────────
  const logoX = W - 48, logoY = 42, logoR = 28;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#cc0000';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();

  try {
    const logo = await loadImage(path.join(__dirname, 'iitm.svg'));
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX - logoR + 2, logoY - logoR + 2, (logoR - 2) * 2, (logoR - 2) * 2);
    ctx.restore();
  } catch(e) {
    ctx.fillStyle = '#880000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IITM', logoX, logoY);
  }

  // ── 7. NAME ───────────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = '#ff2222';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("Mantis", 140, 82);
  ctx.restore();

  // Separator line under name
  const sepGrad = ctx.createLinearGradient(140, 0, 360, 0);
  sepGrad.addColorStop(0, '#cc0000');
  sepGrad.addColorStop(1, 'rgba(204,0,0,0)');
  ctx.fillStyle = sepGrad;
  ctx.fillRect(140, 88, 220, 1.5);

  // ── 8. DETAILS ───────────────────────────────────────────────────────────
  const details = [
    { label: 'name',    value: 'Mantis',                    color: '#f1f5f9' },
    { label: 'cursus',  value: 'AI / CyberSec',             color: '#f1f5f9' },
    { label: 'grade',   value: 'Sensei',                    color: '#f1f5f9' },
    { label: 'connect', value: 'bsky.app/@mantisdarling',   color: '#ff6666' },
  ];

  details.forEach((d, i) => {
    const y = 112 + i * 25;
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'left';
    ctx.fillText(d.label, 140, y);
    ctx.fillStyle = d.color;
    if (d.label === 'connect') {
      ctx.save();
      ctx.shadowColor = '#cc0000';
      ctx.shadowBlur = 6;
    }
    ctx.fillText(d.value, 215, y);
    if (d.label === 'connect') ctx.restore();
  });

  // ── 9. DIVIDER ────────────────────────────────────────────────────────────
  const divGrad = ctx.createLinearGradient(30, 0, W - 30, 0);
  divGrad.addColorStop(0, 'rgba(204,0,0,0.6)');
  divGrad.addColorStop(0.5, 'rgba(204,0,0,0.3)');
  divGrad.addColorStop(1, 'rgba(204,0,0,0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(30, 210, W - 60, 1);

  // ── 10. PROGRESS LABEL ───────────────────────────────────────────────────
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px "Segoe UI", Arial';
  ctx.textAlign = 'left';
  ctx.fillText('LEVEL PROGRESS', 30, 232);
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'right';
  ctx.fillText('69%', W - 30, 232);

  // ── 11. PROGRESS BAR ─────────────────────────────────────────────────────
  const barX = 30, barY = 238, barW = W - 60, barH = 10, barR = 5;
  // Track
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, barX, barY, barW, barH, barR);
  ctx.fill();
  // Fill (69%)
  const fillW = barW * 0.69;
  const barFill = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  barFill.addColorStop(0, '#880000');
  barFill.addColorStop(1, '#ff2222');
  ctx.save();
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.fillStyle = barFill;
  roundRect(ctx, barX, barY, fillW, barH, barR);
  ctx.fill();
  ctx.restore();

  // ── 12. BOTTOM BADGES ────────────────────────────────────────────────────
  // XPIDER badge
  ctx.save();
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#cc0000';
  ctx.shadowBlur = 8;
  roundRect(ctx, 30, 265, 90, 30, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, 30, 265, 90, 30, 6);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('XPIDER', 75, 284);

  // 2205 IITM
  ctx.save();
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('2205', W - 30, 275);
  ctx.fillStyle = '#ff6666';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('IITM', W - 30, 291);
  ctx.restore();

  // ── 13. CARD BORDER ──────────────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = 'rgba(204,0,0,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.stroke();
  ctx.restore();

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'card.png'), buffer);
  console.log('card.png generated successfully!');
}

function drawWebLines(ctx, W, H) {
  // Red spider-web style diagonal lines
  const lines = [
    // Main diagonals from corners
    { x1: 0,   y1: 0,   x2: W*0.6, y2: H,      alpha: 0.12 },
    { x1: 0,   y1: 0,   x2: W*0.4, y2: H,      alpha: 0.08 },
    { x1: 0,   y1: 0,   x2: W,     y2: H*0.7,  alpha: 0.10 },
    { x1: W,   y1: 0,   x2: 0,     y2: H*0.6,  alpha: 0.09 },
    { x1: W,   y1: 0,   x2: W*0.3, y2: H,      alpha: 0.07 },
    // Cross lines
    { x1: 0,   y1: H*0.3, x2: W*0.5, y2: 0,    alpha: 0.06 },
    { x1: 0,   y1: H*0.6, x2: W*0.4, y2: 0,    alpha: 0.05 },
    { x1: W,   y1: H*0.4, x2: W*0.5, y2: H,    alpha: 0.06 },
    // Horizontal faint lines
    { x1: 0, y1: H*0.25, x2: W, y2: H*0.20, alpha: 0.04 },
    { x1: 0, y1: H*0.50, x2: W, y2: H*0.55, alpha: 0.04 },
    { x1: 0, y1: H*0.75, x2: W, y2: H*0.70, alpha: 0.04 },
  ];

  lines.forEach(l => {
    ctx.save();
    ctx.strokeStyle = `rgba(220, 0, 0, ${l.alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.restore();
  });

  // Concentric arc web segments (top-left corner)
  [60, 120, 180, 240].forEach(r => {
    ctx.save();
    ctx.strokeStyle = `rgba(200, 0, 0, ${0.06 - r*0.0001})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 0.6);
    ctx.stroke();
    ctx.restore();
  });

  // Concentric arc web segments (bottom-right corner)
  [60, 120, 180].forEach(r => {
    ctx.save();
    ctx.strokeStyle = `rgba(200, 0, 0, ${0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(W, H, r, Math.PI, Math.PI * 1.6);
    ctx.stroke();
    ctx.restore();
  });
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

generateCard().catch(console.error);
