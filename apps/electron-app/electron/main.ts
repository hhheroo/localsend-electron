import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import log from 'electron-log'
import { registerIPCHandlers } from './ipc-handlers'
import { registerServiceEvents, setMainWindow } from './service-events'
import { serviceManager } from './service-manager'

// Configure electron-log
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

const logger = log.scope('Main')

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Register all handlers
registerIPCHandlers()
registerServiceEvents()

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Set main window reference for event forwarding
  setMainWindow(win)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit app when all windows are closed
app.on('window-all-closed', () => {
  win = null
  setMainWindow(null)
  app.quit()
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Close service before app quits
app.on('before-quit', async (event) => {
  if (serviceManager.getStatus()) {
    event.preventDefault()
    try {
      await serviceManager.shutdown()
    } catch (error) {
      logger.error('Error shutting down service:', error)
    }
    app.quit()
  }
})

app.whenReady().then(async () => {
  logger.info('App ready, starting LocalSend service...')
  
  // Start LocalSend service first
  try {
    await serviceManager.startService()
    logger.info('LocalSend service started successfully')
  } catch (error) {
    logger.error('Failed to start LocalSend service:', error)
  }

  // Create window after service starts
  logger.info('Creating window...')
  createWindow()
})
