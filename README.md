# EAD 360 Studio 🌐

Plataforma interativa para criação, edição e visualização de ambientes e tours educacionais em **360°**. Permite conectar múltiplos cômodos através de setas de navegação, adicionar hotspots informativos com textos, fotos e diagramas, e exportar tudo em um **único arquivo HTML 100% autônomo offline** (pronto para uso em AVA/LMS como Moodle, Blackboard, Canvas ou diretamente em qualquer navegador).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)

### Passo a passo
1. Clone este repositório:
```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
cd NOME-DO-REPOSITORIO
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no seu navegador o endereço indicado (por padrão `http://localhost:3000`).

---

## 📦 Como Publicar no GitHub e GitHub Pages

Este repositório já está 100% configurado para publicação automática no **GitHub Pages** via **GitHub Actions** (`.github/workflows/deploy.yml`) e com caminhos relativos no Vite (`base: './'`).

### 1. Criar o repositório no GitHub
1. Acesse [github.com/new](https://github.com/new) e crie um novo repositório (ex: `ead-360-studio`).
2. No seu terminal local, conecte e envie os arquivos:
```bash
git init
git add .
git commit -m "feat: versão inicial do EAD 360 Studio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/ead-360-studio.git
git push -u origin main
```

### 2. Ativar o GitHub Pages no Repositório
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** > **Source**, selecione a opção **GitHub Actions**.
4. Pronto! O workflow configurado em `.github/workflows/deploy.yml` será acionado automaticamente a cada commit na branch `main` e publicará o site na URL:
   `https://SEU-USUARIO.github.io/ead-360-studio/`

---

## ✨ Principais Funcionalidades

- **Navegação Imersiva 360°**: Visualização esférica suave com suporte a mouse, touch e rotação fluida.
- **Setas de Mudança de Cômodo**:
  - No modo **Configuração**: Arraste livremente as setas para a posição desejada na imagem 360°. As coordenadas vertical e horizontal sincronizam em tempo real nos campos de Orientação Espacial. Clicar nas setas seleciona para edição sem trocar de cômodo.
  - No modo **Preview**: Clicar na seta navega imediatamente para o ambiente conectado.
- **Hotspots Informativos**: Inserção de pontos de estudo com explicações pedagógicas, fotos ou diagramas (via upload de arquivo ou URL da web).
- **Gerenciamento Aninhado de Cômodos**:
  - Hotspots e setas organizados diretamente sob cada ambiente.
  - Clique na foto do cômodo para trocar a imagem 360° a qualquer momento.
  - Clique no nome do cômodo para recolher/expandir o menu.
- **Opções Gerais de Personalização**:
  - Escolha da cor dos hotspots informativos e das setas.
  - Efeito suave de pulsar/piscar.
  - Seleção de setas direcionais (direita, esquerda, cima, baixo, diagonais, bússola, porta).
  - Controle de exibição dos controles de zoom/tela cheia e barra de navegação inferior.
- **Exportação Standalone Offline**: Baixe um arquivo HTML único e independente com todas as imagens e bibliotecas embutidas em Base64, funcionando até sem conexão com a internet.
- **Criar Novo Tour**: Inicie um projeto do zero a qualquer momento com apenas um clique.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite** (configurado com caminhos relativos)
- **Tailwind CSS**
- **Pannellum 360°**
- **Lucide Icons**
- **IndexedDB** (persistência local no navegador)
- **GitHub Actions** (CI/CD para GitHub Pages)

---

## 📄 Licença
Distribuído sob a licença [Apache 2.0](LICENSE).
