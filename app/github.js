const express = require("express")
// const createHandler = require('github-webhook-handler')
// const handler = createHandler({ path: "/test-endpoint", secret: "secret" })
const githubMiddleware = require('github-webhook-middleware')

let handlers = {}
let application = {}

module.exports = class GitHubHooks {
  static init() {
    handlers = {}

    const app = express()

    app.get("/", (req, res) => {
      res.end()
    })

    return application = app
  }

  static register(path, secret, callback) {
    if (!secret) return
    application.post(path, githubMiddleware({ secret }), (req, res) => {
      const event = req.headers["x-github-event"]
      callback(event, req.body)
      res.end()
    })
  }
}
