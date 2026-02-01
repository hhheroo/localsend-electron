# LocalSend Electron

An Electron-based [LocalSend](https://localsend.org/) client implementation for file transfer within local networks.

## Features

- Automatic device discovery on LAN
- Manual device connection via IP address or hashtag
- Send files/folders
- Send text/clipboard content
- Real-time transfer progress
- Cancel transfers
- Cross-platform support (macOS/Windows/Linux)

## Tech Stack

| Category | Technology |
|----------|------------|
| Monorepo | Rush + pnpm |
| Desktop Framework | Electron 26 |
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | UnoCSS |
| HTTP Server | Hono |
| Logging | electron-log |

## Project Structure

```
localsend-electron/
├── apps/
│   ├── common/              # Shared types and utilities
│   ├── protocol-service/    # LocalSend protocol service
│   ├── electron-app/        # Electron desktop app
│   └── cli-app/             # CLI app (in development)
├── ARCHITECTURE.md          # Architecture documentation
└── rush.json                # Rush configuration
```

## Quick Start

### Requirements

- Node.js 20+
- Rush (`npm install -g @microsoft/rush`)

### Install Dependencies

```bash
rush install
```

### Build

```bash
# Build all projects
rush build

# Build specific project with dependencies
rush build -T @localsend/electron-app
```

### Development Mode

```bash
cd apps/electron-app
yarn dev
```

### Package App

```bash
cd apps/electron-app
yarn build
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [apps/electron-app/AGENTS.md](./apps/electron-app/AGENTS.md) - Electron app development guide

## LocalSend Protocol

This project implements the LocalSend protocol, compatible with official LocalSend clients:

- **Port**: 53317 (TCP/HTTPS + UDP)
- **Discovery**: UDP multicast (224.0.0.167:53317)
- **Transfer**: HTTPS (self-signed certificate)

## License

MIT
