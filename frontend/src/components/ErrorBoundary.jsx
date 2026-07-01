import { Component } from "react";

/**
 * ErrorBoundary catches unexpected React rendering errors and displays
 * a friendly fallback UI instead of a blank white screen.
 *
 * Only catches render-phase errors (as per React's error boundary spec).
 * Does NOT catch async/API errors — those are handled per-component.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for developer debugging (not user-facing)
    console.error("[ErrorBoundary] Render error:", error, info);
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 40px",
        background: "linear-gradient(-45deg, #fcfaf8, #fff3ef, #f2f7f5, #ffffff)",
        backgroundSize: "400% 400%",
        textAlign: "center",
        fontFamily: "system-ui, Arial, sans-serif",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>😓</div>

        <h1 style={{
          margin: "0 0 12px",
          fontSize: "clamp(1.4rem, 4vw, 2rem)",
          fontWeight: 800,
          color: "#1f3d36",
        }}>
          Something went wrong
        </h1>

        <p style={{
          margin: "0 0 10px",
          fontSize: "1rem",
          color: "#6b5344",
          maxWidth: 400,
          lineHeight: 1.6,
        }}>
          An unexpected error occurred. Please refresh the page or go back to the home screen.
        </p>

        {process.env.NODE_ENV !== "production" && this.state.error && (
          <details style={{
            margin: "12px 0 24px",
            textAlign: "left",
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: 10,
            padding: "10px 14px",
            maxWidth: 540,
            width: "100%",
            fontSize: "0.8rem",
            color: "#5d4037",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Error details (dev only)</summary>
            {this.state.error.toString()}
          </details>
        )}

        <button
          type="button"
          onClick={this.handleGoHome}
          style={{
            padding: "12px 28px",
            border: "none",
            borderRadius: 12,
            background: "#c05a2b",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }
}
