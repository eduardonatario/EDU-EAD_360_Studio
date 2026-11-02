/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Eye, Layers, Moon, PenTool, PlusCircle, Sparkles, Sun } from 'lucide-react';
import React from 'react';
import { TourProject, ViewMode } from '../../types/tour';

interface TopBarProps {
  project: TourProject;
  activeSceneName: string;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onExportHTML: () => void;
  isExporting: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenProjectSettings?: () => void;
  onNewTour?: () => void;
  onLoadSampleTour?: () => void;
  onDownloadDemoImages?: () => void;
  isDownloadingDemo?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  activeSceneName: _activeSceneName,
  viewMode,
  onToggleViewMode,
  onExportHTML,
  isExporting,
  theme,
  onToggleTheme,
  onOpenProjectSettings: _onOpenProjectSettings,
  onNewTour,
  onLoadSampleTour,
  onDownloadDemoImages,
  isDownloadingDemo,
}) => {
  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-6 shrink-0 z-40 select-none transition-colors">
      {/* Zone 1: Single text element wordmark + Criar Novo Tour + Exibir Ambiente Modelo + Baixar Imagens Modelo */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/30">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap block leading-tight">
            EAD 360 Studio
          </span>
          {Boolean(
            project.title &&
              project.title !== 'Crie imersão em ambiente em 360º' &&
              project.title !== 'Tour Virtual 360º'
          ) ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
              {project.title}
            </span>
          ) : null}
        </div>

        {onNewTour && (
          <button
            type="button"
            onClick={onNewTour}
            className="ml-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Apaga os ambientes virtuais de exemplo para criar um novo tour do zero"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Criar novo Tour</span>
          </button>
        )}

        {onLoadSampleTour && (
          <button
            type="button"
            onClick={onLoadSampleTour}
            className="px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800/80 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Carrega e exibe o ambiente modelo de exemplo com todos os cômodos e hotspots"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Exibir ambiente modelo</span>
          </button>
        )}

        {onDownloadDemoImages && (
          <button
            type="button"
            onClick={onDownloadDemoImages}
            disabled={isDownloadingDemo}
            className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Baixar arquivos de imagens 360º dos ambientes virtuais usados como modelo"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isDownloadingDemo ? 'Baixando...' : 'Baixar imagens 360º de modelo'}</span>
          </button>
        )}
      </div>

      {/* Zone 3: Mode Switch, Theme Toggle and Primary Export Action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Alternador de Tema Claro / Escuro */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Alternar tema claro ou escuro"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Toggle Mode: Configuração / Preview */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => onToggleViewMode('editor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Configuração</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('preview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Primary Action Button: Baixar HTML */}
        <button
          type="button"
          onClick={onExportHTML}
          disabled={isExporting}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exportando...' : 'BAIXAR HTML'}</span>
        </button>
      </div>
    </header>
  );
};
