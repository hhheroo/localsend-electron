import type { Context } from 'hono';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { ReadableStream } from 'node:stream/web';
import { sessionManager } from '../../manager/session';
import path from 'node:path';
import { configManager } from '../../manager/config';

export default {
  path: '/upload',
  method: 'post',
  handler: async (c: Context) => {
    const sessionId = c.req.query('sessionId');
    const fileId = c.req.query('fileId')!;
    const token = c.req.query('token');

    const session = sessionManager.getSession(sessionId);

    if (
      !session ||
      !session.fileTokens[fileId] ||
      session.fileTokens[fileId] !== token
    ) {
      return c.text('Invalid session or file id or token', 400);
    }

    if (!c.req.raw.body) {
      return c.text('No body', 400);
    }

    const file = session.req.files[fileId];

    if (!file) {
      return c.text('File not found', 400);
    }

    await pipeline(
      Readable.fromWeb(c.req.raw.body as ReadableStream<Uint8Array>),
      createWriteStream(path.join(configManager.saveDir, file.fileName))
    );

    // Mark file upload as complete
    sessionManager.markFileUploaded(sessionId!, fileId);

    return c.text('', 200);
  }
};
