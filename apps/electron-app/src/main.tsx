import 'virtual:uno.css';
import '@unocss/reset/tailwind-v4.css';
import './main.css';

import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { logger } from './utils/logger';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  logger.log(message);
});
