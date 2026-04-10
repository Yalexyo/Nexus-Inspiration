interface MushroomCardIconProps {
  size?: number;
  className?: string;
}

export default function MushroomCardIcon({ size = 32, className = '' }: MushroomCardIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Card behind mushroom, slightly tilted */}
      <rect
        x="12" y="28" width="30" height="22" rx="3"
        fill="white" fillOpacity="0.3"
        transform="rotate(-8, 27, 39)"
      />

      {/* Mushroom cap - smooth dome */}
      <path
        d="M14 28 C14 16, 22 8, 34 8 C46 8, 54 16, 54 28 Z"
        fill="white"
      />

      {/* Cap spots */}
      <circle cx="26" cy="18" r="3" fill="currentColor" opacity="0.12" />
      <circle cx="38" cy="15" r="2.5" fill="currentColor" opacity="0.1" />
      <circle cx="44" cy="22" r="2" fill="currentColor" opacity="0.08" />

      {/* Stem */}
      <rect x="28" y="28" width="12" height="16" rx="4" fill="white" fillOpacity="0.85" />

      {/* Card in front, slightly tilted the other way */}
      <rect
        x="30" y="36" width="24" height="18" rx="3"
        fill="white" fillOpacity="0.5"
        stroke="white" strokeWidth="1.5" strokeOpacity="0.6"
        transform="rotate(6, 42, 45)"
      />
      {/* Card detail lines */}
      <g transform="rotate(6, 42, 45)">
        <line x1="35" y1="42" x2="49" y2="42" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="47" x2="44" y2="47" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
