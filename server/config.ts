/**
 * Central configuration for PapierKraken environment settings
 */

// Environment-specific configuration
export const config = {
  // General environment settings
  environment: process.env.ENVIRONMENT || 'dev',
  isDevelopment: process.env.ENVIRONMENT === 'dev',
  isTesting: process.env.ENVIRONMENT === 'test',
  isProduction: process.env.ENVIRONMENT === 'prod',
  
  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL,
    name: process.env.DB_NAME || 'papierkraken_dev',
  },
  
  // S3 Storage configuration
  storage: {
    bucket: process.env.S3_BUCKET || 'papierkraken-docs-eu',
    region: process.env.AWS_REGION || 'eu-central-1',
    prefix: process.env.S3_PREFIX || `users/${process.env.ENVIRONMENT || 'dev'}/`,
    kmsKeyArn: process.env.KMS_KEY_ARN,
    urlExpiry: 5 * 60, // 5 minutes in seconds
    maxFileSize: 50 * 1024 * 1024, // 50 MB
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'papierkraken-secret-key',
    jwtExpiry: '7d',
    oauthRedirectUrl: process.env.OAUTH_REDIRECT || `https://dev.papierkrake.de/auth/callback`,
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  
  // Application URLs
  urls: {
    baseUrl: process.env.BASE_URL || `https://${process.env.ENVIRONMENT || 'dev'}.papierkrake.de`,
  },
};

export default config;