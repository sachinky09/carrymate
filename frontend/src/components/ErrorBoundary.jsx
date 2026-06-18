import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[ERROR] message=${error.message}`);
    console.error(error.stack);
    if (info?.componentStack) console.error(info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="form-error">Something went wrong. Check the browser console for details.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
