import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined') {
  document.body.classList.remove('theme-dark');
  document.body.style.colorScheme = 'light';
  localStorage.removeItem('theme');
  localStorage.removeItem('chatTheme');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
