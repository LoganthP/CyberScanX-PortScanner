import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('React Error Boundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    background: '#0B0F19',
                    color: '#ff4444',
                    fontFamily: 'monospace',
                    minHeight: '100vh',
                }}>
                    <h1 style={{ color: '#00F3FF', marginBottom: '1rem' }}>⚠ CyberScan X — Runtime Error</h1>
                    <pre style={{
                        background: '#111',
                        padding: '1rem',
                        borderRadius: '8px',
                        overflow: 'auto',
                        border: '1px solid #333',
                    }}>
                        {this.state.error?.message}
                        {'\n\n'}
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: '#06b6d4',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        RELOAD APPLICATION
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
