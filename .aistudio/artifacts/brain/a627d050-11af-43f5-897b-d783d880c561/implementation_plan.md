# Plataforma de Criação de Experiências Educacionais 360º para EAD

Plano técnico de implementação para um aplicativo web profissional em React + TypeScript + Vite, permitindo que professores e designers instrucionais criem ambientes virtuais 360º interativos, configurem hotspots informativos e de navegação entre cômodos, e exportem um arquivo HTML independente e 100% offline.

---

## Revisão do Usuário e Decisões Críticas

> [!IMPORTANT]
> Decisões confirmadas na etapa preliminar de alinhamento:
> - **Formato de Exportação**: Arquivo `.html` único e autossuficiente com **compressão inteligente de imagens** em canvas (garantindo carregamento instantâneo e tamanho de arquivo otimizado para plataformas EAD como Moodle, Canvas, Blackboard ou Google Classroom).
> - **Hotspots Educativos**: Cards informativos com títulos, textos explicativos e imagens ilustrativas complementares com design instrucional limpo.
> - **Projeto Demonstrativo**: Casa moderna com 4 cômodos (Sala de Estar, Cozinha Gourmet, Quarto Principal e Banheiro de Design) pré-carregada na inicialização com panoramas 360º realistas e conexões já configuradas.

---

## 1. Visão Geral e Arquitetura do Sistema

O aplicativo opera como um estúdio de autoria visual em tela cheia dividido em modo de edição (para o professor/criador) e modo de visualização (simulação exata da experiência do aluno).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Top Navigation & Status Bar                          │
│  [Logo EAD 360]  [Projeto: Casa Moderna]  [Preview / Edit]  [Baixar HTML]│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────┐                       ┌─────────────────────┐
│    Painel Lateral Esquerdo │                       │  Inspetor Lateral   │
│  - Gerenciador de Cenas   │                       │  Direito (Edição)   │
│  - Miniaturas dos cômodos │                       │  - Propriedades da  │
│  - Upload de novas fotos  │                       │    Cena             │
│  - Lista de hotspots      │                       │  - Editor de Hotspot│
│  - Novo Hotspot (Info/Nav)│                       │    (Info ou Portal) │
└─────────────┬─────────────┘                       └──────────▲──────────┘
              │                                                │
              │         ┌────────────────────────────┐         │
              └────────►│ Visualizador Central 360º  ├─────────┘
                        │ (Pannellum WebGL Canvas)   │
                        │ - Rotação / Pitch / Yaw    │
                        │ - Zoom (FOV) e Tela Cheia  │
                        │ - Mira de mira / clique p/ │
                        │   posicionamento exato     │
                        └─────────────┬──────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────┐
                        │ Armazenamento Local        │
                        │ (IndexedDB nativo do app)  │
                        └────────────────────────────┘
```

---

## 2. Estrutura de Pastas e Componentes

A estrutura foi planejada para isolar a camada de visualização 360º, o gerenciamento de estado local no IndexedDB e o motor de exportação de HTML:

```
src/
├── assets/
│   ├── demo/                # Panoramas 360º pré-carregados (sala, cozinha, quarto, banheiro)
│   └── pannellum/           # Biblioteca Pannellum JS e CSS empacotados localmente (zero CDN)
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx       # Controle de projeto, alternância Modo Edição / Aluno, Ação de Exportar
│   │   └── Modal.tsx        # Base modal acessível para diálogos
│   ├── viewer/
│   │   ├── PannellumViewer.tsx  # Wrapper React sobre a instância Pannellum
│   │   ├── ViewerControls.tsx   # Controles flutuantes de FOV, zoom, bússola, tela cheia
│   │   └── PlacementCrosshair.tsx # Retículo visual no modo de posicionamento de hotspot
│   ├── scenes/
│   │   ├── SceneList.tsx    # Carrossel e lista de cômodos com ordenação e adição
│   │   └── SceneCard.tsx    # Card de cada cômodo com miniatura e contadores
│   ├── hotspots/
│   │   ├── HotspotList.tsx  # Listagem e busca rápida de hotspots da cena ativa
│   │   ├── HotspotEditor.tsx# Formulário de edição (tipo info vs navegação, texto, imagem)
│   │   └── HotspotModal.tsx # Card instrucional que o aluno vê ao clicar no hotspot info
│   └── export/
│       └── ExportProgressModal.tsx # Feedback visual durante a compressão e geração do HTML
├── services/
│   ├── storage/
│   │   └── db.ts            # Camada IndexedDB com schema para projetos, cenas e assets
│   ├── demo/
│   │   └── demoProject.ts   # Carga e bootstrapping do projeto da Casa Moderna
│   ├── image/
│   │   └── compressor.ts    # Compressão em canvas para Data URL (JPEG/WebP otimizado)
│   └── export/
│       └── htmlGenerator.ts # Montador do template HTML único autônomo offline
├── types/
│   └── tour.ts              # Modelos TypeScript (Projeto, Cena, Hotspot, Coordenadas)
├── App.tsx                  # Orquestrador central e gerenciador de estado da aplicação
├── main.tsx
└── index.css
```

---

## 3. Armazenamento de Dados, Cenas e Coordenadas

### A. Modelo de Dados (TypeScript)

```typescript
export type HotspotType = 'info' | 'scene';

export interface Hotspot {
  id: string;
  type: HotspotType;
  pitch: number;          // Coordenada vertical: -90° (chão) a +90° (teto)
  yaw: number;            // Coordenada horizontal: -180° a +180°
  title: string;
  // Campos para Hotspot Informativo
  description?: string;
  imageUrl?: string;      // Imagem complementar educativa (base64 ou data URL)
  category?: string;      // Ex: 'Arquitetura', 'Materiais', 'Sustentabilidade'
  // Campos para Hotspot de Navegação (Portal)
  targetSceneId?: string; // ID do cômodo de destino
  targetPitch?: number;   // Ângulo de chegada da câmera
  targetYaw?: number;
}

export interface Scene {
  id: string;
  name: string;           // Ex: 'Sala de Estar', 'Cozinha Gourmet'
  description?: string;
  imageUrl: string;       // Panorama equirretangular em 360° (Data URL / Blob)
  initialPitch: number;   // Orientação padrão da cena
  initialYaw: number;
  initialHfov: number;    // Campo de visão padrão (default: 100)
  hotspots: Hotspot[];
}

export interface TourProject {
  id: string;
  title: string;
  author: string;
  description: string;
  initialSceneId: string;
  scenes: Scene[];
  updatedAt: number;
}
```

### B. Estratégia no IndexedDB
- O banco local `ead_360_creator_db` utilizará Object Stores dedicados (`projects`, `scenes`, `media_blobs`).
- Imagens panorâmicas de alta resolução são armazenadas de forma segura em Blobs/ArrayBuffers nativos do IndexedDB, contornando o limite de 5MB do `localStorage` e permitindo projetos com dezenas de ambientes sem degradação de performance.

---

## 4. Mecânica de Navegação entre Cômodos

A navegação entre cômodos é o coração da experiência espacial:

1. **Configuração pelo Professor**:
   - Ao adicionar um hotspot do tipo `"scene"` (Portal de Navegação), o professor escolhe o cômodo de destino a partir de um seletor visual com as miniaturas das outras cenas.
   - O professor pode definir ou capturar o `targetYaw` e `targetPitch` (ex: ao entrar na cozinha vindo da sala, a câmera já aponta para a bancada central).
2. **Execução no Visualizador (Pannellum)**:
   - Ao clicar no ícone de portal, o visualizador dispara a troca controlada de cena via API do Pannellum (`viewer.loadScene(targetSceneId)`).
   - Uma transição de fade suave (suportada nativamente via `sceneFadeDuration: 1000`) suaviza a mudança entre cômodos, evitando cortes bruscos e oferecendo sensação de teletransporte realista.
3. **Histórico e Trilha de Navegação**:
   - Um minimapa / seletor rápido no rodapé da visualização permite ao aluno também pular diretamente para qualquer cômodo já visitado.

---

## 5. Estratégia de Geração do HTML Independente (Single-File Offline)

A geração de um arquivo `.html` 100% autossuficiente exige que nenhum recurso dependa de conexões HTTP ou bibliotecas externas.

### Estrutura do Arquivo Gerado:
1. **Estrutura HTML5 com Viewport Mobile-Friendly**:
   `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
2. **CSS Inlined**:
   - CSS minificado oficial do Pannellum embutido em `<style>`.
   - CSS personalizado para os cards de informação educativa, tooltips, modais responsivos e botões de tela cheia.
3. **Pannellum JS Inlined**:
   - Código JavaScript compilado e minificado do visualizador Pannellum embutido diretamente em `<script>`.
4. **Imagens Otimizadas em Base64**:
   - Antes do empacotamento, cada panorama passa por uma rotina de compressão inteligente usando `<canvas>`: a resolução é normalizada para até 4096×2048 pixels (qualidade 0.82 JPEG), mantendo os detalhes nítidos e reduzindo o arquivo total para uma faixa prática (tipicamente 6MB a 12MB para uma casa com 4 ambientes).
5. **Dados do Tour embutidos em JSON**:
   - O objeto `TourProject` completo com todas as cenas, hotspots, textos e imagens é serializado em uma variável JavaScript global `window.__TOUR_DATA__`.
6. **Player de Execução do Aluno**:
   - Um script leve e independente (cerca de 150 linhas) que lê `window.__TOUR_DATA__`, inicializa o Pannellum, registra os manipuladores de clique dos hotspots informativos, renderiza o modal educacional e orquestra as trocas de cena.
7. **Suporte a `file:///`**:
   - Como os panoramas são passados como Data URLs no próprio payload do Pannellum, **não ocorrem bloqueios de segurança CORS** ao abrir o arquivo com duplo clique localmente no Windows, macOS, Linux, Android ou iOS.

---

## 6. Identificação de Riscos Técnicos e Mitigações

| Risco Técnico | Causa Potencial | Estratégia de Mitigação |
| :--- | :--- | :--- |
| **Bloqueio de CORS ao abrir arquivo local (`file:///`)** | Navegadores bloqueiam `fetch()` e texturas WebGL de caminhos relativos locais (`file://image.jpg`). | **Uso estrito de Base64 Data URLs**. O Pannellum carrega imagens em formato Data URL diretamente na GPU sem acionar restrições cross-origin. |
| **Divergência entre o Preview e o HTML exportado** | Lógicas de renderização separadas para o editor e para o arquivo final. | **Motor Unificado de Configuração**. A mesma função que gera a árvore de configuração do Pannellum no React é usada pelo montador do arquivo exportado, garantindo paridade de 100%. |
| **Estouro de memória no navegador do aluno** | Múltiplos panoramas 4K simultâneos em base64. | **Liberação de Texturas**. O Pannellum descarta a textura WebGL da cena anterior ao carregar a nova, mantendo o consumo de VRAM baixo mesmo em smartphones. |
| **Precisão ao posicionar Hotspots** | Erro de cálculo manual de `pitch` e `yaw`. | **Posicionamento por Clique Direto**. No modo de adição, o professor clica em qualquer ponto da esfera 360º; o evento do Pannellum fornece `mouseEventToCoords()`, garantindo precisão milimétrica. |
| **Tamanho excessivo do arquivo HTML baixado** | Imagens originais de 20MB cada enviadas pelo usuário. | **Pipeline de Compressão Inteligente**. Antes da exportação, uma rotina assíncrona reduz proporcionalmente as imagens com feedback visual em barra de progresso. |

---

## 7. Fases de Desenvolvimento e Verificação

### Fase 1: Fundação Técnica e Biblioteca 360º
- Configuração dos pacotes e inclusão dos arquivos locais do Pannellum (JS + CSS) em `src/assets/pannellum/`.
- Criação dos tipos TypeScript para o Tour, Cenas e Hotspots.
- Implementação do serviço IndexedDB (`src/services/storage/db.ts`).
- **Verificação**: Testar compilação limpa e persistência de dados.

### Fase 2: Visualizador 360º e Carga da Casa Moderna
- Implementação do componente `PannellumViewer` com suporte a drag, zoom, pitch/yaw e controles de tela cheia.
- Criação dos 4 cenários 360º equirretangulares para o projeto demonstrativo da casa moderna (Sala, Cozinha, Quarto, Banheiro).
- Inicialização automática com os dados e hotspots demonstrativos pré-configurados.
- **Verificação**: Navegar visualmente em 360º pelos 4 ambientes da casa.

### Fase 3: Gerenciamento de Cenas e Criação de Hotspots
- Interface de gerenciamento de cômodos (adicionar foto 360º, renomear cena, definir cena inicial).
- Ferramenta de inserção de hotspots: clique na esfera para obter `pitch` e `yaw`.
- Criação e edição de Hotspots Informativos (com preview de card, título, texto e upload de imagem ilustrativa).
- Criação de Hotspots de Navegação (com escolha do cômodo de destino).
- Operações de duplicar, editar e excluir hotspots.
- **Verificação**: Criar um hotspot novo na sala, conectar à cozinha e verificar transição bidirecional.

### Fase 4: Modo Aluno (Preview Fiel) e Modais Educativos
- Alternância instantânea entre Modo Edição e Modo Aluno (ocultando controles de criação e exibindo apenas a experiência de imersão).
- Modal educativo estilizado com suporte a tipografia acessível, imagens ampliáveis e fechamento prático.
- **Verificação**: Fazer o tour completo no modo aluno exatamente como em uma aula EAD.

### Fase 5: Motor de Exportação HTML Standalone Offline
- Implementação do compressor de imagem em canvas e do template standalone.
- Botão "BAIXAR EXPERIÊNCIA (.HTML)" com modal de progresso.
- Teste de download do arquivo gerado e validação de abertura offline via protocolo `file:///`.
- **Verificação**: Abrir o arquivo exportado em nova aba desacoplada e verificar funcionamento offline e idêntico ao preview.
