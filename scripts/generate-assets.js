#!/usr/bin/env node
/**
 * RoomLink Asset Generator
 * Generates placeholder PNG assets so the app can launch
 * Run: node scripts/generate-assets.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

function createIcon(size, filename, bg = '#0A0F1E', accent = '#00D4FF') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Hexagon
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.3;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, '#0066FF');
  ctx.fillStyle = grad;
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
  console.log(`✓ Created ${filename} (${size}x${size})`);
}

try {
  createIcon(1024, 'icon.png');
  createIcon(1024, 'adaptive-icon.png');
  createIcon(200, 'favicon.png');
  createIcon(1284, 'splash.png');
  console.log('\n✅ All assets created!');
} catch (e) {
  console.log('Canvas not available, creating fallback empty PNGs...');
  // Minimal 1x1 pixel PNG (valid PNG file)
  const MINIMAL_PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c48900000000a49444174' +
    '08d6360000000049454e44ae426082', 'hex'
  );
  ['icon.png', 'adaptive-icon.png', 'favicon.png', 'splash.png'].forEach(f => {
    fs.writeFileSync(path.join(ASSETS_DIR, f), MINIMAL_PNG);
    console.log(`✓ Created placeholder ${f}`);
  });
}
