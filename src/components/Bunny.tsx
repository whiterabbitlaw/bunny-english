export function BunnyMascot({ mood = 'wave' }: { mood?: 'wave' | 'cheer' | 'rest' | 'think' }) {
  const eyesOpen = mood !== 'rest'
  const smile = mood === 'think' ? 'M72 118 Q90 116 108 122' : 'M70 116 Q90 132 110 116'
  return (
    <svg viewBox="0 0 180 180" className="h-full w-full" aria-hidden="true">
      <ellipse cx="90" cy="168" rx="48" ry="8" fill="#ead8c4" />
      <ellipse cx="64" cy="52" rx="16" ry="34" fill="#fffdf8" transform="rotate(-14 64 52)" />
      <ellipse cx="116" cy="52" rx="16" ry="34" fill="#fffdf8" transform="rotate(14 116 52)" />
      <ellipse cx="64" cy="54" rx="8" ry="22" fill="#f3b7ae" transform="rotate(-14 64 54)" />
      <ellipse cx="116" cy="54" rx="8" ry="22" fill="#f3b7ae" transform="rotate(14 116 54)" />
      <ellipse cx="90" cy="132" rx="50" ry="36" fill="#fffdf8" />
      <circle cx="90" cy="98" r="40" fill="#fffdf8" />
      <path d="M50 126 Q90 150 130 126 Q116 140 90 144 Q64 140 50 126" fill="#0e7c73" />
      <circle cx="112" cy="138" r="7" fill="#e36a5d" />
      {eyesOpen ? (
        <g>
          <circle cx="74" cy="96" r="5" fill="#2a2118" />
          <circle cx="106" cy="96" r="5" fill="#2a2118" />
          <circle cx="76" cy="94" r="1.7" fill="#fff" />
          <circle cx="108" cy="94" r="1.7" fill="#fff" />
        </g>
      ) : (
        <path
          d="M66 96 Q74 90 82 96 M98 96 Q106 90 114 96"
          fill="none"
          stroke="#2a2118"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="90" cy="108" rx="4.5" ry="3.2" fill="#e36a5d" />
      <path d={smile} fill="none" stroke="#2a2118" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="58" cy="110" rx="8" ry="4.5" fill="#f6c1b8" />
      <ellipse cx="122" cy="110" rx="8" ry="4.5" fill="#f6c1b8" />
      {mood === 'wave' || mood === 'cheer' ? (
        <g>
          <ellipse cx="42" cy="128" rx="12" ry="8" fill="#fffdf8" transform="rotate(-20 42 128)" />
          <ellipse
            cx="136"
            cy={mood === 'cheer' ? 108 : 112}
            rx="12"
            ry="8"
            fill="#fffdf8"
            transform={mood === 'cheer' ? 'rotate(-70 136 108)' : 'rotate(-55 136 112)'}
          />
        </g>
      ) : (
        <g>
          <ellipse cx="42" cy="134" rx="12" ry="8" fill="#fffdf8" />
          <ellipse cx="138" cy="134" rx="12" ry="8" fill="#fffdf8" />
        </g>
      )}
      <ellipse cx="70" cy="160" rx="16" ry="9" fill="#fffdf8" />
      <ellipse cx="112" cy="160" rx="16" ry="9" fill="#fffdf8" />
    </svg>
  )
}
