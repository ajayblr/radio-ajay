import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const svg = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8');

const sizes = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const resDir = join(root, 'android', 'app', 'src', 'main', 'res');

for (const [folder, size] of Object.entries(sizes)) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const dir = join(resDir, folder);
  writeFileSync(join(dir, 'ic_launcher.png'), png);
  writeFileSync(join(dir, 'ic_launcher_round.png'), png);
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), png);
  console.log(`✓ ${folder} (${size}x${size})`);
}
