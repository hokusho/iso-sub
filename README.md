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

## 🔑 Como Obter a Chave de IA Gratuita (Transcrição Whisper na Groq)

O aplicativo utiliza o modelo de inteligência artificial **Whisper Large v3** através da **Groq Cloud** para transcrever vídeos palavra por palavra em menos de 2 segundos.

Sua chave de API fica salva **apenas no armazenamento privado do seu computador local (localStorage)** e nunca é enviada para servidores de terceiros ou compartilhada.

---

### 📊 Limites Oficiais do Plano Gratuito da Groq *(Atualizado em: 21 de Agosto de 2026)*:

| Especificação | Limite Oficial Gratuito |
| :--- | :--- |
| **Custo** | **100% Gratuito** (Sem cartão de crédito) |
| **Limite por Hora** | **2 Horas de áudio por hora** (7.200 segundos/hora) |
| **Limite por Minuto** | **20 requisições por minuto** (RPM) |
| **Capacidade Diária Estimada** | **+150 vídeos curtos (Reels/TikTok)** ou **+30 vídeos longos (YouTube)** |
| **Velocidade Média** | **~1.5 segundo** para transcrever 1 minuto de fala |
| **Modelo Utilizado** | `whisper-large-v3` / `whisper-large-v3-turbo` com timestamps de palavras |

---

### 🚀 Como Criar Sua Chave Gratuita em 30 Segundos:
1. Acesse o console da Groq: **[console.groq.com](https://console.groq.com)**
2. Crie ou acesse sua conta gratuitamente usando seu login do Google ou GitHub.
3. No menu lateral esquerdo, clique em **API Keys**.
4. Clique no botão **`+ Create API Key`**.
5. Dê um nome (ex: `ISO-SUB`) e copie a chave gerada (começa com `gsk_...`).

---

### 📌 Como Inserir no Aplicativo:
1. Abra o **ISO SUB** (Web ou Executável Desktop).
2. No menu superior, clique no ícone de raio/chave (**`⚡ IA Whisper`**).
3. Cole a sua chave da **Groq** (`gsk_...`) e clique em **`Salvar Chave`**.
4. Pronto! A chave fica salva para sempre no seu computador e você pode transcrever ilimitadamente.

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
