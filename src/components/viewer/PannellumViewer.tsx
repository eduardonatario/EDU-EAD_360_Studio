/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'pannellum/build/pannellum.css';
import 'pannellum/build/pannellum.js';

import { Crosshair, MapPin, Maximize, Minimize, Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Coords360, Hotspot, RepositionSession, Scene, ViewMode } from '../../types/tour';

interface PannellumViewerProps {
  scenes: Scene[];
  activeSceneId: string;
  viewMode: ViewMode;
  isAddingNewHotspot: boolean;
  repositionSession: RepositionSession | null;
  onSelectHotspotForReposition: (hotspot: Hotspot) => void;
  onPlaceNewHotspotCoords: (coords: Coords360) => void;
  onSetNewCoordsForReposition: (coords: Coords360) => void;
  onCancelAction: () => void;
  onSelectInfoHotspot: (hotspot: Hotspot) => void;
  onNavigateScene: (sceneId: string) => void;
  selectedHotspotId?: string | null;
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({
  scenes,
  activeSceneId,
  viewMode,
  isAddingNewHotspot,
  repositionSession,
  onSelectHotspotForReposition,
  onPlaceNewHotspotCoords,
  onSetNewCoordsForReposition,
  onCancelAction,
  onSelectInfoHotspot,
  onNavigateScene,
  selectedHotspotId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manter referências atualizadas aos callbacks
  const onNavigateSceneRef = useRef(onNavigateScene);
  onNavigateSceneRef.current = onNavigateScene;

  const onSelectInfoHotspotRef = useRef(onSelectInfoHotspot);
  onSelectInfoHotspotRef.current = onSelectInfoHotspot;

  const onSelectHotspotForRepositionRef = useRef(onSelectHotspotForReposition);
  onSelectHotspotForRepositionRef.current = onSelectHotspotForReposition;

  const onPlaceNewHotspotCoordsRef = useRef(onPlaceNewHotspotCoords);
  onPlaceNewHotspotCoordsRef.current = onPlaceNewHotspotCoords;

  const onSetNewCoordsForRepositionRef = useRef(onSetNewCoordsForReposition);
  onSetNewCoordsForRepositionRef.current = onSetNewCoordsForReposition;

  const isAddingNewHotspotRef = useRef(isAddingNewHotspot);
  isAddingNewHotspotRef.current = isAddingNewHotspot;

  const repositionSessionRef = useRef(repositionSession);
  repositionSessionRef.current = repositionSession;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const activeSceneIdRef = useRef(activeSceneId);
  activeSceneIdRef.current = activeSceneId;

  // 1. Inicializar ou Reconfigurar o Visualizador Pannellum
  useEffect(() => {
    if (!containerRef.current) return;

    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch (err) {
        console.warn('Erro ao destruir viewer antigo:', err);
      }
      viewerRef.current = null;
    }

    const pnlm = (window as any).pannellum;
    if (!pnlm) {
      console.error('Biblioteca Pannellum não carregada no window');
      return;
    }

    const pnlmScenes: Record<string, any> = {};

    scenes.forEach((sc) => {
      pnlmScenes[sc.id] = {
        type: 'equirectangular',
        panorama: sc.imageUrl,
        pitch: sc.initialPitch || 0,
        yaw: sc.initialYaw || 0,
        hfov: sc.initialHfov || 100,
        hotSpots: sc.hotspots.map((hs) => {
          const isSelected = hs.id === selectedHotspotId;
          const isInfo = hs.type === 'info';
          const isRepositionCandidate = repositionSession?.step === 'select_hotspot';
          const isTargetBeingRepositioned = repositionSession?.targetHotspotId === hs.id;

          let stateClass = '';
          if (isTargetBeingRepositioned) {
            stateClass = 'hotspot-reposition-selected';
          } else if (isRepositionCandidate) {
            stateClass = 'hotspot-reposition-candidate';
          } else if (isSelected) {
            stateClass = 'ring-4 ring-amber-400 ring-offset-2';
          }

          const baseClass = isInfo ? 'custom-hotspot-info' : 'custom-hotspot-scene';

          return {
            id: hs.id,
            pitch: hs.pitch,
            yaw: hs.yaw,
            type: hs.type,
            text: hs.title,
            sceneId: hs.type === 'scene' ? hs.targetSceneId : undefined,
            targetPitch: hs.targetPitch || 0,
            targetYaw: hs.targetYaw || 0,
            cssClass: `${baseClass} ${stateClass}`,
            clickHandlerFunc: () => {
              // Se estiver no PASSO 1 da sessão de editar hotspot:
              if (repositionSessionRef.current?.step === 'select_hotspot') {
                onSelectHotspotForRepositionRef.current(hs);
                return;
              }

              // Se estiver no PASSO 2 ou adicionando novo, ignora cliques nos marcadores
              if (
                repositionSessionRef.current?.step === 'select_position' ||
                isAddingNewHotspotRef.current
              ) {
                return;
              }

              // No modo Configuração: clicar em QUALQUER hotspot (portal ou info) seleciona para editar!
              if (viewModeRef.current === 'editor') {
                onSelectInfoHotspotRef.current(hs);
                return;
              }

              // No modo Preview: se for portal, viaja entre cômodos; se for info, abre modal
              if (hs.type === 'scene' && hs.targetSceneId) {
                onNavigateSceneRef.current(hs.targetSceneId);
              } else if (hs.type === 'info') {
                onSelectInfoHotspotRef.current(hs);
              }
            },
          };
        }),
      };
    });

    try {
      const viewer = pnlm.viewer(containerRef.current, {
        default: {
          firstScene: activeSceneId,
          sceneFadeDuration: 600,
          autoLoad: true,
          showControls: false,
          compass: false,
          mouseZoom: true,
          keyboardZoom: true,
        },
        scenes: pnlmScenes,
      });

      viewerRef.current = viewer;

      viewer.on('scenechange', (newSceneId: string) => {
        if (newSceneId !== activeSceneIdRef.current) {
          onNavigateSceneRef.current(newSceneId);
        }
      });
    } catch (err) {
      console.error('Erro ao inicializar Pannellum:', err);
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        viewerRef.current = null;
      }
    };
  }, [scenes, selectedHotspotId, repositionSession, viewMode]);

  // 2. Alternar Cena sem recriar o Canvas
  useEffect(() => {
    if (viewerRef.current && activeSceneId) {
      try {
        const currentScene = viewerRef.current.getScene();
        if (currentScene !== activeSceneId) {
          viewerRef.current.loadScene(activeSceneId);
        }
      } catch (err) {
        console.warn('Erro ao alternar cena no Pannellum:', err);
      }
    }
  }, [activeSceneId]);

  // 3. Captura do Clique na Imagem 360º para Inserção ou Reposicionamento (Passo 2)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pointerDownPos = { x: 0, y: 0 };
    let isDown = false;

    const handlePointerDown = (e: MouseEvent) => {
      isDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!isDown) return;
      isDown = false;

      const deltaX = Math.abs(e.clientX - pointerDownPos.x);
      const deltaY = Math.abs(e.clientY - pointerDownPos.y);

      // Apenas se o usuário não estava arrastando a visão da câmera (movimento menor que 7px)
      if (deltaX < 7 && deltaY < 7 && viewerRef.current) {
        // Se estiver no PASSO 2 de reposicionamento (aguardando novo clique na imagem para fixar)
        if (repositionSessionRef.current?.step === 'select_position') {
          e.stopPropagation();
          e.preventDefault();

          try {
            const coords = viewerRef.current.mouseEventToCoords(e);
            if (coords && coords.length === 2) {
              const pitch = Math.round(coords[0] * 10) / 10;
              const yaw = Math.round(coords[1] * 10) / 10;
              onSetNewCoordsForRepositionRef.current({ pitch, yaw });
            }
          } catch (err) {
            console.error('Erro ao converter clique para coordenadas de reposicionamento:', err);
          }
          return;
        }

        // Se estiver criando um NOVO hotspot
        if (isAddingNewHotspotRef.current) {
          e.stopPropagation();
          e.preventDefault();

          try {
            const coords = viewerRef.current.mouseEventToCoords(e);
            if (coords && coords.length === 2) {
              const pitch = Math.round(coords[0] * 10) / 10;
              const yaw = Math.round(coords[1] * 10) / 10;
              onPlaceNewHotspotCoordsRef.current({ pitch, yaw });
            }
          } catch (err) {
            console.error('Erro ao converter clique para novas coordenadas:', err);
          }
        }
      }
    };

    container.addEventListener('mousedown', handlePointerDown, true);
    container.addEventListener('mouseup', handlePointerUp, true);

    return () => {
      container.removeEventListener('mousedown', handlePointerDown, true);
      container.removeEventListener('mouseup', handlePointerUp, true);
    };
  }, []);

  const handleZoomIn = () => {
    if (viewerRef.current) {
      viewerRef.current.setHfov(viewerRef.current.getHfov() - 12);
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      viewerRef.current.setHfov(viewerRef.current.getHfov() + 12);
    }
  };

  const handleResetCamera = () => {
    if (viewerRef.current) {
      const activeScene = scenes.find((s) => s.id === activeSceneId);
      if (activeScene) {
        viewerRef.current.lookAt(
          activeScene.initialPitch || 0,
          activeScene.initialYaw || 0,
          activeScene.initialHfov || 100,
          800
        );
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isCrosshairActive =
    isAddingNewHotspot || repositionSession?.step === 'select_position';

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${
        isCrosshairActive ? 'cursor-crosshair' : ''
      }`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* BANNERS INSTRUCIONAIS DE EDIÇÃO DE POSIÇÃO E INSERÇÃO */}

      {/* 1. PASSO 1 DA EDIÇÃO: Aguardar clique num hotspot existente */}
      {repositionSession?.step === 'select_hotspot' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border-2 border-amber-300 pointer-events-auto">
          <Move className="w-5 h-5 text-slate-950 shrink-0 animate-bounce" />
          <div className="text-xs font-bold leading-tight">
            <span>Passo 1 de 2: Clique no hotspot existente que deseja editar</span>
            <span className="block font-medium text-[11px] text-slate-900/90 mt-0.5">
              Identifique e clique no marcador exibido na imagem 360º para selecioná-lo.
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelAction}
            className="ml-3 px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* 2. PASSO 2 DA EDIÇÃO: Aguardar novo clique na imagem para fixar nova posição */}
      {repositionSession?.step === 'select_position' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-sky-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border-2 border-sky-300 pointer-events-auto">
          <MapPin className="w-5 h-5 text-slate-950 shrink-0 animate-pulse" />
          <div className="text-xs font-bold leading-tight">
            <span>
              Passo 2 de 2: Clique em qualquer ponto da imagem 360º para fixar a nova posição
            </span>
            <span className="block font-medium text-[11px] text-slate-950/90 mt-0.5">
              Editando posição: &quot;{repositionSession.targetHotspotTitle}&quot;. Gire a câmera e clique onde desejar fixá-lo.
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelAction}
            className="ml-3 px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* 3. INSERÇÃO DE NOVO HOTSPOT */}
      {isAddingNewHotspot && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border-2 border-emerald-300 pointer-events-auto">
          <Crosshair className="w-5 h-5 text-slate-950 shrink-0" />
          <div className="text-xs font-bold leading-tight">
            <span>Clique diretamente no ponto desejado da imagem 360º</span>
            <span className="block font-medium text-[11px] text-slate-950/90 mt-0.5">
              Gire livremente o ambiente e clique uma vez para criar o novo marcador.
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelAction}
            className="ml-3 px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Controles Flutuantes de Câmera */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Aproximar Zoom"
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Afastar Zoom"
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="Centralizar Câmera"
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
