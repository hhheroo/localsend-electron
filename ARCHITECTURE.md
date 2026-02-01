# LocalSend Electron Project Architecture

## Project Overview

This is an Electron-based LocalSend client implementation for file transfer within local networks. The project uses Rush monorepo architecture to manage multiple packages.

## Tech Stack

| Category | Technology |
|----------|------------|
| Monorepo Management | Rush 5.166.0 + pnpm 10.28.0 |
| Runtime | Node.js 20 |
| Desktop Framework | Electron 26 |
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | UnoCSS (atomic CSS) |
| HTTP Server | Hono + @hono/node-server |
| HTTP Client | fetch (Node.js native) + undici |
| Logging | electron-log |

## Project Structure

```
localsend-electron/
├── rush.json                    # Rush configuration
├── apps/
│   ├── common/                  # Shared types and utilities
│   │   └── src/
│   │       ├── globals/         # Global polyfills
│   │       ├── type/            # Shared type definitions
│   │       └── utils/           # Utility functions
│   │
│   ├── protocol-service/        # LocalSend protocol service
│   │   └── src/
│   │       ├── client/          # Client (send files)
│   │       ├── server/          # Server (receive files)
│   │       ├── discovery/       # Device discovery (UDP multicast)
│   │       ├── manager/         # Various managers
│   │       └── consts/          # Constants
│   │
│   ├── electron-app/            # Electron desktop app
│   │   ├── electron/            # Main process code
│   │   └── src/                 # Renderer process code (React)
│   │
│   └── cli-app/                 # CLI app (incomplete)
│
└── common/                      # Rush configuration directory
```

## Core Packages

### 1. @localsend/common

Shared type definitions and utility functions:

- **Announcement type**: Device broadcast message format
- **Device type**: Device information structure
- **generateSelfSignedCertificate**: Generate self-signed HTTPS certificate
- **makeAlias**: Generate device alias

### 2. @localsend/protocol-service

Complete LocalSend protocol implementation:

#### Server (Receive Files)

```
server/
├── index.ts                    # Hono HTTP server
└── routes/
    ├── prepare-upload.ts       # POST /prepare-upload - Receive upload preparation request
    ├── upload.ts               # POST /upload - Receive file data
    ├── cancel.ts               # POST /cancel - Cancel transfer
    └── register.ts             # POST /register - Device registration
```

#### Client (Send Files)

```
client/
├── index.ts                    # Client class - File sending logic
│   ├── sendPrepareUpload()     # Send upload preparation request
│   ├── sendUpload()            # Send file data
│   └── sendCancel()            # Cancel transfer
└── file.ts                     # File class - File handling
    └── toReadableStream()      # Convert to readable stream
```

#### Device Discovery

```
discovery/
├── abstract.ts                 # Abstract base class
├── multicast.ts                # UDP multicast implementation
└── index.ts                    # Discovery class
```

- **Port**: 53317 (TCP/HTTPS + UDP)
- **Multicast Address**: 224.0.0.167

#### Managers

```
manager/
├── config.ts                   # ConfigManager - Configuration and device info
├── client.ts                   # ClientManager - Manage discovered devices
├── session.ts                  # SessionManager - Manage transfer sessions
└── logger.ts                   # LoggerManager - Logging management
```

### 3. @localsend/electron-app

Electron desktop application:

#### Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process (main.ts)                   │
│  - Window management                                         │
│  - IPC handling (ipc-handlers.ts)                           │
│  - Service event forwarding (service-events.ts)             │
│  - Service management (service-manager.ts)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ fork()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Service Worker (service-worker.ts)             │
│  - Run LocalSendService                                      │
│  - Client discovery and management                           │
│  - File transfer protocol                                    │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Renderer Process (React)                       │
│  - UI rendering                                              │
│  - Communicate with main process via preload API            │
└─────────────────────────────────────────────────────────────┘
```

#### Main Process Files

| File | Responsibility |
|------|----------------|
| `main.ts` | App entry, window creation and lifecycle |
| `preload.ts` | Preload script, expose API to renderer |
| `service-manager.ts` | Manage service-worker child process |
| `service-worker.ts` | Worker process running LocalSendService |
| `ipc-handlers.ts` | Centralized IPC handlers |
| `service-events.ts` | Service event listening and forwarding |

#### Renderer Process Files

```
src/
├── App.tsx                     # Root component
├── main.tsx                    # React entry
├── components/
│   ├── Sidebar.tsx             # Sidebar navigation
│   ├── ReceiveProgressModal.tsx # Receive progress modal
│   ├── HeaderIcons.tsx         # Header info icon and popup
│   └── ...
├── pages/
│   ├── SendPage.tsx            # Send page (includes AddressInputModal, TextInputModal)
│   └── ReceivePage.tsx         # Receive page
├── hooks/
│   ├── useClients.ts           # Manage client list
│   ├── useDeviceInfo.ts        # Get device info
│   └── useReceiveProgress.ts   # Receive progress state (global)
├── types/
│   └── electron.d.ts           # Electron API type definitions
└── utils/
    └── logger.ts               # Renderer process logger
```

## IPC Communication

### Request-Response Pattern (ipcMain.handle / ipcRenderer.invoke)

| Channel | Description | Return Value |
|---------|-------------|--------------|
| `get-device-info` | Get device info | `{ deviceName, ips, port }` |
| `get-clients` | Get current client list | `Client[]` |
| `discover` | Initiate device discovery | `void` |
| `send-prepare-upload` | Send upload preparation request | `PrepareUploadResult` |
| `send-upload` | Send file | `UploadResult` |
| `send-cancel` | Cancel transfer | `{ success: boolean }` |
| `select-files` | Select files | `string[]` |
| `select-folder` | Select folder | `string \| null` |
| `read-clipboard-text` | Read clipboard | `string` |

### Event Push Pattern (webContents.send / ipcRenderer.on)

| Event | Description | Data |
|-------|-------------|------|
| `client-registered` | New client registered | `Client` |
| `client-unregistered` | Client left | `fingerprint: string` |
| `receive-session-created` | Receive request received | `ReceiveSession` |
| `receive-session-cancelled` | Receive cancelled | `sessionId: string` |
| `receive-file-uploaded` | File receive complete | `sessionId, fileId` |
| `renderer-log` | Renderer process log | `level, args` |

## File Transfer Flow

### Send File Flow

```
1. User selects file/folder/text
2. User clicks target device (or manually enters address via Scan button)
3. Call sendPrepareUpload() → Get sessionId and fileTokens
4. Call sendUpload() for each file → Stream upload
5. Display progress and completion status
```

### Manual Address Input

Users can manually connect to a device by clicking the Scan button:

- **Hashtag Mode**: Enter only the last segment of IP (e.g., `123` → `192.168.1.123`)
- **IP Address Mode**: Enter full IP address (e.g., `192.168.1.100`)

The IP prefix is automatically detected from the local device's network.

### Receive File Flow

```
1. Receive POST /prepare-upload request
2. SessionManager creates session, triggers session-created event
3. Frontend displays receive progress UI
4. Receive POST /upload request, write file
5. Trigger file-uploaded event, update UI
6. Display completion status when all files done
```

### Cancel Transfer

Sender:
- Call `sendCancel()`
- AbortController aborts ongoing HTTP request
- Send POST /cancel to receiver

Receiver:
- Receive cancel request or sender disconnects
- SessionManager triggers session-removed event
- Frontend displays cancelled status

## Configuration and Ports

| Configuration | Value |
|---------------|-------|
| HTTP/HTTPS Port | 53317 |
| UDP Multicast Port | 53317 |
| Multicast Address | 224.0.0.167 |
| TLS | Self-signed certificate (rejectUnauthorized: false) |

## Development Commands

```bash
# Install dependencies
rush install

# Build all projects
rush build

# Build specific project with dependencies
rush build -T @localsend/electron-app

# Development mode
cd apps/electron-app
yarn dev

# Package
cd apps/electron-app
yarn build
```

## Logging System

- **Main Process**: Use `electron-log`, create via `log.scope('ModuleName')`
- **Renderer Process**: Use `src/utils/logger.ts`, outputs to both console and sends to main process via IPC
- **Service Worker**: Use IPC Logger, sends messages to main process

## Custom Colors (UnoCSS)

| Name | Value | Usage |
|------|-------|-------|
| `primary` | `#1b8b7d` | Primary color |
| `primary-light` | `#2aa396` | Primary light |
| `sidebar-bg` | `#e8eeed` | Sidebar background |
| `content-bg` | `#f5f7f6` | Content area background |

## Notes

1. **TLS Certificate**: Uses self-signed certificate, need to disable certificate validation
2. **AbortController**: Used to cancel ongoing file uploads
3. **Stream Transfer**: Use `fs.createReadStream` + `Readable.toWeb` for large file transfer
4. **Buffer Size**: `highWaterMark` set to 10MB to optimize transfer performance
5. **Window Close**: Clicking close button completely exits the program (including macOS)
