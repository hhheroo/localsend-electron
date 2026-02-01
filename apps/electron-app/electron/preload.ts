import { ipcRenderer, contextBridge } from 'electron'

// Device info type
interface DeviceInfo {
  deviceName: string
  ips: string[]
  port: string
}

// Client type
interface Client {
  alias: string
  version: string
  deviceModel: string
  deviceType: string
  fingerprint: string
  port: number
  protocol: string
  download: boolean
  address: string
}

// Receive session types
interface ReceiveSessionFile {
  id: string
  fileName: string
  size: number
  fileType: string
}

interface ReceiveSession {
  id: string
  req: {
    info: {
      alias: string
      fingerprint: string
      address?: string
    }
    files: Record<string, ReceiveSessionFile>
  }
  fileTokens: Record<string, string>
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Expose device info API
contextBridge.exposeInMainWorld('electronAPI', {
  // Get device info
  getDeviceInfo: (): Promise<DeviceInfo> => ipcRenderer.invoke('get-device-info'),

  // Get client list
  getClients: (): Promise<Client[]> => ipcRenderer.invoke('get-clients'),

  // Initiate device discovery
  discover: (): Promise<void> => ipcRenderer.invoke('discover'),

  // Send prepare upload request
  sendPrepareUpload: (fingerprint: string, filesMetadata: { path: string; text: boolean }[]): Promise<unknown> => 
    ipcRenderer.invoke('send-prepare-upload', fingerprint, filesMetadata),

  // Send file upload request
  sendUpload: (fingerprint: string, sessionId: string, fileId: string): Promise<unknown> =>
    ipcRenderer.invoke('send-upload', fingerprint, sessionId, fileId),

  // Send cancel upload request
  sendCancel: (fingerprint: string, sessionId: string): Promise<unknown> =>
    ipcRenderer.invoke('send-cancel', fingerprint, sessionId),

  // Client event listeners
  onClientRegistered: (callback: (client: Client) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, client: Client) => callback(client)
    ipcRenderer.on('client-registered', listener)
    return () => ipcRenderer.off('client-registered', listener)
  },

  onClientUnregistered: (callback: (fingerprint: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, fingerprint: string) => callback(fingerprint)
    ipcRenderer.on('client-unregistered', listener)
    return () => ipcRenderer.off('client-unregistered', listener)
  },

  // Receive file event listeners
  onReceiveSessionCreated: (callback: (session: ReceiveSession) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, session: ReceiveSession) => callback(session)
    ipcRenderer.on('receive-session-created', listener)
    return () => ipcRenderer.off('receive-session-created', listener)
  },

  onReceiveSessionCancelled: (callback: (sessionId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string) => callback(sessionId)
    ipcRenderer.on('receive-session-cancelled', listener)
    return () => ipcRenderer.off('receive-session-cancelled', listener)
  },

  onReceiveFileUploaded: (callback: (sessionId: string, fileId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, fileId: string) => callback(sessionId, fileId)
    ipcRenderer.on('receive-file-uploaded', listener)
    return () => ipcRenderer.off('receive-file-uploaded', listener)
  },

  // File/folder selection
  selectFiles: (): Promise<string[]> => ipcRenderer.invoke('select-files'),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),

  // Clipboard
  readClipboardText: (): Promise<string> => ipcRenderer.invoke('read-clipboard-text'),

  // Logger API
  logger: {
    log: (...args: unknown[]) => ipcRenderer.send('renderer-log', 'log', args),
    info: (...args: unknown[]) => ipcRenderer.send('renderer-log', 'info', args),
    warn: (...args: unknown[]) => ipcRenderer.send('renderer-log', 'warn', args),
    error: (...args: unknown[]) => ipcRenderer.send('renderer-log', 'error', args),
    debug: (...args: unknown[]) => ipcRenderer.send('renderer-log', 'debug', args),
  },
})
