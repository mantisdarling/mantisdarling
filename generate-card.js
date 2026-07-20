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
  // Red lightning / thunder bolt streaks
  const bolts = [
    // Top-left to mid-right
    [
      {x: 0,     y: 40},
      {x: 80,    y: 55},
      {x: 110,   y: 35},
      {x: 200,   y: 70},
      {x: 230,   y: 50},
      {x: 320,   y: 90},
      {x: 360,   y: 65},
      {x: 460,   y: 110},
      {x: 500,   y: 85},
      {x: W,     y: 120},
    ],
    // Mid to bottom
    [
      {x: 0,     y: 160},
      {x: 60,    y: 175},
      {x: 100,   y: 155},
      {x: 180,   y: 195},
      {x: 220,   y: 170},
      {x: 310,   y: 210},
      {x: 360,   y: 185},
      {x: 440,   y: 225},
      {x: 500,   y: 200},
      {x: W,     y: 235},
    ],
    // Bottom area
    [
      {x: 20,    y: H - 30},
      {x: 70,    y: H - 15},
      {x: 110,   y: H - 35},
      {x: 190,   y: H - 10},
      {x: 240,   y: H - 30},
      {x: 330,   y: H - 8},
      {x: 390,   y: H - 28},
      {x: 500,   y: H - 12},
      {x: W,     y: H - 20},
    ],
    // Short burst top-right
    [
      {x: W - 100, y: 0},
      {x: W - 80,  y: 20},
      {x: W - 60,  y: 8},
      {x: W - 30,  y: 35},
      {x: W,       y: 20},
    ],
    // Diagonal slash left side
    [
      {x: 0,   y: 80},
      {x: 25,  y: 105},
      {x: 15,  y: 125},
      {x: 45,  y: 155},
      {x: 30,  y: 175},
      {x: 60,  y: 210},
    ],
  ];

  bolts.forEach((bolt, bi) => {
    const alpha = [0.55, 0.45, 0.35, 0.50, 0.40][bi];
    const width = [1.8, 1.5, 1.2, 1.6, 1.3][bi];

    // Outer glow pass
    ctx.save();
    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
    ctx.lineWidth = width + 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    // Inner bright core
    ctx.save();
    ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    // Bright white-red center highlight
    ctx.save();
    ctx.strokeStyle = `rgba(255, 180, 180, ${alpha * 0.6})`;
    ctx.lineWidth = width * 0.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();
  });

  // Scattered small spark dots along bolts
  const sparks = [
    {x: 80,  y: 55},  {x: 230, y: 50},  {x: 360, y: 65},
    {x: 180, y: 195}, {x: 360, y: 185}, {x: 500, y: 200},
    {x: 110, y: H-35},{x: 330, y: H-8},
  ];
  sparks.forEach(s => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
    ctx.fill();
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
