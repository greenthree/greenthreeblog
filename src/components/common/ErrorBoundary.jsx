import React from 'react'
import { Activity, RotateCcw } from 'lucide-react'

const DEFAULT_COPY = {
  errorTitle: 'RENDER_STATE_ANOMALY // 渲染异常',
  errorDescription: '组件渲染过程中捕获到未处理的异常。',
  reset: '重置并重新渲染 / RESET_STATE'
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught component error in ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      const copy = { ...DEFAULT_COPY, ...this.props.copy }
      return (
        <div className="error-boundary-panel" role="alert" style={{
          padding: '24px',
          margin: '20px auto',
          maxWidth: '600px',
          background: 'rgba(16, 18, 27, 0.95)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          color: '#f3f7ff',
          fontFamily: "'DM Mono', monospace"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff3366', marginBottom: '12px', fontSize: '12px' }}>
            <Activity size={16} />
            <span>{copy.errorTitle}</span>
          </div>
          <p style={{ fontSize: '11px', color: '#aeb4c4', lineHeight: 1.6, margin: '0 0 16px' }}>
            {copy.errorDescription}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00f0ff',
              padding: '6px 12px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} />
            <span>{copy.reset}</span>
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
