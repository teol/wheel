import Fastify from 'fastify';
import { db } from './db/db';
import { logger } from './utils/logger';

const fastify = Fastify({
  loggerInstance: logger,
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
