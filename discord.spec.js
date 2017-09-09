const { expect } = require("chai")
const Holiday = require("./holidays")
const DiscordWrapper = require("./discord")
const request = require("request-promise-native")
const sinon = require("sinon")

describe.only("DiscordWrapper", () => {
  const sandbox = sinon.sandbox.create()

  beforeEach(() => {
  })

  afterEach(() => {
    sandbox.restore()
  })

  it("is a function", () => {
    expect(DiscordWrapper).to.be.a("function")
  })

  describe("#commands", () => {
  
    it("registers commands")

  })

})
