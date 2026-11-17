import type { ReactNode } from 'react'

function Stage({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <g>
      <circle cx="80" cy="80" r="76" fill={tint} />
      <ellipse cx="80" cy="140" rx="36" ry="7" fill="#2a2118" opacity="0.08" />
      {children}
    </g>
  )
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="5.2" fill="#2a2118" />
      <circle cx={x + 1.6} cy={y - 1.7} r="1.7" fill="#fff" />
    </g>
  )
}

function Gloss({ x, y }: { x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx="8" ry="4.5" fill="#fff" opacity="0.45" />
}

function Cat() {
  return (
    <Stage tint="#ffe8e2">
      <path d="M48 72 38 30l36 28Z" fill="#f28b74" />
      <path d="M112 72 122 30 86 58Z" fill="#f28b74" />
      <path d="M52 68 46 40l22 16Z" fill="#f8c7bc" />
      <path d="M108 68 114 40 92 56Z" fill="#f8c7bc" />
      <ellipse cx="80" cy="108" rx="36" ry="28" fill="#f28b74" />
      <ellipse cx="80" cy="116" rx="18" ry="14" fill="#fff3ee" />
      <ellipse cx="80" cy="88" rx="34" ry="30" fill="#f28b74" />
      <Eye x={66} y={86} />
      <Eye x={94} y={86} />
      <path d="M80 96 76 102h8Z" fill="#c24136" />
      <path d="M74 104 Q80 108 86 104" fill="none" stroke="#2a2118" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 90h18M40 98h16M102 90h18M104 98h16" stroke="#2a2118" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 118c16 8 18 24 4 28" fill="none" stroke="#f28b74" strokeWidth="8" strokeLinecap="round" />
    </Stage>
  )
}

function Dog() {
  return (
    <Stage tint="#fff1d4">
      <ellipse cx="36" cy="98" rx="16" ry="30" fill="#8d5a32" transform="rotate(24 36 98)" />
      <ellipse cx="124" cy="98" rx="16" ry="30" fill="#8d5a32" transform="rotate(-24 124 98)" />
      <ellipse cx="80" cy="112" rx="40" ry="28" fill="#e2b15a" />
      <ellipse cx="80" cy="84" rx="30" ry="26" fill="#e2b15a" />
      <ellipse cx="80" cy="98" rx="16" ry="12" fill="#fff1d8" />
      <Eye x={68} y={78} />
      <Eye x={92} y={78} />
      <ellipse cx="80" cy="92" rx="6" ry="4.5" fill="#2a2118" />
      <path d="M72 104 Q80 114 90 104" fill="#e36a5d" />
    </Stage>
  )
}

function Bird() {
  return (
    <Stage tint="#e5f6fb">
      <ellipse cx="78" cy="96" rx="34" ry="26" fill="#5eb7d6" />
      <circle cx="104" cy="78" r="18" fill="#5eb7d6" />
      <path d="M118 76 140 84 118 92Z" fill="#f0b429" />
      <ellipse cx="62" cy="100" rx="16" ry="10" fill="#8fd0e4" />
      <path d="M48 90 28 78 46 108Z" fill="#3c94b4" />
      <Eye x={108} y={74} />
      <path d="M70 122 v12 M90 122 v12" stroke="#e08a3c" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 134 h12 M84 134 h12" stroke="#e08a3c" strokeWidth="3" strokeLinecap="round" />
    </Stage>
  )
}

function Fish() {
  return (
    <Stage tint="#e7f4ff">
      <ellipse cx="78" cy="86" rx="40" ry="24" fill="#f08a3c" />
      <path d="M112 86 142 64 v44Z" fill="#e36a4c" />
      <ellipse cx="70" cy="96" rx="16" ry="8" fill="#f6c49a" />
      <path d="M78 64c8 8 8 12 0 18" fill="#e36a4c" />
      <Eye x={52} y={80} />
      <circle cx="28" cy="58" r="4" fill="#9fd4ee" />
      <circle cx="40" cy="46" r="3" fill="#9fd4ee" />
    </Stage>
  )
}

function Rabbit() {
  return (
    <Stage tint="#e7f6f3">
      <ellipse cx="62" cy="58" rx="12" ry="28" fill="#fffdf8" stroke="#e2c7b0" strokeWidth="3" />
      <ellipse cx="98" cy="58" rx="12" ry="28" fill="#fffdf8" stroke="#e2c7b0" strokeWidth="3" />
      <ellipse cx="62" cy="60" rx="6" ry="16" fill="#f3b7ae" />
      <ellipse cx="98" cy="60" rx="6" ry="16" fill="#f3b7ae" />
      <ellipse cx="80" cy="108" rx="34" ry="26" fill="#fffdf8" stroke="#e2c7b0" strokeWidth="3" />
      <circle cx="80" cy="90" r="26" fill="#fffdf8" stroke="#e2c7b0" strokeWidth="3" />
      <Eye x={70} y={88} />
      <Eye x={90} y={88} />
      <ellipse cx="80" cy="98" rx="4" ry="3" fill="#e36a5d" />
      <path d="M74 104 Q80 110 86 104" fill="none" stroke="#2a2118" strokeWidth="2" strokeLinecap="round" />
      <circle cx="112" cy="118" r="8" fill="#fffdf8" stroke="#e2c7b0" strokeWidth="3" />
    </Stage>
  )
}

function Duck() {
  return (
    <Stage tint="#fff6d8">
      <ellipse cx="76" cy="108" rx="36" ry="26" fill="#f6c445" />
      <circle cx="108" cy="84" r="22" fill="#f6c445" />
      <ellipse cx="126" cy="90" rx="16" ry="8" fill="#f08a24" />
      <ellipse cx="60" cy="108" rx="14" ry="9" fill="#ffe28a" />
      <Eye x={112} y={78} />
      <path d="M64 132 h16 M92 132 h16" stroke="#e08a3c" strokeWidth="4" strokeLinecap="round" />
    </Stage>
  )
}

function Balloon({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="80" cy="70" rx="32" ry="36" fill={color} />
      <Gloss x={68} y={56} />
      <path d="M74 104 86 104 80 114Z" fill={color} />
      <path d="M80 114 C68 132 98 136 76 150" fill="none" stroke="#2a2118" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function Red() {
  return (
    <Stage tint="#fde8e4">
      <Balloon color="#e23b3b" />
    </Stage>
  )
}

function Yellow() {
  return (
    <Stage tint="#fff4d2">
      <circle cx="80" cy="80" r="28" fill="#f5c12e" />
      <Gloss x={70} y={70} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="80"
          y1="80"
          x2="80"
          y2="42"
          stroke="#f5c12e"
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${deg} 80 80)`}
        />
      ))}
      <circle cx="80" cy="80" r="28" fill="#f5c12e" />
    </Stage>
  )
}

function Blue() {
  return (
    <Stage tint="#e3f1ff">
      <path
        d="M80 36 C80 36 44 78 44 102 C44 126 60 140 80 140 C100 140 116 126 116 102 C116 78 80 36 80 36 Z"
        fill="#2f7fdb"
      />
      <Gloss x={68} y={78} />
    </Stage>
  )
}

function Green() {
  return (
    <Stage tint="#e5f6e4">
      <path d="M80 132 C36 96 48 40 80 34 C112 40 124 96 80 132 Z" fill="#2e9b4b" />
      <path d="M80 46 v74" stroke="#1f6d34" strokeWidth="3" strokeLinecap="round" />
      <Gloss x={66} y={64} />
    </Stage>
  )
}

function OrangeCrayon() {
  return (
    <Stage tint="#ffe8d2">
      <g transform="rotate(-28 80 86)">
        <rect x="58" y="34" width="44" height="78" rx="8" fill="#f08a24" />
        <rect x="58" y="34" width="44" height="16" rx="6" fill="#f3ddb0" />
        <path d="M58 112 80 142 102 112 Z" fill="#f08a24" />
      </g>
    </Stage>
  )
}

function Purple() {
  return (
    <Stage tint="#f0e8ff">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="80" cy="50" rx="14" ry="20" fill="#7d5cd6" transform={`rotate(${deg} 80 84)`} />
      ))}
      <circle cx="80" cy="84" r="14" fill="#f5c451" />
    </Stage>
  )
}

function Apple() {
  return (
    <Stage tint="#ffe9e4">
      <circle cx="80" cy="92" r="36" fill="#e23d3d" />
      <path d="M80 56c8-16 22-16 24-4" fill="none" stroke="#6b3f24" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="102" cy="58" rx="12" ry="7" fill="#3e9b55" transform="rotate(28 102 58)" />
      <Gloss x={66} y={78} />
    </Stage>
  )
}

function Banana() {
  return (
    <Stage tint="#fff6d2">
      <path
        d="M48 104c4-34 26-58 58-60 12-1 20 8 16 16-16 6-30 20-36 42-6 20-8 30-18 30-12 0-22-10-20-28z"
        fill="#f6c445"
      />
      <path d="M62 96c8-26 24-42 46-46" fill="none" stroke="#ffe7a3" strokeWidth="7" strokeLinecap="round" />
      <path d="M112 46c10-12 18-8 14 4" fill="none" stroke="#6b3f24" strokeWidth="4" strokeLinecap="round" />
      <path d="M54 118c8 8 16 4 14-6" fill="none" stroke="#c9891a" strokeWidth="4" strokeLinecap="round" />
    </Stage>
  )
}

function Grape() {
  return (
    <Stage tint="#f3eaff">
      <path d="M80 42c10 8 14 8 18 2" fill="none" stroke="#6b3f24" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="96" cy="48" rx="12" ry="7" fill="#3e9b55" transform="rotate(20 96 48)" />
      {[
        [80, 70],
        [62, 84],
        [98, 84],
        [70, 104],
        [90, 104],
        [80, 122],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="14" fill="#7d4cc4" />
      ))}
      <Gloss x={70} y={64} />
    </Stage>
  )
}

function OrangeFruit() {
  return (
    <Stage tint="#fff0dc">
      <circle cx="80" cy="90" r="36" fill="#f08a24" />
      <path d="M80 58 v64 M50 90 h60 M60 68c14 8 26 8 40 0 M60 112c14-8 26-8 40 0" stroke="#d86d12" strokeWidth="2" fill="none" />
      <ellipse cx="104" cy="54" rx="14" ry="8" fill="#3e9b55" transform="rotate(30 104 54)" />
      <Gloss x={66} y={76} />
    </Stage>
  )
}

function Strawberry() {
  return (
    <Stage tint="#ffe8ea">
      <path d="M80 132 C48 108 46 74 58 64 C66 78 74 78 80 66 C86 78 94 78 102 64 C114 74 112 108 80 132 Z" fill="#e23d4d" />
      <path d="M58 66 C70 52 90 52 102 66 C94 58 86 62 80 54 C74 62 66 58 58 66 Z" fill="#3e9b55" />
      {[
        [70, 86],
        [88, 90],
        [76, 106],
        [94, 108],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.2" ry="3" fill="#f6d36b" />
      ))}
    </Stage>
  )
}

function Watermelon() {
  return (
    <Stage tint="#e9f8ef">
      <path d="M28 78 A58 58 0 0 1 132 78 Z" fill="#3e9b55" />
      <path d="M36 78 A50 50 0 0 1 124 78 Z" fill="#f4f0e4" />
      <path d="M44 78 A42 42 0 0 1 116 78 Z" fill="#f25b6a" />
      <ellipse cx="64" cy="66" rx="3" ry="4" fill="#2a2118" />
      <ellipse cx="84" cy="58" rx="3" ry="4" fill="#2a2118" />
      <ellipse cx="100" cy="68" rx="3" ry="4" fill="#2a2118" />
    </Stage>
  )
}

function Dots({ count }: { count: number }) {
  const layouts: Record<number, Array<[number, number]>> = {
    1: [[80, 126]],
    2: [[64, 126], [96, 126]],
    3: [[52, 126], [80, 126], [108, 126]],
    4: [[60, 116], [100, 116], [60, 136], [100, 136]],
    5: [[52, 116], [80, 116], [108, 116], [66, 136], [94, 136]],
    6: [[52, 116], [80, 116], [108, 116], [52, 136], [80, 136], [108, 136]],
  }
  return (
    <g>
      {(layouts[count] ?? []).map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#d4534a" />
      ))}
    </g>
  )
}

function NumberArt({ glyph, count }: { glyph: string; count: number }) {
  return (
    <Stage tint="#e5f4fb">
      <text
        x="80"
        y="86"
        textAnchor="middle"
        fontFamily="Fredoka, sans-serif"
        fontSize="64"
        fontWeight="700"
        fill="#0e7c73"
      >
        {glyph}
      </text>
      <Dots count={count} />
    </Stage>
  )
}

const painters: Record<string, () => ReactNode> = {
  'animals-cat': Cat,
  'animals-dog': Dog,
  'animals-bird': Bird,
  'animals-fish': Fish,
  'animals-rabbit': Rabbit,
  'animals-duck': Duck,
  'colors-red': Red,
  'colors-yellow': Yellow,
  'colors-blue': Blue,
  'colors-green': Green,
  'colors-orange': OrangeCrayon,
  'colors-purple': Purple,
  'fruits-apple': Apple,
  'fruits-banana': Banana,
  'fruits-grape': Grape,
  'fruits-orange': OrangeFruit,
  'fruits-strawberry': Strawberry,
  'fruits-watermelon': Watermelon,
  'numbers-one': () => <NumberArt glyph="1" count={1} />,
  'numbers-two': () => <NumberArt glyph="2" count={2} />,
  'numbers-three': () => <NumberArt glyph="3" count={3} />,
  'numbers-four': () => <NumberArt glyph="4" count={4} />,
  'numbers-five': () => <NumberArt glyph="5" count={5} />,
  'numbers-six': () => <NumberArt glyph="6" count={6} />,
}

export function WordArt({ wordId, className }: { wordId: string; className?: string }) {
  const Paint = painters[wordId]
  return (
    <svg viewBox="0 0 160 160" className={className ?? 'h-full w-full'} aria-hidden="true">
      {Paint ? <Paint /> : null}
    </svg>
  )
}
