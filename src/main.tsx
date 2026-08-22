import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@/lib/i18n';
import App from './App.tsx';
import { ThemeProvider } from '@/lib/themeContext';
import { LanguageProvider } from '@/lib/languageContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
