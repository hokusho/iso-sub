# 🎬 ISO SUB - Estúdio de Legendas Animadas & Virais

> Aplicação Web Completa (Frontend React/Vite + Backend Node.js/FFmpeg/Whisper) para criação, customização e renderização profissional de legendas dinâmicas estilo Hormozi, MrBeast e Submagic.

---

## ⚡ Como rodar em qualquer computador (Novo Clone)

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior) instalado: [nodejs.org](https://nodejs.org)
- **Git** instalado: [git-scm.com](https://git-scm.com)

---

### 2. Instalação Rápida (1 Comando)
Abra o terminal na pasta do projeto e execute:
```bash
npm run install:all
```
*Isso instalará automaticamente todas as dependências da raiz, do servidor e do cliente frontend.*

---

### 3. Iniciar o Projeto
Para rodar tanto o servidor quanto o frontend juntos:

**Opção A (Via Terminal):**
```bash
npm run dev
```

**Opção B (No Windows):**
Basta dar **duplo clique** no arquivo:
- `INICIAR_APP.bat`

O navegador abrirá automaticamente em:
- **Frontend**: [http://localhost:5173](http://localhost:5173) ou [http://localhost:5174](http://localhost:5174)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🚀 Principais Recursos
- 🚀 **Animações Dinâmicas**: Pop com Zoom suave, Bounce, Só Cor e Karaoke progressivo.
- 🎨 **Seletor de Cores 6x6**: 36 cores virais/Flat UI com conta-gotas na tela, valores RGB e HEX em tempo real.
- 📐 **Modos de 1 e 2 Linhas**: Quebra inteligente com base em pontuação e capacidade de palavras.
- 👁️ **Controle de Linhas (Ocultar/Exibir)**: Botão de olho tipo senha para ocultar qualquer linha do vídeo final.
- 📱 **Social Safe Zones**: Guias proporcionais de Reels do Instagram e TikTok.
- ⚡ **Auto-Transcode para Web**: Suporte nativo para vídeos `.MOV`, `HEVC (iPhone)`, `MP4`, `MKV`, etc.
- 💾 **Exportação Full HD e ProRes 4444 com Canal Alfa Transparente**.

---

## 📁 Estrutura do Projeto
```text
LEGENDAS/
├── client/              # Interface Web (React 19, Vite, TailwindCSS, Lucide)
│   ├── src/             # Componentes, Players, Hooks e Estilos
│   └── package.json
├── server/              # Backend (Express, FFmpeg, Whisper, ASS Builder)
│   ├── src/             # Rotas, Serviços e Tipos
│   ├── storage/         # Armazenamento seguro de uploads e renders
│   └── package.json
├── .gitignore           # Ignora uploads pesados e arquivos temporários
├── INICIAR_APP.bat      # Script de inicialização rápida (Windows)
├── package.json         # Scripts unificados
└── README.md
```
