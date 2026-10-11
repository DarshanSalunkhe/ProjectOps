import app from './src/app.js';
import config from './src/config/index.js';
import { testConnection } from './src/config/database.js';
import { startGithubWorker } from './src/services/githubEventService.js';

const startServer = async () => {
  try {
    // Test database connection
    const dbStatus = await testConnection();
    
    if (!dbStatus.connected) {
      console.error('⚠️  Warning: Database connection failed');
      console.error(`   Error: ${dbStatus.error}`);
      console.error('   The server will start but database operations will fail.');
      console.error('   Please check your DATABASE_URL configuration.\n');
    }

    // Start server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  🚀 ProjectOps API Server`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  Environment:  ${config.env}`);
      console.log(`  Port:         ${config.port}`);
      console.log(`  API URL:      http://localhost:${config.port}/api`);
      console.log(`  Health:       http://localhost:${config.port}/api/health`);
      console.log(`  Database:     ${dbStatus.connected ? '✓ Connected' : '✗ Disconnected'}`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });

    const stopGithubWorker = startGithubWorker();
    // Graceful shutdown
    const gracefulShutdown = () => {
      stopGithubWorker();
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
