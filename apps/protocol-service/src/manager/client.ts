import type { Announcement } from '@localsend/common/type';
import { logger } from './logger';
import { configManager } from './config';
import type { DeviceInfo } from '../discovery/abstract';
import EventEmitter from 'node:events';

export class ClientManager extends EventEmitter {
  private clients: Map<string, Announcement & { address: string }> = new Map();

  clearClients() {
    this.clients.clear();
    this.emit('clients-cleared');
  }

  register(ip: string, announcement: Announcement) {
    const client = {
      ...announcement,
      address: ip
    };
    this.clients.set(announcement.fingerprint, client);
    this.emit('client-registered', client);
  }

  unregister(fingerprint: string) {
    this.clients.delete(fingerprint);
    this.emit('client-unregistered', fingerprint);
  }

  getClient(fingerprint: string) {
    return this.clients.get(fingerprint);
  }

  getClients() {
    return Array.from(this.clients.values());
  }

  async subscribeAnnouncement({
    from,
    data
  }: {
    from: DeviceInfo;
    data: Announcement;
  }) {
    if (data.fingerprint === configManager.deviceInfo.fingerprint) {
      return;
    }

    logger.log('send register request to', from.address, data.port);

    this.register(from.address, data);

    const text = await fetch(
      `${data.protocol}://${from.address}:${data.port}/api/localsend/v2/register`,
      {
        method: 'POST',
        body: JSON.stringify(configManager.deviceInfo)
      }
    ).then(res => {
      if (res.ok) {
        return res.text();
      }
      logger.error('failed to send register request', res.statusText);
    });

    logger.log('send register answer', text);
  }
}

export const clientManager = new ClientManager();
