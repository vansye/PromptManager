import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

type ErrorBoundaryState = {
    hasError: boolean;
    errorText: string;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        errorText: '',
    };

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return {
            hasError: true,
            errorText: error instanceof Error ? error.message : '未知错误',
        };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 16, color: '#fff', fontFamily: 'Segoe UI, sans-serif' }}>
                    <h2 style={{ margin: '0 0 8px 0' }}>PromptHero 加载失败</h2>
                    <p style={{ margin: 0, opacity: 0.9 }}>请在扩展页点击“检查视图 index.html”查看报错。</p>
                    <p style={{ marginTop: 8, opacity: 0.85 }}>错误：{this.state.errorText}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <RootErrorBoundary>
                <App />
            </RootErrorBoundary>
        </React.StrictMode>
    );
}