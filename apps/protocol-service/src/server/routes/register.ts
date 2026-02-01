import type { Announcement } from '@localsend/common/type';
import type { Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { clientManager } from '../../manager/client';
import { configManager } from '../../manager/config';
import { logger } from '../../manager/logger';

export type RegisterRequestBody = Announcement;

export default {
  path: '/register',
  method: 'post',
  handler: async (c: Context) => {
    const body = await c.req.json();
    const connInfo = getConnInfo(c);

    clientManager.register(connInfo.remote.address!, body);

    logger.log('http register device', configManager.deviceInfo);

    return c.json(configManager.deviceInfo);
  }
};
