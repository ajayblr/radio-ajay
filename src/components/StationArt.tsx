import { useState } from 'react';
import { Radio } from 'lucide-react';
import { stationGradient } from '../lib/stationGradient';
import type { Station } from '../types';

interface Props {
  station: Station;
  /** Radio icon size for the no-artwork fallback */
  iconSize?: number;
  /** Blurred copy of the logo as a backdrop — for the large card artwork */
  backdrop?: boolean;
  /** Load eagerly (e.g. the player thumbnail) instead of lazily */
  eager?: boolean;
}

/**
 * Station favicons are mostly logos of every shape, so they're shown whole
 * (object-contain) rather than cropped; on cards a blurred copy fills the square.
 */
export default function StationArt({ station, iconSize = 36, backdrop = false, eager = false }: Props) {
  const [c1, c2] = stationGradient(station.stationuuid);
  // Track the failing URL rather than a boolean so a reused component resets when the station changes
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!station.favicon && failedSrc !== station.favicon;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {showImage ? (
        <div className="card-img absolute inset-0">
          {backdrop && (
            <img
              src={station.favicon}
              alt=""
              aria-hidden
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60"
            />
          )}
          <img
            src={station.favicon}
            alt={station.name}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className={`relative w-full h-full object-contain ${backdrop ? 'p-[12%] drop-shadow-lg' : ''}`}
            onError={() => setFailedSrc(station.favicon)}
          />
        </div>
      ) : (
        <Radio size={iconSize} className="text-white/50" />
      )}
    </div>
  );
}
