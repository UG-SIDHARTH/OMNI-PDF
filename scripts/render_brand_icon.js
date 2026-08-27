import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function createBrandSvg(size = 1024) {
  const cornerRadius = size * 0.22; // Squircle rounded corner
  const strokeWidth = size * 0.055; // Crisp line thickness
  const scale = size / 24;

  // Exact Lucide Layers path transformed to 1024x1024 centered
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E11D48" />
      <stop offset="50%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="softShadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35" />
    </linearGradient>
    <filter id="ambientGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.03}" stdDeviation="${size * 0.04}" flood-color="#E11D48" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background Squircle with Gradient -->
  <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}" rx="${cornerRadius}" fill="url(#brandGradient)" filter="url(#ambientGlow)" />

  <!-- Subtle glossy specular highlight overlay -->
  <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}" rx="${cornerRadius}" fill="url(#softShadow)" />

  <!-- Centered Lucide Layers Icon in White -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.025})" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5" />
    <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5" />
  </g>
</svg>`;
}

async function main() {
  console.log('Rendering official brand icon (Coral/Rose Layers) across all targets...');

  const svg1024 = createBrandSvg(1024);
  const svgBuffer = Buffer.from(svg1024);

  // 1. Save SVG favicon in public/
  fs.writeFileSync(path.resolve('public', 'favicon.svg'), svg1024);
  console.log('✅ Updated public/favicon.svg');

  // 2. Save PNG icon in public/ and phone-test/
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve('public', 'icon.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.resolve('public', 'favicon.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve('phone-test', 'app-icon.png'));
  console.log('✅ Updated public/icon.png, public/favicon.png, phone-test/app-icon.png');

  // 3. Save build icon for Electron
  const buildDir = path.resolve('build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(buildDir, 'icon.png'));
  console.log('✅ Updated build/icon.png');

  // 4. Android Mipmap Densities
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmaps) {
    const targetDir = path.resolve('android', 'app', 'src', 'main', 'res', m.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const launcher = path.join(targetDir, 'ic_launcher.png');
    const launcherRound = path.join(targetDir, 'ic_launcher_round.png');
    const foreground = path.join(targetDir, 'ic_launcher_foreground.png');

    await sharp(svgBuffer).resize(m.size, m.size).png().toFile(launcher);
    await sharp(svgBuffer).resize(m.size, m.size).png().toFile(launcherRound);
    await sharp(svgBuffer).resize(m.size, m.size).png().toFile(foreground);
    console.log(`✅ Generated Android ${m.dir} icons (${m.size}x${m.size})`);
  }

  console.log('\n🎉 Official OmniPDF brand icon rendered and distributed successfully!');
}

main().catch(err => {
  console.error('Failed to render brand icon:', err);
  process.exit(1);
});
