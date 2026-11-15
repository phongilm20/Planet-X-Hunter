import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error in React application:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#0B0F19',
          color: '#F87171',
          padding: '24px',
          fontFamily: 'monospace',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            backgroundColor: '#111827',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #DC2626'
          }}>
            <h2 style={{ color: '#EF4444', marginBottom: '10px' }}>⚠️ SPHEREx Explorer Error Caught</h2>
            <p style={{ color: '#F3F4F6', marginBottom: '16px' }}>{this.state.error?.toString()}</p>
            <pre style={{
              backgroundColor: '#030712',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px',
              color: '#9CA3AF'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#0284C7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
