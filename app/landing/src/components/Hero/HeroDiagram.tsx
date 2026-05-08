import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'


// Network diagram - PreparedTx envelope at center, 4 radiating component
// nodes (decode/preview/simulate/sign). Pulse animation on center, flow
// particles along radiating lines. Phase 1 - no logo wall morph yet,
// just the network. Phase 2 will add scroll-driven scale-out + logo grid.

type NodeSpec = {
  id: string,
  label: string,
  angle: number,
}

const NODES: NodeSpec[] = [
  { id: 'decode', label: 'DECODE', angle: -135 },
  { id: 'preview', label: 'PREVIEW', angle: -45 },
  { id: 'simulate', label: 'SIMULATE', angle: 45 },
  { id: 'sign', label: 'SIGN', angle: 135 },
]


// Icon SVG paths (lucide-style, 24x24 viewBox, drawn at half-scale 12x12)
type IconPath = { d: string, extra?: string }

const ICONS: Record<string, IconPath[]> = {
  decode: [
    { d: 'M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1' },
    { d: 'M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1' },
  ],
  preview: [
    { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' },
    { d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' },
  ],
  simulate: [
    { d: 'M6 3v12' },
    { d: 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
    { d: 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
    { d: 'M15 6a9 9 0 0 0-9 9' },
  ],
  sign: [
    { d: 'M12 20h9' },
    { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z' },
  ],
}

const RADIUS = 180
const VIEWBOX = 480

const polarToCartesian = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180

  return {
    x: VIEWBOX / 2 + radius * Math.cos(rad),
    y: VIEWBOX / 2 + radius * Math.sin(rad),
  }
}


const HeroDiagram = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [ mounted, setMounted ] = useState(false)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [ 'start start', 'end start' ],
  })

  const scale = useTransform(scrollYProgress, [ 0, 1 ], [ 1, 1.15 ])
  const opacity = useTransform(scrollYProgress, [ 0, 0.6, 1 ], [ 1, 0.6, 0 ])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div ref={containerRef} className="hero__diagram-wrap" aria-hidden="true">
      <motion.svg
        className="hero__diagram"
        viewBox={`0 0 ${ VIEWBOX } ${ VIEWBOX }`}
        style={ reduceMotion ? undefined : { scale, opacity } }
        role="img"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4338CA" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#4338CA" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4338CA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <circle
          cx={ VIEWBOX / 2 }
          cy={ VIEWBOX / 2 }
          r="120"
          fill="url(#centerGlow)"
        />

        { NODES.map((node) => {
          const target = polarToCartesian(node.angle, RADIUS)

          return (
            <line
              key={ `line-${ node.id }` }
              x1={ VIEWBOX / 2 }
              y1={ VIEWBOX / 2 }
              x2={ target.x }
              y2={ target.y }
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )
        }) }

        { mounted && !reduceMotion ? NODES.map((node, idx) => {
          const target = polarToCartesian(node.angle, RADIUS)

          return (
            <motion.circle
              key={ `particle-${ node.id }` }
              r="3"
              fill="#4338CA"
              initial={{
                cx: VIEWBOX / 2,
                cy: VIEWBOX / 2,
                opacity: 0,
              }}
              animate={{
                cx: [ VIEWBOX / 2, target.x ],
                cy: [ VIEWBOX / 2, target.y ],
                opacity: [ 0, 1, 0 ],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                delay: idx * 0.6,
                ease: 'easeOut',
              }}
            />
          )
        }) : null }

        <motion.circle
          cx={ VIEWBOX / 2 }
          cy={ VIEWBOX / 2 }
          r="48"
          fill="#0F0F14"
          stroke="#4338CA"
          strokeWidth="1.5"
          animate={ reduceMotion ? undefined : {
            scale: [ 1, 1.04, 1 ],
          } }
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: `${ VIEWBOX / 2 }px ${ VIEWBOX / 2 }px` }}
        />

        <text
          x={ VIEWBOX / 2 }
          y={ VIEWBOX / 2 + 6 }
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="700"
          fontSize="20"
          fill="#FFFFFF"
          letterSpacing="-0.04em"
        >
          tx
        </text>

        { NODES.map((node) => {
          const target = polarToCartesian(node.angle, RADIUS)
          const iconSize = 22
          // Cluster total height ~ icon (22) + gap + label (~10) ≈ 36
          // To center the icon+label combo in the 72px circle, icon top sits
          // at target.y - 16 and label baseline at target.y + 14.
          const iconX = target.x - iconSize / 2
          const iconY = target.y - 16
          const labelY = target.y + 18

          return (
            <g key={ `node-${ node.id }` }>
              <circle
                cx={ target.x }
                cy={ target.y }
                r="36"
                fill="#0F0F14"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
              <g
                transform={ `translate(${ iconX }, ${ iconY }) scale(${ iconSize / 24 })` }
                stroke="#94A3B8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              >
                { ICONS[node.id].map((path, idx) => (
                  <path key={ `${ node.id }-path-${ idx }` } d={ path.d } />
                )) }
              </g>
              <text
                x={ target.x }
                y={ labelY }
                textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize="9"
                fontWeight="500"
                fill="#94A3B8"
                letterSpacing="0.1em"
              >
                { node.label }
              </text>
            </g>
          )
        }) }
      </motion.svg>
    </div>
  )
}


export default HeroDiagram
