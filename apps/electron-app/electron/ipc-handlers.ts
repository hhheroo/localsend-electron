/**
 * IPC Handlers
 * Register all IPC handlers
 */
import os from 'node:os'
import { ipcMain, dialog, clipboard } from 'electron'
import log from 'electron-log'
import { serviceManager } from './service-manager'

const logger = log.scope('IPC')

// ============ Type Definitions ============

export interface DeviceInfo {
  deviceName: string
  ips: string[]
  port: string
}

// ============ Helper Functions ============

// Get local IP address list
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces()
  const ips: string[] = []

  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name]
    if (!netInterface) continue

    for (const net of netInterface) {
      // Only get IPv4 addresses, exclude internal addresses (127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address)
      }
    }
  }

  logger.debug('Found local IPs:', ips)
  return ips
}

// Get device info
async function getDeviceInfo(): Promise<DeviceInfo> {
  const ips = getLocalIPs()

  // Prefer getting device name from service configManager
  if (serviceManager.getStatus()) {
    try {
      const serviceDeviceInfo = await serviceManager.getDeviceInfo() as { alias?: string; port?: number }
      return {
        deviceName: serviceDeviceInfo.alias || os.hostname(),
        ips,
        port: String(serviceDeviceInfo.port || 53317)
      }
    } catch (error) {
      logger.warn('Failed to get device info from service:', error)
    }
  }

  // Fallback to system info
  return {
    deviceName: os.hostname(),
    ips,
    port: '53317'
  }
}

// Get client list
async function getClients(): Promise<unknown[]> {
  if (serviceManager.getStatus()) {
    try {
      return await serviceManager.getClients()
    } catch (error) {
      logger.error('Failed to get clients:', error)
    }
  }
  return []
}

// Initiate device discovery
async function discover(): Promise<void> {
  if (serviceManager.getStatus()) {
    try {
      await serviceManager.discover()
    } catch (error) {
      logger.error('Failed to discover:', error)
    }
  }
}

// Send prepare upload request
async function sendPrepareUpload(
  fingerprint: string, 
  filesMetadata: { path: string; text: boolean }[]
): Promise<unknown> {
  if (serviceManager.getStatus()) {
    try {
      return await serviceManager.sendPrepareUpload(fingerprint, filesMetadata)
    } catch (error) {
      logger.error('Failed to send prepare upload:', error)
      throw error
    }
  }
  throw new Error('Service not running')
}

// Send file upload request
async function sendUpload(fingerprint: string, sessionId: string, fileId: string): Promise<unknown> {
  if (serviceManager.getStatus()) {
    try {
      return await serviceManager.sendUpload(fingerprint, sessionId, fileId)
    } catch (error) {
      logger.error('Failed to send upload:', error)
      throw error
    }
  }
  throw new Error('Service not running')
}

// Send cancel upload request
async function sendCancel(fingerprint: string, sessionId: string): Promise<unknown> {
  if (serviceManager.getStatus()) {
    try {
      return await serviceManager.sendCancel(fingerprint, sessionId)
    } catch (error) {
      logger.error('Failed to send cancel:', error)
      throw error
    }
  }
  throw new Error('Service not running')
}

// Select files
async function selectFiles(): Promise<string[]> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files'
  })

  if (result.canceled) {
    logger.debug('File selection canceled')
    return []
  }

  logger.debug('Selected files:', result.filePaths)
  return result.filePaths
}

// Select folder
async function selectFolder(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Folder'
  })

  if (result.canceled || result.filePaths.length === 0) {
    logger.debug('Folder selection canceled')
    return null
  }

  logger.debug('Selected folder:', result.filePaths[0])
  return result.filePaths[0]
}

// Read clipboard text
function readClipboardText(): string {
  const text = clipboard.readText()
  logger.debug('Read clipboard text, length:', text.length)
  return text
}

// ============ Register IPC Handlers ============

export function registerIPCHandlers() {
  // Get device info
  ipcMain.handle('get-device-info', async () => {
    logger.debug('get-device-info called')
    return await getDeviceInfo()
  })

  // Get client list
  ipcMain.handle('get-clients', async () => {
    logger.debug('get-clients called')
    return await getClients()
  })

  // Initiate device discovery
  ipcMain.handle('discover', async () => {
    logger.debug('discover called')
    return await discover()
  })

  // Send prepare upload request
  ipcMain.handle('send-prepare-upload', async (_, fingerprint: string, filesMetadata: { path: string; text: boolean }[]) => {
    logger.debug('send-prepare-upload called', fingerprint, filesMetadata)
    return await sendPrepareUpload(fingerprint, filesMetadata)
  })

  // Send file upload request
  ipcMain.handle('send-upload', async (_, fingerprint: string, sessionId: string, fileId: string) => {
    logger.debug('send-upload called', fingerprint, sessionId, fileId)
    return await sendUpload(fingerprint, sessionId, fileId)
  })

  // Send cancel upload request
  ipcMain.handle('send-cancel', async (_, fingerprint: string, sessionId: string) => {
    logger.debug('send-cancel called', fingerprint, sessionId)
    return await sendCancel(fingerprint, sessionId)
  })

  // Select files
  ipcMain.handle('select-files', async () => {
    logger.debug('select-files called')
    return await selectFiles()
  })

  // Select folder
  ipcMain.handle('select-folder', async () => {
    logger.debug('select-folder called')
    return await selectFolder()
  })

  // Read clipboard text
  ipcMain.handle('read-clipboard-text', () => {
    logger.debug('read-clipboard-text called')
    return readClipboardText()
  })

  // Renderer process logs
  const rendererLogger = log.scope('Renderer')
  ipcMain.on('renderer-log', (_, level: string, args: unknown[]) => {
    switch (level) {
      case 'log':
        rendererLogger.log(...args)
        break
      case 'info':
        rendererLogger.info(...args)
        break
      case 'warn':
        rendererLogger.warn(...args)
        break
      case 'error':
        rendererLogger.error(...args)
        break
      case 'debug':
        rendererLogger.debug(...args)
        break
    }
  })
}
