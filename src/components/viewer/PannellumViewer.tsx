/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'pannellum/build/pannellum.css';
import 'pannellum/build/pannellum.js';

import { Crosshair, MapPin, Maximize, Minimize, Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Coords360, GlobalHotspotSettings, Hotspot, RepositionSession, Scene, ViewMode } from '../../types/tour';

interface PannellumViewerProps {
  scenes: Scene[];
  activeSceneId: string;
  viewMode: ViewMode;
  settings?: GlobalHotspotSettings;
  isAddingNewHotspot: boolean;
  repositionSession: RepositionSession | null;
  onSelectHotspotForReposition: (hotspot: Hotspot) => void;
  onPlaceNewHotspotCoords: (coords: Coords360) => void;
  onSetNewCoordsForReposition: (coords: Coords360) => void;
  onCancelAction: () => void;
  onSelectInfoHotspot: (hotspot: Hotspot) => void;
  onNavigateScene: (sceneId: string) => void;
  onUpdateHotspotCoords?: (sceneId: string, hotspotId: string, coords: Coords360) => void;
  selectedHotspotId?: string | null;
}

function toValidCoords(rawPitch: number, rawYaw: number): Coords360 {
  // Clamping vertical pitch strictly to valid range [-90, 90]
  const clampedPitch = Math.max(-90, Math.min(90, Number(rawPitch) || 0));

  // Normalizing horizontal yaw strictly to valid range [-180, 180]
  let normalizedYaw = Number(rawYaw) || 0;
  while (normalizedYaw > 180) normalizedYaw -= 360;
  while (normalizedYaw < -180) normalizedYaw += 360;

  // Arredondar para valores inteiros ou com 0,5 como décimos (ex: -10, -9.5, 0, 0.5, 12, 12.5)
  const pitch = Math.round(clampedPitch * 2) / 2;
  const yaw = Math.round(normalizedYaw * 2) / 2;

  return { pitch, yaw };
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({
  scenes,
  activeSceneId,
  viewMode,
  settings,
  isAddingNewHotspot,
  repositionSession,
  onSelectHotspotForReposition,
  onPlaceNewHotspotCoords,
  onSetNewCoordsForReposition,
  onCancelAction,
  onSelectInfoHotspot,
  onNavigateScene,
  onUpdateHotspotCoords,
  selectedHotspotId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDragInfo, setActiveDragInfo] = useState<{
    hotspotTitle: string;
    isPortal: boolean;
  } | null>(null);

  const dragSessionRef = useRef<{
    hotspotId: string;
    sceneId: string;
    startX: number;
    startY: number;
    hasMoved: boolean;
    lastCoords: Coords360 | null;
  } | null>(null);

  // Manter referências atualizadas aos callbacks
  const onNavigateSceneRef = useRef(onNavigateScene);
  onNavigateSceneRef.current = onNavigateScene;

  const onUpdateHotspotCoordsRef = useRef(onUpdateHotspotCoords);
  onUpdateHotspotCoordsRef.current = onUpdateHotspotCoords;

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

  const handleStartHotspotDrag = (hs: Hotspot, startEvent: MouseEvent) => {
    // Selecionar o hotspot imediatamente ao iniciar o clique/arrasto para abrir o painel com as opções
    onSelectInfoHotspotRef.current(hs);

    dragSessionRef.current = {
      hotspotId: hs.id,
      sceneId: activeSceneIdRef.current,
      startX: startEvent.clientX,
      startY: startEvent.clientY,
      hasMoved: false,
      lastCoords: { pitch: hs.pitch, yaw: hs.yaw },
    };

    setActiveDragInfo({
      hotspotTitle: hs.title || (hs.type === 'scene' ? 'Seta para novo cômodo' : 'Hotspot informativo'),
      isPortal: hs.type === 'scene',
    });

    document.body.style.cursor = 'grabbing';

    const handleMouseMove = (e: MouseEvent) => {
      const session = dragSessionRef.current;
      if (!session || !viewerRef.current) return;

      const delta = Math.hypot(e.clientX - session.startX, e.clientY - session.startY);
      if (delta > 4) {
        session.hasMoved = true;
      }

      if (session.hasMoved) {
        try {
          const coords = viewerRef.current.mouseEventToCoords(e);
          if (coords && coords.length === 2) {
            const { pitch, yaw } = toValidCoords(coords[0], coords[1]);
            session.lastCoords = { pitch, yaw };

            // Atualiza em tempo real as coordenadas do hotspot na instância ativa do Pannellum
            const config = viewerRef.current.getConfig();
            const pnlmHs = config?.hotSpots?.find((h: any) => h.id === session.hotspotId);
            if (pnlmHs) {
              pnlmHs.pitch = pitch;
              pnlmHs.yaw = yaw;
              viewerRef.current.lookAt(
                viewerRef.current.getPitch(),
                viewerRef.current.getYaw(),
                viewerRef.current.getHfov(),
                0
              );
            }
          }
        } catch {
          // ignore
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      document.body.style.cursor = '';
      setActiveDragInfo(null);

      const session = dragSessionRef.current;
      dragSessionRef.current = null;

      if (!session) return;

      if (session.hasMoved && session.lastCoords) {
        // Envia as coordenadas diretamente para salvar e preencher os campos de Orientação Espacial
        onUpdateHotspotCoordsRef.current?.(
          session.sceneId,
          session.hotspotId,
          session.lastCoords
        );
        onSelectInfoHotspotRef.current({
          ...hs,
          pitch: session.lastCoords.pitch,
          yaw: session.lastCoords.yaw,
        });
      } else {
        onSelectInfoHotspotRef.current(hs);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
  };

  // Interceptar erros de corrida assíncrona do FileReader interno do Pannellum ao destruir/trocar de cena
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes("Cannot set properties of undefined (setting 'src')") ||
          event.message.includes('FileReader'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn('Pannellum FileReader async cleanup tratado com segurança.');
      }
    };

    window.addEventListener('error', handleGlobalError, true);
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

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

    if (scenes.length === 0) {
      return;
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
        hfov: settings?.initialWideFov ? 120 : (sc.initialHfov || 100),
        maxHfov: settings?.initialWideFov ? 130 : 120,
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
          const arrowClass =
            hs.type === 'scene'
              ? `arrow-${hs.arrowDirection || settings?.defaultArrowDirection || 'right'}`
              : '';
          const pulseClass = (settings?.pulseEffect ?? true) ? 'hotspot-pulse' : '';

          return {
            id: hs.id,
            pitch: hs.pitch,
            yaw: hs.yaw,
            type: hs.type,
            text: hs.title,
            // Importante: No modo Configuração, sceneId DEVE ser undefined para impedir que o Pannellum mude de cômodo ao clicar
            sceneId: viewMode === 'preview' && hs.type === 'scene' ? hs.targetSceneId : undefined,
            targetPitch: hs.targetPitch || 0,
            targetYaw: hs.targetYaw || 0,
            cssClass: `${baseClass} ${stateClass} ${arrowClass} ${pulseClass}`.trim(),
            createTooltipFunc: (hotSpotDiv: HTMLElement) => {
              hotSpotDiv.setAttribute('data-hotspot-id', hs.id);
              if (hs.title) {
                const span = document.createElement('span');
                span.textContent = hs.title;
                hotSpotDiv.classList.add('pnlm-tooltip');
                hotSpotDiv.appendChild(span);
              }

              // Arrastar pontos para novos lugares diretamente no modo Configuração
              hotSpotDiv.addEventListener('mousedown', (e: MouseEvent) => {
                if (e.button !== 0) return;
                if (viewModeRef.current !== 'editor') return;
                if (repositionSessionRef.current !== null || isAddingNewHotspotRef.current) return;

                e.stopPropagation();
                e.preventDefault();
                handleStartHotspotDrag(hs, e);
              });

              // No modo Configuração: clicar na div seleciona para editar e NUNCA muda de cômodo
              hotSpotDiv.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                hotSpotDiv.classList.toggle('pnlm-tooltip-active');
                if (viewModeRef.current === 'editor') {
                  onSelectInfoHotspotRef.current(hs);
                } else {
                  if (hs.type === 'scene' && hs.targetSceneId) {
                    onNavigateSceneRef.current(hs.targetSceneId);
                  } else {
                    onSelectInfoHotspotRef.current(hs);
                  }
                }
              });
            },
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

              // No modo Configuração: clicar em QUALQUER seta ou hotspot apenas seleciona para editar/mover!
              // NUNCA muda de cômodo no modo edição.
              if (viewModeRef.current === 'editor') {
                onSelectInfoHotspotRef.current(hs);
                return;
              }

              // Apenas no modo Preview as setas navegam entre cômodos
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
          sceneFadeDuration: 400,
          autoLoad: true,
          showControls: false,
          compass: false,
          mouseZoom: true,
          keyboardZoom: true,
          hfov: settings?.initialWideFov ? 120 : 100,
          maxHfov: settings?.initialWideFov ? 130 : 120,
        },
        scenes: pnlmScenes,
      });

      viewerRef.current = viewer;

      viewer.on('scenechange', (newSceneId: string) => {
        if (newSceneId !== activeSceneIdRef.current) {
          onNavigateSceneRef.current(newSceneId);
        }
      });

      // Remover texto e caixa "Pannellum 2.5.7" do botão direito
      const aboutEl = containerRef.current.querySelector('.pnlm-about-msg');
      if (aboutEl) {
        aboutEl.remove();
      }
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
  }, [scenes, settings]);

  // Atualizar classes visuais de seleção/reposicionamento diretamente no DOM sem recriar o visualizador 3D
  useEffect(() => {
    if (!containerRef.current) return;
    const hotspotDivs = containerRef.current.querySelectorAll<HTMLElement>('[data-hotspot-id]');
    hotspotDivs.forEach((div) => {
      const id = div.getAttribute('data-hotspot-id');
      const isSelected = id === selectedHotspotId;
      const isTargetBeingRepositioned = repositionSession?.targetHotspotId === id;
      const isRepositionCandidate = repositionSession?.step === 'select_hotspot';

      div.classList.toggle('ring-4', isSelected);
      div.classList.toggle('ring-amber-400', isSelected);
      div.classList.toggle('ring-offset-2', isSelected);
      div.classList.toggle('hotspot-reposition-selected', isTargetBeingRepositioned);
      div.classList.toggle('hotspot-reposition-candidate', isRepositionCandidate && !isTargetBeingRepositioned);
    });
  }, [selectedHotspotId, repositionSession]);

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
              const { pitch, yaw } = toValidCoords(coords[0], coords[1]);
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
              const { pitch, yaw } = toValidCoords(coords[0], coords[1]);
              onPlaceNewHotspotCoordsRef.current({ pitch, yaw });
            }
          } catch (err) {
            console.error('Erro ao converter clique para novas coordenadas:', err);
          }
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener('mousedown', handlePointerDown, true);
    container.addEventListener('mouseup', handlePointerUp, true);
    container.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      container.removeEventListener('mousedown', handlePointerDown, true);
      container.removeEventListener('mouseup', handlePointerUp, true);
      container.removeEventListener('contextmenu', handleContextMenu, true);
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
          settings?.initialWideFov ? 120 : (activeScene.initialHfov || 100),
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

  if (scenes.length === 0) {
    return (
      <div key="empty-scenes-container" className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-300 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 mb-4 shadow-xl">
          <MapPin className="w-8 h-8 opacity-90" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1.5">
          Nenhum ambiente virtual cadastrado
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
          Os cômodos de exemplo foram removidos. Crie seu primeiro cômodo no menu à esquerda clicando em &quot;Novo Cômodo&quot; para fazer upload de foto 360° ou colar a URL da imagem.
        </p>
      </div>
    );
  }

  return (
    <div
      key="active-panorama-container"
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${
        isCrosshairActive ? 'cursor-crosshair' : ''
      }`}
      style={
        {
          '--info-hotspot-color': settings?.infoColor || '#0ea5e9',
          '--scene-hotspot-color': settings?.sceneColor || '#10b981',
          '--arrow-color': settings?.arrowColor || '#ffffff',
        } as React.CSSProperties
      }
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

      {/* 4. BANNER DE ARRASTAR HOTSPOT EM TEMPO REAL */}
      {activeDragInfo && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 border border-emerald-400 pointer-events-none animate-in fade-in">
          <Move className="w-4 h-4 text-white animate-pulse" />
          <div className="text-xs font-bold leading-tight">
            <span>Arrastando: &quot;{activeDragInfo.hotspotTitle}&quot;</span>
            <span className="block font-medium text-[10px] text-emerald-100 mt-0.5">
              Mova o cursor para o novo local desejado e solte o mouse para fixar a posição.
            </span>
          </div>
        </div>
      )}

      {/* 5. CONTROLES FLUTUANTES DE CÂMERA (ZOOM, CENTRALIZAR, TELA CHEIA) */}
      {(settings?.showNavigationControls ?? true) && (
        <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2.5 pointer-events-auto animate-in fade-in">
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
      )}
    </div>
  );
};
