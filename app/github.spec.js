const { expect } = require("chai")
const sinon = require("sinon")
const GitHubHooks = require("./github")
const supertest = require("supertest")
const crypto = require("crypto")

const Helper = {
  xHubSignature(secret, payload) {
    const hmac = crypto.createHmac('sha1', secret)
    const digest = Buffer.from('sha1=' + hmac.update(JSON.stringify(payload)).digest('hex'), 'utf8')
    return digest.toString()
  }
}

describe("GitHubHooks", () => {
  describe("#init", () => {
    it("starts a webserver", async () => {
      const app = GitHubHooks.init()
      const request = supertest(app)

      const { status: status } = await request.get("/")
      expect(status).to.eql(200)
    })

    it("is a singleton")
  })

  describe("#register", () => {
    const sandbox = sinon.sandbox.create()
    const issueOpenedPayload = require("../fixtures/github/issue_opened.json")

    afterEach(() => {
      sandbox.restore()
    })

    it("opens a http callback path", async () => {
      const spy = {
        callback(event, payload) {
          expect(event).to.be.eql("issues")
          expect(payload).to.have.property("action", "opened")
          expect(payload).to.have.nested.property("issue.title", "test title")
          expect(payload).to.have.nested.property("issue.body", "test comment")
          expect(payload).to.have.nested.property("issue.url")
        }
      }
      sinon.spy(spy, "callback")

      const app = GitHubHooks.init()

      GitHubHooks.register("/test-endpoint", "secret", spy.callback)

      const request = supertest(app)

      const { status: status } = await request.post("/test-endpoint")
        .set("X-Hub-Signature", Helper.xHubSignature("secret", issueOpenedPayload))
        .set("X-GitHub-Event", "issues")
        .set("X-GitHub-Delivery", "xxx")
        .send(issueOpenedPayload)

      expect(spy.callback.called).to.be.true
      expect(status).to.eql(200)
    })
  })
})