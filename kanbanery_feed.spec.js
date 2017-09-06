const { expect } = require("chai")
const request = require("request-promise-native")
const kanbanery = require("./kanbanery_feed")
const sinon = require("sinon")
const fs = require("fs")
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

})
