module.exports = {
  apps: [{
    name: 'tmslist',
    script: 'dist/server/entry.mjs',
    cwd: '/opt/tmslist',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: '4321',
    },
    env_production: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: '4321',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
  }],
};
