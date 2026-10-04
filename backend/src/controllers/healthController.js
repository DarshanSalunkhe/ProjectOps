import { testConnection } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const healthCheck = asyncHandler(async (req, res) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    success: true,
    message: 'ProjectOps API is running',
    api: 'healthy',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

export const getApiInfo = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'ProjectOps API',
      version: '1.0.0',
      description: 'Autonomous Multi-Agent Project Execution and Risk Management System',
      endpoints: {
        health: '/api/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          me: 'GET /api/auth/me'
        },
        projects: {
          list: 'GET /api/projects',
          create: 'POST /api/projects',
          get: 'GET /api/projects/:id',
          update: 'PATCH /api/projects/:id',
          delete: 'DELETE /api/projects/:id'
        },
        tasks: {
          list: 'GET /api/projects/:projectId/tasks',
          create: 'POST /api/projects/:projectId/tasks',
          get: 'GET /api/tasks/:id',
          update: 'PATCH /api/tasks/:id',
          delete: 'DELETE /api/tasks/:id'
        },
        dependencies: {
          list: 'GET /api/tasks/:taskId/dependencies',
          create: 'POST /api/tasks/:taskId/dependencies',
          delete: 'DELETE /api/tasks/:taskId/dependencies/:dependencyId'
        }
      }
    }
  });
});
