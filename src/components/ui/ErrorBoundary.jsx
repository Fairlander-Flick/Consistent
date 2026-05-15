import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 32, margin: 16,
          background: 'var(--card)', border: '1px solid var(--negative)',
          borderRadius: 8, color: 'var(--negative)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
          <pre style={{ fontSize: 11, color: 'var(--text-mid)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </pre>
          <button
            className="btn"
            style={{ marginTop: 12 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
