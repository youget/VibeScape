'use client'
import { useState, useRef } from 'react'

// Future GIFs: drop into /public and update these paths
const ANIMS = {
  idle:  '/mascot-idle.gif',
  wave:  '/mascot-wave.gif',   // belum ada — fallback ke idle
  jump:  '/mascot-jump.gif',   // belum ada — fallback ke idle
}

export default function Mascot() {
  const [anim, setAnim] = useState('idle')
  const [ripple, setRipple] = useState(null)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  function triggerAnim(type, e) {
    // Ripple effect at click point
    const rect = wrapRef.current?.getBoundingClientRect()
    if (rect && e) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRipple(null), 600)
    }

    // Only switch if the GIF exists (wave/jump not ready yet → stay idle)
    const target = type === 'wave' ? 'wave' : 'jump'
    if (typeof window !== 'undefined') {
      // Check if non-idle gif exists by trying to set it
      // For now always plays idle since other GIFs aren't ready
      setAnim(target)
    }

    // Auto return to idle after 2.5s
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAnim('idle'), 2500)
  }

  function handleClick(e) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickY = e.clientY - rect.top
    const midY = rect.height * 0.52  // waist divider ~52% from top
    if (clickY < midY) {
      triggerAnim('wave', e)
    } else {
      triggerAnim('jump', e)
    }
  }

  // Fallback to idle if GIF not ready yet
  const src = anim !== 'idle'
    ? (typeof window !== 'undefined' ? ANIMS[anim] : ANIMS.idle)
    : ANIMS.idle

  return (
    <div className="mascot-outer" ref={wrapRef} onClick={handleClick}>
      {/* Glow behind character */}
      <div className="mascot-glow" />

      {/* Character GIF */}
      <div className="mascot-wrap">
        <img
          src={src}
          alt="VibeScape mascot"
          className="mascot-img"
          onError={e => { e.target.src = ANIMS.idle }}  // fallback
        />
      </div>

      {/* Click zones hint — invisible, just for cursor */}
      <div className="zone-top" title="Say hi!" />
      <div className="zone-bottom" title="Jump!" />

      {/* Click ripple */}
      {ripple && (
        <span
          className="mascot-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}

      {/* Tooltip */}
      <p className="mascot-hint">click me ✨</p>

      <style jsx>{`
        .mascot-outer {
          position: relative;
          width: 200px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }

        /* Floating animation on top of GIF loop */
        .mascot-wrap {
          animation: mascot-float 3s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes mascot-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        .mascot-img {
          width: 200px;
          display: block;
          /* Makes black background invisible on dark bg */
          mix-blend-mode: screen;
          pointer-events: none;
          border-radius: 4px;
        }

        /* Soft glow pulse */
        .mascot-glow {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 30px;
          background: radial-gradient(ellipse, rgba(59,130,246,0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow-pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glow-pulse {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.6; }
          50%       { transform: translateX(-50%) scaleX(0.7); opacity: 0.2; }
        }

        /* Invisible click zones */
        .zone-top, .zone-bottom {
          position: absolute;
          left: 0; right: 0;
          pointer-events: none;
        }
        .zone-top    { top: 0; height: 52%; cursor: pointer; }
        .zone-bottom { top: 52%; bottom: 0; cursor: pointer; }

        /* Click ripple */
        .mascot-ripple {
          position: absolute;
          width: 40px; height: 40px;
          margin-left: -20px; margin-top: -20px;
          border-radius: 50%;
          background: rgba(99, 179, 246, 0.4);
          animation: ripple-out 0.6s ease-out forwards;
          pointer-events: none;
        }

        @keyframes ripple-out {
          from { transform: scale(0); opacity: 1; }
          to   { transform: scale(3); opacity: 0; }
        }

        .mascot-hint {
          text-align: center;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.4);
          margin-top: 4px;
          letter-spacing: 1px;
          animation: hint-fade 2s ease-in-out infinite alternate;
        }

        @keyframes hint-fade {
          from { opacity: 0.3; }
          to   { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
