// Device info type
export interface ElectronDeviceInfo {
  deviceName: string
  ips: string[]
  port: string
}

// Client type
export interface Client {
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

// Prepare upload response type
export interface PrepareUploadResult {
  success: boolean
  error?: string
  status?: number
  filesInfo?: {
    sessionId: string
    files: Record<string, string> // fileId -> token
  }
}

// Upload response type
export interface UploadResult {
  success: boolean
  error?: string
  status?: number
  cancelled?: boolean
}

// File metadata type
export interface FileMetadata {
  path: string
  text: boolean
}

// Receive session file type
export interface ReceiveSessionFile {
  id: string
  fileName: string
  size: number
  fileType: string
}

// Receive session type
export interface ReceiveSession {
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

// Declare electronAPI on window
declare global {
  interface Window {
    electronAPI?: {
      // Device info
      getDeviceInfo: () => Promise<ElectronDeviceInfo>
      // Get client list
      getClients: () => Promise<Client[]>
      // Initiate device discovery
      discover: () => Promise<void>
      // Send prepare upload request
      sendPrepareUpload: (fingerprint: string, filesMetadata: FileMetadata[]) => Promise<PrepareUploadResult>
      // Send file upload request
      sendUpload: (fingerprint: string, sessionId: string, fileId: string) => Promise<UploadResult>
      // Send cancel upload request
      sendCancel: (fingerprint: string, sessionId: string) => Promise<{ success: boolean }>
      // Client event listeners
      onClientRegistered: (callback: (client: Client) => void) => () => void
      onClientUnregistered: (callback: (fingerprint: string) => void) => () => void
      // Receive file event listeners
      onReceiveSessionCreated: (callback: (session: ReceiveSession) => void) => () => void
      onReceiveSessionCancelled: (callback: (sessionId: string) => void) => () => void
      onReceiveFileUploaded: (callback: (sessionId: string, fileId: string) => void) => () => void
      // File/folder selection
      selectFiles: () => Promise<string[]>
      selectFolder: () => Promise<string | null>
      // Clipboard
      readClipboardText: () => Promise<string>
      // Logger
      logger: {
        log: (...args: unknown[]) => void
        info: (...args: unknown[]) => void
        warn: (...args: unknown[]) => void
        error: (...args: unknown[]) => void
        debug: (...args: unknown[]) => void
      }
    }
    ipcRenderer?: {
      on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      off: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}
