import type { Announcement } from '@localsend/common/type';
import {
  generateSelfSignedCertificate,
  makeAlias
} from '@localsend/common/utils';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_DISCOVERY_MULTICAST_PORT,
  PROTOCOL_VERSION
} from '../consts/discovery';
import { logger } from './logger';

export class ConfigManager {
  saveDir: string = '';
  configDir: string = '';

  deviceInfo!: Announcement;
  certificate!: ReturnType<typeof generateSelfSignedCertificate>;

  initDeviceInfo() {
    const certificate = generateSelfSignedCertificate();

    this.certificate = certificate;

    this.deviceInfo = {
      alias: makeAlias(),
      version: PROTOCOL_VERSION,
      deviceModel: process.platform === 'darwin' ? 'macOS' : process.platform,
      deviceType: 'desktop',
      fingerprint: certificate.hash,
      port: DEFAULT_DISCOVERY_MULTICAST_PORT,
      protocol: 'https',
      download: false
    };
  }

  loadDeviceInfoFromConfig() {
    try {
      const config = fs.readFileSync(
        path.join(this.configDir || this.saveDir, '.config.json'),
        'utf8'
      );
      const { deviceInfo, certificate } = JSON.parse(config);

      this.deviceInfo = deviceInfo;
      this.certificate = certificate;
    } catch (error) {
      logger.warn('Failed to load device info from config', error);
    }
  }

  writeDeviceInfoToConfig() {
    fs.writeFileSync(
      path.join(this.configDir || this.saveDir, '.config.json'),
      JSON.stringify(
        { deviceInfo: this.deviceInfo, certificate: this.certificate },
        null,
        2
      )
    );
  }

  init() {
    this.loadDeviceInfoFromConfig();

    if (!this.deviceInfo) {
      this.initDeviceInfo();
      this.writeDeviceInfoToConfig();
    }
  }
}

export const configManager = new ConfigManager();
