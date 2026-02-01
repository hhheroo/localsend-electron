/**
 * LocalSend Service Manager
 * Manages LocalSendService running in a separate process
 */
import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { app } from 'electron';
import { EventEmitter } from 'node:events';
import log from 'electron-log';
import os from 'node:os';

// Create scoped logger
const logger = log.scope('ServiceManager');

// IPC message types
type IPCMessage =
  | { type: 'start'; requestId: string; data?: unknown }
  | { type: 'stop'; requestId: string; data?: unknown }
  | { type: 'get-status'; requestId: string; data?: unknown }
  | { type: 'get-device-info'; requestId: string; data?: unknown }
  | { type: 'get-clients'; requestId: string; data?: unknown }
  | { type: 'discover'; requestId: string; data?: unknown }
  | { type: 'send-prepare-upload'; requestId: string; data?: unknown }
  | { type: 'send-upload'; requestId: string; data?: unknown }
  | { type: 'send-cancel'; requestId: string; data?: unknown };

type IPCResponse =
  | { type: 'started'; requestId: string }
  | { type: 'stopped'; requestId: string }
  | { type: 'status'; running: boolean; requestId: string }
  | { type: 'device-info'; data: unknown; requestId: string }
  | { type: 'clients'; data: unknown[]; requestId: string }
  | { type: 'discovered'; requestId: string }
  | { type: 'prepare-upload-result'; data: unknown; requestId: string }
  | { type: 'upload-result'; data: unknown; requestId: string }
  | { type: 'cancel-result'; data: unknown; requestId: string }
  | { type: 'error'; message: string; requestId?: string }
  | { type: 'log'; level: string; args: unknown[] }
  | { type: 'ready' }
  // Client events
  | { type: 'client-registered'; data: unknown }
  | { type: 'client-unregistered'; fingerprint: string }
  // Receive file events
  | { type: 'receive-session-created'; data: unknown }
  | { type: 'receive-session-cancelled'; sessionId: string }
  | { type: 'receive-file-uploaded'; sessionId: string; fileId: string };

export interface ServiceManagerEvents {
  log: (level: string, ...args: unknown[]) => void;
  started: () => void;
  stopped: () => void;
  error: (message: string) => void;
  'status-change': (running: boolean) => void;
  // Client events
  'client-registered': (client: unknown) => void;
  'client-unregistered': (fingerprint: string) => void;
  // Receive file events
  'receive-session-created': (session: unknown) => void;
  'receive-session-cancelled': (sessionId: string) => void;
  'receive-file-uploaded': (sessionId: string, fileId: string) => void;
}

// Generate unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class ServiceManager extends EventEmitter {
  private worker: ChildProcess | null = null;
  private isRunning = false;
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  constructor() {
    super();
  }

  /**
   * Start service worker process
   */
  async startWorker(): Promise<void> {
    if (this.worker) {
      logger.info('Worker already running');
      return;
    }

    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'service-worker.js');

      logger.info('Starting worker:', workerPath);

      this.worker = fork(workerPath, [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: process.env.NODE_ENV === 'development' ? ['--inspect'] : [],
        env: {
          ...process.env,
          NODE_TLS_REJECT_UNAUTHORIZED: '0'
        }
      });

      logger.info('Worker pid:', this.worker.pid);

      // Listen to worker stdout
      this.worker.stdout?.on('data', data => {
        logger.debug('[Worker stdout]', data.toString().trim());
      });

      this.worker.stderr?.on('data', data => {
        logger.error('[Worker stderr]', data.toString().trim());
      });

      const timeout = setTimeout(() => {
        reject(new Error('Worker startup timeout'));
      }, 10000);

      // Listen to worker messages
      this.worker.on('message', (message: IPCResponse) => {
        if (message.type === 'ready') {
          clearTimeout(timeout);
          resolve();
        }
        this.handleWorkerMessage(message);
      });

      // Listen to worker exit
      this.worker.on('exit', (code, signal) => {
        logger.warn(`Worker exited with code ${code}, signal ${signal}`);
        this.worker = null;
        this.isRunning = false;
        this.emit('status-change', false);
        // Reject all pending requests
        this.rejectAllPending(new Error('Worker exited'));
      });

      this.worker.on('error', error => {
        logger.error('Worker error:', error);
        this.emit('error', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPending(error: Error) {
    for (const [, pending] of this.pendingRequests) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(message: IPCResponse) {
    // Handle responses with requestId
    if ('requestId' in message && message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        this.pendingRequests.delete(message.requestId);

        if (message.type === 'error') {
          pending.reject(new Error(message.message));
        } else {
          pending.resolve(message);
        }
      }
    }

    switch (message.type) {
      case 'log':
        // Forward logs
        this.emit('log', message.level, ...message.args);
        this.printLog(message.level, message.args);
        break;

      case 'started':
        this.isRunning = true;
        this.emit('started');
        this.emit('status-change', true);
        break;

      case 'stopped':
        this.isRunning = false;
        this.emit('stopped');
        this.emit('status-change', false);
        break;

      case 'status':
        this.isRunning = message.running;
        this.emit('status-change', message.running);
        break;

      case 'error':
        if (!message.requestId) {
          // Non-request related error
          this.emit('error', message.message);
          logger.error('Error from worker:', message.message);
        }
        break;

      // Client events
      case 'client-registered':
        logger.info('Client registered:', message.data);
        this.emit('client-registered', message.data);
        break;

      case 'client-unregistered':
        logger.info('Client unregistered:', message.fingerprint);
        this.emit('client-unregistered', message.fingerprint);
        break;

      // Receive file events
      case 'receive-session-created':
        logger.info('Receive session created:', message.data);
        this.emit('receive-session-created', message.data);
        break;

      case 'receive-session-cancelled':
        logger.info('Receive session cancelled:', message.sessionId);
        this.emit('receive-session-cancelled', message.sessionId);
        break;

      case 'receive-file-uploaded':
        logger.info(
          'Receive file uploaded:',
          message.sessionId,
          message.fileId
        );
        this.emit('receive-file-uploaded', message.sessionId, message.fileId);
        break;
    }
  }

  /**
   * Print logs (from service worker)
   */
  private printLog(level: string, args: unknown[]) {
    const serviceLogger = log.scope('LocalSendService');
    switch (level) {
      case 'debug':
        serviceLogger.debug(...args);
        break;
      case 'info':
        serviceLogger.info(...args);
        break;
      case 'warn':
        serviceLogger.warn(...args);
        break;
      case 'error':
        serviceLogger.error(...args);
        break;
      default:
        serviceLogger.log(...args);
    }
  }

  /**
   * Send message to worker and wait for response (no timeout)
   */
  private sendRequest<T>(message: Omit<IPCMessage, 'requestId'>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not running'));
        return;
      }

      const requestId = generateRequestId();

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject
      });

      this.worker.send({ ...message, requestId });
    });
  }

  /**
   * Start LocalSend service
   */
  async startService(): Promise<void> {
    if (!this.worker) {
      await this.startWorker();
    }

    const userDataDir = app.getPath('userData');
    const downloadDir = os.homedir() + '/Downloads';
    logger.info(
      'Starting service with downloadDir:',
      downloadDir,
      'and userDataDir:',
      userDataDir
    );
    await this.sendRequest<{ type: 'start' }>({
      type: 'start',
      data: { dataDir: downloadDir, configDir: userDataDir }
    });
    logger.info('Service started successfully');
  }

  /**
   * Stop LocalSend service
   */
  async stopService(): Promise<void> {
    logger.info('Stopping service...');
    await this.sendRequest<{ type: 'stopped' }>({ type: 'stop' });
    logger.info('Service stopped');
  }

  /**
   * Get service status
   */
  getStatus(): boolean {
    return this.isRunning;
  }

  /**
   * Get service status asynchronously
   */
  async getStatusAsync(): Promise<boolean> {
    const response = await this.sendRequest<{
      type: 'status';
      running: boolean;
    }>({ type: 'get-status' });
    return response.running;
  }

  /**
   * Get device info
   */
  async getDeviceInfo(): Promise<unknown> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    const response = await this.sendRequest<{
      type: 'device-info';
      data: unknown;
    }>({ type: 'get-device-info' });
    return response.data;
  }

  /**
   * Get connected client list
   */
  async getClients(): Promise<unknown[]> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    const response = await this.sendRequest<{
      type: 'clients';
      data: unknown[];
    }>({ type: 'get-clients' });
    return response.data;
  }

  /**
   * Initiate device discovery
   */
  async discover(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    await this.sendRequest<{ type: 'discovered' }>({ type: 'discover' });
    logger.info('Discovery broadcast sent');
  }

  /**
   * Send prepare upload request
   */
  async sendPrepareUpload(
    fingerprint: string,
    filesMetadata: { path: string; text: boolean }[]
  ): Promise<unknown> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    const response = await this.sendRequest<{
      type: 'prepare-upload-result';
      data: unknown;
    }>({ type: 'send-prepare-upload', data: { fingerprint, filesMetadata } });
    logger.info('Prepare upload sent');
    return response.data;
  }

  /**
   * Send file upload request
   */
  async sendUpload(
    fingerprint: string,
    sessionId: string,
    fileId: string
  ): Promise<unknown> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    const response = await this.sendRequest<{
      type: 'upload-result';
      data: unknown;
    }>({ type: 'send-upload', data: { fingerprint, sessionId, fileId } });
    logger.info('Upload sent for file:', fileId);
    return response.data;
  }

  /**
   * Send cancel upload request
   */
  async sendCancel(fingerprint: string, sessionId: string): Promise<unknown> {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    const response = await this.sendRequest<{
      type: 'cancel-result';
      data: unknown;
    }>({ type: 'send-cancel', data: { fingerprint, sessionId } });
    logger.info('Cancel sent for session:', sessionId);
    return response.data;
  }

  /**
   * Shutdown worker process
   */
  async shutdown(): Promise<void> {
    if (this.worker) {
      try {
        if (this.isRunning) {
          await this.stopService();
        }
      } catch (e) {
        logger.warn('Error stopping service during shutdown:', e);
      }
      this.worker.kill('SIGTERM');
      this.worker = null;
      logger.info('Worker shutdown complete');
    }
  }
}

// Singleton
export const serviceManager = new ServiceManager();
