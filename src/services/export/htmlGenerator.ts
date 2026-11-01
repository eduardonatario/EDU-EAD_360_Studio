/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pannellumCssRaw from 'pannellum/build/pannellum.css?raw';
import pannellumJsRaw from 'pannellum/build/pannellum.js?raw';
import { TourProject } from '../../types/tour';
import { optimizeProjectMedia } from '../image/compressor';

export async function generateStandaloneHTML(
  project: TourProject,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<string> {
  onProgress?.(0, 100, 'Iniciando otimização dos ambientes e imagens...');
  
  // 1. Otimizar todas as imagens
  const optimized = await optimizeProjectMedia(project, onProgress);

  onProgress?.(90, 100, 'Montando arquivo HTML autônomo offline...');

  // 2. Serializar dados do tour
  const serializedProject = JSON.stringify(optimized);

  const displayTitle = (project.title && !/^(tour\s*virtual\s*360[º°]?|crie\s*imers[aã]o.*)$/i.test(project.title.trim()))
    ? `${escapeHtml(project.title)} - Experiência 360° EAD`
    : 'Experiência 360° EAD';

  // 3. Montar o documento completo
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${displayTitle}</title>
  <meta name="description" content="${escapeHtml(project.description || 'Ambiente panorâmico imersivo 360°')}">
  
  <style>
    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #090d16;
      color: #f8fafc;
      user-select: none;
    }

    :root {
      --info-hotspot-color: ${project.settings?.infoColor || '#0ea5e9'};
      --scene-hotspot-color: ${project.settings?.sceneColor || '#10b981'};
      --arrow-color: ${project.settings?.arrowColor || '#ffffff'};
    }

    /* Pannellum Embedded CSS */
    ${pannellumCssRaw}

    /* Ocultar nome de cômodos / título dentro do visualizador 360 */
    .pnlm-panorama-info,
    .pnlm-title-box,
    .pnlm-author-box,
    .pnlm-compass {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* Custom Hotspots Styles */
    .pnlm-hotspot-base {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      z-index: 30 !important;
      pointer-events: auto !important;
    }

    .custom-hotspot-info {
      width: 44px !important;
      height: 44px !important;
      border-radius: 9999px !important;
      background: var(--info-hotspot-color, #0ea5e9) !important;
      border: 2.5px solid #ffffff !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(255, 255, 255, 0.25) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      z-index: 30 !important;
      pointer-events: auto !important;
      transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease !important;
    }
    .custom-hotspot-info::after {
      content: "i";
      font-family: serif;
      font-weight: 700;
      font-size: 22px;
      color: #ffffff;
      line-height: 1;
      pointer-events: none;
      display: block;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .custom-hotspot-info:hover {
      filter: brightness(1.15) !important;
      border-color: #f0f9ff !important;
      box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.35), 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    }
    .custom-hotspot-info:hover::after {
      transform: scale(1.22);
    }

    .custom-hotspot-scene {
      width: 48px !important;
      height: 48px !important;
      border-radius: 9999px !important;
      background: var(--scene-hotspot-color, #10b981) !important;
      border: 2.5px solid #ffffff !important;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 0 4px rgba(255, 255, 255, 0.25) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      z-index: 30 !important;
      pointer-events: auto !important;
      transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease !important;
    }
    .custom-hotspot-scene::after {
      content: "➔";
      font-size: 22px;
      color: var(--arrow-color, #ffffff) !important;
      line-height: 1;
      pointer-events: none;
      display: block;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Variações de direção de seta */
    .arrow-right::after { content: "➔" !important; }
    .arrow-left::after { content: "⬅" !important; }
    .arrow-up::after { content: "⬆" !important; }
    .arrow-down::after { content: "⬇" !important; }
    .arrow-up-right::after { content: "↗" !important; }
    .arrow-up-left::after { content: "↖" !important; }
    .arrow-compass::after { content: "🧭" !important; font-size: 20px !important; }
    .arrow-door::after { content: "🚪" !important; font-size: 20px !important; }

    /* Efeito de piscar / pulsar suavemente */
    .hotspot-pulse {
      animation: gentle-glow 2.2s infinite ease-in-out !important;
    }

    @keyframes gentle-glow {
      0% {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(255, 255, 255, 0.55);
        filter: brightness(1);
      }
      50% {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45), 0 0 0 9px rgba(255, 255, 255, 0);
        filter: brightness(1.2);
      }
      100% {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(255, 255, 255, 0);
        filter: brightness(1);
      }
    }

    .custom-hotspot-scene:hover {
      filter: brightness(1.15) !important;
      border-color: #ecfdf5 !important;
      box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.4), 0 8px 26px rgba(0, 0, 0, 0.55) !important;
    }
      background: #059669 !important;
      border-color: #ecfdf5 !important;
      box-shadow: 0 0 0 7px rgba(16, 185, 129, 0.5), 0 8px 26px rgba(16, 185, 129, 0.95) !important;
    }
    .custom-hotspot-scene:hover::after {
      transform: scale(1.22);
    }

    @keyframes pulse-ring-export {
      0% { box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6), 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6), 0 0 0 12px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6), 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    div.pnlm-tooltip span {
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      bottom: calc(100% + 12px) !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      margin: 0 !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      background-color: rgba(15, 23, 42, 0.95) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      padding: 6px 14px !important;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      z-index: 50 !important;
      transition: opacity 0.2s ease, visibility 0.2s ease !important;
    }

    div.pnlm-tooltip:hover span {
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Container */
    #panorama {
      width: 100vw;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    /* Header Bar */
    .tour-header {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    .tour-branding {
      pointer-events: auto;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 18px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      max-width: 480px;
    }
    .tour-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tour-meta {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    /* Controls Strip */
    .controls-strip {
      position: absolute;
      bottom: 24px;
      right: 24px;
      z-index: 50;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ctrl-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      font-size: 18px;
    }
    .ctrl-btn:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    /* Bottom Room Navigator */
    .room-navigator {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 6px 8px;
      display: flex;
      gap: 8px;
      box-shadow: 0 10px 36px rgba(0, 0, 0, 0.4);
      max-width: 90vw;
      overflow-x: auto;
    }
    .room-pill {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .room-pill:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.06);
    }
    .room-pill.active {
      color: #ffffff;
      background: #0284c7;
      box-shadow: 0 2px 10px rgba(2, 132, 199, 0.4);
    }

    /* Educational Info Modal */
    .edu-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .edu-modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }
    .edu-modal-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      width: 100%;
      max-width: 620px;
      max-height: 88vh;
      overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
      transform: scale(0.94);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .edu-modal-backdrop.open .edu-modal-card {
      transform: scale(1);
    }
    .edu-modal-header {
      padding: 20px 24px 14px 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .edu-modal-category {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #38bdf8;
      margin-bottom: 4px;
    }
    .edu-modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
    }
    .edu-close-btn {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: #94a3b8;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
      margin-left: 12px;
      flex-shrink: 0;
    }
    .edu-close-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
    .edu-modal-body {
      padding: 20px 24px 24px 24px;
    }
    .edu-modal-img {
      width: 100%;
      border-radius: 12px;
      margin-bottom: 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .edu-modal-text {
      font-size: 15px;
      line-height: 1.65;
      color: #cbd5e1;
      white-space: pre-wrap;
    }
    .edu-modal-footer {
      padding: 12px 24px 20px 24px;
      display: flex;
      justify-content: flex-end;
    }
    .edu-action-btn {
      background: #0284c7;
      border: none;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .edu-action-btn:hover {
      background: #0369a1;
    }
  </style>
</head>
<body>
  <!-- Container 360 -->
  <div id="panorama"></div>

  <!-- Header -->
  ${(() => {
    const isDefaultOrEmpty = !project.title ||
      /^(tour\s*virtual\s*360[º°]?|crie\s*imers[aã]o.*)$/i.test(project.title.trim());
    if (isDefaultOrEmpty && !project.author) return '';
    return `
  <header class="tour-header">
    <div class="tour-branding">
      ${!isDefaultOrEmpty ? `<h1 class="tour-title">${escapeHtml(project.title)}</h1>` : ''}
      ${project.author ? `
      <div class="tour-meta">
        <span>${escapeHtml(project.author)}</span>
        ${project.institution ? `<span>·</span><span>${escapeHtml(project.institution)}</span>` : ''}
      </div>` : ''}
    </div>
  </header>`;
  })()}

  <!-- Controles Flutuantes -->
  <aside class="controls-strip" style="${(project.settings?.showNavigationControls ?? true) ? '' : 'display: none !important;'}">
    <button class="ctrl-btn" id="btn-zoom-in" title="Aproximar zoom">+</button>
    <button class="ctrl-btn" id="btn-zoom-out" title="Afastar zoom">−</button>
    <button class="ctrl-btn" id="btn-fullscreen" title="Modo Tela Cheia">⛶</button>
  </aside>

  <!-- Navegador de Cômodos -->
  <nav class="room-navigator" id="room-nav" aria-label="Navegador de Ambientes" style="${(project.settings?.showBottomRoomBar ?? false) ? '' : 'display: none !important;'}"></nav>

  <!-- Modal Educativo de Informação -->
  <div class="edu-modal-backdrop" id="edu-modal">
    <div class="edu-modal-card" role="dialog" aria-modal="true">
      <div class="edu-modal-header">
        <div>
          <h2 class="edu-modal-title" id="modal-title">Título do Ponto de Estudo</h2>
        </div>
        <button class="edu-close-btn" id="modal-close-btn" aria-label="Fechar">✕</button>
      </div>
      <div class="edu-modal-body">
        <img id="modal-image" class="edu-modal-img" src="" alt="Ilustração Educacional" style="display: none;">
        <p class="edu-modal-text" id="modal-text"></p>
      </div>
      <div class="edu-modal-footer">
        <button class="edu-action-btn" id="modal-ok-btn">Entendido</button>
      </div>
    </div>
  </div>

  <!-- Pannellum Bundle Embutido Localmente -->
  <script>
    ${pannellumJsRaw}
  </script>

  <!-- Runtime Player do Tour -->
  <script>
    (function() {
      const tourData = ${serializedProject};
      let currentViewer = null;
      let currentSceneId = tourData.initialSceneId || (tourData.scenes[0] && tourData.scenes[0].id);

      // Elementos do DOM
      const modal = document.getElementById('edu-modal');
      const modalTitle = document.getElementById('modal-title');
      const modalImage = document.getElementById('modal-image');
      const modalText = document.getElementById('modal-text');
      const modalCloseBtn = document.getElementById('modal-close-btn');
      const modalOkBtn = document.getElementById('modal-ok-btn');
      const roomNav = document.getElementById('room-nav');
      const btnFullscreen = document.getElementById('btn-fullscreen');
      const btnZoomIn = document.getElementById('btn-zoom-in');
      const btnZoomOut = document.getElementById('btn-zoom-out');

      function openModal(hotspot) {
        modalTitle.textContent = hotspot.title;
        modalText.textContent = hotspot.description || '';
        if (hotspot.imageUrl) {
          modalImage.src = hotspot.imageUrl;
          modalImage.style.display = 'block';
        } else {
          modalImage.style.display = 'none';
        }
        modal.classList.add('open');
      }

      function closeModal() {
        modal.classList.remove('open');
      }

      modalCloseBtn.addEventListener('click', closeModal);
      modalOkBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
      });

      // Montar Cenas para o Pannellum
      const pnlmScenes = {};
      tourData.scenes.forEach(function(sc) {
        pnlmScenes[sc.id] = {
          type: 'equirectangular',
          panorama: sc.imageUrl,
          pitch: sc.initialPitch || 0,
          yaw: sc.initialYaw || 0,
          hfov: sc.initialHfov || 100,
          hotSpots: (sc.hotspots || []).map(function(hs) {
            var pulseClass = (tourData.settings && tourData.settings.pulseEffect !== false) ? 'hotspot-pulse' : '';
            if (hs.type === 'scene') {
              var arrowDir = hs.arrowDirection || (tourData.settings && tourData.settings.defaultArrowDirection) || 'right';
              return {
                pitch: hs.pitch,
                yaw: hs.yaw,
                type: 'scene',
                text: hs.title,
                sceneId: hs.targetSceneId,
                targetPitch: hs.targetPitch || 0,
                targetYaw: hs.targetYaw || 0,
                cssClass: ('custom-hotspot-scene arrow-' + arrowDir + ' ' + pulseClass).trim()
              };
            } else {
              return {
                pitch: hs.pitch,
                yaw: hs.yaw,
                type: 'info',
                text: hs.title,
                cssClass: ('custom-hotspot-info ' + pulseClass).trim(),
                clickHandlerFunc: function() {
                  openModal(hs);
                }
              };
            }
          })
        };
      });

      // Inicializar Pannellum
      currentViewer = pannellum.viewer('panorama', {
        default: {
          firstScene: currentSceneId,
          sceneFadeDuration: 800,
          autoLoad: true,
          showControls: false,
          compass: false,
          mouseZoom: true,
          keyboardZoom: true
        },
        scenes: pnlmScenes
      });

      currentViewer.on('scenechange', function(sceneId) {
        currentSceneId = sceneId;
        updateRoomNav();
      });

      // Gerar botões de navegação dos cômodos
      function renderRoomNav() {
        roomNav.innerHTML = '';
        const showHotspotCount = Boolean(tourData.settings && tourData.settings.showRoomBarHotspotCount);
        tourData.scenes.forEach(function(sc) {
          const btn = document.createElement('button');
          btn.className = 'room-pill' + (sc.id === currentSceneId ? ' active' : '');
          const countBadge = (showHotspotCount && sc.hotspots) ? ' (' + sc.hotspots.length + ')' : '';
          btn.textContent = sc.name + countBadge;
          btn.addEventListener('click', function() {
            if (sc.id !== currentSceneId) {
              currentViewer.loadScene(sc.id);
            }
          });
          roomNav.appendChild(btn);
        });
      }

      function updateRoomNav() {
        const buttons = roomNav.querySelectorAll('.room-pill');
        tourData.scenes.forEach(function(sc, index) {
          if (buttons[index]) {
            if (sc.id === currentSceneId) {
              buttons[index].classList.add('active');
            } else {
              buttons[index].classList.remove('active');
            }
          }
        });
      }

      renderRoomNav();

      // Controles
      btnZoomIn.addEventListener('click', function() {
        currentViewer.setHfov(currentViewer.getHfov() - 12);
      });
      btnZoomOut.addEventListener('click', function() {
        currentViewer.setHfov(currentViewer.getHfov() + 12);
      });
      btnFullscreen.addEventListener('click', function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function() {});
        } else {
          document.exitFullscreen().catch(function() {});
        }
      });
    })();
  </script>
</body>
</html>`;

  onProgress?.(100, 100, 'Experiência 360° independente gerada com sucesso!');
  return htmlContent;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
