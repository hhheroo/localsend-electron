import type { Context } from 'hono';
import { sessionManager } from '../../manager/session';

export default {
  path: '/cancel',
  method: 'post',
  handler: async (c: Context) => {
    const sessionId = c.req.query('sessionId');

    if (sessionId) {
      sessionManager.removeSession(sessionId);
    }

    return c.text('', 200);
  }
};
