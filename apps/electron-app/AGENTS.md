# LocalSend Electron App - Development Guide

> **Important**: Before starting any task, please read [ARCHITECTURE.md](../../ARCHITECTURE.md) in the project root to understand the complete architecture and design decisions.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite + Electron |
| Styling | UnoCSS (atomic CSS) |
| Component Format | Functional components (.tsx) |
| Logging | electron-log |
| Package Manager | pnpm (monorepo) |

## Project Structure

```
apps/electron-app/
├── electron/                    # Electron main process code
│   ├── main.ts                  # Main process entry, window creation and lifecycle
│   ├── preload.ts               # Preload script, expose API to renderer
│   ├── service-manager.ts       # Service manager, manage child process
│   ├── service-worker.ts        # Service worker, run LocalSend protocol
│   ├── ipc-handlers.ts          # IPC handlers, centralized ipcMain.handle
│   └── service-events.ts        # Service event listening and forwarding
├── src/                         # Renderer process code (React)
│   ├── components/              # Reusable components
│   │   ├── Sidebar.tsx          # Sidebar navigation
│   │   ├── AppLogo.tsx          # App logo
│   │   ├── HeaderIcons.tsx      # Header icons and popups
│   │   └── QuickSaveToggle.tsx  # Quick save toggle
│   ├── pages/                   # Page components
│   │   ├── ReceivePage.tsx      # Receive page
│   │   └── SendPage.tsx         # Send page (includes AddressInputModal, TextInputModal)
│   ├── hooks/                   # Custom hooks
│   │   ├── useDeviceInfo.ts     # Get device info
│   │   ├── useClients.ts        # Manage client list
│   │   └── useReceiveProgress.ts # Receive progress state
│   ├── types/                   # Type definitions
│   │   └── electron.d.ts        # Electron API types
│   ├── utils/                   # Utilities
│   │   └── logger.ts            # Renderer process logger
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # React entry
└── uno.config.mjs               # UnoCSS configuration
```

## Architecture Design

### Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process (main.ts)                   │
│  - Window management                                         │
│  - IPC handling (ipc-handlers.ts)                           │
│  - Service event forwarding (service-events.ts)             │
└──────────────────────┬──────────────────────────────────────┘
                       │ fork()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Service Worker (service-worker.ts)             │
│  - Run @localsend/protocol-service                          │
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

### IPC Communication

**Request-Response Pattern (ipcMain.handle / ipcRenderer.invoke):**

| Channel | Description | Return Value |
|---------|-------------|--------------|
| `get-device-info` | Get device info | `{ deviceName, ips, port }` |
| `get-clients` | Get current client list | `Client[]` |
| `discover` | Initiate device discovery | `void` |
| `send-prepare-upload` | Send upload preparation | `PrepareUploadResult` |
| `send-upload` | Send file | `UploadResult` |
| `send-cancel` | Cancel transfer | `{ success: boolean }` |

**Event Push Pattern (webContents.send / ipcRenderer.on):**

| Event | Description | Data |
|-------|-------------|------|
| `client-registered` | New client registered | `Client` |
| `client-unregistered` | Client left | `fingerprint: string` |
| `receive-session-created` | Receive request | `ReceiveSession` |
| `receive-session-cancelled` | Receive cancelled | `sessionId` |
| `receive-file-uploaded` | File received | `sessionId, fileId` |

### Preload API

```typescript
interface ElectronAPI {
  getDeviceInfo: () => Promise<ElectronDeviceInfo>
  getClients: () => Promise<Client[]>
  discover: () => Promise<void>
  sendPrepareUpload: (fingerprint, filesMetadata) => Promise<PrepareUploadResult>
  sendUpload: (fingerprint, sessionId, fileId) => Promise<UploadResult>
  sendCancel: (fingerprint, sessionId) => Promise<{ success: boolean }>
  onClientRegistered: (callback) => () => void
  onClientUnregistered: (callback) => () => void
  onReceiveSessionCreated: (callback) => () => void
  onReceiveSessionCancelled: (callback) => () => void
  onReceiveFileUploaded: (callback) => () => void
  selectFiles: () => Promise<string[]>
  selectFolder: () => Promise<string | null>
  readClipboardText: () => Promise<string>
  logger: { log, info, warn, error, debug }
}
```

## SendPage Features

The SendPage includes several modal components:

### AddressInputModal
Manual device connection with two modes:
- **Hashtag Mode**: Enter last IP segment (e.g., `123` → `192.168.1.123`)
- **IP Address Mode**: Enter full IP address

### TextInputModal
Enter text content to send as a file.

### Selection Options
- File selection (multi-select)
- Folder selection
- Text input
- Clipboard paste

### Toolbar Actions
- **Refresh**: Re-discover devices on network
- **Scan**: Open manual address input modal

## Styling Guidelines

### UnoCSS Configuration

Use UnoCSS atomic class names, config file: `uno.config.mjs`

**Custom Colors:**

| Name | Value | Usage |
|------|-------|-------|
| `primary` | `#1b8b7d` | Primary color |
| `primary-light` | `#2aa396` | Primary light |
| `sidebar-bg` | `#e8eeed` | Sidebar background |
| `content-bg` | `#f5f7f6` | Content background |

**Usage Example:**

```tsx
// ✅ GOOD - Use UnoCSS class names
<div className="flex items-center gap-4 p-4 bg-sidebar-bg rounded-lg">
  <span className="text-lg font-semibold text-black">Title</span>
</div>

// ❌ BAD - Don't use CSS files or inline styles
<div style={{ display: 'flex' }}>
```

### Font Guidelines

- All text color: `text-black`
- Monospace font: `font-mono` (for IP, port, device ID)
- Letter spacing: `tracking-tight` (compact) or `tracking-wide` (loose)

## Component Guidelines

### Functional Components

```tsx
// components/ExampleComponent.tsx
import { useState, useEffect } from 'react'

interface ExampleComponentProps {
  title: string
  onAction?: () => void
}

export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div className="flex items-center p-4">
      <span className="text-black font-medium">{title}</span>
    </div>
  )
}
```

### Custom Hooks

```tsx
// hooks/useExample.ts
import { useState, useEffect } from 'react'

export function useExample() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getData()
        setData(result)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  return { data, loading }
}
```

## Electron Guidelines

### Logging

Use `electron-log` for logging:

```typescript
// Main process
import log from 'electron-log'
const logger = log.scope('ModuleName')
logger.info('Info log')
logger.error('Error log', error)
logger.debug('Debug log')

// Renderer process
import { logger } from '../utils/logger'
logger.log('Log message')
logger.error('Error message', error)
```

### Service Manager

`ServiceManager` uses EventEmitter pattern:

```typescript
// Listen to events
serviceManager.on('started', () => { /* ... */ })
serviceManager.on('stopped', () => { /* ... */ })
serviceManager.on('error', (message) => { /* ... */ })
serviceManager.on('client-registered', (client) => { /* ... */ })
serviceManager.on('client-unregistered', (fingerprint) => { /* ... */ })

// Call methods
await serviceManager.startService()
await serviceManager.stopService()
const info = await serviceManager.getDeviceInfo()
const clients = await serviceManager.getClients()
```

### Modular IPC Handlers

All `ipcMain.handle` registrations are centralized in `ipc-handlers.ts`:

```typescript
// electron/ipc-handlers.ts
export function registerIPCHandlers() {
  ipcMain.handle('get-device-info', async () => { /* ... */ })
  ipcMain.handle('get-clients', async () => { /* ... */ })
}
```

### Service Event Forwarding

Service event listening and forwarding is centralized in `service-events.ts`:

```typescript
// electron/service-events.ts
export function setMainWindow(win: BrowserWindow | null) { /* ... */ }
export function registerServiceEvents() {
  serviceManager.on('client-registered', (client) => {
    mainWindow?.webContents.send('client-registered', client)
  })
}
```

## Window Configuration

```typescript
new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
})
```

## Dependencies

### Main Dependencies

- `@localsend/protocol-service` - LocalSend protocol service (workspace dependency)
- `electron` - Electron framework
- `electron-log` - Logging library
- `react` / `react-dom` - React framework
- `vite` - Build tool
- `unocss` - Atomic CSS

### UnoCSS Presets

- `@unocss/preset-uno` - Default preset
- `@unocss/preset-attributify` - Attributify mode
- `@unocss/preset-icons` - Icons preset
