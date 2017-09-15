const { expect } = require("chai")
const request = require("request-promise-native")
const kanbanery = require("./kanbanery_feed")
const sinon = require("sinon")
const fs = require("fs")
const moment = require("moment")
const tk = require("timekeeper")

const URL_WITH_NO_ACTIVITIES = "URL_WITH_NO_ACTIVITIES"
const URL_WITH_ACTIVITIES = "URL_WITH_ACTIVITIES"

describe("kanbanery_feed", () => {

  describe("#fetch", () => {
    let request_get_stub

    before(() => {
      tk.travel(new Date("2017-09-04"))
      request_get_stub = sinon.stub(request, "get")
      request_get_stub.withArgs(URL_WITH_ACTIVITIES).returns(fs.readFileSync("./fixtures/kanbanery/new_activity"))
      request_get_stub.withArgs(URL_WITH_NO_ACTIVITIES).returns(fs.readFileSync("./fixtures/kanbanery/no_new_activity"))
    })

    after(() => {
      tk.reset()
    })

    after(() => {
      request_get_stub.restore()
    })

    beforeEach(() => {
      kanbanery.store.cache = []
    })

    it("is a function", () => {
      expect(kanbanery.fetch).to.be.a("function")
    })

    it("returns an array", async () => {
      const result = await kanbanery.fetch(URL_WITH_ACTIVITIES)
      expect(result).to.be.an("array")
    })

    it("fetches kanbanery feed", async () => {
      await kanbanery.fetch(URL_WITH_ACTIVITIES)

      expect(request_get_stub.called).to.be.true
    })

    it("fetches only feeds from today", async () => {
      const result = await kanbanery.fetch(URL_WITH_ACTIVITIES)
      expect(result).to.have.length(1)
    })

    it("should ignore entries from previous dates", async () => {
      const result = await kanbanery.fetch(URL_WITH_NO_ACTIVITIES)
      expect(result).to.have.length(0)
    })

  })

  describe("#summary", () => {
    const column_id = 12345
    const host = "test.kanbanery.com"
    const kanbanery_api_key = "abc123"
    const sandbox = sinon.sandbox.create()

    const kanbanery_column_tasks = fs.readFileSync("./fixtures/kanbanery/column_tasks.json")
    const kanbanery_column_tasks_json = JSON.parse(kanbanery_column_tasks)

    beforeEach(() => {
      tk.travel(new Date("2017-09-04"))
      sandbox.stub(request, "get").returns(new Promise(res => res(kanbanery_column_tasks)))
    })

    afterEach(() => {
      sandbox.restore()
      tk.reset()
    })

    it("is a function", () => {
      expect(kanbanery.summary).to.be.a("function")
    })

    it("requires host and column id", async () => {
      try {
        await kanbanery.summary()
      } catch (e) {
        expect(e).to.match(/missing.*host.*column_id.*api_token.*param/i)
      }

      try {
        await kanbanery.summary(host)
      } catch (e) {
        expect(e).to.match(/missing.*column_id.*api_token.*param/i)
      }

      try {
        await kanbanery.summary(host, column_id)
      } catch (e) {
        expect(e).to.match(/missing.*api_token.*param/i)
      }

      try {
        await kanbanery.summary(host, column_id, kanbanery_api_key)
      } catch (e) {
        expect(e).to.match(/missing.*api_token.*param/i)
      }

      expect(async () => {
        await kanbanery.summary(host, column_id, kanbanery_api_key)
      }).to.not.throw(Error)
    })

    it("returns a summary as string", async () => {
      tk.travel(new Date("2016-02-01"))
      const expected_summary = "Summary for January/2016\nTickets done: 20\n - " + kanbanery_column_tasks_json.map(t => t.title).join("\n - ")
        + "\n\nPlease archive the tickets now to keep the next summary as accurate as possible."

      expect(await kanbanery.summary(host, column_id, kanbanery_api_key)).to.be.a("string").that.is.equal(expected_summary)
    })

    it("requests kanbanery api", async () => {
      await kanbanery.summary(host, column_id, kanbanery_api_key)

      expect(request.get.calledOnce).to.be.true
      expect(request.get.getCall(0).args).to.have.members([`https://${host}/api/v1/columns/${column_id}/tasks.json?api_token=${kanbanery_api_key}`])
    })

    it("archives automatically after summary")

  })

})
