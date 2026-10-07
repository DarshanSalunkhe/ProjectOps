import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../../.env.local')
});

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Google OAuth Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  // SMTP Configuration (optional)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@projectops.local'
  }
};

// Validate critical configuration
const validateConfig = () => {
  const errors = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (config.env === 'production' && config.jwt.secret === 'development-secret-change-in-production') {
    errors.push('JWT_SECRET must be set in production');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (config.env === 'production') {
      process.exit(1);
    }
  }
};

validateConfig();

export default config;
