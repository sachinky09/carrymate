import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/index.css';

window.addEventListener('error', (event) => {
  console.error(`[ERROR] file=${event.filename} line=${event.lineno} message=${event.message}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error(`[ERROR] file=main.jsx message=Unhandled promise rejection: ${event.reason}`);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
