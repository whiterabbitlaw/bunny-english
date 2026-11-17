type IconProps = { className?: string }

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#f0b429"
        stroke="#8a6412"
        strokeWidth="1.2"
        d="M12 2.8 14.7 8.6 21 9.4 16.4 13.8 17.6 20.2 12 17.1 6.4 20.2 7.6 13.8 3 9.4 9.3 8.6Z"
      />
    </svg>
  )
}

export function SpeakerIcon({ className, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="currentColor" d="M8 18h8l10-8v28L16 30H8a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4Z" />
      {muted ? (
        <path d="M30 18 42 30M42 18 30 30" stroke="#d4534a" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path
          d="M32 16c4 3.2 4 12.8 0 16M36.5 12c6.5 5 6.5 19 0 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="16" y="6" width="16" height="24" rx="8" fill="#d4534a" />
      <path d="M12 22a12 12 0 0 0 24 0" fill="none" stroke="#2a2118" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 34v6M16 42h16" fill="none" stroke="#2a2118" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
