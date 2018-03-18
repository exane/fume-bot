module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : "Fume-bot",
      script    : "index.js",
      env_production : {
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
      user: "pi",
      host: [{
        host: "exane.cf",
        port: "60022"
      }],
      ref: "origin/master",
      repo: "https://github.com/exane/fume-bot.git",
      path: "/home/pi/fume-bot",
      "post-deploy": "source /home/pi/fume-bot/shared/env && yarn --prod; pm2 delete ecosystem.config.js --env production; pm2 start ecosystem.config.js --env production"
    }
  }
}
