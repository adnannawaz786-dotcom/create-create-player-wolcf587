import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import App from './App.jsx'
import './index.css'

// Error boundary component for production-ready error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-white/70 mb-6">
              The music player encountered an unexpected error. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && (
              <details className="mt-6 text-left">
                <summary className="text-white/50 cursor-pointer text-sm">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-300 mt-2 overflow-auto max-h-32 bg-black/20 p-2 rounded">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Performance monitoring for production
const performanceObserver = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          // Log navigation timing in development
          if (import.meta.env.DEV) {
            console.log('Navigation timing:', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.fetchStart
            })
          }
        }
      })
    })
    
    observer.observe({ entryTypes: ['navigation', 'paint'] })
  }
}

// Initialize performance monitoring
performanceObserver()

// Service Worker registration for PWA capabilities
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered: ', registration)
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError)
    }
  }
}

// Initialize app
const initializeApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="music-player-theme"
          >
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

// App initialization with proper error handling
try {
  initializeApp()
  registerServiceWorker()
} catch (error) {
  console.error('Failed to initialize app:', error)
  
  // Fallback rendering
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Failed to Load Music Player
        </h2>
        <p className="text-white/70 mb-6">
          There was a critical error loading the application. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// Hot Module Replacement for development
if (import.meta.hot) {
  import.meta.hot.accept()
}