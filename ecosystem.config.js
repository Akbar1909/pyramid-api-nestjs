module.exports = {
  apps: [
    {
      name: 'pyramid-api-nestjs',
      script: 'dist/main.js',
      cwd: '/var/www/pyramid-api-nestjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
