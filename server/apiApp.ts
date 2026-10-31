import express from 'express';
import { apiRouter } from './apiRouter.ts';

export const apiApp = express();

// Standard middleware
apiApp.use(express.json({ limit: '2mb' }));

// Mount the API router
apiApp.use('/api', apiRouter);
