const { expect } = require("chai")
const request = require("request-promise-native")
const kanbanery = require("./kanbanery_feed")
const sinon = require("sinon")

const replayer = require("replayer")
replayer.substitute("<HOST>", () => { return process.env.KANBANERY_HOST })
replayer.substitute("<KANBANERY_API_KEY>", () => { return process.env.KANBANERY_API_KEY })

const URL = `${process.env.KANBANERY_BOARD_URL}?key=${process.env.KANBANERY_API_KEY}`
const URL_WITH_NO_ACTIVITIES_TODAY = URL + "&1"
const URL_WITH_ACTIVITIES = URL + "&2"

describe("kanbanery_feed", () => {

  describe("#fetch", () => {

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
      sinon.spy(request, "get")

      await kanbanery.fetch(URL_WITH_ACTIVITIES)

      expect(request.get.called).to.be.true
    })

    it("fetches only feeds from today", async () => {
      const result = await kanbanery.fetch(URL_WITH_ACTIVITIES)
      expect(result).to.have.length(1)
    })

    it("should ignore entries from previous dates", async () => {
      const result = await kanbanery.fetch(URL_WITH_NO_ACTIVITIES_TODAY)
      expect(result).to.have.length(0)
    })

  })

})
