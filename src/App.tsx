/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';
import React, { useEffect, useState } from 'react';
import { ExportProgressModal } from './components/export/ExportProgressModal';
import { HotspotEditor } from './components/hotspots/HotspotEditor';
import { HotspotList } from './components/hotspots/HotspotList';
import { HotspotModal } from './components/hotspots/HotspotModal';
import { TopBar } from './components/layout/TopBar';
import { RoomNavigatorBottom } from './components/scenes/RoomNavigatorBottom';
import { SceneList } from './components/scenes/SceneList';
import { PannellumViewer } from './components/viewer/PannellumViewer';
import { createModernHouseDemoProject } from './services/demo/demoProject';
import { generateStandaloneHTML } from './services/export/htmlGenerator';
import { getAllProjectsFromDB, saveProjectToDB } from './services/storage/db';
import { Coords360, Hotspot, RepositionSession, Scene, TourProject, ViewMode } from './types/tour';

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
            setProject(loaded);
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

  // Salvar no IndexedDB sempre que o projeto for modificado
  const persistProject = async (updatedProject: TourProject) => {
    setProject(updatedProject);
    try {
      await saveProjectToDB(updatedProject);
    } catch (e) {
      console.warn('Erro ao salvar no IndexedDB:', e);
    }
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
        activeSceneName={activeScene.name}
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
      />

      {/* Área Central de Trabalho */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Painel Esquerdo: Gerenciador de Cômodos (Apenas no Modo Edição) */}
        {viewMode === 'editor' && (
          <SceneList
            scenes={project.scenes}
            activeSceneId={activeScene.id}
            initialSceneId={project.initialSceneId}
            onSelectScene={handleSelectScene}
            onAddScene={handleAddScene}
            onUpdateScene={handleUpdateScene}
            onDeleteScene={handleDeleteScene}
            onSetInitialScene={handleSetInitialScene}
            onResetToDemo={handleResetToDemo}
          />
        )}

        {/* Visualizador 360 Central (Pannellum WebGL Canvas) */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <PannellumViewer
            scenes={project.scenes}
            activeSceneId={activeScene.id}
            viewMode={viewMode}
            isAddingNewHotspot={isAddingNewHotspot}
            repositionSession={repositionSession}
            onSelectHotspotForReposition={handleSelectHotspotForReposition}
            onPlaceNewHotspotCoords={handlePlaceNewHotspotCoords}
            onSetNewCoordsForReposition={handleSetNewCoordsForReposition}
            onCancelAction={handleCancelAction}
            onSelectInfoHotspot={handleSelectInfoHotspot}
            onNavigateScene={handleNavigateScene}
            selectedHotspotId={selectedHotspot?.id}
          />

          {/* Navegador Rápido de Cômodos (No Modo Aluno) */}
          {viewMode === 'preview' && (
            <RoomNavigatorBottom
              scenes={project.scenes}
              activeSceneId={activeScene.id}
              onSelectScene={handleSelectScene}
            />
          )}
        </main>

        {/* Painel Direito: Inspetor / Hotspots (Apenas no Modo Edição) */}
        {viewMode === 'editor' && (
          <>
            {selectedHotspot ? (
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
            ) : (
              <HotspotList
                scene={activeScene}
                allScenes={project.scenes}
                selectedHotspotId={null}
                onSelectHotspot={(hs) => setSelectedHotspot(hs)}
                onStartPlacement={handleStartPlacement}
                onStartRepositionSession={handleStartRepositionSession}
                onDuplicateHotspot={handleDuplicateHotspot}
                onDeleteHotspot={handleDeleteHotspot}
                isBusy={isAddingNewHotspot || repositionSession !== null}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Educativo do Aluno ao Clicar em Hotspot de Informação */}
      <HotspotModal
        hotspot={activeInfoModalHotspot}
        onClose={() => setActiveInfoModalHotspot(null)}
      />

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
