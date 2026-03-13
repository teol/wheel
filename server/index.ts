import Fastify, { type FastifyServerOptions } from 'fastify';
import { db } from './db';

const envToLogger: Record<string, FastifyServerOptions['logger']> = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};

const fastify = Fastify({
  logger: envToLogger[process.env.NODE_ENV === 'production' ? 'production' : 'development'],
});

fastify.get('/api/health', async () => {
  return { status: 'ok', db: !!db };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();