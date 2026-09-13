const pino = require('pino');
const { AsyncLocalStorage } = require('node:async_hooks');

const asyncStore = new AsyncLocalStorage();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  base: { service: 'fairwork-api' },
  mixin() {
    const store = asyncStore.getStore();
    return store ? { requestId: store.requestId, userId: store.userId } : {};
  },
});

module.exports = { logger, asyncStore };
