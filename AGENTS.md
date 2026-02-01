# LocalSend Electron - AI Agent Guide

> **Important**: Before starting any task, please read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the complete project architecture and design decisions.

## Project Overview

This is an Electron-based LocalSend client implementation using Rush monorepo architecture.

## Required Reading

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture documentation (required)
   - Project structure
   - Core packages
   - Process architecture
   - IPC communication
   - File transfer flow

2. **[apps/electron-app/AGENTS.md](./apps/electron-app/AGENTS.md)** - Electron app development guide
   - Styling guidelines
   - Component guidelines
   - Electron guidelines

## Project Structure

```
localsend-electron/
├── ARCHITECTURE.md              # Architecture documentation (required)
├── AGENTS.md                    # AI Agent guide (this file)
├── apps/
│   ├── common/                  # Shared types and utilities
│   ├── protocol-service/        # LocalSend protocol service
│   ├── electron-app/            # Electron desktop app
│   └── cli-app/                 # CLI app
└── rush.json                    # Rush configuration
```

## Core Packages

| Package | Path | Description |
|---------|------|-------------|
| `@localsend/common` | `apps/common` | Shared types and utilities |
| `@localsend/protocol-service` | `apps/protocol-service` | LocalSend protocol implementation |
| `@localsend/electron-app` | `apps/electron-app` | Electron desktop app |

## Development Commands

```bash
# Install dependencies
rush install

# Build all projects
rush build

# Build specific project
rush build -T @localsend/electron-app

# Development mode
cd apps/electron-app && yarn dev
```

## Key Technical Points

1. **Process Architecture**: Main Process → Service Worker (fork) → Renderer Process
2. **Protocol Port**: 53317 (TCP/HTTPS + UDP multicast)
3. **TLS**: Self-signed certificates
4. **Logging**: electron-log (main process) + IPC forwarding (renderer process)

## Task Handling Suggestions

1. **Modify Electron app**: Read `apps/electron-app/AGENTS.md` first
2. **Modify protocol logic**: Check `apps/protocol-service/src/`
3. **Modify IPC communication**: See IPC section in `ARCHITECTURE.md`
4. **Modify UI**: Use UnoCSS, check `apps/electron-app/uno.config.mjs`
