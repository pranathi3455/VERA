import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { formatUserErrorMessage } from '../../utils/errorHandler';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VERA ErrorBoundary] Caught render exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const cleanMessage = formatUserErrorMessage(
        this.state.error,
        'An unexpected display issue occurred while rendering this view.'
      );

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center bg-slate-900 border-slate-800 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Interface Display Issue
            </h2>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {cleanMessage}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-500 mb-6 text-left">
              <span className="font-semibold text-slate-400 block mb-1">Data Preservation Note:</span>
              Your underlying decision framework, empirical evidence records, and deterministic calculations are safely preserved in the database.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Reload Page
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="w-full sm:w-auto"
              >
                <Home className="w-4 h-4 mr-1.5" /> Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
