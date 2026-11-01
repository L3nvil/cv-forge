import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Terjadi Kendala pada Aplikasi CV Forge">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
