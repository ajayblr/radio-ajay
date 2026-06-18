import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0a3a"/>
      <stop offset="100%" stop-color="#0c0c1e"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="dot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0abfc"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="45%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-strong">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="glow-bg" cx="30%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#4c1d95" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0c0c1e" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow-bg)"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="166" x2="1024" y2="166" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="333" x2="1024" y2="333" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="256" y1="0" x2="256" y2="500" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="512" y1="0" x2="512" y2="500" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="768" y1="0" x2="768" y2="500" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- Logo icon centred left -->
  <!-- Signal arcs -->
  <path d="M 200 310 A 100 100 0 0 1 360 310" stroke="url(#arc)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.25" filter="url(#glow)"/>
  <path d="M 220 310 A 80 80 0 0 1 340 310" stroke="url(#arc)" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.55" filter="url(#glow)"/>
  <path d="M 245 310 A 55 55 0 0 1 315 310" stroke="url(#arc)" stroke-width="14" stroke-linecap="round" fill="none" filter="url(#glow)"/>

  <!-- Base dot -->
  <circle cx="280" cy="310" r="18" fill="url(#dot)" filter="url(#glow-strong)"/>
  <circle cx="280" cy="310" r="7" fill="white"/>

  <!-- Antenna stem -->
  <line x1="280" y1="292" x2="280" y2="240" stroke="rgba(168,85,247,0.5)" stroke-width="8" stroke-linecap="round"/>

  <!-- Antenna tip -->
  <circle cx="280" cy="224" r="16" fill="url(#dot)" filter="url(#glow-strong)"/>
  <circle cx="280" cy="224" r="6" fill="white"/>

  <!-- App name text -->
  <text x="420" y="290" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="800" letter-spacing="-3" fill="url(#text-grad)">Radio</text>
  <text x="420" y="390" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="900" letter-spacing="-3" fill="url(#text-grad)">Ajay</text>

  <!-- Tagline -->
  <text x="422" y="430" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="400" fill="rgba(148,163,184,0.8)" letter-spacing="0.5">Stream the world's radio, free</text>

  <!-- Decorative dots -->
  <circle cx="900" cy="100" r="3" fill="rgba(168,85,247,0.4)"/>
  <circle cx="950" cy="160" r="2" fill="rgba(6,182,212,0.4)"/>
  <circle cx="880" cy="200" r="4" fill="rgba(16,185,129,0.3)"/>
  <circle cx="960" cy="80" r="2" fill="rgba(240,171,252,0.5)"/>
  <circle cx="100" cy="80" r="3" fill="rgba(168,85,247,0.3)"/>
  <circle cx="60" cy="140" r="2" fill="rgba(6,182,212,0.3)"/>
  <circle cx="140" cy="430" r="3" fill="rgba(16,185,129,0.25)"/>
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
const png = resvg.render().asPng();
writeFileSync(join(root, 'docs', 'feature-graphic.png'), png);
console.log('✓ feature-graphic.png (1024x500) saved to docs/');
