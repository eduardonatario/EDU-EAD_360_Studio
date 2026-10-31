/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Copy,
  Crosshair,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Navigation,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Hotspot, HotspotType, Scene } from '../../types/tour';

interface HotspotEditorProps {
  hotspot: Hotspot;
  currentSceneId: string;
  allScenes: Scene[];
  onSave: (updated: Hotspot) => void;
  onDuplicate: (hotspot: Hotspot) => void;
  onDelete: (hotspotId: string) => void;
  onClose: () => void;
  onStartReposition: () => void;
  onNavigateToScene?: (sceneId: string) => void;
}

export const HotspotEditor: React.FC<HotspotEditorProps> = ({
  hotspot,
  currentSceneId,
  allScenes,
  onSave,
  onDuplicate,
  onDelete,
  onClose,
  onStartReposition,
  onNavigateToScene,
}) => {
  const [type, setType] = useState<HotspotType>(hotspot.type);
  const [title, setTitle] = useState(hotspot.title || '');
  const [description, setDescription] = useState(hotspot.description || '');
  const [imageUrl, setImageUrl] = useState(hotspot.imageUrl || '');
  const [targetSceneId, setTargetSceneId] = useState(
    hotspot.targetSceneId || allScenes.find((s) => s.id !== currentSceneId)?.id || ''
  );
  const [pitch, setPitch] = useState(hotspot.pitch);
  const [yaw, setYaw] = useState(hotspot.yaw);

  // Controle de modo de inserção de imagem: 'upload' ou 'url'
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setImageError(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImageUrl(trimmed);
    setImageError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Hotspot = {
      ...hotspot,
      type,
      title: title.trim() || (type === 'info' ? 'Ponto Informativo' : 'Portal de Cômodo'),
      pitch: Number(pitch) || 0,
      yaw: Number(yaw) || 0,
      description: type === 'info' ? description : undefined,
      imageUrl: type === 'info' ? imageUrl : undefined,
      targetSceneId: type === 'scene' ? targetSceneId : undefined,
      targetPitch: type === 'scene' ? 0 : undefined,
      targetYaw: type === 'scene' ? 0 : undefined,
    };
    onSave(updated);
  };

  const destinationOptions = allScenes.filter((s) => s.id !== currentSceneId);
  const selectedDestinationScene = allScenes.find((s) => s.id === targetSceneId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-84 shrink-0 select-none text-slate-800 dark:text-slate-200 shadow-lg transition-colors">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
              type === 'info'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {type === 'info' ? <Info className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Editar Hotspot
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
              {type === 'info' ? 'Ponto Informativo' : 'Portal de Navegação'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulário com Rolagem */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Seletor de Tipo */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Tipo de Ponto
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('info')}
              className={`py-2 px-2.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'info'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Informativo</span>
            </button>
            <button
              type="button"
              onClick={() => setType('scene')}
              className={`py-2 px-2.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'scene'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Portal de Cômodo</span>
            </button>
          </div>
        </div>

        {/* Título do Hotspot */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {type === 'info' ? 'Título do Ponto de Estudo' : 'Nome do Portal de Destino'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'info' ? 'Ex: Ventilação Cruzada' : 'Ex: Ir para a Cozinha Gourmet'}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Campos Específicos para PORTAL DE NAVEGAÇÃO ENTRE CÔMODOS */}
        {type === 'scene' && (
          <div className="space-y-3 p-3 bg-emerald-500/5 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                  Cômodo de Destino
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                  Conexão 360º
                </span>
              </div>

              {destinationOptions.length === 0 ? (
                <div className="text-rose-600 dark:text-rose-400 text-[11px] bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                  Não há outros cômodos cadastrados para conexão. Crie um novo ambiente no painel esquerdo para conectar.
                </div>
              ) : (
                <select
                  value={targetSceneId}
                  onChange={(e) => {
                    const newTargetId = e.target.value;
                    setTargetSceneId(newTargetId);
                    // Se o título estiver vazio ou padrão, sugere o nome do cômodo
                    const targetScene = allScenes.find((s) => s.id === newTargetId);
                    if (targetScene && (!title || title.startsWith('Ir para') || title === 'Portal de Cômodo')) {
                      setTitle(`Ir para ${targetScene.name}`);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  {destinationOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedDestinationScene && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ambiente conectado:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {selectedDestinationScene.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {selectedDestinationScene.description || 'Ambiente panorâmico 360°'}
                </p>
              </div>
            )}

            {targetSceneId && onNavigateToScene && (
              <button
                type="button"
                onClick={() => onNavigateToScene(targetSceneId)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Testar viagem / Ir para este cômodo agora ➔</span>
              </button>
            )}
          </div>
        )}

        {/* Campos Específicos para PONTO INFORMATIVO (Card Educacional) */}
        {type === 'info' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Conteúdo Explicativo / Instrucional
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira as explicações pedagógicas, dados técnicos ou orientações aos alunos..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 resize-none leading-relaxed transition-colors"
              />
            </div>

            {/* Ilustração Complementar: Upload de Arquivo ou URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Foto / Diagrama Complementar
                </label>
                {imageUrl && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                    Imagem vinculada
                  </span>
                )}
              </div>

              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-2 bg-slate-100 dark:bg-slate-950 group">
                  <img
                    src={imageUrl}
                    alt="Preview Hotspot"
                    className="w-full h-32 object-cover"
                    onError={() => setImageError(true)}
                  />
                  {imageError && (
                    <div className="absolute inset-0 bg-rose-950/80 text-rose-200 text-[11px] p-3 flex items-center justify-center text-center">
                      Erro ao carregar a imagem da URL informada. Verifique o link ou envie um arquivo.
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setUrlInput('');
                        setImageError(false);
                      }}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover imagem</span>
                    </button>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-200 px-2 py-0.5 rounded font-mono">
                    {imageUrl.startsWith('data:') ? 'Arquivo local' : 'URL web'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Seletor entre Upload e URL */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`flex-1 py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        imageTab === 'upload'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-500" />
                      <span>Upload de Arquivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`flex-1 py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        imageTab === 'url'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>URL da Imagem</span>
                    </button>
                  </div>

                  {/* Aba 1: Upload de Arquivo Local */}
                  {imageTab === 'upload' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-5 h-5 text-sky-500 mb-0.5" />
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          Escolher arquivo do computador
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          PNG, JPG, WebP ou GIF
                        </span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}

                  {/* Aba 2: Inserir URL da Imagem */}
                  {imageTab === 'url' && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value);
                            setImageError(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyUrl();
                            }
                          }}
                          placeholder="https://exemplo.com/imagem.jpg"
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:border-sky-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyUrl()}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
                        >
                          Carregar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Insira o link direto de uma imagem online pública (ex: Unsplash, Wikimedia, site educacional).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Coordenadas Esféricas 360 */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Posição no Espaço 360°
            </span>
            <button
              type="button"
              onClick={onStartReposition}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold flex items-center gap-1 cursor-pointer"
              title="Clique para editar a posição deste hotspot na imagem 360°"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Editar hotspot</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                Pitch (Vertical: -90° a 90°)
              </span>
              <input
                type="number"
                min={-90}
                max={90}
                step={0.5}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono tabular-nums text-xs transition-colors"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                Yaw (Horizontal: -180° a 180°)
              </span>
              <input
                type="number"
                min={-180}
                max={180}
                step={0.5}
                value={yaw}
                onChange={(e) => setYaw(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono tabular-nums text-xs transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Ações do Formulário */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-sm text-xs"
          >
            Salvar Alterações
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDuplicate(hotspot)}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs border border-slate-200 dark:border-slate-700/60"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicar</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(hotspot.id)}
              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer text-xs"
              title="Excluir Hotspot"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
