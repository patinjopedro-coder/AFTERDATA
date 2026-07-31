import { StrictMode } from 'react';
import { safeSplit } from './utils';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Capturador de excepciones no controladas para prevenir pantalla blanca
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no controlada:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
