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
      "post-deploy": "\
        yarn --prod; \
        pm2 startOrRestart ecosystem.config.js --env production > /dev/null;\
        gpg2 --quiet --batch --yes --decrypt --passphrase-file ../shared/encryption_secret --output .env .env.live.gpg;\
        "
    }
  }
}
