/**
 * Central configuration for PapierKraken environment settings
 * 
 * Environment-specific configuration for dev, test, and prod environments:
 * - Development: dev.papierkrake.de
 * - Testing: test.papierkrake.de
 * - Production: papierkrake.de
 */

// Define environment type for type safety
type Environment = 'dev' | 'test' | 'prod';

// Detect the current environment from environment variables with type safety
const environment = (process.env.ENVIRONMENT || 'dev') as Environment;

// Environment-specific configuration mapping
const envConfig: Record<Environment, {
  dbName: string;
  s3Prefix: string;
  hostname: string;
  oauthRedirect: string;
}> = {
  dev: {
    dbName: process.env.DB_NAME || 'papierkraken_dev',
    s3Prefix: process.env.S3_PREFIX || 'users/dev/',
    hostname: 'dev.papierkrake.de',
    oauthRedirect: process.env.OAUTH_REDIRECT || 'https://dev.papierkrake.de/auth/callback',
  },
  test: {
    dbName: process.env.DB_NAME || 'papierkraken_test',
    s3Prefix: process.env.S3_PREFIX || 'users/test/',
    hostname: 'test.papierkrake.de',
    oauthRedirect: process.env.OAUTH_REDIRECT || 'https://test.papierkrake.de/auth/callback',
  },
  prod: {
    dbName: process.env.DB_NAME || 'papierkraken_prod',
    s3Prefix: process.env.S3_PREFIX || 'users/prod/',
    hostname: 'papierkrake.de',
    oauthRedirect: process.env.OAUTH_REDIRECT || 'https://papierkrake.de/auth/callback',
  }
};

// Select the configuration for the current environment
const currentEnvConfig = envConfig[environment];

// Log environment info
console.log(`Initializing PapierKraken in ${environment.toUpperCase()} environment`);
console.log(`- Hostname: ${currentEnvConfig.hostname}`);
console.log(`- Database: ${currentEnvConfig.dbName}`);
console.log(`- S3 Prefix: ${currentEnvConfig.s3Prefix}`);

// Combined configuration with environment-specific settings
export const config = {
  // General environment settings
  environment,
  isDevelopment: environment === 'dev',
  isTesting: environment === 'test',
  isProduction: environment === 'prod',
  
  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL,
    name: currentEnvConfig.dbName,
  },
  
  // S3 Storage configuration
  storage: {
    bucket: process.env.S3_BUCKET || 'papierkraken-docs-eu',
    region: process.env.AWS_REGION || 'eu-central-1',
    prefix: currentEnvConfig.s3Prefix,
    kmsKeyArn: process.env.KMS_KEY_ARN,
    urlExpiry: 5 * 60, // 5 minutes in seconds
    maxFileSize: 50 * 1024 * 1024, // 50 MB
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'papierkraken-secret-key',
    jwtExpiry: '7d',
    oauthRedirectUrl: currentEnvConfig.oauthRedirect,
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  
  // Application URLs
  urls: {
    baseUrl: `https://${currentEnvConfig.hostname}`,
    apiUrl: `https://${currentEnvConfig.hostname}/api`,
  },
  
  // AI configuration
  ai: {
    // Standard OpenAI
    openaiApiKey: process.env.OPENAI_API_KEY,
    
    // Azure OpenAI
    azureApiKey: process.env.AZURE_OPENAI_KEY,
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
    
    // Model configuration
    defaultModel: "gpt-4o",
    maxTokens: 1000,
    apiVersion: "2023-12-01-preview",
  },
};

export default config;