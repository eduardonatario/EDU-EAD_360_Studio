/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Download, FileCode, Loader2 } from 'lucide-react';
import React from 'react';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  isCompleted: boolean;
  downloadUrl: string | null;
  fileName: string;
  onClose: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  message,
  isCompleted,
  downloadUrl,
  fileName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-colors"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <FileCode className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isCompleted ? 'Exportação Concluída!' : 'Gerando HTML Independente...'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isCompleted
                ? 'Seu arquivo 100% offline está pronto para download.'
                : 'Otimizando imagens e embutindo bibliotecas locais.'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[280px]">{message}</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 mb-5 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Biblioteca Pannellum e CSS embutidos localmente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Panoramas e fotos serializados em Base64 Data URL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Código 100% isolado (seguro para embed/iframe em qualquer site)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Funciona offline e em duplo clique local (sem CORS)</span>
          </div>
        </div>

        {/* Botão de Ação */}
        {isCompleted && downloadUrl ? (
          <div className="flex flex-col gap-2">
            <a
              href={downloadUrl}
              download={fileName}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo HTML ({fileName})</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
            <span>Processando em segundo plano...</span>
          </div>
        )}
      </div>
    </div>
  );
};
