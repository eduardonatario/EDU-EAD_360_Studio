// Interceptar qualquer corrida assíncrona do FileReader do Pannellum antes de carregar o app
if (typeof window !== 'undefined' && window.FileReader) {
  const origAddEvt = FileReader.prototype.addEventListener;
  FileReader.prototype.addEventListener = function (
    this: FileReader,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (typeof listener === 'function') {
      const safeListener = function (this: FileReader) {
        try {
          return (listener as Function).apply(this, arguments);
        } catch (err: any) {
          if (
            err &&
            err.message &&
            (err.message.includes("setting 'src'") ||
              err.message.includes('Cannot set properties of undefined'))
          ) {
            return;
          }
          throw err;
        }
      };
      return origAddEvt.call(this, type, safeListener, options);
    }
    return origAddEvt.call(this, type, listener, options);
  };
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
