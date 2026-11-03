/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, Info, MapPin, Move, Navigation, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { Hotspot, Scene } from '../../types/tour';

interface HotspotListProps {
  scene: Scene;
  allScenes: Scene[];
  selectedHotspotId?: string | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onStartPlacement: () => void;
  onStartRepositionSession: (targetHotspot?: Hotspot) => void;
  onDuplicateHotspot: (hotspot: Hotspot) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  isBusy: boolean;
}

export const HotspotList: React.FC<HotspotListProps> = ({
  scene,
  allScenes,
  selectedHotspotId,
  onSelectHotspot,
  onStartPlacement,
  onStartRepositionSession,
  onDuplicateHotspot,
  onDeleteHotspot,
  isBusy,
}) => {
  const getDestinationName = (sceneId?: string) => {
    if (!sceneId) return 'Não definido';
    const target = allScenes.find((s) => s.id === sceneId);
    return target ? target.name : 'Cômodo Removido';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-84 shrink-0 select-none text-slate-800 dark:text-slate-200 transition-colors">
      {/* Cabeçalho com ações de Inserção e Edição de Posição */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hotspots
          </h2>
          <span className="text-xs font-medium text-slate-800 dark:text-slate-300 truncate block max-w-[140px]">
            {scene.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onStartRepositionSession()}
            disabled={scene.hotspots.length === 0 || isBusy}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-40"
            title="Editar hotspot (aguarda clique no hotspot existente e depois clique na imagem)"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Editar hotspot</span>
          </button>

          <button
            type="button"
            onClick={onStartPlacement}
            disabled={isBusy}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
            title="Criar novo marcador nesta cena"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Lista */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {scene.hotspots.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <MapPin className="w-8 h-8 stroke-[1.5] mb-2 text-slate-400 dark:text-slate-600" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
              Nenhum hotspot nesta cena
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">
              Clique em &quot;Novo&quot; e em seguida clique em qualquer ponto da foto 360º para fixar o marcador.
            </p>
          </div>
        ) : (
          scene.hotspots.map((hs) => {
            const isSelected = hs.id === selectedHotspotId;
            const isInfo = hs.type === 'info';

            return (
              <div
                key={hs.id}
                onClick={() => onSelectHotspot(hs)}
                className={`group rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/80 dark:bg-slate-800 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-slate-50/80 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Ícone de Tipo */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isInfo
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isInfo ? <Info className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                        {hs.title || (isInfo ? 'Hotspot informativo' : 'Seta para novo cômodo')}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartRepositionSession(hs);
                          }}
                          className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Editar posição deste hotspot"
                        >
                          <Move className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateHotspot(hs);
                          }}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Duplicar Hotspot"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHotspot(hs.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Excluir Hotspot"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {isInfo ? 'Hotspot informativo' : `Destino: ${getDestinationName(hs.targetSceneId)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
