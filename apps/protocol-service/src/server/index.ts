import { serve, type ServerType } from '@hono/node-server';
import { Context, Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import RoutePrepareUpload from './routes/prepare-upload';
import RouteUpload from './routes/upload';
import RouteCancel from './routes/cancel';
import RouteRegister from './routes/register';
import { DEFAULT_SERVER_PORT, ROUTER_BASE_URL } from '../consts/server';
import { logger } from '../manager/logger';
import { createServer as createSecureServer } from 'node:https';
import { configManager } from '../manager/config';

export function createServer() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const app = new Hono();
  const router = app.basePath(ROUTER_BASE_URL);

  app.use(
    honoLogger((msg, ...rest) => {
      logger.log(msg, ...rest);
    })
  );

  router.on(
    RoutePrepareUpload.method,
    RoutePrepareUpload.path,
    RoutePrepareUpload.handler
  );
  router.on(RouteUpload.method, RouteUpload.path, RouteUpload.handler);
  router.on(RouteCancel.method, RouteCancel.path, RouteCancel.handler);
  router.on(RouteRegister.method, RouteRegister.path, RouteRegister.handler);

  app.on('get', '/api/localsend/v1/info', (c: Context) => {
    return c.json(configManager.deviceInfo);
  });

  let server: ServerType | null = null;

  return {
    app,
    serve: () => {
      return new Promise(resolve => {
        server = serve(
          {
            fetch: app.fetch,
            hostname: '0.0.0.0',
            port: DEFAULT_SERVER_PORT,
            createServer: createSecureServer,
            serverOptions: {
              key: configManager.certificate.privateKey,
              cert: configManager.certificate.certificate
            }
          },
          info => {
            logger.log(
              `https server listening on ${info.address}:${info.port}`
            );
            resolve(true);
          }
        );
      });
    },
    close: async () => {
      const { promise, resolve } = Promise.withResolvers<void>();

      server?.close(err => {
        if (err) {
          logger.error('Failed to close server', err);
        }
        resolve();
      });
      await promise;
      server = null;
    }
  };
}
