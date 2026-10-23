import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("JanSetu UI Uncaught Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" role="alert">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertTriangle size={32} />
            </div>
            <h2>Something unexpected occurred</h2>
            <p>
              JanSetu encountered a temporary display issue. Your saved inquiries and preferences are safe.
            </p>
            <div className="error-boundary-actions">
              <button
                type="button"
                className="primary-button"
                onClick={this.handleReload}
              >
                <RefreshCw size={15} /> Reload Application
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={this.handleReset}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
