import pino from 'pino';

const envToLogger: Record<string, pino.LoggerOptions> = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: {},
  test: {
    level: 'silent',
  },
};

export const logger = pino(
  envToLogger[process.env.NODE_ENV === 'production' ? 'production' : 'development'] || {}
);
