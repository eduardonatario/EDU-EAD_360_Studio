/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Edit2, Home, Plus, Trash2, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import bathroomPano from '../../assets/images/modern_bathroom_spa_1793417469297.jpg';
import bedroomPano from '../../assets/images/modern_bedroom_suite_1793417468751.jpg';
import kitchenPano from '../../assets/images/modern_kitchen_gourmet_1793417468857.jpg';
import livingPano from '../../assets/images/modern_living_room_1793417467833.jpg';
import { Scene } from '../../types/tour';

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string;
  initialSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: (scene: Scene) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onSetInitialScene: (sceneId: string) => void;
  onResetToDemo?: () => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  activeSceneId,
  initialSceneId,
  onSelectScene,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onSetInitialScene,
  onResetToDemo,
}) => {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartRename = (scene: Scene, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSceneId(scene.id);
    setEditName(scene.name);
  };

  const handleSaveRename = (sceneId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onUpdateScene(sceneId, { name: editName.trim() });
    }
    setEditingSceneId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const newSceneId = `scene-${Date.now()}`;
        const newScene: Scene = {
          id: newSceneId,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Novo Ambiente',
          description: 'Ambiente panorâmico 360° adicionado pelo professor.',
          imageUrl: result,
          initialPitch: 0,
          initialYaw: 0,
          initialHfov: 100,
          hotspots: [],
        };
        onAddScene(newScene);
        setIsAddingOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddPresetScene = (type: 'living' | 'kitchen' | 'bedroom' | 'bathroom', name: string) => {
    let pano = livingPano;
    if (type === 'kitchen') pano = kitchenPano;
    if (type === 'bedroom') pano = bedroomPano;
    if (type === 'bathroom') pano = bathroomPano;

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `${name} (Real 360°)`,
      description: 'Ambiente com fotografia 360° real de alta resolução.',
      imageUrl: pano,
      initialPitch: 0,
      initialYaw: 0,
      initialHfov: 100,
      hotspots: [],
    };
    onAddScene(newScene);
    setIsAddingOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-72 shrink-0 select-none text-slate-800 dark:text-slate-200 transition-colors">
      {/* Cabeçalho do Painel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ambientes Virtuais
          </h2>
          <span className="text-xs text-slate-700 dark:text-slate-400 font-medium tabular-nums">
            {scenes.length} {scenes.length === 1 ? 'cômodo cadastrado' : 'cômodos cadastrados'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingOpen(!isAddingOpen)}
          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-xs"
          title="Adicionar Cômodo"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Menu / Dropdown de Adição */}
      {isAddingOpen && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Origem da Imagem 360°:
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer text-left shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-sky-500" />
            <span>Fazer Upload de Foto 360°</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="text-[10px] text-slate-500 pt-1">Ou adicionar modelo pronto:</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleAddPresetScene('living', 'Sala de Estar')}
              className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] rounded text-slate-700 dark:text-slate-300 text-left truncate transition-colors cursor-pointer shadow-xs"
            >
              + Sala
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetScene('kitchen', 'Cozinha')}
              className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] rounded text-slate-700 dark:text-slate-300 text-left truncate transition-colors cursor-pointer shadow-xs"
            >
              + Cozinha
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetScene('bedroom', 'Quarto')}
              className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] rounded text-slate-700 dark:text-slate-300 text-left truncate transition-colors cursor-pointer shadow-xs"
            >
              + Quarto
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetScene('bathroom', 'Banheiro')}
              className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] rounded text-slate-700 dark:text-slate-300 text-left truncate transition-colors cursor-pointer shadow-xs"
            >
              + Banheiro
            </button>
          </div>

          {onResetToDemo && (
            <button
              type="button"
              onClick={() => {
                onResetToDemo();
                setIsAddingOpen(false);
              }}
              className="mt-2 w-full py-1.5 px-2.5 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center"
            >
              Restaurar Casa Completa (4 Cômodos Reais)
            </button>
          )}
        </div>
      )}

      {/* Lista de Cenas com Rolagem */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          const isInitial = scene.id === initialSceneId;
          const isRenaming = editingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group relative rounded-xl p-2.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-sky-50/80 dark:bg-slate-800/95 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                  : 'bg-slate-50/80 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Miniatura do Panorama */}
                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700/60 shadow-xs">
                  <img
                    src={scene.imageUrl}
                    alt={scene.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isInitial && (
                    <div
                      className="absolute bottom-1 left-1 p-0.5 rounded bg-amber-500 text-slate-950 shadow-xs"
                      title="Cômodo Inicial da Experiência"
                    >
                      <Home className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Dados da Cena */}
                <div className="flex-1 min-w-0">
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => handleSaveRename(scene.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2 py-1 rounded border border-sky-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                          {scene.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(scene, e)}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Renomear Cômodo"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {!isInitial && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetInitialScene(scene.id);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Definir como Ponto de Início"
                            >
                              <Home className="w-3 h-3" />
                            </button>
                          )}
                          {scenes.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteScene(scene.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Remover Cômodo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metadados Limpos */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="tabular-nums">
                          {scene.hotspots.length} {scene.hotspots.length === 1 ? 'hotspot' : 'hotspots'}
                        </span>
                        {isInitial && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Início</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
