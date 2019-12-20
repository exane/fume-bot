module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "Fume-bot-staging",
      script: "index.js",
      exec_interpreter: "node@8.11.1",
      env_production: {
        NODE_ENV: "production"
      }
    },
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    staging: {
      user: "exane",
      host: [{
        host: "exane.cf"
      }],
      ref: "origin/staging",
      repo: "https://github.com/exane/fume-bot.git",
      path: "/home/exane/fume-bot-staging",
      "post-deploy": "yarn --prod; pm2 startOrRestart ecosystem.config.js --env production"
    },
    production: {
      user: "exane",
      host: [{
        host: "exane.cf"
      }],
      ref: "origin/master",
      repo: "https://github.com/exane/fume-bot.git",
      path: "/home/exane/fume-bot",
      "post-deploy": "yarn --prod; pm2 startOrRestart ecosystem.config.js --env production"
    }
  }
}
