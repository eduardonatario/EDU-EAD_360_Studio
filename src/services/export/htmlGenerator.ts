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

  const viewportFormat = project.settings?.viewportFormat || 'free';
  const customWidth = Math.max(320, project.settings?.customWidth || 1920);
  const customHeight = Math.max(240, project.settings?.customHeight || 1080);
  const isDelimitedBox = viewportFormat === '16:9' || viewportFormat === '9:16' || viewportFormat === 'custom';

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
      ${isDelimitedBox ? `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      background: #06090e;
      ` : ''}
    }

    /* Delimited Tour Viewport Box */
    .tour-viewport-box {
      position: relative;
      overflow: hidden;
      background: #000000;
      ${isDelimitedBox ? `
      border-radius: 14px;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 70px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.6);
      transition: all 0.3s ease;
      ${viewportFormat === '16:9' ? `
      aspect-ratio: 16 / 9;
      width: 100%;
      height: auto;
      max-width: min(calc(100vw - 32px), calc((100vh - 32px) * (16 / 9)), 1920px);
      max-height: min(calc(100vh - 32px), calc((100vw - 32px) * (9 / 16)), 1080px);
      ` : viewportFormat === '9:16' ? `
      aspect-ratio: 9 / 16;
      height: 100%;
      width: auto;
      max-height: min(calc(100vh - 32px), 1920px);
      max-width: min(calc(100vw - 32px), calc((100vh - 32px) * (9 / 16)), 1080px);
      ` : `
      aspect-ratio: ${customWidth} / ${customHeight};
      width: 100%;
      height: auto;
      max-width: min(calc(100vw - 32px), ${customWidth}px, calc((100vh - 32px) * (${customWidth} / ${customHeight})));
      max-height: min(calc(100vh - 32px), ${customHeight}px, calc((100vw - 32px) * (${customHeight} / ${customWidth})));
      `}
      ` : `
      width: 100%;
      height: 100%;
      `}
    }

    .tour-viewport-box:fullscreen,
    .tour-viewport-box:-webkit-full-screen {
      max-width: 100vw !important;
      max-height: 100vh !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }

    :root {
      --info-hotspot-color: ${project.settings?.infoColor || '#0ea5e9'};
      --scene-hotspot-color: ${project.settings?.sceneColor || '#10b981'};
      --arrow-color: ${project.settings?.arrowColor || '#ffffff'};
    }

    /* Pannellum Embedded CSS */
    ${pannellumCssRaw}

    /* Ocultar nome de cômodos / título dentro do visualizador 360 e mensagem Pannellum 2.5.7 do botão direito */
    .pnlm-panorama-info,
    .pnlm-title-box,
    .pnlm-author-box,
    .pnlm-compass,
    .pnlm-about-msg,
    .pnlm-about-menu {
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
    .custom-hotspot-scene:hover::after {
      transform: scale(1.22) !important;
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
      bottom: calc(100% + 10px) !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      margin: 0 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      background-color: rgba(15, 23, 42, 0.95) !important;
      color: #f8fafc !important;
      border-radius: 6px !important;
      padding: 4px 8px !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      display: inline-block !important;
      width: max-content !important;
      max-width: max-content !important;
      min-width: min-content !important;
      box-sizing: border-box !important;
      z-index: 50 !important;
      transition: opacity 0.2s ease, visibility 0.2s ease !important;
    }

    div.pnlm-tooltip:hover span,
    div.pnlm-tooltip.pnlm-tooltip-active span {
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Container */
    #panorama {
      width: 100%;
      height: 100%;
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
      max-width: min(480px, calc(100% - 32px));
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
      max-width: calc(100% - 32px);
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
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      border-radius: inherit;
    }
    .edu-modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Variações de Desfoque de Fundo */
    .edu-modal-backdrop.blur-none {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background: rgba(15, 23, 42, 0.45) !important;
    }
    .edu-modal-backdrop.blur-low {
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
      background: rgba(15, 23, 42, 0.55) !important;
    }
    .edu-modal-backdrop.blur-medium {
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      background: rgba(15, 23, 42, 0.72) !important;
    }
    .edu-modal-backdrop.blur-high {
      backdrop-filter: blur(24px) !important;
      -webkit-backdrop-filter: blur(24px) !important;
      background: rgba(15, 23, 42, 0.85) !important;
    }

    /* Quadro do Modal */
    .edu-modal-card {
      border-radius: 18px;
      width: 100%;
      max-width: min(620px, calc(100% - 24px));
      max-height: calc(100% - 24px);
      overflow-y: auto;
      transform: scale(0.94);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
    }
    .edu-modal-backdrop.open .edu-modal-card {
      transform: scale(1);
    }

    /* Tema Claro (Padrão) */
    .edu-modal-card.theme-light,
    .edu-modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.35);
    }
    .edu-modal-card.theme-light .edu-modal-header,
    .edu-modal-card .edu-modal-header {
      border-bottom: 1px solid #e2e8f0;
    }
    .edu-modal-card.theme-light .edu-modal-title,
    .edu-modal-card .edu-modal-title {
      color: #0f172a;
    }
    .edu-modal-card.theme-light .edu-close-btn,
    .edu-modal-card .edu-close-btn {
      color: #64748b;
      background: rgba(0, 0, 0, 0.05);
    }
    .edu-modal-card.theme-light .edu-close-btn:hover,
    .edu-modal-card .edu-close-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #0f172a;
    }
    .edu-modal-card.theme-light .edu-modal-text,
    .edu-modal-card .edu-modal-text {
      color: #334155;
    }
    .edu-modal-card.theme-light .edu-modal-img,
    .edu-modal-card .edu-modal-img {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    /* Tema Escuro */
    .edu-modal-card.theme-dark {
      background: #0f172a !important;
      border: 1px solid #334155 !important;
      color: #f8fafc !important;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.75) !important;
    }
    .edu-modal-card.theme-dark .edu-modal-header {
      border-bottom: 1px solid #1e293b !important;
    }
    .edu-modal-card.theme-dark .edu-modal-title {
      color: #ffffff !important;
    }
    .edu-modal-card.theme-dark .edu-close-btn {
      color: #94a3b8 !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }
    .edu-modal-card.theme-dark .edu-close-btn:hover {
      background: rgba(255, 255, 255, 0.16) !important;
      color: #ffffff !important;
    }
    .edu-modal-card.theme-dark .edu-modal-text {
      color: #cbd5e1 !important;
    }
    .edu-modal-card.theme-dark .edu-modal-img {
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      background: #020617 !important;
    }

    .edu-modal-header {
      padding: 20px 24px 14px 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .edu-modal-title {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.3;
    }
    .edu-close-btn {
      border: none;
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
    .edu-modal-body {
      padding: 20px 24px 24px 24px;
    }
    .edu-modal-img {
      width: 100%;
      border-radius: 12px;
      margin-bottom: 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .edu-modal-text {
      font-size: 15px;
      line-height: 1.65;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <!-- Delimited Viewport Box -->
  <div class="tour-viewport-box" id="viewport-box">
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
      <div class="edu-modal-card" role="dialog" aria-modal="true" style="position: relative;">
        <button class="edu-close-btn" id="modal-close-overlay" aria-label="Fechar" style="display: none; position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px;">✕</button>
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
      </div>
    </div>
  </div>

  <!-- Pannellum Bundle Embutido Localmente -->
  <script>
    (function() {
      if (window.FileReader && FileReader.prototype) {
        var origReadAsBinaryString = FileReader.prototype.readAsBinaryString;
        if (origReadAsBinaryString) {
          FileReader.prototype.readAsBinaryString = function(blob) {
            if (!(blob instanceof Blob)) return origReadAsBinaryString.call(this, new Blob([]));
            return origReadAsBinaryString.call(this, blob);
          };
        }
        var origReadAsText = FileReader.prototype.readAsText;
        if (origReadAsText) {
          FileReader.prototype.readAsText = function(blob, encoding) {
            if (!(blob instanceof Blob)) return origReadAsText.call(this, new Blob([]), encoding);
            return origReadAsText.call(this, blob, encoding);
          };
        }
      }
      if (window.URL && window.URL.createObjectURL) {
        var origCreateObjectURL = window.URL.createObjectURL;
        window.URL.createObjectURL = function(obj) {
          if (!(obj instanceof Blob) && !(obj instanceof MediaSource)) return '';
          try { return origCreateObjectURL.call(this, obj); } catch(e) { return ''; }
        };
      }
    })();
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
      const modalHeader = document.querySelector('.edu-modal-header');
      const modalBody = document.querySelector('.edu-modal-body');
      const modalTitle = document.getElementById('modal-title');
      const modalImage = document.getElementById('modal-image');
      const modalText = document.getElementById('modal-text');
      const modalCloseBtn = document.getElementById('modal-close-btn');
      const modalCloseOverlay = document.getElementById('modal-close-overlay');
      const roomNav = document.getElementById('room-nav');
      const btnFullscreen = document.getElementById('btn-fullscreen');
      const btnZoomIn = document.getElementById('btn-zoom-in');
      const btnZoomOut = document.getElementById('btn-zoom-out');

      function openModal(hotspot) {
        if (!hotspot) return;

        if (modal) {
          var effectiveBlur = (tourData.settings && tourData.settings.backdropBlur) || hotspot.backdropBlur || 'low';
          var effectiveTheme = (tourData.settings && tourData.settings.cardTheme) || hotspot.cardTheme || 'light';

          modal.classList.remove('blur-none', 'blur-low', 'blur-medium', 'blur-high');
          modal.classList.add('blur-' + effectiveBlur);

          var modalCard = modal.querySelector('.edu-modal-card');
          if (modalCard) {
            modalCard.classList.remove('theme-light', 'theme-dark');
            modalCard.classList.add(effectiveTheme === 'dark' ? 'theme-dark' : 'theme-light');
          }
        }

        if (hotspot.imageOnly && hotspot.imageUrl) {
          if (modalCloseOverlay) modalCloseOverlay.style.display = 'flex';
          if (modalHeader) modalHeader.style.display = 'none';
          if (modalText) modalText.style.display = 'none';
          if (modalBody) modalBody.style.padding = '0';
          if (modalImage) {
            modalImage.style.marginBottom = '0';
            modalImage.style.borderRadius = '16px';
            modalImage.style.maxHeight = '88vh';
            modalImage.src = hotspot.imageUrl;
            modalImage.style.display = 'block';
          }
        } else {
          if (modalCloseOverlay) modalCloseOverlay.style.display = 'none';
          if (modalHeader) modalHeader.style.display = 'flex';
          if (modalText) modalText.style.display = 'block';
          if (modalBody) modalBody.style.padding = '20px 24px 24px 24px';
          if (modalTitle) modalTitle.textContent = hotspot.title || 'Informação';
          if (modalText) modalText.textContent = hotspot.description || '';
          if (modalImage) {
            if (hotspot.imageUrl) {
              modalImage.style.marginBottom = '18px';
              modalImage.style.borderRadius = '12px';
              modalImage.style.maxHeight = '280px';
              modalImage.src = hotspot.imageUrl;
              modalImage.style.display = 'block';
            } else {
              modalImage.style.display = 'none';
            }
          }
        }
        if (modal) modal.classList.add('open');
      }

      function closeModal() {
        if (modal) modal.classList.remove('open');
      }

      if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
      if (modalCloseOverlay) modalCloseOverlay.addEventListener('click', closeModal);
      if (modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === modal) closeModal();
        });
      }
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
          hfov: (tourData.settings && tourData.settings.initialWideFov) ? 120 : (sc.initialHfov || 100),
          maxHfov: (tourData.settings && tourData.settings.initialWideFov) ? 130 : 120,
          hotSpots: (sc.hotspots || []).map(function(hs) {
            var pulseClass = (tourData.settings && tourData.settings.pulseEffect !== false) ? 'hotspot-pulse' : '';
            var isInfo = hs.type === 'info';
            var baseClass = isInfo ? 'custom-hotspot-info' : 'custom-hotspot-scene';
            var arrowDir = hs.arrowDirection || (tourData.settings && tourData.settings.defaultArrowDirection) || 'right';
            var arrowClass = !isInfo ? ('arrow-' + arrowDir) : '';

            return {
              id: hs.id,
              pitch: hs.pitch,
              yaw: hs.yaw,
              type: hs.type,
              text: hs.title || '',
              sceneId: hs.type === 'scene' ? hs.targetSceneId : undefined,
              targetPitch: hs.targetPitch || 0,
              targetYaw: hs.targetYaw || 0,
              cssClass: (baseClass + ' ' + arrowClass + ' ' + pulseClass).trim(),
              createTooltipFunc: function(hotSpotDiv) {
                hotSpotDiv.setAttribute('data-hotspot-id', hs.id);

                if (hs.customColor) {
                  hotSpotDiv.style.backgroundColor = hs.customColor;
                }
                if (hs.arrowColor) {
                  hotSpotDiv.style.setProperty('--arrow-color', hs.arrowColor);
                }

                if (hs.title) {
                  var span = document.createElement('span');
                  span.textContent = hs.title;
                  hotSpotDiv.classList.add('pnlm-tooltip');
                  hotSpotDiv.appendChild(span);
                }

                hotSpotDiv.addEventListener('click', function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  if (hs.type === 'scene' && hs.targetSceneId) {
                    currentViewer.loadScene(hs.targetSceneId, hs.targetPitch || undefined, hs.targetYaw || undefined);
                  } else {
                    openModal(hs);
                  }
                });
              },
              clickHandlerFunc: function() {
                if (hs.type === 'scene' && hs.targetSceneId) {
                  currentViewer.loadScene(hs.targetSceneId, hs.targetPitch || undefined, hs.targetYaw || undefined);
                } else {
                  openModal(hs);
                }
              }
            };
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
          keyboardZoom: true,
          hfov: (tourData.settings && tourData.settings.initialWideFov) ? 120 : 100,
          maxHfov: (tourData.settings && tourData.settings.initialWideFov) ? 130 : 120
        },
        scenes: pnlmScenes
      });

      var panoEl = document.getElementById('panorama');
      if (panoEl) {
        panoEl.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      }

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
        var box = document.getElementById('viewport-box') || document.documentElement;
        var isFs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!isFs) {
          var req = box.requestFullscreen || box.webkitRequestFullscreen || box.mozRequestFullScreen || box.msRequestFullscreen;
          if (req) {
            req.call(box).catch(function() {});
          }
        } else {
          var exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
          if (exit) {
            exit.call(document).catch(function() {});
          }
        }
      });

      function handleResize() {
        if (currentViewer && currentViewer.resize) {
          currentViewer.resize();
        }
      }

      window.addEventListener('resize', handleResize);
      document.addEventListener('fullscreenchange', function() {
        setTimeout(handleResize, 150);
      });
      document.addEventListener('webkitfullscreenchange', function() {
        setTimeout(handleResize, 150);
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
