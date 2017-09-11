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
  deploy : {
    staging : {
      user : "pi",
      host : "192.168.1.109",
      ref  : "origin/staging",
      repo : "https://github.com/exane/fume-bot.git",
      path : "/home/pi/fume-bot-staging",
      "post-deploy" : "source /home/pi/fume-bot-staging/shared/env && yarn; pm2 delete ecosystem.config.js --env production; pm2 start ecosystem.config.js --env production"
    },
    production : {
      user : "pi",
      host : "192.168.1.109",
      ref  : "origin/master",
      repo : "https://github.com/exane/fume-bot.git",
      path : "/home/pi/fume-bot-production",
      "post-deploy" : "source /home/pi/fume-bot-production/shared/env && yarn; pm2 delete ecosystem.config.js --env production; pm2 start ecosystem.config.js --env production"
    }
  }
}
