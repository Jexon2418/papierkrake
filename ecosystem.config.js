module.exports = {
  apps: [
    {
      name: 'papierkrake-prod',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'papierkrake-test',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'test',
        PORT: 5001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'papierkrake-dev',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 5002,
      },
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', 'uploads'],
    },
  ],
};
