'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

// ─── Asset paths ─────────────────────────────────────────────
// Drop files in /public and update paths here
const CHARS = {
  dark: {
    idle: '/mascot-female-idle.webp',
    wave: '/mascot-female-wave.webp',   
    jump: '/mascot-female-jump.webp',   
  },
  light: {
    idle: '/mascot-male-idle.webp',     
    wave: '/mascot-male-wave.webp',
    jump: '/mascot-male-jump.webp',
  },
}

const READY = {
  dark:  { idle: true,  wave: true, jump: true },
  light: { idle: true, wave: false, jump: false }, 
}

export default function Mascot({ size = 200 }) {
  const { theme } = useTheme()
  const mode = theme === 'dark' ? 'dark' : 'light'

  const [anim, setAnim]       = useState('idle')
  const [ripple, setRipple]   = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  // Reset to idle when theme changes
  useEffect(() => { setAnim('idle') }, [theme])

  // Resolve actual src — fallback chain
  function resolveSrc(animName) {
    const char = CHARS[mode]
    const ready = READY[mode]

    // If requested anim not ready, fallback to idle
    if (!ready[animName]) animName = 'idle'

    // If idle not ready for this mode, fallback to dark female idle
    if (!ready.idle) return CHARS.dark.idle

    return char[animName]
  }

  function triggerAnim(type, e) {
    // Ripple
    const rect = wrapRef.current?.getBoundingClientRect()
    if (rect && e) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRipple(null), 700)
    }

    // Tooltip
    const tips = {
      wave: ['hi! 👋', 'hello~ ✨', 'hey! 😊'],
      jump: ['yay! 🎉', 'wheee! ✌️', 'woo! 💙'],
    }
    const pool = tips[type] || tips.wave
    setTooltip(pool[Math.floor(Math.random() * pool.length)])
    setTimeout(() => setTooltip(null), 1800)

    setAnim(type)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAnim('idle'), 2800)
  }

  function handleClick(e) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const relY = e.clientY - rect.top
    if (relY < rect.height * 0.52) {
      triggerAnim('wave', e)
    } else {
      triggerAnim('jump', e)
    }
  }

  const src = resolveSrc(anim)

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      style={{ position: 'relative', width: size, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%',
        width: size * 0.65, height: 20,
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.28) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translateX(-50%)',
        animation: 'mascot-glow 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Float wrapper */}
      <div style={{ animation: 'mascot-float 3s ease-in-out infinite' }}>
        <img
          src={src}
          alt="VibeScape mascot"
          width={size}
          style={{
            display: 'block',
            imageRendering: 'auto',
            pointerEvents: 'none',
          }}
          onError={e => {
            // Final fallback: hide broken image gracefully
            if (e.target.src !== CHARS.dark.idle) {
              e.target.src = CHARS.dark.idle
            }
          }}
        />
      </div>

      {/* Ripple */}
      {ripple && (
        <span style={{
          position: 'absolute',
          left: ripple.x - 20, top: ripple.y - 20,
          width: 40, height: 40,
          borderRadius: '50%',
          background: 'rgba(99,179,246,0.35)',
          animation: 'mascot-ripple 0.7s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip bubble */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: -36, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--vs-accent)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          animation: 'mascot-tooltip 1.8s ease forwards',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        }}>
          {tooltip}
          {/* Arrow */}
          <span style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--vs-accent)',
          }} />
        </div>
      )}

      {/* Hint text */}
      <p style={{
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(148,163,184,0.4)',
        marginTop: 4,
        letterSpacing: '0.05em',
        animation: 'mascot-hint 2.5s ease-in-out infinite alternate',
      }}>
        click me ✨
      </p>

      {/* Global keyframes */}
      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes mascot-glow {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scaleX(1); }
          50%       { opacity: 0.2; transform: translateX(-50%) scaleX(0.6); }
        }
        @keyframes mascot-ripple {
          from { transform: scale(0); opacity: 1; }
          to   { transform: scale(4); opacity: 0; }
        }
        @keyframes mascot-tooltip {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        }
        @keyframes mascot-hint {
          from { opacity: 0.25; }
          to   { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
