import type { Context } from 'hono';
import type {
  PrepareUploadRequestBody,
  PrepareUploadResponseBody
} from './prepare-upload.type';
import { sessionManager } from '../../manager/session';

export default {
  path: '/prepare-upload',
  method: 'post',
  handler: async (c: Context) => {
    const body: PrepareUploadRequestBody = await c.req.json();
    const session = sessionManager.createSession(body);

    return c.json<PrepareUploadResponseBody>({
      sessionId: session.id,
      files: session.fileTokens
    });
  }
};
