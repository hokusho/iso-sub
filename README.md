# ISO SUB — Estúdio Profissional de Legendas Animadas & Virais

> **Aplicação Desktop & Web de Alta Performance** para criação, customização, transcrição com IA e renderização profissional de legendas animadas nos estilos mais virais da internet (**Hormozi, MrBeast, Submagic, TikTok e Reels**).

---

## Quickstart (Como Rodar no seu Computador)

### 1. Pré-requisitos
- **Node.js** (v18 ou superior): [nodejs.org](https://nodejs.org)
- **Git**: [git-scm.com](https://git-scm.com)
- **FFmpeg**: Já incluso e empacotado na estrutura de binários nativos.

---

### 2. Instalação Completa (1 Único Comando)
Abra o terminal na pasta do projeto e execute:
```bash
npm run install:all
```
*Isso instala automaticamente todas as dependências da raiz, do servidor backend e do cliente web/desktop.*

---

### 3. Iniciar o Projeto em Desenvolvimento

**Opção A (Via Terminal):**
```bash
npm run dev
```

**Opção B (No Windows com 1 Clique):**
Basta dar duplo clique no arquivo:
- `INICIAR_APP.bat`

O navegador abrirá automaticamente em:
- **Frontend Studio**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

---

## Principais Recursos & Tecnologias

### Inteligência Artificial & Transcrição
- **Groq Cloud Whisper Large v3**: Transcrição palavra por palavra em menos de **1.5 segundo**.
- **Timestamps Precisos**: Sincronização milimétrica de palavras com waveform de áudio.
- **Divisão Inteligente**: Algoritmo de agrupamento e quebra de blocos em 1 e 2 linhas.

### Personalização Visual & Animações
- **Presets Virais de 1 Clique**: Hormozi Viral, MrBeast Impact, Submagic Roxo, Cyber Ciano, TikTok Minimal e Karaokê.
- **Tipografia & Cores**: Seletor 6x6 com 36 cores vibrantes, destaque de palavra ativa e controle de tamanho com steppers.
- **Efeitos Dinâmicos**: Pop Zoom suave, Bounce, Glow Neon, Contorno e Sombras 3D.
- **Social Safe Zones**: Guias proporcionais para Reels do Instagram, TikTok e Shorts do YouTube.

### Renderização & Exportação
- **Exportação Full HD (MP4 H.264)** com legendas queimadas (*hardcoded*).
- **ProRes 4444 com Canal Alfa**: Exportação transparente para edição no Premiere, Final Cut e DaVinci Resolve.
- **Exportação de Legendas**: Download em `.SRT`, `.VTT` e `.JSON`.

### Proteção, Licenciamento & Segurança
- **Painel Administrativo Privado**: Gestão em tempo real de clientes, seriais e expirações.
- **Autenticação em Nuvem (Supabase)**: Validação instantânea de Nome de Usuário + Chave de Serial.
- **Segurança em Múltiplas Camadas (Tauri v2)**: Bloqueio de DevTools, CSP Restritiva, Proteção de Build e Zero Polling.

---

## Configuração da Chave Gratuita da IA (Groq Whisper)

1. Acesse o console gratuito da Groq: **[console.groq.com/keys](https://console.groq.com/keys)**
2. Faça login com o Google ou GitHub.
3. Clique em **`+ Create API Key`** e copie a sua chave (`gsk_...`).
4. No topo do aplicativo **ISO SUB**, clique no ícone de chave (**`Chave API`**) e salve.

---

## Arquitetura do Repositório

```text
LEGENDAS/
├── client/              # Frontend React 19 + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── assets/      # Logos, Ícones e QR Codes
│   │   ├── components/  # Timeline, Canvas Player, Editores e Modais
│   │   ├── presets/     # Biblioteca de Estilos de Legendas
│   │   ├── services/    # Conexão de Licença e API Client
│   │   └── types/       # Definições TypeScript
│   └── package.json
├── server/              # Backend Node.js + Express + FFmpeg + Whisper
│   ├── src/
│   │   ├── routes/      # Rotas de Upload, Transcrição, Cache e Render
│   │   ├── services/    # ASS Builder, Processador FFmpeg e Gerenciador de Licenças
│   │   └── index.ts     # Servidor Express com suporte a streaming
│   └── storage/         # Armazenamento temporário seguro (.gitignore)
├── src-tauri/           # Aplicativo Desktop Nativo (Tauri v2 + Rust)
│   ├── src/             # Inicialização segura e gerenciamento de processos
│   ├── capabilities/    # Permissões mínimas restritas
│   └── tauri.conf.json  # Configuração de CSP e empacotamento
├── INICIAR_APP.bat      # Launcher rápido para Windows
└── package.json         # Scripts unificados de desenvolvimento e build
```

---

## Créditos & Apoio

Criado por **[@hokusho](https://instagram.com/hokusho)** | **ISO VENENO** **[@isoveneno](https://instagram.com/isoveneno)**

---

## Agradecimentos Especiais

- **Claudio Felis** (code)
- **Francisco Junior** (code)
- **Thiago Dantas** (code)
- **Giullia Siqueira** (design e usabilidade)

---

> *Gostou do projeto? Considere apoiar o desenvolvedor com uma doação via PIX no aplicativo.*
