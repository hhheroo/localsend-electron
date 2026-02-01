import { createSocket, type Socket } from 'node:dgram';

import {
  DEFAULT_DISCOVERY_MULTICAST_ADDRESS,
  DEFAULT_DISCOVERY_MULTICAST_PORT
} from '../consts/discovery';
import type { Announcement } from '@localsend/common/type';
import { logger } from '../manager/logger';
import { AbstractDiscovery } from './abstract';

export class MulticastDiscovery extends AbstractDiscovery {
  private socket: Socket;

  constructor() {
    super();
    this.socket = createSocket({ type: 'udp4', reuseAddr: true });
  }

  async stop() {
    const { promise, resolve } = Promise.withResolvers<void>();
    this.socket.dropMembership(DEFAULT_DISCOVERY_MULTICAST_ADDRESS);
    this.socket.close(() => resolve());
    await promise;
    this.isListening = false;
  }

  async listen() {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    this.socket.on('message', (msg, rinfo) => {
      const message = msg.toString();
      logger.log('received announcement', message);
      this.handleMessage(message, {
        address: rinfo.address,
        port: rinfo.port
      });
    });

    this.socket.on('listening', () => {
      this.isListening = true;
      logger.log('multicast discovery started');
    });

    this.socket.on('error', err => {
      logger.error('multicast discovery error', err);
      reject(err);
    });

    this.socket.bind(DEFAULT_DISCOVERY_MULTICAST_PORT, () => {
      this.socket.addMembership(DEFAULT_DISCOVERY_MULTICAST_ADDRESS);
      this.socket.setMulticastTTL(128);
      this.socket.setMulticastLoopback(false);
      logger.log('multicast discovery bound');
      resolve();
    });

    return promise;
  }

  async broadcast(data: Announcement, times = 3): Promise<boolean> {
    const message = Buffer.from(JSON.stringify(data));
    let success = false;

    for (let i = 0; i < times; i++) {
      const { promise, resolve } = Promise.withResolvers<boolean>();

      logger.log('broadcast announcement', data);

      this.socket.send(
        message,
        DEFAULT_DISCOVERY_MULTICAST_PORT,
        DEFAULT_DISCOVERY_MULTICAST_ADDRESS,
        err => {
          if (err) {
            logger.warn('failed to broadcast announcement', err);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );

      const result = await promise;

      if (result) {
        success = true;
      }
    }

    return success;
  }
}
