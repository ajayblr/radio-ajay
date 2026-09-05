import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById('root')!;
const isAdmin = window.location.pathname.startsWith('/admin');

if (isAdmin) {
  import('./pages/AdminPage.tsx').then(({ default: AdminPage }) =>
    createRoot(rootEl).render(<StrictMode><AdminPage /></StrictMode>));
} else {
  import('./App.tsx').then(({ default: App }) =>
    createRoot(rootEl).render(<StrictMode><App /></StrictMode>));
}
