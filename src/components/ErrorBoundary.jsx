import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production you could send this to Sentry / LogRocket
    console.error('App error caught by boundary:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F1E3C',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(170,34,34,0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />

        {/* Card */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderTop: '3px solid #AA2222',
            borderRadius: 20,
            padding: '36px 32px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: 'rgba(170,34,34,0.18)',
            border: '1px solid rgba(170,34,34,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <AlertTriangle size={26} color="#f87171" />
          </div>

          {/* Text */}
          <h2 style={{ color: '#ffffff', fontSize: 20, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
            The app encountered an unexpected error. Your data is safe — just reload to continue.
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 24,
              textAlign: 'left',
              fontSize: 11,
              color: '#f87171',
              fontFamily: 'monospace',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error.toString()}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Go home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 12,
                border: 'none',
                background: '#1B3A6B',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#162840'}
              onMouseLeave={e => e.currentTarget.style.background = '#1B3A6B'}
            >
              <RefreshCw size={13} /> Reload
            </button>
          </div>
        </div>

        {/* Logo at bottom */}
        <img
          src="/ranav-logo.png"
          alt="Ranav Group"
          style={{ height: 32, marginTop: 32, opacity: 0.3, filter: 'brightness(10)' }}
        />
      </div>
    )
  }
}
