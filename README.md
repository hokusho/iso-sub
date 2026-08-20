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

## 🔑 Como Obter as Chaves de API (Transcrição Automática Whisper)

O aplicativo utiliza modelos Whisper de IA para transcrever o áudio do vídeo palavra por palavra em segundos. Suas chaves de API ficam salvas **apenas no armazenamento privado do seu navegador (localStorage)** e nunca são enviadas ou salvas no repositório.

### Opção 1: Groq Cloud (Recomendada — 100% Gratuita & Ultrarrápida ⚡)
A API da Groq transcreve vídeos de 1 minuto em menos de 2 segundos com o modelo `whisper-large-v3-turbo` sem custo:
1. Acesse o console da Groq: **[console.groq.com](https://console.groq.com)**
2. Crie uma conta gratuita (com Google ou GitHub).
3. No menu lateral esquerdo, clique em **API Keys**.
4. Clique no botão **`+ Create API Key`**.
5. Dê um nome (ex: `ISO-SUB`) e copie a chave gerada (começa com `gsk_...`).

---

### Opção 2: OpenAI Whisper (Opcional)
Se preferir utilizar a API oficial da OpenAI:
1. Acesse: **[platform.openai.com/api-keys](https://platform.openai.com/api-keys)**
2. Crie sua conta ou faça login.
3. Clique em **`Create new secret key`**.
4. Copie a chave gerada (começa com `sk-...`).

---

### 📌 Onde Inserir a Chave no Aplicativo:
1. Abra o **ISO SUB** no seu navegador.
2. No menu superior (Navbar), clique no ícone de chave / configurações (**`🔑 API Keys`**).
3. Cole a sua chave da **Groq** ou da **OpenAI** no campo correspondente e clique em **`Salvar Chaves`**.
4. Pronto! O botão **`Gerar Legendas`** agora transcreverá qualquer vídeo instantaneamente.

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
