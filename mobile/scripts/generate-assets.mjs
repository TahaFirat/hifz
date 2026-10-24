// Renders resources/icon.svg -> iOS AppIcon (1024x1024, 24-bit RGB, no alpha) + dark splash screens.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharpPath =
  process.env.SHARP_PATH ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/sharp');
const sharp = require(sharpPath);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = path.join(root, 'resources/icon.svg');
const assets = path.join(root, 'ios/App/App/Assets.xcassets');
const storeDirs = [
  path.join(root, '../app_store_assets'),
  path.join(root, '../../app_store_assets'),
];

for (const dir of storeDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

const icon = sharp(svg, { density: 300 })
  .resize(1024, 1024)
  .flatten({ background: '#070b10' })
  .removeAlpha()
  .png();

await icon.clone().toFile(path.join(assets, 'AppIcon.appiconset/AppIcon-512@2x.png'));
for (const dir of storeDirs) {
  await icon.clone().toFile(path.join(dir, 'AppIcon_1024x1024.png'));
}
await sharp(svg, { density: 300 })
  .resize(512, 512)
  .flatten({ background: '#070b10' })
  .removeAlpha()
  .png()
  .toFile(path.join(root, '../docs/icon.png'));

const logo = await sharp(svg, { density: 300 }).resize(640, 640).png().toBuffer();
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: '#070b10' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(assets, 'Splash.imageset', name));
}
console.log('Hıfz icons + splash generated successfully');
