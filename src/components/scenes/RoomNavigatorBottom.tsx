/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scene } from '../../types/tour';

interface RoomNavigatorBottomProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
}

export const RoomNavigatorBottom: React.FC<RoomNavigatorBottomProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
}) => {
  return (
    <nav
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 flex gap-1.5 shadow-xl max-w-[90vw] overflow-x-auto select-none pointer-events-auto"
      aria-label="Navegação Rápida de Ambientes"
    >
      {scenes.map((scene) => {
        const isActive = scene.id === activeSceneId;
        return (
          <button
            key={scene.id}
            type="button"
            onClick={() => onSelectScene(scene.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{scene.name}</span>
            <span
              className={`text-[10px] font-mono tabular-nums ${
                isActive ? 'text-sky-200' : 'text-slate-500'
              }`}
            >
              ({scene.hotspots.length})
            </span>
          </button>
        );
      })}
    </nav>
  );
};
