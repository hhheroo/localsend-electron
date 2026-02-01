/**
 * LocalSend Service Worker
 * Runs LocalSendService in a separate process
 */
import { LocalSendService } from '@localsend/protocol-service';

type Logger = Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>;

// IPC message types
type IPCMessage =
  | {
      type: 'start';
      data: { dataDir: string; configDir: string };
      requestId: string;
    }
  | { type: 'stop'; requestId: string }
  | { type: 'get-status'; requestId: string }
  | { type: 'get-device-info'; requestId: string }
  | { type: 'get-clients'; requestId: string }
  | { type: 'discover'; requestId: string }
  | {
      type: 'send-prepare-upload';
      data: {
        fingerprint: string;
        filesMetadata: { path: string; text: boolean }[];
      };
      requestId: string;
    }
  | {
      type: 'send-upload';
      data: { fingerprint: string; sessionId: string; fileId: string };
      requestId: string;
    }
  | {
      type: 'send-cancel';
      data: { fingerprint: string; sessionId: string };
      requestId: string;
    };

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

let service: LocalSendService | null = null;

// Create IPC Logger that sends logs to main process
const createIPCLogger = (): Logger => ({
  log: (...args: unknown[]) => sendToMain({ type: 'log', level: 'log', args }),
  info: (...args: unknown[]) =>
    sendToMain({ type: 'log', level: 'info', args }),
  warn: (...args: unknown[]) =>
    sendToMain({ type: 'log', level: 'warn', args }),
  error: (...args: unknown[]) =>
    sendToMain({ type: 'log', level: 'error', args }),
  debug: (...args: unknown[]) =>
    sendToMain({ type: 'log', level: 'debug', args })
});

// Send message to main process
function sendToMain(message: IPCResponse) {
  if (process.send) {
    process.send(message);
  }
}

// Setup event listeners
function setupEventListeners() {
  if (!service) return;

  const { clientManager, sessionManager } = service;

  // Listen to client registered event
  clientManager.on('client-registered', (client: unknown) => {
    sendToMain({ type: 'client-registered', data: client });
  });

  // Listen to client unregistered event
  clientManager.on('client-unregistered', (fingerprint: string) => {
    sendToMain({ type: 'client-unregistered', fingerprint });
  });

  // Listen to receive session created event
  sessionManager.on('session-created', (session: unknown) => {
    sendToMain({ type: 'receive-session-created', data: session });
  });

  // Listen to receive session cancelled event
  sessionManager.on('session-removed', (sessionId: string) => {
    sendToMain({ type: 'receive-session-cancelled', sessionId });
  });

  // Listen to file upload complete event
  sessionManager.on('file-uploaded', (sessionId: string, fileId: string) => {
    sendToMain({ type: 'receive-file-uploaded', sessionId, fileId });
  });
}

// Cleanup event listeners
function cleanupEventListeners() {
  if (!service) return;
  service.clientManager.removeAllListeners();
  service.sessionManager.removeAllListeners();
}

// Handle messages from main process
async function handleMessage(message: IPCMessage) {
  const { requestId } = message;

  try {
    switch (message.type) {
      case 'start': {
        if (service) {
          sendToMain({
            type: 'error',
            message: 'Service already running',
            requestId
          });
          return;
        }

        service = new LocalSendService({
          dataDir: message.data.dataDir,
          configDir: message.data.configDir,
          logger: createIPCLogger()
        });

        await service.start();

        // Setup event listeners
        setupEventListeners();

        sendToMain({ type: 'started', requestId });
        break;
      }

      case 'stop': {
        if (service) {
          // Cleanup event listeners
          cleanupEventListeners();
          // 10 second timeout for force exit
          const timeout = setTimeout(() => {
            sendToMain({ type: 'stopped', requestId });
            sendToMain({
              type: 'log',
              level: 'warn',
              args: ['Stop timeout, force exit']
            });
            process.exit(1);
          }, 10000);
          try {
            await service.stop();
          } finally {
            clearTimeout(timeout);
          }
        }
        sendToMain({ type: 'stopped', requestId });
        break;
      }

      case 'get-status': {
        sendToMain({ type: 'status', running: service !== null, requestId });
        break;
      }

      case 'get-device-info': {
        if (service) {
          const deviceInfo = service.configManager.deviceInfo;
          sendToMain({ type: 'device-info', data: deviceInfo, requestId });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      case 'get-clients': {
        if (service) {
          const clients = service.clientManager.getClients();
          sendToMain({
            type: 'log',
            level: 'debug',
            args: ['getClients:', JSON.stringify(clients, null, 2)]
          });

          sendToMain({ type: 'clients', data: clients, requestId });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      case 'discover': {
        if (service) {
          await service.discover();
          sendToMain({ type: 'discovered', requestId });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      case 'send-prepare-upload': {
        if (service) {
          const { fingerprint, filesMetadata } = message.data;
          const result = await service.client.sendPrepareUpload(
            fingerprint,
            filesMetadata
          );
          sendToMain({
            type: 'prepare-upload-result',
            data: result,
            requestId
          });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      case 'send-upload': {
        if (service) {
          const { fingerprint, sessionId, fileId } = message.data;
          const result = await service.client.sendUpload(
            fingerprint,
            sessionId,
            fileId
          );
          sendToMain({ type: 'upload-result', data: result, requestId });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      case 'send-cancel': {
        if (service) {
          const { fingerprint, sessionId } = message.data;
          const result = await service.client.sendCancel(
            fingerprint,
            sessionId
          );
          sendToMain({ type: 'cancel-result', data: result, requestId });
        } else {
          sendToMain({
            type: 'error',
            message: 'Service not running',
            requestId
          });
        }
        break;
      }

      default:
        sendToMain({
          type: 'error',
          message: `Unknown message type`,
          requestId
        });
    }
  } catch (error) {
    sendToMain({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      requestId
    });
  }
}

// Listen to main process messages
process.on('message', handleMessage);

// Graceful shutdown with 10 second timeout
const gracefulShutdown = async () => {
  const timeout = setTimeout(() => {
    sendToMain({
      type: 'log',
      level: 'warn',
      args: ['Shutdown timeout, force exit']
    });
    process.exit(1);
  }, 10000);

  try {
    if (service) {
      cleanupEventListeners();
      await service.stop();
    }
  } finally {
    clearTimeout(timeout);
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Notify main process that worker is ready
sendToMain({ type: 'ready' });
