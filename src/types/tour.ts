/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HotspotType = 'info' | 'scene';

export type ArrowDirection =
  | 'right'     // ➔
  | 'left'      // ⬅
  | 'up'        // ⬆
  | 'down'      // ⬇
  | 'up-right'  // ↗
  | 'up-left'   // ↖
  | 'compass'   // 🧭
  | 'door';     // 🚪

export function getArrowGlyph(direction?: ArrowDirection): string {
  switch (direction) {
    case 'left':
      return '⬅';
    case 'up':
      return '⬆';
    case 'down':
      return '⬇';
    case 'up-right':
      return '↗';
    case 'up-left':
      return '↖';
    case 'compass':
      return '🧭';
    case 'door':
      return '🚪';
    case 'right':
    default:
      return '➔';
  }
}

export function getArrowLabel(direction: ArrowDirection): string {
  switch (direction) {
    case 'left':
      return 'Esquerda (⬅)';
    case 'up':
      return 'Cima (⬆)';
    case 'down':
      return 'Baixo (⬇)';
    case 'up-right':
      return 'Diagonal Dir (↗)';
    case 'up-left':
      return 'Diagonal Esq (↖)';
    case 'compass':
      return 'Bússola (🧭)';
    case 'door':
      return 'Porta (🚪)';
    case 'right':
    default:
      return 'Direita (➔)';
  }
}

export type ViewportFormat = 'free' | '16:9' | '9:16' | 'custom';

export interface GlobalHotspotSettings {
  infoColor: string;          // HEX padrão dos hotspots informativos (ex: #0ea5e9)
  sceneColor: string;         // HEX padrão dos portais de navegação (ex: #10b981)
  pulseEffect: boolean;       // Efeito de pulsar/piscar suavemente
  defaultArrowDirection: ArrowDirection; // Seta de navegação padrão
  arrowColor: string;         // Cor do glifo da seta (ex: #ffffff)
  showNavigationControls: boolean; // Exibir controles de zoom, centralizar e tela cheia (padrão: true)
  showBottomRoomBar: boolean; // Exibir menu de navegação com nome dos espaços na parte inferior central (padrão: false)
  showRoomBarHotspotCount: boolean; // Exibir número de hotspots nos botões do menu inferior de cômodos (padrão: false)
  viewportFormat?: ViewportFormat; // Formato do espaço de navegação: 'free' | '16:9' | '9:16' | 'custom'
  customWidth?: number;       // Largura para formato personalizado (px)
  customHeight?: number;      // Altura para formato personalizado (px)
  initialWideFov?: boolean;   // Iniciar ambiente com imagem mais aberta possível (visão ampla)
}

export const DEFAULT_HOTSPOT_SETTINGS: GlobalHotspotSettings = {
  infoColor: '#0ea5e9',
  sceneColor: '#10b981',
  pulseEffect: true,
  defaultArrowDirection: 'right',
  arrowColor: '#ffffff',
  showNavigationControls: true,
  showBottomRoomBar: false,
  showRoomBarHotspotCount: false,
  viewportFormat: 'free',
  customWidth: 1920,
  customHeight: 1080,
  initialWideFov: false,
};

export interface Hotspot {
  id: string;
  type: HotspotType;
  pitch: number;          // -90 (chão) até 90 (teto)
  yaw: number;            // -180 até 180 (360 horizontal)
  title: string;
  customColor?: string;   // Cor individual (opcional)
  
  // Propriedades para Hotspot Informativo Educacional
  description?: string;
  imageUrl?: string;      // Data URL da imagem explicativa
  imageOnly?: boolean;    // Exibir apenas imagem preenchendo o quadro de informação
  category?: string;
  iconName?: 'info' | 'book' | 'eye' | 'help' | 'lightbulb';
  
  // Propriedades para Hotspot de Navegação (Portal entre Cômodos)
  targetSceneId?: string; // ID da cena destino
  targetPitch?: number;   // Pitch inicial ao chegar na nova cena
  targetYaw?: number;     // Yaw inicial ao chegar na nova cena
  arrowDirection?: ArrowDirection; // Direção específica da seta deste portal
  arrowColor?: string;    // Cor individual da seta
}

export interface Scene {
  id: string;
  name: string;           // Nome do cômodo (Ex: "Sala de Estar", "Cozinha Gourmet")
  description?: string;
  imageUrl: string;       // Data URL ou Blob URL do panorama 360 equirretangular
  thumbnailUrl?: string;  // Miniatura para o menu de cenas
  initialPitch: number;   // Ângulo vertical inicial (-90 a 90)
  initialYaw: number;     // Ângulo horizontal inicial (-180 a 180)
  initialHfov: number;    // Campo de visão inicial (padrão: 100)
  hotspots: Hotspot[];
}

export interface TourProject {
  id: string;
  title: string;
  author: string;
  institution?: string;
  description: string;
  initialSceneId: string;
  scenes: Scene[];
  settings?: GlobalHotspotSettings; // Configurações gerais de aparência
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'editor' | 'preview';

export interface Coords360 {
  pitch: number;
  yaw: number;
}

export interface RepositionSession {
  step: 'select_hotspot' | 'select_position';
  targetHotspotId?: string;
  targetHotspotTitle?: string;
}
