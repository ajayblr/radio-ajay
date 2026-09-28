import { useEffect, useState } from 'react';
import { stationGradient } from '../lib/stationGradient';
import type { Station } from '../types';

// stationuuid → colour; shared across the session so each logo is sampled once
const colorCache = new Map<string, string>();

/**
 * Average the vivid pixels of a logo. Only works when the favicon host sends
 * CORS headers (otherwise the canvas is tainted) — callers fall back to the
 * station's generated gradient colour.
 */
function sampleColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 4000);
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.onload = () => {
      clearTimeout(timer);
      try {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const px = ctx.getImageData(0, 0, size, size).data;
        // Bucket pixels by hue and take the heaviest bucket — averaging everything
        // turns a red+blue logo into mud. Weight favours saturated, non-dark pixels.
        const BINS = 12;
        const bins = Array.from({ length: BINS }, () => ({ r: 0, g: 0, b: 0, w: 0 }));
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 128) continue; // transparent
          const [pr, pg, pb] = [px[i], px[i + 1], px[i + 2]];
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          if (max < 40 || max === min) continue; // near-black or grey
          const sat = (max - min) / max;
          const d = max - min;
          const hue = max === pr ? ((pg - pb) / d + 6) % 6 : max === pg ? (pb - pr) / d + 2 : (pr - pg) / d + 4;
          const bin = bins[Math.floor((hue / 6) * BINS) % BINS];
          const w = sat * sat;
          bin.r += pr * w; bin.g += pg * w; bin.b += pb * w; bin.w += w;
        }
        const best = bins.reduce((a, c) => (c.w > a.w ? c : a));
        if (best.w < 0.5) return resolve(null); // essentially greyscale — let the fallback win
        resolve(`rgb(${Math.round(best.r / best.w)}, ${Math.round(best.g / best.w)}, ${Math.round(best.b / best.w)})`);
      } catch {
        resolve(null); // tainted canvas (no CORS)
      }
    };
    img.src = url;
  });
}

/** Accent colour for a station: sampled from its logo when possible, else its gradient colour. */
export function useStationColor(station: Station | null): string | null {
  const id = station?.stationuuid;
  const favicon = station?.favicon;
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!id || colorCache.has(id)) return;
    let cancelled = false;
    (favicon ? sampleColor(favicon) : Promise.resolve(null)).then((c) => {
      colorCache.set(id, c ?? stationGradient(id)[0]);
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => { cancelled = true; };
  }, [id, favicon]);

  return id ? colorCache.get(id) ?? null : null;
}
