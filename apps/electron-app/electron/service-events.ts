/**
 * Service Events
 * Manage serviceManager event listening and forwarding
 */
import type { BrowserWindow } from 'electron'
import log from 'electron-log'
import { serviceManager } from './service-manager'

const logger = log.scope('ServiceEvents')

let mainWindow: BrowserWindow | null = null

// Set main window reference
export function setMainWindow(win: BrowserWindow | null) {
  mainWindow = win
}

// Register service event listeners
export function registerServiceEvents() {
  // Listen to service status
  serviceManager.on('started', () => {
    logger.info('LocalSend service started')
  })

  serviceManager.on('stopped', () => {
    logger.info('LocalSend service stopped')
  })

  serviceManager.on('error', (message) => {
    logger.error('LocalSend service error:', message)
  })

  // Listen to client events
  serviceManager.on('client-registered', (client) => {
    logger.info('Client registered:', client)
    // Forward to renderer process
    mainWindow?.webContents.send('client-registered', client)
  })

  serviceManager.on('client-unregistered', (fingerprint) => {
    logger.info('Client unregistered:', fingerprint)
    // Forward to renderer process
    mainWindow?.webContents.send('client-unregistered', fingerprint)
  })

  // Listen to receive file events
  serviceManager.on('receive-session-created', (session) => {
    logger.info('Receive session created:', session)
    // Forward to renderer process
    mainWindow?.webContents.send('receive-session-created', session)
  })

  serviceManager.on('receive-session-cancelled', (sessionId) => {
    logger.info('Receive session cancelled:', sessionId)
    // Forward to renderer process
    mainWindow?.webContents.send('receive-session-cancelled', sessionId)
  })

  serviceManager.on('receive-file-uploaded', (sessionId, fileId) => {
    logger.info('Receive file uploaded:', sessionId, fileId)
    // Forward to renderer process
    mainWindow?.webContents.send('receive-file-uploaded', sessionId, fileId)
  })
}
