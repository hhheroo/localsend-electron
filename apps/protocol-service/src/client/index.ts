import { DEFAULT_SERVER_PORT } from '../consts/server';
import { clientManager, type ClientManager } from '../manager/client';
import { configManager } from '../manager/config';
import { logger } from '../manager/logger';
import { File } from './file';
import { Agent, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(
  new Agent({
    connect: {
      rejectUnauthorized: false
    },
    // Optimize connection pool and performance
    pipelining: 1,
    keepAliveTimeout: 60000,
    keepAliveMaxTimeout: 120000
  })
);

export class Client {
  manager: ClientManager = clientManager;
  sessions: Map<string, Array<{ file: File; token: string }>> = new Map();
  // Store AbortController for each session to cancel ongoing uploads
  abortControllers: Map<string, AbortController> = new Map();

  async sendPrepareUpload(
    fingerprint: string,
    filesMetadata: { path: string; text: boolean }[]
  ) {
    const client = this.manager.getClient(fingerprint);

    if (!client) {
      logger.warn('client not found', fingerprint);

      const isIp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(fingerprint);

      if (!isIp) {
        throw new Error('client not found');
      }

      logger.log('ip fingerprint', fingerprint);
    }

    const protocol = client ? client.protocol : 'https';
    const address = client ? client.address : fingerprint;
    const port = client ? client.port : DEFAULT_SERVER_PORT;

    const files: Record<string, File> = {};

    filesMetadata.forEach(({ path, text }) => {
      files[path] = new File(path, text);
    });

    const url = `${protocol}://${address}:${port}/api/localsend/v2/prepare-upload`;
    logger.info('Sending prepare-upload to:', url);

    const resp = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        info: configManager.deviceInfo,
        files
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      logger.warn(
        'failed to send prepare upload',
        resp.statusText,
        resp.status
      );

      return {
        success: false,
        error: resp.statusText,
        status: resp.status
      };
    }

    const body: { sessionId: string; files: Record<string, string> } =
      await resp.json();

    if (!body.sessionId) {
      logger.error('failed to send prepare upload', body);
      throw new Error('failed to send prepare upload');
    }

    this.sessions.set(
      body.sessionId,
      Object.values(files).map(file => {
        return {
          file,
          token: body.files[file.hash]!
        };
      })
    );

    // Create AbortController for this session
    this.abortControllers.set(body.sessionId, new AbortController());

    return {
      success: true,
      filesInfo: body
    };
  }

  async sendUpload(fingerprint: string, sessionId: string, fileId: string) {
    const client = this.manager.getClient(fingerprint);

    if (!client) {
      logger.warn('client not found', fingerprint);
      const isIp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(fingerprint);

      if (!isIp) {
        throw new Error('client not found');
      }

      logger.log('ip fingerprint', fingerprint);
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      logger.error('session not found', sessionId);
      throw new Error('session not found');
    }

    const fileInfo = session.find(f => f.file.hash === fileId);

    if (!fileInfo) {
      logger.error('fileInfo not found', fileId);
      throw new Error('fileInfo not found');
    }

    const protocol = client ? client.protocol : 'https';
    const address = client ? client.address : fingerprint;
    const port = client ? client.port : DEFAULT_SERVER_PORT;

    const url = new URL(
      `${protocol}://${address}:${port}/api/localsend/v2/upload`
    );

    url.searchParams.set('sessionId', sessionId);
    url.searchParams.set('fileId', fileId);
    url.searchParams.set('token', fileInfo.token);

    logger.info('Sending upload to:', url);

    // Get AbortController for this session
    const abortController = this.abortControllers.get(sessionId);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        body: fileInfo.file.toReadableStream() as unknown as BodyInit,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileInfo.file.size.toString()
        },
        // @ts-expect-error - duplex is required for streaming body in Node.js
        duplex: 'half',
        signal: abortController?.signal
      });

      if (!resp.ok) {
        logger.warn('failed to send upload', resp.statusText, resp.status);
        return {
          success: false,
          error: resp.statusText,
          status: resp.status
        };
      }

      return {
        success: true,
        status: resp.status
      };
    } catch (error) {
      // Check if aborted
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('Upload aborted for session:', sessionId);
        return {
          success: false,
          error: 'Upload cancelled',
          status: 0,
          cancelled: true
        };
      }
      throw error;
    }
  }

  async sendCancel(fingerprint: string, sessionId: string) {
    const abortController = this.abortControllers.get(sessionId);
    const client = this.manager.getClient(fingerprint);

    if (!client) {
      logger.warn('client not found', fingerprint);
      const isIp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(fingerprint);

      if (!isIp) {
        throw new Error('client not found');
      }

      logger.log('ip fingerprint', fingerprint);
    }

    const protocol = client ? client.protocol : 'https';
    const address = client ? client.address : fingerprint;
    const port = client ? client.port : DEFAULT_SERVER_PORT;

    const url = new URL(
      `${protocol}://${address}:${port}/api/localsend/v2/cancel`
    );
    url.searchParams.set('sessionId', sessionId);

    logger.info('Sending cancel to:', url.href);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (abortController) {
        logger.info('Aborting upload for session:', sessionId);
        abortController.abort();
        this.abortControllers.delete(sessionId);
      }

      // Clean up local session
      this.sessions.delete(sessionId);

      if (!resp.ok) {
        logger.warn('failed to send cancel', resp.statusText, resp.status);
        return {
          success: false,
          error: resp.statusText,
          status: resp.status
        };
      }

      return {
        success: true,
        status: resp.status
      };
    } catch (error) {
      // Clean up local session even if cancel request fails
      this.sessions.delete(sessionId);
      logger.warn('Error sending cancel request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0
      };
    }
  }
}
