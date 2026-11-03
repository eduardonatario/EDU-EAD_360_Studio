// Interceptar qualquer corrida assíncrona do FileReader do Pannellum antes de carregar o app
if (typeof window !== 'undefined') {
  if (typeof Node !== 'undefined' && Node.prototype) {
    const origRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child && child.parentNode !== this) {
        if (console && console.warn) {
          console.warn('[DOM Safeguard] Ignorado removeChild com parentNode divergente.', child);
        }
        return child;
      }
      return origRemoveChild.call(this, child) as T;
    };

    const origInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(
      this: Node,
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (console && console.warn) {
          console.warn('[DOM Safeguard] Ignorado insertBefore com parentNode divergente.', referenceNode);
        }
        return newNode;
      }
      return origInsertBefore.call(this, newNode, referenceNode) as T;
    };
  }

  if (window.FileReader && FileReader.prototype) {
    const origReadAsBinaryString = FileReader.prototype.readAsBinaryString;
    if (origReadAsBinaryString) {
      FileReader.prototype.readAsBinaryString = function (blob: Blob) {
        if (!(blob instanceof Blob)) {
          console.warn('[Pannellum Safeguard] Ignorado readAsBinaryString com parâmetro não-Blob:', blob);
          return origReadAsBinaryString.call(this, new Blob([]));
        }
        return origReadAsBinaryString.call(this, blob);
      };
    }

    const origReadAsText = FileReader.prototype.readAsText;
    if (origReadAsText) {
      FileReader.prototype.readAsText = function (blob: Blob, encoding?: string) {
        if (!(blob instanceof Blob)) {
          console.warn('[Pannellum Safeguard] Ignorado readAsText com parâmetro não-Blob:', blob);
          return origReadAsText.call(this, new Blob([]), encoding);
        }
        return origReadAsText.call(this, blob, encoding);
      };
    }

    const origReadAsArrayBuffer = FileReader.prototype.readAsArrayBuffer;
    if (origReadAsArrayBuffer) {
      FileReader.prototype.readAsArrayBuffer = function (blob: Blob) {
        if (!(blob instanceof Blob)) {
          console.warn('[Pannellum Safeguard] Ignorado readAsArrayBuffer com parâmetro não-Blob:', blob);
          return origReadAsArrayBuffer.call(this, new Blob([]));
        }
        return origReadAsArrayBuffer.call(this, blob);
      };
    }

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
                err.message.includes('Cannot set properties of undefined') ||
                err.message.includes('readAsBinaryString'))
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

  if (window.URL && window.URL.createObjectURL) {
    const origCreateObjectURL = window.URL.createObjectURL;
    window.URL.createObjectURL = function (obj: Blob | MediaSource) {
      if (!(obj instanceof Blob) && !(obj instanceof MediaSource)) {
        console.warn('[Pannellum Safeguard] createObjectURL com objeto não-Blob:', obj);
        return '';
      }
      try {
        return origCreateObjectURL.call(this, obj);
      } catch {
        return '';
      }
    };
  }
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
