/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Copy,
  DoorOpen,
  Edit2,
  GripVertical,
  Home,
  Info,
  Layers,
  MapPin,
  Monitor,
  Move,
  Navigation,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import {
  ArrowDirection,
  DEFAULT_HOTSPOT_SETTINGS,
  getArrowGlyph,
  getArrowLabel,
  GlobalHotspotSettings,
  Hotspot,
  Scene,
} from '../../types/tour';
import { compressDataUrl } from '../../services/image/compressor';

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string;
  initialSceneId: string;
  settings?: GlobalHotspotSettings;
  onUpdateSettings?: (settings: GlobalHotspotSettings) => void;
  selectedHotspotId?: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddScene: (scene: Scene) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onSetInitialScene: (sceneId: string) => void;
  onReorderScenes?: (scenes: Scene[]) => void;
  onMoveScene?: (sceneId: string, direction: 'up' | 'down') => void;
  onResetToDemo?: () => void;
  // Ações de hotspots aninhadas
  onSelectHotspot?: (hotspot: Hotspot, sceneId?: string) => void;
  onStartPlacement?: () => void;
  onStartRepositionSession?: (targetHotspot?: Hotspot) => void;
  onDuplicateHotspot?: (hotspot: Hotspot) => void;
  onDeleteHotspot?: (hotspotId: string) => void;
  isBusy?: boolean;
}

const INFO_COLOR_PRESETS = [
  { label: 'Azul Céu', hex: '#0ea5e9' },
  { label: 'Roxo', hex: '#8b5cf6' },
  { label: 'Âmbar', hex: '#f59e0b' },
  { label: 'Rosa', hex: '#ec4899' },
  { label: 'Ciano', hex: '#06b6d4' },
  { label: 'Vermelho', hex: '#ef4444' },
];

const SCENE_COLOR_PRESETS = [
  { label: 'Esmeralda', hex: '#10b981' },
  { label: 'Azul', hex: '#0ea5e9' },
  { label: 'Índigo', hex: '#6366f1' },
  { label: 'Laranja', hex: '#f97316' },
  { label: 'Teal', hex: '#14b8a6' },
  { label: 'Amarelo', hex: '#eab308' },
];

const ARROW_COLOR_PRESETS = [
  { label: 'Branco', hex: '#ffffff' },
  { label: 'Grafite', hex: '#0f172a' },
  { label: 'Amarelo', hex: '#facc15' },
  { label: 'Azul Claro', hex: '#38bdf8' },
  { label: 'Verde Claro', hex: '#34d399' },
];

const ARROW_DIRECTIONS: { id: ArrowDirection; label: string; glyph: string }[] = [
  { id: 'right', label: 'Direita', glyph: '➔' },
  { id: 'left', label: 'Esquerda', glyph: '⬅' },
  { id: 'up', label: 'Cima', glyph: '⬆' },
  { id: 'down', label: 'Baixo', glyph: '⬇' },
  { id: 'up-right', label: 'Diag. Dir', glyph: '↗' },
  { id: 'up-left', label: 'Diag. Esq', glyph: '↖' },
  { id: 'compass', label: 'Bússola', glyph: '🧭' },
  { id: 'door', label: 'Porta', glyph: '🚪' },
];

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  activeSceneId,
  initialSceneId,
  settings = DEFAULT_HOTSPOT_SETTINGS,
  onUpdateSettings,
  selectedHotspotId,
  onSelectScene,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onSetInitialScene,
  onReorderScenes,
  onMoveScene,
  onResetToDemo,
  onSelectHotspot,
  onStartPlacement,
  onStartRepositionSession,
  onDuplicateHotspot,
  onDeleteHotspot,
  isBusy = false,
}) => {
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isScenesListCollapsed, setIsScenesListCollapsed] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomUrl, setNewRoomUrl] = useState('');
  const [addSourceType, setAddSourceType] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para recolher/retrair cômodos individualmente
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});

  // Estado para reordenação drag & drop de ambientes
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedSceneIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedSceneIndex === null || draggedSceneIndex === index) return;
    setDragOverSceneIndex(index);
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedSceneIndex === null || draggedSceneIndex === targetIndex) {
      setDraggedSceneIndex(null);
      setDragOverSceneIndex(null);
      return;
    }

    const reordered = [...scenes];
    const [removed] = reordered.splice(draggedSceneIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    onReorderScenes?.(reordered);
    setDraggedSceneIndex(null);
    setDragOverSceneIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSceneIndex(null);
    setDragOverSceneIndex(null);
  };

  // Estado para troca de imagem 360 do cômodo
  const [changingImageScene, setChangingImageScene] = useState<Scene | null>(null);
  const [changeImageSourceType, setChangeImageSourceType] = useState<'upload' | 'url'>('upload');
  const [changeImageUrl, setChangeImageUrl] = useState('');
  const changeFileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleRoom = (sceneId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sceneId === activeSceneId) {
      setCollapsedScenes((prev) => ({
        ...prev,
        [sceneId]: !prev[sceneId],
      }));
    } else {
      setCollapsedScenes((prev) => ({
        ...prev,
        [sceneId]: false,
      }));
      onSelectScene(sceneId);
    }
  };

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

    const finalName =
      newRoomName.trim() ||
      file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
      `Cômodo ${scenes.length + 1}`;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        let finalImage = result;
        try {
          finalImage = await compressDataUrl(result, {
            maxWidth: 4096,
            maxHeight: 2048,
            quality: 0.88,
          });
        } catch {
          // fallback
        }

        const newSceneId = `scene-${Date.now()}`;
        const newScene: Scene = {
          id: newSceneId,
          name: finalName,
          description: 'Ambiente panorâmico 360°.',
          imageUrl: finalImage,
          initialPitch: 0,
          initialYaw: 0,
          initialHfov: 100,
          hotspots: [],
        };
        onAddScene(newScene);
        setNewRoomName('');
        setNewRoomUrl('');
        setIsAddingOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddByUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRoomUrl.trim()) return;

    const finalName = newRoomName.trim() || `Cômodo ${scenes.length + 1}`;
    const newSceneId = `scene-${Date.now()}`;
    const newScene: Scene = {
      id: newSceneId,
      name: finalName,
      description: 'Ambiente panorâmico 360° via URL.',
      imageUrl: newRoomUrl.trim(),
      initialPitch: 0,
      initialYaw: 0,
      initialHfov: 100,
      hotspots: [],
    };
    onAddScene(newScene);
    setNewRoomName('');
    setNewRoomUrl('');
    setIsAddingOpen(false);
  };

  const updateSetting = <K extends keyof GlobalHotspotSettings>(
    key: K,
    val: GlobalHotspotSettings[K]
  ) => {
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        [key]: val,
      });
    }
  };

  const getDestinationName = (sceneId?: string) => {
    if (!sceneId) return 'Não definido';
    const target = scenes.find((s) => s.id === sceneId);
    return target ? target.name : 'Cômodo Removido';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-84 shrink-0 select-none text-slate-800 dark:text-slate-200 transition-colors shadow-sm overflow-hidden">
      {/* Contêiner de Scroll Unificado: Opções Gerais e Ambientes Virtuais fluem juntos sem menus fixos */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* 1. SEÇÃO DE OPÇÕES GERAIS (ACIMA DO MENU AMBIENTES VIRTUAIS) */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setIsGeneralSettingsOpen(!isGeneralSettingsOpen)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block leading-tight">
                  Opções Gerais
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                  Personalize cores, setas, controles, menus e formato
                </span>
              </div>
            </div>
            <div className="text-slate-400">
              {isGeneralSettingsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {isGeneralSettingsOpen && (
            <div className="px-3.5 pb-4 pt-1 space-y-3.5 text-xs border-t border-slate-200/80 dark:border-slate-800/80 animate-in fade-in duration-150">
            {/* Opção 1: Cor dos Hotspots Informativos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-500" />
                  <span>Cor dos Hotspots Informativos</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={settings.infoColor}
                    onChange={(e) => updateSetting('infoColor', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0"
                    title="Escolher cor personalizada"
                  />
                  <span className="font-mono text-[10px] text-slate-500 uppercase">
                    {settings.infoColor}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {INFO_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => updateSetting('infoColor', preset.hex)}
                    title={preset.label}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-white dark:border-slate-800 shadow-xs ${
                      settings.infoColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-sky-500 scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Opção 2: Cor dos Portais de Navegação */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cor dos Portais de Cômodo</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={settings.sceneColor}
                    onChange={(e) => updateSetting('sceneColor', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0"
                    title="Escolher cor personalizada"
                  />
                  <span className="font-mono text-[10px] text-slate-500 uppercase">
                    {settings.sceneColor}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SCENE_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => updateSetting('sceneColor', preset.hex)}
                    title={preset.label}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-white dark:border-slate-800 shadow-xs ${
                      settings.sceneColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-emerald-500 scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Opção 3: Piscar levemente os hotspots */}
            <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Piscar levemente os hotspots
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pulseEffect}
                  onChange={(e) => updateSetting('pulseEffect', e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Efeito de pulsar nos marcadores e setas
              </span>
            </div>

            {/* Opção 4: Exibir controles de navegação (lupa, zoom, centralizar camera e tela cheia) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Exibir controles de zoom e tela cheia
                </span>
                <input
                  type="checkbox"
                  checked={settings.showNavigationControls ?? true}
                  onChange={(e) => updateSetting('showNavigationControls', e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Ícones de lupa, zoom, centralizar câmera e tela cheia no canto inferior direito.
              </span>
            </div>

            {/* Opção 6: Exibir botão de Início (Home) nos controles */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-500" />
                  <span>Exibir ícone de Início (Home)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showHomeButton ?? true}
                  onChange={(e) => updateSetting('showHomeButton', e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Ícone de casa nos controles flutuantes para que o usuário volte ao primeiro ambiente a qualquer momento.
              </span>
            </div>

            {/* Opção 7: Exibir menu de navegação com nome dos espaços na parte inferior central */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Exibir menu de espaços inferior
                </span>
                <input
                  type="checkbox"
                  checked={settings.showBottomRoomBar ?? false}
                  onChange={(e) => updateSetting('showBottomRoomBar', e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Barra com o nome de todos os cômodos na parte inferior central da tela.
              </span>

              {/* Sub-opção quando ativado: Exibir ou não o número de hotspots junto a este menu */}
              {(settings.showBottomRoomBar ?? false) && (
                <div className="pl-3 border-l-2 border-sky-500/40 mt-1.5 space-y-1 animate-in fade-in duration-150">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Exibir número de hotspots no menu
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showRoomBarHotspotCount ?? false}
                      onChange={(e) => updateSetting('showRoomBarHotspotCount', e.target.checked)}
                      className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer accent-sky-600"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block">
                    Mostra a contagem de hotspots ao lado do nome de cada cômodo no rodapé.
                  </span>
                </div>
              )}
            </div>

            {/* Opção 8: Formato e Tamanho do Espaço de Navegação */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-sky-500" />
                  <span>Formato do Espaço de Navegação</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {(settings.viewportFormat ?? '16:9') === '16:9'
                    ? '16:9 (1920×1080) · Padrão'
                    : settings.viewportFormat === '9:16'
                    ? '9:16 (1080×1920)'
                    : settings.viewportFormat === 'custom'
                    ? 'Personalizado'
                    : 'Livre'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSetting('viewportFormat', '16:9')}
                  className={`p-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                    (settings.viewportFormat ?? '16:9') === '16:9'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>1920 × 1080 (16:9)</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold">Padrão</span>
                  </span>
                  <span className="text-[9px] font-normal opacity-75">Horizontal Full HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('viewportFormat', 'free')}
                  className={`p-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                    settings.viewportFormat === 'free'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>Formato livre</span>
                  <span className="text-[9px] font-normal opacity-75">100% Responsivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('viewportFormat', '9:16')}
                  className={`p-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                    settings.viewportFormat === '9:16'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>1080 × 1920 (9:16)</span>
                  <span className="text-[9px] font-normal opacity-75">Vertical / Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('viewportFormat', 'custom')}
                  className={`p-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                    settings.viewportFormat === 'custom'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>Personalizado</span>
                  <span className="text-[9px] font-normal opacity-75">Largura × Altura</span>
                </button>
              </div>

              {settings.viewportFormat === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                      Largura (px):
                    </span>
                    <input
                      type="number"
                      min={320}
                      max={3840}
                      step={10}
                      value={settings.customWidth ?? 1920}
                      onChange={(e) => updateSetting('customWidth', Number(e.target.value) || 1920)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-900 dark:text-slate-100 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                      Altura (px):
                    </span>
                    <input
                      type="number"
                      min={240}
                      max={2160}
                      step={10}
                      value={settings.customHeight ?? 1080}
                      onChange={(e) => updateSetting('customHeight', Number(e.target.value) || 1080)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-900 dark:text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Opção 8: Iniciar ambiente com a imagem mais aberta possível */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Iniciar ambiente com imagem mais aberta possível
                </span>
                <input
                  type="checkbox"
                  checked={settings.initialWideFov ?? false}
                  onChange={(e) => updateSetting('initialWideFov', e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Abre o campo de visão panorâmico no máximo (grande angular / visão ampla).
              </span>
            </div>

            {/* Opção 9: Cor do quadro informativo (reflete em todos os ambientes) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Fundo do quadro informativo
                </span>
                <span className="text-[10px] text-slate-400">
                  {settings.cardTheme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSetting('cardTheme', 'light')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    (settings.cardTheme ?? 'light') === 'light'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>☀️ Claro (Padrão)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('cardTheme', 'dark')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    settings.cardTheme === 'dark'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>🌙 Escuro</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Define o fundo claro ou escuro dos quadros de informação em todos os ambientes.
              </span>
            </div>

            {/* Opção 10: Desfoque do fundo ao abrir o quadro (reflete em todos os ambientes) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Desfoque do fundo ao abrir o quadro
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: 'Sem desfoque' },
                  { id: 'low', label: 'Pouco desfocado (Padrão)' },
                  { id: 'medium', label: 'Desfoque médio' },
                  { id: 'high', label: 'Muito desfocado' },
                ].map((opt) => {
                  const isSelected = (settings.backdropBlur ?? 'low') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('backdropBlur', opt.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Define a intensidade do desfoque do ambiente 360° ao abrir o quadro em todos os cômodos.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SEÇÃO AMBIENTES VIRTUAIS COM HOTSPOTS ANINHADOS */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setIsScenesListCollapsed(!isScenesListCollapsed)}
          className="flex items-center gap-2 text-left cursor-pointer group flex-1"
          title={isScenesListCollapsed ? 'Clique para expandir os cômodos' : 'Clique para recolher os cômodos cadastrados'}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Ambientes Virtuais
              </h2>
              {isScenesListCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums block">
              {scenes.length} {scenes.length === 1 ? 'cômodo' : 'cômodos'} cadastrados
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setIsAddingOpen(!isAddingOpen)}
          className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-xs text-xs font-semibold flex items-center gap-1"
          title="Adicionar Cômodo"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Cômodo</span>
        </button>
      </div>

      {/* Menu / Dropdown de Adição de Novo Cômodo */}
      {isAddingOpen && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 animate-in fade-in duration-150">
          {/* Campo: Nome do novo cômodo */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nome do novo cômodo:
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Ex: Sala de Estudos, Laboratório..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Abas: Upload ou URL */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/80 dark:bg-slate-850 rounded-lg text-center">
            <button
              type="button"
              onClick={() => setAddSourceType('upload')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                addSourceType === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Upload 360°
            </button>
            <button
              type="button"
              onClick={() => setAddSourceType('url')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                addSourceType === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              URL da Imagem
            </button>
          </div>

          {/* Opção 1: Upload de Foto 360° */}
          {addSourceType === 'upload' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Selecionar foto panorâmica 360°</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <span className="text-[10px] text-slate-400 block text-center">
                Formatos aceitos: JPG, PNG equirretangular 360°
              </span>
            </div>
          )}

          {/* Opção 2: URL da Imagem 360° */}
          {addSourceType === 'url' && (
            <form onSubmit={handleAddByUrl} className="space-y-2">
              <input
                type="url"
                value={newRoomUrl}
                onChange={(e) => setNewRoomUrl(e.target.value)}
                placeholder="https://exemplo.com/panorama-360.jpg"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!newRoomUrl.trim()}
                className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Adicionar Cômodo por URL
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setIsAddingOpen(false)}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center py-1 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* 3. LISTA DE AMBIENTES COM HOTSPOTS ANINHADOS LOGO ABAIXO */}
      {!isScenesListCollapsed && (
        <div className="p-3 space-y-3">
        {scenes.length === 0 ? (
          <div className="p-4 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Nenhum cômodo cadastrado ainda.
            </span>
            <button
              type="button"
              onClick={() => setIsAddingOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Primeiro Cômodo</span>
            </button>
          </div>
        ) : (
          scenes.map((scene, index) => {
            const isActive = scene.id === activeSceneId;
            const isExpanded = isActive && !collapsedScenes[scene.id];
            const isInitial = scene.id === initialSceneId;
            const isRenaming = editingSceneId === scene.id;
            const isBeingDragged = draggedSceneIndex === index;
            const isOverTarget = dragOverSceneIndex === index && draggedSceneIndex !== index;

            const infoHotspots = scene.hotspots.filter((h) => h.type === 'info');
            const portalHotspots = scene.hotspots.filter((h) => h.type === 'scene');

            return (
              <div
                key={scene.id}
                draggable={!isRenaming && scenes.length > 1}
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDrop={(e) => handleDrop(index, e)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border transition-all ${
                  isOverTarget
                    ? 'border-sky-500 ring-2 ring-sky-500/50 scale-[1.01]'
                    : isBeingDragged
                    ? 'opacity-40 border-dashed border-slate-400'
                    : isActive
                    ? 'border-sky-500 bg-sky-50/40 dark:bg-slate-850 shadow-sm ring-1 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Card do Cômodo */}
                <div
                  onClick={(e) => handleToggleRoom(scene.id, e)}
                  className="p-2.5 flex items-start gap-2 cursor-pointer group"
                >
                  {/* Puxador para Reordenar / Grip */}
                  {scenes.length > 1 && (
                    <div
                      className="self-center -ml-1 text-slate-300 dark:text-slate-600 hover:text-sky-500 dark:hover:text-sky-400 cursor-grab active:cursor-grabbing p-1 transition-colors shrink-0"
                      title="Arraste para alterar a ordem deste ambiente virtual"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Miniatura do Cômodo com opção de Trocar Imagem ao Clicar */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setChangingImageScene(scene);
                      setChangeImageUrl('');
                      setChangeImageSourceType('upload');
                    }}
                    className="relative w-14 h-11 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer group/thumb"
                    title="Clique sobre a foto para trocar a imagem 360° deste cômodo"
                  >
                    <img
                      src={scene.imageUrl}
                      alt={scene.name}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-0.5 text-center">
                      <Camera className="w-3.5 h-3.5 drop-shadow" />
                      <span className="text-[8px] font-bold tracking-tight">Trocar</span>
                    </div>
                    {isInitial && (
                      <div
                        className="absolute bottom-0.5 left-0.5 p-0.5 rounded bg-amber-500 text-slate-950 shadow-xs z-10"
                        title="Cômodo Inicial"
                      >
                        <Home className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Título & Ações do Cômodo */}
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
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                              #{index + 1}
                            </span>
                            <span
                              className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                              title={isExpanded ? 'Clique para retrair o menu deste cômodo' : 'Clique para abrir o menu deste cômodo'}
                            >
                              {scene.name}
                            </span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            {/* Botões para Reordenar Ambiente para Cima ou para Baixo */}
                            {scenes.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveScene?.(scene.id, 'up');
                                  }}
                                  className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 disabled:hover:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                  title={index === 0 ? 'Primeiro cômodo' : 'Mover cômodo para cima'}
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === scenes.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveScene?.(scene.id, 'down');
                                  }}
                                  className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 disabled:hover:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                  title={index === scenes.length - 1 ? 'Último cômodo' : 'Mover cômodo para baixo'}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(scene, e)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
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
                                className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                                title="Definir como Início"
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
                                className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                                title="Remover Cômodo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Contagem de Hotspots & Indicador de Retração */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sky-600 dark:text-sky-400">
                            {infoHotspots.length} info
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {portalHotspots.length} {portalHotspots.length === 1 ? 'seta' : 'setas'}
                          </span>
                          <span className="ml-auto text-[10px] font-medium flex items-center gap-0.5">
                            {isExpanded ? (
                              <>
                                <ChevronDown className="w-3 h-3 text-sky-500" />
                                <span className="text-sky-600 dark:text-sky-400 font-semibold">Aberto</span>
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-400">Recolhido</span>
                              </>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* CONTEÚDO ANINHADO: APARECE LOGO ABAIXO QUANDO O AMBIENTE ESTÁ EXPANDIDO */}
                {isExpanded && (
                <div className="border-t border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 p-2.5 space-y-2.5 rounded-b-xl animate-in fade-in duration-150">
                  {/* Barra de Ações Rápidas de Hotspot para este Cômodo */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onStartPlacement?.()}
                      disabled={isBusy}
                      className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                      title="Adicionar novo hotspot clicando na imagem 360°"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Hotspot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartRepositionSession?.()}
                      disabled={scene.hotspots.length === 0 || isBusy}
                      className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-40"
                      title="Editar hotspot (clique no marcador e depois no novo local)"
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>Editar Posição</span>
                    </button>
                  </div>

                  {/* SUB-LISTA 1: HOTSPOTS INFORMATIVOS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      <span>Hotspots Informativos ({infoHotspots.length})</span>
                    </div>

                    {infoHotspots.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-1 py-1">
                        Nenhum ponto informativo neste cômodo.
                      </div>
                    ) : (
                      infoHotspots.map((hs) => {
                        const isSelected = hs.id === selectedHotspotId;
                        return (
                          <div
                            key={hs.id}
                            onClick={() => onSelectHotspot?.(hs, scene.id)}
                            className={`group rounded-lg p-2 border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-slate-800 border-sky-500 shadow-xs ring-1 ring-sky-500/30'
                                : 'bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
                                style={{ backgroundColor: hs.customColor || settings.infoColor }}
                              >
                                i
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                  {hs.title || 'Ponto Informativo'}
                                </span>
                              </div>
                            </div>

                            {/* Ações do Hotspot */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartRepositionSession?.(hs);
                                }}
                                className="p-1 text-amber-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Editar posição deste hotspot"
                              >
                                <Move className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateHotspot?.(hs);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Duplicar"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteHotspot?.(hs.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* SUB-LISTA 2: SETAS DE NAVEGAÇÃO ENTRE CÔMODOS */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      <span>Setas para novos cômodos ({portalHotspots.length})</span>
                    </div>

                    {portalHotspots.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-1 py-1">
                        Nenhuma seta para outro cômodo cadastrada.
                      </div>
                    ) : (
                      portalHotspots.map((hs) => {
                        const isSelected = hs.id === selectedHotspotId;
                        const arrowGlyph = getArrowGlyph(hs.arrowDirection || settings.defaultArrowDirection);
                        return (
                          <div
                            key={hs.id}
                            onClick={() => onSelectHotspot?.(hs, scene.id)}
                            className={`group rounded-lg p-2 border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                                : 'bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs"
                                style={{
                                  backgroundColor: hs.customColor || settings.sceneColor,
                                  color: hs.arrowColor || settings.arrowColor,
                                }}
                              >
                                {arrowGlyph}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                  {hs.title || `Ir para ${getDestinationName(hs.targetSceneId)}`}
                                </span>
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block truncate">
                                  ➔ {getDestinationName(hs.targetSceneId)}
                                </span>
                              </div>
                            </div>

                            {/* Ações da Seta */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                              {hs.targetSceneId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectScene(hs.targetSceneId!);
                                  }}
                                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded"
                                  title="Testar mudança de cômodo"
                                >
                                  <Navigation className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartRepositionSession?.(hs);
                                }}
                                className="p-1 text-amber-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Editar posição desta seta"
                              >
                                <Move className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateHotspot?.(hs);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Duplicar"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteHotspot?.(hs.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
        </div>
      )}
      </div>

      {/* MODAL / DIÁLOGO DE TROCAR IMAGEM 360° DO CÔMODO */}
      {changingImageScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in select-none">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-500" />
                  <span>Trocar Imagem 360° do Cômodo</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Ambiente: <strong className="text-slate-700 dark:text-slate-300">{changingImageScene.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChangingImageScene(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Pré-visualização da imagem atual / nova */}
            <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner">
              <img
                src={changeImageUrl.trim() || changingImageScene.imageUrl}
                alt={changingImageScene.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-medium text-white backdrop-blur-xs">
                {changeImageUrl.trim() ? 'Nova Imagem (URL)' : 'Imagem Atual do Cômodo'}
              </div>
            </div>

            {/* Abas: Upload ou URL */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
              <button
                type="button"
                onClick={() => setChangeImageSourceType('upload')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  changeImageSourceType === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Upload de Foto 360°
              </button>
              <button
                type="button"
                onClick={() => setChangeImageSourceType('url')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  changeImageSourceType === 'url'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Colar URL da Imagem
              </button>
            </div>

            {changeImageSourceType === 'upload' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => changeFileInputRef.current?.click()}
                  className="w-full py-3.5 px-3 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4 text-sky-500" />
                  <span>Selecionar nova foto panorâmica 360°</span>
                </button>
                <input
                  ref={changeFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const res = ev.target?.result as string;
                      if (res) {
                        let finalImg = res;
                        try {
                          finalImg = await compressDataUrl(res, {
                            maxWidth: 4096,
                            maxHeight: 2048,
                            quality: 0.88,
                          });
                        } catch {
                          // fallback
                        }
                        onUpdateScene(changingImageScene.id, { imageUrl: finalImg });
                        setChangingImageScene(null);
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                <span className="text-[10px] text-slate-400 block text-center">
                  Formatos recomendados: JPG ou PNG equirretangular panorâmico (2:1)
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={changeImageUrl}
                  onChange={(e) => setChangeImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/panorama-360.jpg"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="button"
                  disabled={!changeImageUrl.trim()}
                  onClick={() => {
                    if (changeImageUrl.trim()) {
                      onUpdateScene(changingImageScene.id, { imageUrl: changeImageUrl.trim() });
                      setChangingImageScene(null);
                    }
                  }}
                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Nova Imagem do Cômodo
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setChangingImageScene(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
