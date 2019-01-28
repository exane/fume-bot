module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "Fume-bot",
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
    production: {
      user: "exane",
      host: [{
        host: "exane.cf"
      }],
      ref: "origin/master",
      repo: "https://github.com/exane/fume-bot.git",
      path: "/home/exane/fume-bot",
      "post-deploy": "ln -s /home/exane/fume-bot/shared/env /home/exane/fume-bot/current/.env;\
                      yarn --prod;\
                      pm2 startOrRestart ecosystem.config.js --env production"
    }
  }
}
