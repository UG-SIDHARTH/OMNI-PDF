import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_IMAGE = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\7466a0c9-1d61-48e8-99ad-757022c40dda\\omnipdf_icon_asset_1787830940192.jpg';

async function generateIcons() {
  console.log('Generating multi-platform icons from:', SOURCE_IMAGE);

  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error('Source icon image not found: ' + SOURCE_IMAGE);
  }

  // 1. Save to phone-test folder
  const phoneTestIcon = path.resolve('phone-test', 'app-icon.png');
  await sharp(SOURCE_IMAGE).resize(512, 512).png().toFile(phoneTestIcon);
  console.log('✅ Generated:', phoneTestIcon);

  // 2. Save to public web folder
  const publicIcon512 = path.resolve('public', 'icon.png');
  const publicFavicon = path.resolve('public', 'favicon.png');
  await sharp(SOURCE_IMAGE).resize(512, 512).png().toFile(publicIcon512);
  await sharp(SOURCE_IMAGE).resize(64, 64).png().toFile(publicFavicon);
  console.log('✅ Generated web icons in public/');

  // 3. Save to build folder for electron-builder
  const buildDir = path.resolve('build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  const electronIcon = path.join(buildDir, 'icon.png');
  await sharp(SOURCE_IMAGE).resize(512, 512).png().toFile(electronIcon);
  console.log('✅ Generated:', electronIcon);

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

    await sharp(SOURCE_IMAGE).resize(m.size, m.size).png().toFile(launcher);
    await sharp(SOURCE_IMAGE).resize(m.size, m.size).png().toFile(launcherRound);
    await sharp(SOURCE_IMAGE).resize(m.size, m.size).png().toFile(foreground);
    console.log(`✅ Generated Android ${m.dir} icons (${m.size}x${m.size})`);
  }

  console.log('\n🎉 ALL APP ICONS GENERATED SUCCESSFULLY ACROSS WEB, ELECTRON, AND ANDROID!');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
