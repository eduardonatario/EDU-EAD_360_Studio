/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle, X } from 'lucide-react';
import React from 'react';
import { Hotspot } from '../../types/tour';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export const HotspotModal: React.FC<HotspotModalProps> = ({ hotspot, onClose }) => {
  if (!hotspot) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {hotspot.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4">
          {hotspot.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-950">
              <img
                src={hotspot.imageUrl}
                alt={hotspot.title}
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {hotspot.description ? (
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {hotspot.description}
            </div>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500 italic">
              Nenhuma descrição adicional foi configurada para este ponto.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Entendido / Continuar Tour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
