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

  if (window.FileReader) {
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
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
