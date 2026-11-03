/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import React from 'react';
import { Hotspot } from '../../types/tour';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

function getBackdropBlurClass(blur?: string): string {
  switch (blur) {
    case 'none':
      return 'backdrop-blur-none bg-slate-950/40';
    case 'low':
      return 'backdrop-blur-xs bg-slate-950/50';
    case 'high':
      return 'backdrop-blur-xl bg-slate-950/80';
    case 'medium':
    default:
      return 'backdrop-blur-md bg-slate-950/70';
  }
}

export const HotspotModal: React.FC<HotspotModalProps> = ({ hotspot, onClose }) => {
  if (!hotspot) return null;

  const isDark = hotspot.cardTheme === 'dark';
  const backdropClass = getBackdropBlurClass(hotspot.backdropBlur);

  // Modo Apenas Imagem preenchendo o quadro de informação
  if (hotspot.imageOnly && hotspot.imageUrl) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200 ${backdropClass}`}
        onClick={onClose}
      >
        <div
          className="relative bg-black rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex items-center justify-center border border-white/15"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={hotspot.imageUrl}
            alt={hotspot.title}
            className="w-full h-full max-h-[88vh] object-contain block"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/20 shadow-lg"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200 ${backdropClass}`}
      onClick={onClose}
    >
      <div
        className={`rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col transition-colors border ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div
          className={`p-5 border-b flex items-start justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h3
              className={`text-lg font-bold leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {hotspot.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4">
          {hotspot.imageUrl && (
            <div
              className={`rounded-xl overflow-hidden border shadow-md ${
                isDark
                  ? 'border-slate-800 bg-slate-950'
                  : 'border-slate-200 bg-slate-100'
              }`}
            >
              <img
                src={hotspot.imageUrl}
                alt={hotspot.title}
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {hotspot.description ? (
            <div
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {hotspot.description}
            </div>
          ) : (
            <div
              className={`text-xs italic ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Nenhuma descrição adicional foi configurada para este ponto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
