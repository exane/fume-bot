const { expect } = require("chai")
const DiscordWrapper = require("./discord")
const sinon = require("sinon")

describe("DiscordWrapper", () => {
  const sandbox = sinon.sandbox.create()

  beforeEach(() => {
  })

  afterEach(() => {
    sandbox.restore()
  })

  it("is a function", () => {
    expect(DiscordWrapper).to.be.a("function")
  })

  it("requires discord_client as param", () => {
    expect(() => new DiscordWrapper()).to.throw(Error, /missing.*discord_client.*param/i)
    const discord = new DiscordWrapper({test: "123"})
    expect(discord).to.have.property("client").that.has.property("test", "123")
  })

  describe("#send", () => {
    let discord, client, find

    beforeEach(() => {

      find = {
        send: () => new Promise(res => res("done"))
      }

      client = {
        channels: {
          find: () => find
        }
      }

      sandbox.spy(client.channels, "find")
      sandbox.spy(find, "send")
      discord = new DiscordWrapper(client)
    })

    it("is a function", () => {
      expect(discord.send).to.be.a("function")
    })

    it("sends a message to a channel", async () => {
      const channel = "channel_name"
      const message = "test123"

      const result = await discord.send(channel, message)
      expect(result).to.eq("done")

      expect(client.channels.find.getCall(0).args).to.have.members(["name", channel])
      expect(find.send.getCall(0).args).to.have.members([message])
    })

  })

  describe("#listenTo", () => {
    let discord, client, message_interface

    beforeEach(() => {
      client = {}
      client.on = () => {}
      message_interface = {
        content: "",
        author: {
          bot: false
        },
        channel: {
          // send() { return new Promise(res => res()) }
        }
      }

      discord = new DiscordWrapper(client)
      sandbox.spy(discord, "listenTo")
      sandbox.spy(client, "on")
    })

    it("is a function", () => {
      expect(discord.listenTo).to.be.a("function")
    })

    it("starts listening to channel messages", () => {
      expect(client.on.callCount).to.eq(0)

      let test_called = false
      discord.listenTo("test", () => test_called = true)
      expect(client.on.calledOnce).to.be.true

      let test2_called = false
      discord.listenTo("test2", () => test2_called = true)
      expect(client.on.calledOnce).to.be.true

      expect(client.on.getCall(0).args).to.include.members(["message"])
      expect(test_called).to.be.false
      expect(test2_called).to.be.false

      const [,triggerOnMessageReceive] = client.on.getCall(0).args

      message_interface.content = "test"
      triggerOnMessageReceive(message_interface)

      expect(test_called).to.be.true
      expect(test2_called).to.be.false

      message_interface.content = "test2"
      triggerOnMessageReceive(message_interface)
      expect(test2_called).to.be.true
    })

    it("uses regex pattern to compare messages", () => {
      let test_called = false
      discord.listenTo(/^bot, .*holidays/, () => test_called = true)

      const [,triggerOnMessageReceive] = client.on.getCall(0).args

      message_interface.content = "test"
      triggerOnMessageReceive(message_interface)
      expect(test_called).to.be.false

      message_interface.content = "bot,"
      triggerOnMessageReceive(message_interface)
      expect(test_called).to.be.false

      message_interface.content = "bot, holidays"
      triggerOnMessageReceive(message_interface)
      expect(test_called).to.be.true
      test_called = false

      message_interface.content = "bot, when are the next holidays?"
      triggerOnMessageReceive(message_interface)
      expect(test_called).to.be.true
      test_called = false
    })

  })

})
