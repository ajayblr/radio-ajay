const gradients = [
  ['#5038a0', '#3d2b7a'],
  ['#1e3a5f', '#0d2137'],
  ['#5c1d1d', '#3b1212'],
  ['#1a4731', '#0d2b1d'],
  ['#4a2060', '#2d1240'],
  ['#3d4a1e', '#252d10'],
  ['#1d3a4a', '#0d2130'],
  ['#4a3020', '#2d1c10'],
];

/** Deterministic fallback colours for a station without usable artwork. */
export function stationGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}
