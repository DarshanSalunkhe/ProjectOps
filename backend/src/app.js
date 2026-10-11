import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import passport, { configurePassport } from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import githubWebhookRoutes from './routes/githubWebhookRoutes.js';

const app = express();

// Configure Passport
configurePassport();

// Middleware
app.use(cors(config.cors));
// Raw bytes must be verified before the general JSON parser changes the body.
app.use('/api/github/webhook', githubWebhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(logger);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
