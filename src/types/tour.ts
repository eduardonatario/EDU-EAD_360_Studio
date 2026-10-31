/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HotspotType = 'info' | 'scene';

export interface Hotspot {
  id: string;
  type: HotspotType;
  pitch: number;          // -90 (chão) até 90 (teto)
  yaw: number;            // -180 até 180 (360 horizontal)
  title: string;
  
  // Propriedades para Hotspot Informativo Educacional
  description?: string;
  imageUrl?: string;      // Data URL da imagem explicativa
  category?: string;      // Ex: 'Arquitetura', 'Design de Interiores', 'Sustentabilidade', 'Tecnologia'
  iconName?: 'info' | 'book' | 'eye' | 'help' | 'lightbulb';
  
  // Propriedades para Hotspot de Navegação (Portal entre Cômodos)
  targetSceneId?: string; // ID da cena destino
  targetPitch?: number;   // Pitch inicial ao chegar na nova cena
  targetYaw?: number;     // Yaw inicial ao chegar na nova cena
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
