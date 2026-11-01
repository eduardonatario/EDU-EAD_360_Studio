/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExportProgressModal } from './components/export/ExportProgressModal';
import { HotspotEditor } from './components/hotspots/HotspotEditor';
import { HotspotModal } from './components/hotspots/HotspotModal';
import { TopBar } from './components/layout/TopBar';
import { RoomNavigatorBottom } from './components/scenes/RoomNavigatorBottom';
import { SceneList } from './components/scenes/SceneList';
import { PannellumViewer } from './components/viewer/PannellumViewer';
import { createModernHouseDemoProject } from './services/demo/demoProject';
import { generateStandaloneHTML } from './services/export/htmlGenerator';
import { getAllProjectsFromDB, saveProjectToDB } from './services/storage/db';
import {
  Coords360,
  DEFAULT_HOTSPOT_SETTINGS,
  GlobalHotspotSettings,
  Hotspot,
  RepositionSession,
  Scene,
  TourProject,
  ViewMode,
} from './types/tour';

export default function App() {
  const [project, setProject] = useState<TourProject | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ead360_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  // Efeito de aplicação e persistência do tema claro/escuro
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ead360_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Estado de Hotspots
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [activeInfoModalHotspot, setActiveInfoModalHotspot] = useState<Hotspot | null>(null);
  const [isAddingNewHotspot, setIsAddingNewHotspot] = useState(false);
  const [repositionSession, setRepositionSession] = useState<RepositionSession | null>(null);

  // Estado de Exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [isExportCompleted, setIsExportCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState('');

  // 1. Inicializar Projeto (Carregar do IndexedDB ou inicializar a Casa Moderna com fotos reais)
  useEffect(() => {
    async function init() {
      try {
        const savedProjects = await getAllProjectsFromDB();
        if (savedProjects.length > 0) {
          const loaded = savedProjects[0];
          // Se for o projeto da versão 1 procedural, atualizar imediatamente para a v2 com fotos 360 reais
          if (loaded.id === 'projeto-casa-moderna-ead-360') {
            const demo = createModernHouseDemoProject();
            await saveProjectToDB(demo);
            setProject(demo);
            setActiveSceneId(demo.initialSceneId);
          } else {
            const loadedWithSettings: TourProject = {
              ...loaded,
              settings: loaded.settings || { ...DEFAULT_HOTSPOT_SETTINGS },
            };
            setProject(loadedWithSettings);
            setActiveSceneId(loaded.initialSceneId || (loaded.scenes[0] && loaded.scenes[0].id) || '');
          }
        } else {
          // Inicializar projeto demonstrativo da Casa Moderna com as fotos 360 reais
          const demo = createModernHouseDemoProject();
          await saveProjectToDB(demo);
          setProject(demo);
          setActiveSceneId(demo.initialSceneId);
        }
      } catch (err) {
        console.warn('Fallback para projeto em memória:', err);
        const demo = createModernHouseDemoProject();
        setProject(demo);
        setActiveSceneId(demo.initialSceneId);
      }
    }
    init();
  }, []);

  const handleResetToDemo = async () => {
    const demo = createModernHouseDemoProject();
    await saveProjectToDB(demo);
    setProject(demo);
    setActiveSceneId(demo.initialSceneId);
    setSelectedHotspot(null);
    setIsAddingNewHotspot(false);
    setRepositionSession(null);
  };

  // Estado e Ação para "Criar Novo Tour" em branco
  const [isNewTourConfirmOpen, setIsNewTourConfirmOpen] = useState(false);

  const handleConfirmNewTour = async () => {
    const emptyProject: TourProject = {
      id: `tour-${Date.now()}`,
      title: '',
      author: '',
      institution: '',
      description: '',
      initialSceneId: '',
      scenes: [],
      settings: { ...DEFAULT_HOTSPOT_SETTINGS },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await persistProject(emptyProject);
    setActiveSceneId('');
    setSelectedHotspot(null);
    setIsAddingNewHotspot(false);
    setRepositionSession(null);
    setIsNewTourConfirmOpen(false);
  };

  // Salvar no IndexedDB sempre que o projeto for modificado
  const persistProject = async (updatedProject: TourProject) => {
    setProject(updatedProject);
    try {
      await saveProjectToDB(updatedProject);
    } catch (e) {
      console.warn('Erro ao salvar no IndexedDB:', e);
    }
  };

  const handleUpdateSettings = (newSettings: GlobalHotspotSettings) => {
    if (!project) return;
    const updated: TourProject = {
      ...project,
      settings: newSettings,
    };
    persistProject(updated);
  };

  if (!project) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando ambientes virtuais 360º...</span>
        </div>
      </div>
    );
  }

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];

  // Alternar Cena Ativa
  const handleSelectScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setSelectedHotspot(null);
    setIsAddingNewHotspot(false);
    setRepositionSession(null);
  };

  // Gerenciamento de Cenas
  const handleAddScene = (newScene: Scene) => {
    const updated: TourProject = {
      ...project,
      scenes: [...project.scenes, newScene],
    };
    persistProject(updated);
    setActiveSceneId(newScene.id);
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    const updated: TourProject = {
      ...project,
      scenes: project.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s)),
    };
    persistProject(updated);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) return;
    const remainingScenes = project.scenes.filter((s) => s.id !== sceneId);
    const newInitialId =
      project.initialSceneId === sceneId ? remainingScenes[0].id : project.initialSceneId;

    const updated: TourProject = {
      ...project,
      initialSceneId: newInitialId,
      scenes: remainingScenes.map((s) => ({
        ...s,
        // Remover hotspots de navegação apontando para o cômodo deletado
        hotspots: s.hotspots.filter((h) => h.targetSceneId !== sceneId),
      })),
    };
    persistProject(updated);
    if (activeSceneId === sceneId) {
      setActiveSceneId(remainingScenes[0].id);
    }
    setSelectedHotspot(null);
  };

  const handleSetInitialScene = (sceneId: string) => {
    const updated: TourProject = {
      ...project,
      initialSceneId: sceneId,
    };
    persistProject(updated);
  };

  // Gerenciamento de Inserção e Reposicionamento de Hotspots
  const handleStartPlacement = () => {
    setIsAddingNewHotspot(true);
    setRepositionSession(null);
    setSelectedHotspot(null);
  };

  const handleStartRepositionSession = (targetHotspot?: Hotspot) => {
    setIsAddingNewHotspot(false);
    setSelectedHotspot(null);
    setRepositionSession({
      step: 'select_hotspot',
      targetHotspotId: targetHotspot?.id,
      targetHotspotTitle: targetHotspot?.title,
    });
  };

  const handleSelectHotspotForReposition = (hotspot: Hotspot) => {
    setRepositionSession({
      step: 'select_position',
      targetHotspotId: hotspot.id,
      targetHotspotTitle: hotspot.title,
    });
  };

  const handleSetNewCoordsForReposition = (coords: Coords360) => {
    if (!repositionSession?.targetHotspotId) return;

    const targetId = repositionSession.targetHotspotId;
    const updatedScenes = project.scenes.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          hotspots: s.hotspots.map((h) =>
            h.id === targetId ? { ...h, pitch: coords.pitch, yaw: coords.yaw } : h
          ),
        };
      }
      return s;
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);

    const updatedHotspot = updatedScenes
      .find((s) => s.id === activeScene.id)
      ?.hotspots.find((h) => h.id === targetId);

    if (updatedHotspot) {
      setSelectedHotspot(updatedHotspot);
    }

    setRepositionSession(null);
  };

  const handleUpdateHotspotCoords = (sceneId: string, hotspotId: string, coords: Coords360) => {
    let updatedHotspot: Hotspot | null = null;
    const updatedScenes = project.scenes.map((s) => {
      if (s.id !== sceneId) return s;
      const updatedHotspots = s.hotspots.map((h) => {
        if (h.id !== hotspotId) return h;
        const upd = { ...h, pitch: coords.pitch, yaw: coords.yaw };
        updatedHotspot = upd;
        return upd;
      });
      return { ...s, hotspots: updatedHotspots };
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);
    if (updatedHotspot) {
      setSelectedHotspot(updatedHotspot);
    }
  };

  const handlePlaceNewHotspotCoords = (coords: Coords360) => {
    const newHotspot: Hotspot = {
      id: `hs-${Date.now()}`,
      type: 'info',
      pitch: coords.pitch,
      yaw: coords.yaw,
      title: 'Novo Ponto Informativo',
      description: 'Insira aqui as diretrizes educacionais ou detalhes do cômodo.',
      category: 'Arquitetura',
    };

    const updatedScenes = project.scenes.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          hotspots: [...s.hotspots, newHotspot],
        };
      }
      return s;
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);
    setSelectedHotspot(newHotspot);
    setIsAddingNewHotspot(false);
  };

  const handleCancelAction = () => {
    setIsAddingNewHotspot(false);
    setRepositionSession(null);
  };

  const handleSaveHotspot = (updatedHotspot: Hotspot) => {
    const updatedScenes = project.scenes.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          hotspots: s.hotspots.map((h) => (h.id === updatedHotspot.id ? updatedHotspot : h)),
        };
      }
      return s;
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);
    setSelectedHotspot(updatedHotspot);
  };

  const handleDuplicateHotspot = (hotspot: Hotspot) => {
    const duplicated: Hotspot = {
      ...hotspot,
      id: `hs-${Date.now()}`,
      title: `${hotspot.title} (Cópia)`,
      yaw: (hotspot.yaw + 15) % 180,
    };

    const updatedScenes = project.scenes.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          hotspots: [...s.hotspots, duplicated],
        };
      }
      return s;
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);
    setSelectedHotspot(duplicated);
  };

  const handleDeleteHotspot = (hotspotId: string) => {
    const updatedScenes = project.scenes.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          hotspots: s.hotspots.filter((h) => h.id !== hotspotId),
        };
      }
      return s;
    });

    const updatedProject: TourProject = {
      ...project,
      scenes: updatedScenes,
    };

    persistProject(updatedProject);
    if (selectedHotspot?.id === hotspotId) {
      setSelectedHotspot(null);
    }
  };

  // Clique em Hotspot no Visualizador 360
  const handleSelectInfoHotspot = (hotspot: Hotspot) => {
    if (viewMode === 'preview') {
      if (hotspot.type === 'scene' && hotspot.targetSceneId) {
        handleNavigateScene(hotspot.targetSceneId);
      } else {
        setActiveInfoModalHotspot(hotspot);
      }
    } else {
      setSelectedHotspot(hotspot);
    }
  };

  // Navegar entre Cômodos pelo Portal
  const handleNavigateScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setSelectedHotspot(null);
  };

  // Exportação Standalone HTML
  const handleExportHTML = async () => {
    setIsExportModalOpen(true);
    setIsExportCompleted(false);
    setExportProgress(5);
    setExportMessage('Iniciando empacotamento da experiência EAD...');

    try {
      const htmlContent = await generateStandaloneHTML(project, (current, total, msg) => {
        const percent = Math.round((current / total) * 100);
        setExportProgress(percent);
        setExportMessage(msg);
      });

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeName = project.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_');
      const filename = `ead360_${safeName || 'experiencia'}.html`;

      setDownloadUrl(url);
      setExportFileName(filename);
      setIsExportCompleted(true);
      setExportProgress(100);
      setExportMessage('Arquivo gerado e pronto para uso offline!');

      // Efeito de confete ao concluir exportação
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Disparar download automático
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro na exportação:', err);
      setExportMessage('Ocorreu um erro ao gerar o arquivo.');
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans transition-colors">
      {/* Top Bar seguindo contrato de 3 zonas */}
      <TopBar
        project={project}
        activeSceneName={activeScene?.name || 'Nenhum cômodo'}
        viewMode={viewMode}
        onToggleViewMode={(mode) => {
          setViewMode(mode);
          setSelectedHotspot(null);
          setIsAddingNewHotspot(false);
          setRepositionSession(null);
        }}
        onExportHTML={handleExportHTML}
        isExporting={isExportModalOpen && !isExportCompleted}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNewTour={() => setIsNewTourConfirmOpen(true)}
      />

      {/* Área Central de Trabalho */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Painel Esquerdo: Opções Gerais e Ambientes Virtuais com Hotspots Aninhados */}
        {viewMode === 'editor' && (
          <SceneList
            scenes={project.scenes}
            activeSceneId={activeScene?.id || ''}
            initialSceneId={project.initialSceneId}
            settings={project.settings || DEFAULT_HOTSPOT_SETTINGS}
            onUpdateSettings={handleUpdateSettings}
            selectedHotspotId={selectedHotspot?.id}
            onSelectScene={handleSelectScene}
            onAddScene={handleAddScene}
            onUpdateScene={handleUpdateScene}
            onDeleteScene={handleDeleteScene}
            onSetInitialScene={handleSetInitialScene}
            onResetToDemo={handleResetToDemo}
            onSelectHotspot={(hs) => setSelectedHotspot(hs)}
            onStartPlacement={handleStartPlacement}
            onStartRepositionSession={handleStartRepositionSession}
            onDuplicateHotspot={handleDuplicateHotspot}
            onDeleteHotspot={handleDeleteHotspot}
            isBusy={isAddingNewHotspot || repositionSession !== null}
          />
        )}

        {/* Visualizador 360 Central (Pannellum WebGL Canvas) */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <PannellumViewer
            scenes={project.scenes}
            activeSceneId={activeScene?.id || ''}
            viewMode={viewMode}
            settings={project.settings || DEFAULT_HOTSPOT_SETTINGS}
            isAddingNewHotspot={isAddingNewHotspot}
            repositionSession={repositionSession}
            onSelectHotspotForReposition={handleSelectHotspotForReposition}
            onPlaceNewHotspotCoords={handlePlaceNewHotspotCoords}
            onSetNewCoordsForReposition={handleSetNewCoordsForReposition}
            onCancelAction={handleCancelAction}
            onSelectInfoHotspot={handleSelectInfoHotspot}
            onNavigateScene={handleNavigateScene}
            onUpdateHotspotCoords={handleUpdateHotspotCoords}
            selectedHotspotId={selectedHotspot?.id}
          />

          {/* Navegador Rápido de Cômodos na Parte Inferior Central */}
          {(project.settings?.showBottomRoomBar ?? false) && project.scenes.length > 0 && (
            <RoomNavigatorBottom
              scenes={project.scenes}
              activeSceneId={activeScene?.id || ''}
              onSelectScene={handleSelectScene}
              showHotspotCount={project.settings?.showRoomBarHotspotCount ?? false}
            />
          )}
        </main>

        {/* Painel Direito: Inspetor / Editor de Hotspot quando selecionado */}
        {viewMode === 'editor' && selectedHotspot && activeScene && (
          <HotspotEditor
            hotspot={selectedHotspot}
            currentSceneId={activeScene.id}
            allScenes={project.scenes}
            onSave={handleSaveHotspot}
            onDuplicate={handleDuplicateHotspot}
            onDelete={handleDeleteHotspot}
            onClose={() => setSelectedHotspot(null)}
            onStartReposition={() => handleStartRepositionSession(selectedHotspot)}
            onNavigateToScene={handleNavigateScene}
          />
        )}
      </div>

      {/* Modal Educativo do Aluno ao Clicar em Hotspot de Informação */}
      <HotspotModal
        hotspot={activeInfoModalHotspot}
        onClose={() => setActiveInfoModalHotspot(null)}
      />

      {/* Modal de Confirmação para Criar Novo Tour */}
      {isNewTourConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in select-none">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Criar Novo Tour
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Iniciar projeto em branco
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza de que deseja iniciar um novo tour? Os ambientes virtuais de exemplo atuais serão apagados para que você possa criar novos ambientes do zero sem precisar editar este modelo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewTourConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmNewTour}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm cursor-pointer transition-colors"
              >
                Sim, Criar Novo Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Progresso da Exportação HTML */}
      <ExportProgressModal
        isOpen={isExportModalOpen}
        progress={exportProgress}
        message={exportMessage}
        isCompleted={isExportCompleted}
        downloadUrl={downloadUrl}
        fileName={exportFileName}
        onClose={() => {
          setIsExportModalOpen(false);
          if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            setDownloadUrl(null);
          }
        }}
      />
    </div>
  );
}
