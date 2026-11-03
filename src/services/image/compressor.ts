/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TourProject } from '../../types/tour';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
}

/**
 * Redimensiona e comprime uma imagem Data URL ou Blob para JPEG otimizado
 */
export function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 3840, maxHeight = 1920, quality = 0.82 } = options;

  if (!dataUrl) return Promise.resolve(dataUrl);

  return new Promise((resolve) => {
    const img = new Image();

    // Apenas define crossOrigin para URLs remotas HTTP/HTTPS
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (!w || !h) {
        resolve(dataUrl);
        return;
      }

      // Manter proporção 2:1 ou proporção original
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      // Certificar-se de dimensões pares para WebGL
      w = w % 2 === 0 ? w : w - 1;
      h = h % 2 === 0 ? h : h - 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(2, w);
      canvas.height = Math.max(2, h);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback
        return;
      }

      // Renderização com filtro suave
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      console.warn('Aviso: Imagem mantida no formato original (sem recompressão):', dataUrl.slice(0, 50));
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Processa todas as cenas e imagens de hotspots de um TourProject
 * com notificação de progresso
 */
export async function optimizeProjectMedia(
  project: TourProject,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<TourProject> {
  const cloned: TourProject = JSON.parse(JSON.stringify(project));
  const scenes = cloned.scenes;

  // Contabilizar total de imagens (cenas + hotspots com imagens)
  let totalTasks = scenes.length;
  for (const s of scenes) {
    for (const h of s.hotspots) {
      if (h.imageUrl) totalTasks++;
    }
  }

  let completed = 0;

  // 1. Otimizar Panoramas das Cenas
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    completed++;
    onProgress?.(completed, totalTasks, `Otimizando panorama do cômodo: ${scene.name}...`);
    
    if (scene.imageUrl) {
      scene.imageUrl = await compressDataUrl(scene.imageUrl, {
        maxWidth: 3840,
        maxHeight: 1920,
        quality: 0.83,
      });
    }

    // 2. Otimizar Imagens dos Hotspots
    for (const hotspot of scene.hotspots) {
      if (hotspot.imageUrl) {
        completed++;
        onProgress?.(completed, totalTasks, `Comprimindo ilustração educativa: ${hotspot.title}...`);
        hotspot.imageUrl = await compressDataUrl(hotspot.imageUrl, {
          maxWidth: 960,
          maxHeight: 720,
          quality: 0.8,
        });
      }
    }
  }

  return cloned;
}
