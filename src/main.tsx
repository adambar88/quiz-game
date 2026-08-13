import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

try {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
} catch (err) {
  console.error('[BrainSprint] Fatal startup error:', err);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; color: #fff; background: #050505; font-family: system-ui, sans-serif; gap: 16px;">
        <div style="font-size: 32px;">🚀</div>
        <h2 style="font-size: 18px; font-weight: bold;">Zaktualizowano BrainSprint!</h2>
        <p style="font-size: 12px; color: #9ca3af; max-width: 320px;">Przeglądarka wczytała starszą wersję z pamięci podręcznej. Kliknij przycisk poniżej, aby zaktualizować.</p>
        <button onclick="window.location.reload(true)" style="padding: 10px 20px; border-radius: 12px; background: #34d399; color: #000; font-weight: bold; font-size: 14px; border: none; cursor: pointer;">🔄 Odśwież Aplikację</button>
      </div>
    `;
  }
}
