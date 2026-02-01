import '@localsend/common/globals';
import path from 'node:path';
import { ConfigManager, configManager } from './manager/config';
import { createServer } from './server';
import { Discovery } from './discovery';
import { loggerManager, type Logger } from './manager/logger';
import { ClientManager, clientManager } from './manager/client';
import { SessionManager, sessionManager } from './manager/session';
import { Client } from './client';

export type LocalSendServiceOptions = {
  dataDir?: string;
  configDir?: string;
  logger?: Logger;
  quickSave?: boolean;
};

export class LocalSendService {
  private server: ReturnType<typeof createServer> | null = null;
  private discovery: Discovery | null = null;

  readonly configManager: ConfigManager = configManager;
  readonly clientManager: ClientManager = clientManager;
  readonly sessionManager: SessionManager = sessionManager;
  readonly client: Client = new Client();

  constructor(private options: LocalSendServiceOptions) {}

  async start() {
    this.server = createServer();
    this.discovery = new Discovery();

    configManager.configDir = this.options.configDir || '';
    configManager.saveDir = this.options.dataDir || path.resolve();
    configManager.init();

    loggerManager.setLogger(this.options.logger || console);

    await this.server.serve();
    await this.discovery.listen();

    this.discovery.on(
      'announcement',
      clientManager.subscribeAnnouncement.bind(clientManager)
    );

    await this.discover();
  }

  async discover() {
    clientManager.clearClients();

    return this.discovery!.broadcast({
      ...configManager.deviceInfo,
      announcement: true,
      announce: true
    });
  }

  async stop() {
    await this.server?.close();
    await this.discovery?.stop();
    this.discovery?.removeAllListeners();
    this.server = null;
    this.discovery = null;
  }
}
