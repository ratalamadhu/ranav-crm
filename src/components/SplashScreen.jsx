import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('enter') // 'enter' | 'visible' | 'exit'

  useEffect(() => {
    // Logo fully visible after 700ms
    const t1 = setTimeout(() => setPhase('visible'), 700)
    // Start exit fade at 2000ms
    const t2 = setTimeout(() => setPhase('exit'), 2000)
    // Unmount after exit animation completes
    const t3 = setTimeout(() => onDone(), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0F1E3C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.5s ease-in' : 'none',
        // Dot grid — same as main background, echoes the brand canvas
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Ambient glow behind logo */}
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,146,42,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          transition: 'opacity 1.2s ease, transform 1.4s ease',
        }}
      />

      {/* Logo */}
      <img
        src="/ranav-logo.png"
        alt="Ranav Group"
        style={{
          height: 96,
          width: 'auto',
          objectFit: 'contain',
          position: 'relative',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.82) translateY(8px)' : 'scale(1) translateY(0)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
          filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))',
        }}
      />

      {/* "CRM Portal" label */}
      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          position: 'relative',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(6px)' : 'translateY(0)',
          transition: 'opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s',
        }}
      >
        CRM Portal
      </p>

      {/* Gold thin line below — brand accent */}
      <div
        style={{
          marginTop: 28,
          height: 1.5,
          borderRadius: 99,
          backgroundColor: '#C9922A',
          position: 'relative',
          opacity: phase === 'enter' ? 0 : 0.6,
          width: phase === 'enter' ? 0 : 56,
          transition: 'opacity 0.5s ease 0.4s, width 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s',
        }}
      />
    </div>
  )
}
