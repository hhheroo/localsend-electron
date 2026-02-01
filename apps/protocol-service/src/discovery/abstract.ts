import EventEmitter from 'node:events';
import type { Announcement } from '@localsend/common/type';
import { logger } from '../manager/logger';

export interface DeviceInfo {
  address: string;
  port: number;
}

export type DiscoveryEventMap = {
  announcement: [{ from: DeviceInfo; data: Announcement }];
};

export abstract class AbstractDiscovery extends EventEmitter<DiscoveryEventMap> {
  isListening = false;

  constructor() {
    super();
  }

  abstract listen(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract broadcast(data: Announcement): void;

  protected handleMessage(message: string, from: DeviceInfo): void {
    try {
      const data = JSON.parse(message) as Announcement;
      const isAnnounce = data.announcement || data.announce;

      logger.log('received message', data);

      if (isAnnounce) {
        this.emit('announcement', { from, data });
      }
    } catch {
      logger.warn('failed to parse announcement message', message);
      return;
    }
  }
}
