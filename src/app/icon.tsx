import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #6366f1, #4338ca)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Card behind, tilted */}
          <rect
            x="12" y="28" width="30" height="22" rx="3"
            fill="white" fillOpacity="0.3"
            transform="rotate(-8, 27, 39)"
          />
          {/* Mushroom cap */}
          <path
            d="M14 28 C14 16, 22 8, 34 8 C46 8, 54 16, 54 28 Z"
            fill="white"
          />
          {/* Stem */}
          <rect x="28" y="28" width="12" height="16" rx="4" fill="white" fillOpacity="0.85" />
          {/* Card in front, tilted */}
          <rect
            x="30" y="36" width="24" height="18" rx="3"
            fill="white" fillOpacity="0.5"
            stroke="white" strokeWidth="1.5" strokeOpacity="0.6"
            transform="rotate(6, 42, 45)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
